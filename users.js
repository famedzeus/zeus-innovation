angular.module('dealingServices').factory('users', ['Cache', '$resource', '$http', 'ServerProperties', 'authTokens','GlobalUserMessageService',
	                                        function (cache, $resource, $http, ServerProperties, authTokens, userMessage) {

	// check cache for user details
	var userDetails = cache.fetchObject('userDetails');
	
	// no previous details
	if (!userDetails) {
		userDetails = {
			loggedIn: false
		}
	} else {
		cache.setUniqueKey(userDetails.displayName);
	}
	
	var user = {};
	
	user.getAuth = function () {
		if (!userDetails["ba-sso-uid"] || !userDetails["auth-token"])
			return false;
		return {
			"ba-sso-uid": userDetails["ba-sso-uid"],
			"auth-token": userDetails["auth-token"]
		}
	};

	var getDetails = function (uid) {
		return $http.get(ServerProperties.URL() + "users/" + uid).then(
			function (data) {
				return data;
		});
	};

	// login bootstrap
	user.login = function (params, requestParams) {

		return $http.get(ServerProperties.URL() + "authentication/login", {
			headers: { "ba-sso-uid": params.uid }, params: requestParams }).then(function (data) {
			var tokens = {};
			
			userDetails.loggedIn = true;
			
			tokens["ba-sso-uid"] = params.uid;
			tokens["auth-token"] = data.headers()["auth-token"];

			authTokens.set(tokens);

			return getDetails(params.uid).then(function (response) {
				angular.extend(userDetails, response.data);
				cache.setUniqueKey(userDetails.displayName);
				authTokens.set(tokens);
				// userDetails.userRoles.splice(0,1);
				// userDetails.userRoles = ["DealModeller"];
				// userDetails.userRoles.push("DealApprover");
				// userDetails.userRoles.push("GlobalStrategist");
				// userDetails.userRoles.push("PaymentAdmin");
				// userDetails.userRoles.push("DealModeller");
				// userDetails.userRoles = userDetails.userRoles.slice(-1);
				// userDetails.userRoles = userDetails.userRoles.slice(-2);
				// userDetails.userRoles = userDetails.userRoles.slice(-4);
				// console.log(userDetails.userRoles);
				cache.saveObject('userDetails', userDetails);
			});
		});
	};

	user.getDetails = function () {
		if (userDetails.displayName) {
			return {
				displayName: userDetails.displayName,
				userRoles: userDetails.userRoles,
				ownerUserId: userDetails.userId
			};
		}
		return {};
	};
	
	user.remove = function () {
		var prom = user.logout();
		if (userDetails.displayName) {
			
			prom.then(function () {
				userDetails = {};
				cache.saveObject('userDetails', userDetails);
				authTokens.set({});
			});
		}
		return prom;
	};
	
	// logout
	user.logout = function () {
		try {
			var res = $http.get(ServerProperties.URL() + "authentication/logout", {});
			res.then(function (data) {
				userDetails.loggedIn = false;
				return data;
			});
			return res;
		} catch(e) {
			userMessage.setMessage("User logout error:" + e);
			userMessage.state.setError();
			console.log("User logout error:" + e);
		}
	};
	
	user.isLoggedIn = function () {
		return userDetails.loggedIn;
	};
	
	// This function is becoming legacy code --
	// Left for now to catch any left over calls
	// but should be removed, when able to.
	user.roleIs = function (userRole) {
		if (!userDetails || !userDetails.userRoles) {
			return false;
		}
		
		for (var i = 0; i < userDetails.userRoles.length; i ++) {
			if (userDetails.userRoles[i] === userRole) {
				return true;
			}
		}
		return false;
	};
	
	/* Rules for consolidation of accesses by role */
	var allow = true;
	var deny = false;
	var accessRules = {
		modelling:{"DealModeller":true,"GlobalStrategist":true,"PaymentAdmin":false,"DealApprover":true},
		templates:{"DealModeller":false,"GlobalStrategist":true,"PaymentAdmin":false,"DealApprover":true},
		approvals:{"DealModeller":false,"GlobalStrategist":false,"PaymentAdmin":false,"DealApprover":true},
		paymentAdjustments:{"DealModeller":false,"GlobalStrategist":true,"PaymentAdmin":true,"DealApprover":false},
		paymentAdjustmentsEditing:{"DealModeller":false,"GlobalStrategist":false,"PaymentAdmin":true,"DealApprover":false},
		paymentAdjustmentsSummary:{"DealModeller":false,"GlobalStrategist":true,"PaymentAdmin":true,"DealApprover":false}
	};

	/* Find any allowed access for the roles the user has for this application section*/
	user.isAccessAllowed = function(applicationSection) {
		
		if(userDetails.userRoles) {
		
			var access = false;
			
				for (var i = 0; i < userDetails.userRoles.length; i ++) {
					if(!access) {
						if(accessRules[applicationSection][userDetails.userRoles[i]] == true) {
							// Found an access
							access = true;
						}
					}
				}

			return access;
		}
	};

//	userDetails.userRoles = ['PaymentAdmin'];
	
	return user;
}]);