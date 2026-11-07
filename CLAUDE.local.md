# BrandMD / Brand Board Builder — Project Brief for Claude

React+Vite+Supabase SaaS, **live at https://brandmd.space** (Cloudflare Pages project `brand-board-builder`). GitHub: `Surtr-Khione/brand-board-builder`. (brandmd.world does not resolve — Ryan sometimes calls it that.)

## Deploy
`npm run build && npx wrangler pages deploy --branch=main` — `--branch=main` is REQUIRED or it ships a preview. Verify brandmd.space serves the new bundle hash after deploy. No git integration on Pages.

## Backends — two Supabase projects, don't confuse them
- **Shared** `bukgitgwwmzdjibekmzb`: the app's DB (also hosts growth-brain/openbrain/scribe tables). All BrandMD objects use `bmd_` prefix; schema record: `supabase/accounts-schema.sql`. Never create tables here without a prefix check.
- `xpbnglcrnnyfdzkswmsm` ("brand-board-builder"): auto-pauses on inactivity — restore + poll for ACTIVE_HEALTHY before querying via claude.ai Supabase MCP.

## Current state (2026-07-06)
- Accounts live: Supabase auth, auto-confirm ON (no SMTP), 3 free credits + ref codes, anonymous boards claimed via edit tokens, viewer/editor sharing.
- **Payments dormant:** `create-checkout` + `stripe-webhook` edge functions deployed but `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` unset. No Stripe key exists on this machine — needs Ryan.
- **Unmerged redesign** on branch `worktree-stateful-bouncing-bumblebee`: space→titanium→"diagnostic reveal" hero, Gravity Score (`src/lib/gravityScore.js`), Brand Certificates (`CertificateShare.jsx`, markdown export). PR never opened. Main checkout also has uncommitted files — reconcile before deploying anything.
- **Impact Score parked** (`src/lib/impactScore.js`, Builder-only): revisit = (a) backfill real social/traffic data for the 23 library brands, (b) surface on certificates/Score Cards, (c) automate GEO/AI-visibility check via edge function.
- Library: 23 brands, 7 featured (incl. BrandMD itself — dogfooded board at `~/brandmd-brands/rank-000-brandmd.json`).

## Design identity
Archetype: The Sage/Magician, enemy "Guesswork." Near-black + titanium + off-white `#F5F5F7` + system blue `#0071E3` only. Single Inter family. Ryan iterates fast on visuals — rebuild with reasoning, don't re-skin.

## Next actions
1. Reconcile redesign branch vs main (open the PR, review, merge deliberately — never merge unattended).
2. Get Stripe keys from Ryan → set secrets → test checkout end-to-end.
3. Then revisit Impact Score.
4. Future roadmap: Enterprise Brand Builder ("build like [Brand]" from a top-500 brand DB) — memory `project_enterprise_brand_builder.md`.
