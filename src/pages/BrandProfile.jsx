import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBrand } from "../lib/brands";

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

function getBrandLogo(website) {
  if (!website) return null;
  const domain = website.replace(/^https?:\/\//, "").split("/")[0];
  return `https://logo.clearbit.com/${domain}`;
}

function Chip({ label, color = "#666", outline }) {
  const r = rgb(color);
  return (
    <span style={{
      display: "inline-block", padding: "5px 14px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
      color: outline ? color : (luma(color) > 150 ? "#000" : "#fff"),
      background: outline ? `rgba(${r},0.1)` : color,
      border: outline ? `1px solid rgba(${r},0.35)` : "none",
      margin: "3px 4px 3px 0",
    }}>{label}</span>
  );
}

function Section({ title, children, pc }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: pc ? `rgba(${rgb(pc)},0.5)` : "#444",
        letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20,
        paddingBottom: 12, borderBottom: `1px solid rgba(${rgb(pc || "#333")},0.15)`,
      }}>{title}</div>
      {children}
    </div>
  );
}

function TextField({ label, value, pc }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 15, color: "#c8c4bb", lineHeight: 1.7, borderLeft: `3px solid rgba(${rgb(pc || "#333")},0.3)`, paddingLeft: 16 }}>{value}</div>
    </div>
  );
}

