import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { getPostBySlug } from "../lib/blogPosts";

const VOID = "#06060C";
const MAGENTA = "#FF2E88";
const CYAN = "#00E5FF";
const ORANGE = "#FF6A00";
const STARLIGHT = "#F5F3EE";
const COMET = "#8A8A99";
const DISPLAY = "'Bricolage Grotesque', -apple-system, sans-serif";
const BODY = "'IBM Plex Sans', -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const TAG_COLOR = { Strategy: ORANGE, Archetype: MAGENTA, Analysis: CYAN, Voice: MAGENTA, Builder: CYAN };

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  useEffect(() => {
    document.title = post ? `${post.title} — BrandMD Journal` : "Not found — BrandMD Journal";
  }, [post]);

  if (!post) {
    return (
      <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: BODY }}>
        <SiteNav />
        <div style={{ padding: "100px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: COMET, marginBottom: 16 }}>404 &middot; no signal at this coordinate</div>
          <Link to="/blog" style={{ color: CYAN, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>&larr; Back to the Journal</Link>
        </div>
      </div>
    );
  }

  const color = TAG_COLOR[post.tag] || CYAN;

  return (
    <div style={{ background: VOID, color: STARLIGHT, minHeight: "100vh", fontFamily: BODY }}>
      <SiteNav />

      <article style={{ maxWidth: 660, margin: "0 auto", padding: "64px 40px 100px" }}>
        <Link to="/blog" className="bmd-link" style={{ display: "inline-block", color: COMET, fontFamily: MONO, fontSize: 12, textDecoration: "none", marginBottom: 28 }}>
          &larr; Journal
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color, letterSpacing: 1.5, textTransform: "uppercase" }}>{post.tag}</span>
          <span style={{ color: "#333" }}>&middot;</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#555" }}>{post.readMins} min read</span>
        </div>

        <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.12, letterSpacing: "-1px", marginBottom: 18 }}>
          {post.title}
        </h1>
        <p style={{ fontSize: 17, color: COMET, lineHeight: 1.6, marginBottom: 40 }}>{post.dek}</p>

        {post.body.map((para, i) => (
          <p key={i} style={{ fontSize: 16.5, lineHeight: 1.8, color: "rgba(245,243,238,0.88)", marginBottom: 22 }}>
            {para}
          </p>
        ))}

        <div style={{
          marginTop: 44, padding: "24px 26px", borderRadius: 14,
          border: `1px solid rgba(0,229,255,0.25)`, background: "rgba(0,229,255,0.04)",
          display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 14, color: STARLIGHT, maxWidth: 340 }}>
            Curious what a stranger's first read of your own brand looks like?
          </div>
          <Link
            to="/analyzer"
            className="bmd-cta"
            style={{
              padding: "11px 22px", borderRadius: 8, textDecoration: "none",
              background: `linear-gradient(135deg, ${MAGENTA}, ${ORANGE})`, color: STARLIGHT,
              fontSize: 13.5, fontWeight: 800, whiteSpace: "nowrap",
            }}
          >
            Run the free Analyzer &rarr;
          </Link>
        </div>
      </article>
    </div>
  );
}
