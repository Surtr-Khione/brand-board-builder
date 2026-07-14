import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Server-side logo caching: fetches each brand's mark (Clearbit → favicon
// fallback) and stores it in the public brand-assets bucket, saving the URL
// on the row. Runs from the edge because local networks often DNS-block
// logo services. POST { slugs: [...≤12] } → { results }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = makeDb();
const BASE = Deno.env.get("SUPABASE_URL")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { slugs = [] } = await req.json();
    if (!Array.isArray(slugs) || slugs.length === 0 || slugs.length > 12) {
      return json({ error: "Pass 1-12 slugs per call" }, 400);
    }
    if (await rateLimited(db, req, "cache-logos", 4)) return json({ error: RATE_LIMIT_MSG }, 429);

    const results: Record<string, string> = {};
    for (const slug of slugs) {
      try {
        const { data: row } = await db.from("public_brands").select("id, website").eq("slug", slug).maybeSingle();
        const domain = (row?.website || "").replace(/^https?:\/\//, "").split("/")[0];
        if (!row || !domain) { results[slug] = "no domain"; continue; }
        let res = await fetch(`https://logo.clearbit.com/${domain}`).catch(() => null);
        if (!res || !res.ok) res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`).catch(() => null);
        if (!res || !res.ok) { results[slug] = "no logo"; continue; }
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length < 200) { results[slug] = "too small"; continue; }
        const path = `logos/${slug}.png`;
        const { error: upErr } = await db.storage.from("brand-assets").upload(path, buf, { contentType: "image/png", upsert: true });
        if (upErr) { results[slug] = `upload: ${upErr.message}`; continue; }
        const url = `${BASE}/storage/v1/object/public/brand-assets/${path}`;
        await db.from("public_brands").update({ logo_url: url }).eq("id", row.id);
        results[slug] = "ok";
      } catch (e) { results[slug] = String(e?.message || e); }
    }
    return json({ results });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
