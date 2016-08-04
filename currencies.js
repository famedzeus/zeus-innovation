angular.module('dealingServices').factory('currencies', ['$resource', 'ServerProperties', 'Cache', 
	                                        function ($resource, ServerProperties, cache) {

	return $resource(ServerProperties.URL() + 'currencies', {
	}, {
		get:  {
			method: "GET",
			isArray: true,
			cache: true,
			interceptor: {
				response: function (response) {
					return response.data.length != 0 ? response.data : null;
				},
				responseError: function(response) {
					return null;
				}
			}
		}
	});

}]);
