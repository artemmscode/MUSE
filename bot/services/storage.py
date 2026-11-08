"""Supabase Storage uploads for audio and artwork."""

from __future__ import annotations

import asyncio
import logging

from supabase import Client

logger = logging.getLogger(__name__)

_EXTENSION_BY_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


class StorageService:
    def __init__(
        self,
        client: Client,
        audio_bucket: str = "audio",
        covers_bucket: str = "covers",
    ) -> None:
        self.client = client
        self.audio_bucket = audio_bucket
        self.covers_bucket = covers_bucket

    async def upload_audio(
        self,
        owner_id: str,
        track_id: str,
        extension: str,
        data: bytes,
        mime_type: str,
    ) -> str:
        path = f"{owner_id}/tracks/{track_id}.{extension}"
        await asyncio.to_thread(
            self.client.storage.from_(self.audio_bucket).upload,
            path,
            data,
            {
                "content-type": mime_type,
                "cache-control": "3600",
                "upsert": "true",
            },
        )
        logger.info("Uploaded audio to %s/%s (%s bytes)", self.audio_bucket, path, len(data))
        return path

    async def upload_cover(
        self,
        owner_id: str,
        track_id: str,
        data: bytes,
        mime_type: str,
    ) -> str | None:
        extension = _EXTENSION_BY_MIME.get(mime_type, "jpg")
        path = f"{owner_id}/tracks/{track_id}.{extension}"
        try:
            await asyncio.to_thread(
                self.client.storage.from_(self.covers_bucket).upload,
                path,
                data,
                {
                    "content-type": mime_type,
                    "cache-control": "31536000",
                    "upsert": "true",
                },
            )
            public_url = await asyncio.to_thread(
                self.client.storage.from_(self.covers_bucket).get_public_url,
                path,
            )
            return public_url or None
        except Exception as error:  # noqa: BLE001
            logger.warning("Cover upload failed: %s", error)
            return None

    async def remove_audio(self, path: str | None) -> None:
        if not path:
            return
        try:
            await asyncio.to_thread(
                self.client.storage.from_(self.audio_bucket).remove,
                [path],
            )
        except Exception as error:  # noqa: BLE001
            logger.warning("Could not remove orphaned audio %s: %s", path, error)
