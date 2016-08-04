/**
 * @ngdoc directive
 * @name directives.directive:applySelect
 *
 * @description
 * Custom directive which was built for deal maintenance/
 *
 */
angular.module('directives').directive('applySelect', function () {
	return {
		templateUrl: 'views/includes/amendDateForm.html',
		scope: {
			ngModel: '=?',
			applySelect: '@',
			optionsList: "=?",
			initialOption: "@?",
			onButton: "=?",
			onUncheck: "=?",
			parameters: "="
		},
		link: function(scope, element, attrs) {
			var lastOption;
			scope.checked = false;
			
			if (scope.initialOption) {
				scope.selectedOption = scope.optionsList[0];
			} else if (scope.optionsList) scope.selectedOption = scope.optionsList[0].val;
			
			scope.buttonClick = function () {
				if (scope.onButton && angular.isFunction(scope.onButton) && !scope.optionNotSelected()) {
					
					var res = scope.onButton(scope.parameters);
					if (res.then) {
						res.then(function () {
							lastOption = scope.selectedOption;
						});					
					} else if (res)
						lastOption = scope.selectedOption;
				};
			};
			
			scope.checkClick = function () {
				if (scope.checked && angular.isFunction(scope.onUncheck) && lastOption ) {
					var res = scope.onUncheck(scope.parameters);
					res.then(function () {
						lastOption = undefined;
					}, function () {
						scope.checked = true;
					});
				}
			};
			
			scope.optionNotSelected = function () {
				if (scope.selectedOption.val === scope.initialOption
					|| !scope.checked || lastOption === scope.selectedOption) {
					return true;
				}
				return false;
			};
		}
	};
});