import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

// ── Brand context builder ────────────────────────────────────────────────────
function brandCtx(b: Record<string, unknown>): string {
  const arr = (v: unknown) => Array.isArray(v) ? (v as string[]).filter(Boolean).join(" · ") : (v || "");
  return `
BRAND: ${b.brandName || "Unnamed Brand"} | ${b.industry || ""} | ${b.archetype || ""}
TAGLINE: ${b.tagline || ""}
MISSION: ${b.mission || ""}
BRAND PROMISE: ${b.brandPromise || ""}
WHY DIFFERENT: ${b.whyDifferent || ""}
ELEVATOR PITCH: ${b.elevator || ""}

VOICE & LANGUAGE:
  Register: ${b.languageRegister || "professional"}
  Sentence style: ${b.sentenceStyle || "varied"}
  Humor: ${b.humorRegister || "none"}
  Person: ${b.personPreference || "second-person (you)"}
  Reading level: ${b.readingLevel || ""}
  Grammar rules: ${arr(b.grammarRules)}
  Jargon policy: ${b.jargonPolicy || ""}
  Number style: ${b.numberStyle || ""}
  Capitalization: ${b.capitalizationStyle || ""}

PERSONALITY:
  Tone: ${arr(b.toneAttributes)}
  Personality traits: ${arr(b.brandPersonality)}
  Messaging dos: ${arr(b.messagingDos)}
  Messaging don'ts: ${arr(b.messagingDonts)}
  Words always use: ${arr(b.wordsAlways)}
  Words never use: ${arr(b.wordsNever)}

MARKET POSITION:
  Price tier: ${b.priceTier || ""}
  Category ownership: ${b.categoryOwnership || ""}
  Anti-positioning: ${b.antiPositioning || ""}
  Competitive positioning: ${b.competitivePositioning || ""}
  Differentiators: ${arr(b.differentiators)}

PROOF & EVIDENCE:
  Key stats: ${arr(b.keyProofStats)}
  Proof hierarchy: ${Array.isArray(b.proofHierarchy) ? (b.proofHierarchy as string[]).join(" > ") : ""}
  Social proof criteria: ${b.socialProofCriteria || ""}

OFFER ARCHITECTURE:
  Primary CTA: ${b.offerCTA || ""}
  Lead magnet: ${b.offerLeadMagnet || ""} (${b.offerLeadMagnetFormat || ""})
  Intro offer: ${b.offerIntroOffer || ""} @ ${b.offerIntroPrice || ""}
  Core offer: ${b.offerCoreOffer || ""} @ ${b.offerCorePrice || ""}
  Premium offer: ${b.offerPremiumOffer || ""} @ ${b.offerPremiumPrice || ""}

BRAND STORIES LIBRARY:
${Array.isArray(b.brandStories) ? (b.brandStories as Array<{type:string;title:string;story:string}>).filter(s => s.title || s.story).map(s => `  [${s.type.toUpperCase()}] ${s.title}: ${s.story}`).join("\n") : ""}

SENSORY PHYSICS:
  Speed: ${b.brandSpeed ?? 50}/100 (0=deliberate, 100=reactive)
  Weight: ${b.brandWeight ?? 50}/100 (0=featherlight, 100=heavyweight)
  Temperature: ${b.brandTemperature ?? 50}/100 (0=cold, 100=warm)
  Texture: ${b.brandTexture ?? 50}/100 (0=raw, 100=polished)
  Density: ${b.brandDensity ?? 50}/100 (0=sparse, 100=rich)
  Notes: ${b.brandSensoryNotes || ""}

MANIFESTO:
  Commandments: ${arr(b.brandCommandments)}
  Never does: ${arr(b.brandNeverDoes)}
  Controversy stance: ${b.controversyStance || ""}
`.trim();
}

function icpCtx(icp: Record<string, unknown> | null): string {
  if (!icp) return "General brand audience — speak to the core customer profile.";
  return `
ICP: ${icp.title || ""} (${icp.segment || ""})
  Demographics: ${icp.demographics || ""}
  Psychographics: ${icp.psychographics || ""}
  Pain points: ${Array.isArray(icp.painPoints) ? (icp.painPoints as string[]).filter(Boolean).join(" · ") : ""}
  Goals: ${Array.isArray(icp.goals) ? (icp.goals as string[]).filter(Boolean).join(" · ") : ""}
  Buying triggers: ${Array.isArray(icp.buyingTriggers) ? (icp.buyingTriggers as string[]).filter(Boolean).join(" · ") : ""}
  Message angle: ${icp.messageAngle || ""}
  Acquisition channel: ${icp.channels || ""}
`.trim();
}

