import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchBrands } from "../lib/brands";
import SiteNav, { OrbitMark } from "../components/SiteNav";
import { BLOG_POSTS } from "../lib/blogPosts";
import "../styles/space-theme.css";

const VOID = "#06060C";
const PANEL = "#0D0D16";
const MAGENTA = "#FF2E88";
const CYAN = "#00E5FF";
const ORANGE = "#FF6A00";
const STARLIGHT = "#F5F3EE";
const COMET = "#8A8A99";

const DISPLAY = "'Bricolage Grotesque', -apple-system, sans-serif";
const BODY = "'IBM Plex Sans', -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function rgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "138,138,153" : `${r},${g},${b}`;
}

const BLOBS = [
  { color: MAGENTA, size: 560, top: "20%", left: "16%", duration: 28, delay: -4, drift: "a" },
  { color: CYAN, size: 520, top: "28%", left: "76%", duration: 24, delay: -10, drift: "b" },
  { color: ORANGE, size: 480, top: "74%", left: "40%", duration: 32, delay: -16, drift: "c" },
];

// Generated once at module load — a stable field, not recomputed per render.
const STARS = Array.from({ length: 140 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.6 + 0.6,
  opacityMax: Math.random() * 0.6 + 0.3,
  duration: Math.random() * 4 + 3,
  delay: -Math.random() * 5,
}));

