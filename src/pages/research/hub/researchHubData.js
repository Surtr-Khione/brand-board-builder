// Shared copy for /research, used by the SPA page and by
// scripts/prerender.d/research.mjs. Plain ESM (no JSX, no import.meta.env).

export const RESEARCH_TITLE = "Brand Research: Archetypes, Sectors & Patterns | BrandMD";

export function researchDescription(n) {
  return `Research built from the ${n ? `${n} brands` : "brands"} in the BrandMD index: the 12 archetypes, brands by sector, head-to-head comparisons and shared patterns.`;
}

export function researchIntro(n) {
  return `Every page here is computed from the brand records in the BrandMD index${n ? ` (${n} brands today)` : ""}: archetypes, sectors, colours, type, voice and Gravity Scores. Each number says what it was counted from, each quote comes from the brand's own record, and every brand links to its full system.`;
}

// Fixed order for the hub cards; families not listed here follow alphabetically.
export const HUB_ORDER = ["/archetypes", "/sectors", "/versus", "/patterns"];

export function orderHubs(hubs) {
  const rank = (h) => {
    const i = HUB_ORDER.indexOf(h.href);
    return i === -1 ? HUB_ORDER.length : i;
  };
  return [...hubs].sort((a, b) => rank(a) - rank(b) || String(a.title).localeCompare(String(b.title)));
}

// The library itself, listed after the research families.
export const LIBRARY_CARD = {
  title: "The Brand Index",
  blurb: "Every brand on its own page: archetype, mission, values, voice, colours, type and its brand.md context file.",
  href: "/brands",
};
