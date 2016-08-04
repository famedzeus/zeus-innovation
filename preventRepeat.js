/**
 * @ngdoc function
 * @name coreServices.preventRepeat
 *  
 * @description
 * Service with two exposed methods.
 * 
 * isRepeated() Takes a string as a param and checks to see if it is the same as the previously passed string.
 * reset() Forgets any previous strings passed in isRepeated method
 * 
 * 
 * Was in controller but belongs in service (or maybe a filter but that may cause performance problems)
 * as it's rather generic
 * 
 */	


angular.module('coreServices').factory('preventRepeat', [function () {

		var lastRepeated;
		var isRepeated = function (string) {
			if (lastRepeated === string) {
				return true;
			}
				
			lastRepeated = string;
			return false;
		};
		
		var resetPreventRepeat = function () {
			lastRepeated = undefined;
		};
	
		return {
			isRepeated: isRepeated,
			reset: resetPreventRepeat
		};
	}]);