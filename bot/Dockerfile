# ════════════════════════════════════════════════════════════════════════════
# MUSE Bot — production image
#
# Build from the repository root:
#   docker build -f bot/Dockerfile -t muse-bot ./bot
#   docker run --env-file bot/.env --name muse-bot --restart unless-stopped muse-bot
#
# FFmpeg is intentionally NOT installed: the bot stores the original file
# byte-for-byte and reads tags with mutagen. No re-encoding happens.
# ════════════════════════════════════════════════════════════════════════════

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

RUN useradd --create-home --shell /usr/sbin/nologin muse \
    && chown -R muse:muse /app
USER muse

CMD ["python", "main.py"]
