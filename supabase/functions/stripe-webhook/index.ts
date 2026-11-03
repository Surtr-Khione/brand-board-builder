// Stripe webhook — fulfills credit purchases and upgrades tier to Pro.
// verify_jwt is OFF (Stripe calls this); authenticity comes from the
// Stripe-Signature header verified against STRIPE_WEBHOOK_SECRET.
// Secrets: STRIPE_WEBHOOK_SECRET
import { createClient } from "npm:@supabase/supabase-js@2";

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=", 2) as [string, string]),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  // Reject events older than 5 minutes (replay protection)
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
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
  const userId = session.metadata?.user_id;
  const credits = parseInt(session.metadata?.credits ?? "0");
  if (!userId || !credits) return new Response("missing metadata", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Idempotent fulfillment: only the pending→paid transition awards credits
  const { data: updated } = await admin
    .from("bmd_purchases")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("stripe_session_id", session.id)
    .neq("status", "paid")
    .select("id, pack_id")
    .maybeSingle();

  if (!updated) {
    // Unknown session (or already fulfilled) — record unknowns for audit
    const { data: existing } = await admin
      .from("bmd_purchases").select("id").eq("stripe_session_id", session.id).maybeSingle();
    if (!existing) {
      await admin.from("bmd_purchases").insert({
        user_id: userId,
        pack_id: session.metadata?.pack_id ?? "unknown",
        credits,
        amount_cents: session.amount_total ?? 0,
        stripe_session_id: session.id,
        status: "paid",
      });
    } else {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }
  }

  // Award credits + Pro tier
  const { data: profile } = await admin
    .from("profiles").select("credits").eq("id", userId).single();
  await admin
    .from("profiles")
    .update({ credits: (profile?.credits ?? 0) + credits, tier: "pro", updated_at: new Date().toISOString() })
    .eq("id", userId);
  await admin.from("bmd_credit_ledger").insert({
    user_id: userId,
    delta: credits,
    reason: `purchase:${session.metadata?.pack_id ?? "pack"}`,
    ref: session.id,
  });

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
