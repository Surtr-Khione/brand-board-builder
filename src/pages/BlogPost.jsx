import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { getPostBySlug } from "../lib/blogPosts";

const VOID = "#000000";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const ACCENT_ICE = "#64D2FF";
const SANS = "'Inter', -apple-system, sans-serif";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  useEffect(() => {
    document.title = post ? `${post.title} — BrandMD Journal` : "Not found — BrandMD Journal";
  }, [post]);

  if (!post) {
    return (
      <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
        <SiteNav />
        <div style={{ padding: "100px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: TITANIUM, marginBottom: 16 }}>This page doesn't exist.</div>
          <Link to="/blog" style={{ color: ACCENT_BLUE, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>&larr; Back to the Journal</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      <article style={{ maxWidth: 660, margin: "0 auto", padding: "64px 40px 100px" }}>
        <Link to="/blog" className="bmd-link" style={{ display: "inline-block", color: TITANIUM, fontSize: 13, textDecoration: "none", marginBottom: 28 }}>
          &larr; Journal
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1, textTransform: "uppercase" }}>{post.tag}</span>
          <span style={{ color: "#48484A" }}>&middot;</span>
          <span style={{ fontSize: 12, color: "#6E6E73" }}>{post.readMins} min read</span>
        </div>

        <h1 style={{ fontWeight: 700, fontSize: "clamp(26px, 5vw, 40px)", lineHeight: 1.15, letterSpacing: "-1.2px", marginBottom: 18 }}>
          {post.title}
        </h1>
        <p style={{ fontSize: 17, color: TITANIUM, lineHeight: 1.6, marginBottom: 40 }}>{post.dek}</p>

        {post.body.map((para, i) => (
          <p key={i} style={{ fontSize: 16.5, lineHeight: 1.75, color: "rgba(245,245,247,0.86)", marginBottom: 22, fontWeight: 400 }}>
            {para}
          </p>
        ))}

        <div style={{
          marginTop: 44, padding: "24px 26px", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,113,227,0.08)",
          display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 14, color: STARLIGHT, maxWidth: 340 }}>
            Curious what a stranger's first read of your own brand looks like?
          </div>
          <Link
            to="/analyzer"
            className="bmd-cta"
            style={{
              padding: "11px 24px", borderRadius: 100, textDecoration: "none",
              background: ACCENT_BLUE, color: "#FFFFFF",
              fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
            }}
          >
            Run the free Analyzer
          </Link>
        </div>
      </article>
    </div>
  );
}
