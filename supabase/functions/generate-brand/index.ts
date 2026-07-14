import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// The Brand Generator: a chat prompt in, a COMPLETE brand out — every field
// the Builder's 31 sections can hold. Two things separate this from
// founder-brief:
//   1. Depth — founder-brief fills the strategic core; this fills the whole
//      board (StoryBrand, manifesto, writing system, journey, proof, market,
//      offer ladder, story library, calendar, sensory, visual system, modes).
//   2. Grounding — before generating, it pulls the closest-matching brands
//      from the public_brands library (85 deeply-enriched world-class brands)
//      and hands the strategist their distilled patterns as reference. Learn
//      from the masters, never copy them.
//
// WHY FIVE PARALLEL PASSES: a Supabase edge function has a hard 150s wall-clock
// limit (exceed it and you get a 546). One call generating the entire board
// runs well past that. Splitting the board into five DISJOINT field-groups and
// running them concurrently makes wall time ≈ the slowest single group (~60-90s)
// instead of the sum. Each group's schema also stays small enough for the model
// to fill every field with care. Refine mode is a single small call (it returns
// only the handful of fields the founder asked to change).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const db = makeDb();

// ───────────────────────────── exemplar retrieval ─────────────────────────────

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "with", "that", "this", "from", "into",
  "brand", "company", "startup", "business", "make", "build", "create", "want",
  "need", "help", "like", "new", "our", "their", "them", "they", "its", "it's",
  "who", "what", "how", "will", "can", "you", "your", "about", "of", "to", "in",
  "on", "is", "are", "be", "we", "i", "my", "me", "us", "at", "by", "as", "it",
]);

function keywordsFrom(text: string): string[] {
  return [...new Set(
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )].slice(0, 10);
}

// Compact columns that let the strategist "read" a reference brand deeply
// without blowing the prompt budget (~250 tokens per exemplar).
const EXEMPLAR_COLS = [
  "slug", "brand_name", "industry", "archetype", "secondary_archetype",
  "tagline", "mission", "brand_promise", "why_different", "enemy",
  "enemy_description", "tone_attributes", "do_say", "dont_say",
  "primary_color", "secondary_color", "accent_color", "color_usage_rules",
  "photo_style", "sb_one_liner", "social_personality",
].join(",");

type ExemplarRow = Record<string, unknown> & { slug: string; brand_name: string };

async function retrieveExemplars(prompt: string): Promise<ExemplarRow[]> {
  const bySlug = new Map<string, ExemplarRow>();
  try {
    const kws = keywordsFrom(prompt);
    if (kws.length) {
      const { data } = await db.from("public_brands")
        .select(EXEMPLAR_COLS)
        .textSearch("fts", kws.join(" or "), { type: "websearch", config: "english" })
        .limit(4);
      for (const b of (data || []) as ExemplarRow[]) bySlug.set(b.slug, b);
    }
  } catch { /* retrieval is best-effort — the doctrine block still grounds the model */ }
  try {
    const { data } = await db.from("public_brands")
      .select(EXEMPLAR_COLS).eq("is_featured", true).limit(8);
    for (const b of (data || []) as ExemplarRow[]) {
      if (bySlug.size >= 7) break;
      if (!bySlug.has(b.slug)) bySlug.set(b.slug, b);
    }
  } catch { /* same */ }
  return [...bySlug.values()].slice(0, 7);
}

