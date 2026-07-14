// Captures a lead into the Insiders.Marketing GHL location via the Contacts
// API (upsert) — replaces the inbound-webhook approach, which silently drops
// leads unless a GHL workflow is published. Contacts arrive tagged
// `brand-board-lead`, so nurture automation can trigger on the tag.
// Secrets: GHL_PIT (Private Integration token with contacts.write)
import { makeDb, rateLimited } from "../_shared/gate.ts";

const GHL_LOCATION_ID = "lxG2xl9eg8Y5jZMCJtEa"; // Insiders.Marketing
// Custom field ids on that location (created 2026-07-14)
const CF_BOARD_URL = "2uP01NdjmYbjZkH49vnW"; // contact.brand_board_url
const CF_BOARD_ID = "4pD2IAYBlqNvn8KAB1gB"; // contact.brand_board_id

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const pit = Deno.env.get("GHL_PIT");
  if (!pit) return json({ error: "Lead capture is not configured." }, 503);

  const db = makeDb();
  if (await rateLimited(db, req, "ghl-lead", 10)) {
    return json({ error: "Too many requests. Try again later." }, 429);
  }

  try {
    const { email, firstName, lastName, boardId, boardUrl } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "A valid email is required." }, 400);
    }

    const customFields = [];
    if (boardUrl) customFields.push({ id: CF_BOARD_URL, field_value: String(boardUrl).slice(0, 500) });
    if (boardId) customFields.push({ id: CF_BOARD_ID, field_value: String(boardId).slice(0, 100) });

    const res = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pit}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        email: String(email).slice(0, 200),
        firstName: String(firstName ?? "").slice(0, 100),
        lastName: String(lastName ?? "").slice(0, 100),
        source: "Brand Board Builder",
        tags: ["brand-board-lead", "lead-magnet"],
        customFields,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error("ghl upsert error:", res.status, body);
      return json({ error: "Could not save the lead." }, 502);
    }
    return json({ ok: true, contactId: body?.contact?.id ?? null });
  } catch (e) {
    console.error(e);
    return json({ error: "Could not save the lead." }, 500);
  }
});
