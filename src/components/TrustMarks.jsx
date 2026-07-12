import { useState } from "react";
import { Link } from "react-router-dom";

// Borrowed-trust surfaces: the library's world-class brands, rendered as
// quiet monochrome marks that take color on hover. Trust by association,
// stated as fact — these brands ARE in the index with public scores.

const SANS = "'Inter', -apple-system, sans-serif";
const TITANIUM = "#8E8E93";

// The hero credibility row — chosen for instant recognition + prestige spread
export const MARQUE_BRANDS = [
  { slug: "apple", domain: "apple.com", name: "Apple" },
  { slug: "nike", domain: "nike.com", name: "Nike" },
  { slug: "rolex", domain: "rolex.com", name: "Rolex" },
  { slug: "porsche", domain: "porsche.com", name: "Porsche" },
  { slug: "google", domain: "google.com", name: "Google" },
  { slug: "lego", domain: "lego.com", name: "LEGO" },
  { slug: "mastercard", domain: "mastercard.com", name: "Mastercard" },
  { slug: "ferrari", domain: "ferrari.com", name: "Ferrari" },
];

export function LogoTile({ domain, name, size = 30, radius = 8, mono = true }) {
  const [idx, setIdx] = useState(0);
  const sources = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ];
  return (
    <span style={{
      width: size, height: size, borderRadius: radius, background: "#FFFFFF",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", flexShrink: 0,
    }}>
      {sources[idx] ? (
        <img
          src={sources[idx]} alt={name} loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          className={mono ? "bmd-trust-logo" : undefined}
          style={{ width: Math.round(size * 0.62), height: Math.round(size * 0.62), objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.45), fontWeight: 800, color: "#111", fontFamily: SANS }}>{name.charAt(0)}</span>
      )}
    </span>
  );
}

// Hero credibility band: "the same lens we run on <marks>"
export function TrustBand({ totalBrands }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: TITANIUM, letterSpacing: 1.6,
        textTransform: "uppercase", marginBottom: 14, textShadow: "0 2px 14px rgba(0,0,0,0.9)",
      }}>
        The same lens we run on
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
        {MARQUE_BRANDS.map((b) => (
          <Link key={b.slug} to={`/brands/${b.slug}`} title={`${b.name} — brand profile`} className="bmd-logo-chip">
            <LogoTile domain={b.domain} name={b.name} />
          </Link>
        ))}
        <Link
          to="/brands"
          className="bmd-link"
          style={{ fontSize: 12.5, color: TITANIUM, textDecoration: "none", fontWeight: 600, marginLeft: 4, whiteSpace: "nowrap" }}
        >
          + {totalBrands ? totalBrands - MARQUE_BRANDS.length : "79"} more ›
        </Link>
      </div>
    </div>
  );
}

// A marquee pill: logo, name, live Gravity Score — links to the public profile
export function BrandPill({ brand }) {
  // No scores on the homepage until the algorithm is dialed in — library
  // scores currently measure profile completeness, which reads as a verdict
  // on the brand itself and clusters weirdly (Nike at 60 next to CVS at 80).
  const domain = brand.website?.replace(/^https?:\/\//, "").split("/")[0];
  return (
    <Link
      to={`/brands/${brand.slug}`}
      className="bmd-logo-pill"
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0,
        padding: "8px 16px 8px 8px", borderRadius: 100, textDecoration: "none",
        border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.02)",
      }}
    >
      {domain && <LogoTile domain={domain} name={brand.brand_name} size={26} radius={100} />}
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#F5F5F7", fontFamily: SANS, whiteSpace: "nowrap" }}>{brand.brand_name}</span>
    </Link>
  );
}

// Section ornament: a thin rule with a single quiet orbit at its center —
// the space theme carried as a hairline, not a mural.
export function OrbitRule({ width = 220 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 auto 22px", width, maxWidth: "70%" }} aria-hidden="true">
      <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(245,245,247,0.22))" }} />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <ellipse cx="9" cy="9" rx="8" ry="4.6" stroke="rgba(245,245,247,0.35)" strokeWidth="0.8" transform="rotate(-18 9 9)" />
        <circle cx="9" cy="9" r="1.6" fill="#0071E3" />
      </svg>
      <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(245,245,247,0.22), transparent)" }} />
    </div>
  );
}
