const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Field-specific prompts — kept short to minimize input tokens (cost control)
const FIELD_GUIDES: Record<string, string> = {
  tagline: "Write a punchy brand tagline. 5–10 words. Memorable and specific to this brand.",
  mission: "Write a mission statement. One sentence starting with 'We' or 'To'.",
  vision: "Write a vision statement. The world this brand is building toward. One sentence.",
  whyDifferent: "What makes this brand uniquely different? One concrete, specific differentiator.",
  brandPromise: "The one commitment this brand always delivers on. One sentence.",
  elevator: "Write a 30-second elevator pitch: what you do, who it's for, why it matters.",
  enemy: "What does this brand stand against? The status quo or problem it fights.",
  victim: "Describe the ideal customer who is suffering the problem. Specific and empathetic.",
  heroStatement: "How does the customer become the hero through using this brand?",
  storyGuide: "How does this brand show empathy for customers AND establish authority?",
  storyProblem: "Describe the core problem customers face — external, internal, and philosophical dimensions.",
  storyPlan: "A simple 3-step process the brand offers. Numbered list format.",
  storyCTA: "A direct call-to-action. 3–6 words.",
  storySuccess: "Paint the picture of transformation. What does the customer's life look like after?",
  storyFailure: "What is at stake if the customer doesn't act? The cost of inaction.",
  photoStyle: "Photography direction for this brand. e.g. 'Clean editorial with natural light'",
  photoMood: "The mood and feeling of brand imagery. 3–5 descriptive words.",
  photoSubjects: "What subjects appear in brand photography? e.g. 'Real customers, workspaces, product in use'",
  motionStyle: "Animation and motion direction. e.g. 'Smooth, intentional transitions — nothing bouncy'",
  socialPersonality: "How does this brand sound on social media? 1–2 sentences.",
  emailSignoff: "A branded email sign-off. 2–4 words. e.g. 'Keep building' or 'To your growth'",
  audioMood: "Sonic identity direction. e.g. 'Warm, confident, ambient — like a high-end hotel lobby'",
  soundLogo: "Describe a sound logo / audio signature for this brand. What feeling does it evoke?",
  logoDescription: "Describe the brand logo concept and its meaning.",
  logoUsageRules: "Write concise logo usage rules: minimum size, clear space, backgrounds to avoid.",
  iconStyle: "Icon style direction. e.g. 'Outlined, 2px stroke, rounded caps — consistent with UI'",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 503,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { field, brand } = await req.json();

    // Minimal context to keep input tokens low
    const ctx = [
      brand?.brandName && `Brand: ${brand.brandName}`,
      brand?.industry && `Industry: ${brand.industry}`,
      brand?.archetype && `Archetype: ${brand.archetype}`,
      brand?.tagline && `Tagline: ${brand.tagline}`,
      brand?.mission && `Mission: ${brand.mission}`,
      brand?.toneAttributes?.filter(Boolean).length &&
        `Tone: ${brand.toneAttributes.filter(Boolean).slice(0, 3).join(", ")}`,
    ].filter(Boolean).join("\n");

    const guide = FIELD_GUIDES[field] || `Suggest a value for the "${field}" brand field. Be specific.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [{
          role: "user",
          content: `${ctx || "New brand — no details yet"}\n\nTask: ${guide}\n\nReturn ONLY the text. No quotes. No prefix. No explanation.`,
        }],
      }),
    });

    const data = await resp.json();
    const suggestion = data.content?.[0]?.text?.trim() || "";

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
