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

// Client errors are invisible without this — beacon them as events,
// throttled hard so a render loop can't flood the table.
let errorCount = 0;
function beacon(kind, message) {
  if (errorCount >= 3) return;
  errorCount++;
  track("client_error", { kind, message: String(message).slice(0, 300) });
}
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => beacon("error", e.message || e.type));
  window.addEventListener("unhandledrejection", (e) => beacon("rejection", e.reason?.message || e.reason || "unhandled"));
}
