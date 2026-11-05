// Sector research: every number on /sectors and /sectors/:slug is computed
// here, from the library rows only, so the SPA pages and the prerendered
// crawlable bodies (scripts/prerender.d/sectors.mjs) can never disagree.
//
// Plain ESM: no JSX, no import.meta.env (imported under node by the prerender).
// Nothing is inferred about a brand: empty fields are left out, quotes are the
// record's own text, and computed figures carry the base they were computed on.
import { SECTORS, sectorsOf, brandArchetypes, archetypeOf, ARCHETYPES, rivalsOf, rivalPairSlug } from "../../../lib/brandTaxonomy.js";
import { computeGravityScore } from "../../../lib/gravityScore.js";
import { COLOR_FAMILIES, familyOf } from "../../../lib/colorFamilies.js";

const present = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const hexOk = (h) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(h || "").trim());

function normHex(h) {
  let s = String(h).trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return `#${s.toUpperCase()}`;
}

// ── Color families ───────────────────────────────────────────────────────
// A color family is computed from the hue, saturation and lightness of the
// recorded hex value. It describes the hex, not the brand's intent.
// The family table and rule are shared with /patterns and /archetypes
// (src/lib/colorFamilies.js), so one hex gets one family everywhere.
export { COLOR_FAMILIES };

export function colorFamily(hex) {
  return hexOk(hex) ? familyOf(normHex(hex)) : null;
}

export function luma(hex) {
  if (!hexOk(hex)) return 0;
  const h = normHex(hex);
  return (parseInt(h.slice(1, 3), 16) * 299 + parseInt(h.slice(3, 5), 16) * 587 + parseInt(h.slice(5, 7), 16) * 114) / 1000;
}

// ── Per-brand row ─────────────────────────────────────────────────────────

// The positioning line shown on sector pages is BrandMD's own synthesized
// text (brand_data.competitivePositioning, written by the enrichment script),
// not a brand statement. Only the first sentence that carries no figures
// (digits, %, $), no comparison ("vs", "than", "against") and no proper name
// other than the brand's own is shown, so the page republishes no unverified
// market-share numbers and names no rivals. A sentence that leans on the one
// before it ("This…", "None…") is skipped too. No passing sentence: no line.
const ACRONYMS = new Set(["AI", "UX", "OS", "SMB", "DIY", "DTC", "US", "U.S.", "UHNW", "ARPU", "API", "AND"]);
// Ordinary words that may open a sentence with a capital letter.
const STARTERS = new Set(["Its", "The", "A", "An", "No", "Key", "Every", "At", "As", "Where", "With", "For", "Our"]);

