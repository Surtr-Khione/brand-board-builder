// Gravity v2 — how much of a real, coherent, documented identity exists.
// Nineteen graded signals across identity, positioning, message, voice,
// visual system, and audience — depth counts (four tone attributes score
// more than two; do AND don't rules are separate points), so scores spread
// instead of clustering the way v1's ten binary signals did. Works against
// both a live Builder board (camelCase) and a public library row
// (snake_case columns + brand_data JSONB) via the same resolver, so the
// same number means the same thing everywhere it's shown.

// An array item only counts if it carries real content — the Builder
// initializes lists with empty strings and empty-field objects
// (e.g. contentPillars: [{ name: "", … }]), which must not score.
const STRUCTURAL_KEYS = new Set(["id", "type", "label"]);
function truthyItem(x) {
  if (typeof x === "string") return Boolean(x.trim());
  if (x && typeof x === "object") {
    return Object.entries(x).some(([k, v]) => !STRUCTURAL_KEYS.has(k) && truthyItem(v));
  }
  return Boolean(x);
}

function get(brand, key) {
  return key.includes(".") ? key.split(".").reduce((o, p) => o?.[p], brand) : brand?.[key];
}

function has(brand, ...keys) {
  for (const k of keys) {
    const v = get(brand, k);
    if (Array.isArray(v)) { if (v.some(truthyItem)) return true; continue; }
    if (v !== undefined && v !== null && String(v).trim()) return true;
  }
  return false;
}

// Count real items across the first key that resolves to an array
function countOf(brand, ...keys) {
  for (const k of keys) {
    const v = get(brand, k);
    if (Array.isArray(v)) return v.filter(truthyItem).length;
  }
  return 0;
}

// The Builder pre-fills every new board with a placeholder palette. A color
// system only counts as "defined" once someone actually chose it.
const PLACEHOLDER_PALETTES = [
  ["#1d1d1f", "#f5f5f7", "#0071e3"],
  ["#e94560", "#1a1a2e", "#f39c12"],
];
function colorsChosen(b) {
  const pc = b?.primary_color || b?.primaryColor;
  const sc = b?.secondary_color || b?.secondaryColor;
  const ac = b?.accent_color || b?.accentColor;
  if (!pc || !sc || !ac) return false;
  const trip = [pc, sc, ac].map((c) => String(c).toLowerCase());
  return !PLACEHOLDER_PALETTES.some((p) => p.every((c, i) => c === trip[i]));
}

const toneCount = (b) => countOf(b, "tone_attributes", "toneAttributes", "brand_data.toneAttributes");

