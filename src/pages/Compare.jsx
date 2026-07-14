import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { scanWebsite, isAIAvailable } from "../lib/ai";
import { computeGravityScore, gravityScoreColor } from "../lib/gravityScore";
import { track } from "../lib/track";

const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const SANS = "'Inter', -apple-system, sans-serif";
const PANEL_BG = `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 45%), ${CHARCOAL}`;
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "13px 18px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)",
  color: STARLIGHT, fontSize: 14.5, fontFamily: SANS, outline: "none",
};

// Flatten a scan-website response into the shape computeGravityScore reads
function scanToBrand(scan) {
  return { ...(scan.analysis || {}), primaryColor: scan.primaryColor, secondaryColor: scan.secondaryColor, accentColor: scan.accentColor, primaryFont: (scan.fonts || [])[0] };
}

function ResultCard({ r }) {
  if (r.state === "scanning") {
    return (
      <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "34px 24px", textAlign: "center", color: TITANIUM, fontSize: 13.5 }}>
        Scanning {r.url}…
      </div>
    );
  }
  if (r.state === "error") {
    return (
      <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "34px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{r.url}</div>
        <div style={{ fontSize: 12.5, color: "#FF453A" }}>Couldn't scan this site.</div>
      </div>
    );
  }
  const b = r.brand;
  const { score } = computeGravityScore(b);
  return (
    <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "30px 24px 26px", textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>{b.brandName || r.url}</div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {[b.primaryColor, b.secondaryColor, b.accentColor].filter(Boolean).map((c, i) => (
          <div key={i} title={c} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.18)" }} />
        ))}
      </div>
      <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, color: gravityScoreColor(score) }}>{score}</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.2, textTransform: "uppercase" }}>Gravity Score</div>
      {b.archetype && <div style={{ fontSize: 12.5, color: TITANIUM }}>{b.archetype}</div>}
      {b.tagline && <div style={{ fontSize: 12, color: "#6E6E73", fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{b.tagline}&rdquo;</div>}
    </div>
  );
}

export default function Compare() {
  const [urls, setUrls] = useState(["", "", ""]);
  const [results, setResults] = useState(null); // [{url, state, brand?}]
  const [running, setRunning] = useState(false);

  useEffect(() => {
    document.title = "Compare Brands — Gravity Scores Side by Side | BrandMD";
  }, []);

  const setUrl = (i, v) => setUrls((prev) => prev.map((u, j) => (j === i ? v : u)));
  const entered = urls.map((u) => u.trim()).filter(Boolean);

  const run = async (e) => {
    e.preventDefault();
    if (entered.length < 2 || running) return;
    setRunning(true);
    setResults(entered.map((url) => ({ url, state: "scanning" })));
    track("compare_run", { count: entered.length });
    await Promise.all(entered.map(async (url, i) => {
      try {
        const scan = await scanWebsite(url);
        if (scan.error) throw new Error(scan.error);
        setResults((prev) => prev.map((r, j) => (j === i ? { url, state: "done", brand: scanToBrand(scan) } : r)));
      } catch {
        setResults((prev) => prev.map((r, j) => (j === i ? { url, state: "error" } : r)));
      }
    }));
    setRunning(false);
  };

  const done = (results || []).filter((r) => r.state === "done");
  const winner = done.length >= 2
    ? done.reduce((a, b) => (computeGravityScore(a.brand).score >= computeGravityScore(b.brand).score ? a : b))
    : null;

  return (
    <div style={{ background: "#000", color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      <div style={{ padding: "64px 40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>
          Free &middot; Instant &middot; No signup
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.08, letterSpacing: "-1.6px", maxWidth: 760, margin: "0 auto 18px" }}>
          You vs. <span style={{ color: ACCENT_BLUE }}>them</span>.
        </h1>
        <p style={{ fontSize: 15.5, color: TITANIUM, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
          Put your site next to your competitors' and see whose brand actually holds
          together — same scan, same Gravity Score, side by side.
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 70px" }}>
        <form onSubmit={run} style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "28px 28px 22px", marginBottom: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <input value={urls[0]} onChange={(e) => setUrl(0, e.target.value)} placeholder="yourbrand.com" style={inputStyle} />
            <input value={urls[1]} onChange={(e) => setUrl(1, e.target.value)} placeholder="competitor.com" style={inputStyle} />
            <input value={urls[2]} onChange={(e) => setUrl(2, e.target.value)} placeholder="another competitor (optional)" style={inputStyle} />
          </div>
          <button
            type="submit"
            disabled={entered.length < 2 || running || !isAIAvailable()}
            className="bmd-cta"
            style={{
              width: "100%", marginTop: 14, padding: "14px 0", borderRadius: 100, border: "none",
              cursor: entered.length >= 2 && !running ? "pointer" : "default",
              background: entered.length >= 2 && !running ? ACCENT_BLUE : "rgba(255,255,255,0.08)",
              color: entered.length >= 2 && !running ? "#fff" : "#6E6E73",
              fontSize: 14.5, fontWeight: 600, fontFamily: SANS,
            }}
          >
            {running ? "Scanning…" : "Compare brands"}
          </button>
        </form>

        {results && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${results.length}, minmax(200px, 1fr))`, gap: 16, overflowX: "auto" }}>
              {results.map((r, i) => <ResultCard key={i} r={r} />)}
            </div>
            {winner && !running && (
              <div style={{ textAlign: "center", marginTop: 26 }}>
                <div style={{ fontSize: 13.5, color: TITANIUM, marginBottom: 16, lineHeight: 1.6 }}>
                  <span style={{ color: STARLIGHT, fontWeight: 700 }}>{winner.brand.brandName || winner.url}</span> holds
                  together best today. A scan only reads what's public — the gap closes in the Builder.
                </div>
                <Link to="/builder" className="bmd-cta" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 100, background: ACCENT_BLUE, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                  Close the gap — chart your brand
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
