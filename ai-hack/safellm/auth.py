from flask import request, jsonify

def require_auth(f):
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if token != "Bearer employee_access_token":
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated
