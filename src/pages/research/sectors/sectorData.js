// Sector research: every number on /sectors and /sectors/:slug is computed
// here, from the library rows only, so the SPA pages and the prerendered
// crawlable bodies (scripts/prerender.d/sectors.mjs) can never disagree.
//
// Plain ESM: no JSX, no import.meta.env (imported under node by the prerender).
// Nothing is inferred about a brand: empty fields are left out, quotes are the
// record's own text, and computed figures carry the base they were computed on.
import { SECTORS, sectorOf, brandArchetypes, ARCHETYPES, rivalsOf, rivalPairSlug } from "../../../lib/brandTaxonomy.js";
import { computeGravityScore } from "../../../lib/gravityScore.js";

const present = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const hexOk = (h) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(h || "").trim());

function normHex(h) {
  let s = String(h).trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return `#${s.toUpperCase()}`;
}

// ── Colour families ───────────────────────────────────────────────────────
// A colour family is computed from the hue, saturation and lightness of the
// recorded hex value. It describes the hex, not the brand's intent.
export const COLOUR_FAMILIES = [
  { key: "black", name: "Black / near-black", swatch: "#111111" },
  { key: "grey", name: "Grey", swatch: "#8E8E93" },
  { key: "white", name: "White / near-white", swatch: "#F5F5F7" },
  { key: "red", name: "Red", swatch: "#D7263D" },
  { key: "orange", name: "Orange", swatch: "#F28C28" },
  { key: "yellow", name: "Yellow", swatch: "#F2C230" },
  { key: "green", name: "Green", swatch: "#2E9E5B" },
  { key: "teal", name: "Teal / cyan", swatch: "#14A3A8" },
  { key: "blue", name: "Blue", swatch: "#2A6DD6" },
  { key: "purple", name: "Purple", swatch: "#7B4FD0" },
  { key: "pink", name: "Pink / magenta", swatch: "#D6409F" },
];
const FAMILY_BY_KEY = Object.fromEntries(COLOUR_FAMILIES.map((f) => [f.key, f]));

export function colourFamily(hex) {
  if (!hexOk(hex)) return null;
  const h = normHex(hex);
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  if (l < 0.13) return FAMILY_BY_KEY.black;
  if (l > 0.93) return FAMILY_BY_KEY.white;
  if (s < 0.15) return l < 0.3 ? FAMILY_BY_KEY.black : l > 0.85 ? FAMILY_BY_KEY.white : FAMILY_BY_KEY.grey;
  if (hue < 15 || hue >= 345) return FAMILY_BY_KEY.red;
  if (hue < 45) return FAMILY_BY_KEY.orange;
  if (hue < 70) return FAMILY_BY_KEY.yellow;
  if (hue < 165) return FAMILY_BY_KEY.green;
  if (hue < 195) return FAMILY_BY_KEY.teal;
  if (hue < 260) return FAMILY_BY_KEY.blue;
  if (hue < 295) return FAMILY_BY_KEY.purple;
  return FAMILY_BY_KEY.pink;
}

export function luma(hex) {
  if (!hexOk(hex)) return 0;
  const h = normHex(hex);
  return (parseInt(h.slice(1, 3), 16) * 299 + parseInt(h.slice(3, 5), 16) * 587 + parseInt(h.slice(5, 7), 16) * 114) / 1000;
}

// ── Per-brand row ─────────────────────────────────────────────────────────

