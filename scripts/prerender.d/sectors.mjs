// Sector research pages: /sectors and /sectors/:slug.
// Crawlable static bodies built from the same rollups the SPA renders
// (src/pages/research/sectors/sectorData.js), so the two never disagree.
import { buildSectors, sectorIntro, sectorMeta, hubMeta, listJoin, countLine, GRAVITY_NOTE, COUNT_NOTE } from "../../src/pages/research/sectors/sectorData.js";

const SITE = "https://brandmd.space";

function cta(esc, heading) {
  return [
    `<section><h2>${esc(heading)}</h2>`,
    `<p>Every brand above was decoded into archetype, voice, colors and type. <a href="/builder">Chart your own brand</a> on the same lens, or <a href="/analyzer">scan your site</a> and see where it already stands.</p></section>`,
  ].join("");
}

function hubBody(sectors, total, multi, esc) {
  const out = [];
  out.push(`<nav aria-label="Breadcrumb"><a href="/research">Research</a> / Sectors</nav>`);
  out.push(`<h1>Brands by sector</h1>`);
  out.push(`<p>The ${total} brands in the BrandMD index, grouped into ${sectors.length} sectors by the industry each brand's record lists. Each brand has one primary sector; ${multi} also carry further sector tags because their industry text names more than one. Each sector page shows which archetypes its brands play, how their Gravity Scores compare, the colors and type they share, and how each brand describes what sets it apart, quoted from its record.</p>`);
  out.push(`<ul>`);
  for (const d of sectors) {
    const mix = d.archetypeMix.map((a) => `${esc(a.name)} ${a.count}`).join(", ");
    out.push(`<li><h2><a href="/sectors/${esc(d.sector.slug)}">${esc(d.sector.name)}</a></h2>`
      + `<p>${esc(countLine(d))}${d.avgGravity !== null ? `; average Gravity Score of the primary brands ${d.avgGravity} of 100` : ""}. Primary archetypes: ${mix}.</p>`
      + `<p>${d.rows.map((r) => `<a href="/brands/${esc(r.slug)}">${esc(r.name)}</a>`).join(", ")}</p>`
      + (d.also.length ? `<p>Also tagged: ${d.also.map((r) => `<a href="/brands/${esc(r.slug)}">${esc(r.name)}</a>`).join(", ")}</p>` : "")
      + `</li>`);
  }
  out.push(`</ul>`);
  out.push(`<p>${esc(COUNT_NOTE)} ${esc(GRAVITY_NOTE)} See also <a href="/archetypes">brands by archetype</a> and the full <a href="/brands">brand index</a>.</p>`);
  out.push(cta(esc, "Chart your own brand on the same lens"));
  return out.join("\n");
}

