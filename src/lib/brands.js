import { supabase } from './supabase';

export async function searchBrands({ q = "", archetype, industry, featured, limit = 48, offset = 0 } = {}) {
  if (!supabase) return { brands: [], facets: { archetypes: [], industries: [] } };

  let query = supabase
    .from('public_brands')
    .select('slug, brand_name, industry, archetype, website, logo_url, tagline, description, primary_color, secondary_color, accent_color, primary_font, body_font, tone_attributes, photo_style, social_personality, founded_year, country, is_featured, is_verified, fortune500_rank')
    .order('fortune500_rank', { ascending: true, nullsFirst: false })
    .order('brand_name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) query = query.or(`brand_name.ilike.%${q}%,industry.ilike.%${q}%,archetype.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`);
  if (archetype) query = query.eq('archetype', archetype);
  if (industry) query = query.eq('industry', industry);
  if (featured) query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) { console.error('searchBrands error:', error); return { brands: [], facets: { archetypes: [], industries: [] } }; }

  const brands = data || [];
  const archetypes = [...new Set(brands.map(b => b.archetype).filter(Boolean))].sort();
  const industries = [...new Set(brands.map(b => b.industry).filter(Boolean))].sort();

  return { brands, facets: { archetypes, industries } };
}

export async function getBrand(slug) {
  if (!supabase) return null;

  const { data: brand, error } = await supabase
    .from('public_brands')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !brand) return null;

  const { data: snapshots } = await supabase
    .from('brand_snapshots')
    .select('year, snapshot_data, change_notes')
    .eq('brand_id', brand.id)
    .order('year', { ascending: false });

  return { brand, snapshots: snapshots || [] };
}

export async function publishBrand(brand, email) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from('public_brands')
    .insert([{ ...brand, submitted_by_email: email }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
