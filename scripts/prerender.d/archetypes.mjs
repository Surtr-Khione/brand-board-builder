// Archetype research family, three levels:
//   /archetypes                         all 12 families, each with its expressions
//   /archetypes/:slug                   a family: expressions, pure-family brands, blends, patterns
//   /archetypes/:family/:expression     an expression 2+ brands hold as primary
// Same numbers as the SPA pages: both compute through archetypeData.js.
import {
  archetypeStats,
  exprDesc,
  expressionGroups,
  expressionPath,
  expressionStats,
  exprTitle,
  groupByArchetype,
  hubDesc,
  hubTitle,
  INDEX_DESC,
  INDEX_TITLE,
  labelNote,
  mappedNote,
  plural,
} from "../../src/pages/research/archetypes/archetypeData.js";

const SITE = "https://brandmd.space";
const short = (name) => String(name || "").replace(/^The /, "");
const SOURCE_NOTE = { record: "from the record", label: "from the label" };

function cta(esc) {
  return [
    `<section><h2>Chart your own brand</h2>`,
    `<p>Every brand above was decoded on the same lens. <a href="/builder">Chart your brand</a> with an archetype, enemy, values and voice, or <a href="/analyzer">scan your site</a> and see what it already says.</p>`,
    `<p><a href="/research">All brand research</a> · <a href="/archetypes">All 12 archetypes</a> · <a href="/brands">The brand index</a></p></section>`,
  ].join("\n");
}

const brandA = (b, esc) => `<a href="/brands/${esc(b.slug)}">${esc(b.brand_name)}</a>`;
const mappedSmall = (b, esc) => (mappedNote(b) ? ` <small>(${esc(mappedNote(b))})</small>` : "");

function indexBody(groups, exprByFamily, total, esc) {
  const out = [];
  out.push(`<nav><a href="/research">Research</a> / Archetypes</nav>`);
  out.push(`<h1>The 12 brand archetypes</h1>`);
  out.push(`<p>A brand archetype is the character a brand plays in its customer's story: the Hero who rises, the Sage who explains, the Outlaw who breaks the rules. Here are all twelve, the named expressions brands use for each, and every brand in the BrandMD index that holds them, counted across the ${total} brands in the index.</p>`);
  for (const g of groups) {
    const n = g.primary.length;
    const blendN = new Set(g.blend.map((x) => x.brand.slug)).size;
    const exprs = exprByFamily[g.slug] || [];
    out.push(`<section><h2><a href="/archetypes/${esc(g.slug)}">${esc(g.name)}</a></h2>`);
    out.push(`<p><em>&ldquo;${esc(g.motto)}&rdquo;</em> Core desire: ${esc(g.desire)}.</p>`);
    out.push(`<p>${plural(n, "brand")} in the index ${n === 1 ? "holds" : "hold"} it as primary archetype${blendN ? `; ${blendN} more ${blendN === 1 ? "has" : "have"} it in their blend` : ""}.</p>`);
    if (exprs.length) out.push(`<p>Expressions: ${exprs.map((e) => `<a href="${esc(expressionPath(e))}">${esc(e.name)}</a> (${e.primary.length})`).join(", ")}.</p>`);
    if (n) out.push(`<p>${g.primary.slice(0, 8).map((b) => brandA(b, esc)).join(", ")}${n > 8 ? ` and ${n - 8} more` : ""}.</p>`);
    out.push(`</section>`);
  }
  out.push(cta(esc));
  return out.join("\n");
}

