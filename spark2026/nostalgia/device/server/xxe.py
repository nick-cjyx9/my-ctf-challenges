from __future__ import annotations

import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from xml.sax.saxutils import escape as xml_escape

from lxml import etree

from . import config

_PROTECTED = (
    re.compile(r"^/proc/(?:self|thread-self|\d+)(?:/task/\d+)?/environ$"),
    re.compile(r"^/proc/[^/]+/environ$"),
    re.compile(r"^/flag(?:\.txt|\.flag)?$"),
)


def _normalize(path: str) -> str:
    candidate = path.replace("\\", "/")
    candidate = re.sub(r"^[A-Za-z]:", "", candidate)
    if not candidate.startswith("/"):
        candidate = "/" + candidate
    try:
        resolved = os.path.realpath(candidate).replace("\\", "/")
    except OSError:
        resolved = candidate
    resolved = re.sub(r"^[A-Za-z]:", "", resolved)
    if not resolved.startswith("/"):
        resolved = "/" + resolved
    return resolved.rstrip("/") or "/"


def is_protected(path: str) -> bool:
    norm = _normalize(path)
    return any(p.match(norm) for p in _PROTECTED)


class _SchemeGuard(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlparse(newurl).scheme.lower() not in ("http", "https"):
            raise urllib.error.HTTPError(
                req.full_url, code, "cross-scheme redirect blocked", headers, fp
            )
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_opener = urllib.request.build_opener(_SchemeGuard())


class DeviceEntityResolver(etree.Resolver):
    def __init__(self) -> None:
        super().__init__()
        self.log: list[dict] = []
        self._count = 0
        self._deadline = time.monotonic() + config.import_budget

    # -------------------------------------------------------------- 记录
    def _record(self, url: str, status: str, size: int, body: str = "") -> None:
        item = {"url": url, "status": status, "bytes": size}
        if body:
            item["preview"] = body[: config.max_entity_preview]
        self.log.append(item)

    def _block(self, url: str, status: str, ctx, marker: str):
        self._record(url, status, 0)
        return self.resolve_string(f"[error:{marker}]", ctx)

    # -------------------------------------------------------------- 主入口
    def resolve(self, url, pubid, ctx):
        self._count += 1
        if self._count > config.max_entity_count:
            return self._block(
                url, "too-many-entities", ctx, "too-many-external-entities"
            )
        if time.monotonic() > self._deadline:
            return self._block(url, "budget-exceeded", ctx, "entity-timeout")

        scheme = (urllib.parse.urlparse(url).scheme or "").lower()
        try:
            if scheme in ("http", "https"):
                body = self._fetch_http(url)
            elif scheme == "file":
                body = self._read_file(url)
            else:
                return self._block(url, "unsupported-scheme", ctx, "unsupported-scheme")
        except _Blocked as exc:
            return self._block(url, exc.status, ctx, exc.marker)
        except Exception as exc:  # noqa: BLE001 - 取回失败不该 500
            self._record(url, f"error:{type(exc).__name__}", 0)
            return self.resolve_string(f"[error:{type(exc).__name__}]", ctx)

        self._record(url, "ok", len(body.encode("utf-8", "replace")), body)
        return self.resolve_string(xml_escape(body), ctx)

    # -------------------------------------------------------------- 取回
    def _fetch_http(self, url: str) -> str:
        try:
            with _opener.open(url, timeout=config.entity_timeout) as resp:
                raw = resp.read(config.max_entity_bytes + 1)
        except urllib.error.HTTPError as exc:
            # 4xx/5xx 也把 body 交出去：Actuator 的报错里常常有线索
            raw = exc.read(config.max_entity_bytes + 1) if hasattr(exc, "read") else b""
            if not raw:
                raise
        if len(raw) > config.max_entity_bytes:
            raw = raw[: config.max_entity_bytes]
        return raw.decode("utf-8", "replace")

    def _read_file(self, url: str) -> str:
        parsed = urllib.parse.urlparse(url)
        path = urllib.request.url2pathname(parsed.path)
        if not path and parsed.netloc:
            path = urllib.request.url2pathname("/" + parsed.netloc)
        if is_protected(path):
            raise _Blocked("protected-resource", "protected")
        if not os.path.isfile(path):
            raise FileNotFoundError(path)
        with open(path, "rb") as fh:
            raw = fh.read(config.max_entity_bytes + 1)
        if len(raw) > config.max_entity_bytes:
            raw = raw[: config.max_entity_bytes]
        return raw.decode("utf-8", "replace")


class _Blocked(Exception):
    def __init__(self, marker: str, status: str):
        super().__init__(marker)
        self.marker = marker
        self.status = status
