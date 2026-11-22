/*
 * jailing-jailing flag broker.
 *
 * Runs as root *outside* the jail (started by /jail/entrypoint.sh) and is the
 * only process that can read /srv/flag.  The jail process (uid 1000, single
 * mapped uid, MS_NOSUID, PR_SET_NO_NEW_PRIVS) cannot read the flag directly;
 * it can only ask this broker through the unix socket, which is what
 * /readflag does.
 *
 * build: gcc -static -O2 -s -o broker broker.c
 */
#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/un.h>
#include <unistd.h>

#ifndef SOCK_CLOEXEC
#define SOCK_CLOEXEC 0
#endif
#ifndef O_CLOEXEC
#define O_CLOEXEC 0
#endif

#define BROKER_SOCK "/srv/app/.readflag.sock"
#define FLAG_FILE "/srv/flag"

static int write_all(int fd, const char *buf, size_t len)
{
    while (len > 0)
    {
        ssize_t n = write(fd, buf, len);
        if (n < 0)
        {
            if (errno == EINTR)
                continue;
            return -1;
        }
        buf += n;
        len -= (size_t)n;
    }
    return 0;
}

static void serve(int fd)
{
    char buf[4096];
    int f = open(FLAG_FILE, O_RDONLY | O_CLOEXEC);
    if (f < 0)
    {
        fprintf(stderr, "broker: open %s: %s\n", FLAG_FILE, strerror(errno));
        return;
    }
    ssize_t n;
    while ((n = read(f, buf, sizeof buf)) > 0)
        if (write_all(fd, buf, (size_t)n) < 0)
            break;
    close(f);
}

int main(void)
{
    signal(SIGPIPE, SIG_IGN);
    signal(SIGCHLD, SIG_IGN);

    unlink(BROKER_SOCK);

    int s = socket(AF_UNIX, SOCK_STREAM | SOCK_CLOEXEC, 0);
    if (s < 0)
    {
        perror("broker: socket");
        return 1;
    }

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof addr);
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, BROKER_SOCK, sizeof(addr.sun_path) - 1);

    if (bind(s, (const struct sockaddr *)&addr, sizeof addr) < 0)
    {
        perror("broker: bind");
        return 1;
    }
    chmod(BROKER_SOCK, 0666);

    if (listen(s, 32) < 0)
    {
        perror("broker: listen");
        return 1;
    }

    for (;;)
    {
        int c = accept(s, NULL, NULL);
        if (c < 0)
        {
            if (errno == EINTR)
                continue;
            perror("broker: accept");
            return 1;
        }
        serve(c);
        close(c);
    }
}
