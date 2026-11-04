import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchBrands } from "../../../lib/brands";
import "./versus.css";

// The whole index fits in one list call (search-brands caps limit at 100).
// List mode is read-only (slug mode bumps a view counter), and one cached
// promise serves the hub and every pair page in a session.
let indexPromise = null;
function loadIndex() {
  if (!indexPromise) {
    indexPromise = searchBrands({ limit: 100 })
      .then((d) => ({ brands: d?.brands || [], total: d?.totalBrands || (d?.brands || []).length }))
      .catch(() => { indexPromise = null; return { brands: [], total: 0 }; });
  }
  return indexPromise;
}

export function useBrandIndex() {
  const [state, setState] = useState({ loading: true, brands: [], total: 0 });
  useEffect(() => {
    let live = true;
    loadIndex().then((r) => { if (live) setState({ loading: false, ...r }); });
    return () => { live = false; };
  }, []);
  return state;
}

// Title + meta description for client-side navigation (the prerendered HTML
// carries the same values for crawlers).
export function useMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
      m.setAttribute("content", description);
    }
  }, [title, description]);
}

export function Swatches({ colours, size = 14 }) {
  if (!colours?.length) return null;
  return (
    <span className="vs-swatches">
      {colours.map((c, i) => (
        <span key={i} className="vs-swatch" title={`${c.role} ${c.hex}`} style={{ background: c.hex, width: size, height: size }} />
      ))}
    </span>
  );
}

export function ClosingCta() {
  return (
    <section className="vs-cta">
      <h2>Chart your own brand</h2>
      <p>
        Every comparison here is built from a documented brand system: archetype, enemy, promise,
        values, voice, colours and type. Put yours on record and see where it lands.
      </p>
      <div className="vs-cta-row">
        <Link to="/builder" className="vs-btn vs-btn-primary">Chart your brand</Link>
        <Link to="/analyzer" className="vs-btn">Scan your site</Link>
      </div>
    </section>
  );
}

export function Spinner() {
  return (
    <div className="vs-loading" aria-label="Loading">
      <div className="vs-spin" />
    </div>
  );
}
