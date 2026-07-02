import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { BLOG_POSTS } from "../lib/blogPosts";

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

const TAG_COLOR = {
  Strategy: ORANGE,
  Archetype: MAGENTA,
  Analysis: CYAN,
  Voice: MAGENTA,
  Builder: CYAN,
};

export default function Blog() {
  useEffect(() => { document.title = "Journal — BrandMD"; }, []);

  return (
    <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: BODY }}>
      <SiteNav />

      <div style={{ padding: "72px 40px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: CYAN, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
          BrandMD Journal
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.05, letterSpacing: "-1.5px", maxWidth: 720, margin: "0 auto 16px" }}>
          Notes on brands with real gravity.
        </h1>
        <p style={{ fontSize: 15, color: COMET, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Short, plain-spoken pieces on archetype, voice, and positioning — for
          reading your own brand more clearly, not just admiring someone else's.
        </p>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 40px 100px", display: "flex", flexDirection: "column", gap: 18 }}>
        {BLOG_POSTS.map((post) => {
          const color = TAG_COLOR[post.tag] || CYAN;
          return (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="bmd-card-link"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article
                style={{
                  padding: "26px 28px",
                  borderRadius: 14,
                  border: "1px solid rgba(245,243,238,0.08)",
                  background: PANEL,
                  transition: "border-color 0.2s ease, transform 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(${hexToRgb(color)},0.4)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,243,238,0.08)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {post.tag}
                  </span>
                  <span style={{ color: "#333" }}>&middot;</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "#555" }}>{post.readMins} min read</span>
                </div>
                <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, letterSpacing: "-0.3px", marginBottom: 8, lineHeight: 1.25 }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 14, color: COMET, lineHeight: 1.6, margin: 0 }}>{post.dek}</p>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "138,138,153" : `${r},${g},${b}`;
}
