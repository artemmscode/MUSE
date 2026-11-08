"""Tiny HTTP endpoint that keeps a Render web service awake.

Render free web services spin down after 15 minutes without incoming HTTP
traffic. A polling Telegram bot produces no traffic, so it would sleep forever.
This module exposes ``/health`` (and ``/``) so an external uptime monitor can
keep the instance alive.

The server is only started when the ``PORT`` environment variable is set,
which is exactly what Render does for web services. Local runs and background
workers stay polling-only.
"""

from __future__ import annotations

import logging

from aiohttp import web

logger = logging.getLogger("muse.bot")


def create_health_app() -> web.Application:
    """Build the aiohttp application with the health routes."""
    app = web.Application()

    async def health(_: web.Request) -> web.Response:
        return web.json_response({"status": "ok"})

    app.router.add_get("/", health)
    app.router.add_get("/health", health)
    return app


async def start_health_server(port: int) -> web.AppRunner:
    """Bind the health endpoint to 0.0.0.0:port and return the runner."""
    runner = web.AppRunner(create_health_app(), access_log=None)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info("Health endpoint listening on 0.0.0.0:%s", port)
    return runner
