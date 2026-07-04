import { useState, useEffect, useRef } from "react";
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

function logoSources(website) {
  if (!website) return [];
  const d = website.replace(/^https?:\/\//, "").split("/")[0];
  return [
    `https://logo.clearbit.com/${d}?size=600`,
    `https://logo.clearbit.com/${d}`,
    `https://icon.horse/icon/${d}`,
    `https://www.google.com/s2/favicons?domain=${d}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${d}.ico`,
  ];
}

function BrandLogo({ website, name, size = 100, radius = 20, pc }) {
  const [idx, setIdx] = useState(0);
  const sources = logoSources(website);
  const url = sources[idx] || null;
  const imgSize = Math.round(size * 0.65);
  return (
    <div style={{
      width: size, height: size, background: "#fff",
      borderRadius: radius ?? Math.round(size * 0.2),
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)`,
      flexShrink: 0, overflow: "hidden",
    }}>
      {url ? (
        <img
          src={url}
          onError={() => setIdx(i => i + 1)}
          onLoad={e => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w < 48 && h < 48 && idx < sources.length - 1) setIdx(i => i + 1);
          }}
          alt={name}
          style={{ width: imgSize, height: imgSize, objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: size * 0.45, fontWeight: 900, color: pc, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
          {name?.charAt(0) || "?"}
        </span>
      )}
    </div>
  );
}

// Section label in magazine style: thin horizontal rule + all-caps label
function SectionLabel({ children, pc, light = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 56 }}>
      <div style={{ width: 3, height: 18, background: pc, flexShrink: 0 }} />
      <div style={{ fontSize: 10, letterSpacing: 5, fontWeight: 700, color: light ? "rgba(255,255,255,0.55)" : "#999", textTransform: "uppercase" }}>
        {children}
      </div>
      <div style={{ flex: 1, height: 1, background: light ? "rgba(255,255,255,0.12)" : "#2a2a2a" }} />
    </div>
  );
}

function BrandGallery({ images, pc, sc, ac, brandName }) {
  const [failed, setFailed] = useState({});
  if (!images?.length) return null;
  const valid = images.filter((src, i) => src && src.startsWith("http") && !failed[i]).slice(0, 9);
  if (!valid.length) return null;

  const onErr = (origIdx) => setFailed(f => ({ ...f, [origIdx]: true }));

  return (
    <section style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ padding: "80px 56px 40px" }}>
        <SectionLabel pc={pc}>Brand in Action</SectionLabel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
        {valid[0] && (
          <div style={{ gridColumn: "1 / 3", aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
            <img src={valid[0]} onError={() => onErr(0)} alt={brandName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              loading="lazy" />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(${rgb(pc)},0.3) 0%, transparent 60%)` }} />
          </div>
        )}
        {valid[1] && (
          <div style={{ aspectRatio: "9/10", overflow: "hidden" }}>
            <img src={valid[1]} onError={() => onErr(1)} alt={brandName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              loading="lazy" />
          </div>
        )}
        {valid.slice(2, 5).map((src, i) => (
          <div key={i} style={{ aspectRatio: "1", overflow: "hidden" }}>
            <img src={src} onError={() => onErr(i + 2)} alt={brandName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              loading="lazy" />
          </div>
        ))}
        {valid[5] && (
          <div style={{ gridColumn: "1 / 2", aspectRatio: "4/3", overflow: "hidden" }}>
            <img src={valid[5]} onError={() => onErr(5)} alt={brandName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              loading="lazy" />
          </div>
        )}
        {valid[6] && (
          <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
            <img src={valid[6]} onError={() => onErr(6)} alt={brandName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              loading="lazy" />
          </div>
        )}
        {valid[7] && (
          <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
            <img src={valid[7]} onError={() => onErr(7)} alt={brandName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              loading="lazy" />
          </div>
        )}
      </div>
      <div style={{ display: "flex", height: 5 }}>
        <div style={{ flex: 1, background: pc }} />
        <div style={{ flex: 1, background: sc }} />
        <div style={{ flex: 1, background: ac }} />
      </div>
    </section>
  );
}

export default function BrandProfile({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloneMsg, setCloneMsg] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getBrand(slug).then(d => { setData(d); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!data?.brand) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("rv"); }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".sr").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  useEffect(() => {
    if (!data?.brand) return;
    const b = data.brand;
    document.title = `${b.brand_name} — Brand Profile`;
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": b.brand_name, "url": b.website ? `https://${b.website}` : undefined, "slogan": b.tagline });
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

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid #1a1a1a", borderTopColor: "#555", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 4, textTransform: "uppercase" }}>Loading</div>
      </div>
    </div>
  );

  if (!data?.brand) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 20, letterSpacing: 3, textTransform: "uppercase" }}>Brand Not Found</div>
        <Link to="/brands" style={{ color: "#888", textDecoration: "none", fontSize: 13, borderBottom: "1px solid #333", paddingBottom: 2 }}>← Back to Library</Link>
      </div>
    </div>
  );

  const { brand, snapshots } = data;
  const pc = brand.primary_color || "#e94560";
  const sc = brand.secondary_color || "#111";
  const ac = brand.accent_color || "#f39c12";
  const heroImages = brand.hero_images || [];

  // Hero color treatment — always ensure strong contrast
  const pcLuma = luma(pc);
  const heroIsLight = pcLuma > 160;

  // On dark primary: white text. On light primary: dark overlay + white text for image pages
  const heroText = "#FFFFFF";
  const heroSubtext = "rgba(255,255,255,0.72)";
  // For hero bg: always darken enough that white text reads
  const heroOverlay = heroIsLight
    ? `linear-gradient(155deg, rgba(0,0,0,0.6) 0%, rgba(${rgb(pc)},0.85) 40%, rgba(0,0,0,0.5) 100%)`
    : `linear-gradient(155deg, ${pc} 0%, rgba(${rgb(pc)},0.85) 40%, rgba(${rgb(pc)},0.15) 80%, #000 100%)`;

  const personality = (brand.brand_personality || []).filter(Boolean);
  const tone = (brand.tone_attributes || []).filter(Boolean);

  const gFontParts = [];
  if (brand.primary_font) gFontParts.push(`family=${encodeURIComponent(brand.primary_font.trim())}:wght@400;700;900`);
  if (brand.body_font && brand.body_font !== brand.primary_font) gFontParts.push(`family=${encodeURIComponent(brand.body_font.trim())}:wght@400;600`);
  const brandFontUrl = gFontParts.length ? `https://fonts.googleapis.com/css2?${gFontParts.join("&")}&display=swap` : null;

  const parallaxBg = scrollY * 0.22;

  return (
    <div style={{ background: "#000", color: "#f0ece3", fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&display=swap" rel="stylesheet" />
      {brandFontUrl && <link href={brandFontUrl} rel="stylesheet" />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.65; } }
        .fi  { animation: fadeUp 1s ease both; }
        .fi2 { animation: fadeUp 1s ease 0.15s both; }
        .fi3 { animation: fadeUp 1s ease 0.3s both; }
        .sr  { opacity: 0; transform: translateY(40px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .sr.rv { opacity: 1; transform: none; }
      `}</style>

      {/* ═══════════════════════════ COVER ═══════════════════════════ */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Background image */}
        {heroImages[0] && (
          <div style={{
            position: "absolute", inset: "-10%",
            backgroundImage: `url(${heroImages[0]})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "brightness(0.28) saturate(1.3)",
            transform: `translateY(${parallaxBg}px)`,
            willChange: "transform",
          }} />
        )}

        {/* Color overlay — always sufficient contrast */}
        <div style={{ position: "absolute", inset: 0, background: heroOverlay }} />

        {/* Animated glow orb */}
        <div style={{
          position: "absolute", right: "-12%", top: "8%",
          width: "50vw", height: "50vw", borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb(pc)},0.22) 0%, transparent 70%)`,
          animation: "pulse 5s ease-in-out infinite",
          transform: `translateY(${-scrollY * 0.12}px)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", left: "-8%", bottom: "15%",
          width: "32vw", height: "32vw", borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb(ac)},0.12) 0%, transparent 70%)`,
          animation: "pulse 7s ease-in-out 2s infinite",
          pointerEvents: "none",
        }} />

        {/* Texture */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "16px 16px", pointerEvents: "none" }} />

        {/* NAV */}
        <nav style={{ padding: "24px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
          <Link to="/brands" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
          >← Brand Library</Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {brand.is_verified && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>✓ Verified</span>}
            <button onClick={handleClone} style={{
              padding: "10px 22px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.1)", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              backdropFilter: "blur(16px)", transition: "all 0.2s", letterSpacing: 0.3,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >{cloneMsg ? "Opening builder…" : "Clone Board →"}</button>
          </div>
        </nav>

        {/* MASTHEAD */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 56px 80px", position: "relative", zIndex: 10 }}>

          {/* Overline */}
          <div className="fi" style={{ fontSize: 10, letterSpacing: 5, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 40, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.3)" }} />
            Brand Identity Archive &nbsp;·&nbsp; {brand.industry || "Global Brand"}
            {brand.founded_year && <>&nbsp;·&nbsp; Est. {brand.founded_year}</>}
          </div>

          {/* Logo + Name */}
          <div className="fi" style={{ display: "flex", alignItems: "flex-end", gap: 40, marginBottom: 28 }}>
            <BrandLogo website={brand.website} name={brand.brand_name} size={130} radius={24} pc={pc} />
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(68px, 11vw, 156px)",
              fontWeight: 900, color: "#FFFFFF",
              lineHeight: 0.86, letterSpacing: "-4px",
              margin: 0, flex: 1, minWidth: 0,
              textShadow: "0 4px 60px rgba(0,0,0,0.5)",
            }}>{brand.brand_name}</h1>
          </div>

          {/* Tagline */}
          {brand.tagline && (
            <div className="fi2" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(16px, 2.2vw, 26px)",
              fontStyle: "italic", fontWeight: 700,
              color: "rgba(255,255,255,0.78)", marginBottom: 36,
              maxWidth: 780, lineHeight: 1.4, paddingLeft: 170,
            }}>"{brand.tagline}"</div>
          )}

          {/* Meta pills */}
          <div className="fi3" style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingLeft: 170 }}>
            {brand.brand_valuation && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                <span style={{ color: "#D4AF37" }}>◆</span>{brand.brand_valuation}
              </span>
            )}
            {brand.archetype && <span style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>{brand.archetype}</span>}
            {brand.country && <span style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.07)", fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{brand.country}</span>}
            {brand.website && (
              <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <span style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.07)", fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600, transition: "color 0.2s" }}>↗ {brand.website}</span>
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", textAlign: "center", animation: "fadeUp 1.2s ease 0.8s both" }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.35))", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Scroll</div>
        </div>
      </section>

      {/* COLOR BAR */}
      <div style={{ display: "flex", height: 20 }}>
        <div style={{ flex: 1, background: pc }} />
        <div style={{ flex: 1, background: sc }} />
        <div style={{ flex: 1, background: ac }} />
      </div>

      {/* ═══════════════════════════ PALETTE ═══════════════════════════ */}
      <section className="sr" style={{ background: "#050505" }}>
        <div style={{ padding: "80px 56px 0" }}>
          <SectionLabel pc={pc}>The Palette</SectionLabel>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[{ label: "Primary", hex: pc }, { label: "Secondary", hex: sc }, { label: "Accent", hex: ac }].map(({ label, hex }, i) => {
            const swatchLuma = luma(hex);
            const swatchText = swatchLuma > 155 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
            return (
              <div key={label}>
                <div style={{ height: "clamp(240px,30vw,380px)", background: hex, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "28px 32px" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% 20%, rgba(255,255,255,0.12) 0%, transparent 55%)", pointerEvents: "none" }} />
                  <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, textTransform: "uppercase", color: swatchText }}>{label}</div>
                  {i === 0 && (
                    <div style={{ position: "absolute", right: 24, bottom: 24, opacity: 0.18 }}>
                      <BrandLogo website={brand.website} name={brand.brand_name} size={60} radius={12} pc={swatchLuma > 155 ? "#000" : "#fff"} />
                    </div>
                  )}
                </div>
                {/* Color info — fully visible */}
                <div style={{ padding: "28px 32px 32px", background: "#0a0a0a", borderRight: i < 2 ? "1px solid #181818" : "none", borderTop: "1px solid #181818" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 700, color: hex, marginBottom: 10, letterSpacing: "-0.5px" }}>
                    {hex.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", letterSpacing: 1.5, marginBottom: 4, fontFamily: "monospace" }}>
                    RGB &nbsp; {rgb(hex).replace(/,/g, ", ")}
                  </div>
                  <div style={{ fontSize: 11, color: "#555" }}>
                    {swatchLuma > 155 ? "Light" : "Dark"} &nbsp;·&nbsp; {label} Color
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════ GALLERY ═══════════════════════════ */}
      {heroImages.length > 0 && (
        <div className="sr">
          <BrandGallery images={heroImages} pc={pc} sc={sc} ac={ac} brandName={brand.brand_name} />
        </div>
      )}

      {/* ═══════════════════════════ MISSION ═══════════════════════════ */}
      {(brand.mission || brand.elevator) && (
        <section className="sr" style={{
          padding: "120px 56px 120px",
          background: `linear-gradient(180deg, #050505 0%, rgba(${rgb(pc)},0.07) 50%, #050505 100%)`,
          borderTop: `1px solid rgba(${rgb(pc)},0.15)`,
          borderBottom: `1px solid rgba(${rgb(pc)},0.15)`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Giant quotation mark */}
          <div style={{ position: "absolute", top: -20, left: 40, fontSize: "26vw", lineHeight: 1, color: `rgba(${rgb(pc)},0.06)`, fontFamily: "'Playfair Display', serif", fontWeight: 900, userSelect: "none", pointerEvents: "none" }}>"</div>

          <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, fontWeight: 700, color: `rgba(${rgb(pc)},0.7)`, textTransform: "uppercase", marginBottom: 44 }}>
              {brand.mission ? "Mission" : "Elevator Pitch"}
            </div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(24px, 3.8vw, 46px)",
              fontStyle: "italic", fontWeight: 700,
              color: "#F0EBE3", lineHeight: 1.42, marginBottom: 52,
              letterSpacing: "-0.3px",
            }}>
              {brand.mission || brand.elevator}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 44, height: 1, background: `rgba(${rgb(pc)},0.4)` }} />
              <BrandLogo website={brand.website} name={brand.brand_name} size={30} radius={7} pc={pc} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777", letterSpacing: 2, textTransform: "uppercase" }}>
                {brand.brand_name}
                {brand.archetype && <span style={{ color: `rgba(${rgb(pc)},0.75)` }}>&nbsp;·&nbsp;{brand.archetype}</span>}
              </div>
              <div style={{ width: 44, height: 1, background: `rgba(${rgb(pc)},0.4)` }} />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════ INTERSTITIAL IMAGE ═══════════════════════════ */}
      {heroImages[1] && (
        <div className="sr" style={{ position: "relative", height: "58vh", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: "-10%",
            backgroundImage: `url(${heroImages[1]})`,
            backgroundSize: "cover", backgroundPosition: "center",
            transform: `translateY(${(scrollY - 900) * 0.14}px)`,
            willChange: "transform",
          }} />
          {/* Strong dark gradient for text legibility */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)" }} />
          {brand.archetype && (
            <div style={{
              position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)",
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(44px, 7.5vw, 108px)",
              fontWeight: 900, color: "#FFFFFF",
              lineHeight: 0.9, letterSpacing: "-2px",
              textShadow: "0 4px 40px rgba(0,0,0,0.5)",
            }}>
              {brand.archetype.toUpperCase()}
            </div>
          )}
          {/* Brand color accent strip on left */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: pc }} />
        </div>
      )}

      {/* ═══════════════════════════ ARCHETYPE (no interstitial) ═══════════════════════════ */}
      {brand.archetype && !heroImages[1] && (
        <section className="sr" style={{ background: "#050505", borderTop: "1px solid #181818" }}>
          <div style={{ padding: "100px 56px", borderLeft: `4px solid ${pc}` }}>
            <SectionLabel pc={pc}>Brand Archetype</SectionLabel>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(56px, 9vw, 120px)",
              fontWeight: 900, color: pc,
              lineHeight: 0.88, letterSpacing: "-2px", marginBottom: 24,
            }}>{brand.archetype.toUpperCase()}</div>
            {personality.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 28px", marginTop: 36 }}>
                {personality.map((p, i) => (
                  <span key={p} style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 24, fontStyle: "italic",
                    color: i === 0 ? pc : i === 1 ? `rgba(${rgb(pc)},0.7)` : `rgba(${rgb(pc)},0.5)`,
                    fontWeight: 700, letterSpacing: "-0.3px",
                  }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════ TYPE SYSTEM ═══════════════════════════ */}
      {(brand.primary_font || brand.body_font) && (
        <section className="sr" style={{ background: "#0a0a0a", padding: "80px 56px", borderTop: "1px solid #181818" }}>
          <SectionLabel pc={pc}>Type System</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: brand.body_font && brand.body_font !== brand.primary_font ? "1fr 1fr" : "1fr", gap: 3 }}>
            {brand.primary_font && (
              <div style={{ padding: "52px", background: "#050505", border: `1px solid rgba(${rgb(pc)},0.15)` }}>
                <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: `rgba(${rgb(pc)},0.7)`, textTransform: "uppercase", marginBottom: 36 }}>Display · Heading</div>
                <div style={{
                  fontFamily: `'${brand.primary_font}', 'Playfair Display', Georgia, serif`,
                  fontSize: "clamp(64px, 9vw, 108px)",
                  fontWeight: 900, color: pc, lineHeight: 0.86,
                  letterSpacing: "-3px", marginBottom: 36,
                }}>Aa</div>
                <div style={{
                  fontFamily: `'${brand.primary_font}', Georgia, serif`,
                  fontSize: 16, color: "#888", lineHeight: 1.55, marginBottom: 32, letterSpacing: "0.3px",
                }}>ABCDEFGHIJKLM<br />NOPQRSTUVWXYZ<br />0 1 2 3 4 5 6 7 8 9</div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E4DC", marginBottom: 5, fontFamily: `'${brand.primary_font}', sans-serif` }}>{brand.primary_font}</div>
                  <div style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>Headlines · Display · Brand Voice</div>
                </div>
              </div>
            )}
            {brand.body_font && brand.body_font !== brand.primary_font && (
              <div style={{ padding: "52px", background: "#050505", border: "1px solid #181818" }}>
                <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: "#777", textTransform: "uppercase", marginBottom: 36 }}>Body · Interface</div>
                <div style={{
                  fontFamily: `'${brand.body_font}', 'DM Sans', sans-serif`,
                  fontSize: "clamp(48px, 7vw, 80px)",
                  fontWeight: 700, color: "#D0CCCA", lineHeight: 0.86,
                  letterSpacing: "-2px", marginBottom: 36,
                }}>Aa</div>
                <div style={{ fontFamily: `'${brand.body_font}', sans-serif`, fontSize: 15, color: "#888", lineHeight: 1.7, marginBottom: 32 }}>
                  The quick brown fox jumps over the lazy dog. A brand voice that connects, compels, and converts through every word.
                </div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E4DC", marginBottom: 5, fontFamily: `'${brand.body_font}', sans-serif` }}>{brand.body_font}</div>
                  <div style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>Paragraphs · UI · Long-form Copy</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════ BRAND VOICE ═══════════════════════════ */}
      {tone.length > 0 && (
        <section className="sr" style={{ padding: "80px 56px", background: "#050505", borderTop: "1px solid #181818" }}>
          <SectionLabel pc={pc}>Brand Voice</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 28px", marginBottom: 52 }}>
            {tone.map((t, i) => (
              <div key={t} style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: `clamp(${Math.max(34, 58 - i * 8)}px, ${5 - i * 0.7}vw, ${Math.max(52, 82 - i * 12)}px)`,
                fontWeight: i === 0 ? 900 : 700,
                fontStyle: i % 2 === 1 ? "italic" : "normal",
                // Never go below 55% opacity so text stays readable
                color: i === 0 ? pc : `rgba(${rgb(pc)},${Math.max(0.55, 0.88 - i * 0.12)})`,
                lineHeight: 1.05, letterSpacing: "-1px",
              }}>{t}</div>
            ))}
          </div>
          {brand.social_personality && (
            <div style={{ maxWidth: 660, padding: "36px 44px", background: "#0a0a0a", borderLeft: `4px solid ${pc}`, borderTop: "none" }}>
              <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: `rgba(${rgb(pc)},0.65)`, textTransform: "uppercase", marginBottom: 16 }}>Social Personality</div>
              <div style={{ fontSize: 17, color: "#C8C4BB", lineHeight: 1.7, fontStyle: "italic" }}>"{brand.social_personality}"</div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════ BRAND IDENTITY ═══════════════════════════ */}
      {(brand.description || brand.vision || brand.elevator) && (
        <section className="sr" style={{ padding: "80px 56px", background: "#0a0a0a", borderTop: "1px solid #181818" }}>
          <SectionLabel pc={pc}>Brand Identity</SectionLabel>
          <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 52 }}>
            {brand.description && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: "#777", textTransform: "uppercase", marginBottom: 20 }}>About</div>
                <div style={{ fontSize: 18, color: "#AAA", lineHeight: 1.8 }}>{brand.description}</div>
              </div>
            )}
            {brand.vision && (
              <div style={{ paddingLeft: 32, borderLeft: `2px solid rgba(${rgb(pc)},0.3)` }}>
                <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: `rgba(${rgb(pc)},0.6)`, textTransform: "uppercase", marginBottom: 20 }}>Vision</div>
                <div style={{ fontSize: 20, color: "#D8D4CC", lineHeight: 1.65, fontStyle: "italic" }}>{brand.vision}</div>
              </div>
            )}
            {brand.elevator && !brand.mission && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: "#777", textTransform: "uppercase", marginBottom: 20 }}>In a Sentence</div>
                <div style={{ fontSize: 18, color: "#AAA", lineHeight: 1.8 }}>{brand.elevator}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════ PHOTO DIRECTION ═══════════════════════════ */}
      {brand.photo_style && (
        <section className="sr" style={{ padding: "80px 56px", background: "#050505", borderTop: "1px solid #181818" }}>
          <SectionLabel pc={pc}>Photo Direction</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, maxWidth: 1100 }}>
            <div>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(22px, 2.8vw, 36px)", fontStyle: "italic", fontWeight: 700,
                color: "#D8D4CC", lineHeight: 1.45,
              }}>{brand.photo_style}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6 }}>
              {heroImages.slice(2, 6).length >= 4
                ? heroImages.slice(2, 6).map((src, i) => (
                    <div key={i} style={{ borderRadius: 10, aspectRatio: "1", overflow: "hidden" }}>
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                    </div>
                  ))
                : [pc, `rgba(${rgb(pc)},0.5)`, sc, `rgba(${rgb(ac)},0.65)`].map((color, i) => (
                    <div key={i} style={{ borderRadius: 10, background: String(color), aspectRatio: "1" }} />
                  ))
              }
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════ EVOLUTION ═══════════════════════════ */}
      {snapshots?.length > 0 && (
        <section className="sr" style={{ padding: "80px 56px", background: "#0a0a0a", borderTop: "1px solid #181818" }}>
          <SectionLabel pc={pc}>Evolution</SectionLabel>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 68, top: 8, bottom: 0, width: 1, background: "linear-gradient(180deg, #2a2a2a 0%, transparent 100%)" }} />
            {snapshots.map((snap, i) => (
              <div key={snap.year} style={{ display: "flex", gap: 40, marginBottom: 56 }}>
                <div style={{ width: 60, textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: i === 0 ? pc : "#555", letterSpacing: "-0.5px" }}>{snap.year}</div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? pc : "#2a2a2a", border: `2px solid ${i === 0 ? pc : "#333"}`, flexShrink: 0, marginTop: 6, position: "relative", zIndex: 1 }} />
                <div style={{ flex: 1 }}>
                  {snap.change_notes && <div style={{ fontSize: 15, color: "#888", fontStyle: "italic", marginBottom: 14, lineHeight: 1.65 }}>{snap.change_notes}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {snap.snapshot_data?.primaryColor && (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", background: "#111", borderRadius: 6, border: "1px solid #222" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: snap.snapshot_data.primaryColor }} />
                        <span style={{ fontSize: 11, color: "#777", fontFamily: "monospace" }}>{snap.snapshot_data.primaryColor}</span>
                      </div>
                    )}
                    {snap.snapshot_data?.archetype && <span style={{ fontSize: 11, color: "#777", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "6px 14px" }}>{snap.snapshot_data.archetype}</span>}
                    {snap.snapshot_data?.primaryFont && <span style={{ fontSize: 11, color: "#777", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "6px 14px" }}>{snap.snapshot_data.primaryFont}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════ CLOSING CTA ═══════════════════════════ */}
      <section style={{ minHeight: "65vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "110px 56px", textAlign: "center", overflow: "hidden" }}>
        {/* Background */}
        {heroImages.length > 3 ? (
          <>
            <div style={{ position: "absolute", inset: "-5%", backgroundImage: `url(${heroImages[heroImages.length - 1]})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.18) saturate(1.2)" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(155deg, rgba(${rgb(pc)},0.88) 0%, rgba(${rgb(pc)},0.55) 45%, rgba(0,0,0,0.75) 100%)` }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(155deg, ${pc} 0%, rgba(${rgb(pc)},0.7) 50%, rgba(0,0,0,0.4) 100%)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "16px 16px" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 44 }}>
            <BrandLogo website={brand.website} name={brand.brand_name} size={110} radius={22} pc={pc} />
          </div>
          <div style={{ fontSize: 10, letterSpacing: 5, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 22 }}>Build Like</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(52px, 9vw, 112px)",
            fontWeight: 900, color: "#FFFFFF",
            lineHeight: 0.88, letterSpacing: "-3px", marginBottom: 28,
            textShadow: "0 4px 40px rgba(0,0,0,0.4)",
          }}>{brand.brand_name}</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 44, maxWidth: 460, margin: "0 auto 44px", lineHeight: 1.6 }}>
            Clone this brand board and build your own identity with the same framework.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 40 }}>
            {[pc, sc, ac].map((c, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 9, background: c, boxShadow: "0 6px 20px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <button onClick={handleClone} style={{
            padding: "18px 52px", borderRadius: 12, border: "none",
            background: "rgba(255,255,255,0.96)", color: "#111",
            fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)", transition: "transform 0.2s, box-shadow 0.2s",
            opacity: cloneMsg ? 0.7 : 1, letterSpacing: "-0.2px",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 24px 64px rgba(0,0,0,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.4)"; }}
          >{cloneMsg ? "Opening builder…" : `Clone ${brand.brand_name}'s Board →`}</button>
        </div>
      </section>

      {/* FOOTER */}
      <div style={{ padding: "22px 56px", background: "#000", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/brands" style={{ fontSize: 11, color: "#666", textDecoration: "none", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#aaa"}
          onMouseLeave={e => e.currentTarget.style.color = "#666"}
        >← Brand Library</Link>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, textTransform: "uppercase" }}>brandmd.space</div>
        <Link to="/builder" style={{ fontSize: 11, color: "#666", textDecoration: "none", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#aaa"}
          onMouseLeave={e => e.currentTarget.style.color = "#666"}
        >Build Your Brand →</Link>
      </div>
    </div>
  );
}
