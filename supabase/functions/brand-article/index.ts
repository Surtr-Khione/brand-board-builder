import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Content engine: writes a journal breakdown of a library brand from its
// board data — "how this brand holds together" — for the SEO/blog surface.
// POST { brand } → { article: { title, dek, paragraphs[] } }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const db = makeDb();

const SCHEMA = {
  type: "object",
  required: ["title", "dek", "paragraphs"],
  properties: {
    title: { type: "string", description: "Editorial headline, 6-11 words, names the brand, no colon-cliché" },
    dek: { type: "string", description: "One-sentence standfirst, max 28 words" },
    paragraphs: { type: "array", minItems: 5, maxItems: 7, items: { type: "string" }, description: "90-130 words each, magazine register" },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { brand = {} } = await req.json();
    if (!brand.brand_name) return json({ error: "brand required" }, 400);
    if (await rateLimited(db, req, "brand-article", 4)) return json({ error: RATE_LIMIT_MSG }, 429);

    const bd = brand.brand_data || {};
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      system: `You write for the BrandMD Journal — a brand-strategy publication in the register of a good design magazine: precise, warm, zero listicle energy, no "in today's world". Each piece explains how a famous brand holds together as a SYSTEM, grounded strictly in the provided board data. Teach through the example: a founder should finish knowing one thing to copy. Never invent facts about the company's business; analyze only the brand system given. End the final paragraph by turning the lens on the reader's own brand (one sentence, no hard sell).`,
      messages: [{
        role: "user",
        content: `Write the breakdown for ${brand.brand_name}.

BOARD DATA:
Archetype: ${brand.archetype}${brand.secondary_archetype ? " / " + brand.secondary_archetype : ""}
Enemy: ${brand.enemy || bd.enemy || ""}
Tagline: ${brand.tagline || ""}
Mission: ${brand.mission || ""}
Values: ${(brand.core_values || bd.coreValues || []).join("; ")}
Tone: ${(brand.tone_attributes || []).join("; ")}
Do-say: ${(brand.do_say || bd.messagingDos || []).join("; ")}
Don't-say: ${(brand.dont_say || bd.messagingDonts || []).join("; ")}
Differentiation: ${brand.why_different || bd.whyDifferent || ""}
Colors: ${brand.primary_color} / ${brand.secondary_color} / ${brand.accent_color}${bd.colorRationale ? " — " + bd.colorRationale : ""}
Positioning: ${bd.competitivePositioning || ""}`,
      }],
      tools: [{ name: "output_article", description: "The journal article", input_schema: SCHEMA }],
      tool_choice: { type: "tool", name: "output_article" },
    });
    const t = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!t || t.type !== "tool_use") throw new Error("no article");
    return json({ article: t.input });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
