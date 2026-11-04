// Versus family: /versus and /versus/<a>-vs-<b> for every curated RIVALS pair.
// Built from the same model as the SPA pages (src/pages/research/versus/
// versusModel.js), so the crawlable body and the live page agree.
import {
  versusPairs, buildVersus, pairTitle, pairDescription, HUB_TITLE, hubDescription, hasField,
} from "../../src/pages/research/versus/versusModel.js";

const SITE = "https://brandmd.space";

export default async function ({ brands, esc }) {
  if (!brands || !brands.length) return [];
  const bySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
  const pairs = versusPairs().filter((p) => bySlug[p.a] && bySlug[p.b]);
  if (!pairs.length) return [];
  const built = pairs.map((p) => ({ p, v: buildVersus(bySlug[p.a], bySlug[p.b], p.basis) }));

  const cta = `<section><h2>Chart your own brand</h2><p>Every comparison here is built from a documented brand system. <a href="/builder">Chart your own brand in the Builder</a>, <a href="/analyzer">scan your site with the Analyzer</a>, or <a href="/compare">scan your site against a competitor's</a>.</p></section>`;

  // ── Hub ──
  const hubItems = built.map(({ p, v }) => {
    const arch = (s) => (s.archetype ? ` (${esc(s.archetype.name)})` : "");
    return `<li><a href="${esc(p.path)}">${esc(v.A.name)} vs ${esc(v.B.name)}</a>: ${esc(p.basis)}. ${esc(v.A.name)}${arch(v.A)}, ${esc(v.B.name)}${arch(v.B)}.</li>`;
  });
  const hubBody = [
    `<p><a href="/research">Research</a> / Versus</p>`,
    `<h1>Brand vs Brand</h1>`,
    `<p>${pairs.length} pairs of brands in the same category, each set side by side from their records in the BrandMD index of ${brands.length} brands: archetype, enemy, promise, tagline, values, voice, colors, fonts and Gravity Score. Each pair is listed with the one line that explains why it is paired, and nothing else is claimed about how the two compete.</p>`,
    `<h2>All matchups</h2><ul>${hubItems.join("")}</ul>`,
    cta,
    `<p><a href="/research">Back to Research</a> · <a href="/brands">All brands in the index</a></p>`,
  ].join("\n");

  const pages = [{
    path: "/versus",
    title: HUB_TITLE,
    description: hubDescription(pairs.length, brands.length),
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Brand vs Brand",
      url: `${SITE}/versus`,
      hasPart: built.map(({ v }) => ({ "@type": "WebPage", name: `${v.A.name} vs ${v.B.name}`, url: `${SITE}${v.path}` })),
    },
    body: hubBody,
  }];

  // ── Pair pages ──
  const cell = (s, key) => {
    if (!hasField(s, key)) return `<td><em>Not on record</em></td>`;
    const v = s[key];
    switch (key) {
      case "archetype": {
        let h = `<a href="/archetypes/${esc(v.slug)}">${esc(v.name)}</a>`;
        if (s.secondary) h += ` with <a href="/archetypes/${esc(s.secondary.slug)}">${esc(s.secondary.name)}</a> as secondary`;
        if (s.rawArchetype && s.rawArchetype !== v.name) h += ` (recorded as "${esc(s.rawArchetype)}")`;
        return `<td>${h}</td>`;
      }
      case "sector":
        return `<td><a href="/sectors/${esc(v.slug)}">${esc(v.name)}</a>${s.industry ? ` (${esc(s.industry)})` : ""}</td>`;
      case "tagline":
        return `<td>&ldquo;${esc(v)}&rdquo;</td>`;
      case "values": case "dos": case "donts":
        return `<td><ul>${v.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></td>`;
      case "tone":
        return `<td>${v.map(esc).join(" · ")}</td>`;
      case "colors":
        return `<td><ul class="palette">${v.map((c) => `<li><span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.role)}: <code>${esc(c.hex)}</code></li>`).join("")}</ul></td>`;
      case "fonts":
        return `<td><ul>${v.map((f) => `<li>${esc(f.role)}: ${esc(f.name)}</li>`).join("")}</ul></td>`;
      case "gravity":
        return `<td>${esc(v)} of 100</td>`;
      default:
        return `<td>${esc(v)}</td>`;
    }
  };

  for (const { p, v } of built) {
    const { A, B } = v;
    const others = built.filter((x) => x.p.key !== p.key);
    const body = [
        `<p><a href="/research">Research</a> / <a href="/versus">Versus</a> / ${esc(A.name)} vs ${esc(B.name)}</p>`,
      `<h1>${esc(A.name)} vs ${esc(B.name)}</h1>`,
      `<p><strong>Why they are paired:</strong> ${esc(p.basis)}.</p>`,
      `<p>The two brand systems side by side, each value taken from the brand's own record in the BrandMD index. Where a record has no entry for a field, it says so instead of filling one in. Below the table, a computed list of where the two records differ and where they overlap.</p>`,
      `<style>.vs-table{width:100%;border-collapse:collapse;margin:20px 0}.vs-table th,.vs-table td{text-align:left;vertical-align:top;padding:10px 12px;border-top:1px solid #1c1c1e;font-size:14px;color:#C7C7CC}.vs-table th[scope=row]{color:#8E8E93;font-weight:600;white-space:nowrap}.vs-table ul{margin:0;padding-left:18px}</style>`,
      `<table class="vs-table"><thead><tr><th scope="col">Field</th><th scope="col"><a href="/brands/${esc(A.slug)}">${esc(A.name)}</a></th><th scope="col"><a href="/brands/${esc(B.slug)}">${esc(B.name)}</a></th></tr></thead><tbody>`,
      ...v.rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th>${cell(A, r.key)}${cell(B, r.key)}</tr>`),
      `</tbody></table>`,
      `<p>Gravity Score measures how much of a coherent, documented identity is on record for a brand in the BrandMD index, not how successful the business is.</p>`,
      `<section><h2>Where they differ</h2>${v.differ.length ? `<ul>${v.differ.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>No compared field differs.</p>`}</section>`,
      `<section><h2>Where they overlap</h2>${v.overlap.length ? `<ul>${v.overlap.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>No compared field matches.</p>`}</section>`,
      `<section><h2>Go deeper</h2><p><a href="/brands/${esc(A.slug)}">${esc(A.name)} brand system</a> · <a href="/brands/${esc(B.slug)}">${esc(B.name)} brand system</a>${A.archetype ? ` · <a href="/archetypes/${esc(A.archetype.slug)}">${esc(A.archetype.name)}</a>` : ""}${B.archetype && (!A.archetype || B.archetype.slug !== A.archetype.slug) ? ` · <a href="/archetypes/${esc(B.archetype.slug)}">${esc(B.archetype.name)}</a>` : ""}${A.sector ? ` · <a href="/sectors/${esc(A.sector.slug)}">${esc(A.sector.name)}</a>` : ""}${B.sector && (!A.sector || B.sector.slug !== A.sector.slug) ? ` · <a href="/sectors/${esc(B.sector.slug)}">${esc(B.sector.name)}</a>` : ""}</p></section>`,
      `<section><h2>Scan your site against a competitor</h2><p><a href="/compare">Compare</a> scans two or three live websites side by side and scores each one.</p></section>`,
      cta,
      `<section><h2>More matchups</h2><ul>${others.map(({ p: o, v: ov }) => `<li><a href="${esc(o.path)}">${esc(ov.A.name)} vs ${esc(ov.B.name)}</a></li>`).join("")}</ul><p><a href="/versus">All matchups</a> · <a href="/research">Back to Research</a></p></section>`,
      ].join("\n");

    pages.push({
      path: v.path,
      title: pairTitle(A, B),
      description: pairDescription(A, B),
      jsonld: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${A.name} vs ${B.name}`,
        url: `${SITE}${v.path}`,
        about: [A, B].map((s) => ({ "@type": "Brand", name: s.name, url: `${SITE}/brands/${s.slug}` })),
        isPartOf: { "@type": "CollectionPage", name: "Brand vs Brand", url: `${SITE}/versus` },
      },
      body,
    });
  }
  return pages;
}
