// Business-model research pages: /models and /models/:slug (models with 2+
// tagged brands). Crawlable static bodies built from the same rollups the SPA
// renders (src/pages/research/models/modelData.js), so the two never disagree.
import { buildModels, hubIntro, modelIntro, hubMeta, modelMeta, modelHrefOf, modelRule, termsNote, inlineName, baseLine, industryParts, listJoin, plural, GRAVITY_NOTE } from "../../src/pages/research/models/modelData.js";
import { expressionHref, sectorHref, shortArchetypeName } from "../../src/lib/brandTaxonomy.js";

const SITE = "https://brandmd.space";

function cta(esc, heading) {
  return `<section><h2>${esc(heading)}</h2><p>Every brand above was decoded into archetype, voice, colors and type. <a href="/builder">Chart your own brand</a> on the same lens, or <a href="/analyzer">scan your site</a> and see where it already stands.</p></section>`;
}

const brandA = (esc, r) => `<a href="/brands/${esc(r.slug)}">${esc(r.name)}</a>`;

function archHtml(esc, a, exprCounts) {
  if (!a) return "";
  let s = `<a href="/archetypes/${esc(a.family.slug)}">${esc(shortArchetypeName(a.family.name))}</a>`;
  if (a.expression) {
    const href = expressionHref(a.family.slug, a.expression, exprCounts);
    s += ` · ${href ? `<a href="${esc(href)}">${esc(a.expression.name)}</a>` : esc(a.expression.name)}`;
  }
  if (a.blend.length) s += ` with ${a.blend.map((x) => `<a href="/archetypes/${esc(x.family.slug)}">${esc(shortArchetypeName(x.family.name))}</a>`).join(", ")}`;
  if (a.mapped) s += ` <small>(${esc(a.mappedNote)})</small>`;
  return s;
}

function hubBody(b, esc) {
  const out = [];
  out.push(`<nav aria-label="Breadcrumb"><a href="/research">Research</a> / Business models</nav>`);
  out.push(`<h1>Brands by business model</h1>`);
  out.push(`<p>${esc(hubIntro(b))}</p>`);
  out.push(`<ul>`);
  for (const d of b.models.filter((x) => x.n > 0)) {
    const href = modelHrefOf(d);
    const head = href ? `<a href="${esc(href)}">${esc(d.model.name)}</a>` : esc(d.model.name);
    const mix = d.archetypeMix.map((a) => `${esc(a.name)} ${a.count}`).join(", ");
    out.push(`<li><h2>${head}</h2>`
      + `<p>${esc(d.model.definition)} <small>(BrandMD's definition)</small></p>`
      + `<p>${plural(d.n, "brand")} of ${d.total}. ${esc(modelRule(d.model))} Archetype families: ${mix}.${d.minGravity !== null ? ` Gravity Scores ${d.minGravity} to ${d.maxGravity}.` : ""}${href ? "" : " One brand so far, so no page of its own yet."}</p>`
      + `<p>${d.brands.map((r) => brandA(esc, r)).join(", ")}</p></li>`);
  }
  out.push(`</ul>`);
  if (b.multiModel.length) {
    out.push(`<section><h2>${plural(b.multiModel.length, "brand")} carry two model tags</h2><ul>`);
    for (const r of b.multiModel) out.push(`<li>${brandA(esc, r)}: ${esc(r.models.map((m) => `${m.name} (from "${m.term}")`).join(" + "))}</li>`);
    out.push(`</ul></section>`);
  }
  out.push(`<p>Model definitions are BrandMD's own wording, not the brands'. ${esc(GRAVITY_NOTE)} See also <a href="/sectors">brands by sector</a>, <a href="/archetypes">brands by archetype</a> and the full <a href="/brands">brand index</a>.</p>`);
  out.push(cta(esc, "Chart your own brand on the same lens"));
  return out.join("\n");
}

