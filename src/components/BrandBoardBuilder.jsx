import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { saveBoard, loadBoard, generateBoardId } from "../lib/storage";
import { sendLeadToGHL } from "../lib/ghl";
import { track } from "../lib/track";
import { suggestField, isAIAvailable } from "../lib/ai";
import { publishBrand } from "../lib/brands";
import { getTier, isUnlocked, register as _register, upgradePro as _upgradePro, getReferralUrl, claimEarnAction, hasEarnedAction, importContacts, getCredits as _getCredits, CREDIT_PACKS } from "../lib/auth";
import EmailGate from "./EmailGate";
import WebScanner from "./WebScanner";
import BrandIntelligence from "./BrandIntelligence";
import ImageMoodboard from "./ImageMoodboard";
import { ARCHETYPES } from "../lib/archetypes";
import { OrbitMark } from "./SiteNav";
import CertificateShare from "./CertificateShare";
import { computeGravityScore, gravityScoreColor } from "../lib/gravityScore";
import { computeImpactScore, impactScoreColor, GEO_LEVELS } from "../lib/impactScore";

// ═══════════════════════════════════════════════
// BRAND CONTEXT
// ═══════════════════════════════════════════════
const BrandCtx = createContext(null);
const useBrand = () => useContext(BrandCtx);

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
// One accent across all phases — the Builder speaks the same mono+blue
// titanium language as the rest of the site; phase identity comes from the
// group labels, not a rainbow.
const PHASES = [
  { name: "Discover", color: "#0071E3", sections: ["overview"] },
  { name: "Strategy", color: "#0071E3", sections: ["identity", "archetype", "storybrand", "pillars", "voice", "language", "manifesto", "audience", "icps", "journey", "proof", "market", "offer", "stories", "calendar", "socialvoice", "vocabulary", "competitive"] },
  { name: "Expression", color: "#0071E3", sections: ["colors", "typography", "photography", "sensory", "logo", "motion", "media"] },
  { name: "Govern", color: "#0071E3", sections: ["accessibility", "guidelines"] },
  { name: "Deploy", color: "#0071E3", sections: ["score", "integrations", "export"] },
];

// The sections that close Gravity signals — "Core" mode shows only these,
// so a new founder faces seven decisions instead of a 31-section wall.
const CORE_SECTION_IDS = new Set(["overview", "identity", "archetype", "pillars", "voice", "colors", "typography", "score", "export"]);

// tier: free | registered | pro
const SECTIONS = [
  { id: "overview",     label: "Overview",          icon: "◈",  phase: 0, tier: "free" },
  { id: "identity",     label: "Identity & Story",  icon: "◎",  phase: 1, tier: "free" },
  { id: "archetype",    label: "Archetype",          icon: "⬡",  phase: 1, tier: "registered", gateHint: "Discover your brand personality archetype and secondary archetype." },
  { id: "storybrand",   label: "StoryBrand Script",  icon: "📖", phase: 1, tier: "registered", gateHint: "Build your 7-part StoryBrand framework — hero, villain, plan, CTA." },
  { id: "pillars",      label: "Content Pillars",    icon: "◆",  phase: 1, tier: "registered", gateHint: "Define the content pillars that structure all communications." },
  { id: "voice",        label: "Voice & Messaging",  icon: "❝",  phase: 1, tier: "registered", gateHint: "Nail your tone, messaging dos/don'ts, and brand voice rules." },
  { id: "language",     label: "Writing System",     icon: "¶",  phase: 1, tier: "pro",        gateHint: "Advanced writing: register, sentence style, grammar, jargon policy, reading level." },
  { id: "manifesto",    label: "Brand Manifesto",    icon: "⚑",  phase: 1, tier: "pro",        gateHint: "5 brand commandments, red lines, controversy stance, owned cultural moment." },
  { id: "audience",     label: "Audience",           icon: "👥", phase: 1, tier: "registered", gateHint: "Define target market, psychographics, demographics, and customer motivations." },
  { id: "icps",         label: "Ideal Customers",    icon: "◈",  phase: 1, tier: "pro",        gateHint: "Build 3 detailed ICPs with pain points, goals, and acquisition channels." },
  { id: "journey",      label: "Customer Journey",   icon: "→",  phase: 1, tier: "pro",        gateHint: "Map emotion at every stage: Awareness → Consideration → Purchase → Advocacy." },
  { id: "proof",        label: "Proof Framework",    icon: "◉",  phase: 1, tier: "pro",        gateHint: "Rank your evidence hierarchy, key stats, and social proof criteria." },
  { id: "market",       label: "Market Position",    icon: "◇",  phase: 1, tier: "pro",        gateHint: "Price tier, category ownership, scope, niche depth, anti-positioning." },
  { id: "offer",        label: "Offer Architecture", icon: "◆",  phase: 1, tier: "pro",        gateHint: "Full offer ladder: lead magnet → intro → core → premium + upsell sequence." },
  { id: "stories",      label: "Brand Stories",      icon: "◎",  phase: 1, tier: "pro",        gateHint: "5 canonical brand stories the AI draws from for every content generation." },
  { id: "calendar",     label: "Content Calendar",   icon: "◈",  phase: 1, tier: "pro",        gateHint: "Content mix, platform cadences, topic rotation, seasonal campaign anchors." },
  { id: "socialvoice",  label: "Platform Voice",     icon: "📡", phase: 1, tier: "pro",        gateHint: "Customize voice per platform: Instagram, LinkedIn, TikTok, YouTube, X." },
  { id: "vocabulary",   label: "Brand Vocabulary",   icon: "📝", phase: 1, tier: "registered", gateHint: "Owned words, phrases to avoid, and brand-specific terminology." },
  { id: "competitive",  label: "Positioning",        icon: "◧",  phase: 1, tier: "registered", gateHint: "Competitive landscape map and unique positioning statement." },
  { id: "colors",       label: "Colors & Modes",     icon: "◐",  phase: 2, tier: "free" },
  { id: "typography",   label: "Typography",         icon: "Aa", phase: 2, tier: "free" },
  { id: "photography",  label: "Photography",        icon: "📷", phase: 2, tier: "registered", gateHint: "Photo style, mood direction, and visual storytelling rules." },
  { id: "sensory",      label: "Brand Sensory",      icon: "◌",  phase: 2, tier: "pro",        gateHint: "Brand physics: speed, weight, temperature, texture, density sliders + preview." },
  { id: "logo",         label: "Logo & Icons",       icon: "◫",  phase: 2, tier: "registered", gateHint: "Logo usage, clear space, icon library, and misuse guidelines." },
  { id: "motion",       label: "Motion",             icon: "▸▸", phase: 2, tier: "pro",        gateHint: "Brand motion principles, animation style, and video feel." },
  { id: "media",        label: "Media & Sound",      icon: "▶",  phase: 2, tier: "pro",        gateHint: "Sonic identity, media standards, and audio branding guidelines." },
  { id: "accessibility",label: "Accessibility",      icon: "♿", phase: 3, tier: "registered", gateHint: "Color contrast, font accessibility, and inclusive design standards." },
  { id: "guidelines",   label: "Custom Fields",      icon: "☰",  phase: 3, tier: "registered", gateHint: "Add custom brand guideline fields specific to your brand." },
  { id: "score",        label: "Brand Score",        icon: "★",  phase: 4, tier: "free" },
  { id: "integrations", label: "Integrations",       icon: "🔗", phase: 4, tier: "registered", gateHint: "Plug in your own social, traffic, ad, and AI-visibility numbers to get an Impact Score." },
  { id: "export",       label: "Export",             icon: "↗",  phase: 4, tier: "free" },
];

const DEFAULT_BRAND = {
  brandName: "", tagline: "", industry: "", founded: "", website: "",
  mission: "", vision: "", coreValues: ["", "", ""],
  whyDifferent: "", brandPromise: "", elevator: "",
  archetype: "", secondaryArchetype: "", enemy: "", victim: "",
  heroStatement: "", brandPersonality: ["", "", "", ""],
  storyGuide: "", storyProblem: "", storyPlan: "", storyCTA: "", storySuccess: "", storyFailure: "",
  contentPillars: [{ name: "", description: "", topics: ["", ""], audience: "" }],
  toneAttributes: ["", "", ""], messagingDos: ["", ""], messagingDonts: ["", ""],
  primaryFont: "", secondaryFont: "", bodyFont: "",
  h1Size: "48px", h2Size: "36px", h3Size: "24px", bodySize: "16px",
  // Neutral placeholder palette — deliberately reads as "not chosen yet";
  // gravityScore ignores this exact triplet so an untouched color system
  // doesn't score as a decision.
  primaryColor: "#1D1D1F", secondaryColor: "#F5F5F7", accentColor: "#0071E3",
  lightBg: "#ffffff", lightSurface: "#f5f5f5", lightText: "#111111", lightSecText: "#666666", lightBorder: "#e0e0e0",
  darkBg: "#000000", darkSurface: "#13131a", darkText: "#e0e0e0", darkSecText: "#999999", darkBorder: "#2a2a35",
  lightModeEnabled: true, darkModeEnabled: true,
  photoStyle: "", photoMood: "", photoSubjects: "",
  faviconUrl: "", logoUrl: "", ogImage: "", iconSources: null,
  logoDescription: "", logoUsageRules: "", iconStyle: "",
  motionStyle: "", animationSpeed: "moderate",
  audioMood: "", soundLogo: "", musicStyle: "",
  accessNotes: "", wcagLevel: "AA",
  customFields: [],
  socialPersonality: "", emailSignoff: "",
  integrations: {},
  // Brand Intelligence sources
  sources: {},
  // Auto-detected URLs from website scan (social + podcast)
  discoveredUrls: {},
  // Audience
  audienceAge: "", audienceRole: "", audiencePains: "", audienceGoals: "",
  // Ideal Customer Profiles
  icps: [
    { id: "1", title: "", segment: "", demographics: "", psychographics: "", painPoints: ["", ""], goals: ["", ""], buyingTriggers: ["", ""], channels: "", messageAngle: "", ltv: "", acquisition: "" },
    { id: "2", title: "", segment: "", demographics: "", psychographics: "", painPoints: ["", ""], goals: ["", ""], buyingTriggers: ["", ""], channels: "", messageAngle: "", ltv: "", acquisition: "" },
    { id: "3", title: "", segment: "", demographics: "", psychographics: "", painPoints: ["", ""], goals: ["", ""], buyingTriggers: ["", ""], channels: "", messageAngle: "", ltv: "", acquisition: "" },
  ],
  // Platform-specific voice
  voiceInstagram: "", voiceLinkedIn: "", voiceYouTube: "",
  voiceTikTok: "", voiceFacebook: "", voiceTwitter: "",
  // Brand Vocabulary
  wordsAlways: ["", ""], wordsNever: ["", ""],
  // Competitive Positioning
  competitivePositioning: "", competitors: ["", ""], differentiators: ["", "", ""],
  // Content strategy / moodboard
  moodboardKeywords: ["", "", ""],
  // Language & Writing System
  languageRegister: "", sentenceStyle: "", humorRegister: "", personPreference: "",
  readingLevel: "", numberStyle: "", capitalizationStyle: "", jargonPolicy: "",
  grammarRules: [""],
  // Brand Manifesto
  brandCommandments: ["", "", "", "", ""],
  brandNeverDoes: [""],
  controversyStance: "", crisisVoice: "", brandOwnedMoment: "",
  // Customer Journey Emotional Map
  journeyAwareness: "", journeyConsideration: "", journeyPurchase: "",
  journeyOnboarding: "", journeyRetention: "", journeyAdvocacy: "",
  // Proof & Evidence Architecture
  proofHierarchy: [],
  keyProofStats: [""],
  socialProofCriteria: "", claimStandards: "",
  // Market Positioning
  priceTier: "", marketScope: "", nicheDepth: "",
  antiPositioning: "", categoryOwnership: "",
  // Brand Sensory Physics
  brandSpeed: 50, brandWeight: 50, brandTemperature: 50, brandTexture: 50, brandDensity: 50,
  brandSensoryNotes: "",
  // Offer Architecture
  offerLeadMagnet: "", offerLeadMagnetFormat: "",
  offerIntroOffer: "", offerIntroPrice: "",
  offerCoreOffer: "", offerCorePrice: "",
  offerPremiumOffer: "", offerPremiumPrice: "",
  offerUpsells: [""],
  offerCTA: "", offerValueProp: "",
  // Brand Story Library
  brandStories: [
    { id: "1", type: "origin",         label: "Origin Story",            title: "", story: "" },
    { id: "2", type: "first-win",      label: "First Big Win",           title: "", story: "" },
    { id: "3", type: "failure",        label: "Failure & Pivot",         title: "", story: "" },
    { id: "4", type: "transformation", label: "Customer Transformation", title: "", story: "" },
    { id: "5", type: "proof",          label: "Proof Moment",            title: "", story: "" },
  ],
  // Content Calendar
  contentMixEducational: 40, contentMixPromotional: 20, contentMixEntertainment: 40,
  contentRotation: "", seasonalMoments: [""],
  contentCadenceInstagram: "", contentCadenceLinkedIn: "",
  contentCadenceEmail: "", contentCadenceTikTok: "",
};

