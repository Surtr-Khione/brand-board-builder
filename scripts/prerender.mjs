#!/usr/bin/env node
// Post-build prerender: writes static HTML shells with real per-route meta
// (title, description, OG/Twitter cards, canonical, JSON-LD) AND, where a page
// has one, a crawlable static body inside #root, so crawlers, social
// scrapers, and AI fetchers see first-class pages instead of one generic SPA
// shell. Cloudflare Pages serves these files ahead of the SPA fallback; the
// app's createRoot replaces the static body on load.
//
// Extension point: every scripts/prerender.d/*.mjs is loaded and called with
//   { brands, taxonomy, brandHtml, esc }
// and returns [{ path, title, description, jsonld?, body, image? }]. Every
// prerendered path lands in dist/sitemap.xml.
//
// Runs as part of `npm run build`; tolerant of network failure (SPA still ships).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import * as taxonomy from "../src/lib/brandTaxonomy.js";
import { computeGravityScore } from "../src/lib/gravityScore.js";

const SITE = "https://brandmd.space";
const HERE = dirname(fileURLToPath(import.meta.url));

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Shared brand body ──────────────────────────────────────────────────────
// Crawlable, script-free HTML for one library row. Only fields that are
// present are rendered; nothing is inferred or filled in.
const present = (v) => (Array.isArray(v) ? v.some((x) => String(x ?? "").trim()) : v !== null && v !== undefined && String(v).trim() !== "");
const list = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.name || x?.text || "")).filter((x) => String(x).trim()) : []);
const hexOk = (h) => /^#[0-9a-f]{3,8}$/i.test(String(h || "").trim());

// Expression counts across the whole index (set in main once brands load):
// an expression links to its own page only when 2+ brands share it.
let EXPR_COUNTS = null;
// Model counts likewise: a model tag links to /models/:slug only when that
// page exists (MODEL_PAGE_MIN+ tagged brands).
let MODEL_COUNTS = null;

