/**
 * @ngdoc directive
 * @name directives.directive:restricted
 *
 * @param {string} application section to check restrictions for
 * @description
 * This directive will restrict content within it, if the user is found to not have privilages to see it within their roles.
 *
 * @example
 */
angular.module('directives').directive('restrictUsers', ['users', function(users) {

	var getAccess = function(scope) {
		
		if(!scope.notFlag)
			scope.access = users.isAccessAllowed(scope.ngApplicationSection);
		else
			// Not
			scope.access = !users.isAccessAllowed(scope.ngApplicationSection);
		
		// Just disable content? (still shows it)
		if(!scope.access && scope.ngDisableContent) {
			scope.disableContent = 'disabled';
			scope.access = true;
		} else {
			// Hide the content
			scope.disableContent = '';
		}
	};

	return {
		scope: {
			ngApplicationSection: "=?",
			ngNotApplicationSection: '=?',
			ngContentClass: "@",
			ngClassOdd: '@',
			ngDisableContent: '='
		},
		controller:function($rootScope,$scope) {
			
			// Check for not operation
			if($scope.ngNotApplicationSection) {
				$scope.notFlag = true;
				$scope.ngApplicationSection = $scope.ngNotApplicationSection;
			}
		
			// User details come in slightly later in the login process so we must pick up a broadcast.
			$rootScope.$on('event:userDetails',function() {
				getAccess($scope);
			});
		},
		transclude:true,
		restrict: 'E',
		template:'<div data-ng-if="access" class="{{disableContent}} {{ngContentClass}}" data-ng-class-odd="{{ngClassOdd}}" ng-transclude></div>',
	    link: function(scope, element, attrs) {
			getAccess(scope);
		}
	};
}]);