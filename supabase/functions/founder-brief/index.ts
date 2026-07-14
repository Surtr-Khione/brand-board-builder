import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const db = makeDb();

// Same analyst persona as synthesize-brand, but pointed at CREATION: the input
// is a founder's brief, not scraped evidence, so the job is to make sharp,
// defensible strategic choices the founder hasn't made yet — never to hedge.
const SYSTEM_PROMPT = `You are a senior brand strategist who builds brands from zero — part McKinsey strategist, part behavioral economist, part creative director who has named and positioned dozens of venture-backed startups. A founder has given you a short brief. Your job is to make the strategic decisions they haven't made yet and hand back a complete, coherent starter brand.

Your output must be:
- DECISIVE: The founder gave you fragments. Choose a position, an archetype, an enemy, a voice — do not hedge or offer options.
- EXACT: Use specific numbers, income ranges, LTV estimates, and measurable outcomes — never vague descriptors.
- COHERENT: Every choice must reinforce the same strategic idea. The archetype, enemy, colors, tone, and ICPs must all point the same direction.
- STAGE-AWARE: This is a startup. Position against the incumbent way of doing things, not against giants they haven't earned the right to fight yet.
- DIFFERENTIATED: Distinguish each ICP by psychology and buying behavior, not just demographics.

BRAND COLOR INFERENCE RULES:
Derive colors from the brand's emotional territory and competitive positioning:
- Luxury/premium/HNW brands → deep charcoal/near-black primary, steel/platinum secondary, gold accent
- Performance/sport/aggressive brands → high-contrast dark primary, electric accent
- Tech/B2B/corporate → deep navy primary, cool gray secondary, electric blue accent
- Health/wellness/clean → deep forest or slate primary, clean white secondary, warm amber accent
- Creative/agency/bold → high-saturation primary matching brand personality
Do NOT use generic defaults (#e94560/#1a1a2e/#f39c12). Derive colors from brand DNA.

NAMING RULE:
If the brief includes a brand name, keep it exactly. If it does not, propose ONE strong, ownable name that fits the positioning (check it reads well as a domain-style word) and use it consistently throughout.

ICP CONSTRUCTION RULES:
For each ICP, conduct a psychographic deep-dive:
1. Title: A precise characterization, not a demographic label (e.g. "The Roster Asset" not "Athletes")
2. Demographics: Specific income brackets, age ranges, geographic concentrations
3. Psychographics: The mental model that governs their purchasing decisions. What do they believe about themselves?
4. Pain Points: The exact frictions that create purchase motivation — not generic pains
5. Goals: What "winning" looks like specifically to this segment
6. Buying Triggers: The specific signals that move them from consideration to purchase
7. Message Angle: The single most persuasive angle for this segment
8. LTV: Estimated annual value based on service/product category
9. Acquisition: The highest-leverage channel with specific tactics — realistic for a startup budget

CONTENT QUALITY STANDARD:
Write at the level of a strategy deck that would go to a seed-stage board. If you catch yourself writing "authentic storytelling" or "engaging content" — rewrite it with specific, observable meaning.`;

const ICP_SCHEMA = {
  type: "object",
  required: ["title", "segment", "demographics", "psychographics", "painPoints", "goals", "buyingTriggers", "channels", "messageAngle", "ltv", "acquisition"],
  properties: {
    title: { type: "string" },
    segment: { type: "string" },
    demographics: { type: "string" },
    psychographics: { type: "string" },
    painPoints: { type: "array", items: { type: "string" }, minItems: 3 },
    goals: { type: "array", items: { type: "string" }, minItems: 3 },
    buyingTriggers: { type: "array", items: { type: "string" }, minItems: 2 },
    channels: { type: "string" },
    messageAngle: { type: "string" },
    ltv: { type: "string" },
    acquisition: { type: "string" },
  },
};