function firstSentence(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  // A sentence ends at . ! or ? followed by a space and a capital letter or quote.
  const m = t.match(/^[\s\S]{40,}?[.!?](?=\s+["“A-Z0-9])/);
  return (m ? m[0] : t).trim();
}

function asList(v) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.text || x?.name || "")).map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

export function brandRow(b) {
  const { primary, secondary } = brandArchetypes(b);
  let gravity = null;
  try { gravity = computeGravityScore(b).score; } catch { gravity = null; }
  const colours = [["Primary", b.primary_color], ["Secondary", b.secondary_color], ["Accent", b.accent_color]]
    .filter(([, h]) => hexOk(h))
    .map(([role, h]) => ({ role, hex: normHex(h) }));
  const fonts = [["Display", b.primary_font], ["Body", b.body_font], ["Accent", b.accent_font]]
    .filter(([, f]) => present(f))
    .map(([role, f]) => ({ role, name: String(f).trim() }));
  const bd = b.brand_data || {};
  return {
    slug: b.slug,
    name: b.brand_name,
    tagline: present(b.tagline) ? String(b.tagline).trim() : "",
    industry: present(b.industry) ? String(b.industry).trim() : "",
    archetype: primary ? { slug: primary.slug, name: primary.name } : null,
    secondary: secondary ? { slug: secondary.slug, name: secondary.name } : null,
    gravity: Number.isFinite(gravity) ? gravity : null,
    colours,
    fonts,
    tone: asList(b.tone_attributes).length ? asList(b.tone_attributes) : asList(bd.toneAttributes),
    competitorDiff: asList(b.competitor_diff),
    positioning: firstSentence(bd.competitivePositioning),
  };
}

// ── Sector rollups ────────────────────────────────────────────────────────

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

const fontKey = (f) => String(f).toLowerCase().replace(/\(.*?\)/g, "").split(/[;,/]|fallback:/)[0].replace(/\s+/g, " ").trim();

export function sectorDetail(sector, sectorBrands, allBrands) {
  const rows = sectorBrands.map(brandRow).sort((a, b) => (b.gravity ?? -1) - (a.gravity ?? -1) || a.name.localeCompare(b.name));
  const n = rows.length;
  const total = allBrands.length;

  // Archetype mix (primary archetype), with the index-wide share for context.
  const indexArch = {};
  for (const b of allBrands) { const a = brandArchetypes(b).primary; if (a) indexArch[a.slug] = (indexArch[a.slug] || 0) + 1; }
  const mixCount = {};
  const mixBrands = {};
  for (const r of rows) if (r.archetype) {
    mixCount[r.archetype.slug] = (mixCount[r.archetype.slug] || 0) + 1;
    (mixBrands[r.archetype.slug] ||= []).push({ slug: r.slug, name: r.name });
  }
  const archetypeMix = ARCHETYPES.filter((a) => mixCount[a.slug])
    .map((a) => ({
      slug: a.slug, name: a.name, count: mixCount[a.slug], share: pct(mixCount[a.slug], n),
      indexCount: indexArch[a.slug] || 0, indexShare: pct(indexArch[a.slug] || 0, total),
      brands: mixBrands[a.slug],
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Gravity
  const scored = rows.filter((r) => r.gravity !== null);
  const avgGravity = scored.length ? Math.round(scored.reduce((s, r) => s + r.gravity, 0) / scored.length) : null;
  const minGravity = scored.length ? Math.min(...scored.map((r) => r.gravity)) : null;
  const maxGravity = scored.length ? Math.max(...scored.map((r) => r.gravity)) : null;

  // Colour families of the recorded primary colour.
  const withPrimary = rows.filter((r) => r.colours.some((c) => c.role === "Primary"));
  const famCount = {};
  const famBrands = {};
  for (const r of withPrimary) {
    const f = colourFamily(r.colours.find((c) => c.role === "Primary").hex);
    if (!f) continue;
    famCount[f.key] = (famCount[f.key] || 0) + 1;
    (famBrands[f.key] ||= []).push(r.name);
  }
  const primaryFamilies = COLOUR_FAMILIES.filter((f) => famCount[f.key])
    .map((f) => ({ ...f, count: famCount[f.key], brands: famBrands[f.key] }))
    .sort((a, b) => b.count - a.count);

  // Every recorded colour (all roles) by family, for the palette-wide view.
  const allFam = {};
  let colourTotal = 0;
  for (const r of rows) for (const c of r.colours) { const f = colourFamily(c.hex); if (f) { allFam[f.key] = (allFam[f.key] || 0) + 1; colourTotal++; } }
  const paletteFamilies = COLOUR_FAMILIES.filter((f) => allFam[f.key]).map((f) => ({ ...f, count: allFam[f.key] })).sort((a, b) => b.count - a.count);

  // Exact hex values recorded by two or more brands in the sector.
  const hexBrands = {};
  for (const r of rows) for (const h of new Set(r.colours.map((c) => c.hex))) (hexBrands[h] ||= []).push(r.name);
  // Pure white and pure black are left out: they are page defaults, not a choice of hue.
  const sharedHexes = Object.entries(hexBrands).filter(([h, v]) => v.length > 1 && h !== "#FFFFFF" && h !== "#000000").map(([hex, brands]) => ({ hex, brands })).sort((a, b) => b.brands.length - a.brands.length);

  // Fonts
  const withFonts = rows.filter((r) => r.fonts.length);
  const fontBrands = {};
  const fontLabel = {};
  for (const r of withFonts) {
    for (const k of new Set(r.fonts.map((f) => fontKey(f.name)).filter(Boolean))) {
      (fontBrands[k] ||= []).push(r.name);
      if (!fontLabel[k]) fontLabel[k] = r.fonts.find((f) => fontKey(f.name) === k).name.replace(/\s*\(.*?\)\s*/g, " ").split(/;|fallback:/)[0].trim();
    }
  }
  const sharedFonts = Object.entries(fontBrands).filter(([, v]) => v.length > 1).map(([k, brands]) => ({ name: fontLabel[k], brands }));

  // Tone words used by two or more brands in the sector.
  const toneBrands = {};
  const toneLabel = {};
  // Only short tone words (three words or fewer): long descriptive phrases
  // rarely repeat verbatim, and a match on one would be noise.
  for (const r of rows) for (const t of new Set(r.tone.filter((x) => x.split(/\s+/).length <= 3).map((x) => x.toLowerCase()))) { (toneBrands[t] ||= []).push(r.name); toneLabel[t] ||= r.tone.find((x) => x.toLowerCase() === t); }
  const sharedTone = Object.entries(toneBrands).filter(([, v]) => v.length > 1).map(([k, brands]) => ({ word: toneLabel[k], brands })).sort((a, b) => b.brands.length - a.brands.length);

  // Raw industry labels that roll up into this sector.
  const industries = [...new Set(rows.map((r) => r.industry).filter(Boolean))].sort();

  // Curated same-category pairs where both brands are in this sector.
  const inSector = new Set(rows.map((r) => r.slug));
  const nameOf = Object.fromEntries(rows.map((r) => [r.slug, r.name]));
  const seen = new Set();
  const rivals = [];
  for (const r of rows) for (const x of rivalsOf(r.slug)) {
    if (!inSector.has(x.slug)) continue;
    const key = [r.slug, x.slug].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    // /versus/<a>-vs-<b> (slugs sorted) is the versus family's canonical pair page.
    rivals.push({ a: { slug: r.slug, name: r.name }, b: { slug: x.slug, name: nameOf[x.slug] }, basis: x.basis, versus: `/versus/${rivalPairSlug(r.slug, x.slug)}` });
  }

  return {
    sector, rows, n, total, share: pct(n, total),
    archetypeMix, avgGravity, minGravity, maxGravity,
    withPrimaryCount: withPrimary.length, primaryFamilies, paletteFamilies, colourTotal, sharedHexes,
    withFontsCount: withFonts.length, sharedFonts, sharedTone,
    industries, rivals,
  };
}

// All sectors that have at least one brand, in taxonomy order, each with its
// detail rollup. Brands whose industry maps to no sector are counted apart.
export function buildSectors(allBrands) {
  const by = {};
  let unmapped = 0;
  for (const b of allBrands) {
    const s = sectorOf(b.industry);
    if (!s) { unmapped++; continue; }
    (by[s.slug] ||= []).push(b);
  }
  const sectors = SECTORS.filter((s) => by[s.slug]?.length).map((s) => sectorDetail(s, by[s.slug], allBrands));
  return { sectors, unmapped, total: allBrands.length };
}

// The intro sentence for one sector, from computed facts only.
export function sectorIntro(d) {
  const top = d.archetypeMix[0];
  const tied = d.archetypeMix.filter((a) => top && a.count === top.count);
  const archBit = !top ? "" : tied.length > 1
    ? ` The most common primary archetypes are ${listJoin(tied.map((a) => a.name))}, with ${top.count} brand${top.count === 1 ? "" : "s"} each.`
    : ` The most common primary archetype is ${top.name} (${top.count} of ${d.n}).`;
  const grav = d.avgGravity !== null ? ` Their average Gravity Score is ${d.avgGravity} of 100, ranging from ${d.minGravity} to ${d.maxGravity}.` : "";
  return `${d.n} of the ${d.total} brands in the BrandMD index fall in ${d.sector.name}, grouped from the industry each brand's record lists.${archBit}${grav} Below: each brand's archetype and score, the shared colour and type patterns, and how the brands describe their own differences, quoted from their records.`;
}

export function listJoin(items) {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a.join("");
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
}

export const GRAVITY_NOTE = "Gravity Score: how much of a coherent, documented identity is on record for a brand in the BrandMD index, out of 100. It measures the record, not the business.";

// ── Titles and meta descriptions (shared by the SPA and the prerender) ──

function fit(options, max) {
  return options.find((o) => o.length <= max) || options[options.length - 1].slice(0, max);
}

export function hubMeta(total, sectorCount) {
  return {
    title: fit(["Brand Sectors: Archetypes & Palettes by Industry | BrandMD", "Brand Sectors | BrandMD"], 60),
    description: fit([
      `${total} brands in the BrandMD index grouped into ${sectorCount} sectors: archetype mix, Gravity Scores, colour and type patterns for each.`,
      `${total} brands grouped into ${sectorCount} sectors by archetype, Gravity Score and palette.`,
    ], 154),
  };
}

export function sectorMeta(d) {
  const name = d.sector.name;
  const names = d.rows.slice(0, 3).map((r) => r.name);
  return {
    title: fit([
      `${name} Brands: Archetypes & Palettes | BrandMD`,
      `${name} Brands: Archetype Mix | BrandMD`,
      `${name} Brands | BrandMD`,
    ], 59),
    description: fit([
      d.n > 3
        ? `${d.n} ${name} brands in the BrandMD index, ${listJoin(names)} among them: archetype mix, Gravity Scores, colours, type and positioning.`
        : `${name} in the BrandMD index: ${listJoin(d.rows.map((r) => r.name))}. Archetypes, Gravity Scores, colours, type and positioning.`,
      `${d.n} ${name} brands in the BrandMD index: archetype mix, Gravity Scores, colours, type and how each positions itself.`,
      `${d.n} ${name} brands: archetypes, Gravity Scores, colours and positioning.`,
    ], 154),
  };
}
