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

// canonicalArchetype("The Organizer (Caregiver × Creator hybrid)")
//   → { slug: "caregiver", name: "The Caregiver", secondary: { slug: "creator", name: "The Creator" }, raw }
// Reading order: the bracketed qualifier names the real archetype(s) when the
// label is an invented one ("The Enabler (Magician)"); otherwise the head word.
// A hybrid's first named archetype is primary, the second is `secondary`.
export function canonicalArchetype(raw) {
  const label = String(raw || "").trim();
  if (!label) return null;
  const head = label.replace(/\(.*$/, "").trim();
  const paren = (label.match(/\(([^)]*)\)/) || [])[1] || "";
  const hybridParts = paren ? paren.split(/\s*(?:×|\bx\b|\+|\/|&|\band\b|,)\s*/i).filter(Boolean) : [];

  let primary = null;
  let secondary = null;
  if (hybridParts.length) {
    const named = hybridParts.map(aliasIn).filter(Boolean);
    if (named.length) {
      primary = named[0];
      secondary = named.find((s) => s !== primary) || null;
    }
  }
  if (!primary) primary = aliasIn(head);
  if (!primary) {
    // Last resort: any alias word anywhere in the label ("Champion (…)").
    primary = aliasIn(label);
  }
  if (!primary) return null;
  const a = ARCH_BY_SLUG[primary];
  const s = secondary ? ARCH_BY_SLUG[secondary] : null;
  return {
    slug: a.slug,
    name: a.name,
    secondary: s ? { slug: s.slug, name: s.name } : null,
    raw: label,
  };
}

// The archetype pair for a library row: primary from `archetype`; secondary
// from the record's own `secondary_archetype` field when it names a canonical
// archetype other than the primary, and only otherwise from the second part
// of a hybrid label (e.g. "Caregiver × Creator hybrid").
export function brandArchetypes(brand) {
  const primary = canonicalArchetype(brand?.archetype);
  if (!primary) return { primary: null, secondary: null };
  let secondary = null;
  const s = canonicalArchetype(brand?.secondary_archetype);
  if (s && s.slug !== primary.slug) secondary = { slug: s.slug, name: s.name };
  else if (primary.secondary) secondary = primary.secondary;
  return { primary, secondary };
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
  [/entertainment|streaming|media|music|gaming|toys|film|publishing/i, "media"],
  [/retail|e-?commerce|dtc|direct-to-consumer|furnish|beauty|cosmetic|consumer goods|cpg/i, "retail"],
  [/artificial intelligence|\bai\b|technology|electronics|social|internet|edtech/i, "technology"],
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
