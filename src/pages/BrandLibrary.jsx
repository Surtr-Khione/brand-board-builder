import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { searchBrands } from "../lib/brands";
import BrandCard from "../components/BrandCard";
import SiteNav from "../components/SiteNav";
import {
  ARCHETYPES, EXPRESSIONS, SECTORS, MODELS,
  archetypeOf, sectorsOf, modelsOf, archetypeBySlug, sectorBySlug, modelBySlug, expressionBySlug,
} from "../lib/brandTaxonomy";

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

// Same archetype colors as the research pages. Used as a border and tint on
// the selected chip only; chip text stays off-white so it keeps AA contrast.
const ARCHETYPE_COLORS = {
  innocent: "#0097A7", everyman: "#5D4037", hero: "#C62828", outlaw: "#BF360C",
  explorer: "#2E7D32", creator: "#6A1B9A", ruler: "#37474F", magician: "#4A148C",
  lover: "#AD1457", caregiver: "#00838F", jester: "#F9A825", sage: "#1565C0",
};
const BLUE = "#0071E3";

// Filter rows: wrap on desktop, one horizontal scroll row each at phone width.
const CSS = `
.bl-hero { padding: 60px 40px 48px; }
.bl-body { max-width: 1320px; margin: 0 auto; padding: 36px 40px 80px; }
.bl-filters { margin-bottom: 28px; display: grid; gap: 10px; }
.bl-row { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.bl-label { flex: 0 0 116px; padding-top: 9px; font-size: 9px; letter-spacing: 2.5px; font-weight: 800; text-transform: uppercase; color: #8E8E93; }
.bl-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.bl-chip { padding: 6px 13px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #222; background: #0c0c0c; color: #8E8E93; transition: border-color .18s, background .18s, color .18s; font-family: inherit; white-space: nowrap; }
.bl-chip:hover { color: #F5F5F7; border-color: #3a3a3a; }
.bl-chip .bl-n { font-weight: 500; margin-left: 4px; font-variant-numeric: tabular-nums; }
.bl-chip:focus-visible { outline: 2px solid ${BLUE}; outline-offset: 2px; }
.bl-sub .bl-label { color: #6E6E73; }
.bl-sub .bl-chip { font-size: 10.5px; padding: 5px 11px; }
.bl-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin-top: 4px; font-size: 11px; color: #8E8E93; }
.bl-meta b { color: #F5F5F7; font-weight: 600; }
.bl-note { font-size: 11px; color: #8E8E93; line-height: 1.6; margin: 2px 0 0; }
@media (max-width: 640px) {
  .bl-hero { padding: 40px 16px 32px; }
  .bl-body { padding: 24px 16px 64px; }
  .bl-row { flex-direction: column; align-items: stretch; gap: 6px; }
  .bl-label { flex: none; padding-top: 0; }
  .bl-chips { flex-wrap: nowrap; overflow-x: auto; margin: 0 -16px; padding: 0 16px 4px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .bl-chips::-webkit-scrollbar { display: none; }
  .bl-chip { flex: 0 0 auto; }
}
`;

function Chip({ active, color = BLUE, onClick, count, title, children }) {
  return (
    <button
      type="button"
      className="bl-chip"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      style={active ? { borderColor: color, background: `rgba(${rgb(color)},0.18)`, color: "#F5F5F7" } : undefined}
    >
      {children}{count !== undefined && <span className="bl-n">{count}</span>}
    </button>
  );
}

function Row({ label, sub, children }) {
  return (
    <div className={`bl-row${sub ? " bl-sub" : ""}`} role="group" aria-label={label}>
      <div className="bl-label">{label}</div>
      <div className="bl-chips">{children}</div>
    </div>
  );
}

const short = (name) => String(name || "").replace(/^The /, "");

