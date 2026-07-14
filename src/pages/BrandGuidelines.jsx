import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { loadBoard } from "../lib/storage";
import { computeGravityScore, gravityScoreColor } from "../lib/gravityScore";

// A brand-guidelines document is the one artifact in the product that lives
// on paper as much as on screen — so unlike the rest of the app it renders
// as a light, print-first editorial page.
const INK = "#111114";
const PAPER = "#FFFFFF";
const FAINT = "#6E6E73";
const RULE = "1px solid #E5E5EA";
const SANS = "'Inter', -apple-system, sans-serif";

const filled = (v) => (Array.isArray(v) ? v.some((x) => (typeof x === "string" ? x.trim() : x)) : v && String(v).trim());
const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);

function cssTokens(b) {
  const lines = [":root {"];
  const push = (name, val) => { if (val) lines.push(`  --brand-${name}: ${val};`); };
  push("primary", b.primaryColor);
  push("secondary", b.secondaryColor);
  push("accent", b.accentColor);
  if (b.lightModeEnabled !== false) {
    push("bg", b.lightBg); push("surface", b.lightSurface);
    push("text", b.lightText); push("text-secondary", b.lightSecText); push("border", b.lightBorder);
  }
  if (b.primaryFont) push("font-display", `'${b.primaryFont}', sans-serif`);
  if (b.bodyFont) push("font-body", `'${b.bodyFont}', sans-serif`);
  push("h1-size", b.h1Size); push("h2-size", b.h2Size); push("h3-size", b.h3Size); push("body-size", b.bodySize);
  lines.push("}");
  if (b.darkModeEnabled !== false && (b.darkBg || b.darkText)) {
    lines.push("", '[data-theme="dark"] {');
    if (b.darkBg) lines.push(`  --brand-bg: ${b.darkBg};`);
    if (b.darkSurface) lines.push(`  --brand-surface: ${b.darkSurface};`);
    if (b.darkText) lines.push(`  --brand-text: ${b.darkText};`);
    if (b.darkSecText) lines.push(`  --brand-text-secondary: ${b.darkSecText};`);
    if (b.darkBorder) lines.push(`  --brand-border: ${b.darkBorder};`);
    lines.push("}");
  }
  return lines.join("\n");
}

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="bmd-noprint"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
      style={{
        padding: "5px 14px", borderRadius: 100, cursor: "pointer", fontFamily: SANS,
        fontSize: 12, fontWeight: 600, border: "1px solid #D2D2D7", background: "#FFF", color: INK,
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function Section({ kicker, title, children }) {
  return (
    <section style={{ padding: "44px 0 8px", borderTop: RULE, breakInside: "avoid" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: FAINT, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{kicker}</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.6px", margin: "0 0 24px" }}>{title}</h2>
      {children}
    </section>
  );
}

function Entry({ label, value, quote }) {
  if (!filled(value)) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: FAINT, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: quote ? 19 : 15, lineHeight: 1.6, fontStyle: quote ? "italic" : "normal" }}>
        {quote ? <>&ldquo;{value}&rdquo;</> : value}
      </div>
    </div>
  );
}

function ChipRow({ label, items }) {
  const xs = list(items);
  if (!xs.length) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: FAINT, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {xs.map((x) => (
          <span key={x} style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid #D2D2D7", fontSize: 13.5, fontWeight: 500 }}>{x}</span>
        ))}
      </div>
    </div>
  );
}

