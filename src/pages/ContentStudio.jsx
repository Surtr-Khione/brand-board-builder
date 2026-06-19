import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { loadBoard } from "../lib/storage";
import { generateContent } from "../lib/ai";

// ─── Usage gate ──────────────────────────────────────────────────────────────
const FREE_LIMIT = 5;
function getUsage() { try { return parseInt(localStorage.getItem("brandmd_gen_count") || "0"); } catch { return 0; } }
function incrementUsage() { try { localStorage.setItem("brandmd_gen_count", String(getUsage() + 1)); } catch {} }
function isPremium() { try { return localStorage.getItem("brandmd_premium") === "1"; } catch { return false; } }

// ─── Content types ────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  {
    category: "Written",
    icon: "✍",
    color: "#3498db",
    types: [
      { id: "blog-post",      label: "Blog Post",         icon: "📝", desc: "Long-form article, publish-ready", platforms: [] },
      { id: "email",          label: "Email",             icon: "✉",  desc: "Single campaign email", platforms: ["email"] },
      { id: "email-sequence", label: "Email Sequence",    icon: "✉✉", desc: "5-email nurture flow", platforms: ["email"] },
      { id: "sms",            label: "SMS Campaign",      icon: "💬", desc: "3 SMS variations under 160 chars", platforms: [] },
      { id: "headline-pack",  label: "Headline Pack",     icon: "⚡", desc: "10 headlines across 5 frameworks", platforms: [] },
    ],
  },
  {
    category: "Social",
    icon: "◈",
    color: "#e1306c",
    types: [
      { id: "instagram-carousel", label: "Instagram Carousel", icon: "📸", desc: "7-slide carousel with captions", platforms: ["instagram"] },
      { id: "linkedin-article",   label: "LinkedIn Article",   icon: "💼", desc: "Thought leadership long-form", platforms: ["linkedin"] },
      { id: "x-thread",           label: "X / Twitter Thread", icon: "✕",  desc: "10-14 tweet thread", platforms: ["twitter"] },
      { id: "tiktok-script",      label: "TikTok Script",      icon: "🎵", desc: "Hook + content + CTA script", platforms: ["tiktok"] },
      { id: "social-post",        label: "Social Post",        icon: "◎",  desc: "3 platform-native post variants", platforms: [] },
    ],
  },
  {
    category: "Video & Audio",
    icon: "▶",
    color: "#e74c3c",
    types: [
      { id: "video-script",    label: "Video Script",    icon: "🎬", desc: "Full script with b-roll notes", platforms: ["youtube"] },
      { id: "webinar-script",  label: "Webinar Script",  icon: "🎤", desc: "Complete webinar + pitch script", platforms: [] },
      { id: "podcast-script",  label: "Podcast Script",  icon: "🎙", desc: "Episode outline + narration", platforms: [] },
      { id: "music-brief",     label: "Music Brief",     icon: "🎵", desc: "Sonic identity creative brief", platforms: [] },
    ],
  },
  {
    category: "PR & Comms",
    icon: "📣",
    color: "#9b59b6",
    types: [
      { id: "pr-pitch",      label: "Media Pitch",    icon: "📰", desc: "Pitch to journalist or podcast host", platforms: [] },
      { id: "press-release", label: "Press Release",  icon: "📢", desc: "AP-style press release", platforms: [] },
    ],
  },
  {
    category: "Visual & Interactive",
    icon: "◌",
    color: "#f39c12",
    types: [
      { id: "image-prompt",  label: "AI Image Prompt", icon: "🖼", desc: "3 detailed prompts for AI art tools", platforms: [] },
      { id: "quiz-concept",  label: "Quiz / Assessment", icon: "◉", desc: "Lead-gen quiz with result tiers", platforms: [] },
    ],
  },
];

const ALL_TYPES = CONTENT_TYPES.flatMap(c => c.types.map(t => ({ ...t, category: c.category, categoryColor: c.color })));

function hexRgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "100,100,100" : `${r},${g},${b}`;
}

