#include <stdio.h>

// build: gcc -static -O2 -s -o readflag readflag.c

int main(void)
{
    char s[1024] = {0};
    FILE *fp = fopen("/flag", "rb");
    if (fp == NULL)
    {
        fprintf(stderr, "readflag: cannot open /flag\n");
        return 1;
    }
    size_t n = fread(s, 1, sizeof(s) - 1, fp);
    fclose(fp);
    fwrite(s, 1, n, stdout);
    return 0;
}