function cleanPositioning(text, ownName) {
  const t = String(text || "").trim();
  if (!t) return "";
  const own = new Set(String(ownName || "").toLowerCase().split(/[\s/]+/).flatMap((w) => [w, ...w.split(/[-'’.]/)]).map((w) => w.replace(/[^\p{L}&-]/gu, "")).filter(Boolean));
  const properNoun = (x) =>
    x.split(/[\s/]+/).some((raw, i) => {
      const w = raw.replace(/^["“'‘(]+|[)"”'’,;:.!?—–]+$/g, "").replace(/['’]s$/, "");
      if (own.has(w.toLowerCase())) return false;
      if (i === 0) return !STARTERS.has(w);
      if (!/^\p{Lu}/u.test(w)) return false;
      return !ACRONYMS.has(w);
    });
  const ok = (x) =>
    x.length >= 40 &&
    !/[\d%$€£]/.test(x) &&
    !/\b(vs\.?|versus|than|against|all three|this)\b/i.test(x) &&
    !properNoun(x);
  const sentences = t.split(/(?<=[.!?])\s+(?=["“\p{Lu}])/u);
  return (sentences.find(ok) || "").trim();
}

function asList(v) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.text || x?.name || "")).map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

export function brandRow(b) {
  const { primary, secondary } = brandArchetypes(b);
  const expr = archetypeOf(b)?.expression || null;
  // Sector tags read from the record's own industry text, primary first.
  const tags = sectorsOf(b).all;
  let gravity = null;
  try { gravity = computeGravityScore(b).score; } catch { gravity = null; }
  const colors = [["Primary", b.primary_color], ["Secondary", b.secondary_color], ["Accent", b.accent_color]]
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
    expression: expr ? { slug: expr.slug, name: expr.name } : null,
    sectors: tags,
    gravity: Number.isFinite(gravity) ? gravity : null,
    colors,
    fonts,
    tone: asList(b.tone_attributes).length ? asList(b.tone_attributes) : asList(bd.toneAttributes),
    positioning: cleanPositioning(bd.competitivePositioning, b.brand_name),
  };
}

// ── Sector rollups ────────────────────────────────────────────────────────

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

const fontKey = (f) => String(f).toLowerCase().replace(/\(.*?\)/g, "").split(/[;,/]|fallback:/)[0].replace(/\s+/g, " ").trim();

// `sectorBrands` = brands whose PRIMARY sector this is; every rollup below
// (archetype mix, Gravity, color, type, tone, pairs) counts those only.
// `alsoBrands` = brands that carry this sector as a further tag read from
// their industry text; they are listed apart and never enter the rollups.
export function sectorDetail(sector, sectorBrands, allBrands, alsoBrands = []) {
  const byScore = (a, b) => (b.gravity ?? -1) - (a.gravity ?? -1) || a.name.localeCompare(b.name);
  const rows = sectorBrands.map(brandRow).sort(byScore);
  const also = alsoBrands.map(brandRow).sort(byScore);
  const n = rows.length;
  const tagged = n + also.length;
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

  // Color families of the recorded primary color.
  const withPrimary = rows.filter((r) => r.colors.some((c) => c.role === "Primary"));
  const famCount = {};
  const famBrands = {};
  for (const r of withPrimary) {
    const f = colorFamily(r.colors.find((c) => c.role === "Primary").hex);
    if (!f) continue;
    famCount[f.key] = (famCount[f.key] || 0) + 1;
    (famBrands[f.key] ||= []).push(r.name);
  }
  const primaryFamilies = COLOR_FAMILIES.filter((f) => famCount[f.key])
    .map((f) => ({ ...f, count: famCount[f.key], brands: famBrands[f.key] }))
    .sort((a, b) => b.count - a.count);

  // Every recorded color (all roles) by family, for the palette-wide view.
  const allFam = {};
  let colorTotal = 0;
  for (const r of rows) for (const c of r.colors) { const f = colorFamily(c.hex); if (f) { allFam[f.key] = (allFam[f.key] || 0) + 1; colorTotal++; } }
  const paletteFamilies = COLOR_FAMILIES.filter((f) => allFam[f.key]).map((f) => ({ ...f, count: allFam[f.key] })).sort((a, b) => b.count - a.count);

  // Exact hex values recorded by two or more brands in the sector.
  const hexBrands = {};
  for (const r of rows) for (const h of new Set(r.colors.map((c) => c.hex))) (hexBrands[h] ||= []).push(r.name);
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
    // /battles/<a>-vs-<b> (slugs sorted) is the Brand Battles family's canonical pair page.
    rivals.push({ a: { slug: r.slug, name: r.name }, b: { slug: x.slug, name: nameOf[x.slug] }, basis: x.basis, battle: `/battles/${rivalPairSlug(r.slug, x.slug)}` });
  }

  return {
    sector, rows, n, total, share: pct(n, total), also, tagged,
    archetypeMix, avgGravity, minGravity, maxGravity,
    withPrimaryCount: withPrimary.length, primaryFamilies, paletteFamilies, colorTotal, sharedHexes,
    withFontsCount: withFonts.length, sharedFonts, sharedTone,
    industries, rivals,
  };
}

// All sectors that have at least one brand, in taxonomy order, each with its
// detail rollup. A brand is filed under its primary sector (sectorsOf().primary)
// and listed as "also in" every further sector its industry text names.
// Brands whose industry maps to no sector are counted apart.
export function buildSectors(allBrands) {
  const by = {};
  const alsoBy = {};
  let unmapped = 0;
  let multi = 0;
  for (const b of allBrands) {
    const { primary, all } = sectorsOf(b);
    if (!primary) { unmapped++; continue; }
    (by[primary.slug] ||= []).push(b);
    if (all.length > 1) multi++;
    for (const t of all.slice(1)) (alsoBy[t.slug] ||= []).push(b);
  }
  const sectors = SECTORS
    .filter((s) => by[s.slug]?.length || alsoBy[s.slug]?.length)
    .map((s) => sectorDetail(s, by[s.slug] || [], allBrands, alsoBy[s.slug] || []));
  return { sectors, unmapped, multi, total: allBrands.length };
}

// The two counts a sector carries, worded the same on the hub, the sector
// page and the crawlable HTML: brands filed here as their primary sector, and
// brands carrying the tag in any position.
export function countLine(d) {
  return `${d.n} primary · ${d.tagged} tagged`;
}

// What the two counts mean, for the notes beside them.
export const COUNT_NOTE = "Primary: brands filed under the sector as their main home. Tagged: every brand whose recorded industry names the sector, in any position, so a multi-sector brand counts once in each sector it names.";

// The intro sentence for one sector, from computed facts only.
export function sectorIntro(d) {
  const top = d.archetypeMix[0];
  const tied = d.archetypeMix.filter((a) => top && a.count === top.count);
  const archBit = !top ? "" : tied.length > 1
    ? ` The most common primary archetypes are ${listJoin(tied.map((a) => a.name))}, with ${top.count} brand${top.count === 1 ? "" : "s"} each.`
    : ` The most common primary archetype is ${top.name} (${top.count} of ${d.n}).`;
  const grav = d.avgGravity !== null ? ` Their average Gravity Score is ${d.avgGravity} of 100, ranging from ${d.minGravity} to ${d.maxGravity}.` : "";
  const alsoBit = d.also.length
    ? ` ${d.also.length} more brand${d.also.length === 1 ? " is" : "s are"} tagged ${d.sector.name} as a further sector because ${d.also.length === 1 ? "its" : "their"} industry text names it; ${d.also.length === 1 ? "it is" : "they are"} listed apart and left out of the figures below.`
    : "";
  return `${d.n} of the ${d.total} brands in the BrandMD index have ${d.sector.name} as their primary sector, read from the industry each brand's record lists.${alsoBit}${archBit}${grav} Below: each brand's archetype and score, the shared color and type patterns, and a positioning line for each brand from its BrandMD record.`;
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
      `${total} brands in the BrandMD index grouped into ${sectorCount} sectors: archetype mix, Gravity Scores, color and type patterns for each.`,
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
        ? `${d.n} ${name} brands in the BrandMD index, ${listJoin(names)} among them: archetype mix, Gravity Scores, colors, type and positioning.`
        : `${name} in the BrandMD index: ${listJoin(d.rows.map((r) => r.name))}. Archetypes, Gravity Scores, colors, type and positioning.`,
      `${d.n} ${name} brands in the BrandMD index: archetype mix, Gravity Scores, colors, type and how each positions itself.`,
      `${d.n} ${name} brands: archetypes, Gravity Scores, colors and positioning.`,
    ], 154),
  };
}
