import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchBrands } from "../lib/brands";
import SiteNav, { OrbitMark } from "../components/SiteNav";
import { BLOG_POSTS } from "../lib/blogPosts";
import { useReveal } from "../lib/useReveal";
import { computeGravityScore, gravityScoreColor } from "../lib/gravityScore";
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

// The hero signature: scattered, undocumented brand fragments (a messy
// mix of colors, shapes, mismatched decisions) resolving into a clean,
// aligned system as a scan line passes through — a quiet background
// layer sitting behind the hero text, not a standalone graphic.
const GRID_COLS = [8, 27, 46, 65, 84];
const GRID_ROWS = [14, 38, 62, 86];
const GRID_CELLS = GRID_ROWS.flatMap((y) => GRID_COLS.map((x) => ({ x, y })));
const DOT_INDICES = new Set([2, 5, 9, 12, 16]);

const FRAGMENTS = GRID_CELLS.map((cell, i) => ({
  id: i,
  type: DOT_INDICES.has(i) ? "dot" : "chip",
  xf: cell.x,
  yf: cell.y,
  x0: 8 + Math.random() * 84,
  y0: 8 + Math.random() * 84,
  r0: -32 + Math.random() * 64,
  delay: -Math.random() * 8,
}));

// A representative slice of the Fortune 500 — plain text, no external
// logo assets — for the search section's ambient scroll. Duplicated
// once at render time for a seamless marquee loop.
const FORTUNE_500 = [
  "Walmart", "Amazon", "Apple", "UnitedHealth Group", "Berkshire Hathaway",
  "CVS Health", "ExxonMobil", "Alphabet", "McKesson", "Chevron",
  "Costco", "Microsoft", "Cardinal Health", "JPMorgan Chase", "Ford Motor",
  "Bank of America", "General Motors", "Citigroup", "Home Depot", "Kroger",
  "Walgreens Boots Alliance", "Meta", "Verizon", "AT&T", "Comcast",
  "Wells Fargo", "Goldman Sachs", "Target", "Humana", "Tesla",
  "Johnson & Johnson", "PepsiCo", "UPS", "FedEx", "Disney",
  "Procter & Gamble", "Boeing", "IBM", "Pfizer", "Nike", "Coca-Cola",
];

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
    body: "Thirty-one sections across five phases — strategy, voice, visual system, governance, deployment. Nothing decorative; every field feeds the board your team will actually use. Still free.",
    links: [{ label: "Start charting", to: "/builder" }],
  },
  {
    verb: "Launch.",
    Icon: RocketIcon,
    body: "A finished board becomes content — on-brand copy, campaigns, calendars — the ongoing production a brand keeps needing long after the board itself is done.",
    links: [{ label: "Open Content Studio", to: "/studio" }],
  },
];

