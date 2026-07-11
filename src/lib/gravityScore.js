// A brand's Gravity Score measures how much of a real, coherent identity
// exists — not just how many form fields got filled in. Works against
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

function has(brand, ...keys) {
  for (const k of keys) {
    const v = k.includes(".") ? k.split(".").reduce((o, p) => o?.[p], brand) : brand?.[k];
    if (Array.isArray(v)) { if (v.some(truthyItem)) return true; continue; }
    if (v !== undefined && v !== null && String(v).trim()) return true;
  }
  return false;
}

function countTruthy(v) {
  if (!Array.isArray(v)) return 0;
  return v.filter((x) => (typeof x === "string" ? x.trim() : x)).length;
}

function toneCount(brand) {
  const a = brand?.tone_attributes || brand?.toneAttributes;
  return countTruthy(a);
}

// The Builder pre-fills every new board with a placeholder palette. A color
// system only counts as "defined" once the user (or a scan/synthesis) has
// actually chosen it — an untouched default triplet scores zero, otherwise
// empty boards start with +10 for a decision nobody made. Both the current
// neutral triplet and the legacy red/navy/orange one are treated as unset.
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

// sectionId points at the Builder section that closes the gap; fix is the
// action phrased for a roadmap ("do this next"), not a report ("this is missing").
const SIGNALS = [
  { label: "Archetype defined", weight: 10, sectionId: "archetype", fix: "Pick the archetype your brand plays", test: (b) => has(b, "archetype") },
  { label: "Secondary archetype or a named enemy", weight: 10, sectionId: "archetype", fix: "Name the enemy your brand fights", test: (b) => has(b, "secondaryArchetype", "brand_data.secondaryArchetype", "enemy", "brand_data.enemy") },
  { label: "Mission or vision", weight: 10, sectionId: "identity", fix: "Write your mission or vision", test: (b) => has(b, "mission", "vision") },
  { label: "Tagline or elevator pitch", weight: 10, sectionId: "overview", fix: "Nail a tagline or elevator pitch", test: (b) => has(b, "tagline", "elevator", "brand_data.elevatorPitch", "elevatorPitch") },
  { label: "Voice defined (2+ tone attributes)", weight: 10, sectionId: "voice", fix: "Define at least two tone attributes", test: (b) => toneCount(b) >= 2 },
  { label: "Full color system (primary, secondary, accent)", weight: 10, sectionId: "colors", fix: "Choose your three-color system", test: colorsChosen },
  { label: "Typography defined", weight: 10, sectionId: "typography", fix: "Choose your primary typeface", test: (b) => has(b, "primary_font", "primaryFont") },
  { label: "Messaging rules (do/don't say)", weight: 10, sectionId: "voice", fix: "Set your do-say / don't-say rules", test: (b) =>
      has(b, "brand_data.doSay", "brand_data.dontSay", "messagingDos", "messagingDonts",
          "do_say", "dont_say", "brand_data.messagingDos", "brand_data.messagingDonts") },
  { label: "Content pillars or audience", weight: 10, sectionId: "pillars", fix: "Define content pillars or your audience", test: (b) =>
      has(b, "brand_data.contentPillars", "contentPillars", "audience", "icps",
          "brand_data.audienceRole", "brand_data.audiencePains", "brand_data.icps", "audienceRole", "audiencePains") },
  { label: "Manifesto or core values", weight: 10, sectionId: "identity", fix: "Write your core values", test: (b) => has(b, "brand_data.manifesto", "brand_data.coreValues", "coreValues") },
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
