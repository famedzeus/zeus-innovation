/**
 * @ngdoc function
 * @name coreServices.GlobalUserMessageService
 * 
 * @description
 * This was created to give us a way to define a singular global message
 * for the user. 
 * 
 * 
 */
angular.module('coreServices').factory('GlobalUserMessageService', ['$timeout', function($timeout) {

	var timeoutProm = '',
		globalUserMessage = {
			display: false
		};
	

	
	/**
     * @ngdoc method
     * @name coreServices.GlobalUserMessageService:#setMessage
     * @methodOf coreServices.GlobalUserMessageService
     *
     * @description
     * Allows user to set a message to be displayed, with a property `display` which is set to true
     * a `$timeout` is then used to set this property to false.
     * 
     * @param {string} messageText The message to be displayed to the user
     * 
     */
	var setMessage = function (messageText) {
		globalUserMessage.messageText = messageText;
		globalUserMessage.display = true;
		// new message cancel previous callback
		if (timeoutProm)
			$timeout.cancel(timeoutProm);
		
		// call back to remove the message from display
		timeoutProm = $timeout(function () {
			globalUserMessage.display = false;
		}, 5000);
	};
	
	/**
     * @ngdoc method
     * @name coreServices.GlobalUserMessageService:#getMessage
     * @methodOf coreServices.GlobalUserMessageService
     *
     * @description
     * Gets the current message text.
     * 
     */
	var getMessage = function () {
		return globalUserMessage.messageText;
	};
	
	/**
     * @ngdoc method
     * @name coreServices.GlobalUserMessageService:#displayMessage
     * @methodOf coreServices.GlobalUserMessageService
     *
     * @description
     * Lets caller know if message should be displayed.
     * 
     */
	var displayMessage = function () {
		return globalUserMessage.display;
	};
	
	
	/**
     * @ngdoc method
     * @name coreServices.GlobalUserMessageService:#state.setSuccess
     * @methodOf coreServices.GlobalUserMessageService
     *
     * @description
     * Sets property status to 'success'.  This method it a member of a subproperty `state`
     * 
     * Usage:
     * <pre>GlobalUserMessageServie.state.setSuccess()</pre>
     *
     */
	/**
     * @ngdoc method
     * @name coreServices.GlobalUserMessageService:#state.setError
     * @methodOf coreServices.GlobalUserMessageService
     *
     * @description
     * Sets property status to 'critical'
     * 
     *  Usage:
     * <pre>GlobalUserMessageServie.state.setError()</pre>
     *
     */
	var state = {
		setSuccess: function () {
			globalUserMessage.status = 'success';
		},
		setError: function () {
			globalUserMessage.status = 'critical';
		},
		get: function () {
			return globalUserMessage.status;
		}
	};
	
	return {
		setMessage: setMessage,
		getMessage: getMessage,
		display: displayMessage,
		state: state
	};

}]);