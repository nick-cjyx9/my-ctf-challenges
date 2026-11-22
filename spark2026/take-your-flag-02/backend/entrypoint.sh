#!/bin/sh
set -eu

max_attempts=30
attempt=1
while ! php init-db.php; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Database initialization failed after $max_attempts attempts." >&2
    exit 1
  fi

  echo "Database is not ready; retrying in 2 seconds ($attempt/$max_attempts)..." >&2
  attempt=$((attempt + 1))
  sleep 2
done

exec php -S 0.0.0.0:8000 -t public router.php
