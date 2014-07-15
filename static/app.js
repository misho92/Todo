// function to get the parameter of the url ( eg http://127.0.0.1:5000/todos?id=93 extract 93, when using like this getQueryVariable("id"))
function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
    var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) { return pair[1]; }
	}
	return (false);
}

angular.module("todo",["ngRoute","ngResource"])
.config(["$routeProvider", function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "/index.html",
            controller: "sign"
        })
        .when("/signin", {
            templateUrl: "../index.html",
            controller: "sign"
        })
        .when("/signup", {
            templateUrl: "../signup.html",
            controller: "reg"
        })
        .when("/todos", {
            templateUrl: "../todo.html",
            controller: "todos"
        })
        .when("/myinfo", {
            templateUrl: "../myaccount.html",
            controller: "info"
        })
        .otherwise({ redirectTo: "/" });
}])

.controller("SignInController",["$scope","$http","$window","$resource", function ($scope,$http,$window,$resource){
//post sign in request passing email and password to the server for a check, if success sign in user, if not error message
	$scope.signin = function () {
		var signIn = $resource( "/signin", 
			{}, { 
				signin: { 
					method: "POST", 
				}
				});
	signIn.signin({email: $scope.yourEmail,
				   pass: $scope.yourPass},function(items){
					   if(items.success){
						   alert("Credentials correct. Logging you in")
						   $window.location="/todos?id=" + items.id;
					   } else {
							alert("Wrong email or pass");
					   }
				   })
	}
}])

.controller("info",["$scope","$http","$window","$resource", function ($scope,$http,$window,$resource){
	//get request for displaying user specific information		
	var Todos = $resource("/myaccount");
	Todos.get(function(items){
		for(var i = 0; i < items.users.length; i++){
			if(items.users[i]["id"] == getQueryVariable("id")) {
				$scope.first_name = items.users[i]["first_name"];
				$scope.last_name = items.users[i]["last_name"];
				$scope.company = items.users[i]["company"];
				if(!$scope.$$phase) $scope.$apply();
			}
		}
	})

//save function to save the edited fields of my info section
	$scope.save = function(){
		var Save = $resource("/myaccount", 
			{}, { 
				save: { 
					method: "PUT", 
				}
				});
		save.save({first_name: $scope.first_name,
				   last_name: $scope.last_name,
			       company: $scope.company,
			       id: getQueryVariable("id")},function(items){
					   if(items.success){
						   alert("Information saved");
					   } else {
						   alert("Error in saving");
					   }
				   }
		)
	}

//go back button to todos list
	$scope.todos = function(){
		$window.location="/todos?id=" + getQueryVariable("id");
	}
}])

