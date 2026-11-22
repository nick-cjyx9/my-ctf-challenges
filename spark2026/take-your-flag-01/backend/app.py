import ipaddress
import json
import os
import tempfile
import threading
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent

# 进度落盘，避免 gunicorn worker 被回收 / 容器重启后 stage 归零。
# Docker 部署时由 TYF01_STATE 指向挂载卷（见 docker-compose.yml）。
STATE_FILE = Path(os.environ.get("TYF01_STATE", str(ROOT / "state.json")))

app = Flask(__name__, static_folder="dist", static_url_path="")
app.json.ensure_ascii = False

# gunicorn 使用 -w 1 -k gthread，同一进程内多线程，锁即可保证读-判-写原子性。
STATE_LOCK = threading.RLock()

MEDJED_UNLOCK_STAGE = 4


def _read_stage() -> int:
    try:
        return int(json.loads(STATE_FILE.read_text(encoding="utf-8"))["stage"])
    except (OSError, ValueError, KeyError, TypeError):
        return 0


def _persist_stage(stage: int) -> None:
    """原子写盘；写失败只告警，不影响接口本身。"""
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=str(STATE_FILE.parent), prefix=".state-")
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump({"stage": stage}, handle)
        os.replace(tmp, STATE_FILE)
    except OSError as exc:  # 只读文件系统 / 权限不足等
        app.logger.warning("persist stage failed: %s", exc)


STATE = {"stage": _read_stage()}


def current_stage() -> int:
    with STATE_LOCK:
        return STATE["stage"]


def is_private_ip(ip_str: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_str.strip())
        return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local
    except ValueError:
        return False


@app.get("/api/status")
def status():
    return jsonify(stage=current_stage())


@app.post("/api/challenge/handshake")
def handshake():
    value = request.form.get("codename") or ""
    if not value:
        body = request.get_json(silent=True)
        value = body.get("codename", "") if isinstance(body, dict) else ""
    if not isinstance(value, str) or value.upper() != "JOKER":
        return jsonify(ok=False, message="codename 不正确！"), 400
    with STATE_LOCK:
        STATE["stage"] = max(STATE["stage"], 1)
        _persist_stage(STATE["stage"])
    return jsonify(ok=True, message="握手完成，回到聊天窗口吧！")


@app.route("/api/challenge/trust", methods=["GET", "POST"])
def trust():
    with STATE_LOCK:
        stage = STATE["stage"]
        if stage < 1:
            return jsonify(ok=False, message="先完成挑战 01，心急吃不了热豆腐！"), 403
        if stage >= 4:
            return jsonify(ok=True, message="全部验证已经完成")

        if stage == 1:
            passed = is_private_ip(
                request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            )
        elif stage == 2:
            passed = request.headers.get("Via", "").strip().lower() == "phantom-proxy"
        else:
            passed = (
                urlparse(request.headers.get("Referer", "")).netloc == "mementos.local"
            )

        if not passed:
            return jsonify(ok=False, message="潜入失败！请求已被敌人的防火墙拦截"), 400
        STATE["stage"] = stage + 1
        _persist_stage(STATE["stage"])
        next_stage = STATE["stage"]
    return jsonify(ok=True, stage=next_stage, message="验证通过，回到聊天窗口吧！")


def medjed_locked():
    """未完成全部试炼时，MEDJED 官网与 .git 源码泄露一律不可访问。"""
    if current_stage() < MEDJED_UNLOCK_STAGE:
        return (
            jsonify(ok=False, message="试炼尚未完成，MEDJED 的大门不会为你打开。"),
            403,
        )
    return None


@app.get("/medjed/.git/<path:filename>")
def leaked_git(filename: str):
    locked = medjed_locked()
    if locked is not None:
        return locked
    return send_from_directory(ROOT / "medjed" / ".git", filename)


@app.get("/medjed/")
def medjed():
    locked = medjed_locked()
    if locked is not None:
        return locked
    return send_from_directory(ROOT / "medjed", "index.html")


static = app.static_folder or "./dist/"


@app.get("/")
def index():
    return send_from_directory(static, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
