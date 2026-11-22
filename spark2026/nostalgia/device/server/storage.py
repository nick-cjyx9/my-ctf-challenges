from __future__ import annotations

import re
import shutil
import threading
from pathlib import Path

from . import config
from .mp3 import duration_of


class DeviceError(Exception):
    def __init__(self, message: str, status: int = 400, code: str = "bad_request"):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code


# ------------------------------------------------------------------ 基础
def ensure_dirs() -> None:
    for d in (config.card_dir, config.stage_dir, config.state_dir):
        d.mkdir(parents=True, exist_ok=True)


def safe_join(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not config.name_re.match(name):
        raise DeviceError("不是这里", 400, "nice_try_but_not_here")
    root = root.resolve()
    target = root / name
    resolved = target.resolve()
    if resolved.parent != root:
        raise DeviceError("不是这里", 400, "nice_try_but_not_here")
    if target.is_symlink():
        raise DeviceError("不是这里", 400, "nice_try_but_not_here")
    return resolved


def kind_of(name: str) -> str:
    ext = Path(name).suffix.lower()
    if ext in config.audio_exts:
        return "audio"
    if ext == ".xml":
        return "xml"
    if ext in {".conf", ".ini", ".cfg"}:
        return "conf"
    if ext in {".txt", ".md", ".log", ".nfo"}:
        return "text"
    if ext in config.image_exts:
        return "image"
    return "other"


_KIND_RANK = {"audio": 0, "text": 1, "xml": 2, "conf": 3, "image": 4, "other": 5}


def natural_key(name: str):
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", name)
    ]


def entry(name: str, path: Path) -> dict:
    st = path.stat()
    kind = kind_of(name)
    ext = Path(name).suffix.lower()
    return {
        "name": name,
        "size": st.st_size,
        "mtime": int(st.st_mtime),
        "kind": kind,
        "duration": duration_of(path) if kind == "audio" else 0,
        "playable": kind == "audio",
        "previewable": ext in config.text_exts and st.st_size <= config.max_text_bytes,
        "ebook": ext in config.ebook_exts,
        "uploadable": ext in config.allowed_upload_exts,
    }


def _iter_files(root: Path):
    if not root.is_dir():
        return
    for p in root.iterdir():
        if p.is_file() and not p.is_symlink():
            yield p


# ------------------------------------------------------------------ 种子
def seed_card() -> list[str]:
    """首次启动把镜像内的种子文件铺到 TF 卡上；已有的文件不动。"""
    ensure_dirs()
    seeded = []
    if not config.seed_dir.is_dir():
        return seeded
    for src in sorted(_iter_files(config.seed_dir)):
        if not config.name_re.match(src.name):
            continue
        dest = config.card_dir / src.name
        if dest.exists():
            continue
        shutil.copy2(src, dest)
        seeded.append(src.name)
    return seeded


# ------------------------------------------------------------------ 卡内容
def card_entries() -> list[dict]:
    ensure_dirs()
    items = [entry(p.name, p) for p in _iter_files(config.card_dir)]
    items.sort(key=lambda e: (_KIND_RANK.get(e["kind"], 9), natural_key(e["name"])))
    return items


def card_audio_entries() -> list[dict]:
    return [e for e in card_entries() if e["kind"] == "audio"]


def card_usage() -> dict:
    entries = card_entries()
    used = sum(e["size"] for e in entries)
    return {
        "label": config.card_label,
        "capacity": config.card_capacity,
        "used": used,
        "free": max(0, config.card_capacity - used),
        "files": len(entries),
    }


def read_text(name: str) -> dict:
    path = safe_join(config.card_dir, name)
    if not path.is_file():
        raise DeviceError("文件不存在", 404, "not_found")
    ext = path.suffix.lower()
    if ext not in config.text_exts:
        raise DeviceError("该文件不是文本文件，无法预览", 415, "not_text")
    size = path.stat().st_size
    if size > config.max_text_bytes:
        raise DeviceError(
            f"文件超过 {config.max_text_bytes // 1024}KB，无法预览", 413, "too_large"
        )
    raw = path.read_bytes()
    if b"\x00" in raw[:8192]:
        raise DeviceError("该文件不是文本文件，无法预览", 415, "not_text")
    return {"name": name, "size": size, "text": raw.decode("utf-8", "replace")}


def audio_path(name: str) -> Path:
    path = safe_join(config.card_dir, name)
    if not path.is_file():
        raise DeviceError("文件不存在", 404, "not_found")
    if path.suffix.lower() not in config.audio_exts:
        raise DeviceError("不是可播放的音频文件", 415, "not_audio")
    return path


