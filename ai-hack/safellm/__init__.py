import os
import time
import shutil
import logging
import threading
import uuid as _uuid
from flask import Flask, session

def create_app():
    package_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(package_dir)
    template_dir = os.path.join(project_root, 'templates')

    app = Flask(__name__, template_folder=template_dir)
    
    # configs
    app.secret_key = b'\x9b\x89\x95\xe5\xdf\x00\xca \xe3\x16K \x9c\xe5\xdf}A\xfb\x00\xaa\xae\xd7\x13)\x0c\xab\x9aE(`\x9f\xfc\x85\xfe\xac\xe4t\x1e\x993\x9d\x8ec\r\x035^\xf4^\x9e-\xfc($\xa6\xee\x02\x8a\x95\xf07\x02)\xa1T\xb2\xcd\x132\x88\x1fEk\x9b=\xdf\x0c \x8d\xcc\x92\xfa\xed\xd2\xa5"Em\xbdZ\x0f\x82\xb6;\xe1\x01\xd0\x8bn\xcay)\r\x90^\xe7C\xab\xbdM\xef\x99\xc8\x1b\xf6\xcdFdm\xbd#\x86\xfe\xb3\x1b\x03Eg'
    app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024
    app.config['USER_UPLOAD_BASE'] = os.path.join(project_root, '/tmp')
    app.config['TURNSTILE_SECRET'] = "0x4AAAAAAB7lgtlnjvcbUG8e_bc4MCY-ayk"
    with open("/home/ctfapp/flllla4ger", 'r') as f:
        app.config['NEWSTAR5FLAG'] = f.read().strip()
    app.config['CHECK_INTERVAL'] = 60*60
    app.config['EXP_INTERVAL'] = 60*60
    
    os.makedirs(app.config['USER_UPLOAD_BASE'], exist_ok=True)
    
    @app.before_request
    def _ensure_session_uuid():
        if 'uuid' not in session:
            session['uuid'] = str(_uuid.uuid4())

    from .api.routes import api_bp
    from .web.routes import web_bp

    app.register_blueprint(api_bp)
    app.register_blueprint(web_bp)

    # 自动清理
    def _cleanup_loop():
        base = app.config['USER_UPLOAD_BASE']
        check_interval = app.config['CHECK_INTERVAL']
        cutoff = app.config['EXP_INTERVAL']
        while True:
            try:
                now = time.time()
                for name in os.listdir(base):
                    user_dir = os.path.join(base, name)
                    latest = None
                    try:
                        for f in os.listdir(user_dir):
                            user_model = os.path.join(user_dir, f)
                            try:
                                modified_time = os.path.getmtime(user_model)
                            except Exception:
                                modified_time = None
                            if modified_time:
                                if latest is None or modified_time > latest:
                                    latest = modified_time
                    except Exception:
                        latest = None
                    if latest and(now - latest) > cutoff:
                        try:
                            shutil.rmtree(user_dir)
                            logging.info('Cleaned up user dir: %s', user_dir)
                        except Exception:
                            logging.exception('Failed to remove user dir: %s', user_dir)
            except Exception:
                logging.exception('Cleanup loop error')
            time.sleep(check_interval)

    try:
        t = threading.Thread(target=_cleanup_loop, daemon=True)
        t.start()
    except Exception:
        logging.exception('Failed to start cleanup thread')

    return app
