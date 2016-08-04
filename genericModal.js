angular.module('coreServices').factory('genericModal', ['$modal', function ($modal) {
	return {
		getInstance: function (actionedItemName, modalObj, validityFunction, timeoutMS) {
			return $modal.open({
				templateUrl: 'views/genericModal.html',
			    controller: 'GenericModalCtrl',
			    resolve: {
			        actionedItemName: function () {
			        	return actionedItemName;
			        },
			        modalObj: function () {
			        	return angular.copy(modalObj);
			        },
			        inputValidity: function () {
			        	return validityFunction;
			        },
			        timeoutMS: function () {
			        	return timeoutMS;
			        }
			    },
			    windowClass: "modalMedium"
			});
		}
	};
}]);