-- ════════════════════════════════════════════════════════════════════════════
-- MUSE — initial schema
-- Run this file first in Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'track_source') then
    create type public.track_source as enum ('soundcloud', 'local', 'telegram_upload');
  end if;
  if not exists (select 1 from pg_type where typname = 'playback_type') then
    create type public.playback_type as enum ('stored_audio', 'soundcloud_embed', 'unavailable');
  end if;
end
$$;

-- ─── updated_at helper ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  telegram_user_id bigint unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── user_settings ──────────────────────────────────────────────────────────
create table if not exists public.user_settings (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  telegram_user_id bigint,
  default_volume numeric(4, 3) not null default 0.8
    check (default_volume >= 0 and default_volume <= 1),
  autoplay boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── tracks ─────────────────────────────────────────────────────────────────
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade
    default auth.uid(),
  title text not null,
  artist text not null default 'Unknown artist',
  album text,
  cover_url text,
  duration integer check (duration is null or duration >= 0),
  source public.track_source not null,
  source_url text,
  source_track_id text,
  audio_storage_path text,
  playback_type public.playback_type not null default 'unavailable',
  is_downloadable boolean not null default false,
  genre text,
  year integer check (year is null or (year >= 1000 and year <= 3000)),
  file_size bigint check (file_size is null or file_size >= 0),
  mime_type text,
  checksum text,
  play_count integer not null default 0 check (play_count >= 0),
  last_played_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracks_owner_created_idx
  on public.tracks (owner_id, created_at desc);
create index if not exists tracks_owner_artist_idx
  on public.tracks (owner_id, lower(artist));
create index if not exists tracks_owner_title_idx
  on public.tracks (owner_id, lower(title));
create unique index if not exists tracks_owner_source_track_idx
  on public.tracks (owner_id, source, source_track_id)
  where source_track_id is not null;
create unique index if not exists tracks_owner_checksum_idx
  on public.tracks (owner_id, checksum)
  where checksum is not null;

-- ─── playlists ──────────────────────────────────────────────────────────────
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade
    default auth.uid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists playlists_owner_created_idx
  on public.playlists (owner_id, created_at desc);

-- ─── playlist_tracks ────────────────────────────────────────────────────────
create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

create index if not exists playlist_tracks_playlist_position_idx
  on public.playlist_tracks (playlist_id, position);

-- ─── updated_at triggers ────────────────────────────────────────────────────
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists tracks_set_updated_at on public.tracks;
create trigger tracks_set_updated_at
  before update on public.tracks
  for each row execute function public.set_updated_at();

drop trigger if exists playlists_set_updated_at on public.playlists;
create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

-- ─── bootstrap a profile + settings for every new auth user ─────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(coalesce(new.email, 'listener'), '@', 1)
  );

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, v_display_name)
  on conflict (id) do nothing;

  insert into public.user_settings (owner_id, display_name)
  values (new.id, v_display_name)
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RPC: global search ─────────────────────────────────────────────────────
create or replace function public.search_tracks(q text)
returns setof public.tracks
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.tracks
  where owner_id = auth.uid()
    and (
      title ilike '%' || q || '%'
      or artist ilike '%' || q || '%'
      or coalesce(album, '') ilike '%' || q || '%'
    )
  order by created_at desc
  limit 60;
$$;

-- ─── RPC: play counter ──────────────────────────────────────────────────────
create or replace function public.record_track_play(p_track_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.tracks
  set play_count = play_count + 1,
      last_played_at = now()
  where id = p_track_id
    and owner_id = auth.uid();
$$;

-- ─── RPC: atomic playlist reorder ───────────────────────────────────────────
create or replace function public.reorder_playlist_tracks(
  p_playlist_id uuid,
  p_track_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.playlists
    where id = p_playlist_id and owner_id = auth.uid()
  ) then
    raise exception 'Playlist not found';
  end if;

  update public.playlist_tracks pt
  set position = ordered.ord - 1
  from unnest(p_track_ids) with ordinality as ordered(track_id, ord)
  where pt.playlist_id = p_playlist_id
    and pt.track_id = ordered.track_id;
end;
$$;

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

-- profiles
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- user_settings
drop policy if exists "settings select own" on public.user_settings;
create policy "settings select own"
  on public.user_settings for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "settings insert own" on public.user_settings;
create policy "settings insert own"
  on public.user_settings for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "settings update own" on public.user_settings;
create policy "settings update own"
  on public.user_settings for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "settings delete own" on public.user_settings;
create policy "settings delete own"
  on public.user_settings for delete to authenticated
  using (owner_id = auth.uid());

-- tracks
drop policy if exists "tracks select own" on public.tracks;
create policy "tracks select own"
  on public.tracks for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "tracks insert own" on public.tracks;
create policy "tracks insert own"
  on public.tracks for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "tracks update own" on public.tracks;
create policy "tracks update own"
  on public.tracks for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "tracks delete own" on public.tracks;
create policy "tracks delete own"
  on public.tracks for delete to authenticated
  using (owner_id = auth.uid());

-- playlists
drop policy if exists "playlists select own" on public.playlists;
create policy "playlists select own"
  on public.playlists for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "playlists insert own" on public.playlists;
create policy "playlists insert own"
  on public.playlists for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "playlists update own" on public.playlists;
create policy "playlists update own"
  on public.playlists for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "playlists delete own" on public.playlists;
create policy "playlists delete own"
  on public.playlists for delete to authenticated
  using (owner_id = auth.uid());

-- playlist_tracks (ownership is inherited from the parent playlist)
drop policy if exists "playlist_tracks select own" on public.playlist_tracks;
create policy "playlist_tracks select own"
  on public.playlist_tracks for select to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks insert own" on public.playlist_tracks;
create policy "playlist_tracks insert own"
  on public.playlist_tracks for insert to authenticated
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.tracks t
      where t.id = track_id and t.owner_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks update own" on public.playlist_tracks;
create policy "playlist_tracks update own"
  on public.playlist_tracks for update to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks delete own" on public.playlist_tracks;
create policy "playlist_tracks delete own"
  on public.playlist_tracks for delete to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  );

-- ─── Privileges ─────────────────────────────────────────────────────────────
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.tracks to authenticated;
grant select, insert, update, delete on public.playlists to authenticated;
grant select, insert, update, delete on public.playlist_tracks to authenticated;

revoke all on public.profiles from anon;
revoke all on public.user_settings from anon;
revoke all on public.tracks from anon;
revoke all on public.playlists from anon;
revoke all on public.playlist_tracks from anon;

revoke all on function public.search_tracks(text) from public;
revoke all on function public.record_track_play(uuid) from public;
revoke all on function public.reorder_playlist_tracks(uuid, uuid[]) from public;
grant execute on function public.search_tracks(text) to authenticated;
grant execute on function public.record_track_play(uuid) to authenticated;
grant execute on function public.reorder_playlist_tracks(uuid, uuid[]) to authenticated;
