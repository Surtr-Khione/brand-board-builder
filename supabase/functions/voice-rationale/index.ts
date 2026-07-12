import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Writes a brand's "why this score" paragraph in the brand's OWN documented
// voice — first person, grounded strictly in the met/missing signal lists.
// A product demo of the voice engine, clearly disclosed in the UI as
// BrandMD-written, never presented as an actual statement by the company.
// POST { name, voice: {...}, score, met[], missing[] } → { text }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const db = makeDb();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { name, voice = {}, score, met = [], missing = [] } = await req.json();
    if (!name || typeof score !== "number") return json({ error: "name and score required" }, 400);
    if (await rateLimited(db, req, "voice-rationale", 6)) return json({ error: RATE_LIMIT_MSG }, 429);

    const v = (x: unknown) => (Array.isArray(x) ? x.filter(Boolean).join(", ") : (x || ""));
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 320,
      system: `You ghost-write in a specific brand's documented voice. You will be given the brand's tone, personality, and messaging rules, plus the facts of its BrandMD Gravity Score. Write ONE paragraph (55-85 words), first person plural ("we"), that sounds unmistakably like this brand explaining its own score.

Rules:
- Ground every claim in the provided met/missing lists. Invent nothing about the business.
- Own what's on record with the brand's characteristic confidence; treat what's missing the way this brand would (a Hero brand takes it as a challenge, a Sage states it plainly, a Jester can be wry).
- No hashtags, no exclamation spam, no "as a brand". Never mention BrandMD.
- Output only the paragraph.`,
      messages: [{
        role: "user",
        content: `BRAND: ${name}
Archetype: ${v(voice.archetype)}${voice.secondaryArchetype ? ` / ${voice.secondaryArchetype}` : ""}
Tagline: ${v(voice.tagline)}
Tone: ${v(voice.toneAttributes)}
Personality: ${v(voice.brandPersonality)}
Voice notes: ${v(voice.socialPersonality)}

GRAVITY SCORE: ${score}/100
On record (each earned +10): ${met.join("; ") || "nothing yet"}
Not yet on record (each worth +10): ${missing.join("; ") || "nothing — every signal is met"}

Write ${name}'s own explanation of this score.`,
      }],
    });

    const t = response.content.find((b: { type: string }) => b.type === "text");
    if (!t || t.type !== "text") throw new Error("No text generated");
    return json({ text: t.text.trim() });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
