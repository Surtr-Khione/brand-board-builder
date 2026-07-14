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

// Story types the Builder's library expects, with their display labels — the
// generate-brand fn emits { type, title, story }, the Builder wants each row
// carrying an id + human label too.
const STORY_LABELS = {
  origin: "Origin Story",
  "first-win": "First Big Win",
  failure: "Failure & Pivot",
  transformation: "Customer Transformation",
  proof: "Proof Moment",
};
const STORY_ORDER = ["origin", "first-win", "failure", "transformation", "proof"];

// Maps a Brand Generator payload (from the generate-brand fn) onto Builder
// board fields. The generator already emits camelCase matching DEFAULT_BRAND,
// so most fields pass through — this exists to (a) reshape the few structured
// fields the Builder stores differently (content pillars, ICPs, story
// library) and (b) copy scalars/arrays only when the generator actually filled
// them, so a sparse refine payload never blanks a field the founder kept.
export function mapGeneratedToBoard(g) {
  const updates = {};
  if (!g || typeof g !== "object") return updates;

  // Scalars + arrays that share the generator's name with the board field —
  // copy straight across when present and non-empty.
  const PASS_SCALARS = [
    // identity & story
    "brandName", "tagline", "industry", "mission", "vision", "elevator",
    "whyDifferent", "brandPromise",
    // archetype
    "archetype", "secondaryArchetype", "enemy", "victim", "heroStatement",
    // storybrand
    "storyGuide", "storyProblem", "storyPlan", "storyCTA", "storySuccess", "storyFailure",
    // voice
    "socialPersonality", "emailSignoff",
    // writing system
    "languageRegister", "sentenceStyle", "humorRegister", "personPreference",
    "readingLevel", "numberStyle", "capitalizationStyle", "jargonPolicy",
    // manifesto
    "controversyStance", "crisisVoice", "brandOwnedMoment",
    // platform voice
    "voiceInstagram", "voiceLinkedIn", "voiceYouTube", "voiceTikTok", "voiceFacebook", "voiceTwitter",
    // colors + modes
    "primaryColor", "secondaryColor", "accentColor",
    "lightBg", "lightSurface", "lightText", "lightSecText", "lightBorder",
    "darkBg", "darkSurface", "darkText", "darkSecText", "darkBorder",
    // typography
    "primaryFont", "secondaryFont", "bodyFont",
    // photography / logo / motion / sound
    "photoStyle", "photoMood", "photoSubjects",
    "logoDescription", "logoUsageRules", "iconStyle",
    "motionStyle", "animationSpeed", "audioMood", "soundLogo", "musicStyle",
    // accessibility
    "accessNotes", "wcagLevel",
    // sensory notes (sliders handled below)
    "brandSensoryNotes",
    // audience
    "audienceAge", "audienceRole", "audiencePains", "audienceGoals",
    // journey
    "journeyAwareness", "journeyConsideration", "journeyPurchase",
    "journeyOnboarding", "journeyRetention", "journeyAdvocacy",
    // proof
    "socialProofCriteria", "claimStandards",
    // market
    "priceTier", "marketScope", "nicheDepth", "antiPositioning", "categoryOwnership",
    // offer
    "offerLeadMagnet", "offerLeadMagnetFormat", "offerIntroOffer", "offerIntroPrice",
    "offerCoreOffer", "offerCorePrice", "offerPremiumOffer", "offerPremiumPrice",
    "offerCTA", "offerValueProp",
    // competitive
    "competitivePositioning",
    // calendar
    "contentRotation",
    "contentCadenceInstagram", "contentCadenceLinkedIn", "contentCadenceEmail", "contentCadenceTikTok",
  ];
  for (const k of PASS_SCALARS) {
    if (g[k] !== undefined && g[k] !== null && String(g[k]).trim()) updates[k] = g[k];
  }

  const PASS_ARRAYS = [
    "coreValues", "brandPersonality", "toneAttributes", "messagingDos", "messagingDonts",
    "wordsAlways", "wordsNever", "grammarRules", "brandCommandments", "brandNeverDoes",
    "moodboardKeywords", "keyProofStats", "offerUpsells", "competitors", "differentiators",
    "seasonalMoments",
  ];
  for (const k of PASS_ARRAYS) {
    if (Array.isArray(g[k]) && g[k].some((x) => String(x || "").trim())) {
      updates[k] = g[k].filter((x) => String(x || "").trim());
    }
  }

  // Numeric sliders (0-100 physics + content mix) — copy when it's a real number.
  const PASS_NUMBERS = [
    "brandSpeed", "brandWeight", "brandTemperature", "brandTexture", "brandDensity",
    "contentMixEducational", "contentMixPromotional", "contentMixEntertainment",
  ];
  for (const k of PASS_NUMBERS) {
    if (typeof g[k] === "number" && Number.isFinite(g[k])) updates[k] = g[k];
  }

  // proofHierarchy is an array of enum keys the Builder stores as-is.
  if (Array.isArray(g.proofHierarchy) && g.proofHierarchy.length) {
    updates.proofHierarchy = g.proofHierarchy.filter(Boolean);
  }

  // Content pillars — generator emits { name, description, rationale, topics },
  // Builder stores { name, description, topics, audience }; rationale → audience.
  if (Array.isArray(g.contentPillars) && g.contentPillars.length) {
    updates.contentPillars = g.contentPillars.map((p) =>
      typeof p === "string"
        ? { name: p, description: "", topics: ["", ""], audience: "" }
        : {
            name: p.name || "",
            description: p.description || "",
            topics: Array.isArray(p.topics) && p.topics.length ? p.topics : ["", ""],
            audience: p.audience || p.rationale || "",
          }
    );
  }

  // ICPs — reuse the synthesis mapper's exact shaping so a generated board and
  // a synthesized one land in identical Ideal-Customer rows.
  if (Array.isArray(g.icps) && g.icps.length) {
    updates.icps = mapSynthesisToBoard({ icps: g.icps }).icps;
  }

  // Story library — attach a stable id + display label, one row per canonical
  // type in the Builder's fixed order, so the five story slots line up.
  if (Array.isArray(g.brandStories) && g.brandStories.length) {
    const byType = new Map(
      g.brandStories.filter((s) => s && s.type).map((s) => [s.type, s])
    );
    updates.brandStories = STORY_ORDER.map((type, i) => {
      const s = byType.get(type) || {};
      return {
        id: String(i + 1),
        type,
        label: STORY_LABELS[type],
        title: s.title || "",
        story: s.story || "",
      };
    });
  }

  return updates;
}