function Swatch({ name, hex }) {
  if (!hex) return null;
  return (
    <div style={{ breakInside: "avoid" }}>
      <div style={{ height: 110, borderRadius: 14, background: hex, border: "1px solid rgba(0,0,0,0.08)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 12.5, color: FAINT, fontFamily: "ui-monospace, monospace" }}>{hex.toUpperCase()}</div>
        </div>
        <CopyButton text={hex.toUpperCase()} />
      </div>
    </div>
  );
}

export default function BrandGuidelines() {
  const { boardId } = useParams();
  const [brand, setBrand] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing

  useEffect(() => {
    loadBoard(boardId)
      .then((data) => {
        if (data?.brand_data) { setBrand(data.brand_data); setState("ready"); }
        else setState("missing");
      })
      .catch(() => setState("missing"));
  }, [boardId]);

  useEffect(() => {
    if (brand?.brandName) document.title = `${brand.brandName} — Brand Guidelines | BrandMD`;
  }, [brand]);

  if (state === "loading") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PAPER, color: FAINT, fontFamily: SANS }}>Loading guidelines…</div>;
  }
  if (state === "missing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", background: PAPER, color: INK, fontFamily: SANS }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Board not found</div>
        <div style={{ fontSize: 14, color: FAINT }}>This board may not be saved yet.</div>
        <Link to="/builder" style={{ color: "#0071E3", fontSize: 14, fontWeight: 600 }}>Open the Builder →</Link>
      </div>
    );
  }

  const b = brand;
  const { score } = computeGravityScore(b);
  const dos = list(b.messagingDos);
  const donts = list(b.messagingDonts);
  const tokens = cssTokens(b);
  const hasColors = b.primaryColor || b.secondaryColor || b.accentColor;
  const hasType = b.primaryFont || b.bodyFont;
  const boardUrl = `${window.location.origin}/board/${boardId}`;

  return (
    <div style={{ background: "#F2F2F4", minHeight: "100vh", fontFamily: SANS, color: INK }}>
      <style>{`
        @media print {
          .bmd-noprint { display: none !important; }
          .bmd-page { box-shadow: none !important; margin: 0 !important; max-width: none !important; border-radius: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="bmd-noprint" style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px clamp(20px, 4vw, 40px)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", borderBottom: RULE }}>
        <Link to={`/board/${boardId}`} style={{ fontSize: 13.5, fontWeight: 600, color: INK, textDecoration: "none" }}>← Back to board</Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <CopyButton text={window.location.href} label="Copy link" />
          <button
            onClick={() => window.print()}
            style={{ padding: "8px 20px", borderRadius: 100, border: "none", cursor: "pointer", background: "#0071E3", color: "#FFF", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="bmd-page" style={{ maxWidth: 860, margin: "36px auto 60px", background: PAPER, borderRadius: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.10)", padding: "clamp(32px, 6vw, 72px)" }}>

        {/* MASTHEAD */}
        <header style={{ paddingBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div>
              {b.logoUrl && <img src={b.logoUrl} alt={`${b.brandName} logo`} style={{ height: 54, marginBottom: 22, objectFit: "contain" }} />}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: FAINT, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Brand Guidelines</div>
              <h1 style={{ fontSize: "clamp(34px, 6vw, 54px)", fontWeight: 800, letterSpacing: "-1.8px", lineHeight: 1.02, margin: 0 }}>
                {b.brandName || "Untitled Brand"}
              </h1>
              {filled(b.tagline) && <div style={{ fontSize: 17, color: FAINT, fontStyle: "italic", marginTop: 12 }}>&ldquo;{b.tagline}&rdquo;</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: FAINT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Gravity Score</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: gravityScoreColor(score) }}>{score}</div>
              {filled(b.archetype) && (
                <div style={{ marginTop: 10, padding: "6px 14px", borderRadius: 100, border: "1px solid #D2D2D7", fontSize: 12.5, fontWeight: 600 }}>
                  {b.archetype}{filled(b.secondaryArchetype) ? ` / ${b.secondaryArchetype}` : ""}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* FOUNDATIONS */}
        <Section kicker="01" title="Foundations">
          <Entry label="Mission" value={b.mission} />
          <Entry label="Vision" value={b.vision} />
          <Entry label="Brand promise" value={b.brandPromise} quote />
          <Entry label="Elevator pitch" value={b.elevator} />
          <Entry label="What we're against" value={b.enemy} />
          <Entry label="Why we're different" value={b.whyDifferent} />
          <ChipRow label="Core values" items={b.coreValues} />
        </Section>

        {/* VOICE */}
        {(list(b.toneAttributes).length > 0 || dos.length > 0 || donts.length > 0 || list(b.wordsAlways).length > 0 || list(b.wordsNever).length > 0 || filled(b.socialPersonality)) && (
          <Section kicker="02" title="Voice & Messaging">
            <ChipRow label="We sound" items={b.toneAttributes} />
            <ChipRow label="Personality" items={b.brandPersonality} />
            {(dos.length > 0 || donts.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22, marginBottom: 22 }}>
                {dos.length > 0 && (
                  <div style={{ borderRadius: 14, border: "1px solid #C8E6C9", background: "#F4FBF4", padding: "18px 20px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Always say it like</div>
                    {dos.map((d) => <div key={d} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>✓ {d}</div>)}
                  </div>
                )}
                {donts.length > 0 && (
                  <div style={{ borderRadius: 14, border: "1px solid #FFCDD2", background: "#FDF5F5", padding: "18px 20px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#C62828", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Never say it like</div>
                    {donts.map((d) => <div key={d} style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>✕ {d}</div>)}
                  </div>
                )}
              </div>
            )}
            <ChipRow label="Words we own" items={b.wordsAlways} />
            <ChipRow label="Words we never use" items={b.wordsNever} />
            <Entry label="Social personality" value={b.socialPersonality} />
            <Entry label="Email sign-off" value={b.emailSignoff} />
          </Section>
        )}

        {/* COLOR */}
        {hasColors && (
          <Section kicker="03" title="Color System">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, marginBottom: 30 }}>
              <Swatch name="Primary" hex={b.primaryColor} />
              <Swatch name="Secondary" hex={b.secondaryColor} />
              <Swatch name="Accent" hex={b.accentColor} />
            </div>
            <div style={{ borderRadius: 14, background: "#1D1D1F", padding: "18px 20px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", letterSpacing: 0.8, textTransform: "uppercase" }}>CSS tokens — paste into your stylesheet</div>
                <CopyButton text={tokens} label="Copy CSS" />
              </div>
              <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "#F5F5F7", fontFamily: "ui-monospace, 'SF Mono', monospace", overflowX: "auto" }}>{tokens}</pre>
            </div>
          </Section>
        )}

        {/* TYPOGRAPHY */}
        {hasType && (
          <Section kicker="04" title="Typography">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {b.primaryFont && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: FAINT, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Display — {b.primaryFont}</div>
                  <div style={{ fontFamily: `'${b.primaryFont}', sans-serif`, fontSize: 40, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.1 }}>
                    The quick brown fox
                  </div>
                </div>
              )}
              {(b.bodyFont || b.primaryFont) && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: FAINT, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Body — {b.bodyFont || b.primaryFont}</div>
                  <div style={{ fontFamily: `'${b.bodyFont || b.primaryFont}', sans-serif`, fontSize: 15, lineHeight: 1.7 }}>
                    The quick brown fox jumps over the lazy dog, then settles in to read
                    something set at a comfortable measure with generous leading.
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 24, fontSize: 13, color: FAINT }}>
              {b.h1Size && <span>H1 {b.h1Size}</span>}
              {b.h2Size && <span>H2 {b.h2Size}</span>}
              {b.h3Size && <span>H3 {b.h3Size}</span>}
              {b.bodySize && <span>Body {b.bodySize}</span>}
            </div>
          </Section>
        )}

        {/* IMAGERY & LOGO */}
        {(filled(b.photoStyle) || filled(b.photoMood) || filled(b.photoSubjects) || filled(b.logoUsageRules) || filled(b.logoDescription)) && (
          <Section kicker="05" title="Imagery & Logo">
            <Entry label="Photography style" value={b.photoStyle} />
            <Entry label="Mood" value={b.photoMood} />
            <Entry label="Subjects" value={b.photoSubjects} />
            <Entry label="Logo" value={b.logoDescription} />
            <Entry label="Logo usage rules" value={b.logoUsageRules} />
            <ChipRow label="Moodboard keywords" items={b.moodboardKeywords} />
          </Section>
        )}

        {/* BOILERPLATE */}
        {(filled(b.elevator) || filled(b.tagline) || filled(b.mission)) && (
          <Section kicker="06" title="Boilerplate — copy, paste, stay consistent">
            {[
              { label: "One-liner", text: b.tagline },
              { label: "Elevator pitch", text: b.elevator },
              { label: "Mission statement", text: b.mission },
            ].filter((x) => filled(x.text)).map((x) => (
              <div key={x.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "16px 0", borderBottom: RULE }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: FAINT, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{x.label}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{x.text}</div>
                </div>
                <CopyButton text={x.text} />
              </div>
            ))}
          </Section>
        )}

        {/* FOOTER */}
        <footer style={{ marginTop: 52, paddingTop: 24, borderTop: RULE, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 12.5, color: FAINT }}>
          <span>Living document — the source of truth is the board: {boardUrl}</span>
          <span>Built with <a href="https://brandmd.space" style={{ color: "#0071E3", textDecoration: "none", fontWeight: 600 }}>BrandMD</a></span>
        </footer>
      </div>
    </div>
  );
}
