import os
import sys
import uuid
import json
import shutil
import hashlib
import logging
import threading
import subprocess
import urllib.parse
import urllib.request
from safellm.auth import require_auth
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app, session

api_bp = Blueprint('api', __name__, url_prefix='/api')

def unique_filename(directory: str, filename: str) -> str:
    base, ext = os.path.splitext(filename)
    candidate = filename
    counter = 1
    while os.path.exists(os.path.join(directory, candidate)):
        candidate = f"{base}_{counter}{ext}"
        counter += 1
    return candidate

def encode_uuid_dirname(sess_id: str) -> str:
    try:
        u = uuid.UUID(sess_id)
    except Exception:
        safe = ''.join(c if c.isalnum() or c in ('-', '_') else '_' for c in str(sess_id))
        return safe[:16] or uuid.uuid4().hex[:16]
    h = hashlib.sha256(u.bytes).digest()[:6]
    return h.hex()

def get_user_dir(sess_id: str) -> str:
    base = current_app.config.get('USER_UPLOAD_BASE')
    dirname = encode_uuid_dirname(sess_id)
    return os.path.join(base, dirname)

@api_bp.route('/upload', methods=['POST'])
@require_auth
def upload_model():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "Invalid filename"}), 400

    if not file.filename.endswith('.gguf'):
        return jsonify({"error": "Only GGUF files allowed"}), 400

    # if file.content_length > current_app.config.get('MAX_CONTENT_LENGTH'):
    #     return jsonify({"error": "File too large"}), 413

    turnstile_token = request.form.get('turnstile_token') or request.values.get('turnstile_token')
    turnstile_secret = current_app.config.get('TURNSTILE_SECRET')
    if not turnstile_secret:
        return jsonify({"error": "Server misconfiguration: TURNSTILE_SECRET not set"}), 500

    if not turnstile_token:
        return jsonify({"error": "Missing turnstile token"}), 403
    try:
        # Verify the Turnstile token
        verify_url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
        post_data = urllib.parse.urlencode({
            'secret': turnstile_secret,
            'response': turnstile_token
        }).encode('utf-8')
        req = urllib.request.Request(verify_url, data=post_data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode('utf-8')
            verify_result = json.loads(resp_body)
        if not verify_result.get('success'):
            return jsonify({"error": "Turnstile verification failed", "detail": verify_result}), 403
    except Exception as e:
        return jsonify({"error": f"Turnstile verification error: {str(e)}"}), 500

    filename = secure_filename(str(file.filename))

    sess_id = session.get('uuid')
    if not sess_id:
        return jsonify({"error": "no_session_uuid"}), 400
    try:
        # 检验UUID合法性，防止session伪造，虽然多半伪不出来
        _ = uuid.UUID(sess_id)
    except Exception:
        session.pop('uuid', None)
        return jsonify({"error": "invalid_session_uuid"}), 400
    user_dir = get_user_dir(sess_id)
    if os.path.exists(user_dir) and os.listdir(user_dir):
        # 目录存在且不为空，需要换一个新的 uuid
        sess_id = str(uuid.uuid4())
        session['uuid'] = sess_id
        try:
            _ = uuid.UUID(sess_id)
            return jsonify({"error": "repeat_uuid", "detail": "You should go to buy lottery tickets."}), 418
        except Exception:
            pass
    else:
        os.makedirs(user_dir, exist_ok=True)

    try:
        existing = [f for f in os.listdir(user_dir) if f.endswith('.gguf')]
        if len(existing) >= 2:
            return jsonify({"error": "upload_limit_reached", "detail": "最多只能上传 2 个模型， 请删除一个模型后再试"}), 403
    except Exception:
        pass

    unique_name = unique_filename(user_dir, filename)
    filepath = os.path.join(user_dir, unique_name)
    file.save(filepath)
    response_data = {
        "message": "File uploaded successfully",
        "model_id": unique_name,
        "status": "ready"
    }
    return jsonify(response_data)


@api_bp.route('/chat/<model_id>', methods=['POST'])
@require_auth
def chat_with_model(model_id):
    # 支持通过 JSON body 或 query 参数传入 isBuiltin（表示使用内置静态模型）
    data = request.get_json(silent=True) or {}
    message = data.get('message', 'Hello')
    # 读取 isBuiltin：优先 JSON，其次 querystring
    raw_is_builtin = data.get('isBuiltin', None)
    if raw_is_builtin is None:
        raw_is_builtin = request.args.get('isBuiltin')
    is_builtin = str(raw_is_builtin).lower() == 'true'
    print(f"Chat request: model_id={model_id}, is_builtin={is_builtin}, message={message}")
    model_path = None
    try:
        if is_builtin:
            static_root = current_app.static_folder or os.path.join(current_app.root_path, 'static')
            builtin_path = os.path.join(static_root, model_id)
            print(f"Using builtin model path: {builtin_path}")
            if os.path.exists(builtin_path):
                model_path = builtin_path
            else:
                return jsonify({"error": "Builtin model not found"}), 404
        else:
            # 使用用户上传的模型，需要 session uuid
            sess_id = session.get('uuid')
            if not sess_id:
                return jsonify({"error": "no_session_uuid"}), 400
            try:
                _ = uuid.UUID(sess_id)
            except Exception:
                session.pop('uuid', None)
                return jsonify({"error": "invalid_session_uuid"}), 400
            user_dir = get_user_dir(sess_id)
            user_model_path = os.path.join(user_dir, model_id)
            if os.path.exists(user_model_path):
                model_path = user_model_path
            else:
                return jsonify({"error": "Model not found"}), 404

        # Run inference in a separate subprocess to avoid C extension crashes
        runner_path = os.path.join(os.path.dirname(__file__), 'llama_runner.py')
        cmd = [
            'python',
            runner_path,
            '--model_path', model_path,
            '--message', message,
        ]
        try:
            completed = subprocess.run(cmd, capture_output=True, text=True)
        except subprocess.TimeoutExpired as te:
            return jsonify({"error": "inference_timeout", "detail": str(te)}), 408

        stdout = completed.stdout.strip() if completed.stdout else ''
        
        if completed.returncode == 0:
            try:
                data = json.loads(stdout) if stdout else {"response": "", "status": "success"}
                return jsonify(data)
            except Exception:
                return jsonify({"response": stdout, "status": "success", "parse_error": "invalidjson"})
        else:
            return jsonify({"error": "runner_error", "exitcode": completed.returncode}), 400
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 400


@api_bp.route('/models', methods=['GET'])
@require_auth
def list_models():
    models = []
    try:
        sess_id = session.get('uuid')
        user_dir = get_user_dir(sess_id)
        for filename in os.listdir(user_dir):
            if filename.endswith('.gguf'):
                filepath = os.path.join(user_dir, filename)
                stats = os.stat(filepath)
                models.append({
                    "name": filename,
                    "size": stats.st_size
                })
    except Exception:
        pass

    try:
        builtin_name = 'qwen1_5-0_5b-chat-q2_k.gguf'
        static_folder = current_app.static_folder or os.path.join(current_app.root_path, 'static')
        builtin_path = os.path.join(static_folder, builtin_name)
        if os.path.exists(builtin_path):
            stats = os.stat(builtin_path)
            models.append({
                "name": f"{builtin_name}",
                "size": stats.st_size,
                "builtin": True,
            })
    except Exception:
        pass

    response_data = {"models": models}

    return jsonify(response_data)

@api_bp.route('/models/<model_id>', methods=['DELETE'])
@require_auth
def delete_model(model_id):
    sess_id = session.get('uuid')
    user_dir = get_user_dir(sess_id)
    model_path = os.path.join(user_dir, model_id)
    if not os.path.exists(model_path):
        return jsonify({"error": "Model not found"}), 404
    try:
        os.remove(model_path)
        response_data = {"message": "Model deleted successfully"}
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": f"Delete failed: {str(e)}"}), 500


@api_bp.route('/info', methods=['GET'])
def info():
    response_data = {
        "name": "SafeLLM Hub",
        "description": "GGUF 模型托管平台",
        "version": "1.0",
        "packages": {
            "flask": "2.3.3",
            "llama_cpp_python_version": "0.2.61",
            "jinja2": "3.1.2"
        },
    }
    return jsonify(response_data)


@api_bp.route('/check', methods=['GET'])
def check_flag():
    sess_id = session.get('uuid')
    if not sess_id:
        return jsonify({'status': 'no_session'}), 400
    try:
        _ = uuid.UUID(sess_id)
    except Exception:
        session.pop('uuid', None)
        return jsonify({'status': 'invalid_session_uuid'}), 400
    user_dir = get_user_dir(sess_id)
    trigger_path = os.path.join(user_dir, 'orange')
    if os.path.exists(trigger_path):
        try:
            def _delete_user_dir(path):
                try:
                    path_real = os.path.realpath(path)
                    if os.path.exists(path_real):
                        shutil.rmtree(path_real)
                except Exception:
                    logging.exception("Failed to delete user directory: %s", path)
            timer = threading.Timer(5 * 60, _delete_user_dir, args=(user_dir,))
            # 完成挑战5min后自动清理
            timer.daemon = True
            timer.start()
        except Exception:
            logging.exception("Failed to schedule deletion for user_dir=%s", user_dir)

        return jsonify({'status': 'ok', 'f1@g': current_app.config['NEWSTAR5FLAG']})
    else:
        return jsonify({'status': 'not_ready', 'user_dir': user_dir})
