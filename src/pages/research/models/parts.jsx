import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchBrands } from "../../../lib/brands";

// ── Data: the whole public index, loaded once per session ────────────────
// search-brands caps a page at 100 rows, so page through until a short page.
let cache = null;
let inflight = null;

async function loadAll() {
  const all = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const data = await searchBrands({ limit: 100, offset });
    const page = Array.isArray(data?.brands) ? data.brands : [];
    all.push(...page);
    if (page.length < 100) break;
  }
  return all.sort((a, b) => String(a.brand_name).localeCompare(String(b.brand_name)));
}

export function useModelIndex() {
  const [state, setState] = useState(() => (cache ? { brands: cache, loading: false, error: null } : { brands: [], loading: true, error: null }));
  useEffect(() => {
    if (cache) return;
    let alive = true;
    inflight ||= loadAll();
    inflight
      .then((brands) => { cache = brands; if (alive) setState({ brands, loading: false, error: null }); })
      .catch((e) => { inflight = null; if (alive) setState({ brands: [], loading: false, error: e?.message || "Could not load the index" }); });
    return () => { alive = false; };
  }, []);
  return state;
}

// Title + meta description for client-side navigation (the prerendered HTML
// carries the same values for crawlers).
export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", description);
    }
  }, [title, description]);
}

// Same archetype colors as the Brand Library chips and the sector pages.
// Data marks only, never app chrome.
export const ARCHETYPE_COLORS = {
  innocent: "#0097A7", everyman: "#5D4037", hero: "#C62828", outlaw: "#BF360C",
  explorer: "#2E7D32", creator: "#6A1B9A", ruler: "#37474F", magician: "#4A148C",
  lover: "#AD1457", caregiver: "#00838F", jester: "#F9A825", sage: "#1565C0",
};

function luma(hex = "") {
  const h = String(hex).replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? 0 : (r * 299 + g * 587 + b * 114) / 1000;
}

// Small app-icon face for a brand row: its stored logo, else its initial on
// white in the brand's first recorded color dark enough to read.
export function Face({ row, link = true }) {
  const [broken, setBroken] = useState(false);
  const ink = row.colors.map((c) => c.hex).find((c) => luma(c) < 200) || "#1D1D1F";
  const inner = row.logo && !broken
    ? <img src={row.logo} alt="" loading="lazy" onError={() => setBroken(true)} />
    : <span style={{ color: ink }}>{String(row.name || "?").charAt(0)}</span>;
  if (!link) return <span className="mx-face" title={row.name}>{inner}</span>;
  return <Link to={`/brands/${row.slug}`} className="mx-face" title={row.name} aria-label={row.name}>{inner}</Link>;
}

export function Crumbs({ items }) {
  return (
    <nav className="mx-crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={it.label}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
          {i < items.length - 1 && <span aria-hidden="true" style={{ marginLeft: 8 }}>/</span>}
        </span>
      ))}
    </nav>
  );
}

export function MixBar({ mix, n }) {
  return (
    <>
      <div className="mx-mixbar" role="img" aria-label={mix.map((a) => `${a.name} ${a.count} of ${n}`).join(", ")}>
        {mix.map((a) => <span key={a.slug} style={{ flex: a.count, background: ARCHETYPE_COLORS[a.slug] || "#8E8E93" }} />)}
      </div>
      <div className="mx-legend">
        {mix.map((a) => <span key={a.slug}><i style={{ background: ARCHETYPE_COLORS[a.slug] || "#8E8E93" }} />{a.name.replace("The ", "")} {a.count}</span>)}
      </div>
    </>
  );
}

export function BrandLinks({ brands }) {
  return brands.map((b, i) => (
    <span key={b.slug}>
      <Link to={`/brands/${b.slug}`}>{b.name}</Link>{i < brands.length - 1 ? ", " : ""}
    </span>
  ));
}

export function ClosingCta({ heading = "Chart your own brand on the same lens" }) {
  return (
    <section className="mx-cta">
      <h2>{heading}</h2>
      <p>Every brand above was decoded into archetype, voice, colors and type. Build that record for your brand, or scan your live site and see where it already stands.</p>
      <div className="mx-cta-btns">
        <Link to="/builder" className="mx-btn mx-btn-primary">Build your brand</Link>
        <Link to="/analyzer" className="mx-btn mx-btn-ghost">Scan your site</Link>
      </div>
    </section>
  );
}

export function LoadState({ loading, error }) {
  if (error) return <div className="mx-empty">The brand index could not be loaded right now. <Link to="/brands" style={{ color: "#0071E3" }}>Browse the library</Link> instead.</div>;
  if (loading) {
    return (
      <div style={{ padding: "36px 0", display: "grid", gap: 14 }} aria-busy="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="mx-skel" style={{ height: 72 }} />)}
      </div>
    );
  }
  return null;
}
