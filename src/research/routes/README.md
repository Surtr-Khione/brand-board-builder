# src/research/routes

One `.jsx` file per research family; `src/research/registry.js` collects them
with `import.meta.glob('./routes/*.jsx', { eager: true })` and `App.jsx`
renders every route. Add a family by adding a file here, nothing else.

```jsx
import { lazy } from "react";
const ArchetypesHub = lazy(() => import("../pages/ArchetypesHub"));

export const hub = { title: "Archetypes", blurb: "…", href: "/archetypes" };
export default [
  { path: "/archetypes", element: <ArchetypesHub /> },
];
```

Use `React.lazy` for page components so the entry bundle stays small (App
already wraps routes in `<Suspense>`). Pair each family with a
`scripts/prerender.d/<family>.mjs` so the same paths get crawlable HTML and
land in the sitemap.
