// Creates a Stripe Checkout session for a credit pack.
// Requires a signed-in user (verify_jwt). Pack prices live server-side.
// Secrets: STRIPE_SECRET_KEY
import { createClient } from "npm:@supabase/supabase-js@2";

const PACKS: Record<string, { credits: number; amountCents: number; name: string }> = {
  starter: { credits: 15,  amountCents: 900,   name: "BrandMD Starter — 15 credits" },
  creator: { credits: 50,  amountCents: 2500,  name: "BrandMD Creator — 50 credits" },
  studio:  { credits: 150, amountCents: 5900,  name: "BrandMD Studio — 150 credits" },
  agency:  { credits: 500, amountCents: 14900, name: "BrandMD Agency — 500 credits" },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return json({ error: "Payments are not enabled yet — the Stripe key hasn't been configured. Contact support." }, 503);
  }

  try {
    const { packId, successUrl, cancelUrl } = await req.json();
    const pack = PACKS[packId];
    if (!pack) return json({ error: "Unknown credit pack." }, 400);

    // Identify the buyer from their JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Sign in to purchase credits." }, 401);

    const origin = new URL(req.headers.get("origin") ?? successUrl ?? "https://brandmd.space").origin;

    // Create the Checkout Session (REST — no SDK needed)
    const params = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(pack.amountCents),
      "line_items[0][price_data][product_data][name]": pack.name,
      "line_items[0][quantity]": "1",
      success_url: successUrl || `${origin}/builder?checkout=success`,
      cancel_url: cancelUrl || `${origin}/builder?checkout=cancelled`,
      customer_email: user.email ?? "",
      "metadata[user_id]": user.id,
      "metadata[pack_id]": packId,
      "metadata[credits]": String(pack.credits),
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("stripe error:", session);
      return json({ error: session?.error?.message || "Stripe rejected the request." }, 502);
    }

    // Record the pending purchase (service role)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("bmd_purchases").insert({
      user_id: user.id,
      pack_id: packId,
      credits: pack.credits,
      amount_cents: pack.amountCents,
      stripe_session_id: session.id,
      status: "pending",
    });

    return json({ url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: "Could not start checkout." }, 500);
  }
});
