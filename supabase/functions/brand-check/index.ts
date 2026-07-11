import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

// Brand Check: grade a draft against the board's voice system and rewrite it
// on-brand. The recurring-use engine — the board stops being documentation
// and becomes enforcement. Contract: POST { brand, draft, channel? } →
// { check: { score, verdict, violations[], strengths[], rewrite } }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

function brandCtx(b: Record<string, unknown>): string {
  const arr = (v: unknown) => Array.isArray(v) ? (v as string[]).filter(Boolean).join(" · ") : (v || "");
  return `
BRAND: ${b.brandName || "Unnamed Brand"} | ${b.industry || ""} | ${b.archetype || ""}${b.secondaryArchetype ? ` / ${b.secondaryArchetype}` : ""}
TAGLINE: ${b.tagline || ""}
ENEMY (what the brand fights): ${b.enemy || ""}
MISSION: ${b.mission || ""}
BRAND PROMISE: ${b.brandPromise || ""}
WHY DIFFERENT: ${b.whyDifferent || ""}

VOICE & LANGUAGE:
  Tone attributes: ${arr(b.toneAttributes)}
  Personality: ${arr(b.brandPersonality)}
  Register: ${b.languageRegister || "unspecified"}
  Sentence style: ${b.sentenceStyle || "unspecified"}
  Humor: ${b.humorRegister || "unspecified"}
  Person: ${b.personPreference || "unspecified"}
  Reading level: ${b.readingLevel || "unspecified"}
  Grammar rules: ${arr(b.grammarRules)}
  Jargon policy: ${b.jargonPolicy || "unspecified"}
  Capitalization: ${b.capitalizationStyle || "unspecified"}

HARD RULES (violations here are always high severity):
  Messaging dos: ${arr(b.messagingDos)}
  Messaging don'ts: ${arr(b.messagingDonts)}
  Words we always use: ${arr(b.wordsAlways)}
  Words we NEVER use: ${arr(b.wordsNever)}
  Brand never does: ${arr(b.brandNeverDoes)}
  Commandments: ${arr(b.brandCommandments)}

AUDIENCE:
  Who: ${b.audienceRole || ""} ${b.audienceAge || ""}
  Pains: ${b.audiencePains || ""}
  Goals: ${b.audienceGoals || ""}

PLATFORM VOICES:
  Instagram: ${b.voiceInstagram || ""}
  LinkedIn: ${b.voiceLinkedIn || ""}
  X/Twitter: ${b.voiceTwitter || ""}
  Email sign-off: ${b.emailSignoff || ""}
`.trim();
}

const SYSTEM_PROMPT = `You are a brand compliance editor — the person at a serious brand who reads every piece of copy before it ships and either signs off or sends it back with exact reasons. You are rigorous, specific, and constructive. You never invent rules the brand didn't set; you enforce the ones it did.

Grading standard:
- 90-100: Ships as-is. Voice, rules, and audience targeting all hold.
- 70-89: Minor friction — a word choice or register slip, nothing structural.
- 40-69: Real violations — banned words, wrong register, off-audience, or contradicts a hard rule.
- 0-39: Reads like a different company wrote it.

Violation standard: every violation must quote the exact offending text from the draft (the "evidence"), name which brand rule it breaks, and give the concrete fix. If you can't quote it, it isn't a violation.

Rewrite standard: preserve the draft's intent, structure, and factual claims. Change only what the brand system requires. The rewrite must score 90+ against the same rules. No meta-commentary — output only the rewritten copy.`;

const OUTPUT_SCHEMA = {
  type: "object",
  required: ["score", "verdict", "violations", "strengths", "rewrite"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    verdict: { type: "string", description: "One sentence: would this ship, and why/why not" },
    violations: {
      type: "array",
      items: {
        type: "object",
        required: ["rule", "evidence", "fix", "severity"],
        properties: {
          rule: { type: "string", description: "The brand rule being broken, as the brand wrote it" },
          evidence: { type: "string", description: "Exact quote from the draft" },
          fix: { type: "string", description: "The concrete replacement or change" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    strengths: { type: "array", items: { type: "string" }, description: "What the draft already gets right about the brand — quote evidence" },
    rewrite: { type: "string", description: "The full on-brand rewrite of the draft" },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { brand = {}, draft, channel } = await req.json();
    if (!draft || typeof draft !== "string" || !draft.trim()) {
      return json({ error: "Paste a draft to check." }, 400);
    }
    if (draft.length > 20000) {
      return json({ error: "Draft too long — check up to ~20,000 characters at a time." }, 400);
    }

    const userPrompt = `Check the following draft against this brand system.

## THE BRAND SYSTEM
${brandCtx(brand)}

${channel ? `## CHANNEL\nThis will be published as: ${channel}. Judge platform-appropriateness against the brand's platform voice for it.\n` : ""}
## THE DRAFT
"""
${draft}
"""

Grade it, list every real violation with quoted evidence, note what it gets right, then produce the full on-brand rewrite.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tools: [{ name: "output_brand_check", description: "Output the brand compliance check", input_schema: OUTPUT_SCHEMA }],
      tool_choice: { type: "tool", name: "output_brand_check" },
    });

    const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("Model did not return structured output");

    return json({ check: toolUse.input });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
