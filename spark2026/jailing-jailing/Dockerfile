# ---- flag broker + readflag client ------------------------------------------
FROM debian:bookworm-slim AS tools

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY broker.c readflag.c ./
RUN gcc -static -O2 -s -o broker   broker.c \
    && gcc -static -O2 -s -o readflag readflag.c

# ---- jail root filesystem ---------------------------------------------------
FROM python:3.12-slim AS app

# ---- redpwn/jail ------------------------------------------------------------
FROM pwn.red/jail

# everything from the python image becomes the jail's "/"
COPY --from=app / /srv
RUN mkdir -p /srv/app

# the challenge itself
COPY run.sh  /srv/app/run
COPY jail.py /srv/app/jail.py
RUN chmod 0755 /srv/app/run && chmod 0644 /srv/app/jail.py

# /readflag (client, lives in the jail) and the broker (root, outside the jail)
COPY --from=tools /build/readflag /srv/readflag
COPY --from=tools /build/broker   /jail/broker

# /flag: only root can read it, the broker is the only root reader
COPY flag /srv/flag
RUN chmod 0755 /srv/readflag /jail/broker \
    && chown root:root /srv/flag \
    && chmod 0400 /srv/flag

COPY entrypoint.sh /jail/entrypoint.sh
RUN chmod 0755 /jail/entrypoint.sh

# start the broker, then run redpwn/jail
CMD ["/jail/entrypoint.sh"]

# Python needs a bit more room than the redpwn defaults
ENV JAIL_PORT=5000 \
    JAIL_MEM=128M \
    JAIL_PIDS=64 \
    JAIL_TIME=120 \
    JAIL_CPU=1000 \
    JAIL_TMP_SIZE=16M \
    JAIL_CONNS_PER_IP=8
