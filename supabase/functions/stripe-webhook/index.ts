// Stripe webhook: fulfils credit purchases on the email tier (bmd_anon_credits),
// and still honours the accounts tier (profiles) when a session carries user_id.
// verify_jwt is OFF (Stripe calls this); authenticity comes from the
// Stripe-Signature header verified against STRIPE_WEBHOOK_SECRET.
// Secrets: STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "npm:@supabase/supabase-js@2";

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=", 2) as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;   // replay window
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("webhook secret not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const payload = await req.text();
  if (!sig || !(await verifyStripeSignature(payload, sig, secret))) {
    return new Response("invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }
  const session = event.data.object;
  if (session.payment_status && session.payment_status !== "paid") {
    return new Response(JSON.stringify({ received: true, unpaid: true }), { status: 200 });
  }
  const anonToken = session.metadata?.anon_token as string | undefined;
  const userId = session.metadata?.user_id as string | undefined;
  const credits = parseInt(session.metadata?.credits ?? "0");
  const packId = session.metadata?.pack_id ?? "unknown";
  if ((!anonToken && !userId) || !credits) return new Response("missing metadata", { status: 400 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // One transaction on the database side: the purchase flips to paid and the credits
  // land together, or neither does. Any failure is a 500 so Stripe retries against an
  // unchanged pending row; a duplicate delivery returns false and awards nothing.
  const { data: awarded, error } = await admin.rpc("bmd_fulfil_purchase", {
    p_session_id: session.id, p_anon_token: anonToken ?? null, p_user_id: userId ?? null,
    p_credits: credits, p_pack_id: packId, p_amount_cents: session.amount_total ?? 0,
  });
  if (error) {
    console.error("fulfilment failed", session.id, error.message);   // no PII, no amounts beyond Stripe's own
    return new Response("fulfilment failed; retry", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true, awarded: !!awarded }), { status: 200 });
});
