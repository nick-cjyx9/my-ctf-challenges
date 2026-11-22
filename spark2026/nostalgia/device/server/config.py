from __future__ import annotations

import os
import re
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
DEVICE_DIR = SERVER_DIR.parent


def _env_path(key: str, default: Path) -> Path:
    raw = os.environ.get(key)
    return Path(raw).expanduser().resolve() if raw else default.resolve()


data_dir = _env_path("DATA_DIR", Path("/data"))
card_dir = _env_path("CARD_DIR", data_dir / "sdcard")
stage_dir = _env_path("STAGE_DIR", data_dir / "staging")
state_dir = _env_path("STATE_DIR", data_dir / "state")
seed_dir = _env_path("SEED_DIR", DEVICE_DIR / "device-fs")
static_dir = _env_path("STATIC_DIR", DEVICE_DIR / "web" / "dist")

cloud_endpoint = os.environ.get("CLOUD_ENDPOINT", "http://127.0.0.1:8080").rstrip("/")
cloud_health_path = "/actuator/health"
cloud_info_path = "/actuator/info"

# ---------------------------------------------------------------- 设备信息
device_model = "MP3-P111511"
device_serial = "SN-2026-0917-0001"
card_label = "SPARK-MP3"
card_capacity = 2 * 1024 * 1024 * 1024

generated_playlist = "playlist.xml"
playlist_hash_file = state_dir / "playlist.sha"
playlist_state_file = state_dir / "playlist.json"

# ---------------------------------------------------------------- 限额
max_upload_files = 16
max_upload_total = 8 * 1024 * 1024
max_upload_bytes = 64 * 1024
max_media_bytes = 4 * 1024 * 1024
max_xml_bytes = 256 * 1024
max_text_bytes = 256 * 1024

max_entity_bytes = 192 * 1024
max_entity_count = 8
entity_timeout = 3.5
import_budget = 6.0
max_entity_preview = 65535
max_tracks = 200
max_field_chars = 65535

# 限流：(次数, 窗口秒)
rate_upload = (30, 60)
rate_cycle = (10, 60)
rate_import = (20, 60)

# ---------------------------------------------------------------- 文件名 / 类型
# 允许：字母、数字、中日文、. _ -
name_re = re.compile(r"^[A-Za-z0-9\u4e00-\u9fff][A-Za-z0-9._\-\u4e00-\u9fff]{0,62}$")

audio_exts = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"}
ebook_exts = {".txt", ".md"}
text_exts = {
    ".txt",
    ".md",
    ".log",
    ".conf",
    ".ini",
    ".cfg",
    ".lrc",
    ".m3u",
    ".json",
    ".xml",
    ".nfo",
}
image_exts = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}

# 上传白名单；denied 单独列出来是为了给出更明确的报错
allowed_upload_exts = audio_exts | text_exts | image_exts
denied_upload_exts = {
    ".svg",
    ".html",
    ".htm",
    ".xhtml",
    ".js",
    ".mjs",
    ".css",
    ".php",
    ".py",
    ".sh",
    ".so",
    ".bin",
    ".exe",
    ".dll",
    ".jar",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
}

reserved_names: set[str] = set()

# ---------------------------------------------------------------- 环境变量抹除
for _key in list(os.environ):
    if _key == "FLAG" or _key.endswith("_FLAG") or _key.startswith("FLAG_"):
        os.environ.pop(_key, None)
del _key
