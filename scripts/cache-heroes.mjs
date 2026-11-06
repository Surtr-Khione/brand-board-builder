#!/usr/bin/env node
// Self-host library hero photos. Brand pages must never hotlink brand CDNs:
// every image lives on OUR machines (a local mirror on this Mac) AND on our
// server storage (public brand-assets bucket, heroes/<slug>/<n>.<ext>).
//
// Steps, in order:
//   1. Read every brand's hero_images and write a snapshot JSON to the mirror
//      root BEFORE anything changes (the undo record).
//   2. Download each image; broken ones (403/404/non-image/tiny) are skipped.
//      Working ones are saved to <mirror>/<slug>/<n>.<ext>.
//   3. With a service key: upload each to brand-assets/heroes/<slug>/<n>.<ext>,
//      verify the public URL answers 200, then PATCH public_brands.hero_images
//      to the cached URLs (broken originals dropped).
//      Without one: stop after the local mirror and write an upload plan.
//
// Usage:
//   SUPABASE_SERVICE_KEY=... node scripts/cache-heroes.mjs            # full run
//   node --env-file=.env scripts/cache-heroes.mjs                     # mirror + plan only (anon read)
//   ... --dry-run                                                     # snapshot + probe, no writes
// Env: HERO_MIRROR_DIR overrides the mirror root.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co";
const SERVICE = process.env.SUPABASE_SERVICE_KEY || "";
const READ_KEY = SERVICE || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const MIRROR = process.env.HERO_MIRROR_DIR || "/Users/blackspace/brand-board-builder/brand/library-images";
const DRY = process.argv.includes("--dry-run");
const STAMP = new Date().toISOString().slice(0, 10);
const PUBLIC = (path) => `${BASE}/storage/v1/object/public/brand-assets/${path}`;
const OURS = (u) => typeof u === "string" && u.startsWith(`${BASE}/storage/v1/object/public/brand-assets/`);

if (!READ_KEY) { console.error("Set SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY for mirror-only)"); process.exit(1); }
const H = (key) => ({ Authorization: `Bearer ${key}`, apikey: key });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const EXT = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg" };

mkdirSync(MIRROR, { recursive: true });

// 1. Snapshot
const r = await fetch(`${BASE}/rest/v1/public_brands?select=id,slug,hero_images&order=slug`, { headers: H(READ_KEY) });
if (!r.ok) { console.error(`read failed ${r.status}`); process.exit(1); }
const rows = await r.json();
const snapPath = join(MIRROR, `_snapshot-hero_images-${STAMP}.json`);
if (existsSync(snapPath)) {
  console.log(`snapshot exists, keeping the first one of the day: ${snapPath}`);
} else {
  writeFileSync(snapPath, JSON.stringify({ taken_at: new Date().toISOString(), brands: rows.map(({ id, slug, hero_images }) => ({ id, slug, hero_images: hero_images || [] })) }, null, 2));
  console.log(`snapshot: ${snapPath} (${rows.length} brands)`);
}

const withImages = rows.filter((x) => Array.isArray(x.hero_images) && x.hero_images.length);
console.log(`${withImages.length} brands with hero_images, ${withImages.reduce((a, x) => a + x.hero_images.length, 0)} URLs`);

async function fetchImage(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/*,*/*;q=0.8" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!EXT[type]) throw new Error(`not an image (${type || "no type"})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2048) throw new Error(`too small (${buf.length} B)`);
  return { buf, type, ext: EXT[type] };
}

// 2 + 3. Mirror, upload, record
const plan = [];
let cached = 0, broken = 0, already = 0, updated = 0, uploadFail = 0;
for (const row of withImages) {
  const entry = { id: row.id, slug: row.slug, images: [], broken: [] };
  let n = 0;
  for (const src of row.hero_images) {
    if (OURS(src)) { entry.images.push({ source: src, storage_url: src, already_cached: true }); already++; continue; }
    try {
      const { buf, type, ext } = await fetchImage(src);
      n++;
      const dir = join(MIRROR, row.slug);
      mkdirSync(dir, { recursive: true });
      const local = join(dir, `${n}.${ext}`);
      const path = `heroes/${row.slug}/${n}.${ext}`;
      if (!DRY) writeFileSync(local, buf);
      entry.images.push({ source: src, local, storage_path: path, storage_url: PUBLIC(path), type, bytes: buf.length });
      cached++;
    } catch (e) {
      entry.broken.push({ source: src, reason: e.message });
      broken++;
      console.log(`  x ${row.slug}: ${e.message}  ${src}`);
    }
  }
  plan.push(entry);
  console.log(`${row.slug}: ${entry.images.length} kept, ${entry.broken.length} broken`);
}

const planPath = join(MIRROR, `_plan-hero_images-${STAMP}.json`);
writeFileSync(planPath, JSON.stringify({ generated_at: new Date().toISOString(), mirror: MIRROR, brands: plan }, null, 2));
console.log(`plan: ${planPath}`);

if (DRY) { console.log(`dry run: ${cached} downloadable, ${broken} broken, ${already} already ours. Nothing written.`); process.exit(0); }
if (!SERVICE) {
  console.log(`\nLocal mirror done: ${cached} images saved, ${broken} broken skipped.`);
  console.log("Upload + DB update NOT done: needs SUPABASE_SERVICE_KEY (service_role key of project bukgitgwwmzdjibekmzb).");
  console.log("Re-run with it set; the script re-mirrors (idempotent) and then uploads + patches.");
  process.exit(0);
}

const { readFileSync } = await import("node:fs");
for (const entry of plan) {
  let ok = true;
  for (const img of entry.images) {
    if (img.already_cached) continue;
    const up = await fetch(`${BASE}/storage/v1/object/brand-assets/${img.storage_path}`, {
      method: "POST", headers: { ...H(SERVICE), "Content-Type": img.type, "x-upsert": "true", "Cache-Control": "max-age=31536000" },
      body: readFileSync(img.local),
    });
    if (!up.ok) { ok = false; uploadFail++; console.log(`  upload ${up.status} ${img.storage_path}`); continue; }
    const check = await fetch(img.storage_url, { method: "HEAD" });
    if (!check.ok) { ok = false; uploadFail++; console.log(`  verify ${check.status} ${img.storage_url}`); }
  }
  // Never shrink a row on a partial failure: only patch when every kept image is live.
  if (!ok) { console.log(`  skip patch ${entry.slug} (upload incomplete)`); continue; }
  const urls = entry.images.map((i) => i.storage_url);
  const patch = await fetch(`${BASE}/rest/v1/public_brands?id=eq.${entry.id}`, {
    method: "PATCH", headers: { ...H(SERVICE), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ hero_images: urls }),
  });
  if (!patch.ok) { console.log(`  patch ${patch.status} ${entry.slug}`); continue; }
  updated++;
}
console.log(`\nDone: ${cached} cached, ${already} already ours, ${broken} broken dropped, ${uploadFail} upload failures, ${updated} brands updated.`);
