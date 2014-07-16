from __future__ import with_statement
from flask import Flask, send_file, make_response
from todoView import todo,todoDelete,mark,account,signin,myinfo,todoPut

# set flask app options
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar("FLASKR_SETTINGS",silent=True)

# add url rules with the corresponding view and method
app.add_url_rule("/todo",   view_func=todo.as_view("todo"), methods=["GET","POST"])
# should be /todo/<string:task>
app.add_url_rule("/todo/<string:task>/<int:user>", view_func=todoDelete.as_view("todoDelete"), methods=["DELETE"])
app.add_url_rule("/todo/<string:task>", view_func=todoPut.as_view("todoPut"), methods=["PUT"])
app.add_url_rule("/mark/<string:action>", view_func=mark.as_view("mark"), methods=["POST"])
app.add_url_rule("/account", view_func=account.as_view("account"), methods=["POST"])
app.add_url_rule("/signin", view_func=signin.as_view("signin"), methods=["POST"])
app.add_url_rule("/myaccount", view_func=myinfo.as_view("myinfo"), methods=["GET","PUT"])

# make_response(open("index.html").read()) for no caching

@app.route("/todos")
def todos():
    return send_file("todo.html")

@app.route("/app.js")
def js():
    return send_file("static/app.js")

@app.route("/styles.css")
def css():
    return send_file("static/styles.css")

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/signin")
def sigin():
    return send_file("index.html")

@app.route("/signup")
def signup():
    return send_file("signup.html")

@app.route("/myinfo")
def myaccount():
    return send_file("myaccount.html")

if __name__ == "__main__":
    app.debug = True
    app.run()