function modelBody(d, b, esc) {
  const out = [];
  const name = d.model.name;
  out.push(`<nav aria-label="Breadcrumb"><a href="/research">Research</a> / <a href="/models">Business models</a> / ${esc(name)}</nav>`);
  out.push(`<h1>${esc(name)} brands</h1>`);
  out.push(`<p>${esc(modelIntro(d))}</p>`);
  out.push(`<p><strong>BrandMD's definition:</strong> ${esc(d.model.definition)} <strong>In these records:</strong> ${esc(termsNote(d))}</p>`);

  // Brands
  out.push(`<section><h2>${plural(d.n, "brand")} tagged ${esc(name)}, by Gravity Score</h2>`);
  out.push(`<p>Each industry line is quoted as the record lists it; the marked words are the ones the tag was read from. ${esc(GRAVITY_NOTE)}</p>`);
  out.push(`<table><thead><tr><th scope="col">Brand</th><th scope="col">Industry, as recorded</th><th scope="col">Archetype</th><th scope="col">Sectors</th><th scope="col">Gravity Score</th></tr></thead><tbody>`);
  for (const r of d.brands) {
    const ip = industryParts(r.industry, r.term);
    const ind = `${esc(ip.before)}${ip.term ? `<mark>${esc(ip.term)}</mark>` : ""}${esc(ip.after)}`;
    const secs = r.sectors.map((s) => { const h = sectorHref(s.slug); return h ? `<a href="${esc(h)}">${esc(s.name)}</a>` : esc(s.name); }).join(", ");
    out.push(`<tr><td>${brandA(esc, r)}${r.tagline ? ` <small>&ldquo;${esc(r.tagline)}&rdquo;</small>` : ""}</td><td>${ind}</td><td>${archHtml(esc, r.archetype, b.exprCounts)}</td><td>${secs}</td><td>${r.gravity ?? ""}</td></tr>`);
  }
  out.push(`</tbody></table></section>`);

  // Archetype family mix
  out.push(`<section><h2>Archetype family mix</h2>`);
  out.push(`<p>Counted ${esc(baseLine(d))}: each brand once, under the archetype family BrandMD reads from its record's archetype label, with the same family's share across all ${d.total} brands in the index for comparison.${d.mapped.length ? ` ${esc(listJoin(d.mapped.map((m) => m.name)))} ${d.mapped.length === 1 ? "has a label" : "have labels"} outside the 12 archetypes, placed in a family by BrandMD.` : ""}</p><ul>`);
  for (const a of d.archetypeMix) out.push(`<li><a href="/archetypes/${esc(a.slug)}">${esc(a.name)}</a>: ${a.count} of ${d.n} (${a.share}%; ${a.indexShare}% across the index). ${a.brands.map((x) => brandA(esc, x)).join(", ")}</li>`);
  out.push(`</ul></section>`);

  // Sector mix
  out.push(`<section><h2>Sector mix</h2>`);
  out.push(`<p>Counted ${esc(baseLine(d))}, by sector tag. Sector tags also come from each record's industry line; a brand whose line names two sectors counts in both${d.multiSector ? ` (${plural(d.multiSector, "brand")} here ${d.multiSector === 1 ? "does" : "do"})` : ""}.</p><ul>`);
  for (const s of d.sectorMix) {
    const h = sectorHref(s.slug);
    out.push(`<li>${h ? `<a href="${esc(h)}">${esc(s.name)}</a>` : esc(s.name)}: ${s.count} of ${d.n}. ${s.brands.map((x) => brandA(esc, x)).join(", ")}</li>`);
  }
  out.push(`</ul></section>`);

  // Color
  out.push(`<section><h2>Color patterns</h2>`);
  out.push(`<p>Color families are computed from each recorded hex value's hue, saturation and lightness. Primary colors ${esc(baseLine(d))} with one recorded (${d.withPrimaryCount}): ${d.primaryFamilies.map((f) => `${esc(f.name.toLowerCase())} ${f.count} (${esc(f.brands.join(", "))})`).join("; ")}. All ${d.colorTotal} recorded colors by family: ${d.paletteFamilies.map((f) => `${esc(f.name.toLowerCase())} ${f.count}`).join(", ")}.</p>`);
  out.push(`<ul class="palette">`);
  for (const r of d.brands.filter((x) => x.colors.length)) {
    out.push(`<li>${brandA(esc, r)}: ${r.colors.map((c) => `<span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.role)} <code>${esc(c.hex)}</code>`).join(" ")}</li>`);
  }
  out.push(`</ul>`);
  out.push(d.sharedHexes.length
    ? `<p>Exact hex values recorded by more than one of these brands (pure white and black left out): ${d.sharedHexes.map((h) => `<code>${esc(h.hex)}</code> ${esc(listJoin(h.brands))}`).join("; ")}.</p>`
    : `<p>No hex value other than pure white or black is recorded by more than one of these brands.</p>`);
  out.push(`</section>`);

  // Type and tone
  out.push(`<section><h2>Type and tone</h2>`);
  if (d.withFontsCount) {
    out.push(`<p>${d.withFontsCount} of the ${d.n} brands here have typefaces recorded.${d.sharedFonts.length ? ` Named by more than one: ${esc(d.sharedFonts.map((f) => `${f.name} (${listJoin(f.brands)})`).join("; "))}.` : " No typeface is named by more than one of them."}</p><ul>`);
    for (const r of d.brands.filter((x) => x.fonts.length)) out.push(`<li>${brandA(esc, r)}: ${esc(r.fonts.map((f) => `${f.role}: ${f.name}`).join(" · "))}</li>`);
    out.push(`</ul>`);
  } else {
    out.push(`<p>None of the ${d.n} brands tagged ${esc(name)} has a typeface recorded in the BrandMD index yet, so there is no type pattern to report.</p>`);
  }
  out.push(d.sharedTone.length
    ? `<p>Tone words (three words or fewer) recorded by two or more of these brands: ${esc(d.sharedTone.map((t) => `${t.word} (${listJoin(t.brands)})`).join("; "))}.</p>`
    : `<p>No tone attribute of three words or fewer appears in more than one of these records.</p>`);
  out.push(`</section>`);

  if (d.alsoTagged.length) {
    out.push(`<section><h2>Brands here with a second model tag</h2><ul>`);
    for (const r of d.alsoTagged) {
      const tags = r.others.map((m) => {
        const href = modelHrefOf(b.models.find((x) => x.model.slug === m.slug));
        return `${href ? `<a href="${esc(href)}">${esc(m.name)}</a>` : esc(m.name)} (from "${esc(m.term)}")`;
      }).join(", ");
      out.push(`<li>${brandA(esc, r)}: also ${tags}</li>`);
    }
    out.push(`</ul></section>`);
  }

  const others = b.models.filter((m) => m.model.slug !== d.model.slug && modelHrefOf(m));
  out.push(`<section><h2>Other business models</h2><p>${others.map((o) => `<a href="${esc(modelHrefOf(o))}">${esc(o.model.name)}</a> (${o.n})`).join(" · ")}</p>`);
  out.push(`<p><a href="/models">All business models</a> · <a href="/sectors">Brands by sector</a> · <a href="/archetypes">Brands by archetype</a> · <a href="/research">All research</a></p></section>`);
  out.push(cta(esc, `Chart your brand next to ${inlineName(name)} brands`));
  return out.join("\n");
}

