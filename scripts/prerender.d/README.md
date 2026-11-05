# scripts/prerender.d

One `.mjs` file per research family. `scripts/prerender.mjs` loads every file
here (alphabetical), after the static routes, journal posts and brand pages.

```js
// scripts/prerender.d/<family>.mjs
export default async function ({ brands, taxonomy, brandHtml, esc }) {
  return [
    { path: "/archetypes", title: "…", description: "…", jsonld /* optional */, image /* optional */, body: "<h1>…</h1>" },
  ];
}
```

- `brands`: every row from `search-brands` (full records, sorted by name). Empty
  when the fetch failed, so return `[]` (or pages that need no data) then.
- `taxonomy`: `src/lib/brandTaxonomy.js` (canonicalArchetype, brandArchetypes,
  sectorOf, ARCHETYPES, SECTORS, RIVALS, rivalsOf, ...; plus the three-level
  archetype reading `archetypeOf` / `EXPRESSIONS` / `expressionCounts`, sector
  tags `sectorsOf`, and business-model tags `modelsOf` / `MODELS`).
- `brandHtml(brand, { headingLevel, compact })`: the shared crawlable brand body.
- `esc`: HTML escaper. Escape every value that comes from a record.
- `body` is static semantic HTML, no scripts. It is injected inside `#root`
  and replaced by the SPA on load.
- Every returned path goes into `dist/sitemap.xml`. A path already written by
  an earlier stage or family is skipped with a warning.
- Facts only: any claim about a brand comes from its record; computed numbers
  say what they were computed from.
