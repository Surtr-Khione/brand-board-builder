const BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callFn(name, body) {
  if (!BASE) throw new Error("Supabase not configured");
  const r = await fetch(`${BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const scanWebsite = (url) => callFn("scan-website", { url });
export const suggestField = (field, brand) =>
  callFn("ai-suggest", { field, brand }).then((d) => d.suggestion);
export const isAIAvailable = () => !!BASE;
