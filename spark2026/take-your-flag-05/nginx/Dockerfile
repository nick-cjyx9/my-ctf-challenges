FROM debian:bookworm-slim AS nginx-builder

ARG NGINX_VERSION=1.31.6

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl build-essential libpcre2-dev; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN set -eux; \
    curl -fsSL -o nginx.tar.gz "https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz"; \
    tar xzf nginx.tar.gz; \
    cd "nginx-${NGINX_VERSION}"; \
    ./configure \
        --prefix=/opt/nginx \
        --with-http_json_module \
        --without-http_gzip_module \
        --without-http_ssi_module \
        --without-http_userid_module \
        --without-http_auth_basic_module \
        --without-http_autoindex_module \
        --without-http_empty_gif_module \
        --without-http_memcached_module; \
    make -j"$(nproc)"; \
    make install


FROM debian:bookworm-slim

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends libpcre2-8-0 gettext-base; \
    rm -rf /var/lib/apt/lists/*

COPY --from=nginx-builder /opt/nginx /opt/nginx

COPY nginx.conf /opt/nginx/conf/nginx.conf
COPY upstream.conf.template /opt/nginx/conf/upstream.conf.template
COPY dist /opt/nginx/html
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && mkdir -p /var/log/nginx

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/opt/nginx/sbin/nginx"]
