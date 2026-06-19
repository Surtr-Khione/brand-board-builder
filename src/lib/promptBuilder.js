// Client-side prompt assembly — mirrors edge function logic so the gear shows EXACTLY what gets sent

const arr = (v) => Array.isArray(v) ? v.filter(Boolean).join(" · ") : (v || "");

// ─── Brand context ─────────────────────────────────────────────────────────────
export function buildBrandCtx(b = {}) {
  if (!b) return "";
  return `BRAND: ${b.brandName || "Unnamed Brand"} | ${b.industry || ""} | ${b.archetype || ""}
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
  Proof hierarchy: ${Array.isArray(b.proofHierarchy) ? b.proofHierarchy.join(" > ") : ""}
  Social proof criteria: ${b.socialProofCriteria || ""}

OFFER ARCHITECTURE:
  Primary CTA: ${b.offerCTA || ""}
  Lead magnet: ${b.offerLeadMagnet || ""} (${b.offerLeadMagnetFormat || ""})
  Intro offer: ${b.offerIntroOffer || ""} @ ${b.offerIntroPrice || ""}
  Core offer: ${b.offerCoreOffer || ""} @ ${b.offerCorePrice || ""}
  Premium offer: ${b.offerPremiumOffer || ""} @ ${b.offerPremiumPrice || ""}

BRAND STORIES:
${(Array.isArray(b.brandStories) ? b.brandStories : []).filter(s => s.title || s.story).map(s => `  [${(s.type || "").toUpperCase()}] ${s.title}: ${s.story}`).join("\n")}

SENSORY PHYSICS:
  Speed: ${b.brandSpeed ?? 50}/100 (0=deliberate, 100=reactive)
  Weight: ${b.brandWeight ?? 50}/100 (0=featherlight, 100=heavyweight)
  Temperature: ${b.brandTemperature ?? 50}/100 (0=cold, 100=warm)
  Texture: ${b.brandTexture ?? 50}/100 (0=raw, 100=polished)
  Density: ${b.brandDensity ?? 50}/100 (0=sparse, 100=rich)

MANIFESTO:
  Commandments: ${arr(b.brandCommandments)}
  Never does: ${arr(b.brandNeverDoes)}
  Controversy stance: ${b.controversyStance || ""}`.trim();
}

// ─── ICP context ───────────────────────────────────────────────────────────────
export function buildIcpCtx(icp) {
  if (!icp) return "General brand audience — speak to the core customer profile.";
  return `ICP: ${icp.title || ""} (${icp.segment || ""})
  Demographics: ${icp.demographics || ""}
  Psychographics: ${icp.psychographics || ""}
  Pain points: ${arr(icp.painPoints)}
  Goals: ${arr(icp.goals)}
  Buying triggers: ${arr(icp.buyingTriggers)}
  Message angle: ${icp.messageAngle || ""}
  Acquisition channel: ${icp.channels || ""}`.trim();
}

// ─── System prompt ─────────────────────────────────────────────────────────────
export const DEFAULT_SYSTEM_PROMPT = `You are an elite content strategist, copywriter, and brand specialist who creates brand-perfect content across every format and channel. You also think like a design lead at a small studio known for distinctive, opinionated work — not templated defaults.

Your content is:
- BRAND-EXACT: Every word, sentence rhythm, and tone choice reflects the brand's DNA
- ICP-TARGETED: Written to the specific customer profile's psychology, language, and emotional state
- FORMAT-NATIVE: Structured correctly for the specific content type and platform culture
- CONVERSION-AWARE: Every piece serves the brand's business objectives
- ORIGINAL: Never clichéd, never generic, never "in today's fast-paced world"

Writing as design material:
- Write from the end user's perspective (manage notifications, not webhooks)
- Use active voice: "Save changes" not "Submit", "Build your brand" not "Get started"
- Keep actions consistent across flows
- Treat errors and empty states as moments for direction, not mood
- Plain verbs, sentence case, no filler — words should make things easier to understand

Restraint: Spend boldness in one place. Keep everything else quiet and disciplined.

Write with precision and confidence. The brand brief is your creative law — follow it exactly.`;

