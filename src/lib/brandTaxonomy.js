// Brand taxonomy — one canonical vocabulary over the messy library labels.
//
// The public index stores archetype and industry as free text written at
// enrichment time, so the same idea arrives many ways ("Caregiver",
// "The Caregiver", "The Caretaker", "The Organizer (Caregiver × Creator
// hybrid)") and 85 brands carry 79 distinct industry strings. Research pages,
// filters, and the prerender all group through THIS file so a brand lands in
// the same archetype and sector everywhere it appears.
//
// Plain ESM: no JSX, no import.meta.env. Imported by the SPA and by
// scripts/prerender.mjs + scripts/prerender.d/*.mjs under node.
// Archetypes read in three levels (family → expression → blend), sectors as
// a primary home plus every sector the industry text names, and a second
// axis of business-model tags from literal terms only.
// Mapping never changes the stored record: the raw label stays on the row and
// is returned as `raw` so a page can show it next to the canonical name.

// ── Archetypes ─────────────────────────────────────────────────────────────

// The 12 Jungian brand archetypes, in the conventional wheel order.
export const ARCHETYPES = [
  { slug: "innocent", name: "The Innocent", motto: "Free to be you and me", desire: "safety and simple goodness" },
  { slug: "everyman", name: "The Everyman", motto: "All people are created equal", desire: "belonging" },
  { slug: "hero", name: "The Hero", motto: "Where there's a will, there's a way", desire: "proving worth through courage" },
  { slug: "outlaw", name: "The Outlaw", motto: "Rules are made to be broken", desire: "revolution against what isn't working" },
  { slug: "explorer", name: "The Explorer", motto: "Don't fence me in", desire: "freedom to discover" },
  { slug: "creator", name: "The Creator", motto: "If it can be imagined, it can be created", desire: "making things of enduring value" },
  { slug: "ruler", name: "The Ruler", motto: "Power isn't everything, it's the only thing", desire: "control and order" },
  { slug: "magician", name: "The Magician", motto: "I make things happen", desire: "transformation" },
  { slug: "lover", name: "The Lover", motto: "You're the only one", desire: "intimacy and pleasure" },
  { slug: "caregiver", name: "The Caregiver", motto: "Love your neighbor as yourself", desire: "protecting and caring for others" },
  { slug: "jester", name: "The Jester", motto: "You only live once", desire: "living in the moment with joy" },
  { slug: "sage", name: "The Sage", motto: "The truth will set you free", desire: "understanding" },
];

const ARCH_BY_SLUG = Object.fromEntries(ARCHETYPES.map((a) => [a.slug, a]));

// Alias words seen in the library (and common in archetype literature) that
// mean one of the 12. Keys are lower-case single words after "The " is
// stripped. "Rebel" and "Liberator" are standard names for the Outlaw;
// "Teacher" for the Sage; "Caretaker" for the Caregiver; "Regular Guy",
// "Everyperson" and "Enabler (Everyman)" for the Everyman; "Builder" for the
// Creator; "Champion" for the Hero.
const ALIASES = {
  innocent: "innocent",
  everyman: "everyman", everyperson: "everyman", everywoman: "everyman", "regular guy": "everyman", "regular person": "everyman", "guy next door": "everyman", orphan: "everyman",
  hero: "hero", champion: "hero", warrior: "hero",
  outlaw: "outlaw", rebel: "outlaw", liberator: "outlaw", revolutionary: "outlaw", maverick: "outlaw",
  explorer: "explorer", seeker: "explorer", wanderer: "explorer",
  creator: "creator", builder: "creator", artist: "creator", innovator: "creator",
  ruler: "ruler", sovereign: "ruler", leader: "ruler",
  magician: "magician", visionary: "magician", alchemist: "magician",
  lover: "lover",
  caregiver: "caregiver", caretaker: "caregiver", nurturer: "caregiver",
  jester: "jester", entertainer: "jester", trickster: "jester",
  sage: "sage", teacher: "sage", mentor: "sage", scholar: "sage", expert: "sage",
};

export function archetypeSlug(name) {
  return canonicalArchetype(name)?.slug || null;
}

