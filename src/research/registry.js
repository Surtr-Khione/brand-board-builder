// Research route registry.
//
// Every research family (archetypes, sectors, rivals, colours, ...) plugs in
// by ADDING one file to ./routes/<family>.jsx — nothing here or in App.jsx
// changes. Each file:
//   export default [{ path: "/archetypes", element: <ArchetypesHub /> }, ...]
//   export const hub = { title, blurb, href }   // card on the /research hub
// Page components should be React.lazy so the main bundle stays small; App
// already wraps every route in <Suspense>.
const modules = import.meta.glob("./routes/*.jsx", { eager: true });

const families = Object.keys(modules)
  .sort()
  .map((file) => ({
    family: file.replace(/^\.\/routes\//, "").replace(/\.jsx$/, ""),
    routes: Array.isArray(modules[file].default) ? modules[file].default : [],
    hub: modules[file].hub || null,
  }));

// Flat route list for App.jsx. Earlier families win on a duplicate path.
const seen = new Set();
export const researchRoutes = families.flatMap((f) =>
  f.routes.filter((r) => {
    if (!r || !r.path || seen.has(r.path)) return false;
    seen.add(r.path);
    return true;
  }),
);

// Hub cards for /research, in family-file order.
export const researchHubs = families.map((f) => f.hub).filter(Boolean);

export const researchFamilies = families.map((f) => f.family);
