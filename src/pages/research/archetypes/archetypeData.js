// Archetype research: definitions + computed patterns over the BrandMD index.
//
// Plain ESM (no JSX, no import.meta.env) so the SPA pages AND
// scripts/prerender.d/archetypes.mjs compute the exact same numbers from the
// same rows. Every brand-level statement comes from that brand's record;
// every number says what it was computed from. Nothing here is inferred
// about a brand beyond grouping its stored labels.
import { ARCHETYPES, EXPRESSIONS, archetypeBySlug, archetypeOf, sectorOf } from "../../../lib/brandTaxonomy.js";
import { COLOR_FAMILIES, familyOf } from "../../../lib/colorFamilies.js";

// General brand-strategy definitions of the 12 archetypes. These describe the
// archetype, never a particular brand.
export const DEFINITIONS = {
  innocent:
    "The Innocent archetype promises simplicity, optimism and a return to what feels good and honest. Brands that take it on keep things uncomplicated and reassuring, and they steer away from anything that feels cynical, heavy or complicated.",
  everyman:
    "The Everyman archetype is about belonging. It speaks plainly, prizes the practical over the flashy, and positions the brand as one of us rather than above us, so its natural enemy is elitism and pretension.",
  hero:
    "The Hero archetype is about courage and mastery: proving worth by meeting a hard challenge. Hero brands cast the customer as the one who rises to the occasion and the brand as what helps them do it, in a bold, motivating voice.",
  outlaw:
    "The Outlaw (also called the Rebel or Liberator) breaks rules that are not working. It defines itself against an establishment, a convention or a status quo, and it speaks with an edge that invites people to join the break.",
  explorer:
    "The Explorer archetype is driven by freedom, discovery and authenticity. It values self-reliance and the open road, and it resists conformity, confinement and anything that feels mass-produced.",
  creator:
    "The Creator archetype is about imagination and craft: making things of enduring value. Creator brands give people the tools or the inspiration to make something themselves, and their enemy is usually mediocrity or the merely adequate.",
  ruler:
    "The Ruler archetype is about order, control and leadership. It promises stability, quality and authority in a chaotic category, and it tends to speak with confidence, restraint and a premium finish.",
  magician:
    "The Magician archetype is about transformation: making something that seemed impossible happen. Magician brands sell a change of state, from problem to solved or ordinary to remarkable, and lean on vision and a sense of wonder.",
  lover:
    "The Lover archetype is about intimacy, pleasure and beauty. Lover brands appeal to the senses and to desire, and they promise that the customer will feel special, attractive or deeply connected.",
  caregiver:
    "The Caregiver archetype is about protecting and serving others. It leads with compassion, generosity and reliability, and its core promise is that the customer, and the people they care about, will be looked after.",
  jester:
    "The Jester archetype is about joy and living in the moment. Jester brands use humor, play and irreverence to lower defenses and make a category feel lighter than its competitors expect.",
  sage:
    "The Sage archetype is about truth and understanding. Sage brands lead with expertise, evidence and clarity, help people see their world more clearly, and treat misinformation or confusion as the thing to beat.",
};

export const INDEX_TITLE = "The 12 Brand Archetypes, by Real Brands | BrandMD";
export const INDEX_DESC = "All 12 brand archetypes, their named expressions, and every brand in the BrandMD index that holds each one, with patterns from the records.";
export const hubTitle = (name, n) => `${name} Archetype: ${plural(n, "Brand")} Decoded | BrandMD`;
export const hubDesc = (name, n) => `What ${name.replace(/^The /, "the ")} archetype means, its expressions, the ${plural(n, "brand")} in the BrandMD index that hold it, and their shared colors and values.`;
// Expression pages: "Rebel Archetype: 6 Outlaw Brands | BrandMD"
export const exprTitle = (name, familyName, n) => `${name} Archetype: ${plural(n, `${familyName.replace(/^The /, "")} Brand`)} | BrandMD`;
export const exprDesc = (name, familyName, n) => `The ${name} is a way of playing ${familyName.replace(/^The /, "the ")}. What it means, the ${plural(n, "brand")} in the BrandMD index that hold it, and what they share.`;

