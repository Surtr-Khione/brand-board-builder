import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { loadBoard } from "../lib/storage";
import { generateContent } from "../lib/ai";
import {
  buildUserPrompt, buildBrandCtx, buildIcpCtx, DEFAULT_SYSTEM_PROMPT, FORMATS, suggestTopics, FIELD_HINTS,
} from "../lib/promptBuilder";
import {
  getTier, getCredits, spendCredit, CREDIT_PACKS, subscribeAuth,
} from "../lib/auth";
import { startCheckout, handleCheckoutReturn } from "../lib/checkout";
import { AuthForm } from "../components/AuthModal";

// ─── Content types ────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { category: "Written",          icon: "✍",  color: "#3498db", types: [
    { id: "blog-post",         label: "Blog Post",           icon: "📝", desc: "Long-form, publish-ready" },
    { id: "email",             label: "Email",               icon: "✉",  desc: "Single campaign email" },
    { id: "email-sequence",    label: "Email Sequence",      icon: "✉✉", desc: "5-email nurture flow" },
    { id: "sms",               label: "SMS Campaign",        icon: "💬", desc: "3 variants, 160 chars" },
    { id: "headline-pack",     label: "Headline Pack",       icon: "⚡", desc: "10 headlines × 5 frameworks" },
  ]},
  { category: "Social",           icon: "◈",  color: "#e1306c", types: [
    { id: "instagram-carousel",label: "Instagram Carousel",  icon: "📸", desc: "7-slide + full caption" },
    { id: "linkedin-article",  label: "LinkedIn Article",    icon: "💼", desc: "Thought leadership long-form" },
    { id: "x-thread",          label: "X / Twitter Thread",  icon: "✕",  desc: "10-14 tweet thread" },
    { id: "tiktok-script",     label: "TikTok Script",       icon: "🎵", desc: "Hook + content + CTA" },
    { id: "social-post",       label: "Social Post",         icon: "◎",  desc: "3 platform-native variants" },
  ]},
  { category: "Video & Audio",    icon: "▶",  color: "#e74c3c", types: [
    { id: "video-script",      label: "Video Script",        icon: "🎬", desc: "Full script + b-roll notes" },
    { id: "webinar-script",    label: "Webinar Script",      icon: "🎤", desc: "Complete webinar + pitch" },
    { id: "podcast-script",    label: "Podcast Script",      icon: "🎙", desc: "Episode outline + narration" },
    { id: "music-brief",       label: "Music Brief",         icon: "🎼", desc: "Sonic identity brief" },
  ]},
  { category: "PR & Comms",       icon: "📣", color: "#9b59b6", types: [
    { id: "pr-pitch",          label: "Media Pitch",         icon: "📰", desc: "Pitch to press or podcast" },
    { id: "press-release",     label: "Press Release",       icon: "📢", desc: "AP-style release" },
  ]},
  { category: "Visual & Interactive", icon: "◌", color: "#f39c12", types: [
    { id: "image-prompt",      label: "AI Image Prompt",     icon: "🖼",  desc: "3 directions — 2-pass design process" },
    { id: "quiz-concept",      label: "Quiz / Assessment",   icon: "◉",  desc: "Lead-gen quiz with result tiers" },
  ]},
  { category: "Design", icon: "◐", color: "#6c5ce7", types: [
    { id: "design-brief",           label: "Design Brief",          icon: "◫",  desc: "2-pass token system — color, type, layout, signature" },
    { id: "ad-creative",            label: "Ad Creative Brief",     icon: "◐",  desc: "3 complete ad briefs — awareness/consideration/conversion" },
    { id: "brand-style-direction",  label: "Visual Style Direction",icon: "◌",  desc: "Art direction doc for designers — type, color, motion, restraint" },
  ]},
];

const ALL_TYPES = CONTENT_TYPES.flatMap(c => c.types.map(t => ({ ...t, category: c.category, categoryColor: c.color })));

