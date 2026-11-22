from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from lxml import etree

from . import config, storage
from .storage import DeviceError
from .xxe import DeviceEntityResolver

log = logging.getLogger("nostalgia.playlist")


# ------------------------------------------------------------------ 安全解析器
def safe_parser() -> etree.XMLParser:
    return etree.XMLParser(
        load_dtd=False,
        resolve_entities=False,
        no_network=True,
        huge_tree=False,
        recover=True,
    )


# ------------------------------------------------------------------ 生成
def _comment() -> str:
    return "<!-- SparkMP3 Playlist，由设备自动生成，请勿删除 -->"


def build_playlist_xml() -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', _comment()]
    lines.append(
        f'<playlist version="2" generated="{now}" device="{config.device_model}">'
    )
    for e in storage.card_audio_entries():
        stem = Path(e["name"]).stem
        lines += [
            "  <track>",
            f"    <title>{_esc(stem)}</title>",
            "    <artist>Unknown Artist</artist>",
            "    <album>TF Card</album>",
            f"    <path>{_esc(e['name'])}</path>",
            f"    <duration>{int(e.get('duration') or 0)}</duration>",
            f"    <bytes>{e['size']}</bytes>",
            "  </track>",
        ]
    lines.append("</playlist>")
    return "\n".join(lines) + "\n"


def _esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _generated_hash() -> str | None:
    try:
        return config.playlist_hash_file.read_text().strip()
    except OSError:
        return None


def _write_generated_hash(content: str) -> None:
    config.playlist_hash_file.parent.mkdir(parents=True, exist_ok=True)
    config.playlist_hash_file.write_text(hashlib.sha256(content.encode()).hexdigest())


def generate_if_untouched(force: bool = False) -> bool:
    storage.ensure_dirs()
    path = config.card_dir / config.generated_playlist
    if path.exists() and not force:
        current = hashlib.sha256(path.read_bytes()).hexdigest()
        if current != _generated_hash():
            return False  # 选手自己放的，保留
    content = build_playlist_xml()
    path.write_text(content, encoding="utf-8")
    _write_generated_hash(content)
    return True


# ------------------------------------------------------------------ 当前播放列表
def _read_state() -> dict | None:
    try:
        return json.loads(config.playlist_state_file.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _write_state(source: str, tracks: list[dict]) -> None:
    config.playlist_state_file.parent.mkdir(parents=True, exist_ok=True)
    config.playlist_state_file.write_text(
        json.dumps(
            {"source": source, "imported_at": int(time.time()), "tracks": tracks},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def clear_state() -> None:
    config.playlist_state_file.unlink(missing_ok=True)


def current_playlist() -> dict:
    state = _read_state()
    if state and isinstance(state.get("tracks"), list):
        return {"source": state.get("source") or "imported", "tracks": state["tracks"]}

    from_file = _tracks_from_playlist_file()
    if from_file:
        return {"source": config.generated_playlist, "tracks": from_file}
    return {"source": "card-scan", "tracks": _tracks_from_card()}


def _tracks_from_playlist_file() -> list[dict]:
    path = config.card_dir / config.generated_playlist
    if not path.is_file() or path.stat().st_size > config.max_xml_bytes:
        return []
    try:
        root = etree.fromstring(path.read_bytes(), safe_parser())
    except (etree.XMLSyntaxError, OSError, ValueError):
        return []
    tracks, _ = extract_tracks(root)
    return tracks


def _tracks_from_card() -> list[dict]:
    tracks = []
    for e in storage.card_audio_entries():
        tracks.append(
            {
                "title": Path(e["name"]).stem,
                "artist": "Unknown Artist",
                "album": "TF Card",
                "path": e["name"],
                "bytes": e["size"],
                "duration": int(e.get("duration") or 0),
            }
        )
    return tracks


# ------------------------------------------------------------------ 解析结果抽取
def _field(node, *names: str) -> str:
    for name in names:
        el = node.find(name)
        if el is None:
            continue
        text = "".join(el.itertext()).strip()
        if text:
            return text
    return ""


def extract_tracks(root) -> tuple[list[dict], list[str]]:
    warnings: list[str] = []
    nodes = list(root.iter("track")) or list(root.iter("song"))
    if not nodes:
        warnings.append("播放列表里没有找到 <track> 节点")

    tracks: list[dict] = []
    for i, node in enumerate(nodes):
        if len(tracks) >= config.max_tracks:
            warnings.append(f"曲目超过 {config.max_tracks} 首，多余的已忽略")
            break
        path = _field(node, "path", "file", "src")
        title = _field(node, "title", "name") or (Path(path).stem if path else "")
        if not title:
            title = f"Track {i + 1}"
            warnings.append(f"第 {i + 1} 首缺少标题，已自动编号")
        tracks.append(
            {
                "title": title[: config.max_field_chars],
                "artist": (_field(node, "artist", "author") or "Unknown Artist")[
                    : config.max_field_chars
                ],
                "album": (_field(node, "album") or "Imported")[
                    : config.max_field_chars
                ],
                "path": path[: config.max_field_chars],
                "duration": _to_int(_field(node, "duration", "seconds")),
                "bytes": _to_int(_field(node, "bytes", "size")),
            }
        )
    return tracks, warnings


def _to_int(text: str) -> int:
    try:
        return max(0, int(float(text)))
    except (TypeError, ValueError):
        return 0


# ------------------------------------------------------------------ 导入（XXE）
def import_xml(name: str) -> dict:
    storage.ensure_dirs()
    if not name.lower().endswith(".xml"):
        raise DeviceError("只能导入 .xml 播放列表", 415, "bad_ext")

    path = storage.safe_join(config.card_dir, name)
    if not path.is_file():
        raise DeviceError("文件不存在，请先通过 TF 卡传入", 404, "not_found")
    size = path.stat().st_size
    if size > config.max_xml_bytes:
        raise DeviceError(
            f"播放列表超过 {config.max_xml_bytes // 1024}KB", 413, "too_large"
        )

    resolver = DeviceEntityResolver()
    parser = etree.XMLParser(
        load_dtd=True, resolve_entities=True, no_network=True, huge_tree=False
    )
    parser.resolvers.add(resolver)

    try:
        root = etree.fromstring(path.read_bytes(), parser)
    except etree.XMLSyntaxError as exc:
        # 不回显 libxml2 的原始报错：里面会有实体 URL 与服务端路径
        log.info(
            "播放列表解析失败 %s：%s | entities=%s",
            name,
            _sanitize(str(exc)),
            _entity_summary(resolver),
        )
        return {"ok": False, "source": name, "error": "播放列表格式不正确"}

    tracks, warnings = extract_tracks(root)
    log.info(
        "导入 %s：%d 首 | entities=%s", name, len(tracks), _entity_summary(resolver)
    )
    if tracks:
        _write_state(name, tracks)
    return {"ok": True, "source": name, "tracks": tracks, "warnings": warnings}


def _entity_summary(resolver: DeviceEntityResolver) -> list[dict]:
    """只用于服务端日志。"""
    return [
        {"url": e["url"], "status": e["status"], "bytes": e["bytes"]}
        for e in resolver.log
    ]


def _sanitize(message: str) -> str:
    """不要把服务端的绝对路径原样吐回去。"""
    for prefix in (
        str(config.card_dir),
        str(config.stage_dir),
        str(config.state_dir),
        str(config.seed_dir),
        "/app/",
        "/data/",
    ):
        message = message.replace(prefix, "<device>/")
    return message[:400]