// ── Small helpers ──────────────────────────────────────────────────────────

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());
const listOf = (v) =>
  Array.isArray(v)
    ? v.map((x) => (typeof x === "string" ? x : x?.name || x?.text || x?.value || "")).map(str).filter(Boolean)
    : [];
const hexOk = (h) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str(h));

// "Simplicity — great design removes complexity" → "Simplicity"
export function headOf(text) {
  const t = str(text).replace(/^["“']|["”']$/g, "");
  const cut = t.split(/\s+[—–]\s+|\s+-\s+|:\s+/)[0];
  return cut.length > 140 ? cut.slice(0, 137).replace(/\s+\S*$/, "") + "…" : cut;
}

// ── Color families ────────────────────────────────────────────────────────
// A color family is computed from the hex alone (lightness, saturation, hue
// angle): it is a grouping of stored hex codes, not a claim about intent.
// Shared with /patterns and /sectors (src/lib/colorFamilies.js), so one hex
// gets one family on every research page.
export { COLOR_FAMILIES };
const FAMILY_BY_SLUG = Object.fromEntries(COLOR_FAMILIES.map((f) => [f.slug, f]));

export function colorFamily(hex) {
  return hexOk(hex) ? familyOf(str(hex)) : null;
}

export function brandColors(b) {
  return [
    ["Primary", b?.primary_color],
    ["Secondary", b?.secondary_color],
    ["Accent", b?.accent_color],
  ]
    .filter(([, h]) => hexOk(h))
    .map(([role, h]) => ({ role, hex: str(h).toUpperCase(), family: colorFamily(h) }));
}

export function brandFonts(b) {
  const seen = new Set();
  const out = [];
  const raw = [b?.primary_font, b?.body_font, b?.accent_font].flatMap((f) => str(f).split(/\s+\/\s+|,\s*/));
  for (const f of raw) {
    const name = str(f).replace(/\s*\(.*\)\s*$/, "");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function voiceLines(b) {
  const bd = b?.brand_data || {};
  const dos = listOf(b?.do_say).length ? listOf(b?.do_say) : listOf(bd.messagingDos);
  const donts = listOf(b?.dont_say).length ? listOf(b?.dont_say) : listOf(bd.messagingDonts);
  return { dos, donts };
}

// ── Recurring words ────────────────────────────────────────────────────────
// Which words show up in the enemy / value statements of 2+ brands. Counted
// once per brand. A plain word count over the stored text, no interpretation.
const STOP = new Set(`a about above across after again against all also always an and any are as at be because been before being
between both but by can cannot could did do does doing down during each every few for from further had has have having he her here
hers him his how i if in into is it its itself just like make makes made me more most much must my no nor not now of off on once only
or other our ours out over own same she should so some such than that the their theirs them then there these they this those through
to too under until up upon very was we were what when where which while who whom why will with within without would you your yours
one ones thing things way ways people world brand brands whose rather instead even still kind sort lot lots get gets got
being become becomes becoming idea ideas belief beliefs assumption assumptions notion feel feels really new well
else better built model norm companies businesses something nothing everything anyone everyone`.split(/\s+/));

function wordsOf(text) {
  return str(text)
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .split(/[^a-z-]+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

function recurringWords(entries, minBrands = 2, limit = 10) {
  // entries: [{ brand, text }]
  const byWord = new Map();
  for (const { brand, text } of entries) {
    for (const w of new Set(wordsOf(text))) {
      if (!byWord.has(w)) byWord.set(w, new Set());
      byWord.get(w).add(brand.slug);
    }
  }
  const nameOf = Object.fromEntries(entries.map((e) => [e.brand.slug, e.brand.brand_name]));
  return [...byWord.entries()]
    .filter(([, s]) => s.size >= minBrands)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, s]) => ({ word, count: s.size, brands: [...s].sort().map((slug) => ({ slug, name: nameOf[slug] })) }));
}

// ── Grouping ───────────────────────────────────────────────────────────────
// Three levels, all read through archetypeOf (src/lib/brandTaxonomy.js):
//   family      the brand's primary archetype (one of the 12);
//   expression  the named sub-type its own label points to, if any;
//   blend       its other archetypes: the record's secondary_archetype
//               (source "record") and any further archetype named inside a
//               hybrid label (source "label").

const byName = (a, b) => str(a.brand_name).localeCompare(str(b.brand_name));
const byEntryName = (a, b) => byName(a.brand, b.brand);

// Primary holders + every blend appearance for each archetype, wheel order.
//   primary: [brand]                     the family is the brand's primary
//   blend:   [{ brand, source, expression }]  the family is in its blend
export function groupByArchetype(brands = []) {
  const groups = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, { ...a, primary: [], blend: [] }]));
  for (const b of brands) {
    const a = archetypeOf(b);
    if (!a) continue;
    if (groups[a.family.slug]) groups[a.family.slug].primary.push(b);
    for (const x of a.blend) {
      if (groups[x.family.slug]) groups[x.family.slug].blend.push({ brand: b, source: x.source, expression: x.expression });
    }
  }
  for (const g of Object.values(groups)) {
    g.primary.sort(byName);
    g.blend.sort(byEntryName);
  }
  return ARCHETYPES.map((a) => groups[a.slug]);
}

