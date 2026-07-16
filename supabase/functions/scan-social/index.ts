import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Social/profile scan: read a public profile page (LinkedIn, Instagram, X,
// YouTube, TikTok, podcast pages, etc.) and extract brand-voice signals from
// whatever the page exposes server-side — meta/og tags, JSON-LD, visible
// text, and the og:image via vision. Rebuilt 2026-07-16 (the original
// deployed version's source was never committed and is lost).
// Contract with BrandIntelligence: POST { url, type } → { analysis, meta }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const db = makeDb();

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const OUTPUT_SCHEMA = {
  type: "object",
  required: ["voiceAnalysis", "toneAttributes", "contentPillars", "audienceSignals", "personalitySignals"],
  properties: {
    voiceAnalysis: { type: "string", description: "How the brand writes/presents on this platform — register, rhythm, quirks" },
    toneAttributes: { type: "array", items: { type: "string" }, description: "Tone words the page's own copy supports" },
    contentPillars: { type: "array", items: { type: "string" }, description: "Recurring themes/topics this presence commits to" },
    audienceSignals: { type: "string", description: "Who this presence is clearly for" },
    personalitySignals: { type: "string", description: "Personality traits expressed by the copy and visuals" },
    visualStyle: { type: "string", description: "What the preview image reveals about visual direction, if an image was provided" },
    name: { type: "string", description: "The brand or account name" },
    description: { type: "string", description: "One-paragraph summary of this presence" },
    tagline: { type: "string" },
    archetype: { type: "string", description: "Best-fit Jungian archetype, e.g. 'The Hero'" },
  },
};

function extractMeta(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const grab = (re: RegExp, key: string) => {
    const m = html.match(re);
    if (m?.[1]) out[key] = m[1].trim();
  };
  grab(/<title[^>]*>([^<]{1,300})<\/title>/i, "title");
  for (const prop of ["og:title", "og:description", "og:image", "og:site_name", "twitter:title", "twitter:description", "twitter:image", "description"]) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop.replace(":", "\\:")}["'][^>]+content=["']([^"']{1,600})["']`,
      "i",
    );
    grab(re, prop);
    // content-before-property variant
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']{1,600})["'][^>]+(?:property|name)=["']${prop.replace(":", "\\:")}["']`,
      "i",
    );
    if (!out[prop]) grab(re2, prop);
  }
  return out;
}

function visibleText(html: string, cap = 4000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, cap);
}

async function fetchImageBlock(url: string) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const type = r.headers.get("content-type")?.split(";")[0] ?? "";
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { type: "image" as const, source: { type: "base64" as const, media_type: type, data: btoa(bin) } };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { url, type } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "No URL received." }, 400);

    let target: URL;
    try {
      target = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return json({ error: "That doesn't look like a valid URL." }, 400);
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") return json({ error: "Only http(s) URLs." }, 400);
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)/.test(target.hostname)) {
      return json({ error: "That host can't be scanned." }, 400);
    }

    if (await rateLimited(db, req, "scan-social", 8)) return json({ error: RATE_LIMIT_MSG }, 429);

    const page = await fetch(target.href, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!page.ok) return json({ error: `Could not reach that page (HTTP ${page.status}). Some platforms block server access — try the website scan or a PDF export instead.` }, 422);
    const html = (await page.text()).slice(0, 600_000);

    const meta = extractMeta(html);
    const text = visibleText(html);
    if (!text && !meta["og:description"] && !meta["og:title"]) {
      return json({ error: "That page exposes nothing publicly readable. Some platforms require login — try another source." }, 422);
    }

    const content: Anthropic.MessageParam["content"] = [];
    const ogImage = meta["og:image"] || meta["twitter:image"];
    if (ogImage) {
      const block = await fetchImageBlock(ogImage);
      if (block) content.push(block);
    }
    content.push({
      type: "text",
      text: `Platform: ${type || "unknown"}\nURL: ${target.href}\n\nPage metadata:\n${JSON.stringify(meta, null, 2)}\n\nVisible page text (may be partial — many platforms render client-side):\n${text || "(none)"}\n\nExtract the brand-voice signals this presence supports. Report only what the material shows — never invent specifics.`,
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system:
        "You are a brand analyst reading a public social/profile page. Extract voice, tone, themes, audience, and personality signals from the page's own copy and preview image. Be honest about thin evidence — leave fields short rather than inventing.",
      messages: [{ role: "user", content }],
      tools: [{ name: "output_social_analysis", description: "Output the extracted brand signals", input_schema: OUTPUT_SCHEMA }],
      tool_choice: { type: "tool", name: "output_social_analysis" },
    });

    const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("Could not analyze this page");
    const a = toolUse.input as Record<string, unknown>;

    return json({
      analysis: a,
      meta: { name: a.name, description: a.description, platform: type, title: meta["og:title"] || meta.title },
    });
  } catch (err) {
    const msg = String((err as Error)?.message || err);
    return json({ error: msg.includes("timed out") || msg.includes("timeout") ? "That page took too long to respond." : msg }, 500);
  }
});
