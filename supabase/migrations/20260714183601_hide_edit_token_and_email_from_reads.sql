-- brand_boards.edit_token is the write credential for anonymous boards and
-- email is PII. Drop table-level SELECT for client roles AND explicitly revoke
-- lingering column-level grants (a table-level REVOKE does not remove
-- column-level grants), then re-grant only safe columns.

revoke select on table public.brand_boards from anon, authenticated;
revoke select (edit_token, email) on table public.brand_boards from anon, authenticated;

grant select (id, board_id, user_id, title, brand_data, is_public, created_at, updated_at)
  on table public.brand_boards to anon, authenticated;