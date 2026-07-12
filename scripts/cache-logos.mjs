#!/usr/bin/env node
// Self-host library logos: fetch each brand's mark once (Clearbit, favicon
// fallback), store in the public brand-assets bucket, save the URL on the
// row. The site then serves marks from our own domain — no ad-blocker
// failures, no third-party dependency at view time.
// Usage: SUPABASE_SERVICE_KEY=... node scripts/cache-logos.mjs
const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_KEY;
const H = { Authorization: `Bearer ${KEY}`, apikey: KEY };

// Ensure bucket (public) exists
const b = await fetch(`${BASE}/storage/v1/bucket`, {
  method: "POST", headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ id: "brand-assets", name: "brand-assets", public: true }),
});
console.log("bucket:", b.status === 200 || b.status === 201 ? "created" : `exists (${b.status})`);

const r = await fetch(`${BASE}/rest/v1/public_brands?select=id,slug,website,logo_url`, { headers: H });
const rows = await r.json();
console.log(`${rows.length} brands`);

let ok = 0, skip = 0, fail = 0, i = 0;
async function worker() {
  while (i < rows.length) {
    const row = rows[i++];
    try {
      if (row.logo_url && row.logo_url.includes("/storage/v1/")) { skip++; continue; }
      const domain = (row.website || "").replace(/^https?:\/\//, "").split("/")[0];
      if (!domain) { skip++; continue; }
      let res = await fetch(`https://logo.clearbit.com/${domain}`);
      if (!res.ok) res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      if (!res.ok) throw new Error(`no logo (${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) throw new Error("logo too small");
      const path = `logos/${row.slug}.png`;
      const up = await fetch(`${BASE}/storage/v1/object/brand-assets/${path}`, {
        method: "POST", headers: { ...H, "Content-Type": "image/png", "x-upsert": "true" }, body: buf,
      });
      if (!up.ok) throw new Error(`upload ${up.status}`);
      const url = `${BASE}/storage/v1/object/public/brand-assets/${path}`;
      const patch = await fetch(`${BASE}/rest/v1/public_brands?id=eq.${row.id}`, {
        method: "PATCH", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ logo_url: url }),
      });
      if (!patch.ok) throw new Error(`patch ${patch.status}`);
      ok++;
    } catch (e) { fail++; console.log(`✗ ${row.slug}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`Done: ${ok} cached, ${skip} skipped, ${fail} failed.`);
