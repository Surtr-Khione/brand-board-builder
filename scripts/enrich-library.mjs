#!/usr/bin/env node
// Enrich thin library rows (the original curated seeds) with profile-mode
// synthesis, grounded in their existing curated fields. Curated column
// values are preserved; only empty columns and brand_data depth are filled.
// Usage: SUPABASE_SERVICE_KEY=... BMD_INTERNAL_KEY=... node scripts/enrich-library.mjs [concurrency]
const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_KEY;
const H = { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, apikey: KEY, "x-bmd-internal": process.env.BMD_INTERNAL_KEY || "" };

const r = await fetch(`${BASE}/rest/v1/public_brands?select=*&order=brand_name`, { headers: H });
const rows = await r.json();
const thin = rows.filter((b) => !b.brand_data || Object.keys(b.brand_data).filter((k) => k !== "scoreRationale").length < 5);
console.log(`${rows.length} brands, ${thin.length} thin rows to enrich: ${thin.map((b) => b.slug).join(", ")}`);

const COL_FROM_SYNTH = {
  secondary_archetype: "secondaryArchetype", enemy: "enemy", vision: "vision",
  elevator: "elevator", brand_promise: "brandPromise", why_different: "whyDifferent",
  core_values: "coreValues", do_say: "messagingDos", dont_say: "messagingDonts",
  mission: "mission", tagline: "tagline",
};

let i = 0, ok = 0, fail = 0;
async function worker() {
  while (i < thin.length) {
    const b = thin[i++];
    try {
      const source = {
        type: "website", url: b.website || b.slug,
        data: {
          meta: { name: b.brand_name, description: b.description || "", keywords: "", industry: b.industry || "" },
          analysis: {
            voiceAnalysis: b.social_personality || "",
            toneAttributes: b.tone_attributes || [],
            contentPillars: [], audienceSignals: "",
            personalitySignals: `This is the well-known brand ${b.brand_name}. Ground the analysis in its real public identity. Its documented archetype is ${b.archetype || "unknown"}; tagline "${b.tagline || ""}".`,
          },
        },
      };
      const res = await fetch(`${BASE}/functions/v1/synthesize-brand`, {
        method: "POST", headers: H,
        body: JSON.stringify({ sources: [source], existingBrand: { brandName: b.brand_name, website: b.website, archetype: b.archetype, tagline: b.tagline, mission: b.mission }, mode: "profile" }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || `HTTP ${res.status}`);
      const s = d.synthesis;
      const patch = { brand_data: { ...s } };
      for (const [col, key] of Object.entries(COL_FROM_SYNTH)) {
        const cur = b[col];
        const empty = cur === null || cur === undefined || cur === "" || (Array.isArray(cur) && cur.length === 0);
        if (empty && s[key]) patch[col] = s[key];
      }
      const up = await fetch(`${BASE}/rest/v1/public_brands?id=eq.${b.id}`, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(patch) });
      if (!up.ok) throw new Error(`update HTTP ${up.status}`);
      ok++; console.log(`✓ ${b.slug}`);
    } catch (e) { fail++; console.log(`✗ ${b.slug}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: parseInt(process.argv[2] || "2", 10) }, worker));
console.log(`Done: ${ok} enriched, ${fail} failed.`);
