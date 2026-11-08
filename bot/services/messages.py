"""Russian, HTML-safe copy for MUSE Bot."""

from __future__ import annotations

import html
from typing import Any

from .validation import human_size

SOURCE_LABELS = {
    "soundcloud": "SoundCloud",
    "telegram_upload": "Telegram",
    "local": "Локальный файл",
}

PLAYBACK_LABELS = {
    "stored_audio": "аудио в MUSE",
    "soundcloud_embed": "официальный плеер SoundCloud",
    "unavailable": "недоступно",
}


def escape(value: str | None) -> str:
    return html.escape(value or "", quote=False)


def format_duration(seconds: int | None) -> str:
    if not seconds or seconds <= 0:
        return "—"
    minutes, rest = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{rest:02d}"
    return f"{minutes}:{rest:02d}"


WELCOME = (
    "<b>MUSE</b>\n"
    "<i>Личная музыкальная библиотека</i>\n\n"
    "Пришлите ссылку на трек SoundCloud или аудиофайл — "
    "я сохраню его в вашей библиотеке.\n\n"
    "Поддерживаются MP3, WAV, FLAC, M4A, AAC, OGG, OPUS и WEBM.\n\n"
    "Команды:\n"
    "/start — это сообщение\n"
    "/help — как всё устроено\n"
    "/stats — размер библиотеки"
)

HELP = (
    "<b>Как добавить музыку</b>\n\n"
    "<b>1. Ссылка SoundCloud</b>\n"
    "Отправьте ссылку вида <code>https://soundcloud.com/artist/track</code>. "
    "Я получу название, исполнителя, обложку и длительность. "
    "Если автор разрешил скачивание, аудио будет сохранено в MUSE. "
    "Иначе трек откроется через официальный плеер SoundCloud — "
    "без обхода ограничений.\n\n"
    "<b>2. Аудиофайл</b>\n"
    "Отправьте файл как «Аудио» или «Файл». Я прочитаю ID3-теги, "
    "обложку и длительность, а затем загружу оригинал в приватное хранилище.\n\n"
    "<b>3. Несколько файлов</b>\n"
    "Можно отправлять их подряд — каждый станет отдельным треком.\n\n"
    "<b>Приватность</b>\n"
    "Доступ к библиотеке есть только у вашего Telegram ID и вашего аккаунта MUSE."
)

ACCESS_DENIED = (
    "<b>Доступ закрыт</b>\n\n"
    "Это приватная библиотека. Ваш Telegram ID не входит в список разрешённых.\n"
    "Если это ошибка — добавьте ID в <code>TELEGRAM_ALLOWED_IDS</code> "
    "в настройках бота и перезапустите его."
)

NOT_A_TRACK = (
    "Пока я понимаю только ссылки SoundCloud и аудиофайлы.\n\n"
    "Отправьте ссылку вида <code>https://soundcloud.com/…</code> "
    "или пришлите MP3 / FLAC / WAV / M4A.\n\n"
    "Подсказка: /help"
)

STATUS_SOUNDCLOUD = "🔎 Получаю информацию о треке…"
STATUS_AUDIO = "🎧 Обрабатываю аудио…"
STATUS_UPLOAD = "☁️ Загружаю в MUSE…"
STATUS_ADDED = "✅ Трек добавлен"
STATUS_ALREADY = "✓ Трек уже в библиотеке"
STATUS_METADATA_ONLY = "🔗 Метаданные сохранены"


def status_progress(step: str) -> str:
    return f"<b>MUSE</b>\n\n{step}"


def track_caption(
    track: dict[str, Any],
    *,
    added: bool = True,
    metadata_only_reason: str | None = None,
) -> str:
    title = escape(str(track.get("title") or "Без названия")[:180])
    artist = escape(str(track.get("artist") or "Unknown artist")[:180])
    album = escape(str(track["album"])[:120]) if track.get("album") else None
    duration = format_duration(track.get("duration"))
    source = SOURCE_LABELS.get(str(track.get("source")), "MUSE")
    playback = PLAYBACK_LABELS.get(str(track.get("playback_type")), "—")

    heading = "Трек добавлен" if added else "Трек уже в библиотеке"
    lines = [
        "<b>MUSE</b>",
        f"<i>{heading}</i>",
        "",
        f"<b>{title}</b>",
        artist,
    ]
    if album:
        lines.append(f"<i>{album}</i>")
    lines.extend(
        [
            "",
            f"Длительность · {duration}",
            f"Источник · {source}",
            f"Воспроизведение · {playback}",
        ]
    )
    if metadata_only_reason:
        lines.extend(["", f"<i>{escape(metadata_only_reason)}</i>"])
    return "\n".join(lines)


def file_card_caption(
    *,
    title: str,
    artist: str,
    duration: int | None,
    size: int | None,
    mime_type: str | None,
) -> str:
    return (
        "<b>MUSE</b>\n"
        "<i>Трек добавлен</i>\n\n"
        f"<b>{escape(title)}</b>\n"
        f"{escape(artist)}\n\n"
        f"Длительность · {format_duration(duration)}\n"
        f"Размер · {human_size(size)}\n"
        f"Формат · {escape((mime_type or 'audio').split('/')[-1].upper())}"
    )


def duplicate_message(title: str) -> str:
    return f"«{escape(title)}» уже есть в библиотеке — обновил метаданные."


def stats_message(stats: dict[str, int]) -> str:
    return (
        "<b>MUSE</b>\n"
        "<i>Ваша библиотека</i>\n\n"
        f"Треков · {stats.get('tracks', 0)}\n"
        f"Плейлистов · {stats.get('playlists', 0)}\n\n"
        "Добавить музыку — просто пришлите ссылку или файл."
    )


def error_message(detail: str | None = None) -> str:
    base = (
        "<b>Не получилось</b>\n\n"
        "Что-то пошло не так при обработке. Попробуйте ещё раз."
    )
    if detail:
        return f"{base}\n\n<i>{escape(detail)}</i>"
    return base


def soundcloud_fallback_note() -> str:
    return (
        "Автор не разрешил скачивание, поэтому аудио не сохранялось. "
        "Трек будет играть через официальный плеер SoundCloud."
    )
