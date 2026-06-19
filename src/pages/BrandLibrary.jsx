import { useState, useEffect, useCallback } from "react";
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
          height: 100,
          background: `linear-gradient(135deg, ${pc} 0%, rgba(${rgb(pc)},0.65) 100%)`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 16,
          position: "relative",
        }}>
          {/* Logo in white app-icon square */}
          <div style={{
            width: 52, height: 52,
            background: "#fff",
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            flexShrink: 0,
            overflow: "hidden",
          }}>
            {logo ? (
              <img
                src={logo}
                onError={() => setImgErr(true)}
                alt={brand.brand_name}
                style={{ width: 34, height: 34, objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 900, color: pc, fontFamily: "sans-serif" }}>
                {brand.brand_name.charAt(0)}
              </span>
            )}
          </div>

          {/* Brand name + industry on header */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", lineHeight: 1.1,
              color: headerLight ? "rgba(0,0,0,0.88)" : "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {brand.brand_name}
            </div>
            {brand.industry && (
              <div style={{
                fontSize: 10, fontWeight: 600, marginTop: 3, letterSpacing: 0.5,
                color: headerLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
              }}>
                {brand.industry}
              </div>
            )}
          </div>

          {brand.is_featured && (
            <div style={{
              position: "absolute", top: 8, right: 10,
              fontSize: 9, fontWeight: 800, color: "#D4AF37",
              background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,175,55,0.35)",
              borderRadius: 4, padding: "2px 6px", letterSpacing: 1.2, textTransform: "uppercase",
            }}>★</div>
          )}
        </div>

        {/* BODY */}
        <div style={{ padding: "14px 18px 10px" }}>
          {/* Tagline in brand color */}
          <div style={{ fontSize: 12, color: pc, fontStyle: "italic", lineHeight: 1.5, minHeight: 34, marginBottom: 10 }}>
            {brand.tagline ? `"${brand.tagline}"` : ""}
          </div>

          {/* Archetype + year */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            {brand.archetype && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: pc,
                background: `rgba(${rgb(pc)},0.1)`, border: `1px solid rgba(${rgb(pc)},0.25)`,
                borderRadius: 4, padding: "3px 8px",
              }}>{brand.archetype}</span>
            )}
            {brand.founded_year && (
              <span style={{ fontSize: 9, color: "#3a3a3a", fontWeight: 600 }}>Est. {brand.founded_year}</span>
            )}
          </div>

          {/* Valuation */}
          {brand.brand_valuation && (
            <div style={{ fontSize: 10, color: "#555", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#D4AF37", fontSize: 9 }}>◆</span>
              {brand.brand_valuation}
            </div>
          )}

          {/* Font name */}
          {brand.primary_font && (
            <div style={{ fontSize: 9, color: "#2e2e2e", marginBottom: 10, letterSpacing: 0.3 }}>
              Aa  {brand.primary_font}
            </div>
          )}
        </div>

        {/* COLOR BAR */}
        <div style={{ display: "flex", height: 7, margin: "0 18px 4px", borderRadius: 4, overflow: "hidden", gap: 2 }}>
          <div style={{ flex: 1, background: pc }} />
          <div style={{ flex: 1, background: sc }} />
          <div style={{ flex: 1, background: ac }} />
        </div>
        <div style={{ display: "flex", padding: "0 18px 14px" }}>
          <span style={{ flex: 1, fontSize: 8, color: "#2e2e2e", fontFamily: "monospace" }}>{pc}</span>
          <span style={{ flex: 1, fontSize: 8, color: "#2e2e2e", fontFamily: "monospace", textAlign: "center" }}>{sc}</span>
          <span style={{ flex: 1, fontSize: 8, color: "#2e2e2e", fontFamily: "monospace", textAlign: "right" }}>{ac}</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#0e0e0e", borderRadius: 16, overflow: "hidden", border: "1px solid #1a1a1a" }}>
      <div style={{ height: 100, background: "#161616" }} />
      <div style={{ padding: "14px 18px 14px" }}>
        <div style={{ height: 12, width: "75%", background: "#1e1e1e", borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 10, width: "55%", background: "#181818", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ height: 9, width: 90, background: "#1a1a1a", borderRadius: 20, marginBottom: 8 }} />
        <div style={{ height: 9, width: "80%", background: "#161616", borderRadius: 4, marginBottom: 10 }} />
      </div>
      <div style={{ display: "flex", height: 7, margin: "0 18px 14px", borderRadius: 4, overflow: "hidden", gap: 2 }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, background: "#1e1e1e" }} />)}
      </div>
    </div>
  );
}

const ARCHETYPE_COLORS = {
  "The Hero": "#C62828", "The Creator": "#6A1B9A", "The Sage": "#1565C0",
  "The Explorer": "#2E7D32", "The Magician": "#4A148C", "The Ruler": "#37474F",
  "The Caregiver": "#00838F", "The Rebel": "#BF360C", "The Jester": "#F9A825",
  "The Innocent": "#0097A7", "The Lover": "#AD1457", "The Everyman": "#5D4037",
};

