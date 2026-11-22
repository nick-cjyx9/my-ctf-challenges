import base64
import binascii
import io
import pickle
import secrets

from flask import Flask, render_template, request

app = Flask(__name__)

SECRET_PICKLE_AUTH_KEY = secrets.token_hex(32)


class MasterConfig:
    def __init__(self):
        self.secret_token = SECRET_PICKLE_AUTH_KEY
        self.greeter = "完全掌握了 Python 的大师 Joker"


master_cfg = MasterConfig()


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/format", methods=["GET", "POST"])
def format_greeting():
    if request.method == "POST":
        name = request.form.get("name", "")
        template = "{config.greeter} 欢迎你的到来，" + name
        return render_template(
            "format.html", result=template.format(config=master_cfg), name=name
        )
    return render_template("format.html")


UNSAFE_PICKLE_BUILTINS = [
    "system",
    "eval",
    "exec",
    "posix",
    "popen",
    "subprocess",
    "__import__",
]


class RestrictedUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "builtins" and name not in UNSAFE_PICKLE_BUILTINS:
            return super().find_class(module, name)

        raise pickle.UnpicklingError()


def restricted_loads(s):
    """Helper function analogous to pickle.loads()."""
    return RestrictedUnpickler(io.BytesIO(s)).load()


@app.route("/pickle", methods=["GET", "POST"])
def safest_pickle():
    output = None
    if request.method == "POST":
        auth_key = request.form.get("auth_key", "")
        raw_b64 = request.form.get("payload", "")

        if auth_key.strip() != SECRET_PICKLE_AUTH_KEY:
            output = "密钥不正确！"
            return render_template("pickle.html", output=output)

        try:
            data = base64.b64decode(raw_b64)
        except binascii.Error:
            output = "Base64 解码失败！"
            return render_template("pickle.html", output=output)

        try:
            restricted_loads(data)
            output = "反序列化成功！"
        except pickle.UnpicklingError:
            output = "检测到危险关键字！"
        except Exception:  # noqa: BLE001
            output = "执行异常！"

    return render_template("pickle.html", output=output)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
