import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { saveBoard, loadBoard, generateBoardId } from "../lib/storage";
import { sendLeadToGHL } from "../lib/ghl";
import EmailGate from "./EmailGate";

// ═══════════════════════════════════════════════
// BRAND CONTEXT
// ═══════════════════════════════════════════════
const BrandContext = createContext();

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const PHASES = [
  { name: "Discover", color: "#e94560", sections: ["overview"] },
  { name: "Strategy", color: "#f39c12", sections: ["identity", "archetype", "storybrand", "pillars", "voice"] },
  { name: "Expression", color: "#9b59b6", sections: ["colors", "typography", "photography", "logo", "motion", "media"] },
  { name: "Govern", color: "#2e86de", sections: ["accessibility", "guidelines"] },
  { name: "Deploy", color: "#2ecc71", sections: ["score", "integrations", "export", "history"] },
];

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "◈", phase: 0 },
  { id: "identity", label: "Identity & Story", icon: "◎", phase: 1 },
  { id: "archetype", label: "Archetype", icon: "⬡", phase: 1 },
  { id: "storybrand", label: "StoryBrand Script", icon: "📖", phase: 1 },
  { id: "pillars", label: "Content Pillars", icon: "◆", phase: 1 },
  { id: "voice", label: "Voice & Messaging", icon: "❝", phase: 1 },
  { id: "colors", label: "Colors & Modes", icon: "◐", phase: 2 },
  { id: "typography", label: "Typography", icon: "Aa", phase: 2 },
  { id: "photography", label: "Photography", icon: "📷", phase: 2 },
  { id: "logo", label: "Logo & Icons", icon: "◫", phase: 2 },
  { id: "motion", label: "Motion", icon: "▸▸", phase: 2 },
  { id: "media", label: "Media & Sound", icon: "▶", phase: 2 },
  { id: "accessibility", label: "Accessibility", icon: "♿", phase: 3 },
  { id: "guidelines", label: "Custom Fields", icon: "☰", phase: 3 },
  { id: "score", label: "Brand Score", icon: "★", phase: 4 },
  { id: "integrations", label: "Integrations", icon: "🔗", phase: 4 },
  { id: "export", label: "Export", icon: "↗", phase: 4 },
];

const ARCHETYPES = [
  { name: "The Hero", desc: "Courageous, bold, transformative", color: "#C62828" },
  { name: "The Sage", desc: "Wise, knowledgeable, analytical", color: "#1565C0" },
  { name: "The Explorer", desc: "Adventurous, independent, pioneering", color: "#2E7D32" },
  { name: "The Creator", desc: "Innovative, artistic, visionary", color: "#6A1B9A" },
  { name: "The Ruler", desc: "Authoritative, refined, leading", color: "#212121" },
  { name: "The Caregiver", desc: "Nurturing, generous, compassionate", color: "#00838F" },
  { name: "The Magician", desc: "Transformative, mystical, visionary", color: "#4A148C" },
  { name: "The Rebel", desc: "Disruptive, radical, freeing", color: "#BF360C" },
  { name: "The Jester", desc: "Fun, playful, entertaining", color: "#F9A825" },
  { name: "The Lover", desc: "Passionate, intimate, sensual", color: "#AD1457" },
  { name: "The Everyman", desc: "Relatable, honest, grounded", color: "#5D4037" },
  { name: "The Innocent", desc: "Pure, optimistic, wholesome", color: "#0097A7" },
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
  primaryColor: "#e94560", secondaryColor: "#1a1a2e", accentColor: "#f39c12",
  lightBg: "#ffffff", lightSurface: "#f5f5f5", lightText: "#111111", lightSecText: "#666666", lightBorder: "#e0e0e0",
  darkBg: "#0a0a0f", darkSurface: "#13131a", darkText: "#e0e0e0", darkSecText: "#999999", darkBorder: "#2a2a35",
  lightModeEnabled: true, darkModeEnabled: true,
  photoStyle: "", photoMood: "", photoSubjects: "",
  logoDescription: "", logoUsageRules: "", iconStyle: "",
  motionStyle: "", animationSpeed: "moderate",
  audioMood: "", soundLogo: "", musicStyle: "",
  accessNotes: "", wcagLevel: "AA",
  customFields: [],
  socialPersonality: "", emailSignoff: "",
  integrations: [],
};

