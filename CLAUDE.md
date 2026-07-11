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
- **Pre-launch UX pass (2026-07-11):** Builder + Content Studio migrated onto the titanium system (mono blue `#0071E3`, Inter, BrandMD wordmark header — the red "AI-Powered Enterprise" identity is gone); app chrome accent is FIXED system blue, never `brand.primaryColor` (dark brand palettes made nav/buttons invisible). Both are now mobile-responsive (≤760px: Builder sidebar → horizontal chip strip, Studio columns stack). BrandProfile got a `pcInk` luminance guard so dark-palette brands (Apple) can't paint their own certificate invisible. Gravity scoring is honest: placeholder color triplet + structural ids/empty objects no longer score (empty board = 0, all 10 roadmap steps). Homepage/Library stats are live (`totalBrands` from search-brands); stale "19 sections" copy → 31.
- **Impact Score parked** (`src/lib/impactScore.js`, Builder-only): revisit = backfill real data for library brands, surface on certificates, automate GEO check.
- Library: 87 brands live in `public_brands` (50 seeded 2026-07-11 via `scripts/seed-library.mjs`, profile-mode synthesis, all with brand.md files).

## Design identity
Archetype: The Sage/Magician, enemy "Guesswork." Near-black + titanium `#8E8E93` + off-white `#F5F5F7` + system blue `#0071E3` only. Single Inter family. Guidelines page is deliberately light/paper (it's a print document). Ryan iterates fast on visuals — rebuild with reasoning, don't re-skin.

## Retention layer (built 2026-07-11, on founder-release)
The board is now something content is *checked against*, not just built from:
- **Brand Check** (`/check`, `/check/:boardId` + `brand-check` fn, Sonnet): grades any draft against the board's voice/rules with quoted-evidence violations + an on-brand rewrite. Gated: register → 3 credits, 1/check (the natural first paid loop once Stripe lands).
- **Drift Watch** (`/board/:id/drift` + `drift-check` fn): rescans the board's website via scan-website, diffs colors/tagline/fonts/archetype deterministically + a Haiku voice read → alignment score. On-demand now; scheduled email version needs pg_cron + an email sender (Ryan's call).
- **brand.md** (`brand-md` fn): permanent AI-context file per board — `/board/:id/brand.md` and `/brands/:slug/brand.md` 302 via `public/_redirects` to the fn. Surfaced in Export with copy button.
- **Compare** (`/compare`): scan 2-3 sites side-by-side, Gravity each, winner callout → Builder CTA. Free/viral. Linked from nav ("Check" added too), Analyzer, homepage.

## Protection + growth layer (built 2026-07-11, later same day)
- **Credits are server-side now**: `bmd_anon_credits` + `credits` fn; registration mints a token (localStorage `brandmd_credit_token`); `brand-check`/`generate-content` spend server-side and return `creditsRemaining`. Client localStorage is cache only. Known gap: re-registering an email returns its token (fix = accounts merge).
- **Rate limiting**: `bmd_rate_limits` + `supabase/functions/_shared/gate.ts` on all Sonnet fns (founder-brief 3/hr/IP, synthesize 5, drift 6, check/generate 12, register 5). Trusted callers bypass via `x-bmd-internal` header = `bmd_config.internal_key` (service-only table). Deploy fns via CLI: `npx supabase functions deploy <fn> --project-ref bukgitgwwmzdjibekmzb --no-verify-jwt --use-api` (CLI is authenticated; --use-api avoids the slow Docker bundler).
- **Analytics**: `bmd_events` (insert-only) + `src/lib/track.js`; page_view on every route + board_saved / founder_generated / check_run / drift_run / compare_run / studio_generated. Query with service role.
- **analyze-pdf rebuilt + deployed** (Claude document block) — PDF import works again in BrandIntelligence; `scan-social`/`analyze-image` still missing.
- **Core 7 mode** in Builder (default ON, persisted `bmd_core_mode`): shows only the Gravity-signal sections; Full 31 toggle in sidebar/mobile chips.
- **Library seeder**: `scripts/seed-library.mjs` + `seed-domains.txt` (needs `SUPABASE_SERVICE_KEY` + `BMD_INTERNAL_KEY` from bmd_config). NOTE: edge `synthesize-brand` hits worker limits (546/504) under concurrency and on huge sites — run concurrency 1; local meta fetch already replaces the edge scan.
- **Nurture sequence**: `marketing/nurture/` — 5 GHL-ready emails + wiring README. ⚠️ `VITE_GHL_WEBHOOK_URL` is UNSET in prod → lead capture currently dead; Ryan must pick a GHL location and set it.

## Next actions
1. Ryan: review + merge the two stacked PRs (redesign → main, then founder-release), apply the edit-token migration, then `npm run build && npx wrangler pages deploy --branch=main`.
2. Get Stripe keys from Ryan → set secrets → test checkout end-to-end.
3. Rebuild `scan-social` / `analyze-pdf` / `analyze-image` (sources lost) to restore multi-source Brand Intelligence.
4. Restyle Builder + Studio onto the titanium system.
5. Then revisit Impact Score; future: Enterprise Brand Builder (memory `project_enterprise_brand_builder.md`).
