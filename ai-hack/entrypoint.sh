#!/bin/sh
chmod 1777 /tmp
exec uwsgi --ini /etc/uwsgi/uwsgi.ini
