import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import EmailGate from "../components/EmailGate";
import { generateBrand, isAIAvailable } from "../lib/ai";
import { mapGeneratedToBoard } from "../lib/synthesisMap";
import { register, getEmail } from "../lib/auth";
import { sendLeadToGHL } from "../lib/ghl";
import { track } from "../lib/track";
import { ARCHETYPES } from "../lib/archetypes";
import { computeGravityScore, gravityScoreColor } from "../lib/gravityScore";

const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const ACCENT_ICE = "#64D2FF";
const SANS = "'Inter', -apple-system, sans-serif";

const PANEL_BG = `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 45%), ${CHARCOAL}`;
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";

// Example prompts — each names a real category so the retrieval has something
// to match, and each reads like a founder actually talking.
const EXAMPLES = [
  "A premium electrolyte drink for endurance athletes who train before sunrise",
  "A no-nonsense bookkeeping service for solo trades — plumbers, electricians, roofers",
  "A calm, private journaling app that never sells your data or gamifies your feelings",
  "A direct-to-consumer mattress brand that competes on honesty, not foam gimmicks",
];

// The 31 Builder sections, grouped into the seven meters the preview shows as a
// live "board coverage" readout. Each meter lists the board fields that, when
// filled, mean that area of the brand has been decided.
const COVERAGE_GROUPS = [
  { label: "Identity", fields: ["brandName", "tagline", "mission", "vision", "elevator", "coreValues", "whyDifferent", "brandPromise"] },
  { label: "Positioning", fields: ["archetype", "secondaryArchetype", "enemy", "victim", "heroStatement", "competitivePositioning", "differentiators", "categoryOwnership", "antiPositioning"] },
  { label: "Voice", fields: ["toneAttributes", "messagingDos", "messagingDonts", "wordsAlways", "wordsNever", "languageRegister", "brandCommandments", "socialPersonality"] },
  { label: "Audience", fields: ["audienceRole", "audiencePains", "icps"] },
  { label: "Story", fields: ["storyGuide", "storyProblem", "storyPlan", "storySuccess", "brandStories", "contentPillars"] },
  { label: "Visual", fields: ["primaryColor", "primaryFont", "photoStyle", "logoDescription", "moodboardKeywords"] },
  { label: "Go-to-market", fields: ["offerCoreOffer", "proofHierarchy", "priceTier", "journeyAwareness", "contentCadenceInstagram"] },
];

function isFilled(v) {
  if (Array.isArray(v)) return v.some((x) => (x && typeof x === "object" ? Object.values(x).some((y) => String(y || "").trim()) : String(x || "").trim()));
  if (v && typeof v === "object") return Object.keys(v).length > 0;
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function coverageFor(board) {
  return COVERAGE_GROUPS.map((g) => {
    const done = g.fields.filter((f) => isFilled(board[f])).length;
    return { label: g.label, done, total: g.fields.length };
  });
}

// ── small presentational pieces ───────────────────────────────────────────

function CoverageBar({ done, total, label }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}>
        <span style={{ color: STARLIGHT, fontWeight: 600 }}>{label}</span>
        <span style={{ color: TITANIUM }}>{done}/{total}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: pct === 100 ? "#2ecc71" : ACCENT_BLUE, transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
    </div>
  );
}

