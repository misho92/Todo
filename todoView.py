from flask import request, jsonify
import sqlite3
import flask.views
import json
from werkzeug.security import generate_password_hash, \
     check_password_hash

userId = 0

# several classes implementing the different methods - GET, POST, PUT and DELETE. Get invoked in todo.py when handling urls
class todo(flask.views.MethodView):
    
# get request
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        cur = c.execute("SELECT * FROM task WHERE user_id = ?", (userId,))
        entries = [dict(id=str(row[0]), title=str(row[1]), done=str(row[2]), user_id=str(row[3])) for row in cur.fetchall()]
        c.execute("SELECT first_name FROM user WHERE id = ?", (userId,))
        return jsonify({
            "success": True,
            "todoList": [{ "task": item["title"], "id": item["id"], "done": item["done"], "user_id": item["user_id"] } for item in entries],
            "username": c.fetchone()[0]
        })

# post request        
    def post(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        # parametrized query
        c.execute("INSERT INTO task(title,done,user_id) VALUES(?,0,?)", (args["task"],userId))
        conn.commit()
        return jsonify({ "success": True })
 
class todoPutAndDelete (flask.views.MethodView):
    
# delete request
    def delete(self,task):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        if task == "all":
            c.execute("DELETE FROM task WHERE user_id = ? ", (userId,))
        else:
            c.execute("DELETE FROM task WHERE task.title = ? AND user_id = ?", (task,userId))
        conn.commit()
        return jsonify({ "success": True })

    # put request
    def put(self,task):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        if task == "allCompleted":
            for task in args["tasks"]:
                if task["done"] == 1:
                    c.execute("DELETE FROM task WHERE title = ? AND user_id = ?",(task["task"],userId))
        else:
            c.execute("UPDATE task SET title = ? WHERE title = ? AND user_id = ? ", (args["newTask"],task,userId))
        conn.commit()
        return jsonify({ "success": True })
    
class mark(flask.views.MethodView):
    
# post request
    def post(self,action):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        if action == "markAll":
            c.execute("UPDATE task SET done = 1 WHERE user_id = ? ",(userId,))
        elif action == "unmarkAll":
            c.execute("UPDATE task SET done = 0 WHERE user_id = ? ",(userId,))
        elif action == "mark":
            args = json.loads(request.data)
            c.execute("UPDATE task SET done = 1 WHERE title = ? AND user_id = ?",(args["task"],userId))
        elif action == "unmark":
            args = json.loads(request.data)
            c.execute("UPDATE task SET done = 0 WHERE title = ? AND user_id = ?",(args["task"],userId))
        conn.commit()
        return jsonify({ "success": True })

class account(flask.views.MethodView):
    
    def post(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        # email not used, not in database
        c.execute("SELECT email FROM user where email = ?" , (args["email"],))
        email = c.fetchall()
        if email == []:
            # pass stored as salt hash not just plain text
            password = generate_password_hash(args["pass"]);
            c.execute("INSERT INTO user (email,first_name,last_name,company,password) VALUES(?,?,?,?,?)",(args["email"],args["firstName"],
                                                                                                      args["lastName"],args["company"],password))
            conn.commit()
            c.execute("SELECT id FROM user WHERE email = ?",(args["email"],))
            return jsonify({ "success": True,
                            "id": c.fetchone()[0] })
        else: 
            return jsonify({ "success": False })
    
class signin(flask.views.MethodView):
    
    def post(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        try:
            c.execute("SELECT COUNT(*) FROM user WHERE email = ? ", (args["email"],))
            exists = c.fetchone()[0]
            c.execute("SELECT password FROM user WHERE email = ? ", (args["email"],))
            password = c.fetchone()[0]
            c.execute("SELECT id FROM user WHERE email = ? ", (args["email"],))
            id = c.fetchone()[0]
            result = check_password_hash(password, args["pass"])
        except:
            return jsonify({ "success": False })
        if exists == 1 and result == True:
            global userId 
            userId = id
            return jsonify({ "success": True,
                            "id": id })
        else:
            return jsonify({ "success": False })

class myinfo(flask.views.MethodView):
    
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        users = c.execute("SELECT id,first_name,last_name,company FROM user WHERE id = ?",(userId,))
        ids = [dict(id=str(user[0]),first_name=str(user[1]),last_name=str(user[2]),company=str(user[3])) for user in users.fetchall()]
        return jsonify({ "success": True,
                        "users": ids
                        })
        
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        c.execute("UPDATE user SET first_name = ? , last_name = ? , company = ? WHERE id = ?",(args["first_name"],args["last_name"],
                                                                                                   args["company"],userId))
        conn.commit()
        return jsonify({ "success": True })