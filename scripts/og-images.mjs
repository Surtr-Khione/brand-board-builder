#!/usr/bin/env node
// Generate a 1200×630 OG share card per library brand → public/og/<slug>.png
// (checked into the repo; regenerate after library changes). Black canvas,
// brand name in display weight, its real palette as swatches + edge band,
// one orbit hairline — the titanium system as a share card.
// Usage: node scripts/og-images.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://bukgitgwwmzdjibekmzb.supabase.co/functions/v1";
const KEY = process.env.SUPABASE_ANON_KEY || "";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const luma = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};

function svgFor(b) {
  const pc = b.primary_color || "#0071E3";
  const sc = b.secondary_color || "#8E8E93";
  const ac = b.accent_color || "#64D2FF";
  const ink = [pc, ac, sc].find((c) => luma(c) > 70) || "#F5F5F7";
  const name = esc(b.brand_name);
  const nameSize = b.brand_name.length > 16 ? 72 : b.brand_name.length > 10 ? 92 : 108;
  const arch = esc(b.archetype ? `${b.archetype}${b.secondary_archetype ? ` / ${b.secondary_archetype}` : ""}` : "Brand System");
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
  <ellipse cx="600" cy="700" rx="720" ry="300" fill="none" stroke="rgba(245,245,247,0.14)" stroke-width="1.5"/>
  <ellipse cx="600" cy="700" rx="480" ry="200" fill="none" stroke="rgba(245,245,247,0.10)" stroke-width="1.5"/>
  <circle cx="1042" cy="518" r="5" fill="#0071E3"/>
  <rect x="1176" y="0" width="8" height="210" fill="${pc}"/>
  <rect x="1176" y="210" width="8" height="210" fill="${sc}"/>
  <rect x="1176" y="420" width="8" height="210" fill="${ac}"/>
  <text x="84" y="110" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold" fill="#F5F5F7">BrandMD<tspan fill="#8E8E93" font-weight="normal">.space</tspan></text>
  <text x="84" y="330" font-family="Helvetica, Arial, sans-serif" font-size="${nameSize}" font-weight="bold" fill="${ink}" letter-spacing="-2">${name}</text>
  <text x="84" y="392" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#8E8E93">${arch}</text>
  <circle cx="104" cy="486" r="20" fill="${pc}" stroke="rgba(255,255,255,0.25)"/>
  <circle cx="156" cy="486" r="20" fill="${sc}" stroke="rgba(255,255,255,0.25)"/>
  <circle cx="208" cy="486" r="20" fill="${ac}" stroke="rgba(255,255,255,0.25)"/>
  <text x="84" y="566" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#6E6E73">The complete brand system — decoded on brandmd.space</text>
</svg>`;
}

const r = await fetch(`${BASE}/search-brands?limit=100`, KEY ? { headers: { Authorization: `Bearer ${KEY}` } } : undefined);
const { brands } = await r.json();
mkdirSync("public/og", { recursive: true });

let n = 0;
for (const b of brands) {
  const png = await sharp(Buffer.from(svgFor(b))).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`public/og/${b.slug}.png`, png);
  n++;
}
// Default card for non-brand pages
const home = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
  <ellipse cx="600" cy="700" rx="720" ry="300" fill="none" stroke="rgba(245,245,247,0.14)" stroke-width="1.5"/>
  <ellipse cx="600" cy="700" rx="480" ry="200" fill="none" stroke="rgba(245,245,247,0.10)" stroke-width="1.5"/>
  <circle cx="1042" cy="518" r="5" fill="#0071E3"/>
  <text x="84" y="110" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold" fill="#F5F5F7">BrandMD<tspan fill="#8E8E93" font-weight="normal">.space</tspan></text>
  <text x="84" y="300" font-family="Helvetica, Arial, sans-serif" font-size="84" font-weight="bold" fill="#F5F5F7" letter-spacing="-2">What's the <tspan fill="#0071E3">Gravity</tspan></text>
  <text x="84" y="400" font-family="Helvetica, Arial, sans-serif" font-size="84" font-weight="bold" fill="#F5F5F7" letter-spacing="-2">of your brand?</text>
  <text x="84" y="500" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#8E8E93">Free instant brand diagnosis — colors, voice, archetype, score.</text>
</svg>`;
writeFileSync("public/og/default.png", await sharp(Buffer.from(home)).png({ compressionLevel: 9 }).toBuffer());
console.log(`Wrote ${n} brand cards + default.`);