// ═══════════════════════════════════════════════
// AI SUGGEST — inline suggestion widget
// ═══════════════════════════════════════════════
function AISuggestButton({ fieldKey, onChange }) {
  const ctx = useBrand();
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [err, setErr] = useState(null);

  if (!ctx?.aiEnabled || !fieldKey) return null;

  const suggest = async () => {
    setSuggesting(true);
    setErr(null);
    setSuggestion(null);
    try {
      const s = await suggestField(fieldKey, ctx.brand);
      setSuggestion(s);
    } catch {
      setErr("Try again");
    }
    setSuggesting(false);
  };

  return (
    <>
      <button
        onClick={suggest}
        disabled={suggesting}
        style={{
          padding: "2px 7px", borderRadius: "4px",
          border: "1px solid rgba(0,113,227,0.35)",
          background: "rgba(0,113,227,0.07)", color: "#0071E3",
          cursor: suggesting ? "wait" : "pointer",
          fontSize: "10px", fontWeight: 700,
          fontFamily: "'Inter', -apple-system, sans-serif",
          opacity: suggesting ? 0.5 : 1,
        }}
      >
        {suggesting ? "···" : "✦ AI"}
      </button>
      {(suggestion || err) && (
        <div style={{
          position: "relative", marginTop: "6px", padding: "10px 12px",
          borderRadius: "8px", border: "1px solid rgba(0,113,227,0.2)",
          background: "rgba(0,113,227,0.04)",
        }}>
          {suggestion && (
            <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.55, marginBottom: "8px" }}>
              {suggestion}
            </div>
          )}
          {err && <div style={{ fontSize: "12px", color: "#FF453A", marginBottom: "8px" }}>{err}</div>}
          <div style={{ display: "flex", gap: "6px" }}>
            {suggestion && (
              <button
                onClick={() => { onChange(suggestion); setSuggestion(null); }}
                style={{ padding: "4px 12px", borderRadius: "6px", border: "none", background: "#0071E3", color: "#fff", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}
              >
                Use this
              </button>
            )}
            <button
              onClick={() => { setSuggestion(null); setErr(null); }}
              style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#666", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════
const inputBase = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)", color: "#e0e0e0",
  fontSize: "14px", fontFamily: "'Inter', -apple-system, sans-serif",
  outline: "none", boxSizing: "border-box",
};

const TextInput = ({ label, value, onChange, hint, multiline, aiField }) => (
  <div style={{ marginBottom: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      {aiField && <AISuggestButton fieldKey={aiField} onChange={onChange} />}
    </div>
    {multiline ? (
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={hint} rows={3}
        style={{ ...inputBase, resize: "vertical" }} />
    ) : (
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={hint}
        style={inputBase} />
    )}
  </div>
);

const ArrayInput = ({ label, values, onChange, hint }) => {
  const update = (i, v) => { const a = [...values]; a[i] = v; onChange(a); };
  const add = () => onChange([...values, ""]);
  const remove = (i) => onChange(values.filter((_, x) => x !== i));
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
          <input type="text" value={v} onChange={(e) => update(i, e.target.value)} placeholder={hint}
            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "13px", fontFamily: "'Inter', -apple-system, sans-serif", outline: "none" }} />
          {values.length > 1 && (
            <button onClick={() => remove(i)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#666", cursor: "pointer", fontSize: "12px" }}>✕</button>
          )}
        </div>
      ))}
      <button onClick={add} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(0,113,227,0.2)", background: "rgba(0,113,227,0.06)", color: "#0071E3", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>+ Add</button>
    </div>
  );
};

