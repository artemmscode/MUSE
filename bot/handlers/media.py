"""Audio file and SoundCloud link handlers."""

from __future__ import annotations

import asyncio
import hashlib
import io
import logging
import uuid
from typing import Any

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import Message

from config import Settings
from database.repository import TrackRepository
from keyboards.inline import track_keyboard
from services.audio_metadata import AudioMetadata, extract_metadata
from services.messages import (
    NOT_A_TRACK,
    STATUS_ADDED,
    STATUS_ALREADY,
    STATUS_AUDIO,
    STATUS_METADATA_ONLY,
    STATUS_SOUNDCLOUD,
    STATUS_UPLOAD,
    error_message,
    escape,
    soundcloud_fallback_note,
    status_progress,
    track_caption,
)
from services.soundcloud import SoundCloudError, SoundCloudService, SoundCloudTrack
from services.storage import StorageService
from services.validation import (
    check_audio_file,
    guess_mime_type,
    is_soundcloud_url,
)

logger = logging.getLogger(__name__)
router = Router(name="media")


# ─── shared helpers ─────────────────────────────────────────────────────────


async def _edit_status(message: Message, text: str) -> None:
    try:
        await message.edit_text(text)
    except TelegramBadRequest:
        # The message may have been deleted or already contain identical text.
        pass


async def _send_card(
    bot: Bot,
    chat_id: int,
    track: dict[str, Any],
    settings: Settings,
    *,
    added: bool = True,
    note: str | None = None,
) -> None:
    caption = track_caption(track, added=added, metadata_only_reason=note)
    markup = track_keyboard(track, settings.site_url)
    cover = track.get("cover_url")

    if cover:
        try:
            await bot.send_photo(
                chat_id,
                photo=str(cover),
                caption=caption,
                reply_markup=markup,
            )
            return
        except TelegramBadRequest as error:
            logger.info("sendPhoto failed, falling back to text: %s", error)

    await bot.send_message(chat_id, caption, reply_markup=markup)


async def _store_cover(
    storage: StorageService,
    soundcloud: SoundCloudService,
    owner_id: str,
    track_id: str,
    *,
    embedded: tuple[bytes, str] | None,
    remote_url: str | None,
) -> str | None:
    if embedded and embedded[0]:
        url = await storage.upload_cover(
            owner_id,
            track_id,
            embedded[0],
            embedded[1] or "image/jpeg",
        )
        if url:
            return url

    if remote_url:
        downloaded = await soundcloud.download_cover(remote_url)
        if downloaded:
            url = await storage.upload_cover(
                owner_id,
                track_id,
                downloaded[0],
                downloaded[1],
            )
            if url:
                return url
        return remote_url

    return None


# ─── audio uploads ──────────────────────────────────────────────────────────


