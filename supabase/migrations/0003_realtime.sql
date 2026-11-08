-- ════════════════════════════════════════════════════════════════════════════
-- MUSE — Realtime publication
-- Run after 0001_init.sql. Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_table text;
begin
  foreach v_table in array array['tracks', 'playlists', 'playlist_tracks']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end
$$;

-- Realtime needs the full row so the client can refresh lists reliably.
alter table public.tracks replica identity full;
alter table public.playlists replica identity full;
alter table public.playlist_tracks replica identity full;
