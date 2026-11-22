#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

/* build: gcc -static -O2 -s -o readflag readflag.c
 *
 * Installed in the jail as /readflag.  It just asks the root-owned broker
 * (running outside the jail) for the contents of /flag, which the jail itself
 * can never open.
 */
#define BROKER_SOCK "/app/.readflag.sock"

int main(void)
{
    int s = socket(AF_UNIX, SOCK_STREAM, 0);
    if (s < 0)
    {
        perror("readflag: socket");
        return 1;
    }

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof addr);
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, BROKER_SOCK, sizeof(addr.sun_path) - 1);

    if (connect(s, (const struct sockaddr *)&addr, sizeof addr) < 0)
    {
        fprintf(stderr, "readflag: cannot reach flag broker (%s): %s\n",
                BROKER_SOCK, strerror(errno));
        return 1;
    }

    char buf[4096];
    ssize_t n;
    while ((n = read(s, buf, sizeof buf)) > 0)
        if (write(STDOUT_FILENO, buf, (size_t)n) != n)
            break;
    close(s);
    return 0;
}
