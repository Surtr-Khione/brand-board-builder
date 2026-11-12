const BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY}`,
});

// ── The public brand library is a static file (public/data/brands.json, built by scripts/snapshot-brands.py) ──
// Since 2026-11-12 reads never touch the database: calling the search-brands edge function on every page view blew
// the Supabase egress quota and took the Library down. Same response shapes as the old function:
//   searchBrands → { brands, total, totalBrands, facets: { archetypes, industries } }
//   getBrand     → { brand, snapshots }
let libraryPromise = null;
function loadLibrary() {
  if (!libraryPromise) {
    libraryPromise = fetch("/data/brands.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`brands.json HTTP ${r.status}`))))
      .catch((e) => { libraryPromise = null; throw e; });
  }
  return libraryPromise;
}

const SEARCH_FIELDS = ["brand_name", "slug", "industry", "archetype", "secondary_archetype", "tagline", "description",
  "mission", "why_different", "country", "website"];
const norm = (s) => String(s || "").toLowerCase();

export async function searchBrands({ q = "", archetype, industry, featured, limit = 24, offset = 0 } = {}) {
  let lib;
  try { lib = await loadLibrary(); } catch { return { brands: [], total: 0, totalBrands: null, facets: { archetypes: [], industries: [] } }; }
  const all = lib.brands || [];
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const rows = all.filter((b) => {
    if (archetype && b.archetype !== archetype) return false;
    if (industry && b.industry !== industry) return false;
    if (featured && !b.is_featured) return false;
    if (!terms.length) return true;
    const hay = SEARCH_FIELDS.map((f) => norm(b[f])).join(" ");
    return terms.every((t) => hay.includes(t));
  });
  const lim = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  const uniq = (xs) => [...new Set(xs.filter(Boolean))].sort();
  return {
    brands: rows.slice(off, off + lim),
    total: rows.length,
    totalBrands: all.length,
    facets: { archetypes: uniq(all.map((b) => b.archetype)), industries: uniq(all.map((b) => b.industry)) },
  };
}

export async function getBrand(slug) {
  try {
    const lib = await loadLibrary();
    const brand = (lib.brands || []).find((b) => b.slug === slug);
    return brand ? { brand, snapshots: (lib.snapshots || {})[slug] || [] } : null;
  } catch { return null; }
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
