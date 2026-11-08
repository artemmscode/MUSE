"""Official SoundCloud API + oEmbed metadata. No stream extraction."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from urllib.parse import quote

import httpx

from .validation import normalize_soundcloud_url

logger = logging.getLogger(__name__)

API_BASE = "https://api.soundcloud.com"
OEMBED_URL = "https://soundcloud.com/oembed"
# SoundCloud moved client-credentials auth to secure.soundcloud.com.
# Keep the legacy endpoint as a fallback for older apps.
TOKEN_URLS = (
    "https://secure.soundcloud.com/oauth/token",
    f"{API_BASE}/oauth2/token",
)

USER_AGENT = "MUSE-Bot/1.0 (+https://github.com/)"


class SoundCloudError(RuntimeError):
    """User-facing SoundCloud failure."""


@dataclass
class SoundCloudTrack:
    title: str
    artist: str
    source_url: str
    album: str | None = None
    cover_url: str | None = None
    duration: int | None = None
    source_track_id: str | None = None
    is_downloadable: bool = False
    download_url: str | None = None
    genre: str | None = None
    year: int | None = None
    description: str | None = None


def _large_artwork(url: str | None) -> str | None:
    if not url:
        return None
    return url.replace("-large.", "-t500x500.").replace("-crop.", "-t500x500.")


class SoundCloudService:
    def __init__(
        self,
        client_id: str = "",
        client_secret: str = "",
        *,
        timeout: float = 20.0,
    ) -> None:
        self.client_id = client_id.strip()
        self.client_secret = client_secret.strip()
        self._timeout = timeout
        self._token: str | None = None

    @property
    def api_enabled(self) -> bool:
        return bool(self.client_id)

    async def _get_token(self, client: httpx.AsyncClient) -> str | None:
        if not (self.client_id and self.client_secret):
            return None
        if self._token:
            return self._token
        for token_url in TOKEN_URLS:
            try:
                response = await client.post(
                    token_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                    headers={"Accept": "application/json"},
                )
                response.raise_for_status()
                payload = response.json()
                token = payload.get("access_token")
                if token:
                    self._token = token
                    return self._token
            except Exception as error:  # noqa: BLE001
                logger.warning("SoundCloud token request to %s failed: %s", token_url, error)
        return None

    async def _auth_headers(self, client: httpx.AsyncClient) -> dict[str, str]:
        token = await self._get_token(client)
        if token:
            return {"Authorization": f"OAuth {token}"}
        return {}

    async def _api_resolve(
        self,
        client: httpx.AsyncClient,
        url: str,
    ) -> SoundCloudTrack | None:
        if not self.client_id:
            return None
        headers = await self._auth_headers(client)
        params: dict[str, str] = {"url": url}
        if not headers:
            params["client_id"] = self.client_id
        try:
            response = await client.get(
                f"{API_BASE}/resolve",
                params=params,
                headers=headers,
            )
            if response.status_code in {401, 403}:
                logger.warning("SoundCloud API rejected credentials (%s)", response.status_code)
                return None
            response.raise_for_status()
            data = response.json()
        except Exception as error:  # noqa: BLE001
            logger.warning("SoundCloud API resolve failed: %s", error)
            return None

        if not isinstance(data, dict) or data.get("kind") != "track":
            return None

        user = data.get("user") or {}
        publisher = data.get("publisher_metadata") or {}
        album = publisher.get("album_title") or data.get("album") or None
        downloadable = bool(data.get("downloadable")) and bool(data.get("download_url"))
        return SoundCloudTrack(
            title=(data.get("title") or "Без названия")[:200],
            artist=(user.get("username") or "Unknown artist")[:200],
            source_url=data.get("permalink_url") or url,
            album=(str(album).strip()[:200] or None) if album else None,
            cover_url=_large_artwork(data.get("artwork_url")),
            duration=int(round((data.get("duration") or 0) / 1000)) or None,
            source_track_id=str(data.get("id")) if data.get("id") else None,
            is_downloadable=downloadable,
            download_url=data.get("download_url") if downloadable else None,
            genre=(data.get("genre") or None),
            year=data.get("release_year") or None,
            description=(data.get("description") or None),
        )

    async def _oembed(
        self,
        client: httpx.AsyncClient,
        url: str,
    ) -> SoundCloudTrack:
        try:
            response = await client.get(
                OEMBED_URL,
                params={"format": "json", "url": url},
            )
            response.raise_for_status()
            data = response.json()
        except Exception as error:  # noqa: BLE001
            raise SoundCloudError(
                "Не удалось получить информацию о треке SoundCloud. "
                "Проверьте ссылку или попробуйте позже."
            ) from error

        title = (data.get("title") or "Без названия").strip()
        author = (data.get("author_name") or "Unknown artist").strip()

        # oEmbed sometimes returns "Artist - Title" in the title field.
        if " - " in title and author.lower() not in title.lower():
            left, right = title.split(" - ", 1)
            if left.strip() and right.strip():
                author, title = left.strip(), right.strip()

        return SoundCloudTrack(
            title=title[:200],
            artist=author[:200],
            source_url=normalize_soundcloud_url(url),
            cover_url=_large_artwork(data.get("thumbnail_url")),
            duration=None,
            source_track_id=None,
            is_downloadable=False,
            download_url=None,
        )

    async def resolve(self, url: str) -> SoundCloudTrack:
        canonical = normalize_soundcloud_url(url)
        async with httpx.AsyncClient(
            timeout=self._timeout,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            track = await self._api_resolve(client, canonical)
            if track:
                return track
            return await self._oembed(client, canonical)

    async def download_audio(
        self,
        track: SoundCloudTrack,
    ) -> tuple[bytes, str, str] | None:
        """Download audio only when SoundCloud explicitly marks it downloadable."""
        if not track.is_downloadable or not track.download_url:
            return None

        async with httpx.AsyncClient(
            timeout=90.0,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            headers = await self._auth_headers(client)
            params: dict[str, str] = {}
            if not headers and self.client_id:
                params["client_id"] = self.client_id
            try:
                response = await client.get(
                    track.download_url,
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()
                data = response.content
            except Exception as error:  # noqa: BLE001
                logger.warning("Official SoundCloud download failed: %s", error)
                return None

        if not data:
            return None

        mime = (response.headers.get("content-type") or "audio/mpeg").split(";")[0]
        disposition = response.headers.get("content-disposition", "")
        extension = "mp3"
        if "filename=" in disposition:
            name = disposition.split("filename=", 1)[1].strip().strip('"')
            if "." in name:
                extension = name.rsplit(".", 1)[-1].lower()
        elif mime in {"audio/mp4", "audio/x-m4a"}:
            extension = "m4a"
        elif mime in {"audio/flac", "audio/x-flac"}:
            extension = "flac"
        elif mime in {"audio/wav", "audio/x-wav"}:
            extension = "wav"
        elif mime in {"audio/ogg", "audio/opus"}:
            extension = "ogg"

        if extension not in {"mp3", "wav", "flac", "m4a", "aac", "ogg", "opus"}:
            extension = "mp3"

        return data, mime, extension

    async def download_cover(self, url: str | None) -> tuple[bytes, str] | None:
        if not url:
            return None
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
            except Exception as error:  # noqa: BLE001
                logger.info("Artwork download failed: %s", error)
                return None

        if not response.content or len(response.content) > 8 * 1024 * 1024:
            return None
        mime = (response.headers.get("content-type") or "image/jpeg").split(";")[0]
        if mime not in {"image/jpeg", "image/png", "image/webp"}:
            mime = "image/jpeg"
        return response.content, mime


def search_url(query: str) -> str:
    """Reserved for a future SoundCloud search screen."""
    return f"https://soundcloud.com/search?q={quote(query)}"
