// Creates a Stripe Checkout session for a credit pack, for the email tier.
// The buyer is identified by their credit token (bmd_anon_credits), not a
// Supabase auth user: this site has no sign-in. Pack prices live server-side.
// Deploy with --no-verify-jwt (the token is the credential; CORS preflight can't
// carry auth). Secrets: STRIPE_SECRET_KEY
import { makeDb, rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

const PACKS: Record<string, { credits: number; amountCents: number; name: string }> = {
  starter: { credits: 15,  amountCents: 900,   name: "BrandMD Starter: 15 credits" },
  creator: { credits: 50,  amountCents: 2500,  name: "BrandMD Creator: 50 credits" },
  studio:  { credits: 150, amountCents: 5900,  name: "BrandMD Studio: 150 credits" },
  agency:  { credits: 500, amountCents: 14900, name: "BrandMD Agency: 500 credits" },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const db = makeDb();
const ALLOWED_ORIGINS = new Set(["https://brandmd.space", "https://www.brandmd.space", "http://localhost:5173"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return json({ error: "Payments aren't enabled yet." }, 503);

  try {
    if (await rateLimited(db, req, "create-checkout", 10)) return json({ error: RATE_LIMIT_MSG }, 429);
    const { packId, creditToken, returnTo } = await req.json();
    // Where to send the buyer back: a path we serve, never an echoed string.
    const back = typeof returnTo === "string" && /^\/(builder|studio)(\/[A-Za-z0-9_-]+)?$/.test(returnTo) ? returnTo : "/studio";
    const pack = PACKS[packId];
    if (!pack) return json({ error: "Unknown credit pack." }, 400);
    if (typeof creditToken !== "string" || !/^[0-9a-f-]{36}$/.test(creditToken)) {
      return json({ error: "Register free first, then buy credits." }, 401);
    }
    const { data: owner } = await db.from("bmd_anon_credits").select("token, email").eq("token", creditToken).maybeSingle();
    if (!owner) return json({ error: "That session isn't registered anymore. Register again (free) to continue." }, 401);

    const reqOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : "https://brandmd.space";

    const params = new URLSearchParams({
      mode: "payment",
      "payment_method_types[0]": "card",            // immediate notification only: the webhook assumes paid-on-complete
      "payment_method_types[1]": "link",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(pack.amountCents),
      "line_items[0][price_data][product_data][name]": pack.name,
      "line_items[0][quantity]": "1",
      success_url: `${origin}${back}?checkout=success`,
      cancel_url: `${origin}${back}?checkout=cancelled`,
      customer_email: owner.email,
      "metadata[anon_token]": owner.token,
      "metadata[pack_id]": packId,
      "metadata[credits]": String(pack.credits),
    });
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const session = await r.json();
    if (!r.ok || !session.url) return json({ error: session?.error?.message || "Couldn't start checkout." }, 502);

    // Pending row first; the webhook flips it to paid (idempotent on session id).
    await db.from("bmd_purchases").insert({
      anon_token: owner.token, pack_id: packId, credits: pack.credits,
      amount_cents: pack.amountCents, stripe_session_id: session.id, status: "pending",
    });
    return json({ url: session.url });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});