export function brandHtml(brand, { headingLevel = 1, compact = false, exprCounts = EXPR_COUNTS, modelCounts = MODEL_COUNTS } = {}) {
  const b = brand || {};
  const H = `h${headingLevel}`;
  const H2 = `h${Math.min(headingLevel + 1, 6)}`;
  const arch = taxonomy.archetypeOf(b);
  const { all: sectors } = taxonomy.sectorsOf(b);
  const models = taxonomy.modelsOf(b);
  const bd = b.brand_data || {};
  const out = [];

  out.push(`<article class="bmd-brand" itemscope itemtype="https://schema.org/Brand">`);
  out.push(`<header><${H} itemprop="name">${esc(b.brand_name)}</${H}>`);
  if (present(b.tagline)) out.push(`<p class="tagline" itemprop="slogan">&ldquo;${esc(b.tagline)}&rdquo;</p>`);
  out.push(`</header>`);

  const facts = [];
  const short = taxonomy.shortArchetypeName;
  const famA = (f) => `<a href="/archetypes/${esc(f.slug)}">${esc(short(f.name))}</a>`;
  const exprA = (familySlug, e) => {
    const href = taxonomy.expressionHref(familySlug, e, exprCounts);
    return href ? `<a href="${esc(href)}">${esc(e.name)}</a>` : esc(e.name);
  };
  if (arch) {
    let a = famA(arch.family);
    if (arch.expression) a += ` · ${exprA(arch.family.slug, arch.expression)}<br><small>${esc(arch.expression.name)}: ${esc(arch.expression.definition)}</small>`;
    facts.push(`<dt>Archetype</dt><dd>${a}</dd>`);
    if (arch.blend.length) {
      facts.push(`<dt>Blend</dt><dd>${arch.blend.map((x) => famA(x.family) + (x.expression ? ` · ${exprA(x.family.slug, x.expression)}` : "")).join(", ")}</dd>`);
    }
    if (arch.mapped) facts.push(`<dt></dt><dd><small>${esc(arch.mappedNote)}.</small></dd>`);
  }
  const tag = (name, href) => (href ? `<a class="tag" href="${esc(href)}">${esc(name)}</a>` : `<span class="tag">${esc(name)}</span>`);
  if (sectors.length) facts.push(`<dt>${sectors.length > 1 ? "Sectors" : "Sector"}</dt><dd>${sectors.map((s) => tag(s.name, taxonomy.sectorHref(s.slug))).join(" ")}</dd>`);
  if (models.length) facts.push(`<dt>Model</dt><dd>${models.map((m) => tag(m.name, taxonomy.modelHref(m.slug, modelCounts))).join(" ")}</dd>`);
  if (present(b.industry)) facts.push(`<dt>Industry</dt><dd>${esc(b.industry)}</dd>`);
  if (present(b.founded_year)) facts.push(`<dt>Founded</dt><dd>${esc(b.founded_year)}</dd>`);
  if (present(b.country)) facts.push(`<dt>Country</dt><dd>${esc(b.country)}</dd>`);
  if (present(b.website)) facts.push(`<dt>Website</dt><dd>${esc(String(b.website).replace(/^https?:\/\//, ""))}</dd>`);
  let gravity = null;
  try { gravity = computeGravityScore(b).score; } catch { gravity = null; }
  if (Number.isFinite(gravity)) facts.push(`<dt>Gravity Score</dt><dd>${esc(gravity)} of 100 (how much of a coherent, documented identity is on record for this brand in the BrandMD index)</dd>`);
  if (facts.length) out.push(`<dl class="facts">${facts.join("")}</dl>`);

  if (present(b.description)) out.push(`<p itemprop="description">${esc(b.description)}</p>`);
  if (compact) {
    out.push(`<p><a href="/brands/${esc(b.slug)}">${esc(b.brand_name)} brand system</a> · <a href="/brands/${esc(b.slug)}/brand.md">brand.md</a></p>`);
    out.push(`</article>`);
    return out.join("\n");
  }

  const section = (title, html) => out.push(`<section><${H2}>${esc(title)}</${H2}>${html}</section>`);
  const para = (v) => `<p>${esc(v)}</p>`;
  const ul = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

  if (present(b.mission)) section("Mission", para(b.mission));
  if (present(b.vision)) section("Vision", para(b.vision));
  if (present(b.brand_promise)) section("Brand promise", para(b.brand_promise));
  if (list(b.core_values).length) section("Values", ul(list(b.core_values)));
  if (present(b.enemy)) section("Enemy", para(b.enemy));

  const tone = list(b.tone_attributes);
  const dos = list(b.do_say).length ? list(b.do_say) : list(bd.messagingDos);
  const donts = list(b.dont_say).length ? list(b.dont_say) : list(bd.messagingDonts);
  if (tone.length || dos.length || donts.length) {
    let v = "";
    if (tone.length) v += `<p>Tone: ${tone.map(esc).join(" · ")}</p>`;
    if (dos.length) v += `<h${Math.min(headingLevel + 2, 6)}>Do</h${Math.min(headingLevel + 2, 6)}>${ul(dos)}`;
    if (donts.length) v += `<h${Math.min(headingLevel + 2, 6)}>Don't</h${Math.min(headingLevel + 2, 6)}>${ul(donts)}`;
    section("Voice", v);
  }

  const colors = [["Primary", b.primary_color], ["Secondary", b.secondary_color], ["Accent", b.accent_color]].filter(([, h]) => hexOk(h));
  if (colors.length) {
    section("Colors", `<ul class="palette">${colors
      .map(([role, h]) => `<li><span class="swatch" style="background:${esc(h)}"></span>${esc(role)}: <code>${esc(String(h).toUpperCase())}</code></li>`)
      .join("")}</ul>`);
  }
  const fonts = [["Display", b.primary_font], ["Body", b.body_font], ["Accent", b.accent_font]].filter(([, f]) => present(f));
  if (fonts.length) section("Typography", ul(fonts.map(([role, f]) => `${role}: ${f}`)));

  out.push(`<p class="links"><a href="/brands/${esc(b.slug)}/brand.md">${esc(b.brand_name)} brand.md</a> (the full brand system as an AI-readable context file) · <a href="/brands">All brands in the index</a></p>`);
  out.push(`</article>`);
  return out.join("\n");
}

// Minimal styles so the static body reads well for the instant before the
// SPA mounts (and for anyone without JS). Titanium system, Inter only.
const STATIC_CSS = `<style>
      body{background:#000;margin:0}
      .bmd-static{background:#000;color:#F5F5F7;font-family:'Inter',-apple-system,sans-serif;max-width:860px;margin:0 auto;padding:56px 20px 80px;line-height:1.6}
      .bmd-static h1{font-size:40px;letter-spacing:-1px;line-height:1.1;margin:0 0 12px}
      .bmd-static h2{font-size:20px;margin:36px 0 10px}
      .bmd-static h3{font-size:15px;margin:18px 0 6px;color:#8E8E93}
      .bmd-static p,.bmd-static li,.bmd-static dd{color:#C7C7CC;font-size:15px}
      .bmd-static a{color:#2997FF}
      .bmd-static dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 18px;margin:20px 0}
      .bmd-static dt{color:#8E8E93;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-top:3px}
      .bmd-static ul{padding-left:20px}
      .bmd-static .tagline{font-size:18px;font-style:italic;color:#8E8E93}
      .bmd-static .palette{list-style:none;padding:0}
      .bmd-static .swatch{display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:8px;vertical-align:-2px;border:1px solid rgba(255,255,255,.15)}
      .bmd-static code{font-family:ui-monospace,monospace;color:#F5F5F7}
      .bmd-static dd small{font-size:12px;color:#8E8E93}
      .bmd-static .tag{display:inline-block;font-size:12px;padding:3px 10px;margin:0 6px 6px 0;border-radius:20px;border:1px solid #222;background:#0c0c0c;color:#C7C7CC;text-decoration:none}
    </style>`;