function exemplarBrief(b: ExemplarRow): string {
  const arr = (v: unknown) => Array.isArray(v) && v.length ? (v as string[]).slice(0, 5).join("; ") : null;
  const lines = [
    `### ${b.brand_name} (${b.industry || "—"})`,
    b.archetype ? `Archetype: ${b.archetype}${b.secondary_archetype ? ` / ${b.secondary_archetype}` : ""}` : null,
    b.tagline ? `Tagline: "${b.tagline}"` : null,
    b.sb_one_liner ? `One-liner: ${b.sb_one_liner}` : null,
    b.enemy ? `Named enemy: ${b.enemy}${b.enemy_description ? ` — ${b.enemy_description}` : ""}` : null,
    b.brand_promise ? `Promise: ${b.brand_promise}` : null,
    b.why_different ? `Differentiation: ${b.why_different}` : null,
    arr(b.tone_attributes) ? `Voice: ${arr(b.tone_attributes)}` : null,
    arr(b.do_say) ? `Does say: ${arr(b.do_say)}` : null,
    arr(b.dont_say) ? `Never says: ${arr(b.dont_say)}` : null,
    b.primary_color ? `Color system: ${b.primary_color} / ${b.secondary_color || "—"} / ${b.accent_color || "—"}${b.color_usage_rules ? ` — ${b.color_usage_rules}` : ""}` : null,
    b.photo_style ? `Photography: ${b.photo_style}` : null,
    b.social_personality ? `Social behavior: ${b.social_personality}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

// ───────────────────────────── prompts ─────────────────────────────

// What actually separates the world's best brands, distilled from studying
// them — this stays true even when retrieval returns nothing.
const MASTER_DOCTRINE = `WHAT THE WORLD'S BEST BRANDS DO (apply these patterns, never copy their surface):
1. OWN ONE IDEA. Volvo owns "safety," Apple owns "creative liberation," Patagonia owns "the planet before profit." Every great brand can be reduced to one word or phrase it owns in the customer's head. The brand's ONE idea drives every field — make each choice defend that territory.
2. NAME AN ENEMY BIGGER THAN A COMPETITOR. Apple fought conformity, not Microsoft. Nike fights the voice that says "you can't," not Adidas. The enemy is a broken status quo, a cultural force, a costly old way — naming it makes the brand a movement.
3. THE CUSTOMER IS THE HERO. The brand is the guide with a plan (StoryBrand). Nike never says "our shoes are great"; it says "you are an athlete." Write every message so the customer stars in it.
4. CODIFY THE VOICE UNTIL A STRANGER COULD WRITE IT. Great voice guides are violation-testable: exact words banned, exact registers set, real do/don't examples. Vague adjectives ("authentic," "engaging") are failure.
5. DISTINCTIVE ASSETS COMPOUND. One owned color (Tiffany blue, Coca-Cola red), one typographic behavior, one photographic signature, repeated for decades. Choose assets a competitor would feel embarrassed to imitate.
6. COHERENCE BEATS CLEVERNESS. Every element — archetype, enemy, palette, tone, offer, journey — must point the same direction. A luxury palette with a jokey voice is two brands fighting. When in doubt, sacrifice a good idea for a coherent one.
7. SENSORY CONSISTENCY. The best brands feel the same at every touchpoint: speed, weight, temperature. Apple is slow/heavy/cool/smooth; Red Bull is fast/light/hot/rough. Set the physics and let every channel obey them.`;

const STANDARDS = `Your output must be:
- DECISIVE: Choose a position, an archetype, an enemy, a voice — never hedge or offer options.
- EXACT: Specific numbers, income ranges, LTV estimates, measurable outcomes — never vague descriptors.
- COHERENT: Every choice reinforces the same strategic idea across all sections.
- VIOLATION-TESTABLE: Rules a stranger could apply. If you catch yourself writing "authentic storytelling" or "engaging content," rewrite it with specific, observable meaning.
- PASTE-READY: Every text field good enough to go straight into an investor deck or live website today.`;

// The five create passes each cover a DISJOINT slice of the board. Every pass
// shares the same brief and reference brands, so their independent decisions
// stay coherent around one strategic idea. This block tells a pass which slice
// it owns and reminds it the rest is being decided in parallel.
function systemPrompt(exemplars: ExemplarRow[], focus: string): string {
  const refBlock = exemplars.length
    ? `\n\nREFERENCE BRANDS — the closest world-class brands to this assignment, deeply studied. Absorb their PATTERNS (how archetype, enemy, voice, and color reinforce one strategic idea). Do NOT copy their taglines, hex codes, or phrasing — the goal is a brand this strong, not a costume of one. If the founder explicitly asks to model after a specific brand, lean on that one's patterns hardest.\n\n${exemplars.map(exemplarBrief).join("\n\n")}`
    : "";
  return `You are a senior brand strategist who has studied the world's greatest brands deeply — part McKinsey strategist, part behavioral economist, part creative director who has named and positioned dozens of category winners. You build complete, board-ready brands from a founder's prompt.

${focus}

${STANDARDS}

${MASTER_DOCTRINE}

BRAND COLOR RULES:
Derive colors from emotional territory and competitive position — luxury/premium → deep charcoal + platinum + gold; performance/aggressive → high-contrast dark + electric accent; tech/B2B → deep navy + cool gray + electric blue; health/wellness → deep forest/slate + clean white + warm amber; creative/bold → high-saturation primary matching personality. NEVER placeholder defaults (#e94560/#1a1a2e/#f39c12 or #1d1d1f/#f5f5f7/#0071e3). Light/dark mode surfaces must harmonize with the palette (tinted neutrals, not pure #000/#fff unless the brand demands it).

NAMING RULE:
If a brand name is given, keep it exactly. Otherwise propose ONE strong, ownable name that reads well as a domain-style word.${refBlock}`;
}

// ───────────────────────────── schema helpers ─────────────────────────────

const S = { type: "string" } as const;
const HEX = { type: "string", pattern: "^#[0-9a-fA-F]{6}$" } as const;
const ARR = (min: number) => ({ type: "array", items: S, minItems: min });
const SLIDER = { type: "integer", minimum: 0, maximum: 100 };

const ICP_SCHEMA = {
  type: "object",
  required: ["title", "segment", "demographics", "psychographics", "painPoints", "goals", "buyingTriggers", "channels", "messageAngle", "ltv", "acquisition"],
  properties: {
    title: { ...S, description: "Precise characterization, not a demographic label — e.g. 'The Roster Asset', not 'Athletes'" },
    segment: S, demographics: S,
    psychographics: { ...S, description: "The mental model governing their purchase decisions — what they believe about themselves" },
    painPoints: ARR(3), goals: ARR(3), buyingTriggers: ARR(2),
    channels: S, messageAngle: S, ltv: S,
    acquisition: { ...S, description: "Highest-leverage channel with specific tactics, realistic for the brand's stage" },
  },
};

// One object schema per field, so a pass schema is just "pick the fields I own,
// mark them all required." Split this way so no single Anthropic call generates
// enough output to approach the 150s edge-function wall-clock limit.
const PROPS: Record<string, unknown> = {
  assistantReply: { ...S, description: "3-6 sentences to the founder, plain and confident: the single idea this brand owns, the archetype+enemy choice and why, and which reference-brand patterns informed the build. No markdown headers." },
  // identity & story
  brandName: S, tagline: S, industry: S, mission: S, vision: S,
  elevator: { ...S, description: "The 30-second pitch, ~60-90 words" },
  coreValues: ARR(3), whyDifferent: S, brandPromise: S,
  archetype: { ...S, description: "One of the 12 Jungian archetypes: The Innocent, The Explorer, The Sage, The Hero, The Outlaw/Rebel, The Magician, The Everyman, The Lover, The Jester, The Caregiver, The Creator, The Ruler" },
  secondaryArchetype: S,
  enemy: { ...S, description: "The named enemy — a broken status quo or cultural force, never a competitor company" },
  victim: { ...S, description: "Who suffers while the enemy reigns — the customer before the brand arrives" },
  heroStatement: { ...S, description: "One sentence casting the CUSTOMER as the hero and the brand as the guide" },
  brandPersonality: ARR(4),
  storyGuide: { ...S, description: "StoryBrand: how the brand shows up as the guide — empathy + authority" },
  storyProblem: { ...S, description: "StoryBrand: the external, internal, and philosophical problem in one tight paragraph" },
  storyPlan: { ...S, description: "StoryBrand: the simple 3-step plan the guide hands the hero" },
  storyCTA: { ...S, description: "StoryBrand: the direct call to action (plus the transitional one)" },
  storySuccess: { ...S, description: "StoryBrand: life after — what winning looks like" },
  storyFailure: { ...S, description: "StoryBrand: the cost of doing nothing" },
  // voice & writing & manifesto
  toneAttributes: { ...ARR(4), description: "4+ tone attributes, each a word plus a short qualifier that makes it testable" },
  messagingDos: { ...ARR(3), description: "Violation-testable rules, each with a real example message" },
  messagingDonts: { ...ARR(3), description: "Violation-testable rules, each with a real example of the banned move" },
  wordsAlways: ARR(3), wordsNever: ARR(3),
  voiceInstagram: S, voiceLinkedIn: S, voiceYouTube: S, voiceTikTok: S, voiceFacebook: S, voiceTwitter: S,
  socialPersonality: S,
  emailSignoff: { ...S, description: "The brand's standard email sign-off line" },
  languageRegister: { ...S, description: "e.g. 'Plain-spoken professional — 8th-grade clarity carrying expert-grade substance'" },
  sentenceStyle: S, humorRegister: S,
  personPreference: { ...S, description: "First/second person usage rule, e.g. 'Always you-first; we only when taking responsibility'" },
  readingLevel: S, numberStyle: S, capitalizationStyle: S, jargonPolicy: S,
  grammarRules: ARR(2),
  brandCommandments: { type: "array", items: S, minItems: 5, maxItems: 5, description: "The 5 brand commandments — imperative, specific, ownable" },
  brandNeverDoes: ARR(2),
  controversyStance: { ...S, description: "Where the brand takes a public stand and where it stays silent" },
  crisisVoice: S,
  brandOwnedMoment: { ...S, description: "The cultural moment or ritual this brand owns" },
  // visual system
  primaryColor: HEX, secondaryColor: HEX, accentColor: HEX, colorRationale: S,
  lightBg: HEX, lightSurface: HEX, lightText: HEX, lightSecText: HEX, lightBorder: HEX,
  darkBg: HEX, darkSurface: HEX, darkText: HEX, darkSecText: HEX, darkBorder: HEX,
  primaryFont: { ...S, description: "Google-Fonts-available typeface for headlines" },
  secondaryFont: S,
  bodyFont: { ...S, description: "Google-Fonts-available typeface for body text" },
  photoStyle: S, photoMood: S, photoSubjects: S,
  logoDescription: { ...S, description: "Creative direction for the logo — form, weight, geometry, what it must communicate" },
  logoUsageRules: S, iconStyle: S,
  motionStyle: S,
  animationSpeed: { type: "string", enum: ["slow", "moderate", "fast"] },
  audioMood: S, soundLogo: S, musicStyle: S,
  accessNotes: S,
  wcagLevel: { type: "string", enum: ["A", "AA", "AAA"] },
  brandSpeed: { ...SLIDER, description: "0 = deliberate/slow, 100 = instant/kinetic" },
  brandWeight: { ...SLIDER, description: "0 = featherlight, 100 = monumental" },
  brandTemperature: { ...SLIDER, description: "0 = cool/precise, 100 = hot/passionate" },
  brandTexture: { ...SLIDER, description: "0 = polished smooth, 100 = raw/gritty" },
  brandDensity: { ...SLIDER, description: "0 = minimal/air, 100 = maximal/rich" },
  brandSensoryNotes: S,
  moodboardKeywords: ARR(5),
  // audience & journey
  audienceAge: S, audienceRole: S, audiencePains: S, audienceGoals: S,
  icps: { type: "array", minItems: 3, maxItems: 3, items: ICP_SCHEMA },
  journeyAwareness: S, journeyConsideration: S, journeyPurchase: S,
  journeyOnboarding: S, journeyRetention: S, journeyAdvocacy: S,
  // market, proof, offer, competitive, pillars, stories, calendar
  proofHierarchy: {
    type: "array", minItems: 3, maxItems: 8,
    items: { type: "string", enum: ["data-research", "case-study", "testimonials", "expert-endorsement", "press-awards", "live-demo", "before-after", "certification"] },
    description: "Evidence types ranked strongest-first for THIS brand's category",
  },
  keyProofStats: { ...ARR(3), description: "Proof statistics to build toward — realistic targets phrased as claims, e.g. '94% customer retention'" },
  socialProofCriteria: S, claimStandards: S,
  priceTier: { type: "string", enum: ["Budget", "Mid-market", "Premium", "Luxury"] },
  marketScope: S, nicheDepth: S,
  antiPositioning: { ...S, description: "Who this brand is deliberately NOT for and what it refuses to be" },
  categoryOwnership: { ...S, description: "The category or sub-category this brand intends to own — name it like a category king would" },
  offerLeadMagnet: S, offerLeadMagnetFormat: S,
  offerIntroOffer: S, offerIntroPrice: S,
  offerCoreOffer: S, offerCorePrice: S,
  offerPremiumOffer: S, offerPremiumPrice: S,
  offerUpsells: ARR(2), offerCTA: S, offerValueProp: S,
  competitivePositioning: S, competitors: ARR(2), differentiators: ARR(3),
  contentPillars: {
    type: "array", minItems: 3,
    items: {
      type: "object",
      required: ["name", "description", "rationale", "topics"],
      properties: {
        name: S, description: S,
        rationale: { ...S, description: "WHY this pillar drives the brand's next milestone" },
        topics: ARR(3),
      },
    },
  },
  brandStories: {
    type: "array", minItems: 5, maxItems: 5,
    items: {
      type: "object",
      required: ["type", "title", "story"],
      properties: {
        type: { type: "string", enum: ["origin", "first-win", "failure", "transformation", "proof"] },
        title: S,
        story: { ...S, description: "80-150 words in the brand's own voice: Setup → Conflict → Resolution → Lesson. For a new brand, write the truest version available today (the founding insight, the first believer, the pivot) — never fabricate named customers or fake numbers." },
      },
    },
    description: "Exactly one story of each type: origin, first-win, failure, transformation, proof",
  },
  contentMixEducational: SLIDER, contentMixPromotional: SLIDER, contentMixEntertainment: SLIDER,
  contentRotation: S, seasonalMoments: ARR(3),
  contentCadenceInstagram: S, contentCadenceLinkedIn: S, contentCadenceEmail: S, contentCadenceTikTok: S,
};

function schemaFor(keys: string[]) {
  return {
    type: "object",
    required: keys,
    properties: Object.fromEntries(keys.map((k) => [k, PROPS[k]])),
  };
}

// The five disjoint create passes. Balanced so the heaviest (icps, stories)
// don't share a pass, keeping each call's output well under the wall-clock cap.
const PASSES = [
  {
    key: "identity",
    focus: "In THIS pass you decide the brand's IDENTITY & STORY SPINE: name, tagline, industry, mission, vision, elevator pitch, core values, differentiation, promise, the archetype pairing, the named enemy and its victim, the hero statement, brand personality, and the full StoryBrand script. This spine is the brand — the parallel passes deciding voice, visuals, and go-to-market will build on it, so make the archetype and enemy unmistakable.",
    keys: ["assistantReply", "brandName", "tagline", "industry", "mission", "vision", "elevator",
      "coreValues", "whyDifferent", "brandPromise", "archetype", "secondaryArchetype", "enemy",
      "victim", "heroStatement", "brandPersonality", "storyGuide", "storyProblem", "storyPlan",
      "storyCTA", "storySuccess", "storyFailure"],
    maxTokens: 6000,
  },
  {
    key: "voice",
    focus: "In THIS pass you codify the brand's VOICE, WRITING SYSTEM, and MANIFESTO: tone attributes, do/don't messaging rules (with real example messages), always/never words, per-platform voice, social personality, email sign-off, the writing system (register, sentence style, humor, person, reading level, number/capitalization style, jargon policy, grammar rules), and the manifesto (5 commandments, red lines, controversy stance, crisis voice, owned cultural moment). A parallel pass is naming the brand — if unsure of the name, write voice rules that don't depend on it.",
    keys: ["toneAttributes", "messagingDos", "messagingDonts", "wordsAlways", "wordsNever",
      "voiceInstagram", "voiceLinkedIn", "voiceYouTube", "voiceTikTok", "voiceFacebook", "voiceTwitter",
      "socialPersonality", "emailSignoff", "languageRegister", "sentenceStyle", "humorRegister",
      "personPreference", "readingLevel", "numberStyle", "capitalizationStyle", "jargonPolicy",
      "grammarRules", "brandCommandments", "brandNeverDoes", "controversyStance", "crisisVoice", "brandOwnedMoment"],
    maxTokens: 6000,
  },
  {
    key: "visual",
    focus: "In THIS pass you design the brand's VISUAL & SENSORY SYSTEM: the three-color system with rationale, harmonized light-mode and dark-mode surface palettes, typography (headline/secondary/body typefaces available on Google Fonts), photography direction, logo creative direction and usage, icon style, motion style and speed, sonic identity, accessibility standard, the five sensory-physics sliders (speed, weight, temperature, texture, density) with notes, and moodboard keywords. Derive every choice from the brand's emotional territory — a parallel pass owns the strategy, so make the visuals obey the same one idea.",
    keys: ["primaryColor", "secondaryColor", "accentColor", "colorRationale",
      "lightBg", "lightSurface", "lightText", "lightSecText", "lightBorder",
      "darkBg", "darkSurface", "darkText", "darkSecText", "darkBorder",
      "primaryFont", "secondaryFont", "bodyFont", "photoStyle", "photoMood", "photoSubjects",
      "logoDescription", "logoUsageRules", "iconStyle", "motionStyle", "animationSpeed",
      "audioMood", "soundLogo", "musicStyle", "accessNotes", "wcagLevel",
      "brandSpeed", "brandWeight", "brandTemperature", "brandTexture", "brandDensity", "brandSensoryNotes", "moodboardKeywords"],
    maxTokens: 5000,
  },
  {
    key: "audience",
    focus: "In THIS pass you profile the brand's AUDIENCE & JOURNEY: the target audience (age, role, pains, goals), THREE distinct ideal customer profiles (each a full psychographic deep-dive with startup-realistic acquisition tactics — distinguish them by psychology and buying behavior, not just demographics), and the customer's emotional journey across awareness, consideration, purchase, onboarding, retention, and advocacy (what they FEEL at each stage and the brand's move).",
    keys: ["audienceAge", "audienceRole", "audiencePains", "audienceGoals", "icps",
      "journeyAwareness", "journeyConsideration", "journeyPurchase",
      "journeyOnboarding", "journeyRetention", "journeyAdvocacy"],
    maxTokens: 6000,
  },
  {
    key: "market",
    focus: "In THIS pass you build the brand's GO-TO-MARKET ENGINE: proof architecture (ranked evidence hierarchy, target proof stats, social-proof criteria, claim standards), market position (price tier, scope, niche depth, anti-positioning, the category it intends to own), the full offer ladder (lead magnet → intro → core → premium, each with a price, plus upsells, CTA, value prop), the competitive frame, content pillars (each with a rationale), the five canonical brand stories, and the content calendar (mix, rotation, seasonal moments, per-platform cadence).",
    keys: ["proofHierarchy", "keyProofStats", "socialProofCriteria", "claimStandards",
      "priceTier", "marketScope", "nicheDepth", "antiPositioning", "categoryOwnership",
      "offerLeadMagnet", "offerLeadMagnetFormat", "offerIntroOffer", "offerIntroPrice",
      "offerCoreOffer", "offerCorePrice", "offerPremiumOffer", "offerPremiumPrice",
      "offerUpsells", "offerCTA", "offerValueProp",
      "competitivePositioning", "competitors", "differentiators", "contentPillars", "brandStories",
      "contentMixEducational", "contentMixPromotional", "contentMixEntertainment",
      "contentRotation", "seasonalMoments",
      "contentCadenceInstagram", "contentCadenceLinkedIn", "contentCadenceEmail", "contentCadenceTikTok"],
    maxTokens: 6000,
  },
];

// Refine — every board field allowed, only the reply required.
const REFINE_SCHEMA = {
  type: "object",
  required: ["assistantReply"],
  properties: PROPS,
};
const REFINE_FOCUS = "You are refining an EXISTING brand in conversation with its founder. You will receive the full current brand and the conversation. Return ONLY the fields you are changing (plus assistantReply) — leave everything you aren't changing out of the output entirely. Keep every change coherent with the fields you aren't touching, unless the founder asked for a direction change big enough that dependent fields must move together (then change them together).";

// ───────────────────────────── generation ─────────────────────────────

type Msg = { role: "user" | "assistant"; content: string };

async function callStrategist(system: string, messages: Msg[], schema: object, maxTokens: number) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages,
    tools: [{ name: "output_brand", description: "Output the brand decisions for this pass", input_schema: schema }],
    tool_choice: { type: "tool", name: "output_brand" },
  });
  const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("Model did not return structured output");
  return toolUse.input as Record<string, unknown>;
}

