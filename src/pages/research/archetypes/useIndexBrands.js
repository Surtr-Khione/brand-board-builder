import { useEffect, useState } from "react";
import { searchBrands } from "../../../lib/brands";

// Every row in the public index (search-brands caps limit at 100, so page
// through until a short page). Cached for the session so moving between
// archetype hubs doesn't refetch.
let cache = null;
let inflight = null;

async function fetchAll() {
  const all = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const data = await searchBrands({ limit: 100, offset });
    const page = Array.isArray(data?.brands) ? data.brands : [];
    all.push(...page);
    if (page.length < 100) break;
  }
  return all.sort((a, b) => String(a.brand_name).localeCompare(String(b.brand_name)));
}

export default function useIndexBrands() {
  const [state, setState] = useState(() => (cache ? { brands: cache, loading: false, error: null } : { brands: [], loading: true, error: null }));
  useEffect(() => {
    if (cache) return;
    let live = true;
    inflight = inflight || fetchAll();
    inflight
      .then((brands) => { cache = brands; if (live) setState({ brands, loading: false, error: null }); })
      .catch((e) => { inflight = null; if (live) setState({ brands: [], loading: false, error: e }); });
    return () => { live = false; };
  }, []);
  return state;
}
