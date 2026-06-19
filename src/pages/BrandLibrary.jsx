import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { searchBrands } from "../lib/brands";
import BrandCard from "../components/BrandCard";

function rgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "80,80,80" : `${r},${g},${b}`;
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)", background: "#0c0c0c" }}>
      <div style={{ height: 160, background: "#141414", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: 22, background: "#1e1e1e" }} />
      </div>
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ height: 20, width: "55%", background: "#1a1a1a", borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 12, width: "85%", background: "#161616", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, width: "65%", background: "#161616", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ height: 10, width: 100, background: "#161616", borderRadius: 4, marginBottom: 12 }} />
      </div>
      <div style={{ display: "flex", height: 5, margin: "0 20px", borderRadius: 3, overflow: "hidden", gap: 2 }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, background: "#181818" }} />)}
      </div>
      <div style={{ height: 18 }} />
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
          <span style={{ fontSize: 13, fontWeight: 700 }}>Brand Library</span>
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
        <p style={{ fontSize: 15, color: "#555", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.65 }}>
          {brands.length || 15} iconic brands decoded — colors, fonts, archetype, mission, and year-by-year evolution.
        </p>
        <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search brands, industries, archetypes..."
            style={{ width: "100%", padding: "14px 48px 14px 18px", fontSize: 14, background: "#111", border: "1px solid #222", borderRadius: 12, color: "#f0ece3", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = "#444"}
            onBlur={e => e.target.style.borderColor = "#222"}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#444", fontSize: 18, pointerEvents: "none" }}>⌕</span>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 40px 80px" }}>
        {/* FILTERS */}
        <div style={{ marginBottom: 32, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setArchetype("")} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: !archetype ? "1px solid #e94560" : "1px solid #222",
            background: !archetype ? "rgba(233,69,96,0.12)" : "#0c0c0c",
            color: !archetype ? "#e94560" : "#555", transition: "all 0.18s",
          }}>All {brands.length || 15}</button>
          {facets.archetypes.map(a => (
            <button key={a} onClick={() => setArchetype(a === archetype ? "" : a)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: archetype === a ? `1px solid ${ARCHETYPE_COLORS[a] || "#666"}` : "1px solid #222",
              background: archetype === a ? `rgba(${rgb(ARCHETYPE_COLORS[a] || "#666")},0.12)` : "#0c0c0c",
              color: archetype === a ? (ARCHETYPE_COLORS[a] || "#f0ece3") : "#555", transition: "all 0.18s",
            }}>{a}</button>
          ))}
          {isFiltered && (
            <button onClick={() => { setQ(""); setArchetype(""); }} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, color: "#555", background: "none", border: "1px solid #222", cursor: "pointer" }}>
              Clear ×
            </button>
          )}
        </div>

        {/* GRID */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : brands.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: "#444" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 15 }}>No brands match</div>
            <button onClick={() => { setQ(""); setArchetype(""); }} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#777", cursor: "pointer", fontSize: 13 }}>
              Show all
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {brands.map(b => <BrandCard key={b.slug} brand={b} />)}
          </div>
        )}

        {/* API NOTE */}
        <div style={{ marginTop: 60, padding: "20px 24px", background: "#0c0c0c", border: "1px solid #161616", borderRadius: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Open API</div>
          <div style={{ fontSize: 12, color: "#333", lineHeight: 1.7 }}>
            No auth required ·{" "}
            <code style={{ background: "#141414", padding: "2px 7px", borderRadius: 4, fontSize: 11, color: "#555", fontFamily: "monospace" }}>GET /functions/v1/search-brands?q=nike</code>
            {" "}· <a href="/llms.txt" style={{ color: "#444", textDecoration: "underline" }}>llms.txt</a>
          </div>
        </div>
      </div>
    </div>
  );
}
