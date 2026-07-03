import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchBrands } from "../lib/brands";
import SiteNav, { OrbitMark } from "../components/SiteNav";
import { BLOG_POSTS } from "../lib/blogPosts";
import { useReveal } from "../lib/useReveal";
import "../styles/space-theme.css";

const VOID = "#000000";
const CHARCOAL = "#1D1D1F";
const GRAPHITE = "#3A3A3C";
const TITANIUM = "#8E8E93";
const TITANIUM_WARM = "#C9BDAF";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const ACCENT_ICE = "#64D2FF";

const SANS = "'Inter', -apple-system, sans-serif";

const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Generated once at module load — a stable, quiet field, not recomputed per render.
const STARS = Array.from({ length: 90 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.1 + 0.4,
  opacityMax: Math.random() * 0.4 + 0.15,
  duration: Math.random() * 5 + 4,
  delay: -Math.random() * 6,
}));

function Reveal({ children, style }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`bmd-reveal${visible ? " bmd-in" : ""}`} style={style}>
      {children}
    </div>
  );
}

function ReticleIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="12" stroke={STARLIGHT} strokeWidth="1.2" opacity="0.85" />
      <circle cx="18" cy="18" r="5" stroke={STARLIGHT} strokeWidth="1.2" opacity="0.85" />
      <circle cx="18" cy="18" r="1.6" fill={ACCENT_BLUE} />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M18 4 L21.5 15 L33 18 L21.5 21 L18 33 L14.5 21 L3 18 L14.5 15 Z" stroke={STARLIGHT} strokeWidth="1.1" opacity="0.85" />
      <circle cx="18" cy="18" r="2" fill={ACCENT_BLUE} />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M18 4 C23.5 9.5 25 16.5 24 23 L12 23 C11 16.5 12.5 9.5 18 4 Z" stroke={STARLIGHT} strokeWidth="1.1" opacity="0.85" />
      <circle cx="18" cy="14.5" r="2.4" stroke={ACCENT_BLUE} strokeWidth="1.1" />
      <path d="M12 23 L7 29 L12 27.5 Z" fill={STARLIGHT} opacity="0.6" />
      <path d="M24 23 L29 29 L24 27.5 Z" fill={STARLIGHT} opacity="0.6" />
    </svg>
  );
}

const MISSIONS = [
  {
    verb: "Observe.",
    Icon: ReticleIcon,
    body: "Scan any live website — or LinkedIn, Instagram, a podcast feed — and get colors, fonts, tone, and your brand archetype back in seconds, free.",
    links: [
      { label: "Run the Analyzer", to: "/analyzer" },
      { label: "Browse the Library", to: "/brands" },
    ],
  },
  {
    verb: "Chart.",
    Icon: CompassIcon,
    body: "Nineteen sections across five phases — strategy, voice, visual system, governance. Nothing decorative; every field feeds the board your team will actually use. Still free.",
    links: [{ label: "Start charting", to: "/builder" }],
  },
  {
    verb: "Launch.",
    Icon: RocketIcon,
    body: "A finished board becomes content — on-brand copy, campaigns, calendars — the ongoing production a brand keeps needing long after the board itself is done.",
    links: [{ label: "Open Content Studio", to: "/studio" }],
  },
];

