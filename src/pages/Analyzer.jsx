import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import WebScanner from "../components/WebScanner";
import BrandIntelligence from "../components/BrandIntelligence";
import { ARCHETYPES } from "../lib/archetypes";

const VOID = "#000000";
const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const ACCENT_ICE = "#64D2FF";
const SANS = "'Inter', -apple-system, sans-serif";

const hasSignal = (s) => Boolean(s.brandName || s.primaryColor || s.archetype || s.tagline);

const PANEL_BG = `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 45%), ${CHARCOAL}`;
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";

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

  const pc = scanned.primaryColor || TITANIUM;
  const sc = scanned.secondaryColor || "#5A5A5E";
  const ac = scanned.accentColor || ACCENT_ICE;

  return (
    <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      {/* HEADER */}
      <div style={{ padding: "72px 40px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
          Free &middot; Instant &middot; No signup
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.08, letterSpacing: "-1.8px", maxWidth: 780, margin: "0 auto 20px" }}>
          See your brand the way a stranger does.
        </h1>
        <p style={{ fontSize: 16, color: TITANIUM, maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
          Paste a live website below. In under a minute you'll have its colors, fonts, tone,
          and brand archetype — the same first read a brand diagnostician would give it.
        </p>
      </div>

      {/* SCAN PANELS */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            Source: website
          </div>
          <WebScanner onApply={applyScan} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            Source: LinkedIn, Instagram &amp; more
          </div>
          <div style={{ fontSize: 13, color: TITANIUM, marginBottom: 12, lineHeight: 1.5 }}>
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
              padding: "48px 32px 38px", background: PANEL_BG, border: PANEL_BORDER,
            }}
          >
            <div style={{
              position: "absolute", top: "-35%", left: "50%", transform: "translateX(-50%)",
              width: 420, height: 420, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(100,210,255,0.16), transparent 70%)`,
              filter: "blur(20px)", pointerEvents: "none",
            }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18, position: "relative" }}>
              Archetype detected
            </div>
            <div
              style={{
                fontWeight: 700, fontSize: "clamp(34px, 6.5vw, 58px)",
                letterSpacing: "-1.8px", lineHeight: 1.05, marginBottom: 16, position: "relative", color: STARLIGHT,
              }}
            >
              {scanned.archetype}
            </div>
            {archetypeMatch && (
              <p style={{ fontSize: 15, color: TITANIUM, maxWidth: 420, margin: "0 auto 26px", lineHeight: 1.6, position: "relative" }}>
                {archetypeMatch.desc}
              </p>
            )}
            <button
              onClick={copyArchetype}
              className="bmd-cta"
              style={{
                padding: "10px 22px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent", color: STARLIGHT, fontSize: 13.5, fontWeight: 600,
                fontFamily: SANS, cursor: "pointer", position: "relative",
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
          <div style={{ borderRadius: 18, border: PANEL_BORDER, background: PANEL_BG, padding: "32px 32px 28px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
              Colors &amp; details
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[pc, sc, ac].map((c, i) => (
                  <div key={i} style={{
                    width: 48, height: 48, borderRadius: "50%", background: c,
                    border: "1px solid rgba(255,255,255,0.18)",
                  }} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                {scanned.brandName && (
                  <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.4px", marginBottom: 4 }}>{scanned.brandName}</div>
                )}
                {scanned.tagline && (
                  <div style={{ fontSize: 13.5, color: TITANIUM, fontStyle: "italic", marginBottom: 10 }}>&ldquo;{scanned.tagline}&rdquo;</div>
                )}
                {scanned.industry && (
                  <span style={{ fontSize: 12, color: TITANIUM, letterSpacing: 0.3 }}>
                    {scanned.industry}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28, alignItems: "center" }}>
              <button
                onClick={continueToBuilder}
                className="bmd-cta"
                style={{
                  padding: "12px 26px", borderRadius: 100, border: "none", cursor: "pointer",
                  background: ACCENT_BLUE, color: "#FFFFFF", fontSize: 14, fontWeight: 600, fontFamily: SANS,
                }}
              >
                Continue to Builder
              </button>
              <Link
                to="/brands"
                className="bmd-link"
                style={{ color: ACCENT_BLUE, textDecoration: "none", fontSize: 14, fontWeight: 500 }}
              >
                Explore the Library instead &nbsp;›
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WHY START HERE — the ladder, stated plainly */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "48px 40px 60px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 26 }}>
          {[
            { label: "Free", text: "Analyze instantly. No account, no card, no limit on scans." },
            { label: "Still free", text: "Chart your full 19-part identity in the Builder — save it with just an email." },
            { label: "When you're ready", text: "Content Studio turns a finished board into ongoing content and campaigns." },
          ].map((step) => (
            <div key={step.label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_BLUE, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 13.5, color: TITANIUM, lineHeight: 1.6 }}>{step.text}</div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 860, margin: "36px auto 0", fontSize: 12, color: "#6E6E73" }}>
          No email required to scan. We only ask for one when you're ready to save a board.
        </div>
      </div>
    </div>
  );
}
