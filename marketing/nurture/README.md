# BrandMD Nurture Sequence (5 emails)

Table-based HTML, GHL-ready (`{{contact.first_name}}`, `{{unsubscribe}}` merge tags,
MSO conditionals, hidden preview text, mobile media query in head). Light rendition
of the BrandMD system. Regenerate after edits: `python3 marketing/nurture/generate.py`.

| # | File | Subject | Send |
|---|------|---------|------|
| 1 | 01-your-gravity-score.html | Your Gravity Score, explained | Day 0 (on lead) |
| 2 | 02-the-gap.html | Apple scores 100. Where are you? | Day 2 |
| 3 | 03-brand-check.html | Would your brand sign off on your last email? | Day 4 |
| 4 | 04-brand-md.html | Stop re-explaining your brand to ChatGPT | Day 6 |
| 5 | 05-drift-watch.html | Your site drifts. Now you'll know when. | Day 9 |

## Wiring (Ryan)
1. **Pick the GHL location** that owns BrandMD leads, create an Inbound Webhook
   workflow trigger, and set its URL as `VITE_GHL_WEBHOOK_URL` in the build env —
   **it is currently unset in prod, so no leads are being captured at all.**
2. Upload each file: `POST /emails/builder` (type "html") → `PATCH` with html +
   name + subjectLine + previewText (curl, not urllib — Cloudflare 1010).
3. Workflow: trigger on tag `brand-board-lead` → email 1 → wait 2d → email 2 →
   wait 2d → email 3 → wait 2d → email 4 → wait 3d → email 5. Goal step at BOTTOM.