const ColorPicker = ({ label, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
    <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)}
      style={{ width: "36px", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", background: "transparent" }} />
    <div>
      <div style={{ fontSize: "12px", color: "#aaa" }}>{label}</div>
      <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>{value}</div>
    </div>
  </div>
);

// Translucent inline section feedback — appears on hover, posts to Supabase feedback table
function SectionFeedback({ section, title }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const ctx = useBrand();
  const bc = ctx?.brand?.primaryColor || "#0071E3";

  const submit = async () => {
    if (!text.trim()) return;
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (url && key) {
        await fetch(`${url}/rest/v1/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": key, "Authorization": `Bearer ${key}` },
          body: JSON.stringify({ section, page: `builder:${section}`, feedback: text, context: { brandName: ctx?.brand?.brandName, sectionTitle: title } }),
        });
      }
    } catch {}
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setText(""); }, 1800);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={`Feedback on ${title}`}
        style={{
          background: "transparent", border: "none", cursor: "pointer", padding: "3px 5px",
          opacity: open ? 0.7 : 0.18, transition: "opacity 0.2s",
          color: bc, fontSize: 12, lineHeight: 1,
          borderRadius: 4,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.6"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.opacity = "0.18"; }}
      >↑</button>
      {open && (
        <div style={{
          position: "absolute", left: 0, top: "calc(100% + 4px)", zIndex: 200,
          width: 240, background: "#111", border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: 10, padding: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {sent ? (
            <div style={{ fontSize: 12, color: "#32D74B", textAlign: "center", padding: "8px 0" }}>✓ Thanks for the feedback</div>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Improve · {title}
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's missing or off? How could this section be better?"
                autoFocus
                style={{
                  width: "100%", minHeight: 72, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 7, color: "#e0e0e0", fontSize: 12, padding: "8px 10px", resize: "vertical",
                  fontFamily: "'Inter', -apple-system, sans-serif", outline: "none", boxSizing: "border-box",
                }}
              />
              <button
                onClick={submit}
                disabled={!text.trim()}
                style={{
                  marginTop: 8, width: "100%", padding: "7px 0", borderRadius: 6,
                  border: "none", cursor: text.trim() ? "pointer" : "default",
                  background: text.trim() ? `rgba(${hexToRgbStr(bc)},0.2)` : "rgba(255,255,255,0.04)",
                  color: text.trim() ? bc : "#444",
                  fontSize: 11, fontWeight: 700, fontFamily: "'Inter', -apple-system, sans-serif",
                }}
              >Send Feedback</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function hexToRgbStr(hex) {
  const h = (hex || "#888").replace("#", "").padEnd(6, "0");
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

const SectionHeader = ({ title, subtitle, phase }) => {
  const p = PHASES[phase];
  const ctx = useBrand();
  const bc = ctx?.brand?.primaryColor || "#0071E3";
  const sectionId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div style={{ marginBottom: "24px", borderLeft: `2px solid rgba(${hexToRgbStr(bc)},0.12)`, paddingLeft: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: "10px" }}>
        <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "1px" }}>{p.name}</span>
        </div>
        <SectionFeedback section={sectionId} title={title} />
      </div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Inter', -apple-system, sans-serif" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>{subtitle}</p>}
    </div>
  );
};

// ═══════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════
function OverviewSection({ brand, update, onApplyScanned }) {
  return (
    <div>
      <SectionHeader title="Brand Overview" subtitle="Connect your sources — website, socials, PDFs — and AI builds your entire brand profile." phase={0} />
      <BrandIntelligence onApply={onApplyScanned} discoveredUrls={brand.discoveredUrls || {}} />
      <div style={{ fontSize: 11, color: "#333", marginBottom: 12, textAlign: "center" }}>— or scan just your website —</div>
      <WebScanner onApply={onApplyScanned} />
      <TextInput label="Brand Name" value={brand.brandName} onChange={(v) => update("brandName", v)} hint="Your brand or company name" />
      <TextInput label="Tagline" value={brand.tagline} onChange={(v) => update("tagline", v)} hint="A memorable phrase that captures your brand" aiField="tagline" />
      <TextInput label="Industry" value={brand.industry} onChange={(v) => update("industry", v)} hint="e.g. SaaS, E-commerce, Consulting" />
      <TextInput label="Website" value={brand.website} onChange={(v) => update("website", v)} hint="https://yourbrand.com" />
      <TextInput label="Elevator Pitch" value={brand.elevator} onChange={(v) => update("elevator", v)} hint="30-second description of what you do and why it matters" multiline aiField="elevator" />
    </div>
  );
}

function IdentitySection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Identity & Story" subtitle="Your brand's purpose, values, and differentiators." phase={1} />
      <TextInput label="Mission" value={brand.mission} onChange={(v) => update("mission", v)} hint="Why does your brand exist? What change do you drive?" multiline aiField="mission" />
      <TextInput label="Vision" value={brand.vision} onChange={(v) => update("vision", v)} hint="Where is your brand headed? The future you're building." multiline aiField="vision" />
      <ArrayInput label="Core Values" values={brand.coreValues} onChange={(v) => update("coreValues", v)} hint="e.g. Integrity, Innovation, Empathy" />
      <TextInput label="Why We're Different" value={brand.whyDifferent} onChange={(v) => update("whyDifferent", v)} hint="What sets you apart from every competitor?" multiline aiField="whyDifferent" />
      <TextInput label="Brand Promise" value={brand.brandPromise} onChange={(v) => update("brandPromise", v)} hint="The one commitment you always deliver on" multiline aiField="brandPromise" />
    </div>
  );
}

function ArchetypeSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Archetype & Positioning" subtitle="The personality framework behind your brand." phase={1} />
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Primary Archetype</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px", marginBottom: "20px" }}>
        {ARCHETYPES.map((a) => (
          <button key={a.name} onClick={() => update("archetype", a.name)} style={{
            padding: "12px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
            border: brand.archetype === a.name ? `2px solid ${a.color}` : "1px solid rgba(255,255,255,0.06)",
            background: brand.archetype === a.name ? `${a.color}15` : "rgba(255,255,255,0.02)",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: brand.archetype === a.name ? a.color : "#ccc" }}>{a.name}</div>
            <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>{a.desc}</div>
          </button>
        ))}
      </div>
      <TextInput label="Brand Enemy" value={brand.enemy} onChange={(v) => update("enemy", v)} hint="What does your brand stand against?" multiline aiField="enemy" />
      <TextInput label="Ideal Customer (The Victim)" value={brand.victim} onChange={(v) => update("victim", v)} hint="Who is suffering from the problem your brand solves?" multiline aiField="victim" />
      <TextInput label="Hero Statement" value={brand.heroStatement} onChange={(v) => update("heroStatement", v)} hint="How does your customer become the hero through your brand?" multiline aiField="heroStatement" />
      <ArrayInput label="Personality Traits" values={brand.brandPersonality} onChange={(v) => update("brandPersonality", v)} hint="e.g. Bold, Witty, Authoritative" />
    </div>
  );
}

function StoryBrandSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="StoryBrand Script" subtitle="Your brand narrative following the StoryBrand framework." phase={1} />
      <TextInput label="The Guide (Your Brand)" value={brand.storyGuide} onChange={(v) => update("storyGuide", v)} hint="How does your brand show empathy and authority?" multiline aiField="storyGuide" />
      <TextInput label="The Problem" value={brand.storyProblem} onChange={(v) => update("storyProblem", v)} hint="External, internal, and philosophical problems your customer faces" multiline aiField="storyProblem" />
      <TextInput label="The Plan" value={brand.storyPlan} onChange={(v) => update("storyPlan", v)} hint="The simple steps you offer (3-step process)" multiline aiField="storyPlan" />
      <TextInput label="Call to Action" value={brand.storyCTA} onChange={(v) => update("storyCTA", v)} hint="The direct and transitional CTAs" aiField="storyCTA" />
      <TextInput label="Success (What life looks like after)" value={brand.storySuccess} onChange={(v) => update("storySuccess", v)} hint="Paint the picture of transformation" multiline aiField="storySuccess" />
      <TextInput label="Failure (What happens if they don't act)" value={brand.storyFailure} onChange={(v) => update("storyFailure", v)} hint="The stakes — what's at risk" multiline aiField="storyFailure" />
    </div>
  );
}

function PillarsSection({ brand, update }) {
  const updatePillar = (i, k, v) => { const p = [...brand.contentPillars]; p[i] = { ...p[i], [k]: v }; update("contentPillars", p); };
  const addPillar = () => update("contentPillars", [...brand.contentPillars, { name: "", description: "", topics: ["", ""], audience: "" }]);
  return (
    <div>
      <SectionHeader title="Content Pillars" subtitle="The recurring themes that anchor your content strategy." phase={1} />
      {brand.contentPillars.map((p, i) => (
        <div key={i} style={{ padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#FF9F0A" }}>Pillar {i + 1}</span>
            {brand.contentPillars.length > 1 && (
              <button onClick={() => update("contentPillars", brand.contentPillars.filter((_, x) => x !== i))}
                style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: "14px" }}>✕</button>
            )}
          </div>
          <TextInput label="Pillar Name" value={p.name} onChange={(v) => updatePillar(i, "name", v)} hint="e.g. Leadership, Innovation" />
          <TextInput label="Description" value={p.description} onChange={(v) => updatePillar(i, "description", v)} hint="What this pillar covers" multiline />
        </div>
      ))}
      <button onClick={addPillar} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(0,113,227,0.2)", background: "rgba(0,113,227,0.06)", color: "#0071E3", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>+ Add Pillar</button>
    </div>
  );
}

function VoiceSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Voice & Messaging" subtitle="How your brand sounds across every channel." phase={1} />
      <ArrayInput label="Tone Attributes" values={brand.toneAttributes} onChange={(v) => update("toneAttributes", v)} hint="e.g. Confident, Approachable, Direct" />
      <ArrayInput label="Messaging Do's" values={brand.messagingDos} onChange={(v) => update("messagingDos", v)} hint="e.g. Use active voice, Lead with benefits" />
      <ArrayInput label="Messaging Don'ts" values={brand.messagingDonts} onChange={(v) => update("messagingDonts", v)} hint="e.g. Never use jargon, Avoid passive language" />
      <TextInput label="Social Media Personality" value={brand.socialPersonality} onChange={(v) => update("socialPersonality", v)} hint="How does the brand behave on social?" multiline aiField="socialPersonality" />
      <TextInput label="Email Sign-off Style" value={brand.emailSignoff} onChange={(v) => update("emailSignoff", v)} hint="e.g. Warm regards, Keep building, Cheers" aiField="emailSignoff" />
    </div>
  );
}

function ColorsSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Colors & Modes" subtitle="Your color system with light and dark mode definitions." phase={2} />
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Brand Colors</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <ColorPicker label="Primary" value={brand.primaryColor} onChange={(v) => update("primaryColor", v)} />
          <ColorPicker label="Secondary" value={brand.secondaryColor} onChange={(v) => update("secondaryColor", v)} />
          <ColorPicker label="Accent" value={brand.accentColor} onChange={(v) => update("accentColor", v)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>☀ Light Mode</span>
            <button onClick={() => update("lightModeEnabled", !brand.lightModeEnabled)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", background: brand.lightModeEnabled ? "#32D74B" : "#555", color: "#fff", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>
              {brand.lightModeEnabled ? "ON" : "OFF"}
            </button>
          </div>
          {brand.lightModeEnabled && <>
            <ColorPicker label="Background" value={brand.lightBg} onChange={(v) => update("lightBg", v)} />
            <ColorPicker label="Surface" value={brand.lightSurface} onChange={(v) => update("lightSurface", v)} />
            <ColorPicker label="Text" value={brand.lightText} onChange={(v) => update("lightText", v)} />
            <ColorPicker label="Secondary Text" value={brand.lightSecText} onChange={(v) => update("lightSecText", v)} />
            <ColorPicker label="Border" value={brand.lightBorder} onChange={(v) => update("lightBorder", v)} />
          </>}
        </div>
        <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>🌙 Dark Mode</span>
            <button onClick={() => update("darkModeEnabled", !brand.darkModeEnabled)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", background: brand.darkModeEnabled ? "#32D74B" : "#555", color: "#fff", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>
              {brand.darkModeEnabled ? "ON" : "OFF"}
            </button>
          </div>
          {brand.darkModeEnabled && <>
            <ColorPicker label="Background" value={brand.darkBg} onChange={(v) => update("darkBg", v)} />
            <ColorPicker label="Surface" value={brand.darkSurface} onChange={(v) => update("darkSurface", v)} />
            <ColorPicker label="Text" value={brand.darkText} onChange={(v) => update("darkText", v)} />
            <ColorPicker label="Secondary Text" value={brand.darkSecText} onChange={(v) => update("darkSecText", v)} />
            <ColorPicker label="Border" value={brand.darkBorder} onChange={(v) => update("darkBorder", v)} />
          </>}
        </div>
      </div>
    </div>
  );
}

function TypographySection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Typography" subtitle="Font selections and sizing hierarchy." phase={2} />
      <TextInput label="Primary / Heading Font" value={brand.primaryFont} onChange={(v) => update("primaryFont", v)} hint="e.g. Playfair Display, Montserrat" />
      <TextInput label="Secondary Font" value={brand.secondaryFont} onChange={(v) => update("secondaryFont", v)} hint="e.g. DM Sans, Inter" />
      <TextInput label="Body Font" value={brand.bodyFont} onChange={(v) => update("bodyFont", v)} hint="e.g. Inter, Source Sans Pro" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <TextInput label="H1 Size" value={brand.h1Size} onChange={(v) => update("h1Size", v)} hint="48px" />
        <TextInput label="H2 Size" value={brand.h2Size} onChange={(v) => update("h2Size", v)} hint="36px" />
        <TextInput label="H3 Size" value={brand.h3Size} onChange={(v) => update("h3Size", v)} hint="24px" />
        <TextInput label="Body Size" value={brand.bodySize} onChange={(v) => update("bodySize", v)} hint="16px" />
      </div>
    </div>
  );
}

function PhotographySection({ brand, update, onApplyScanned }) {
  return (
    <div>
      <SectionHeader title="Photography Style" subtitle="Drop in brand images and Claude reads your visual DNA — palette, mood, aesthetic, and composition style." phase={2} />
      <ImageMoodboard onApply={onApplyScanned} />
      <TextInput label="Photo Style" value={brand.photoStyle} onChange={(v) => update("photoStyle", v)} hint="e.g. Candid, editorial, minimalist, vibrant" multiline aiField="photoStyle" />
      <TextInput label="Mood / Feeling" value={brand.photoMood} onChange={(v) => update("photoMood", v)} hint="e.g. Warm, aspirational, gritty, clean" aiField="photoMood" />
      <TextInput label="Preferred Subjects" value={brand.photoSubjects} onChange={(v) => update("photoSubjects", v)} hint="e.g. People, workspaces, nature, products" aiField="photoSubjects" />
    </div>
  );
}

function BrandIconPreview({ brand }) {
  const sources = [
    { label: "Logo", url: brand.logoUrl, bg: "#fff" },
    { label: "App Icon", url: brand.faviconUrl, bg: "#111" },
    { label: "Favicon", url: brand.iconSources?.googleFavicon, bg: "#111" },
    { label: "OG Image", url: brand.ogImage, bg: "#111", wide: true },
  ].filter(s => s.url);

  if (!sources.length) {
    // Live preview using website domain if available
    const domain = brand.website?.replace(/^https?:\/\//, "").split("/")[0];
    if (!domain) return null;
    return (
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={`https://logo.clearbit.com/${domain}`} alt="Logo" style={{ width: 46, height: 46, objectFit: "contain" }} onError={e => e.currentTarget.style.display = "none"} />
          </div>
          <div style={{ fontSize: 8, color: "#333", marginTop: 4, letterSpacing: 1 }}>CLEARBIT</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#111", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=256`} alt="Favicon" style={{ width: 46, height: 46, objectFit: "contain" }} onError={e => e.currentTarget.style.display = "none"} />
          </div>
          <div style={{ fontSize: 8, color: "#333", marginTop: 4, letterSpacing: 1 }}>FAVICON</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      {sources.map(s => (
        <div key={s.label} style={{ textAlign: "center" }}>
          <div style={{ width: s.wide ? 96 : 64, height: 64, background: s.bg, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={s.url} alt={s.label} style={{ width: s.wide ? "100%" : 46, height: s.wide ? "100%" : 46, objectFit: s.wide ? "cover" : "contain" }} onError={e => e.currentTarget.style.display = "none"} />
          </div>
          <div style={{ fontSize: 8, color: "#333", marginTop: 4, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}

function LogoSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Logo & Icons" subtitle="Discovered brand icons and logo guidelines." phase={2} />
      <BrandIconPreview brand={brand} />
      <TextInput label="Logo URL" value={brand.logoUrl} onChange={(v) => update("logoUrl", v)} hint="Paste a logo image URL or let website scan discover it" />
      <TextInput label="Logo Description" value={brand.logoDescription} onChange={(v) => update("logoDescription", v)} hint="Describe your logo and its meaning" multiline aiField="logoDescription" />
      <TextInput label="Logo Usage Rules" value={brand.logoUsageRules} onChange={(v) => update("logoUsageRules", v)} hint="Minimum sizes, clear space, backgrounds, etc." multiline aiField="logoUsageRules" />
      <TextInput label="Icon Style" value={brand.iconStyle} onChange={(v) => update("iconStyle", v)} hint="e.g. Outlined, filled, duotone, rounded" aiField="iconStyle" />
    </div>
  );
}

function MotionSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Motion & Animation" subtitle="How your brand moves." phase={2} />
      <TextInput label="Motion Style" value={brand.motionStyle} onChange={(v) => update("motionStyle", v)} hint="e.g. Smooth easing, bouncy, minimal, cinematic" multiline aiField="motionStyle" />
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Animation Speed</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["subtle", "moderate", "energetic"].map((s) => (
          <button key={s} onClick={() => update("animationSpeed", s)} style={{
            padding: "8px 18px", borderRadius: "8px", cursor: "pointer", textTransform: "capitalize",
            border: brand.animationSpeed === s ? "1px solid #0071E3" : "1px solid rgba(255,255,255,0.06)",
            background: brand.animationSpeed === s ? "rgba(0,113,227,0.1)" : "transparent",
            color: brand.animationSpeed === s ? "#0071E3" : "#999", fontSize: "13px",
          }}>{s}</button>
        ))}
      </div>
    </div>
  );
}

function MediaSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Media & Sound" subtitle="Audio identity and media direction." phase={2} />
      <TextInput label="Audio Mood" value={brand.audioMood} onChange={(v) => update("audioMood", v)} hint="e.g. Uplifting, ambient, high-energy" aiField="audioMood" />
      <TextInput label="Sound Logo / Audio Signature" value={brand.soundLogo} onChange={(v) => update("soundLogo", v)} hint="Describe your sonic identity" multiline aiField="soundLogo" />
      <TextInput label="Music Style" value={brand.musicStyle} onChange={(v) => update("musicStyle", v)} hint="e.g. Lo-fi, orchestral, electronic, acoustic" />
    </div>
  );
}

function AccessibilitySection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Accessibility" subtitle="Inclusive design standards." phase={3} />
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>WCAG Target</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["A", "AA", "AAA"].map((l) => (
          <button key={l} onClick={() => update("wcagLevel", l)} style={{
            padding: "8px 18px", borderRadius: "8px", cursor: "pointer",
            border: brand.wcagLevel === l ? "1px solid #0071E3" : "1px solid rgba(255,255,255,0.06)",
            background: brand.wcagLevel === l ? "rgba(46,134,222,0.1)" : "transparent",
            color: brand.wcagLevel === l ? "#0071E3" : "#999", fontSize: "13px", fontWeight: 600,
          }}>{l}</button>
        ))}
      </div>
      <TextInput label="Accessibility Notes" value={brand.accessNotes} onChange={(v) => update("accessNotes", v)} hint="Any specific accessibility requirements or notes" multiline />
    </div>
  );
}

function CustomFieldsSection({ brand, update }) {
  const addField = () => update("customFields", [...brand.customFields, { label: "", value: "" }]);
  const updateField = (i, k, v) => { const f = [...brand.customFields]; f[i] = { ...f[i], [k]: v }; update("customFields", f); };
  return (
    <div>
      <SectionHeader title="Custom Fields" subtitle="Add any additional brand attributes." phase={3} />
      {brand.customFields.map((f, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" value={f.label} onChange={(e) => updateField(i, "label", e.target.value)} placeholder="Field name" style={{ width: "35%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "13px", fontFamily: "'Inter', -apple-system, sans-serif", outline: "none" }} />
          <input type="text" value={f.value} onChange={(e) => updateField(i, "value", e.target.value)} placeholder="Value" style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "13px", fontFamily: "'Inter', -apple-system, sans-serif", outline: "none" }} />
          <button onClick={() => update("customFields", brand.customFields.filter((_, x) => x !== i))} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#666", cursor: "pointer" }}>✕</button>
        </div>
      ))}
      <button onClick={addField} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(0,113,227,0.2)", background: "rgba(0,113,227,0.06)", color: "#0071E3", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>+ Add Field</button>
    </div>
  );
}

function AudienceSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Audience" subtitle="Who you're speaking to — their profile, pains, and goals." phase={1} />
      <TextInput label="Age / Demographics" value={brand.audienceAge} onChange={v => update("audienceAge", v)} hint="e.g. 25–45, urban professionals, parents of young children" aiField="audienceAge" />
      <TextInput label="Role / Job Title" value={brand.audienceRole} onChange={v => update("audienceRole", v)} hint="e.g. Marketing directors at mid-market SaaS companies" aiField="audienceRole" />
      <TextInput label="Pains & Frustrations" value={brand.audiencePains} onChange={v => update("audiencePains", v)} hint="What keeps them up at night? What problems are they trying to solve?" multiline aiField="audiencePains" />
      <TextInput label="Goals & Aspirations" value={brand.audienceGoals} onChange={v => update("audienceGoals", v)} hint="What are they trying to achieve? What does success look like?" multiline aiField="audienceGoals" />
    </div>
  );
}

const PLATFORMS_VOICE = [
  { key: "voiceLinkedIn",  label: "LinkedIn",  icon: "💼", hint: "Professional authority, thought-leadership, case studies" },
  { key: "voiceInstagram", label: "Instagram", icon: "📸", hint: "Visual storytelling, behind-the-scenes, aspirational captions" },
  { key: "voiceYouTube",   label: "YouTube",   icon: "▶",  hint: "Educational depth, channel personality, video series style" },
  { key: "voiceTikTok",    label: "TikTok",    icon: "🎵", hint: "Trend-aware, entertaining, fast-paced hooks" },
  { key: "voiceFacebook",  label: "Facebook",  icon: "👥", hint: "Community-focused, conversational, shareable" },
  { key: "voiceTwitter",   label: "Twitter/X", icon: "✕",  hint: "Punchy, opinionated, real-time engagement" },
];

function SocialVoiceSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Platform Voice" subtitle="How the brand sounds on each social channel — tone shifts by context." phase={1} />
      {PLATFORMS_VOICE.map(p => (
        <TextInput key={p.key} label={`${p.icon} ${p.label}`} value={brand[p.key]} onChange={v => update(p.key, v)} hint={p.hint} multiline />
      ))}
    </div>
  );
}

