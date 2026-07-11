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
export const scanSocial = (url, type) => callFn("scan-social", { url, type });
export const analyzePDF = (fileBase64, fileName) => callFn("analyze-pdf", { fileBase64, fileName });
export const synthesizeBrand = (sources, existingBrand) => callFn("synthesize-brand", { sources, existingBrand });
export const founderBrief = (brief) => callFn("founder-brief", { brief });
export const brandCheck = (brand, draft, channel) => callFn("brand-check", { brand, draft, channel });
export const driftCheck = (payload) => callFn("drift-check", payload);
export const brandMdUrl = (boardId) => `${BASE}/brand-md?board=${encodeURIComponent(boardId)}`;
export const analyzeImages = (images) => callFn("analyze-image", { images });
export const suggestField = (field, brand) =>
  callFn("ai-suggest", { field, brand }).then((d) => d.suggestion);
export const generateContent = (payload) => callFn("generate-content", payload);
export const isAIAvailable = () => !!BASE;
