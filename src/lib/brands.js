import { supabase } from './supabase';

export async function searchBrands({ q = "", archetype, industry, featured, limit = 48, offset = 0 } = {}) {
  if (!supabase) return { brands: [], facets: { archetypes: [], industries: [] } };

  let query = supabase
    .from('public_brands')
    .select('slug, brand_name, industry, archetype, website, tagline, description, primary_color, secondary_color, accent_color, primary_font, body_font, tone_attributes, photo_style, social_personality, founded_year, country, is_featured, is_verified, fortune500_rank')
    .order('fortune500_rank', { ascending: true, nullsFirst: false })
    .order('brand_name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) query = query.or(`brand_name.ilike.%${q}%,industry.ilike.%${q}%,archetype.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`);
  if (archetype) query = query.eq('archetype', archetype);
  if (industry) query = query.eq('industry', industry);
  if (featured) query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) { console.error('searchBrands error:', error); return { brands: [], facets: { archetypes: [], industries: [] } }; }

  const brands = (data || []).map(b => ({
    ...b,
    // normalize field names the UI expects
    name: b.brand_name,
    colors: { primary: b.primary_color, secondary: b.secondary_color, accent: b.accent_color },
    fonts: { primary: b.primary_font, body: b.body_font },
  }));

  // Build facets from results
  const archetypes = [...new Set(brands.map(b => b.archetype).filter(Boolean))].sort();
  const industries = [...new Set(brands.map(b => b.industry).filter(Boolean))].sort();

  return { brands, facets: { archetypes, industries } };
}

export async function getBrand(slug) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('public_brands')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    name: data.brand_name,
    colors: { primary: data.primary_color, secondary: data.secondary_color, accent: data.accent_color },
    fonts: { primary: data.primary_font, body: data.body_font },
  };
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

const cleanArr = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x.trim()) : null);

// Map the builder's camelCase state onto public_brands columns
function toPublicBrandRow(brand) {
  return {
    slug: slugify(brand.brandName) + '-' + Math.random().toString(36).slice(2, 6),
    brand_name: brand.brandName,
    industry: brand.industry || null,
    archetype: brand.archetype || null,
    secondary_archetype: brand.secondaryArchetype || null,
    website: brand.website || null,
    tagline: brand.tagline || null,
    mission: brand.mission || null,
    vision: brand.vision || null,
    elevator: brand.elevator || null,
    brand_promise: brand.brandPromise || null,
    why_different: brand.whyDifferent || null,
    core_values: cleanArr(brand.coreValues),
    primary_color: brand.primaryColor || null,
    secondary_color: brand.secondaryColor || null,
    accent_color: brand.accentColor || null,
    primary_font: brand.primaryFont || null,
    body_font: brand.bodyFont || null,
    accent_font: brand.secondaryFont || null,
    tone_attributes: cleanArr(brand.toneAttributes),
    brand_personality: cleanArr(brand.brandPersonality),
    do_say: cleanArr(brand.messagingDos),
    dont_say: cleanArr(brand.messagingDonts),
    email_signoff: brand.emailSignoff || null,
    social_personality: brand.socialPersonality || null,
    photo_style: brand.photoStyle || null,
    photo_subjects: brand.photoSubjects || null,
    logo_description: brand.logoDescription || null,
    icon_style: brand.iconStyle || null,
    motion_style: brand.motionStyle || null,
    music_style: brand.musicStyle || null,
    enemy: brand.enemy || null,
    victim: brand.victim || null,
    founded_year: parseInt(brand.founded) || null,
    brand_data: brand, // full board state for the profile page
  };
}

export async function publishBrand(brand, email) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const err = new Error("Create a free account to publish to the Brand Library.");
    err.code = 'AUTH_REQUIRED';
    throw err;
  }

  const row = {
    ...toPublicBrandRow(brand),
    submitted_by: user.id,
    submitted_by_email: email || user.email,
  };

  const { data, error } = await supabase
    .from('public_brands')
    .insert([row])
    .select('slug, brand_name')
    .single();

  if (error) throw new Error(error.message);
  return { ...data, url: `/brands/${data.slug}` };
}
