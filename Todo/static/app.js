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
            templateUrl: "../index.html",
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
        .when("/todos?id=:userId", {
            templateUrl: "../todo.html",
            controller: "todos"
        })
        .when("/myinfo", {
            templateUrl: "../myaccount.html",
            controller: "info"
        })
        .otherwise({ redirectTo: "/" });
}])

.controller("sign",["$scope","$http","$window", function ($scope,$http,$window){
//post signin request passing email and password to the server for a check, if success signin user, if not error message
	$scope.signin = function () {
		$http.post("signin", {
			email: $scope.yourEmail,
			pass: $scope.yourPass
		})
			.success(function(data, status, headers, config) {
			if (data.success) {
				alert("Credentials correct. Logging you in")
				$window.location="/todos?id=" + data.id;
			} else {
			  	alert("Wrong email or pass");
			}
			})
			.error(function(data, status, headers, config) {
				alert("Input fields are empty. Fill them in");
			});
	}
}])

.controller("info",["$scope","$http","$window", function ($scope,$http,$window){
	//get request for displaying user specific information
	 $http.get("/myaccount")
	 	.success(function(data,status,header,config){
			if(data.success){
				for(var i = 0; i < data.users.length; i++){
					if(data.users[i]["id"] == getQueryVariable("id")) {
						$scope.first_name = data.users[i]["first_name"];
						$scope.last_name = data.users[i]["last_name"];
						$scope.company = data.users[i]["company"];
						if(!$scope.$$phase) $scope.$apply();
					}
				}
			}
			else{
				alert("Error in displaying info");
			}
		})
		.error(function(data,status,header,config){
			alert("Error in displaying");
		})

//save function to save the editted fiels of my info section
	$scope.save = function(){
		$http.put("/myaccount",{
			first_name: $scope.first_name,
			last_name: $scope.last_name,
			company: $scope.company,
			id: getQueryVariable("id")
		})
		.success(function(data,status,header,config){
			if(data.success){
				alert("Information saved");
			}
			else{
				alert("Error in saving info");
			}
		})
		.error(function(data,status,header,config){
			alert("Error in saving");
		})
	}

//go back button to todos list
	$scope.todos = function(){
		$window.location="/todos?id=" + getQueryVariable("id");
	}

}])

.controller("reg",["$scope","$http","$window", function ($scope,$http,$window){
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
				$http.post("account", {
		        	email: $scope.yourEmail,
		        	pass: $scope.yourPass,
		        	company: $scope.yourCompany,
		        	firstName: $scope.yourFName,
		        	lastName: $scope.yourLName
		        })
		        .success(function(data, status, headers, config) {
		        	if (data.success) {
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
			            	$window.location="/todos?id=" + data.id;
		                } else {
		                	alert("Email already taken, please choose another one");
		                }
		            })
		            .error(function(data, status, headers, config) {
		            	alert("Please fill all fields in");
		            });
            	}                                   
	}
	$scope.payments = ["Credit Card","Direct Debit"];
	$scope.Payment = function(payment) {
    	$scope.selectedItem = payment;
    	if(payment == "Credit Card") $scope.credit = true;
    	else $scope.credit = false;
    }
    $scope.paymentMethod = {
        payment: ""
    };
    
    $scope.months = [1,2,3,4,5,6,7,8,9,10,11,12];
    $scope.years = [];
    for(var i = 0; i < 5; i++){
    	$scope.years[i] = new Date().getFullYear() + i;
    }
    $scope.goBack = function(){
    	$window.location="/signin";
    }
}])