function SnapshotTimeline({ snapshots, pc }) {
  if (!snapshots?.length) return null;
  return (
    <div>
      {snapshots.map((snap, i) => (
        <div key={snap.year} style={{ display: "flex", gap: 20, marginBottom: 32, position: "relative" }}>
          <div style={{ width: 48, flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: pc || "#555" }}>{snap.year}</div>
          </div>
          <div style={{ width: 1, background: i < snapshots.length - 1 ? `rgba(${rgb(pc || "#333")},0.2)` : "transparent", position: "absolute", left: 62, top: 20, bottom: -32 }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: pc || "#2a2a2a", border: `2px solid rgba(${rgb(pc || "#333")},0.5)`, flexShrink: 0, marginTop: 3, position: "relative", zIndex: 1 }} />
          <div style={{ flex: 1 }}>
            {snap.change_notes && (
              <div style={{ fontSize: 11, color: "#555", marginBottom: 8, fontStyle: "italic" }}>{snap.change_notes}</div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {snap.snapshot_data?.primaryColor && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: snap.snapshot_data.primaryColor }} />
                  <span style={{ fontSize: 10, color: "#444" }}>{snap.snapshot_data.primaryColor}</span>
                </div>
              )}
              {snap.snapshot_data?.archetype && (
                <span style={{ fontSize: 10, color: "#555", background: "#131313", border: "1px solid #222", borderRadius: 4, padding: "2px 8px" }}>
                  {snap.snapshot_data.archetype}
                </span>
              )}
              {snap.snapshot_data?.primaryFont && (
                <span style={{ fontSize: 10, color: "#555", background: "#131313", border: "1px solid #222", borderRadius: 4, padding: "2px 8px" }}>
                  {snap.snapshot_data.primaryFont}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BrandProfile({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloneMsg, setCloneMsg] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getBrand(slug).then(d => { setData(d); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    if (!data?.brand) return;
    const b = data.brand;
    document.title = `${b.brand_name} — Brand Profile | Brand Library`;
    const ld = {
      "@context": "https://schema.org", "@type": "Organization",
      "name": b.brand_name, "url": b.website ? `https://${b.website}` : undefined,
      "slogan": b.tagline, "description": b.description, "foundingDate": b.founded_year?.toString(),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
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
      toneAttributes: b.tone_attributes || ["", "", ""],
      brandPersonality: b.brand_personality || ["", "", "", ""],
      photoStyle: b.photo_style, socialPersonality: b.social_personality,
    }));
    setCloneMsg(true);
    setTimeout(() => navigate("/builder"), 600);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", color: "#333" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◌</div>
          <div style={{ fontSize: 14 }}>Loading brand profile...</div>
        </div>
      </div>
    );
  }

  if (!data?.brand) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", color: "#444" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◌</div>
          <div>Brand not found</div>
          <Link to="/brands" style={{ marginTop: 16, display: "inline-block", color: "#666", textDecoration: "none", fontSize: 13 }}>← Back to Library</Link>
        </div>
      </div>
    );
  }

  const { brand, snapshots } = data;
  const pc = brand.primary_color || "#e94560";
  const sc = brand.secondary_color || "#111";
  const ac = brand.accent_color || "#f39c12";
  const headerLight = luma(pc) > 150;
  const heroText = headerLight ? "rgba(0,0,0,0.88)" : "#fff";
  const heroSubText = headerLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)";
  const logoUrl = !logoErr ? getBrandLogo(brand.website) : null;

  return (
    <div style={{ background: "#080808", color: "#f0ece3", fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* IMMERSIVE HERO — full brand color */}
      <div style={{ background: `linear-gradient(160deg, ${pc} 0%, rgba(${rgb(pc)},0.55) 60%, rgba(${rgb(pc)},0.08) 100%)`, borderBottom: `1px solid rgba(${rgb(pc)},0.2)` }}>
        {/* Nav strip */}
        <div style={{ padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/brands" style={{ fontSize: 12, color: heroSubText, textDecoration: "none", fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.color = heroText}
            onMouseLeave={e => e.currentTarget.style.color = heroSubText}
          >← Brand Library</Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {brand.is_verified && (
              <span style={{ fontSize: 10, fontWeight: 700, color: headerLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)", letterSpacing: 1.5, textTransform: "uppercase" }}>✓ Verified</span>
            )}
            <button onClick={handleClone} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: headerLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
              color: heroText, fontSize: 12, fontWeight: 700, backdropFilter: "blur(8px)",
              opacity: cloneMsg ? 0.6 : 1, transition: "all 0.2s",
            }}>
              {cloneMsg ? "Opening builder..." : `Clone Board →`}
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ padding: "32px 40px 60px", display: "flex", gap: 40, alignItems: "flex-start", maxWidth: 1100 }}>
          {/* Logo */}
          <div style={{ flexShrink: 0, marginTop: 4 }}>
            <div style={{
              width: 100, height: 100, background: "#fff", borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 12px 40px rgba(0,0,0,0.35)`, overflow: "hidden",
            }}>
              {logoUrl ? (
                <img src={logoUrl} onError={() => setLogoErr(true)} alt={brand.brand_name}
                  style={{ width: 68, height: 68, objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 44, fontWeight: 900, color: pc, fontFamily: "sans-serif" }}>
                  {brand.brand_name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* Brand identity text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {brand.industry && (
              <div style={{ fontSize: 11, fontWeight: 700, color: heroSubText, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>
                {brand.industry}{brand.founded_year ? ` · Est. ${brand.founded_year}` : ""}
              </div>
            )}
            <h1 style={{ fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 800, color: heroText, lineHeight: 0.93, letterSpacing: "-3px", margin: "0 0 18px" }}>
              {brand.brand_name}
            </h1>
            {brand.tagline && (
              <div style={{ fontSize: "clamp(15px, 2vw, 20px)", color: heroSubText, fontStyle: "italic", maxWidth: 640, lineHeight: 1.4, marginBottom: 20 }}>
                "{brand.tagline}"
              </div>
            )}

            {/* Valuation */}
            {brand.brand_valuation && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 8, background: headerLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", marginBottom: 20 }}>
                <span style={{ fontSize: 13, color: "#D4AF37" }}>◆</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: heroText }}>{brand.brand_valuation}</span>
              </div>
            )}

            {/* Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {brand.archetype && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: headerLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.14)", color: heroText, backdropFilter: "blur(8px)" }}>
                  {brand.archetype}
                </span>
              )}
              {brand.country && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 20, background: headerLight ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.09)", color: heroSubText }}>
                  {brand.country}
                </span>
              )}
              {brand.website && (
                <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 20, background: headerLight ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.09)", color: heroSubText }}>
                    ↗ {brand.website}
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BRAND COLOR BAR */}
      <div style={{ display: "flex", height: 8 }}>
        <div style={{ flex: 1, background: pc }} />
        <div style={{ flex: 1, background: sc }} />
        <div style={{ flex: 1, background: ac }} />
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 40px 100px" }}>

        {/* COLOR PALETTE */}
        <Section title="Color Palette" pc={pc}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[{ label: "Primary", color: pc }, { label: "Secondary", color: sc }, { label: "Accent", color: ac }].map(({ label, color }) => (
              <div key={label}>
                <div style={{ height: 100, borderRadius: 14, background: color, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-end", padding: "10px 14px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: luma(color) > 150 ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)", letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
                </div>
                <div style={{ fontSize: 14, color: "#888", fontFamily: "monospace", marginBottom: 2 }}>{color}</div>
                <div style={{ fontSize: 10, color: "#3a3a3a" }}>RGB {rgb(color).split(",").join(", ")}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* TYPOGRAPHY */}
        {(brand.primary_font || brand.body_font) && (
          <Section title="Typography" pc={pc}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {brand.primary_font && (
                <div style={{ padding: "24px", background: "#0d0d0d", borderRadius: 14, border: `1px solid rgba(${rgb(pc)},0.15)` }}>
                  <div style={{ fontSize: 10, color: `rgba(${rgb(pc)},0.6)`, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Display Font</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: pc, lineHeight: 1, marginBottom: 10, letterSpacing: "-1px" }}>Aa</div>
                  <div style={{ fontSize: 15, color: "#f0ece3", fontWeight: 700, marginBottom: 4 }}>{brand.primary_font}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>Headlines · Display · Brand voice</div>
                </div>
              )}
              {brand.body_font && (
                <div style={{ padding: "24px", background: "#0d0d0d", borderRadius: 14, border: "1px solid #1a1a1a" }}>
                  <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Body Font</div>
                  <div style={{ fontSize: 24, color: "#c8c4bb", lineHeight: 1.4, marginBottom: 10 }}>Aa Bb Cc 123</div>
                  <div style={{ fontSize: 15, color: "#f0ece3", fontWeight: 700, marginBottom: 4 }}>{brand.body_font}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>Paragraphs · UI · Long-form copy</div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* BRAND PERSONALITY */}
        {(brand.tone_attributes?.length || brand.brand_personality?.length) && (
          <Section title="Brand Personality" pc={pc}>
            {brand.tone_attributes?.filter(Boolean).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Tone</div>
                <div>{brand.tone_attributes.filter(Boolean).map(t => <Chip key={t} label={t} color={pc} outline />)}</div>
              </div>
            )}
            {brand.brand_personality?.filter(Boolean).length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Personality</div>
                <div>{brand.brand_personality.filter(Boolean).map(t => <Chip key={t} label={t} color="#333" outline />)}</div>
              </div>
            )}
          </Section>
        )}

        {/* BRAND IDENTITY */}
        {(brand.description || brand.mission || brand.vision || brand.elevator) && (
          <Section title="Brand Identity" pc={pc}>
            <TextField label="About" value={brand.description} pc={pc} />
            <TextField label="Elevator Pitch" value={brand.elevator} pc={pc} />
            <TextField label="Mission" value={brand.mission} pc={pc} />
            <TextField label="Vision" value={brand.vision} pc={pc} />
          </Section>
        )}

        {/* VISUAL + DIGITAL */}
        {(brand.photo_style || brand.social_personality) && (
          <Section title="Visual & Digital Identity" pc={pc}>
            <TextField label="Photo Direction" value={brand.photo_style} pc={pc} />
            <TextField label="Social Media Personality" value={brand.social_personality} pc={pc} />
          </Section>
        )}

        {/* EVOLUTION */}
        {snapshots?.length > 0 && (
          <Section title="Brand Evolution" pc={pc}>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 24, lineHeight: 1.6 }}>
              How {brand.brand_name}'s identity has evolved year over year.
            </div>
            <SnapshotTimeline snapshots={snapshots} pc={pc} />
          </Section>
        )}

        {/* CTA */}
        <div style={{ padding: "40px", background: "#0d0d0d", borderRadius: 18, border: `1px solid rgba(${rgb(pc)},0.2)`, textAlign: "center", background: `linear-gradient(135deg, rgba(${rgb(pc)},0.06) 0%, #0d0d0d 100%)` }}>
          {/* Mini brand preview */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
            {[pc, sc, ac].map((c, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f0ece3", marginBottom: 8, letterSpacing: "-0.5px" }}>
            Build like {brand.brand_name}
          </div>
          <div style={{ fontSize: 14, color: "#555", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Clone this brand's board into your workspace and customize it for your own brand.
          </div>
          <button onClick={handleClone} style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${pc}, rgba(${rgb(pc)},0.75))`,
            color: luma(pc) > 150 ? "#000" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            opacity: cloneMsg ? 0.6 : 1, transition: "opacity 0.2s",
            fontFamily: "inherit", boxShadow: `0 8px 24px rgba(${rgb(pc)},0.35)`,
          }}>
            {cloneMsg ? "Opening builder..." : `Clone ${brand.brand_name}'s Board →`}
          </button>
        </div>
      </div>
    </div>
  );
}
