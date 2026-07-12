import { createClient } from "npm:@supabase/supabase-js@2";

// Publishes a brand board as a public Brand Certificate page (/brands/:slug).
// Contract with src/lib/brands.js publishBrand(): POST { brand, email } → { slug, url }.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SITE = "https://brandmd.space";

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "brand";

const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const cleanArr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { brand = {}, email } = await req.json();
    const name = clean(brand.brandName);
    if (!name) return json({ error: "Add a Brand Name before publishing." }, 400);

    const base = slugify(name);
    const submittedBy = clean(email);

    // Same submitter republishing the same brand updates their page in place;
    // a different submitter with a colliding name gets a suffixed slug.
    // Never overwrite curated library entries (verified/featured).
    let slug = base;
    const { data: existing } = await db
      .from("public_brands")
      .select("id, slug, submitted_by_email, is_verified, is_featured")
      .eq("slug", base)
      .maybeSingle();

    let updateId: string | null = null;
    if (existing) {
      const ownsIt = submittedBy && existing.submitted_by_email === submittedBy &&
        !existing.is_verified && !existing.is_featured;
      if (ownsIt) {
        updateId = existing.id;
      } else {
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      }
    }

    const foundedYear = parseInt(String(brand.founded || ""), 10);
    const row = {
      slug,
      brand_name: name,
      industry: clean(brand.industry),
      archetype: clean(brand.archetype),
      secondary_archetype: clean(brand.secondaryArchetype),
      enemy: clean(brand.enemy),
      website: clean(brand.website),
      tagline: clean(brand.tagline),
      description: clean(brand.elevator) || clean(brand.mission),
      mission: clean(brand.mission),
      vision: clean(brand.vision),
      elevator: clean(brand.elevator),
      brand_promise: clean(brand.brandPromise),
      why_different: clean(brand.whyDifferent),
      core_values: cleanArr(brand.coreValues),
      primary_color: clean(brand.primaryColor) || "#000000",
      secondary_color: clean(brand.secondaryColor) || "#ffffff",
      accent_color: clean(brand.accentColor) || "#666666",
      primary_font: clean(brand.primaryFont),
      body_font: clean(brand.bodyFont),
      tone_attributes: cleanArr(brand.toneAttributes),
      brand_personality: cleanArr(brand.brandPersonality),
      do_say: cleanArr(brand.messagingDos),
      dont_say: cleanArr(brand.messagingDonts),
      email_signoff: clean(brand.emailSignoff),
      photo_style: clean(brand.photoStyle),
      photo_subjects: clean(brand.photoSubjects),
      logo_description: clean(brand.logoDescription),
      logo_url: clean(brand.logoUrl),
      icon_style: clean(brand.iconStyle),
      motion_style: clean(brand.motionStyle),
      music_style: clean(brand.musicStyle),
      social_personality: clean(brand.socialPersonality),
      founded_year: Number.isFinite(foundedYear) ? foundedYear : null,
      brand_data: brand,
      submitted_by_email: submittedBy,
      status: "published",
    };

    const result = updateId
      ? await db.from("public_brands").update({ ...row, slug: existing!.slug }).eq("id", updateId).select("slug").single()
      : await db.from("public_brands").insert(row).select("slug").single();

    if (result.error) throw result.error;
    const finalSlug = result.data.slug;

    return json({ slug: finalSlug, url: `${SITE}/brands/${finalSlug}` });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