async def _handle_file(
    message: Message,
    bot: Bot,
    settings: Settings,
    repository: TrackRepository,
    storage: StorageService,
    soundcloud: SoundCloudService,
    *,
    file_id: str,
    filename: str | None,
    mime_type: str | None,
    file_size: int | None,
) -> None:
    check = check_audio_file(
        filename,
        mime_type,
        file_size,
        allowed_extensions=settings.allowed_extensions,
        allowed_mime_types=settings.allowed_mime_types,
        max_bytes=settings.max_upload_bytes,
    )
    if not check.ok:
        await message.reply(f"⚠️ {escape(check.reason)}")
        return

    status = await message.answer(status_progress(STATUS_AUDIO))

    buffer = io.BytesIO()
    try:
        await bot.download(file_id, destination=buffer)
    except Exception as error:  # noqa: BLE001
        logger.exception("Telegram download failed")
        await _edit_status(status, error_message("Telegram не отдал файл."))
        return

    data = buffer.getvalue()
    if not data:
        await _edit_status(status, error_message("Файл оказался пустым."))
        return
    if len(data) > settings.max_upload_bytes:
        limit = settings.max_upload_bytes // (1024 * 1024)
        await _edit_status(status, error_message(f"Файл больше {limit} МБ."))
        return

    try:
        metadata: AudioMetadata = await asyncio.to_thread(
            extract_metadata, data, filename
        )
    except Exception:  # noqa: BLE001
        logger.exception("Metadata extraction failed")
        metadata = AudioMetadata(title=filename or "Без названия")

    checksum = hashlib.sha256(data).hexdigest()
    existing = await repository.find_existing(checksum=checksum)
    if existing:
        await _edit_status(status, status_progress(STATUS_ALREADY))
        await _send_card(bot, message.chat.id, existing, settings, added=False)
        return

    extension = check.extension or "mp3"
    mime = check.mime_type or guess_mime_type(extension)
    track_id = str(uuid.uuid4())

    await _edit_status(status, status_progress(STATUS_UPLOAD))

    audio_path: str | None = None
    try:
        audio_path = await storage.upload_audio(
            settings.owner_id,
            track_id,
            extension,
            data,
            mime,
        )

        cover_url = await _store_cover(
            storage,
            soundcloud,
            settings.owner_id,
            track_id,
            embedded=(metadata.cover_bytes, metadata.cover_mime or "image/jpeg")
            if metadata.cover_bytes
            else None,
            remote_url=None,
        )

        payload = {
            "id": track_id,
            "title": metadata.title,
            "artist": metadata.artist,
            "album": metadata.album,
            "cover_url": cover_url,
            "duration": metadata.duration,
            "source": "telegram_upload",
            "source_url": None,
            "source_track_id": None,
            "audio_storage_path": audio_path,
            "playback_type": "stored_audio",
            "is_downloadable": True,
            "genre": metadata.genre,
            "year": metadata.year,
            "file_size": len(data),
            "mime_type": mime,
            "checksum": checksum,
        }

        track = await repository.insert_track(payload)
    except Exception as error:  # noqa: BLE001
        logger.exception("Could not store uploaded track")
        await storage.remove_audio(audio_path)
        await _edit_status(status, error_message(str(error)))
        return

    await _edit_status(status, status_progress(STATUS_ADDED))
    await _send_card(bot, message.chat.id, track, settings, added=True)


@router.message(F.audio)
async def handle_audio(
    message: Message,
    bot: Bot,
    settings: Settings,
    repository: TrackRepository,
    storage: StorageService,
    soundcloud: SoundCloudService,
) -> None:
    audio = message.audio
    if audio is None:
        return
    await _handle_file(
        message,
        bot,
        settings,
        repository,
        storage,
        soundcloud,
        file_id=audio.file_id,
        filename=audio.file_name,
        mime_type=audio.mime_type,
        file_size=audio.file_size,
    )


@router.message(F.document)
async def handle_document(
    message: Message,
    bot: Bot,
    settings: Settings,
    repository: TrackRepository,
    storage: StorageService,
    soundcloud: SoundCloudService,
) -> None:
    document = message.document
    if document is None:
        return

    check = check_audio_file(
        document.file_name,
        document.mime_type,
        document.file_size,
        allowed_extensions=settings.allowed_extensions,
        allowed_mime_types=settings.allowed_mime_types,
        max_bytes=settings.max_upload_bytes,
    )
    if not check.ok:
        await message.reply(
            f"⚠️ {escape(check.reason)}\n\n"
            "Пришлите файл как «Аудио» или документ с поддерживаемым расширением."
        )
        return

    await _handle_file(
        message,
        bot,
        settings,
        repository,
        storage,
        soundcloud,
        file_id=document.file_id,
        filename=document.file_name,
        mime_type=document.mime_type,
        file_size=document.file_size,
    )


# ─── SoundCloud links ───────────────────────────────────────────────────────


