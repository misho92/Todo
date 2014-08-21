# this is the engine of the project with its settings and api endpoints

from __future__ import with_statement
from flask import Flask, send_file, make_response,jsonify,request
from todoView import Todos,Mark,Register,Signin,Account,Portal
import sqlite3
from werkzeug.security import check_password_hash
from flask_httpauth import HTTPBasicAuth

# set flask app options
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar("FLASKR_SETTINGS",silent=True)

# add url rules with the corresponding view and method
app.add_url_rule("/todo",   view_func=Todos.as_view("Todos"), methods=["GET","POST","PUT", "DELETE"])
app.add_url_rule("/mark", view_func=Mark.as_view("Mark"), methods=["PUT"])
app.add_url_rule("/account", view_func=Register.as_view("Register"), methods=["POST"])
app.add_url_rule("/signin", view_func=Signin.as_view("Signin"), methods=["POST"])
app.add_url_rule("/myaccount", view_func=Account.as_view("Account"), methods=["GET","PUT"])
app.add_url_rule("/myportal", view_func=Portal.as_view("Portal"), methods=["GET","PUT"])

# make_response(open("index.html").read()) for no caching

auth = HTTPBasicAuth()

@auth.get_password
def get_password(email):
    conn = sqlite3.connect("todo.sqlite")
    c = conn.cursor()
    try:
        c.execute("SELECT COUNT(*) FROM user WHERE email = ? ", (email,))
        exists = c.fetchone()[0]
        c.execute("SELECT password FROM user WHERE email = ? ", (email,))
        password = c.fetchone()[0]
        result = check_password_hash(password, request.authorization.password)
        c.execute("SELECT id FROM user WHERE email = ? ", (email,))
        id = c.fetchone()[0]
    except:
            return jsonify({ "success": False })
    if exists == 1 and result == True:
        Signin.post(Signin(),id)
        return request.authorization.password
    return None

@auth.error_handler
def unauthorized():
    return make_response(jsonify( { "error": "Unauthorized access" } ), 401)

@app.route("/todos")
@auth.login_required
def todos():
    return send_file("todo.html")

@app.route("/app.js")
def js():
    return send_file("static/app.js")

@app.route("/styles.css")
def css():
    return send_file("static/styles.css")

@app.route("/signout")
def logout():
    return send_file("signout.html")

@app.route("/")
@auth.login_required
def index():
    return send_file("index.html")

@app.route("/signin")
@auth.login_required
def sigin():
    return send_file("index.html")

@app.route("/signup")
def signup():
    return send_file("signup.html")

@app.route("/myinfo")
@auth.login_required
def myaccount():
    return send_file("myaccount.html")

@app.route("/portal")
@auth.login_required
def portal():
    return send_file("portal.html")

if __name__ == "__main__":
    app.debug = True
    app.run()