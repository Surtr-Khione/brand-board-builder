import { Link, useLocation } from "react-router-dom";

const STARLIGHT = "#F5F5F7";
const TITANIUM = "#8E8E93";
const ACCENT_BLUE = "#0071E3";

const NAV_LINKS = [
  { to: "/analyzer", label: "Analyzer" },
  { to: "/builder", label: "Builder" },
  { to: "/brands", label: "Library" },
  { to: "/blog", label: "Blog" },
];

export function OrbitMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="bmd-mark-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F5F5F7" />
          <stop offset="35%" stopColor="#C9BDAF" />
          <stop offset="70%" stopColor="#5A5A5E" />
          <stop offset="100%" stopColor="#1D1D1F" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="url(#bmd-mark-grad)" />
      <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(100,210,255,0.35)" strokeWidth="0.75" />
    </svg>
  );
}

export default function SiteNav({ transparent = false }) {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        flexWrap: "wrap",
        rowGap: 10,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px clamp(20px, 5vw, 40px)",
        background: transparent ? "transparent" : "rgba(0,0,0,0.72)",
        backdropFilter: "blur(18px) saturate(1.6)",
        WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Link to="/" className="bmd-navlink" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        <OrbitMark />
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: STARLIGHT, letterSpacing: "-0.2px" }}>
          BrandMD
          <span style={{ fontWeight: 400, fontSize: 13, color: TITANIUM, marginLeft: 1 }}>.space</span>
        </span>
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to || pathname.startsWith(link.to + "/");
            return (
              <Link
                key={link.to}
                to={link.to}
                className="bmd-navlink"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.1px",
                  textDecoration: "none",
                  color: active ? STARLIGHT : TITANIUM,
                  borderBottom: active ? `1px solid ${ACCENT_BLUE}` : "1px solid transparent",
                  paddingBottom: 3,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <Link
          to="/builder"
          className="bmd-cta"
          style={{
            padding: "8px 18px",
            borderRadius: 100,
            background: ACCENT_BLUE,
            color: "#FFFFFF",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Chart your brand
        </Link>
      </div>
    </nav>
  );
}
