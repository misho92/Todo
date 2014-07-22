var app = angular.module("todo",["ngRoute","ngResource"])
.config(["$routeProvider", function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "/index.html",
            controller: "SignInController"
        })
        .when("/signin", {
            templateUrl: "/index.html",
            controller: "SignInController"
        })
        .when("/signup", {
            templateUrl: "/signup.html",
            controller: "RegistrationController"
        })
        .when("/todos", {
            templateUrl: "/todo.html",
            controller: "TodosController"
        })
        .when("/myinfo", {
            templateUrl: "/myaccount.html",
            controller: "InfoController"
        })
        .otherwise({ redirectTo: "/" });
}])

app.factory("Account", ["$resource", function($resource) {
	   return $resource("/myaccount", null,{
		   "saveData": {method: "PUT"},
		   "changePlan": {method: "PUT"}
	   });
	}]);

app.factory("Register", ["$resource", function($resource) {
	   return $resource("/account", null,{
		   "signUp": {method: "POST"}
	   });
	}]);

app.factory("Todos", ["$resource", function($resource) {
	   return $resource("/todo", null,{
		   "insert": {method: "POST"}
	   });
	}]);

app.factory("TodosDelete", ["$resource", function($resource) {
	   return $resource("/todo/:task", null,{
		   "deleteTodo": {method: "DELETE"},
		   "editTodo": {method: "PUT"}
	   });
	}]);

app.factory("MarkAllTodos", ["$resource", function($resource) {
	   return $resource("/mark/markAll", null,{
		   "markAll": {method: "POST"}
	   });
	}]);

app.factory("UnmarkAllTodos", ["$resource", function($resource) {
	   return $resource("/mark/unmarkAll", null,{
		   "unmarkAll": {method: "POST"}
	   });
	}]);

app.factory("MarkSingleTodo", ["$resource", function($resource) {
	   return $resource("/mark/mark", null,{
		   "mark": {method: "POST"}
	   });
	}]);

app.factory("UnmarkSingleTodo", ["$resource", function($resource) {
	   return $resource("/mark/unmark", null,{
		   "unmark": {method: "POST"}
	   });
	}]);

app.factory("DeleteAllTodos", ["$resource", function($resource) {
	   return $resource("/todo/all", null,{
		   "deleteAll": {method: "DELETE"}
	   });
	}]);

app.factory("DeleteCompleted", ["$resource", function($resource) {
	   return $resource("/todo/allCompleted", null,{
		   "deleteAllCompletedTodos": {method: "PUT"}
	   });
	}]);

app.controller("SignInController",["$scope","$window", function ($scope,$window){
// redirects to todos when landed on that page, due to the fact one would only land here(granted access) if credentials are correct
	var signIn = function () {
		alert("Credentials correct. Logging you in")
		$window.location="/todos";
	};
	signIn();
}])

app.controller("InfoController",["$scope","$window","Account", function ($scope,$window,Account){
	//get request for displaying user specific information		
	Account.get(function(items){
		$scope.first_name = items.users[0]["first_name"];
		$scope.last_name = items.users[0]["last_name"];
		$scope.company = items.users[0]["company"];
		$scope.plan = items.users[0]["plan"];
		$scope.email = items.users[0]["email"];
	})

//save function to save the edited fields of my info section
	$scope.save = function(){
		Account.saveData({first_name: $scope.first_name,
				   last_name: $scope.last_name,
			       company: $scope.company,
			       plan: null},function(items){
					   if(items.success){
						   alert("Information saved");
					   } else {
						   alert("Error in saving");
					   }
				   }
		)
	}
	
	$scope.changePlan = function(){
		var date = new Date();
		formattedDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		if($scope.plan == "L"){
			Account.changePlan({plan: "S",date: formattedDate},function(result){
				if(result.success){
					alert("Plan successfully downgraded to S. The maximum capacity for plan S is 10 todo items only. Therefore only the first 10 would stay at the system and all the rest would be deleted");
					$scope.plan = "S";
				} else {
					alert("7 days from registration have passed, thus you are no longer allowed to downgrade your plan");
				}
			})
		}
		else{
			Account.changePlan({plan: "L",date: null},function(result){
				if(result.success){
					   alert("Plan successfully upgraded to L");
					   $scope.plan = "L";
				   } else {
					   alert("Error occurred in upgrading your plan");
				   }
			})	
		}
	}

//go back button to todos list
	$scope.todos = function(){
		$window.location="/todos";
	}
}]);

