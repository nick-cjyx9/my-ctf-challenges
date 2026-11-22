#!/bin/sh
set -e

# 特殊处理一下 r2s 的共享网卡网络环境，没有别的意思（
ORDER_API_UPSTREAM="${ORDER_API_UPSTREAM:-127.0.0.1:8080}"
export ORDER_API_UPSTREAM

envsubst '${ORDER_API_UPSTREAM}' \
    < /opt/nginx/conf/upstream.conf.template \
    > /opt/nginx/conf/upstream.conf

echo "[entrypoint] upstream order_api -> ${ORDER_API_UPSTREAM}"

exec "$@"
