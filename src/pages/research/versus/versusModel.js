// Versus: head-to-head brand comparisons.
//
// Plain ESM (no JSX, no import.meta.env) so the SPA pages AND
// scripts/prerender.d/versus.mjs build every pair from the same code, and the
// crawlable HTML can never say something the live page doesn't.
//
// Facts only. Every value shown comes straight from a brand's record in the
// BrandMD index; an empty field is left out (never guessed). The "where they
// differ / overlap" lists are computed by comparing the two records field by
// field, and the RIVALS basis line is the only framing of why two brands are
// paired.
import { RIVALS, brandArchetypes, sectorOf, rivalPairSlug } from "../../../lib/brandTaxonomy.js";
import { computeGravityScore } from "../../../lib/gravityScore.js";

export { RIVALS, rivalPairSlug };

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
export const versusPath = (a, b) => `/versus/${rivalPairSlug(a, b)}`;

// Every curated pair as { a, b, basis, path }, in RIVALS order (A/B display
// order is the order the pair was curated in).
export function versusPairs() {
  return RIVALS.map(([a, b, basis]) => ({ a, b, basis, path: versusPath(a, b), key: rivalPairSlug(a, b) }));
}

// Resolve a URL param ("adidas-vs-nike" or the reversed "nike-vs-adidas").
// → { pair, canonical } where canonical=false means redirect to pair.path.
export function findPair(param) {
  const p = str(param).toLowerCase();
  const parts = p.split("-vs-");
  if (parts.length !== 2) return null;
  const key = rivalPairSlug(parts[0], parts[1]);
  const pair = versusPairs().find((x) => x.key === key);
  if (!pair) return null;
  return { pair, canonical: p === key };
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
  const { primary, secondary } = brandArchetypes(b);
  let gravity = null;
  try { gravity = computeGravityScore(b).score; } catch { gravity = null; }
  const dos = list(b.do_say).length ? list(b.do_say) : list(bd.messagingDos);
  const donts = list(b.dont_say).length ? list(b.dont_say) : list(bd.messagingDonts);
  return {
    slug: b.slug,
    name: str(b.brand_name) || b.slug,
    website: str(b.website).replace(/^https?:\/\//, ""),
    archetype: primary,
    secondary,
    rawArchetype: str(b.archetype),
    sector: sectorOf(b.industry),
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
  { key: "sector", label: "Sector" },
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

const fmtList = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
const quoteList = (xs) => fmtList(xs.map((x) => `"${x}"`));
// Short head of a tone attribute: the text before its dash or colon gloss
// ("Minimalist and precise — every word…" → "Minimalist and precise").
const toneHead = (t) => String(t).split(/\s+[—–-]\s+|:\s+/)[0].trim();

// Computed comparison: plain statements, each derived from the two records.
export function compare(A, B) {
  const differ = [];
  const overlap = [];
  const only = [];

  // Archetype
  if (A.archetype && B.archetype) {
    if (A.archetype.slug === B.archetype.slug) overlap.push(`Both are charted as ${A.archetype.name} (primary archetype).`);
    else differ.push(`Primary archetype: ${A.name} is charted as ${A.archetype.name}, ${B.name} as ${B.archetype.name}.`);
    if (A.secondary && B.secondary) {
      if (A.secondary.slug === B.secondary.slug) overlap.push(`Both carry ${A.secondary.name} as a secondary archetype.`);
      else differ.push(`Secondary archetype: ${A.secondary.name} for ${A.name}, ${B.secondary.name} for ${B.name}.`);
    }
  }

  // Sector
  if (A.sector && B.sector) {
    if (A.sector.slug === B.sector.slug) overlap.push(`Both sit in the ${A.sector.name} sector of the index.`);
    else differ.push(`Sector: ${A.name} is in ${A.sector.name}, ${B.name} in ${B.sector.name}.`);
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

// Everything a pair page needs, from two raw records + the RIVALS basis.
export function buildVersus(brandA, brandB, basis) {
  const A = side(brandA);
  const B = side(brandB);
  const rows = ROWS.filter((r) => hasField(A, r.key) || hasField(B, r.key));
  const { differ, overlap } = compare(A, B);
  return { A, B, basis, rows, differ, overlap, path: versusPath(A.slug, B.slug) };
}

// Page title (< 60 chars) and meta description (< 155 chars).
export function pairTitle(A, B) {
  const opts = [
    `${A.name} vs ${B.name}: Brand Systems Compared | BrandMD`,
    `${A.name} vs ${B.name}: Brand Systems Compared`,
    `${A.name} vs ${B.name} | BrandMD`,
    `${A.name} vs ${B.name}`,
  ];
  return opts.find((t) => t.length < 60) || opts[opts.length - 1].slice(0, 59);
}

export function pairDescription(A, B) {
  const opts = [
    `${A.name} and ${B.name} side by side: archetype, promise, values, voice, colors, fonts and Gravity Score, from the BrandMD index.`,
    `${A.name} and ${B.name} side by side: archetype, values, voice, colors and fonts, from the BrandMD index.`,
    `${A.name} vs ${B.name}: two brand systems side by side, from the BrandMD index.`,
  ];
  return opts.find((t) => t.length < 155) || opts[opts.length - 1].slice(0, 154);
}

export const HUB_TITLE = "Brand vs Brand: Head-to-Head Brand Systems | BrandMD";
export function hubDescription(pairCount, brandCount) {
  return `${pairCount} head-to-head comparisons of brands in the same category: archetype, voice, colors, fonts and Gravity Score, from ${brandCount} indexed brands.`;
}
