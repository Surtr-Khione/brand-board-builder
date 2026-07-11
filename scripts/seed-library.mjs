#!/usr/bin/env node
// Library seeding pipeline: domain → scan-website → synthesize-brand → publish-brand.
// Every published profile is a public landing page (/brands/:slug) — this is
// the SEO engine. Usage:
//   SUPABASE_SERVICE_KEY=... node scripts/seed-library.mjs domains.txt [concurrency]
// domains.txt: one domain per line, # comments allowed. Skips brands whose
// slug already exists in the library. Costs ~1 Sonnet synthesis per brand.

import { readFileSync } from "node:fs";

const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co/functions/v1";
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!KEY) { console.error("Set SUPABASE_SERVICE_KEY"); process.exit(1); }

const INTERNAL = process.env.BMD_INTERNAL_KEY || "";
const HEADERS = { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, "x-bmd-internal": INTERNAL };
const slugify = (s) => s.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function call(fn, body, method = "POST") {
  const r = await fetch(`${BASE}/${fn}`, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

async function existingSlugs() {
  const r = await fetch(`${BASE}/search-brands?limit=100`, { headers: HEADERS });
  const d = await r.json();
  return new Set((d.brands || []).map((b) => b.slug));
}

// Light local meta fetch — the full edge scanner blows its CPU limit on huge
// corporate sites, and for famous brands the synthesis model carries the
// weight anyway. We just need name/description/theme-color as grounding.
async function fetchMeta(domain) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(`https://${domain.replace(/^https?:\/\//, "")}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandMD-Library/1.0)" },
      redirect: "follow",
    });
    const html = (await r.text()).slice(0, 300000);
    const pick = (re) => (html.match(re) || [])[1]?.trim() || null;
    return {
      title: pick(/<title[^>]*>([^<]{2,120})/i),
      description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,300})["']/i)
        || pick(/<meta[^>]+content=["']([^"']{10,300})["'][^>]+name=["']description["']/i),
      ogSiteName: pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{2,80})["']/i),
      themeColor: pick(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{6})["']/i),
    };
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}

async function seedOne(domain, existing) {
  const meta = await fetchMeta(domain);
  const name = meta.ogSiteName || (meta.title || domain).split(/[|\-–:]/)[0].trim();
  const slug = slugify(name);
  if (existing.has(slug)) return { domain, skipped: `slug '${slug}' already in library` };

  const source = {
    type: "website",
    url: domain,
    data: {
      meta: { name, description: meta.description || "", keywords: "", industry: "" },
      analysis: {
        voiceAnalysis: meta.description || "",
        toneAttributes: [],
        contentPillars: [],
        audienceSignals: "",
        personalitySignals: `This is the well-known brand ${name} (${domain}). Ground the analysis in its real public identity.`,
      },
      colors: meta.themeColor ? [{ role: "theme", color: meta.themeColor }] : undefined,
    },
  };

  const { synthesis } = await call("synthesize-brand", { sources: [source], existingBrand: { brandName: name, website: domain } });
  const brand = { ...synthesis, brandName: synthesis.brandName || name, website: domain };
  const pub = await call("publish-brand", { brand, email: null });
  existing.add(pub.slug);
  return { domain, slug: pub.slug, url: pub.url };
}

const file = process.argv[2] || "scripts/seed-domains.txt";
const concurrency = parseInt(process.argv[3] || "3", 10);
const domains = readFileSync(file, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

const existing = await existingSlugs();
console.log(`${domains.length} domains, ${existing.size} already in library, concurrency ${concurrency}`);

const results = [];
let i = 0;
async function worker() {
  while (i < domains.length) {
    const domain = domains[i++];
    try {
      const r = await seedOne(domain, existing);
      results.push(r);
      console.log(r.skipped ? `~ ${domain}: ${r.skipped}` : `✓ ${domain} → ${r.url}`);
    } catch (e) {
      results.push({ domain, error: e.message });
      console.log(`✗ ${domain}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

const ok = results.filter((r) => r.slug).length;
const skipped = results.filter((r) => r.skipped).length;
const failed = results.filter((r) => r.error).length;
console.log(`\nDone: ${ok} published, ${skipped} skipped, ${failed} failed.`);
