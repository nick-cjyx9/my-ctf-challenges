# ---- stage 1: build the Vue frontend ----
FROM node:24-alpine AS web
WORKDIR /web
RUN npm i -g pnpm@11.24.0
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

# ---- stage 2: runtime ----
FROM python:3.13-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATA_DIR=/data \
    CARD_DIR=/data/sdcard \
    STAGE_DIR=/data/staging \
    STATE_DIR=/data/state \
    SEED_DIR=/app/device-fs \
    STATIC_DIR=/app/static

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./server/
COPY device-fs/ ./device-fs/
COPY entrypoint.sh ./
COPY --from=web /web/dist ./static/

RUN chmod +x entrypoint.sh \
 && useradd --create-home --uid 1000 --shell /usr/sbin/nologin mp3 \
 && mkdir -p /data/sdcard /data/staging /data/state \
 && chown -R mp3:mp3 /data /app

USER mp3
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
