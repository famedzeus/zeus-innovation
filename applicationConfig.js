/**
 * @ngdoc interface
 * @name coreServices.applicationConfig
 * @description
 * Manage global application state settings - sort of like a messaging
 * service between controllers.
 *
 * It manages
 *  * timeout period
 *  * location change permission
 *  * current application mode and section which the user is in
 *  * which redirect url the app should use after logout
 *  * current environment the app is running in
 *
 *  Quite a few services and controllers are dependent upon this module as it's
 *  needed for the app to have a shared state.
 *
 *  The service also uses the `cache` service to automatically cache any state changes.
 *
 * 	@param {Object} Cache local object caching service
 * 	@param {Object} $location AngularJS $location service
 */
angular.module('coreServices').factory('applicationConfig', ['Cache', '$location', function (cache, $location) {
		// Private variables
		var appModeList = {
			"modelling": "modelling",
			"admin": "admin",
			"maintenance": "maintenance",
			"paymentAdmin" : "paymentAdmin"
		},
		maxInactionPeriod = 600000, 		// Time in ms until timeout modal pops up
		timeoutModalTimeLimit = 300000,		// Time until timeout modal will auto log out
		timeoutRESTRequest = 180000,		// 3 mins
		bodyClass,							//
		locationChangePermitted = true,		// Flag for if app is allowed to change location
		disableConsoleLogging = true,
		current = {
			appMode: "",				// current app mode
			appSection: ""				// current app section
		},
		currentEnvironment,				// environment the app is configured for
		versionNo = "1.8.7",
		showWelcomeMessage = true,
		logoutRedirect = {				// logout redirect urls
			local: '/login',
			live: 'https://auth.baplc.com/baAuthnApp/countdown.jsp',
			uat: 'https://auth-uat.baplc.com/baAuthnApp/countdown.jsp'
		},
		showWelcomeMessage = cache.fetchObject('welcomeMessage');

	if (!showWelcomeMessage) {
		showWelcomeMessage = true;
	} else {
		showWelcomeMessage = showWelcomeMessage.show;
	}


	// Auto detect the apps environment
	(function autoDetectAndSetEnv () {
		var host = $location.host();
		// match host and set current environment
		if (host.match('ideal-dev')) {
			currentEnvironment = 'dev';
		} else if (host.match('ideal')) {
			currentEnvironment = 'live';
		} else if (host.match('baplc')) {
			currentEnvironment = 'uat';
		} else if (host.match('ideal-tst')) {
			currentEnvironment = 'test';
		} else {
			currentEnvironment = 'local';
		}
	}) ();

	// Getters & setters

	// Location change getter and setter
	var allowLocationChange = function (param) {
		locationChangePermitted = param ? true : false;
	};

	var isLocationChangeAllowed = function () {
		return locationChangePermitted;
	};

	var log = function(text) {
		if(!disableConsoleLogging) {
			console.log(text);
		}
	};
	var trace = function(text) {
		if(!disableConsoleLogging) {
			console.log("->"+text);
		}
	};

	// Check cache for app state
	var appState = cache.fetchObject('applicationConfig');
	if (appState)
		current = appState;

	// AppMode
	var setAppMode = function (appMode) {
		if (!appModeList[appMode] && appMode !== undefined)
			return false;
		current.appMode = appMode;
		cache.saveObject('applicationConfig', current);
		return true;
	};

	var compareWithCurrentMode = function (mode) {
		if (mode === current.appMode)
			return true;
		return false;
	};

	var getAppMode = function () {
		return current.appMode;
	};

	// AppSection
	var getCurrentSection = function () {
		return current.appSection;
	};

	var setCurrentSection = function (section) {
		current.appSection = section;
		cache.saveObject('applicationConfig', current);
	};

	var compareWithCurrentSection = function (section) {
		if (section === current.appSection)
			return true;
		return false;
	};

	var sectionContains = function(section) {
		var e = current.appSection.indexOf(section);
		if(e != -1) {
			return true;
		}
		return false;
	}

	return {
		/**
		 * @ngdoc object
		 * @methodOf coreServices.applicationConfig
		 * @name coreServices.applicationConfig#mode
		 * @description
		 * Application mode container object
		 */

		/**
		 * @ngdoc method
		 * @methodOf coreServices.applicationConfig#mode
		 * @name coreServices.applicationConfig.mode#get
		 * @description
		 * fdfs
		 */
		mode: {
			get: getAppMode,
			set: setAppMode,
			compare: compareWithCurrentMode
		},
		log:log,
		trace:trace,
		consoleLogging:{
			toggle:function() {
				disableConsoleLogging = !disableConsoleLogging;
				console.log("Trace:"+!disableConsoleLogging);
			},
			get:function() {
				return disableConsoleLogging;
			}
		},
		section: {
			get: getCurrentSection,
			set: setCurrentSection,
			compare: compareWithCurrentSection,
			contains: sectionContains
		},
		routeChangePermission: {
			get: isLocationChangeAllowed,
			set: allowLocationChange,
		},
		inactionPeriod: {
			get: function () {
				return maxInactionPeriod;
			}
		},
		timeoutModalTimeLimit: {
			get: function () {
				return timeoutModalTimeLimit;
			}
		},
		timeoutRESTRequest: {
			get: function () {
				return timeoutRESTRequest;
			}
		},
		welcomeMessage: {
			get: function () {
				return showWelcomeMessage;
			},
			set: function (showMessage) {
				showWelcomeMessage = showMessage;
				cache.saveObject('welcomeMessage', { show: showMessage});
			}
		},
		environment: {
			// get current env
			get: function () {
				return currentEnvironment;
			},
			canShowRESTLog: function() {
				return(currentEnvironment == 'dev' || currentEnvironment == 'local');
			}
		},
		logoutRedirect: {
			// get correct logout url
			get: function () {
				return logoutRedirect[currentEnvironment];
			}
		},
		version: {
			get: function () {
				return versionNo;
			}
		},
		checkPaymentAdminUser: {
			get: function(route, user) {

				if(user.isAccessAllowed('paymentAdjustments')) {

					for (var item in appModeList) {

						if (route.params.appMode == item && route.params.appMode != "paymentadmin") {
							$location.path('/home');
						}
					}
				}
			}
		}
	};
}]);