"""All database access for MUSE Bot (service-role client)."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from supabase import Client, create_client

logger = logging.getLogger(__name__)

TRACK_COLUMNS = (
    "id, owner_id, title, artist, album, cover_url, duration, source, "
    "source_url, source_track_id, audio_storage_path, playback_type, "
    "is_downloadable, genre, year, file_size, mime_type, checksum, "
    "play_count, last_played_at, created_at, updated_at"
)


class RepositoryError(RuntimeError):
    """A database operation failed."""


class TrackRepository:
    def __init__(self, url: str, service_key: str, owner_id: str) -> None:
        self.client: Client = create_client(url, service_key)
        self.owner_id = owner_id

    async def _run(self, operation):
        return await asyncio.to_thread(operation)

    async def find_existing(
        self,
        *,
        source_track_id: str | None = None,
        source_url: str | None = None,
        checksum: str | None = None,
    ) -> dict[str, Any] | None:
        def query() -> dict[str, Any] | None:
            base = self.client.table("tracks").select(TRACK_COLUMNS).eq(
                "owner_id", self.owner_id
            )
            if source_track_id:
                result = base.eq("source_track_id", source_track_id).limit(1).execute()
                if result.data:
                    return result.data[0]
            if source_url:
                result = (
                    self.client.table("tracks")
                    .select(TRACK_COLUMNS)
                    .eq("owner_id", self.owner_id)
                    .eq("source_url", source_url)
                    .limit(1)
                    .execute()
                )
                if result.data:
                    return result.data[0]
            if checksum:
                result = (
                    self.client.table("tracks")
                    .select(TRACK_COLUMNS)
                    .eq("owner_id", self.owner_id)
                    .eq("checksum", checksum)
                    .limit(1)
                    .execute()
                )
                if result.data:
                    return result.data[0]
            return None

        return await self._run(query)

    async def insert_track(self, payload: dict[str, Any]) -> dict[str, Any]:
        data = {"owner_id": self.owner_id, **payload}

        def query() -> dict[str, Any]:
            result = self.client.table("tracks").insert(data).execute()
            if not result.data:
                raise RepositoryError("Supabase не вернул созданный трек.")
            return result.data[0]

        try:
            return await self._run(query)
        except RepositoryError:
            raise
        except Exception as error:  # noqa: BLE001
            raise RepositoryError(str(error)) from error

    async def update_track(
        self,
        track_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        def query() -> dict[str, Any] | None:
            result = (
                self.client.table("tracks")
                .update(payload)
                .eq("id", track_id)
                .eq("owner_id", self.owner_id)
                .execute()
            )
            return result.data[0] if result.data else None

        try:
            return await self._run(query)
        except Exception as error:  # noqa: BLE001
            raise RepositoryError(str(error)) from error

    async def stats(self) -> dict[str, int]:
        def query() -> dict[str, int]:
            tracks = (
                self.client.table("tracks")
                .select("id", count="exact")
                .eq("owner_id", self.owner_id)
                .execute()
            )
            playlists = (
                self.client.table("playlists")
                .select("id", count="exact")
                .eq("owner_id", self.owner_id)
                .execute()
            )
            return {
                "tracks": tracks.count or 0,
                "playlists": playlists.count or 0,
            }

        try:
            return await self._run(query)
        except Exception as error:  # noqa: BLE001
            logger.warning("Stats query failed: %s", error)
            return {"tracks": 0, "playlists": 0}

    async def link_telegram_identity(
        self,
        telegram_user_id: int,
        display_name: str,
    ) -> None:
        def query() -> None:
            self.client.table("profiles").upsert(
                {
                    "id": self.owner_id,
                    "telegram_user_id": telegram_user_id,
                    "display_name": display_name,
                },
                on_conflict="id",
            ).execute()
            self.client.table("user_settings").upsert(
                {
                    "owner_id": self.owner_id,
                    "telegram_user_id": telegram_user_id,
                    "display_name": display_name,
                },
                on_conflict="owner_id",
            ).execute()

        try:
            await self._run(query)
        except Exception as error:  # noqa: BLE001
            # Linking is a convenience; it must never block adding music.
            logger.info("Could not link Telegram identity: %s", error)
