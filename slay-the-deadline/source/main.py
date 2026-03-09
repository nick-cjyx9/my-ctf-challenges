import db
import os
import utils
from flask import Flask, render_template, request, redirect, session, url_for, flash

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "secret_key_will_change_in_prod")

db.init_db()

@app.route("/")
def index():
    if "username" in session:
        user_todos = db.get_user_todos(session["username"])
        display_todos = []
        for t in user_todos:
            metadata = t["metadata"]
            title = utils.get_tag_content(metadata, "title") or "No Title"
            content = utils.get_tag_content(metadata, "TODO")

            display_todos.append({
                "id": t["id"],
                "title": title,
                "content": content,
                "owner": t["owner"]
            })
        return render_template("index.html", todos=display_todos, user=session["username"])
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = db.login_user(username, password)
        if user["success"]:
            session["username"] = user["username"]
            return redirect(url_for("index"))
        else:
            flash(user.get("message", "Login failed"))
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        res = db.create_user(username, password)
        if res.get("success"):
            flash("Registered successfully")
            return redirect(url_for("login"))
        else:
            flash(res["message"])
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("login"))

@app.route("/create", methods=["POST"])
def create():
    if "username" not in session:
        return redirect(url_for("login"))
    title = request.form["title"]
    content = request.form["content"]
    user = {"username": session["username"]} 
    db.add_todo(user, title, content)

    return redirect(url_for("index"))

@app.route("/delete/<int:todo_id>")
def delete(todo_id):
    if "username" not in session:
        return redirect(url_for("login"))
    user = {"username": session["username"]}
    db.delete_todo(user, todo_id)
    return redirect(url_for("index"))

@app.route("/edit/<int:todo_id>", methods=["GET", "POST"])
def edit(todo_id):
    if "username" not in session:
        return redirect(url_for("login"))

    if request.method == "POST":
        title = request.form["title"]
        content = request.form["content"]
        user = {"username": session["username"]}
        db.update_todo(user, todo_id, title, content)
        return redirect(url_for("index"))

    todo = db.get_todo(todo_id)
    if not todo or todo["owner"] != session["username"]:
        return "Not found or denied", 403
        
    raw = todo["metadata"]
    title = utils.get_tag_content(raw, "title")
    content = utils.get_tag_content(raw, "TODO")
    
    return render_template("edit.html", todo=todo, title=title, content=content)

@app.route("/view/<int:todo_id>")
def view(todo_id):
    if "username" not in session:
        return redirect(url_for("login"))

    todo = db.get_todo(todo_id)
    if not todo:
        return "Not found", 404

    if todo["owner"] != session["username"] and session["username"] != "admin":
        return "Permission denied", 403

    content = utils.get_tag_content(todo["metadata"], "TODO")
    title = utils.get_tag_content(todo["metadata"], "title") or "No Title"
    
    return render_template("view.html", todo=todo, title=title, content=content)

@app.route("/share/<int:todo_id>", methods=["POST"])
def share(todo_id):
    if "username" not in session:
        return redirect(url_for("login"))

    todo = db.get_todo(todo_id)
    if not todo:
        return "Todo not found", 404

    view_url = f"http://127.0.0.1:5000/view/{todo_id}"

    print(f"[+] User {session['username']} shared todo {todo_id} with admin.")
    db.bot.visit(view_url)
    
    flash("Todo shared with admin! They will review it shortly.")
    return redirect(url_for('view', todo_id=todo_id))

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False, port=5000)
