
/**
 * @ngdoc function
 * @name coreServices.authTokens
 * 
 * @description
 * A wrapper for single instance auth token objects, which also handles the caching of
 * the tokens
 * 
 */
angular.module('coreServices').factory('authTokens', ['Cache', function (cache) {
	var cacheKey = "dealingAuthTokens"
	
	var authTokens = cache.fetchObject(cacheKey);
	
	if (!authTokens) {
		authTokens = {};
	} else {
		delete authTokens['dateSaved'];
	
	}
	
	var get = function () {
		
		return authTokens;
	};
	
	var set = function (newAuthTokens) {
		if (!angular.isObject(newAuthTokens))
			return false;
		authTokens = newAuthTokens;
		cache.saveObject(cacheKey, authTokens);
		delete authTokens['dateSaved'];
		return authTokens;
	};
	
	return {
		get: get,
		set: set
	}
}]);