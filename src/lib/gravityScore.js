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

const SIGNALS = [
  { label: "Archetype defined", weight: 10, test: (b) => has(b, "archetype") },
  { label: "Secondary archetype or a named enemy", weight: 10, test: (b) => has(b, "secondaryArchetype", "brand_data.secondaryArchetype", "enemy", "brand_data.enemy") },
  { label: "Mission or vision", weight: 10, test: (b) => has(b, "mission", "vision") },
  { label: "Tagline or elevator pitch", weight: 10, test: (b) => has(b, "tagline", "elevator", "brand_data.elevatorPitch", "elevatorPitch") },
  { label: "Voice defined (2+ tone attributes)", weight: 10, test: (b) => toneCount(b) >= 2 },
  { label: "Full color system (primary, secondary, accent)", weight: 10, test: (b) =>
      has(b, "primary_color", "primaryColor") && has(b, "secondary_color", "secondaryColor") && has(b, "accent_color", "accentColor") },
  { label: "Typography defined", weight: 10, test: (b) => has(b, "primary_font", "primaryFont") },
  { label: "Messaging rules (do/don't say)", weight: 10, test: (b) =>
      has(b, "brand_data.doSay", "brand_data.dontSay", "messagingDos", "messagingDonts") },
  { label: "Content pillars or audience", weight: 10, test: (b) => has(b, "brand_data.contentPillars", "contentPillars", "audience", "icps") },
  { label: "Manifesto or core values", weight: 10, test: (b) => has(b, "brand_data.manifesto", "brand_data.coreValues", "coreValues") },
];

export function computeGravityScore(brand) {
  const signals = SIGNALS.map((s) => ({ label: s.label, weight: s.weight, met: Boolean(s.test(brand)) }));
  const score = signals.reduce((sum, s) => sum + (s.met ? s.weight : 0), 0);
  const missing = signals.filter((s) => !s.met).map((s) => s.label);
  return { score, signals, missing };
}

export function gravityScoreColor(score) {
  if (score >= 75) return "#2ecc71";
  if (score >= 40) return "#f39c12";
  return "#0071E3";
}
