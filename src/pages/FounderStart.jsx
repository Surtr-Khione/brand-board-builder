import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import EmailGate from "../components/EmailGate";
import { founderBrief, isAIAvailable } from "../lib/ai";
import { mapSynthesisToBoard } from "../lib/synthesisMap";
import { register, getEmail } from "../lib/auth";
import { sendLeadToGHL } from "../lib/ghl";
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

const PERSONALITY_CHIPS = [
  "Bold", "Warm", "Premium", "Playful", "Technical",
  "Minimal", "Rebellious", "Trustworthy", "Fast", "Crafted",
];
const PRICE_TIERS = ["Budget", "Mid-market", "Premium", "Luxury"];
const STAGES = ["Just an idea", "Pre-launch", "Recently launched"];

// Rotated while the synthesis runs — each line names a real step the
// strategist model is actually doing, so the wait reads as work.
const BUILD_STAGES = [
  "Reading your brief…",
  "Deciding what you can own…",
  "Choosing your archetype…",
  "Naming the enemy you fight…",
  "Deriving your color territory…",
  "Profiling your first three customers…",
  "Writing your messaging rules…",
  "Assembling your board…",
];

const inputStyle = {
  width: "100%", padding: "13px 18px", borderRadius: 12, boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)",
  color: STARLIGHT, fontSize: 15, fontFamily: SANS, outline: "none",
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      {hint && <div style={{ fontSize: 13, color: "#6E6E73", marginBottom: 10, lineHeight: 1.5 }}>{hint}</div>}
      {!hint && <div style={{ marginBottom: 10 }} />}
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 18px", borderRadius: 100, cursor: "pointer", fontFamily: SANS,
        fontSize: 13.5, fontWeight: 600, transition: "all 0.15s",
        border: active ? `1px solid ${ACCENT_BLUE}` : "1px solid rgba(255,255,255,0.14)",
        background: active ? "rgba(0,113,227,0.16)" : "rgba(255,255,255,0.03)",
        color: active ? "#7DBEFF" : STARLIGHT,
      }}
    >
      {children}
    </button>
  );
}