function hexRgb(hex = "") {
  const h = (hex || "").replace("#", "").padEnd(6, "0");
  const [r, g, b] = [0,2,4].map(i => parseInt(h.slice(i, i+2), 16));
  return isNaN(r) ? "100,100,100" : `${r},${g},${b}`;
}

// ─── Register Gate Modal ───────────────────────────────────────────────────────
function RegisterModal({ onClose, reason = "Unlock Content Studio" }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ maxWidth:400,width:"100%",background:"#0e0e14",borderRadius:16,border:"1px solid rgba(255,255,255,0.08)",padding:"32px 32px 28px" }}>
        {done ? (
          <div style={{ textAlign:"center",padding:"20px 0" }}>
            <div style={{ fontSize:32,marginBottom:12 }}>✓</div>
            <div style={{ fontSize:18,fontWeight:800,color:"#2ecc71" }}>You're in! 3 free credits added.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:24,marginBottom:8 }}>◈</div>
            <div style={{ fontSize:18,fontWeight:800,color:"#fff",marginBottom:6 }}>{reason}</div>
            <div style={{ fontSize:13,color:"#555",lineHeight:1.6,marginBottom:20 }}>
              Create a free account to unlock Content Studio and get <strong style={{color:"#2ecc71"}}>3 free credits</strong> to generate content.
            </div>
            <AuthForm accent="#2ecc71" onSuccess={() => { setDone(true); setTimeout(onClose, 1200); }} />
            <button onClick={onClose} style={{ width:"100%",marginTop:10,padding:"10px 0",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#555",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
              Later
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Credits / Upgrade Modal ───────────────────────────────────────────────────
function CreditsModal({ onClose }) {
  const [selected, setSelected] = useState("creator");
  const [busy, setBusy] = useState(false);
  const [payErr, setPayErr] = useState("");
  const pack = CREDIT_PACKS.find(p => p.id === selected);

  const doBuy = async () => {
    setBusy(true); setPayErr("");
    try {
      await startCheckout(pack.id); // redirects to Stripe
    } catch (e) {
      setPayErr(e.message);
      setBusy(false);
    }
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ maxWidth:460,width:"100%",background:"#0e0e14",borderRadius:16,border:"1px solid rgba(255,255,255,0.08)",padding:"32px 32px 28px" }}>
        <div style={{ fontSize:22,fontWeight:800,color:"#fff",marginBottom:6 }}>Buy Credits</div>
        <div style={{ fontSize:13,color:"#444",marginBottom:24 }}>Each credit = one AI content generation. Credits never expire.</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20 }}>
          {CREDIT_PACKS.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              style={{ padding:"14px 12px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",textAlign:"left",border:`1px solid ${selected===p.id?"rgba(233,69,96,0.4)":"rgba(255,255,255,0.07)"}`,background:selected===p.id?"rgba(233,69,96,0.08)":"rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize:13,fontWeight:800,color:selected===p.id?"#e94560":"#ccc" }}>{p.label}</div>
              <div style={{ fontSize:20,fontWeight:800,color:selected===p.id?"#fff":"#888",marginTop:2 }}>{p.credits} <span style={{ fontSize:12,fontWeight:400,color:"#444" }}>credits</span></div>
              <div style={{ fontSize:16,fontWeight:700,color:selected===p.id?"#e94560":"#555",marginTop:2 }}>{p.price}</div>
              <div style={{ fontSize:10,color:"#333",marginTop:2 }}>{p.perCredit} / credit</div>
            </button>
          ))}
        </div>
        {pack && (
          <>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={doBuy} disabled={busy} style={{ flex:1,padding:"13px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#e94560,#c62a42)",color:"#fff",fontSize:14,fontWeight:700,cursor:busy?"wait":"pointer",fontFamily:"inherit" }}>
                {busy ? "Redirecting to Stripe…" : `Buy ${pack.credits} Credits for ${pack.price}`}
              </button>
              <button onClick={onClose} style={{ padding:"13px 16px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#555",fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
                Cancel
              </button>
            </div>
            {payErr && <div style={{ fontSize:12,color:"#e94560",marginTop:10 }}>{payErr}</div>}
            <div style={{ fontSize:10,color:"#333",marginTop:10 }}>Secure checkout via Stripe. Credits are added to your account instantly after payment.</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Prompt Editor Modal ───────────────────────────────────────────────────────
function PromptEditorModal({ brand, contentType, topic, icpIndex, additionalContext, platform, onClose, onApply }) {
  const [tab, setTab] = useState("system");
  const [sysPrompt, setSysPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState("");

  useEffect(() => {
    setUserPrompt(buildUserPrompt(brand, contentType, topic, icpIndex, additionalContext, platform));
  }, [brand, contentType, topic, icpIndex, additionalContext, platform]);

  const current = tab === "system" ? sysPrompt : userPrompt;
  const setter  = tab === "system" ? setSysPrompt : setUserPrompt;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"min(780px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",background:"#0c0c12",borderRadius:16,border:"1px solid rgba(255,255,255,0.09)",overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <span style={{ fontSize:16 }}>⚙</span>
            <span style={{ fontSize:14,fontWeight:800,color:"#fff" }}>Prompt Editor</span>
            <div style={{ fontSize:10,padding:"2px 8px",borderRadius:4,border:"1px solid rgba(155,89,182,0.3)",color:"#9b59b6",fontWeight:700 }}>POWER MODE</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:4 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:2,padding:"10px 20px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0 }}>
          {[["system","System Prompt","Persona & quality instructions"],["user","User Prompt","Full brand context + format brief"]].map(([id,label,sub]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:"8px 16px 10px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",borderBottom:`2px solid ${tab===id?"#9b59b6":"transparent"}`,marginBottom:-1,transition:"all 0.15s" }}>
              <div style={{ fontSize:13,fontWeight:tab===id?700:400,color:tab===id?"#9b59b6":"#444" }}>{label}</div>
              <div style={{ fontSize:10,color:"#333",marginTop:2 }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column",padding:20 }}>
          <textarea
            value={current}
            onChange={e => setter(e.target.value)}
            style={{ flex:1,width:"100%",padding:"14px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.025)",color:"#d0d0d0",fontSize:12.5,fontFamily:"'DM Mono','SF Mono',monospace",lineHeight:1.7,outline:"none",resize:"none",boxSizing:"border-box" }}
          />
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12,flexShrink:0 }}>
            <div style={{ fontSize:11,color:"#333" }}>
              {current.length.toLocaleString()} chars
              {tab === "user" && " · Brand context auto-injected from your board"}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => { setSysPrompt(DEFAULT_SYSTEM_PROMPT); if(tab==="system") return; setUserPrompt(buildUserPrompt(brand, contentType, topic, icpIndex, additionalContext, platform)); }}
                style={{ padding:"8px 14px",borderRadius:7,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
                ⟳ Reset
              </button>
              <button onClick={() => onApply(sysPrompt, userPrompt)}
                style={{ padding:"8px 16px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#9b59b6,#7d3c98)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                ✓ Use Custom Prompt
              </button>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div style={{ padding:"10px 20px",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0 }}>
          <div style={{ fontSize:11,color:"#333",lineHeight:1.6 }}>
            Editing the System Prompt changes the AI's role and quality rules. Editing the User Prompt changes the full content brief including your brand context, ICP, and format instructions. Changes apply to the next generation only — they don't affect your brand data.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Type card ────────────────────────────────────────────────────────────────
function TypeCard({ type, selected, onClick, onQuickGenerate }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:"relative" }}>
      <button onClick={onClick}
        style={{ width:"100%",textAlign:"left",padding:"9px 12px",borderRadius:8,border:`1px solid ${selected?`rgba(${hexRgb(type.categoryColor)},0.4)`:hov?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.04)"}`,background:selected?`rgba(${hexRgb(type.categoryColor)},0.1)`:hov?"rgba(255,255,255,0.03)":"transparent",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",display:"flex",alignItems:"center",gap:9,paddingRight:hov?34:12 }}>
        <span style={{ fontSize:16,flexShrink:0 }}>{type.icon}</span>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:11.5,fontWeight:700,color:selected?type.categoryColor:"#ccc" }}>{type.label}</div>
          <div style={{ fontSize:10,color:"#3a3a3a",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{type.desc}</div>
        </div>
      </button>
      {hov && (
        <button onClick={e => { e.stopPropagation(); onQuickGenerate(type); }}
          title="Quick generate"
          style={{ position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:22,height:22,borderRadius:5,border:`1px solid rgba(${hexRgb(type.categoryColor)},0.3)`,background:`rgba(${hexRgb(type.categoryColor)},0.12)`,color:type.categoryColor,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0 }}
        >▶</button>
      )}
    </div>
  );
}

// ─── Credits badge ─────────────────────────────────────────────────────────────
function CreditsBadge({ credits, tier, onBuy, onRegister }) {
  if (tier === "free") return (
    <button onClick={onRegister} style={{ padding:"5px 12px",borderRadius:20,border:"1px solid rgba(46,204,113,0.3)",background:"rgba(46,204,113,0.08)",color:"#2ecc71",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
      Get 3 free credits →
    </button>
  );
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ fontSize:11,color:credits===0?"#e94560":"#aaa",fontWeight:600 }}>
        <span style={{ color:credits>5?"#2ecc71":credits>1?"#f39c12":"#e94560",fontWeight:800,fontSize:13 }}>{credits}</span> credit{credits!==1?"s":""}
      </div>
      <button onClick={onBuy} style={{ padding:"5px 12px",borderRadius:20,border:"1px solid rgba(233,69,96,0.3)",background:"rgba(233,69,96,0.07)",color:"#e94560",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
        + Buy
      </button>
    </div>
  );
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding:"7px 16px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:copied?"rgba(46,204,113,0.1)":"rgba(255,255,255,0.04)",color:copied?"#2ecc71":"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,transition:"all 0.2s" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContentStudio() {
  const { boardId } = useParams();

  const [brand, setBrand]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [topic, setTopic]               = useState("");
  const [icpIndex, setIcpIndex]         = useState(null);
  const [addCtx, setAddCtx]             = useState("");
  const [generating, setGenerating]     = useState(false);
  const [output, setOutput]             = useState("");
  const [outputType, setOutputType]     = useState("");
  const [error, setError]               = useState(null);

  // Auth / credits
  const [tier, setTierState]         = useState(getTier);
  const [credits, setCreditsState]   = useState(getCredits);

  const refreshAuth = () => { setTierState(getTier()); setCreditsState(getCredits()); };

  // Stay in sync with sign-in/out and server-side credit changes
  useEffect(() => subscribeAuth(refreshAuth), []);
  useEffect(() => { handleCheckoutReturn().then((s) => { if (s) refreshAuth(); }); }, []);

  const [showRegister, setShowRegister]       = useState(false);
  const [showCredits, setShowCredits]         = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // Custom prompt state
  const [customSystemPrompt, setCustomSystemPrompt] = useState(null);
  const [customUserPrompt, setCustomUserPrompt]     = useState(null);
  const [usingCustomPrompt, setUsingCustomPrompt]   = useState(false);

  useEffect(() => {
    async function load() {
      if (boardId) {
        const data = await loadBoard(boardId);
        if (data?.brand_data) setBrand(data.brand_data);
      } else {
        const raw = sessionStorage.getItem("studio_brand");
        if (raw) { try { setBrand(JSON.parse(raw)); } catch {} }
      }
      setLoading(false);
    }
    load();
  }, [boardId]);

  // Topic suggestions — reactive to type + ICP + brand
  const suggestions = useMemo(() => {
    if (!brand || !selectedType) return [];
    return suggestTopics(brand, selectedType.id, icpIndex);
  }, [brand, selectedType, icpIndex]);

  // Field hints for current content type
  const fieldHints = selectedType ? (FIELD_HINTS[selectedType.id] || {}) : {};

  const canGenerate = tier !== "free" && credits > 0;

  const doGenerate = useCallback(async (typeOverride, topicOverride) => {
    const type = typeOverride || selectedType;
    const effectiveTopic = topicOverride !== undefined ? topicOverride : topic;
    if (!type || !brand) return;

    if (tier === "free") { setShowRegister(true); return; }
    if (credits <= 0) { setShowCredits(true); return; }

    setSelectedType(type);
    setGenerating(true);
    setError(null);
    setOutput("");
    setOutputType(type.label);

    try {
      const result = await generateContent({
        brand,
        contentType: type.id,
        topic: effectiveTopic || suggestions[0] || "",
        icpIndex,
        additionalContext: addCtx,
        platform: type.platforms?.[0] || null,
        systemPromptOverride: usingCustomPrompt ? customSystemPrompt : undefined,
        userPromptOverride:   usingCustomPrompt ? customUserPrompt   : undefined,
      });
      setOutput(result.content);
      spendCredit();
      refreshAuth();
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    }
    setGenerating(false);
  }, [selectedType, brand, topic, icpIndex, addCtx, suggestions, tier, credits, usingCustomPrompt, customSystemPrompt, customUserPrompt]);

  const handleApplyPrompt = (sys, usr) => {
    setCustomSystemPrompt(sys);
    setCustomUserPrompt(usr);
    setUsingCustomPrompt(true);
    setShowPromptEditor(false);
  };

  if (loading) return <div style={{ height:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>;

  if (!brand) return (
    <div style={{ height:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:"'DM Sans',sans-serif",color:"#555" }}>
      <div style={{ fontSize:32,opacity:0.2 }}>◈</div>
      <div style={{ fontSize:16,fontWeight:600,color:"#666" }}>No brand data found</div>
      <Link to="/builder" style={{ padding:"10px 20px",borderRadius:8,background:"linear-gradient(135deg,#e94560,#c62a42)",color:"#fff",textDecoration:"none",fontSize:14,fontWeight:700 }}>Build Your Brand →</Link>
    </div>
  );

  const bc   = brand.primaryColor || "#e94560";
  const ac   = brand.accentColor  || "#f39c12";
  const icps = Array.isArray(brand.icps) ? brand.icps.filter(i => i.title || i.segment) : [];

  return (
    <div style={{ height:"100vh",display:"flex",flexDirection:"column",background:"#0a0a0f",fontFamily:"'DM Sans',sans-serif",color:"#e0e0e0",overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,10,15,0.98)",backdropFilter:"blur(12px)",flexShrink:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <Link to={boardId?`/board/${boardId}`:"/builder"} style={{ fontSize:11,color:"#333",textDecoration:"none",fontWeight:600 }}>← {brand.brandName||"Board"}</Link>
          <div style={{ width:1,height:14,background:"rgba(255,255,255,0.07)" }} />
          <div style={{ display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:`linear-gradient(135deg,${bc},${ac})` }} />
            <span style={{ fontSize:13,fontWeight:800,color:"#fff",letterSpacing:-0.3 }}>Content Studio</span>
          </div>
          {usingCustomPrompt && (
            <div style={{ fontSize:10,padding:"2px 8px",borderRadius:4,border:"1px solid rgba(155,89,182,0.4)",color:"#9b59b6",fontWeight:700 }}>
              ⚙ Custom prompt active
            </div>
          )}
        </div>
        <CreditsBadge credits={credits} tier={tier}
          onBuy={() => { setShowCredits(true); }}
          onRegister={() => setShowRegister(true)}
        />
      </header>

      {/* Body */}
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>

        {/* LEFT: Type list */}
        <div style={{ width:220,borderRight:"1px solid rgba(255,255,255,0.05)",overflowY:"auto",flexShrink:0,padding:"14px 10px" }}>
          {CONTENT_TYPES.map(cat => (
            <div key={cat.category} style={{ marginBottom:18 }}>
              <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:7,padding:"0 4px" }}>
                <span style={{ fontSize:10 }}>{cat.icon}</span>
                <span style={{ fontSize:9.5,fontWeight:800,color:cat.color,textTransform:"uppercase",letterSpacing:1 }}>{cat.category}</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                {cat.types.map(t => (
                  <TypeCard key={t.id}
                    type={{ ...t, categoryColor: cat.color }}
                    selected={selectedType?.id === t.id}
                    onClick={() => { setSelectedType({...t,categoryColor:cat.color}); setOutput(""); setError(null); setTopic(""); setUsingCustomPrompt(false); }}
                    onQuickGenerate={(type) => doGenerate({...type,categoryColor:cat.color}, suggestions[0] || "")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CENTER: Config */}
        <div style={{ width:300,borderRight:"1px solid rgba(255,255,255,0.05)",overflowY:"auto",flexShrink:0 }}>
          {!selectedType ? (
            <div style={{ padding:"48px 24px",textAlign:"center" }}>
              <div style={{ fontSize:32,opacity:0.08,marginBottom:14 }}>✦</div>
              <div style={{ fontSize:13,color:"#2a2a2a",lineHeight:1.7 }}>Pick a content format from the left<br />or click ▶ on any card to quick-generate</div>
              {tier === "free" && (
                <div style={{ marginTop:28,padding:"16px",borderRadius:10,border:"1px solid rgba(46,204,113,0.12)",background:"rgba(46,204,113,0.04)" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#2ecc71",marginBottom:6 }}>Register free → 3 credits</div>
                  <div style={{ fontSize:11,color:"#333",marginBottom:10 }}>Each credit generates one piece of content across all 17 formats.</div>
                  <button onClick={() => setShowRegister(true)} style={{ width:"100%",padding:"9px 0",borderRadius:7,border:"none",background:"linear-gradient(135deg,#2ecc71,#27ae60)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                    Get 3 Free Credits
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding:18 }}>
              {/* Type header */}
              <div style={{ marginBottom:16,padding:"12px 14px",borderRadius:9,border:`1px solid rgba(${hexRgb(selectedType.categoryColor)},0.15)`,background:`rgba(${hexRgb(selectedType.categoryColor)},0.05)` }}>
                <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:3 }}>
                  <span style={{ fontSize:20 }}>{selectedType.icon}</span>
                  <span style={{ fontSize:14,fontWeight:800,color:"#fff" }}>{selectedType.label}</span>
                </div>
                <div style={{ fontSize:11,color:"#444" }}>{selectedType.desc}</div>
              </div>

              {/* Topic suggestions */}
              {suggestions.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:0.5,marginBottom:7 }}>Smart Angles ↓ click to use</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => setTopic(s)}
                        style={{ padding:"4px 10px",borderRadius:20,border:`1px solid ${topic===s?`rgba(${hexRgb(selectedType.categoryColor)},0.5)`:"rgba(255,255,255,0.07)"}`,background:topic===s?`rgba(${hexRgb(selectedType.categoryColor)},0.1)`:"rgba(255,255,255,0.02)",color:topic===s?selectedType.categoryColor:"#555",fontSize:10.5,fontWeight:topic===s?700:400,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s" }}>
                        {s.length > 52 ? s.slice(0, 52) + "…" : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic field */}
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6 }}>Topic / Angle</label>
                <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2}
                  placeholder={fieldHints.topic || "What's the hook or angle? Leave blank to let AI pick the strongest angle from your brand data."}
                  style={{ width:"100%",padding:"9px 11px",borderRadius:7,border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.025)",color:"#e0e0e0",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5 }} />
                {!topic && <div style={{ fontSize:10,color:"#2a2a2a",marginTop:4 }}>Empty = AI picks from: {suggestions[0] ? `"${suggestions[0].slice(0,42)}…"` : "your brand data"}</div>}
              </div>

              {/* ICP */}
              {icps.length > 0 && (
                <div style={{ marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6 }}>Target Audience</label>
                  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                    {[{title:"General Audience",segment:""},...icps].map((icp,i) => (
                      <button key={i} onClick={() => setIcpIndex(i===0?null:i-1)}
                        style={{ padding:"7px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:11,textAlign:"left",border:`1px solid ${(i===0?icpIndex===null:icpIndex===i-1)?`rgba(${hexRgb(bc)},0.35)`:"rgba(255,255,255,0.06)"}`,background:(i===0?icpIndex===null:icpIndex===i-1)?`rgba(${hexRgb(bc)},0.08)`:"rgba(255,255,255,0.02)",color:(i===0?icpIndex===null:icpIndex===i-1)?bc:"#555",fontWeight:(i===0?icpIndex===null:icpIndex===i-1)?700:400 }}>
                        {i===0?"General":"ICP "+i+": "+icp.title}
                        {icp.segment&&<span style={{ fontSize:9,opacity:0.5,marginLeft:4 }}>· {icp.segment.slice(0,28)}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional context */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block",fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6 }}>
                  Additional Context <span style={{ color:"#2a2a2a",fontWeight:400,textTransform:"none" }}>optional</span>
                </label>
                <textarea value={addCtx} onChange={e => setAddCtx(e.target.value)} rows={2}
                  placeholder={fieldHints.context || "Product to feature · Offer or deadline · Tone override · Any specific direction…"}
                  style={{ width:"100%",padding:"9px 11px",borderRadius:7,border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.025)",color:"#e0e0e0",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5 }} />
              </div>

              {/* Generate row */}
              <div style={{ display:"flex",gap:7,alignItems:"stretch" }}>
                <button onClick={() => doGenerate()} disabled={generating}
                  style={{ flex:1,padding:"12px 0",borderRadius:9,border:"none",cursor:generating?"wait":"pointer",background:generating?`rgba(${hexRgb(bc)},0.25)`:`linear-gradient(135deg,${bc},${bc}cc)`,color:"#fff",fontSize:13,fontWeight:800,fontFamily:"inherit",boxShadow:generating?"none":`0 4px 18px rgba(${hexRgb(bc)},0.3)`,transition:"all 0.2s" }}>
                  {generating ? "Writing…" : `✦ Generate`}
                </button>
                <button onClick={() => setShowPromptEditor(true)} title="Edit prompt"
                  style={{ width:40,padding:"12px 0",borderRadius:9,border:"1px solid rgba(155,89,182,0.25)",background:usingCustomPrompt?"rgba(155,89,182,0.12)":"rgba(255,255,255,0.03)",color:usingCustomPrompt?"#9b59b6":"#444",cursor:"pointer",fontSize:14,fontFamily:"inherit",transition:"all 0.2s" }}>
                  ⚙
                </button>
              </div>

              {usingCustomPrompt && (
                <button onClick={() => setUsingCustomPrompt(false)}
                  style={{ width:"100%",marginTop:7,padding:"6px 0",borderRadius:7,border:"1px solid rgba(155,89,182,0.2)",background:"transparent",color:"#9b59b6",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                  ✕ Clear custom prompt
                </button>
              )}

              {tier === "free" && (
                <div style={{ marginTop:10,padding:"10px 12px",borderRadius:8,border:"1px solid rgba(46,204,113,0.12)",background:"rgba(46,204,113,0.04)",textAlign:"center" }}>
                  <div style={{ fontSize:11,color:"#2ecc71",fontWeight:700,marginBottom:4 }}>Register free to generate</div>
                  <button onClick={() => setShowRegister(true)} style={{ fontSize:11,color:"#2ecc71",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",fontWeight:600 }}>Get 3 free credits →</button>
                </div>
              )}
              {tier !== "free" && credits === 0 && (
                <div style={{ marginTop:10,fontSize:11,color:"#e94560",textAlign:"center" }}>
                  No credits left · <button onClick={() => setShowCredits(true)} style={{ background:"none",border:"none",color:"#e94560",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,textDecoration:"underline",padding:0 }}>Buy credits</button>
                </div>
              )}
              {error && <div style={{ marginTop:10,fontSize:11,color:"#e94560",padding:"9px 11px",borderRadius:7,border:"1px solid rgba(233,69,96,0.15)",background:"rgba(233,69,96,0.04)" }}>{error}</div>}
            </div>
          )}
        </div>

        {/* RIGHT: Output */}
        <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
          {!output && !generating ? (
            <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40 }}>
              {!selectedType ? (
                <div style={{ maxWidth:540,textAlign:"center" }}>
                  <div style={{ fontSize:44,marginBottom:18,opacity:0.06 }}>✦</div>
                  <div style={{ fontSize:20,fontWeight:800,color:"#2a2a2a",marginBottom:10 }}>17 Content Formats. One Brand Voice.</div>
                  <div style={{ fontSize:13,color:"#1e1e1e",lineHeight:1.7,marginBottom:32 }}>
                    Every piece is pre-loaded with your brand voice, ICP psychology, offer architecture, proof framework, and writing system. Select a format or click ▶ for instant generation.
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
                    {ALL_TYPES.slice(0,8).map(t => (
                      <button key={t.id} onClick={() => { setSelectedType(t); setOutput(""); }}
                        style={{ padding:"12px 8px",borderRadius:9,cursor:"pointer",fontFamily:"inherit",border:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.015)",display:"flex",flexDirection:"column",gap:5,alignItems:"center",transition:"all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=`rgba(${hexRgb(t.categoryColor)},0.3)`; e.currentTarget.style.background=`rgba(${hexRgb(t.categoryColor)},0.05)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.05)"; e.currentTarget.style.background="rgba(255,255,255,0.015)"; }}>
                        <span style={{ fontSize:18 }}>{t.icon}</span>
                        <span style={{ fontSize:10,fontWeight:700,color:"#555",textAlign:"center" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:"center",opacity:0.3 }}>
                  <div style={{ fontSize:36,marginBottom:10 }}>{selectedType.icon}</div>
                  <div style={{ fontSize:13 }}>Configure and click Generate</div>
                </div>
              )}
            </div>
          ) : generating ? (
            <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16 }}>
              <div style={{ display:"flex",gap:6 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:bc,opacity:0.8,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
              <div style={{ fontSize:12,color:"#333" }}>Writing your {outputType}…</div>
              <style>{`@keyframes pulse{0%,100%{transform:scale(0.8);opacity:0.4}50%{transform:scale(1.2);opacity:1}}`}</style>
            </div>
          ) : (
            <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
              <div style={{ padding:"11px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontSize:13 }}>{selectedType?.icon}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:"#ccc" }}>{outputType}</span>
                  <span style={{ fontSize:10,color:"#2a2a2a",padding:"2px 7px",borderRadius:4,border:"1px solid rgba(255,255,255,0.05)" }}>{output.split(" ").filter(Boolean).length.toLocaleString()} words</span>
                </div>
                <div style={{ display:"flex",gap:7 }}>
                  <CopyButton text={output} />
                  <button onClick={() => doGenerate()} disabled={generating}
                    style={{ padding:"7px 14px",borderRadius:7,border:`1px solid rgba(${hexRgb(bc)},0.25)`,background:`rgba(${hexRgb(bc)},0.07)`,color:bc,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600 }}>
                    Regenerate
                  </button>
                </div>
              </div>
              <div style={{ flex:1,overflowY:"auto",padding:"24px 32px" }}>
                <pre style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13.5,lineHeight:1.85,color:"#d0d0d0",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0 }}>
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRegister && <RegisterModal onClose={() => { setShowRegister(false); refreshAuth(); }} />}
      {showCredits  && <CreditsModal  onClose={() => { setShowCredits(false);  refreshAuth(); }} />}
      {showPromptEditor && (
        <PromptEditorModal
          brand={brand} contentType={selectedType?.id} topic={topic}
          icpIndex={icpIndex} additionalContext={addCtx} platform={selectedType?.platforms?.[0]}
          onClose={() => setShowPromptEditor(false)}
          onApply={handleApplyPrompt}
        />
      )}
    </div>
  );
}
