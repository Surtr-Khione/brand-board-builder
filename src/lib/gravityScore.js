// A brand's Gravity Score measures how much of a real, coherent identity
// exists — not just how many form fields got filled in. Works against
// both a live Builder board (camelCase) and a public library row
// (snake_case columns + brand_data JSONB) via the same resolver, so the
// same number means the same thing everywhere it's shown.

function has(brand, ...keys) {
  for (const k of keys) {
    const v = k.includes(".") ? k.split(".").reduce((o, p) => o?.[p], brand) : brand?.[k];
    if (Array.isArray(v)) { if (v.some((x) => (typeof x === "string" ? x.trim() : x))) return true; continue; }
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

// sectionId points at the Builder section that closes the gap; fix is the
// action phrased for a roadmap ("do this next"), not a report ("this is missing").
const SIGNALS = [
  { label: "Archetype defined", weight: 10, sectionId: "archetype", fix: "Pick the archetype your brand plays", test: (b) => has(b, "archetype") },
  { label: "Secondary archetype or a named enemy", weight: 10, sectionId: "archetype", fix: "Name the enemy your brand fights", test: (b) => has(b, "secondaryArchetype", "brand_data.secondaryArchetype", "enemy", "brand_data.enemy") },
  { label: "Mission or vision", weight: 10, sectionId: "identity", fix: "Write your mission or vision", test: (b) => has(b, "mission", "vision") },
  { label: "Tagline or elevator pitch", weight: 10, sectionId: "overview", fix: "Nail a tagline or elevator pitch", test: (b) => has(b, "tagline", "elevator", "brand_data.elevatorPitch", "elevatorPitch") },
  { label: "Voice defined (2+ tone attributes)", weight: 10, sectionId: "voice", fix: "Define at least two tone attributes", test: (b) => toneCount(b) >= 2 },
  { label: "Full color system (primary, secondary, accent)", weight: 10, sectionId: "colors", fix: "Complete your three-color system", test: (b) =>
      has(b, "primary_color", "primaryColor") && has(b, "secondary_color", "secondaryColor") && has(b, "accent_color", "accentColor") },
  { label: "Typography defined", weight: 10, sectionId: "typography", fix: "Choose your primary typeface", test: (b) => has(b, "primary_font", "primaryFont") },
  { label: "Messaging rules (do/don't say)", weight: 10, sectionId: "voice", fix: "Set your do-say / don't-say rules", test: (b) =>
      has(b, "brand_data.doSay", "brand_data.dontSay", "messagingDos", "messagingDonts") },
  { label: "Content pillars or audience", weight: 10, sectionId: "pillars", fix: "Define content pillars or your audience", test: (b) => has(b, "brand_data.contentPillars", "contentPillars", "audience", "icps") },
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
