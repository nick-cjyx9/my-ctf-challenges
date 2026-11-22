#!/bin/sh
# redpwn/jail executes /app/run for every connection, with cwd=/app.
exec /usr/local/bin/python3 -u /app/jail.py
