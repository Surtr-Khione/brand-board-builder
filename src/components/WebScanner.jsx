import { useState } from "react";
import { scanWebsite, isAIAvailable } from "../lib/ai";

const STEPS = [
  { key: "fetching", label: "Fetching your website..." },
  { key: "parsing", label: "Analyzing CSS and semantic structure..." },
  { key: "ai", label: "Extracting brand identity with AI..." },
  { key: "done", label: "Analysis complete" },
];

const ROLE_ICONS = {
  "Theme Color":    "◉",
  "Brand Variable": "◆",
  "CTA / Button":   "■",
  "Link / Accent":  "◈",
  "Heading":        "H",
  "Navigation":     "≡",
  "Background":     "□",
  "Body Text":      "¶",
};

function ColorRow({ role, color }) {
  const icon = ROLE_ICONS[role] || "●";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{role}</div>
        <div style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{color}</div>
      </div>
      <span style={{ fontSize: 9, color: "#333" }}>{icon}</span>
    </div>
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
    updates.website = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    if (result.primaryColor)   updates.primaryColor   = result.primaryColor;
    if (result.secondaryColor) updates.secondaryColor = result.secondaryColor;
    if (result.accentColor)    updates.accentColor    = result.accentColor;
    if (result.fonts?.[0]) updates.primaryFont = result.fonts[0];
    if (result.fonts?.[1]) updates.bodyFont    = result.fonts[1];
    if (a.brandName)                       updates.brandName      = a.brandName;
    if (a.tagline)                         updates.tagline        = a.tagline;
    if (a.industry)                        updates.industry       = a.industry;
    if (a.elevator)                        updates.elevator       = a.elevator;
    if (a.mission)                         updates.mission        = a.mission;
    if (a.archetype)                       updates.archetype      = a.archetype;
    if (a.toneAttributes?.some(Boolean))   updates.toneAttributes = a.toneAttributes;
    if (a.brandPersonality?.some(Boolean)) updates.brandPersonality = a.brandPersonality;
    if (a.photoStyle)                      updates.photoStyle     = a.photoStyle;
    if (a.photoMood)                       updates.photoMood      = a.photoMood;
    if (a.socialPersonality)               updates.socialPersonality = a.socialPersonality;
    onApply(updates);
    setApplied(true);
  };

  const reset = () => { setResult(null); setApplied(false); setError(null); setStepIdx(0); };

  if (applied && result) {
    return (
      <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(46,204,113,0.2)", background: "rgba(46,204,113,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, color: "#2ecc71" }}>Brand data imported from <strong>{url}</strong></span>
        </div>
        <button onClick={reset} style={ghostBtn}>Re-scan</button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: 20, marginBottom: 32 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Start with your website</div>
        <div style={{ fontSize: 12, color: "#555" }}>
          Extracts colors by role (heading, CTA, background), fonts, and brand tone
          {canUseAI ? " · AI analysis included" : " · AI not configured"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: error ? 10 : 0 }}>
        <input
          type="text" value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !scanning && handleScan()}
          placeholder="yourbrand.com"
          disabled={scanning}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e0e0e0", fontSize: 14, fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={handleScan} disabled={scanning || !url.trim()} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: scanning || !url.trim() ? "rgba(233,69,96,0.3)" : "linear-gradient(135deg,#e94560,#c62a42)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {scanning ? "Scanning..." : "Scan Website"}
        </button>
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 12, color: "#e94560" }}>{error}</div>}

      {scanning && (
        <div style={{ marginTop: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: i < stepIdx ? "#2ecc71" : i === stepIdx ? "#e94560" : "rgba(255,255,255,0.06)", color: i <= stepIdx ? "#fff" : "#444" }}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === stepIdx ? "#e0e0e0" : i < stepIdx ? "#2ecc71" : "#444" }}>
                {s.label}{i === stepIdx && " ●"}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && !scanning && (
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
            {/* Color roles */}
            <div>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Colors by Role</div>
              {result.colorMap?.length > 0 ? (
                result.colorMap.map((c, i) => <ColorRow key={i} role={c.role} color={c.color} />)
              ) : (
                // Fallback: show the 3 picks without roles
                [
                  { role: "Primary", color: result.primaryColor },
                  { role: "Secondary", color: result.secondaryColor },
                  { role: "Accent", color: result.accentColor },
                ].filter(x => x.color).map((c, i) => <ColorRow key={i} role={c.role} color={c.color} />)
              )}
            </div>

            {/* Fonts + AI */}
            <div>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Fonts</div>
              {result.fonts?.length > 0 ? (
                result.fonts.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#aaa", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "#444" }}>Aa</span> {f}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "#444" }}>None detected</div>
              )}

              {result.hasAI && result.analysis && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AI Analysis</div>
                  {result.analysis.brandName && <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}><span style={{ color: "#444" }}>Brand · </span>{result.analysis.brandName}</div>}
                  {result.analysis.archetype  && <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}><span style={{ color: "#444" }}>Archetype · </span>{result.analysis.archetype}</div>}
                  {result.analysis.industry   && <div style={{ fontSize: 11, color: "#888" }}><span style={{ color: "#444" }}>Industry · </span>{result.analysis.industry}</div>}
                </div>
              )}
              {!result.hasAI && (
                <div style={{ fontSize: 11, color: "#444", marginTop: 14 }}>AI not configured — colors & fonts only.</div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleApply} style={{ padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#e94560,#c62a42)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              Apply to My Board
            </button>
            <button onClick={reset} style={ghostBtn}>Scan again</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ghostBtn = { padding: "9px 16px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#666", fontSize: 13, fontFamily: "inherit" };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
