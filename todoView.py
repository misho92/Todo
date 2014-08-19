from flask import request, jsonify
import sqlite3
import flask.views
import json
from werkzeug.security import generate_password_hash
from time import gmtime, strftime
import datetime
import time

userId = 0

#REVIEW: Change classes according to suggestions on RESTful API written in app.js

# several classes implementing the different methods - GET, POST, PUT and DELETE. Get invoked in todo.py when handling urls
class todo(flask.views.MethodView):
    
# get request
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        cur = c.execute("SELECT * FROM task WHERE user_id = ?", (userId,))
        entries = [dict(id=str(row[0]), title=str(row[1]), done=str(row[2]), user_id=str(row[3])) for row in cur.fetchall()]
        c.execute("SELECT first_name,plan,title FROM user WHERE id = ?", (userId,))
        row = c.fetchone()
        return jsonify({
            "success": True,
            "todoList": [{ "task": item["title"], "id": item["id"], "done": item["done"], "user_id": item["user_id"] } for item in entries],
            "row": row
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
            if args["payment"] == "Credit Card":
                c.execute("INSERT INTO user (email,first_name,last_name,company,password,plan,registered,payment,name_on_card,card_number,CVC," 
                "valid_until,title) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(args["email"],args["firstName"],args["lastName"],args["company"],password,args["plan"],
                                                    date,args["payment"],args["nameOnCard"],args["cardNumber"],args["cvc"],args["validUntil"],args["title"]))
                conn.commit()
            else:
                c.execute("INSERT INTO user (email,first_name,last_name,company,password,plan,registered,payment,owner_of_account,BIC,IBAN," 
                "bank_account_number,title) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(args["email"],args["firstName"],args["lastName"],args["company"],password,
                                args["plan"],date,args["payment"],args["ownerOfAccount"],args["BIC"],args["IBAN"],args["bankAccountNumber"],args["title"]))
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
        users = c.execute("SELECT id,first_name,last_name,company,plan,email,title FROM user WHERE id = ?",(userId,))
        ids = [dict(id=str(user[0]),first_name=str(user[1]),last_name=str(user[2]),company=str(user[3]),plan=str(user[4]),email=str(user[5]),
                    title=str(user[6])) for user in users.fetchall()]
        return jsonify({ "success": True,
                        "users": ids })
        
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        c.execute("UPDATE user SET first_name = ? , last_name = ? , company = ?, email = ? , title = ? WHERE id = ?",(args["firstName"],
                                                                        args["lastName"],args["company"],args["email"],args["title"],userId))
        conn.commit()
        return jsonify({ "success": True })
        
class myPortal (flask.views.MethodView):
    
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        cur = c.execute("SELECT payment,name_on_card,card_number,CVC,valid_until,owner_of_account,BIC,IBAN,bank_account_number,first_name,plan, "
        "registered,title FROM user WHERE id = ?" , (userId,))
        entries = [dict(payment=str(row[0]), nameOnCard=str(row[1]), cardNumber=str(row[2]), cvc=str(row[3]), validUntil=str(row[4]),
                    owner=str(row[5]),BIC=str(row[6]),IBAN=str(row[7]),bankAccountNumber=str(row[8]),username=str(row[9]),plan=str(row[10]),
                    registered=str(row[11]),title=str(row[12])) for row in cur.fetchall()]
        return jsonify({
            "success": True,
            "paymentData": [{ "payment": item["payment"], "nameOnCard": item["nameOnCard"], "cardNumber": item["cardNumber"], "cvc": item["cvc"], 
                             "validUntil": item["validUntil"], "owner": item["owner"], "BIC": item["BIC"], "IBAN": item["IBAN"], 
                             "bankAccountNumber": item["bankAccountNumber"], "username": item["username"], "plan": item["plan"], 
                              "registered": item["registered"],"title": item["title"]} for item in entries],
            "user": userId
        })
        
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        #edit payment data of credit card
        if args["payment"] == "Credit Card":
            c.execute("UPDATE user SET payment = 'Credit Card' , name_on_card = ? , card_number = ? , CVC = ?  , valid_until = ? , "
            "owner_of_account = '' , BIC = '' , IBAN = '' , bank_account_number = '' WHERE id = ?",(args["nameOnCard"],args["cardNumber"],
                                                                                                    args["cvc"],args["validUntil"],userId))
            conn.commit()
            return jsonify({ "success": True })
        
        #edit payment data of direct debit
        elif args["payment"] == "Direct Debit":
            c.execute("UPDATE user SET payment = 'Direct Debit' , owner_of_account = ? , BIC = ? , IBAN = ? , bank_account_number = ? ," 
            "name_on_card = '' , card_number = '' ,  CVC = '' , valid_until = ''  WHERE id = ?",(args["owner"],args["BIC"],args["IBAN"],
                                                                                                args["bankAccountNumber"],userId))
            conn.commit()
            return jsonify({ "success": True })
        
        #change plan
        elif args["plan"] != None:
            if args["date"] != None:
                c.execute("SELECT registered FROM user WHERE id = ?",(userId,))
                registered = c.fetchone()[0]
                registered = time.mktime(datetime.datetime.strptime(registered, "%Y-%m-%d").timetuple())
                changePlanRequestDate = time.mktime(datetime.datetime.strptime(args["date"], "%Y-%m-%d").timetuple())
                # 604800 is the number of seconds in a week, if the request is valid ( within 7 days of the registration let the downgrade proceed
                if changePlanRequestDate - 604800 <= registered:
                    c.execute("UPDATE user SET plan = ? WHERE id = ?", (args["plan"],userId))
                    conn.commit()
                    return jsonify({ "success": True })
                else:
                    return jsonify({ "success": False })
            else:
                c.execute("UPDATE user SET plan = 'L' WHERE id = ?", (userId,))
                conn.commit()
                return jsonify({ "success": True })
        
        #cancel plan
        else:
            c.execute("UPDATE user SET plan = '' WHERE id = ?", (userId,))
            c.execute("DELETE FROM task WHERE user_id = ?", (userId,))
            conn.commit()
            return jsonify({ "success": True })