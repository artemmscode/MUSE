-- ════════════════════════════════════════════════════════════════════════════
-- MUSE — storage buckets and policies
-- Run after 0001_init.sql.
--
-- Buckets:
--   audio  → private. Playback uses short-lived signed URLs.
--   covers → public. Artwork is safe to cache on the CDN.
-- Path convention: <auth-user-id>/<...>
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  false,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/flac',
        'audio/x-flac', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg',
        'audio/opus', 'audio/aac', 'audio/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── audio: owner-only access ───────────────────────────────────────────────
drop policy if exists "audio owner read" on storage.objects;
create policy "audio owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "audio owner insert" on storage.objects;
create policy "audio owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "audio owner update" on storage.objects;
create policy "audio owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "audio owner delete" on storage.objects;
create policy "audio owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── covers: public read, owner-only write ──────────────────────────────────
drop policy if exists "covers public read" on storage.objects;
create policy "covers public read"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "covers owner insert" on storage.objects;
create policy "covers owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers owner update" on storage.objects;
create policy "covers owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers owner delete" on storage.objects;
create policy "covers owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
