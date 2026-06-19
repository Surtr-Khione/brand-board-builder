import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchBrands } from "../lib/brands";

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

function BrandCard({ brand }) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const pc = brand.primary_color || "#333";
  const sc = brand.secondary_color || "#1a1a1a";
  const ac = brand.accent_color || "#555";
  const logo = !imgErr ? getBrandLogo(brand.website) : null;
  const headerLight = luma(pc) > 150;

  return (
    <Link to={`/brands/${brand.slug}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: "#0e0e0e",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${hov ? `rgba(${rgb(pc)},0.55)` : "#1a1a1a"}`,
          transition: "transform 0.22s, box-shadow 0.22s, border-color 0.22s",
          transform: hov ? "translateY(-5px)" : "none",
          boxShadow: hov
            ? `0 20px 50px rgba(${rgb(pc)},0.28), 0 4px 12px rgba(0,0,0,0.5)`
            : "0 2px 8px rgba(0,0,0,0.4)",
          cursor: "pointer",
        }}
      >
        {/* BRAND COLOR HEADER */}
        <div style={{
          height: 90,
          background: `linear-gradient(135deg, ${pc} 0%, rgba(${rgb(pc)},0.65) 100%)`,
          display: "flex", alignItems: "center", padding: "0 16px", gap: 14, position: "relative",
        }}>
          <div style={{
            width: 44, height: 44, background: "#fff", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)", flexShrink: 0, overflow: "hidden",
          }}>
            {logo ? (
              <img src={logo} onError={() => setImgErr(true)} alt={brand.brand_name}
                style={{ width: 28, height: 28, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 900, color: pc }}>{brand.brand_name.charAt(0)}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.1,
              color: headerLight ? "rgba(0,0,0,0.88)" : "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{brand.brand_name}</div>
            {brand.industry && (
              <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2, color: headerLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)" }}>
                {brand.industry}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: "12px 16px 8px" }}>
          <div style={{ fontSize: 11, color: pc, fontStyle: "italic", lineHeight: 1.45, minHeight: 30, marginBottom: 8 }}>
            {brand.tagline ? `"${brand.tagline}"` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {brand.archetype && (
              <span style={{ fontSize: 8, fontWeight: 700, color: pc, background: `rgba(${rgb(pc)},0.1)`, border: `1px solid rgba(${rgb(pc)},0.22)`, borderRadius: 4, padding: "2px 6px" }}>
                {brand.archetype}
              </span>
            )}
            {brand.founded_year && (
              <span style={{ fontSize: 8, color: "#3a3a3a", fontWeight: 600 }}>Est. {brand.founded_year}</span>
            )}
          </div>
          {brand.brand_valuation && (
            <div style={{ fontSize: 9, color: "#444", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <span style={{ color: "#D4AF37", fontSize: 8 }}>◆</span>
              {brand.brand_valuation.split(" · ")[0]}
            </div>
          )}
        </div>

        {/* COLOR BAR */}
        <div style={{ display: "flex", height: 6, margin: "0 16px 4px", borderRadius: 3, overflow: "hidden", gap: 2 }}>
          <div style={{ flex: 1, background: pc }} />
          <div style={{ flex: 1, background: sc }} />
          <div style={{ flex: 1, background: ac }} />
        </div>
        <div style={{ display: "flex", padding: "0 16px 12px" }}>
          <span style={{ flex: 1, fontSize: 7, color: "#2a2a2a", fontFamily: "monospace" }}>{pc}</span>
          <span style={{ flex: 1, fontSize: 7, color: "#2a2a2a", fontFamily: "monospace", textAlign: "center" }}>{sc}</span>
          <span style={{ flex: 1, fontSize: 7, color: "#2a2a2a", fontFamily: "monospace", textAlign: "right" }}>{ac}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    document.title = "Brand Board Builder — Build Your Brand Identity";
    searchBrands({ limit: 15 }).then(d => setBrands(d.brands || []));
  }, []);

  return (
    <div style={{ background: "#080808", color: "#f0ece3", fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #111" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #e94560, #c62a42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f0ece3" }}>Brand Board Builder</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/brands" style={{ fontSize: 13, color: "#666", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = "#f0ece3"}
            onMouseLeave={e => e.currentTarget.style.color = "#666"}
          >Brand Library</Link>
          <Link to="/builder" style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg, #e94560, #c62a42)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            Start Building
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: "80px 40px 60px", textAlign: "center", background: "linear-gradient(180deg, rgba(30,10,50,0.35) 0%, transparent 60%)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#e94560", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 }}>
          AI-Powered Brand Identity
        </div>
        <h1 style={{ fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-3px", margin: "0 0 24px", maxWidth: 900, color: "#f0ece3", marginLeft: "auto", marginRight: "auto" }}>
          Build a brand that{" "}
          <span style={{ color: "transparent", backgroundImage: "linear-gradient(135deg, #e94560, #f39c12)", backgroundClip: "text", WebkitBackgroundClip: "text" }}>
            means something
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#555", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.65, fontWeight: 400 }}>
          Scan any website to auto-fill your brand board. Study the world's best brands. Build yours in minutes.
        </p>

        {/* TWO PATHS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 680, width: "100%", margin: "0 auto 80px" }}>
          <Link to="/builder" style={{ textDecoration: "none" }}>
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "linear-gradient(135deg, rgba(233,69,96,0.12), rgba(233,69,96,0.04))", border: "1px solid rgba(233,69,96,0.2)", transition: "all 0.22s", cursor: "pointer", textAlign: "left", height: "100%", boxSizing: "border-box" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(233,69,96,0.5)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(233,69,96,0.2)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>◈</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f0ece3", marginBottom: 8 }}>Build Your Brand</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
                Scan your website, fill in your identity, and export a complete brand board with AI assistance.
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560" }}>Start for free →</div>
            </div>
          </Link>
          <Link to="/brands" style={{ textDecoration: "none" }}>
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "linear-gradient(135deg, rgba(155,89,182,0.12), rgba(155,89,182,0.04))", border: "1px solid rgba(155,89,182,0.2)", transition: "all 0.22s", cursor: "pointer", textAlign: "left", height: "100%", boxSizing: "border-box" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(155,89,182,0.5)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(155,89,182,0.2)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>◆</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f0ece3", marginBottom: 8 }}>Browse Brand Library</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
                Study how Apple, Nike, Tesla, and 12 more iconic brands define their identity — year by year.
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9b59b6" }}>Explore {brands.length || 15} brands →</div>
            </div>
          </Link>
        </div>
      </div>

      {/* BRAND WALL */}
      {brands.length > 0 && (
        <div style={{ padding: "0 40px 80px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: 2.5, textTransform: "uppercase" }}>
                {brands.length} Brands in the Library
              </div>
              <Link to="/brands" style={{ fontSize: 12, color: "#555", textDecoration: "none", fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.color = "#f0ece3"}
                onMouseLeave={e => e.currentTarget.style.color = "#555"}
              >Browse all →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {brands.map(b => <BrandCard key={b.slug} brand={b} />)}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding: "24px 40px", borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#333" }}>brandmd.space</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link to="/builder" style={{ fontSize: 11, color: "#333", textDecoration: "none" }}>Builder</Link>
          <Link to="/brands" style={{ fontSize: 11, color: "#333", textDecoration: "none" }}>Library</Link>
          <a href="/llms.txt" style={{ fontSize: 11, color: "#333", textDecoration: "none" }}>API</a>
        </div>
      </div>
    </div>
  );
}