export function archetypeBySlug(slug) {
  return ARCH_BY_SLUG[slug] || null;
}

function aliasIn(text) {
  const t = String(text || "").toLowerCase().replace(/^the\s+/, "").trim();
  if (!t) return null;
  if (ALIASES[t]) return ALIASES[t];
  // Multi-word aliases first ("regular guy"), then each word in order.
  for (const k of Object.keys(ALIASES)) if (k.includes(" ") && t.includes(k)) return ALIASES[k];
  for (const w of t.split(/[^a-z]+/)) if (ALIASES[w]) return ALIASES[w];
  return null;
}

// ── Archetypes in three levels ─────────────────────────────────────────────
// From broad to specific:
//   family      one of the 12 above. Filters, counts and family pages use it.
//   expression  an open-ended named sub-type that belongs to exactly ONE
//               family ("Rebel" is a way of being an Outlaw). Built from the
//               labels the library actually uses; add one to EXPRESSIONS when
//               a record introduces a new label.
//   blend       the brand's other archetypes (see archetypeOf).
//
// Expression identity: (family, slug). `slug` is unique within its family and
// is the URL segment (/archetypes/<family>/<slug>); `id` = "<family>-<slug>"
// is unique across the whole list. So one word can be two expressions:
// "Enabler" exists under the Everyman and under the Magician, and a record's
// label picks one by naming the family in brackets ("The Enabler (Magician)").
// A word that exists in several families with no family in its bracket stays
// unresolved rather than guessed.
//
// `mapped: true` marks a BrandMD judgment call: the record's word is not a
// standard name for that family, so placing it there is BrandMD's reading and
// pages show it as "Mapped by BrandMD". Plain synonyms (Rebel, Teacher,
// Caretaker, ...) are standard names in archetype literature and are not
// marked. Definitions are general brand-strategy descriptions, never claims
// about a particular brand.
export const EXPRESSIONS = [
  { slug: "rebel", name: "Rebel", family: "outlaw", mapped: false, aliases: ["Revolutionary", "Maverick"],
    definition: "Challenges the way its category has always worked and invites customers to side with it against the old way." },
  { slug: "liberator", name: "Liberator", family: "outlaw", mapped: true, aliases: [],
    definition: "Frees customers from a cost, gatekeeper or constraint that its category has imposed on them." },
  { slug: "teacher", name: "Teacher", family: "sage", mapped: false, aliases: ["Mentor"],
    definition: "Shares what it knows openly so its customers become more capable on their own." },
  { slug: "builder", name: "Builder", family: "creator", mapped: false, aliases: [],
    definition: "Gives people the tools and structure to make things themselves." },
  { slug: "caretaker", name: "Caretaker", family: "caregiver", mapped: false, aliases: ["Nurturer"],
    definition: "Looks after people's comfort and wellbeing with steady, attentive care." },
  { slug: "organizer", name: "Organizer", family: "caregiver", mapped: true, aliases: [],
    definition: "Keeps people's work and lives in order so that nothing important gets lost." },
  { slug: "everyperson", name: "Everyperson", family: "everyman", mapped: false, aliases: ["Everywoman", "Regular Guy", "Regular Person"],
    definition: "Speaks as one of the people it serves: plain, unpretentious and approachable." },
  { slug: "enabler", name: "Enabler", family: "everyman", mapped: true, aliases: [],
    definition: "Removes the friction that keeps ordinary people from doing something themselves." },
  { slug: "enabler", name: "Enabler", family: "magician", mapped: true, aliases: [],
    definition: "Makes complex work happen automatically, so customers get the result without the effort." },
  { slug: "rugged-explorer", name: "Rugged Explorer", family: "explorer", mapped: false, aliases: [],
    definition: "Equips people for hard use in demanding outdoor conditions, with gear built to last." },
  { slug: "champion", name: "Champion", family: "hero", mapped: true, aliases: [],
    definition: "Stands up for its customers and fights to help them win." },
].map((e) => ({ ...e, id: `${e.family}-${e.slug}` }));

const EXPR_BY_ID = Object.fromEntries(EXPRESSIONS.map((e) => [e.id, e]));

