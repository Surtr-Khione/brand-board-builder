import { useState, useRef } from "react";
import { scanSocial, analyzePDF, synthesizeBrand } from "../lib/ai";
import { mapSynthesisToBoard } from "../lib/synthesisMap";

const PLATFORMS = [
  // Social
  { type: "website",       label: "Website",        icon: "🌐", group: "social", placeholder: "yourbrand.com",                          color: "#e94560", hint: "Colors, fonts, meta, CSS vars" },
  { type: "linkedin",      label: "LinkedIn",       icon: "💼", group: "social", placeholder: "linkedin.com/company/yourbrand",          color: "#0077b5", hint: "Mission, industry, specialties, B2B voice" },
  { type: "instagram",     label: "Instagram",      icon: "📸", group: "social", placeholder: "instagram.com/yourbrand",                 color: "#e1306c", hint: "Visual style, content topics, caption voice" },
  { type: "youtube",       label: "YouTube",        icon: "▶",  group: "social", placeholder: "youtube.com/@yourbrand",                  color: "#ff0000", hint: "Channel description, content pillars, video style" },
  { type: "tiktok",        label: "TikTok",         icon: "🎵", group: "social", placeholder: "tiktok.com/@yourbrand",                   color: "#00f2ea", hint: "Bio, content style, personality" },
  { type: "pinterest",     label: "Pinterest",      icon: "📌", group: "social", placeholder: "pinterest.com/yourbrand",                 color: "#e60023", hint: "Aesthetic direction, visual mood, board themes" },
  { type: "facebook",      label: "Facebook",       icon: "👥", group: "social", placeholder: "facebook.com/yourbrand",                  color: "#1877f2", hint: "About section, community tone" },
  { type: "twitter",       label: "Twitter/X",      icon: "✕",  group: "social", placeholder: "x.com/yourbrand",                        color: "#1da1f2", hint: "Brand voice, bio, key topics" },
  // Podcast & Audio
  { type: "spotify",       label: "Spotify Podcast",icon: "🎙", group: "audio",  placeholder: "open.spotify.com/show/...",              color: "#1DB954", hint: "Episode topics, host voice, audience signals" },
  { type: "applepodcasts", label: "Apple Podcasts", icon: "🎧", group: "audio",  placeholder: "podcasts.apple.com/podcast/...",          color: "#9B59B6", hint: "Show reviews, episode themes, audience" },
  { type: "soundcloud",    label: "SoundCloud",     icon: "☁",  group: "audio",  placeholder: "soundcloud.com/yourbrand",               color: "#FF5500", hint: "Audio personality, tracks, content style" },
  { type: "amazonmusic",   label: "Amazon Music",   icon: "🎶", group: "audio",  placeholder: "music.amazon.com/podcasts/...",           color: "#FF9900", hint: "Podcast presence, episode themes" },
  { type: "iheartradio",   label: "iHeartRadio",    icon: "📻", group: "audio",  placeholder: "iheart.com/podcast/...",                  color: "#C6002B", hint: "Podcast topics, radio voice" },
  { type: "podcastrss",    label: "Podcast RSS",    icon: "⊡",  group: "audio",  placeholder: "feeds.yourbrand.com/podcast.rss",         color: "#F26522", hint: "Full episode catalog, topics, audience" },
  // Documents
  { type: "pdf",           label: "Brand PDF",      icon: "📄", group: "doc",    placeholder: null,                                      color: "#9b59b6", hint: "Brand guide, style guide, pitch deck — extracts everything" },
];

const GROUP_LABELS = {
  social: "Social Channels",
  audio:  "Podcasts & Audio",
  doc:    "Documents",
};

