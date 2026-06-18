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
    }}>
      {label}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#444", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #1a1a1a" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function TextField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 15, color: "#c8c4bb", lineHeight: 1.7 }}>{value}</div>
    </div>
  );
}

function SnapshotTimeline({ snapshots }) {
  if (!snapshots?.length) return null;
  return (
    <div>
      {snapshots.map((snap, i) => (
        <div key={snap.year} style={{ display: "flex", gap: 20, marginBottom: 32, position: "relative" }}>
          <div style={{ width: 48, flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#555" }}>{snap.year}</div>
          </div>
          <div style={{ width: 1, background: i < snapshots.length - 1 ? "#1e1e1e" : "transparent", position: "absolute", left: 62, top: 20, bottom: -32 }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2a2a2a", border: "2px solid #444", flexShrink: 0, marginTop: 3, position: "relative", zIndex: 1 }} />
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
  const navigate = useNavigate();

  useEffect(() => {
    getBrand(slug).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!data?.brand) return;
    const b = data.brand;
    document.title = `${b.brand_name} — Brand Profile | Brand Library`;

    const ld = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": b.brand_name,
      "url": b.website ? `https://${b.website}` : undefined,
      "slogan": b.tagline,
      "description": b.description,
      "foundingDate": b.founded_year?.toString(),
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
    const cloneData = {
      brandName: b.brand_name, tagline: b.tagline, industry: b.industry,
      mission: b.mission, vision: b.vision, elevator: b.elevator,
      archetype: b.archetype, website: b.website,
      primaryColor: b.primary_color, secondaryColor: b.secondary_color, accentColor: b.accent_color,
      primaryFont: b.primary_font, bodyFont: b.body_font,
      toneAttributes: b.tone_attributes || ["", "", ""],
      brandPersonality: b.brand_personality || ["", "", "", ""],
      photoStyle: b.photo_style, socialPersonality: b.social_personality,
    };
    sessionStorage.setItem("brand-clone", JSON.stringify(cloneData));
    setCloneMsg(true);
    setTimeout(() => navigate("/"), 600);
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
  const heroText = luma(pc) > 150 ? "#000" : "#fff";

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0ece3", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* HERO */}
      <div style={{
        background: `linear-gradient(160deg, rgba(${rgb(pc)},0.25) 0%, rgba(${rgb(pc)},0.05) 50%, transparent 100%), #0a0a0a`,
        borderBottom: `1px solid rgba(${rgb(pc)},0.15)`,
      }}>
        {/* Nav */}
        <div style={{ padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/brands" style={{ fontSize: 12, color: "#555", textDecoration: "none", transition: "color 0.18s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#aaa"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
          >
            ← Brand Library
          </Link>
          {brand.is_verified && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#D4AF37", letterSpacing: 1.5, textTransform: "uppercase" }}>
              ✓ Verified Brand
            </span>
          )}
        </div>

        {/* Brand name + tagline */}
        <div style={{ padding: "20px 40px 60px", maxWidth: 900 }}>
          {brand.industry && (
            <div style={{ fontSize: 11, fontWeight: 700, color: `rgba(${rgb(pc)},0.7)`, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
              {brand.industry}{brand.founded_year ? ` · Est. ${brand.founded_year}` : ""}
            </div>
          )}
          <h1 style={{ fontSize: "clamp(48px, 8vw, 110px)", fontWeight: 800, color: "#f0ece3", lineHeight: 0.95, letterSpacing: "-3px", margin: "0 0 20px" }}>
            {brand.brand_name}
          </h1>
          {brand.tagline && (
            <div style={{ fontSize: "clamp(16px, 2.5vw, 24px)", color: `rgba(${rgb(pc)},0.9)`, fontWeight: 400, fontStyle: "italic", maxWidth: 700, lineHeight: 1.4 }}>
              "{brand.tagline}"
            </div>
          )}
          {/* Chips row */}
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {brand.archetype && <Chip label={brand.archetype} color={pc} />}
            {brand.country && <Chip label={brand.country} color="#333" outline />}
            {brand.website && (
              <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Chip label={`↗ ${brand.website}`} color="#333" outline />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 40px 100px" }}>

        {/* COLOR PALETTE */}
        <Section title="Color Palette">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Primary", color: pc },
              { label: "Secondary", color: sc },
              { label: "Accent", color: ac },
            ].map(({ label, color }) => (
              <div key={label}>
                <div style={{
                  height: 80, borderRadius: 12, background: color, marginBottom: 10,
                  border: "1px solid rgba(255,255,255,0.06)", position: "relative",
                  display: "flex", alignItems: "flex-end", padding: "8px 12px",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: luma(color) > 150 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#666", fontFamily: "monospace" }}>{color}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ARCHETYPE + TONE */}
        {(brand.tone_attributes?.length || brand.brand_personality?.length) && (
          <Section title="Brand Personality">
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

        {/* IDENTITY */}
        {(brand.description || brand.mission || brand.vision || brand.elevator) && (
          <Section title="Brand Identity">
            <TextField label="About" value={brand.description} />
            <TextField label="Elevator Pitch" value={brand.elevator} />
            <TextField label="Mission" value={brand.mission} />
            <TextField label="Vision" value={brand.vision} />
          </Section>
        )}

        {/* TYPOGRAPHY */}
        {(brand.primary_font || brand.body_font) && (
          <Section title="Typography">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {brand.primary_font && (
                <div style={{ padding: "20px", background: "#0e0e0e", borderRadius: 12, border: "1px solid #1a1a1a" }}>
                  <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Display</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f0ece3", marginBottom: 6 }}>Aa</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{brand.primary_font}</div>
                </div>
              )}
              {brand.body_font && (
                <div style={{ padding: "20px", background: "#0e0e0e", borderRadius: 12, border: "1px solid #1a1a1a" }}>
                  <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Body</div>
                  <div style={{ fontSize: 20, color: "#f0ece3", marginBottom: 6 }}>Aa Bb Cc</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{brand.body_font}</div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* VISUAL + DIGITAL */}
        {(brand.photo_style || brand.social_personality) && (
          <Section title="Visual & Digital Identity">
            <TextField label="Photo Direction" value={brand.photo_style} />
            <TextField label="Social Media Personality" value={brand.social_personality} />
          </Section>
        )}

        {/* EVOLUTION */}
        {snapshots?.length > 0 && (
          <Section title="Brand Evolution">
            <div style={{ fontSize: 13, color: "#444", marginBottom: 24, lineHeight: 1.6 }}>
              How {brand.brand_name}'s identity has evolved year over year.
            </div>
            <SnapshotTimeline snapshots={snapshots} />
          </Section>
        )}

        {/* CTA */}
        <div style={{ padding: "36px", background: "#0d0d0d", borderRadius: 16, border: `1px solid rgba(${rgb(pc)},0.15)`, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f0ece3", marginBottom: 8 }}>
            Build like {brand.brand_name}
          </div>
          <div style={{ fontSize: 14, color: "#555", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            Clone this brand board into your own workspace and customize it for your brand.
          </div>
          <button
            onClick={handleClone}
            style={{
              padding: "14px 32px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${pc}, rgba(${rgb(pc)},0.7))`,
              color: luma(pc) > 150 ? "#000" : "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              opacity: cloneMsg ? 0.6 : 1, transition: "opacity 0.2s",
              fontFamily: "inherit",
            }}
          >
            {cloneMsg ? "Opening builder..." : `Clone ${brand.brand_name}'s Board`}
          </button>
        </div>
      </div>
    </div>
  );
}
