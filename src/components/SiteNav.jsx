import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const STARLIGHT = "#F5F5F7";
const TITANIUM = "#8E8E93";
const ACCENT_BLUE = "#0071E3";

const NAV_LINKS = [
  { to: "/analyzer", label: "Analyzer" },
  { to: "/start", label: "Start" },
  { to: "/builder", label: "Builder" },
  { to: "/check", label: "Check" },
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = (e) => { setIsMobile(e.matches); if (!e.matches) setOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Menu closes on navigation
  useEffect(() => { setOpen(false); }, [pathname]);
  // Lock scroll behind the sheet
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px clamp(18px, 5vw, 40px)",
          background: transparent && !open ? "transparent" : "rgba(0,0,0,0.72)",
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

        {isMobile ? (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            style={{
              width: 40, height: 40, borderRadius: 100, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.05)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4.5,
            }}
          >
            <span style={{ width: 15, height: 1.5, background: STARLIGHT, borderRadius: 2, transition: "transform 0.25s ease", transform: open ? "translateY(3px) rotate(45deg)" : "none" }} />
            <span style={{ width: 15, height: 1.5, background: STARLIGHT, borderRadius: 2, transition: "transform 0.25s ease", transform: open ? "translateY(-3px) rotate(-45deg)" : "none" }} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {NAV_LINKS.map((link) => {
                const active = pathname === link.to || pathname.startsWith(link.to + "/");
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="bmd-navlink"
                    style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                      letterSpacing: "-0.1px", textDecoration: "none",
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
                padding: "8px 18px", borderRadius: 100, background: ACCENT_BLUE, color: "#FFFFFF",
                textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
              }}
            >
              Chart your brand
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile menu sheet */}
      {isMobile && open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 55, paddingTop: 86,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(22px)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}
        >
          {NAV_LINKS.map((link, i) => {
            const active = pathname === link.to || pathname.startsWith(link.to + "/");
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 600, letterSpacing: "-0.5px",
                  textDecoration: "none", color: active ? "#7DBEFF" : STARLIGHT, padding: "12px 24px",
                  opacity: 0, animation: `bmd-menu-in 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s forwards`,
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/builder"
            className="bmd-cta"
            style={{
              marginTop: 18, padding: "14px 34px", borderRadius: 100, background: ACCENT_BLUE, color: "#fff",
              textDecoration: "none", fontSize: 16, fontWeight: 600, fontFamily: "'Inter', sans-serif",
              opacity: 0, animation: "bmd-menu-in 0.35s cubic-bezier(0.16,1,0.3,1) 0.28s forwards",
            }}
          >
            Chart your brand
          </Link>
          <style>{`@keyframes bmd-menu-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
        </div>
      )}
    </>
  );
}