export function expressionBySlug(family, slug) {
  return EXPR_BY_ID[`${family}-${slug}`] || null;
}

export function expressionsOf(family) {
  return EXPRESSIONS.filter((e) => e.family === family);
}

const norm = (s) => String(s || "").toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, " ").trim();

// Every expression a phrase names (an ambiguous word like "Enabler" returns
// one per family).
function expressionsNamed(text) {
  const t = norm(text);
  if (!t) return [];
  return EXPRESSIONS.filter((e) => [e.name, ...e.aliases].some((n) => norm(n) === t));
}

function familyNamed(text) {
  const t = norm(text);
  return ARCH_BY_SLUG[t] ? t : null;
}

// Read one free-text archetype label.
//   parseLabel("The Organizer (Caregiver × Creator hybrid)")
//     → { family: "caregiver", expression: <caregiver-organizer>, others: ["creator"], raw }
// Head = text before any bracket; bracket = qualifier. Reading order:
//  1. the head names a family outright ("The Outlaw", "The Regular Guy /
//     Everyman") → that family, no expression (the pure family);
//  2. the head names an expression; when the word exists in several families
//     the family named in the bracket picks one ("Enabler (Magician)");
//  3. otherwise the first family any head word or bracket part names.
// A bracket that only describes ("anti-cheap, anti-compromise") adds nothing.
// `others` = further families named in a hybrid bracket, in order.
function parseLabel(raw) {
  const label = String(raw || "").trim();
  if (!label) return null;
  const head = label.replace(/\(.*$/, "").trim();
  const paren = (label.match(/\(([^)]*)\)/) || [])[1] || "";
  const bracketFamilies = paren
    .split(/\s*(?:×|\bx\b|\+|\/|&|\band\b|,)\s*/i)
    .map((p) => aliasIn(p.replace(/\bhybrid\b/i, "")))
    .filter(Boolean);
  const headParts = head.split(/\s*\/\s*/).filter(Boolean);

  let family = null;
  let expression = null;
  for (const p of headParts) { const f = familyNamed(p); if (f) { family = f; break; } }
  if (!family) {
    for (const p of headParts) {
      const cands = expressionsNamed(p);
      if (!cands.length) continue;
      const pick = cands.length === 1 ? cands[0] : cands.find((e) => bracketFamilies.includes(e.family)) || null;
      if (pick) { family = pick.family; expression = pick; break; }
    }
  }
  if (!family) family = aliasIn(head) || bracketFamilies[0] || null;
  if (!family) return null;
  const others = [...new Set(bracketFamilies.filter((f) => f !== family))];
  return { family, expression, others, raw: label };
}

const famRef = (slug) => ({ slug, name: ARCH_BY_SLUG[slug].name });
const exprRef = (e) => (e ? { slug: e.slug, id: e.id, name: e.name, definition: e.definition } : null);

// The full three-level reading of a library row.
//   archetypeOf(klarna) → {
//     family: { slug: "outlaw", name: "The Outlaw" },
//     expression: { slug: "liberator", id: "outlaw-liberator", name: "Liberator", definition },
//     blend: [{ family: { slug: "magician", name: "The Magician" }, expression: null, source: "record" }],
//     raw: "The Liberator", mapped: true,
//     mappedNote: 'Mapped by BrandMD from the record\'s label "The Liberator"',
//   }
// Blend order: the record's own secondary_archetype first (source "record",
// read with the same parser, so bracketed notes drop away), then further
// archetypes named inside a hybrid label (source "label"). No duplicates and
// never the primary family. `mapped` is true when any part of the reading
// rests on a BrandMD judgment call, and mappedNote quotes the exact label(s).
export function archetypeOf(brand) {
  const p = parseLabel(brand?.archetype);
  if (!p) return null;
  const blend = [];
  const seen = new Set([p.family]);
  const mappedLabels = [];
  if (p.expression && EXPR_BY_ID[p.expression.id].mapped) mappedLabels.push(p.raw);
  const s = parseLabel(brand?.secondary_archetype);
  if (s && !seen.has(s.family)) {
    seen.add(s.family);
    blend.push({ family: famRef(s.family), expression: exprRef(s.expression), source: "record" });
    if (s.expression && EXPR_BY_ID[s.expression.id].mapped) mappedLabels.push(s.raw);
  }
  for (const f of p.others) {
    if (seen.has(f)) continue;
    seen.add(f);
    blend.push({ family: famRef(f), expression: null, source: "label" });
  }
  const mapped = mappedLabels.length > 0;
  return {
    family: famRef(p.family),
    expression: exprRef(p.expression),
    blend,
    raw: p.raw,
    mapped,
    mappedNote: mapped
      ? `Mapped by BrandMD from the record's label${mappedLabels.length > 1 ? "s" : ""} ${mappedLabels.map((l) => `"${l}"`).join(" and ")}`
      : null,
  };
}