// ═══════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════
const TextInput = ({ label, value, onChange, hint, multiline, noAI }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
    {multiline ? (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        rows={3}
        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }}
      />
    ) : (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
      />
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
          <input type="text" value={v} onChange={(e) => update(i, e.target.value)} placeholder={hint} style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          {values.length > 1 && <button onClick={() => remove(i)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#666", cursor: "pointer", fontSize: "12px" }}>✕</button>}
        </div>
      ))}
      <button onClick={add} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(233,69,96,0.2)", background: "rgba(233,69,96,0.06)", color: "#e94560", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>+ Add</button>
    </div>
  );
};

const ColorPicker = ({ label, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
    <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} style={{ width: "36px", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", background: "transparent" }} />
    <div>
      <div style={{ fontSize: "12px", color: "#aaa" }}>{label}</div>
      <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>{value}</div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle, phase }) => {
  const p = PHASES[phase];
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: `${p.color}15`, border: `1px solid ${p.color}30`, marginBottom: "12px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "1px" }}>{p.name}</span>
      </div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>{subtitle}</p>}
    </div>
  );
};

// ═══════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════
function OverviewSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Brand Overview" subtitle="The fundamentals of your brand identity." phase={0} />
      <TextInput label="Brand Name" value={brand.brandName} onChange={(v) => update("brandName", v)} hint="Your brand or company name" />
      <TextInput label="Tagline" value={brand.tagline} onChange={(v) => update("tagline", v)} hint="A memorable phrase that captures your brand" />
      <TextInput label="Industry" value={brand.industry} onChange={(v) => update("industry", v)} hint="e.g. SaaS, E-commerce, Consulting" />
      <TextInput label="Website" value={brand.website} onChange={(v) => update("website", v)} hint="https://yourbrand.com" />
      <TextInput label="Elevator Pitch" value={brand.elevator} onChange={(v) => update("elevator", v)} hint="30-second description of what you do and why it matters" multiline />
    </div>
  );
}

function IdentitySection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Identity & Story" subtitle="Your brand's purpose, values, and differentiators." phase={1} />
      <TextInput label="Mission" value={brand.mission} onChange={(v) => update("mission", v)} hint="Why does your brand exist? What change do you drive?" multiline />
      <TextInput label="Vision" value={brand.vision} onChange={(v) => update("vision", v)} hint="Where is your brand headed? The future you're building." multiline />
      <ArrayInput label="Core Values" values={brand.coreValues} onChange={(v) => update("coreValues", v)} hint="e.g. Integrity, Innovation, Empathy" />
      <TextInput label="Why We're Different" value={brand.whyDifferent} onChange={(v) => update("whyDifferent", v)} hint="What sets you apart from every competitor?" multiline />
      <TextInput label="Brand Promise" value={brand.brandPromise} onChange={(v) => update("brandPromise", v)} hint="The one commitment you always deliver on" multiline />
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
      <TextInput label="Brand Enemy" value={brand.enemy} onChange={(v) => update("enemy", v)} hint="What does your brand stand against? The status quo you're fighting." multiline />
      <TextInput label="Ideal Customer (The Victim)" value={brand.victim} onChange={(v) => update("victim", v)} hint="Who is suffering from the problem your brand solves?" multiline />
      <TextInput label="Hero Statement" value={brand.heroStatement} onChange={(v) => update("heroStatement", v)} hint="How does your customer become the hero through your brand?" multiline />
      <ArrayInput label="Personality Traits" values={brand.brandPersonality} onChange={(v) => update("brandPersonality", v)} hint="e.g. Bold, Witty, Authoritative" />
    </div>
  );
}

function StoryBrandSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="StoryBrand Script" subtitle="Your brand narrative following the StoryBrand framework." phase={1} />
      <TextInput label="The Guide (Your Brand)" value={brand.storyGuide} onChange={(v) => update("storyGuide", v)} hint="How does your brand show empathy and authority?" multiline />
      <TextInput label="The Problem" value={brand.storyProblem} onChange={(v) => update("storyProblem", v)} hint="External, internal, and philosophical problems your customer faces" multiline />
      <TextInput label="The Plan" value={brand.storyPlan} onChange={(v) => update("storyPlan", v)} hint="The simple steps you offer (3-step process)" multiline />
      <TextInput label="Call to Action" value={brand.storyCTA} onChange={(v) => update("storyCTA", v)} hint="The direct and transitional CTAs" />
      <TextInput label="Success (What life looks like after)" value={brand.storySuccess} onChange={(v) => update("storySuccess", v)} hint="Paint the picture of transformation" multiline />
      <TextInput label="Failure (What happens if they don't act)" value={brand.storyFailure} onChange={(v) => update("storyFailure", v)} hint="The stakes — what's at risk" multiline />
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#f39c12" }}>Pillar {i + 1}</span>
            {brand.contentPillars.length > 1 && <button onClick={() => update("contentPillars", brand.contentPillars.filter((_, x) => x !== i))} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: "14px" }}>✕</button>}
          </div>
          <TextInput label="Pillar Name" value={p.name} onChange={(v) => updatePillar(i, "name", v)} hint="e.g. Leadership, Innovation" />
          <TextInput label="Description" value={p.description} onChange={(v) => updatePillar(i, "description", v)} hint="What this pillar covers" multiline />
        </div>
      ))}
      <button onClick={addPillar} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(233,69,96,0.2)", background: "rgba(233,69,96,0.06)", color: "#e94560", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>+ Add Pillar</button>
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
      <TextInput label="Social Media Personality" value={brand.socialPersonality} onChange={(v) => update("socialPersonality", v)} hint="How does the brand behave on social?" multiline />
      <TextInput label="Email Sign-off Style" value={brand.emailSignoff} onChange={(v) => update("emailSignoff", v)} hint="e.g. Warm regards, Keep building, Cheers" />
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
            <button onClick={() => update("lightModeEnabled", !brand.lightModeEnabled)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", background: brand.lightModeEnabled ? "#2ecc71" : "#555", color: "#fff", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>{brand.lightModeEnabled ? "ON" : "OFF"}</button>
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
            <button onClick={() => update("darkModeEnabled", !brand.darkModeEnabled)} style={{ padding: "4px 12px", borderRadius: "20px", border: "none", background: brand.darkModeEnabled ? "#2ecc71" : "#555", color: "#fff", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>{brand.darkModeEnabled ? "ON" : "OFF"}</button>
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

function PhotographySection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Photography Style" subtitle="Visual direction for photos and imagery." phase={2} />
      <TextInput label="Photo Style" value={brand.photoStyle} onChange={(v) => update("photoStyle", v)} hint="e.g. Candid, editorial, minimalist, vibrant" multiline />
      <TextInput label="Mood / Feeling" value={brand.photoMood} onChange={(v) => update("photoMood", v)} hint="e.g. Warm, aspirational, gritty, clean" />
      <TextInput label="Preferred Subjects" value={brand.photoSubjects} onChange={(v) => update("photoSubjects", v)} hint="e.g. People, workspaces, nature, products" />
    </div>
  );
}

function LogoSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Logo & Icons" subtitle="Logo guidelines and icon system." phase={2} />
      <TextInput label="Logo Description" value={brand.logoDescription} onChange={(v) => update("logoDescription", v)} hint="Describe your logo and its meaning" multiline />
      <TextInput label="Logo Usage Rules" value={brand.logoUsageRules} onChange={(v) => update("logoUsageRules", v)} hint="Minimum sizes, clear space, backgrounds, etc." multiline />
      <TextInput label="Icon Style" value={brand.iconStyle} onChange={(v) => update("iconStyle", v)} hint="e.g. Outlined, filled, duotone, rounded" />
    </div>
  );
}

