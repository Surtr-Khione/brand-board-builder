import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Server-side credit ledger API for the email tier. Registration mints a credit
// token (stored client-side); every paid action spends against the server
// balance, so localStorage edits buy nothing.
//
// Re-registering an email no longer returns its existing token: that let anyone
// who typed an address take over its balance. Instead a 6-digit code is issued
// (bmd_anon_claims) and the token is handed over on `verify`. Delivery of the
// code is pluggable (sendCode): with no sender configured, the response says the
// address is taken and nothing is handed over, which is strictly safer than before.
//
// Actions: register {email} · verify {email, code} · balance {token}
//          earn {token, earnAction} · import {token, count}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = makeDb();

const EARN_ACTIONS = new Set(["share_facebook", "share_linkedin", "share_x", "share_link"]);
const CLAIM_TTL_MIN = 15;
const CLAIM_MAX_ATTEMPTS = 5;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Code delivery. Returns true when a message went out. No sender is configured
// today (MAILER_KEY exists as a secret but nothing in this repo uses it), so this
// returns false and `register` reports the address as taken.
async function sendCode(_email: string, _code: string): Promise<boolean> {
  const key = Deno.env.get("BMD_CODE_SENDER_KEY");
  if (!key) return false;
  // Wire a provider here (e.g. Resend) when one is chosen; keep the code out of logs.
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { action, email, token, earnAction, count, code } = await req.json();

    if (action === "register") {
      if (await rateLimited(db, req, "credits-register", 5)) return json({ error: RATE_LIMIT_MSG }, 429);
      const clean = typeof email === "string" && email.includes("@") ? email.trim().toLowerCase() : null;
      if (!clean) return json({ error: "A valid email is required." }, 400);
      const { data: existing } = await db.from("bmd_anon_credits").select("token").eq("email", clean).maybeSingle();
      if (existing) {
        // Never hand the existing token to an unverified caller.
        const digits = String(Math.floor(100000 + Math.random() * 900000));
        const sent = await sendCode(clean, digits);
        if (sent) {
          await db.from("bmd_anon_claims").insert({
            email: clean, code_hash: await sha256(`${clean}:${digits}`),
            expires_at: new Date(Date.now() + CLAIM_TTL_MIN * 60_000).toISOString(),
          });
          return json({ pending: true, message: "This email already has credits. We sent a 6-digit code to confirm it's you." });
        }
        return json({
          error: "This email is already registered on another device. Use that device, or register with a different email.",
          taken: true,
        }, 409);
      }
      const { data: created, error } = await db.from("bmd_anon_credits")
        .insert({ email: clean }).select("token, credits, tier").single();
      if (error) throw error;
      return json({ token: created.token, credits: created.credits, tier: created.tier });
    }

    if (action === "verify") {
      if (await rateLimited(db, req, "credits-verify", 10)) return json({ error: RATE_LIMIT_MSG }, 429);
      const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
      const digits = typeof code === "string" ? code.trim() : "";
      if (!clean || !/^\d{6}$/.test(digits)) return json({ error: "Enter the 6-digit code." }, 400);
      const { data: claim } = await db.from("bmd_anon_claims").select("id, code_hash, attempts, expires_at")
        .eq("email", clean).is("consumed_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!claim || new Date(claim.expires_at).getTime() < Date.now()) return json({ error: "That code has expired. Register again to get a new one." }, 400);
      if (claim.attempts >= CLAIM_MAX_ATTEMPTS) return json({ error: "Too many tries. Register again to get a new code." }, 429);
      const ok = claim.code_hash === await sha256(`${clean}:${digits}`);
      await db.from("bmd_anon_claims").update({ attempts: claim.attempts + 1, ...(ok ? { consumed_at: new Date().toISOString() } : {}) }).eq("id", claim.id);
      if (!ok) return json({ error: "That code isn't right." }, 400);
      const { data: row } = await db.from("bmd_anon_credits").select("token, credits, tier").eq("email", clean).maybeSingle();
      if (!row) return json({ error: "No credits found for that email." }, 404);
      return json({ token: row.token, credits: row.credits, tier: row.tier });
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
