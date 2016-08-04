/**
 * @ngdoc function
 * @name coreServices.Language
 *
 * @description 
 * A service to manage current language state and list of available languages.
 */
angular.module('coreServices').factory('Language', ['Cache', function (cache) {
	var defaultLangCode = 'en-GB',
		supportedLangs = {
		    "en-GB": {
		    	label: 'English (United Kingdom)',
		    	code: "en-GB"
		    }
		},
		selectedLanguageCode;
	
	(function setInitialState () {
		selectedLanguageCode = cache.fetchObject('defaultLanguageState');
		if (!selectedLanguageCode)
			selectedLanguageCode = defaultLangCode;
	}) ();
	
	/**
	 * setLanguageState
	 * 
	 * tries to set a language state, will succeed if language is in supported list
	 */
	var setLanguageState = function (languageCode) {
		var selectedLanguageIsSupported = supportedLangs[languageCode];
		
		if (selectedLanguageIsSupported) {
			selectedLanguageCode = languageCode;
			cache.saveObject('defaultLanguageState', selectedLanguageCode);
			return true;
		};
		
		return false;
	};
	
	/**
	 * getLanguageState
	 * 
	 * get currently set language
	 */
	var getLanguageState = function () {
		return supportedLangs[selectedLanguageCode];
	};
	
	return {
		currentState: {
			set: setLanguageState,
			get: getLanguageState
		},
		getAllSupported: function () {
			return angular.copy(supportedLangs);
		}
	};
	
}]);