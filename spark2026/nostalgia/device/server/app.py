from __future__ import annotations

import json
import threading
import time
import urllib.request

from flask import Flask, jsonify, request, send_file, send_from_directory

from . import config, playlist, storage
from .storage import DeviceError


# ------------------------------------------------------------------ 限流
class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str, rule: tuple[int, int]) -> None:
        limit, window = rule
        now = time.monotonic()
        with self._lock:
            hits = [t for t in self._hits.get(key, []) if now - t < window]
            if len(hits) >= limit:
                raise DeviceError("操作过于频繁，请稍后再试", 429, "rate_limited")
            hits.append(now)
            self._hits[key] = hits


limiter = RateLimiter()


def client_key(scope: str) -> str:
    ip = (
        request.headers.get("X-Forwarded-For", request.remote_addr or "?")
        .split(",")[0]
        .strip()
    )
    return f"{scope}:{ip}"


# ------------------------------------------------------------------ 云端服务探活（提示用）
_health_cache: dict = {"at": 0.0, "data": None}


def probe_cloud() -> dict:
    now = time.monotonic()
    if _health_cache["data"] and now - _health_cache["at"] < 10:
        return _health_cache["data"]

    endpoint = config.cloud_endpoint
    result: dict = {
        "endpoint": endpoint,
        "state": "under-construction",
        "health_path": config.cloud_health_path,
        "version": "0.0.1-SNAPSHOT",
        "items": [],
    }
    try:
        health = _get_json(f"{endpoint}{config.cloud_health_path}")
        result.update({"reachable": True, "health": health.get("status", "UNKNOWN")})
        try:
            info = _get_json(f"{endpoint}{config.cloud_info_path}")
            result["version"] = (info.get("app") or {}).get("version") or result[
                "version"
            ]
        except Exception:  # noqa: BLE001, S110
            pass
    except Exception as exc:  # noqa: BLE001
        result.update(
            {"reachable": False, "health": "UNREACHABLE", "reason": type(exc).__name__}
        )
    _health_cache.update({"at": now, "data": result})
    return result


def _get_json(url: str, timeout: float = 1.5) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read(64 * 1024) or b"{}")


