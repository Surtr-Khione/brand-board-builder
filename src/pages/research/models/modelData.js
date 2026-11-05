// Business-model research: every number on /models and /models/:slug is
// computed here, from the library rows only, so the SPA pages and the
// prerendered crawlable bodies (scripts/prerender.d/models.mjs) can never
// disagree.
//
// Plain ESM: no JSX, no import.meta.env (imported under node by the prerender).
//
// Where the tag comes from: a business-model tag is BrandMD's reading of the
// brand's recorded industry line (modelsOf in src/lib/brandTaxonomy.js). A
// brand is tagged only when that line literally contains one of the model's
// terms; the term that matched is kept and shown. Most brands carry no tag,
// and none is guessed. The model definitions are BrandMD's own wording.
import { MODELS, MODEL_PAGE_MIN, modelsOf, archetypeOf, sectorsOf, ARCHETYPES, SECTORS, expressionCounts } from "../../../lib/brandTaxonomy.js";
import { computeGravityScore } from "../../../lib/gravityScore.js";
import { COLOR_FAMILIES, familyOf } from "../../../lib/colorFamilies.js";

// A model gets its own page only when two or more brands carry its tag. The
// threshold lives in the taxonomy so modelHref (brand and battle pages) and
// these pages agree on which model pages exist.
export { MODEL_PAGE_MIN };

const present = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const hexOk = (h) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(h || "").trim());

function normHex(h) {
  let s = String(h).trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return `#${s.toUpperCase()}`;
}

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

export function plural(n, word, many = `${word}s`) { return `${n} ${n === 1 ? word : many}`; }

export function listJoin(items) {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a.join("");
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
}

const quoteList = (terms, joiner = "or") => {
  const q = terms.map((t) => `"${t}"`);
  if (q.length <= 1) return q.join("");
  return `${q.slice(0, -1).join(", ")} ${joiner} ${q[q.length - 1]}`;
};

function asList(v) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.text || x?.name || "")).map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

// "UHC Sans (proprietary) / Proxima Nova" → ["UHC Sans", "Proxima Nova"]
function fontNames(raw) {
  return String(raw || "")
    .replace(/\([^)]*\)/g, "")
    .split(/\s*(?:\/|;|,)\s*/)
    .map((s) => s.replace(/^fallback:\s*/i, "").trim())
    .filter((s) => s && s.length < 60);
}

// Splits the record's industry line around the text that triggered the tag,
// so the page can show exactly which words the tag was read from.
export function industryParts(industry, term) {
  const s = String(industry || "");
  const i = term ? s.indexOf(term) : -1;
  if (i < 0) return { before: s, term: "", after: "" };
  return { before: s.slice(0, i), term, after: s.slice(i + term.length) };
}

// ── Per-brand row ─────────────────────────────────────────────────────────

export function brandRow(b) {
  const arch = archetypeOf(b);
  let gravity = null;
  try { gravity = computeGravityScore(b).score; } catch { gravity = null; }
  const colors = [["Primary", b.primary_color], ["Secondary", b.secondary_color], ["Accent", b.accent_color]]
    .filter(([, h]) => hexOk(h))
    .map(([role, h]) => ({ role, hex: normHex(h) }));
  const fonts = [["Display", b.primary_font], ["Body", b.body_font], ["Accent", b.accent_font]]
    .filter(([, f]) => present(f))
    .map(([role, f]) => ({ role, name: String(f).trim() }));
  const bd = b.brand_data || {};
  const tone = asList(b.tone_attributes).length ? asList(b.tone_attributes) : asList(bd.toneAttributes);
  return {
    slug: b.slug,
    name: b.brand_name,
    tagline: present(b.tagline) ? String(b.tagline).trim() : "",
    industry: present(b.industry) ? String(b.industry).trim() : "",
    logo: present(b.logo_url) ? String(b.logo_url) : "",
    archetype: arch, // { family, expression, blend, raw, mapped, mappedNote } or null
    sectors: sectorsOf(b).all,
    models: modelsOf(b),
    gravity: Number.isFinite(gravity) ? gravity : null,
    colors,
    fonts,
    tone,
  };
}

// ── One model's rollup ────────────────────────────────────────────────────