async def _process_soundcloud(
    message: Message,
    bot: Bot,
    settings: Settings,
    repository: TrackRepository,
    storage: StorageService,
    soundcloud: SoundCloudService,
    url: str,
) -> None:
    status = await message.answer(status_progress(STATUS_SOUNDCLOUD))

    try:
        resolved: SoundCloudTrack = await soundcloud.resolve(url)
    except SoundCloudError as error:
        await _edit_status(status, error_message(str(error)))
        return
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected SoundCloud resolve failure")
        await _edit_status(status, error_message())
        return

    existing = await repository.find_existing(
        source_track_id=resolved.source_track_id,
        source_url=resolved.source_url,
    )
    if existing:
        patch: dict[str, Any] = {}
        if resolved.duration and not existing.get("duration"):
            patch["duration"] = resolved.duration
        if resolved.cover_url and not existing.get("cover_url"):
            patch["cover_url"] = resolved.cover_url
        if resolved.album and not existing.get("album"):
            patch["album"] = resolved.album
        if patch:
            updated = await repository.update_track(str(existing["id"]), patch)
            existing = updated or existing
        await _edit_status(status, status_progress(STATUS_ALREADY))
        await _send_card(bot, message.chat.id, existing, settings, added=False)
        return

    track_id = str(uuid.uuid4())
    audio_path: str | None = None
    download_result: tuple[bytes, str, str] | None = None
    embedded_cover: tuple[bytes, str] | None = None
    checksum: str | None = None
    file_size: int | None = None

    if resolved.is_downloadable:
        await _edit_status(status, status_progress(STATUS_UPLOAD))
        download_result = await soundcloud.download_audio(resolved)

    if download_result:
        data, mime, extension = download_result
        file_size = len(data)
        checksum = hashlib.sha256(data).hexdigest()

        duplicate = await repository.find_existing(checksum=checksum)
        if duplicate:
            await _edit_status(status, status_progress(STATUS_ALREADY))
            await _send_card(bot, message.chat.id, duplicate, settings, added=False)
            return

        try:
            embedded = await asyncio.to_thread(
                extract_metadata, data, f"{track_id}.{extension}"
            )
            if embedded.cover_bytes:
                embedded_cover = (
                    embedded.cover_bytes,
                    embedded.cover_mime or "image/jpeg",
                )
        except Exception:  # noqa: BLE001
            logger.info("Embedded artwork could not be read")

        try:
            audio_path = await storage.upload_audio(
                settings.owner_id,
                track_id,
                extension,
                data,
                mime,
            )
        except Exception as error:  # noqa: BLE001
            logger.exception("SoundCloud audio upload failed")
            await _edit_status(status, error_message(str(error)))
            return
        playback_type = "stored_audio"
        note = None
    else:
        playback_type = "soundcloud_embed"
        note = (
            soundcloud_fallback_note()
            if resolved.is_downloadable
            else "Аудио не сохранено: автор не разрешил скачивание. "
            "Воспроизведение — через официальный плеер SoundCloud."
        )

    cover_url = await _store_cover(
        storage,
        soundcloud,
        settings.owner_id,
        track_id,
        embedded=embedded_cover,
        remote_url=resolved.cover_url,
    )

    payload = {
        "id": track_id,
        "title": resolved.title,
        "artist": resolved.artist,
        "album": resolved.album,
        "cover_url": cover_url,
        "duration": resolved.duration,
        "source": "soundcloud",
        "source_url": resolved.source_url,
        "source_track_id": resolved.source_track_id,
        "audio_storage_path": audio_path,
        "playback_type": playback_type,
        "is_downloadable": bool(download_result),
        "genre": resolved.genre,
        "year": resolved.year,
        "file_size": file_size,
        "mime_type": "audio/mpeg" if download_result else None,
        "checksum": checksum,
    }

    try:
        track = await repository.insert_track(payload)
    except Exception as error:  # noqa: BLE001
        logger.exception("Could not store SoundCloud track")
        await storage.remove_audio(audio_path)
        await _edit_status(status, error_message(str(error)))
        return

    if playback_type == "stored_audio":
        await _edit_status(status, status_progress(STATUS_ADDED))
    else:
        await _edit_status(status, status_progress(STATUS_METADATA_ONLY))

    await _send_card(
        bot,
        message.chat.id,
        track,
        settings,
        added=True,
        note=note,
    )


@router.message(F.text)
async def handle_text(
    message: Message,
    bot: Bot,
    settings: Settings,
    repository: TrackRepository,
    storage: StorageService,
    soundcloud: SoundCloudService,
) -> None:
    text = (message.text or "").strip()
    if not text or text.startswith("/"):
        return

    if not is_soundcloud_url(text):
        await message.reply(NOT_A_TRACK)
        return

    await _process_soundcloud(
        message,
        bot,
        settings,
        repository,
        storage,
        soundcloud,
        text,
    )