function VocabularySection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Brand Vocabulary" subtitle="The specific words and phrases that define your voice — and ones you never use." phase={1} />
      <ArrayInput label="Words We Always Use" values={brand.wordsAlways} onChange={v => update("wordsAlways", v)} hint="e.g. Transform, authentic, bold" />
      <ArrayInput label="Words We Never Use" values={brand.wordsNever} onChange={v => update("wordsNever", v)} hint="e.g. Cheap, synergy, leverage" />
      <ArrayInput label="Moodboard Keywords" values={brand.moodboardKeywords} onChange={v => update("moodboardKeywords", v)} hint="e.g. Cinematic, earthy, futuristic, editorial" />
    </div>
  );
}

function CompetitiveSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Positioning" subtitle="How you stand apart from the competition." phase={1} />
      <TextInput label="Competitive Positioning" value={brand.competitivePositioning} onChange={v => update("competitivePositioning", v)} hint='e.g. "We are the only X for Y that does Z"' multiline aiField="competitivePositioning" />
      <ArrayInput label="Key Competitors" values={brand.competitors} onChange={v => update("competitors", v)} hint="e.g. HubSpot, Salesforce" />
      <ArrayInput label="Differentiators" values={brand.differentiators} onChange={v => update("differentiators", v)} hint="What makes you the only choice?" />
    </div>
  );
}

const ICP_LABELS = [
  { num: "01", colorKey: "primaryColor" },
  { num: "02", colorKey: "secondaryColor" },
  { num: "03", colorKey: "accentColor" },
];