// ─── Components ───────────────────────────────────────────────────────────────
function UsageBar({ used, limit, premium }) {
  const pct = Math.min(used / limit, 1) * 100;
  const color = used >= limit ? "#e94560" : used >= limit * 0.7 ? "#f39c12" : "#2ecc71";
  if (premium) return <div style={{ fontSize: 11, color: "#2ecc71", fontWeight: 700 }}>✓ Unlimited</div>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: 11, color: used >= limit ? "#e94560" : "#888" }}>{used}/{limit} free</div>
      <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function TypeCard({ type, selected, onClick }) {
  const [hov, setHov] = useState(false);
  const active = selected || hov;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8,
        border: `1px solid ${selected ? `rgba(${hexRgb(type.categoryColor)},0.4)` : active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
        background: selected ? `rgba(${hexRgb(type.categoryColor)},0.1)` : active ? "rgba(255,255,255,0.03)" : "transparent",
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 10,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{type.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: selected ? type.categoryColor : "#ccc" }}>{type.label}</div>
        <div style={{ fontSize: 10, color: "#444", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{type.desc}</div>
      </div>
    </button>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: copied ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.04)", color: copied ? "#2ecc71" : "#aaa", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function GateModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 440, width: "100%", background: "#0e0e14", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "32px 32px 28px" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>You've used your free generations</div>
        <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
          Upgrade to BrandMD Pro for unlimited AI content generation across all formats — blog posts, email sequences, webinar scripts, social posts, and more.
        </div>
        <div style={{ padding: "16px 20px", borderRadius: 10, border: "1px solid rgba(233,69,96,0.2)", background: "rgba(233,69,96,0.04)", marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e94560" }}>$49<span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>/month</span></div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>Unlimited generations · All content formats · Export to PDF · Priority AI</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { localStorage.setItem("brandmd_premium", "1"); onClose(); }}
            style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#e94560,#c62a42)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Upgrade to Pro
          </button>
          <button onClick={onClose} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#555", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContentStudio() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [topic, setTopic] = useState("");
  const [icpIndex, setIcpIndex] = useState(null); // null = general
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [outputType, setOutputType] = useState("");
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(getUsage());
  const [premium, setPremium] = useState(isPremium());
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    async function load() {
      if (boardId) {
        const data = await loadBoard(boardId);
        if (data?.brand_data) setBrand(data.brand_data);
      } else {
        // Try to get brand from sessionStorage (passed from builder)
        const raw = sessionStorage.getItem("studio_brand");
        if (raw) { try { setBrand(JSON.parse(raw)); } catch {} }
      }
      setLoading(false);
    }
    load();
  }, [boardId]);

  const canGenerate = premium || usage < FREE_LIMIT;

  const generate = useCallback(async () => {
    if (!selectedType || !brand) return;
    if (!canGenerate) { setShowGate(true); return; }
    setGenerating(true);
    setError(null);
    setOutput("");
    try {
      const result = await generateContent({
        brand,
        contentType: selectedType.id,
        topic,
        icpIndex: icpIndex,
        additionalContext,
        platform: selectedType.platforms?.[0] || null,
      });
      setOutput(result.content);
      setOutputType(selectedType.label);
      if (!premium) {
        incrementUsage();
        setUsage(getUsage());
      }
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    }
    setGenerating(false);
  }, [selectedType, brand, topic, icpIndex, additionalContext, canGenerate, premium]);

  if (loading) return (
    <div style={{ height: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
      Loading brand data…
    </div>
  );

  if (!brand) return (
    <div style={{ height: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "'DM Sans', sans-serif", gap: 16 }}>
      <div style={{ fontSize: 32 }}>◈</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#888" }}>No brand data found</div>
      <Link to="/builder" style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg,#e94560,#c62a42)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>Build Your Brand →</Link>
    </div>
  );

  const bc = brand.primaryColor || "#e94560";
  const ac = brand.accentColor || "#f39c12";
  const icps = Array.isArray(brand.icps) ? brand.icps.filter(icp => icp.title || icp.segment) : [];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", color: "#e0e0e0", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.98)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to={boardId ? `/board/${boardId}` : "/builder"} style={{ fontSize: 12, color: "#444", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            ← {brand.brandName || "Brand Board"}
          </Link>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${bc}, ${ac})` }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Content Studio</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <UsageBar used={usage} limit={FREE_LIMIT} premium={premium} />
          {!premium && (
            <button onClick={() => setShowGate(true)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(233,69,96,0.3)", background: "rgba(233,69,96,0.08)", color: "#e94560", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Upgrade Pro
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Content type sidebar */}
        <div style={{ width: 240, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", flexShrink: 0, padding: "16px 12px" }}>
          {CONTENT_TYPES.map(cat => (
            <div key={cat.category} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "0 4px" }}>
                <span style={{ fontSize: 11 }}>{cat.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: cat.color, textTransform: "uppercase", letterSpacing: 1 }}>{cat.category}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {cat.types.map(t => (
                  <TypeCard
                    key={t.id}
                    type={{ ...t, categoryColor: cat.color }}
                    selected={selectedType?.id === t.id}
                    onClick={() => { setSelectedType({ ...t, categoryColor: cat.color }); setOutput(""); setError(null); }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Center: Config */}
        <div style={{ width: 320, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", flexShrink: 0, padding: 20 }}>
          {!selectedType ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.2 }}>◈</div>
              <div style={{ fontSize: 13, color: "#333" }}>Select a content format<br />from the left to begin</div>
            </div>
          ) : (
            <div>
              {/* Type header */}
              <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 10, border: `1px solid rgba(${hexRgb(selectedType.categoryColor)},0.15)`, background: `rgba(${hexRgb(selectedType.categoryColor)},0.06)` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>{selectedType.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{selectedType.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>{selectedType.desc}</div>
              </div>

              {/* Topic */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Topic / Angle</label>
                <textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="What's this piece about? What's the hook or angle? (Leave blank to let AI choose the strongest angle based on your brand.)"
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* ICP picker */}
              {icps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Target Audience</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <button onClick={() => setIcpIndex(null)}
                      style={{ padding: "8px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "left", border: `1px solid ${icpIndex === null ? `rgba(${hexRgb(bc)},0.4)` : "rgba(255,255,255,0.07)"}`, background: icpIndex === null ? `rgba(${hexRgb(bc)},0.1)` : "rgba(255,255,255,0.02)", color: icpIndex === null ? bc : "#666", fontWeight: icpIndex === null ? 700 : 400 }}>
                      General Audience
                    </button>
                    {icps.map((icp, i) => (
                      <button key={i} onClick={() => setIcpIndex(i)}
                        style={{ padding: "8px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "left", border: `1px solid ${icpIndex === i ? `rgba(${hexRgb(bc)},0.4)` : "rgba(255,255,255,0.07)"}`, background: icpIndex === i ? `rgba(${hexRgb(bc)},0.1)` : "rgba(255,255,255,0.02)", color: icpIndex === i ? bc : "#666", fontWeight: icpIndex === i ? 700 : 400 }}>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>ICP {i + 1}: {icp.title || `Segment ${i + 1}`}</div>
                        {icp.segment && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>{icp.segment}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional context */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Additional Context <span style={{ color: "#333", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>optional</span></label>
                <textarea
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  placeholder="Specific product to feature, promotion, deadline, tone override, or any other direction…"
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Generate */}
              <button
                onClick={generate}
                disabled={generating}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                  cursor: generating ? "wait" : "pointer",
                  background: generating ? "rgba(233,69,96,0.25)" : `linear-gradient(135deg, ${bc}, ${bc}cc)`,
                  color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit",
                  boxShadow: generating ? "none" : `0 4px 20px rgba(${hexRgb(bc)},0.35)`,
                  transition: "all 0.2s",
                }}
              >
                {generating ? "Generating…" : `✦ Generate ${selectedType.label}`}
              </button>

              {!canGenerate && !premium && (
                <div style={{ marginTop: 10, fontSize: 11, color: "#e94560", textAlign: "center" }}>
                  {usage}/{FREE_LIMIT} free generations used ·{" "}
                  <button onClick={() => setShowGate(true)} style={{ background: "none", border: "none", color: "#e94560", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, textDecoration: "underline", padding: 0 }}>Upgrade</button>
                </div>
              )}

              {error && <div style={{ marginTop: 12, fontSize: 12, color: "#e94560", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(233,69,96,0.15)", background: "rgba(233,69,96,0.04)" }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {!output && !generating ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
              {!selectedType ? (
                <div style={{ maxWidth: 520, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.08 }}>✦</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#444", marginBottom: 12 }}>Your Brand's Content Engine</div>
                  <div style={{ fontSize: 14, color: "#2a2a2a", lineHeight: 1.7, marginBottom: 32 }}>
                    Every piece of content is pre-loaded with your brand voice, ICP psychology, proof framework, offer architecture, and writing system. Select a content format to begin.
                  </div>
                  {/* Quick start grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, textAlign: "left" }}>
                    {ALL_TYPES.slice(0, 9).map(t => (
                      <button key={t.id} onClick={() => { setSelectedType(t); setOutput(""); setError(null); }}
                        style={{ padding: "12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 5, textAlign: "left", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${hexRgb(t.categoryColor)},0.3)`; e.currentTarget.style.background = `rgba(${hexRgb(t.categoryColor)},0.05)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      >
                        <span style={{ fontSize: 20 }}>{t.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#999" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.15 }}>{selectedType.icon}</div>
                  <div style={{ fontSize: 14, color: "#333" }}>Configure and click Generate →</div>
                </div>
              )}
            </div>
          ) : generating ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: bc, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.8 }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: "#444" }}>Writing your {outputType || selectedType?.label}…</div>
              <style>{`@keyframes pulse { 0%,100%{transform:scale(0.8);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }`}</style>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Output toolbar */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{selectedType?.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>{outputType}</span>
                  <span style={{ fontSize: 10, color: "#333", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
                    {output.split(" ").length.toLocaleString()} words
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <CopyButton text={output} />
                  <button onClick={generate} disabled={generating} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid rgba(${hexRgb(bc)},0.25)`, background: `rgba(${hexRgb(bc)},0.07)`, color: bc, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>
                    Regenerate
                  </button>
                </div>
              </div>
              {/* Output content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
                <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.8, color: "#d0d0d0", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGate && <GateModal onClose={() => { setShowGate(false); setPremium(isPremium()); }} />}
    </div>
  );
}
