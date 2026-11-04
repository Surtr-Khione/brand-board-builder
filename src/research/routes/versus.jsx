import { lazy } from "react";

const VersusHub = lazy(() => import("../../pages/research/versus/VersusHub"));
const VersusPair = lazy(() => import("../../pages/research/versus/VersusPair"));

export const hub = {
  title: "Brand vs Brand",
  blurb: "Two brands from the same category, side by side: archetype, enemy, promise, voice, colours, fonts and Gravity Score, plus where the records differ and overlap.",
  href: "/versus",
};

// /versus/:pair takes "<a>-vs-<b>"; the page resolves it against RIVALS and
// redirects a reversed order to the canonical (sorted) path.
export default [
  { path: "/versus", element: <VersusHub /> },
  { path: "/versus/:pair", element: <VersusPair /> },
];
