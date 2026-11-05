import { lazy } from "react";

const ModelsHub = lazy(() => import("../../pages/research/models/ModelsHub"));
const ModelPage = lazy(() => import("../../pages/research/models/ModelPage"));

export const hub = {
  title: "Business models",
  blurb: "How brands sell, next to what they sell: B2B SaaS, direct-to-consumer, fintech and platform brands, tagged from each record's industry line, with their archetypes, sectors, colors and Gravity range.",
  href: "/models",
};

export default [
  { path: "/models", element: <ModelsHub /> },
  { path: "/models/:slug", element: <ModelPage /> },
];
