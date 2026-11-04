// Archetype research family: /archetypes and /archetypes/:slug.
// Same numbers as the SPA pages: both compute through archetypeData.js.
import {
  archetypeStats,
  groupByArchetype,
  hubDesc,
  hubTitle,
  INDEX_DESC,
  INDEX_TITLE,
  labelNote,
  plural,
} from "../../src/pages/research/archetypes/archetypeData.js";

const SITE = "https://brandmd.space";

function cta(esc) {
  return [
    `<section><h2>Chart your own brand</h2>`,
    `<p>Every brand above was decoded on the same lens. <a href="/builder">Chart your brand</a> with an archetype, enemy, values and voice, or <a href="/analyzer">scan your site</a> and see what it already says.</p>`,
    `<p><a href="/research">All brand research</a> · <a href="/archetypes">All 12 archetypes</a> · <a href="/brands">The brand index</a></p></section>`,
  ].join("\n");
}

function indexBody(groups, total, esc) {
  const out = [];
  out.push(`<nav><a href="/research">Research</a> / Archetypes</nav>`);
  out.push(`<h1>The 12 brand archetypes</h1>`);
  out.push(`<p>A brand archetype is the character a brand plays in its customer's story: the Hero who rises, the Sage who explains, the Outlaw who breaks the rules. Here are all twelve, with every brand in the BrandMD index that holds each one, counted across the ${total} brands in the index.</p>`);
  for (const g of groups) {
    const n = g.primary.length;
    out.push(`<section><h2><a href="/archetypes/${esc(g.slug)}">${esc(g.name)}</a></h2>`);
    out.push(`<p><em>&ldquo;${esc(g.motto)}&rdquo;</em> Core desire: ${esc(g.desire)}.</p>`);
    out.push(`<p>${plural(n, "brand")} in the index ${n === 1 ? "holds" : "hold"} it as primary archetype${g.secondary.length ? `; ${g.secondary.length} more ${g.secondary.length === 1 ? "holds" : "hold"} it as secondary` : ""}.</p>`);
    if (n) out.push(`<p>${g.primary.slice(0, 8).map((b) => `<a href="/brands/${esc(b.slug)}">${esc(b.brand_name)}</a>`).join(", ")}${n > 8 ? ` and ${n - 8} more` : ""}.</p>`);
    out.push(`</section>`);
  }
  out.push(cta(esc));
  return out.join("\n");
}

const brandA = (b, esc) => `<a href="/brands/${esc(b.slug)}">${esc(b.brand_name)}</a>`;

