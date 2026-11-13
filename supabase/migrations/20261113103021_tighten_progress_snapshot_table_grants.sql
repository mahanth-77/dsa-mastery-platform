-- Remove broad default table privileges and grant only what the authenticated
-- snapshot read and versioned write path requires.
revoke all on table public.user_progress_snapshots from anon, authenticated, public;
grant select, insert, update on table public.user_progress_snapshots to authenticated;