const CREATE_INSTRUCTIONS = `Build your assigned slice of the brand from the founder's prompt above.
1. Anchor to the brand's ONE ownable idea, its archetype pairing, and its named enemy — every field you write must agree with them.
2. Fill EVERY field in your schema with finished, specific work — the deliverable is a complete brand operating system, not a questionnaire.
3. Where the prompt is silent, decide for them, decisively.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages = [], currentBrand = null } = await req.json();
    const userMsgs = (messages as Msg[]).filter((m) => m?.content && (m.role === "user" || m.role === "assistant"));
    const lastUser = [...userMsgs].reverse().find((m) => m.role === "user");
    if (!lastUser || !lastUser.content.trim()) {
      throw new Error("Describe the brand you want first — one real sentence is enough.");
    }

    if (await rateLimited(db, req, "generate-brand", 10)) {
      return new Response(JSON.stringify({ error: RATE_LIMIT_MSG }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isRefine = Boolean(currentBrand && Object.keys(currentBrand).length);
    const exemplars = await retrieveExemplars(userMsgs.filter((m) => m.role === "user").map((m) => m.content).join(" "));
    const exemplarNames = exemplars.map((b) => ({ name: b.brand_name, slug: b.slug }));

    if (!isRefine) {
      // CREATE — five disjoint passes in parallel; wall time ≈ slowest pass.
      const brief: Msg[] = [{ role: "user", content: `## FOUNDER'S PROMPT\n${lastUser.content.trim()}\n\n${CREATE_INSTRUCTIONS}` }];
      const results = await Promise.all(
        PASSES.map((p) => callStrategist(systemPrompt(exemplars, p.focus), brief, schemaFor(p.keys), p.maxTokens)),
      );
      const merged = Object.assign({}, ...results); // disjoint keys — order-independent
      const { assistantReply, ...brand } = merged;
      return new Response(
        JSON.stringify({ brand, reply: assistantReply, exemplars: exemplarNames }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // REFINE — full conversation + current brand, sparse updates back.
    const convo: Msg[] = [
      { role: "user", content: `## CURRENT BRAND (full state)\n${JSON.stringify(currentBrand)}\n\n## CONVERSATION\nThe founder's messages follow. Apply their latest request.` },
      ...userMsgs,
    ];
    const result = await callStrategist(systemPrompt(exemplars, REFINE_FOCUS), convo, REFINE_SCHEMA, 8000);
    const { assistantReply, ...updates } = result;
    return new Response(
      JSON.stringify({ brand: { ...currentBrand, ...updates }, reply: assistantReply, changed: Object.keys(updates), exemplars: exemplarNames }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
