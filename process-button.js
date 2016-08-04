/**
 * @ngdoc directive
 * @name directives.directive:processButton
 * 
 * @param {Object} process-button  binding, if null, undefined or '' it will cause the spinner to happen and show the processing text, if else the spinner will stop(or not start)
 * @param {string=} standard-text Text to display when not processing
 * @param {string=} processing-text Text to display when processing
 * 
 * @description 
 * A button directive which displays different text and message whilst processing is occuring.
 * 
 * 
 */
angular.module('directives').directive('processButton', ['$modal', function ($modal) {
	
	return {
		restrict: "A",
		scope: {
			processButton: "=?",
			standardText: "@",
			processingText: "@",
			ngDisable: "=?",
			secondary: "@?",
			large: "@?",
			btnWidth: '@'
		},
		template: '<div class="btn" ng-class="{maxWidth: btnWidth}">'
			+ '<a href="" class="{{btnStyle}} submitButton" role="button" title="{{standardText}}" data-ng-class="{\'standout\': large, \'disabled\': ngDisable}">'
			+ '<div data-ng-show="processButton" data-loading-spinner="processButton" spinner-size="{{spinSize}}" spinner-color="fff" ></div>'
			+ '<span data-ng-show="!processButton">{{standardText}}</span>'
			+ '<span data-ng-show="processButton">{{processingText}}</span>'
			+ '</a></div>',
		link: function (scope, element, attrs) {
			scope.spinSize = scope.large ? 'small-medium' : 'small';
			scope.btnStyle = scope.secondary ? 'secondary' : 'primary';
			scope.$watch('processButton', function () {
				
			});			
		}

	};
}]);