export default function FounderStart() {
  const [brandName, setBrandName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [audience, setAudience] = useState("");
  const [problem, setProblem] = useState("");
  const [differentiation, setDifferentiation] = useState("");
  const [personality, setPersonality] = useState([]);
  const [priceTier, setPriceTier] = useState("");
  const [stage, setStage] = useState("");
  const [inspiration, setInspiration] = useState("");

  const [showEmailGate, setShowEmailGate] = useState(false);
  const [building, setBuilding] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // mapped board updates
  const resultRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Start From an Idea — Build Your Startup's Brand | BrandMD";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "No website, no logo, no problem. Describe your startup in a few sentences and BrandMD builds your complete starter brand — archetype, positioning, colors, voice, and your first three customer profiles."
    );
  }, []);

  useEffect(() => {
    if (!building) return;
    const t = setInterval(() => setStageIdx((i) => Math.min(i + 1, BUILD_STAGES.length - 1)), 3800);
    return () => clearInterval(t);
  }, [building]);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const togglePersonality = (p) =>
    setPersonality((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length >= 3 ? prev : [...prev, p]
    );

  const canSubmit = oneLiner.trim().length >= 12;

  const startGenerate = () => {
    setError(null);
    if (!canSubmit) { setError("Tell us what you're building — one real sentence is enough."); return; }
    if (getEmail()) { runGenerate(); } else { setShowEmailGate(true); }
  };

  const handleGate = async ({ email, firstName }) => {
    register(email);
    setShowEmailGate(false);
    sendLeadToGHL({ email, firstName, boardId: "", boardUrl: `${window.location.origin}/start` });
    await runGenerate();
  };

  const runGenerate = async () => {
    setBuilding(true);
    setStageIdx(0);
    setError(null);
    try {
      const res = await founderBrief({
        brandName: brandName.trim(), oneLiner: oneLiner.trim(), audience: audience.trim(),
        problem: problem.trim(), differentiation: differentiation.trim(),
        personality, priceTier, stage, inspiration: inspiration.trim(),
      });
      if (!res?.synthesis) throw new Error("The strategist returned nothing — try again.");
      setResult(mapSynthesisToBoard(res.synthesis));
    } catch (e) {
      setError(e.message || "Something broke mid-build. Try again.");
    }
    setBuilding(false);
  };

  const openInBuilder = () => {
    sessionStorage.setItem("founder-seed", JSON.stringify(result));
    navigate("/builder");
  };

  const archetypeMatch = result && ARCHETYPES.find((a) => a.name === result.archetype);
  const gravity = result ? computeGravityScore(result) : null;

  return (
    <div style={{ background: "#000", color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      {/* HEADER */}
      <div style={{ padding: "72px 40px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
          For founders &middot; No website needed
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.08, letterSpacing: "-1.8px", maxWidth: 800, margin: "0 auto 20px" }}>
          Nothing to scan yet? <span style={{ color: ACCENT_BLUE }}>Good.</span><br />
          Build the brand before the guesswork starts.
        </h1>
        <p style={{ fontSize: 16, color: TITANIUM, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          Describe your startup in a few sentences. BrandMD makes the strategic calls you
          haven't made yet — archetype, enemy, positioning, colors, voice, and your first
          three customer profiles — and hands you a complete board to refine.
        </p>
      </div>

      {/* THE BRIEF */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 40px 40px" }}>
        <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "36px 34px 28px" }}>
          <Field label="What are you building?" hint="One honest sentence. What it is and what it does — no marketing speak needed, that's our job.">
            <textarea
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              placeholder="e.g. A scheduling app that lets home-service crews fill last-minute cancellations automatically"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55 }}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 22px" }}>
            <Field label="Working name" hint="Leave blank and we'll propose one.">
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Optional" style={inputStyle} />
            </Field>
            <Field label="Who is it for?" hint="The people who'd pay first.">
              <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Owner-operated HVAC and plumbing companies, 3–20 trucks" style={inputStyle} />
            </Field>
          </div>

          <Field label="What problem does it kill?" hint="The pain that makes someone go looking for you.">
            <input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="e.g. A cancelled job means a truck sits idle and ~$800 walks out the door" style={inputStyle} />
          </Field>

          <Field label="Why you, not the incumbent way?" hint="What you do differently — even if it's just a hunch right now.">
            <input value={differentiation} onChange={(e) => setDifferentiation(e.target.value)} placeholder="e.g. We fill the slot automatically from a standby list — no dispatcher on the phone" style={inputStyle} />
          </Field>

          <Field label="Personality" hint="Pick up to three that feel right. We'll translate them into a real voice.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {PERSONALITY_CHIPS.map((p) => (
                <Chip key={p} active={personality.includes(p)} onClick={() => togglePersonality(p)}>{p}</Chip>
              ))}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 22px" }}>
            <Field label="Price positioning">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {PRICE_TIERS.map((t) => (
                  <Chip key={t} active={priceTier === t} onClick={() => setPriceTier(priceTier === t ? "" : t)}>{t}</Chip>
                ))}
              </div>
            </Field>
            <Field label="Stage">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {STAGES.map((s) => (
                  <Chip key={s} active={stage === s} onClick={() => setStage(stage === s ? "" : s)}>{s}</Chip>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Brands you admire" hint="Optional — helps us read the register you're aiming for.">
            <input value={inspiration} onChange={(e) => setInspiration(e.target.value)} placeholder="e.g. Basecamp's bluntness, Patagonia's conviction" style={inputStyle} />
          </Field>

          {error && <div style={{ fontSize: 13.5, color: "#FF453A", marginBottom: 16 }}>{error}</div>}

          {!building ? (
            <button
              onClick={startGenerate}
              className="bmd-cta"
              disabled={!isAIAvailable()}
              style={{
                width: "100%", padding: "16px 30px", borderRadius: 100, border: "none",
                cursor: canSubmit ? "pointer" : "default",
                background: canSubmit ? ACCENT_BLUE : "rgba(255,255,255,0.08)",
                color: canSubmit ? "#FFFFFF" : "#6E6E73",
                fontSize: 15.5, fontWeight: 600, fontFamily: SANS, transition: "all 0.2s",
              }}
            >
              Build my starter brand
            </button>
          ) : (
            <div style={{ textAlign: "center", padding: "18px 0 6px" }}>
              <div style={{
                width: 34, height: 34, margin: "0 auto 16px", borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.12)", borderTopColor: ACCENT_ICE,
                animation: "bmd-spin 0.9s linear infinite",
              }} />
              <style>{`@keyframes bmd-spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: STARLIGHT, marginBottom: 6 }}>{BUILD_STAGES[stageIdx]}</div>
              <div style={{ fontSize: 12.5, color: TITANIUM }}>A senior strategist takes days. This takes about a minute.</div>
            </div>
          )}

          <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 16, textAlign: "center" }}>
            Free with just an email &middot; Have a live site instead? <Link to="/analyzer" className="bmd-link" style={{ color: TITANIUM }}>Scan it</Link>
          </div>
        </div>
      </div>

      {/* THE REVEAL */}
      {result && (
        <div ref={resultRef} style={{ maxWidth: 720, margin: "0 auto", padding: "8px 40px 40px" }}>
          <div style={{ borderRadius: 20, position: "relative", overflow: "hidden", background: PANEL_BG, border: PANEL_BORDER, padding: "46px 36px 38px", textAlign: "center" }}>
            <div style={{
              position: "absolute", top: "-35%", left: "50%", transform: "translateX(-50%)",
              width: 460, height: 460, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(100,210,255,0.14), transparent 70%)",
              filter: "blur(20px)", pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>
                Your starter brand
              </div>
              <div style={{ fontWeight: 700, fontSize: "clamp(32px, 6vw, 52px)", letterSpacing: "-1.6px", lineHeight: 1.05, marginBottom: 10 }}>
                {result.brandName}
              </div>
              {result.tagline && (
                <div style={{ fontSize: 16, color: TITANIUM, fontStyle: "italic", marginBottom: 26 }}>&ldquo;{result.tagline}&rdquo;</div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 26 }}>
                {[result.primaryColor, result.secondaryColor, result.accentColor].filter(Boolean).map((c, i) => (
                  <div key={i} title={c} style={{ width: 44, height: 44, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.18)" }} />
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, textAlign: "left", maxWidth: 560, margin: "0 auto 30px" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Archetype</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{result.archetype}{result.secondaryArchetype ? ` / ${result.secondaryArchetype}` : ""}</div>
                  {archetypeMatch && <div style={{ fontSize: 12.5, color: TITANIUM, marginTop: 4, lineHeight: 1.5 }}>{archetypeMatch.desc}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Your enemy</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{result.enemy || "—"}</div>
                </div>
                {gravity && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Gravity Score</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: gravityScoreColor(gravity.score) }}>{gravity.score}</div>
                  </div>
                )}
              </div>

              <button
                onClick={openInBuilder}
                className="bmd-cta"
                style={{
                  padding: "15px 34px", borderRadius: 100, border: "none", cursor: "pointer",
                  background: ACCENT_BLUE, color: "#FFF", fontSize: 15, fontWeight: 600, fontFamily: SANS,
                }}
              >
                Open your full board in the Builder
              </button>
              <div style={{ fontSize: 12.5, color: TITANIUM, marginTop: 14, lineHeight: 1.6 }}>
                Everything above is a starting position, not a verdict — the board is where you
                push back, refine, and make it yours.
              </div>
            </div>
          </div>
        </div>
      )}

      <EmailGate
        isOpen={showEmailGate}
        onClose={() => setShowEmailGate(false)}
        onSubmit={handleGate}
        title="Build Your Starter Brand"
        subtitle="Enter your email and we'll generate your complete starter brand — archetype, positioning, colors, voice, and your first three customer profiles. Free, and it unlocks the strategy sections of the Builder."
        submitLabel="Build My Brand"
      />

      {/* THE LADDER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "48px 40px 60px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 26 }}>
          {[
            { label: "Step one", text: "Describe the idea. Get a complete starter brand — strategy, colors, voice, customers." },
            { label: "Step two", text: "Refine it in the Builder. The Gravity roadmap shows exactly what to decide next." },
            { label: "Step three", text: "Ship it: a shareable board, a public Brand Certificate, and Content Studio on tap." },
          ].map((step) => (
            <div key={step.label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_BLUE, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 13.5, color: TITANIUM, lineHeight: 1.6 }}>{step.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
