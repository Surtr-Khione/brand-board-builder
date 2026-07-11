import { createClient } from "npm:@supabase/supabase-js@2";

// Powers the Brand Library (/brands) and public Brand Certificate pages
// (/brands/:slug). Response shapes are contracts with src/lib/brands.js:
//   list mode → { brands, facets: { archetypes, industries } }
//   slug mode → { brand, snapshots }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const params = new URL(req.url).searchParams;
    const slug = params.get("slug");

    // ── Single brand by slug (public certificate page) ──
    if (slug) {
      const { data: brand, error } = await db
        .from("public_brands").select("*").eq("slug", slug).single();
      if (error || !brand) return json({ error: "Brand not found" }, 404);

      const { data: snapshots } = await db
        .from("brand_snapshots")
        .select("year, snapshot_data, change_notes")
        .eq("brand_id", brand.id)
        .order("year", { ascending: true });

      // Best-effort view counter — never block the response on it
      db.from("public_brands")
        .update({ view_count: (brand.view_count || 0) + 1 })
        .eq("id", brand.id)
        .then(() => {}, () => {});

      return json({ brand, snapshots: snapshots || [] });
    }

    // ── Library list / search ──
    const q = (params.get("q") || "").trim();
    const archetype = params.get("archetype");
    const industry = params.get("industry");
    const featured = params.get("featured") === "true";
    const limit = Math.min(parseInt(params.get("limit") || "24", 10) || 24, 100);
    const offset = Math.max(parseInt(params.get("offset") || "0", 10) || 0, 0);

    let query = db.from("public_brands").select("*");
    if (q) query = query.textSearch("fts", q, { type: "websearch", config: "english" });
    if (archetype) query = query.eq("archetype", archetype);
    if (industry) query = query.eq("industry", industry);
    if (featured) query = query.eq("is_featured", true);

    const { data: brands, error } = await query
      .order("is_featured", { ascending: false })
      .order("view_count", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const { data: facetRows } = await db
      .from("public_brands").select("archetype, industry");
    const uniq = (xs: (string | null)[]) => [...new Set(xs.filter(Boolean))].sort() as string[];

    return json({
      brands: brands || [],
      facets: {
        archetypes: uniq((facetRows || []).map((r) => r.archetype)),
        industries: uniq((facetRows || []).map((r) => r.industry)),
      },
    });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
