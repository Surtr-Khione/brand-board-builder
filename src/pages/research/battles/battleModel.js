// Brand Battles: two brand systems side by side.
//
// Plain ESM (no JSX, no import.meta.env) so the SPA pages AND
// scripts/prerender.d/battles.mjs build every battle from the same code, and
// the crawlable HTML can never say something the live page doesn't.
//
// Two kinds of battle share one page:
//   - curated: the RIVALS pairs in brandTaxonomy.js. Prerendered, indexed, and
//     shown with their one-line basis ("why they are paired").
//   - picked: any two brands in the index, chosen with the battle builder.
//     Rendered client-side only, no basis line, and marked noindex.
//
// Facts only. Every value shown comes straight from a brand's record in the
// BrandMD index; an empty field is left out (never guessed). Archetype
// family/expression/blend, sector tags and business-model tags are BrandMD's
// readings of the record's own text (see brandTaxonomy.js); a judgment call is
// labeled "Mapped by BrandMD". The "where they differ / overlap" lists are
// computed by comparing the two records field by field.
import {
  RIVALS, rivalPairSlug, archetypeOf, archetypeLabel, shortArchetypeName,
  sectorsOf, modelsOf,
} from "../../../lib/brandTaxonomy.js";
import { computeGravityScore } from "../../../lib/gravityScore.js";

export { RIVALS, rivalPairSlug };

export const HUB_PATH = "/battles";
export const FAMILY_NAME = "Brand Battles";

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());
const present = (v) => (Array.isArray(v) ? v.some((x) => str(typeof x === "string" ? x : x?.name || x?.text)) : str(v) !== "");
const list = (v) =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.name || x?.text || "")).map(str).filter(Boolean) : [];
const hexOk = (h) => /^#[0-9a-f]{3,8}$/i.test(str(h));
const normHex = (h) => {
  let x = str(h).toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(x)) x = "#" + x.slice(1).split("").map((c) => c + c).join("");
  return x;
};

// The canonical page path for a pair: slugs sorted, so one URL per pair.
export const battlePath = (a, b) => `${HUB_PATH}/${rivalPairSlug(a, b)}`;

// Every curated pair as { a, b, basis, path, key }, in RIVALS order (A/B
// display order is the order the pair was curated in).
export function battlePairs() {
  return RIVALS.map(([a, b, basis]) => ({ a, b, basis, path: battlePath(a, b), key: rivalPairSlug(a, b) }));
}

const CURATED = new Map(battlePairs().map((p) => [p.key, p]));
export const curatedPair = (a, b) => CURATED.get(rivalPairSlug(a, b)) || null;

// Resolve a URL param ("adidas-vs-nike", or the reversed "nike-vs-adidas") to
// a pair of slugs. Slugs may themselves contain "-vs-" fragments, so every
// split point is tried; with `slugSet` (the index's slugs) the first split
// where both halves are real brands wins. Without it only curated pairs can
// be resolved.
//   → { a, b, key, path, canonical, curated } or null
// `canonical` false means redirect to `path`. For a curated pair a/b follow
// the curated order; otherwise the URL's (sorted) order.
export function resolvePair(param, slugSet) {
  const p = str(param).toLowerCase();
  let i = p.indexOf("-vs-");
  while (i > 0) {
    const x = p.slice(0, i);
    const y = p.slice(i + 4);
    if (x && y && x !== y) {
      const cur = curatedPair(x, y);
      if (cur || (slugSet && slugSet.has(x) && slugSet.has(y))) {
        const key = rivalPairSlug(x, y);
        const [a, b] = cur ? [cur.a, cur.b] : key === p ? [x, y] : [y, x];
        return { a, b, key, path: battlePath(a, b), canonical: p === key, curated: cur };
      }
    }
    i = p.indexOf("-vs-", i + 1);
  }
  return null;
}

// Font family names in a free-text font field, for overlap checks only.
// "UHC Sans (proprietary) / Proxima Nova" → ["uhc sans", "proxima nova"].
function fontFamilies(f) {
  return str(f)
    .replace(/\([^)]*\)/g, "")
    .split(/[/;,]|\bfallback:?/i)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// One brand's comparable fields, straight from its record.
