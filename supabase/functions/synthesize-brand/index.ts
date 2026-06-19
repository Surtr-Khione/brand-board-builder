import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

const SYSTEM_PROMPT = `You are a senior brand intelligence analyst — part McKinsey strategist, part behavioral economist, part investigative journalist. You synthesize brand signals across multiple sources into board-level strategic intelligence.

Your analysis must be:
- EXACT: Use specific numbers, income ranges, LTV estimates, and measurable outcomes — never vague descriptors
- INVESTIGATIVE: Cross-reference sources for contradictions between what a brand says and what it shows
- PRECISE: Every claim must be grounded in observable evidence from the source data
- REVEALING: Identify non-obvious insights a CMO would find surprising and actionable
- DIFFERENTIATED: Distinguish each ICP by psychology and buying behavior, not just demographics

BRAND COLOR INFERENCE RULES:
Derive colors from the brand's actual emotional territory and competitive positioning:
- Luxury/premium/HNW brands → deep charcoal/near-black primary, steel/platinum secondary, gold accent
- Performance/sport/aggressive brands → high-contrast dark primary, electric accent
- Tech/B2B/corporate → deep navy primary, cool gray secondary, electric blue accent
- Health/wellness/clean → deep forest or slate primary, clean white secondary, warm amber accent
- Creative/agency/bold → high-saturation primary matching brand personality
Do NOT use generic defaults (#e94560/#1a1a2e/#f39c12). Derive colors from brand DNA.

ICP CONSTRUCTION RULES:
For each ICP, conduct a psychographic deep-dive:
1. Title: A precise characterization, not a demographic label (e.g. "The Roster Asset" not "Athletes")
2. Demographics: Specific income brackets, age ranges, geographic concentrations — cite the data
3. Psychographics: The mental model that governs their purchasing decisions. What do they believe about themselves?
4. Pain Points: The exact frictions that create purchase motivation — not generic pains
5. Goals: What "winning" looks like specifically to this segment
6. Buying Triggers: The specific signals that move them from consideration to purchase
7. Message Angle: The single most persuasive angle for this segment
8. LTV: Estimated annual value based on service/product category
9. Acquisition: The highest-leverage channel with specific tactics

CONTENT QUALITY STANDARD:
Write at the level of a strategy deck that would go to a Series B board. If you catch yourself writing "authentic storytelling" or "engaging content" — rewrite it with specific, observable meaning.`;

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

const OUTPUT_SCHEMA = {
  type: "object",
  required: ["brandName", "tagline", "industry", "mission", "vision", "elevator", "archetype",
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
    const { sources = [], existingBrand = {} } = await req.json();

    // Build detailed source summaries for analysis
    const sourceSummaries = sources
      .filter((s: { data?: { meta?: unknown; analysis?: unknown } }) => s.data?.meta || s.data?.analysis)
      .map((s: {
        type: string;
        url?: string;
        data: {
          meta?: {
            name?: string;
            description?: string;
            keywords?: string;
            industry?: string;
            specialties?: string;
            founded?: string;
            employees?: string;
          };
          analysis?: {
            voiceAnalysis?: string;
            toneAttributes?: string[];
            contentPillars?: string[];
            audienceSignals?: string;
            personalitySignals?: string;
            colorSignals?: unknown;
          };
          colors?: Array<{ role: string; color: string }>;
          fonts?: unknown;
        };
      }) => {
        const meta = s.data.meta || {};
        const analysis = s.data.analysis || {};
        return `
## SOURCE: ${s.type.toUpperCase()} — ${s.url || "uploaded file"}

EXTRACTED DATA:
- Name: ${meta.name || "not found"}
- Description: ${meta.description || "not found"}
- Keywords/Topics: ${meta.keywords || "not found"}
- Industry: ${meta.industry || "not found"}
- Specialties: ${meta.specialties || "not found"}
- Founded: ${meta.founded || "not found"}
- Team Size: ${meta.employees || "not found"}

AI ANALYSIS:
- Voice Analysis: ${analysis.voiceAnalysis || "not found"}
- Tone Attributes: ${(analysis.toneAttributes || []).join(", ") || "not found"}
- Content Pillars: ${(analysis.contentPillars || []).join(", ") || "not found"}
- Audience Signals: ${analysis.audienceSignals || "not found"}
- Personality Signals: ${analysis.personalitySignals || "not found"}
${s.data.colors ? `- Visual Colors Detected: ${JSON.stringify(s.data.colors.slice(0, 5))}` : ""}
`;
      }).join("\n\n---\n\n");

    if (!sourceSummaries) {
      throw new Error("No analyzable source data found. Scan at least one source first.");
    }

    const existingContext = existingBrand?.brandName
      ? `\n\nEXISTING BRAND DATA (use as additional context, override where sources provide better data):\n${JSON.stringify(existingBrand, null, 2)}`
      : "";

    const userPrompt = `Conduct a deep brand intelligence analysis on the following source data and synthesize a complete, precise brand profile.

${sourceSummaries}${existingContext}

ANALYSIS INSTRUCTIONS:
1. First, identify what category/tier of brand this is: luxury/premium, mid-market, mass-market, B2B, B2C, DTC, etc.
2. Identify the brand's actual competitive moat — what they uniquely do or own
3. Determine the 3 most distinct, valuable customer segments with complete psychographic profiles
4. Derive brand colors from the emotional territory and competitive tier (do NOT use placeholder colors)
5. Write every text field as if it will be placed directly into an investor deck or board strategy presentation
6. Content pillars must each have a clear rationale for WHY it drives the brand's business objective
7. Messaging dos/donts must be specific and violation-testable — a real example of a good vs bad message

For ICPs specifically: each must be meaningfully different from the others in buying psychology and acquisition approach, not just demographics.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tools: [{
        name: "output_brand_synthesis",
        description: "Output the complete brand intelligence synthesis",
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