.controller("reg",["$scope","$http","$window","$resource", function ($scope,$http,$window,$resource){
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
        	var reg = $resource( "/account", 
   				{}, { 
   					register: { 
   						method: "POST", 
   					}
   					});
    		reg.register({email: $scope.yourEmail,
   					      pass: $scope.yourPass,
   					      company: $scope.yourCompany,
   					      firstName: $scope.yourFName,
   					      lastName: $scope.yourLName},function(items){
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
   					    		  $window.location="/todos?id=" + items.id;
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
    $scope.goBack = function(){
    	$window.location="/signin";
    }
}])

.controller("todos",["$scope","$window","$http","$resource","filterFilter", function ($scope,$window,$http,$resource,filterFilter) {
	$scope.items = [];
	$scope.userId = getQueryVariable("id");
	var Todos = $resource("/todo");
	Todos.get(function(items){
		for(var i = 0; i < items.todoList.length; i++){
			if(items.todoList[i]["user_id"] == getQueryVariable("id")) {
				$scope.items.push(items.todoList[i]);
			}
			else {
				$scope.items = [];
			}
		}
		for(var i = 0; i < items.userIds.length; i++){
			if(items.userIds[i]["id"] == getQueryVariable("id")) {
				$scope.username = items.userIds[i]["first_name"]; 
				//if(!$scope.$$phase) $scope.$apply();
			}
		}
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
        var add = $resource( "/todo", 
			{}, { 
				add: { 
					method: "POST", 
				}
		});
		add.add({task: $scope.todoText,
				 id: getQueryVariable("id")},function(items){
					 if(items.success){
					 } else {
						 alert("Adding of item failed");
					 }
				 }
		)
		Todos.get(function(items){
			$scope.items = [];
			for(var i = 0; i < items.todoList.length; i++){
				if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
				else $scope.items = [];
	    	}
			angular.forEach($scope.items, function(item) {
				if(item.done == 1) item.done = true;
	    	});
			$scope.mark = false;
	    })
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
	$scope.deleteTodo = function(item,task,id){
		var deleteTodo = $resource("/todo/" + task + "/"+ id);
		deleteTodo.delete(function(items){
			if(items.success) $scope.items.splice($scope.items.indexOf(item), 1);
			else alert("Error in deleting");
		})
	};

// sign out user
	$scope.signout = function(){  
		$window.location.href = "/";  
	};

// redirect to my info
	$scope.myaccount = function(){
		$window.location="/myinfo?id=" + getQueryVariable("id");
	}

	$scope.markAll = function(userId){
		if($scope.items.length != 0){
		    var markAll = $resource( "/mark/" + "markAll" + "/" + userId, 
				{}, { 
					markAll: { 
						method: "POST", 
					}
			});
			markAll.markAll({},function(items){
							   if(items.success){
							   } else {
								   alert("Marking of item failed");
							   }
			})
			Todos.get(function(items){
				$scope.items = [];
				for(var i = 0; i < items.todoList.length; i++){
					if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
					else $scope.items = [];
				}
				for(var i = 0; i < items.userIds.length; i++){
					if(items.userIds[i]["id"] == getQueryVariable("id")) {
						$scope.username = items.userIds[i]["first_name"]; 
						if(!$scope.$$phase) $scope.$apply();
					}
				}
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
	$scope.unmarkAll = function(userId){
		if($scope.items.length != 0){
			var unmarkAll = $resource( "/mark/" + "unmarkAll" + "/" + userId, 
				{}, { 
					unmarkAll: { 
						method: "POST", 
					}
			});
			unmarkAll.unmarkAll({},function(items){
							   if(items.success){
							   } else {
								   alert("Unmarking of item failed");
							   }
						   })
			Todos.get(function(items){
				$scope.items = [];
				for(var i = 0; i < items.todoList.length; i++){
					if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
					else $scope.items = [];
				}
				for(var i = 0; i < items.userIds.length; i++){
					if(items.userIds[i]["id"] == getQueryVariable("id")) {
						$scope.username = items.userIds[i]["first_name"]; 
						if(!$scope.$$phase) $scope.$apply();
					}
				}
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
	$scope.change = function (item,done,userId){
		if(done==true){
	        var mark = $resource("/mark/"  + "mark" + "/" + userId, 
				{}, { 
					mark: { 
						method: "POST", 
					}
			});
		mark.mark({task: item.task},function(items){
						   if(items.success){
						   } else {
							   alert("Marking of item failed");
						   }
		})
		Todos.get(function(items){
			$scope.items = [];
			for(var i = 0; i < items.todoList.length; i++){
				if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
				else $scope.items = [];
			}
			for(var i = 0; i < items.userIds.length; i++){
				if(items.userIds[i]["id"] == getQueryVariable("id")) {
					$scope.username = items.userIds[i]["first_name"]; 
					if(!$scope.$$phase) $scope.$apply();
				}
			}
			angular.forEach($scope.items, function(item) {
				if(item.done == 1) item.done = true;
			});
			$scope.mark = false;
			$scope.unmark = false;
		})
		}
		else {
	        var unmark = $resource("/mark/"  + "unmark" + "/" + userId, 
				{}, { 
					unmark: { 
						method: "POST", 
					}
			});
			unmark.unmark({task: item.task},function(items){
						   if(items.success){
						   } else {
							   alert("Unmarking of item failed");
						   }
			})
			Todos.get(function(items){
				$scope.items = [];
				for(var i = 0; i < items.todoList.length; i++){
					if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
					else $scope.items = [];
				}
				for(var i = 0; i < items.userIds.length; i++){
					if(items.userIds[i]["id"] == getQueryVariable("id")) {
						$scope.username = items.userIds[i]["first_name"]; 
						if(!$scope.$$phase) $scope.$apply();
					}
				}
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) item.done = true;
				});
			})
		}
	}

// delete all todos from the list
	$scope.deleteAll = function(){
		var deleteAll = $resource("/todo/" + "all" + "/" + getQueryVariable("id"));
		deleteAll.delete(function(items){
			if(items.success) {
				$scope.items = [];
			    $scope.mark = false;
			}
		})
	}

// deletes all todos marked as done
	 $scope.deleteAllCompleted = function(userId){
	     	var deleteAllCompleted = $resource("/todo/" + "allCompleted/"+ userId, 
				{}, { 
					deleteAllCompleted: { 
						method: "PUT", 
					}
			});
	     	deleteAllCompleted.deleteAllCompleted({tasks: $scope.items},function(items){
	     		if(items.success){
	     			Todos.get(function(items){
	     				$scope.items = [];
	     				for(var i = 0; i < items.todoList.length; i++){
	     					if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
	     					else $scope.items = [];
	     				}
	     				for(var i = 0; i < items.userIds.length; i++){
	     					if(items.userIds[i]["id"] == getQueryVariable("id")) {
	     						$scope.username = items.userIds[i]["first_name"]; 
	     						if(!$scope.$$phase) $scope.$apply();
	     					}
	     				}
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
	$scope.saveTodo = function(newTask,task,userId){
		if(newTask){
	    var saveTodo = $resource("/todo/" + task + "/" + userId, 
			{}, { 
				saveTodo: { 
					method: "PUT", 
				}
		});
	    saveTodo.saveTodo({newTask: newTask},function(items){
						   if(items.success){
						   } else {
							   alert("Editting of task failed");
						   }
					   })
		Todos.get(function(items){
			$scope.items = [];
			for(var i = 0; i < items.todoList.length; i++){
				if(items.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(items.todoList[i]);
				else $scope.items = [];
			}
			for(var i = 0; i < items.userIds.length; i++){
				if(items.userIds[i]["id"] == getQueryVariable("id")) {
					$scope.username = items.userIds[i]["first_name"]; 
					if(!$scope.$$phase) $scope.$apply();
				}
			}
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