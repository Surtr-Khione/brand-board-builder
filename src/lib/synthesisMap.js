// Maps a synthesis payload (from synthesize-brand or founder-brief — both
// return the same shape) onto Builder board fields. Shared so a brand seeded
// from a founder's brief lands in the exact same fields as one synthesized
// from scanned sources.
export function mapSynthesisToBoard(s) {
  const updates = {};
  if (!s) return updates;

  // Core scalar fields
  for (const k of [
    "brandName", "tagline", "industry", "elevator", "mission", "vision",
    "brandPromise", "whyDifferent", "archetype", "secondaryArchetype",
    "enemy", "heroStatement", "socialPersonality", "photoStyle", "photoMood",
    "audioMood", "competitivePositioning",
  ]) {
    if (s[k]) updates[k] = s[k];
  }

  // Arrays
  for (const k of [
    "coreValues", "toneAttributes", "brandPersonality", "messagingDos",
    "messagingDonts", "wordsAlways", "wordsNever", "differentiators",
    "moodboardKeywords", "competitors",
  ]) {
    if (s[k]?.some(Boolean)) updates[k] = s[k];
  }

  // Platform voices
  for (const k of ["voiceInstagram", "voiceLinkedIn", "voiceYouTube", "voiceTikTok", "voiceFacebook", "voiceTwitter"]) {
    if (s[k]) updates[k] = s[k];
  }

  // Audience
  for (const k of ["audienceAge", "audienceRole", "audiencePains", "audienceGoals"]) {
    if (s[k]) updates[k] = s[k];
  }

  // Colors — only when the synthesis derived real ones
  for (const k of ["primaryColor", "secondaryColor", "accentColor"]) {
    if (s[k]) updates[k] = s[k];
  }

  // Typography hints
  if (s.primaryFont) updates.primaryFont = s.primaryFont;
  if (s.bodyFont) updates.bodyFont = s.bodyFont;

  // Content pillars (structured)
  if (s.contentPillars?.length) {
    updates.contentPillars = s.contentPillars.map((p) =>
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

  return updates;
}