app.controller("RegistrationController",["$scope","$window","Register", function ($scope,$window,Register){
	$scope.yourEmail = "abv@abv.bg";
	$scope.yourPass = "test";
	$scope.yourCompany = "test";
	$scope.yourFName = "Misho";
	$scope.yourLName = "Test";
	$scope.yourNameOnCard = "Misho Test";
	$scope.yourCardNumber = "4111111111111111";
	$scope.yourCVC = "123";
	
//register function checks if the supplied card details are valid (date of expire not in past)
//additionally checks if email is already in use (database) if everything is correct the registration details are forwarded into database 
//and in iterojs which results in a new customer in sandbox, finally on success user get signed in and redirected to his todo account
	$scope.register = function (){
			//earlier in THIS year
        if($scope.month < (new Date().getMonth() + 1) && $scope.year == new Date().getFullYear()){
           	alert("Card not valid. Selected time in the past");
        }
        else{
        	Register.signUp({email: $scope.yourEmail,
   					      pass: $scope.yourPass,
   					      company: $scope.yourCompany,
   					      firstName: $scope.yourFName,
   					      lastName: $scope.yourLName,
   					      plan: $scope.plan},function(items){
   					    	  if(items.success){
   					    		  var fakePSP = ["CreditCard:Paymill","Debit:Paymill"];
   					    		  var bearer = "";
   					    		  if($scope.selectedItem == "Credit Card") {
   					    			  bearer = fakePSP[0];
   					    		  }
   					    		  else{
   					    			  bearer = fakePSP[1];
   					    		  }
   					    		  signupService = new IteroJS.Signup();
   					    		  paymentService = new IteroJS.Payment({ publicApiKey : "538deacd1d8dd0113010b884" }, 
   					    		  function (ready){alert("Ok")}, 
   					    		  function(error) {alert("Error occurred")});
   					    		  var cart = {
   					    		      "planVariantId": "53902b281d8dd00dc46cedb6"
   					    		  };
   					    		  var customer = {
   					    			  "firstName": $scope.yourFName,
   					    			  "lastName": $scope.yourLName,
   					    			  "emailAddress": $scope.yourEmail
   					    		  };
   					    		  var paymentData = {
   					    			  "bearer": "InvoicePayment", //bearer,
   					    			  "cardNumber": $scope.yourCardNumber,
   					    			  "expiryMonth": $scope.month,
   					    			  "expiryYear": $scope.year,
   					    			  "cardHolder": $scope.yourNameOnCard,
   					    			  "cvc": $scope.yourCVC
   					    		  };
   					    		  signupService.subscribe(paymentService, cart, customer, paymentData,
   					    		      function (subscribeResult) {
   					    			      alert("Success!");
   					    		      },
   					    		      function (errorData) {
   					    		    	  alert("Something went wrong!");
   					    		      });
   					    		  alert("Registration succeeded. Logging you in.")
   					    		  $window.location="/todos";
   					    	  } else {
   					    		  alert("Email already taken, please choose another one");
   					    	  }
   					      }
    		)}
	}                                   
	
	//depending of payment method show up the respective views(fields)
	$scope.payments = ["Credit Card","Direct Debit"];
	$scope.Payment = function(payment) {
    	$scope.selectedItem = payment;
    	if(payment == "Credit Card") $scope.credit = true;
    	else $scope.credit = false;
    }
    $scope.paymentMethod = {
        payment: ""
    };
    
    //auto generated list of year of expiry so that years in past do not turn up
    $scope.months = [1,2,3,4,5,6,7,8,9,10,11,12];
    $scope.years = [];
    for(var i = 0; i < 5; i++){
    	$scope.years[i] = new Date().getFullYear() + i;
    }
    $scope.plans = ["S","L"];
    $scope.plan = {
    		plan: ""
    };
    $scope.Plan = function(plan){
    	$scope.plan = plan;
    }
    $scope.goBack = function(){
    	$window.location="/signin";
    }
    
}])

