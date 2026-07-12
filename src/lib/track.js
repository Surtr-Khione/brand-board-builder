// Fire-and-forget product analytics into bmd_events (insert-only for clients).
// One call per meaningful action — the funnel can't be improved blind.
const BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function track(event, meta = {}) {
  if (!BASE) return;
  try {
    const { boardId, ...rest } = meta;
    fetch(`${BASE}/rest/v1/bmd_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event,
        path: window.location.pathname,
        board_id: boardId || null,
        meta: Object.keys(rest).length ? rest : null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* analytics must never break the product */ }
}
