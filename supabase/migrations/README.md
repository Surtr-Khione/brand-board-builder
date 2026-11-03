# Migrations: the repo-side record of the live shared project

Every file here is byte-identical to `supabase_migrations.schema_migrations` on the
shared project `bukgitgwwmzdjibekmzb` (verified by MD5 on 2026-11-03). They were applied
in July 2026 through the SQL editor / MCP and recorded here afterwards, so **do not
re-run them**: the objects already exist.

From here on, schema changes are files in this folder applied with
`npx supabase db push --project-ref bukgitgwwmzdjibekmzb` (or the MCP `apply_migration`),
never by hand in the SQL editor, so the repo stays the source of truth.

| Version | What it built |
|---|---|
| 20260703043559 | `profiles` + signup trigger (3 starter credits, referral +1) |
| 20260703043922 | `brand_boards` (owned or anonymous via edit_token), `board_shares`, save/claim RPCs |
| 20260703043959 | `bmd_credit_ledger`, `bmd_purchases` (Stripe), spend/earn RPCs, `public_brands` publishing columns |
| 20260703044042 | `brand-assets` storage bucket and per-user folder policies |
| 20260703193032 | contact-import credits RPC (25 lifetime cap) |
| 20260704003503 | `bmd_save_board` returns the edit token only to a caller that already holds it |
| 20260704004229 | advisor hardening: trigger not callable, stricter update policy, own-folder listing |
| 20260711162940 | `bmd_anon_credits` (the email tier the site uses today), `bmd_rate_limits`, `bmd_events` |
| 20260711165130 | `bmd_config` with the internal rate-limit bypass key |
| 20260714183601 | anon readers can't see `edit_token` or `email` on `brand_boards` |

`superseded/` holds the two hand-written files that predated this record (same SQL, one
combined two migrations); kept for history, not applied.

The accounts system (profiles, credits ledger, purchases) exists and works, but the site
runs on the email tier (`bmd_anon_credits`). Merging the two is the open "accounts merge"
item in CLAUDE.md.
