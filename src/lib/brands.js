const BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY}`,
});

export async function searchBrands({ q = "", archetype, industry, featured, limit = 24, offset = 0 } = {}) {
  if (!BASE) return { brands: [], facets: { archetypes: [], industries: [] } };
  const p = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (q) p.set("q", q);
  if (archetype) p.set("archetype", archetype);
  if (industry) p.set("industry", industry);
  if (featured) p.set("featured", "true");
  const r = await fetch(`${BASE}/search-brands?${p}`, { headers: hdrs() });
  return r.json();
}

export async function getBrand(slug) {
  if (!BASE) return null;
  const r = await fetch(`${BASE}/search-brands?slug=${encodeURIComponent(slug)}`, { headers: hdrs() });
  if (!r.ok) return null;
  return r.json();
}

export async function publishBrand(brand, email) {
  if (!BASE) throw new Error("Supabase not configured");
  const r = await fetch(`${BASE}/publish-brand`, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify({ brand, email }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}
