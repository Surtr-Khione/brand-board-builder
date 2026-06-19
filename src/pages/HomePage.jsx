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

function BrandTile({ brand }) {
  const [hov, setHov] = useState(false);
  const pc = brand.primary_color || "#333";
  return (
    <Link to={`/brands/${brand.slug}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: "#111",
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${hov ? `rgba(${rgb(pc)},0.5)` : "#1a1a1a"}`,
          transition: "all 0.22s ease",
          transform: hov ? "translateY(-3px)" : "none",
          boxShadow: hov ? `0 12px 32px rgba(${rgb(pc)},0.18)` : "none",
          cursor: "pointer",
        }}
      >
        <div style={{ height: 4, background: pc }} />
        <div style={{ padding: "16px 16px 14px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f0ece3", marginBottom: 5, letterSpacing: "-0.2px" }}>{brand.brand_name}</div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 12, lineHeight: 1.4, minHeight: 30 }}>
            {brand.tagline?.slice(0, 55) || brand.industry || ""}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[pc, brand.secondary_color, brand.accent_color].filter(Boolean).map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1.5px solid rgba(255,255,255,0.08)" }} />
            ))}
            {brand.archetype && (
              <span style={{ fontSize: 9, color: "#444", marginLeft: 2 }}>{brand.archetype.replace("The ", "")}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    document.title = "Brand Board Builder — Build Your Brand Identity";
    searchBrands({ limit: 12 }).then(d => setBrands(d.brands || []));
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", color: "#f0ece3",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #111" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #e94560, #c62a42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f0ece3" }}>Brand Board Builder</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/brands" style={{ fontSize: 13, color: "#666", textDecoration: "none", fontWeight: 500, transition: "color 0.18s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f0ece3"}
            onMouseLeave={e => e.currentTarget.style.color = "#666"}
          >Brand Library</Link>
          <Link to="/builder" style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg, #e94560, #c62a42)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            Start Building
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 40px 60px", textAlign: "center",
        background: "linear-gradient(180deg, rgba(30,10,50,0.35) 0%, transparent 60%)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#e94560", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 }}>
          AI-Powered Brand Identity
        </div>
        <h1 style={{
          fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 800, lineHeight: 0.95,
          letterSpacing: "-3px", margin: "0 0 24px", maxWidth: 900,
          color: "#f0ece3",
        }}>
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
          {/* BUILD */}
          <Link to="/builder" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "32px 28px", borderRadius: 16, background: "linear-gradient(135deg, rgba(233,69,96,0.12), rgba(233,69,96,0.04))",
              border: "1px solid rgba(233,69,96,0.2)", transition: "all 0.22s", cursor: "pointer", textAlign: "left", height: "100%", boxSizing: "border-box",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(233,69,96,0.5)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(233,69,96,0.2)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>◈</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f0ece3", marginBottom: 8 }}>Build Your Brand</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
                Scan your website, fill in your identity, and export a complete brand board with AI assistance.
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560" }}>Start for free →</div>
            </div>
          </Link>

          {/* LIBRARY */}
          <Link to="/brands" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "32px 28px", borderRadius: 16, background: "linear-gradient(135deg, rgba(155,89,182,0.12), rgba(155,89,182,0.04))",
              border: "1px solid rgba(155,89,182,0.2)", transition: "all 0.22s", cursor: "pointer", textAlign: "left", height: "100%", boxSizing: "border-box",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(155,89,182,0.5)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(155,89,182,0.2)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>◆</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f0ece3", marginBottom: 8 }}>Browse Brand Library</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
                Study how Apple, Nike, Tesla, and 12 more iconic brands define their identity — year by year.
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9b59b6" }}>Explore {brands.length || 15} brands →</div>
            </div>
          </Link>
        </div>

        {/* BRAND WALL */}
        {brands.length > 0 && (
          <div style={{ width: "100%", maxWidth: 1100 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: 2.5, textTransform: "uppercase" }}>
                {brands.length} Brands in the Library
              </div>
              <Link to="/brands" style={{ fontSize: 12, color: "#555", textDecoration: "none", fontWeight: 600, transition: "color 0.18s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#f0ece3"}
                onMouseLeave={e => e.currentTarget.style.color = "#555"}
              >Browse all →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {brands.map(b => <BrandTile key={b.slug} brand={b} />)}
            </div>
          </div>
        )}
      </div>

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
