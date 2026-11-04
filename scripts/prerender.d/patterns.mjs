// Prerender for /patterns (Patterns of the Greats). Same numbers as the SPA
// page: both call computePatterns() on the same search-brands rows.
import { computePatterns, COLOUR_FAMILIES } from "../../src/pages/research/patterns/patternsData.js";

export const TITLE = "Patterns of the Greats: Colour, Type & Archetypes | BrandMD";

const pct = (k, n) => (n ? Math.round((k / n) * 100) : 0);

export default async function patterns({ brands, esc }) {
  if (!brands || !brands.length) return [];
  const P = computePatterns(brands);
  const { N, colour, type, archetype, enemy, values, gravity } = P;
  const across = `across the ${N} brands in the BrandMD index`;
  const famName = Object.fromEntries(COLOUR_FAMILIES.map((f) => [f.slug, f.name]));
  const link = (b, extra = "") => `<a href="/brands/${esc(b.slug)}">${esc(b.name)}</a>${extra}`;
  const links = (list, extra) => list.map((b) => link(b, extra ? extra(b) : "")).join(", ");
  const ds = type.displayStyle;
  const fam = colour.families.filter((f) => f.count);
  const topArch = archetype.list[0];
  const differs = gravity.signalGap.filter((s) => s.topPct !== s.restPct);

  const out = [];
  out.push(`<p><a href="/research">Research</a> · Patterns</p>`);
  out.push(`<h1>Patterns of the Greats</h1>`);
  out.push(`<p>What do the brands in the BrandMD index have in common? This page counts it: the colours they lead with, the typefaces on record, the archetypes they play, the enemies they name, the values they commit to, and what the highest Gravity Scores share. Every number is computed from the brand records, ${esc(across)}, and every brand links to its full system.</p>`);
  out.push(`<nav><a href="#colour">Colour</a> · <a href="#type">Type</a> · <a href="#archetypes">Archetypes</a> · <a href="#enemies">Enemies</a> · <a href="#values">Values</a> · <a href="#gravity">Gravity</a></nav>`);

  // Colour
  out.push(`<section id="colour"><h2>Colour</h2>`);
  out.push(`<p>Each brand's primary colour, sorted into colour families by hue and lightness, ${esc(across)}. ${colour.darkCount} of ${colour.withPrimary} primary colours are dark (${colour.darkPct}%) and ${colour.lightCount} are light, where dark means a WCAG relative luminance under 0.179 (white text reads better on it than black text).</p>`);
  out.push(`<h3>Primary colour families</h3><table><thead><tr><th scope="col">Family</th><th scope="col">Brands (primary)</th><th scope="col">Colours in any role</th><th scope="col">Which brands</th></tr></thead><tbody>`);
  for (const f of fam) {
    out.push(`<tr><th scope="row">${esc(f.name)}</th><td>${f.count}</td><td>${f.allRoles}</td><td>${f.brands.map((b) => `<a href="/brands/${esc(b.slug)}"><span class="swatch" style="background:${esc(b.hex)}"></span>${esc(b.name)}</a> <code>${esc(b.hex)}</code>`).join(", ")}</td></tr>`);
  }
  out.push(`</tbody></table>`);
  out.push(`<p>"Colours in any role" counts the ${colour.allColourCount} primary, secondary and accent colours on record. Families: ${esc(COLOUR_FAMILIES.map((f) => `${f.name} (${f.rule})`).join("; "))}.</p>`);
  if (colour.repeatedHexes.length) {
    out.push(`<h3>The same hex, different brands</h3><ul>${colour.repeatedHexes.map((h) => `<li><span class="swatch" style="background:${esc(h.hex)}"></span><code>${esc(h.hex)}</code>: ${links(h.brands)}</li>`).join("")}</ul>`);
  }
  out.push(`</section>`);

  // Type
  out.push(`<section id="type"><h2>Type</h2>`);
  out.push(`<p>${type.withFont} of the ${N} brands in the BrandMD index have at least one typeface on record (${pct(type.withFont, N)}%), naming ${type.faceCount} distinct faces. The figures below count those ${type.withFont} brands only.</p>`);
  out.push(`<p>Display typeface style: ${ds.sans.length} sans-serif, ${ds.serif.length} serif, ${ds.unclassified.length} unclassified.${ds.serif.length ? ` Serif display faces: ${links(ds.serif, (b) => ` (${esc(b.face)})`)}.` : ""}</p>`);
  out.push(`<h3>A typeface of their own</h3><p>${type.own.length} of ${type.withFont} brands with type on record use a face carrying the brand's own name or recorded as proprietary or custom: ${links(type.own, (b) => ` (${esc(b.face)})`)}.</p>`);
  if (type.shared.length) {
    out.push(`<h3>Typefaces named by more than one brand</h3><ul>${type.shared.map((f) => `<li><strong>${esc(f.name)}</strong> (${f.brands.length}): ${links(f.brands, (b) => ` as ${esc(b.role)}`)}</li>`).join("")}</ul>`);
  }
  out.push(`</section>`);

  // Archetypes
  out.push(`<section id="archetypes"><h2>Archetypes</h2>`);
  out.push(`<p>Primary archetype of each brand, mapped onto the 12 Jungian archetypes, ${esc(across)}.${topArch ? ` ${esc(topArch.name)} is the most common primary (${topArch.count} brands).` : ""}</p>`);
  out.push(`<table><thead><tr><th scope="col">Archetype</th><th scope="col">Primary</th><th scope="col">Secondary</th><th scope="col">Brands (primary)</th></tr></thead><tbody>`);
  for (const a of archetype.list) {
    out.push(`<tr><th scope="row"><a href="/archetypes/${esc(a.slug)}">${esc(a.name)}</a></th><td>${a.count}</td><td>${a.secondaryCount}</td><td>${links(a.brands)}</td></tr>`);
  }
  out.push(`</tbody></table>`);
  if (archetype.topPairs.length) {
    out.push(`<h3>The most common primary + secondary pairs</h3><ul>${archetype.topPairs.slice(0, 6).map((p) => `<li><a href="/archetypes/${esc(p.primary)}">${esc(p.primaryName)}</a> + <a href="/archetypes/${esc(p.secondary)}">${esc(p.secondaryName)}</a> (${p.brands.length}): ${links(p.brands)}</li>`).join("")}</ul>`);
  }
  out.push(`</section>`);

  // Enemies
  out.push(`<section id="enemies"><h2>Enemies</h2>`);
  out.push(`<p>${enemy.withEnemy} of the ${N} brands in the BrandMD index name an enemy. Each theme counts the enemy statements that use the listed words; a statement can land in more than one theme.</p>`);
  for (const t of enemy.themes) {
    out.push(`<h3>${esc(t.name)} (${t.count})</h3><p>Words: ${esc(t.words.join(", "))}.</p>`);
    if (t.brands.length) out.push(`<ul>${t.brands.map((b) => `<li>${link(b)}: ${esc(b.enemy)}</li>`).join("")}</ul>`);
  }
  out.push(`</section>`);

  // Values
  out.push(`<section id="values"><h2>Values</h2>`);
  out.push(`<p>${values.withValues} of the ${N} brands in the BrandMD index list core values, ${values.valueCount} values in all. Each theme counts the brands with at least one value whose name uses the listed words.</p>`);
  out.push(`<ul>${values.themes.map((t) => `<li><strong>${esc(t.name)}</strong> (${t.count} brands; words: ${esc(t.words.join(", "))}): ${t.brands.map((b) => link(b, ` (&ldquo;${esc(b.value)}&rdquo;)`)).join(", ")}</li>`).join("")}</ul>`);
  out.push(`</section>`);

  // Gravity
  out.push(`<section id="gravity"><h2>Gravity Score</h2>`);
  out.push(`<p>The Gravity Score measures how much of a coherent, documented identity is on record for a brand, from 0 to 100 across 19 weighted signals. It describes the profile, not how successful the business is. ${esc(across.charAt(0).toUpperCase() + across.slice(1))}: mean ${gravity.mean}, median ${gravity.median}, range ${gravity.min} to ${gravity.max}.</p>`);
  out.push(`<table><thead><tr><th scope="col">Score</th><th scope="col">Brands</th></tr></thead><tbody>${gravity.buckets.map((b) => `<tr><th scope="row">${b.score}</th><td>${b.count}</td></tr>`).join("")}</tbody></table>`);
  out.push(`<h3>The ${gravity.top.length} brands at ${gravity.topThreshold}+</h3><p>${links(gravity.top, (b) => ` ${b.score}`)}.</p>`);
  out.push(`<h3>Where the top ${gravity.top.length} differ from the other ${gravity.restCount}</h3><ul>${differs.map((s) => `<li>${esc(s.label)}: ${s.topPct}% of the top group, ${s.restPct}% of the rest</li>`).join("")}</ul>`);
  out.push(`</section>`);

  out.push(`<section><h2>Where does your brand sit?</h2><p><a href="/builder">Chart your brand</a> on the same lens, or <a href="/analyzer">scan your site</a> for its colours, type, voice and archetype.</p><p><a href="/research">All research</a> · <a href="/archetypes">Archetypes</a> · <a href="/sectors">Sectors</a> · <a href="/brands">The Brand Index</a></p></section>`);

  const secondFam = fam[1] ? ` and ${fam[1].slug}` : "";
  const description = `What the ${N} brands in the BrandMD index share: ${colour.darkPct}% dark primary colours, ${fam[0].slug}${secondFam} lead, ${topArch ? `${topArch.name.replace(/^The /, "the ")} is the top archetype` : "archetypes"}, plus enemies and values.`;

  return [
    {
      path: "/patterns",
      title: TITLE,
      description: description.length <= 155 ? description : `Colour, type, archetype, enemy and value patterns ${across}, plus what the highest Gravity Scores share.`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Patterns of the Greats",
        description: `Colour, typeface, archetype, enemy, value and Gravity Score patterns computed ${across}.`,
        url: "https://brandmd.space/patterns",
        creator: { "@type": "Organization", name: "BrandMD", url: "https://brandmd.space" },
        isAccessibleForFree: true,
      },
      body: out.join("\n"),
    },
  ];
}