function sectorBody(d, sectors, esc) {
  const out = [];
  out.push(`<nav aria-label="Breadcrumb"><a href="/research">Research</a> / <a href="/sectors">Sectors</a> / ${esc(d.sector.name)}</nav>`);
  out.push(`<h1>${esc(d.sector.name)} brands</h1>`);
  out.push(`<p>${esc(sectorIntro(d))}</p>`);

  // Brands (primary), then brands tagged with this sector as a further sector.
  const tagsCell = (r) => r.sectors.map((t) => (t.slug === d.sector.slug
    ? `<strong>${esc(t.name)}</strong>`
    : `<a href="/sectors/${esc(t.slug)}">${esc(t.name)}</a>`)).join(", ");
  const row = (r, withIndustry) => {
    const arch = r.archetype
      ? `<a href="/archetypes/${esc(r.archetype.slug)}">${esc(r.archetype.name)}</a>${r.expression ? ` · ${esc(r.expression.name)}` : ""}${r.secondary ? ` with <a href="/archetypes/${esc(r.secondary.slug)}">${esc(r.secondary.name)}</a>` : ""}`
      : "";
    const ind = withIndustry && r.industry ? `<br><small>Industry on record: ${esc(r.industry)}</small>` : "";
    return `<tr><td><a href="/brands/${esc(r.slug)}">${esc(r.name)}</a>${r.tagline ? ` <small>&ldquo;${esc(r.tagline)}&rdquo;</small>` : ""}${ind}</td><td>${tagsCell(r)}</td><td>${arch}</td><td>${r.gravity ?? ""}</td></tr>`;
  };
  const head = `<table><thead><tr><th scope="col">Brand</th><th scope="col">Sector tags</th><th scope="col">Archetype</th><th scope="col">Gravity Score</th></tr></thead><tbody>`;
  out.push(`<section><h2>${d.n} primary brand${d.n === 1 ? "" : "s"}, by Gravity Score</h2>`);
  out.push(`<p>Brands filed under ${esc(d.sector.name)} as their primary sector. ${esc(GRAVITY_NOTE)} Industries here, as recorded: ${esc(d.industries.join("; "))}.</p>`);
  out.push(head);
  for (const r of d.rows) out.push(row(r, false));
  out.push(`</tbody></table></section>`);
  if (d.also.length) {
    out.push(`<section><h2>Also in this sector: ${d.also.length} more brand${d.also.length === 1 ? "" : "s"} tagged ${esc(d.sector.name)}</h2>`);
    out.push(`<p>Their primary sector is elsewhere, but the industry text on their record also names ${esc(d.sector.name)}. They are not counted in the archetype mix, Gravity, color or type figures on this page. ${esc(COUNT_NOTE)}</p>`);
    out.push(head);
    for (const r of d.also) out.push(row(r, true));
    out.push(`</tbody></table></section>`);
  }

  // Archetype mix
  out.push(`<section><h2>Archetype mix</h2>`);
  out.push(`<p>The ${d.n} primary brands, each counted once under its primary archetype, with the same archetype's share across all ${d.total} brands in the index for comparison.</p><ul>`);
  for (const a of d.archetypeMix) {
    out.push(`<li><a href="/archetypes/${esc(a.slug)}">${esc(a.name)}</a>: ${a.count} of ${d.n} (${a.share}%; ${a.indexShare}% across the index). ${a.brands.map((b) => `<a href="/brands/${esc(b.slug)}">${esc(b.name)}</a>`).join(", ")}</li>`);
  }
  out.push(`</ul></section>`);

  // Color
  out.push(`<section><h2>Color patterns</h2>`);
  out.push(`<p>Color families are computed from each recorded hex value's hue and lightness. Across the ${d.withPrimaryCount} brands here with a recorded primary color: ${d.primaryFamilies.map((f) => `${esc(f.name.toLowerCase())} ${f.count} (${esc(f.brands.join(", "))})`).join("; ")}.</p>`);
  out.push(`<ul class="palette">`);
  for (const r of d.rows.filter((x) => x.colors.length)) {
    out.push(`<li><a href="/brands/${esc(r.slug)}">${esc(r.name)}</a>: ${r.colors.map((c) => `<span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.role)} <code>${esc(c.hex)}</code>`).join(" ")}</li>`);
  }
  out.push(`</ul>`);
  if (d.sharedHexes.length) out.push(`<p>Exact hex values recorded by more than one brand here (pure white and black left out): ${d.sharedHexes.map((h) => `<code>${esc(h.hex)}</code> ${esc(listJoin(h.brands))}`).join("; ")}.</p>`);
  out.push(`</section>`);

  // Type and tone
  if (d.withFontsCount || d.sharedTone.length) {
    out.push(`<section><h2>Type and tone</h2>`);
    if (d.withFontsCount) {
      out.push(`<p>${d.withFontsCount} of the ${d.n} brands here have typefaces recorded.${d.sharedFonts.length ? ` Shared by more than one: ${esc(d.sharedFonts.map((f) => `${f.name} (${listJoin(f.brands)})`).join("; "))}.` : " No typeface is recorded by more than one of them."}</p><ul>`);
      for (const r of d.rows.filter((x) => x.fonts.length)) out.push(`<li><a href="/brands/${esc(r.slug)}">${esc(r.name)}</a>: ${esc(r.fonts.map((f) => `${f.role}: ${f.name}`).join(" · "))}</li>`);
      out.push(`</ul>`);
    }
    if (d.sharedTone.length) out.push(`<p>Tone words recorded by two or more brands here: ${esc(d.sharedTone.map((t) => `${t.word} (${listJoin(t.brands)})`).join("; "))}.</p>`);
    out.push(`</section>`);
  }

  // How they differ
  const quoted = d.rows.filter((r) => r.positioning);
  if (quoted.length) {
    out.push(`<section><h2>How they differ, from their BrandMD records</h2>`);
    out.push(`<p>One positioning line per brand from its BrandMD record. These lines are BrandMD's own research summaries, not statements by the brands, and sentences carrying figures or naming other brands are left out.</p>`);
    for (const r of quoted) {
      out.push(`<figure><figcaption><h3><a href="/brands/${esc(r.slug)}">${esc(r.name)}</a></h3></figcaption>`);
      out.push(`<p>${esc(r.positioning)}</p>`);
      out.push(`</figure>`);
    }
    out.push(`</section>`);
  }

  if (d.rivals.length) {
    out.push(`<section><h2>Brands here that sell the same thing</h2><ul>`);
    for (const p of d.rivals) out.push(`<li><a href="/brands/${esc(p.a.slug)}">${esc(p.a.name)}</a> and <a href="/brands/${esc(p.b.slug)}">${esc(p.b.name)}</a>: ${esc(p.basis)}. <a href="${esc(p.battle)}">${esc(p.a.name)} vs ${esc(p.b.name)}, side by side</a></li>`);
    out.push(`</ul></section>`);
  }

  out.push(`<section><h2>Other sectors</h2><p>${sectors.filter((s) => s.sector.slug !== d.sector.slug).map((s) => `<a href="/sectors/${esc(s.sector.slug)}">${esc(s.sector.name)}</a> (${esc(countLine(s))})`).join(" · ")}</p>`);
  out.push(`<p><a href="/sectors">All sectors</a> · <a href="/brands?sector=${esc(d.sector.slug)}">${esc(d.sector.name)} in the Library</a> · <a href="/archetypes">Brands by archetype</a> · <a href="/research">All research</a></p></section>`);
  out.push(cta(esc, `Chart your brand next to ${d.sector.name}`));
  return out.join("\n");
}

