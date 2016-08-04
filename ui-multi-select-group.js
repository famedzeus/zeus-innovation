/**
 * @ngdoc directive
 * @name directives.directive:uiMultiSelectGroup
 *
 * @element ANY
 * 
 * @description
 * An element that encapsulates a group of multi-selects providing chaining between multi-selects in the group
 * When selections have been made for all multi-selects in the group, it will collate the final payload for passing back to page $scope.
 * 
 */
angular.module('directives').directive('uiMultiSelectGroup', ['$q','$rootScope', '$document', '$interval','serviceCallManager','applicationConfig', 'Cache', function ($q, $rootScope, $document, $interval, serviceCallManager,applicationConfig, cache) {
	return {
		restrict: 'E',
		templateUrl: 'views/includes/multiSelectGroup.html',
		scope: {
			groupModel : '=',
			onGroupReady: '&onGroupReady',
			onError: '&onError'
		},
		controller:['$scope', function($scope) {

			$scope.applicationConfig = applicationConfig;
			
			this.onGroupReady = $scope.onGroupReady;
			$scope.requestingData = false;
			
			// Common function to get a comma delimited list of id's for the given optionsKey in model.
			// RetainAllInURL is used for some requests that use ALL as a matrix parameter e.g. locations/ALL/Regions - the ALL must not be set to an empty string in these. 
			var getIdString = function(model, optionsKey, retainAllInURL, singleEndDate) {
			
				var idString = '';

				// Are we using a single end date? Just bounce it back, if it has been selected
				if(singleEndDate)
					if(singleEndDate.timestamp)
						if(singleEndDate.timestamp != 'Select')
							return singleEndDate.timestamp;
				
				if (!model) {
					return false;
				}

				// All option sends empty string
				if(model.length) {
					if(model[0].code == "ALL")
						if(retainAllInURL)
							return "ALL";
						else
							return "";
				} else {
					return "";
				}

				angular.forEach(model, function (option) {
					if (optionsKey != undefined) {
						if (optionsKey == "ODGROUP") {
							option.filterId = option.filterId.split(' - ').join('&');
						}
					}
					idString = idString + ',' + option.filterId;
				});

				//Remove the comma at the beginning of the string
				idString = idString.slice(1);
				
				//if there is still a comma... remove it
				if (idString.substring(0, 1) == ',') {
					idString = idString.slice(1);
				}

				return idString;
			};

			// Called by all child multi-selects to request their data
			var populateField = function(promFn,payload,optionsKey,countriesSelectedList) {

				// Get straight out if we are already requesting data - switch bounce prevention
				if($scope.requestingData) {
					return;
				}

				OPTIONS = [];
				// Make up promise with payload 
				prom = promFn(payload).$promise;
				$scope.groupModel.multiSelectGroups[optionsKey].requestingData = true;
				//this.requestingData = true;
				
				var scmPromise = serviceCallManager("Load filter data", prom, $scope, 'requestingData')
					.onSuccess(function(data) {

						// No data message
						if (!data.length) {
							$scope.groupModel[optionsKey].noData = true;
						} else {
							$scope.groupModel[optionsKey].noData = false;
						}

						for (var i = 0; i < data.length; i++) {
					
							// Align format,
							// format of returned data does not always fit the multi-select model structure
							// this needs looking at and sorting SOON - either here or back-end

							if (data[i].id)
								data[i].code = data[i].id;
							if (!data[i].description && data[i].name)
								data[i].description = data[i].name;
							if (!data[i].code)
								data[i].code = data[i].description;
							if (!data[i].id) {
								data[i].id = data[i].code;
							}
							
							// Needs to be moved at some point - not generic
							if(optionsKey == "DEALENDDATES")
								data[i].id = data[i].timestamp;
							
							if(countriesSelectedList) {
								if(data[i].accountType && countriesSelectedList.length > 1 || countriesSelectedList[0].code == "ALL") { 
									data[i].description = "(" + data[i].country + ") " + data[i].name;
								}
							}
							
							// Multi select model structure
							OPTIONS.push({filterId: data[i].id, label: data[i].description, code: data[i].code});
							$scope.groupModel.multiSelectGroups[optionsKey] = OPTIONS;
						}

					})
					.onError(function(data) {
						console.log(data);
						// Back end responded with an error
						$scope.onError({'data':data});
						invalidateChain($scope.groupModel[optionsKey].nextMultiSelectKey);
					})
					.onFinally(function (){
						$scope.groupModel.multiSelectGroups[optionsKey].requestingData = false;
						//this.requestingData = false;
					})
					.promise();

				return scmPromise;
				
			};
			
			this.setRangeError = function(key,state) {
				if(state)
					invalidateChain($scope.groupModel[key].nextMultiSelectKey);
				
				this.groupModel[key].rangeErrorFlag = state;
			};
			
			// Called by each multi-select in the group to obtain the next one in the chain
			this.requestNextData = function(key,updatedModel) {
				
				var populatePromise = null;

				invalidateChain(key);

				console.log("RequestNextData:"+key);
				
				// Build parameter payload from all multi-select selections in group from top down to supplied key, if there is a selection in the updatedModel
				if(updatedModel.length > 0) {
					var params = {};
					var foundKey = false;
					for(var i in $scope.groupModel.order) {
						if(!foundKey) {
							if($scope.groupModel.order[i] != key) {
								var multiSelect = this.groupModel[$scope.groupModel.order[i]];
								params[multiSelect.urlParamName] = getIdString(this.groupModel.filterModels[$scope.groupModel.order[i]], $scope.groupModel.order[i], multiSelect.retainAllInURL, false); //retainAllInURL, singleEndDate);
								
								// Is there a default value, if there are no values selected?
								if(params[multiSelect.urlParamName] == "") {
									if(multiSelect.defaultValue) {
										if(typeof(multiSelect.defaultValue) == 'function') {
											params[multiSelect.urlParamName] = multiSelect.defaultValue();
										} else {
											params[multiSelect.urlParamName] = multiSelect.defaultValue;
										}
									}
								}

							} else {
								foundKey = true;
							}
						}
					}

					// Append any queryParams to payload, if provided
					// Note that calling service must correctly assign as query parameters in request url
					if(this.groupModel[key].queryParams) {
						params.queryParams = this.groupModel[key].queryParams;
					}

					// if there is a request promise, use it 
					// otherwise it is a static fixed data field or no promise - unchecked all selections
					if(this.groupModel[key].requestPromise) {
						populatePromise = populateField(this.groupModel[key].requestPromise,params,key);
					} else {
						if(this.groupModel[key].fixedData) {
							// Fixed data?
							this.getNextFixedData(key);
						}
					}
				} else {
				}

				return populatePromise;

			}

			// Fixed data population method separated because multi selects will need to call it
			// if we are restoring from the cache
			this.getNextFixedData = function(key) {
				// Fixed data- can be string or function returning a string
				if(typeof(this.groupModel[key].fixedData) == 'function') 
					this.groupModel.multiSelectGroups[key] = this.groupModel[key].fixedData();
				else
					this.groupModel.multiSelectGroups[key] = this.groupModel[key].fixedData;			
			};
			
			// Although this repeats the gathering of parameters as in requestNextData method,
			// It has been separated for clarity
			// This will pull together all the selections and call the supplied onGroupReady callback to return to page controller with final payload for the group.
			this.collateFinalGroupRequestParameters = function() {
				var params = {};
				for(var i in $scope.groupModel.order) {
					var multiSelect = this.groupModel[$scope.groupModel.order[i]];
					params[multiSelect.urlParamName] = getIdString(this.groupModel.filterModels[$scope.groupModel.order[i]], $scope.groupModel.order[i], multiSelect.retainAllInURL, false); //retainAllInURL, singleEndDate);

					// Is there a default value, if there are no values selected?
					if(params[multiSelect.urlParamName] == "") {
						if(multiSelect.defaultValue) {
							if(typeof(multiSelect.defaultValue) == 'function') {
								params[multiSelect.urlParamName] = multiSelect.defaultValue();
							} else {
								params[multiSelect.urlParamName] = multiSelect.defaultValue;
							}
						}
					}
				}
				
				cache.saveObject(applicationConfig.section.get() + 'summaryFilter', $scope.groupModel);
				$scope.onGroupReady({'params':params});
			};

			// Invalidates all multi-selects in group below one with provided key
			var invalidateChain = function(key) {
				var found = false;
				var index = 0;
				do {
					if($scope.groupModel.order[index] == key){
						found = true;
					}
					if(found) {
						$scope.groupModel.multiSelectGroups[$scope.groupModel.order[index]] = {};
						$scope.groupModel.filterModels[$scope.groupModel.order[index]] = {};
						$scope.groupModel[$scope.groupModel.order[index]].mandatoryFlag = false;
					}
					index++;
				} while(index < $scope.groupModel.order.length)
				
				// Callback to page controller and pass no pay load indicating it's not ready
				$scope.onGroupReady({'params':null});
			};
			
			// Initialise filter models and multi select groups
			this.groupModel = $scope.groupModel;
			this.groupModel.filterModels = {};
			this.groupModel.multiSelectGroups = {};
			
			var cachedGroupModel = cache.fetchObject(applicationConfig.section.get() + 'summaryFilter');
			
			if(cachedGroupModel) {
				
				// Functions are not saved to the cache - we must copy them in from the groupModel
				for(var i in $scope.groupModel.order) {
					angular.forEach(this.groupModel[$scope.groupModel.order[i]], function(value,key) {
						if(typeof(value) == 'function'){
							cachedGroupModel[$scope.groupModel.order[i]][key] = value;
						}
					});
				}
				//$scope.groupModel = angular.copy(cachedGroupModel); // This does'nt work ....?!
				$scope.groupModel.multiSelectGroups = cachedGroupModel.multiSelectGroups;
				$scope.groupModel.filterModels = cachedGroupModel.filterModels;
				this.collateFinalGroupRequestParameters();
				
				var x = 0;
			} else {
				// Setup default state for all multi selects in group using order array
				for(var i in $scope.groupModel.order) {
					this.groupModel.filterModels[$scope.groupModel.order[i]] = {};
					this.groupModel.multiSelectGroups[$scope.groupModel.order[i]] = {};

					// Invoke default request, if provided in group model
					if(this.groupModel[$scope.groupModel.order[i]].defaultPromise) {
						populateField(this.groupModel[$scope.groupModel.order[i]].defaultPromise,this.groupModel[$scope.groupModel.order[i]].defaultPayload,$scope.groupModel.order[i]);
					}
				}
			}
		}],
		link: function (scope, element, attrs) {
			
			
		}
	};
}]);

