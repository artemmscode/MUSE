"""Environment-driven configuration for MUSE Bot."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()


class ConfigError(RuntimeError):
    """Raised when a required environment variable is missing or malformed."""


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ConfigError(
            f"Переменная окружения {name} не задана. "
            f"Скопируйте bot/.env.example в bot/.env и заполните её."
        )
    return value


def _optional(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as error:
        raise ConfigError(f"{name} должна быть целым числом.") from error


def _id_set(owner: str, extra: str) -> frozenset[int]:
    values: set[int] = set()
    for chunk in (owner, *extra.split(",")):
        chunk = chunk.strip()
        if not chunk:
            continue
        try:
            values.add(int(chunk))
        except ValueError as error:
            raise ConfigError(
                "Telegram ID должен состоять только из цифр. "
                "Узнать свой ID можно у @userinfobot."
            ) from error
    return frozenset(values)


@dataclass(frozen=True)
class Settings:
    telegram_bot_token: str
    allowed_user_ids: frozenset[int]
    supabase_url: str
    supabase_service_key: str
    owner_id: str
    site_url: str
    audio_bucket: str = "audio"
    covers_bucket: str = "covers"
    max_upload_bytes: int = 20 * 1024 * 1024
    soundcloud_client_id: str = ""
    soundcloud_client_secret: str = ""
    telegram_proxy: str = ""
    log_level: str = "INFO"
    allowed_extensions: frozenset[str] = field(
        default_factory=lambda: frozenset(
            {"mp3", "wav", "flac", "m4a", "aac", "ogg", "opus", "webm"}
        )
    )
    allowed_mime_types: frozenset[str] = field(
        default_factory=lambda: frozenset(
            {
                "audio/mpeg",
                "audio/mp3",
                "audio/wav",
                "audio/x-wav",
                "audio/wave",
                "audio/flac",
                "audio/x-flac",
                "audio/mp4",
                "audio/m4a",
                "audio/x-m4a",
                "audio/aac",
                "audio/ogg",
                "audio/opus",
                "audio/webm",
                "audio/x-ogg",
                "application/ogg",
            }
        )
    )

    @property
    def soundcloud_api_enabled(self) -> bool:
        return bool(self.soundcloud_client_id)

    @property
    def track_url_template(self) -> str:
        return f"{self.site_url.rstrip('/')}/track/{{track_id}}"

    def track_url(self, track_id: str) -> str:
        return self.track_url_template.format(track_id=track_id)


def load_settings() -> Settings:
    owner_raw = _required("TELEGRAM_OWNER_ID")
    owner_id = _required("MUSE_OWNER_ID")
    site_url = _required("SITE_URL")

    if not site_url.startswith("http"):
        raise ConfigError("SITE_URL должна начинаться с http:// или https://")

    try:
        import uuid

        uuid.UUID(owner_id)
    except ValueError as error:
        raise ConfigError(
            "MUSE_OWNER_ID должен быть UUID пользователя Supabase Auth."
        ) from error

    max_mb = _int("MAX_UPLOAD_MB", 20)
    if max_mb <= 0 or max_mb > 50:
        raise ConfigError("MAX_UPLOAD_MB должна быть от 1 до 50 (лимит Telegram Bot API).")

    return Settings(
        telegram_bot_token=_required("TELEGRAM_BOT_TOKEN"),
        allowed_user_ids=_id_set(owner_raw, _optional("TELEGRAM_ALLOWED_IDS")),
        supabase_url=_required("SUPABASE_URL").rstrip("/"),
        supabase_service_key=_required("SUPABASE_SERVICE_ROLE_KEY"),
        owner_id=owner_id,
        site_url=site_url.rstrip("/"),
        audio_bucket=_optional("AUDIO_BUCKET", "audio"),
        covers_bucket=_optional("COVERS_BUCKET", "covers"),
        max_upload_bytes=max_mb * 1024 * 1024,
        soundcloud_client_id=_optional("SOUNDCLOUD_CLIENT_ID"),
        soundcloud_client_secret=_optional("SOUNDCLOUD_CLIENT_SECRET"),
        telegram_proxy=_optional("TELEGRAM_PROXY"),
        log_level=_optional("LOG_LEVEL", "INFO").upper(),
    )
