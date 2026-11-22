#!/bin/sh
# Container entrypoint: start the root-owned flag broker, then hand over to
# redpwn/jail (which drops to uid 1000 and execs nsjail for every connection).
set -eu

/jail/broker >/dev/null 2>&1 &
broker_pid=$!

# redpwn/jail delegates the cgroup root by moving itself into a child cgroup and
# then enabling controllers on the (by then empty) root.  A stray process in
# that root makes that write fail with EBUSY, so park the broker in its own
# child cgroup first.  Best effort: harmless on cgroup v1 / if the fs is RO.
if [ -w /sys/fs/cgroup/cgroup.procs ]; then
    mkdir -p /sys/fs/cgroup/broker 2>/dev/null || true
    printf '%s' "$broker_pid" >/sys/fs/cgroup/broker/cgroup.procs 2>/dev/null || true
fi

i=0
while [ ! -S /srv/app/.readflag.sock ]; do
    i=$((i + 1))
    if [ "$i" -gt 30 ]; then
        echo "entrypoint: flag broker did not start" >&2
        exit 1
    fi
    sleep 1
done

exec /jail/run