# ------------------------------------------------------------------ 暂存区
def stage_entries() -> list[dict]:
    ensure_dirs()
    items = [entry(p.name, p) for p in _iter_files(config.stage_dir)]
    items.sort(key=natural_key_key)
    return items


def natural_key_key(e: dict):
    return natural_key(e["name"])


def stage_usage() -> dict:
    entries = stage_entries()
    return {
        "files": entries,
        "count": len(entries),
        "bytes": sum(e["size"] for e in entries),
        "max_files": config.max_upload_files,
        "max_bytes": config.max_upload_total,
        "max_file_bytes": config.max_upload_bytes,
        "max_media_bytes": config.max_media_bytes,
        "allowed_exts": sorted(config.allowed_upload_exts),
    }


def stage_upload(file_storage) -> dict:
    """校验并落盘一个上传文件（只在 TF 卡拔出时才会被调用）。"""
    ensure_dirs()
    raw_name = file_storage.filename or ""
    raw_name = re.sub(r"^[A-Za-z]:\\fakepath\\", "", raw_name)
    if re.search(r"[\\/:]", raw_name):
        raise DeviceError("文件名不能包含路径分隔符", 400, "bad_name")
    name = raw_name.strip()
    if not name:
        raise DeviceError("文件名为空", 400, "bad_name")
    if not config.name_re.match(name):
        raise DeviceError(
            "不是这里（只允许字母/数字/中日文与 . _ -，1-63 字符）", 400, "nice_try_but_not_here"
        )

    ext = Path(name).suffix.lower()
    if ext in config.denied_upload_exts:
        raise DeviceError(f"出于安全策略，不允许上传 {ext} 文件", 415, "bad_ext")
    if ext not in config.allowed_upload_exts:
        raise DeviceError(f"不支持的文件类型 {ext or '（无扩展名）'}", 415, "bad_ext")

    limit = (
        config.max_media_bytes if ext in config.audio_exts else config.max_upload_bytes
    )
    data = file_storage.read(limit + 1)
    if len(data) > limit:
        raise DeviceError(f"文件超过 {limit // 1024}KB 上限", 413, "too_large")

    entries = stage_entries()
    target = safe_join(config.stage_dir, name)
    if not target.exists() and len(entries) + 1 > config.max_upload_files:
        raise DeviceError(
            f"暂存区最多 {config.max_upload_files} 个文件", 413, "too_many_files"
        )
    used = sum(e["size"] for e in entries if e["name"] != name)
    if used + len(data) > config.max_upload_total:
        raise DeviceError(
            f"暂存区总容量上限 {config.max_upload_total // (1024 * 1024)}MB",
            413,
            "quota_exceeded",
        )

    target.write_bytes(data)
    return {"name": name, "size": len(data)}


def stage_delete(name: str) -> None:
    path = safe_join(config.stage_dir, name)
    if path.is_file():
        path.unlink()


def stage_clear() -> int:
    removed = 0
    for p in _iter_files(config.stage_dir):
        p.unlink()
        removed += 1
    return removed


# ------------------------------------------------------------------ 插拔
_lock = threading.RLock()
_tf_inserted = True


def tf_inserted() -> bool:
    return _tf_inserted


def eject() -> None:
    global _tf_inserted
    with _lock:
        _tf_inserted = False


def insert() -> dict:
    """把暂存区合并进 TF 卡。"""
    global _tf_inserted
    with _lock:
        ensure_dirs()
        added, renamed, rejected = [], [], []
        for src in sorted(_iter_files(config.stage_dir)):
            name = src.name
            ext = Path(name).suffix.lower()
            if (
                not config.name_re.match(name)
                or ext not in config.allowed_upload_exts
                or name.lower() in config.reserved_names
            ):
                rejected.append(name)
                src.unlink()
                continue
            if (config.card_dir / name).exists():
                stem, suffix = Path(name).stem, Path(name).suffix
                i = 1
                # 只能用名字白名单里允许的字符，否则改出来的名字自己都读不了
                while (config.card_dir / f"{stem}-{i}{suffix}").exists():
                    i += 1
                new_name = f"{stem}-{i}{suffix}"
                renamed.append({"from": name, "to": new_name})
                name = new_name
            shutil.move(str(src), str(config.card_dir / name))
            added.append(name)
        _tf_inserted = True
        return {"added": added, "renamed": renamed, "rejected": rejected}