app.controller("TodosController",["$scope","$window","Todos","TodosDelete","MarkAllTodos","UnmarkAllTodos","MarkSingleTodo","UnmarkSingleTodo","DeleteAllTodos","DeleteCompleted", function ($scope,$window,Todos,TodosDelete,MarkAllTodos,UnmarkAllTodos,MarkSingleTodo,UnmarkSingleTodo,DeleteAllTodos,DeleteCompleted) {
	$scope.items = [];
	var plan = "";
	Todos.get(function(items){
		$scope.items = items.todoList;
		$scope.username = items.username;
		plan = items.plan;
		angular.forEach($scope.items, function(item) {
	  		if(item.done == 1) item.done = true;
		});
		if($scope.left()==0 && $scope.items.length!=0) $scope.mark = true;
	})

// add todo
	$scope.addTodo = function () {
		var flag = false;
		for(var i = 0; i < $scope.items.length; i++){
			if($scope.items[i]["task"] == $scope.todoText) flag=true;
		}
		if(flag){
			alert("No duplicates.Item already in list");
			$scope.todoText = "";
			return;
		}
		if($scope.todoText){
			if(plan == "S" && $scope.items.length == 10){
				alert("You reached the maximum storage for your plan S. You can switch to plan L for unlimited items");
			}
			else{
		        Todos.insert({task: $scope.todoText},function(items){
							 if(items.success){
							 } else {
								 alert("Adding of item failed");
							 }
						 }
				)
				Todos.get(function(items){
					$scope.items = items.todoList;
					angular.forEach($scope.items, function(item) {
						if(item.done == 1) item.done = true;
			    	});
					$scope.mark = false;
			    })
			}
		}
		else{
			alert("Inserting empty item is not allowed");
		}
	    $scope.todoText = "";
	};

// show up left todos count
	$scope.left = function() {
	    var count = 0;
	    angular.forEach($scope.items, function(item) {
	    	if(item.done == false) count++;
	    });
	    return count;
	  };
	
//delete particular task
	$scope.deleteTodo = function(item,task){
		TodosDelete.deleteTodo({task: task},function(items){
			if(items.success) $scope.items.splice($scope.items.indexOf(item), 1);
			else alert("Error in deleting");
		})
	};

// sign out user
	$scope.signout = function(){  
		$window.location.href = "/signout";  
	};

// redirect to my info
	$scope.myaccount = function(){
		$window.location="/myinfo";
	}

	$scope.markAll = function(){
		if($scope.items.length != 0){
			MarkAllTodos.markAll(function(items){
							   if(items.success){
							   } else {
								   alert("Marking of items failed");
							   }
			})
			Todos.get(function(items){
				$scope.items = items.todoList;
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) item.done = true;
				});
				$scope.mark = true;
		    	$scope.unmark = false;
			})
		}
		else{
			alert("No items yet");
		}
	}
	$scope.unmarkAll = function(){
		if($scope.items.length != 0){
			UnmarkAllTodos.unmarkAll(function(items){
							   if(items.success){
							   } else {
								   alert("Unmarking of items failed");
							   }
						   })
			Todos.get(function(items){
				$scope.items = items.todoList;
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) item.done = true;
				});
				$scope.mark = false;
		    	$scope.unmark = true;
			})
		}
		else{
			alert("No items yet");
		}
	} 

// change status of task either done or not
	$scope.change = function (item,done){
		if(done==true){
	        MarkSingleTodo.mark({},{task: item.task},function(items){
						   if(items.success){
						   } else {
							   alert("Marking of item failed");
						   }
		})
		Todos.get(function(items){
			$scope.items = items.todoList;
			angular.forEach($scope.items, function(item) {
				if(item.done == 1) item.done = true;
			});
			$scope.mark = false;
			$scope.unmark = false;
		})
		}
		else {
	        UnmarkSingleTodo.unmark({},{task: item.task},function(items){
						   if(items.success){
						   } else {
							   alert("Unmarking of item failed");
						   }
			})
			Todos.get(function(items){
				$scope.items = items.todoList;
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) item.done = true;
				});
			})
		}
	}

// delete all todos from the list
	$scope.deleteAll = function(){
		DeleteAllTodos.deleteAll({},function(items){
			if(items.success) {
				$scope.items = [];
			    $scope.mark = false;
			}
		})
	}

// deletes all todos marked as done
	 $scope.deleteAllCompleted = function(){
		 DeleteCompleted.deleteAllCompletedTodos({},{tasks: $scope.items},function(items){
	     		if(items.success){
	     			Todos.get(function(items){
	     				$scope.items = items.todoList;
	     				angular.forEach($scope.items, function(item) {
	     					if(item.done == 1) item.done = true;
	     				});
	     			})
	     		} else {
	     			alert("Deleting of item(s) failed");
	     		}
	     	})
	}
	
//save an edited todo task
	$scope.saveTodo = function(newTask,task){
		if(newTask){
	    TodosDelete.editTodo({task:task},{newTask: newTask},function(items){
						   if(items.success){
						   } else {
							   alert("Editting of task failed");
						   }
					   })
		Todos.get(function(items){
			$scope.items = items.todoList;
			angular.forEach($scope.items, function(item) {
		  		if(item.done == 1) item.done = true;
			});
		})
	 	}
	}

//set placeholder when trying to edit task
	$scope.place = function(old){
		return "Current task: " + old;
	}
}])