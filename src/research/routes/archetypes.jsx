import { lazy } from "react";

const ArchetypesIndex = lazy(() => import("../../pages/research/archetypes/ArchetypesIndex"));
const ArchetypeHub = lazy(() => import("../../pages/research/archetypes/ArchetypeHub"));

export const hub = {
  title: "The 12 archetypes",
  blurb: "Every brand in the index sorted by the character it plays, with the colors, values, enemies and voice lines each archetype's brands share.",
  href: "/archetypes",
};

export default [
  { path: "/archetypes", element: <ArchetypesIndex /> },
  { path: "/archetypes/:slug", element: <ArchetypeHub /> },
];
