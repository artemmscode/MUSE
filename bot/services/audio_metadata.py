"""Audio metadata extraction with mutagen (no re-encoding)."""

from __future__ import annotations

import base64
import io
import logging
import re
from dataclasses import dataclass, field

import mutagen
from mutagen.flac import FLAC, Picture
from mutagen.id3 import ID3
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4, MP4Cover
from mutagen.oggopus import OggOpus
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE

from .validation import extension_of, safe_title_from_filename

logger = logging.getLogger(__name__)


@dataclass
class AudioMetadata:
    title: str
    artist: str = "Unknown artist"
    album: str | None = None
    genre: str | None = None
    year: int | None = None
    duration: int | None = None
    cover_bytes: bytes | None = None
    cover_mime: str | None = None
    extra: dict[str, str] = field(default_factory=dict)


def _clean(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, (list, tuple)):
        value = value[0] if value else None
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _parse_year(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"(19|20)\d{2}", value)
    return int(match.group(0)) if match else None


def _id3_cover(tags: ID3 | None) -> tuple[bytes | None, str | None]:
    if not tags:
        return None, None
    frames = tags.getall("APIC")
    if not frames:
        return None, None
    frame = frames[0]
    mime = frame.mime or "image/jpeg"
    if mime not in {"image/jpeg", "image/png", "image/webp"}:
        mime = "image/jpeg"
    return bytes(frame.data), mime


def _open_audio(data: bytes, extension: str):
    stream = io.BytesIO(data)
    try:
        if extension == "mp3":
            return MP3(stream)
        if extension == "flac":
            return FLAC(stream)
        if extension in {"m4a", "mp4", "aac"}:
            return MP4(stream)
        if extension == "ogg":
            return OggVorbis(stream)
        if extension == "opus":
            return OggOpus(stream)
        if extension == "wav":
            return WAVE(stream)
        return mutagen.File(stream)
    except Exception:  # noqa: BLE001 - malformed files must not crash the bot
        logger.warning("mutagen could not parse .%s, falling back", extension)
        stream.seek(0)
        try:
            return mutagen.File(stream)
        except Exception:  # noqa: BLE001
            return None


def _cover_from_vorbis(audio) -> tuple[bytes | None, str | None]:
    pictures = getattr(audio, "pictures", None)
    if pictures:
        picture = pictures[0]
        return bytes(picture.data), picture.mime or "image/jpeg"

    tags = getattr(audio, "tags", None)
    if tags:
        raw = tags.get("metadata_block_picture")
        if raw:
            try:
                picture = Picture(base64.b64decode(raw[0]))
                return bytes(picture.data), picture.mime or "image/jpeg"
            except Exception:  # noqa: BLE001
                pass
    return None, None


def _cover_from_mp4(tags) -> tuple[bytes | None, str | None]:
    covers = tags.get("covr") if tags else None
    if not covers:
        return None, None
    cover = covers[0]
    mime = "image/png" if cover.imageformat == MP4Cover.FORMAT_PNG else "image/jpeg"
    return bytes(cover), mime


def extract_metadata(data: bytes, filename: str | None) -> AudioMetadata:
    """Read title/artist/album/duration/cover from an audio file."""
    extension = extension_of(filename)
    audio = _open_audio(data, extension)

    title: str | None = None
    artist: str | None = None
    album: str | None = None
    genre: str | None = None
    year: int | None = None
    duration: int | None = None
    cover: bytes | None = None
    cover_mime: str | None = None

    if audio is not None:
        try:
            length = float(getattr(audio.info, "length", 0) or 0)
            if length > 0:
                duration = int(round(length))
        except Exception:  # noqa: BLE001
            duration = None

        tags = getattr(audio, "tags", None)

        if extension in {"mp3", "wav"} or isinstance(tags, ID3):
            id3 = tags if isinstance(tags, ID3) else None
            if id3 is not None:
                title = _clean(id3.get("TIT2"))
                artist = _clean(id3.get("TPE1"))
                album = _clean(id3.get("TALB"))
                genre = _clean(id3.get("TCON"))
                year = _parse_year(_clean(id3.get("TDRC")) or _clean(id3.get("TYER")))
                cover, cover_mime = _id3_cover(id3)
        elif isinstance(audio, FLAC):
            tags = audio.tags
            if tags:
                title = _clean(tags.get("title"))
                artist = _clean(tags.get("artist"))
                album = _clean(tags.get("album"))
                genre = _clean(tags.get("genre"))
                year = _parse_year(_clean(tags.get("date")))
            cover, cover_mime = _cover_from_vorbis(audio)
        elif isinstance(audio, (OggVorbis, OggOpus)):
            tags = audio.tags
            if tags:
                title = _clean(tags.get("title"))
                artist = _clean(tags.get("artist"))
                album = _clean(tags.get("album"))
                genre = _clean(tags.get("genre"))
                year = _parse_year(_clean(tags.get("date")))
            cover, cover_mime = _cover_from_vorbis(audio)
        elif isinstance(audio, MP4):
            tags = audio.tags
            if tags:
                title = _clean(tags.get("\xa9nam"))
                artist = _clean(tags.get("\xa9ART"))
                album = _clean(tags.get("\xa9alb"))
                genre = _clean(tags.get("\xa9gen"))
                year = _parse_year(_clean(tags.get("\xa9day")))
            cover, cover_mime = _cover_from_mp4(tags)

    fallback_title = safe_title_from_filename(filename)

    # "Artist - Title" is a very common filename / untagged convention.
    if not artist and title and " - " in title:
        left, right = title.split(" - ", 1)
        if left.strip() and right.strip():
            artist, title = left.strip(), right.strip()

    return AudioMetadata(
        title=(title or fallback_title)[:200],
        artist=(artist or "Unknown artist")[:200],
        album=album[:200] if album else None,
        genre=genre[:80] if genre else None,
        year=year,
        duration=duration,
        cover_bytes=cover,
        cover_mime=cover_mime,
    )
