"""Start, help and stats commands."""

from __future__ import annotations

import logging

from aiogram import Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from config import Settings
from database.repository import TrackRepository
from keyboards.inline import start_keyboard
from services.messages import HELP, WELCOME, stats_message

logger = logging.getLogger(__name__)
router = Router(name="start")


@router.message(CommandStart())
async def handle_start(
    message: Message,
    settings: Settings,
    repository: TrackRepository,
) -> None:
    user = message.from_user
    if user is not None:
        await repository.link_telegram_identity(
            telegram_user_id=user.id,
            display_name=user.full_name or user.username or "Listener",
        )

    await message.answer(
        WELCOME,
        reply_markup=start_keyboard(settings.site_url),
    )


@router.message(Command("help"))
async def handle_help(message: Message) -> None:
    await message.answer(HELP)


@router.message(Command("stats"))
async def handle_stats(message: Message, repository: TrackRepository) -> None:
    stats = await repository.stats()
    await message.answer(stats_message(stats))
