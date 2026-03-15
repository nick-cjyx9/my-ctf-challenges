# NewStar 2025 AI Hack Challenge

Challenge initially designed by Henry Tang, code by me.

```sh
docker run -d \
  --name ctf-ai-hack \
  --network bridge \
  --read-only \
  --tmpfs /tmp:rw,uid=1001,gid=1001,mode=700,size=40g \
  --pids-limit=64 \
  --ulimit nofile=64:64 \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  -p 127.0.0.1:5000:5052 \
  --mount type=bind,source=/srv/ctf/flag,target=/home/ctfapp/flllla4ger,readonly \
  ai-hack-image:latest
```