// ─── Format instructions ──────────────────────────────────────────────────────
export const FORMATS = {
  "blog-post": `Write a complete, publish-ready blog post. Structure:
- Magnetic headline (H1) — make it specific, numbered, or curiosity-driven
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

  "image-prompt": `Act as a design lead at a studio known for distinctive, opinionated visual work — not AI defaults.

THREE DESIGN DIRECTIONS (each a full AI image generation prompt):

For each direction, run a two-pass process:
PASS 1 — Design plan: Scene concept + mood + composition + lighting + color palette + texture + camera style + aspect ratio
PASS 2 — Critique: Would this read as a generic default for any similar brand? If yes, revise. Confirm it's a deliberate choice for THIS brand's sensory physics and visual identity specifically.

Then output the final prompt only.

AVOID these AI design defaults unless the brand explicitly calls for them:
- Warm cream (#F4F1EA) + high-contrast serif + terracotta accent
- Near-black background + acid-green or vermilion accent
- Broadsheet layout with hairlines and newspaper columns

Draw from the brand's own materials, instruments, artifacts, and visual vernacular. Spend visual boldness in ONE element per prompt — keep everything else quiet.

Format:
DIRECTION 1 — [Use case: Hero/campaign]
[Full AI prompt, 60-100 words]

DIRECTION 2 — [Use case: Social asset]
[Full AI prompt, 60-100 words]

DIRECTION 3 — [Use case: Context/lifestyle]
[Full AI prompt, 60-100 words]`,

  "design-brief": `Act as a design lead at a small studio known for distinctive, opinionated work — not templated defaults. Every decision must be specific to THIS brand, not a generic solution for any brand in this category.

STEP 1 — GROUND THE BRIEF
State clearly: Who is this brand's audience? What is the single job this design must do? What are the brand's own materials, artifacts, and vernacular to draw from?

STEP 2 — DESIGN PLAN (Token System)

COLOR SYSTEM (4–6 named hex values):
Give each color a semantic name that reflects meaning, not position (e.g., "Midnight Anchor" not "Primary"). Specify exact hex. Explain why each earns its place — what it references in the brand's world. Note what ratio each appears (dominant / supporting / accent).
Example of what NOT to do: warm cream #F4F1EA + high-contrast serif + terracotta accent (generic artisan brand default).
Example of precision: For a performance coaching brand — Graphite Field #1C1C1E (dominates, references athletic track), Velocity Red #E8262A (one headline use only), Chalk #F5F5F3 (body backgrounds), Burnished Gold #C9A84C (proof/achievement moments only).

TYPOGRAPHY (2-3 typefaces):
Display face: [specific typeface, weight, tracking, use case — not a default like Playfair + Inter]
Body face: [specific typeface, size, line-height, letter-spacing]
Type scale: H1 / H2 / H3 / body / caption — exact sizes, weights
Type personality: What does this pairing FEEL like? What associations does it carry? Make the treatment itself memorable — the font choice should feel like a decision that could only work for this brand.

LAYOUT LANGUAGE:
Describe the structural logic of a key page in one sentence each:
Hero: [what the opening move is — and why it's NOT a default]
Content sections: [grid logic, spacing rhythm, how information breathes]
CTA section: [how conversion moments are treated structurally]
ASCII wireframe of hero section (20 chars wide × 12 rows)

SIGNATURE ELEMENT:
The single unique design move that embodies this brand. This is where boldness is spent. Everything else should be quiet and disciplined in service of this one thing. Be specific — not "bold typography" but exactly what makes it distinctive.

MOTION PRINCIPLES:
Page load sequence (what appears first, second, third — and at what speed)
Scroll reveal behavior (what kind, how much, what's exempt)
Hover micro-interactions (what responds, how, what doesn't)
Guiding rule: Orchestrate moments, don't scatter effects. Over-animation signals AI-generated work.

STEP 3 — SELF-CRITIQUE (Mandatory)
For each token decision, ask: Would this read as a generic default for any similar brand in this category? If yes — revise it. Prove that each choice is specifically earned by THIS brand's identity, story, and sensory physics.

Three defaults to audit against:
1. Warm cream + high-contrast serif + terracotta/terra accent
2. Near-black background + acid-green or vermilion
3. Broadsheet with hairlines, no border-radius, newspaper columns

STEP 4 — FINAL SPECIFICATION
Output the complete design token document, ready for a developer to implement:
- Named color system with hex values and usage rules
- Type scale with exact values
- Spacing/grid system
- Motion timing values (ms)
- The signature element with implementation notes
- The Chanel Rule: what has been removed that a weaker version would have kept`,

  "ad-creative": `Generate 3 complete ad creative briefs for this brand.

Each brief uses the 2-pass design process:

PASS 1 — Creative direction:
- VISUAL CONCEPT: The single image or scene. What it shows, how it's composed, what feeling it creates.
- HEADLINE: The most important words on screen (5-8 words max). Active voice. Earns attention, not just announces.
- SUBHEADLINE/BODY: 1-2 lines. Benefits, not features. Specific, not generic.
- CTA: Active verb + specific outcome ("Build your brand" not "Get started")
- COLOR PALETTE: 2-3 hex values for this execution
- TYPOGRAPHY: Display face + hierarchy
- SIGNATURE ELEMENT: The one bold choice that makes this ad distinctive

PASS 2 — Critique:
Does any element feel like a generic ad default? Revise it. Would this stop someone scrolling? Is every word earning its place?

FORMAT: Brief 1 (Awareness) / Brief 2 (Consideration) / Brief 3 (Conversion)
For each: Visual | Headline | Body | CTA | Design specs`,

  "brand-style-direction": `Generate a complete visual art direction document for this brand.

Act as creative director. Define the visual language with specificity — this document should be so clear that any designer could execute it without a call.

VISUAL IDENTITY DIRECTION:

1. OPENING MOVE (Hero treatment)
What is the most characteristic thing about this brand's world? Open with that — not a big number, not a gradient hero, not a stock photo. The opening frame should be a thesis about the brand.

2. TYPOGRAPHY SYSTEM
Display face: [Specific typeface + weight + usage rules]
Body face: [Specific typeface + reading size + line-height]
Type scale: [H1 through body, with pixel sizes and weights]
Type personality: What mood does this typographic system create?

3. COLOR SYSTEM
[4-6 named colors with hex values and usage rules]
What does this palette feel like? What does it reference?

4. PHOTOGRAPHY DIRECTION
Shot types, composition rules, lighting style, color treatment, what to avoid.

5. STRUCTURAL LANGUAGE
Grid system, spacing rhythm, use of negative space, dividers and structural devices.

6. MOTION SIGNATURE
Page-load behavior, scroll reveals, hover states, transition style.

7. THE RESTRAINT RULE (Chanel rule)
Remove one accessory. Define what this brand's style should NOT do.

8. ANTI-DEFAULTS
List 3 visual directions this brand explicitly avoids and why.`,

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

// ─── Compile full user prompt ──────────────────────────────────────────────────
export function buildUserPrompt(brand = {}, contentType, topic, icpIndex, additionalContext, platform) {
  const icps = Array.isArray(brand?.icps) ? brand.icps : [];
  const icp = (icpIndex !== null && icpIndex !== undefined && icps[icpIndex]) ? icps[icpIndex] : null;
  const format = FORMATS[contentType] || `Create a high-quality ${(contentType || "").replace(/-/g, " ")} that perfectly matches the brand's voice.`;
  const platformVoiceMap = {
    instagram: brand.voiceInstagram || "",
    linkedin: brand.voiceLinkedIn || "",
    youtube: brand.voiceYouTube || "",
    tiktok: brand.voiceTikTok || "",
    facebook: brand.voiceFacebook || "",
    twitter: brand.voiceTwitter || "",
  };
  const platformVoice = platform ? platformVoiceMap[platform.toLowerCase()] || "" : "";

  return `Generate a ${(contentType || "").replace(/-/g, " ")} for this brand.

${buildBrandCtx(brand)}

TARGET AUDIENCE:
${buildIcpCtx(icp)}

${platform ? `PLATFORM: ${platform}${platformVoice ? `\nPLATFORM VOICE: ${platformVoice}` : ""}` : ""}

CONTENT BRIEF:
Topic / Angle: ${topic || "Choose the most compelling angle based on the brand's ICP pain points and brand story"}
${additionalContext ? `Additional context: ${additionalContext}` : ""}

CONTENT FORMAT INSTRUCTIONS:
${format}

Write the complete ${(contentType || "").replace(/-/g, " ")} now. Do not add meta-commentary, explanations, or "here is your content" preambles — output only the actual content:`;
}

// ─── Per-type topic formulas ───────────────────────────────────────────────────
const TYPE_FORMULAS = {
  "blog-post": [
    "The [#] biggest mistakes [audience] make with [category] — and how to fix them",
    "How to [achieve goal] in [timeframe] (even if [common objection])",
    "Why everything you've been told about [category] is wrong",
    "The [core offer] framework: how it works and why it gets results",
    "From [painful before state] to [desired after state]: a case study",
  ],
  "email": [
    "A confession about [pain point]",
    "The thing nobody tells you about [category]",
    "[Core offer]: what's inside and why it works",
    "You're probably making this mistake with [category]",
    "Last chance: [offer or deadline]",
  ],
  "email-sequence": [
    "Welcome + [lead magnet] delivery → story → teaching → objection → offer",
    "[Pain point] nurture: from aware to ready-to-buy in 5 emails",
    "Post-[event/webinar] follow-up sequence leading to [offer]",
  ],
  "sms": [
    "[Flash deal]: [offer] expires [deadline]",
    "Quick question about [pain point]...",
    "New: [product/content] is live [LINK]",
  ],
  "headline-pack": [
    "Headlines for [core offer] sales page",
    "Email subject lines for [campaign type]",
    "Social ad headlines targeting [ICP segment]",
    "Homepage hero headline options",
  ],
  "instagram-carousel": [
    "[#] signs you're [experiencing pain point]",
    "The [#]-step [process/framework] for [goal]",
    "What [audience] gets wrong about [category]",
    "[Before] vs [After]: the [core offer] difference",
  ],
  "linkedin-article": [
    "The counterintuitive truth about [industry topic]",
    "What [timeframe] of [experience] taught me about [topic]",
    "I [did bold thing]. Here's what happened.",
    "The [category] playbook nobody shares openly",
  ],
  "x-thread": [
    "[#] things I wish I knew about [topic] sooner (thread)",
    "The [topic] framework that changed everything: a thread",
    "Unpopular opinion: [bold stance]. Here's why (thread):",
    "How [result] happened in [timeframe]. Full breakdown:",
  ],
  "tiktok-script": [
    "The [category] hack nobody talks about",
    "POV: you [achieve goal] without [common struggle]",
    "Things I stopped doing that changed my [result]",
    "The truth about [category] they don't want you to know",
  ],
  "social-post": [
    "Hot take: [bold opinion about industry]",
    "[Result] in [timeframe]. Here's the exact process.",
    "The [#] questions to ask before [decision]",
  ],
  "video-script": [
    "The complete [topic] tutorial: [timeframe]",
    "I tried [X] for [timeframe]. Here's what actually happened.",
    "[Controversial method] that got me [result]",
    "Stop doing [common mistake] — do this instead",
  ],
  "webinar-script": [
    "[Goal] in [timeframe]: the live masterclass",
    "How to [core offer result] — free training",
    "The [category] blueprint: live Q&A + offer reveal",
  ],
  "podcast-script": [
    "Episode: [topic] — the honest breakdown",
    "The [#] pillars of [expertise area] (solo episode)",
    "How I [achieved result]: behind the scenes",
  ],
  "music-brief": [
    "Brand theme / main identity audio",
    "Content background music brief",
    "Campaign jingle / sonic branding brief",
  ],
  "pr-pitch": [
    "Founder story pitch: [unique angle]",
    "Data / research story: [stat or finding]",
    "Trend story: [brand's category] is changing because...",
    "Podcast guest pitch: [expertise topic]",
  ],
  "press-release": [
    "Product / offer launch announcement",
    "Partnership or collaboration announcement",
    "Milestone or achievement press release",
    "Study / report / data release",
  ],
  "image-prompt": [
    "Hero brand imagery for [campaign or channel]",
    "Product/service lifestyle imagery",
    "Social media content series concept",
  ],
  "quiz-concept": [
    "What's your [category] personality? [lead gen quiz]",
    "Are you ready for [offer]? [qualification quiz]",
    "Find your [result] path: [assessment quiz]",
  ],
  "design-brief": [
    "[Brand name] website homepage — complete design system",
    "Landing page for [core offer] — conversion-focused",
    "Email template system for [campaign type]",
    "Social content visual language — [platform] series",
  ],
  "ad-creative": [
    "Awareness campaign — introduce [brand/category] to [audience]",
    "Conversion ad — [core offer] to [ICP segment]",
    "Retargeting ad — re-engage [ICP pain point]",
  ],
  "brand-style-direction": [
    "Complete visual identity direction for [brand name]",
    "Website visual rebrand — [brand name]",
    "Campaign visual language — [campaign name or season]",
  ],
  "image-prompt": [
    "Hero brand imagery for [campaign or channel]",
    "Product/service lifestyle imagery",
    "Social media content series",
  ],
};

// ─── Per-type field prompt guidance ───────────────────────────────────────────
export const FIELD_HINTS = {
  "blog-post": {
    topic: "Specific angle · Target keyword · Reader transformation · Proof point to lead with",
    context: "Target keyword · Publish platform · Word count target · Internal links · Product to feature",
  },
  "email": {
    topic: "Subject line hook · Story arc · CTA event (deadline, launch, restock) · Emotional trigger",
    context: "List segment · Send date · Prior email context · Special offer or deadline · A/B variant direction",
  },
  "email-sequence": {
    topic: "Trigger event (opt-in, purchase, abandon) · Lead magnet delivered · Journey stage",
    context: "Days between emails · Offer reveal email number · Objections to overcome · CTA for each email",
  },
  "sms": {
    topic: "Offer / news / event · Urgency driver · Link destination",
    context: "List segment · Send time · Compliance opt-out copy · Character limit preference",
  },
  "headline-pack": {
    topic: "Page or placement type (hero, email subject, ad) · Core promise · Primary benefit",
    context: "Competitor headlines to beat · A/B test focus · Character limits for ads",
  },
  "instagram-carousel": {
    topic: "Hook concept · Value framework · Transformation shown · CTA destination",
    context: "Slide count preference · Aesthetic direction · Product to feature · Story link CTA",
  },
  "linkedin-article": {
    topic: "Thought leadership angle · Personal story hook · Contrarian stance · Industry insight",
    context: "Publisher (personal vs company page) · Target connection type · Lead magnet to mention",
  },
  "x-thread": {
    topic: "Bold opening claim · Framework or list structure · Buried treasure insight · Debate trigger",
    context: "Target follower type · Retweet hook · Account to tag or reference · Thread length preference",
  },
  "tiktok-script": {
    topic: "Scroll-stopping hook (first 3 words matter most) · Format (talking head, text-only, tutorial)",
    context: "Video length · Trending sound/format to reference · CTA destination · Caption direction",
  },
  "social-post": {
    topic: "Core message · Platform primary (IG/LI/FB/X) · Engagement trigger (question, opinion, proof)",
    context: "Hashtag strategy · Tag suggestions · Story vs feed · Repurpose from existing content",
  },
  "video-script": {
    topic: "Hook premise · Tutorial vs story vs opinion format · B-roll concept · CTA destination",
    context: "Video length · Presenter notes · On-screen text style · Channel thumbnail concept",
  },
  "webinar-script": {
    topic: "Webinar title promise · Teaching content (3-4 modules) · Offer reveal position",
    context: "Offer price/name to reveal · Registrant source · Co-presenter · Tech platform",
  },
  "podcast-script": {
    topic: "Episode theme · Solo vs interview · Key talking points · Listener takeaway",
    context: "Episode number · Guest name/bio · Show notes structure · Sponsor mention",
  },
  "music-brief": {
    topic: "Primary use case (intro, background, theme, jingle) · Mood · Duration",
    context: "Budget range · Licensing needs · Reference tracks or artists · Delivery format",
  },
  "pr-pitch": {
    topic: "Story angle · News hook (why now) · What makes this genuinely surprising",
    context: "Target outlet name · Journalist/host name · Pitch deadline · Interview availability",
  },
  "press-release": {
    topic: "Announcement type · Key news fact · Spokesperson name and title",
    context: "Embargo date · Media contact info · High-res image availability · Boilerplate approved",
  },
  "image-prompt": {
    topic: "Primary use (hero, social, ad, print) · Scene or concept · Mood keywords",
    context: "Aspect ratios needed · Brand colors to use · AI tool (Midjourney, DALL-E, Ideogram) · Style reference",
  },
  "quiz-concept": {
    topic: "Quiz hook (what they'll discover) · Scoring dimensions · Result tier names",
    context: "Platform (Typeform, Quiz Funnel, LeadQuizzes) · Lead magnet for email capture · Follow-up sequence",
  },
  "design-brief": {
    topic: "Page or deliverable type (website hero, email template, landing page, product page, brand system) · Primary job of the design",
    context: "Target device (web/mobile/print) · Designer tool (Figma, Webflow, CSS) · Brand materials to draw from · Deadline",
  },
  "ad-creative": {
    topic: "Campaign objective (awareness/consideration/conversion) · Platform (Meta, Google, LinkedIn, OOH) · Offer or message",
    context: "Ad format (single image, carousel, video static) · Existing assets · Budget tier · A/B variant to test",
  },
  "brand-style-direction": {
    topic: "Deliverable scope (full visual identity, website refresh, campaign, social rebrand) · Primary medium",
    context: "Target audience for the design itself (internal team, external agency, freelancer) · Reference brands to study (not copy) · Timeline",
  },
  "image-prompt": {
    topic: "Primary use (hero campaign, social, ad, print, product) · Scene or concept · Mood keywords",
    context: "Aspect ratios needed · AI tool (Midjourney, DALL-E, Ideogram, Flux) · Style reference · Avoid list",
  },
};

// ─── Smart topic suggestions (brand-aware) ────────────────────────────────────
export function suggestTopics(brand = {}, contentType, icpIndex) {
  const icp = Array.isArray(brand?.icps) ? brand.icps[icpIndex] : null;
  const suggestions = [];

  const pains = (icp?.painPoints || []).filter(Boolean);
  const goals = (icp?.goals || []).filter(Boolean);
  const audience = icp?.title || icp?.segment || "your audience";
  const stories = (brand?.brandStories || []).filter(s => s.title);
  const stat = (brand?.keyProofStats || []).find(Boolean) || "";
  const coreOffer = brand?.offerCoreOffer || brand?.brandName || "";
  const category = brand?.industry || "your space";

  // Brand-data-derived suggestions (highest quality, specific to this brand)
  if (pains[0]) suggestions.push(`How ${audience} can overcome: ${pains[0]}`);
  if (goals[0]) suggestions.push(`The fastest path to: ${goals[0]}`);
  if (stat) suggestions.push(`The ${stat} result — how it happened`);
  if (stories[0]?.title) suggestions.push(stories[0].title);
  if (coreOffer) suggestions.push(`Why ${coreOffer} works when other approaches don't`);

  // Fill remaining slots with type-specific formulas, populated with brand data
  const formulas = TYPE_FORMULAS[contentType] || [];
  for (const f of formulas) {
    if (suggestions.length >= 6) break;
    const filled = f
      .replace("[audience]", audience)
      .replace("[category]", category)
      .replace("[pain point]", pains[0] || "the main challenge")
      .replace("[goal]", goals[0] || "your goal")
      .replace("[core offer]", coreOffer)
      .replace("[ICP segment]", icp?.segment || audience)
      .replace("[expertise area]", category)
      .replace("[#]", ["3", "5", "7"][suggestions.length % 3])
      .replace("[timeframe]", "30 days")
      .replace("[result]", stat || "real results");
    if (filled !== f || !filled.includes("[")) suggestions.push(filled);
  }

  return [...new Set(suggestions)].filter(Boolean).slice(0, 6);
}
