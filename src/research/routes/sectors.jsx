import { lazy } from "react";

const SectorsHub = lazy(() => import("../../pages/research/sectors/SectorsHub"));
const SectorPage = lazy(() => import("../../pages/research/sectors/SectorPage"));

export const hub = {
  title: "Sectors",
  blurb: "The index grouped by industry: each sector's archetype mix, Gravity Scores, shared colors and type, and how its brands describe their differences.",
  href: "/sectors",
};

export default [
  { path: "/sectors", element: <SectorsHub /> },
  { path: "/sectors/:slug", element: <SectorPage /> },
];
