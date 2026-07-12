#!/usr/bin/env node
// Post-build prerender: writes static HTML shells with real per-route meta
// (title, description, OG/Twitter cards, canonical, JSON-LD) so crawlers,
// social scrapers, and AI fetchers see first-class pages instead of one
// generic SPA shell. Cloudflare Pages serves these files ahead of the SPA
// fallback; the app hydrates over them on load.
// Runs as part of `npm run build`; tolerant of network failure (SPA still ships).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const SITE = "https://brandmd.space";
const API = "https://bukgitgwwmzdjibekmzb.supabase.co/functions/v1";

if (!existsSync("dist/index.html")) { console.error("dist/index.html missing — run vite build first"); process.exit(1); }
const template = readFileSync("dist/index.html", "utf8");

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page({ path, title, description, image = "/og/default.png", jsonld = null }) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${SITE}${path}" />`);
  const extra = [
    `<meta property="og:image" content="${SITE}${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:image" content="${SITE}${image}" />`,
    `<link rel="canonical" href="${SITE}${path}" />`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : "",
  ].filter(Boolean).join("\n    ");
  html = html.replace("</head>", `    ${extra}\n  </head>`);
  const dir = path === "/" ? "dist" : `dist${path}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}

// ── Static routes ──
const routes = [
  { path: "/", title: "BrandMD — What's the Gravity of your brand?", description: "Free instant brand diagnosis: scan any website for its colors, voice, and archetype, then chart, check, and monitor the complete brand system. 85 world-class brands in the public index." },
  { path: "/analyzer", title: "Free Brand Analyzer — Instant Scan & Gravity Score | BrandMD", description: "Paste a live website and see its colors, fonts, tone, and brand archetype in under a minute. Free, instant, no signup." },
  { path: "/start", title: "Start From an Idea — Build Your Startup's Brand | BrandMD", description: "No website yet? Describe your startup in a few sentences and get a complete starter brand: archetype, enemy, positioning, colors, voice, and your first three customer profiles." },
  { path: "/check", title: "Brand Check — Grade Any Draft Against Your Brand | BrandMD", description: "Paste any draft and get it graded against your brand's voice and rules, with quoted violations and an on-brand rewrite." },
  { path: "/compare", title: "Compare Brands Side by Side | BrandMD", description: "Put your site next to your competitors' — same scan, same Gravity Score, side by side. Free, no signup." },
  { path: "/brands", title: "The Brand Index — 85 World-Class Brands Decoded | BrandMD", description: "Apple, Nike, Rolex, Ferrari and 80 more — every brand decoded on the same 31-section lens: archetype, voice, colors, and the strategy underneath." },
  { path: "/blog", title: "The BrandMD Journal", description: "Brand strategy, archetypes, and coherence — read before you redesign anything." },
  { path: "/privacy", title: "Privacy Policy | BrandMD", description: "What BrandMD collects, why, and the choices you have." },
  { path: "/terms", title: "Terms of Service | BrandMD", description: "The terms that govern your use of BrandMD." },
];
for (const r of routes) page(r);

// ── Blog posts (editorials + generated breakdowns) ──
try {
  const { BLOG_POSTS } = await import("../src/lib/blogPosts.js");
  for (const post of BLOG_POSTS) {
    page({
      path: `/blog/${post.slug}`,
      title: `${post.title} | BrandMD Journal`,
      description: post.dek,
      image: post.brandSlug ? `/og/${post.brandSlug}.png` : "/og/default.png",
    });
  }
  console.log(`Prerendered ${BLOG_POSTS.length} journal posts.`);
} catch (e) { console.warn(`Blog prerender skipped: ${e.message}`); }

// ── Brand pages ──
try {
  const res = await fetch(`${API}/search-brands?limit=100`);
  const { brands } = await res.json();
  for (const b of brands) {
    const desc = (b.description || b.elevator || b.mission || `${b.brand_name}'s complete brand system.`).slice(0, 250);
    page({
      path: `/brands/${b.slug}`,
      title: `${b.brand_name} — Brand System, Archetype & Colors | BrandMD`,
      description: `${desc} Archetype: ${b.archetype || "—"}. Full palette, voice, and strategy on one page.`,
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
    });
  }
  console.log(`Prerendered ${routes.length} routes + ${brands.length} brand pages.`);
} catch (e) {
  console.warn(`Brand prerender skipped (${e.message}) — static routes still written.`);
}