// ── Content type instructions ────────────────────────────────────────────────
const FORMATS: Record<string, string> = {
  "blog-post": `Write a complete, publish-ready blog post. Structure:
- Magnetic headline (H1)
- Hook paragraph that earns the read (don't start with "In today's world" or similar clichés)
- Clear sections with H2 headers
- Specific evidence woven throughout (stats, stories, examples)
- Actionable takeaways
- Strong CTA paragraph at the end
Match the brand's reading level, sentence style, and grammar rules exactly.`,

  "email": `Write a complete email campaign piece. Output format:
SUBJECT LINE: [compelling subject]
PREVIEW TEXT: [40-90 chars]
---
[Full email body]
---
P.S. [post-script if appropriate for the brand's style]
Use the brand's email sign-off if specified. Match the ICP's emotional state at their journey stage.`,

  "email-sequence": `Write a 5-email nurture sequence. Each email:
Email 1 — Welcome/Value Delivery
Email 2 — Story + Proof
Email 3 — Teach a key concept
Email 4 — Overcome the main objection
Email 5 — Offer + CTA
Format each as: SUBJECT: | PREVIEW: | BODY | CTA`,

  "sms": `Write 3 SMS variations (under 160 chars each). Each must:
- Hook in the first 5 words
- Communicate value instantly
- Have a clear link/action placeholder [LINK]
- Sound like a human, not a bot
Label: SMS 1: / SMS 2: / SMS 3:`,

  "headline-pack": `Write 10 headline variations for the topic. Cover all 5 frameworks:
BENEFIT (2): What they gain
CURIOSITY (2): Creates a knowledge gap
PROOF/NUMBER (2): Specific result or figure
QUESTION (2): Yes/no question they can't ignore
BOLD CLAIM (2): The most direct, confident statement
Format: Framework | Headline`,

  "instagram-carousel": `Write a complete Instagram carousel post. Format:
SLIDE 1 — Hook (stops the scroll, max 8 words on screen + caption hook)
SLIDE 2-6 — Value (one insight or step per slide, tight copy)
SLIDE 7 — CTA slide (what to do next)
CAPTION: Full caption with hook, value, CTA, and 5 hashtag suggestions
Emojis should match brand's humor register and warmth level.`,

  "linkedin-article": `Write a complete LinkedIn article. Structure:
- Strong hook (first 2 lines must compel the "see more" click)
- Bold thesis statement
- 4-5 substantive sections with insights, evidence, examples
- Practical takeaways section
- Closing thought that elevates the brand's authority
- End with a question or CTA to drive engagement
Tone should be thought-leadership level, not promotional.`,

  "x-thread": `Write a Twitter/X thread of 10-14 tweets. Format:
1/ [Hook tweet — standalone value or bold statement]
2/ [Context/setup]
3-11/ [One insight per tweet — specific, evidence-based]
12/ [Most valuable insight — buried treasure format]
13/ [Summary thread]
14/ [Follow/retweet CTA]
Each tweet must be under 280 chars. Make tweets work standalone AND as a thread.`,

  "tiktok-script": `Write a TikTok video script. Structure:
HOOK (0-3 seconds): [Exact words to say that stop the scroll]
CONFLICT/TENSION (3-10 sec): [Why they should keep watching]
CONTENT (10-45 sec): [The actual value — keep it punchy]
PATTERN INTERRUPT: [Moment that re-hooks if they're scrolling]
CTA (last 5 sec): [What to do next]
ON-SCREEN TEXT: [Text overlays]
CAPTION: [TikTok caption with hashtags]`,

  "social-post": `Write 3 platform-ready social post variations. Each should feel native to the platform's culture. Vary the hook approach and format for each variation. Include relevant hashtags where appropriate.`,

  "video-script": `Write a complete video script. Structure:
HOOK (first 30 sec): What stops them from clicking away
PROBLEM AGITATION: Make the pain vivid and real
BRIDGE: Your unique insight or mechanism
CONTENT BODY: Teach, demonstrate, or prove
PROOF: Story or stat
CTA: Next step
Include: [B-ROLL SUGGESTIONS] and [ON-SCREEN TEXT] cues throughout.`,

  "webinar-script": `Write a complete webinar script outline and key talking points. Structure:
INTRO (5 min): Hook, credibility, agenda, what they'll get
ENGAGEMENT HOOK: Poll or question to engage audience
CONTENT (45 min): 3-4 main teaching sections with stories, proof, examples per section
OFFER REVEAL (10 min): The pitch — problem, solution, offer, price, bonuses, guarantee, urgency
CLOSE (5 min): Q&A bridge + final CTA
Include word-for-word language for all transitions and the pitch sequence.`,

  "podcast-script": `Write a complete podcast episode outline and script. Include:
COLD OPEN: [teaser of what they'll learn, 30-45 seconds]
INTRO: [host intro, guest intro if applicable, episode framing]
SEGMENTS: 4-5 main talking points with guiding questions and transitions
ACTIONABLE TAKEAWAYS: The 3 things listeners should do after
OUTRO: Recap + CTA + "until next time" sign-off
Include actual narration language, not just bullet points.`,

  "pr-pitch": `Write a media pitch email to a journalist/editor/podcast host. Format:
Subject line: [intriguing, specific, personalized hook]
---
Opening paragraph: Why this story matters RIGHT NOW (tie to news or trend)
Paragraph 2: The brand/founder story angle — what's genuinely surprising
Paragraph 3: Why their specific audience would care
Proof points: 2-3 specific, credible facts
The ask: Clear, specific, easy to say yes to
Closing: Professional, not desperate
Keep under 300 words. Sound like a person, not a PR machine.`,

  "press-release": `Write a press release in AP style. Format:
FOR IMMEDIATE RELEASE
[HEADLINE — active verb, specific, newsworthy]
[SUBHEADLINE — one line of context]
[City, Date] — [Strong opening paragraph with the 5 W's]
[Body: 2-3 paragraphs of depth, quotes, context]
[Quote from brand spokesperson — must sound human]
[About section: 2 sentences]
###
CONTACT: [placeholder]
Keep under 500 words. Focus on what's genuinely newsworthy.`,

  "image-prompt": `Write 3 AI image generation prompts for this brand. Each prompt should:
- Specify the exact scene, composition, and mood
- Reference the brand's photo style, mood, and sensory physics
- Include lighting direction, color palette, and texture notes
- Specify the aspect ratio and intended use
- Include camera/lens style if appropriate
Format: [Use Case] — [Full detailed prompt]
Cover: Hero/campaign image, social media asset, product/service context.`,

  "music-brief": `Write a comprehensive creative brief for a music composer/sound designer. Include:
BRAND SONIC IDENTITY:
  - Tempo range (BPM)
  - Instrumentation palette
  - Sonic mood reference (3 adjectives)
  - Musical references (similar-feeling artists/tracks — not to copy, for feel reference)
  - Elements to avoid
  - Emotional arc
USE CASES: [where the music will be used]
DURATION: [typical lengths needed]
TECHNICAL SPECS: [format, stems, loops needed]`,

  "quiz-concept": `Design a complete interactive quiz concept. Include:
QUIZ TITLE: [Compelling, specific]
DESCRIPTION: [What they'll discover — value hook]
QUESTIONS (5-7):
  - Each question (multiple choice, 3-4 options)
  - What dimension each question measures
RESULT TIERS (3-4):
  - Tier name + description + what it means for them
  - Custom CTA/offer for each tier
LEAD CAPTURE: What to offer for their email before showing results
FOLLOW-UP: Email sequence concept for each result tier`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { brand = {}, contentType, topic, icpIndex, additionalContext, platform } = await req.json();

    if (!contentType) return json({ error: "contentType required" }, 400);

    const formatInstructions = FORMATS[contentType] || `Create a high-quality ${contentType} that perfectly matches the brand's voice and targets the specified ICP.`;

    const brandData = brand as Record<string, unknown>;
    const icps = Array.isArray(brandData.icps) ? brandData.icps as Array<Record<string, unknown>> : [];
    const selectedICP = icpIndex !== null && icpIndex !== undefined && icps[icpIndex] ? icps[icpIndex] : null;

    // Get platform-specific voice
    const platformVoiceMap: Record<string, string> = {
      instagram: String(brandData.voiceInstagram || ""),
      linkedin: String(brandData.voiceLinkedIn || ""),
      youtube: String(brandData.voiceYouTube || ""),
      tiktok: String(brandData.voiceTikTok || ""),
      facebook: String(brandData.voiceFacebook || ""),
      twitter: String(brandData.voiceTwitter || ""),
    };
    const platformVoice = platform ? platformVoiceMap[platform.toLowerCase()] || "" : "";

    const systemPrompt = `You are an elite content strategist, copywriter, and brand specialist who creates brand-perfect content across every format and channel. You've written for 7-figure brands, bestselling authors, and Fortune 500 companies.

Your content is:
- BRAND-EXACT: Every word, sentence rhythm, and tone choice reflects the brand's DNA
- ICP-TARGETED: Written to the specific customer profile's psychology, language, and emotional state
- FORMAT-NATIVE: Structured correctly for the specific content type and platform culture
- CONVERSION-AWARE: Every piece serves the brand's business objectives
- ORIGINAL: Never clichéd, never generic, never "in today's fast-paced world"

Write with precision and confidence. The brand details are your creative brief — follow them exactly.`;

    const userPrompt = `Generate a ${contentType.replace(/-/g, " ")} for this brand.

${brandCtx(brandData)}

TARGET AUDIENCE:
${icpCtx(selectedICP)}

${platform ? `PLATFORM: ${platform}${platformVoice ? `\nPLATFORM VOICE: ${platformVoice}` : ""}` : ""}

CONTENT BRIEF:
Topic / Angle: ${topic || "Choose the most compelling angle based on the brand's ICP pain points and brand story"}
${additionalContext ? `Additional context: ${additionalContext}` : ""}

CONTENT FORMAT INSTRUCTIONS:
${formatInstructions}

Write the complete ${contentType.replace(/-/g, " ")} now. Do not add meta-commentary, explanations, or "here is your content" preambles — output only the actual content:`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((b: { type: string }) => b.type === "text");
    if (!content || content.type !== "text") throw new Error("No content generated");

    return json({ content: content.text, contentType, usage: response.usage });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
