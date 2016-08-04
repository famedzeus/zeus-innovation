/**
 * @ngdoc function
 * @name coreServices.ChartManager
 * @requires coreServices.ChartFactory
 * @requires ng.$http
 * @description
 * Chart manager service.
 * 
 */
angular.module('coreServices').factory('ChartManager', ['$http', 'ChartFactory','applicationConfig', function ($http, ChartFactory, applicationConfig) {
	var chartCount = 0,
		initialised = false,
		promScript;
	// may put chart options in chart options factory
	
	/**
     * @ngdoc method
     * @name coreServices.ChartManager#doInitialisation
     * @methodOf coreServices.ChartManager
     *
     * @description
     * Initialialises chart manager service and when done sets flag, returns promise
     * that object will be initialised.
     *
     * @returns {HttpPromise} When promise is resolved, chart scripts have loaded and manager is initialised.
     */
	var doInitialisation = function () {
		
		applicationConfig.trace("chartManager.doInitialisation");	
		
		// load scripts
		if (promScript)
			return promScript;
		
		promScript = $http.get('scripts/vendor/chart/Charts/FusionCharts.js');
		promScript.then(function (response) {
			// make make script useable
			(eval, eval)(response.data);
			
			initialised = true;
			FusionCharts.setCurrentRenderer('javascript');
		});
		return promScript;
	};

	/**
     * @ngdoc method
     * @name coreServices.ChartManager#isInitialised
     * @methodOf coreServices.ChartManager
     *
     * @description
     * Checks to see if service has been initialised yet.
     *
     * @returns {boolean} if true manager is initialised and user can create chart instances
     */
	var isInitialised = function () {
		return initialised;
	};
	

	/**
     * @ngdoc method
     * @name coreServices.ChartManager#getChartInstance
     * @methodOf coreServices.ChartManager
     *
     * @description
     * If chart service has been initialised then it will attempt to create a chart instance object
     * and returns two methods which can act upon this instance and an id property
     * which is assigned by the chart manager.
     *
     * @returns {Object} returns methods which act upon chart instance
     */
	var getChartInstance = function (chartType, customParams) {
		
		applicationConfig.trace("chartManager.getChartInstance");	
		
		// not initialised can't give instance
		if (!initialised) return false;
		
		var cInstance = ChartFactory.makeChart(chartType, chartCount, customParams);
	
		chartCount++;
		
		// return subset of chart methods plus unique chart id
		return {
			id: (chartCount - 1),
			instance:cInstance,
			setData: cInstance.setData,
			render: cInstance.render
		};		
	};

	return {
		doInitialisation: doInitialisation,
		isInitialised: isInitialised,
		getChartInstance: getChartInstance
	};
}]);
