# BrandMD / Brand Board Builder — Project Brief for Claude

React+Vite+Supabase SaaS, **live at https://brandmd.space** (Cloudflare Pages project `brand-board-builder`). GitHub: `Surtr-Khione/brand-board-builder`. (brandmd.world does not resolve — Ryan sometimes calls it that.)

## Deploy
`npm run build && npx wrangler pages deploy --branch=main` — `--branch=main` is REQUIRED or it ships a preview. Verify brandmd.space serves the new bundle hash after deploy. No git integration on Pages.

## Backends — two Supabase projects, don't confuse them
- **Shared** `bukgitgwwmzdjibekmzb`: the app's DB AND its edge functions (also hosts growth-brain/openbrain/scribe tables). All BrandMD objects use `bmd_` prefix where possible. Never create tables here without a prefix check.
- `xpbnglcrnnyfdzkswmsm` ("brand-board-builder"): mostly historical; auto-pauses on inactivity. `supabase/brands_library.sql` was originally written for it but the live `public_brands` lives on the shared project with a much richer schema — trust the DB, not that file.

## Edge functions (all on shared project, all verify_jwt=false — CORS preflight can't carry auth)
Deployed 2026-07-10: `scan-website`, `ai-suggest` (pre-existing) + `synthesize-brand`, `generate-content` (now honors the Studio Prompt Editor's systemPromptOverride/userPromptOverride), `founder-brief` (NEW: idea→brand for /start), `search-brands` + `publish-brand` (recreated from client contracts — sources were never committed before), `save-board` (NEW: anonymous saves with edit tokens). Still missing / never had source: `scan-social`, `analyze-pdf`, `analyze-image` — BrandIntelligence's non-website sources fail politely until rebuilt.

**History lesson (2026-07-10):** the live site was silently half-dead — synthesize/generate/publish/search all 404'd, and `brand_boards` RLS (accounts-era, `user_id`-based) blocked the anonymous save flow entirely (0 rows ever saved). The functions above restored it. Board saves now go through `save-board`, which mints an `edit_token` per anonymous board (localStorage `bmd_edit_token_<id>`); tokenless saves against an existing board fork a copy.

## ⚠️ Required migration before/with merging founder-release
`supabase/migrations/20260710_hide_edit_token_and_email_from_reads.sql` — column-privilege REVOKE/GRANT so anon readers of public boards can't see `edit_token` (the write credential) or `email` (PII). Blocked from automated apply by permissions; apply via SQL editor or MCP. Frontend already selects explicit columns and won't break.

## Current state (2026-07-10)
- **Branch stack:** `main` ⊂ `worktree-stateful-bouncing-bumblebee` (titanium redesign, Gravity Score, Certificates, Analyzer, Blog) ⊂ `worktree-founder-release` (Founder Mode `/start`, Gravity roadmap, Brand Guidelines page, backend restoration). Two stacked draft PRs — merge redesign first, then founder-release. Payments (`create-checkout`/`stripe-webhook`) still dormant: `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` unset, needs Ryan.
- **Founder release adds:** `/start` (brief → Sonnet `founder-brief` → full board seed via `sessionStorage["founder-seed"]` + `mapSynthesisToBoard` in `src/lib/synthesisMap.js`); Score section roadmap (gravityScore signals carry `sectionId`+`fix`, clicking scrolls to the section); `/board/:id/guidelines` (light print-first guidelines doc w/ copyable hex + CSS tokens, linked from Export once saved); dual on-ramp on home hero + Analyzer + SiteNav "Start".
- The Builder + Content Studio still wear the old dark/red UI while the rest is titanium — known seam, restyle later.
- **Impact Score parked** (`src/lib/impactScore.js`, Builder-only): revisit = backfill real data for library brands, surface on certificates, automate GEO check.
- Library: 37 brands live in `public_brands`.

## Design identity
Archetype: The Sage/Magician, enemy "Guesswork." Near-black + titanium `#8E8E93` + off-white `#F5F5F7` + system blue `#0071E3` only. Single Inter family. Guidelines page is deliberately light/paper (it's a print document). Ryan iterates fast on visuals — rebuild with reasoning, don't re-skin.

## Next actions
1. Ryan: review + merge the two stacked PRs (redesign → main, then founder-release), apply the edit-token migration, then `npm run build && npx wrangler pages deploy --branch=main`.
2. Get Stripe keys from Ryan → set secrets → test checkout end-to-end.
3. Rebuild `scan-social` / `analyze-pdf` / `analyze-image` (sources lost) to restore multi-source Brand Intelligence.
4. Restyle Builder + Studio onto the titanium system.
5. Then revisit Impact Score; future: Enterprise Brand Builder (memory `project_enterprise_brand_builder.md`).
