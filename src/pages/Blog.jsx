import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { BLOG_POSTS } from "../lib/blogPosts";

const VOID = "#000000";
const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_ICE = "#64D2FF";
const SANS = "'Inter', -apple-system, sans-serif";

export default function Blog() {
  useEffect(() => { document.title = "Journal — BrandMD"; }, []);

  return (
    <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      <div style={{ padding: "72px 40px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
          BrandMD Journal
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.08, letterSpacing: "-1.6px", maxWidth: 680, margin: "0 auto 16px" }}>
          Notes on brands with real gravity.
        </h1>
        <p style={{ fontSize: 15, color: TITANIUM, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Short, plain-spoken pieces on archetype, voice, and positioning — for
          reading your own brand more clearly, not just admiring someone else's.
        </p>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 40px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="bmd-card-link"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <article
              style={{
                padding: "26px 28px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%), ${CHARCOAL}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1, textTransform: "uppercase" }}>
                  {post.tag}
                </span>
                <span style={{ color: "#48484A" }}>&middot;</span>
                <span style={{ fontSize: 12, color: "#6E6E73" }}>{post.readMins} min read</span>
              </div>
              <h2 style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.4px", marginBottom: 8, lineHeight: 1.28 }}>
                {post.title}
              </h2>
              <p style={{ fontSize: 14, color: TITANIUM, lineHeight: 1.6, margin: 0 }}>{post.dek}</p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
