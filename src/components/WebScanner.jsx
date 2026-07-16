import { useState, useEffect } from "react";
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

export default function WebScanner({ onApply, initialUrl = "" }) {
  const [url, setUrl] = useState(initialUrl);
  const [scanning, setScanning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);

  const canUseAI = isAIAvailable();

  useEffect(() => {
    if (initialUrl.trim()) handleScan(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (urlOverride) => {
    const trimmed = (urlOverride ?? url).trim();
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
    // Map palette: index 0→primary, 1→secondary, 2→accent
    // Vision returns semantic palette; CSS returns pickColors result — both use colorMap
    const palette = result.colorMap || [];
    if (palette[0]?.color) updates.primaryColor   = palette[0].color;
    else if (result.primaryColor) updates.primaryColor = result.primaryColor;
    if (palette[1]?.color) updates.secondaryColor = palette[1].color;
    else if (result.secondaryColor) updates.secondaryColor = result.secondaryColor;
    if (palette[2]?.color) updates.accentColor    = palette[2].color;
    else if (result.accentColor) updates.accentColor = result.accentColor;
    if (result.fonts?.[0]) updates.primaryFont = result.fonts[0];
    if (result.fonts?.[1]) updates.bodyFont    = result.fonts[1];
    // Brand icons
    if (result.faviconUrl)      updates.faviconUrl  = result.faviconUrl;
    if (result.logoUrl)         updates.logoUrl     = result.logoUrl;
    if (result.ogImage)         updates.ogImage     = result.ogImage;
    if (result.iconSources)     updates.iconSources = result.iconSources;
    // AI analysis
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
    // Store auto-detected social + podcast URLs for BrandIntelligence auto-fill
    if (result.discoveredUrls && Object.keys(result.discoveredUrls).length > 0) {
      updates.discoveredUrls = result.discoveredUrls;
    }
    onApply(updates);
    setApplied(true);
  };

  const reset = () => { setResult(null); setApplied(false); setError(null); setStepIdx(0); };

  if (applied && result) {
    return (
      <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(50,215,75,0.2)", background: "rgba(50,215,75,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, color: "#32D74B" }}>Brand data imported from <strong>{url}</strong></span>
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
        <button onClick={handleScan} disabled={scanning || !url.trim()} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: scanning || !url.trim() ? "rgba(0,113,227,0.3)" : "linear-gradient(135deg,#0071E3,#005BB8)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {scanning ? "Scanning..." : "Scan Website"}
        </button>
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 12, color: "#FF453A" }}>{error}</div>}

      {scanning && (
        <div style={{ marginTop: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: i < stepIdx ? "#32D74B" : i === stepIdx ? "#0071E3" : "rgba(255,255,255,0.06)", color: i <= stepIdx ? "#fff" : "#444" }}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === stepIdx ? "#e0e0e0" : i < stepIdx ? "#32D74B" : "#444" }}>
                {s.label}{i === stepIdx && " ●"}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && !scanning && (
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

          {/* Brand icons row */}
          {(result.faviconUrl || result.logoUrl || result.ogImage) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Brand Icons Discovered</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {result.logoUrl && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, background: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <img src={result.logoUrl} alt="Logo" style={{ width: 40, height: 40, objectFit: "contain" }} onError={e => e.currentTarget.style.display = "none"} />
                    </div>
                    <div style={{ fontSize: 8, color: "#333", marginTop: 3, letterSpacing: 1 }}>CLEARBIT</div>
                  </div>
                )}
                {result.faviconUrl && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, background: "#111", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <img src={result.faviconUrl} alt="Icon" style={{ width: 40, height: 40, objectFit: "contain" }} onError={e => e.currentTarget.style.display = "none"} />
                    </div>
                    <div style={{ fontSize: 8, color: "#333", marginTop: 3, letterSpacing: 1 }}>APPLE ICON</div>
                  </div>
                )}
                {result.googleFaviconUrl && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, background: "#111", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <img src={result.googleFaviconUrl} alt="Favicon" style={{ width: 40, height: 40, objectFit: "contain" }} onError={e => e.currentTarget.style.display = "none"} />
                    </div>
                    <div style={{ fontSize: 8, color: "#333", marginTop: 3, letterSpacing: 1 }}>FAVICON</div>
                  </div>
                )}
                {result.ogImage && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 80, height: 56, background: "#111", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <img src={result.ogImage} alt="OG" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.currentTarget.style.display = "none"} />
                    </div>
                    <div style={{ fontSize: 8, color: "#333", marginTop: 3, letterSpacing: 1 }}>OG IMAGE</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform warning */}
          {result.platformWarning && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(255,170,0,0.07)", border: "1px solid rgba(255,170,0,0.2)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
              <div style={{ fontSize: 11, color: "#aa8800", lineHeight: 1.5 }}>{result.platformWarning}</div>
            </div>
          )}

          {/* Full palette strip */}
          {result.colorMap?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Brand Palette
                {result.colorSource === "vision" && <span style={{ marginLeft: 6, color: "#666", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· visual analysis</span>}
                {result.colorSource === "unknown" && <span style={{ marginLeft: 6, color: "#444", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· limited</span>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {result.colorMap.map((c, i) => (
                  <div key={i} title={`${c.role}: ${c.color}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: c.color,
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: i < 3 ? "0 0 0 2px rgba(233,69,96,0.4)" : "none",
                    }} />
                    <div style={{ fontSize: 8, color: "#444", fontFamily: "monospace", letterSpacing: 0 }}>{c.color}</div>
                  </div>
                ))}
              </div>
              {result.colorMap.length > 3 && (
                <div style={{ fontSize: 10, color: "#444", marginTop: 6 }}>
                  Outlined = applied to board (primary, secondary, accent)
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
            {/* Color roles */}
            <div>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Colors by Role
              </div>
              {result.colorMap?.length > 0 ? (
                result.colorMap.map((c, i) => <ColorRow key={i} role={c.role} color={c.color} />)
              ) : (
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
            <button onClick={handleApply} style={{ padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0071E3,#005BB8)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
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
