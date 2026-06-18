const GHL_WEBHOOK_URL = import.meta.env.VITE_GHL_WEBHOOK_URL;

export async function sendLeadToGHL({ email, firstName, lastName, boardId, boardUrl }) {
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