function ReticleIcon({ color }) {
  return (
    <svg width="42" height="42" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="14" stroke={color} strokeWidth="1.6" opacity="0.9" />
      <circle cx="22" cy="22" r="6" stroke={color} strokeWidth="1.6" />
      <circle cx="22" cy="22" r="1.8" fill={color} />
      <line x1="22" y1="2" x2="22" y2="8" stroke={color} strokeWidth="1.6" />
      <line x1="22" y1="36" x2="22" y2="42" stroke={color} strokeWidth="1.6" />
      <line x1="2" y1="22" x2="8" y2="22" stroke={color} strokeWidth="1.6" />
      <line x1="36" y1="22" x2="42" y2="22" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function CompassStarIcon({ color }) {
  return (
    <svg width="42" height="42" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M22 3 L26 19 L41 22 L26 25 L22 41 L18 25 L3 22 L18 19 Z" stroke={color} strokeWidth="1.4" fill={`${color}22`} />
      <circle cx="22" cy="22" r="2.4" fill={color} />
    </svg>
  );
}

function RocketIcon({ color }) {
  return (
    <svg width="42" height="42" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M22 4 C28 10 30 18 29 26 L15 26 C14 18 16 10 22 4 Z" stroke={color} strokeWidth="1.4" fill={`${color}18`} />
      <circle cx="22" cy="16" r="3" stroke={color} strokeWidth="1.3" />
      <path d="M15 26 L9 33 L15 31 Z" fill={color} opacity="0.85" />
      <path d="M29 26 L35 33 L29 31 Z" fill={color} opacity="0.85" />
      <path
        className="bmd-flame"
        style={{ transformOrigin: "22px 29px" }}
        d="M18 29 C18 34 20 38 22 40 C24 38 26 34 26 29 C24 31 20 31 18 29 Z"
        fill={color}
      />
    </svg>
  );
}

const MISSIONS = [
  {
    verb: "OBSERVE",
    color: CYAN,
    Icon: ReticleIcon,
    title: "See what's really there",
    body: "Scan any live website — or LinkedIn, Instagram, a podcast feed — and get colors, fonts, tone, and your brand archetype back in seconds, free. Or study 15 brands that already have gravity in the Library.",
    links: [
      { label: "Run the Analyzer →", to: "/analyzer" },
      { label: "Browse the Library", to: "/brands" },
    ],
  },
  {
    verb: "CHART",
    color: MAGENTA,
    Icon: CompassStarIcon,
    title: "Plot the whole identity",
    body: "Nineteen sections across five phases — strategy, voice, visual system, governance. Nothing decorative; every field feeds the board your team will actually use. Still free.",
    links: [{ label: "Start charting →", to: "/builder" }],
  },
  {
    verb: "LAUNCH",
    color: ORANGE,
    Icon: RocketIcon,
    title: "Put it to work",
    body: "A finished board becomes content — on-brand copy, campaigns, calendars — the ongoing production a brand keeps needing long after the board itself is done.",
    links: [{ label: "Open Content Studio →", to: "/studio" }],
  },
];

function StarBrandCard({ brand }) {
  const pc = brand.primary_color || COMET;
  const sc = brand.secondary_color || "#1a1a1a";
  return (
    <Link to={`/brands/${brand.slug}`} className="bmd-card-link" style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "18px 10px" }}
      >
        <div style={{ position: "relative", width: 84, height: 84, marginBottom: 14 }}>
          <div
            style={{
              position: "absolute", inset: -10, borderRadius: "50%",
              border: `1px solid rgba(${rgb(pc)},0.28)`, transform: "rotate(-18deg)",
            }}
          />
          <div
            style={{
              width: 84, height: 84, borderRadius: "50%",
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.35), ${pc} 55%, ${sc} 100%)`,
              boxShadow: `0 0 34px rgba(${rgb(pc)},0.45), inset 0 0 0 1px rgba(255,255,255,0.08)`,
            }}
          />
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 14.5, color: STARLIGHT, marginBottom: 4 }}>
          {brand.brand_name}
        </div>
        {brand.archetype && (
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: pc, letterSpacing: 1, textTransform: "uppercase" }}>
            {brand.archetype.replace("The ", "")}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    document.title = "BrandMD — Give Your Brand Gravity";
    searchBrands({ limit: 15 }).then((d) => setBrands(d.brands || []));
  }, []);

  const latestPosts = BLOG_POSTS.slice(0, 3);

  return (
    <div style={{ background: VOID, color: STARLIGHT, fontFamily: BODY, minHeight: "100vh" }}>
      <SiteNav transparent />

      {/* ══ HERO — the nebula condensing into one star ══ */}
      <div
        style={{
          position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          padding: "120px 40px 110px", minHeight: 620,
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
                "--bmd-tw-min": 0.1, "--bmd-tw-max": s.opacityMax,
                animation: `bmd-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {BLOBS.map((b, i) => (
            <div
              key={i}
              className="bmd-blob"
              style={{
                position: "absolute", top: b.top, left: b.left,
                width: b.size, height: b.size, marginLeft: -b.size / 2, marginTop: -b.size / 2,
                borderRadius: "50%", background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
                filter: "blur(70px)", mixBlendMode: "screen",
                animation: `bmd-drift-${b.drift} ${b.duration}s ease-in-out ${b.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div
          className="bmd-core"
          style={{
            position: "absolute", top: "48%", left: "50%", transform: "translate(-50%,-50%)",
            width: 240, height: 240, borderRadius: "50%", zIndex: 2,
            background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${ORANGE} 30%, ${MAGENTA} 55%, transparent 72%)`,
            filter: "blur(22px)",
          }}
        />

        <div
          style={{
            position: "absolute", inset: 0, zIndex: 3, opacity: 0.045, mixBlendMode: "overlay",
            backgroundImage: GRAIN_BG, backgroundRepeat: "repeat", backgroundSize: "120px 120px", pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 4, maxWidth: 880 }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: CYAN, letterSpacing: 3, textTransform: "uppercase", marginBottom: 26 }}>
            Brand intelligence, charted
          </div>
          <h1
            style={{
              fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(44px, 7vw, 92px)",
              lineHeight: 0.98, letterSpacing: "-3px", margin: "0 0 26px",
            }}
          >
            Give your brand{" "}
            <span
              style={{
                color: "transparent",
                backgroundImage: `linear-gradient(135deg, ${MAGENTA}, ${ORANGE})`,
                backgroundClip: "text", WebkitBackgroundClip: "text",
              }}
            >
              gravity.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: COMET, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.65 }}>
            Scan any site, study the brands that already have it, and chart an identity
            with enough pull to bend attention your way.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 34 }}>
            <Link
              to="/analyzer"
              className="bmd-cta"
              style={{
                padding: "14px 30px", borderRadius: 10, textDecoration: "none",
                background: `linear-gradient(135deg, ${MAGENTA}, ${ORANGE})`, color: STARLIGHT,
                fontSize: 15, fontWeight: 800,
              }}
            >
              Analyze your brand — free
            </Link>
            <Link
              to="/brands"
              className="bmd-link"
              style={{
                padding: "14px 30px", borderRadius: 10, textDecoration: "none",
                border: "1px solid rgba(245,243,238,0.18)", color: STARLIGHT, fontSize: 15, fontWeight: 700,
              }}
            >
              Explore the Library
            </Link>
          </div>

          <div style={{ fontFamily: MONO, fontSize: 12, color: "#555", letterSpacing: 0.5 }}>
            {brands.length || 15} brands decoded &middot; 19 brand dimensions &middot; one board
          </div>
        </div>
      </div>

      {/* ══ MISSION SEQUENCE — Observe / Chart / Launch ══ */}
      <div style={{ padding: "90px 40px 100px", borderTop: "1px solid rgba(245,243,238,0.06)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COMET, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>
              Mission sequence
            </div>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-1px" }}>
              Three instruments. One trajectory.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {MISSIONS.map((m) => (
              <div
                key={m.verb}
                style={{
                  padding: "32px 28px", borderRadius: 18, background: PANEL,
                  border: `1px solid rgba(${rgb(m.color)},0.18)`, display: "flex", flexDirection: "column",
                }}
              >
                <m.Icon color={m.color} />
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: m.color, letterSpacing: 2, textTransform: "uppercase", margin: "18px 0 10px" }}>
                  {m.verb}
                </div>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, marginBottom: 10, letterSpacing: "-0.2px" }}>
                  {m.title}
                </div>
                <p style={{ fontSize: 13.5, color: COMET, lineHeight: 1.65, marginBottom: 18, flex: 1 }}>{m.body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {m.links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="bmd-link"
                      style={{ fontSize: 13, fontWeight: 700, color: m.color, textDecoration: "none" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ STAR CHARTS — the brand library ══ */}
      {brands.length > 0 && (
        <div style={{ padding: "0 40px 100px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COMET, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>
                  Star charts &middot; {brands.length} brands decoded
                </div>
                <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.6px" }}>
                  Study brands with real gravity
                </h2>
              </div>
              <Link to="/brands" className="bmd-link" style={{ fontSize: 13, color: STARLIGHT, textDecoration: "none", fontWeight: 700 }}>
                Browse all charts →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {brands.map((b) => (
                <StarBrandCard key={b.slug} brand={b} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ JOURNAL TEASER ══ */}
      <div style={{ padding: "0 40px 110px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: COMET, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>
                From the journal
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.6px" }}>
                Read before you redesign anything
              </h2>
            </div>
            <Link to="/blog" className="bmd-link" style={{ fontSize: 13, color: STARLIGHT, textDecoration: "none", fontWeight: 700 }}>
              Read the Journal →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {latestPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="bmd-card-link" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ padding: "22px 24px", borderRadius: 14, border: "1px solid rgba(245,243,238,0.08)", background: PANEL, height: "100%" }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: CYAN, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                    {post.tag}
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}>{post.title}</div>
                  <div style={{ fontSize: 12.5, color: COMET, lineHeight: 1.55 }}>{post.dek}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ borderTop: "1px solid rgba(245,243,238,0.07)", padding: "26px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <OrbitMark size={20} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#555" }}>coordinates: brandmd.space</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Link to="/analyzer" className="bmd-link" style={{ fontFamily: MONO, fontSize: 11, color: "#555", textDecoration: "none" }}>Analyzer</Link>
          <Link to="/builder" className="bmd-link" style={{ fontFamily: MONO, fontSize: 11, color: "#555", textDecoration: "none" }}>Builder</Link>
          <Link to="/brands" className="bmd-link" style={{ fontFamily: MONO, fontSize: 11, color: "#555", textDecoration: "none" }}>Library</Link>
          <Link to="/blog" className="bmd-link" style={{ fontFamily: MONO, fontSize: 11, color: "#555", textDecoration: "none" }}>Blog</Link>
          <a href="/llms.txt" className="bmd-link" style={{ fontFamily: MONO, fontSize: 11, color: "#555", textDecoration: "none" }}>API</a>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 6px #2ecc71" }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: "#444", letterSpacing: 1 }}>SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
