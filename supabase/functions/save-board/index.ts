import { createClient } from "npm:@supabase/supabase-js@2";

// Saves a brand board without requiring a Supabase Auth account. RLS on
// brand_boards only allows authenticated owner writes, so the anonymous
// email-gate flow saves through this function instead. Ownership of an
// anonymous board is the edit_token: first save mints it, later saves must
// present it. A save against an existing board WITHOUT the right token forks
// to a fresh board (visitors who edit a shared link get their own copy
// instead of overwriting the original — or an error).
// Contract with src/lib/storage.js: POST { boardId?, brand, email, editToken? }
//   → { boardId, editToken }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const genBoardId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => chars[b % chars.length]).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { boardId, brand, email, editToken } = await req.json();
    if (!brand || typeof brand !== "object") return json({ error: "brand required" }, 400);

    const cleanEmail = typeof email === "string" && email.includes("@") ? email.trim() : null;
    const title = typeof brand.brandName === "string" && brand.brandName.trim() ? brand.brandName.trim() : null;

    if (boardId) {
      const { data: existing } = await db
        .from("brand_boards")
        .select("board_id, edit_token, user_id")
        .eq("board_id", boardId)
        .maybeSingle();

      // Own board (token matches, and it isn't an account-owned board) → update in place
      if (existing && !existing.user_id && editToken && existing.edit_token === editToken) {
        const { error } = await db
          .from("brand_boards")
          .update({ brand_data: brand, email: cleanEmail, title, updated_at: new Date().toISOString() })
          .eq("board_id", boardId);
        if (error) throw error;
        return json({ boardId, editToken });
      }
      // No/wrong token, or account-owned → fall through and fork a new board
    }

    const newId = genBoardId();
    const { data: inserted, error } = await db
      .from("brand_boards")
      .insert({ board_id: newId, brand_data: brand, email: cleanEmail, title, is_public: false })
      .select("board_id, edit_token")
      .single();
    if (error) throw error;

    return json({ boardId: inserted.board_id, editToken: inserted.edit_token });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
