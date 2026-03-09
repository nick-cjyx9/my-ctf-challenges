import html
import os
import secrets
import string
import utils

users = []
todos = []

flag = os.getenv("FLAG", "flag{test_flag}")
admin_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
bot = utils.AdminBot(admin_password)

def init_db():
    create_user("admin", admin_password)
    os.environ["ADMIN_PASSWORD"] = admin_password
    flag_todo = {
        "id": 1,
        "owner": "admin",
        "metadata": f"<title>DDLs</title><TODO>1. 大物作业 2. 马原报告PPT 3. 高数网课 4. 打印资料 5.！？第五人格启动？！</TODO><FLAG>{flag}</FLAG>"
    }
    todos.append(flag_todo)

def create_user(username: str, password: str):
    for user in users:
        if(user["username"] == username):
            return {
                "success": False,
                "message": "用户名已被占用"
            }
    new_user = {
        "success": True,
        "username": username,
        "password": password,
        "is_admin": (username == "admin")
    }
    users.append(new_user)
    return new_user

def login_user(username: str, password: str):
    for user in users:
        if(user["username"] == username and user["password"] == password):
            return {
                "success": True,
                "username": username,
                "is_admin": user["is_admin"]
            }
    return {
        "success": False,
        "message": "登录失败"
    }

def add_todo(user, title: str, content: str):  
    safe_title = html.escape(title)
    safe_content = html.escape(content)

    metadata = f"<title>{safe_title}</title><TODO>{safe_content}</TODO><author>{user['username']}</author>"

    new_id = len(todos) + 1
    new_todo = {
        "id": new_id,
        "owner": user["username"],
        "metadata": metadata
    }
    todos.append(new_todo)
    return {
        "success": True,
        "id": new_id
    }

def get_todo(todo_id):
    for todo in todos:
        if todo["id"] == int(todo_id):
            return todo
    return None

def update_todo(user, todo_id, title, content):
    todo = get_todo(todo_id)
    if not todo:
        return {"success": False, "message": "Todo not found"}

    if todo["owner"] != user["username"]:
        return {"success": False, "message": "Permission denied"}
    current_raw = todo["metadata"]
    end_marker = "</TODO>"
    split_index = current_raw.rfind(end_marker)

    if split_index != -1:
        suffix = current_raw[split_index + len(end_marker):]
    else:
        suffix = ""

    safe_title = html.escape(title)
    safe_content = html.escape(content)
    new_raw = f"<title>{safe_title}</title><TODO>{safe_content}</TODO>{suffix}"
    todo["metadata"] = new_raw
    return {"success": True}

def delete_todo(user, todo_id):
    todo = get_todo(todo_id)
    if not todo:
        return {"success": False}
    if todo["owner"] != user["username"]:
        return {"success": False}
    todos.remove(todo)
    return {"success": True}

def get_user_todos(username):
    return [t for t in todos if t["owner"] == username]
