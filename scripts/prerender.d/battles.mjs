// Brand Battles family: /battles and /battles/<a>-vs-<b> for every curated
// RIVALS pair. Picked pairs (any two brands) are client-side only and noindex,
// so they are not prerendered and stay out of the sitemap. Built from the same
// model as the SPA pages (src/pages/research/battles/battleModel.js), so the
// crawlable body and the live page agree.
import {
  battlePairs, buildBattle, suggestBattles, pairTitle, pairDescription, HUB_TITLE, hubDescription,
  hasField, shortName, FAMILY_NAME, HUB_PATH,
} from "../../src/pages/research/battles/battleModel.js";

const SITE = "https://brandmd.space";

export default async function ({ brands, taxonomy, esc }) {
  if (!brands || !brands.length) return [];
  const bySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
  const pairs = battlePairs().filter((p) => bySlug[p.a] && bySlug[p.b]);
  if (!pairs.length) return [];
  const built = pairs.map((p) => ({ p, v: buildBattle(bySlug[p.a], bySlug[p.b], p.basis) }));
  const counts = taxonomy.expressionCounts(brands);

  const cta = `<section><h2>Chart your own brand</h2><p>Every battle here is built from a documented brand system. <a href="/builder">Chart your own brand in the Builder</a>, <a href="/analyzer">scan your site with the Analyzer</a>, or <a href="/compare">scan your site against a competitor's</a>.</p></section>`;

  // ── Hub ──
  const hubItems = built.map(({ p, v }) => {
    const arch = (s) => (s.archetypeLabel ? ` (${esc(s.archetypeLabel)})` : "");
    return `<li><a href="${esc(p.path)}">${esc(v.A.name)} vs ${esc(v.B.name)}</a>: ${esc(p.basis)}. ${esc(v.A.name)}${arch(v.A)}, ${esc(v.B.name)}${arch(v.B)}.</li>`;
  });
  const hubBody = [
    `<p><a href="/research">Research</a> / ${FAMILY_NAME}</p>`,
    `<h1>${FAMILY_NAME}</h1>`,
    `<p>Two brands, side by side, from their records in the BrandMD index of ${brands.length} brands: archetype, sector tags, enemy, promise, tagline, values, voice, colors, fonts and Gravity Score. Start with ${pairs.length} curated battles of brands in the same category, or pick any two brands yourself. Nothing is scored as a win; each page shows where the two records differ and where they overlap.</p>`,
    `<section><h2>Pick any two</h2><p>On this page, choose any two of the ${brands.length} brands in the index and open their battle. Every brand also has its own page in <a href="/brands">the brand index</a>.</p></section>`,
    `<h2>Curated battles</h2><p>Each pair is in the same category, with one line on why it is paired.</p><ul>${hubItems.join("")}</ul>`,
    cta,
    `<p><a href="/research">Back to Research</a> · <a href="/brands">All brands in the index</a></p>`,
  ].join("\n");

  const pages = [{
    path: HUB_PATH,
    title: HUB_TITLE,
    description: hubDescription(pairs.length, brands.length),
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: FAMILY_NAME,
      url: `${SITE}${HUB_PATH}`,
      hasPart: built.map(({ v }) => ({ "@type": "WebPage", name: `${v.A.name} vs ${v.B.name}`, url: `${SITE}${v.path}` })),
    },
    body: hubBody,
  }];

  // ── Battle pages ──
  const fam = (f) => `<a href="/archetypes/${esc(f.slug)}">${esc(shortName(f.name))}</a>`;
  const expr = (family, e) => {
    const href = taxonomy.expressionHref(family, e, counts);
    return href ? `<a href="${esc(href)}">${esc(e.name)}</a>` : esc(e.name);
  };
  const chip = (href, text) => (href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text));
  const cell = (s, key) => {
    if (!hasField(s, key)) return `<td><em>Not on record</em></td>`;
    const v = s[key];
    switch (key) {
      case "archetype": {
        let h = fam(v);
        if (s.expression) h += ` · ${expr(v.slug, s.expression)}<br><small>${esc(s.expression.name)}: ${esc(s.expression.definition)}</small>`;
        if (s.mappedNote) h += `<br><small>${esc(s.mappedNote)}.</small>`;
        return `<td>${h}</td>`;
      }
      case "blend":
        return `<td>${v.map((x) => fam(x.family) + (x.expression ? ` · ${expr(x.family.slug, x.expression)}` : "")).join(", ")}</td>`;
      case "sectors":
        return `<td>${v.map((t) => chip(taxonomy.sectorHref(t.slug), t.name)).join(", ")}</td>`;
      case "models":
        return `<td>${v.map((m) => `${chip(taxonomy.modelHref(m.slug), m.name)} <small>(from &ldquo;${esc(m.term)}&rdquo; in the record's industry)</small>`).join(", ")}</td>`;
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
    const next = suggestBattles(A.slug, B.slug, brands, 3);
    // Picked suggestions are noindex pages, so link only curated ones from
    // crawlable HTML; the live page shows all of them.
    const nextCurated = next.filter((s) => s.curated);
    const deeper = [];
    const pushDeeper = (href, label) => { if (href && !deeper.some((d) => d.href === href)) deeper.push({ href, label }); };
    for (const s of [A, B]) if (s.archetype) pushDeeper(`/archetypes/${s.archetype.slug}`, shortName(s.archetype.name));
    for (const s of [A, B]) for (const t of s.sectors) pushDeeper(taxonomy.sectorHref(t.slug), t.name);

    const body = [
      `<p><a href="/research">Research</a> / <a href="${HUB_PATH}">${FAMILY_NAME}</a> / ${esc(A.name)} vs ${esc(B.name)}</p>`,
      `<p>Curated brand battle</p>`,
      `<h1>${esc(A.name)} vs ${esc(B.name)}</h1>`,
      `<p><strong>Why they are paired:</strong> ${esc(p.basis)}.</p>`,
      `<p>The two brand systems side by side, each value taken from the brand's own record in the BrandMD index. Where a record has no entry for a field, it says so instead of filling one in. Archetype family, expression and sector tags are BrandMD's readings of each record's own labels. Below the table, a computed list of where the two records differ and where they overlap.</p>`,
      `<style>.vs-table{width:100%;border-collapse:collapse;margin:20px 0}.vs-table th,.vs-table td{text-align:left;vertical-align:top;padding:10px 12px;border-top:1px solid #1c1c1e;font-size:14px;color:#C7C7CC}.vs-table th[scope=row]{color:#8E8E93;font-weight:600;white-space:nowrap}.vs-table ul{margin:0;padding-left:18px}.vs-table small{color:#8E8E93}</style>`,
      `<table class="vs-table"><thead><tr><th scope="col">Field</th><th scope="col"><a href="/brands/${esc(A.slug)}">${esc(A.name)}</a></th><th scope="col"><a href="/brands/${esc(B.slug)}">${esc(B.name)}</a></th></tr></thead><tbody>`,
      ...v.rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th>${cell(A, r.key)}${cell(B, r.key)}</tr>`),
      `</tbody></table>`,
      `<p>Gravity Score measures how much of a coherent, documented identity is on record for a brand in the BrandMD index, not how successful the business is. Business-model tags appear only when the record's industry names the model.</p>`,
      `<section><h2>Where they differ</h2>${v.differ.length ? `<ul>${v.differ.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>No compared field differs.</p>`}</section>`,
      `<section><h2>Where they overlap</h2>${v.overlap.length ? `<ul>${v.overlap.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>No compared field matches.</p>`}</section>`,
      nextCurated.length ? `<section><h2>More battles in the same sector</h2><ul>${nextCurated.map((s) => `<li><a href="${esc(s.path)}">${esc(s.aName)} vs ${esc(s.bName)}</a>: ${esc(s.reason)}.</li>`).join("")}</ul></section>` : "",
      `<section><h2>Go deeper</h2><p><a href="/brands/${esc(A.slug)}">${esc(A.name)} brand system</a> · <a href="/brands/${esc(B.slug)}">${esc(B.name)} brand system</a>${deeper.map((d) => ` · <a href="${esc(d.href)}">${esc(d.label)}</a>`).join("")}</p></section>`,
      `<section><h2>Start another battle</h2><p>Pick any two brands in the index on <a href="${HUB_PATH}">${FAMILY_NAME}</a>.</p></section>`,
      `<section><h2>Scan your site against a competitor</h2><p><a href="/compare">Compare</a> scans two or three live websites side by side and scores each one.</p></section>`,
      cta,
      `<section><h2>Curated battles</h2><ul>${others.map(({ p: o, v: ov }) => `<li><a href="${esc(o.path)}">${esc(ov.A.name)} vs ${esc(ov.B.name)}</a></li>`).join("")}</ul><p><a href="${HUB_PATH}">All of ${FAMILY_NAME}</a> · <a href="/research">Back to Research</a></p></section>`,
    ].filter(Boolean).join("\n");

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
        isPartOf: { "@type": "CollectionPage", name: FAMILY_NAME, url: `${SITE}${HUB_PATH}` },
      },
      body,
    });
  }
  return pages;
}