export default function BrandLibrary() {
  const [brands, setBrands] = useState([]);
  const [facets, setFacets] = useState({ archetypes: [], industries: [] });
  const [q, setQ] = useState("");
  const [archetype, setArchetype] = useState("");
  const [loading, setLoading] = useState(true);
  const [debounced, setDebounced] = useState("");

  useEffect(() => { document.title = "Brand Library — 15 Iconic Brands Decoded"; }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await searchBrands({ q: debounced, archetype, limit: 48 });
    setBrands(data.brands || []);
    if (data.facets) setFacets(data.facets);
    setLoading(false);
  }, [debounced, archetype]);

  useEffect(() => { load(); }, [load]);

  const isFiltered = !!debounced || !!archetype;

  return (
    <div style={{ background: "#080808", color: "#f0ece3", fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px", borderBottom: "1px solid #111",
        background: "rgba(8,8,8,0.97)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link to="/" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.color = "#f0ece3"}
          onMouseLeave={e => e.currentTarget.style.color = "#555"}
        >← Home</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#e94560,#c62a42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0ece3" }}>Brand Library</span>
        </div>
        <Link to="/builder" style={{ padding: "7px 16px", borderRadius: 8, background: "linear-gradient(135deg,#e94560,#c62a42)", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
          Build Yours →
        </Link>
      </nav>

      {/* HERO */}
      <div style={{ padding: "60px 40px 48px", textAlign: "center", borderBottom: "1px solid #111", background: "linear-gradient(180deg, rgba(30,20,50,0.4) 0%, transparent 100%)" }}>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 300, letterSpacing: "-2px", lineHeight: 1.0, color: "#f0ece3", margin: "0 0 10px" }}>
          The World's{" "}
          <span style={{ color: "transparent", backgroundImage: "linear-gradient(135deg, #e94560, #f39c12, #9b59b6)", backgroundClip: "text", WebkitBackgroundClip: "text" }}>Brand Library</span>
        </h1>
        <p style={{ fontSize: 15, color: "#555", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65 }}>
          {brands.length || 15} iconic brands decoded — colors, fonts, archetype, mission, and year-by-year evolution.
        </p>
        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search brands, industries, archetypes..."
            style={{ width: "100%", padding: "16px 52px 16px 18px", fontSize: 15, background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, color: "#f0ece3", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = "#444"}
            onBlur={e => e.target.style.borderColor = "#2a2a2a"}
          />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#444", fontSize: 18, pointerEvents: "none" }}>⌕</span>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 40px 80px" }}>
        {/* ARCHETYPE FILTERS */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#444", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>Filter by Archetype</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setArchetype("")} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: !archetype ? "1px solid #e94560" : "1px solid #222",
              background: !archetype ? "rgba(233,69,96,0.12)" : "#111",
              color: !archetype ? "#e94560" : "#555", transition: "all 0.18s",
            }}>All {brands.length || 15}</button>
            {facets.archetypes.map(a => (
              <button key={a} onClick={() => setArchetype(a === archetype ? "" : a)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: archetype === a ? `1px solid ${ARCHETYPE_COLORS[a] || "#666"}` : "1px solid #222",
                background: archetype === a ? `rgba(${rgb(ARCHETYPE_COLORS[a] || "#666")},0.12)` : "#111",
                color: archetype === a ? (ARCHETYPE_COLORS[a] || "#f0ece3") : "#555",
                transition: "all 0.18s",
              }}>{a}</button>
            ))}
          </div>
        </div>

        {isFiltered && (
          <div style={{ fontSize: 12, color: "#444", marginBottom: 20 }}>
            {brands.length} brand{brands.length !== 1 ? "s" : ""}{q ? ` matching "${q}"` : ""}{archetype ? ` · ${archetype}` : ""}
            <button onClick={() => { setQ(""); setArchetype(""); }} style={{ marginLeft: 12, fontSize: 11, color: "#555", background: "none", border: "1px solid #2a2a2a", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>Clear ×</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : brands.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: "#444" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 15 }}>No brands match — try a different search</div>
            <button onClick={() => { setQ(""); setArchetype(""); }} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #2a2a2a", background: "transparent", color: "#777", cursor: "pointer", fontSize: 13 }}>
              Show all brands
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {brands.map(b => <BrandCard key={b.slug} brand={b} />)}
          </div>
        )}

        <div style={{ marginTop: 60, padding: "22px 26px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Open API — For Developers & AI</div>
          <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 1.7 }}>
            All brand data available as JSON · No auth required ·{" "}
            <code style={{ background: "#141414", padding: "2px 7px", borderRadius: 4, fontSize: 11, color: "#666", fontFamily: "monospace" }}>GET /functions/v1/search-brands?q=nike</code>
            {" "}· <a href="/llms.txt" style={{ color: "#444", textDecoration: "underline" }}>llms.txt</a>
          </div>
        </div>
      </div>
    </div>
  );
}