function SourceRow({ platform, status, url, onUrlChange, onScan, onRemove }) {
  const fileRef = useRef(null);
  const isPDF = platform.type === "pdf";
  const isScanning = status === "scanning";
  const isDone = status === "done";
  const isError = status === "error";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onScan(null, file);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 10, marginBottom: 8,
      border: `1px solid ${isDone ? "rgba(46,204,113,0.2)" : isError ? "rgba(233,69,96,0.15)" : "rgba(255,255,255,0.06)"}`,
      background: isDone ? "rgba(46,204,113,0.03)" : "rgba(255,255,255,0.015)",
      transition: "all 0.2s",
    }}>
      {/* Platform icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `rgba(${hexToRgb(platform.color)},0.12)`,
        border: `1px solid rgba(${hexToRgb(platform.color)},0.2)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14,
      }}>{platform.icon}</div>

      {/* URL input or file trigger */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
          {platform.label}
          {isDone && <span style={{ color: "#2ecc71", marginLeft: 6 }}>✓</span>}
          {isError && <span style={{ color: "#e94560", marginLeft: 6 }}>✗ failed</span>}
        </div>
        {isPDF ? (
          <>
            <input type="file" ref={fileRef} accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ fontSize: 12, color: isDone ? "#2ecc71" : "#555", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
            >
              {isDone ? url || "PDF uploaded" : "Click to upload a PDF →"}
            </button>
          </>
        ) : (
          <input
            type="text"
            value={url}
            onChange={e => onUrlChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && url && !isScanning && onScan(url)}
            placeholder={platform.placeholder}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#ccc", fontSize: 12, fontFamily: "inherit", padding: 0 }}
          />
        )}
        {!isDone && !isError && url && (
          <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{platform.hint}</div>
        )}
      </div>

      {/* Action */}
      {!isPDF && url && (
        <button
          onClick={() => onScan(url)}
          disabled={isScanning}
          style={{
            padding: "5px 12px", borderRadius: 6, border: "none", cursor: isScanning ? "wait" : "pointer",
            background: isDone ? "rgba(46,204,113,0.12)" : `rgba(${hexToRgb(platform.color)},0.15)`,
            color: isDone ? "#2ecc71" : platform.color,
            fontSize: 11, fontWeight: 700, fontFamily: "inherit", flexShrink: 0,
          }}
        >
          {isScanning ? "..." : isDone ? "Re-scan" : "Scan"}
        </button>
      )}
      {url && onRemove && (
        <button onClick={onRemove} style={{ background: "transparent", border: "none", color: "#333", cursor: "pointer", fontSize: 13, padding: "0 4px", flexShrink: 0 }}>×</button>
      )}
    </div>
  );
}

