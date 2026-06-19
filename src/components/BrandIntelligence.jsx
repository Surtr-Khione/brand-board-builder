import { useState, useRef } from "react";
import { scanSocial, analyzePDF, synthesizeBrand } from "../lib/ai";

const PLATFORMS = [
  { type: "website",   label: "Website",   icon: "🌐", placeholder: "yourbrand.com", color: "#e94560",  hint: "Colors, fonts, meta, CSS vars" },
  { type: "linkedin",  label: "LinkedIn",  icon: "💼", placeholder: "linkedin.com/company/yourbrand", color: "#0077b5", hint: "Mission, industry, specialties, B2B voice" },
  { type: "instagram", label: "Instagram", icon: "📸", placeholder: "instagram.com/yourbrand", color: "#e1306c", hint: "Visual style, content topics, caption voice" },
  { type: "youtube",   label: "YouTube",   icon: "▶", placeholder: "youtube.com/@yourbrand", color: "#ff0000",  hint: "Channel description, content pillars, video style" },
  { type: "tiktok",   label: "TikTok",    icon: "🎵", placeholder: "tiktok.com/@yourbrand", color: "#00f2ea",  hint: "Bio, content style, personality" },
  { type: "pinterest", label: "Pinterest", icon: "📌", placeholder: "pinterest.com/yourbrand", color: "#e60023", hint: "Aesthetic direction, visual mood, board themes" },
  { type: "facebook",  label: "Facebook",  icon: "👥", placeholder: "facebook.com/yourbrand", color: "#1877f2", hint: "About section, community tone" },
  { type: "twitter",   label: "Twitter/X", icon: "✕",  placeholder: "x.com/yourbrand", color: "#1da1f2",  hint: "Brand voice, bio, key topics" },
  { type: "pdf",       label: "Brand PDF", icon: "📄", placeholder: null, color: "#9b59b6", hint: "Brand guide, style guide, pitch deck — extracts everything" },
];

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

export default function BrandIntelligence({ onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [urls, setUrls] = useState({});
  const [statuses, setStatuses] = useState({});
  const [sourceData, setSourceData] = useState({});
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthDone, setSynthDone] = useState(false);
  const [error, setError] = useState(null);

  const setStatus = (type, s) => setStatuses(p => ({ ...p, [type]: s }));
  const setUrl = (type, u) => setUrls(p => ({ ...p, [type]: u }));
  const setData = (type, d) => setSourceData(p => ({ ...p, [type]: d }));

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
        const s = result.synthesis;
        const updates = {};
        // Core fields
        for (const k of ["brandName","tagline","industry","elevator","mission","vision","brandPromise","whyDifferent","archetype","socialPersonality","photoStyle","photoMood","audioMood","competitivePositioning"]) {
          if (s[k]) updates[k] = s[k];
        }
        // Arrays
        if (s.coreValues?.some(Boolean)) updates.coreValues = s.coreValues;
        if (s.toneAttributes?.some(Boolean)) updates.toneAttributes = s.toneAttributes;
        if (s.brandPersonality?.some(Boolean)) updates.brandPersonality = s.brandPersonality;
        if (s.messagingDos?.some(Boolean)) updates.messagingDos = s.messagingDos;
        if (s.messagingDonts?.some(Boolean)) updates.messagingDonts = s.messagingDonts;
        if (s.wordsAlways?.some(Boolean)) updates.wordsAlways = s.wordsAlways;
        if (s.wordsNever?.some(Boolean)) updates.wordsNever = s.wordsNever;
        if (s.differentiators?.some(Boolean)) updates.differentiators = s.differentiators;
        if (s.moodboardKeywords?.some(Boolean)) updates.moodboardKeywords = s.moodboardKeywords;
        // Platform voices
        for (const k of ["voiceInstagram","voiceLinkedIn","voiceYouTube","voiceTikTok","voiceFacebook","voiceTwitter"]) {
          if (s[k]) updates[k] = s[k];
        }
        // Audience
        for (const k of ["audienceAge","audienceRole","audiencePains","audienceGoals"]) {
          if (s[k]) updates[k] = s[k];
        }
        // Content pillars (structured)
        if (s.contentPillars?.length) {
          updates.contentPillars = s.contentPillars.map(p =>
            typeof p === "string"
              ? { name: p, description: "", topics: ["", ""], audience: "" }
              : { name: p.name || "", description: p.description || "", topics: Array.isArray(p.topics) ? p.topics : ["", ""], audience: p.rationale || "" }
          );
        }
        // ICPs — top 3 customer profiles
        if (s.icps?.length) {
          updates.icps = s.icps.slice(0, 3).map((icp, i) => ({
            id: String(i + 1),
            title: icp.title || "",
            segment: icp.segment || "",
            demographics: icp.demographics || "",
            psychographics: icp.psychographics || "",
            painPoints: icp.painPoints || ["", ""],
            goals: icp.goals || ["", ""],
            buyingTriggers: icp.buyingTriggers || ["", ""],
            channels: icp.channels || "",
            messageAngle: icp.messageAngle || "",
            ltv: icp.ltv || "",
            acquisition: icp.acquisition || "",
          }));
        }
        // Color rationale stored in notes if present
        if (s.primaryFont) updates.primaryFont = s.primaryFont;
        if (s.bodyFont) updates.bodyFont = s.bodyFont;
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

          {/* Platform rows */}
          {PLATFORMS.map(p => (
            <SourceRow
              key={p.type}
              platform={p}
              url={urls[p.type] || ""}
              status={statuses[p.type]}
              onUrlChange={u => setUrl(p.type, u)}
              onScan={(url, file) => scanSource(p.type, url, file)}
            />
          ))}

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