/**
 * @ngdoc directive
 * @name directives.directive:uiMultiSelect
 *
 * @element ANY
 * 
 * @description
 * A mock-select used within a multi select group
 * This directive injects the uiMultiSelectGroup controller and devolves control of the model back to it.
 * 
 * 
 * 
 */
angular.module('directives').directive('uiMultiSelect', ['$rootScope', '$document', '$interval', function ($rootScope, $document, $interval) {
	return {
		restrict: 'A',
		template: '<div ng-mouseleave="ex()" ng-mouseenter="ent()">'
		+ '<div><span><label ng-click="toggleList()" for="{{optionId}}">{{labelText}}</label></span>'
		+ '<div style="position:absolute;left:15%;" ng-show="multiSelectGroupCtrl.groupModel.multiSelectGroups[ngCode].requestingData" loading-spinner="true" loading-message="Working.." spinner-size="small" spinner-color="666"></div>'
		+ '<select id="{{optionId}}" ng-disabled="controlDisabled"><option ng-bind="currentVal"></option ></select>'
		+ '<div class="blocker" ng-click="toggleList()" ></div>	'
		+ '</div>'
		+ '<ul data-ng-hide="hideMe">'
		+ '<li data-ng-repeat="option in multiSelectGroupCtrl.groupModel.multiSelectGroups[ngCode]">'
		+ '<input ng-disabled="controlDisabled" ng-show="!onlyOneSelectionRequired" id="{{ngCode+option.code}}" type="checkbox" ng-model="option.isSelected" data-ng-change="updateSelectedOptions(option)" />'
		+ '<label style="padding:0;font-weight:normal;background:none;" for="{{ngCode+option.code}}">{{option.label}}</label></li>'
		+ '</ul>'
		+ '</div>'
		+ '<div class="message important" ng-show="multiSelectGroupCtrl.groupModel[ngCode].noData"><h4>No data results</h4><p class="ng-binding">No results for {{labelText}}.</p></div>'
		//+ '<div data-ng-hide="hideMe" class="hint"><h4>Search selections</h4>{{currentSelectionsHint}}</div>'
		+ '<div data-ng-if="callToAction && itemIsSelected" class="btn action multi-select"><input value="Filter" name="submit" data-ng-click="submit()" type="submit" class="primary" title="Filter"></div>',
		//+ '{{multiSelectGroupCtrl.groupModel.filterModels.AREAS}}',
		scope: {
			labelText: "=?",
			ngModel: "=?",
			ngCode: "=?",
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
		require:['^uiMultiSelectGroup'],
		link: function (scope, element, attrs, multiSelectGroupCtrl) {

			/**
			 * Variable initialisation
			 */
			scope.multiSelectGroupCtrl = multiSelectGroupCtrl[0];
			scope.requestingData = false;
			scope.controlDisabled = true;

			// Default both to 1 if not present
			if(scope.selectionRange) {
				scope.onlyOneSelectionRequired = scope.selectionRange.endNumber - scope.selectionRange.startNumber == 1 ? true : false;
			}
				
			scope.currentSelectionsHint = "";
			
			// Set to true by default, if not provided
			scope.includeAllOption = scope.includeAllOption == undefined ? true : scope.includeAllOption;
			
			// Mandatory error flag if a mandatory field?
			if(scope.mandatory && scope.onMandatoryError == undefined)
				throw("No mandatory error flag supplied");
			
			// Get reference for in play dom elements
			var blocker = angular.element(element.find('div')[4]),
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
			
			// click on outer area of doc hides drop down
			$document.on('click', function (a, b, c) {
				if (!scope.inArea) {
					scope.hideMe = true;
					element.removeClass('highlightFocus');
				}
			});
			var directiveChangedModel = false;
			
			// This watch will pick up any changes in the uiMultiSelectGroup directive models
			// The only function of this is to respond to an invalidateChain call in uiMultiSelectGroup
			// and set control back to default state.
			scope.$watch('multiSelectGroupCtrl.groupModel.filterModels',function(model) {
				if(!model[scope.ngCode].length) {
					scope.setDefaultNoSelectionText();
				} 
			},true);
			
			// This watch will pick up any changes to the model in the uiMultiSelectGroup directive
			// The only function of this is to rebuild the top list of what is chosen in the drop down.
			scope.$watch('multiSelectGroupCtrl.groupModel.multiSelectGroups', function(list) {
				scope.buildSelectedListDisplay(list[scope.ngCode]);
			});
			
			// I don't know if this is needed now....?
			scope.$watch('ngModel', function (model) {
				
				//setOptionsListFromModel();
				// if change to ngModel comes from outside directive set options

				/*
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
*/
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
			
			// The only function of this watch is to enable the control if it has data.
			scope.$watch('optionsList', function (list) {

				if(list.length > 0) {
					scope.controlDisabled = false;
				} else {
					scope.controlDisabled = true;
				}
			});
			
			// Responds to click for selection/deselection
			// Deals with ALL selection and calls back to group controller
			scope.updateSelectedOptions = function (option) {
				
				var selectedCheckbox = {};
				var list = scope.multiSelectGroupCtrl.groupModel.multiSelectGroups[scope.ngCode],
					first = true;

				// If this is a one selection only - we must clear previous selection
				if(scope.onlyOneSelectionRequired) {
					angular.forEach(list,function(item) {
						item.isSelected = false;
					});
					option.isSelected = true;
				}

				scope.uncheckAll = false;
				scope.currentVal = '';
				
				// Did user click all - set all options to be same as all option flag
				if(option.code == "ALL") {
					angular.forEach(list,function(item) {
						item.isSelected = option.isSelected;
					});
				} else {
					// User clicked individual option
					// Update All option (if there is one) if all are now selected or not (ASSUMED - All is option 0)
					if(list[0].code == "ALL")
						list[0].isSelected = scope.areAllSelected(list);
					
				}
				
				// Clear model and push option selections onto ngModel
				scope.ngModel = [];
				angular.forEach(list,function(item) {
					if(item.isSelected) {
						// remove flag and update model
						var itemCpy = angular.copy(item);
						delete itemCpy.isSelected;
						scope.ngModel.push(itemCpy);
					}
				});
				
				scope.buildSelectedListDisplay(list);
				
				// Communicate back up to uiMultiSelectGroup directive
				// Note that at this point the filterModels in uiMultiSelectGroup have not yet been updated to reflect changes in this function
				// we need the changes in order to process next request
				scope.multiSelectGroupCtrl.groupModel.filterModels[scope.ngCode] = scope.ngModel;
				
				scope.checkForMandatoryError();

				// Single selection only?
				if(scope.onlyOneSelectionRequired && scope.ngModel.length == 1) {
					scope.hideMe = !scope.hideMe;
				}

				if(scope.areNumberSelectedWithinRange(list)) {

					// If finalRequest, check that this final field has selections, and if so, call parent to create final request
					if(scope.multiSelectGroupCtrl.groupModel[scope.ngCode].finalRequest) {
						if(scope.ngModel.length > 0) {
							scope.multiSelectGroupCtrl.collateFinalGroupRequestParameters();
						}
						else {
							// Issue invalid up to controller - selection not made in this last field
							scope.multiSelectGroupCtrl.onGroupReady({'params':null});			
						}
						return;
					}

					// nextMultiSelectKey may be a function or just a string
					if (typeof(scope.multiSelectGroupCtrl.groupModel[scope.ngCode].nextMultiSelectKey) == "function") {
						// Fixed data function
						scope.multiSelectGroupCtrl.requestNextData(scope.multiSelectGroupCtrl.groupModel[scope.ngCode].nextMultiSelectKey(), scope.ngModel);

					} else {
						// Dynamic requested data
						scope.multiSelectGroupCtrl.requestNextData(scope.multiSelectGroupCtrl.groupModel[scope.ngCode].nextMultiSelectKey, scope.ngModel);
					}
				}
			}

			// Purely for displaying list of selected items in top of drop down.
			scope.buildSelectedListDisplay = function(list) {
				
				var first = true;
				
				// Build list of selected in select
				for (var i = 0; i < list.length; i ++) {
					
					var item = list[i];

					// Mandatory field?
					
					if (item.isSelected) {
						
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
			};
			
			scope.setDefaultNoSelectionText = function() {
				
				// no model set string to select or range expression if applicable.
				if (scope.selectionRange) {
					if(scope.selectionRange.startNumber+1 == scope.selectionRange.endNumber)
						if(scope.selectionRange.endNumber - scope.selectionRange.startNumber == 1)
							scope.currentVal = 'Select ' + (scope.selectionRange.startNumber+1) + ' item.';
						else
							scope.currentVal = 'Select ' + (scope.selectionRange.startNumber+1) + ' items.';
					else
						scope.currentVal = 'Select ' + (scope.selectionRange.startNumber+1) + ' to ' + scope.selectionRange.endNumber + ' items.';
				} else {
					scope.currentVal = 'Select at least one option';
				}
				
			};
			
			// Return true flag if all options are selected
			scope.areAllSelected = function(list) {
				var allSelected = true;
				// Are all individually selected?
				angular.forEach(list,function(option) {
					if(option.code != "ALL" && !option.isSelected) {
						allSelected = false;
					} 
				});
				return allSelected;
			};
			
			// Are number of items selected within 'selectionRange'
			scope.areNumberSelectedWithinRange = function(list) {
			
				if(scope.selectionRange && scope.onRangeError) {
					
					
					scope.multiSelectGroupCtrl.setRangeError(scope.ngCode,false);
					
					// Is all selected? - if so, we're ok.
					// How many selected?
					var selectedCount = 0;
					for (var i = 0; i < list.length; i++) {
						var item = list[i];
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
					if(selectedCount < scope.selectionRange.startNumber || selectedCount > scope.selectionRange.endNumber) {
						
						// Communicate range error to group controller
						scope.multiSelectGroupCtrl.setRangeError(scope.ngCode,true);
						
						scope.currentVal = '';
						scope.setDefaultNoSelectionText();
						scope.errorState = true;
						return false;
						
					} else {
						scope.clearRangeError();
					}
				}
				
				return true;
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

			scope.submit = function() {
				//scope.onChange();
			};
		}
	};
}]);