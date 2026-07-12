import { createClient } from "npm:@supabase/supabase-js@2";

// Board reads for share links. Boards are saved is_public=false so anonymous
// REST selects return nothing (RLS) — which keeps edit_token and email
// unreadable without needing column-privilege DDL. Knowing the unguessable
// board_id IS the read capability; this function returns only safe fields.
// GET ?board=<board_id> → { board_id, title, brand_data, created_at, updated_at }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const boardId = new URL(req.url).searchParams.get("board");
    if (!boardId) return json({ error: "board required" }, 400);
    const { data } = await db
      .from("brand_boards")
      .select("board_id, title, brand_data, is_public, created_at, updated_at")
      .eq("board_id", boardId)
      .maybeSingle();
    if (!data) return json({ error: "Board not found" }, 404);
    const { is_public: _omit, ...safe } = data;
    return json(safe);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
