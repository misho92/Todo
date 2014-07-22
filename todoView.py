from flask import request, jsonify
import sqlite3
import flask.views
import json
from werkzeug.security import generate_password_hash
from time import gmtime, strftime
import datetime
import time

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
        username = c.fetchone()[0]
        c.execute("SELECT plan FROM user WHERE id = ?", (userId,))
        return jsonify({
            "success": True,
            "todoList": [{ "task": item["title"], "id": item["id"], "done": item["done"], "user_id": item["user_id"] } for item in entries],
            "username": username,
            "plan": c.fetchone()[0]
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
            password = generate_password_hash(args["pass"])
            date = strftime("%Y-%m-%d", gmtime())
            c.execute("INSERT INTO user (email,first_name,last_name,company,password,plan,registered) VALUES(?,?,?,?,?,?,?)",(args["email"],args["firstName"],
                                                                                                      args["lastName"],args["company"],password,args["plan"],date))
            conn.commit()
            c.execute("SELECT id FROM user WHERE email = ?",(args["email"],))
            global userId
            userId = c.fetchone()[0]
            return jsonify({ "success": True })
        else: 
            return jsonify({ "success": False })
    
class signin(flask.views.MethodView):
    
    def post(self,id):
        global userId 
        userId = id


class myinfo(flask.views.MethodView):
    
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        users = c.execute("SELECT id,first_name,last_name,company,plan,email FROM user WHERE id = ?",(userId,))
        ids = [dict(id=str(user[0]),first_name=str(user[1]),last_name=str(user[2]),company=str(user[3]),plan=str(user[4]),email=str(user[5])) for user in users.fetchall()]
        return jsonify({ "success": True,
                        "users": ids })
        
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        # if function is invoked for changing plan option
        if args["plan"] != None:
            if args["date"] != None:
                c.execute("SELECT registered FROM user WHERE id = ?",(userId,))
                registered = c.fetchone()[0]
                registered = time.mktime(datetime.datetime.strptime(registered, "%Y-%m-%d").timetuple())
                changePlanRequestDate = time.mktime(datetime.datetime.strptime(args["date"], "%Y-%m-%d").timetuple())
                # 604800 is the number of seconds in a week, if the request is valid ( within 7 days of the registration let the downgrade proceed
                if changePlanRequestDate - 604800 <= registered:
                    c.execute("UPDATE user SET plan = ? WHERE id = ?", (args["plan"],userId))
                    # delete all the todo items except the top 10 as this is the maximum that plan S offers
                    c.execute("DELETE FROM task WHERE id NOT IN(SELECT id FROM task WHERE user_id = ? ORDER BY id LIMIT 10)", (userId,))
                    conn.commit()
                    return jsonify({ "success": True })
                else:
                    return jsonify({ "success": False })
            else:
                c.execute("UPDATE user SET plan = 'L' WHERE id = ?", (userId,))
                conn.commit()
                return jsonify({ "success": True })
        # if function is invoked to save edited info fields
        else:
            c.execute("UPDATE user SET first_name = ? , last_name = ? , company = ? WHERE id = ?",(args["first_name"],args["last_name"],
                                                                                                   args["company"],userId))
            conn.commit()
            return jsonify({ "success": True })