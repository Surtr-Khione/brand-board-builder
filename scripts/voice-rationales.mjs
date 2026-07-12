#!/usr/bin/env node
// Writes each library brand's "why this score" paragraph in its own voice
// (voice-rationale fn) and stores it on the row as brand_data.scoreRationale
// = { score, text }. Rendered only while it matches the live score.
// Usage: SUPABASE_SERVICE_KEY=... BMD_INTERNAL_KEY=... node scripts/voice-rationales.mjs [concurrency]
import { computeGravityScore } from "../src/lib/gravityScore.js";

const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_KEY;
const INTERNAL = process.env.BMD_INTERNAL_KEY || "";
if (!KEY) { console.error("Set SUPABASE_SERVICE_KEY"); process.exit(1); }
const H = { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, apikey: KEY, "x-bmd-internal": INTERNAL };

const SIGNAL_PHRASES = {
  "Mission": "a stated mission",
  "Vision": "a stated vision",
  "Core values (3+)": "committed core values",
  "Primary archetype": "a committed archetype",
  "Secondary archetype or named enemy": "a named enemy or secondary archetype",
  "Differentiation": "documented differentiation",
  "Tagline": "a signature line",
  "Elevator pitch": "an elevator pitch",
  "Do-say rules (2+)": "do-say messaging rules",
  "Don't-say rules (2+)": "don't-say rules",
  "Voice basics (2+ tone attributes)": "a defined voice",
  "Voice depth (4+ tone attributes)": "real voice depth",
  "Personality traits (3+)": "named personality traits",
  "Social or platform voice": "a social voice",
  "Full color system": "a complete color system",
  "Typography": "committed typography",
  "Photography direction": "a photography direction",
  "Audience or ICPs": "a defined audience",
  "Content pillars": "content pillars",
};

const r = await fetch(`${BASE}/functions/v1/search-brands?limit=100`, { headers: H });
const { brands } = await r.json();
console.log(`${brands.length} brands`);

let i = 0; let ok = 0; let skip = 0; let fail = 0;
async function worker() {
  while (i < brands.length) {
    const b = brands[i++];
    try {
      const { score, signals } = computeGravityScore(b);
      const existing = b.brand_data?.scoreRationale;
      if (existing && existing.score === score && existing.text) { skip++; continue; }
      const met = signals.filter((x) => x.met).map((x) => SIGNAL_PHRASES[x.label] || x.label);
      const missing = signals.filter((x) => !x.met).map((x) => SIGNAL_PHRASES[x.label] || x.label);
      const voice = {
        archetype: b.archetype, secondaryArchetype: b.secondary_archetype, tagline: b.tagline,
        toneAttributes: b.tone_attributes, brandPersonality: b.brand_personality,
        socialPersonality: b.social_personality,
      };
      const res = await fetch(`${BASE}/functions/v1/voice-rationale`, {
        method: "POST", headers: H,
        body: JSON.stringify({ name: b.brand_name, voice, score, met, missing }),
      });
      const d = await res.json();
      if (!res.ok || d.error || !d.text) throw new Error(d.error || `HTTP ${res.status}`);
      const newData = { ...(b.brand_data || {}), scoreRationale: { score, text: d.text } };
      const up = await fetch(`${BASE}/rest/v1/public_brands?id=eq.${b.id}`, {
        method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify({ brand_data: newData }),
      });
      if (!up.ok) throw new Error(`update HTTP ${up.status}`);
      ok++;
      console.log(`✓ ${b.brand_name} (${score}): ${d.text.slice(0, 70)}…`);
    } catch (e) {
      fail++;
      console.log(`✗ ${b.brand_name}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: parseInt(process.argv[2] || "4", 10) }, worker));
console.log(`\nDone: ${ok} written, ${skip} current, ${fail} failed.`);