export default function BrandIntelligence({ onApply, discoveredUrls = {} }) {
  const [expanded, setExpanded] = useState(false);
  const [urls, setUrls] = useState({});
  const [statuses, setStatuses] = useState({});
  const [sourceData, setSourceData] = useState({});
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthDone, setSynthDone] = useState(false);
  const [error, setError] = useState(null);
  const [dismissedDiscovered, setDismissedDiscovered] = useState(false);

  const setStatus = (type, s) => setStatuses(p => ({ ...p, [type]: s }));
  const setUrl = (type, u) => setUrls(p => ({ ...p, [type]: u }));
  const setData = (type, d) => setSourceData(p => ({ ...p, [type]: d }));

  // New discovered URLs not yet populated in inputs
  const newDiscovered = Object.entries(discoveredUrls).filter(
    ([type, u]) => u && !urls[type] && PLATFORMS.find(p => p.type === type)
  );

  const scanSource = async (type, urlOrNull, fileOrNull) => {
    setStatus(type, "scanning");
    setError(null);
    try {
      if (type === "pdf" && fileOrNull) {
        const base64 = await fileToBase64(fileOrNull);
        const result = await analyzePDF(base64, fileOrNull.name);
        setData(type, { analysis: result.analysis });
        setUrl(type, fileOrNull.name);
        setStatus(type, "done");
      } else {
        const result = await scanSocial(urlOrNull, type);
        setData(type, result);
        setStatus(type, "done");
      }
    } catch (err) {
      setStatus(type, "error");
      console.error(type, err);
    }
  };

  const doneSources = Object.entries(statuses).filter(([, s]) => s === "done").length;

  const handleSynthesize = async () => {
    setSynthesizing(true);
    setError(null);
    try {
      const sources = Object.entries(sourceData)
        .filter(([t]) => statuses[t] === "done")
        .map(([type, data]) => ({ type, url: urls[type] || "", data }));
      const result = await synthesizeBrand(sources, {});
      if (result?.synthesis) {
        const updates = mapSynthesisToBoard(result.synthesis);
        // Scanned sources keep authority over colors — synthesis colors are
        // inferred, a scan's are observed. mapSynthesisToBoard includes them
        // for the from-zero founder path; here we drop them unless no scan
        // found colors at all.
        const scannedColors = Object.values(sourceData).some((d) => d?.colors?.length);
        if (scannedColors) {
          delete updates.primaryColor;
          delete updates.secondaryColor;
          delete updates.accentColor;
        }
        // Sources map
        updates.sources = urls;
        onApply(updates);
        setSynthDone(true);
      }
    } catch (err) {
      setError("Synthesis failed: " + err.message);
    }
    setSynthesizing(false);
  };

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.012)", marginBottom: 32, overflow: "hidden" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 18 }}>🧠</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0ece3" }}>Brand Intelligence</div>
            <div style={{ fontSize: 11, color: "#444" }}>
              Connect your URLs · Scan all sources · AI synthesizes everything
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {doneSources > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2ecc71", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 20, padding: "3px 10px" }}>
              {doneSources} source{doneSources > 1 ? "s" : ""} scanned
            </div>
          )}
          <span style={{ color: "#444", fontSize: 14, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 16 }} />

          {/* Discovered URLs from website scan */}
          {newDiscovered.length > 0 && !dismissedDiscovered && (
            <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(46,204,113,0.18)", background: "rgba(46,204,113,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2ecc71", letterSpacing: 0.5 }}>
                  ✦ {newDiscovered.length} profile{newDiscovered.length > 1 ? "s" : ""} discovered from your website scan
                </div>
                <button onClick={() => setDismissedDiscovered(true)} style={{ background: "transparent", border: "none", color: "#333", cursor: "pointer", fontSize: 12 }}>×</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {newDiscovered.map(([type, url]) => {
                  const plat = PLATFORMS.find(p => p.type === type);
                  if (!plat) return null;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setUrl(type, url);
                        if (!expanded) setExpanded(true);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 7,
                        border: `1px solid rgba(${hexToRgb(plat.color)},0.25)`,
                        background: `rgba(${hexToRgb(plat.color)},0.08)`,
                        color: plat.color, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {plat.icon} {plat.label}
                      <span style={{ fontSize: 9, opacity: 0.6, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {url.replace(/^https?:\/\//, "").slice(0, 30)}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    newDiscovered.forEach(([type, url]) => setUrl(type, url));
                    setDismissedDiscovered(true);
                  }}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(46,204,113,0.25)", background: "rgba(46,204,113,0.08)", color: "#2ecc71", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Fill all →
                </button>
              </div>
            </div>
          )}

          {/* Platform rows grouped */}
          {["social", "audio", "doc"].map(group => {
            const groupPlatforms = PLATFORMS.filter(p => p.group === group);
            return (
              <div key={group}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#1e1e1e", letterSpacing: 2, textTransform: "uppercase", margin: "12px 0 6px", paddingLeft: 2 }}>
                  {GROUP_LABELS[group]}
                </div>
                {groupPlatforms.map(p => (
                  <SourceRow
                    key={p.type}
                    platform={p}
                    url={urls[p.type] || ""}
                    status={statuses[p.type]}
                    onUrlChange={u => setUrl(p.type, u)}
                    onScan={(url, file) => scanSource(p.type, url, file)}
                  />
                ))}
              </div>
            );
          })}

          {/* Synthesize CTA */}
          {doneSources >= 1 && !synthDone && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(155,89,182,0.2)", background: "rgba(155,89,182,0.04)" }}>
              <div style={{ fontSize: 13, color: "#ccc", marginBottom: 12 }}>
                <strong style={{ color: "#9b59b6" }}>{doneSources} source{doneSources > 1 ? "s" : ""} ready.</strong>
                {" "}AI will synthesize all of them into a complete brand profile — voice, audience, pillars, vocabulary, and positioning.
              </div>
              {error && <div style={{ fontSize: 12, color: "#e94560", marginBottom: 10 }}>{error}</div>}
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none", cursor: synthesizing ? "wait" : "pointer",
                  background: synthesizing ? "rgba(155,89,182,0.3)" : "linear-gradient(135deg,#9b59b6,#6c3483)",
                  color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                }}
              >
                {synthesizing ? "Synthesizing all sources..." : "✦ Synthesize Brand Intelligence"}
              </button>
            </div>
          )}

          {synthDone && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(46,204,113,0.2)", background: "rgba(46,204,113,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#2ecc71", fontWeight: 600 }}>✓ Brand intelligence applied — all sections updated</span>
              <button onClick={() => setSynthDone(false)} style={{ fontSize: 11, color: "#555", background: "transparent", border: "none", cursor: "pointer" }}>Re-synthesize</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  if (!hex) return "128,128,128";
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "128,128,128" : `${r},${g},${b}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
