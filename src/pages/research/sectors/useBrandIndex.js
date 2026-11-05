import { useEffect, useState } from "react";
import { searchBrands } from "../../../lib/brands";

// The whole public index, loaded once per session (search-brands caps a page
// at 100 rows, so page through until a short page comes back).
let cache = null;
let inflight = null;

async function loadAll() {
  const all = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const data = await searchBrands({ limit: 100, offset });
    const page = Array.isArray(data?.brands) ? data.brands : [];
    all.push(...page);
    if (page.length < 100) break;
  }
  return all.sort((a, b) => String(a.brand_name).localeCompare(String(b.brand_name)));
}

export function useBrandIndex() {
  const [state, setState] = useState(() => (cache ? { brands: cache, loading: false, error: null } : { brands: [], loading: true, error: null }));
  useEffect(() => {
    if (cache) return;
    let alive = true;
    inflight ||= loadAll();
    inflight
      .then((brands) => { cache = brands; if (alive) setState({ brands, loading: false, error: null }); })
      .catch((e) => { inflight = null; if (alive) setState({ brands: [], loading: false, error: e?.message || "Could not load the index" }); });
    return () => { alive = false; };
  }, []);
  return state;
}

// Title + meta description for client-side navigation (the prerendered HTML
// carries the same values for crawlers).
export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", description);
    }
  }, [title, description]);
}
