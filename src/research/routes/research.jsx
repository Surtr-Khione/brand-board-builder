import { lazy } from "react";

// The /research hub itself. It has no `hub` export: it lists the other
// families' hub cards (src/research/registry.js → researchHubs).
const ResearchHub = lazy(() => import("../../pages/research/hub/ResearchHub"));

export default [
  { path: "/research", element: <ResearchHub /> },
];
