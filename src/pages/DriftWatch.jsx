import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { driftCheck } from "../lib/ai";
import { loadBoard } from "../lib/storage";
import { track } from "../lib/track";

const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const SANS = "'Inter', -apple-system, sans-serif";
const PANEL_BG = `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 45%), ${CHARCOAL}`;
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";

const SEV_COLOR = { high: "#FF453A", medium: "#FF9F0A", low: "#64D2FF" };
const alignColor = (a) => (a >= 85 ? "#32D74B" : a >= 60 ? "#FF9F0A" : "#FF453A");

export default function DriftWatch() {
  const { boardId } = useParams();
  const [brand, setBrand] = useState(null);
  const [state, setState] = useState("loading");
  const [running, setRunning] = useState(false);
  const [drift, setDrift] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Drift Watch — Is Your Site Still On-Brand? | BrandMD";
    loadBoard(boardId)
      .then((d) => { if (d?.brand_data) { setBrand(d.brand_data); setState("ready"); } else setState("missing"); })
      .catch(() => setState("missing"));
  }, [boardId]);

  const run = async () => {
    setRunning(true);
    setError(null);
    setDrift(null);
    try {
      const res = await driftCheck({ boardId });
      if (!res?.drift) throw new Error("The check returned nothing — try again.");
      setDrift(res.drift);
      track("drift_run", { boardId, alignment: res.drift.alignment, items: res.drift.items.length });
    } catch (e) {
      setError(e.message || "Drift check failed.");
    }
    setRunning(false);
  };

  if (state === "loading") {
    return <div style={{ minHeight: "100vh", background: "#000", color: TITANIUM, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>Loading board…</div>;
  }
  if (state === "missing") {
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: STARLIGHT, display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Board not found</div>
        <Link to="/builder" style={{ color: ACCENT_BLUE, fontSize: 14, fontWeight: 600 }}>Open the Builder →</Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      <div style={{ padding: "64px 40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>
          Drift Watch
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.08, letterSpacing: "-1.6px", maxWidth: 760, margin: "0 auto 18px" }}>
          Is {brand.brandName || "your site"} still the brand you defined?
        </h1>
        <p style={{ fontSize: 15.5, color: TITANIUM, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          Drift Watch rescans {brand.website || "your website"} and diffs what the world
          sees today against what this board says the brand is — colors, tagline,
          typography, and voice.
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 40px 70px" }}>
        {!drift && (
          <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "36px 32px", textAlign: "center" }}>
            {error && <div style={{ fontSize: 13.5, color: "#FF453A", marginBottom: 16 }}>{error}</div>}
            <button
              onClick={run}
              disabled={running}
              className="bmd-cta"
              style={{
                padding: "15px 34px", borderRadius: 100, border: "none", cursor: running ? "wait" : "pointer",
                background: running ? "rgba(0,113,227,0.35)" : ACCENT_BLUE, color: "#fff",
                fontSize: 15, fontWeight: 600, fontFamily: SANS,
              }}
            >
              {running ? `Rescanning ${brand.website}…` : "Run drift check"}
            </button>
            <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 14 }}>Takes about 30 seconds. Free.</div>
          </div>
        )}

        {drift && (
          <>
            <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "36px 32px 30px", textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Alignment</div>
              <div style={{ fontSize: "clamp(52px, 9vw, 76px)", fontWeight: 800, lineHeight: 1, color: alignColor(drift.alignment) }}>{drift.alignment}</div>
              <div style={{ fontSize: 13.5, color: TITANIUM, marginTop: 12 }}>
                {drift.items.length === 0
                  ? "The live site matches the board. No drift detected."
                  : `${drift.items.length} drift signal${drift.items.length > 1 ? "s" : ""} between the board and ${drift.url}`}
              </div>
            </div>

            {drift.voiceRead && (
              <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "24px 28px", marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Voice read</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>{drift.voiceRead}</div>
              </div>
            )}

            {drift.items.length > 0 && (
              <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "24px 28px", marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>What drifted</div>
                {drift.items.map((it, i) => (
                  <div key={i} style={{ padding: "14px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: SEV_COLOR[it.severity] || "#64D2FF", letterSpacing: 0.8, textTransform: "uppercase", flexShrink: 0 }}>{it.severity}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{it.area}</span>
                    </div>
                    <div style={{ fontSize: 13, color: TITANIUM, lineHeight: 1.6 }}>
                      Board: <span style={{ color: STARLIGHT }}>{it.board}</span><br />
                      Live: <span style={{ color: STARLIGHT }}>{it.live}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 4 }}>{it.note}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={run} disabled={running} style={{ padding: "11px 24px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)", background: "transparent", color: STARLIGHT, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>
                {running ? "Rechecking…" : "Recheck"}
              </button>
              <Link to={`/board/${boardId}`} style={{ padding: "11px 24px", borderRadius: 100, background: ACCENT_BLUE, color: "#fff", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
                Update the board
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
