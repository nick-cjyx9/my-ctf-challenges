from __future__ import annotations

import struct
from functools import lru_cache
from pathlib import Path

_BITRATES: dict[tuple[str, int], list[int | None]] = {
    ("1", 3): [None, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    ("1", 2): [None, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    ("1", 1): [None, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    ("2", 3): [None, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    ("2", 2): [None, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    ("2", 1): [None, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
}

_SAMPLE_RATES: dict[str, list[int]] = {
    "1": [44100, 48000, 32000],
    "2": [22050, 24000, 16000],
    "2.5": [11025, 12000, 8000],
}

_TEXT_EXTS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"}


def _id3_size(data: bytes) -> int:
    """跳过 ID3v2 头，返回音频数据起点。"""
    if len(data) < 10 or data[:3] != b"ID3":
        return 0
    size = (
        (data[6] & 0x7F) << 21
        | (data[7] & 0x7F) << 14
        | (data[8] & 0x7F) << 7
        | (data[9] & 0x7F)
    )
    return 10 + size


def _first_frame(data: bytes, start: int) -> tuple[int, int, int] | None:
    """在 data[start:] 里找第一个合法帧头，返回 (帧偏移, 比特率kbps, 采样率Hz)。"""
    limit = min(len(data) - 4, start + 64 * 1024)
    for i in range(start, max(start, limit)):
        if data[i] != 0xFF or (data[i + 1] & 0xE0) != 0xE0:
            continue
        header = struct.unpack(">I", data[i : i + 4])[0]
        version_bits = (header >> 19) & 0x3
        layer_bits = (header >> 17) & 0x3
        bitrate_index = (header >> 12) & 0xF
        rate_index = (header >> 10) & 0x3
        if (
            version_bits == 1
            or layer_bits == 0
            or bitrate_index in (0, 15)
            or rate_index == 3
        ):
            continue
        version = {0: "2.5", 2: "2", 3: "1"}[version_bits]
        layer = {1: 3, 2: 2, 3: 1}[layer_bits]
        table = _BITRATES.get((version if version != "2.5" else "2", layer))
        if not table or not table[bitrate_index]:
            continue
        return i, table[bitrate_index], _SAMPLE_RATES[version][rate_index]
    return None


@lru_cache(maxsize=256)
def _duration_cached(path_str: str, size: int, mtime: int) -> int:
    path = Path(path_str)
    try:
        data = path.read_bytes()
    except OSError:
        return 0
    if len(data) < 128:
        return 0
    frame = _first_frame(data, _id3_size(data))
    if not frame:
        return 0
    offset, bitrate_kbps, _rate = frame
    audio_bytes = len(data) - offset
    seconds = audio_bytes / (bitrate_kbps * 1000 / 8)
    if not (0 < seconds < 24 * 3600):
        return 0
    return round(seconds)


def duration_of(path: Path) -> int:
    """返回秒数；不是音频或解析失败返回 0。"""
    if path.suffix.lower() not in _TEXT_EXTS:
        return 0
    try:
        stat = path.stat()
    except OSError:
        return 0
    return _duration_cached(str(path), stat.st_size, int(stat.st_mtime))