// ── Page writer ────────────────────────────────────────────────────────────
let template = null;
const written = new Set();

function page({ path, title, description, image = "/og/default.png", jsonld = null, body = null }) {
  if (!path || !path.startsWith("/")) { console.warn(`Skipped page with bad path: ${path}`); return; }
  if (written.has(path)) { console.warn(`Skipped duplicate prerender path: ${path}`); return; }
  let html = template;
  // Function replacers: a `$&`, `$'` or `$$` in brand text must stay literal.
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${esc(description)}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/, () => `<meta property="og:title" content="${esc(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, () => `<meta property="og:description" content="${esc(description)}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, () => `<meta property="og:url" content="${SITE}${path}" />`);
  const ld = Array.isArray(jsonld) ? jsonld : jsonld ? [jsonld] : [];
  const extra = [
    `<meta property="og:image" content="${SITE}${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:image" content="${SITE}${image}" />`,
    `<link rel="canonical" href="${SITE}${path}" />`,
    ...ld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
    body ? STATIC_CSS : "",
  ].filter(Boolean).join("\n    ");
  html = html.replace("</head>", () => `    ${extra}\n  </head>`);
  if (body) html = html.replace(/<div id="root"><\/div>/, () => `<div id="root"><main class="bmd-static">\n${body}\n</main></div>`);
  // /x is written as dist/x.html, not dist/x/index.html: Cloudflare Pages
  // serves /x from x.html with a 200, while a directory index makes it answer
  // /x with a 308 to /x/, so every canonical, og:url and sitemap URL (all
  // slash-less) would redirect. The root stays dist/index.html.
  const file = path === "/" ? "dist/index.html" : `dist${path.replace(/\/+$/, "")}.html`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  written.add(path);
}

// The library is the static file the site itself serves (public/data/brands.json, from scripts/snapshot-brands.py),
// so a build never depends on the database being reachable.
async function fetchAllBrands() {
  const file = new URL("../public/data/brands.json", import.meta.url);
  const { brands } = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(brands)) throw new Error("public/data/brands.json has no brands array");
  return [...brands].sort((a, b) => String(a.brand_name).localeCompare(String(b.brand_name)));
}

function brandsIndexBody(brands) {
  const items = brands.map((b) => {
    const a = taxonomy.canonicalArchetype(b.archetype);
    const s = taxonomy.sectorOf(b.industry);
    const meta = [a ? `<a href="/archetypes/${esc(a.slug)}">${esc(a.name)}</a>` : "", s ? `<a href="/sectors/${esc(s.slug)}">${esc(s.name)}</a>` : ""].filter(Boolean).join(" · ");
    return `<li><a href="/brands/${esc(b.slug)}"><strong>${esc(b.brand_name)}</strong></a>${present(b.tagline) ? ` &ldquo;${esc(b.tagline)}&rdquo;` : ""}${meta ? ` <small>${meta}</small>` : ""}</li>`;
  });
  return [
    `<h1>The Brand Index</h1>`,
    `<p>${brands.length} brands decoded on the same lens: archetype, mission, values, voice, colors and type. Every brand links to its full brand system and its brand.md context file.</p>`,
    `<ul class="bmd-brand-list">${items.join("\n")}</ul>`,
  ].join("\n");
}