# ------------------------------------------------------------------ 应用
def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = config.max_media_bytes + 64 * 1024
    app.config["JSON_AS_ASCII"] = False

    storage.ensure_dirs()
    storage.seed_card()
    playlist.generate_if_untouched()

    @app.errorhandler(DeviceError)
    def _device_error(exc: DeviceError):
        return jsonify({"error": exc.message, "code": exc.code}), exc.status

    @app.errorhandler(404)
    def _not_found(_):
        return jsonify({"error": "接口不存在", "code": "not_found"}), 404

    @app.errorhandler(413)
    def _too_large(_):
        return jsonify({"error": "请求体过大", "code": "too_large"}), 413

    @app.errorhandler(Exception)
    def _boom(exc: Exception):
        app.logger.exception("unhandled error: %s", type(exc).__name__)
        return jsonify({"error": "设备内部错误", "code": "internal"}), 500

    @app.after_request
    def _headers(resp):
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "no-referrer"
        return resp

    # ------------------------------------------------------------ 设备状态
    @app.get("/api/device")
    def api_device():
        return jsonify(
            {
                "model": config.device_model,
                "serial": config.device_serial,
                "firmware": "1.2.7-nostalgia",
                "tfInserted": storage.tf_inserted(),
                "card": storage.card_usage(),
                "stage": {
                    k: v for k, v in storage.stage_usage().items() if k != "files"
                },
                "cloud": {"endpoint": config.cloud_endpoint},
            }
        )

    @app.post("/api/device/tf/eject")
    def api_tf_eject():
        limiter.check(client_key("cycle"), config.rate_cycle)
        storage.eject()
        return jsonify(
            {"ok": True, "tfInserted": False, "stage": storage.stage_usage()}
        )

    @app.post("/api/device/tf/insert")
    def api_tf_insert():
        limiter.check(client_key("cycle"), config.rate_cycle)
        result = storage.insert()
        playlist.clear_state()
        regenerated = playlist.generate_if_untouched()
        return jsonify(
            {
                "ok": True,
                "tfInserted": True,
                "regeneratedPlaylist": regenerated,
                **result,
                "stage": storage.stage_usage(),
            }
        )

    @app.get("/api/device/tf/stage")
    def api_tf_stage():
        return jsonify(storage.stage_usage() | {"tfInserted": storage.tf_inserted()})

    @app.post("/api/device/tf/upload")
    def api_tf_upload():
        if storage.tf_inserted():
            raise DeviceError("请先拔出 TF 卡再接读卡器传输文件", 403, "card_inserted")
        limiter.check(client_key("upload"), config.rate_upload)
        file_storage = request.files.get("file")
        if file_storage is None:
            raise DeviceError("没有收到文件", 400, "no_file")
        saved = storage.stage_upload(file_storage)
        return jsonify({"ok": True, **saved, "stage": storage.stage_usage()})

    @app.delete("/api/device/tf/stage")
    def api_tf_stage_clear():
        name = request.args.get("name")
        if name:
            storage.stage_delete(name)
            return jsonify(
                {"ok": True, "removed": name, "stage": storage.stage_usage()}
            )
        return jsonify(
            {
                "ok": True,
                "removed": storage.stage_clear(),
                "stage": storage.stage_usage(),
            }
        )

    # ------------------------------------------------------------ 文件
    @app.get("/api/files")
    def api_files():
        return jsonify(
            {
                "entries": storage.card_entries(),
                "card": storage.card_usage(),
                "tfInserted": storage.tf_inserted(),
            }
        )

    @app.get("/api/files/text")
    def api_file_text():
        return jsonify(storage.read_text(request.args.get("name", "")))

    @app.get("/api/files/audio")
    def api_file_audio():
        path = storage.audio_path(request.args.get("name", ""))
        return send_file(
            path,
            conditional=True,
            etag=True,
            last_modified=path.stat().st_mtime,
            download_name=path.name,
        )

    @app.get("/api/files/download")
    def api_file_download():
        path = storage.safe_join(config.card_dir, request.args.get("name", ""))
        if not path.is_file():
            raise DeviceError("文件不存在", 404, "not_found")
        return send_file(path, as_attachment=True, download_name=path.name)

    # ------------------------------------------------------------ 播放列表
    @app.get("/api/playlist")
    def api_playlist():
        data = playlist.current_playlist()
        return jsonify({**data, "card": storage.card_usage()})

    @app.post("/api/playlist/import")
    def api_playlist_import():
        limiter.check(client_key("import"), config.rate_import)
        payload = request.get_json(silent=True) or {}
        name = payload.get("name") or request.form.get("name") or ""
        result = playlist.import_xml(name)
        return jsonify(result), (200 if result.get("ok") else 422)

    # ------------------------------------------------------------ 电子书
    @app.get("/api/ebook")
    def api_ebook():
        name = request.args.get("name", "")
        storage.read_text(name)
        return jsonify(storage.read_text(name))

    @app.get("/api/ebook/store")
    @app.get("/api/service/status")
    def api_ebook_store():
        return jsonify(probe_cloud())

    # ------------------------------------------------------------ 前端静态资源
    @app.get("/")
    def index():
        return _spa("index.html")

    @app.get("/<path:path>")
    def spa(path: str):
        if path.startswith("api/"):
            raise DeviceError("接口不存在", 404, "not_found")
        target = config.static_dir / path
        if target.is_file():
            return send_from_directory(config.static_dir, path)
        return _spa("index.html")

    def _spa(filename: str):
        if not (config.static_dir / filename).is_file():
            return ("前端尚未构建：请在 device/web 下执行 `pnpm build`", 503)
        return send_from_directory(config.static_dir, filename)

    return app


app = create_app()