function Bubble({ role, children }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14 }}>
      <div style={{
        maxWidth: "86%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.6,
        fontFamily: SANS, whiteSpace: "pre-wrap",
        background: isUser ? ACCENT_BLUE : "rgba(255,255,255,0.05)",
        color: isUser ? "#fff" : STARLIGHT,
        border: isUser ? "none" : PANEL_BORDER,
        borderBottomRightRadius: isUser ? 5 : 16,
        borderBottomLeftRadius: isUser ? 16 : 5,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── the live brand preview ─────────────────────────────────────────────────

function BrandPreview({ board, exemplars, changed }) {
  const gravity = board.brandName ? computeGravityScore(board) : null;
  const coverage = coverageFor(board);
  const filledTotal = coverage.reduce((s, g) => s + g.done, 0);
  const grandTotal = coverage.reduce((s, g) => s + g.total, 0);
  const archetypeMatch = board.archetype && ARCHETYPES.find((a) => a.name === board.archetype);
  const palette = [board.primaryColor, board.secondaryColor, board.accentColor].filter(Boolean);
  const tones = (board.toneAttributes || []).filter(Boolean).slice(0, 6);
  const changedSet = new Set(changed || []);
  const glow = (keys) => keys.some((k) => changedSet.has(k));

  if (!board.brandName) {
    return (
      <div style={{ textAlign: "center", padding: "60px 30px", color: TITANIUM }}>
        <div style={{ fontSize: 40, marginBottom: 18, opacity: 0.5 }}>◈</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: STARLIGHT, marginBottom: 8 }}>Your brand appears here</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
          Describe what you're building. A senior strategist decides the archetype, the
          enemy, the palette, the voice, and your first three customers — then it all
          lands in one board.
        </div>
      </div>
    );
  }

  const flash = (on) => on ? { boxShadow: `0 0 0 1px ${ACCENT_ICE}55`, transition: "box-shadow 0.5s" } : { transition: "box-shadow 0.5s" };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22, ...flash(glow(["brandName", "tagline"])), borderRadius: 14, padding: "6px 4px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT_ICE, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Your starter brand</div>
        <div style={{ fontWeight: 700, fontSize: "clamp(26px, 4vw, 38px)", letterSpacing: "-1.2px", lineHeight: 1.05 }}>{board.brandName}</div>
        {board.tagline && <div style={{ fontSize: 14.5, color: TITANIUM, fontStyle: "italic", marginTop: 8 }}>&ldquo;{board.tagline}&rdquo;</div>}
      </div>

      {/* Palette */}
      {palette.length > 0 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 22, ...flash(glow(["primaryColor", "secondaryColor", "accentColor"])), borderRadius: 12, padding: 4 }}>
          {palette.map((c, i) => (
            <div key={i} title={c} style={{ flex: 1, maxWidth: 96, height: 46, borderRadius: 10, background: c, border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}>
              <span style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: "rgba(255,255,255,0.85)", mixBlendMode: "difference" }}>{String(c).toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Archetype · Enemy · Gravity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: PANEL_BORDER, ...flash(glow(["archetype", "secondaryArchetype"])) }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Archetype</div>
          <div style={{ fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
            {archetypeMatch && <span style={{ width: 9, height: 9, borderRadius: "50%", background: archetypeMatch.color, flexShrink: 0 }} />}
            {board.archetype}{board.secondaryArchetype ? <span style={{ color: TITANIUM, fontWeight: 500 }}> / {board.secondaryArchetype}</span> : null}
          </div>
        </div>
        {gravity && (
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: PANEL_BORDER }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Gravity Score</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: gravityScoreColor(gravity.score) }}>{gravity.score}<span style={{ fontSize: 12, color: TITANIUM, fontWeight: 500 }}>/100</span></div>
          </div>
        )}
      </div>

      {board.enemy && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,69,58,0.06)", border: "1px solid rgba(255,69,58,0.18)", marginBottom: 18, ...flash(glow(["enemy"])) }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#FF6961", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>The enemy it fights</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: STARLIGHT }}>{board.enemy}</div>
        </div>
      )}

      {/* Voice tones */}
      {tones.length > 0 && (
        <div style={{ marginBottom: 20, ...flash(glow(["toneAttributes"])), borderRadius: 12, padding: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Voice</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {tones.map((t, i) => (
              <span key={i} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "rgba(100,210,255,0.09)", border: "1px solid rgba(100,210,255,0.22)", color: "#9BDCFF" }}>
                {String(t).split(/[—:–-]/)[0].trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Coverage */}
      <div style={{ padding: "16px 18px 8px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: PANEL_BORDER, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: STARLIGHT, letterSpacing: 0.5, textTransform: "uppercase" }}>Board coverage</div>
          <div style={{ fontSize: 12, color: TITANIUM }}><span style={{ color: STARLIGHT, fontWeight: 700 }}>{filledTotal}</span> / {grandTotal} decisions</div>
        </div>
        {coverage.map((g) => <CoverageBar key={g.label} {...g} />)}
      </div>

      {/* Studied exemplars */}
      {exemplars && exemplars.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Patterns studied</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {exemplars.map((e) => (
              <Link key={e.slug} to={`/brands/${e.slug}`} className="bmd-link" style={{ padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: PANEL_BORDER, color: TITANIUM, textDecoration: "none" }}>
                {e.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────

const BUILD_STAGES = [
  "Reading your prompt…",
  "Retrieving the closest world-class brands…",
  "Deciding the one idea you can own…",
  "Choosing your archetype and naming your enemy…",
  "Deriving your color and type system…",
  "Profiling your first three customers…",
  "Writing your voice and messaging rules…",
  "Assembling all 31 sections…",
];

export default function BrandGenerator() {
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState("");
  const [genBrand, setGenBrand] = useState(null);   // raw generator shape (for refine round-trip)
  const [board, setBoard] = useState({});           // board shape (for preview + handoff)
  const [exemplars, setExemplars] = useState([]);
  const [changed, setChanged] = useState([]);
  const [busy, setBusy] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState(null);
  const [showGate, setShowGate] = useState(false);
  const pendingRef = useRef(null); // the prompt text held while the email gate is open
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Brand Generator — Describe It, Get a Complete Brand | BrandMD";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Type one prompt. BrandMD's Brand Generator studies the world's best brands and builds you a complete brand operating system — archetype, enemy, positioning, colors, voice, customer profiles, offers, and all 31 sections — in about a minute."
    );
  }, []);

  useEffect(() => {
    if (!busy) return;
    setStageIdx(0);
    const t = setInterval(() => setStageIdx((i) => Math.min(i + 1, BUILD_STAGES.length - 1)), 4200);
    return () => clearInterval(t);
  }, [busy]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const runTurn = useCallback(async (text) => {
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setBusy(true);
    setError(null);
    try {
      const res = await generateBrand(nextMessages, genBrand || undefined);
      if (!res?.brand) throw new Error("The strategist returned nothing — try again.");
      setGenBrand(res.brand);
      setBoard(mapGeneratedToBoard(res.brand));
      setExemplars(res.exemplars || []);
      setChanged(res.changed || []);
      setMessages((m) => [...m, { role: "assistant", content: res.reply || "Done — your brand is on the right." }]);
      track(genBrand ? "generator_refined" : "generator_created", { brandName: res.brand.brandName });
    } catch (e) {
      setError(e.message || "Something broke mid-build. Try again.");
      setMessages((m) => m.slice(0, -1)); // drop the user turn we couldn't answer
      setInput(text); // hand the text back so it isn't lost
    }
    setBusy(false);
  }, [messages, genBrand]);

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    if (text.length < 8) { setError("Give me a little more to work with — one real sentence."); return; }
    setError(null);
    setInput("");
    if (getEmail() || genBrand) {
      runTurn(text);
    } else {
      pendingRef.current = text;
      setShowGate(true);
    }
  };

  const handleGate = async ({ email, firstName }) => {
    await register(email);
    setShowGate(false);
    sendLeadToGHL({ email, firstName, boardId: "", boardUrl: `${window.location.origin}/generate` });
    const text = pendingRef.current;
    pendingRef.current = null;
    if (text) runTurn(text);
  };

  const openInBuilder = () => {
    sessionStorage.setItem("founder-seed", JSON.stringify(board));
    track("generator_to_builder", { brandName: board.brandName });
    navigate("/builder");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const started = messages.length > 0 || busy;

  return (
    <div style={{ background: "#000", color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      {/* Header */}
      <div style={{ padding: "64px 40px 26px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>
          Brand Generator &middot; Powered by the world's best brands
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.06, letterSpacing: "-1.8px", maxWidth: 820, margin: "0 auto 18px" }}>
          Describe it. <span style={{ color: ACCENT_BLUE }}>Get the whole brand.</span>
        </h1>
        <p style={{ fontSize: 16, color: TITANIUM, maxWidth: 620, margin: "0 auto", lineHeight: 1.65 }}>
          One prompt in. A complete brand operating system out — archetype, enemy, positioning,
          colors, voice, your first three customers, the offer ladder, all 31 sections. Studied
          against the best brands in the world, then made yours to refine.
        </p>
      </div>

      {/* Split workspace */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 60px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 22, alignItems: "start" }} className="bmd-gen-grid">
        {/* Chat column */}
        <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, display: "flex", flexDirection: "column", minHeight: 460, maxHeight: "78vh", overflow: "hidden" }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 22px 8px" }}>
            {!started && (
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: STARLIGHT, marginBottom: 6 }}>What are you building?</div>
                <div style={{ fontSize: 13, color: TITANIUM, lineHeight: 1.6, marginBottom: 20 }}>
                  One honest sentence. No marketing speak needed — deciding that is the whole point.
                  You can keep chatting after to refine anything.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {EXAMPLES.map((ex) => (
                    <button key={ex} type="button" onClick={() => setInput(ex)} style={{
                      textAlign: "left", padding: "12px 15px", borderRadius: 12, cursor: "pointer",
                      background: "rgba(255,255,255,0.03)", border: PANEL_BORDER, color: STARLIGHT,
                      fontSize: 13, lineHeight: 1.5, fontFamily: SANS, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,113,227,0.1)"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >
                      <span style={{ color: ACCENT_ICE, marginRight: 8 }}>→</span>{ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}

            {busy && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px 16px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)", borderTopColor: ACCENT_ICE, animation: "bmd-spin 0.9s linear infinite", flexShrink: 0 }} />
                <div style={{ fontSize: 13.5, color: STARLIGHT, fontWeight: 500 }}>{BUILD_STAGES[stageIdx]}</div>
                <style>{`@keyframes bmd-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={{ borderTop: PANEL_BORDER, padding: "14px 16px", background: "rgba(0,0,0,0.25)" }}>
            {error && <div style={{ fontSize: 12.5, color: "#FF6961", marginBottom: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={genBrand ? "Refine it — 'make the voice bolder', 'target enterprise instead', 'try a warmer palette'…" : "e.g. A premium electrolyte drink for endurance athletes…"}
                rows={genBrand ? 2 : 3}
                disabled={busy || !isAIAvailable()}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 12, boxSizing: "border-box",
                  border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)",
                  color: STARLIGHT, fontSize: 14, fontFamily: SANS, outline: "none", resize: "none", lineHeight: 1.5,
                }}
              />
              <button
                onClick={submit}
                disabled={busy || !input.trim() || !isAIAvailable()}
                className="bmd-cta"
                style={{
                  padding: "12px 20px", borderRadius: 12, border: "none", flexShrink: 0,
                  cursor: busy || !input.trim() ? "default" : "pointer",
                  background: input.trim() && !busy ? ACCENT_BLUE : "rgba(255,255,255,0.08)",
                  color: input.trim() && !busy ? "#fff" : "#6E6E73",
                  fontSize: 14, fontWeight: 600, fontFamily: SANS, transition: "all 0.15s",
                }}
              >
                {genBrand ? "Refine" : "Build"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 9, textAlign: "center" }}>
              {genBrand ? "Keep chatting to refine any part of the brand" : "Free with just an email"} &middot; Have a live site? <Link to="/analyzer" className="bmd-link" style={{ color: TITANIUM }}>Scan it instead</Link>
            </div>
          </div>
        </div>

        {/* Preview column */}
        <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "26px 24px", position: "relative", overflow: "hidden" }}>
          {board.brandName && (
            <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(100,210,255,0.1), transparent 70%)", filter: "blur(24px)", pointerEvents: "none" }} />
          )}
          <div style={{ position: "relative" }}>
            <BrandPreview board={board} exemplars={exemplars} changed={changed} />

            {board.brandName && (
              <div style={{ marginTop: 24, paddingTop: 22, borderTop: PANEL_BORDER }}>
                <button onClick={openInBuilder} className="bmd-cta" style={{
                  width: "100%", padding: "15px 28px", borderRadius: 100, border: "none", cursor: "pointer",
                  background: ACCENT_BLUE, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: SANS,
                }}>
                  Open the full board in the Builder
                </button>
                <div style={{ fontSize: 12, color: TITANIUM, marginTop: 12, textAlign: "center", lineHeight: 1.6 }}>
                  Every field is a starting position, not a verdict. The Builder is where you
                  push back, refine, and export it — brand.md, guidelines, Content Studio.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmailGate
        isOpen={showGate}
        onClose={() => { setShowGate(false); if (pendingRef.current) { setInput(pendingRef.current); pendingRef.current = null; } }}
        onSubmit={handleGate}
        title="Generate Your Brand"
        subtitle="Enter your email and BrandMD builds your complete brand — archetype, enemy, positioning, colors, voice, and your first three customers. Free, and it unlocks the strategy sections of the Builder."
        submitLabel="Build My Brand"
      />

      {/* How it works */}
      <div style={{ borderTop: PANEL_BORDER, padding: "50px 40px 64px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 28 }}>
          {[
            { label: "Studied, not guessed", text: "Before it writes a word, the generator pulls the closest world-class brands from our library and learns how their archetype, enemy, voice, and color reinforce one idea." },
            { label: "Complete, not a stub", text: "You don't get a name and a color. You get all 31 sections — StoryBrand script, manifesto, writing system, offer ladder, three ICPs, content calendar — filled with specific, paste-ready work." },
            { label: "Yours, not final", text: "Keep chatting to refine anything, then open it in the Builder to edit every field, score it, and export brand.md, guidelines, and content." },
          ].map((step) => (
            <div key={step.label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_BLUE, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 9 }}>{step.label}</div>
              <div style={{ fontSize: 13.5, color: TITANIUM, lineHeight: 1.65 }}>{step.text}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .bmd-gen-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
