"""Access control middleware for the private MUSE bot."""

from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import Message, TelegramObject

from config import Settings
from services.messages import ACCESS_DENIED

logger = logging.getLogger(__name__)


class OwnerOnlyMiddleware(BaseMiddleware):
    """Drops every update from Telegram users outside the allowlist."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        settings: Settings | None = data.get("settings")
        user = getattr(event, "from_user", None)

        if settings is None:
            logger.error("OwnerOnlyMiddleware: settings are missing from handler data")
            return None

        if user is None or user.id not in settings.allowed_user_ids:
            logger.warning(
                "Blocked update from Telegram user %s (@%s)",
                getattr(user, "id", "unknown"),
                getattr(user, "username", "unknown"),
            )
            if isinstance(event, Message):
                await event.answer(ACCESS_DENIED)
            return None

        return await handler(event, data)