function patternsHtml(s, P, n, esc) {
  const out = [];
  out.push(`<section><h2>Most common color families</h2>`);
  if (s.colorFamilies.length) {
    out.push(`<p>How many of the ${plural(s.withColors, "brand")} with stored colors use each family in their primary, secondary or accent color. Families are grouped from the hex codes by hue and lightness.</p>`);
    out.push(`<ul>${s.colorFamilies.map((f) => `<li>${esc(f.name)}: ${f.count} of ${s.withColors} (${f.hexes.slice(0, 8).map((h) => `<code>${esc(h)}</code>`).join(", ")})</li>`).join("")}</ul>`);
  } else out.push(`<p>No colors are stored for these brands.</p>`);
  out.push(`</section>`);

  out.push(`<section><h2>Fonts on record</h2>`);
  if (s.withFonts) {
    const shared = s.fonts.filter((f) => f.count >= 2);
    out.push(`<p>${plural(s.withFonts, "brand")} of ${n} ${s.withFonts === 1 ? "names its typefaces" : "name their typefaces"} in the index.${shared.length ? "" : " No typeface is shared by two of them."}</p>`);
    const rows = shared.length
      ? shared.map((f) => `<li>${esc(f.name)}: ${f.count} brands (${f.brands.map(esc).join(", ")})</li>`)
      : P.filter((b) => [b.primary_font, b.body_font, b.accent_font].some(Boolean)).map((b) => `<li>${brandA(b, esc)}: ${[b.primary_font, b.body_font, b.accent_font].filter(Boolean).map(esc).join(" · ")}</li>`);
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
  return out.join("\n");
}

function blendsAndSectors(s, n, who, esc) {
  if (!s.pairings.length && !s.sectors.length) return "";
  const out = [`<section><h2>Blends and sectors</h2><p>Computed across the ${plural(n, "brand")} ${who}.</p>`];
  if (s.pairings.length) out.push(`<h3>Archetypes they blend it with</h3><ul>${s.pairings.map((p) => `<li><a href="/archetypes/${esc(p.slug)}">${esc(p.name)}</a>: ${p.count} of ${n}</li>`).join("")}</ul>`);
  if (s.sectors.length) out.push(`<h3>Primary sectors they sit in</h3><ul>${s.sectors.map((x) => `<li><a href="/sectors/${esc(x.slug)}">${esc(x.name)}</a>: ${x.count}</li>`).join("")}</ul>`);
  out.push(`</section>`);
  return out.join("\n");
}

function hubBody(s, taxonomy, esc) {
  const n = s.primary.length;
  const the = s.name.replace(/^The /, "the ");
  const blendN = new Set(s.blend.map((x) => x.brand.slug)).size;
  const out = [];
  out.push(`<nav><a href="/research">Research</a> / <a href="/archetypes">Archetypes</a> / ${esc(short(s.name))}</nav>`);
  out.push(`<h1>${esc(s.name)} archetype</h1>`);
  out.push(`<p><em>&ldquo;${esc(s.motto)}&rdquo;</em></p>`);
  out.push(`<p>${esc(s.name)} is one of the twelve Jungian brand archetypes, the character a brand plays in its customer's story. Its core desire is ${esc(s.desire)}. ${n} of the ${s.total} brands in the BrandMD index (${s.share}%) hold it as their primary archetype, ${blendN} more have it in their blend, and the records name ${plural(s.expressions.length, "expression")} of it.</p>`);
  out.push(`<section><h2>What ${esc(the)} archetype means</h2><p>${esc(s.definition)}</p></section>`);

  if (s.expressions.length || s.pure.length) {
    out.push(`<section><h2>How brands play ${esc(the)}</h2>`);
    out.push(`<p>An expression is a named way of playing an archetype, taken from the label in each brand's own record. Definitions are BrandMD's general descriptions, not claims about any brand. An expression held as primary by two or more brands gets its own page.</p>`);
    for (const g of s.expressions) {
      const name = g.hasPage ? `<a href="${esc(expressionPath(g))}">${esc(g.name)}</a>` : esc(g.name);
      out.push(`<h3 id="${esc(g.slug)}">${name}</h3>`);
      out.push(`<p>${esc(g.definition)} ${plural(g.primary.length, "brand")} as primary${g.secondary.length ? `, ${g.secondary.length} as secondary` : ""}.</p>`);
      const items = [
        ...g.primary.map((b) => `<li>${brandA(b, esc)}${mappedSmall(b, esc)}</li>`),
        ...g.secondary.map((b) => `<li>${brandA(b, esc)} (secondary; primary: ${esc(short(taxonomy.archetypeOf(b).family.name))})${mappedSmall(b, esc)}</li>`),
      ];
      out.push(`<ul>${items.join("")}</ul>`);
    }
    if (s.pure.length) {
      out.push(`<h3 id="pure">${esc(short(s.name))}, no expression named</h3>`);
      out.push(`<p>These records label the brand with the archetype itself and name no narrower expression.</p>`);
      out.push(`<ul>${s.pure.map((b) => `<li>${brandA(b, esc)}${mappedSmall(b, esc)}</li>`).join("")}</ul>`);
    }
    out.push(`</section>`);
  }

  out.push(`<section><h2>${plural(n, "brand")} with ${esc(the)} as primary archetype</h2>`);
  if (n) {
    out.push(`<ul>${s.primary.map((b) => {
      const raw = labelNote(b, s.name);
      return `<li>${brandA(b, esc)}${b.tagline ? ` &ldquo;${esc(b.tagline)}&rdquo;` : ""}${raw ? ` <small>(labeled &ldquo;${esc(raw)}&rdquo; in its record)</small>` : ""}${mappedSmall(b, esc)}</li>`;
    }).join("")}</ul>`);
  } else out.push(`<p>No brand in the index holds ${esc(s.name)} as its primary archetype.</p>`);
  out.push(`</section>`);

  out.push(`<section><h2>${plural(blendN, "brand")} with ${esc(the)} in the blend</h2>`);
  out.push(`<p>These brands lead with another archetype and carry ${esc(the)} too. "From the record" means the record's own secondary archetype names it; "from the label" means the brand's hybrid archetype label names it.</p>`);
  if (s.blend.length) {
    out.push(`<ul>${s.blend.map((x) => {
      const p = taxonomy.archetypeOf(x.brand).family;
      return `<li>${brandA(x.brand, esc)} (primary: <a href="/archetypes/${esc(p.slug)}">${esc(p.name)}</a>${x.expression ? `; as ${esc(x.expression.name)}` : ""}; ${SOURCE_NOTE[x.source]})${mappedSmall(x.brand, esc)}</li>`;
    }).join("")}</ul>`);
  } else out.push(`<p>No brand in the index carries ${esc(s.name)} in its blend.</p>`);
  out.push(`</section>`);

  if (n) {
    out.push(blendsAndSectors(s, n, `that hold ${esc(the)} as primary`, esc));
    out.push(patternsHtml(s, s.primary, n, esc));
  }

  out.push(`<section><h2>The other archetypes</h2><ul>${taxonomy.ARCHETYPES.filter((a) => a.slug !== s.slug).map((a) => `<li><a href="/archetypes/${esc(a.slug)}">${esc(a.name)}</a></li>`).join("")}</ul></section>`);
  out.push(cta(esc));
  return out.join("\n");
}

function expressionBody(s, fam, taxonomy, esc) {
  const n = s.primary.length;
  const famThe = fam.name.replace(/^The /, "the ");
  const def = taxonomy.expressionBySlug(s.family, s.slug);
  const out = [];
  out.push(`<nav><a href="/research">Research</a> / <a href="/archetypes">Archetypes</a> / <a href="/archetypes/${esc(fam.slug)}">${esc(short(fam.name))}</a> / ${esc(s.name)}</nav>`);
  out.push(`<h1>The ${esc(s.name)} archetype</h1>`);
  out.push(`<p>The ${esc(s.name)} is one named way of playing ${esc(famThe)}, whose core desire is ${esc(fam.desire)}. ${n} of the ${s.total} brands in the BrandMD index label themselves the ${esc(s.name)} in their own record${s.secondary.length ? `, and ${s.secondary.length} more name it as their secondary archetype` : ""}.</p>`);
  out.push(`<section><h2>What the ${esc(s.name)} means</h2><p>${esc(s.definition)}</p>`);
  out.push(`<p>This definition is BrandMD's general description of the expression, not a claim about any brand.${def.aliases.length ? ` Records that say ${def.aliases.map((a) => `&ldquo;${esc(a)}&rdquo;`).join(" or ")} are read as the ${esc(s.name)} too.` : ""}${def.mapped ? ` Placing &ldquo;${esc(s.name)}&rdquo; under ${esc(famThe)} is BrandMD's reading, so every brand here is marked &ldquo;Mapped by BrandMD&rdquo;.` : ` &ldquo;${esc(s.name)}&rdquo; is a standard name for ${esc(famThe)} in archetype literature.`}</p></section>`);

  out.push(`<section><h2>${plural(n, "brand")} that label themselves the ${esc(s.name)}</h2>`);
  out.push(`<ul>${s.primary.map((b) => `<li>${brandA(b, esc)}${b.tagline ? ` &ldquo;${esc(b.tagline)}&rdquo;` : ""} <small>(labeled &ldquo;${esc(taxonomy.archetypeOf(b).raw)}&rdquo; in its record)</small>${mappedSmall(b, esc)}</li>`).join("")}</ul></section>`);

  if (s.secondary.length) {
    out.push(`<section><h2>${plural(s.secondary.length, "brand")} with the ${esc(s.name)} as secondary</h2>`);
    out.push(`<p>These records name the expression as their secondary archetype and lead with another. They are listed here but not counted in the patterns below.</p>`);
    out.push(`<ul>${s.secondary.map((b) => { const p = taxonomy.archetypeOf(b).family; return `<li>${brandA(b, esc)} (primary: <a href="/archetypes/${esc(p.slug)}">${esc(p.name)}</a>)${mappedSmall(b, esc)}</li>`; }).join("")}</ul></section>`);
  }

  out.push(blendsAndSectors(s, n, `that label themselves the ${esc(s.name)}`, esc));
  out.push(patternsHtml(s, s.primary, n, esc));

  out.push(`<section><h2>Other ways to play ${esc(famThe)}</h2><ul>`);
  for (const g of s.siblings) out.push(`<li><a href="${esc(expressionPath(g))}">${esc(g.name)}</a>: ${plural(g.primary.length, "brand")}</li>`);
  out.push(`<li><a href="/archetypes/${esc(fam.slug)}">${esc(fam.name)}</a>: the whole family</li></ul></section>`);
  out.push(cta(esc));
  return out.join("\n");
}

const crumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${path}` })),
});

export default async function ({ brands, taxonomy, esc }) {
  if (!Array.isArray(brands) || !brands.length) return [];
  const groups = groupByArchetype(brands);
  const exprs = expressionGroups(brands);
  const exprByFamily = {};
  for (const e of exprs) (exprByFamily[e.family] ||= []).push(e);
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
      crumbs([["Research", "/research"], ["Archetypes", "/archetypes"]]),
    ],
    body: indexBody(groups, exprByFamily, brands.length, esc),
  });

  for (const g of groups) {
    if (!g.primary.length && !g.blend.length) continue;
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
          hasPart: s.expressions.filter((e) => e.hasPage).map((e) => ({ "@type": "WebPage", name: `The ${e.name} archetype`, url: `${SITE}${expressionPath(e)}` })),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: n,
            itemListElement: s.primary.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.brand_name, url: `${SITE}/brands/${b.slug}` })),
          },
        },
        crumbs([["Research", "/research"], ["Archetypes", "/archetypes"], [g.name, `/archetypes/${g.slug}`]]),
      ],
      body: hubBody(s, taxonomy, esc),
    });
  }

  // Expression pages: only for expressions 2+ brands hold as primary.
  for (const e of exprs.filter((x) => x.hasPage)) {
    const s = expressionStats(brands, e.family, e.slug);
    const fam = taxonomy.archetypeBySlug(e.family);
    const n = s.primary.length;
    const path = expressionPath(e);
    pages.push({
      path,
      title: exprTitle(e.name, fam.name, n),
      description: exprDesc(e.name, fam.name, n),
      jsonld: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `The ${e.name} archetype`,
          url: `${SITE}${path}`,
          description: exprDesc(e.name, fam.name, n),
          isPartOf: { "@type": "WebPage", name: `${fam.name} archetype`, url: `${SITE}/archetypes/${fam.slug}` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: n,
            itemListElement: s.primary.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.brand_name, url: `${SITE}/brands/${b.slug}` })),
          },
        },
        crumbs([["Research", "/research"], ["Archetypes", "/archetypes"], [fam.name, `/archetypes/${fam.slug}`], [`The ${e.name}`, path]]),
      ],
      body: expressionBody(s, fam, taxonomy, esc),
    });
  }
  return pages;
}
