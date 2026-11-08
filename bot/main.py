"""MUSE Bot entry point.

Run from the `bot/` directory:

    python main.py
"""

from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand
from supabase import create_client

from config import ConfigError, Settings, load_settings
from database.repository import TrackRepository
from handlers import media, start
from middlewares import OwnerOnlyMiddleware
from services.soundcloud import SoundCloudService
from services.storage import StorageService

logger = logging.getLogger("muse.bot")


async def run(settings: Settings) -> None:
    bot = Bot(
        token=settings.telegram_bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dispatcher = Dispatcher()

    supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_service_key,
    )
    repository = TrackRepository(
        settings.supabase_url,
        settings.supabase_service_key,
        settings.owner_id,
    )
    storage = StorageService(
        supabase_client,
        settings.audio_bucket,
        settings.covers_bucket,
    )
    soundcloud = SoundCloudService(
        settings.soundcloud_client_id,
        settings.soundcloud_client_secret,
    )

    dispatcher.message.outer_middleware(OwnerOnlyMiddleware())

    dispatcher["settings"] = settings
    dispatcher["repository"] = repository
    dispatcher["storage"] = storage
    dispatcher["soundcloud"] = soundcloud

    dispatcher.include_router(start.router)
    dispatcher.include_router(media.router)

    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Начать работу с MUSE"),
            BotCommand(command="help", description="Как добавить музыку"),
            BotCommand(command="stats", description="Размер библиотеки"),
        ]
    )

    try:
        await bot.delete_webhook(drop_pending_updates=False)
        logger.info(
            "MUSE Bot started. Owner allowlist: %s. SoundCloud API: %s.",
            ", ".join(str(item) for item in sorted(settings.allowed_user_ids)),
            "enabled" if settings.soundcloud_api_enabled else "oEmbed fallback",
        )
        await dispatcher.start_polling(
            bot,
            allowed_updates=dispatcher.resolve_used_update_types(),
        )
    finally:
        await bot.session.close()


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("aiogram").setLevel(logging.INFO)


def main() -> None:
    try:
        settings = load_settings()
    except ConfigError as error:
        print(f"\n[MUSE] Ошибка конфигурации:\n{error}\n", file=sys.stderr)
        raise SystemExit(1) from error

    configure_logging(settings.log_level)

    try:
        asyncio.run(run(settings))
    except (KeyboardInterrupt, SystemExit):
        logger.info("MUSE Bot stopped.")
    except Exception:  # noqa: BLE001
        logger.exception("MUSE Bot crashed")
        raise


if __name__ == "__main__":
    main()