// sectionId points at the Builder section that closes the gap; fix is the
// action phrased for a roadmap ("do this next"), not a report.
const SIGNALS = [
  // Identity core
  { label: "Mission", weight: 5, sectionId: "identity", fix: "Write your mission",
    test: (b) => has(b, "mission", "brand_data.mission") },
  { label: "Vision", weight: 5, sectionId: "identity", fix: "Write your vision",
    test: (b) => has(b, "vision", "brand_data.vision") },
  { label: "Core values (3+)", weight: 5, sectionId: "identity", fix: "Commit to at least three core values",
    test: (b) => countOf(b, "core_values", "coreValues", "brand_data.coreValues") >= 3 },
  // Positioning
  { label: "Primary archetype", weight: 5, sectionId: "archetype", fix: "Pick the archetype your brand plays",
    test: (b) => has(b, "archetype", "brand_data.archetype") },
  { label: "Secondary archetype or named enemy", weight: 5, sectionId: "archetype", fix: "Name the enemy your brand fights",
    test: (b) => has(b, "secondaryArchetype", "secondary_archetype", "brand_data.secondaryArchetype", "enemy", "brand_data.enemy") },
  { label: "Differentiation", weight: 5, sectionId: "competitive", fix: "State why you, not the incumbent way",
    test: (b) => has(b, "whyDifferent", "why_different", "brand_data.whyDifferent", "competitivePositioning", "brand_data.competitivePositioning", "brand_data.differentiators", "competitor_diff") },
  // Message
  { label: "Tagline", weight: 5, sectionId: "overview", fix: "Nail your signature line",
    test: (b) => has(b, "tagline", "brand_data.tagline") },
  { label: "Elevator pitch", weight: 5, sectionId: "overview", fix: "Write the 30-second version",
    test: (b) => has(b, "elevator", "brand_data.elevator", "brand_data.elevatorPitch", "elevatorPitch") },
  { label: "Do-say rules (2+)", weight: 5, sectionId: "voice", fix: "Set your do-say rules",
    test: (b) => countOf(b, "do_say", "messagingDos", "brand_data.messagingDos", "brand_data.doSay") >= 2 },
  { label: "Don't-say rules (2+)", weight: 5, sectionId: "voice", fix: "Set your don't-say rules",
    test: (b) => countOf(b, "dont_say", "messagingDonts", "brand_data.messagingDonts", "brand_data.dontSay") >= 2 },
  // Voice
  { label: "Voice basics (2+ tone attributes)", weight: 5, sectionId: "voice", fix: "Define at least two tone attributes",
    test: (b) => toneCount(b) >= 2 },
  { label: "Voice depth (4+ tone attributes)", weight: 5, sectionId: "voice", fix: "Deepen the voice to four tone attributes",
    test: (b) => toneCount(b) >= 4 },
  { label: "Personality traits (3+)", weight: 5, sectionId: "archetype", fix: "Name three personality traits",
    test: (b) => countOf(b, "brand_personality", "brandPersonality", "brand_data.brandPersonality") >= 3 },
  { label: "Social or platform voice", weight: 5, sectionId: "socialvoice", fix: "Describe how the brand behaves on social",
    test: (b) => has(b, "socialPersonality", "social_personality", "brand_data.socialPersonality", "voiceInstagram", "brand_data.voiceInstagram", "voiceLinkedIn", "brand_data.voiceLinkedIn") },
  // Visual system
  { label: "Full color system", weight: 10, sectionId: "colors", fix: "Choose your three-color system", test: colorsChosen },
  { label: "Typography", weight: 5, sectionId: "typography", fix: "Choose your primary typeface",
    test: (b) => has(b, "primary_font", "primaryFont", "brand_data.primaryFont") },
  { label: "Photography direction", weight: 5, sectionId: "photography", fix: "Set the photography direction",
    test: (b) => has(b, "photoStyle", "photo_style", "brand_data.photoStyle", "photoMood", "brand_data.photoMood") },
  // Audience
  { label: "Audience or ICPs", weight: 5, sectionId: "audience", fix: "Define who this is for",
    test: (b) => has(b, "audience", "audienceRole", "audiencePains", "brand_data.audienceRole", "brand_data.audiencePains", "icps", "brand_data.icps") },
  { label: "Content pillars", weight: 5, sectionId: "pillars", fix: "Define your content pillars",
    test: (b) => has(b, "contentPillars", "content_pillars", "brand_data.contentPillars") },
];

export function computeGravityScore(brand) {
  const signals = SIGNALS.map((s) => ({
    label: s.label, weight: s.weight, sectionId: s.sectionId, fix: s.fix,
    met: Boolean(s.test(brand)),
  }));
  const score = signals.reduce((sum, s) => sum + (s.met ? s.weight : 0), 0);
  const missing = signals.filter((s) => !s.met).map((s) => s.label);
  // Same gaps as `missing`, but as actionable roadmap steps with the Builder
  // section that closes each one.
  const roadmap = signals.filter((s) => !s.met).map(({ label, weight, sectionId, fix }) => ({ label, weight, sectionId, fix }));
  return { score, signals, missing, roadmap };
}

export function gravityScoreColor(score) {
  if (score >= 75) return "#2ecc71";
  if (score >= 40) return "#f39c12";
  return "#0071E3";
}
