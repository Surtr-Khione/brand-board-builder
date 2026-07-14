#!/usr/bin/env node
// Merge duplicate library rows into the canonical (bare) slug: canonical
// column values win where present, dupe fills the gaps; brand_data likewise.
// Dupe row is deleted afterward. Usage: SUPABASE_SERVICE_KEY=... node scripts/merge-dupes.mjs keep_slug dupe_slug [...]
const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_KEY;
const H = { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, apikey: KEY };

async function row(slug) {
  const r = await fetch(`${BASE}/rest/v1/public_brands?slug=eq.${slug}&select=*`, { headers: H });
  return (await r.json())[0];
}

const SKIP = new Set(["id", "slug", "created_at", "updated_at", "fts", "view_count", "is_featured", "is_verified"]);

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const [keepSlug, dupeSlug] = [args[i], args[i + 1]];
  const keep = await row(keepSlug), dupe = await row(dupeSlug);
  if (!keep || !dupe) { console.log(`✗ ${keepSlug}/${dupeSlug}: row missing`); continue; }
  const patch = {};
  for (const [k, v] of Object.entries(dupe)) {
    if (SKIP.has(k) || k === "brand_data") continue;
    const cur = keep[k];
    const empty = cur === null || cur === undefined || (Array.isArray(cur) && cur.length === 0) || cur === "";
    if (empty && v !== null && v !== undefined && v !== "") patch[k] = v;
  }
  // brand_data: dupe's depth fills under canonical's keys; drop stale scoreRationale
  const merged = { ...(dupe.brand_data || {}), ...(keep.brand_data || {}) };
  delete merged.scoreRationale;
  patch.brand_data = merged;
  patch.view_count = (keep.view_count || 0) + (dupe.view_count || 0);
  const up = await fetch(`${BASE}/rest/v1/public_brands?id=eq.${keep.id}`, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(patch) });
  if (!up.ok) { console.log(`✗ merge ${keepSlug}: HTTP ${up.status}`); continue; }
  const del = await fetch(`${BASE}/rest/v1/public_brands?id=eq.${dupe.id}`, { method: "DELETE", headers: { ...H, Prefer: "return=minimal" } });
  console.log(`${del.ok ? "✓" : "✗ delete failed:"} ${keepSlug} ← merged ${dupeSlug} (${Object.keys(patch).length - 2} cols filled)`);
}
