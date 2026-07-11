import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Server-side credit ledger API. Registration mints a credit token (stored
// client-side); every paid action spends against the server balance, so
// localStorage edits buy nothing. Known limitation until real accounts:
// re-registering an email returns its existing token — acceptable at
// 3-free-credit stakes, fixed properly by the accounts merge (PR #2).
// Actions: register {email} · balance {token} · earn {token, earnAction}
//          import {token, count}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = makeDb();

const EARN_ACTIONS = new Set(["share_facebook", "share_linkedin", "share_x", "share_link"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { action, email, token, earnAction, count } = await req.json();

    if (action === "register") {
      if (await rateLimited(db, req, "credits-register", 5)) return json({ error: RATE_LIMIT_MSG }, 429);
      const clean = typeof email === "string" && email.includes("@") ? email.trim().toLowerCase() : null;
      if (!clean) return json({ error: "A valid email is required." }, 400);
      const { data: existing } = await db.from("bmd_anon_credits").select("token, credits, tier").eq("email", clean).maybeSingle();
      if (existing) return json({ token: existing.token, credits: existing.credits, tier: existing.tier });
      const { data: created, error } = await db.from("bmd_anon_credits")
        .insert({ email: clean }).select("token, credits, tier").single();
      if (error) throw error;
      return json({ token: created.token, credits: created.credits, tier: created.tier });
    }

    if (action === "balance") {
      const { data } = await db.from("bmd_anon_credits").select("credits, tier").eq("token", token).maybeSingle();
      if (!data) return json({ error: "Unknown token" }, 401);
      return json({ credits: data.credits, tier: data.tier });
    }

    if (action === "earn") {
      if (!EARN_ACTIONS.has(earnAction)) return json({ error: "Unknown earn action" }, 400);
      const { data: row } = await db.from("bmd_anon_credits").select("credits, earned").eq("token", token).maybeSingle();
      if (!row) return json({ error: "Unknown token" }, 401);
      if (row.earned?.[earnAction]) return json({ credits: row.credits, claimed: false });
      const { data: upd, error } = await db.from("bmd_anon_credits")
        .update({ credits: row.credits + 1, earned: { ...row.earned, [earnAction]: true }, updated_at: new Date().toISOString() })
        .eq("token", token).select("credits").single();
      if (error) throw error;
      return json({ credits: upd.credits, claimed: true });
    }

    if (action === "import") {
      const n = Math.min(Math.max(parseInt(String(count), 10) || 0, 0), 25);
      if (n === 0) return json({ error: "No contacts to import" }, 400);
      const { data: row } = await db.from("bmd_anon_credits").select("credits, earned").eq("token", token).maybeSingle();
      if (!row) return json({ error: "Unknown token" }, 401);
      if (row.earned?.contacts_imported) return json({ credits: row.credits, claimed: false });
      const { data: upd, error } = await db.from("bmd_anon_credits")
        .update({ credits: row.credits + n, earned: { ...row.earned, contacts_imported: n }, updated_at: new Date().toISOString() })
        .eq("token", token).select("credits").single();
      if (error) throw error;
      return json({ credits: upd.credits, claimed: true, granted: n });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