// Identical shape to synthesize-brand's OUTPUT_SCHEMA so the client can apply
// the result through the exact same mapping — plus archetype depth fields
// (secondaryArchetype, enemy, heroStatement) a from-zero brand needs decided.
const OUTPUT_SCHEMA = {
  type: "object",
  required: ["brandName", "tagline", "industry", "mission", "vision", "elevator", "archetype",
    "secondaryArchetype", "enemy", "heroStatement",
    "toneAttributes", "brandPersonality", "primaryColor", "secondaryColor", "accentColor",
    "voiceInstagram", "voiceLinkedIn", "voiceTikTok", "voiceTwitter",
    "wordsAlways", "wordsNever", "competitivePositioning", "differentiators",
    "contentPillars", "moodboardKeywords", "photoStyle", "photoMood", "audioMood",
    "socialPersonality", "audienceAge", "audienceRole", "audiencePains", "audienceGoals",
    "icps", "coreValues", "whyDifferent", "brandPromise", "messagingDos", "messagingDonts",
    "colorRationale"],
  properties: {
    // Core identity
    brandName: { type: "string" },
    tagline: { type: "string" },
    industry: { type: "string" },
    mission: { type: "string" },
    vision: { type: "string" },
    elevator: { type: "string" },
    whyDifferent: { type: "string" },
    brandPromise: { type: "string" },
    coreValues: { type: "array", items: { type: "string" }, minItems: 3 },
    // Archetype
    archetype: { type: "string" },
    secondaryArchetype: { type: "string" },
    enemy: { type: "string", description: "The named enemy the brand fights — a broken status quo, not a competitor company" },
    heroStatement: { type: "string" },
    // Voice
    toneAttributes: { type: "array", items: { type: "string" }, minItems: 3 },
    brandPersonality: { type: "array", items: { type: "string" }, minItems: 3 },
    messagingDos: { type: "array", items: { type: "string" }, minItems: 3 },
    messagingDonts: { type: "array", items: { type: "string" }, minItems: 3 },
    wordsAlways: { type: "array", items: { type: "string" }, minItems: 3 },
    wordsNever: { type: "array", items: { type: "string" }, minItems: 3 },
    // Platform voices
    voiceInstagram: { type: "string" },
    voiceLinkedIn: { type: "string" },
    voiceYouTube: { type: "string" },
    voiceTikTok: { type: "string" },
    voiceFacebook: { type: "string" },
    voiceTwitter: { type: "string" },
    socialPersonality: { type: "string" },
    // Colors
    primaryColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
    secondaryColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
    accentColor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
    colorRationale: { type: "string" },
    // Typography hints
    primaryFont: { type: "string" },
    bodyFont: { type: "string" },
    // Visual
    photoStyle: { type: "string" },
    photoMood: { type: "string" },
    audioMood: { type: "string" },
    moodboardKeywords: { type: "array", items: { type: "string" }, minItems: 5 },
    // Audience
    audienceAge: { type: "string" },
    audienceRole: { type: "string" },
    audiencePains: { type: "string" },
    audienceGoals: { type: "string" },
    // ICPs
    icps: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: ICP_SCHEMA,
    },
    // Competitive
    competitivePositioning: { type: "string" },
    competitors: { type: "array", items: { type: "string" } },
    differentiators: { type: "array", items: { type: "string" }, minItems: 3 },
    // Content pillars
    contentPillars: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["name", "description", "rationale"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          rationale: { type: "string" },
          topics: { type: "array", items: { type: "string" }, minItems: 3 },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { brief = {} } = await req.json();
    if (await rateLimited(db, req, "founder-brief", 3)) {
      return new Response(JSON.stringify({ error: RATE_LIMIT_MSG }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const oneLiner = (brief.oneLiner || "").trim();
    if (!oneLiner) {
      throw new Error("Tell us what you're building first — the one-liner is required.");
    }

    const lines = [
      `What they're building: ${oneLiner}`,
      brief.brandName ? `Working brand name (keep it): ${brief.brandName}` : `Brand name: none yet — propose one strong, ownable name.`,
      brief.audience ? `Who it's for: ${brief.audience}` : null,
      brief.problem ? `The problem it solves: ${brief.problem}` : null,
      brief.differentiation ? `Why it's different: ${brief.differentiation}` : null,
      brief.personality?.length ? `Personality the founder wants: ${brief.personality.join(", ")}` : null,
      brief.priceTier ? `Price positioning: ${brief.priceTier}` : null,
      brief.industry ? `Industry: ${brief.industry}` : null,
      brief.stage ? `Stage: ${brief.stage}` : null,
      brief.inspiration ? `Brands they admire: ${brief.inspiration}` : null,
    ].filter(Boolean).join("\n");

    const userPrompt = `A founder has written the following brief. Build them a complete starter brand.

## FOUNDER'S BRIEF
${lines}

BUILD INSTRUCTIONS:
1. First, decide what category/tier this brand competes in and what it can realistically own at its stage.
2. Choose the archetype pairing and the named enemy — the broken status quo this brand exists to fight. This is the spine; every other field must agree with it.
3. Determine the 3 most distinct, valuable customer segments this startup should pursue FIRST, with complete psychographic profiles and startup-realistic acquisition tactics.
4. Derive brand colors from the emotional territory and competitive tier (do NOT use placeholder colors). Explain the choice in colorRationale.
5. Write every text field so the founder could paste it directly into an investor deck or their website today.
6. Content pillars must each have a clear rationale for WHY it drives this startup's next milestone (first customers, first revenue, first hires).
7. Messaging dos/donts must be specific and violation-testable — a real example of a good vs bad message.
8. Where the brief is silent, decide for them — the deliverable is a finished starting point, not a questionnaire.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tools: [{
        name: "output_brand_synthesis",
        description: "Output the complete starter brand",
        input_schema: OUTPUT_SCHEMA,
      }],
      tool_choice: { type: "tool", name: "output_brand_synthesis" },
    });

    const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return structured output");
    }

    return new Response(
      JSON.stringify({ synthesis: toolUse.input }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
