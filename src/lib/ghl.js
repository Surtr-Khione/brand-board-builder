// Lead capture → Insiders.Marketing GHL. Primary path is the ghl-lead edge
// function (Contacts API upsert — works with no GHL workflow published).
// The legacy inbound-webhook URL is kept as a fallback only.
const FN_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GHL_WEBHOOK_URL = import.meta.env.VITE_GHL_WEBHOOK_URL;

export async function sendLeadToGHL({ email, firstName, lastName, boardId, boardUrl }) {
  if (FN_BASE) {
    try {
      const response = await fetch(`${FN_BASE}/ghl-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          boardId: boardId || '',
          boardUrl: boardUrl || '',
        }),
      });
      if (response.ok) return true;
      console.warn('ghl-lead failed:', response.status);
    } catch (err) {
      console.error('ghl-lead error:', err);
    }
  }

  if (!GHL_WEBHOOK_URL) {
    console.warn('GHL webhook URL not configured. Lead not sent.');
    return false;
  }

  try {
    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        source: 'Brand Board Builder',
        tags: ['brand-board-lead', 'lead-magnet'],
        customField: {
          brand_board_url: boardUrl,
          brand_board_id: boardId,
        },
      }),
    });

    return response.ok;
  } catch (err) {
    console.error('GHL webhook error:', err);
    return false;
  }
}
