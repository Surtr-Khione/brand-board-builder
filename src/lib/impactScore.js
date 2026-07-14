// Impact Score measures real-world scale — social reach, organic traffic,
// ad presence, and GEO (AI-answer visibility) — as a counterpart to the
// Gravity Score's measure of strategic coherence. Quality vs. quantity.
//
// BrandMD has no live connections to social platforms, ad-intelligence
// tools, or traffic estimators — this is intentionally a "bring your own
// numbers" model. Users plug in figures from their own Similarweb,
// SEMrush, Meta/TikTok/LinkedIn analytics, etc. Nothing here is verified
// or fetched automatically.

function logPoints(value, cap, maxPoints) {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  const ratio = Math.log10(v + 1) / Math.log10(cap + 1);
  return Math.max(0, Math.min(maxPoints, ratio * maxPoints));
}

export const GEO_LEVELS = [
  { value: 0, label: "Not mentioned", hint: "Ask ChatGPT or Perplexity “what's the best [your category] brand” — you don't come up." },
  { value: 1, label: "Rarely mentioned", hint: "Shows up occasionally, usually buried in a longer list." },
  { value: 2, label: "Sometimes mentioned", hint: "Comes up in a fair number of relevant queries." },
  { value: 3, label: "Consistently mentioned", hint: "Reliably named alongside category leaders." },
  { value: 4, label: "Actively recommended", hint: "AI answers tend to recommend you specifically, not just list you." },
];

export function computeImpactScore(integrations = {}) {
  const socialReach =
    (Number(integrations.instagramFollowers) || 0) +
    (Number(integrations.tiktokFollowers) || 0) +
    (Number(integrations.linkedinFollowers) || 0) +
    (Number(integrations.xFollowers) || 0);

  const socialPoints = logPoints(socialReach, 1_000_000_000, 40);
  const trafficPoints = logPoints(integrations.monthlyOrganicTraffic, 500_000_000, 30);
  const adPoints = logPoints(integrations.adSpendEstimate, 1_000_000_000, 15);
  const geoPoints = Math.min(15, (Number(integrations.geoVisibilityRating) || 0) * 3.75);

  const score = Math.round(socialPoints + trafficPoints + adPoints + geoPoints);
  const hasData =
    socialReach > 0 ||
    Number(integrations.monthlyOrganicTraffic) > 0 ||
    Number(integrations.adSpendEstimate) > 0 ||
    Number(integrations.geoVisibilityRating) > 0;

  return {
    score,
    hasData,
    breakdown: [
      { label: "Social reach", points: Math.round(socialPoints), max: 40 },
      { label: "Organic traffic", points: Math.round(trafficPoints), max: 30 },
      { label: "Ad presence", points: Math.round(adPoints), max: 15 },
      { label: "AI visibility (GEO)", points: Math.round(geoPoints), max: 15 },
    ],
  };
}

export function impactScoreColor(score) {
  if (score >= 65) return "#2ecc71";
  if (score >= 30) return "#f39c12";
  return "#0071E3";
}
