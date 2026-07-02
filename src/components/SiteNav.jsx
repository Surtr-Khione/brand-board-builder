import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/analyzer", label: "Analyzer" },
  { to: "/builder", label: "Builder" },
  { to: "/brands", label: "Library" },
  { to: "/blog", label: "Blog" },
];

export function OrbitMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bmd-core-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF2E88" />
          <stop offset="1" stopColor="#FF6A00" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="16" rx="13.5" ry="6" stroke="rgba(245,243,238,0.35)" strokeWidth="1.2" transform="rotate(-24 16 16)" />
      <circle cx="16" cy="16" r="5.2" fill="url(#bmd-core-grad)" />
      <circle cx="26.5" cy="9.5" r="2.1" fill="#00E5FF" />
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
        padding: "16px clamp(20px, 5vw, 40px)",
        background: transparent ? "transparent" : "rgba(6,6,12,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(245,243,238,0.07)",
      }}
    >
      <Link to="/" className="bmd-navlink" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <OrbitMark />
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, color: "#F5F3EE", letterSpacing: "-0.3px" }}>
          BrandMD
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: "#8A8A99", marginLeft: 2 }}>
            .space
          </span>
        </span>
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 22 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.to || pathname.startsWith(link.to + "/");
            return (
              <Link
                key={link.to}
                to={link.to}
                className="bmd-navlink"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: active ? "#F5F3EE" : "#8A8A99",
                  borderBottom: active ? "1px solid #FF6A00" : "1px solid transparent",
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
            padding: "9px 20px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #FF2E88, #FF6A00)",
            color: "#F5F3EE",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'IBM Plex Sans', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Chart your brand
        </Link>
      </div>
    </nav>
  );
}
