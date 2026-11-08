"""Pure validation helpers — no Telegram, Supabase or network imports."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

SOUNDCLOUD_HOSTS = frozenset(
    {
        "soundcloud.com",
        "www.soundcloud.com",
        "m.soundcloud.com",
        "on.soundcloud.com",
        "soundcloud.app.goo.gl",
    }
)

_SOUNDCLOUD_PATH_RE = re.compile(
    r"^/[A-Za-z0-9_.\-]+(?:/[A-Za-z0-9_.\-]+)*(?:/[A-Za-z0-9_.\-]+)?/?$"
)
_TRACKING_QUERY_PREFIXES = ("utm_", "si", "si_", "ref", "fbclid", "gclid")


def is_soundcloud_url(value: str) -> bool:
    """True when *value* is a plausible public SoundCloud URL."""
    candidate = value.strip()
    if not candidate:
        return False
    if not candidate.lower().startswith(("http://", "https://")):
        candidate = f"https://{candidate}"
    try:
        parsed = urlparse(candidate)
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    host = (parsed.hostname or "").lower()
    if host not in SOUNDCLOUD_HOSTS:
        return False
    if host == "soundcloud.app.goo.gl":
        return bool(parsed.path and parsed.path != "/")
    return bool(parsed.path and parsed.path != "/")


def normalize_soundcloud_url(value: str) -> str:
    """Canonicalise a SoundCloud URL: https, no tracking query, no trailing slash."""
    candidate = value.strip()
    if not candidate.lower().startswith(("http://", "https://")):
        candidate = f"https://{candidate}"
    parsed = urlparse(candidate)
    host = (parsed.hostname or "soundcloud.com").lower()
    path = re.sub(r"/+", "/", parsed.path or "/").rstrip("/")

    kept = []
    for key, item in (pair.split("=", 1) for pair in parsed.query.split("&") if "=" in pair):
        if key.lower().startswith(_TRACKING_QUERY_PREFIXES):
            continue
        kept.append(f"{key}={item}")
    query = f"?{'&'.join(kept)}" if kept else ""
    return f"https://{host}{path}{query}"


def extract_soundcloud_slug(value: str) -> str:
    """Return a stable identifier derived from the URL path."""
    parsed = urlparse(normalize_soundcloud_url(value))
    return parsed.path.strip("/").lower()


def extension_of(filename: str | None) -> str:
    if not filename:
        return ""
    clean = filename.strip().rsplit("/", 1)[-1]
    if "." not in clean:
        return ""
    return clean.rsplit(".", 1)[-1].lower().strip()


@dataclass(frozen=True)
class FileCheck:
    ok: bool
    reason: str = ""
    extension: str = ""
    mime_type: str = ""


def check_audio_file(
    filename: str | None,
    mime_type: str | None,
    size: int | None,
    *,
    allowed_extensions: frozenset[str],
    allowed_mime_types: frozenset[str],
    max_bytes: int,
) -> FileCheck:
    """Validate an incoming Telegram audio/document before downloading it."""
    extension = extension_of(filename)
    mime = (mime_type or "").lower().split(";", 1)[0].strip()

    if size is not None and size <= 0:
        return FileCheck(False, "Файл пустой.", extension, mime)

    if size is not None and size > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        return FileCheck(
            False,
            f"Файл больше {limit_mb} МБ. Telegram Bot API не позволяет "
            "скачивать такие файлы — пришлите версию меньшего размера.",
            extension,
            mime,
        )

    if extension and extension not in allowed_extensions:
        return FileCheck(
            False,
            f"Формат .{extension} не поддерживается. "
            f"Допустимые: {', '.join(sorted(allowed_extensions))}.",
            extension,
            mime,
        )

    if mime and mime not in allowed_mime_types:
        return FileCheck(
            False,
            f"MIME-тип {mime} не является поддерживаемым аудиоформатом.",
            extension,
            mime,
        )

    if not extension and not mime:
        return FileCheck(
            False,
            "Не удалось определить формат файла. Пришлите его как аудио "
            "или документ с расширением .mp3/.flac/.wav/.m4a.",
            extension,
            mime,
        )

    if not extension:
        # Telegram often omits the filename for voice/audio notes.
        extension = {
            "audio/mpeg": "mp3",
            "audio/mp3": "mp3",
            "audio/mp4": "m4a",
            "audio/x-m4a": "m4a",
            "audio/aac": "aac",
            "audio/ogg": "ogg",
            "audio/opus": "opus",
            "audio/flac": "flac",
            "audio/x-flac": "flac",
            "audio/wav": "wav",
            "audio/x-wav": "wav",
            "audio/webm": "webm",
        }.get(mime, "")

    return FileCheck(True, "", extension, mime)


def guess_mime_type(extension: str) -> str:
    return {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "flac": "audio/flac",
        "m4a": "audio/mp4",
        "aac": "audio/aac",
        "ogg": "audio/ogg",
        "opus": "audio/opus",
        "webm": "audio/webm",
    }.get(extension.lower(), "application/octet-stream")


def human_size(size: int | None) -> str:
    if not size or size <= 0:
        return "—"
    units = ("Б", "КБ", "МБ", "ГБ")
    value = float(size)
    index = 0
    while value >= 1024 and index < len(units) - 1:
        value /= 1024
        index += 1
    if index == 0:
        return f"{int(value)} {units[index]}"
    return f"{value:.1f} {units[index]}"


def safe_title_from_filename(filename: str | None) -> str:
    if not filename:
        return "Без названия"
    base = filename.strip().rsplit("/", 1)[-1]
    if "." in base:
        base = base.rsplit(".", 1)[0]
    base = re.sub(r"[_]+", " ", base).strip()
    return base[:120] or "Без названия"