export default async function ({ brands, esc }) {
  if (!Array.isArray(brands) || !brands.length) return [];
  const b = buildModels(brands);
  const paged = b.models.filter((d) => d.hasPage);

  const hub = hubMeta(b);
  const pages = [{
    path: "/models",
    title: hub.title,
    description: hub.description,
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Brands by business model",
      url: `${SITE}/models`,
      description: hub.description,
      hasPart: paged.map((d) => ({ "@type": "CollectionPage", name: `${d.model.name} brands`, url: `${SITE}/models/${d.model.slug}` })),
    },
    body: hubBody(b, esc),
  }];

  for (const d of paged) {
    const m = modelMeta(d);
    pages.push({
      path: `/models/${d.model.slug}`,
      title: m.title,
      description: m.description,
      jsonld: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${d.model.name} brands`,
          url: `${SITE}/models/${d.model.slug}`,
          description: m.description,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: d.n,
            itemListElement: d.brands.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${SITE}/brands/${r.slug}` })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Research", item: `${SITE}/research` },
            { "@type": "ListItem", position: 2, name: "Business models", item: `${SITE}/models` },
            { "@type": "ListItem", position: 3, name: d.model.name, item: `${SITE}/models/${d.model.slug}` },
          ],
        },
      ],
      body: modelBody(d, b, esc),
    });
  }
  return pages;
}