export default function BrandLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState([]);
  const [totalBrands, setTotalBrands] = useState(null);
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  // Filters start from the URL (/brands?sector=technology links in from the
  // sector pages) and are written back to it, so a filtered view can be shared.
  const [archetype, setArchetype] = useState(() => (archetypeBySlug(searchParams.get("archetype")) ? searchParams.get("archetype") : ""));
  const [expression, setExpression] = useState(() => {
    const a = searchParams.get("archetype"), e = searchParams.get("expression");
    return a && e && (e === "pure" || expressionBySlug(a, e)) ? e : "";
  });
  const [sector, setSector] = useState(() => (sectorBySlug(searchParams.get("sector")) ? searchParams.get("sector") : ""));
  const [model, setModel] = useState(() => (modelBySlug(searchParams.get("model")) ? searchParams.get("model") : ""));
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debounced, setDebounced] = useState(() => searchParams.get("q") || "");

  useEffect(() => {
    document.title = brands.length
      ? `Brand Library — ${brands.length} Iconic Brands Decoded`
      : "Brand Library — Iconic Brands Decoded";
  }, [brands.length]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced) next.set("q", debounced);
    if (archetype) next.set("archetype", archetype);
    if (archetype && expression) next.set("expression", expression);
    if (sector) next.set("sector", sector);
    if (model) next.set("model", model);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, archetype, expression, sector, model]);

  const load = useCallback(async () => {
    setLoading(true);
    // The whole index fits in one page (search-brands caps limit at 100), so
    // load every match and filter on the client by the canonical taxonomy:
    // the stored labels are free text ("Caregiver", "The Caretaker", hybrids),
    // and a server-side exact match would split one archetype into many chips.
    const data = await searchBrands({ q: debounced, featured: verifiedOnly || undefined, limit: 100 });
    setBrands(data.brands || []);
    if (data.totalBrands) setTotalBrands(data.totalBrands);
    setLoading(false);
  }, [debounced, verifiedOnly]);

  useEffect(() => { load(); }, [load]);

  // One taxonomy reading per brand: archetype family + the expression its own
  // primary label names ("" = the label names the family only), every sector
  // tag (primary first) and every business-model tag.
  const info = useMemo(() => {
    const m = {};
    for (const b of brands) {
      const a = archetypeOf(b);
      m[b.slug] = {
        fam: a?.family.slug || null,
        expr: a?.expression?.slug || "",
        sectors: sectorsOf(b).all.map((s) => s.slug),
        models: modelsOf(b).map((x) => x.slug),
      };
    }
    return m;
  }, [brands]);

  // Each facet is tested on its own so a chip's count can ignore its own row:
  // the counts on a row are what you would get by picking that chip, given
  // every OTHER active filter (and the search).
  const test = {
    fam: (i) => !archetype || i.fam === archetype,
    expr: (i) => !archetype || !expression || (expression === "pure" ? !i.expr : i.expr === expression),
    sector: (i) => !sector || i.sectors.includes(sector),
    model: (i) => !model || i.models.includes(model),
  };
  const pass = (b, skip) => {
    const i = info[b.slug];
    if (!i) return false;
    return Object.entries(test).every(([k, fn]) => skip.includes(k) || fn(i));
  };

  const facets = useMemo(() => {
    const famPool = brands.filter((b) => pass(b, ["fam", "expr"]));
    const famCount = {};
    for (const b of famPool) { const f = info[b.slug].fam; if (f) famCount[f] = (famCount[f] || 0) + 1; }

    const exprCount = {};
    let pure = 0;
    if (archetype) {
      for (const b of brands.filter((x) => pass(x, ["expr"]))) {
        const e = info[b.slug].expr;
        if (e) exprCount[e] = (exprCount[e] || 0) + 1; else pure++;
      }
    }

    const secCount = {};
    for (const b of brands.filter((x) => pass(x, ["sector"]))) for (const s of info[b.slug].sectors) secCount[s] = (secCount[s] || 0) + 1;

    const modCount = {};
    for (const b of brands.filter((x) => pass(x, ["model"]))) for (const m of info[b.slug].models) modCount[m] = (modCount[m] || 0) + 1;

    return {
      allCount: famPool.length,
      families: ARCHETYPES.filter((a) => famCount[a.slug] || a.slug === archetype).map((a) => ({ ...a, count: famCount[a.slug] || 0 })),
      expressions: EXPRESSIONS.filter((e) => e.family === archetype && (exprCount[e.slug] || e.slug === expression))
        .map((e) => ({ ...e, count: exprCount[e.slug] || 0 }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      pure,
      sectors: SECTORS.filter((s) => secCount[s.slug] || s.slug === sector).map((s) => ({ ...s, count: secCount[s.slug] || 0 })),
      models: MODELS.filter((m) => modCount[m.slug] || m.slug === model).map((m) => ({ ...m, count: modCount[m.slug] || 0 })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, info, archetype, expression, sector, model]);

  const visible = brands.filter((b) => pass(b, []));
  const isFiltered = !!debounced || !!archetype || !!sector || !!model || verifiedOnly;
  const clearAll = () => { setQ(""); setArchetype(""); setExpression(""); setSector(""); setModel(""); setVerifiedOnly(false); };
  const pickFamily = (slug) => { setArchetype(slug === archetype ? "" : slug); setExpression(""); };
  const famName = archetype ? short(archetypeBySlug(archetype)?.name) : "";
  const anyMapped = facets.expressions.some((e) => e.mapped);

  return (
    <div style={{ background: "#000000", color: "#F5F5F7", fontFamily: "'Inter', -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <SiteNav />

      {/* HERO */}
      <div className="bl-hero" style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 58px)", fontWeight: 700, letterSpacing: "-1.8px", lineHeight: 1.05, color: "#F5F5F7", margin: "0 0 10px" }}>
          Star Charts <span style={{ color: "#0071E3" }}>of the Greats</span>
        </h1>
        <p style={{ fontSize: 15, color: "#8E8E93", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.65 }}>
          {totalBrands || brands.length || 15} iconic brands decoded — colors, fonts, archetype, mission, and year-by-year evolution.
        </p>
        <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search brands, industries, archetypes..."
            aria-label="Search the brand library"
            style={{ width: "100%", padding: "14px 48px 14px 18px", fontSize: 14, background: "#111", border: "1px solid #222", borderRadius: 12, color: "#f0ece3", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = "#444"}
            onBlur={e => e.target.style.borderColor = "#222"}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#444", fontSize: 18, pointerEvents: "none" }}>⌕</span>
        </div>
      </div>

      <div className="bl-body">
        {/* FILTERS: archetype family (+ expression), sector tag, business model */}
        <div className="bl-filters">
          <Row label="Archetype">
            <Chip active={!archetype} onClick={() => pickFamily("")} count={facets.allCount}>All</Chip>
            {facets.families.map(({ slug, name, count }) => (
              <Chip key={slug} active={archetype === slug} color={ARCHETYPE_COLORS[slug]} onClick={() => pickFamily(slug)} count={count}>{short(name)}</Chip>
            ))}
          </Row>

          {/* Only when the family has a named expression to narrow by. */}
          {archetype && facets.expressions.length > 0 && (
            <Row label={`${famName} as`} sub>
              {facets.expressions.map((e) => (
                <Chip
                  key={e.id}
                  active={expression === e.slug}
                  color={ARCHETYPE_COLORS[archetype]}
                  onClick={() => setExpression(expression === e.slug ? "" : e.slug)}
                  count={e.count}
                  title={`${e.definition}${e.mapped ? " Mapped by BrandMD from the record's own label." : ""}`}
                >{e.name}{e.mapped ? "*" : ""}</Chip>
              ))}
              {facets.pure > 0 && (
                <Chip
                  active={expression === "pure"}
                  color={ARCHETYPE_COLORS[archetype]}
                  onClick={() => setExpression(expression === "pure" ? "" : "pure")}
                  count={facets.pure}
                  title={`Brands whose record names ${famName} with no further expression`}
                >Pure {famName}</Chip>
              )}
            </Row>
          )}

          {facets.sectors.length > 0 && (
            <Row label="Sector">
              {facets.sectors.map((s) => (
                <Chip key={s.slug} active={sector === s.slug} onClick={() => setSector(sector === s.slug ? "" : s.slug)} count={s.count}>{s.name}</Chip>
              ))}
            </Row>
          )}

          {facets.models.length > 0 && (
            <Row label="Business model">
              {facets.models.map((m) => (
                <Chip key={m.slug} active={model === m.slug} onClick={() => setModel(model === m.slug ? "" : m.slug)} count={m.count} title={m.definition}>{m.name}</Chip>
              ))}
            </Row>
          )}

          <div className="bl-meta">
            <span aria-live="polite">{loading ? "Loading…" : <>Showing <b>{visible.length}</b> of {brands.length}</>}</span>
            <Chip active={verifiedOnly} color="#2ecc71" onClick={() => setVerifiedOnly(v => !v)}>✓ Verified only</Chip>
            {isFiltered && <Chip active={false} onClick={clearAll}>Clear ×</Chip>}
          </div>
          <p className="bl-note">
            A brand appears under every sector its recorded industry names, so sector counts add up to more than the total. Business models are tagged only where the industry text names one.
            {archetype && anyMapped ? " * Expression mapped by BrandMD from the record's own label." : ""}
          </p>
        </div>

        {/* GRID */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 16px", color: "#8E8E93" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 15 }}>No brands match</div>
            <button onClick={clearAll} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#C7C7CC", cursor: "pointer", fontSize: 13 }}>
              Show all
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {visible.map(b => <BrandCard key={b.slug} brand={b} />)}
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
