import { lazy } from "react";

const Patterns = lazy(() => import("../../pages/research/patterns/Patterns.jsx"));

export const hub = {
  title: "Patterns of the Greats",
  blurb: "The colors, typefaces, archetypes, enemies and values the indexed brands share, and what the highest Gravity Scores have in common. Counted from the records.",
  href: "/patterns",
};

export default [
  { path: "/patterns", element: <Patterns /> },
];