export default async function ({ brands, esc }) {
  if (!Array.isArray(brands) || !brands.length) return [];
  const { sectors, total, multi } = buildSectors(brands);
  if (!sectors.length) return [];

  const hub = hubMeta(total, sectors.length);
  const pages = [{
    path: "/sectors",
    title: hub.title,
    description: hub.description,
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Brands by sector",
      url: `${SITE}/sectors`,
      description: hub.description,
      hasPart: sectors.map((d) => ({ "@type": "CollectionPage", name: `${d.sector.name} brands`, url: `${SITE}/sectors/${d.sector.slug}` })),
    },
    body: hubBody(sectors, total, multi, esc),
  }];

  for (const d of sectors) {
    const m = sectorMeta(d);
    pages.push({
      path: `/sectors/${d.sector.slug}`,
      title: m.title,
      description: m.description,
      jsonld: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${d.sector.name} brands`,
          url: `${SITE}/sectors/${d.sector.slug}`,
          description: m.description,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: d.n,
            itemListElement: d.rows.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${SITE}/brands/${r.slug}` })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Research", item: `${SITE}/research` },
            { "@type": "ListItem", position: 2, name: "Sectors", item: `${SITE}/sectors` },
            { "@type": "ListItem", position: 3, name: d.sector.name, item: `${SITE}/sectors/${d.sector.slug}` },
          ],
        },
      ],
      body: sectorBody(d, sectors, esc),
    });
  }
  return pages;
}
