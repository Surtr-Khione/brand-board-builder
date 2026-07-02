import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import WebScanner from "../components/WebScanner";
import BrandIntelligence from "../components/BrandIntelligence";
import { ARCHETYPES } from "../lib/archetypes";

const VOID = "#06060C";
const PANEL = "#0D0D16";
const MAGENTA = "#FF2E88";
const CYAN = "#00E5FF";
const ORANGE = "#FF6A00";
const STARLIGHT = "#F5F3EE";
const COMET = "#8A8A99";
const DISPLAY = "'Bricolage Grotesque', -apple-system, sans-serif";
const BODY = "'IBM Plex Sans', -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

function rgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "138,138,153" : `${r},${g},${b}`;
}

const hasSignal = (s) => Boolean(s.brandName || s.primaryColor || s.archetype || s.tagline);

export default function Analyzer() {
  const [scanned, setScanned] = useState({});
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Brand Analyzer — Free Instant Brand Scan | BrandMD"; }, []);

  const applyScan = (updates) => setScanned((prev) => ({ ...prev, ...updates }));

  const archetypeMatch = ARCHETYPES.find((a) => a.name === scanned.archetype);

  const copyArchetype = () => {
    const line = `My brand's archetype is ${scanned.archetype}${archetypeMatch ? ` — ${archetypeMatch.desc}` : ""}. Find yours free at brandmd.space/analyzer`;
    navigator.clipboard?.writeText(line).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const continueToBuilder = () => {
    sessionStorage.setItem("brand-clone", JSON.stringify({
      brandName: scanned.brandName,
      tagline: scanned.tagline,
      industry: scanned.industry,
      mission: scanned.mission,
      vision: scanned.vision,
      elevator: scanned.elevator,
      archetype: scanned.archetype,
      website: scanned.website,
      primaryColor: scanned.primaryColor,
      secondaryColor: scanned.secondaryColor,
      accentColor: scanned.accentColor,
      primaryFont: scanned.primaryFont,
      bodyFont: scanned.bodyFont,
      toneAttributes: scanned.toneAttributes,
      brandPersonality: scanned.brandPersonality,
      photoStyle: scanned.photoStyle,
      socialPersonality: scanned.socialPersonality,
    }));
    navigate("/builder");
  };

  const pc = scanned.primaryColor || MAGENTA;
  const sc = scanned.secondaryColor || CYAN;
  const ac = scanned.accentColor || ORANGE;

  return (
    <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: BODY }}>
      <SiteNav />

      {/* HEADER */}
      <div style={{ padding: "72px 40px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: CYAN, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
          Free &middot; Instant &middot; No signup
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 5vw, 54px)", lineHeight: 1.05, letterSpacing: "-1.5px", maxWidth: 820, margin: "0 auto 20px" }}>
          See your brand the way a stranger does.
        </h1>
        <p style={{ fontSize: 16, color: COMET, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          Paste a live website below. In under a minute you'll have its colors, fonts, tone,
          and brand archetype — the same first read a brand diagnostician would give it.
        </p>
      </div>

      {/* SCAN PANELS */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: COMET, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Source: website
          </div>
          <WebScanner onApply={applyScan} />
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: COMET, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Source: LinkedIn, Instagram &amp; more
          </div>
          <div style={{ fontSize: 13, color: COMET, marginBottom: 12, lineHeight: 1.5 }}>
            Your website only tells half the story. Add a LinkedIn or Instagram profile and BrandMD reads voice and personality from how you actually talk to people.
          </div>
          <BrandIntelligence onApply={applyScan} discoveredUrls={scanned.discoveredUrls || {}} />
        </div>
      </div>

      {/* ARCHETYPE REVEAL — the shareable hook */}
      {scanned.archetype && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 28px" }}>
          <div
            style={{
              borderRadius: 20, position: "relative", overflow: "hidden", textAlign: "center",
              padding: "44px 32px 36px", background: PANEL,
              border: `1px solid rgba(${rgb(archetypeMatch?.color || pc)},0.4)`,
            }}
          >
            <div style={{
              position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
              width: 420, height: 420, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${rgb(archetypeMatch?.color || pc)},0.4), transparent 70%)`,
              filter: "blur(20px)", pointerEvents: "none",
            }} />
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 16, position: "relative" }}>
              Archetype detected
            </div>
            <div
              style={{
                fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(36px, 7vw, 64px)",
                letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 14, position: "relative",
                color: "transparent",
                backgroundImage: `linear-gradient(135deg, ${STARLIGHT}, ${archetypeMatch?.color || MAGENTA})`,
                backgroundClip: "text", WebkitBackgroundClip: "text",
              }}
            >
              {scanned.archetype}
            </div>
            {archetypeMatch && (
              <p style={{ fontSize: 15, color: COMET, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6, position: "relative" }}>
                {archetypeMatch.desc}
              </p>
            )}
            <button
              onClick={copyArchetype}
              className="bmd-cta"
              style={{
                padding: "10px 22px", borderRadius: 8, border: "1px solid rgba(245,243,238,0.18)",
                background: "transparent", color: STARLIGHT, fontSize: 13, fontWeight: 700,
                fontFamily: BODY, cursor: "pointer", position: "relative",
              }}
            >
              {copied ? "Copied ✓" : "Copy your result to share"}
            </button>
          </div>
        </div>
      )}

      {/* DIAGNOSIS REVEAL */}
      {hasSignal(scanned) && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 60px" }}>
          <div style={{
            borderRadius: 18, border: `1px solid rgba(${rgb(pc)},0.35)`, background: PANEL,
            padding: "32px 32px 28px", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${rgb(pc)},0.35), transparent 70%)`, filter: "blur(10px)", pointerEvents: "none",
            }} />
            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: CYAN, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14, position: "relative" }}>
              Colors &amp; details
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", position: "relative" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[pc, sc, ac].map((c, i) => (
                  <div key={i} style={{
                    width: 52, height: 52, borderRadius: "50%", background: c,
                    boxShadow: `0 0 24px rgba(${rgb(c)},0.5)`, border: "1px solid rgba(245,243,238,0.15)",
                  }} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                {scanned.brandName && (
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, marginBottom: 4 }}>{scanned.brandName}</div>
                )}
                {scanned.tagline && (
                  <div style={{ fontSize: 13, color: COMET, fontStyle: "italic", marginBottom: 10 }}>&ldquo;{scanned.tagline}&rdquo;</div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {scanned.industry && (
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: COMET, borderRadius: 5, padding: "3px 9px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {scanned.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26, position: "relative" }}>
              <button
                onClick={continueToBuilder}
                className="bmd-cta"
                style={{
                  padding: "12px 26px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${MAGENTA}, ${ORANGE})`, color: STARLIGHT,
                  fontSize: 14, fontWeight: 800, fontFamily: BODY,
                }}
              >
                Continue to Builder &rarr;
              </button>
              <Link
                to="/brands"
                className="bmd-link"
                style={{
                  padding: "12px 26px", borderRadius: 9, border: "1px solid rgba(245,243,238,0.15)",
                  color: STARLIGHT, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: BODY,
                }}
              >
                Explore the Library instead
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WHY START HERE — the ladder, stated plainly */}
      <div style={{ borderTop: "1px solid rgba(245,243,238,0.07)", padding: "44px 40px 60px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {[
            { label: "Free", color: CYAN, text: "Analyze instantly. No account, no card, no limit on scans." },
            { label: "Still free", color: MAGENTA, text: "Chart your full 19-part identity in the Builder — save it with just an email." },
            { label: "When you're ready", color: ORANGE, text: "Content Studio turns a finished board into ongoing content and campaigns." },
          ].map((step) => (
            <div key={step.label}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: step.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 13.5, color: COMET, lineHeight: 1.6 }}>{step.text}</div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 860, margin: "36px auto 0", fontFamily: MONO, fontSize: 11.5, color: "#555" }}>
          No email required to scan. We only ask for one when you're ready to save a board.
        </div>
      </div>
    </div>
  );
}
