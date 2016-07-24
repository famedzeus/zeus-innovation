/*
	This service returns a function that martials a REST request. It provides timeout functionality and the ability to define an onError, onFinally and onTimeout function, if required.
	A flag can be specified which will be set to true when processing and false when processing is finished. This can be used to 
	provide visual indication in template.
		
*/
angular.module('coreServices').factory('serviceCallManager', ['$rootScope','$q', '$log', '$resource', '$timeout','GlobalUserMessageService','applicationConfig',
	                                        function ($rootScope, $q, $log, $resource, $timeout, userMessage, applicationConfig) {

	var promise,timeoutPromise,title,surpressErrorDisplay;
	var deferredRequests = [];
	var promises = {};
	var responses = {};
	var deferreds = {};
	var numberOfRequests = 0;
	var timeoutPromises = {};
	var event = {};

	var requests = [];
	
	return function(title, resource, $scope, flag, millis, surpressErrorDisplay) {

		numberOfRequests++;
		var id = title+"-"+numberOfRequests;

		var constructDeferredRequest = function(id, resource, $scope, flag) {
		
			// If millis is provided override applicationConfig REST timeout setting
			timeoutMillis = millis ? millis : applicationConfig.timeoutRESTRequest.get();
			
			deferreds[id] = $q.defer();
			
			// Set progressing indicator
			if($scope && $scope[flag] != null && $scope[flag] != undefined) 
				$scope[flag] = true;

			// Setup timeout of the request
			if(timeoutPromises[id]) {
				$timeout.cancel(timeoutPromises[id]);
			}
			timeoutPromises[id] = $timeout(function() {
				deferreds[id].reject("Timeout");
			}, timeoutMillis);

			responses[id] = resource.$promise ? resource.$promise : resource;
			
			// Call the request promise
			responses[id].then(function (response) {
				// Success
				deferreds[id].resolve(response);
			})['catch'](function(e) {
				// Fail
				deferreds[id].reject(e);
			})['finally'](function() {
				$timeout.cancel(timeoutPromises[id]);
				numberOfRequests--;
				delete deferreds[id];
				delete timeoutPromises[id];
				delete event[id];
				$rootScope.log({state:'RESTMonitor',url:"",response:"Deleted " + id + " from stack."});
				$rootScope.log({state:'RESTMonitor',url:"",response:"Number of requests on stack:" + numberOfRequests});
			});
			
			return deferreds[id].promise;
		};
		
		promises[id] = constructDeferredRequest(id, resource, $scope, flag);
		$rootScope.log({state:'RESTMonitor',url:"",response:id + " started..."});
		
		// Invoke the deferred promise
		promises[id].then(function(response) {
			
			if($scope && $scope[flag] != null && $scope[flag] != undefined) 
				$scope[flag] = false;

			if(event[id].successFn)
				event[id].successFn(response);
			else {
				// Success
				userMessage.setMessage(title + " completed.");
				userMessage.state.setSuccess();
			}

			$rootScope.log({state:'RESTMonitor',url:"",response:id + " completed."});

			if(event[id].finallyFn)
				event[id].finallyFn();
			
			return response;
			
		},
		function(e) {

			// Fail
			if($scope && $scope[flag] != null && $scope[flag] != undefined) 
				$scope[flag] = false;

			if(e == "Timeout"){
				if(event[id].timeoutFn)
					event[id].timeoutFn();
				else {
					userMessage.setMessage(title + " request timed out. No response.");
					userMessage.state.setError();
					$log.error(id + " request timed out. No response.");
					$rootScope.log({state:'error',url:"",response:id + " request timed out. No response."});
				}
				if(event[id].finallyFn)
					event[id].finallyFn();
			}
			if(e.errorList){

				// 'message' json?
				if(e.errorList[0].message != null && e.errorList[0].message != '') {
					if(!surpressErrorDisplay) {
						userMessage.setMessage(title + " error:" + e.errorList[0].message);
						userMessage.state.setError();
					}
					$log.error(id + " error:" + e.errorList[0].message);
					$rootScope.log({state: 'error', url: "", response: id + " error:" + e.errorList[0].message});
					$rootScope.log({state: 'RESTMonitor', url: "", response: id + " encountered errors and failed."});
				} else {
					// 'reason' json?
					if (e.errorList[0].reason != null && e.errorList[0].reason != '') {
						if (!surpressErrorDisplay) {
							userMessage.setMessage(title + " error:" + e.errorList[0].reason);
							userMessage.state.setError();
						}
						$log.error(id + " error:" + e.errorList[0].reason);
						$rootScope.log({state: 'error', url: "", response: id + " error:" + e.errorList[0].reason});
						$rootScope.log({
							state: 'RESTMonitor',
							url: "",
							response: id + " encountered errors and failed."
						});
					}
				}

			} else {
				if(e) 
					$log.error(id + " error:" + e);
					$rootScope.log({state:'error',url:"",response:e.message});
					$rootScope.log({state:'RESTMonitor',url:"",response:id + " encountered errors and failed."});
			}
			
			if(event[id].errorFn) 
				event[id].errorFn(e);

			if(event[id].finallyFn)
				event[id].finallyFn();
		},
		function(update) {
			// Notify does'nt work for $q. :(
		});
			
		// This event object enables chaining of calls
		event[id] =  {
			
			onFinally : function(fn) {
				this.finallyFn = fn;
				return event[id];
			},
			onError : function(fn) {
				this.errorFn = fn;
				return event[id];
			},
			onSuccess : function(Fn) {
				this.successFn = Fn;
				return event[id];
			},
			onProcessing : function(fn) {
				this.processingFn = fn;
				return event[id];
			},
			onTimeout : function(fn) {
				this.timeoutFn = fn;
				return event[id];
			},
			// Expose promise to user for chaining
			promise:function() {
				return promises[id];
			}
		};
		
		return event[id];
	};
	
}]);