.controller("todos",["$scope","$window","$http","filterFilter", function ($scope,$window,$http,filterFilter) {
	$scope.items = [];
	$scope.userId = getQueryVariable("id");
	$http.get("/todo")
		.success(function(data,status,header,config){
			if(data.success){
				for(var i = 0; i < data.todoList.length; i++){
					if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
					else $scope.items = [];
				}
				for(var i = 0; i < data.userIds.length; i++){
					if(data.userIds[i]["id"] == getQueryVariable("id")) $scope.username = data.userIds[i]["first_name"]; if(!$scope.$$phase) $scope.$apply();
				} 
				angular.forEach($scope.items, function(item) {
		      		if(item.done == 1) item.done = true;
		    	});
		    	if($scope.left()==0 && $scope.items.length!=0) $scope.mark = true;
			}
			else{
				alert("Error in displaying tasks");
			}
		})
		.error(function(data,status,header,config){
			alert("Error in displaying");
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
	    $http.post("/todo", {
	    	task: $scope.todoText,
	    	id: getQueryVariable("id")
	    })
	    	.success(function(data, status, headers, config) {
	        if (data.success) {
	        } else {
	        	alert("Adding of item failed");
	        }
	        $http.get("/todo")
				.success(function(data,status,header,config){
				if(data.success){
					$scope.items = [];
					for(var i = 0; i < data.todoList.length; i++){
						if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
						else $scope.items = [];
					}
					angular.forEach($scope.items, function(item) {
	      				if(item.done == 1) item.done = true;
	    			});
	    			$scope.mark = false;
				}
				else{
					alert("Error in displaying tasks");
				}
				})
				.error(function(data,status,header,config){
					alert("Error in displaying");
				})
	            })
	            .error(function(data, status, headers, config) {
	            });
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
		$http.delete("/todo/" + task + "/"+ id)
		.success(function(data, status, headers, config){
	    	$scope.items.splice($scope.items.indexOf(item), 1);
	  	})
	  	.error(function(data, status, headers, config){
	    	alert("Error")
	  	});
	};

// sign out user
	$scope.signout = function(){  
		$window.location.href = "/";  
	};

// redirect to my info
	$scope.myaccount = function(){
		$window.location="/myinfo?id=" + getQueryVariable("id");
	}

	$scope.markall = function(userId){
		$http.post("/mark/" + "markAll" + "/" + userId, {
	    })
	    .success(function(data, status, headers, config) {
	    if (data.success) {
	    } else {
	      	  alert("Marking of item failed");
	    }
	    $http.get("/todo")
		.success(function(data,status,header,config){
		if(data.success){
			$scope.items = [];
			for(var i = 0; i < data.todoList.length; i++){
				if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
				else $scope.items = [];
			}
			angular.forEach($scope.items, function(item) {
	      	if(item.done == 1) item.done = true;
	    	});
	    	$scope.mark = true;
	    	$scope.unmark = false;
		}
		else{
			alert("Error in displaying tasks");
		}
		})
		.error(function(data,status,header,config){
			alert("Error in displaying");
		})
	    })
	    .error(function(data, status, headers, config) {
	    	alert("Error");
	    });
	    }
	$scope.unmarkall = function(userId){
		$http.post("/mark/"  + "unmarkAll" + "/" + userId, {
	    })
	    .success(function(data, status, headers, config) {
	    if (data.success) {
	    } else {
	    	alert("Unmarking of item failed");
	    }
	    $http.get("/todo")
			.success(function(data,status,header,config){
			if(data.success){
				$scope.items = [];
				for(var i = 0; i < data.todoList.length; i++){
					if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
					else $scope.items = [];
				}
				angular.forEach($scope.items, function(item) {
	      			if(item.done == 1) item.done = true;
	    			});
	    		$scope.unmark = true;
	    		$scope.mark = false;
			}
			else{
				alert("Error in displaying tasks");
			}
			})
			.error(function(data,status,header,config){
				alert("Error in displaying");
			})
	            })
	     .error(function(data, status, headers, config) {
	            	alert("Error");
	     });
	} 

// change statuso of task either done or not
	$scope.change = function (item,done,userId){
		if(done==true){
			$http.post("/mark/"  + "mark" + "/" + userId, {
	        	task: item.task
	        })
	        .success(function(data, status, headers, config) {
	        if (data.success) {
	        } else {
	        	alert("Marking of item failed");
	        }
	        $http.get("/todo")
				.success(function(data,status,header,config){
				if(data.success){
					$scope.items = [];
					for(var i = 0; i < data.todoList.length; i++){
						if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
						else $scope.items = [];
					}
					angular.forEach($scope.items, function(item) {
	      				if(item.done == 1) item.done = true;
	    			});
	    			$scope.mark = false;
	    			$scope.unmark = false;
				}
				else{
					alert("Error in displaying tasks");
				}
				})
				.error(function(data,status,header,config){
					alert("Error in displaying");
				})
	        })
	        .error(function(data, status, headers, config) {
	        	alert("Error");
	        });
		}
		else {
			$http.post("/mark/" + "unmark" + "/" + userId, {
	        	task: item.task
	        })
	        .success(function(data, status, headers, config) {
	        if (data.success) {
	        } else {
	        	alert("Unmarking of item failed");
	        }
	        $http.get("/todo")
			.success(function(data,status,header,config){
			if(data.success){
				$scope.items = [];
				for(var i = 0; i < data.todoList.length; i++){
						if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
						else $scope.items = [];
				}
				angular.forEach($scope.items, function(item) {
	      			if(item.done == 1) item.done = true;
	    		});
			}
			else{
				alert("Error in displaying tasks");
			}
			})
			.error(function(data,status,header,config){
				alert("Error in displaying");
			})
	        })
	        .error(function(data, status, headers, config) {
	        	alert("Error");
	        });
		}
	}

// delete all todos from the list
	$scope.deleteAll = function(){
		$http.delete("/todo/" + "all" + "/" + getQueryVariable("id"))
		.success(function(data, status, headers, config){
			$scope.items = [];
		    $scope.mark = false;
		})
		.error(function(data, status, headers, config){
		    alert("Error")
		}); 
	}

// deletes all todos marked as done
	 $scope.deleteAllCompleted = function(userId){
	     $http.put("/todo/" + "all/"+ userId, {
	     	 tasks: $scope.items
	     })
	     .success(function(data, status, headers, config) {
	     	 if (data.success) {
	             $http.get("/todo")
				 .success(function(data,status,header,config){
				 if(data.success){
				 	 $scope.items = [];
					 for(var i = 0; i < data.todoList.length; i++){
						 if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
						 else $scope.items = [];
					 }
					 angular.forEach($scope.items, function(item) {
	      			 	 if(item.done == 1) item.done = true;
	    			 });
				 }
				 else{
					 alert("Error in displaying tasks");
				 }
				 })
				 .error(function(data,status,header,config){
				 	 alert("Error in displaying");
				 })
	             } else {
	                 alert("Deleting of item(s) failed");
	             }
	             })
	             .error(function(data, status, headers, config) {
	            	alert("Error");
	             });
	}
	
//save an editted todo task
	$scope.saveTodo = function(newTask,task,userId){
		if(newTask){
		$http.put("/todo/" + task + "/" + userId, {
	    	newTask: newTask
	    })
	    .success(function(data, status, headers, config) {
	    if (data.success) {
	    } else {
	    	alert("Editting of task failed");
	    }
	    $http.get("/todo")
		.success(function(data,status,header,config){
		if(data.success){
			$scope.items = [];
			for(var i = 0; i < data.todoList.length; i++){
				if(data.todoList[i]["user_id"] == getQueryVariable("id")) $scope.items.push(data.todoList[i]);
				else $scope.items = [];
		}
		angular.forEach($scope.items, function(item) {
	    	if(item.done == 1) item.done = true;
	    });
		}
		else{
			alert("Error in displaying tasks");
		}
		})
		.error(function(data,status,header,config){
			alert("Error in displaying");
		})
	    })
	    .error(function(data, status, headers, config) {
	    	alert("Error");
	    });
	 	}
	}

//set placeholder when trying to edit task
	$scope.place = function(old){
		return "Current task: " + old;
	}
}])