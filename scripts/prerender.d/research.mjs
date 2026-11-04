// /research hub: one card per research family. The cards come from the
// `hub` export of each src/research/routes/<family>.jsx, read here as text
// (the route files are JSX, which node cannot import), so the static page
// and the SPA list the same families with the same copy.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RESEARCH_TITLE, researchDescription, researchIntro, orderHubs, LIBRARY_CARD } from "../../src/pages/research/hub/researchHubData.js";

const SITE = "https://brandmd.space";
const ROUTES = join(dirname(fileURLToPath(import.meta.url)), "../../src/research/routes");

// Pull the { title, blurb, href } string literals out of `export const hub = { ... };`.
function readHub(src) {
  const m = src.match(/export\s+const\s+hub\s*=\s*\{([\s\S]*?)\n\};/);
  if (!m) return null;
  const field = (k) => {
    const f = m[1].match(new RegExp(`\\b${k}\\s*:\\s*(["'\`])((?:\\\\.|(?!\\1)[\\s\\S])*?)\\1`));
    return f ? f[2].replace(/\\(["'`\\])/g, "$1") : null;
  };
  const hub = { title: field("title"), blurb: field("blurb"), href: field("href") };
  return hub.title && hub.href ? hub : null;
}

export function readHubs() {
  return readdirSync(ROUTES)
    .filter((f) => f.endsWith(".jsx"))
    .sort()
    .map((f) => readHub(readFileSync(join(ROUTES, f), "utf8")))
    .filter(Boolean);
}

export default async function ({ brands, esc }) {
  const n = Array.isArray(brands) ? brands.length : 0;
  const cards = [...orderHubs(readHubs()), LIBRARY_CARD];
  const body = [
    `<h1>Brand research</h1>`,
    `<p>${esc(researchIntro(n))}</p>`,
    `<ul>`,
    ...cards.map((h) => `<li><h2><a href="${esc(h.href)}">${esc(h.title)}</a></h2><p>${esc(h.blurb)}</p></li>`),
    `</ul>`,
    `<section><h2>Chart your own brand</h2><p>Every brand in this research was decoded on the same lens. <a href="/builder">Chart your brand</a>, or <a href="/analyzer">scan your site</a> and see what it already says.</p></section>`,
  ].join("\n");
  return [{
    path: "/research",
    title: RESEARCH_TITLE,
    description: researchDescription(n),
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Brand research",
      url: `${SITE}/research`,
      description: researchDescription(n),
      hasPart: cards.map((h) => ({ "@type": "CollectionPage", name: h.title, url: `${SITE}${h.href}` })),
    },
    body,
  }];
}
