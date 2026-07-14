import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBrand } from "../lib/brands";
import CertificateShare from "../components/CertificateShare";
import { computeGravityScore } from "../lib/gravityScore";

function rgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "102,102,102" : `${r},${g},${b}`;
}

function luma(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? 0 : (r * 299 + g * 587 + b * 114) / 1000;
}

function logoSources(website) {
  if (!website) return [];
  const d = website.replace(/^https?:\/\//, "").split("/")[0];
  return [
    `https://logo.clearbit.com/${d}`,
    `https://www.google.com/s2/favicons?domain=${d}&sz=256`,
  ];
}

function BrandLogo({ website, name, size = 100, radius = 20, pc }) {
  const [idx, setIdx] = useState(0);
  const sources = logoSources(website);
  const url = sources[idx] || null;
  const rnd = Math.round(size * 0.2);
  const imgSize = Math.round(size * 0.65);
  return (
    <div style={{
      width: size, height: size, background: "#fff", borderRadius: radius ?? rnd,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)`,
      flexShrink: 0, overflow: "hidden",
    }}>
      {url ? (
        <img src={url} onError={() => setIdx(i => i + 1)} alt={name}
          style={{ width: imgSize, height: imgSize, objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: size * 0.45, fontWeight: 900, color: pc, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
          {name?.charAt(0) || "?"}
        </span>
      )}
    </div>
  );
}

// "Why this score" — written deterministically from the same signals that
// produce the number, so the prose can never disagree with the score. It also
// says plainly what Gravity measures: the documented public identity in THIS
// profile, not a judgment of the business.
const SIGNAL_PHRASES = {
  "Mission": "a stated mission",
  "Vision": "a stated vision",
  "Core values (3+)": "committed core values",
  "Primary archetype": "a committed archetype",
  "Secondary archetype or named enemy": "a named enemy or secondary archetype",
  "Differentiation": "documented differentiation",
  "Tagline": "a signature line",
  "Elevator pitch": "an elevator pitch",
  "Do-say rules (2+)": "do-say messaging rules",
  "Don't-say rules (2+)": "don't-say rules",
  "Voice basics (2+ tone attributes)": "a defined voice",
  "Voice depth (4+ tone attributes)": "real voice depth",
  "Personality traits (3+)": "named personality traits",
  "Social or platform voice": "a social voice",
  "Full color system": "a complete color system",
  "Typography": "committed typography",
  "Photography direction": "a photography direction",
  "Audience or ICPs": "a defined audience",
  "Content pillars": "content pillars",
};

function listOut(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function ScoreRationale({ brand, ink }) {
  const { score, signals } = computeGravityScore(brand);
  const met = signals.filter((x) => x.met).map((x) => SIGNAL_PHRASES[x.label] || x.label.toLowerCase());
  const missing = signals.filter((x) => !x.met).map((x) => SIGNAL_PHRASES[x.label] || x.label.toLowerCase());
  const name = brand.brand_name || "This brand";

  // Preferred: the paragraph written in the brand's own documented voice
  // (voice-rationale fn, stored on the row with the score it described).
  // Only used while it still matches the live number; deterministic fallback
  // otherwise, so prose and score can never disagree.
  const stored = brand.brand_data?.scoreRationale;
  const voiceText = stored && stored.score === score && typeof stored.text === "string" ? stored.text : null;

  let fallback;
  if (score >= 90) fallback = `${name} holds a Gravity Score of ${score} — nearly every strategic signal is committed and pulling in the same direction.`;
  else if (score >= 70) fallback = `${name} carries a Gravity Score of ${score}. The spine of the identity is on record and coherent.`;
  else if (score >= 50) fallback = `${name} sits at a Gravity Score of ${score} — the essentials are documented, but much of the deeper system isn't on public record yet.`;
  else fallback = `${name} scores ${score} — only fragments of a documented identity are on record here.`;

  return (
    <section style={{ background: "#0a0a0a", borderBottom: "1px solid #101010", padding: "56px 48px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: `rgba(${rgb(ink || "#888888")},0.6)`, textTransform: "uppercase", marginBottom: 18 }}>
          {voiceText ? `The score of ${score}, in ${name}'s voice` : "Why this score"}
        </div>
        {voiceText ? (
          <p style={{ fontSize: 18, lineHeight: 1.8, color: "#d6d6d6", margin: 0, fontStyle: "italic" }}>
            &ldquo;{voiceText}&rdquo;
          </p>
        ) : (
          <p style={{ fontSize: 16.5, lineHeight: 1.75, color: "#c9c9c9", margin: 0 }}>
            {fallback}
            {met.length > 0 && <> On record: {listOut(met)}.</>}
            {missing.length > 0 && <> Not yet on record: {listOut(missing)}.</>}
          </p>
        )}
        <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "#5a5a5a", margin: "16px 0 0" }}>
          {voiceText && <>Written by BrandMD's voice engine in {name}'s documented voice — the same system behind Brand Check — not a statement by the company. {missing.length > 0 && <>Still uncharted: {listOut(missing)}. </>}</>}
          Gravity measures how much of a coherent, documented identity exists in this public
          profile — what the brand demonstrably commits to, not how successful the business is.
          Own this brand? <Link to="/builder" style={{ color: "#0071E3", textDecoration: "none" }}>Chart the missing pieces</Link> and the score follows.
        </p>
      </div>
    </section>
  );
}

export default function BrandProfile({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloneMsg, setCloneMsg] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getBrand(slug).then(d => { setData(d); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    if (!data?.brand) return;
    const b = data.brand;
    document.title = `${b.brand_name} — Brand Profile`;
    const ld = {
      "@context": "https://schema.org", "@type": "Organization",
      "name": b.brand_name, "url": b.website ? `https://${b.website}` : undefined,
      "slogan": b.tagline, "description": b.description,
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, [data]);

  const handleClone = () => {
    const b = data?.brand;
    if (!b) return;
    sessionStorage.setItem("brand-clone", JSON.stringify({
      brandName: b.brand_name, tagline: b.tagline, industry: b.industry,
      mission: b.mission, vision: b.vision, elevator: b.elevator,
      archetype: b.archetype, website: b.website,
      primaryColor: b.primary_color, secondaryColor: b.secondary_color, accentColor: b.accent_color,
      primaryFont: b.primary_font, bodyFont: b.body_font,
      toneAttributes: b.tone_attributes || [], brandPersonality: b.brand_personality || [],
      photoStyle: b.photo_style, socialPersonality: b.social_personality,
    }));
    setCloneMsg(true);
    setTimeout(() => navigate("/builder"), 600);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "2px solid #222", borderTopColor: "#444", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 13, color: "#333", letterSpacing: 2 }}>LOADING</div>
        </div>
      </div>
    );
  }

  if (!data?.brand) {
    return (
      <div style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#333", marginBottom: 16, letterSpacing: 2 }}>NOT FOUND</div>
          <Link to="/brands" style={{ color: "#555", textDecoration: "none", fontSize: 13 }}>← Back to Library</Link>
        </div>
      </div>
    );
  }

  const { brand, snapshots } = data;
  const { score: gravityScore } = computeGravityScore(brand);
  const pc = brand.primary_color || "#0071E3";
  const sc = brand.secondary_color || "#111";
  const ac = brand.accent_color || "#64D2FF";
  // Ink-safe accent for the dark editorial canvas: brands whose primary is
  // near-black (Apple, most luxury palettes) would otherwise paint their own
  // masthead invisible. Prefer the first brand color that actually reads on
  // black; starlight if the whole palette is dark.
  const pcInk = [pc, ac, brand.secondary_color].find((c) => c && luma(c) > 70) || "#F5F5F7";
  const heroLight = luma(pc) > 155;
  const heroText = heroLight ? "rgba(0,0,0,0.92)" : "#ffffff";
  const heroMuted = heroLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)";
  const personality = (brand.brand_personality || []).filter(Boolean);
  const tone = (brand.tone_attributes || []).filter(Boolean);

  // Try loading brand's actual fonts from Google Fonts
  const gFontParts = [];
  if (brand.primary_font) gFontParts.push(`family=${encodeURIComponent(brand.primary_font.trim())}:wght@400;700;900`);
  if (brand.body_font && brand.body_font !== brand.primary_font) gFontParts.push(`family=${encodeURIComponent(brand.body_font.trim())}:wght@400;600`);
  const brandFontUrl = gFontParts.length ? `https://fonts.googleapis.com/css2?${gFontParts.join("&")}&display=swap` : null;

  return (
    <div style={{ background: "#060606", color: "#f0ece3", fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>

      {/* Font Loads */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&display=swap" rel="stylesheet" />
      {brandFontUrl && <link href={brandFontUrl} rel="stylesheet" />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fadein { animation: fadeUp 0.9s ease both; }
        .fadein-2 { animation: fadeUp 1.1s ease 0.15s both; }
        .fadein-3 { animation: fadeUp 1.2s ease 0.3s both; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          COVER — full viewport, brand color, magazine masthead
          ═══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh",
        background: `linear-gradient(155deg, ${pc} 0%, rgba(${rgb(pc)},0.72) 45%, rgba(${rgb(pc)},0.12) 85%, #060606 100%)`,
        display: "flex", flexDirection: "column", position: "relative",
        overflow: "hidden",
      }}>
        {/* Large brand color circle — decorative */}
        <div style={{
          position: "absolute", right: "-15%", top: "5%",
          width: "55vw", height: "55vw", borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb(pc)},0.25) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        {/* Crosshatch texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "16px 16px", pointerEvents: "none",
        }} />

        {/* NAV */}
        <nav style={{ padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
          <Link to="/brands" style={{ fontSize: 11, color: heroMuted, textDecoration: "none", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = heroText}
            onMouseLeave={e => e.currentTarget.style.color = heroMuted}
          >← Brand Library</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {brand.is_verified && (
              <span style={{ fontSize: 10, fontWeight: 700, color: heroMuted, letterSpacing: 2, textTransform: "uppercase" }}>✓ Verified</span>
            )}
            <button onClick={handleClone} style={{
              padding: "9px 20px", borderRadius: 8, border: `1px solid ${heroLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}`,
              background: heroLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
              color: heroText, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              backdropFilter: "blur(12px)", transition: "all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = heroLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = heroLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
            >
              {cloneMsg ? "Opening builder…" : "Clone Board →"}
            </button>
          </div>
        </nav>

        {/* MASTHEAD CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 72px", position: "relative", zIndex: 10 }}>

          {/* Issue label */}
          <div className="fadein" style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: heroMuted, textTransform: "uppercase", marginBottom: 36 }}>
            Brand Identity Archive&nbsp;&nbsp;·&nbsp;&nbsp;{brand.industry || "Global Brand"}
            {brand.founded_year && <>&nbsp;&nbsp;·&nbsp;&nbsp;Est. {brand.founded_year}</>}
          </div>

          {/* Logo + Name horizontal */}
          <div className="fadein" style={{ display: "flex", alignItems: "flex-end", gap: 36, marginBottom: 24 }}>
            <BrandLogo website={brand.website} name={brand.brand_name} size={120} radius={22} pc={pc} />
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(72px, 12vw, 160px)",
              fontWeight: 900, color: heroText,
              lineHeight: 0.88, letterSpacing: "-4px",
              margin: 0, flex: 1, minWidth: 0,
            }}>
              {brand.brand_name}
            </h1>
          </div>

          {/* Tagline */}
          {brand.tagline && (
            <div className="fadein-2" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(16px, 2.4vw, 24px)",
              fontStyle: "italic", fontWeight: 700,
              color: heroMuted, marginBottom: 32,
              maxWidth: 760, lineHeight: 1.35,
              paddingLeft: 156, // indent past logo
            }}>
              "{brand.tagline}"
            </div>
          )}

          {/* Meta row */}
          <div className="fadein-3" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, paddingLeft: 156 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 8, background: "#0071E3",
              fontSize: 13, fontWeight: 700, color: "#FFFFFF",
            }}>
              Gravity Score: {gravityScore}
            </span>
            {brand.brand_valuation && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "7px 16px", borderRadius: 8,
                background: heroLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                fontSize: 13, fontWeight: 700, color: heroText,
              }}>
                <span style={{ color: "#D4AF37", fontSize: 11 }}>◆</span>
                {brand.brand_valuation}
              </span>
            )}
            {brand.archetype && (
              <span style={{ padding: "7px 16px", borderRadius: 8, background: heroLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)", fontSize: 11, fontWeight: 700, color: heroText, letterSpacing: 0.5, backdropFilter: "blur(8px)" }}>
                {brand.archetype}
              </span>
            )}
            {brand.country && (
              <span style={{ padding: "7px 16px", borderRadius: 8, background: heroLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)", fontSize: 11, fontWeight: 600, color: heroMuted }}>
                {brand.country}
              </span>
            )}
            {brand.website && (
              <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <span style={{ padding: "7px 16px", borderRadius: 8, background: heroLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)", fontSize: 11, fontWeight: 600, color: heroMuted, transition: "all 0.2s" }}>
                  ↗ {brand.website}
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: heroMuted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
          ↓ Scroll
        </div>
      </section>

      {/* ══════════════════════════
          COLOR BAR (16px)
          ══════════════════════════ */}
      <div style={{ display: "flex", height: 16 }}>
        <div style={{ flex: 1, background: pc }} />
        <div style={{ flex: 1, background: sc }} />
        <div style={{ flex: 1, background: ac }} />
      </div>

      {/* WHY THIS SCORE — the number, explained, before anything else */}
      <ScoreRationale brand={brand} ink={pcInk} />

      {/* ══════════════════════════════════════════
          THE PALETTE — full-width swatch columns
          ══════════════════════════════════════════ */}
      <section style={{ background: "#060606" }}>
        <div style={{ padding: "72px 48px 0", display: "flex", alignItems: "baseline", gap: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase" }}>The Palette</div>
          <div style={{ flex: 1, height: 1, background: "#111" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 32 }}>
          {[
            { label: "Primary", hex: pc },
            { label: "Secondary", hex: sc },
            { label: "Accent", hex: ac },
          ].map(({ label, hex }, i) => (
            <div key={label}>
              {/* Tall swatch */}
              <div style={{
                height: "35vw", maxHeight: 420, minHeight: 260,
                background: hex,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "28px 32px",
                position: "relative", overflow: "hidden",
              }}>
                {/* Subtle inner radial */}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)`, pointerEvents: "none" }} />
                <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, textTransform: "uppercase", color: luma(hex) > 155 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)" }}>
                  {label}
                </div>
                {/* Small logo watermark on primary swatch */}
                {i === 0 && (
                  <div style={{ position: "absolute", right: 20, bottom: 20, opacity: 0.15 }}>
                    <BrandLogo website={brand.website} name={brand.brand_name} size={64} radius={12} pc={luma(hex) > 155 ? "#000" : "#fff"} />
                  </div>
                )}
              </div>
              {/* Color info */}
              <div style={{ padding: "28px 32px", background: "#080808", borderRight: i < 2 ? "1px solid #0f0f0f" : "none" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: hex, marginBottom: 8, letterSpacing: "-0.5px" }}>
                  {hex.toUpperCase()}
                </div>
                <div style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 1.5, marginBottom: 4 }}>
                  RGB&nbsp;&nbsp;{rgb(hex).replace(/,/g, ", ")}
                </div>
                <div style={{ fontSize: 10, color: "#222" }}>
                  {luma(hex) > 155 ? "Light" : "Dark"} · {label} Brand Color
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          MISSION — full-width editorial pull quote
          ════════════════════════════════════════ */}
      {(brand.mission || brand.elevator) && (
        <section style={{
          padding: "120px 48px",
          background: `linear-gradient(180deg, rgba(${rgb(pcInk)},0.06) 0%, rgba(${rgb(pcInk)},0.03) 100%)`,
          borderTop: `1px solid rgba(${rgb(pcInk)},0.1)`,
          borderBottom: `1px solid rgba(${rgb(pcInk)},0.1)`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Giant decorative quote */}
          <div style={{
            position: "absolute", top: -40, left: 32,
            fontSize: "28vw", lineHeight: 1,
            color: `rgba(${rgb(pcInk)},0.05)`,
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900, userSelect: "none", pointerEvents: "none",
          }}>"</div>

          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: `rgba(${rgb(pcInk)},0.5)`, textTransform: "uppercase", marginBottom: 40 }}>
              {brand.mission ? "Mission" : "Elevator Pitch"}
            </div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(22px, 3.5vw, 44px)",
              fontStyle: "italic", fontWeight: 700,
              color: "#f0ece3", lineHeight: 1.38, marginBottom: 48,
              letterSpacing: "-0.5px",
            }}>
              {brand.mission || brand.elevator}
            </div>
            {/* Attribution */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 40, height: 1, background: `rgba(${rgb(pcInk)},0.3)` }} />
              <BrandLogo website={brand.website} name={brand.brand_name} size={28} radius={6} pc={pcInk} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>
                {brand.brand_name}
                {brand.archetype && <span style={{ color: `rgba(${rgb(pcInk)},0.6)` }}>&nbsp;·&nbsp;{brand.archetype}</span>}
              </div>
              <div style={{ width: 40, height: 1, background: `rgba(${rgb(pcInk)},0.3)` }} />
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          ARCHETYPE STATEMENT
          ════════════════════════════════════════ */}
      {brand.archetype && (
        <section style={{ background: "#060606", padding: "0", overflow: "hidden" }}>
          <div style={{
            padding: "100px 48px",
            background: `linear-gradient(90deg, rgba(${rgb(pcInk)},0.04) 0%, transparent 100%)`,
            borderLeft: `4px solid ${pcInk}`,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase", marginBottom: 20 }}>Brand Archetype</div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(56px, 9vw, 120px)",
              fontWeight: 900, color: pcInk,
              lineHeight: 0.9, letterSpacing: "-2px",
              marginBottom: 24,
            }}>
              {brand.archetype.toUpperCase()}
            </div>
            {/* Personality traits as spaced large words */}
            {personality.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", marginTop: 32 }}>
                {personality.map((p, i) => (
                  <span key={p} style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 24, fontStyle: "italic",
                    color: i === 0 ? `rgba(${rgb(pcInk)},0.9)` : i === 1 ? `rgba(${rgb(pcInk)},0.65)` : `rgba(${rgb(pcInk)},0.4)`,
                    fontWeight: 700, letterSpacing: "-0.3px",
                  }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          TYPOGRAPHY SPECIMEN
          ════════════════════════════════════════ */}
      {(brand.primary_font || brand.body_font) && (
        <section style={{ background: "#080808", padding: "80px 48px", borderTop: "1px solid #0f0f0f" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 56 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase" }}>Type System</div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: brand.body_font && brand.body_font !== brand.primary_font ? "1fr 1fr" : "1fr", gap: 48 }}>
            {brand.primary_font && (
              <div style={{ padding: "48px", background: "#0c0c0c", borderRadius: 16, border: `1px solid rgba(${rgb(pcInk)},0.1)`, overflow: "hidden" }}>
                <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: `rgba(${rgb(pcInk)},0.5)`, textTransform: "uppercase", marginBottom: 32 }}>Display · Heading</div>
                <div style={{
                  fontFamily: `'${brand.primary_font}', 'Playfair Display', Georgia, serif`,
                  fontSize: "clamp(64px, 9vw, 110px)",
                  fontWeight: 900, color: pcInk, lineHeight: 0.88,
                  letterSpacing: "-3px", marginBottom: 32,
                }}>Aa</div>
                <div style={{
                  fontFamily: `'${brand.primary_font}', Georgia, serif`,
                  fontSize: 18, fontWeight: 400, color: "#555",
                  lineHeight: 1.5, marginBottom: 28, letterSpacing: "0.3px",
                }}>ABCDEFGHIJKLM<br />NOPQRSTUVWXYZ<br />0 1 2 3 4 5 6 7 8 9</div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f0ece3", marginBottom: 4, fontFamily: `'${brand.primary_font}', sans-serif` }}>{brand.primary_font}</div>
                  <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>Headlines · Display · Brand Voice</div>
                </div>
              </div>
            )}
            {brand.body_font && brand.body_font !== brand.primary_font && (
              <div style={{ padding: "48px", background: "#0c0c0c", borderRadius: 16, border: "1px solid #1a1a1a", overflow: "hidden" }}>
                <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase", marginBottom: 32 }}>Body · Interface</div>
                <div style={{
                  fontFamily: `'${brand.body_font}', 'DM Sans', sans-serif`,
                  fontSize: "clamp(48px, 7vw, 80px)",
                  fontWeight: 700, color: "#c8c4bb", lineHeight: 0.88,
                  letterSpacing: "-2px", marginBottom: 32,
                }}>Aa</div>
                <div style={{
                  fontFamily: `'${brand.body_font}', sans-serif`,
                  fontSize: 15, color: "#555", lineHeight: 1.65, marginBottom: 28,
                }}>
                  The quick brown fox jumps over the lazy dog. A brand voice that connects, compels, and converts through every word and interaction.
                </div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f0ece3", marginBottom: 4, fontFamily: `'${brand.body_font}', sans-serif` }}>{brand.body_font}</div>
                  <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>Paragraphs · UI · Long-form Copy</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          BRAND VOICE / TONE
          ════════════════════════════════════════ */}
      {tone.length > 0 && (
        <section style={{ padding: "80px 48px", background: "#060606", borderTop: "1px solid #0d0d0d" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 56 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase" }}>Brand Voice</div>
            <div style={{ flex: 1, height: 1, background: "#0f0f0f" }} />
          </div>
          {/* Tone as a massive typographic statement */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 32px", marginBottom: 40 }}>
            {tone.map((t, i) => (
              <div key={t} style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: `clamp(${Math.max(32, 56 - i * 8)}px, ${5 - i * 0.8}vw, ${Math.max(48, 80 - i * 14)}px)`,
                fontWeight: i === 0 ? 900 : 700,
                fontStyle: i % 2 === 1 ? "italic" : "normal",
                color: i === 0 ? pcInk : i === 1 ? `rgba(${rgb(pcInk)},0.55)` : `rgba(${rgb(pcInk)},0.3)`,
                lineHeight: 1.05, letterSpacing: "-1px",
              }}>{t}</div>
            ))}
          </div>

          {/* Social personality as editorial block */}
          {brand.social_personality && (
            <div style={{ maxWidth: 640, padding: "32px 40px", background: "#0a0a0a", borderRadius: 14, border: `1px solid rgba(${rgb(pcInk)},0.12)`, borderLeft: `4px solid ${pcInk}` }}>
              <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: `rgba(${rgb(pcInk)},0.4)`, textTransform: "uppercase", marginBottom: 14 }}>Social Personality</div>
              <div style={{ fontSize: 16, color: "#c8c4bb", lineHeight: 1.65, fontStyle: "italic" }}>"{brand.social_personality}"</div>
            </div>
          )}
        </section>
      )}

      {/* ════════════════════════════════════════
          BRAND IDENTITY — editorial text blocks
          ════════════════════════════════════════ */}
      {(brand.description || brand.vision || brand.elevator) && (
        <section style={{ padding: "80px 48px", background: "#080808", borderTop: "1px solid #0d0d0d" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 56 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase" }}>Brand Identity</div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
          </div>
          <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: 48 }}>
            {brand.description && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase", marginBottom: 18 }}>About</div>
                <div style={{ fontSize: 18, color: "#888", lineHeight: 1.75 }}>{brand.description}</div>
              </div>
            )}
            {brand.vision && (
              <div style={{ paddingLeft: 28, borderLeft: `2px solid rgba(${rgb(pcInk)},0.2)` }}>
                <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: `rgba(${rgb(pcInk)},0.35)`, textTransform: "uppercase", marginBottom: 18 }}>Vision</div>
                <div style={{ fontSize: 20, color: "#c8c4bb", lineHeight: 1.65, fontStyle: "italic" }}>{brand.vision}</div>
              </div>
            )}
            {brand.elevator && !brand.mission && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase", marginBottom: 18 }}>In a Sentence</div>
                <div style={{ fontSize: 18, color: "#888", lineHeight: 1.75 }}>{brand.elevator}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          PHOTO DIRECTION
          ════════════════════════════════════════ */}
      {brand.photo_style && (
        <section style={{ padding: "80px 48px", background: "#060606", borderTop: "1px solid #0d0d0d" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, maxWidth: 1100 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase", marginBottom: 24 }}>Photo Direction</div>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 28, fontStyle: "italic", fontWeight: 700,
                color: "#c8c4bb", lineHeight: 1.4, marginBottom: 20,
              }}>{brand.photo_style}</div>
            </div>
            {/* Visual moodboard placeholder — branded color blocks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6 }}>
              <div style={{ borderRadius: 10, background: pc, aspectRatio: "1" }} />
              <div style={{ borderRadius: 10, background: `rgba(${rgb(pcInk)},0.4)`, aspectRatio: "1" }} />
              <div style={{ borderRadius: 10, background: sc, aspectRatio: "1" }} />
              <div style={{ borderRadius: 10, background: `rgba(${rgb(ac)},0.6)`, aspectRatio: "1" }} />
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          BRAND EVOLUTION TIMELINE
          ════════════════════════════════════════ */}
      {snapshots?.length > 0 && (
        <section style={{ padding: "80px 48px", background: "#080808", borderTop: "1px solid #0d0d0d" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 64 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase" }}>Evolution</div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
          </div>
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 80, top: 8, bottom: 0, width: 1, background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)" }} />
            {snapshots.map((snap, i) => (
              <div key={snap.year} style={{ display: "flex", gap: 40, marginBottom: 56, position: "relative" }}>
                {/* Year */}
                <div style={{ width: 72, textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22, fontWeight: 800, color: i === 0 ? pcInk : "#2a2a2a",
                    letterSpacing: "-0.5px",
                  }}>{snap.year}</div>
                </div>
                {/* Dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: i === 0 ? pcInk : "#1a1a1a",
                  border: `2px solid ${i === 0 ? pcInk : "#222"}`,
                  flexShrink: 0, marginTop: 5, position: "relative", zIndex: 1,
                }} />
                {/* Content */}
                <div style={{ flex: 1 }}>
                  {snap.change_notes && (
                    <div style={{ fontSize: 14, color: "#555", fontStyle: "italic", marginBottom: 14, lineHeight: 1.55 }}>
                      {snap.change_notes}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {snap.snapshot_data?.primaryColor && (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "#0c0c0c", borderRadius: 6, border: "1px solid #141414" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: snap.snapshot_data.primaryColor }} />
                        <span style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>{snap.snapshot_data.primaryColor}</span>
                      </div>
                    )}
                    {snap.snapshot_data?.archetype && (
                      <span style={{ fontSize: 10, color: "#444", background: "#0c0c0c", border: "1px solid #141414", borderRadius: 6, padding: "5px 12px" }}>
                        {snap.snapshot_data.archetype}
                      </span>
                    )}
                    {snap.snapshot_data?.primaryFont && (
                      <span style={{ fontSize: 10, color: "#444", background: "#0c0c0c", border: "1px solid #141414", borderRadius: 6, padding: "5px 12px" }}>
                        {snap.snapshot_data.primaryFont}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          SHARE THIS CERTIFICATE — the distribution engine
          ════════════════════════════════════════ */}
      <section style={{ padding: "80px 48px", background: "#060606", borderTop: "1px solid #0d0d0d" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: "#2a2a2a", textTransform: "uppercase" }}>Share This Certificate</div>
          <div style={{ flex: 1, height: 1, background: "#111" }} />
        </div>
        <div style={{ maxWidth: 640 }}>
          <CertificateShare brand={brand} url={`/brands/${slug}`} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          CLOSING SPREAD — clone CTA
          ════════════════════════════════════════ */}
      <section style={{
        minHeight: "60vh",
        background: `linear-gradient(155deg, ${pcInk} 0%, rgba(${rgb(pcInk)},0.65) 50%, rgba(${rgb(pcInk)},0.1) 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "100px 48px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "16px 16px", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ marginBottom: 40, position: "relative", zIndex: 1 }}>
          <BrandLogo website={brand.website} name={brand.brand_name} size={100} radius={20} pc={pcInk} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 800, color: heroMuted, textTransform: "uppercase", marginBottom: 20 }}>Build Like</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(52px, 9vw, 110px)",
            fontWeight: 900, color: heroText,
            lineHeight: 0.9, letterSpacing: "-3px", marginBottom: 28,
          }}>{brand.brand_name}</div>
          <div style={{ fontSize: 15, color: heroMuted, marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
            Clone this brand board into your workspace and build your own identity with the same framework.
          </div>

          {/* Color preview */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 36 }}>
            {[pc, sc, ac].map((c, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: c, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} />
            ))}
          </div>

          <button onClick={handleClone} style={{
            padding: "16px 44px", borderRadius: 12, border: "none",
            background: heroLight ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)",
            color: heroLight ? "#fff" : "#111",
            fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            transition: "transform 0.2s, box-shadow 0.2s",
            opacity: cloneMsg ? 0.7 : 1, letterSpacing: "-0.2px",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.35)"; }}
          >
            {cloneMsg ? "Opening builder…" : `Clone ${brand.brand_name}'s Board →`}
          </button>
        </div>
      </section>

      {/* Footer strip */}
      <div style={{ padding: "20px 48px", background: "#040404", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/brands" style={{ fontSize: 10, color: "#2a2a2a", textDecoration: "none", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>← Brand Library</Link>
        <div style={{ fontSize: 10, color: "#1a1a1a", letterSpacing: 2 }}>brandmd.space</div>
        <Link to="/builder" style={{ fontSize: 10, color: "#2a2a2a", textDecoration: "none", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>Build Your Brand →</Link>
      </div>
    </div>
  );
}