function ICPCard({ icp, index, brand, onChange }) {
  const bc = brand?.primaryColor || "#0071E3";
  const cardColor = [brand.primaryColor, brand.accentColor, brand.secondaryColor][index] || bc;
  const num = ICP_LABELS[index].num;

  const update = (key, val) => onChange({ ...icp, [key]: val });
  const updateArr = (key, i, val) => {
    const arr = [...(icp[key] || [])];
    arr[i] = val;
    onChange({ ...icp, [key]: arr });
  };
  const addItem = (key) => onChange({ ...icp, [key]: [...(icp[key] || []), ""] });

  const fieldStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)", color: "#e0e0e0",
    fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif", outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 9, fontWeight: 800, color: "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5, display: "block" };

  return (
    <div style={{
      background: "#090909", borderRadius: 14,
      border: `1px solid rgba(255,255,255,0.05)`,
      borderTop: `3px solid ${cardColor}`,
      overflow: "hidden", padding: "24px",
    }}>
      {/* ICP number header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 11, fontWeight: 800, color: cardColor, letterSpacing: 3, textTransform: "uppercase" }}>ICP {num}</div>
        <input
          value={icp.title || ""}
          onChange={e => update("title", e.target.value)}
          placeholder={`e.g. "The Roster Asset", "The Peak Executive"`}
          style={{ ...fieldStyle, flex: 1, fontSize: 15, fontWeight: 700, color: "#fff", background: "transparent", border: "none", padding: "0", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 0 }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Segment</label>
          <input value={icp.segment || ""} onChange={e => update("segment", e.target.value)} placeholder="Professional athletes, executives…" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Demographics</label>
          <input value={icp.demographics || ""} onChange={e => update("demographics", e.target.value)} placeholder="Age, income, location…" style={fieldStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Psychographics — how they see themselves</label>
        <textarea value={icp.psychographics || ""} onChange={e => update("psychographics", e.target.value)} placeholder="The mental model that governs their purchasing decisions…" style={{ ...fieldStyle, minHeight: 64, resize: "vertical" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Pain Points</label>
          {(icp.painPoints || [""]).map((p, i) => (
            <input key={i} value={p} onChange={e => updateArr("painPoints", i, e.target.value)} placeholder={`Pain ${i + 1}`} style={{ ...fieldStyle, marginBottom: 4 }} />
          ))}
          <button onClick={() => addItem("painPoints")} style={{ fontSize: 10, color: "#333", background: "transparent", border: "none", cursor: "pointer", padding: "2px 0" }}>+ Add</button>
        </div>
        <div>
          <label style={labelStyle}>Goals</label>
          {(icp.goals || [""]).map((g, i) => (
            <input key={i} value={g} onChange={e => updateArr("goals", i, e.target.value)} placeholder={`Goal ${i + 1}`} style={{ ...fieldStyle, marginBottom: 4 }} />
          ))}
          <button onClick={() => addItem("goals")} style={{ fontSize: 10, color: "#333", background: "transparent", border: "none", cursor: "pointer", padding: "2px 0" }}>+ Add</button>
        </div>
        <div>
          <label style={labelStyle}>Buying Triggers</label>
          {(icp.buyingTriggers || [""]).map((t, i) => (
            <input key={i} value={t} onChange={e => updateArr("buyingTriggers", i, e.target.value)} placeholder={`Trigger ${i + 1}`} style={{ ...fieldStyle, marginBottom: 4 }} />
          ))}
          <button onClick={() => addItem("buyingTriggers")} style={{ fontSize: 10, color: "#333", background: "transparent", border: "none", cursor: "pointer", padding: "2px 0" }}>+ Add</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Message Angle</label>
          <textarea value={icp.messageAngle || ""} onChange={e => update("messageAngle", e.target.value)} placeholder="The single most persuasive angle for this segment…" style={{ ...fieldStyle, minHeight: 52, resize: "vertical" }} />
        </div>
        <div>
          <label style={labelStyle}>Preferred Channels</label>
          <input value={icp.channels || ""} onChange={e => update("channels", e.target.value)} placeholder="Instagram, LinkedIn, agent referrals…" style={fieldStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Estimated LTV</label>
          <input value={icp.ltv || ""} onChange={e => update("ltv", e.target.value)} placeholder="$24K–$120K/year" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Acquisition Strategy</label>
          <input value={icp.acquisition || ""} onChange={e => update("acquisition", e.target.value)} placeholder="Highest-leverage channel + tactic…" style={fieldStyle} />
        </div>
      </div>
    </div>
  );
}

function ICPSection({ brand, update }) {
  const icps = brand.icps || DEFAULT_BRAND.icps;
  const updateICP = (i, updated) => {
    const next = [...icps];
    next[i] = updated;
    update("icps", next);
  };

  return (
    <div>
      <SectionHeader
        title="Ideal Customer Profiles"
        subtitle="Your top 3 customer segments — psychographic profiles, buying triggers, and acquisition strategy for each."
        phase={1}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {icps.map((icp, i) => (
          <ICPCard key={icp.id || i} icp={icp} index={i} brand={brand} onChange={updated => updateICP(i, updated)} />
        ))}
      </div>
    </div>
  );
}

// ─── LANGUAGE & WRITING SYSTEM ──────────────────────────────────────────────
function LanguageSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const ac = brand.accentColor || "#FF9F0A";
  const registers = [
    { value: "formal", label: "Formal", desc: "Legal, government, financial" },
    { value: "professional", label: "Professional", desc: "Corporate, B2B, expert-tier" },
    { value: "conversational", label: "Conversational", desc: "Direct, human, plain-spoken" },
    { value: "casual", label: "Casual", desc: "Friendly, warm, approachable" },
    { value: "street", label: "Culture-Native", desc: "Vernacular, community-first" },
  ];
  const humors = ["None", "Dry/Wit", "Playful", "Self-deprecating", "Absurdist", "Sardonic"];
  const persons = [
    { value: "first-singular", label: "I / Me", desc: "Founder-led" },
    { value: "first-plural", label: "We / Us", desc: "Team brand" },
    { value: "second", label: "You", desc: "Customer-first" },
    { value: "third", label: "The Brand", desc: "Institutional" },
  ];
  const chipBtn = (active, color) => ({
    padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
    border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
    background: active ? `rgba(${hexToRgbStr(color)},0.1)` : "rgba(255,255,255,0.02)",
    color: active ? color : "#777",
  });
  return (
    <div>
      <SectionHeader title="Writing System" subtitle="The precise rules governing how your brand uses language — register, rhythm, grammar, humor." phase={1} />
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Voice Register</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {registers.map(r => (
            <button key={r.value} onClick={() => update("languageRegister", r.value)} style={chipBtn(brand.languageRegister === r.value, bc)}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.55, marginTop: 2 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Narrative Person</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {persons.map(p => (
            <button key={p.value} onClick={() => update("personPreference", p.value)} style={{ ...chipBtn(brand.personPreference === p.value, bc), flex: "1 1 120px" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{p.label}</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.55, marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Sentence Style</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { v: "punchy", l: "Punchy", d: "Short. Direct. Hit hard." },
            { v: "elaborate", l: "Elaborate", d: "Rich, layered, nuanced" },
            { v: "varied", l: "Varied", d: "Context-dependent mix" },
          ].map(s => (
            <button key={s.v} onClick={() => update("sentenceStyle", s.v)} style={{ ...chipBtn(brand.sentenceStyle === s.v, bc), flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.l}</div>
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{s.d}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Humor Register</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {humors.map(h => (
            <button key={h} onClick={() => update("humorRegister", h)}
              style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                border: `1px solid ${brand.humorRegister === h ? ac : "rgba(255,255,255,0.08)"}`,
                background: brand.humorRegister === h ? `rgba(${hexToRgbStr(ac)},0.1)` : "rgba(255,255,255,0.02)",
                color: brand.humorRegister === h ? ac : "#666" }}>
              {h}
            </button>
          ))}
        </div>
      </div>
      <TextInput label="Reading Level Target" value={brand.readingLevel} onChange={(v) => update("readingLevel", v)} hint="e.g. 8th grade · Business-executive · Graduate · 5th grade (accessibility-first)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
        <TextInput label="Number Style" value={brand.numberStyle} onChange={(v) => update("numberStyle", v)} hint="e.g. Always digits · Spell out under ten" />
        <TextInput label="Capitalization Style" value={brand.capitalizationStyle} onChange={(v) => update("capitalizationStyle", v)} hint="e.g. Sentence case headlines · Title Case CTAs" />
      </div>
      <ArrayInput label="Grammar & Style Rules" values={brand.grammarRules || [""]} onChange={(v) => update("grammarRules", v)} hint="e.g. Oxford comma always · Em dashes over parentheses · No exclamation points" />
      <TextInput label="Jargon Policy" value={brand.jargonPolicy} onChange={(v) => update("jargonPolicy", v)} hint="e.g. Zero jargon — plain language always · Technical terms OK for expert audience · Define all acronyms" multiline aiField="jargonPolicy" />
    </div>
  );
}

// ─── BRAND MANIFESTO ─────────────────────────────────────────────────────────
function ManifestoSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const commandmentPlaceholders = [
    "We always put the customer transformation before our own story",
    "We never speak down to our audience or assume ignorance",
    "Every touchpoint must feel intentional — nothing is accidental",
    "We say what we mean — no corporate doublespeak, no hedging",
    "We own our mistakes faster and louder than our wins",
  ];
  const updateCommandment = (i, v) => {
    const arr = [...(brand.brandCommandments || ["","","","",""])];
    arr[i] = v;
    update("brandCommandments", arr);
  };
  return (
    <div>
      <SectionHeader title="Brand Manifesto" subtitle="The unbreakable laws that govern every brand decision — what this brand always does, never does, and stands for." phase={1} />
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>The 5 Brand Commandments</label>
        {(brand.brandCommandments || ["","","","",""]).map((cmd, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: `rgba(${hexToRgbStr(bc)},0.1)`, border: `1px solid rgba(${hexToRgbStr(bc)},0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: bc, marginTop: 5,
            }}>{i + 1}</div>
            <input type="text" value={cmd} onChange={(e) => updateCommandment(i, e.target.value)}
              placeholder={commandmentPlaceholders[i]}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid rgba(${hexToRgbStr(bc)},0.12)`, background: "rgba(255,255,255,0.025)", color: "#e0e0e0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          </div>
        ))}
      </div>
      <ArrayInput label="Red Lines — What This Brand Never Does" values={brand.brandNeverDoes || [""]} onChange={(v) => update("brandNeverDoes", v)} hint="e.g. Makes promises we can't keep · Punches down at any group · Copies competitor campaigns" />
      <TextInput label="Controversy & Culture Stance" value={brand.controversyStance} onChange={(v) => update("controversyStance", v)} hint="Which cultural or political topics does the brand engage with — and which are off-limits? Why?" multiline aiField="controversyStance" />
      <TextInput label="Crisis Response Voice" value={brand.crisisVoice} onChange={(v) => update("crisisVoice", v)} hint="How does this brand communicate during a PR crisis or public failure? Speed, tone, medium, who speaks?" multiline />
      <TextInput label="Signature Brand Ritual / Owned Moment" value={brand.brandOwnedMoment} onChange={(v) => update("brandOwnedMoment", v)} hint="What recurring moment does this brand own? e.g. Annual summit · Limited product drops · Year-in-review data release · The unboxing experience" />
    </div>
  );
}

// ─── CUSTOMER JOURNEY EMOTIONAL MAP ──────────────────────────────────────────
function JourneySection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const stages = [
    { key: "journeyAwareness",     label: "Awareness",     icon: "◎", q: "How should they feel when they first encounter this brand?" },
    { key: "journeyConsideration", label: "Consideration", icon: "◉", q: "What should they feel as they research and evaluate options?" },
    { key: "journeyPurchase",      label: "Purchase",      icon: "◆", q: "What emotion should the purchase moment itself create?" },
    { key: "journeyOnboarding",    label: "Onboarding",    icon: "◈", q: "What should their very first experience with the product feel like?" },
    { key: "journeyRetention",     label: "Retention",     icon: "◇", q: "What keeps them coming back? What do they feel in the long-term relationship?" },
    { key: "journeyAdvocacy",      label: "Advocacy",      icon: "◭", q: "What transformation makes them compelled to tell others?" },
  ];
  return (
    <div>
      <SectionHeader title="Customer Journey" subtitle="Map the emotional experience at every stage — from stranger to advocate." phase={1} />
      <div style={{ display: "flex", gap: 4, marginBottom: 24, alignItems: "center", overflowX: "auto", paddingBottom: 6 }}>
        {stages.map((s, i) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <div style={{
              padding: "8px 12px", borderRadius: 8, textAlign: "center",
              background: brand[s.key] ? `rgba(${hexToRgbStr(bc)},0.1)` : "rgba(255,255,255,0.03)",
              border: `1px solid ${brand[s.key] ? `rgba(${hexToRgbStr(bc)},0.3)` : "rgba(255,255,255,0.06)"}`,
            }}>
              <div style={{ fontSize: 15 }}>{s.icon}</div>
              <div style={{ fontSize: 9, color: brand[s.key] ? bc : "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 3, whiteSpace: "nowrap" }}>{s.label}</div>
              <div style={{ fontSize: 9, color: brand[s.key] ? "#32D74B" : "#2a2a2a", marginTop: 2, fontWeight: 700 }}>{brand[s.key] ? "✓" : "·"}</div>
            </div>
            {i < stages.length - 1 && <div style={{ color: "#2a2a2a", fontSize: 14, flexShrink: 0 }}>→</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {stages.map(s => (
          <div key={s.key} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid rgba(${hexToRgbStr(bc)},0.1)`, background: "rgba(255,255,255,0.018)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: bc, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 11, color: "#444", marginBottom: 8, lineHeight: 1.5 }}>{s.q}</div>
            <textarea value={brand[s.key] || ""} onChange={(e) => update(s.key, e.target.value)}
              placeholder="Describe the desired emotional experience…"
              rows={3}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", color: "#e0e0e0", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROOF & EVIDENCE FRAMEWORK ──────────────────────────────────────────────
function ProofSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const PROOF_TYPES = [
    { key: "data-research",       label: "Original Data / Research",   icon: "📊" },
    { key: "case-study",          label: "Case Studies",               icon: "📋" },
    { key: "testimonials",        label: "Customer Testimonials",      icon: "💬" },
    { key: "expert-endorsement",  label: "Expert Endorsement",         icon: "🎓" },
    { key: "press-awards",        label: "Press & Awards",             icon: "🏆" },
    { key: "live-demo",           label: "Live Demo / Free Trial",     icon: "▶" },
    { key: "before-after",        label: "Before / After Results",     icon: "↔" },
    { key: "certification",       label: "Certification / Third-Party Audit", icon: "✓" },
  ];
  const hierarchy = brand.proofHierarchy || [];
  const remaining = PROOF_TYPES.filter(t => !hierarchy.includes(t.key));
  return (
    <div>
      <SectionHeader title="Proof Framework" subtitle="How this brand substantiates every claim — ranked by credibility, stocked with the right evidence." phase={1} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 }}>Proof Hierarchy (rank #1 = most credible)</label>
        </div>
        {hierarchy.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {hierarchy.map((key, i) => {
              const type = PROOF_TYPES.find(t => t.key === key);
              if (!type) return null;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid rgba(${hexToRgbStr(bc)},0.25)`, background: `rgba(${hexToRgbStr(bc)},0.08)`, color: bc, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ fontSize: 9, opacity: 0.5, minWidth: 14 }}>#{i + 1}</span>
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                  <button onClick={() => update("proofHierarchy", hierarchy.filter(h => h !== key))} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.45, fontSize: 13, padding: 0, marginLeft: 4, lineHeight: 1 }}>×</button>
                </div>
              );
            })}
          </div>
        )}
        {remaining.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "#333", marginBottom: 7 }}>Click to add to your hierarchy:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {remaining.map(type => (
                <button key={type.key} onClick={() => update("proofHierarchy", [...hierarchy, type.key])}
                  style={{ padding: "5px 11px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <ArrayInput label="Key Proof Statistics (always have ready)" values={brand.keyProofStats || [""]} onChange={(v) => update("keyProofStats", v)} hint="e.g. 94% customer retention · $2.4M average savings per engagement · 3× faster than industry standard" />
      <TextInput label="Social Proof Criteria" value={brand.socialProofCriteria} onChange={(v) => update("socialProofCriteria", v)} hint="What makes a testimonial credible? Who should endorse this brand? What proof doesn't count?" multiline />
      <TextInput label="Claim Standards" value={brand.claimStandards} onChange={(v) => update("claimStandards", v)} hint="What claims require substantiation? What language is legal/brand-policy approved vs. off-limits?" multiline />
    </div>
  );
}

// ─── MARKET POSITIONING ───────────────────────────────────────────────────────
function MarketSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const TIERS = [
    { key: "budget",       label: "Budget",       desc: "Price-first, highest volume",       color: "#888888" },
    { key: "value",        label: "Value",        desc: "Quality at an honest price",        color: "#28B446" },
    { key: "mid-market",   label: "Mid-Market",   desc: "Quality + accessibility balanced",  color: "#2980b9" },
    { key: "premium",      label: "Premium",      desc: "Above-average, aspirational",       color: "#8e44ad" },
    { key: "luxury",       label: "Luxury",       desc: "Status, craft, exclusivity",        color: "#d4a017" },
    { key: "ultra-luxury", label: "Ultra-Luxury", desc: "Ultra-HNW, art-level pricing",      color: "#c0392b" },
  ];
  const SCOPES = ["Local", "Regional", "National", "Global", "Niche-Global"];
  const NICHES = ["Mass Market", "Niche", "Micro-Niche", "Ultra-Niche"];
  return (
    <div>
      <SectionHeader title="Market Position" subtitle="Where this brand lives in the competitive landscape — price tier, market scope, and who it's NOT for." phase={1} />
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Price Tier</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TIERS.map(t => (
            <button key={t.key} onClick={() => update("priceTier", t.key)}
              style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left", flex: "1 1 140px",
                border: `1px solid ${brand.priceTier === t.key ? t.color : "rgba(255,255,255,0.08)"}`,
                background: brand.priceTier === t.key ? `rgba(${hexToRgbStr(t.color)},0.1)` : "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: brand.priceTier === t.key ? t.color : "#888", marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "#444", lineHeight: 1.4 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Market Scope</label>
          {SCOPES.map(s => (
            <button key={s} onClick={() => update("marketScope", s)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: brand.marketScope === s ? 700 : 400, marginBottom: 6,
                border: `1px solid ${brand.marketScope === s ? bc : "rgba(255,255,255,0.07)"}`,
                background: brand.marketScope === s ? `rgba(${hexToRgbStr(bc)},0.08)` : "rgba(255,255,255,0.02)",
                color: brand.marketScope === s ? bc : "#666" }}>
              {s}
            </button>
          ))}
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Audience Depth</label>
          {NICHES.map(n => (
            <button key={n} onClick={() => update("nicheDepth", n)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: brand.nicheDepth === n ? 700 : 400, marginBottom: 6,
                border: `1px solid ${brand.nicheDepth === n ? bc : "rgba(255,255,255,0.07)"}`,
                background: brand.nicheDepth === n ? `rgba(${hexToRgbStr(bc)},0.08)` : "rgba(255,255,255,0.02)",
                color: brand.nicheDepth === n ? bc : "#666" }}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <TextInput label="Anti-Positioning — Who This Brand Is NOT For" value={brand.antiPositioning} onChange={(v) => update("antiPositioning", v)} hint="e.g. Not for price shoppers · Not for enterprise orgs · Not for brands who want to play it safe · Not for people who want fast and cheap" multiline aiField="antiPositioning" />
      <TextInput label="Category Ownership Statement" value={brand.categoryOwnership} onChange={(v) => update("categoryOwnership", v)} hint='e.g. "We own the category of performance nutrition for professional athletes" — what distinct category does this brand own or is building?' />
    </div>
  );
}

// ─── BRAND SENSORY PHYSICS ────────────────────────────────────────────────────
function SensorySection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const SLIDERS = [
    { key: "brandSpeed",       left: "Deliberate",   right: "Reactive",    ld: "Slow, considered, timeless", rd: "Fast, urgent, real-time",     le: "Hermès, Rolex",     re: "Nike, Red Bull" },
    { key: "brandWeight",      left: "Featherlight", right: "Heavyweight", ld: "Minimal, airy, effortless",  rd: "Dense, powerful, substantial", le: "Muji, Apple Notes", re: "Porsche, McKinsey" },
    { key: "brandTemperature", left: "Cold",         right: "Warm",        ld: "Clinical, precise, rational",rd: "Human, intimate, emotive",     le: "Bloomberg, Palantir",re: "Airbnb, Headspace" },
    { key: "brandTexture",     left: "Raw",          right: "Polished",    ld: "Rough, honest, unfiltered",  rd: "Refined, crafted, curated",    le: "Vice, Patagonia",   re: "LVMH, Chanel" },
    { key: "brandDensity",     left: "Sparse",       right: "Rich",        ld: "Minimal, one idea at a time",rd: "Layered, immersive, complex",  le: "Apple, Calm",       re: "Spotify, Google Maps" },
  ];
  const temp = brand.brandTemperature ?? 50;
  const density = brand.brandDensity ?? 50;
  const weight = brand.brandWeight ?? 50;
  const speed = brand.brandSpeed ?? 50;
  const texture = brand.brandTexture ?? 50;
  const previewHue = Math.round(220 - temp * 2);
  const previewSat = Math.round(15 + density * 0.3);
  const previewLight = Math.round(6 + weight * 0.07);
  const previewBg = `linear-gradient(135deg, hsl(${previewHue},${previewSat}%,${previewLight}%) 0%, rgba(${hexToRgbStr(bc)},0.18) 100%)`;
  const previewFontWeight = weight > 65 ? 900 : weight > 45 ? 600 : 300;
  const previewTracking = density < 35 ? "0.15em" : density > 65 ? "0" : "0.04em";
  const previewTextTransform = speed > 65 ? "uppercase" : "none";
  const previewOpacity = texture < 40 ? 0.72 : 0.95;
  return (
    <div>
      <SectionHeader title="Brand Sensory Physics" subtitle="The intangible force field that permeates every brand decision — speed, weight, temperature, texture, density." phase={2} />
      <div style={{ borderRadius: 12, overflow: "hidden", height: 90, background: previewBg, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, position: "relative", transition: "background 0.4s" }}>
        <div style={{ fontSize: 22 + weight * 0.1, fontWeight: previewFontWeight, letterSpacing: previewTracking, textTransform: previewTextTransform, color: `rgba(255,255,255,${previewOpacity})`, transition: "all 0.3s", fontFamily: "'Inter', -apple-system, sans-serif" }}>
          {brand.brandName || "Your Brand"}
        </div>
        <div style={{ position: "absolute", bottom: 7, right: 12, fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>SENSORY PREVIEW</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 20 }}>
        {SLIDERS.map(s => {
          const val = brand[s.key] ?? 50;
          return (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#d0d0d0" }}>{s.left}</div>
                  <div style={{ fontSize: 10, color: "#444", lineHeight: 1.4 }}>{s.ld}</div>
                  <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 3, fontStyle: "italic" }}>{s.le}</div>
                </div>
                <div style={{ fontSize: 12, color: bc, fontWeight: 800, minWidth: 36, textAlign: "center", paddingTop: 2 }}>{val}</div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#d0d0d0" }}>{s.right}</div>
                  <div style={{ fontSize: 10, color: "#444", lineHeight: 1.4 }}>{s.rd}</div>
                  <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 3, fontStyle: "italic" }}>{s.re}</div>
                </div>
              </div>
              <input type="range" min={0} max={100} value={val}
                onChange={(e) => update(s.key, parseInt(e.target.value))}
                style={{ width: "100%", accentColor: bc, cursor: "pointer", height: 4 }} />
            </div>
          );
        })}
      </div>
      <TextInput label="Sensory Expression Notes" value={brand.brandSensoryNotes} onChange={(v) => update("brandSensoryNotes", v)} hint="Describe the intangible feeling this brand should evoke — materials, pace, atmosphere, environment. What does it feel like to be inside this brand's world?" multiline aiField="brandSensoryNotes" />
    </div>
  );
}

// ─── OFFER ARCHITECTURE ──────────────────────────────────────────────────────
function OfferSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const ac = brand.accentColor || "#FF9F0A";
  const tiers = [
    { key: "LeadMagnet", label: "Lead Magnet", desc: "Free — exchange for attention/email", color: "#32D74B", priceKey: "LeadMagnetFormat", priceLabel: "Format", pricePlaceholder: "PDF guide · Quiz · Free training · Template" },
    { key: "IntroOffer",  label: "Intro Offer",  desc: "Low-cost entry point",              color: "#3498db", priceKey: "IntroPrice",       priceLabel: "Price",  pricePlaceholder: "$47 – $197" },
    { key: "CoreOffer",   label: "Core Offer",   desc: "Primary revenue product",           color: bc,        priceKey: "CorePrice",        priceLabel: "Price",  pricePlaceholder: "$497 – $2,997" },
    { key: "PremiumOffer",label: "Premium",      desc: "High-touch, highest LTV",           color: ac,        priceKey: "PremiumPrice",     priceLabel: "Price",  pricePlaceholder: "$5,000+" },
  ];
  return (
    <div>
      <SectionHeader title="Offer Architecture" subtitle="The complete offer ladder — from free to premium. This is what every piece of content ultimately leads to." phase={1} />
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Primary CTA / Call to Action</label>
        <input type="text" value={brand.offerCTA || ""} onChange={e => update("offerCTA", e.target.value)}
          placeholder="e.g. Book a free strategy call · Download the guide · Start your free trial"
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid rgba(${hexToRgbStr(bc)},0.2)`, background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        <div style={{ fontSize: 10, color: "#333", marginTop: 5 }}>This CTA is injected into every piece of AI-generated content</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {tiers.map(t => (
          <div key={t.key} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid rgba(${hexToRgbStr(t.color)},0.18)`, background: `rgba(${hexToRgbStr(t.color)},0.04)` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: t.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.label}</span>
              <span style={{ fontSize: 10, color: "#444" }}>{t.desc}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 8 }}>
              <input type="text" value={brand[`offer${t.key}`] || ""} onChange={e => update(`offer${t.key}`, e.target.value)}
                placeholder={`Name of your ${t.label.toLowerCase()}`}
                style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <input type="text" value={brand[`offer${t.priceKey}`] || ""} onChange={e => update(`offer${t.priceKey}`, e.target.value)}
                placeholder={t.pricePlaceholder}
                style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, paddingTop: 3 }}>Name</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, paddingTop: 3, marginRight: 8 }}>{t.priceLabel}</span>
            </div>
          </div>
        ))}
      </div>
      <ArrayInput label="Upsell / Post-Purchase Sequence" values={brand.offerUpsells || [""]} onChange={v => update("offerUpsells", v)} hint="e.g. Add-on implementation · Annual membership · Done-for-you upgrade" />
      <TextInput label="Value Proposition Statement" value={brand.offerValueProp} onChange={v => update("offerValueProp", v)} hint='The single sentence that makes someone say "I need that." Bridges ICP pain → your core offer.' aiField="offerValueProp" />
    </div>
  );
}

// ─── BRAND STORY LIBRARY ──────────────────────────────────────────────────────
function StoriesSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const STORY_COLORS = [bc, brand.accentColor || "#FF9F0A", brand.secondaryColor || "#3498db", "#0071E3", "#32D74B"];
  const updateStory = (i, field, v) => {
    const arr = [...(brand.brandStories || [])];
    arr[i] = { ...arr[i], [field]: v };
    update("brandStories", arr);
  };
  const stories = brand.brandStories || [];
  return (
    <div>
      <SectionHeader title="Brand Story Library" subtitle="The 5 true stories your brand can draw from for any piece of content — social, email, webinar, press, or sales." phase={1} />
      <div style={{ fontSize: 12, color: "#444", marginBottom: 16, lineHeight: 1.6 }}>
        Every story has a structure: <strong style={{ color: "#777" }}>Setup → Conflict → Resolution → Lesson</strong>. Write them in your brand's voice.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {stories.map((story, i) => (
          <div key={story.id} style={{ borderRadius: 10, border: `1px solid rgba(${hexToRgbStr(STORY_COLORS[i] || bc)},0.15)`, background: "rgba(255,255,255,0.015)", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: `rgba(${hexToRgbStr(STORY_COLORS[i] || bc)},0.07)`, borderBottom: `1px solid rgba(${hexToRgbStr(STORY_COLORS[i] || bc)},0.1)`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: `rgba(${hexToRgbStr(STORY_COLORS[i] || bc)},0.2)`, border: `1px solid rgba(${hexToRgbStr(STORY_COLORS[i] || bc)},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: STORY_COLORS[i] || bc, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: STORY_COLORS[i] || bc, textTransform: "uppercase", letterSpacing: 0.5 }}>{story.label}</div>
                <div style={{ fontSize: 9, color: "#444", marginTop: 1 }}>
                  {["The moment it all started", "Your first proof of concept", "The breakdown before the breakthrough", "A customer's before/after transformation", "The moment that proved everything"][i]}
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <input type="text" value={story.title} onChange={e => updateStory(i, "title", e.target.value)}
                placeholder="Story headline / working title"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <textarea value={story.story} onChange={e => updateStory(i, "story", e.target.value)}
                placeholder={["Tell the origin moment. The specific day, place, and feeling that started everything. Make it cinematic.", "The first time it worked. Who was the customer? What happened? What did it prove?", "The thing that almost killed it. The pivot, the failure, the dark moment — and what changed.", "One real customer transformation, told in their words. Before → after → what made the difference.", "The piece of proof that changed everything. A stat, a moment, a result that validated the whole thing."][i]}
                rows={4}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "#d0d0d0", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CONTENT CALENDAR BLUEPRINT ───────────────────────────────────────────────
function CalendarSection({ brand, update }) {
  const bc = brand.primaryColor || "#0071E3";
  const edu = brand.contentMixEducational ?? 40;
  const promo = brand.contentMixPromotional ?? 20;
  const ent = brand.contentMixEntertainment ?? 40;
  const total = edu + promo + ent;
  const platformCadences = [
    { key: "contentCadenceInstagram", label: "Instagram", icon: "📸" },
    { key: "contentCadenceLinkedIn",  label: "LinkedIn",  icon: "💼" },
    { key: "contentCadenceEmail",     label: "Email",     icon: "✉" },
    { key: "contentCadenceTikTok",    label: "TikTok",    icon: "🎵" },
  ];
  return (
    <div>
      <SectionHeader title="Content Calendar" subtitle="Your posting cadence, content mix, and topic rotation framework — the engine behind consistent content creation." phase={1} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 }}>Content Mix</label>
          <span style={{ fontSize: 10, color: total === 100 ? "#32D74B" : "#0071E3", fontWeight: 700 }}>{total}% total {total !== 100 ? "— adjust to reach 100%" : "✓"}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 14 }}>
          <div style={{ flex: edu, background: "#3498db", transition: "flex 0.3s" }} />
          <div style={{ flex: promo, background: bc, transition: "flex 0.3s" }} />
          <div style={{ flex: ent, background: "#0071E3", transition: "flex 0.3s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { key: "contentMixEducational",    label: "Educational", color: "#3498db", val: edu,   desc: "Teach, inform, how-to" },
            { key: "contentMixPromotional",    label: "Promotional", color: bc,        val: promo, desc: "Offers, products, CTA" },
            { key: "contentMixEntertainment",  label: "Entertainment",color: "#0071E3", val: ent,   desc: "Stories, culture, fun" },
          ].map(m => (
            <div key={m.key} style={{ padding: "12px", borderRadius: 8, border: `1px solid rgba(${hexToRgbStr(m.color)},0.2)`, background: `rgba(${hexToRgbStr(m.color)},0.05)`, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.val}%</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 9, color: "#333", marginBottom: 8 }}>{m.desc}</div>
              <input type="range" min={0} max={100} value={m.val} onChange={e => update(m.key, parseInt(e.target.value))}
                style={{ width: "100%", accentColor: m.color, cursor: "pointer" }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {platformCadences.map(p => (
          <div key={p.key}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 5 }}>{p.icon} {p.label}</label>
            <input type="text" value={brand[p.key] || ""} onChange={e => update(p.key, e.target.value)}
              placeholder="e.g. 5x/week · Reels + Stories daily"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
      <TextInput label="Topic Rotation Formula" value={brand.contentRotation} onChange={v => update("contentRotation", v)} hint="e.g. Mon: Educational tutorial · Wed: Customer story · Fri: Behind-the-scenes · Sun: Promotional" multiline aiField="contentRotation" />
      <ArrayInput label="Seasonal Moments & Campaign Anchors" values={brand.seasonalMoments || [""]} onChange={v => update("seasonalMoments", v)} hint="e.g. Q1 New Year campaign · Summer product launch · Black Friday · Annual report release" />
    </div>
  );
}

function ScoreSection({ brand, onNavigate }) {
  const { score, roadmap } = computeGravityScore(brand);
  const color = gravityScoreColor(score);
  return (
    <div>
      <SectionHeader title="Brand Gravity Score" subtitle="How coherent is your brand identity — not just how full is the form." phase={4} />
      <div style={{ textAlign: "center", padding: "30px" }}>
        <div style={{ fontSize: "64px", fontWeight: 700, color, fontFamily: "'Inter', -apple-system, sans-serif" }}>{score}</div>
        <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", marginTop: "16px", overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.5s" }} />
        </div>
        {roadmap.length > 0 ? (
          <div style={{ marginTop: "24px", textAlign: "left", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Your roadmap
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: 12, lineHeight: 1.5 }}>
              Each step shows what it adds to your Gravity. Click one to jump straight to it.
            </div>
            {roadmap.map((step, i) => (
              <button
                key={step.label}
                onClick={() => onNavigate?.(step.sectionId)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  width: "100%", textAlign: "left", padding: "12px 14px", marginBottom: 8,
                  borderRadius: "10px", cursor: "pointer", fontFamily: "inherit",
                  border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.5)"; e.currentTarget.style.background = "rgba(0,113,227,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", flexShrink: 0 }}>{i + 1}</span>
                  <span>
                    <span style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#ddd" }}>{step.fix}</span>
                    <span style={{ display: "block", fontSize: "11.5px", color: "#666", marginTop: 2 }}>{step.label}</span>
                  </span>
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0071E3", flexShrink: 0 }}>+{step.weight} →</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: "20px", fontSize: "13px", color: "#32D74B", fontWeight: 600 }}>
            Every gravity signal is defined. This brand holds together.
          </div>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, hint, placeholder }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      <input
        type="number" min="0" inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
        style={inputBase}
      />
      {hint && <div style={{ fontSize: "11px", color: "#555", marginTop: "5px" }}>{hint}</div>}
    </div>
  );
}

function IntegrationsSection({ brand, update }) {
  const integrations = brand.integrations || {};
  const setField = (key, value) => update("integrations", { ...integrations, [key]: value });
  const { score, hasData, breakdown } = computeImpactScore(integrations);
  const color = impactScoreColor(score);

  return (
    <div>
      <SectionHeader
        title="Integrations — Impact Score"
        subtitle="Plug in your own analytics — social following, traffic, ads, AI visibility — to measure real-world reach, not just strategy."
        phase={4}
      />

      <div style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", marginBottom: "24px", fontSize: "12px", color: "#777", lineHeight: 1.6 }}>
        BrandMD doesn't connect to social platforms, ad networks, or traffic tools automatically — these are your own numbers,
        pulled from Similarweb, SEMrush, Ahrefs, Meta/TikTok/LinkedIn analytics, or wherever you already track them.
      </div>

      <div style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: "12px" }}>Social Reach</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <NumberField label="Instagram followers" value={integrations.instagramFollowers} onChange={(v) => setField("instagramFollowers", v)} placeholder="0" />
        <NumberField label="TikTok followers" value={integrations.tiktokFollowers} onChange={(v) => setField("tiktokFollowers", v)} placeholder="0" />
        <NumberField label="LinkedIn followers" value={integrations.linkedinFollowers} onChange={(v) => setField("linkedinFollowers", v)} placeholder="0" />
        <NumberField label="X / Twitter followers" value={integrations.xFollowers} onChange={(v) => setField("xFollowers", v)} placeholder="0" />
      </div>

      <div style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", margin: "8px 0 12px" }}>Traffic &amp; Ads</div>
      <NumberField
        label="Monthly organic traffic"
        value={integrations.monthlyOrganicTraffic}
        onChange={(v) => setField("monthlyOrganicTraffic", v)}
        placeholder="0"
        hint="From Similarweb, SEMrush, Ahrefs, or Google Analytics"
      />
      <NumberField
        label="Estimated monthly ad spend ($)"
        value={integrations.adSpendEstimate}
        onChange={(v) => setField("adSpendEstimate", v)}
        placeholder="0"
        hint="Rough estimate is fine — this measures paid presence, not precision"
      />

      <div style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", margin: "8px 0 12px" }}>GEO — AI Visibility</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
        {GEO_LEVELS.map((lvl) => (
          <button
            key={lvl.value}
            onClick={() => setField("geoVisibilityRating", lvl.value)}
            style={{
              textAlign: "left", padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
              border: integrations.geoVisibilityRating === lvl.value ? "2px solid #0071E3" : "1px solid rgba(255,255,255,0.06)",
              background: integrations.geoVisibilityRating === lvl.value ? "rgba(0,113,227,0.08)" : "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: integrations.geoVisibilityRating === lvl.value ? "#0071E3" : "#ccc" }}>{lvl.label}</div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{lvl.hint}</div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "24px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: "10px" }}>Impact Score</div>
        <div style={{ fontSize: "56px", fontWeight: 700, color, fontFamily: "'Inter', -apple-system, sans-serif" }}>{score}</div>
        {!hasData && <div style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>Add any metric above to see your score.</div>}
        {hasData && (
          <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "10px", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
            {breakdown.map((b) => (
              <div key={b.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  <span>{b.label}</span><span>{b.points}/{b.max}</span>
                </div>
                <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${(b.points / b.max) * 100}%`, height: "100%", background: color, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// The permanent AI-context URL: paste it into ChatGPT/Claude/Cursor instead
// of re-explaining the brand every session. Always reflects the saved board.
function BrandMdRow({ boardId }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/board/${boardId}/brand.md`;
  return (
    <div style={{ padding: "14px 16px", borderRadius: "10px", border: "1px solid rgba(0,113,227,0.25)", background: "rgba(0,113,227,0.05)" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "#0071E3", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
        Your brand.md — AI context file
      </div>
      <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6, marginBottom: 10 }}>
        Paste this URL into ChatGPT, Claude, or any AI tool and it writes with your full
        brand system — always current, no re-explaining.
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <code style={{ flex: 1, fontSize: "11.5px", color: "#ccc", background: "rgba(0,0,0,0.35)", padding: "8px 10px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
          style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#0071E3", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function ExportSection({ brand, onSave, email, boardId }) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null);
  const [pubErr, setPubErr] = useState(null);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(brand, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `${(brand.brandName || "brand").toLowerCase().replace(/\s+/g, "-")}-brand-board.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  const handlePublish = async () => {
    if (!brand.brandName) { setPubErr("Add a Brand Name before publishing."); return; }
    setPublishing(true);
    setPubErr(null);
    try {
      const res = await publishBrand(brand, email);
      setPublished(res);
    } catch (e) {
      setPubErr(e.message || "Publish failed");
    }
    setPublishing(false);
  };

  return (
    <div>
      <SectionHeader title="Export & Save" subtitle="Download your brand board or save it online." phase={4} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button onClick={onSave} style={{ padding: "14px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #0071E3, #005BB8)", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}>
          💾 Save & Get Shareable Link
        </button>
        <button onClick={exportJSON} style={{ padding: "14px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}>
          📄 Export as JSON (for LLMs)
        </button>
        {boardId ? (
          <>
            <Link
              to={`/board/${boardId}/guidelines`}
              style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "14px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", fontSize: "15px", fontWeight: 600, fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
              📖 Open Brand Guidelines (share & print)
            </Link>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                to={`/check/${boardId}`}
                style={{ flex: 1, minWidth: 200, textAlign: "center", textDecoration: "none", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", fontSize: "14px", fontWeight: 600, fontFamily: "'Inter', -apple-system, sans-serif" }}
              >
                ✓ Brand Check a draft
              </Link>
              <Link
                to={`/board/${boardId}/drift`}
                style={{ flex: 1, minWidth: 200, textAlign: "center", textDecoration: "none", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", fontSize: "14px", fontWeight: 600, fontFamily: "'Inter', -apple-system, sans-serif" }}
              >
                ◎ Run Drift Watch
              </Link>
            </div>
            <BrandMdRow boardId={boardId} />
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "14px 24px", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)", color: "#555", fontSize: "13px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            📖 Save the board to unlock Brand Guidelines, Brand Check, Drift Watch, and your
            permanent brand.md URL — the context file you paste into any AI tool.
          </div>
        )}
        {!published ? (
          <button onClick={handlePublish} disabled={publishing} style={{ padding: "14px 24px", borderRadius: "10px", border: "1px solid rgba(0,113,227,0.35)", background: "rgba(0,113,227,0.08)", color: publishing ? "#666" : "#0071E3", fontSize: "15px", fontWeight: 600, cursor: publishing ? "wait" : "pointer", fontFamily: "'Inter', -apple-system, sans-serif", transition: "all 0.2s" }}>
            {publishing ? "Publishing..." : "◆ Get Your Brand Certificate"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "13px", color: "#32D74B", fontWeight: 600 }}>✓ Your Brand Certificate is live</div>
            <CertificateShare brand={brand} url={published.url} />
          </div>
        )}
        {pubErr && <div style={{ fontSize: "12px", color: "#FF453A", padding: "8px 0" }}>{pubErr}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SECTION GATE MODAL
// ═══════════════════════════════════════════════
function SectionGateModal({ section, onClose, onUnlocked }) {
  const isRegGate  = section.tier === "registered";
  const [email, setEmail]   = useState("");
  const [phase, setPhase]   = useState("main"); // main | email | credits | earn
  const [contactText, setContactText] = useState("");
  const [earnMsg, setEarnMsg] = useState("");

  const refUrl = getReferralUrl();

  const doRegister = () => {
    if (!email.includes("@")) return;
    _register(email);
    setPhase("done");
  };

  const doShare = (action, url) => {
    if (url) window.open(url, "_blank", "width=600,height=500");
    const gained = claimEarnAction(action);
    setEarnMsg(gained ? "+1 credit earned!" : "Already claimed.");
  };

  const doImport = () => {
    const emails = contactText.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    const { added } = importContacts(emails);
    setEarnMsg(added > 0 ? `+${added} credit${added !== 1 ? "s" : ""} earned!` : "All contacts already imported.");
  };

  const copyRef = () => { navigator.clipboard.writeText(refUrl); setEarnMsg("Referral link copied! You earn 1 credit for each friend who registers."); };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ maxWidth:480,width:"100%",background:"#0e0e14",borderRadius:16,border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden" }}>

        {phase === "done" ? (
          <div style={{ padding:"48px 32px",textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:16 }}>✓</div>
            <div style={{ fontSize:22,fontWeight:800,color:"#32D74B",marginBottom:8 }}>You're in!</div>
            <div style={{ fontSize:14,color:"#555",marginBottom:24 }}>3 free credits added to your account. Sections unlocked.</div>
            <button onClick={onUnlocked} style={{ padding:"12px 32px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#32D74B,#28B446)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Continue Building →</button>
          </div>
        ) : (
          <>
            <div style={{ padding:"24px 28px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                <span style={{ fontSize:20 }}>{section.icon}</span>
                <span style={{ fontSize:16,fontWeight:800,color:"#fff" }}>{section.label}</span>
                <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:isRegGate?"rgba(50,215,75,0.1)":"rgba(255,159,10,0.1)",color:isRegGate?"#32D74B":"#FF9F0A",fontWeight:700 }}>{isRegGate?"FREE":"PRO"}</span>
              </div>
              <div style={{ fontSize:13,color:"#444" }}>{section.gateHint}</div>
            </div>

            <div style={{ padding:"20px 28px" }}>
              {/* Tabs */}
              <div style={{ display:"flex",gap:6,marginBottom:18 }}>
                {[["main", isRegGate?"Register Free":"Upgrade"], ["earn","Earn Credits"]].map(([id,label]) => (
                  <button key={id} onClick={() => setPhase(id)}
                    style={{ padding:"6px 14px",borderRadius:20,border:`1px solid ${phase===id?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)"}`,background:phase===id?"rgba(255,255,255,0.06)":"transparent",color:phase===id?"#fff":"#444",fontSize:12,fontWeight:phase===id?700:400,cursor:"pointer",fontFamily:"inherit" }}>
                    {label}
                  </button>
                ))}
              </div>

              {phase === "main" && isRegGate && (
                <div>
                  <div style={{ fontSize:13,color:"#555",marginBottom:16 }}>Register free and get <strong style={{color:"#32D74B"}}>3 content credits</strong> — no credit card required.</div>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doRegister()}
                    placeholder="your@email.com"
                    style={{ width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#e0e0e0",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12 }}
                  />
                  <button onClick={doRegister} style={{ width:"100%",padding:"12px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#32D74B,#28B446)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                    Register Free — Get 3 Credits →
                  </button>
                </div>
              )}

              {phase === "main" && !isRegGate && (
                <div>
                  <div style={{ fontSize:13,color:"#555",marginBottom:16 }}>Pro sections include advanced intelligence: ICPs, offer architecture, brand stories, content calendar, sensory physics, and more.</div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
                    {CREDIT_PACKS.map(p => (
                      <button key={p.id} onClick={() => { _upgradePro(p.credits); onUnlocked(); }}
                        style={{ padding:"12px 10px",borderRadius:9,cursor:"pointer",fontFamily:"inherit",border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)",textAlign:"left" }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#ccc" }}>{p.label}</div>
                        <div style={{ fontSize:18,fontWeight:800,color:"#fff" }}>{p.credits} <span style={{ fontSize:10,color:"#444" }}>credits</span></div>
                        <div style={{ fontSize:14,fontWeight:700,color:"#0071E3" }}>{p.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === "earn" && (
                <div>
                  <div style={{ fontSize:12,color:"#444",marginBottom:14 }}>Do any of the below to earn free content credits.</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:14 }}>
                    {[
                      { action:"share_fb",  label:"Share on Facebook",  icon:"f",  url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refUrl)}` },
                      { action:"share_li",  label:"Post on LinkedIn",    icon:"in", url:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refUrl)}` },
                      { action:"share_x",   label:"Post on X / Twitter", icon:"✕",  url:`https://x.com/intent/tweet?text=${encodeURIComponent("Just built my brand identity with BrandMD — it's incredible. Try it free:")}%20${encodeURIComponent(refUrl)}` },
                      { action:"share_link",label:"Copy referral link",  icon:"◈",  url: null },
                    ].map(item => (
                      <button key={item.action} onClick={() => item.action==="share_link" ? copyRef() : doShare(item.action, item.url)}
                        style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${hasEarnedAction(item.action)?"rgba(50,215,75,0.2)":"rgba(255,255,255,0.07)"}`,background:hasEarnedAction(item.action)?"rgba(50,215,75,0.04)":"rgba(255,255,255,0.02)" }}>
                        <span style={{ fontSize:13,color:hasEarnedAction(item.action)?"#32D74B":"#aaa" }}>{item.icon} {item.label}</span>
                        <span style={{ fontSize:11,color:hasEarnedAction(item.action)?"#32D74B":"#555",fontWeight:700 }}>{hasEarnedAction(item.action)?"✓ Claimed":"+1 credit"}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6 }}>Import contacts — 1 credit per contact (max 25)</div>
                    <textarea value={contactText} onChange={e=>setContactText(e.target.value)} rows={3}
                      placeholder="Paste email addresses separated by commas, semicolons, or line breaks…"
                      style={{ width:"100%",padding:"9px 11px",borderRadius:7,border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)",color:"#ccc",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box" }}
                    />
                    <button onClick={doImport} style={{ marginTop:7,width:"100%",padding:"9px 0",borderRadius:7,border:"none",background:"rgba(50,215,75,0.1)",color:"#32D74B",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                      Import & Earn Credits
                    </button>
                  </div>
                  {earnMsg && <div style={{ fontSize:12,color:"#32D74B",fontWeight:600,marginTop:6 }}>{earnMsg}</div>}
                </div>
              )}
            </div>

            <div style={{ padding:"12px 28px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"flex-end" }}>
              <button onClick={onClose} style={{ padding:"8px 16px",borderRadius:7,border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:"#444",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function BrandBoardBuilder({ boardId: initialBoardId }) {
  const [brand, setBrand] = useState({ ...DEFAULT_BRAND });
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches);
  const [coreMode, setCoreMode] = useState(() => localStorage.getItem("bmd_core_mode") !== "0");
  const toggleCoreMode = (on) => { setCoreMode(on); localStorage.setItem("bmd_core_mode", on ? "1" : "0"); };
  const visibleSections = coreMode ? SECTIONS.filter((s) => CORE_SECTION_IDS.has(s.id)) : SECTIONS;
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [boardId, setBoardId] = useState(initialBoardId || null);
  const [email, setEmail] = useState(null);
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(!!initialBoardId);
  const [gateTarget, setGateTarget] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const sectionRefs = useRef({});
  const aiEnabled = isAIAvailable();

  useEffect(() => {
    if (initialBoardId) {
      loadBoard(initialBoardId).then((data) => {
        if (data?.brand_data) {
          setBrand({ ...DEFAULT_BRAND, ...data.brand_data });
          setEmail(data.email);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [initialBoardId]);

  useEffect(() => {
    const clone = sessionStorage.getItem("brand-clone");
    if (!clone) return;
    sessionStorage.removeItem("brand-clone");
    try {
      const b = JSON.parse(clone);
      setBrand(prev => ({
        ...prev,
        brandName: b.brandName || prev.brandName,
        tagline: b.tagline || prev.tagline,
        industry: b.industry || prev.industry,
        mission: b.mission || prev.mission,
        vision: b.vision || prev.vision,
        elevator: b.elevator || prev.elevator,
        archetype: b.archetype || prev.archetype,
        website: b.website || prev.website,
        primaryColor: b.primaryColor || prev.primaryColor,
        secondaryColor: b.secondaryColor || prev.secondaryColor,
        accentColor: b.accentColor || prev.accentColor,
        primaryFont: b.primaryFont || prev.primaryFont,
        bodyFont: b.bodyFont || prev.bodyFont,
        toneAttributes: b.toneAttributes?.length ? b.toneAttributes : prev.toneAttributes,
        brandPersonality: b.brandPersonality?.length ? b.brandPersonality : prev.brandPersonality,
        photoStyle: b.photoStyle || prev.photoStyle,
        socialPersonality: b.socialPersonality || prev.socialPersonality,
      }));
    } catch {}
  }, []);

  // Seed from the Founder Start flow (/start) — unlike brand-clone this is a
  // full synthesis already mapped to board fields, so merge everything.
  useEffect(() => {
    const seed = sessionStorage.getItem("founder-seed");
    if (!seed) return;
    sessionStorage.removeItem("founder-seed");
    try {
      const updates = JSON.parse(seed);
      setBrand((prev) => ({ ...prev, ...updates }));
      setSaved(false);
    } catch {}
  }, []);

  const update = useCallback((key, value) => {
    setBrand((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  // Applied by WebScanner — merges scan results into brand state
  const applyScannedData = useCallback((updates) => {
    setBrand((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    if (email) {
      doSave(email, null);
    } else {
      setShowEmailGate(true);
    }
  };

  const doSave = async (userEmail, firstName) => {
    const newBoardId = await saveBoard(boardId, brand, userEmail);
    setBoardId(newBoardId);
    setEmail(userEmail);
    setSaved(true);
    track("board_saved", { boardId: newBoardId });
    setShowEmailGate(false);
    const url = `${window.location.origin}/board/${newBoardId}`;
    setShareUrl(url);
    await sendLeadToGHL({ email: userEmail, firstName: firstName || "", boardId: newBoardId, boardUrl: url });
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      for (const s of SECTIONS) {
        const el = sectionRefs.current[s.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 200) { setActiveSection(s.id); break; }
        }
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const fields = Object.entries(brand).filter(([k]) => !["customFields","contentPillars","integrations","sources","lightModeEnabled","darkModeEnabled"].includes(k));
  const filled = fields.filter(([, v]) => {
    if (Array.isArray(v)) return v.some((x) => typeof x === "string" ? x.trim() : x);
    return v && String(v).trim();
  }).length;
  const progress = Math.round((filled / fields.length) * 100);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000", color: "#e0e0e0", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>Loading brand board...</div>
        </div>
      </div>
    );
  }

  const renderSection = (id) => {
    const sectionDef = SECTIONS.find(s => s.id === id);
    if (sectionDef && !isUnlocked(sectionDef.tier || "free")) {
      const isRegistered = sectionDef.tier === "registered";
      const bc = "#0071E3";
      return (
        <div style={{ padding: "60px 40px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: isRegistered ? "rgba(50,215,75,0.08)" : `rgba(${hexToRgbStr(bc)},0.08)`, border: `1px solid ${isRegistered ? "rgba(50,215,75,0.2)" : `rgba(${hexToRgbStr(bc)},0.2)`}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 20px" }}>
            {isRegistered ? "◈" : "◆"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            {sectionDef.label}
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7, marginBottom: 6 }}>
            {sectionDef.gateHint || (isRegistered ? "Register free to unlock this section." : "Upgrade to Pro to unlock this section.")}
          </div>
          <div style={{ fontSize: 11, color: "#2a2a2a", marginBottom: 28 }}>
            {isRegistered ? "Free · No credit card" : "Pro plan · Buy credits to generate content"}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => setGateTarget(sectionDef)}
              style={{ padding: "11px 24px", borderRadius: 9, border: "none", background: isRegistered ? "linear-gradient(135deg,#32D74B,#28B446)" : `linear-gradient(135deg,${bc},${bc}cc)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {isRegistered ? "Register Free →" : "Upgrade to Pro →"}
            </button>
          </div>
          <div style={{ marginTop: 32, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "left" }}>
            <div style={{ fontSize: 10, color: "#333", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              {isRegistered ? "Free registration unlocks" : "Pro unlocks"}
            </div>
            {isRegistered ? (
              <div style={{ fontSize: 11, color: "#3a3a3a", lineHeight: 1.8 }}>
                Archetype · StoryBrand · Content Pillars · Voice & Messaging<br />
                Audience · Vocabulary · Competitive · Photography · Logo<br />
                Accessibility · Integrations · Custom Fields
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#3a3a3a", lineHeight: 1.8 }}>
                Writing System · Brand Manifesto · Ideal Customers (ICPs)<br />
                Customer Journey · Proof Framework · Market Position<br />
                Offer Architecture · Brand Stories · Content Calendar<br />
                Platform Voice · Brand Sensory · Motion · Media<br />
                + Content Studio with AI content generation
              </div>
            )}
          </div>
        </div>
      );
    }
    const map = {
      overview: <OverviewSection brand={brand} update={update} onApplyScanned={applyScannedData} />,
      identity: <IdentitySection brand={brand} update={update} />,
      archetype: <ArchetypeSection brand={brand} update={update} />,
      storybrand: <StoryBrandSection brand={brand} update={update} />,
      pillars: <PillarsSection brand={brand} update={update} />,
      voice: <VoiceSection brand={brand} update={update} />,
      audience: <AudienceSection brand={brand} update={update} />,
      icps: <ICPSection brand={brand} update={update} />,
      socialvoice: <SocialVoiceSection brand={brand} update={update} />,
      vocabulary: <VocabularySection brand={brand} update={update} />,
      competitive: <CompetitiveSection brand={brand} update={update} />,
      language: <LanguageSection brand={brand} update={update} />,
      manifesto: <ManifestoSection brand={brand} update={update} />,
      journey: <JourneySection brand={brand} update={update} />,
      proof: <ProofSection brand={brand} update={update} />,
      market: <MarketSection brand={brand} update={update} />,
      offer: <OfferSection brand={brand} update={update} />,
      stories: <StoriesSection brand={brand} update={update} />,
      calendar: <CalendarSection brand={brand} update={update} />,
      sensory: <SensorySection brand={brand} update={update} />,
      colors: <ColorsSection brand={brand} update={update} />,
      typography: <TypographySection brand={brand} update={update} />,
      photography: <PhotographySection brand={brand} update={update} onApplyScanned={applyScannedData} />,
      logo: <LogoSection brand={brand} update={update} />,
      motion: <MotionSection brand={brand} update={update} />,
      media: <MediaSection brand={brand} update={update} />,
      accessibility: <AccessibilitySection brand={brand} update={update} />,
      guidelines: <CustomFieldsSection brand={brand} update={update} />,
      score: <ScoreSection brand={brand} onNavigate={scrollToSection} />,
      integrations: <IntegrationsSection brand={brand} update={update} />,
      export: <ExportSection brand={brand} onSave={handleSave} email={email} boardId={boardId} />,
    };
    return map[id] || null;
  };

  return (
    <BrandCtx.Provider value={{ brand, aiEnabled }}>
      <div style={{ height: "100vh", background: "#000000", color: "#e0e0e0", fontFamily: "'Inter', -apple-system, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <header style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(10,10,15,0.97)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
              <OrbitMark size={24} />
              <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.3px", color: "#F5F5F7" }}>
                BrandMD<span style={{ color: "#8E8E93", fontWeight: 500 }}>.space</span>
              </span>
            </Link>
            {!isMobile && <span style={{ fontSize: "11px", fontWeight: 600, color: "#8E8E93", letterSpacing: "1.2px", textTransform: "uppercase", borderLeft: "1px solid rgba(255,255,255,0.12)", paddingLeft: 12 }}>
              Builder
            </span>}
            {!isMobile && <Link to="/brands" style={{ marginLeft: 4, padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#8E8E93", fontSize: "11px", fontWeight: 600, textDecoration: "none", letterSpacing: 0.3, transition: "all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#F5F5F7"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#8E8E93"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
            >
              Library
            </Link>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {aiEnabled && !isMobile && (
              <div style={{ padding: "3px 9px", borderRadius: "5px", border: "1px solid rgba(0,113,227,0.2)", background: "rgba(0,113,227,0.06)" }}>
                <span style={{ fontSize: "10px", color: "#0071E3", fontWeight: 700 }}>✦ AI ON</span>
              </div>
            )}
            {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#0071E3", transition: "width 0.5s" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#666" }}>{progress}%</span>
            </div>}
            <button onClick={handleSave} style={{ padding: "6px 16px", borderRadius: "7px", cursor: "pointer", background: saved ? "rgba(50,215,75,0.15)" : "rgba(255,255,255,0.06)", border: saved ? "1px solid rgba(50,215,75,0.3)" : "1px solid rgba(255,255,255,0.08)", color: saved ? "#32D74B" : "#aaa", fontSize: "12px", fontWeight: 500, transition: "all 0.3s" }}>
              {saved ? "✓ Saved" : "Save"}
            </button>
            <button
              onClick={() => { sessionStorage.setItem("studio_brand", JSON.stringify(brand)); }}
              style={{ padding: "0", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <Link
                to={boardId ? `/studio/${boardId}` : "/studio"}
                onClick={() => sessionStorage.setItem("studio_brand", JSON.stringify(brand))}
                style={{ padding: "6px 16px", borderRadius: 100, background: "#0071E3", color: "#fff", fontSize: "12px", fontWeight: 600, textDecoration: "none", display: "inline-block", letterSpacing: 0.2 }}
              >
                ✦ Content Studio
              </Link>
            </button>
          </div>
        </header>

        {/* SHARE URL BANNER */}
        {shareUrl && (
          <div style={{ padding: "10px 24px", background: "rgba(50,215,75,0.08)", borderBottom: "1px solid rgba(50,215,75,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: "13px", color: "#32D74B" }}>Your board is live at: <strong>{shareUrl}</strong></span>
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(50,215,75,0.3)", background: "transparent", color: "#32D74B", fontSize: "12px", cursor: "pointer" }}>Copy Link</button>
          </div>
        )}

        {/* BODY */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: "hidden" }}>
          {/* NAVIGATION — sidebar on desktop, horizontal chip strip on mobile */}
          {isMobile ? (
            <nav style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, WebkitOverflowScrolling: "touch" }}>
              <button onClick={() => toggleCoreMode(!coreMode)} style={{
                padding: "7px 14px", borderRadius: 100, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)",
                color: "#F5F5F7", fontSize: "12px", fontWeight: 700, fontFamily: "'Inter', -apple-system, sans-serif",
              }}>
                {coreMode ? "Core · show all 31" : "All · show core 7"}
              </button>
              {visibleSections.map((s) => {
                const isActive = activeSection === s.id;
                const locked = !isUnlocked(s.tier || "free");
                return (
                  <button key={s.id} onClick={() => scrollToSection(s.id)} style={{
                    padding: "7px 14px", borderRadius: 100, whiteSpace: "nowrap", flexShrink: 0,
                    border: isActive ? "1px solid rgba(0,113,227,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    background: isActive ? "rgba(0,113,227,0.12)" : "transparent", cursor: "pointer",
                    color: isActive ? "#0071E3" : locked ? "#4a4a4a" : "#999",
                    fontSize: "12px", fontWeight: 600, fontFamily: "'Inter', -apple-system, sans-serif",
                  }}>
                    {s.label}{locked ? " 🔒" : ""}
                  </button>
                );
              })}
            </nav>
          ) : (
            <nav style={{ width: "220px", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", padding: "16px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 4, margin: "0 16px 14px", padding: 3, borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)" }}>
                {[["Core 7", true], ["Full 31", false]].map(([label, on]) => (
                  <button key={label} onClick={() => toggleCoreMode(on)} style={{
                    flex: 1, padding: "6px 0", borderRadius: 100, border: "none", cursor: "pointer",
                    background: coreMode === on ? "#0071E3" : "transparent",
                    color: coreMode === on ? "#fff" : "#8E8E93",
                    fontSize: "11px", fontWeight: 700, fontFamily: "'Inter', -apple-system, sans-serif", transition: "all 0.15s",
                  }}>{label}</button>
                ))}
              </div>
              {PHASES.map((phase, pi) => (
                <div key={pi}>
                  {visibleSections.some((s) => s.phase === pi) && (
                    <div style={{ padding: "8px 20px", fontSize: "10px", fontWeight: 700, color: phase.color, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: pi > 0 ? "8px" : 0 }}>{phase.name}</div>
                  )}
                  {visibleSections.filter((s) => s.phase === pi).map((s) => {
                    const isActive = activeSection === s.id;
                    const ac = "#0071E3";
                    const locked = !isUnlocked(s.tier || "free");
                    const lockColor = s.tier === "registered" ? "#32D74B" : "#FF9F0A";
                    return (
                      <button key={s.id} onClick={() => scrollToSection(s.id)} style={{
                        display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 20px",
                        border: "none", cursor: "pointer", fontSize: "13px", textAlign: "left",
                        background: isActive ? `rgba(${hexToRgbStr(ac)},0.08)` : "transparent",
                        color: isActive ? ac : locked ? "#3a3a3a" : "#888",
                        borderLeft: isActive ? `2px solid ${ac}` : "2px solid transparent",
                        fontFamily: "'Inter', -apple-system, sans-serif", transition: "all 0.2s",
                      }}>
                        <span style={{ fontSize: "14px", width: "20px", opacity: locked ? 0.4 : 1 }}>{s.icon}</span>
                        <span style={{ flex: 1 }}>{s.label}</span>
                        {locked && <span style={{ fontSize: "9px", color: lockColor, opacity: 0.7 }}>🔒</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          )}

          {/* MAIN CONTENT */}
          <main ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: isMobile ? "24px 18px" : "32px 40px" }}>
            {visibleSections.map((s) => (
              <div key={s.id} ref={(el) => (sectionRefs.current[s.id] = el)} style={{ marginBottom: "48px", maxWidth: "700px" }}>
                {renderSection(s.id)}
              </div>
            ))}
            {coreMode && (
              <div style={{ maxWidth: "700px", marginBottom: "48px", padding: "24px 26px", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#ccc", marginBottom: 6 }}>That's the core. 22 more sections go deeper.</div>
                <div style={{ fontSize: "12.5px", color: "#666", lineHeight: 1.6, marginBottom: 14 }}>ICPs, StoryBrand, offer architecture, platform voices, sensory system, and more.</div>
                <button onClick={() => toggleCoreMode(false)} style={{ padding: "10px 22px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)", background: "transparent", color: "#F5F5F7", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  Show the full board
                </button>
              </div>
            )}
          </main>
        </div>

        {/* SECTION GATE MODAL */}
        {gateTarget && (
          <SectionGateModal
            section={gateTarget}
            onClose={() => setGateTarget(null)}
            onUnlocked={() => { setGateTarget(null); window.location.reload(); }}
          />
        )}

        {/* EMAIL GATE */}
        <EmailGate
          isOpen={showEmailGate}
          onClose={() => setShowEmailGate(false)}
          onSubmit={({ email, firstName }) => doSave(email, firstName)}
        />
      </div>
    </BrandCtx.Provider>
  );
}
