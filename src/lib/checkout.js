// Credit pack purchases — Stripe Checkout via the create-checkout edge function.
// The webhook (stripe-webhook edge function) fulfills credits + Pro tier.
import { supabase } from './supabase';
import { refreshProfile } from './auth';

export async function startCheckout(packId) {
  if (!supabase) throw new Error('Payments unavailable.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const err = new Error('Create a free account first — purchases attach to your account.');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      packId,
      successUrl: `${window.location.origin}${window.location.pathname}?checkout=success`,
      cancelUrl: `${window.location.origin}${window.location.pathname}?checkout=cancelled`,
    },
  });
  if (error) {
    let msg = 'Could not start checkout.';
    try {
      const body = await error.context?.json?.();
      if (body?.error) msg = body.error;
    } catch { /* keep default */ }
    throw new Error(msg);
  }
  if (!data?.url) throw new Error(data?.error || 'Could not start checkout.');
  window.location.href = data.url;
}

// Call on page load; returns 'success' | 'cancelled' | null and refreshes credits
export async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout');
  if (!status) return null;
  params.delete('checkout');
  const qs = params.toString();
  window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  if (status === 'success') {
    // Webhook fulfillment is near-instant; retry once in case it isn't
    await refreshProfile();
    setTimeout(refreshProfile, 3000);
  }
  return status;
}
