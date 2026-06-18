import { useState } from "react";
import { scanWebsite, isAIAvailable } from "../lib/ai";

const STEPS = [
  { key: "fetching", label: "Fetching your website..." },
  { key: "parsing", label: "Extracting colors & fonts..." },
  { key: "ai", label: "Analyzing brand identity..." },
  { key: "done", label: "Analysis complete" },
];

function ColorSwatch({ color, size = 20 }) {
  return (
    <div
      title={color}
      style={{
        width: size, height: size, borderRadius: "4px",
        background: color, border: "1px solid rgba(255,255,255,0.1)",
        flexShrink: 0, cursor: "default",
      }}
    />
  );
}

export default function WebScanner({ onApply }) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);

  const canUseAI = isAIAvailable();

  const handleScan = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setScanning(true);
    setError(null);
    setResult(null);
    setApplied(false);

    try {
      setStepIdx(0);
      await sleep(200);
      setStepIdx(1);
      const data = await scanWebsite(trimmed);
      setStepIdx(2);
      await sleep(150);
      setStepIdx(3);
      setResult(data);
    } catch (err) {
      setError(err.message || "Scan failed. Check the URL and try again.");
    }
    setScanning(false);
  };

  const handleApply = () => {
    if (!result) return;
    const updates = {};
    const a = result.analysis || {};

    // Factual fields from scanning
    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    updates.website = cleanUrl;

    // Colors
    if (result.primaryColor) updates.primaryColor = result.primaryColor;
    if (result.secondaryColor) updates.secondaryColor = result.secondaryColor;
    if (result.accentColor) updates.accentColor = result.accentColor;

    // Fonts (first two unique)
    if (result.fonts?.[0]) updates.primaryFont = result.fonts[0];
    if (result.fonts?.[1]) updates.bodyFont = result.fonts[1];

    // AI analysis fields
    if (a.brandName) updates.brandName = a.brandName;
    if (a.tagline) updates.tagline = a.tagline;
    if (a.industry) updates.industry = a.industry;
    if (a.elevator) updates.elevator = a.elevator;
    if (a.mission) updates.mission = a.mission;
    if (a.archetype) updates.archetype = a.archetype;
    if (a.toneAttributes?.some(Boolean)) updates.toneAttributes = a.toneAttributes;
    if (a.brandPersonality?.some(Boolean)) updates.brandPersonality = a.brandPersonality;
    if (a.photoStyle) updates.photoStyle = a.photoStyle;
    if (a.photoMood) updates.photoMood = a.photoMood;
    if (a.socialPersonality) updates.socialPersonality = a.socialPersonality;

    onApply(updates);
    setApplied(true);
  };

  const reset = () => {
    setResult(null);
    setApplied(false);
    setError(null);
    setStepIdx(0);
  };

  // ── Applied summary state ─────────────────────────────────────────────────
  if (applied && result) {
    return (
      <div style={{
        padding: "12px 16px", borderRadius: "10px",
        border: "1px solid rgba(46,204,113,0.2)",
        background: "rgba(46,204,113,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "16px" }}>✓</span>
          <span style={{ fontSize: "13px", color: "#2ecc71" }}>
            Brand data imported from <strong>{url}</strong>
          </span>
        </div>
        <button onClick={reset} style={ghostBtn}>Re-scan</button>
      </div>
    );
  }

  // ── Main scanner card ─────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.015)", padding: "20px",
      marginBottom: "32px",
    }}>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
          Start with your website
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Scans colors, fonts, and brand tone automatically
          {canUseAI ? " · one AI call (~$0.002)" : " · colors & fonts only (AI not configured)"}
        </div>
      </div>

      {/* URL input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: error ? "10px" : "0" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
          placeholder="yourbrand.com"
          disabled={scanning}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)", color: "#e0e0e0",
            fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
        />
        <button
          onClick={handleScan}
          disabled={scanning || !url.trim()}
          style={{
            padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: scanning || !url.trim()
              ? "rgba(233,69,96,0.3)"
              : "linear-gradient(135deg, #e94560, #c62a42)",
            color: "#fff", fontSize: "13px", fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
          }}
        >
          {scanning ? "Scanning..." : "Scan Website"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#e94560" }}>
          {error}
        </div>
      )}

      {/* Progress steps */}
      {scanning && (
        <div style={{ marginTop: "16px" }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{
                width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: 700,
                background: i < stepIdx ? "#2ecc71"
                  : i === stepIdx ? "#e94560"
                  : "rgba(255,255,255,0.06)",
                color: i <= stepIdx ? "#fff" : "#444",
              }}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: "12px",
                color: i === stepIdx ? "#e0e0e0" : i < stepIdx ? "#2ecc71" : "#444",
              }}>
                {s.label}
                {i === stepIdx && <span style={{ animation: "pulse 1s infinite" }}> ●</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Results preview */}
      {result && !scanning && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "16px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {/* Colors */}
            <div>
              <div style={{ fontSize: "10px", color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Colors found
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {[result.primaryColor, result.secondaryColor, result.accentColor,
                  ...(result.allVivid || []).slice(3, 7)
                ].filter(Boolean).map((c, i) => (
                  <ColorSwatch key={i} color={c} size={22} />
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "5px" }}>
                {result.allVivid?.length || 0} colors extracted
              </div>
            </div>

            {/* Fonts */}
            <div>
              <div style={{ fontSize: "10px", color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Fonts found
              </div>
              {result.fonts?.length > 0 ? (
                result.fonts.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ fontSize: "12px", color: "#aaa", marginBottom: "3px" }}>{f}</div>
                ))
              ) : (
                <div style={{ fontSize: "12px", color: "#444" }}>None detected</div>
              )}
            </div>
          </div>

          {/* AI analysis preview */}
          {result.hasAI && result.analysis && (
            <div style={{ marginBottom: "12px" }}>
              {result.analysis.brandName && (
                <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
                  <span style={{ color: "#555" }}>Brand: </span>{result.analysis.brandName}
                </div>
              )}
              {result.analysis.archetype && (
                <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
                  <span style={{ color: "#555" }}>Archetype: </span>{result.analysis.archetype}
                </div>
              )}
              {result.analysis.industry && (
                <div style={{ fontSize: "12px", color: "#aaa" }}>
                  <span style={{ color: "#555" }}>Industry: </span>{result.analysis.industry}
                </div>
              )}
            </div>
          )}

          {!result.hasAI && (
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>
              AI key not set — only colors, fonts, and meta were extracted.
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleApply} style={{
              padding: "9px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #e94560, #c62a42)",
              color: "#fff", fontSize: "13px", fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Apply to My Board
            </button>
            <button onClick={reset} style={ghostBtn}>Scan again</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ghostBtn = {
  padding: "9px 16px", borderRadius: "8px", cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
  color: "#666", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
