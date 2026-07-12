#!/usr/bin/env python3
"""Generate the 5-email BrandMD nurture sequence as GHL-ready table-based HTML.
Run: python3 marketing/nurture/generate.py  → writes 01..05 .html beside it.
Light rendition of the BrandMD system (email clients punish dark themes):
off-white page, white 600px card, near-black ink, system-blue CTA."""

import os

INK = "#1D1D1F"
MUTED = "#6E6E73"
BLUE = "#0071E3"
PAGE = "#F5F5F7"

SKELETON = """<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>{title}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  @media only screen and (max-width: 620px) {{
    .bmd-card {{ width: 100% !important; }}
    .bmd-pad {{ padding-left: 24px !important; padding-right: 24px !important; }}
  }}
</style>
</head>
<body style="margin:0;padding:0;background-color:{page};">
<div style="display:none;max-height:0;overflow:hidden;">{preview}&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:{page};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="bmd-card" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
    <tr><td class="bmd-pad" style="padding:36px 44px 0 44px;font-family:Helvetica,Arial,sans-serif;">
      <span style="font-size:16px;font-weight:bold;color:{ink};">BrandMD</span><span style="font-size:16px;color:{muted};">.space</span>
    </td></tr>
    <tr><td class="bmd-pad" style="padding:28px 44px 8px 44px;font-family:Helvetica,Arial,sans-serif;">
      <h1 style="margin:0;font-size:26px;line-height:1.25;letter-spacing:-0.5px;color:{ink};">{headline}</h1>
    </td></tr>
    {body_rows}
    <tr><td class="bmd-pad" align="left" style="padding:8px 44px 36px 44px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="border-radius:100px;background-color:{blue};">
          <a href="{cta_url}" style="display:inline-block;padding:13px 30px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:100px;">{cta_label}</a>
        </td>
      </tr></table>
    </td></tr>
  </table>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="bmd-card">
    <tr><td style="padding:20px 12px;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:{muted};text-align:center;">
      You get these because you built a brand board at brandmd.space.<br>
      BrandMD &middot; brandmd.space &middot; <a href="{{{{unsubscribe}}}}" style="color:{muted};">Unsubscribe</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


def p(text):
    return ('<tr><td class="bmd-pad" style="padding:8px 44px;font-family:Helvetica,Arial,sans-serif;'
            f'font-size:15px;line-height:1.65;color:{INK};">{text}</td></tr>')


def small(text):
    return ('<tr><td class="bmd-pad" style="padding:8px 44px;font-family:Helvetica,Arial,sans-serif;'
            f'font-size:13px;line-height:1.6;color:{MUTED};">{text}</td></tr>')


EMAILS = [
    {
        "file": "01-your-gravity-score.html",
        "subject": "Your Gravity Score, explained",
        "preview": "What the number actually measures, and the one move that raises it fastest.",
        "headline": "Your brand has a Gravity Score now. Here's how to read it.",
        "body": [
            p("Hi {{contact.first_name}},"),
            p("Gravity doesn't measure how pretty your brand is. It measures how much it <strong>agrees with itself</strong> &mdash; whether your archetype, voice, colors, and message all pull in the same direction."),
            p("Brands with high gravity get remembered without buying the impressions twice. Brands with low gravity pay for every single introduction, forever."),
            p("Your board shows exactly which of the ten signals you've defined and which are still missing. Each one you close is worth +10."),
        ],
        "cta_label": "Open your board",
        "cta_url": "https://brandmd.space/builder",
    },
    {
        "file": "02-the-gap.html",
        "subject": "Apple scores 100. Where are you?",
        "preview": "The gap between your brand and the ones you admire is a checklist, not a mystery.",
        "headline": "The brands you admire aren't more creative. They're more decided.",
        "body": [
            p("Hi {{contact.first_name}},"),
            p("Apple, Nike, Patagonia &mdash; the boards in our library that score 90+ have one thing in common: every strategic question has exactly one answer. One archetype. One enemy. One voice."),
            p("Your roadmap already lists your undecided questions, in order, with a +10 next to each. Most founders close three of them in a single sitting."),
            p("Want to see how you stack up against a competitor first? Run both sites through Compare &mdash; same scan, side by side."),
        ],
        "cta_label": "See your roadmap",
        "cta_url": "https://brandmd.space/builder",
    },
    {
        "file": "03-brand-check.html",
        "subject": "Would your brand sign off on your last email?",
        "preview": "Paste any draft. Get the violations, the fixes, and the on-brand rewrite.",
        "headline": "Your brand has rules now. Brand Check enforces them.",
        "body": [
            p("Hi {{contact.first_name}},"),
            p("The hardest part of brand isn't defining the voice &mdash; it's holding it on a Tuesday afternoon when a post has to go out."),
            p("Brand Check reads any draft the way your brand would: it flags every banned word and broken rule with the exact quote, then hands you the rewrite that passes. Graded 0&ndash;100, so \"is this on-brand?\" stops being an opinion."),
            p("Your first checks are on us &mdash; you already have credits waiting."),
        ],
        "cta_label": "Check a draft",
        "cta_url": "https://brandmd.space/check",
    },
    {
        "file": "04-brand-md.html",
        "subject": "Stop re-explaining your brand to ChatGPT",
        "preview": "One URL gives any AI tool your complete brand system. Always current.",
        "headline": "Your brand now has a URL that AI tools can read.",
        "body": [
            p("Hi {{contact.first_name}},"),
            p("Every time you ask ChatGPT or Claude to write something, you re-type the same context: who we are, how we sound, what we never say. And every session drifts a little differently."),
            p("Your board has a permanent <strong>brand.md</strong> address &mdash; a complete, machine-readable brand system. Paste the link once and the AI writes with your archetype, your rules, your banned words. Update the board, and every tool gets the update."),
            small("Find yours in the Builder's Export section &mdash; it looks like brandmd.space/board/yourboard/brand.md"),
        ],
        "cta_label": "Get your brand.md",
        "cta_url": "https://brandmd.space/builder",
    },
    {
        "file": "05-drift-watch.html",
        "subject": "Your site drifts. Now you'll know when.",
        "preview": "Drift Watch rescans your site and diffs it against the brand you defined.",
        "headline": "The brand you defined and the site you're running will drift apart. Watch it happen.",
        "body": [
            p("Hi {{contact.first_name}},"),
            p("A new landing page here, a rushed headline there &mdash; six months later the site reads like a different company than the board. Nobody decided that. It just drifted."),
            p("Drift Watch rescans your site and diffs what the world sees against what your board says: colors, tagline, typography, and a voice read &mdash; scored, itemized, with severity on every gap."),
            p("Run it after every site change, or just monthly. It's free."),
        ],
        "cta_label": "Run a drift check",
        "cta_url": "https://brandmd.space/builder",
    },
]

here = os.path.dirname(os.path.abspath(__file__))
for e in EMAILS:
    html = SKELETON.format(
        title=e["subject"], preview=e["preview"], headline=e["headline"],
        body_rows="\n    ".join(e["body"]), cta_label=e["cta_label"], cta_url=e["cta_url"],
        ink=INK, muted=MUTED, blue=BLUE, page=PAGE,
    )
    with open(os.path.join(here, e["file"]), "w") as f:
        f.write(html)
    print(f"wrote {e['file']}  ({e['subject']})")
