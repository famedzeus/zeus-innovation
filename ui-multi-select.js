/**
 * @ngdoc directive
 * @name directives.directive:uiMultiSelectBasic
 *
 * @element ANY
 * 
 * @description
 * A mock-select that shows drop down with user able to check multiple options
 * 
 * @param {string=} zippyTitle The title text for the zippy header
 * @param {Object=} watchObj A binding, watches element while value is null or false and displays a spinner until true.
 * 
 * 
 */
angular.module('directives').directive('uiMultiSelectBasic', ['$rootScope', '$document', '$interval', function ($rootScope, $document, $interval) {
	return {
		restrict: 'A',
		template: '<div ng-mouseleave="ex()" ng-mouseenter="ent()">'
		+ '<div><span><label ng-click="toggleList()" for="{{optionId}}">{{labelText}}</label></span>'
		+ '<select id="{{optionId}}" ng-disabled="controlDisabled"><option ng-bind="currentVal"></option ></select>'
		+ '<div class="blocker" ng-click="toggleList()" ></div>	'
		+ '</div>'
		+ '<ul data-ng-hide="hideMe">'
		+ '<li data-ng-repeat="option in optionsListCopy" data-ng-click="selectOption(option, $event);">'
		+ '<input type="checkbox" ng-model="option.isSelected" data-ng-change="updateSelectedOptions()" />'
		+ '<div>{{option[optionLabelKey]}}</div></li>'
		+ '</ul>'
		+ '</div>'
		//+ '<div data-ng-hide="hideMe" class="hint"><h4>Search selections</h4>{{currentSelectionsHint}}</div>'
		+ '<div data-ng-if="callToAction && itemIsSelected" class="btn action multi-select"><input value="Filter" name="submit" data-ng-click="submit()" type="submit" class="primary" title="Filter"></div>',
		scope: {
			labelText: "=?",
			ngModel: "=?",
			optionId: "=?",
			optionClass: "=?",
			optionLabelKey: "@",
			optionsList: "=?",
			dropdownClass: "=?",
			ngDisabled: "=?",
			onDisabled: "=?",
			includeAllOption: '=?',
			callToAction: '=?',
			selectionRange: '=?',
			changeFlag: '=?',
			mandatory: '=?',
			onChange: '&onChange',
			onMandatoryError: '&onMandatoryError',
			clearMandatoryError: '&clearMandatoryError',
			clearRangeError: '&clearRangeError',
			onRangeError: '&onRangeError'
		},
		controller:function($scope) {
			
			// Link with outside world
			
			
			
		},
		link: function (scope, element, attrs) {

			/**
			 * Variable initialisation
			 */
			scope.controlDisabled = true;
			
			scope.currentSelectionsHint = "";
			
			// Set to true by default, if not provided
			scope.includeAllOption = scope.includeAllOption == undefined ? true : scope.includeAllOption;
			
			// Mandatory error flag if a mandatory field?
			if(scope.mandatory && scope.onMandatoryError == undefined)
				throw("No mandatory error flag supplied");
			
			// Get reference for in play dom elements
			var blocker = angular.element(element.find('div')[2]),
				dropdown = angular.element(element.find('ul')[0]),
				select = angular.element(element.find('select')[0]),
				hint = angular.element(element.find('div')[3]);
	
			scope.hideMe = true;
			scope.inArea = false;
			scope.currentVal = '';
			scope.selectedAll = false;
            scope.loadFinished = false;
			scope.itemIsSelected = false;
			
			//Used to loop through array of classes to and add each class to the element provided.
			var addClasses = function(classes, element) {
				for (var i = 0; i < classes.length; i++) {
					element.addClass(classes[i]);
				}
			};

			if (scope.optionClass != undefined) {
				addClasses(scope.optionClass, select);
			}

			if (scope.dropdownClass != undefined) {
				addClasses(scope.dropdownClass, dropdown);
			}

			// Set position of elements to display in correct area
			// with reference to the select tag
			var setPositionAndWidthOfBlocker = function () {
				select = element.find('select')[0];
				blocker.css('width', (select.scrollWidth + 4 ) + 'px')
					.css('left', (select.offsetLeft ) + 'px');
				dropdown.css('min-width', (select.scrollWidth -2 ) + 'px')
					.css('left', (select.offsetLeft ) + 'px');
				// do only once
				element.off('mouseover', setPositionAndWidthOfBlocker)
			}

			var setPositionOfHint = function() {
				select = element.find('select')[0];
				hint.css('width', (select.scrollWidth + 4 ) + 'px')
					.css('left', (select.offsetLeft+select.scrollWidth + 20 ) + 'px');
				// do only once
			//	element.off('mouseover', setPositionAndWidthOfBlocker)
				
			};
			
			// set width of block when visible
			element.on('mouseover', setPositionAndWidthOfBlocker);
			element.on('mouseover', setPositionOfHint);
			
			/**
			 * Scope functions
			 */
			
			// toggle drop down display
			scope.toggleList = function () {
				if (scope.ngDisabled)
					return false;
				scope.hideMe = !scope.hideMe;
				if (scope.hideMe) {
					element.removeClass('highlightFocus');
				} else {
					element.addClass('highlightFocus');
				}
			};
			
			scope.ex = function () { scope.inArea = false; };
			
			scope.ent = function () {  scope.inArea = true;  };
			
			/**
			* Watch subscriptions
			*/
			
			// click on outer area of doc hides dropdown
			$document.on('click', function (a, b, c) {
				if (!scope.inArea) {
					scope.hideMe = true;
					element.removeClass('highlightFocus');
				}
			});
			var directiveChangedModel = false;
			
			// watch for changes and update display
			scope.$watch('ngModel', function (model) {
				// if change to ngModel comes from outside directive set options
				
				if (!directiveChangedModel) {
					
					setOptionsListFromModel();
					if (scope.optionsListCopy !== undefined) {
						scope.updateSelectedOptions(); 
					}
					return false;
				} else {
					directiveChangedModel = false;
				}
				//
				// reset state

			},true);
			
			// compares model with options list to set flag
			var setOptionsListFromModel = function () {
				var i = 0, 
					j, 
					list = scope.optionsListCopy, 
					model = scope.ngModel, 
					iteratingModelItems = true;
				
				if (!angular.isArray(model) || !angular.isArray(list) || !model.length) {
					return false;
				}

				while (iteratingModelItems) {
					for (j = 0; j < list.length; j++) {
						//if (angular.equal(model[i], list[j])) {
						if(model[i].label === list[j].label && model[i].id === list[j].id) {
							list[j].isSelected = true;
							break;
						}
						// if gets to last iteration
						// 	  -> remove model obj as it is not in options list
						if ((j + 1) === list.length) {
							model.splice(i--, 1);
						}
					}	
					i++; 
					if (i >= model.length) 
						iteratingModelItems = false;
				}


				return true;
			};
			
			scope.$watch('optionsList', function (list) {
				if(list) {
					scope.optionsListCopy = angular.copy(list);
					setOptionsListFromModel();
					if(scope.optionsListCopy.length > 0) {
						scope.controlDisabled = false;
					} else {
						scope.controlDisabled = true;
					}

					scope.updateSelectedOptions();
					directiveChangedModel = false;
				}
			});
			
			// watch the selection state of the options and update ngModel with new array;
			scope.updateSelectedOptions = function (option) {
				
				var selectedCheckbox = {};
				var list = scope.optionsListCopy,
					first = true;
			
				scope.uncheckAll = false;
				scope.ngModel = [];
				scope.currentVal = '';


				
				// Build list of selected in select
				for (var i = 0; i < list.length; i ++) {
					
					var item = list[i];

					// Mandatory field?
					
					if (item.isSelected) {
						
						// remove flag and update model
						var itemCpy = angular.copy(item);
						delete itemCpy.isSelected;
						scope.ngModel.push(itemCpy);
						//scope.$digest(); // Added forced digest to attempt to force an update of the model
			
						// make string for display purposes
						if (!first) 
							scope.currentVal += ', ';
						else 
							first = false;
						
						scope.currentVal += item[scope.optionLabelKey];
					}
				}
				scope.currentSelectionsHint = scope.currentVal;

                //Used to display "All" when all is selected.. instead of "All, england, france, germany, spain" ( Looks cleaner on the select boxes )
				for (var i = 0; i < list.length; i++) {
					
					var item = list[i];
					if (item.code == "ALL") {
						for (var j = 0; j < list.length; j++) {
							if (!list[j].isSelected) {
								//item.isSelected = false;
								scope.currentVal = scope.currentVal.replace('All, ', "");
							}
						}
						if (item.isSelected) {
							scope.currentVal = "All";
						}
					}

					if (list[0].code == "ALL" && !scope.includeAllOption) { // Remove 'All' if !scope.includeAllOption
							list.shift();
					} else {
						// Add ALL?
					}

				}
		
				directiveChangedModel = true;
				// no model set string to select
				if (!scope.currentVal) {
						if(scope.mandatory) {
							/* Leave - may need later RANGE SELECT */
							if (scope.selectionRange && (scope.optionsListCopy.length < scope.selectionRange.startNumber || scope.optionsListCopy.length > scope.selectionRange.endNumber)) {
								scope.currentVal = 'Select ' + (scope.selectionRange.startNumber+1) + ' to ' + scope.selectionRange.endNumber + ' items.';
							} else {
								scope.currentVal = 'Select at least one option';
							}
							
							//scope.currentVal = 'Select at least one option';
							
						} 
						else {
							scope.currentVal = 'Select';
						}
				}

				// Call scope.onChange() here, to make sure model had updated first?

			}
			
			scope.changeAll = function (state) {

				scope.itemCount = 0;
				angular.forEach(scope.optionsListCopy, function (item) {
					if(item.code != "ALL") {
						item.isSelected = state;
						if (scope.selectedAll) {
							scope.itemCount++;
						}
					}
				});

				if (scope.uncheckAll) {
					scope.uncheckAll = false;
				}

			};
			
			scope.areAnyItemsSelected = function() {
				// Is at least one option selected?
				var itemSelected = false;
				for (var i = 0; i < scope.optionsListCopy.length; i++) {
					var item = scope.optionsListCopy[i];
					if(item.isSelected) {
						itemSelected = true;
					}
				}
				scope.itemIsSelected = itemSelected;
				
				// Position call to action correctly with list
				if(scope.callToAction) {
					var kids = element.children();
					var d = 0;
				}
				
			};
			
			// Are number of items selected within 'selectionRange', if it is provided as an attribute
			scope.areNumberSelectedWithinRange = function() {
				if(scope.selectionRange && scope.onRangeError) {
					// Default both to 1 if not present
					var startNumber = scope.selectionRange.startNumber ? scope.selectionRange.startNumber : 1;
					var endNumber = scope.selectionRange.endNumber ? scope.selectionRange.endNumber : 1;
					
					// Is all selected? - if so, we're ok.
					// How many selected?
					var selectedCount = 0;
					for (var i = 0; i < scope.optionsListCopy.length; i++) {
						var item = scope.optionsListCopy[i];
						if(item.label == "All" && item.isSelected) {
							selectedCount = startNumber;
							break;
						}
						if(item.isSelected) {
							selectedCount++;
						}
					}
					
					// Outside range
					scope.errorState = false;
					if(selectedCount < startNumber || selectedCount > endNumber) {
						scope.onRangeError();
						scope.currentVal = 'Select ' + (scope.selectionRange.startNumber+1) + ' to ' + scope.selectionRange.endNumber + ' items. ' + selectedCount + ' selected.';
						scope.errorState = true;
					} else {
						scope.clearRangeError();
					}
				}
			};
			
			scope.checkForMandatoryError = function() {
				
				if(scope.mandatory) {
						
					// Invoke callback error or clear it
					if(scope.itemIsSelected && scope.optionsListCopy.length) {
						scope.clearMandatoryError();
					} else {
						scope.onMandatoryError();
					}
				}
			};

			// Deselect all if it is selected and an option is deselected.
			// Select all if all options selected individually
			scope.updateAllOption = function(option) {
				
				if(option.code != "ALL") {
					
					var allSelected = true;
					// All is always element zero
					if(scope.optionsListCopy[0].code == "ALL") {
						scope.optionsListCopy[0].isSelected = false;
					}

					// Are all individually selected?
					angular.forEach(scope.optionsListCopy,function(option) {
						if(option.code != "ALL" && !option.isSelected) {
							allSelected = false;
						} 
					});
					
					if(allSelected){
						scope.optionsListCopy[0].isSelected = true;
						$rootScope.$broadcast('multi-select-event:CheckedAllBoxes');	
					} 
					
					// None selected
					// Are all individually deselected?
					var noneSelected = true;
					angular.forEach(scope.optionsListCopy,function(option) {
						if(option.code != "ALL" && option.isSelected) {
							noneSelected = false;
						} 
					});
					
					// None are now selected - broadcast this fact
					if(noneSelected){
						$rootScope.$broadcast('multi-select-event:ClearedAllBoxes');
					}
					
					// All or not selected or deselected, so it's just an individual checkbox change - broadcast
					if(!noneSelected && !allSelected) {
						$rootScope.$broadcast('multi-select-event:SingleBoxSelection');
					}
					
					//scope.updateSelectedOptions();
				}
			};
			
			scope.selectOption = function (option, $event) {

				console.log("select option");
				
				// if element is not checkbox reverse current state

				if ($event.target && $event.target.type != 'checkbox') {
					//option.isSelected = option.isSelected === true ? false : true;
					option.isSelected = !option.isSelected;									

				}
				
				var arr = [];
				
				//get all current options
				for (var i = 0; i < scope.ngModel.length; i++) {
					arr.push(scope.ngModel[i].code);
				}

				// All is selected
				if (option.label == "All" && option.isSelected) {
					console.log("All select");
					//scope.uncheckAll = false;
					scope.changeAll(true);
					$rootScope.$broadcast('multi-select-event:CheckedAllBoxes');
				}
				// All is deselected
				if (option.label == "All" && !option.isSelected) {
					console.log("All deselect");
					scope.changeAll(false);
					$rootScope.$broadcast('multi-select-event:ClearedAllBoxes');
				}
				// Single is selected
				if (option.label != "All" && option.isSelected) {
					console.log("Single select");
					scope.updateAllOption(option);
				}
				// Single is deselected
				if (option.label != "All" && !option.isSelected) {
					console.log("Single deselect");
					scope.updateAllOption(option);
				}

				scope.updateSelectedOptions(option);

				scope.areNumberSelectedWithinRange(); // Leave for now - if needed later - RANGE SELECT
				scope.areAnyItemsSelected();
				scope.checkForMandatoryError();

				// If fitler text is clicked, instead of checkbox, the filter model isn't updated in time for the 'onChange' call
				// Forces $digest, and therefore updates filter model, so model data is ready for 'onChange' locations service call
				setTimeout(function(){ 
					scope.$apply(); 
					scope.onChange();
				});


				
				/*
				
					scope.selectedAll = true;
					scope.uncheckAll = false;
					$rootScope.$broadcast('uncheckAllFALSE');
					scope.checkAll();
					option.isSelected = true;
				} else if (option.label == "All") {
					scope.selectedAll = false;
					scope.uncheckAll = true;
					$rootScope.$broadcast('uncheckAllTRUE');
					scope.checkAll();
				}
				else {
					$rootScope.$broadcast('singleselection');
				}
				
				scope.updateAllOption(option);
				//scope.onChange();
				*/
			};
		
			scope.submit = function() {
				//scope.onChange();
			};
		}
	};
}]);