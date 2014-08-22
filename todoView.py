# this file consists of several classes. Each of them has a couple of functions which corresponds to the rest calls and execute some database activities
# based on the rest verb used

from flask import request, jsonify
import sqlite3
import flask.views
import json
from werkzeug.security import generate_password_hash
from time import gmtime, strftime
import datetime
import time

userId = 0

# several classes implementing the different methods - GET, POST, PUT and DELETE. Get invoked in todo.py when handling endpoints
class Todos(flask.views.MethodView):
    
# get request, fetching all user's todo list
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        cur = c.execute("SELECT * FROM todo WHERE user_id = ?", (userId,))
        entries = [dict(id=str(row[0]), title=str(row[1]), done=str(row[2]), user_id=str(row[3])) for row in cur.fetchall()]
        c.execute("SELECT first_name,plan,title FROM user WHERE id = ?", (userId,))
        row = c.fetchone()
        return jsonify({
            "success": True,
            "todoList": [{ "todo": item["title"], "id": item["id"], "done": item["done"], "user_id": item["user_id"] } for item in entries],
            "row": row
        })

# post request, inserting a new todo        
    def post(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        # parametrized query
        c.execute("INSERT INTO todo(title,done,user_id) VALUES(?,0,?)", (args["todo"],userId))
        conn.commit()
        return jsonify({ "success": True })
 
 # delete all todos from user's account
    def delete(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        c.execute("DELETE FROM todo WHERE user_id = ? ", (userId,))
        conn.commit()
        return jsonify({ "success": True })

    # put request, either deleting all completed todos, or updating one, or deleting a single one
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        if args["edit"] == "deleteAllCompleted":
            for todo in args["todos"]:
                if todo["done"] == 1:
                    c.execute("DELETE FROM todo WHERE title = ? AND user_id = ?",(todo["todo"],userId))
        elif args["edit"] == "one":
            c.execute("UPDATE todo SET title = ? WHERE title = ? AND user_id = ? ", (args["newtodo"],args["todo"],userId))
        else:
            c.execute("DELETE FROM todo WHERE todo.title = ? AND user_id = ?", (args["todo"],userId))
        conn.commit()
        return jsonify({ "success": True })
    
class Mark(flask.views.MethodView):
    
# post request, responsible for marking/unmarking all todos or marking/unmarking a single one
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        if args["mark"] == True and args["all"] == False:
            c.execute("UPDATE todo SET done = 1 WHERE title = ? AND user_id = ?",(args["todo"],userId))
        elif args["mark"] == False and args["all"] == False:
            c.execute("UPDATE todo SET done = 0 WHERE title = ? AND user_id = ?",(args["todo"],userId))
        elif args["mark"] == True and args["all"] == True:
            c.execute("UPDATE todo SET done = 1 WHERE user_id = ? ",(userId,))
        elif args["mark"] == False and args["all"] == True:
            c.execute("UPDATE todo SET done = 0 WHERE user_id = ? ",(userId,))
        conn.commit()
        return jsonify({ "success": True })

class Register(flask.views.MethodView):

# post request for signing up
    def post(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        # email used, not in database -> ok go ahead
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
        # email already in database -> error
        else: 
            return jsonify({ "success": False })
    
class Signin(flask.views.MethodView):
    
    def post(self,id):
        global userId 
        userId = id


class Account(flask.views.MethodView):
    
# get request to display all data
    def get(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        users = c.execute("SELECT id,first_name,last_name,company,plan,email,title FROM user WHERE id = ?",(userId,))
        ids = [dict(id=str(user[0]),first_name=str(user[1]),last_name=str(user[2]),company=str(user[3]),plan=str(user[4]),email=str(user[5]),
                    title=str(user[6])) for user in users.fetchall()]
        return jsonify({ "success": True,
                        "users": ids })
        
 # put request to update the edited data       
    def put(self):
        conn = sqlite3.connect("todo.sqlite")
        c = conn.cursor()
        args = json.loads(request.data)
        c.execute("UPDATE user SET first_name = ? , last_name = ? , company = ?, email = ? , title = ? WHERE id = ?",(args["firstName"],
                                                                        args["lastName"],args["company"],args["email"],args["title"],userId))
        conn.commit()
        return jsonify({ "success": True })
        
class Portal (flask.views.MethodView):
    
# get request to grab all information of the user
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
        
# updating payment methods
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
            c.execute("DELETE FROM todo WHERE user_id = ?", (userId,))
            conn.commit()
            return jsonify({ "success": True })