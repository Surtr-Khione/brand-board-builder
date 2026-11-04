// Patterns of the Greats: every number on /patterns, computed from the index.
//
// Plain ESM (no JSX, no import.meta.env) so the SPA page and
// scripts/prerender.d/patterns.mjs compute the SAME numbers from the same
// rows. Nothing here states a fact about a brand that is not in its record;
// the only outside knowledge is the typeface classification table below,
// which describes typefaces, not brands.
import { ARCHETYPES, brandArchetypes, canonicalArchetype, sectorOf } from "../../../lib/brandTaxonomy.js";
import { computeGravityScore } from "../../../lib/gravityScore.js";

// ── Colour ─────────────────────────────────────────────────────────────────

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(raw) {
  const m = String(raw || "").trim().match(HEX);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return { hex: `#${h.toUpperCase()}`, r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function hsl({ r, g, b }) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
  else if (max === G) h = ((B - R) / d + 2) * 60;
  else h = ((R - G) / d + 4) * 60;
  return { h, s, l };
}

// WCAG 2 relative luminance.
export function luminance({ r, g, b }) {
  const ch = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

// Below this luminance white text has more contrast than black text, the
// usual line between a "dark" and a "light" colour.
export const DARK_LUMINANCE = 0.179;

export const COLOUR_FAMILIES = [
  { slug: "black", name: "Black & near-black", rule: "lightness 12% or less" },
  { slug: "white", name: "White & off-white", rule: "lightness 93% or more" },
  { slug: "grey", name: "Grey", rule: "saturation under 15%" },
  { slug: "red", name: "Red", rule: "hue 345° to 15°" },
  { slug: "orange", name: "Orange", rule: "hue 15° to 40°, lightness over 35%" },
  { slug: "brown", name: "Brown", rule: "hue 15° to 40°, lightness 35% or less" },
  { slug: "yellow", name: "Yellow", rule: "hue 40° to 65°" },
  { slug: "green", name: "Green", rule: "hue 65° to 165°" },
  { slug: "teal", name: "Teal & cyan", rule: "hue 165° to 195°" },
  { slug: "blue", name: "Blue", rule: "hue 195° to 255°" },
  { slug: "purple", name: "Purple", rule: "hue 255° to 290°" },
  { slug: "pink", name: "Pink & magenta", rule: "hue 290° to 345°" },
];

export function colourFamily(rgb) {
  const { h, s, l } = hsl(rgb);
  if (l <= 0.12) return "black";
  if (l >= 0.93) return "white";
  if (s < 0.15) return "grey";
  if (h >= 345 || h < 15) return "red";
  if (h < 40) return l <= 0.35 ? "brown" : "orange";
  if (h < 65) return "yellow";
  if (h < 165) return "green";
  if (h < 195) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

// ── Type ───────────────────────────────────────────────────────────────────

// Classification of typeface families (a fact about the typeface, not about
// the brand). Families not listed here, and not named "... Sans" or
// "... Serif", stay unclassified rather than guessed.
const SERIF = ["times new roman", "georgia", "freight display", "freight text", "adobe caslon pro", "caslon", "bookerly", "new york", "garamond", "didot", "bodoni", "baskerville", "tiempos", "playfair"];
const SANS = ["sf pro", "sf compact", "futura", "trade gothic", "circular", "helvetica", "helvetica neue", "helvetica neue condensed", "neue haas grotesk", "arial", "roboto", "roboto condensed", "inter", "lato", "gotham", "calibre", "calibre light", "söhne", "proxima nova", "proxima nova condensed", "itc franklin gothic heavy", "franklin gothic book", "franklin gothic", "maison neue extended bold", "maison neue", "cereal", "google sans", "product sans", "amazon ember", "amazon ember display", "bogle", "emprint", "emprint light", "montserrat", "open sans", "avenir", "gill sans", "din", "univers", "akzidenz-grotesk"];

export function fontStyle(name) {
  const n = String(name || "").toLowerCase().trim();
  if (!n) return null;
  if (SERIF.includes(n) || /\bserif\b/.test(n) && !/sans/.test(n)) return "serif";
  if (SANS.includes(n) || /\bsans\b/.test(n) || /grotesk|gothic/.test(n)) return "sans";
  return null;
}

// "UHC Sans (proprietary) / Proxima Nova" → ["UHC Sans", "Proxima Nova"];
// "CVS Health Sans (proprietary); fallback: Helvetica Neue" → both names.
export function fontNames(raw) {
  return String(raw || "")
    .replace(/\([^)]*\)/g, "")
    .split(/\s*(?:\/|;|,)\s*/)
    .map((s) => s.replace(/^fallback:\s*/i, "").trim())
    .filter((s) => s && s.length < 60);
}

const words = (s) => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);

// A typeface whose name carries the brand's own name ("Netflix Sans",
// "Amazon Ember"), or whose record calls it proprietary or custom.
function isOwnFace(brand, raw, name) {
  if (/proprietary|customi[sz]ed|custom /i.test(String(raw || ""))) return true;
  const bw = new Set(words(brand.brand_name).concat(words(brand.slug)));
  return words(name).some((w) => bw.has(w));
}

// ── Themes (literal keyword matches, shown on the page) ────────────────────

export const ENEMY_THEMES = [
  { slug: "gatekeeping", name: "Gatekeeping", words: ["gatekeep", "gatekept", "gatekeeper"] },
  { slug: "mediocrity", name: "Mediocrity and “good enough”", words: ["mediocr", "good enough", "good-enough"] },
  { slug: "fragmentation", name: "Fragmentation and tool sprawl", words: ["fragment", "disconnected", "siloed", "sprawl", "patchwork"] },
  { slug: "friction", name: "Friction and complexity", words: ["friction", "complexity", "complicat", "bureaucra", "clunky"] },
  { slug: "legacy", name: "Legacy incumbents and the status quo", words: ["legacy", "incumben", "status quo", "establishment"] },
  { slug: "exclusion", name: "Exclusion and access", words: ["exclu", "inaccessib", "reserved for", "for the few", "privilege"] },
  { slug: "extraction", name: "Hidden costs and extraction", words: ["tax", "extract", "predatory", "fee", "opaque"] },
  { slug: "joyless", name: "Joylessness and cynicism", words: ["joyless", "cynic"] },
];

export const VALUE_THEMES = [
  { slug: "transparency", name: "Transparency", words: ["transparen"] },
  { slug: "simplicity", name: "Simplicity", words: ["simpl"] },
  { slug: "access", name: "Access, inclusion and democratization", words: ["access", "inclusi", "democrat", "equality", "equity", "universal"] },
  { slug: "craft", name: "Excellence, craft and quality", words: ["excellen", "craft", "quality"] },
  { slug: "integrity", name: "Integrity, trust and honesty", words: ["integrity", "trust", "honest"] },
  { slug: "speed", name: "Speed", words: ["speed", "fast", "velocity", "latency"] },
  { slug: "community", name: "Community and belonging", words: ["communit", "belonging", "together", "brotherhood"] },
  { slug: "long-term", name: "Long-term thinking", words: ["long-term", "long term", "long-arc", "permanence", "legacy"] },
  { slug: "innovation", name: "Innovation", words: ["innovat", "invent", "reinvent", "pioneer"] },
  { slug: "safety", name: "Safety, security and privacy", words: ["safety", "security", "privacy"] },
  { slug: "sustainability", name: "Sustainability", words: ["sustainab", "environment", "regenerat", "stewardship"] },
];

const hasWord = (text, list) => {
  const t = String(text || "").toLowerCase();
  // Word-start match ("quality" must not hit "equality"); three-letter
  // words must match whole ("fee" must not hit "feeling").
  return list.some((w) => new RegExp(`\\b${w}${w.length <= 3 ? "\\b" : ""}`).test(t));
};

// The name of a value or enemy: the part before " — " or ": ".
export function headOf(s) {
  return String(s || "").split(/\s+—\s+|:\s+/)[0].trim();
}

const valueText = (v) => (typeof v === "string" ? v : v?.name || v?.text || "");

// ── Main ───────────────────────────────────────────────────────────────────

const ref = (b) => ({ slug: b.slug, name: b.brand_name });
const pct = (k, n) => (n ? Math.round((k / n) * 100) : 0);
const byName = (a, b) => String(a.name).localeCompare(String(b.name));

export function computePatterns(rows) {
  const brands = (rows || []).filter((b) => b && b.slug && b.brand_name);
  const N = brands.length;

  // Colour: primary colour family, dark vs light, families across all roles.
  const primaries = [];
  const famPrimary = Object.fromEntries(COLOUR_FAMILIES.map((f) => [f.slug, []]));
  const famAll = Object.fromEntries(COLOUR_FAMILIES.map((f) => [f.slug, 0]));
  let allColourCount = 0;
  for (const b of brands) {
    const p = parseHex(b.primary_color);
    if (p) {
      const fam = colourFamily(p);
      const lum = luminance(p);
      primaries.push({ ...ref(b), hex: p.hex, family: fam, lum, dark: lum < DARK_LUMINANCE });
      famPrimary[fam].push({ ...ref(b), hex: p.hex, lum });
    }
    for (const c of [b.primary_color, b.secondary_color, b.accent_color]) {
      const x = parseHex(c);
      if (x) { famAll[colourFamily(x)]++; allColourCount++; }
    }
  }
  const primaryFamilies = COLOUR_FAMILIES
    .map((f) => ({ ...f, count: famPrimary[f.slug].length, brands: famPrimary[f.slug].sort((a, b) => a.lum - b.lum), allRoles: famAll[f.slug] }))
    .filter((f) => f.count || f.allRoles)
    .sort((a, b) => b.count - a.count || b.allRoles - a.allRoles);
  const darkCount = primaries.filter((p) => p.dark).length;
  const hexTally = {};
  for (const p of primaries) (hexTally[p.hex] ||= []).push({ slug: p.slug, name: p.name });
  const repeatedHexes = Object.entries(hexTally)
    .filter(([, v]) => v.length > 1)
    .map(([hex, v]) => ({ hex, brands: v.sort(byName) }))
    .sort((a, b) => b.brands.length - a.brands.length || a.hex.localeCompare(b.hex));

  // Type.
  const faceMap = {};
  let withFont = 0;
  const own = [];
  const displayStyle = { sans: [], serif: [], unclassified: [] };
  for (const b of brands) {
    const roles = [["display", b.primary_font], ["body", b.body_font], ["accent", b.accent_font]];
    if (!roles.some(([, f]) => String(f || "").trim())) continue;
    withFont++;
    const seen = new Set();
    let ownFace = null;
    for (const [role, raw] of roles) {
      for (const name of fontNames(raw)) {
        const key = name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          (faceMap[key] ||= { name, style: fontStyle(name), brands: [] }).brands.push({ ...ref(b), role });
        }
        if (!ownFace && isOwnFace(b, raw, name)) ownFace = name;
      }
    }
    if (ownFace) own.push({ ...ref(b), face: ownFace });
    const disp = fontNames(b.primary_font)[0];
    if (disp) displayStyle[fontStyle(disp) || "unclassified"].push({ ...ref(b), face: disp });
  }
  const faces = Object.values(faceMap).sort((a, b) => b.brands.length - a.brands.length || a.name.localeCompare(b.name));
  const styleTally = { sans: 0, serif: 0, unclassified: 0 };
  for (const f of faces) styleTally[f.style || "unclassified"]++;

  // Archetypes.
  const archPrimary = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, []]));
  const archSecondary = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, 0]));
  const pairs = {};
  let withArch = 0;
  for (const b of brands) {
    const { primary, secondary } = brandArchetypes(b);
    if (!primary) continue;
    withArch++;
    archPrimary[primary.slug].push(ref(b));
    if (secondary) {
      archSecondary[secondary.slug]++;
      const k = `${primary.slug}|${secondary.slug}`;
      (pairs[k] ||= { primary: primary.slug, secondary: secondary.slug, brands: [] }).brands.push(ref(b));
    }
  }
  const archetypes = ARCHETYPES
    .map((a) => ({ slug: a.slug, name: a.name, count: archPrimary[a.slug].length, secondaryCount: archSecondary[a.slug], brands: archPrimary[a.slug].sort(byName) }))
    .sort((a, b) => b.count - a.count || b.secondaryCount - a.secondaryCount);
  const archName = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, a.name]));
  const topPairs = Object.values(pairs)
    .filter((p) => p.brands.length > 1)
    .map((p) => ({ ...p, primaryName: archName[p.primary], secondaryName: archName[p.secondary], brands: p.brands.sort(byName) }))
    .sort((a, b) => b.brands.length - a.brands.length || a.primaryName.localeCompare(b.primaryName));

  // Enemy themes.
  const withEnemy = brands.filter((b) => String(b.enemy || "").trim());
  const enemyThemes = ENEMY_THEMES.map((t) => {
    const hits = withEnemy.filter((b) => hasWord(b.enemy, t.words)).map((b) => ({ ...ref(b), enemy: headOf(b.enemy) }));
    return { ...t, count: hits.length, brands: hits.sort(byName) };
  }).sort((a, b) => b.count - a.count);
  // Enemies that carry a short name of their own ("The Handoff Wall").
  const namedEnemies = withEnemy
    .map((b) => ({ ...ref(b), enemy: headOf(b.enemy) }))
    .filter((e) => /\s—\s|:\s/.test(String(brands.find((b) => b.slug === e.slug).enemy)) && e.enemy.length <= 40)
    .sort((a, b) => a.enemy.localeCompare(b.enemy));

  // Value themes (matched on each value's name).
  const withValues = brands.filter((b) => Array.isArray(b.core_values) && b.core_values.some((v) => valueText(v).trim()));
  let valueCount = 0;
  for (const b of withValues) valueCount += b.core_values.filter((v) => valueText(v).trim()).length;
  const valueThemes = VALUE_THEMES.map((t) => {
    const hits = [];
    for (const b of withValues) {
      const v = b.core_values.map((x) => headOf(valueText(x))).find((h) => hasWord(h, t.words));
      if (v) hits.push({ ...ref(b), value: v });
    }
    return { ...t, count: hits.length, brands: hits.sort(byName) };
  }).sort((a, b) => b.count - a.count);

  // Gravity.
  const scored = brands.map((b) => {
    const g = computeGravityScore(b);
    return { ...ref(b), score: g.score, met: new Set(g.signals.filter((s) => s.met).map((s) => s.label)), signals: g.signals, b };
  });
  const scores = scored.map((s) => s.score).sort((a, b) => a - b);
  const mean = N ? scores.reduce((a, b) => a + b, 0) / N : 0;
  const median = N ? (N % 2 ? scores[(N - 1) / 2] : (scores[N / 2 - 1] + scores[N / 2]) / 2) : 0;
  const min = scores[0] ?? 0, max = scores[N - 1] ?? 0;
  const buckets = [];
  for (let lo = Math.floor(min / 5) * 5; lo <= max; lo += 5) {
    const inB = scored.filter((s) => s.score >= lo && s.score < lo + 5);
    buckets.push({ score: lo, count: inB.length, brands: inB.map(({ slug, name }) => ({ slug, name })).sort(byName) });
  }
  // Top group: the 90+ tier when it has at least 5 brands, else the top ~10%.
  let TOP = 90;
  if (scored.filter((s) => s.score >= TOP).length < 5) TOP = scores[Math.max(0, N - Math.max(5, Math.round(N / 10)))] ?? 0;
  const top = scored.filter((s) => s.score >= TOP).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const rest = scored.filter((s) => s.score < TOP);
  const signalLabels = scored[0] ? scored[0].signals.map((s) => s.label) : [];
  const signalGap = signalLabels.map((label) => {
    const t = top.filter((s) => s.met.has(label)).length;
    const r = rest.filter((s) => s.met.has(label)).length;
    return { label, top: t, topPct: pct(t, top.length), rest: r, restPct: pct(r, rest.length) };
  }).sort((a, b) => (b.topPct - b.restPct) - (a.topPct - a.restPct) || b.topPct - a.topPct);
  const topArch = {};
  const topSector = {};
  for (const s of top) {
    const a = canonicalArchetype(s.b.archetype);
    if (a) (topArch[a.slug] ||= { slug: a.slug, name: a.name, count: 0 }).count++;
    const sec = sectorOf(s.b.industry);
    if (sec) (topSector[sec.slug] ||= { slug: sec.slug, name: sec.name, count: 0 }).count++;
  }
  const tally = (o) => Object.values(o).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    N,
    colour: {
      withPrimary: primaries.length,
      darkCount,
      lightCount: primaries.length - darkCount,
      darkPct: pct(darkCount, primaries.length),
      allColourCount,
      families: primaryFamilies,
      repeatedHexes,
      darkest: primaries.filter((p) => p.dark).sort((a, b) => a.lum - b.lum).map(({ slug, name, hex }) => ({ slug, name, hex })),
    },
    type: {
      withFont,
      faces,
      faceCount: faces.length,
      shared: faces.filter((f) => f.brands.length > 1),
      styleTally,
      displayStyle: Object.fromEntries(Object.entries(displayStyle).map(([k, v]) => [k, v.sort(byName)])),
      own: own.sort(byName),
    },
    archetype: {
      withArch,
      list: archetypes,
      withSecondary: Object.values(pairs).reduce((n, p) => n + p.brands.length, 0),
      topPairs,
    },
    enemy: { withEnemy: withEnemy.length, themes: enemyThemes, named: namedEnemies },
    values: { withValues: withValues.length, valueCount, themes: valueThemes },
    gravity: {
      mean: Math.round(mean * 10) / 10,
      median,
      min,
      max,
      buckets,
      topThreshold: TOP,
      top: top.map(({ slug, name, score }) => ({ slug, name, score })),
      restCount: rest.length,
      signalGap,
      topArchetypes: tally(topArch),
      topSectors: tally(topSector),
    },
  };
}
