//app settings for routing and declaring which html file to invoke when a give url is entered and which controller is in charge
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
        .when("/portal", {
            templateUrl: "/portal.html",
            controller: "PortalController"
        })
        .otherwise({ redirectTo: "/" });
}])

// app factories which construct resources with some methods in a restful manner
app.factory("Account", ["$resource", function($resource) {
	   return $resource("/myaccount", null,{
		   "saveData": {method: "PUT"}
	   });
	}]);

app.factory("Portal", ["$resource", function($resource) {
	   return $resource("/myportal", null,{
		   "saveData": {method: "PUT"},
		   "changePlan": {method: "PUT"},
		   "cancelPlan": {method: "PUT"}
	   });
	}]);

app.factory("Register", ["$resource", function($resource) {
	   return $resource("/account", null,{
		   "signUp": {method: "POST"}
	   });
	}]);

app.factory("Todos", ["$resource", function($resource) {
	   return $resource("/todo", null,{
		   "insert": {method: "POST"},
		   "deleteSingle": {method: "PUT"},
		   "edit": {method: "PUT"},
		   "deleteAllCompletedTodos": {method: "PUT"},
		   "deleteAll": {method: "DELETE"}
	   });
	}]);

app.factory("Mark",["$resource", function($resource){
	return $resource("/mark",null,{
		"mark": {method: "PUT"}
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

// info controller responsible for and performing all actions on myinfo page
app.controller("InfoController",["$scope","$window","Account", function ($scope,$window,Account){
	
//get request for displaying user specific information		
	Account.get(function(items){
		$scope.user = items.users[0]
		$scope.username = items.users[0]["title"] + " " + items.users[0]["first_name"];
		if(items.users[0]["plan"] == "") 
		  $scope.plan = "None";
		else 
		  $scope.plan = items.users[0]["plan"];
	})

//save function to save the edited fields of my info section
	$scope.save = function(editedUser){
		Account.saveData({editedUser:editedUser},function(items){
					   if(items.success){
						   Account.get(function(items){
							   $scope.user = items.users[0];
								$scope.username = items.users[0]["title"] + " " + items.users[0]["first_name"];
								if(items.users[0]["plan"] == "") 
								  $scope.plan = "None";
								else 
								  $scope.plan = items.users[0]["plan"];
								$scope.editData = false;
							})
					   } else {
						   alert("Error in saving");
					   }
				   }
		)
	}
	
	$scope.titles = ["Mr","Mrs","Miss"];
	$scope.Title = function(title) {
    	$scope.title = title;
    }
    $scope.title = {
        payment: ""
    };

//go back button to todos list
	$scope.todos = function(){
		$window.location="../todos";
	}
}]);

//portal controller responsible for and performing all actions on portal page
app.controller("PortalController",["$scope","$window","Portal","Todos", function ($scope,$window,Portal,Todos){
	
//offloading all user specific data
	Portal.get(function(data){
		$scope.username = data.paymentData[0]["title"] + " " + data.paymentData[0]["username"];
		$scope.portal = data.paymentData[0];
		$scope.editedPaymentMethod = $scope.paymentMethod
		if($scope.portal.paymentMethod == "Credit Card") 
		  $scope.credit = true;
		else 
		  $scope.credit = false;
		$scope.length = "12 months";
		if($scope.portal.plan == "S") 
		  $scope.todosNumber = "10";
		else 
		  $scope.todosNumber = "Unlimited";
		if($scope.portal.plan == "") {
			$scope.portal.plan = "None";
			$scope.length = "None";
			$scope.portal.start = "None";
			$scope.todosNumber = "None";
		}
	})
	
// cancel plan option
	$scope.cancelPlan = function(){
	    if (confirm("Are you sure? All your todos and subscription details would be deleted") == true) {
	    	editedPortal = {
	    			paymentMethod: null,
	    			plan: null
	    	}
	    	Portal.cancelPlan({editedPortal: editedPortal},function(result){
	    		if(result.success){
	    			$scope.portal.plan = "None";
	    			$scope.length = "None";
	    			$scope.portal.start = "None";
	    			$scope.todosNumber = "None";
	    		}
	    	})
	    }
	}
	
//change of plan option, only if possible (upgrade - S to L at anytime, downgrade L to S only within 7 days of registration)
	$scope.changePlan = function(){
			var date = new Date();
			formattedDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
			if($scope.portal.plan == "L"){
				if (confirm("Are you sure you want to change your plan to S?") == true) {
					Todos.get(function(items){
						if(items.todoList.length <= 10){
							editedPortal = {
					    			paymentMethod: null,
					    			plan: "S",
					    			date: formattedDate
					    	}
							Portal.changePlan({editedPortal:editedPortal},function(result){
								if(result.success){
									alert("Plan successfully downgraded to S. The maximum capacity for plan S is 10 todo items only.");
									$scope.portal.plan = "S";
									$scope.todosNumber = "10";
								} else {
									alert("7 days from registration have passed, thus you are no longer allowed to downgrade your plan.");
								}
							})
						}
						else{
							alert("Downgrade not possible, items over the maximum of 10 for plan S. Please reduce the numbers to 10 and then try again to downgrade.")
						}
					})
				}
			}
		else{
			if (confirm("Are you sure you want to change your plan to L?") == true) {
				editedPortal = {
		    			paymentMethod: null,
		    			plan: "L",
		    			date: null
		    	}
				Portal.changePlan({editedPortal:editedPortal},function(result){
					if(result.success){
						   alert("Plan successfully upgraded to L. You can have unlimited number of items.");
						   $scope.portal.plan = "L";
						   $scope.todosNumber = "Unlimited";
					   } else {
						   alert("Error occurred in upgrading your plan.");
					   }
				})	
			}
		}
	}
	
	$scope.payments = ["Credit Card","Direct Debit"];
	$scope.Payment = function(payment) {
    	$scope.editedPortal.paymentMethod = payment;
    	if(payment == "Credit Card") 
    	  $scope.credit = true;
    	else 
    	  $scope.credit = false;
    }
    
//auto generated list of year of expiry so that years in past do not turn up
    $scope.months = [1,2,3,4,5,6,7,8,9,10,11,12];
    $scope.years = [];
    for(var i = 0; i < 5; i++){
    	$scope.years[i] = new Date().getFullYear() + i;
    }
    $scope.validity = function(month,year){
    	$scope.editedPortal.month = month;
    	$scope.editedPortal.year = year;
    }

// save edited data
    $scope.saveData = function(editedPortal){
    	//earlier in THIS year
        if($scope.month < (new Date().getMonth() + 1) && $scope.year == new Date().getFullYear()){
           	alert("Card not valid. Selected time in the past");
        }
        else{
	    	Portal.saveData({editedPortal:editedPortal},function(data){
	    						 if(data.success){
	    							 Portal.get(function(data){
	    								 	$scope.portal = data.paymentData[0];
	    									$scope.editedPaymentMethod = $scope.paymentMethod
	    									if($scope.portal.paymentMethod == "Credit Card") 
	    									  $scope.credit = true;
	    									else 
	    									  $scope.credit = false;
	    									$scope.editData = false;
	    								})
	    						 }
	    						 else{
	    							 alert("Error in displaying data")
	    						 }
	    					 })
        }
    }
	
//go back button to todos list
	$scope.todos = function(){
		$window.location="../todos";
	}
}]);

//registration controller responsible for and performing all actions on signup page
app.controller("RegistrationController",["$scope","$window","Register", function ($scope,$window,Register){
	
//register function checks if the supplied card details are valid (date of expire not in past)
//additionally checks if email is already in use (database) if everything is correct the registration details are forwarded into database 
//and in iterojs which results in a new customer in sandbox, finally on success user get signed in and redirected to his todo account
	$scope.register = function (signUp){
		//earlier in THIS year
        if($scope.month < (new Date().getMonth() + 1) && $scope.year == new Date().getFullYear()){
           	alert("Card not valid. Selected time in the past");
        }
        else{
        	Register.signUp({signUp:signUp},function(items){
   					    	  if(items.success){
   					    		  var fakePSP = ["CreditCard:Paymill","Debit:Paymill"];
   					    		  var bearer = "";
   					    		  if($scope.paymentMethod == "Credit Card")
   					    			bearer = fakePSP[0];
   					    		  else
   					    			bearer = fakePSP[1];
   					    		  signupService = new IteroJS.Signup();
   					    		  paymentService = new IteroJS.Payment({ publicApiKey : "53d604d651f4599a9c52c2b9" }, 
   					    		  function (ready){alert("Ok")}, 
   					    		  function(error) {alert("Error occurred")});
   					    		  var cart = {
   					    		      "planVariantId": "53d60e1851f4599a9c52c2d5"
   					    		  };
   					    		  var customer = {
   					    			  "firstName": $scope.signUp.FName,
   					    			  "lastName": $scope.signUp.LName,
   					    			  "emailAddress": $scope.signUp.email,
   					    			  "customFields.title": $scope.signUp.title
   					    		  };
   					    		  var paymentData = {
   					    			  "bearer": "InvoicePayment",//bearer,
   					    			  "cardNumber": $scope.signUp.cardNumber,
   					    			  "expiryMonth": $scope.signUp.month,
   					    			  "expiryYear": $scope.signUp.year,
   					    			  "cardHolder": $scope.signUp.nameOnCard,
   					    			  "cvc": $scope.signUp.CVC
   					    		  };
   					    		  signupService.subscribe(paymentService, cart, customer, paymentData,
   					    		      function (subscribeResult) {
   					    			      alert("Success!");
	   					    			  alert("Registration succeeded. Logging you in.")
	   	   					    		  $window.location="/todos";
   					    		      },
   					    		      function (errorData) {
   					    		    	  alert("Something went wrong!");
   					    		      });
   					    	  } else {
   					    		  alert("Email already taken, please choose another one");
   					    	  }
   					      }
    		)}
	}                                   
	
	//depending of payment method show up the respective views(fields)
	$scope.payments = ["Credit Card","Direct Debit"];
	$scope.Payment = function(payment) {
    	$scope.paymentMethod = payment;
    	if(payment == "Credit Card") 
    	  $scope.credit = true;
    	else 
    	  $scope.credit = false;
    }
    $scope.paymentMethod = {
        payment: ""
    };
    
    $scope.titles = ["Mr","Mrs","Miss"];
	$scope.Title = function(title) {
    	$scope.title = title;
    }
    $scope.title = {
        payment: ""
    };
    
    //auto generated list of year of expiry so that years in past do not turn up
    $scope.months = [1,2,3,4,5,6,7,8,9,10,11,12];
    $scope.years = [];
    for(var i = 0; i < 5; i++){
    	$scope.years[i] = new Date().getFullYear() + i;
    }
    $scope.validity = function(month,year){
    	$scope.month = month;
    	$scope.year = year;
    }
    
    $scope.plans = ["S","L"];
    $scope.plan = {
    		plan: ""
    };
    $scope.Plan = function(plan){
    	$scope.plan = plan;
    }
    $scope.goBack = function(){
    	$window.location="../signin";
    }
    
}])

// todos controller responsible for and performing all actions on todo page
app.controller("TodosController",["$scope","$window","Todos","Mark", function ($scope,$window,Todos,Mark) {
	$scope.items = [];
	var plan = "";
	
// todos get request loading all user specific data
	Todos.get(function(items){
		$scope.items = items.todoList;
		$scope.username = items.row[2] + " " + items.row[0];
		plan = items.row[1];
		angular.forEach($scope.items, function(item) {
	  		if(item.done == 1) 
	  		  item.done = true;
		});
		if($scope.left()==0 && $scope.items.length!=0) 
		  $scope.mark = true;
	})

// add todo, only if not empty, not already in the list, and there is enough space in user's current plan
	$scope.addTodo = function () {
		var flag = false;
		for(var i = 0; i < $scope.items.length; i++){
			if($scope.items[i]["todo"] == $scope.todoText) 
			  flag=true;
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
		        Todos.insert({todo: $scope.todoText},function(items){
							 if(items.success){
							 } else {
								 alert("Adding of item failed");
							 }
						 }
				)
				Todos.get(function(items){
					$scope.items = items.todoList;
					angular.forEach($scope.items, function(item) {
						if(item.done == 1) 
						  item.done = true;
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
	    	if(item.done == false) 
	    	  count++;
	    });
	    return count;
	  };
	
//delete particular todo
	$scope.deleteTodo = function(item,todo){
		Todos.deleteSingle({},{edit: "deleteOne",todo: todo},function(items){
			if(items.success) 
			  $scope.items.splice($scope.items.indexOf(item), 1);
			else 
			  alert("Error in deleting");
		})
	};

// sign out user
	$scope.signout = function(){  
		$window.location.href = "/signout";  
	};
	
//mark all todos as completed
	$scope.markAll = function(){
		if($scope.items.length != 0){
			Mark.mark({mark: true, all: true}, function(items){
							   if(items.success){
							   } else {
								   alert("Marking of items failed");
							   }
			})
			Todos.get(function(items){
				$scope.items = items.todoList;
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) 
			  		  item.done = true;
				});
				$scope.mark = true;
		    	$scope.unmark = false;
			})
		}
		else{
			alert("No items yet");
		}
	}
	
//unmark all todos
	$scope.unmarkAll = function(){
		if($scope.items.length != 0){
			Mark.mark({mark: false, all: true}, function(items){
							   if(items.success){
							   } else {
								   alert("Unmarking of items failed");
							   }
						   })
			Todos.get(function(items){
				$scope.items = items.todoList;
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) 
			  		  item.done = true;
				});
				$scope.mark = false;
		    	$scope.unmark = true;
			})
		}
		else{
			alert("No items yet");
		}
	} 

// change status of a single todo either done or not
	$scope.change = function (item,done){
		if(done==true){
	        Mark.mark({},{mark: true, all: false, todo: item.todo},function(items){
						   if(items.success){
						   } else {
							   alert("Marking of item failed");
						   }
		})
		Todos.get(function(items){
			$scope.items = items.todoList;
			angular.forEach($scope.items, function(item) {
				if(item.done == 1) 
				  item.done = true;
			});
			$scope.mark = false;
			$scope.unmark = false;
		})
		}
		else {
	        Mark.mark({},{mark: false, all: false, todo: item.todo},function(items){
						   if(items.success){
						   } else {
							   alert("Unmarking of item failed");
						   }
			})
			Todos.get(function(items){
				$scope.items = items.todoList;
				angular.forEach($scope.items, function(item) {
			  		if(item.done == 1) 
			  		  item.done = true;
				});
			})
		}
	}

// delete all todos from the list
	$scope.deleteAll = function(){
		Todos.deleteAll({},function(items){
			if(items.success) {
				$scope.items = [];
			    $scope.mark = false;
			}
		})
	}

// deletes all todos marked as done
	 $scope.deleteAllCompleted = function(){
		 Todos.deleteAllCompletedTodos({},{edit: "deleteAllCompleted", todos: $scope.items},function(items){
	     		if(items.success){
	     			Todos.get(function(items){
	     				$scope.items = items.todoList;
	     				angular.forEach($scope.items, function(item) {
	     					if(item.done == 1) 
	     					  item.done = true;
	     				});
	     			})
	     		} else {
	     			alert("Deleting of item(s) failed");
	     		}
	     	})
	}
	
//save an edited todo
	$scope.saveTodo = function(newtodo,todo){
		if(newtodo){
	    Todos.edit({},{todo: todo, newtodo: newtodo,edit: "one"},function(items){
						   if(items.success){
						   } else {
							   alert("Editting of todo failed");
						   }
					   })
		Todos.get(function(items){
			$scope.items = items.todoList;
			angular.forEach($scope.items, function(item) {
		  		if(item.done == 1) 
		  		  item.done = true;
			});
		})
	 	}
	}

//set placeholder when trying to edit todo
	$scope.place = function(old){
		return "Current todo: " + old;
	}
}])