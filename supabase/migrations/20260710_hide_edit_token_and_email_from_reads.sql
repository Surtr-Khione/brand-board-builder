-- REQUIRED before (or with) merging the founder-release branch.
-- Apply manually via the Supabase SQL editor or MCP on project bukgitgwwmzdjibekmzb.
--
-- Why: brand_boards.edit_token is the write credential for anonymous boards
-- (used by the save-board edge function) and email is PII. The public SELECT
-- policy (boards_read_public_or_own_or_shared) exposes every column of
-- is_public rows, so anyone with a share link could read the token and
-- silently overwrite the board. Column-level privileges fix that: drop
-- SELECT on the table for client roles, then re-grant only safe columns.
-- INSERT/UPDATE/DELETE privileges (used by the authenticated account flow)
-- are untouched; the service role bypasses this entirely.

revoke select on table public.brand_boards from anon, authenticated;

grant select (id, board_id, user_id, title, brand_data, is_public, created_at, updated_at)
  on table public.brand_boards to anon, authenticated;
