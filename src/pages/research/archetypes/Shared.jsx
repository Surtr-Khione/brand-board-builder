import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Sets the document title and meta description for a research page (the
// prerendered HTML carries the same values for crawlers).
export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", description);
    }
  }, [title, description]);
}

function luma(hex = "") {
  const h = String(hex).replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? 0 : (r * 299 + g * 587 + b * 114) / 1000;
}

// Small app-icon face for a brand: its stored logo, else its initial on the
// brand's first light-safe color.
export function Face({ brand, link = true }) {
  const [broken, setBroken] = useState(false);
  const ink = [brand.primary_color, brand.accent_color, brand.secondary_color].find((c) => c && luma(c) < 200) || "#1D1D1F";
  const inner = brand.logo_url && !broken
    ? <img src={brand.logo_url} alt="" loading="lazy" onError={() => setBroken(true)} />
    : <span style={{ color: ink }}>{String(brand.brand_name || "?").charAt(0)}</span>;
  if (!link) return <span className="arx-face" title={brand.brand_name}>{inner}</span>;
  return <Link to={`/brands/${brand.slug}`} className="arx-face" title={brand.brand_name} aria-label={brand.brand_name}>{inner}</Link>;
}

export function ResearchCta() {
  return (
    <div className="arx-cta">
      <h2>Chart your own brand</h2>
      <p>Every brand above was decoded on the same lens. Build your own board with an archetype, enemy, values and voice, or scan your site and see what it already says.</p>
      <div className="arx-btns">
        <Link className="arx-btn primary" to="/builder">Chart your brand</Link>
        <Link className="arx-btn ghost" to="/analyzer">Scan your site</Link>
      </div>
      <Link className="arx-back" to="/research">← All brand research</Link>
    </div>
  );
}
