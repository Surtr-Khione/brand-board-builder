import { createClient } from "npm:@supabase/supabase-js@2";

// Serves a board (or library brand) as a canonical, always-current markdown
// brand-context file — the thing founders paste into (or point) ChatGPT,
// Claude, Cursor, or an agency's tools instead of re-explaining their brand
// every session. GET ?board=<board_id> | ?slug=<public_brand_slug>.
// Pretty URLs (/board/:id/brand.md, /brands/:slug/brand.md) 302 here via
// the Pages _redirects file.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SITE = "https://brandmd.space";

const val = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);

function render(b: Record<string, unknown>, canonicalUrl: string): string {
  const L: string[] = [];
  const push = (s: string) => L.push(s);
  const section = (title: string) => { push(""); push(`## ${title}`); push(""); };
  const field = (label: string, v: unknown) => { const x = val(v); if (x) push(`**${label}:** ${x}`); };
  const bullets = (label: string, v: unknown) => {
    const xs = list(v);
    if (!xs.length) return;
    push(`**${label}:**`);
    for (const x of xs) push(`- ${x}`);
    push("");
  };

  push(`# ${val(b.brandName) || "Untitled Brand"} — Brand System`);
  push("");
  push(`> Canonical brand context. Source of truth: ${canonicalUrl}`);
  push(`> Use this document as the authoritative reference for ${val(b.brandName) || "this brand"}'s identity, voice, and rules when generating or reviewing any content.`);

  section("Identity");
  field("Tagline", b.tagline);
  field("Industry", b.industry);
  field("Website", b.website);
  field("Archetype", val(b.archetype) ? `${b.archetype}${val(b.secondaryArchetype) ? ` / ${b.secondaryArchetype}` : ""}` : null);
  field("Enemy (what the brand fights)", b.enemy);
  field("Mission", b.mission);
  field("Vision", b.vision);
  field("Brand promise", b.brandPromise);
  field("Why different", b.whyDifferent);
  field("Elevator pitch", b.elevator);
  push("");
  bullets("Core values", b.coreValues);

  section("Voice & Language");
  bullets("Tone attributes", b.toneAttributes);
  bullets("Personality", b.brandPersonality);
  field("Register", b.languageRegister);
  field("Sentence style", b.sentenceStyle);
  field("Humor", b.humorRegister);
  field("Person", b.personPreference);
  field("Reading level", b.readingLevel);
  field("Jargon policy", b.jargonPolicy);
  field("Capitalization", b.capitalizationStyle);
  push("");
  bullets("Grammar rules", b.grammarRules);

  section("Hard Rules — never violate");
  bullets("Always say it like", b.messagingDos);
  bullets("Never say it like", b.messagingDonts);
  bullets("Words we always use", b.wordsAlways);
  bullets("Words we NEVER use", b.wordsNever);
  bullets("The brand never does", b.brandNeverDoes);
  bullets("Commandments", b.brandCommandments);

  section("Audience");
  field("Who", [val(b.audienceRole), val(b.audienceAge)].filter(Boolean).join(", ") || null);
  field("Pains", b.audiencePains);
  field("Goals", b.audienceGoals);
  const icps = Array.isArray(b.icps) ? (b.icps as Record<string, unknown>[]).filter((i) => val(i.title)) : [];
  for (const icp of icps) {
    push("");
    push(`### ICP: ${icp.title}${val(icp.segment) ? ` (${icp.segment})` : ""}`);
    field("Demographics", icp.demographics);
    field("Psychographics", icp.psychographics);
    bullets("Pain points", icp.painPoints);
    bullets("Goals", icp.goals);
    bullets("Buying triggers", icp.buyingTriggers);
    field("Message angle", icp.messageAngle);
    field("Channels", icp.channels);
  }

  section("Visual System");
  field("Primary color", b.primaryColor);
  field("Secondary color", b.secondaryColor);
  field("Accent color", b.accentColor);
  field("Display font", b.primaryFont);
  field("Body font", b.bodyFont);
  field("Photography style", b.photoStyle);
  field("Photo mood", b.photoMood);
  bullets("Moodboard keywords", b.moodboardKeywords);

  const platformVoices = [
    ["Instagram", b.voiceInstagram], ["LinkedIn", b.voiceLinkedIn], ["YouTube", b.voiceYouTube],
    ["TikTok", b.voiceTikTok], ["Facebook", b.voiceFacebook], ["X/Twitter", b.voiceTwitter],
  ].filter(([, v]) => val(v));
  if (platformVoices.length) {
    section("Platform Voices");
    for (const [name, v] of platformVoices) push(`**${name}:** ${val(v)}`);
  }

  section("Positioning");
  field("Competitive positioning", b.competitivePositioning);
  bullets("Differentiators", b.differentiators);
  field("Price tier", b.priceTier);
  field("Anti-positioning", b.antiPositioning);
  field("Category ownership", b.categoryOwnership);

  push("");
  push("---");
  push(`Maintained with [BrandMD](${SITE}) · This file always reflects the current board: ${canonicalUrl}`);
  push("");
  return L.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const params = new URL(req.url).searchParams;
    const boardId = params.get("board");
    const slug = params.get("slug");

    let brand: Record<string, unknown> | null = null;
    let canonicalUrl = SITE;

    if (boardId) {
      const { data } = await db.from("brand_boards")
        .select("brand_data, is_public").eq("board_id", boardId).maybeSingle();
      if (!data || data.is_public === false) return new Response("Not found", { status: 404, headers: cors });
      brand = data.brand_data || {};
      canonicalUrl = `${SITE}/board/${boardId}/brand.md`;
    } else if (slug) {
      const { data } = await db.from("public_brands").select("*").eq("slug", slug).maybeSingle();
      if (!data) return new Response("Not found", { status: 404, headers: cors });
      // Columns take precedence; brand_data fills the deep fields
      brand = {
        ...(data.brand_data || {}),
        brandName: data.brand_name, tagline: data.tagline, industry: data.industry,
        website: data.website, archetype: data.archetype, secondaryArchetype: data.secondary_archetype,
        enemy: data.enemy, mission: data.mission, vision: data.vision, elevator: data.elevator,
        brandPromise: data.brand_promise, whyDifferent: data.why_different, coreValues: data.core_values,
        primaryColor: data.primary_color, secondaryColor: data.secondary_color, accentColor: data.accent_color,
        primaryFont: data.primary_font, bodyFont: data.body_font,
        toneAttributes: data.tone_attributes, brandPersonality: data.brand_personality,
        messagingDos: data.do_say, messagingDonts: data.dont_say,
        photoStyle: data.photo_style, socialPersonality: data.social_personality,
      };
      canonicalUrl = `${SITE}/brands/${slug}/brand.md`;
    } else {
      return new Response("Pass ?board=<board id> or ?slug=<brand slug>", { status: 400, headers: cors });
    }

    return new Response(render(brand!, canonicalUrl), {
      headers: { ...cors, "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    return new Response(`Error: ${String(err?.message || err)}`, { status: 500, headers: cors });
  }
});
