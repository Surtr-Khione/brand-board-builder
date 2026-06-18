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

function BrandCard({ brand, featured }) {
  const [hov, setHov] = useState(false);
  const pc = brand.primary_color || "#666";
  return (
    <Link to={`/brands/${brand.slug}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: "#111",
          borderRadius: featured ? 16 : 12,
          overflow: "hidden",
          border: `1px solid ${hov ? `rgba(${rgb(pc)},0.4)` : "#1e1e1e"}`,
          transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          transform: hov ? "translateY(-5px)" : "translateY(0)",
          boxShadow: hov
            ? `0 20px 48px rgba(${rgb(pc)},0.22), 0 4px 12px rgba(0,0,0,0.4)`
            : "0 2px 8px rgba(0,0,0,0.4)",
          cursor: "pointer",
          height: featured ? "auto" : "auto",
        }}
      >
        <div style={{ height: featured ? 8 : 5, background: pc }} />
        <div style={{ padding: featured ? "22px 22px 18px" : "18px 18px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontSize: featured ? 20 : 17, fontWeight: 700, color: "#f0ece3", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
              {brand.brand_name}
            </div>
            {brand.is_featured && (
              <span style={{ fontSize: 9, fontWeight: 800, color: "#D4AF37", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 4, padding: "2px 6px", letterSpacing: 1.2, textTransform: "uppercase", flexShrink: 0, marginLeft: 8 }}>
                Featured
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#777", lineHeight: 1.55, marginBottom: 12, minHeight: featured ? 52 : 40 }}>
            {brand.tagline || (brand.description || "").slice(0, 90) || "—"}
          </div>
          {brand.archetype && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: pc, background: `rgba(${rgb(pc)},0.1)`, border: `1px solid rgba(${rgb(pc)},0.22)`, borderRadius: 20, padding: "3px 10px", letterSpacing: 0.3 }}>
                {brand.archetype}
              </span>
            </div>
          )}
          <div style={{ fontSize: 10, color: "#444", marginBottom: 12, letterSpacing: 0.3 }}>
            {[brand.industry, brand.founded_year ? `Est. ${brand.founded_year}` : null, brand.country]
              .filter(Boolean).join("  ·  ")}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[brand.primary_color, brand.secondary_color, brand.accent_color].filter(Boolean).map((c, i) => (
              <div key={i} title={c} style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: "1.5px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
            ))}
            {brand.primary_font && (
              <span style={{ fontSize: 10, color: "#444", marginLeft: 4 }}>{brand.primary_font}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#111", borderRadius: 12, overflow: "hidden", border: "1px solid #1e1e1e" }}>
      <div style={{ height: 5, background: "#222" }} />
      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ height: 18, width: "60%", background: "#1e1e1e", borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: "90%", background: "#181818", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, width: "70%", background: "#181818", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ height: 20, width: 80, background: "#1e1e1e", borderRadius: 20, marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: "#1e1e1e" }} />)}
        </div>
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

  useEffect(() => { document.title = "Brand Library — The World's Brand Intelligence Database"; }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 320);
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

  const featured = brands.filter(b => b.is_featured);
  const all = brands.filter(b => !b.is_featured);

  const F = {
    page: {
      minHeight: "100vh", background: "#080808", color: "#f0ece3",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    },
    nav: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 40px", borderBottom: "1px solid #141414",
      background: "rgba(8,8,8,0.95)", backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 100,
    },
    hero: {
      padding: "80px 40px 60px", textAlign: "center",
      borderBottom: "1px solid #141414",
      background: "linear-gradient(180deg, rgba(30,20,50,0.4) 0%, transparent 100%)",
    },
    headline: {
      fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 300, letterSpacing: "-2px",
      lineHeight: 1.0, color: "#f0ece3", margin: "0 0 8px",
    },
    headlineAccent: { color: "transparent", backgroundImage: "linear-gradient(135deg, #e94560, #f39c12, #9b59b6)", backgroundClip: "text", WebkitBackgroundClip: "text" },
    sub: { fontSize: 16, color: "#555", margin: "0 0 40px", fontWeight: 400, maxWidth: 520, marginLeft: "auto", marginRight: "auto" },
    searchWrap: { position: "relative", maxWidth: 600, margin: "0 auto" },
    searchInput: {
      width: "100%", padding: "18px 56px 18px 20px", fontSize: 16,
      background: "#111", border: "1px solid #2a2a2a", borderRadius: 14,
      color: "#f0ece3", outline: "none", boxSizing: "border-box",
      fontFamily: "inherit", transition: "border-color 0.2s",
    },
    searchIcon: {
      position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)",
      color: "#555", fontSize: 18, pointerEvents: "none",
    },
    sectionLabel: {
      fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 2,
      textTransform: "uppercase", marginBottom: 20,
    },
    filterRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
    chip: (active, color) => ({
      padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      cursor: "pointer", transition: "all 0.18s", letterSpacing: 0.3,
      border: active ? `1px solid ${color}` : "1px solid #2a2a2a",
      background: active ? `rgba(${rgb(color || "#666")},0.12)` : "#111",
      color: active ? (color || "#f0ece3") : "#666",
    }),
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 16,
    },
    featuredGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 20,
    },
    content: { padding: "48px 40px 80px", maxWidth: 1200, margin: "0 auto" },
    empty: {
      textAlign: "center", padding: "80px 40px", color: "#444",
    },
    apiNote: {
      marginTop: 60, padding: "24px 28px", background: "#0d0d0d",
      border: "1px solid #1e1e1e", borderRadius: 12,
    },
  };

  return (
    <div style={F.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={F.nav}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#666", fontSize: 13, fontWeight: 500, transition: "color 0.18s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#f0ece3"}
          onMouseLeave={e => e.currentTarget.style.color = "#666"}
        >
          ← Brand Board Builder
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#e94560,#c62a42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0ece3" }}>Brand Library</span>
        </div>
        <span style={{ fontSize: 11, color: "#333" }}>{brands.length} brands</span>
      </nav>

      {/* HERO */}
      <div style={F.hero}>
        <h1 style={F.headline}>
          The World's{" "}
          <span style={F.headlineAccent}>Brand Library</span>
        </h1>
        <p style={F.sub}>
          Study how iconic brands define themselves — from color and typography to archetype and mission. Updated year by year.
        </p>
        <div style={F.searchWrap}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search brands, industries, archetypes..."
            style={F.searchInput}
            onFocus={e => e.target.style.borderColor = "#444"}
            onBlur={e => e.target.style.borderColor = "#2a2a2a"}
          />
          <span style={F.searchIcon}>⌕</span>
        </div>
      </div>

      <div style={F.content}>

        {/* FILTER ROW */}
        <div style={{ marginBottom: 48 }}>
          <div style={F.sectionLabel}>Filter by Archetype</div>
          <div style={F.filterRow}>
            <button onClick={() => setArchetype("")} style={F.chip(!archetype, "#e94560")}>All</button>
            {facets.archetypes.map(a => (
              <button key={a} onClick={() => setArchetype(a === archetype ? "" : a)}
                style={F.chip(archetype === a, ARCHETYPE_COLORS[a] || "#666")}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* FEATURED */}
        {!loading && featured.length > 0 && !q && !archetype && (
          <div style={{ marginBottom: 56 }}>
            <div style={F.sectionLabel}>Featured Brands</div>
            <div style={F.featuredGrid}>
              {featured.map(b => <BrandCard key={b.slug} brand={b} featured />)}
            </div>
          </div>
        )}

        {/* ALL BRANDS */}
        {(q || archetype || featured.length === 0) ? null : (
          <div style={{ ...F.sectionLabel, marginBottom: 20 }}>
            {q ? `Results for "${q}"` : "All Brands"}
          </div>
        )}
        {(q || archetype) && (
          <div style={{ ...F.sectionLabel, marginBottom: 20 }}>
            {brands.length} brand{brands.length !== 1 ? "s" : ""}{q ? ` matching "${q}"` : ""}{archetype ? ` · ${archetype}` : ""}
          </div>
        )}

        {loading ? (
          <div style={F.grid}>
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : brands.length === 0 ? (
          <div style={F.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 16, color: "#555" }}>No brands match your search</div>
            <button onClick={() => { setQ(""); setArchetype(""); }} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #2a2a2a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={F.grid}>
            {(q || archetype ? brands : all).map(b => <BrandCard key={b.slug} brand={b} />)}
          </div>
        )}

        {/* API / LLM NOTE */}
        <div style={F.apiNote}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Open API — For Developers & AI
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
            All brand data is available as structured JSON — no authentication required.{" "}
            <code style={{ background: "#161616", padding: "2px 7px", borderRadius: 4, fontSize: 12, color: "#777", fontFamily: "monospace" }}>
              GET /functions/v1/search-brands?q=apple
            </code>{" "}
            · See{" "}
            <a href="/llms.txt" style={{ color: "#555", textDecoration: "underline" }}>llms.txt</a>{" "}
            for full API reference.
          </div>
        </div>
      </div>
    </div>
  );
}
