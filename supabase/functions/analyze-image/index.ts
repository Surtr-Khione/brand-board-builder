import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Moodboard image analysis: read up to 6 brand/product images and extract the
// visual DNA — photo style, mood, aesthetic keywords, subjects, and a
// suggested palette. Rebuilt 2026-07-16 (the original deployed version's
// source was never committed and is lost).
// Contract with ImageMoodboard: POST { images: [{base64, mediaType} | {url}] }
//   → { analysis: { photoStyle, photoMood, aestheticKeywords, subjectMatter,
//                   suggestedPrimaryColor, suggestedSecondaryColor, suggestedAccentColor } }
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
  required: ["photoStyle", "photoMood", "aestheticKeywords", "subjectMatter"],
  properties: {
    photoStyle: { type: "string", description: "The photography/illustration style these images share, e.g. 'high-contrast studio product shots on seamless backgrounds'" },
    photoMood: { type: "string", description: "The emotional register of the imagery, e.g. 'calm, premium, quietly confident'" },
    aestheticKeywords: { type: "array", items: { type: "string" }, description: "4-8 aesthetic keywords, e.g. minimal, warm, editorial" },
    subjectMatter: { type: "string", description: "What the images actually show — subjects, settings, recurring motifs" },
    suggestedPrimaryColor: { type: "string", description: "Dominant brand-usable color as #RRGGBB, if the set clearly suggests one" },
    suggestedSecondaryColor: { type: "string", description: "Supporting color as #RRGGBB" },
    suggestedAccentColor: { type: "string", description: "Accent color as #RRGGBB" },
  },
};

const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) return json({ error: "No images received." }, 400);
    if (images.length > 6) return json({ error: "6 images max per analysis." }, 400);

    if (await rateLimited(db, req, "analyze-image", 8)) return json({ error: RATE_LIMIT_MSG }, 429);

    const content: Anthropic.MessageParam["content"] = [];
    for (const img of images) {
      if (img?.base64 && typeof img.base64 === "string") {
        const mediaType = MEDIA_TYPES.has(img.mediaType) ? img.mediaType : "image/jpeg";
        const data = img.base64.replace(/^data:image\/[a-z+]+;base64,/, "");
        if (data.length > 7_000_000) return json({ error: "One of the images is too large — 5MB max each." }, 400);
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
      } else if (img?.url && typeof img.url === "string" && /^https?:\/\//.test(img.url)) {
        content.push({ type: "image", source: { type: "url", url: img.url } });
      }
    }
    if (!content.length) return json({ error: "No readable images in the request." }, 400);

    content.push({
      type: "text",
      text: `These ${content.length} image(s) are a brand's moodboard/product imagery. Extract the shared visual DNA. Only suggest palette colors when the set genuinely converges on them — otherwise omit the color fields.`,
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:
        "You are a visual brand analyst. Describe what the imagery actually shows and the style/mood it shares. Be concrete and specific to these images — never generic filler.",
      messages: [{ role: "user", content }],
      tools: [{ name: "output_image_analysis", description: "Output the extracted visual DNA", input_schema: OUTPUT_SCHEMA }],
      tool_choice: { type: "tool", name: "output_image_analysis" },
    });

    const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("Could not analyze these images");

    return json({ analysis: toolUse.input });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});
