/**
 * @ngdoc service
 * @name security.HttpSecurityInterceptor
 * @requires coreServices.ServerProperties
 *
 * @description
 * Provides security for all incoming and outgoing http traffic, authentication and timeout.
 * This security follows the principles of REST based header token authentication.
 */
security.factory('HttpSecurityInterceptor',['$q','$rootScope','Cache', 'ServerProperties', 'authTokens', 'applicationConfig', function ($q,$rootScope,cache, ServerProperties, authTokens, applicationConfig) {

	var testResponse = "";  // For testing
	var timeout = null;
	var timeoutWarning = null;
	var local = applicationConfig.environment.get().match('local');
	/**
     * @ngdoc method
     * @name timedOut
     * @methodOf security.HttpSecurityInterceptor
     *
     * @description
     * Broadcasts a timed out event. Session life is maintained via the maintainSession() method.
	 ******************************************
	 * <span class="label type-hint type-hint-string">Broadcast</span> string: <i>event:timedOut</i>
     */
	var timedOut = function () {
		clearInterval(timeout);
		$rootScope.$broadcast('event:timedOut');
		testResponse = "timed out - divert to login";
		applicationConfig.log("timeout");
	};

	/**
     * @ngdoc method
     * @name maintainSession
     * @methodOf security.HttpSecurityInterceptor
     *
     * @description
     * When called, this resets the session time out, thus keeping the session alive.
     * As part of the session time out reset the authorisation token will be checked.
	 * If no authorisation token is found a login required event will be broadcast.
	 ******************************************
	 * <span class="label type-hint type-hint-string">Broadcast</span> string: <i>event:loginRequired</i>
	 */
	var maintainSession = function () {
		var authToken = authTokens.get("auth-token");
		// reset session timeout perioud to default
		if (authToken) {
			clearInterval(timeout);
			timeout = setInterval(timedOut, applicationConfig.inactionPeriod.get());
			testResponse = "session maintained.";
		}
		else {
			// No auth token == no session
			$rootScope.$broadcast('event:loginRequired');
			testResponse = "Session not maintained. No authorisation token.";
		}
	};

	/**
     * @ngdoc method
     * @name processError
     * @methodOf security.HttpSecurityInterceptor
     *
     * @description
     * This method is fired when the security response interceptor gets a failed
     * response code.
     *
	 * @returns {$q.reject} response status
	 */
	var processError = function (response) {
		applicationConfig.log(response)

		if(applicationConfig.environment.canShowRESTLog()) {
			if(response.data.errorList) {
				$rootScope.log({direction:"<<< ",state:'error',url:"",response:response.status + " " + response.statusText + " : " + response.data.errorList[0].message});
			}
			else {
				$rootScope.log({direction:"<<< ",state:'error',url:"",response:response.status + " " + response.statusText,title:response.data});
			}
		}

		switch (response.status) {
			// let individual controllers handle this
			case 400:
				break;
			// oblix session timeout
			case 0:
			case 404:

				if (!response.headers()['ba-status-type']) {
					// oblix session has timed out - handle this event
					$rootScope.$broadcast('event:oblixTimeoutError');

				}
				break;
			// no auth
			case 401:
				$rootScope.$broadcast('event:loginRequired');
				break;
			// Display a generalised error message
			default:
				$rootScope.$broadcast('event:generalNetworkError');

		}
		if (response.data)
			response.data.status = response.status;
		
		return $q.reject(response.data);
	};

	/**
     * @ngdoc method
     * @name maintainAuthTokens
     * @methodOf security.HttpSecurityInterceptor
     *
     * @description
     * Updates auth tokens if they are modified
     *
	 */
	var maintainAuthTokens = function (response) {
		
		// no authentication header on response
		if (!response.headers()['auth-token'] || !response.headers()['ba-sso-uid'])
			return false;

		applicationConfig.log(response.headers()['ba-sso-uid']);
			
		tokens =  authTokens.get();

		if(tokens['auth-token'] && (tokens['auth-token'] !== response.headers()['auth-token'])) {
			$rootScope.$broadcast('event:loginRequired');
			return false;
		}

		if (tokens['auth-token']) {
			tokens['auth-token'] = response.headers()['auth-token'];
			authTokens.set(tokens);
		}

		return true;
	};


	// Adds a timestamp query param to url strung
	var cachePrevent = function (url, correctForm, forcePrevention) {
		var spl = url.split('.');
		// no json &&
		if (!correctForm && spl[spl.length-1] !== 'json') {
			var d = new Date();
			var c  = url.match(/\?/g) ? '&' : '?';
			url += c + '_=' + d.getTime();
		}

		return url;
	};

	return {

		// Service exposure

		// Maintain session life
		maintainSession:maintainSession,
		// Time out function
		timedOut:timedOut,
		// Test
		getTestResponse: function() {
			return testResponse;
		},

		// Http events
		// Request
		'request': function (config) {
			var forceCachePrevent = false;

			// maintain session if not gif server pinger (multiple session fix)
			if (!config.url.match(/s.gif/)) {
				maintainSession();
			} else {
				forceCachePrevent = true;
			}

			//ie prevent caching of requested data problems on none local reqeusts
			if (!local) {
				config.url = cachePrevent(config.url, config.cache, forceCachePrevent);
			}
			// add authentication
			if (config.url.match(ServerProperties.springUrl()) || config.url.match(ServerProperties.URL())) {
				angular.extend(config.headers, authTokens.get())
			}

			if(applicationConfig.environment.canShowRESTLog()) {
				var pos = config.url.indexOf("api");
				if(pos != -1){
					// Create a twin object for request and response
					$rootScope.RESTLog[config.url] = config.url.substr(pos);
				}
			}

			return config || $q.when(config);

		},
		'responseError': processError,
		// Response
		response: function(response) {

			maintainAuthTokens(response);

			if(response.config) {
				var pos = response.config.url.indexOf("api");
				if(pos != -1) {
					$rootScope.log({state:'package',url:response.config.url.substr(pos),request:$rootScope.RESTLog[response.config.url],response:JSON.stringify(response.data),title:response.config.url});
				}
			}
			
			return response || $q.when(response);
		},
	};
}]);