function hubBody(s, taxonomy, esc) {
  const n = s.primary.length;
  const the = s.name.replace(/^The /, "the ");
  const out = [];
  out.push(`<nav><a href="/research">Research</a> / <a href="/archetypes">Archetypes</a> / ${esc(s.name.replace(/^The /, ""))}</nav>`);
  out.push(`<h1>${esc(s.name)} archetype</h1>`);
  out.push(`<p><em>&ldquo;${esc(s.motto)}&rdquo;</em></p>`);
  out.push(`<p>${esc(s.name)} is one of the twelve Jungian brand archetypes, the character a brand plays in its customer's story. Its core desire is ${esc(s.desire)}. ${n} of the ${s.total} brands in the BrandMD index (${s.share}%) hold it as their primary archetype and ${s.secondary.length} hold it as secondary.</p>`);
  out.push(`<section><h2>What ${esc(the)} archetype means</h2><p>${esc(s.definition)}</p></section>`);

  out.push(`<section><h2>${plural(n, "brand")} with ${esc(the)} as primary archetype</h2>`);
  if (n) {
    out.push(`<ul>${s.primary.map((b) => {
      const raw = labelNote(b, s.name);
      return `<li>${brandA(b, esc)}${b.tagline ? ` &ldquo;${esc(b.tagline)}&rdquo;` : ""}${raw ? ` <small>(labelled &ldquo;${esc(raw)}&rdquo; in its record)</small>` : ""}</li>`;
    }).join("")}</ul>`);
  } else out.push(`<p>No brand in the index holds ${esc(s.name)} as its primary archetype.</p>`);
  out.push(`</section>`);

  out.push(`<section><h2>${plural(s.secondary.length, "brand")} with ${esc(the)} as secondary</h2>`);
  if (s.secondary.length) {
    out.push(`<ul>${s.secondary.map((b) => {
      const p = taxonomy.brandArchetypes(b).primary;
      return `<li>${brandA(b, esc)}${p ? ` (primary: <a href="/archetypes/${esc(p.slug)}">${esc(p.name)}</a>)` : ""}</li>`;
    }).join("")}</ul>`);
  } else out.push(`<p>No brand in the index lists ${esc(s.name)} as its secondary archetype.</p>`);
  out.push(`</section>`);

  if (n) {
    if (s.pairings.length || s.sectors.length) {
      out.push(`<section><h2>Pairings and sectors</h2><p>Computed across the ${plural(n, "brand")} that hold ${esc(the)} as primary.</p>`);
      if (s.pairings.length) out.push(`<h3>Secondary archetypes they pair it with</h3><ul>${s.pairings.map((p) => `<li><a href="/archetypes/${esc(p.slug)}">${esc(p.name)}</a>: ${p.count} of ${n}</li>`).join("")}</ul>`);
      if (s.sectors.length) out.push(`<h3>Sectors they sit in</h3><ul>${s.sectors.map((x) => `<li><a href="/sectors/${esc(x.slug)}">${esc(x.name)}</a>: ${x.count}</li>`).join("")}</ul>`);
      out.push(`</section>`);
    }

    out.push(`<section><h2>Most common color families</h2>`);
    if (s.colorFamilies.length) {
      out.push(`<p>How many of the ${plural(s.withColors, "brand")} with stored colors use each family in their primary, secondary or accent color. Families are grouped from the hex codes by hue and lightness.</p>`);
      out.push(`<ul>${s.colorFamilies.map((f) => `<li>${esc(f.name)}: ${f.count} of ${s.withColors} (${f.hexes.slice(0, 8).map((h) => `<code>${esc(h)}</code>`).join(", ")})</li>`).join("")}</ul>`);
    } else out.push(`<p>No colors are stored for these brands.</p>`);
    out.push(`</section>`);

    out.push(`<section><h2>Fonts on record</h2>`);
    if (s.withFonts) {
      const shared = s.fonts.filter((f) => f.count >= 2);
      out.push(`<p>${plural(s.withFonts, "brand")} of ${n} name their typefaces in the index.${shared.length ? "" : " No typeface is shared by two of them."}</p>`);
      const rows = shared.length
        ? shared.map((f) => `<li>${esc(f.name)}: ${f.count} brands (${f.brands.map(esc).join(", ")})</li>`)
        : s.primary.filter((b) => [b.primary_font, b.body_font, b.accent_font].some(Boolean)).map((b) => `<li>${brandA(b, esc)}: ${[b.primary_font, b.body_font, b.accent_font].filter(Boolean).map(esc).join(" · ")}</li>`);
      out.push(`<ul>${rows.join("")}</ul>`);
    } else out.push(`<p>None of these ${plural(n, "record")} name a typeface yet.</p>`);
    out.push(`</section>`);

    out.push(`<section><h2>What they stand against</h2><p>Each brand's stated enemy, as recorded.</p>`);
    if (s.enemyWords.length) out.push(`<p>Words that recur across the ${plural(s.enemies.length, "enemy statement")} (counted once per brand): ${s.enemyWords.map((w) => `${esc(w.word)} (${w.count})`).join(", ")}.</p>`);
    out.push(`<ul>${s.enemies.map((e) => `<li>${brandA(e.brand, esc)}: &ldquo;${esc(e.text)}&rdquo;</li>`).join("")}</ul></section>`);

    out.push(`<section><h2>What they value</h2>`);
    if (s.valueWords.length) out.push(`<p>Words that recur in the core values of ${plural(s.values.length, "brand")} (counted once per brand): ${s.valueWords.map((w) => `${esc(w.word)} (${w.count})`).join(", ")}.</p>`);
    out.push(`<ul>${s.values.map((v) => `<li>${brandA(v.brand, esc)}: ${v.values.map(esc).join(" · ")}</li>`).join("")}</ul></section>`);

    out.push(`<section><h2>How they say it</h2>`);
    if (s.withVoice) {
      out.push(`<p>Sample do and don't lines quoted from the voice rules of ${plural(s.withVoice, "brand")} of ${n} that have them on record.</p>`);
      if (s.doSamples.length) out.push(`<h3>Do</h3><ul>${s.doSamples.map((d) => `<li>${brandA(d.brand, esc)}: &ldquo;${esc(d.text)}&rdquo;</li>`).join("")}</ul>`);
      if (s.dontSamples.length) out.push(`<h3>Don't</h3><ul>${s.dontSamples.map((d) => `<li>${brandA(d.brand, esc)}: &ldquo;${esc(d.text)}&rdquo;</li>`).join("")}</ul>`);
    } else out.push(`<p>None of these ${plural(n, "record")} carry written do and don't voice rules yet.</p>`);
    out.push(`</section>`);
  }

  out.push(`<section><h2>The other archetypes</h2><ul>${taxonomy.ARCHETYPES.filter((a) => a.slug !== s.slug).map((a) => `<li><a href="/archetypes/${esc(a.slug)}">${esc(a.name)}</a></li>`).join("")}</ul></section>`);
  out.push(cta(esc));
  return out.join("\n");
}

export default async function ({ brands, taxonomy, esc }) {
  if (!Array.isArray(brands) || !brands.length) return [];
  const groups = groupByArchetype(brands);
  const pages = [];

  pages.push({
    path: "/archetypes",
    title: INDEX_TITLE,
    description: INDEX_DESC,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "The 12 brand archetypes",
        url: `${SITE}/archetypes`,
        description: INDEX_DESC,
        hasPart: groups.map((g) => ({ "@type": "WebPage", name: `${g.name} archetype`, url: `${SITE}/archetypes/${g.slug}` })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Research", item: `${SITE}/research` },
          { "@type": "ListItem", position: 2, name: "Archetypes", item: `${SITE}/archetypes` },
        ],
      },
    ],
    body: indexBody(groups, brands.length, esc),
  });

  for (const g of groups) {
    if (!g.primary.length && !g.secondary.length) continue;
    const s = archetypeStats(brands, g.slug);
    const n = s.primary.length;
    pages.push({
      path: `/archetypes/${g.slug}`,
      title: hubTitle(g.name, n),
      description: hubDesc(g.name, n),
      jsonld: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${g.name} archetype`,
          url: `${SITE}/archetypes/${g.slug}`,
          description: hubDesc(g.name, n),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: n,
            itemListElement: s.primary.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.brand_name, url: `${SITE}/brands/${b.slug}` })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Research", item: `${SITE}/research` },
            { "@type": "ListItem", position: 2, name: "Archetypes", item: `${SITE}/archetypes` },
            { "@type": "ListItem", position: 3, name: g.name, item: `${SITE}/archetypes/${g.slug}` },
          ],
        },
      ],
      body: hubBody(s, taxonomy, esc),
    });
  }
  return pages;
}
