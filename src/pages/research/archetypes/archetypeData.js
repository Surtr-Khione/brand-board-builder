// Archetype research: definitions + computed patterns over the BrandMD index.
//
// Plain ESM (no JSX, no import.meta.env) so the SPA pages AND
// scripts/prerender.d/archetypes.mjs compute the exact same numbers from the
// same rows. Every brand-level statement comes from that brand's record;
// every number says what it was computed from. Nothing here is inferred
// about a brand beyond grouping its stored labels.
import { ARCHETYPES, brandArchetypes, sectorOf } from "../../../lib/brandTaxonomy.js";

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
    "The Jester archetype is about joy and living in the moment. Jester brands use humour, play and irreverence to lower defences and make a category feel lighter than its competitors expect.",
  sage:
    "The Sage archetype is about truth and understanding. Sage brands lead with expertise, evidence and clarity, help people see their world more clearly, and treat misinformation or confusion as the thing to beat.",
};

export const INDEX_TITLE = "The 12 Brand Archetypes, by Real Brands | BrandMD";
export const INDEX_DESC = "All 12 Jungian brand archetypes and every brand in the BrandMD index that holds each one, primary or secondary, with patterns from the records.";
export const hubTitle = (name, n) => `${name} Archetype: ${plural(n, "Brand")} Decoded | BrandMD`;
export const hubDesc = (name, n) => `What ${name.replace(/^The /, "the ")} archetype means, the ${plural(n, "brand")} in the BrandMD index that hold it, and their shared colours, values and voice.`;

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

// ── Colour families ────────────────────────────────────────────────────────
// A colour family is computed from the hex alone (lightness, saturation, hue
// angle): it is a grouping of stored hex codes, not a claim about intent.
export const COLOUR_FAMILIES = [
  { slug: "black", name: "Black", swatch: "#111111" },
  { slug: "white", name: "White", swatch: "#F5F5F7" },
  { slug: "grey", name: "Grey", swatch: "#8E8E93" },
  { slug: "red", name: "Red", swatch: "#D32F2F" },
  { slug: "orange", name: "Orange", swatch: "#F57C00" },
  { slug: "brown", name: "Brown", swatch: "#795548" },
  { slug: "yellow", name: "Yellow", swatch: "#FBC02D" },
  { slug: "green", name: "Green", swatch: "#388E3C" },
  { slug: "teal", name: "Teal", swatch: "#00897B" },
  { slug: "blue", name: "Blue", swatch: "#1E6FD9" },
  { slug: "purple", name: "Purple", swatch: "#7B1FA2" },
  { slug: "pink", name: "Pink", swatch: "#D81B60" },
];
const FAMILY_BY_SLUG = Object.fromEntries(COLOUR_FAMILIES.map((f) => [f.slug, f]));

export function colourFamily(hex) {
  if (!hexOk(hex)) return null;
  let h = str(hex).slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l < 0.1) return FAMILY_BY_SLUG.black;
  if (l > 0.93) return FAMILY_BY_SLUG.white;
  if (s < 0.14 || d < 0.06) return l < 0.18 ? FAMILY_BY_SLUG.black : FAMILY_BY_SLUG.grey;
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 15 || hue >= 345) return FAMILY_BY_SLUG.red;
  if (hue < 42) return l < 0.38 ? FAMILY_BY_SLUG.brown : FAMILY_BY_SLUG.orange;
  if (hue < 68) return l < 0.32 ? FAMILY_BY_SLUG.brown : FAMILY_BY_SLUG.yellow;
  if (hue < 160) return FAMILY_BY_SLUG.green;
  if (hue < 195) return FAMILY_BY_SLUG.teal;
  if (hue < 255) return FAMILY_BY_SLUG.blue;
  if (hue < 290) return FAMILY_BY_SLUG.purple;
  return FAMILY_BY_SLUG.pink;
}

export function brandColours(b) {
  return [
    ["Primary", b?.primary_color],
    ["Secondary", b?.secondary_color],
    ["Accent", b?.accent_color],
  ]
    .filter(([, h]) => hexOk(h))
    .map(([role, h]) => ({ role, hex: str(h).toUpperCase(), family: colourFamily(h) }));
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

const byName = (a, b) => str(a.brand_name).localeCompare(str(b.brand_name));

// Primary + secondary holders for every archetype, in wheel order.
export function groupByArchetype(brands = []) {
  const groups = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, { ...a, primary: [], secondary: [] }]));
  for (const b of brands) {
    const { primary, secondary } = brandArchetypes(b);
    if (primary && groups[primary.slug]) groups[primary.slug].primary.push(b);
    if (secondary && groups[secondary.slug]) groups[secondary.slug].secondary.push(b);
  }
  for (const g of Object.values(groups)) {
    g.primary.sort(byName);
    g.secondary.sort(byName);
  }
  return ARCHETYPES.map((a) => groups[a.slug]);
}

// Everything an archetype hub shows, computed from the primary holders.
export function archetypeStats(brands = [], slug) {
  const group = groupByArchetype(brands).find((g) => g.slug === slug);
  if (!group) return null;
  const total = brands.length;
  const P = group.primary;

  // Colour families: brands with at least one stored colour in the family.
  const famCount = new Map();
  let withColours = 0;
  for (const b of P) {
    const cols = brandColours(b);
    if (cols.length) withColours++;
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
  const colourFamilies = [...famCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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

  // Sectors the primary holders sit in.
  const sectorCount = new Map();
  for (const b of P) {
    const s = sectorOf(b.industry);
    if (!s) continue;
    if (!sectorCount.has(s.slug)) sectorCount.set(s.slug, { ...s, count: 0 });
    sectorCount.get(s.slug).count++;
  }
  const sectors = [...sectorCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Most common secondary archetype among the primary holders.
  const pairCount = new Map();
  for (const b of P) {
    const { secondary } = brandArchetypes(b);
    if (!secondary) continue;
    if (!pairCount.has(secondary.slug)) pairCount.set(secondary.slug, { ...secondary, count: 0 });
    pairCount.get(secondary.slug).count++;
  }
  const pairings = [...pairCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    ...group,
    definition: DEFINITIONS[slug],
    total,
    share: total ? Math.round((P.length / total) * 100) : 0,
    colourFamilies, withColours,
    fonts, withFonts,
    enemies, enemyWords,
    values, valueWords,
    doSamples, dontSamples, withVoice,
    sectors, pairings,
  };
}

// Raw label when it differs from the canonical name ("The Rebel" → Outlaw).
export function labelNote(brand, canonicalName) {
  const raw = str(brand?.archetype);
  if (!raw) return "";
  return raw.toLowerCase().replace(/^the\s+/, "") === canonicalName.toLowerCase().replace(/^the\s+/, "") ? "" : raw;
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
