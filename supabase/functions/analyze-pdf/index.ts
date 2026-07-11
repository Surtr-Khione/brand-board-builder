import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// PDF import: read an existing brand guide / style guide / pitch deck and
// extract the brand system from it — the on-ramp for companies that already
// HAVE guidelines and want them as a living board. Rebuilt 2026-07-11 (the
// original deployed version's source was never committed and is lost).
// Contract with BrandIntelligence: POST { fileBase64, fileName } → { analysis, meta }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const db = makeDb();

const OUTPUT_SCHEMA = {
  type: "object",
  required: ["voiceAnalysis", "toneAttributes", "contentPillars", "audienceSignals", "personalitySignals"],
  properties: {
    voiceAnalysis: { type: "string", description: "How this brand's voice is defined in the document — register, rhythm, rules" },
    toneAttributes: { type: "array", items: { type: "string" }, description: "Tone words stated or strongly implied by the document" },
    contentPillars: { type: "array", items: { type: "string" }, description: "Recurring themes/topics the document commits the brand to" },
    audienceSignals: { type: "string", description: "Who the document says (or shows) the brand is for" },
    personalitySignals: { type: "string", description: "Personality traits stated or expressed by the document's own design and language" },
    colorSignals: { type: "array", items: { type: "object", properties: { role: { type: "string" }, color: { type: "string" } } }, description: "Brand colors specified in the document as hex where given" },
    name: { type: "string", description: "The brand's name" },
    description: { type: "string", description: "One-paragraph summary of what the brand is" },
    industry: { type: "string" },
    tagline: { type: "string" },
    archetype: { type: "string", description: "Best-fit Jungian archetype based on the document, e.g. 'The Hero'" },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { fileBase64, fileName } = await req.json();
    if (!fileBase64 || typeof fileBase64 !== "string") return json({ error: "No file received." }, 400);
    // ~15MB base64 ≈ 11MB file — Claude's PDF limit territory
    if (fileBase64.length > 15_000_000) return json({ error: "PDF too large — 10MB max." }, 400);

    if (await rateLimited(db, req, "analyze-pdf", 6)) return json({ error: RATE_LIMIT_MSG }, 429);

    const data = fileBase64.replace(/^data:application\/pdf;base64,/, "");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: "You are a brand analyst reading a company document (brand guide, style guide, pitch deck, one-pager). Extract the brand system it defines or reveals. Report only what the document supports — never invent specifics it doesn't contain.",
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
          { type: "text", text: `Analyze this document (${fileName || "uploaded PDF"}) and extract the brand system it defines.` },
        ],
      }],
      tools: [{ name: "output_pdf_analysis", description: "Output the extracted brand analysis", input_schema: OUTPUT_SCHEMA }],
      tool_choice: { type: "tool", name: "output_pdf_analysis" },
    });

    const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("Could not analyze this PDF");
    const a = toolUse.input as Record<string, unknown>;

    return json({
      analysis: a,
      meta: { name: a.name, description: a.description, industry: a.industry },
    });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
