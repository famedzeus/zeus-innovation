/**
 * @ngdoc function
 * @name coreServices.ResourceBundle
 * 
 * @description
 * A localisation service.
 * 
 * To use this service, store user message text in json format the app root
 * in a folder named messages.  Use this service to load in the requested user message text, if available.
 * 
 * # Supported Languages
 * Currently the supported language are:
 * 
 * <code>en-GB</code> - English (United Kingdom)
 * 
 * ..End of list.
 * 
 * This service and it's documentation will be updated when(if) localisation is required.
 * 
 * 
 */
angular.module('coreServices').factory('ResourceBundle', ['$http', '$q', 'Cache', 'Language', function ($http, $q, Cache, language) {
	var languageCode = language.currentState.get().code;

	/**
     * @ngdoc method
     * @name coreServices.ResourceBundle:#loadMessageSet
     * @methodOf coreServices.ResourceBundle
     *
     * @description
     * This service will attempt to http GET the required user message text resource
     *
     *
     * @param {string} messageID the file requested id minus the locale code
     * 
     */
	var loadMessageSet = function (messageID) {
		var deferred = $q.defer();
		$http.get('messages/'+messageID + '_' + languageCode + '.json')
		.success(function (data) {

			deferred.resolve(data);
		}).error(function () {

		});

		// TODO: add error response
		return deferred.promise;
	};

	return {
		loadMessageSet: loadMessageSet
	};
}]);
