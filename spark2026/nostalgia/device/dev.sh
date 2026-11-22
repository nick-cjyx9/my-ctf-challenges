#!/bin/sh
set -eu
cd "$(dirname "$0")"

export DATA_DIR="${DATA_DIR:-$PWD/.devdata}"
export SEED_DIR="$PWD/device-fs"
export STATIC_DIR="$PWD/web/dist"
export CLOUD_ENDPOINT="${CLOUD_ENDPOINT:-http://127.0.0.1:8080}"

exec python -m flask --app server.app run --host 127.0.0.1 --port 8000