function StarBrandCard({ brand }) {
  const pc = brand.primary_color || TITANIUM;
  return (
    <Link to={`/brands/${brand.slug}`} className="bmd-card-link" style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
          background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%), ${CHARCOAL}`,
        }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: "50%", flexShrink: 0, background: pc,
          border: "1px solid rgba(255,255,255,0.25)",
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13.5, color: STARLIGHT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {brand.brand_name}
          </div>
          {brand.archetype && (
            <div style={{ fontFamily: SANS, fontSize: 11, color: TITANIUM }}>{brand.archetype.replace("The ", "")}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    document.title = "BrandMD — Gravity, by design.";
    searchBrands({ limit: 15, featured: true }).then((d) => setBrands(d.brands || []));
  }, []);

  const latestPosts = BLOG_POSTS.slice(0, 3);

  return (
    <div style={{ background: VOID, color: STARLIGHT, fontFamily: SANS, minHeight: "100vh" }}>
      <SiteNav transparent />

      {/* ══ HERO — a single precision object, at rest in the dark ══ */}
      <div
        style={{
          position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          padding: "90px 40px 70px", minHeight: 680,
        }}
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {STARS.map((s) => (
            <div
              key={s.id}
              className="bmd-star"
              style={{
                position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
                width: s.size, height: s.size, borderRadius: "50%", background: STARLIGHT,
                "--bmd-tw-min": 0.12, "--bmd-tw-max": s.opacityMax,
                animation: `bmd-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute", inset: 0, zIndex: 0, opacity: 0.025, mixBlendMode: "overlay",
            backgroundImage: GRAIN_BG, backgroundRepeat: "repeat", backgroundSize: "120px 120px", pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, marginBottom: 44 }}>
          <div
            className="bmd-orb"
            style={{
              width: "clamp(180px, 22vw, 280px)", height: "clamp(180px, 22vw, 280px)", borderRadius: "50%",
              background: "radial-gradient(circle at 34% 28%, #FFFFFF 0%, #F5F5F7 8%, #C9BDAF 22%, #8E8E93 46%, #3A3A3C 72%, #0A0A0C 100%)",
              boxShadow: `inset -18px -22px 50px rgba(0,0,0,0.55), inset 10px 8px 30px rgba(255,255,255,0.22), 0 0 90px rgba(100,210,255,0.16)`,
              animation: "bmd-levitate 6s ease-in-out infinite",
            }}
          />
          <div
            className="bmd-orb-shadow"
            style={{
              width: "60%", height: 20, margin: "18px auto 0", borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 72%)",
              animation: "bmd-levitate-shadow 6s ease-in-out infinite",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22 }}>
            Brand intelligence
          </div>
          <h1
            style={{
              fontWeight: 700, fontSize: "clamp(40px, 6.5vw, 80px)",
              lineHeight: 1.04, letterSpacing: "-2.5px", margin: "0 0 22px",
            }}
          >
            Gravity, <span style={{ color: ACCENT_BLUE }}>engineered.</span>
          </h1>
          <p style={{ fontSize: 18, color: TITANIUM, maxWidth: 540, margin: "0 auto 38px", lineHeight: 1.6, fontWeight: 400 }}>
            Scan any site, study the brands that already have it, and chart an
            identity precise enough to hold its shape.
          </p>

          <div style={{ display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap", alignItems: "center", marginBottom: 30 }}>
            <Link
              to="/analyzer"
              className="bmd-cta"
              style={{
                padding: "13px 28px", borderRadius: 100, textDecoration: "none",
                background: ACCENT_BLUE, color: "#FFFFFF", fontSize: 15, fontWeight: 600,
              }}
            >
              Analyze your brand — free
            </Link>
            <Link
              to="/brands"
              className="bmd-link"
              style={{ textDecoration: "none", color: ACCENT_BLUE, fontSize: 15, fontWeight: 500 }}
            >
              Explore the Library &nbsp;›
            </Link>
          </div>

          <div style={{ fontSize: 12.5, color: "#6E6E73", letterSpacing: 0.2 }}>
            {brands.length || 15} brands decoded &nbsp;&middot;&nbsp; 19 brand dimensions &nbsp;&middot;&nbsp; one board
          </div>
        </div>
      </div>

      {/* ══ MISSION SEQUENCE ══ */}
      <div style={{ padding: "10px 40px 120px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", paddingTop: 90 }}>
          <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontWeight: 700, fontSize: "clamp(28px, 4vw, 46px)", letterSpacing: "-1.2px" }}>
              Three instruments. One trajectory.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
            {MISSIONS.map((m, i) => (
              <Reveal key={m.verb} style={{ transitionDelay: `${i * 90}ms` }}>
                <div
                  style={{
                    padding: "36px 30px", borderRadius: 20, height: "100%",
                    background: `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 45%), ${CHARCOAL}`,
                    border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column",
                  }}
                >
                  <m.Icon />
                  <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: "-0.6px", margin: "20px 0 12px" }}>
                    {m.verb}
                  </div>
                  <p style={{ fontSize: 14, color: TITANIUM, lineHeight: 1.65, marginBottom: 20, flex: 1 }}>{m.body}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {m.links.map((l) => (
                      <Link key={l.to} to={l.to} className="bmd-link" style={{ fontSize: 13.5, fontWeight: 500, color: ACCENT_BLUE, textDecoration: "none" }}>
                        {l.label} &nbsp;›
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ══ STAR CHARTS — the brand library ══ */}
      {brands.length > 0 && (
        <div style={{ padding: "0 40px 110px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Reveal>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
                    Star charts &middot; {brands.length} brands decoded
                  </div>
                  <h2 style={{ fontWeight: 700, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.8px" }}>
                    Study brands with real gravity
                  </h2>
                </div>
                <Link to="/brands" className="bmd-link" style={{ fontSize: 14, color: ACCENT_BLUE, textDecoration: "none", fontWeight: 500 }}>
                  Browse all charts &nbsp;›
                </Link>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {brands.map((b) => (
                <StarBrandCard key={b.slug} brand={b} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ JOURNAL TEASER ══ */}
      <div style={{ padding: "0 40px 120px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
                  From the journal
                </div>
                <h2 style={{ fontWeight: 700, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.8px" }}>
                  Read before you redesign anything
                </h2>
              </div>
              <Link to="/blog" className="bmd-link" style={{ fontSize: 14, color: ACCENT_BLUE, textDecoration: "none", fontWeight: 500 }}>
                Read the Journal &nbsp;›
              </Link>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {latestPosts.map((post, i) => (
              <Reveal key={post.slug} style={{ transitionDelay: `${i * 80}ms` }}>
                <Link to={`/blog/${post.slug}`} className="bmd-card-link" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    padding: "24px 26px", borderRadius: 16, height: "100%",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%), ${CHARCOAL}`,
                  }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                      {post.tag}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 17.5, lineHeight: 1.32, marginBottom: 8, letterSpacing: "-0.3px" }}>{post.title}</div>
                    <div style={{ fontSize: 13, color: TITANIUM, lineHeight: 1.55 }}>{post.dek}</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "26px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <OrbitMark size={18} />
          <span style={{ fontSize: 12, color: "#6E6E73" }}>brandmd.space</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Link to="/analyzer" className="bmd-link" style={{ fontSize: 12, color: "#6E6E73", textDecoration: "none" }}>Analyzer</Link>
          <Link to="/builder" className="bmd-link" style={{ fontSize: 12, color: "#6E6E73", textDecoration: "none" }}>Builder</Link>
          <Link to="/brands" className="bmd-link" style={{ fontSize: 12, color: "#6E6E73", textDecoration: "none" }}>Library</Link>
          <Link to="/blog" className="bmd-link" style={{ fontSize: 12, color: "#6E6E73", textDecoration: "none" }}>Blog</Link>
          <a href="/llms.txt" className="bmd-link" style={{ fontSize: 12, color: "#6E6E73", textDecoration: "none" }}>API</a>
        </div>
      </div>
    </div>
  );
}