// ── Expressions ────────────────────────────────────────────────────────────
// An expression gets its own page only when 2+ brands hold it as their
// PRIMARY expression (their own archetype label names it). A brand that only
// carries it in its secondary_archetype is listed on the page but does not
// count toward the threshold.
export const EXPRESSION_PAGE_MIN = 2;

// Every expression any brand holds, with its holders.
//   { ...expression, familyName, primary: [brand], secondary: [brand], hasPage }
export function expressionGroups(brands = []) {
  const groups = new Map();
  const get = (id) => {
    if (!groups.has(id)) {
      const e = EXPRESSIONS.find((x) => x.id === id);
      groups.set(id, { ...e, familyName: archetypeBySlug(e.family).name, primary: [], secondary: [] });
    }
    return groups.get(id);
  };
  for (const b of brands) {
    const a = archetypeOf(b);
    if (!a) continue;
    if (a.expression) get(a.expression.id).primary.push(b);
    for (const x of a.blend) if (x.expression && x.source === "record") get(x.expression.id).secondary.push(b);
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      primary: g.primary.sort(byName),
      secondary: g.secondary.sort(byName),
      hasPage: g.primary.length >= EXPRESSION_PAGE_MIN,
    }))
    .sort((a, b) => b.primary.length - a.primary.length || b.secondary.length - a.secondary.length || a.name.localeCompare(b.name));
}

// Where an expression's name should link: its own page when it has one,
// else its section on the family hub.
export const expressionPath = (g) => (g.hasPage ? `/archetypes/${g.family}/${g.slug}` : `/archetypes/${g.family}#${g.slug}`);

// A family's expressions (held ones only) plus its pure-family brands: those
// whose label names the family itself, with no expression.
export function familyExpressions(brands = [], family) {
  const expressions = expressionGroups(brands).filter((g) => g.family === family);
  const pure = brands.filter((b) => {
    const a = archetypeOf(b);
    return a && a.family.slug === family && !a.expression;
  }).sort(byName);
  return { expressions, pure };
}

export function expressionGroup(brands = [], family, slug) {
  return expressionGroups(brands).find((g) => g.family === family && g.slug === slug) || null;
}

// "Mapped by BrandMD from the record's label …" when any part of the brand's
// archetype reading is a BrandMD judgment call; "" otherwise.
export const mappedNote = (brand) => archetypeOf(brand)?.mappedNote || "";

// ── Patterns ───────────────────────────────────────────────────────────────

