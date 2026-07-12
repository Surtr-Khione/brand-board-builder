import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// Shared enforcement for the AI edge functions: per-IP rate limiting and
// server-side credit spending. The anon key ships in the client bundle, so
// nothing client-side counts as protection — these run behind service role.

export const makeDb = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// Trusted internal callers (seeding scripts, function-to-function) send the
// bmd_config internal_key as x-bmd-internal. The table is service-role-only,
// so knowing the key proves service access. Cached per isolate.
let internalKey: string | null | undefined;
async function isInternalCaller(db: SupabaseClient, req: Request): Promise<boolean> {
  const header = req.headers.get("x-bmd-internal");
  if (!header) return false;
  if (internalKey === undefined) {
    const { data } = await db.from("bmd_config").select("value").eq("key", "internal_key").maybeSingle();
    internalKey = data?.value ?? null;
  }
  return Boolean(internalKey && header === internalKey);
}

// True when this IP has exhausted its window for `fn`. Best-effort (a race
// can leak one request past the limit) — this is abuse control, not billing.
export async function rateLimited(db: SupabaseClient, req: Request, fn: string, limit: number, windowSecs = 3600): Promise<boolean> {
  try {
    if (await isInternalCaller(db, req)) return false;
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const key = `${fn}:${ip}`;
    const now = Date.now();
    const { data } = await db.from("bmd_rate_limits").select("count, window_start").eq("rl_key", key).maybeSingle();
    if (data && now - new Date(data.window_start).getTime() < windowSecs * 1000) {
      if (data.count >= limit) return true;
      await db.from("bmd_rate_limits").update({ count: data.count + 1 }).eq("rl_key", key);
      return false;
    }
    await db.from("bmd_rate_limits").upsert({ rl_key: key, count: 1, window_start: new Date(now).toISOString() });
    return false;
  } catch {
    return false; // never let the limiter itself take the product down
  }
}

export type SpendResult = { ok: true; remaining: number } | { ok: false; status: number; error: string };

// Spend one credit from the server-side ledger. Optimistic-lock decrement.
export async function spendCredit(db: SupabaseClient, token?: string): Promise<SpendResult> {
  if (!token) return { ok: false, status: 401, error: "Register free to use this — it takes one credit." };
  const { data: row } = await db.from("bmd_anon_credits").select("credits").eq("token", token).maybeSingle();
  if (!row) return { ok: false, status: 401, error: "That session isn't registered anymore — register again (free) to continue." };
  if (row.credits <= 0) return { ok: false, status: 402, error: "You're out of credits — earn more from any locked Builder section." };
  const { data: upd } = await db.from("bmd_anon_credits")
    .update({ credits: row.credits - 1, updated_at: new Date().toISOString() })
    .eq("token", token).eq("credits", row.credits)
    .select("credits").maybeSingle();
  if (!upd) return { ok: false, status: 409, error: "Busy — try again." };
  return { ok: true, remaining: upd.credits };
}

export const RATE_LIMIT_MSG = "You've hit the hourly limit for this — try again in a bit.";
