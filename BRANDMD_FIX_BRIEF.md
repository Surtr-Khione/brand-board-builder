# BrandMD — Fix Brief (handoff)

**Written:** 2026-07-14 · **Every claim below was verified live, not inferred.**

---

## TL;DR

brandmd.space is **serving a broken build**. The deployed JS bundle calls the **wrong
Supabase project** for its edge functions. In production right now, **`credits` (the
real-money path) and `generate-brand` both return HTTP 404**.

Nothing in `src/` is wrong. `CLAUDE.md` is right. The local `.env` is right. **Only the
deployed artifact and `public/llms.txt` are wrong.** The fix is a clean rebuild + redeploy.

---

## The two projects (do not confuse — this is the whole bug)

| project ref | what it actually is | verified |
|---|---|---|
| `bukgitgwwmzdjibekmzb` | **BrandMD's real backend.** Holds `brand_boards`, `public_brands`, `bmd_anon_credits`, `bmd_config`, `bmd_rate_limits`, `brand_snapshots`, all ~19 edge functions, and the `brand-assets/logos` storage bucket. | `search-brands?slug=stripe` → **200 with real Stripe data** |
| `xpbnglcrnnyfdzkswmsm` | **GHL Attribution's database.** Holds `tenants`, `events`, `touchpoints`, `lead_scores`, `conversions`. Zero BrandMD tables. `CLAUDE.md` correctly calls it "mostly historical" for BrandMD. | every BrandMD table → **404**; every attribution table → 200 |

The live bundle hardcodes `xpbnglcrnnyfdzkswmsm/functions/v1` as its edge-function base.

### Production impact (measured 2026-07-14)

| endpoint | on `xpbng` (what the live site calls) | on `bukgit` (the real backend) |
|---|---|---|
| `credits` — **real money** | **404** | 400 (deployed, wants auth) |
| `generate-brand` — PR #14's headline feature | **404** | 500 (deployed, wants a body) |
| `search-brands` | 404 / "Brand not found" (stale copy, no data) | **200, real data** |

**Not a security issue.** I checked: attribution's tables are RLS-protected — BrandMD's
public browser key gets `200` but reads **zero rows**. No data leaked. Don't panic about
the shared project; just stop pointing at it.

---

## Why it happened

Pages deploys a **locally built** `dist/` (`wrangler.jsonc` → `pages_build_output_dir: ./dist`,
deployed via `wrangler pages deploy`). So `VITE_SUPABASE_URL` is baked in **at build time
on whatever machine ran the build**. Some past build ran with `VITE_SUPABASE_URL=xpbng…`
(a stale `.env`, or a build from one of the `.claude/worktrees/*` copies).

Supporting evidence: the local checkout at `~/Documents/brand-board-builder` is **42 commits
behind `origin/main`**. A stale tree shipping a stale env is the most likely story.

`src/lib/supabase.js` reads `import.meta.env.VITE_SUPABASE_URL` — nothing is hardcoded, so a
correct rebuild fully fixes it.

---

## THE FIX

### 1. Rebuild and redeploy with the right project  ← this is the whole bug

```bash
cd ~/Documents/brand-board-builder
git pull origin main                    # you are 42 commits behind

# .env must point at the REAL backend. Confirm — do not assume:
grep VITE_SUPABASE_URL .env
# MUST be: https://bukgitgwwmzdjibekmzb.supabase.co
# (as of 2026-07-14 the local .env is already correct)

npm ci
npm run build

# GATE — the build is only good if this prints NOTHING:
grep -r "xpbnglcrnnyfdzkswmsm" dist/ && echo "!!! STILL WRONG — do not deploy" || echo "clean, safe to deploy"

npx wrangler pages deploy dist --project-name=brand-board-builder --branch=main
```

**Verify in production (all three must flip):**

