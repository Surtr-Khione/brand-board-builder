import { lazy } from "react";

const BattlesHub = lazy(() => import("../../pages/research/battles/BattlesHub"));
const BattlePair = lazy(() => import("../../pages/research/battles/BattlePair"));

export const hub = {
  title: "Brand Battles",
  blurb: "Two brands side by side: archetype, sector tags, enemy, promise, voice, colors, fonts and Gravity Score. Start with a curated battle or pick any two brands in the index.",
  href: "/battles",
};

// /battles/:pair takes "<a>-vs-<b>" for ANY two brands in the index. Curated
// RIVALS pairs are prerendered and indexed; any other pair renders
// client-side with noindex. A reversed order redirects to the canonical
// (sorted) path. The old /versus paths 301 here via public/_redirects.
export default [
  { path: "/battles", element: <BattlesHub /> },
  { path: "/battles/:pair", element: <BattlePair /> },
];
