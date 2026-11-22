#!/bin/sh
set -eu

for name in $(env | cut -d= -f1); do
  case "$name" in
    FLAG | *_FLAG | FLAG_*) unset "$name" || true ;;
  esac
done

cd /app

python - <<'PY'
from server import playlist, storage

storage.ensure_dirs()
print('[nostalgia] seeded:', storage.seed_card())
print('[nostalgia] playlist generated:', playlist.generate_if_untouched())
PY

exec gunicorn \
  --workers 1 \
  --threads 8 \
  --timeout 30 \
  --access-logfile - \
  --error-logfile - \
  --bind 0.0.0.0:8000 \
  server.app:app