export function side(brand) {
  const b = brand || {};
  const bd = b.brand_data || {};
  const arch = archetypeOf(b);
  const { primary: sector, all: sectors } = sectorsOf(b);
  let gravity = null;
  try { gravity = computeGravityScore(b).score; } catch { gravity = null; }
  const dos = list(b.do_say).length ? list(b.do_say) : list(bd.messagingDos);
  const donts = list(b.dont_say).length ? list(b.dont_say) : list(bd.messagingDonts);
  return {
    slug: b.slug,
    name: str(b.brand_name) || b.slug,
    website: str(b.website).replace(/^https?:\/\//, ""),
    // archetype = the family ({ slug, name }); expression/blend from the record's labels
    archetype: arch ? arch.family : null,
    expression: arch ? arch.expression : null,
    blend: arch ? arch.blend : [],
    archetypeLabel: arch ? archetypeLabel(arch) : "",
    mappedNote: arch && arch.mapped ? arch.mappedNote : "",
    rawArchetype: arch ? arch.raw : "",
    sector,
    sectors,
    models: modelsOf(b),
    industry: str(b.industry),
    tagline: str(b.tagline),
    promise: str(b.brand_promise),
    enemy: str(b.enemy),
    values: list(b.core_values),
    tone: list(b.tone_attributes),
    dos,
    donts,
    colors: [["Primary", b.primary_color], ["Secondary", b.secondary_color], ["Accent", b.accent_color]]
      .filter(([, h]) => hexOk(h))
      .map(([role, h]) => ({ role, hex: normHex(h) })),
    fonts: [["Display", b.primary_font], ["Body", b.body_font], ["Accent", b.accent_font]]
      .filter(([, f]) => present(f))
      .map(([role, f]) => ({ role, name: str(f) })),
    gravity: Number.isFinite(gravity) ? gravity : null,
    founded: present(b.founded_year) ? str(b.founded_year) : "",
    country: str(b.country),
  };
}

// The side-by-side rows, in display order. A row appears when at least one
// of the two records has the field; an empty side renders as "not on record".
export const ROWS = [
  { key: "archetype", label: "Archetype" },
  { key: "blend", label: "Blend" },
  { key: "sectors", label: "Sector tags" },
  { key: "models", label: "Business model" },
  { key: "industry", label: "Industry on record" },
  { key: "tagline", label: "Tagline" },
  { key: "promise", label: "Brand promise" },
  { key: "enemy", label: "Enemy" },
  { key: "values", label: "Values" },
  { key: "tone", label: "Voice: tone" },
  { key: "dos", label: "Voice: do say" },
  { key: "donts", label: "Voice: don't say" },
  { key: "colors", label: "Colors" },
  { key: "fonts", label: "Fonts" },
  { key: "gravity", label: "Gravity Score" },
  { key: "founded", label: "Founded" },
  { key: "country", label: "Country" },
];

export function hasField(s, key) {
  const v = s[key];
  if (Array.isArray(v)) return v.length > 0;
  if (key === "gravity") return v !== null;
  return Boolean(v);
}

export const shortName = shortArchetypeName;

const fmtList = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
const quoteList = (xs) => fmtList(xs.map((x) => `"${x}"`));
// Short head of a tone attribute: the text before its dash or colon gloss
// ("Minimalist and precise — every word…" → "Minimalist and precise").
const toneHead = (t) => String(t).split(/\s+[—–-]\s+|:\s+/)[0].trim();
const tagWord = (n) => (n === 1 ? "tag" : "tags");

// Computed comparison: plain statements, each derived from the two records.
export function compare(A, B) {
  const differ = [];
  const overlap = [];
  const only = [];

  // Archetype: family, then expression
  if (A.archetype && B.archetype) {
    if (A.archetype.slug === B.archetype.slug) {
      const fam = shortName(A.archetype.name);
      if (A.expression && B.expression && A.expression.id === B.expression.id) {
        overlap.push(`Both are charted as ${fam} · ${A.expression.name}.`);
      } else {
        overlap.push(`Both are charted in the ${fam} archetype family.`);
        if (A.expression || B.expression) {
          const ex = (s) => (s.expression ? `${fam} · ${s.expression.name}` : `${fam} with no named expression`);
          differ.push(`Expression: ${A.name} reads as ${ex(A)}, ${B.name} as ${ex(B)}.`);
        }
      }
    } else {
      differ.push(`Archetype: ${A.name} is charted as ${A.archetypeLabel}, ${B.name} as ${B.archetypeLabel}.`);
    }
    // Blend families
    const bb = new Set(B.blend.map((x) => x.family.slug));
    const sharedBlend = A.blend.filter((x) => bb.has(x.family.slug)).map((x) => shortName(x.family.name));
    if (sharedBlend.length) overlap.push(`Both blend in ${fmtList(sharedBlend)}.`);
  }

  // Sector tags
  if (A.sectors.length && B.sectors.length) {
    const bs = new Set(B.sectors.map((s) => s.slug));
    const as = new Set(A.sectors.map((s) => s.slug));
    const shared = A.sectors.filter((s) => bs.has(s.slug)).map((s) => s.name);
    const onlyA = A.sectors.filter((s) => !bs.has(s.slug)).map((s) => s.name);
    const onlyB = B.sectors.filter((s) => !as.has(s.slug)).map((s) => s.name);
    if (shared.length) overlap.push(`Both carry the ${fmtList(shared)} sector ${tagWord(shared.length)}.`);
    if (!shared.length) differ.push(`No sector tag in common: ${A.name} is tagged ${fmtList(A.sectors.map((s) => s.name))}, ${B.name} ${fmtList(B.sectors.map((s) => s.name))}.`);
    else {
      if (onlyA.length) differ.push(`Only ${A.name} also carries the ${fmtList(onlyA)} sector ${tagWord(onlyA.length)}.`);
      if (onlyB.length) differ.push(`Only ${B.name} also carries the ${fmtList(onlyB)} sector ${tagWord(onlyB.length)}.`);
    }
  }

  // Business-model tags (only when at least one record names a model)
  if (A.models.length || B.models.length) {
    const bm = new Set(B.models.map((m) => m.slug));
    const am = new Set(A.models.map((m) => m.slug));
    const shared = A.models.filter((m) => bm.has(m.slug)).map((m) => m.name);
    if (shared.length) overlap.push(`Both are tagged ${fmtList(shared)} as a business model.`);
    for (const [s, other] of [[A, bm], [B, am]]) {
      const own = s.models.filter((m) => !other.has(m.slug));
      if (own.length) differ.push(`Business model: only ${s.name} is tagged ${fmtList(own.map((m) => `${m.name} (from "${m.term}" in its industry)`))}.`);
    }
  }

  // Tone attributes
  if (A.tone.length && B.tone.length) {
    const bl = new Set(B.tone.map((t) => t.toLowerCase()));
    const al = new Set(A.tone.map((t) => t.toLowerCase()));
    const shared = A.tone.filter((t) => bl.has(t.toLowerCase()));
    const onlyA = A.tone.filter((t) => !bl.has(t.toLowerCase()));
    const onlyB = B.tone.filter((t) => !al.has(t.toLowerCase()));
    if (shared.length) overlap.push(`Both list ${quoteList(shared)} as ${shared.length === 1 ? "a tone attribute" : "tone attributes"}.`);
    if (!shared.length) differ.push(`No tone attribute appears in both records (${A.name}: ${A.tone.map(toneHead).join(" · ")}; ${B.name}: ${B.tone.map(toneHead).join(" · ")}).`);
    else if (onlyA.length || onlyB.length) {
      const parts = [];
      if (onlyA.length) parts.push(`only ${A.name} lists ${quoteList(onlyA.map(toneHead))}`);
      if (onlyB.length) parts.push(`only ${B.name} lists ${quoteList(onlyB.map(toneHead))}`);
      differ.push(`Tone: ${parts.join("; ")}.`);
    }
  }

  // Values (exact text match only; values are written as sentences)
  if (A.values.length && B.values.length) {
    const bl = new Set(B.values.map((v) => v.toLowerCase()));
    const shared = A.values.filter((v) => bl.has(v.toLowerCase()));
    if (shared.length) overlap.push(`Both list the value ${quoteList(shared)}.`);
    else differ.push(`None of ${A.name}'s ${A.values.length} listed values appears word for word among ${B.name}'s ${B.values.length}.`);
  }

  // Colors (exact hex)
  if (A.colors.length && B.colors.length) {
    const bh = new Set(B.colors.map((c) => c.hex));
    const shared = [...new Set(A.colors.map((c) => c.hex).filter((h) => bh.has(h)))];
    if (shared.length) overlap.push(`Both palettes include ${fmtList(shared)}.`);
    else differ.push(`No color hex appears in both palettes.`);
    const pa = A.colors.find((c) => c.role === "Primary");
    const pb = B.colors.find((c) => c.role === "Primary");
    if (pa && pb && pa.hex !== pb.hex) differ.push(`Primary color: ${pa.hex} for ${A.name}, ${pb.hex} for ${B.name}.`);
  }

  // Fonts (family names)
  if (A.fonts.length && B.fonts.length) {
    const fb = new Set(B.fonts.flatMap((f) => fontFamilies(f.name)));
    const sharedFams = [...new Set(A.fonts.flatMap((f) => fontFamilies(f.name)).filter((f) => fb.has(f)))];
    if (sharedFams.length) {
      const pretty = sharedFams.map((fam) => {
        const hit = A.fonts.map((f) => f.name).join(" / ");
        const m = hit.match(new RegExp(fam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        return m ? m[0] : fam;
      });
      overlap.push(`Both list ${fmtList(pretty)} in their typography.`);
    } else differ.push(`No typeface appears in both records.`);
  }

  // Gravity
  if (A.gravity !== null && B.gravity !== null) {
    if (A.gravity === B.gravity) overlap.push(`Both hold a Gravity Score of ${A.gravity}.`);
    else {
      const gap = Math.abs(A.gravity - B.gravity);
      differ.push(`Gravity Score: ${A.name} ${A.gravity}, ${B.name} ${B.gravity} (a ${gap}-point gap in documented identity on record).`);
    }
  }

  // Founded / country
  if (A.founded && B.founded) {
    if (A.founded === B.founded) overlap.push(`Both records give ${A.founded} as the founding year.`);
    else differ.push(`Founded: ${A.name} in ${A.founded}, ${B.name} in ${B.founded}.`);
  }
  if (A.country && B.country) {
    if (A.country.toLowerCase() === B.country.toLowerCase()) overlap.push(`Both records list ${A.country} as the country.`);
    else differ.push(`Country: ${A.country} for ${A.name}, ${B.country} for ${B.name}.`);
  }

  // Fields only one record carries
  const labels = { tagline: "a tagline", promise: "a brand promise", enemy: "a named enemy", values: "listed values", tone: "tone attributes", dos: "do-say rules", donts: "don't-say rules", colors: "colors", fonts: "typography", founded: "a founding year", country: "a country" };
  for (const [k, phrase] of Object.entries(labels)) {
    const ha = hasField(A, k), hb = hasField(B, k);
    if (ha && !hb) only.push({ who: A.name, phrase });
    if (hb && !ha) only.push({ who: B.name, phrase });
  }
  for (const who of [A.name, B.name]) {
    const ps = only.filter((o) => o.who === who).map((o) => o.phrase);
    if (ps.length) differ.push(`Only ${who} has ${fmtList(ps)} on record in the index.`);
  }

  return { differ, overlap };
}

// Everything a battle page needs, from two raw records. `basis` is the curated
// RIVALS line, or null for a picked pair.
export function buildBattle(brandA, brandB, basis = null) {
  const A = side(brandA);
  const B = side(brandB);
  const rows = ROWS.filter((r) => hasField(A, r.key) || hasField(B, r.key));
  const { differ, overlap } = compare(A, B);
  return { A, B, basis, curated: Boolean(basis), rows, differ, overlap, path: battlePath(A.slug, B.slug) };
}

// Up to `max` further battles for a pair page, drawn from brands that share a
// sector tag. Candidates:
//   - challengers: A (or B) against another brand carrying one of its sector
//     tags; the reason shown is the shared tag(s), computed from both records;
//   - other curated battles whose two brands both carry a tag A or B carries.
// Order: A's best challenger, B's best, a curated same-sector battle, then the
// next of each. Challengers rank curated first, then more shared sector tags,
// then a shared business-model tag, then the same archetype family, then name.
export function suggestBattles(slugA, slugB, brands, max = 3) {
  const by = Object.fromEntries((brands || []).map((b) => [b.slug, b]));
  if (!by[slugA] || !by[slugB]) return [];
  const cache = {};
  const info = (slug) => {
    if (!cache[slug]) {
      const b = by[slug];
      const { all } = sectorsOf(b);
      const arch = archetypeOf(b);
      cache[slug] = {
        name: str(b.brand_name) || slug,
        sectors: all,
        tags: new Set(all.map((s) => s.slug)),
        models: new Set(modelsOf(b).map((m) => m.slug)),
        family: arch ? arch.family.slug : null,
      };
    }
    return cache[slug];
  };
  const here = rivalPairSlug(slugA, slugB);
  const sharedTags = (x, y) => info(x).sectors.filter((s) => info(y).tags.has(s.slug)).map((s) => s.name);
  const make = (a, b, reason, curated) => ({ a, b, aName: info(a).name, bName: info(b).name, key: rivalPairSlug(a, b), path: battlePath(a, b), reason, curated });

  const challengers = (self, other) => Object.keys(by)
    .filter((c) => c !== self && c !== other)
    .map((c) => ({ c, shared: sharedTags(self, c) }))
    .filter((x) => x.shared.length)
    .map((x) => {
      const cur = curatedPair(self, x.c);
      return {
        ...make(self, x.c, cur ? cur.basis : `Both carry the ${fmtList(x.shared)} sector ${tagWord(x.shared.length)}`, Boolean(cur)),
        rank: [
          cur ? 1 : 0,
          x.shared.length,
          [...info(self).models].some((m) => info(x.c).models.has(m)) ? 1 : 0,
          info(self).family && info(self).family === info(x.c).family ? 1 : 0,
        ],
      };
    })
    .sort((p, q) => {
      for (let i = 0; i < p.rank.length; i++) if (q.rank[i] !== p.rank[i]) return q.rank[i] - p.rank[i];
      return p.bName.localeCompare(q.bName);
    });

  const hereTags = new Set([...info(slugA).tags, ...info(slugB).tags]);
  const curatedNear = battlePairs()
    .filter((p) => p.key !== here && by[p.a] && by[p.b])
    .map((p) => ({ p, n: [...hereTags].filter((t) => info(p.a).tags.has(t) && info(p.b).tags.has(t)).length }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n)
    .map((x) => make(x.p.a, x.p.b, x.p.basis, true));

  const lanes = [challengers(slugA, slugB), challengers(slugB, slugA), curatedNear];
  const out = [];
  const seen = new Set([here]);
  for (let round = 0; out.length < max && lanes.some((l) => l.length > round); round++) {
    for (const lane of lanes) {
      const s = lane[round];
      if (!s || seen.has(s.key)) continue;
      seen.add(s.key);
      out.push(s);
      if (out.length >= max) break;
    }
  }
  return out.map(({ rank, ...s }) => s);
}

// Page title (< 60 chars) and meta description (< 155 chars).
export function pairTitle(A, B) {
  const opts = [
    `${A.name} vs ${B.name}: Brand Battle | BrandMD`,
    `${A.name} vs ${B.name}: Brand Battle`,
    `${A.name} vs ${B.name} | BrandMD`,
    `${A.name} vs ${B.name}`,
  ];
  return opts.find((t) => t.length < 60) || opts[opts.length - 1].slice(0, 59);
}

export function pairDescription(A, B) {
  const opts = [
    `${A.name} vs ${B.name}: archetype, sector tags, promise, voice, colors, fonts and Gravity Score side by side, from the BrandMD index.`,
    `${A.name} vs ${B.name}: archetype, voice, colors and fonts side by side, from the BrandMD index.`,
    `${A.name} vs ${B.name}: two brand systems side by side, from the BrandMD index.`,
  ];
  return opts.find((t) => t.length < 155) || opts[opts.length - 1].slice(0, 154);
}

export const HUB_TITLE = "Brand Battles: Two Brand Systems Side by Side | BrandMD";
export function hubDescription(pairCount, brandCount) {
  return `${pairCount} curated brand battles, or pick any two of ${brandCount} indexed brands: archetype, sector, voice, colors, fonts and Gravity Score side by side.`;
}
