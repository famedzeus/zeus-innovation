/**
 * @ngdoc directive
 * @name directives.directive:crossTickInput
 *
 * @param {boolean=} ng-model A binding, telling whether or not the input it ticked or crossed or neither in
 * which case it is null
 * @description
 * A three state tick-box type ui widget
 *
 * @example
   <example module="directives">
   	<file name="script.js">
            angular.module('dealing.example', ['directives']);
            function Ctrl($scope) {
                $scope.inputValue = null;
            };
        </file>
     <file name="index.html">
         
         <div cross-tick-input ng-model="inputValue"></div>
         inputValue: <span>{{inputValue}}</span><span ng-show="inputValue === null">null</span>
     </file>
   </example>
 */
angular.module('directives').directive('crossTickInput', function() {
	return {
		scope: {
			ngModel: "=?"
		},
		template: '<div class="tick-button" data-ng-click="updateState(\'tick\')">&#xe605;</div><div class="cross-button" data-ng-click="updateState(\'cross\')">&#xe606;</div>',
	    link: function(scope, element, attrs) {
	     	if (!scope.ngModel) {
	     		scope.ngModel = null;
	     	}
	     	scope.$watch('ngModel', function () {
	     		if (scope.ngModel === null) {
	     			element.find('div').removeClass('active');
	     		}
	     		if (scope.ngModel === true) {
	     			angular.element(element.find('div')[0]).addClass('active');
	         		angular.element(element.find('div')[1]).removeClass('active');
	     		}
	     		if (scope.ngModel === false) {
	     			angular.element(element.find('div')[0]).removeClass('active');
	     			angular.element(element.find('div')[1]).addClass('active');
	     		}
	     		
	     	});
	     	
	     	scope.updateState = function (clicked) {
	     		if (clicked === 'tick') {
	     			if (scope.ngModel === true) {
	     				scope.ngModel = null;
	     			} else {
	     				scope.ngModel = true;
	     			}
	     		} else {
	     			if (scope.ngModel === false) {
	     				scope.ngModel = null;
	     			} else {
	     				scope.ngModel = false;
	     			}
	     		}
	     	};
	    }
	  
	  };
});