// Patterns shared by a set of brands (an archetype's or an expression's
// primary holders): colors, fonts, enemies, values, voice, sectors, blends.
export function patternsOf(P = []) {
  // Color families: brands with at least one stored color in the family.
  const famCount = new Map();
  let withColors = 0;
  for (const b of P) {
    const cols = brandColors(b);
    if (cols.length) withColors++;
    const fams = new Map();
    for (const c of cols) if (c.family) { if (!fams.has(c.family.slug)) fams.set(c.family.slug, []); fams.get(c.family.slug).push(c.hex); }
    for (const [f, hexes] of fams) {
      if (!famCount.has(f)) famCount.set(f, { ...FAMILY_BY_SLUG[f], count: 0, hexes: [], brands: [] });
      const e = famCount.get(f);
      e.count++;
      e.brands.push(b.brand_name);
      for (const h of hexes) if (!e.hexes.includes(h)) e.hexes.push(h);
    }
  }
  const colorFamilies = [...famCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Fonts: brands naming the font in any role.
  const fontCount = new Map();
  let withFonts = 0;
  for (const b of P) {
    const fs = brandFonts(b);
    if (fs.length) withFonts++;
    for (const f of fs) {
      const k = f.toLowerCase();
      if (!fontCount.has(k)) fontCount.set(k, { name: f, count: 0, brands: [] });
      const e = fontCount.get(k);
      e.count++;
      e.brands.push(b.brand_name);
    }
  }
  const fonts = [...fontCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Enemies and values, quoted per brand + recurring words.
  const enemies = P.filter((b) => str(b.enemy)).map((b) => ({ brand: b, text: headOf(b.enemy) }));
  const enemyWords = recurringWords(P.filter((b) => str(b.enemy)).map((b) => ({ brand: b, text: b.enemy })));
  const valueEntries = P.flatMap((b) => listOf(b.core_values).map((v) => ({ brand: b, text: headOf(v) })));
  const values = P.filter((b) => listOf(b.core_values).length).map((b) => ({ brand: b, values: listOf(b.core_values).map(headOf) }));
  const valueWords = recurringWords(valueEntries);

  // Voice samples: one do and one don't per brand, first brands by name.
  const doSamples = [];
  const dontSamples = [];
  for (const b of P) {
    const { dos, donts } = voiceLines(b);
    if (dos[0] && doSamples.length < 4) doSamples.push({ brand: b, text: dos[0] });
    if (donts[0] && dontSamples.length < 4) dontSamples.push({ brand: b, text: donts[0] });
  }
  const withVoice = P.filter((b) => { const v = voiceLines(b); return v.dos.length || v.donts.length; }).length;

  // Primary sectors of these brands.
  const sectorCount = new Map();
  for (const b of P) {
    const s = sectorOf(b.industry);
    if (!s) continue;
    if (!sectorCount.has(s.slug)) sectorCount.set(s.slug, { ...s, count: 0 });
    sectorCount.get(s.slug).count++;
  }
  const sectors = [...sectorCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Archetypes these brands blend with (every blend entry, once per brand).
  const pairCount = new Map();
  for (const b of P) {
    const a = archetypeOf(b);
    for (const x of a?.blend || []) {
      if (!pairCount.has(x.family.slug)) pairCount.set(x.family.slug, { ...x.family, count: 0 });
      pairCount.get(x.family.slug).count++;
    }
  }
  const pairings = [...pairCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    colorFamilies, withColors,
    fonts, withFonts,
    enemies, enemyWords,
    values, valueWords,
    doSamples, dontSamples, withVoice,
    sectors, pairings,
  };
}

// Everything an archetype hub shows. Patterns come from the primary holders.
export function archetypeStats(brands = [], slug) {
  const group = groupByArchetype(brands).find((g) => g.slug === slug);
  if (!group) return null;
  const total = brands.length;
  const P = group.primary;
  return {
    ...group,
    ...patternsOf(P),
    ...familyExpressions(brands, slug),
    definition: DEFINITIONS[slug],
    total,
    share: total ? Math.round((P.length / total) * 100) : 0,
  };
}

// Everything an expression page shows. Patterns come from the brands whose
// own label names the expression (the primary holders).
export function expressionStats(brands = [], family, slug) {
  const g = expressionGroup(brands, family, slug);
  if (!g) return null;
  const siblings = expressionGroups(brands).filter((x) => x.family === family && x.id !== g.id);
  return { ...g, ...patternsOf(g.primary), siblings, total: brands.length };
}

// Raw label when it differs from the canonical name ("The Rebel" → Outlaw).
export function labelNote(brand, canonicalName) {
  const raw = str(brand?.archetype);
  if (!raw) return "";
  return raw.toLowerCase().replace(/^the\s+/, "") === canonicalName.toLowerCase().replace(/^the\s+/, "") ? "" : raw;
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