```bash
# 1. the live bundle must no longer mention the attribution project
curl -s https://brandmd.space/ | grep -oE '/assets/[^"]+\.js' | head -4 \
  | while read f; do curl -s "https://brandmd.space$f"; done \
  | grep -c "xpbnglcrnnyfdzkswmsm"     # expect: 0

# 2. credits must stop 404-ing (401/400 = deployed and reachable = good)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://bukgitgwwmzdjibekmzb.supabase.co/functions/v1/credits \
  -H 'content-type: application/json' -d '{}'

# 3. click /generate on the live site — it should not 404
```

### 2. Fix `public/llms.txt` — it publicly advertises the broken endpoint

4 lines (11, 14, 17, 20) point the world at
`https://xpbnglcrnnyfdzkswmsm.supabase.co/functions/v1/search-brands`, which returns
"Brand not found". It also needlessly discloses GHL Attribution's project ref.

Replace all 4 with `https://bukgitgwwmzdjibekmzb.supabase.co/functions/v1/search-brands`.
Verify: `curl -s "https://bukgitgwwmzdjibekmzb.supabase.co/functions/v1/search-brands?slug=stripe"`
already returns real Stripe data.

### 3. Close PRs #1 and #2 — do NOT merge them

Both are **39 commits behind main** and untouched since 2026-07-03.

- **#2 "Real accounts, working saves, sharing, publishing, and Stripe payments"** — replaces
  main's **anonymous credit-token model** (credits are real money, held server-side in
  `bmd_anon_credits`) with **real Supabase auth + a profiles table + Stripe credit packs**.
  That is a *competing architecture*, not a merge conflict. Merging it would regress the live
  credit system. If you actually want accounts + Stripe, that's a **fresh build against current
  main**, not this branch.
- **#1 "Color scanner precision + logo images + 28 iconic brands"** — the logo/iconic-brands
  half already landed on main via the founder release (86 files under `public/logos|og`).
  Its *color-scanner* commits (multi-image vision, GHL/page-builder support) may still be
  worth **cherry-picking** — that's the only salvageable part.

PR #5 (.gitignore env hardening) and #14 (Brand Generator) are already merged.

### 4. Pending migration — never made it to main

`20260710_hide_edit_token_and_email_from_reads.sql` exists **only** inside
`.claude/worktrees/founder-release/supabase/migrations/`. There is no `supabase/migrations/`
directory on main at all. Move it into the repo and apply it to **`bukgitgwwmzdjibekmzb`**.
Brain notes it was "permission-blocked from automation" — likely needs the dashboard SQL editor.

### 5. Stripe is still dormant

Set the Stripe secrets. Brain's words: "one key from monetizing." Do this **after** step 1 —
there is no point wiring payments while the credits endpoint 404s.

---

## Gotchas for whoever picks this up

- **Trust the DB, not `supabase/brands_library.sql`.** That file's header says
  `Target: xpbnglcrnnyfdzkswmsm` — it's historical. `public_brands` lives on the shared
  project with a richer schema. (`CLAUDE.md` already says this.)
- **`xpbng` auto-pauses on inactivity** (per `CLAUDE.md`) — another reason not to depend on it.
  It stays alive only because GHL Attribution's cron writes to it hourly.
- **Don't "fix" ghl-attribution.** It points at `xpbng` *correctly* — that's its own database.
  I chased this as a cross-wiring bug first and it was a false alarm. The wiring error runs
  one way only: **BrandMD → attribution's project.**
- Edge functions are all `verify_jwt=false` (CORS preflight can't carry auth) — expected.
- The Second Brain entity for BrandMD previously recorded
  `supabase_project_ref: xpbnglcrnnyfdzkswmsm`. **That was wrong and has been corrected** to
  `bukgitgwwmzdjibekmzb`. If you see the old ref anywhere, it's stale.

---

## Definition of done

- [ ] `curl` of the live bundle returns **0** hits for `xpbnglcrnnyfdzkswmsm`
- [ ] `/generate` works end-to-end on brandmd.space
- [ ] credits balance loads (no 404 in the browser console)
- [ ] `llms.txt` points at `bukgit` and its documented endpoint returns real data
- [ ] PRs #1 and #2 closed (or #1's color-scanner commits cherry-picked)
- [ ] `20260710_hide_edit_token…` applied to `bukgit`
