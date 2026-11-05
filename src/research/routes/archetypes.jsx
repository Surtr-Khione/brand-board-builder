import { lazy } from "react";

const ArchetypesIndex = lazy(() => import("../../pages/research/archetypes/ArchetypesIndex"));
const ArchetypeHub = lazy(() => import("../../pages/research/archetypes/ArchetypeHub"));
const ExpressionPage = lazy(() => import("../../pages/research/archetypes/ExpressionPage"));

export const hub = {
  title: "The 12 archetypes",
  blurb: "Every brand in the index sorted by the character it plays and the named expression it uses, with the colors, values, enemies and voice lines each archetype's brands share.",
  href: "/archetypes",
};

// Three levels: /archetypes (all 12 families) → /archetypes/:slug (a family,
// with its expressions and blends) → /archetypes/:family/:expression (an
// expression that 2+ brands hold as primary; see archetypeData.js).
export default [
  { path: "/archetypes", element: <ArchetypesIndex /> },
  { path: "/archetypes/:slug", element: <ArchetypeHub /> },
  { path: "/archetypes/:family/:expression", element: <ExpressionPage /> },
];
