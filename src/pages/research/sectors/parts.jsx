import { Link } from "react-router-dom";

// Same archetype colors as the Brand Library chips, so an archetype reads
// the same everywhere. Used only for data marks, never for app chrome.
export const ARCHETYPE_COLORS = {
  innocent: "#0097A7", everyman: "#5D4037", hero: "#C62828", outlaw: "#BF360C",
  explorer: "#2E7D32", creator: "#6A1B9A", ruler: "#37474F", magician: "#4A148C",
  lover: "#AD1457", caregiver: "#00838F", jester: "#F9A825", sage: "#1565C0",
};

export function Crumbs({ items }) {
  return (
    <nav className="sx-crumbs" aria-label="Breadcrumb">
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
      <div className="sx-mixbar" role="img" aria-label={mix.map((a) => `${a.name} ${a.count} of ${n}`).join(", ")}>
        {mix.map((a) => (
          <span key={a.slug} style={{ flex: a.count, background: ARCHETYPE_COLORS[a.slug] || "#8E8E93" }} />
        ))}
      </div>
      <div className="sx-legend">
        {mix.map((a) => (
          <span key={a.slug}><i style={{ background: ARCHETYPE_COLORS[a.slug] || "#8E8E93" }} />{a.name.replace("The ", "")} {a.count}</span>
        ))}
      </div>
    </>
  );
}

export function ClosingCta({ heading = "Chart your own brand on the same lens" }) {
  return (
    <section className="sx-cta">
      <h2>{heading}</h2>
      <p>Every brand above was decoded into archetype, voice, colors and type. Build that record for your brand, or scan your live site and see where it already stands.</p>
      <div className="sx-cta-btns">
        <Link to="/builder" className="sx-btn sx-btn-primary">Chart your brand</Link>
        <Link to="/analyzer" className="sx-btn sx-btn-ghost">Scan your site</Link>
      </div>
    </section>
  );
}

export function LoadState({ loading, error }) {
  if (error) return <div className="sx-empty">The brand index could not be loaded right now. <Link to="/brands" style={{ color: "#0071E3" }}>Browse the library</Link> instead.</div>;
  if (loading) {
    return (
      <div style={{ padding: "36px 0", display: "grid", gap: 14 }} aria-busy="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="sx-skel" style={{ height: 72 }} />)}
      </div>
    );
  }
  return null;
}