function ScoreCard({ brand }) {
  const [logoIdx, setLogoIdx] = useState(0);
  const { score } = computeGravityScore(brand);
  const color = gravityScoreColor(score);
  const domain = brand.website?.replace(/^https?:\/\//, "").split("/")[0];
  const logoSources = domain
    ? [`https://logo.clearbit.com/${domain}`, `https://www.google.com/s2/favicons?domain=${domain}&sz=128`]
    : [];
  const logoUrl = logoSources[logoIdx] || null;

  return (
    <Link to={`/brands/${brand.slug}`} className="bmd-card-link" style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          borderRadius: 18, border: "1px solid rgba(255,255,255,0.09)", height: "100%",
          background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%), ${CHARCOAL}`,
          padding: "28px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}
      >
        <div style={{
          width: 68, height: 68, borderRadius: 16, background: "#FFFFFF", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 18,
        }}>
          {logoUrl ? (
            <img
              src={logoUrl} alt={brand.brand_name} loading="lazy"
              onError={() => setLogoIdx((i) => i + 1)}
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 26, fontWeight: 800, color: "#111", fontFamily: SANS }}>{brand.brand_name.charAt(0)}</span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, letterSpacing: "-0.2px" }}>{brand.brand_name}</div>
        <div style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 6 }}>
          Gravity Score
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [brands, setBrands] = useState([]);
  const [totalBrands, setTotalBrands] = useState(null);
  const [findQuery, setFindQuery] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const navigate = useNavigate();

  const submitFind = (e) => {
    e.preventDefault();
    navigate(`/brands${findQuery.trim() ? `?q=${encodeURIComponent(findQuery.trim())}` : ""}`);
  };

  const submitHeroScan = (e) => {
    e.preventDefault();
    navigate(`/analyzer${heroUrl.trim() ? `?url=${encodeURIComponent(heroUrl.trim())}` : ""}`);
  };

  useEffect(() => {
    document.title = "BrandMD — Give your brand gravity.";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Scan any website and get its colors, fonts, tone, and brand archetype back in under a minute — free, instant, no signup. Then chart the strategy and voice underneath it with the same frameworks that built Apple, Nike, and Patagonia."
    );
    searchBrands({ limit: 15, featured: true }).then((d) => { setBrands(d.brands || []); if (d.totalBrands) setTotalBrands(d.totalBrands); });
  }, []);

  const latestPosts = BLOG_POSTS.slice(0, 3);

  return (
    <div style={{ background: VOID, color: STARLIGHT, fontFamily: SANS, minHeight: "100vh" }}>
      <SiteNav transparent />

      {/* ══ HERO — scattered fragments resolving into order as a scan passes through ══ */}
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

        {/* Background layer: the diagnostic reveal, sitting behind the text */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
          <div
            className="bmd-scanline"
            style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${ACCENT_BLUE}, transparent)`,
              boxShadow: "0 0 14px rgba(0,113,227,0.65)",
              animation: "bmd-scan 8s ease-in-out infinite",
            }}
          />
          {FRAGMENTS.map((f) => (
            <div
              key={f.id}
              className="bmd-fragment"
              style={{
                position: "absolute",
                left: `${f.xf}%`, top: `${f.yf}%`,
                width: f.type === "dot" ? 10 : 30,
                height: f.type === "dot" ? 10 : 18,
                marginLeft: f.type === "dot" ? -5 : -15,
                marginTop: f.type === "dot" ? -5 : -9,
                borderRadius: f.type === "dot" ? "50%" : 4,
                background: f.type === "dot" ? ACCENT_BLUE : "rgba(255,255,255,0.05)",
                border: f.type === "dot" ? "none" : "1px solid rgba(245,245,247,0.4)",
                "--bmd-x0": `${f.x0}%`, "--bmd-y0": `${f.y0}%`,
                "--bmd-xf": `${f.xf}%`, "--bmd-yf": `${f.yf}%`,
                "--bmd-r0": `${f.r0}deg`,
                animation: `bmd-settle 8s ease-in-out infinite`,
                animationDelay: `${f.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Foreground layer: the text, always legible over the motion below it */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 760 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22,
            textShadow: "0 2px 16px rgba(0,0,0,0.9)",
          }}>
            Brand intelligence
          </div>
          <h1
            style={{
              fontWeight: 700, fontSize: "clamp(38px, 6vw, 72px)",
              lineHeight: 1.06, letterSpacing: "-2px", margin: "0 0 18px",
              textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.95)",
            }}
          >
            What's the <span style={{ color: ACCENT_BLUE }}>Gravity</span> of your brand?
          </h1>
          <p style={{
            fontSize: 17, color: TITANIUM, maxWidth: 480, margin: "0 auto 34px", lineHeight: 1.6, fontWeight: 400,
            textShadow: "0 2px 18px rgba(0,0,0,0.9)",
          }}>
            Enter your URL below — free, instant, no signup.
          </p>

          <form onSubmit={submitHeroScan} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 26 }}>
            <input
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="yourbrand.com"
              style={{
                flex: "1 1 300px", maxWidth: 400, padding: "14px 22px", borderRadius: 100,
                border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)", color: STARLIGHT, fontSize: 16, fontFamily: SANS, outline: "none",
              }}
            />
            <button
              type="submit"
              className="bmd-cta"
              style={{
                padding: "14px 30px", borderRadius: 100, border: "none", cursor: "pointer",
                background: ACCENT_BLUE, color: "#FFFFFF", fontSize: 15, fontWeight: 600, fontFamily: SANS,
              }}
            >
              Get My Score
            </button>
          </form>

          <div style={{ fontSize: 14, color: TITANIUM, marginBottom: 18, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>
            No website yet?{" "}
            <Link to="/start" className="bmd-link" style={{ color: ACCENT_BLUE, textDecoration: "none", fontWeight: 600 }}>
              Start from your idea →
            </Link>
          </div>
          <div style={{ fontSize: 12.5, color: "#6E6E73", letterSpacing: 0.2 }}>
            {totalBrands || brands.length || 15} brands decoded &nbsp;&middot;&nbsp; 31 sections &nbsp;&middot;&nbsp; one board
            &nbsp;&middot;&nbsp; <Link to="/brands" className="bmd-link" style={{ color: "#6E6E73", textDecoration: "underline" }}>explore the Library</Link>
          </div>
        </div>
      </div>

      {/* ══ FIND — search the index; Fortune 500 scrolls quietly behind it ══ */}
      <div style={{ padding: "80px 40px 100px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Reveal style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
            Search the index
          </div>
          <h2 style={{ fontWeight: 700, fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-1px", marginBottom: 26 }}>
            See how <span style={{ color: ACCENT_BLUE }}>anyone else</span> scores.
          </h2>
          <form onSubmit={submitFind} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <input
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Search Apple, Nike, Walmart…"
              style={{
                flex: "1 1 280px", maxWidth: 380, padding: "13px 20px", borderRadius: 100,
                border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)",
                color: STARLIGHT, fontSize: 15, fontFamily: SANS, outline: "none",
              }}
            />
            <button
              type="submit"
              className="bmd-cta"
              style={{
                padding: "13px 26px", borderRadius: 100, border: "none", cursor: "pointer",
                background: ACCENT_BLUE, color: "#FFFFFF", fontSize: 14, fontWeight: 600, fontFamily: SANS,
              }}
            >
              Find
            </button>
          </form>
        </Reveal>

        <div
          style={{
            maxWidth: 1180, margin: "0 auto", overflow: "hidden",
            maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="bmd-marquee-track" style={{ display: "flex", width: "max-content", gap: 30 }}>
            {[...FORTUNE_500, ...FORTUNE_500].map((name, i) => (
              <Link
                key={i}
                to={`/brands?q=${encodeURIComponent(name)}`}
                className="bmd-link"
                style={{ fontSize: 14, color: "#6E6E73", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 500, flexShrink: 0 }}
              >
                {name}
              </Link>
            ))}
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

      {/* ══ WHAT WE BELIEVE — the manifesto, stated plainly ══ */}
      <div style={{ padding: "0 40px 120px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
              What we believe
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "clamp(24px, 3.5vw, 36px)", letterSpacing: "-0.9px" }}>
              A brand board isn't a style guide with a logo and two colors.
            </h2>
          </Reveal>
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                "Diagnose before you decorate — colors and fonts are the last decision, not the first.",
                "A brand that agrees with itself beats one that impresses for a moment.",
                "Free means the real thing — the diagnosis is never a teaser withheld to force an upgrade.",
                "If you can't say it back in your own words, it isn't a brand yet — it's a mood board.",
              ].map((line, i) => (
                <div key={i} style={{
                  display: "flex", gap: 18, alignItems: "flex-start", padding: "18px 0",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT_BLUE, marginTop: 8, flexShrink: 0 }} />
                  <p style={{ fontSize: 16, color: "rgba(245,245,247,0.88)", lineHeight: 1.55, margin: 0, fontWeight: 400 }}>
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ══ SCORE CARDS — big logos, real scores, the conversion moment ══ */}
      {brands.length > 0 && (
        <div style={{ padding: "0 40px 110px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Reveal style={{ textAlign: "center", marginBottom: 44 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
                Star charts &middot; {totalBrands || brands.length} brands decoded
              </div>
              <h2 style={{ fontWeight: 700, fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.9px", marginBottom: 14 }}>
                See how the greats score.
              </h2>
              <p style={{ fontSize: 16, color: TITANIUM, maxWidth: 480, margin: "0 auto" }}>
                Every brand here has a real Gravity Score — not a vanity metric, a coherence read across archetype, voice, and system.
              </p>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 40 }}>
              {brands.map((b, i) => (
                <Reveal key={b.slug} style={{ transitionDelay: `${(i % 6) * 60}ms` }}>
                  <ScoreCard brand={b} />
                </Reveal>
              ))}
            </div>

            <Reveal style={{ textAlign: "center" }}>
              <Link
                to="/analyzer"
                className="bmd-cta"
                style={{
                  display: "inline-block", padding: "14px 30px", borderRadius: 100, textDecoration: "none",
                  background: ACCENT_BLUE, color: "#FFFFFF", fontSize: 15, fontWeight: 600, marginBottom: 16,
                }}
              >
                Get Your Score — Free
              </Link>
              <div>
                <Link to="/brands" className="bmd-link" style={{ fontSize: 14, color: ACCENT_BLUE, textDecoration: "none", fontWeight: 500 }}>
                  Browse all charts &nbsp;›
                </Link>
              </div>
            </Reveal>
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
          <span style={{ fontSize: 12, color: "#6E6E73" }}>Give your brand gravity. — brandmd.space</span>
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