// Short display names: "Outlaw · Rebel", or "Outlaw" for a pure family.
export const shortArchetypeName = (name) => String(name || "").replace(/^The /, "");

export function archetypeLabel(a) {
  if (!a) return "";
  const fam = shortArchetypeName(a.family.name);
  return a.expression ? `${fam} · ${a.expression.name}` : fam;
}

// Brands per expression id, counted from each record's primary label and its
// secondary_archetype label (a brand counts once per expression).
export function expressionCounts(brands) {
  const counts = {};
  for (const b of brands || []) {
    const a = archetypeOf(b);
    if (!a) continue;
    const ids = new Set();
    if (a.expression) ids.add(a.expression.id);
    for (const x of a.blend) if (x.expression) ids.add(x.expression.id);
    for (const id of ids) counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

// An expression gets its own page only when 2+ brands share it.
// EXPRESSION_PAGES_LIVE stays false until /archetypes/:family/:expression
// ships, so no page links to a URL that does not exist yet; flip it then and
// every qualifying link turns on at once.
export const EXPRESSION_PAGES_LIVE = false;
export const EXPRESSION_PAGE_MIN = 2;

export function expressionHref(familySlug, expression, counts) {
  if (!EXPRESSION_PAGES_LIVE || !expression || !counts) return null;
  const id = expression.id || `${familySlug}-${expression.slug}`;
  return (counts[id] || 0) >= EXPRESSION_PAGE_MIN ? `/archetypes/${familySlug}/${expression.slug}` : null;
}

// canonicalArchetype("The Organizer (Caregiver × Creator hybrid)")
//   → { slug: "caregiver", name: "The Caregiver", secondary: { slug: "creator", name: "The Creator" }, raw }
// Kept for existing callers; built on the same parser as archetypeOf, so a
// label lands in the same family everywhere. `secondary` = the first other
// family named inside the label itself.
export function canonicalArchetype(raw) {
  const p = parseLabel(raw);
  if (!p) return null;
  const a = ARCH_BY_SLUG[p.family];
  return {
    slug: a.slug,
    name: a.name,
    secondary: p.others.length ? famRef(p.others[0]) : null,
    raw: p.raw,
  };
}

// The archetype pair for a library row (existing callers): primary = the
// family; secondary = the first blend entry, i.e. the record's own
// secondary_archetype when it names another family, else the hybrid label's
// second archetype.
export function brandArchetypes(brand) {
  const primary = canonicalArchetype(brand?.archetype);
  if (!primary) return { primary: null, secondary: null };
  const first = archetypeOf(brand).blend[0];
  return { primary, secondary: first ? { slug: first.family.slug, name: first.family.name } : null };
}

// ── Sectors ────────────────────────────────────────────────────────────────

export const SECTORS = [
  { slug: "technology", name: "Technology & AI" },
  { slug: "software", name: "Business Software" },
  { slug: "finance", name: "Finance & Payments" },
  { slug: "retail", name: "Retail & Consumer Goods" },
  { slug: "apparel", name: "Apparel & Footwear" },
  { slug: "luxury", name: "Luxury Goods" },
  { slug: "automotive", name: "Automotive" },
  { slug: "food-beverage", name: "Food & Beverage" },
  { slug: "health", name: "Health & Wellness" },
  { slug: "media", name: "Media & Entertainment" },
  { slug: "travel", name: "Travel & Hospitality" },
  { slug: "energy", name: "Energy" },
];

const SECTOR_BY_SLUG = Object.fromEntries(SECTORS.map((s) => [s.slug, s]));

export function sectorBySlug(slug) {
  return SECTOR_BY_SLUG[slug] || null;
}

// Exact industry strings from the index (2026-11-04 snapshot of 85 brands).
// Checked first so every current brand has a deliberate home.
const EXACT = {
  "Artificial Intelligence": "technology",
  "Artificial Intelligence Safety & Research / AI Infrastructure": "technology",
  "Consumer Electronics": "technology",
  "Consumer Technology": "technology",
  "Technology": "technology",
  "Technology / Social Media": "technology",
  "EdTech / Consumer Language Learning": "technology",
  "E-commerce & Cloud": "retail",
  "Commerce Infrastructure & SaaS": "software",
  "Athletic Apparel": "apparel",
  "Sportswear": "apparel",
  "Outdoor Apparel": "apparel",
  "Direct-to-Consumer Athletic Apparel & Fitness Lifestyle": "apparel",
  "Direct-to-Consumer Sustainable Footwear & Apparel": "apparel",
  "Premium Athletic & Lifestyle Apparel (DTC + Retail, B2C)": "apparel",
  "Streetwear / Luxury Fashion / Cultural Commerce": "apparel",
  "Luxury Fashion": "luxury",
  "Luxury Watches": "luxury",
  "Automotive": "automotive",
  "Electric Vehicles": "automotive",
  "Luxury Automotive": "automotive",
  "Ultra-Luxury Automotive & Lifestyle": "automotive",
  "Ultra-Premium Automotive Manufacturing & Lifestyle": "automotive",
  "Powersports & Lifestyle — Premium Motorcycles, Apparel, and Accessories": "automotive",
  "Toys & Entertainment": "media",
  "Entertainment": "media",
  "Entertainment Streaming": "media",
  "Music & Audio Streaming": "media",
  "Mass-Market Home Furnishings & Lifestyle Retail": "retail",
  "Premium Outdoor & Lifestyle Hard Goods (Coolers, Drinkware, Gear)": "retail",
  "Direct-to-Consumer Beauty & Skincare": "retail",
  "Direct-to-Consumer Eyewear & Vision Care": "retail",
  "Direct-to-Consumer Sleep Products / Mattress & Bedding Retail": "retail",
  "Specialty Grocery / Specialty Food Retail": "retail",
  "Retail": "retail",
  "Healthcare Distribution": "health",
  "Consumer Mental Health & Wellness Technology (B2C SaaS / Digital Health)": "health",
  "Digital Mental Wellness / Consumer Health Technology": "health",
};

// Keyword fallback for industries added after the snapshot. Order matters:
// the first rule whose pattern matches wins.
const RULES = [
  [/energy drink|beverage|food|restaurant|fast[- ]casual|coffee|dairy|grocery|snack|brew/i, "food-beverage"],
  [/fintech|financ|bank|payment|brokerage|insur|lending|bnpl|neobank|credit/i, "finance"],
  [/health|pharma|medic|wellness|mental|clinic/i, "health"],
  [/airline|aviation|travel|hospitality|hotel|cruise/i, "travel"],
  [/energy|oil|gas|utilit|petrol/i, "energy"],
  [/automotive|vehicle|motorcycle|car maker|mobility/i, "automotive"],
  [/luxury (fashion|goods|watch|jewel)|watch|jewel|haute/i, "luxury"],
  [/apparel|footwear|sportswear|streetwear|fashion|clothing/i, "apparel"],
  [/saas|software|b2b|crm|cloud platform|developer|productivity|collaboration|work management/i, "software"],
  [/entertainment|streaming|media|music|gaming|film|publishing/i, "media"],
  [/retail|e-?commerce|dtc|direct-to-consumer|furnish|beauty|cosmetic|consumer goods|cpg|\btoys?\b/i, "retail"],
  [/artificial intelligence|\bai\b|technology|electronics|social|internet|edtech|\bcloud\b/i, "technology"],
];

// sectorOf("B2B SaaS — Work Management & Workflow Automation") → { slug: "software", name: "Business Software" }
export function sectorOf(industry) {
  const raw = String(industry || "").trim();
  if (!raw) return null;
  let slug = EXACT[raw];
  if (!slug) for (const [re, s] of RULES) if (re.test(raw)) { slug = s; break; }
  if (!slug) return null;
  const s = SECTOR_BY_SLUG[slug];
  return { slug: s.slug, name: s.name };
}

export function sectorSlug(industry) {
  return sectorOf(industry)?.slug || null;
}

// ── Sector tags (multi-sector) ─────────────────────────────────────────────
// sectorOf gives a brand ONE home (pages, counts). sectorsOf adds every other
// sector the record's own industry string names: the string is split into
// parts ("E-commerce & Cloud" → "E-commerce", "Cloud") and each part is read
// with the same keyword RULES. Conservative by design:
//  - a part that only names a business model or channel (B2B, B2C, SaaS,
//    UCaaS, DTC, Direct-to-Consumer, Enterprise, SMB-focused) adds nothing;
//  - a bare "Retail" inside brackets is a sales channel ("DTC + Retail, B2C"),
//    not a sector, and adds nothing;
//  - a part no rule matches adds nothing. Nothing is inferred beyond the text.
// The primary (sectorOf) is always first in `all`.
const MODEL_ONLY = /\b(?:b2b|b2c|dtc|saas|ucaas|enterprise|smb-focused)\b|direct-to-consumer/gi;
const PART_SPLIT = /\s*(?:&|\/|,|\band\b|—|\+)\s*/i;

function partsOf(industry) {
  const raw = String(industry || "");
  const inside = [...raw.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const outside = raw.replace(/\([^)]*\)/g, " ");
  const read = (txt, bracketed) => txt.split(PART_SPLIT).map((p) => ({ text: p.trim(), bracketed })).filter((p) => p.text);
  return [...read(outside, false), ...inside.flatMap((t) => read(t, true))];
}

function sectorOfPart({ text, bracketed }) {
  const t = text.replace(MODEL_ONLY, " ").replace(/\s+/g, " ").trim();
  if (!/[a-z]/i.test(t)) return null;
  if (bracketed && /^retail$/i.test(t)) return null;
  for (const [re, s] of RULES) if (re.test(t)) return s;
  return null;
}

// sectorsOf(amazon) → { primary: Retail & Consumer Goods, all: [Retail & Consumer Goods, Technology & AI] }
// Accepts a library row or an industry string.
export function sectorsOf(brandOrIndustry) {
  const industry = typeof brandOrIndustry === "string" ? brandOrIndustry : brandOrIndustry?.industry;
  const primary = sectorOf(industry);
  if (!primary) return { primary: null, all: [] };
  const slugs = [primary.slug];
  for (const part of partsOf(industry)) {
    const s = sectorOfPart(part);
    if (s && !slugs.includes(s)) slugs.push(s);
  }
  return { primary, all: slugs.map((s) => ({ slug: s, name: SECTOR_BY_SLUG[s].name })) };
}

// Sector pages exist (/sectors/:slug).
export const sectorHref = (slug) => (SECTOR_BY_SLUG[slug] ? `/sectors/${slug}` : null);

// ── Business-model tags (second axis: HOW a brand sells, not what) ─────────
// Tagged only from LITERAL terms in the record's industry string; most brands
// carry none, and that is correct. `terms` lists every phrase that triggers a
// tag, so each tag can name its source. Consumer subscription and marketplace
// are left out: no record in the index uses either word yet.
export const MODELS = [
  {
    slug: "dtc", name: "Direct-to-consumer",
    definition: "Sells straight to the end customer through its own channels rather than only through retailers or resellers.",
    terms: ["DTC", "Direct-to-Consumer"],
    test: /\bDTC\b|\bdirect-to-consumer\b/i,
  },
  {
    slug: "b2b-saas", name: "B2B SaaS",
    definition: "Sells software to businesses as a subscription service delivered over the internet.",
    terms: ["B2B SaaS", "Enterprise B2B SaaS", "SaaS", "UCaaS"],
    // Any SaaS/UCaaS except one the record itself calls consumer ("B2C SaaS").
    test: /\bUCaaS\b|(?<!\bB2C\s)\bSaaS\b/i,
  },
  {
    slug: "fintech", name: "Fintech",
    definition: "Delivers financial services such as banking, payments, lending or investing primarily through software.",
    terms: ["Fintech", "FinTech", "Financial Technology", "Neobank", "BNPL"],
    test: /\bfintech\b|\bfinancial technology\b|\bneobank\b|\bBNPL\b/i,
  },
  {
    slug: "platform", name: "Platform & infrastructure",
    definition: "Provides the underlying platform or infrastructure that other businesses and developers build on.",
    terms: ["Infrastructure", "Cloud Platform", "Integration Platform", "Application Platform", "Data Platforms"],
    test: /\binfrastructure\b|\b(?:cloud|integration|application|data) platforms?\b/i,
  },
];

const MODEL_BY_SLUG = Object.fromEntries(MODELS.map((m) => [m.slug, m]));

export function modelBySlug(slug) {
  const m = MODEL_BY_SLUG[slug];
  return m ? { slug: m.slug, name: m.name, definition: m.definition, terms: m.terms } : null;
}

// modelsOf(klarna) → [{ slug: "fintech", name: "Fintech", term: "BNPL" }]
// `term` is the exact text in the record that triggered the tag.
export function modelsOf(brandOrIndustry) {
  const industry = String((typeof brandOrIndustry === "string" ? brandOrIndustry : brandOrIndustry?.industry) || "");
  const out = [];
  for (const m of MODELS) {
    const hit = industry.match(m.test);
    if (hit) out.push({ slug: m.slug, name: m.name, term: hit[0] });
  }
  return out;
}

// Flip when /models/:slug ships, so no page links to a URL that does not
// exist yet; until then model tags render as plain text.
export const MODEL_PAGES_LIVE = false;
export const modelHref = (slug) => (MODEL_PAGES_LIVE && MODEL_BY_SLUG[slug] ? `/models/${slug}` : null);

// ── Rivals ─────────────────────────────────────────────────────────────────
// Curated pairs of brands that are BOTH in the index and in the same sector.
// The basis is a plain category statement drawn from the two records'
// industry fields: what they both sell or do. Never a feud, never a ranking.
export const RIVALS = [
  ["nike", "adidas", "both sell athletic footwear and sportswear"],
  ["lululemon", "gymshark", "both sell athletic and fitness apparel"],
  ["visa", "mastercard", "both are payment networks in financial services"],
  ["brex", "ramp", "both sell corporate spend management software"],
  ["delta-air-lines", "united-airlines", "both are commercial airlines"],
  ["exxonmobil", "chevron", "both are energy companies"],
  ["bmw", "mercedes-benz", "both are luxury automakers"],
  ["ferrari", "porsche-united-states", "both are in ultra-luxury and ultra-premium automotive"],
  ["apple", "samsung", "both make consumer electronics"],
  ["openai", "anthropic", "both build artificial intelligence"],
  ["headspace", "calm", "both make consumer mental wellness apps"],
  ["asana", "monday-com", "both sell work management software"],
  ["louis-vuitton", "gucci", "both are luxury fashion houses"],
  ["chipotle-mexican-grill", "sweetgreen", "both are fast-casual restaurant chains"],
  ["hubspot", "salesforce", "both sell CRM software"],
  ["netflix", "disney", "both are in entertainment"],
  ["walmart", "amazon", "both are in retail and e-commerce"],
  ["slack", "zoom", "both sell workplace collaboration software"],
  ["figma", "canva", "both sell design software"],
  ["unitedhealth-group", "cvs-health", "both are healthcare companies"],
];

export function rivalsOf(slug) {
  return RIVALS
    .filter(([a, b]) => a === slug || b === slug)
    .map(([a, b, basis]) => ({ slug: a === slug ? b : a, basis }));
}

export function rivalPairSlug(a, b) {
  return [a, b].sort().join("-vs-");
}