function MotionSection({ brand, update }) {
  return (
    <div>
      <SectionHeader title="Motion & Animation" subtitle="How your brand moves." phase={2} />
      <TextInput label="Motion Style" value={brand.motionStyle} onChange={(v) => update("motionStyle", v)} hint="e.g. Smooth easing, bouncy, minimal, cinematic" multiline />
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Animation Speed</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["subtle", "moderate", "energetic"].map((s) => (
          <button key={s} onClick={() => update("animationSpeed", s)} style={{
            padding: "8px 18px", borderRadius: "8px", cursor: "pointer", textTransform: "capitalize",
            border: brand.animationSpeed === s ? "1px solid #e94560" : "1px solid rgba(255,255,255,0.06)",
            background: brand.animationSpeed === s ? "rgba(233,69,96,0.1)" : "transparent",
            color: brand.animationSpeed === s ? "#e94560" : "#999", fontSize: "13px",
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
      <TextInput label="Audio Mood" value={brand.audioMood} onChange={(v) => update("audioMood", v)} hint="e.g. Uplifting, ambient, high-energy" />
      <TextInput label="Sound Logo / Audio Signature" value={brand.soundLogo} onChange={(v) => update("soundLogo", v)} hint="Describe your sonic identity" multiline />
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
            border: brand.wcagLevel === l ? "1px solid #2e86de" : "1px solid rgba(255,255,255,0.06)",
            background: brand.wcagLevel === l ? "rgba(46,134,222,0.1)" : "transparent",
            color: brand.wcagLevel === l ? "#2e86de" : "#999", fontSize: "13px", fontWeight: 600,
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
          <input type="text" value={f.label} onChange={(e) => updateField(i, "label", e.target.value)} placeholder="Field name" style={{ width: "35%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          <input type="text" value={f.value} onChange={(e) => updateField(i, "value", e.target.value)} placeholder="Value" style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e0e0e0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          <button onClick={() => update("customFields", brand.customFields.filter((_, x) => x !== i))} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#666", cursor: "pointer" }}>✕</button>
        </div>
      ))}
      <button onClick={addField} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(233,69,96,0.2)", background: "rgba(233,69,96,0.06)", color: "#e94560", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>+ Add Field</button>
    </div>
  );
}

function ScoreSection({ brand }) {
  const fields = Object.entries(brand).filter(([k]) => k !== "customFields" && k !== "contentPillars" && k !== "integrations");
  const filled = fields.filter(([, v]) => {
    if (Array.isArray(v)) return v.some((x) => typeof x === "string" ? x.trim() : x);
    if (typeof v === "boolean") return true;
    return v && String(v).trim();
  }).length;
  const score = Math.round((filled / fields.length) * 100);
  const color = score > 75 ? "#2ecc71" : score > 40 ? "#f39c12" : "#e94560";
  return (
    <div>
      <SectionHeader title="Brand Score" subtitle="How complete is your brand identity?" phase={4} />
      <div style={{ textAlign: "center", padding: "30px" }}>
        <div style={{ fontSize: "64px", fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif" }}>{score}%</div>
        <div style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>{filled} of {fields.length} fields completed</div>
        <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", marginTop: "16px", overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.5s" }} />
        </div>
      </div>
    </div>
  );
}

function ExportSection({ brand, onSave }) {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(brand, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `${(brand.brandName || "brand").toLowerCase().replace(/\s+/g, "-")}-brand-board.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <div>
      <SectionHeader title="Export & Save" subtitle="Download your brand board or save it online." phase={4} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button onClick={onSave} style={{ padding: "14px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #e94560, #c62a42)", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          💾 Save & Get Shareable Link
        </button>
        <button onClick={exportJSON} style={{ padding: "14px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#ccc", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          📄 Export as JSON (for LLMs)
        </button>
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
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [boardId, setBoardId] = useState(initialBoardId || null);
  const [email, setEmail] = useState(null);
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(!!initialBoardId);
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});

  // Load existing board if boardId provided
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

  const update = useCallback((key, value) => {
    setBrand((prev) => ({ ...prev, [key]: value }));
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
    setShowEmailGate(false);

    const url = `${window.location.origin}/board/${newBoardId}`;
    setShareUrl(url);

    // Send lead to GHL
    await sendLeadToGHL({
      email: userEmail,
      firstName: firstName || "",
      boardId: newBoardId,
      boardUrl: url,
    });
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Track active section on scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      for (const s of SECTIONS) {
        const el = sectionRefs.current[s.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 200) {
            setActiveSection(s.id);
            break;
          }
        }
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Progress
  const fields = Object.entries(brand).filter(([k]) => !["customFields", "contentPillars", "integrations", "lightModeEnabled", "darkModeEnabled"].includes(k));
  const filled = fields.filter(([, v]) => {
    if (Array.isArray(v)) return v.some((x) => typeof x === "string" ? x.trim() : x);
    return v && String(v).trim();
  }).length;
  const progress = Math.round((filled / fields.length) * 100);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>Loading brand board...</div>
        </div>
      </div>
    );
  }

  const renderSection = (id) => {
    const map = {
      overview: <OverviewSection brand={brand} update={update} />,
      identity: <IdentitySection brand={brand} update={update} />,
      archetype: <ArchetypeSection brand={brand} update={update} />,
      storybrand: <StoryBrandSection brand={brand} update={update} />,
      pillars: <PillarsSection brand={brand} update={update} />,
      voice: <VoiceSection brand={brand} update={update} />,
      colors: <ColorsSection brand={brand} update={update} />,
      typography: <TypographySection brand={brand} update={update} />,
      photography: <PhotographySection brand={brand} update={update} />,
      logo: <LogoSection brand={brand} update={update} />,
      motion: <MotionSection brand={brand} update={update} />,
      media: <MediaSection brand={brand} update={update} />,
      accessibility: <AccessibilitySection brand={brand} update={update} />,
      guidelines: <CustomFieldsSection brand={brand} update={update} />,
      score: <ScoreSection brand={brand} />,
      export: <ExportSection brand={brand} onSave={handleSave} />,
    };
    return map[id] || null;
  };

  return (
    <BrandContext.Provider value={{ brand }}>
      <div style={{ height: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* HEADER */}
        <header style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(10,10,15,0.97)", backdropFilter: "blur(12px)", flexShrink: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "linear-gradient(135deg, #e94560, #c62a42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff" }}>B</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>Brand Board Builder</div>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "1.5px", textTransform: "uppercase" }}>AI-Powered Enterprise</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #e94560, #f39c12)", transition: "width 0.5s" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#666" }}>{progress}%</span>
            </div>
            <button onClick={handleSave} style={{ padding: "6px 16px", borderRadius: "7px", cursor: "pointer", background: saved ? "rgba(46,204,113,0.15)" : "rgba(255,255,255,0.06)", border: saved ? "1px solid rgba(46,204,113,0.3)" : "1px solid rgba(255,255,255,0.08)", color: saved ? "#2ecc71" : "#aaa", fontSize: "12px", fontWeight: 500, transition: "all 0.3s" }}>
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </header>

        {/* SHARE URL BANNER */}
        {shareUrl && (
          <div style={{ padding: "10px 24px", background: "rgba(46,204,113,0.08)", borderBottom: "1px solid rgba(46,204,113,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: "13px", color: "#2ecc71" }}>Your board is live at: <strong>{shareUrl}</strong></span>
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(46,204,113,0.3)", background: "transparent", color: "#2ecc71", fontSize: "12px", cursor: "pointer" }}>Copy Link</button>
          </div>
        )}

        {/* BODY */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* SIDEBAR */}
          <nav style={{ width: "220px", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", padding: "16px 0", flexShrink: 0 }}>
            {PHASES.map((phase, pi) => (
              <div key={pi}>
                <div style={{ padding: "8px 20px", fontSize: "10px", fontWeight: 700, color: phase.color, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: pi > 0 ? "8px" : 0 }}>{phase.name}</div>
                {SECTIONS.filter((s) => s.phase === pi).map((s) => (
                  <button key={s.id} onClick={() => scrollToSection(s.id)} style={{
                    display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 20px",
                    border: "none", cursor: "pointer", fontSize: "13px", textAlign: "left",
                    background: activeSection === s.id ? "rgba(233,69,96,0.08)" : "transparent",
                    color: activeSection === s.id ? "#e94560" : "#888",
                    borderLeft: activeSection === s.id ? "2px solid #e94560" : "2px solid transparent",
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: "14px", width: "20px" }}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* MAIN CONTENT */}
          <main ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
            {SECTIONS.map((s) => (
              <div key={s.id} ref={(el) => (sectionRefs.current[s.id] = el)} style={{ marginBottom: "48px", maxWidth: "700px" }}>
                {renderSection(s.id)}
              </div>
            ))}
          </main>
        </div>

        {/* EMAIL GATE */}
        <EmailGate
          isOpen={showEmailGate}
          onClose={() => setShowEmailGate(false)}
          onSubmit={({ email, firstName }) => doSave(email, firstName)}
        />
      </div>
    </BrandContext.Provider>
  );
}
