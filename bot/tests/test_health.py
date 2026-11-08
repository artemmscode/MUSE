"""Health endpoint tests (used by Render uptime checks)."""

from __future__ import annotations

import asyncio

from aiohttp import ClientSession
from aiohttp.test_utils import TestServer

from health import create_health_app


def test_health_endpoint_responds_ok() -> None:
    async def scenario() -> tuple[int, dict[str, str]]:
        async with TestServer(create_health_app()) as server:
            async with ClientSession() as session:
                async with session.get(server.make_url("/health")) as response:
                    return response.status, await response.json()

    status, payload = asyncio.run(scenario())

    assert status == 200
    assert payload == {"status": "ok"}


def test_root_endpoint_responds_ok() -> None:
    async def scenario() -> int:
        async with TestServer(create_health_app()) as server:
            async with ClientSession() as session:
                async with session.get(server.make_url("/")) as response:
                    return response.status

    assert asyncio.run(scenario()) == 200