export function modelDetail(model, rows, total, indexFamilies) {
  const n = rows.length;
  const sorted = [...rows].sort((a, b) => (b.gravity ?? -1) - (a.gravity ?? -1) || a.name.localeCompare(b.name));
  const brands = sorted.map((r) => ({ ...r, term: r.models.find((m) => m.slug === model.slug)?.term || "" }));
  const termsUsed = [...new Set(brands.map((r) => r.term).filter(Boolean))];
  // Business words that satisfied the model's second condition when they sit
  // outside the matched term (Zoom: "Enterprise" next to "UCaaS").
  const buyersUsed = [...new Set(brands.map((r) => r.models.find((m) => m.slug === model.slug)?.buyer).filter(Boolean))];

  // Archetype family mix: each brand once, under its main family.
  const famCount = {};
  const famBrands = {};
  for (const r of brands) if (r.archetype) {
    const s = r.archetype.family.slug;
    famCount[s] = (famCount[s] || 0) + 1;
    (famBrands[s] ||= []).push({ slug: r.slug, name: r.name });
  }
  const archetypeMix = ARCHETYPES.filter((a) => famCount[a.slug])
    .map((a) => ({
      slug: a.slug, name: a.name, count: famCount[a.slug], share: pct(famCount[a.slug], n),
      indexCount: indexFamilies[a.slug] || 0, indexShare: pct(indexFamilies[a.slug] || 0, total),
      brands: famBrands[a.slug],
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const mapped = brands.filter((r) => r.archetype?.mapped).map((r) => ({ slug: r.slug, name: r.name, note: r.archetype.mappedNote }));
  const withArchetype = brands.filter((r) => r.archetype).length;

  // Sector mix: every sector tag a brand carries (a brand with two sector
  // tags counts in both), plus how many are multi-sector.
  const secCount = {};
  const secBrands = {};
  for (const r of brands) for (const s of r.sectors) {
    secCount[s.slug] = (secCount[s.slug] || 0) + 1;
    (secBrands[s.slug] ||= []).push({ slug: r.slug, name: r.name });
  }
  const sectorMix = SECTORS.filter((s) => secCount[s.slug])
    .map((s) => ({ slug: s.slug, name: s.name, count: secCount[s.slug], share: pct(secCount[s.slug], n), brands: secBrands[s.slug] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const multiSector = brands.filter((r) => r.sectors.length > 1).length;
  const noSector = brands.filter((r) => !r.sectors.length).length;

  // Gravity
  const scored = brands.filter((r) => r.gravity !== null);
  const avgGravity = scored.length ? Math.round(scored.reduce((s, r) => s + r.gravity, 0) / scored.length) : null;
  const minGravity = scored.length ? Math.min(...scored.map((r) => r.gravity)) : null;
  const maxGravity = scored.length ? Math.max(...scored.map((r) => r.gravity)) : null;
  const minBrands = scored.filter((r) => r.gravity === minGravity).map((r) => r.name);
  const maxBrands = scored.filter((r) => r.gravity === maxGravity).map((r) => r.name);

  // Color families of the recorded primary color.
  const withPrimary = brands.filter((r) => r.colors.some((c) => c.role === "Primary"));
  const pf = {};
  const pfBrands = {};
  for (const r of withPrimary) {
    const f = familyOf(r.colors.find((c) => c.role === "Primary").hex);
    if (!f) continue;
    pf[f.slug] = (pf[f.slug] || 0) + 1;
    (pfBrands[f.slug] ||= []).push(r.name);
  }
  const primaryFamilies = COLOR_FAMILIES.filter((f) => pf[f.slug])
    .map((f) => ({ ...f, count: pf[f.slug], brands: pfBrands[f.slug] }))
    .sort((a, b) => b.count - a.count);

  // Every recorded color (all roles) by family.
  const allFam = {};
  let colorTotal = 0;
  for (const r of brands) for (const c of r.colors) { const f = familyOf(c.hex); if (f) { allFam[f.slug] = (allFam[f.slug] || 0) + 1; colorTotal++; } }
  const paletteFamilies = COLOR_FAMILIES.filter((f) => allFam[f.slug]).map((f) => ({ ...f, count: allFam[f.slug] })).sort((a, b) => b.count - a.count);

  // Exact hex values recorded by two or more of these brands (pure white and
  // black left out: they are page defaults, not a choice of hue).
  const hexBrands = {};
  for (const r of brands) for (const h of new Set(r.colors.map((c) => c.hex))) (hexBrands[h] ||= []).push(r.name);
  const sharedHexes = Object.entries(hexBrands)
    .filter(([h, v]) => v.length > 1 && h !== "#FFFFFF" && h !== "#000000")
    .map(([hex, who]) => ({ hex, brands: who }))
    .sort((a, b) => b.brands.length - a.brands.length);

  // Typefaces named in any role, and those named by two or more brands.
  const withFonts = brands.filter((r) => r.fonts.length);
  const faceBrands = {};
  const faceLabel = {};
  for (const r of withFonts) {
    const names = new Set(r.fonts.flatMap((f) => fontNames(f.name)));
    for (const name of names) {
      const k = name.toLowerCase();
      (faceBrands[k] ||= []).push(r.name);
      faceLabel[k] ||= name;
    }
  }
  const sharedFonts = Object.entries(faceBrands).filter(([, v]) => v.length > 1).map(([k, who]) => ({ name: faceLabel[k], brands: who }));

  // Tone words (three words or fewer) recorded by two or more of these brands.
  const toneBrands = {};
  const toneLabel = {};
  for (const r of brands) {
    for (const t of new Set(r.tone.filter((x) => x.split(/\s+/).length <= 3).map((x) => x.toLowerCase()))) {
      (toneBrands[t] ||= []).push(r.name);
      toneLabel[t] ||= r.tone.find((x) => x.toLowerCase() === t);
    }
  }
  const sharedTone = Object.entries(toneBrands).filter(([, v]) => v.length > 1).map(([k, who]) => ({ word: toneLabel[k], brands: who })).sort((a, b) => b.brands.length - a.brands.length || a.word.localeCompare(b.word));
  const withTone = brands.filter((r) => r.tone.length).length;

  // Brands here that also carry another model tag.
  const alsoTagged = brands
    .map((r) => ({ slug: r.slug, name: r.name, others: r.models.filter((m) => m.slug !== model.slug) }))
    .filter((r) => r.others.length);

  return {
    model, n, total, share: pct(n, total), brands, termsUsed, buyersUsed, hasPage: n >= MODEL_PAGE_MIN,
    archetypeMix, mapped, withArchetype,
    sectorMix, multiSector, noSector,
    avgGravity, minGravity, maxGravity, minBrands, maxBrands, scoredCount: scored.length,
    withPrimaryCount: withPrimary.length, primaryFamilies, paletteFamilies, colorTotal, sharedHexes,
    withFontsCount: withFonts.length, sharedFonts, withTone, sharedTone,
    alsoTagged,
  };
}

// Every model in taxonomy order with its rollup, plus index-wide counts.
export function buildModels(allBrands) {
  const brands = Array.isArray(allBrands) ? allBrands : [];
  const total = brands.length;
  const rows = brands.map(brandRow);
  const indexFamilies = {};
  for (const r of rows) if (r.archetype) indexFamilies[r.archetype.family.slug] = (indexFamilies[r.archetype.family.slug] || 0) + 1;
  const models = MODELS.map((m) => {
    const tagged = rows.filter((r) => r.models.some((x) => x.slug === m.slug));
    return modelDetail({ slug: m.slug, name: m.name, definition: m.definition, terms: m.terms, rule: m.rule || null }, tagged, total, indexFamilies);
  });
  const taggedCount = rows.filter((r) => r.models.length).length;
  const multiModel = rows.filter((r) => r.models.length > 1).map((r) => ({ slug: r.slug, name: r.name, models: r.models }));
  return { models, total, taggedCount, untagged: total - taggedCount, multiModel, exprCounts: expressionCounts(brands) };
}

export const modelHrefOf = (d) => (d && d.hasPage ? `/models/${d.model.slug}` : null);

// ── Copy (shared by the SPA and the prerender) ───────────────────────────

export const GRAVITY_NOTE = "Gravity Score: how much of a coherent, documented identity is on record for a brand in the BrandMD index, out of 100. It measures the record, not the business.";

// Which of the model's terms actually occur in these records.
export function termsNote(d) {
  const buyers = d.buyersUsed && d.buyersUsed.length ? `, plus ${quoteList(d.buyersUsed, "and")} elsewhere in the same line` : "";
  return `Words found in these ${d.n} records' industry lines: ${quoteList(d.termsUsed, "and")}${buyers}. Nothing else about a brand is read to apply the tag, and nothing is guessed.`;
}

// How a model's tag is applied, as one plain statement: the literal terms,
// plus the model's extra condition when it has one (B2B SaaS needs a business
// buyer named in the same line and leaves out "B2C SaaS").
export function modelRule(model) {
  return `Tagged when the industry line says ${quoteList(model.terms)}.${model.rule ? ` ${model.rule}` : ""}`;
}

// The model name inside a sentence: "fintech brands", "B2B SaaS brands".
export const inlineName = (name) => (/^[A-Z][a-z]/.test(name) ? name[0].toLowerCase() + name.slice(1) : name);

export const baseLine = (d) => `across the ${plural(d.n, "brand")} tagged ${d.model.name} in the BrandMD index`;

export function hubIntro(b) {
  return `How a brand sells is a second axis next to what it sells. ${b.taggedCount} of the ${b.total} brands in the BrandMD index carry a business-model tag, read from the industry line each brand's record lists: a tag is applied only when that line names the model in so many words. The other ${b.untagged} records name no model, so they carry no tag; none is guessed. A brand can carry more than one tag.`;
}

export function modelIntro(d) {
  const top = d.archetypeMix[0];
  const tied = d.archetypeMix.filter((a) => top && a.count === top.count);
  const archBit = !top ? "" : tied.length > 1
    ? ` The most common archetype families among them are ${listJoin(tied.map((a) => a.name))}, with ${plural(top.count, "brand")} each.`
    : ` The most common archetype family among them is ${top.name} (${top.count} of ${d.n}).`;
  const grav = d.avgGravity !== null ? ` Their Gravity Scores run from ${d.minGravity} to ${d.maxGravity}, averaging ${d.avgGravity} of 100.` : "";
  return `${d.n} of the ${d.total} brands in the BrandMD index are tagged ${d.model.name}. The tag comes from each brand's recorded industry line, which has to contain ${quoteList(d.model.terms)}.${d.model.rule ? ` ${d.model.rule}` : ""}${archBit}${grav} Below: the brands, the archetype and sector mix, and the colors, type and tone they share, all counted ${baseLine(d)}.`;
}

function titleCase(name) {
  return String(name).split(" ").map((w) => w.split("-").map((p, i) => (/^[a-z]/.test(p) && !(i > 0 && /^(to|and|of)$/.test(p)) ? p[0].toUpperCase() + p.slice(1) : p)).join("-")).join(" ");
}

function fit(options, max) {
  return options.find((o) => o.length <= max) || options[options.length - 1].slice(0, max);
}

export function hubMeta(b) {
  const names = b.models.filter((d) => d.n).map((d) => d.model.name);
  return {
    title: fit(["Brand Business Models: SaaS, DTC, Fintech | BrandMD", "Brand Business Models | BrandMD"], 59),
    description: fit([
      `${b.taggedCount} of ${b.total} brands in the BrandMD index tagged by business model (${listJoin(names)}) from their recorded industry line.`,
      `${b.taggedCount} brands in the BrandMD index tagged by business model from their recorded industry line: archetypes, sectors and colors.`,
      `Brands in the BrandMD index tagged by business model, from their recorded industry line.`,
    ], 154),
  };
}

export function modelMeta(d) {
  const name = titleCase(d.model.name);
  const names = d.brands.slice(0, 3).map((r) => r.name);
  return {
    title: fit([
      `${name} Brands: Archetypes & Colors | BrandMD`,
      `${name} Brands | BrandMD`,
      `${name} | BrandMD`,
    ], 59),
    description: fit([
      `${d.n} ${inlineName(d.model.name)} brands in the BrandMD index, ${listJoin(names)} among them: archetype mix, sectors, colors and Gravity range.`,
      `${d.n} ${inlineName(d.model.name)} brands in the BrandMD index: archetype mix, sectors, colors, type and Gravity range.`,
      `${d.n} ${inlineName(d.model.name)} brands: archetypes, sectors, colors and Gravity.`,
    ], 154),
  };
}