async function main() {
  if (!existsSync("dist/index.html")) { console.error("dist/index.html missing — run vite build first"); process.exit(1); }
  template = readFileSync("dist/index.html", "utf8");

  let brands = [];
  try { brands = await fetchAllBrands(); }
  catch (e) { console.warn(`Brand fetch failed (${e.message}) — brand pages and brand bodies skipped, static routes still written.`); }
  const n = brands.length;
  EXPR_COUNTS = taxonomy.expressionCounts(brands);
  MODEL_COUNTS = taxonomy.modelCounts(brands);

  // ── Static routes ──
  const routes = [
    { path: "/", title: "BrandMD — What's the Gravity of your brand?", description: `Free instant brand diagnosis: scan any website for its colors, voice, and archetype, then chart, check, and monitor the complete brand system. ${n || 85} world-class brands in the public index.` },
    { path: "/analyzer", title: "Free Brand Analyzer — Instant Scan & Gravity Score | BrandMD", description: "Paste a live website and see its colors, fonts, tone, and brand archetype in under a minute. Free, instant, no signup." },
    { path: "/start", title: "Start From an Idea — Build Your Startup's Brand | BrandMD", description: "No website yet? Describe your startup in a few sentences and get a complete starter brand: archetype, enemy, positioning, colors, voice, and your first three customer profiles." },
    { path: "/check", title: "Brand Check — Grade Any Draft Against Your Brand | BrandMD", description: "Paste any draft and get it graded against your brand's voice and rules, with quoted violations and an on-brand rewrite." },
    { path: "/compare", title: "Compare Brands Side by Side | BrandMD", description: "Put your site next to your competitors' — same scan, same Gravity Score, side by side. Free, no signup." },
    { path: "/brands", title: `The Brand Index — ${n || 85} World-Class Brands Decoded | BrandMD`, description: `Apple, Nike, Rolex, Ferrari and ${(n || 85) - 4} more — every brand decoded on the same 31-section lens: archetype, voice, colors, and the strategy underneath.`, body: n ? brandsIndexBody(brands) : null },
    { path: "/privacy", title: "Privacy Policy | BrandMD", description: "What BrandMD collects, why, and the choices you have." },
    { path: "/terms", title: "Terms of Service | BrandMD", description: "The terms that govern your use of BrandMD." },
  ];
  for (const r of routes) page(r);
  const counts = { static: routes.length, blog: 0, brands: 0, bodies: routes.filter((r) => r.body).length };

  // ── /blog/* is the BrandMD Journal: its own static build (content-network site package `brandmd`) with its own
  //    sitemap at /blog/sitemap.xml, served by the path-router Worker. Nothing to prerender here. ──

  // ── Brand pages ──
  for (const b of brands) {
    const desc = (b.description || b.elevator || b.mission || `${b.brand_name}'s complete brand system.`).slice(0, 250);
    const arch = taxonomy.canonicalArchetype(b.archetype);
    page({
      path: `/brands/${b.slug}`,
      title: `${b.brand_name} — Brand System, Archetype & Colors | BrandMD`,
      description: `${desc}${arch ? ` Archetype: ${arch.name}.` : ""} Full palette, voice, and strategy on one page.`,
      image: `/og/${b.slug}.png`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Brand",
        name: b.brand_name,
        url: b.website ? `https://${b.website.replace(/^https?:\/\//, "")}` : undefined,
        description: desc,
        logo: b.logo_url || undefined,
        slogan: b.tagline || undefined,
        mainEntityOfPage: `${SITE}/brands/${b.slug}`,
      },
      body: brandHtml(b),
    });
    counts.brands++;
    counts.bodies++;
  }

  // ── Research families: scripts/prerender.d/*.mjs ──
  const dDir = join(HERE, "prerender.d");
  const familyCounts = {};
  if (existsSync(dDir)) {
    for (const file of readdirSync(dDir).filter((f) => f.endsWith(".mjs")).sort()) {
      try {
        const mod = await import(pathToFileURL(join(dDir, file)).href);
        const pages = (await mod.default({ brands, taxonomy, brandHtml, esc })) || [];
        let k = 0;
        for (const p of pages) {
          const before = written.size;
          page(p);
          if (written.size > before) { k++; if (p.body) counts.bodies++; }
        }
        familyCounts[file.replace(/\.mjs$/, "")] = k;
      } catch (e) { console.warn(`prerender.d/${file} skipped: ${e.message}`); }
    }
  }

  // ── Sitemap ──
  const today = new Date().toISOString().slice(0, 10);
  const urls = [...written].sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((p) => `  <url><loc>${SITE}${p === "/" ? "/" : esc(p)}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  writeFileSync("dist/sitemap.xml", sitemap);

  const fam = Object.entries(familyCounts).map(([f, k]) => `${f} ${k}`).join(", ");
  console.log(`Prerendered ${written.size} pages: ${counts.static} static routes, ${counts.brands} brand pages${fam ? `, research families (${fam})` : ", no research families yet"}; ${counts.bodies} with crawlable bodies. Sitemap: ${urls.length} URLs.`);
}

// Run only when executed directly, so brandHtml/esc can be imported for tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
