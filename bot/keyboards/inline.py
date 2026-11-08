"""Inline keyboards for MUSE Bot."""

from __future__ import annotations

from typing import Any

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def track_keyboard(track: dict[str, Any], site_url: str) -> InlineKeyboardMarkup:
    track_id = str(track.get("id", ""))
    buttons = [
        [
            InlineKeyboardButton(
                text="Открыть в MUSE",
                url=f"{site_url.rstrip('/')}/track/{track_id}",
            )
        ]
    ]
    source_url = track.get("source_url")
    if track.get("source") == "soundcloud" and source_url:
        buttons.append(
            [InlineKeyboardButton(text="Открыть на SoundCloud", url=str(source_url))]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def start_keyboard(site_url: str, bot_username: str | None = None) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text="Открыть MUSE", url=site_url.rstrip("/") + "/")]
    ]
    if bot_username:
        rows.append(
            [
                InlineKeyboardButton(
                    text="Поделиться ботом",
                    url=f"https://t.me/share/url?url=https://t.me/{bot_username}",
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=rows)
