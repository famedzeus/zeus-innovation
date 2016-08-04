/**
 * @ngdoc service
 * @name coreServices.ChartFactory
 * 
 * @description
 * Chart instance factory.  
 * 
 * Factory with one method - `makeChart` - which is a kind of constructor that takes a `chartType` parameter and a unique `id`.
 * The methods of the object which `makeChart` method creates and returns are documented below.
 * 
 * This service should not really be used independent of ChartManager.
 * 
 */
angular.module('coreServices').factory('ChartFactory',['applicationConfig', function (applicationConfig) {
	var chartInitialised = false;
	var areaChartOptions = {
		"caption": "",
        "bgAlpha": "0",
        "showvalues": "0",
        "showAlternateHGridColor": "0",
        "numbersuffix": "",
        "paletteColors": "#FF9900,#3aa141,#ebde2f,#9e0e18,#0d10bf,#1f9191,#528787,#75c94f",
        "usePlotGradientColor": "0",
        "plotFillAlpha": "100",
        "plotBorderColor": "ffffff",
        "plotBorderThickness": "1",
        "legendBorderColor": "f0f0f0",
        "legendBorderAlpha": "0",
        "legendShadow": "0",
        "showPlotBorder": "1",
        "showBorder": "0",
        "canvasBorderAlpha": "0",
        "interactiveLegend": "0",
        "divLineAlpha": "15",
        "anchorRadius": "14",
        "showToolTip": "0"
	};
	var lineChartOptions = {
      "bgAlpha": "0",
      "paletteColors":
	  "#FF9900,#3aa141,#ebde2f,#9e0e18,#0d10bf,#1f9191,#528787,#75c94f",
      "showvalues":"0",
      "showAlternateHGridColor": "0",
      "lineThickness":"2",
      "showShadow":"0",
      "lineDashLen":"3",
      "divLineIsDashed": "1",
      "vDivLineAlpha": "4",
      "vDivLineIsDashed": "1",
      "showVDivLine": "1",
      "divLineAlpha": "15",
      "anchorRadius": "4",
      "anchorAlpha": "0",
      "anchorBorderThickness": "4",
      "yAxisValuesPadding": "12",
      "showZeroPlane" : "1",
      "zeroPlaneAlpha": "50",
      "zeroPlaneColor": "000000",
      "zeroPlaneThickness": "2",
      "legendBorderAlpha": "0",
      "canvasBorderAlpha": "0",
      "showBorder": "0",
      "showToolTip": "0"
	};
	
	var Doughnut2DChartOptions = {
      "bgAlpha": "0",
      "paletteColors":
	  "#FF9900,#3aa141,#ebde2f,#9e0e18,#0d10bf,#1f9191,#528787,#75c94f",
      "showValues":"1",
	  "numberPrefix": "",
	  "valueFontBold":"1",
      "showAlternateHGridColor": "0",
      "lineThickness":"2",
      "showShadow":"0",
      "lineDashLen":"3",
      "divLineIsDashed": "1",
      "vDivLineAlpha": "4",
      "vDivLineIsDashed": "1",
      "showVDivLine": "1",
      "divLineAlpha": "15",
      "anchorRadius": "4",
      "anchorAlpha": "0",
      "anchorBorderThickness": "4",
      "yAxisValuesPadding": "12",
      "showZeroPlane" : "1",
      "zeroPlaneAlpha": "50",
      "zeroPlaneColor": "000000",
      "zeroPlaneThickness": "2",
      "legendBorderAlpha": "0",
      "canvasBorderAlpha": "0",
      "showBorder": "2",
	  "showLegend": "1",
	  "legendTitle": "Carrier",
	  "legendIconScale": "2",
      "showToolTip": "0",
	  "caption":"Total Revenue"
	};
	
	var StackedBar2DChartOptions =  {
		"paletteColors": "#cf680e,#fab73c,#ffff69,#b8de1f,#1f7d05",
        "usePlotGradientColor": "0",
		"bgcolor": "ffffff",
        "outcnvbasefontcolor": "666666",
        "caption": "",
        "xaxisname": "Month",
        "yaxisname": "Sales",
        "numberprefix": "",
        "showValues": "1",
		"showLabels": "1",
		"showLimits":"1",
		"labelStep":"5",
		"labelDisplay":"0",
		"setAdaptiveYMin":"1",
        "numvdivlines": "2",
        "showalternatevgridcolor": "0",
        "alternatevgridcolor": "e1f5ff",
        "divlinecolor": "e1f5ff",
        "vdivlinecolor": "e1f5ff",
        "basefontcolor": "666666",
        "tooltipbgcolor": "F3F3F3",
        "tooltipbordercolor": "666666",
        "canvasbordercolor": "666666",
        "canvasborderthickness": "1",
        "showplotborder": "1",
		"showcategories":"0",
        "plotfillalpha": "100",
        "showborder": "1",
		"bordercolor":"e9e9e9",
		"borderthickness":"5",
		"chartTopMargin" : "20",
		"legendItemFontBold":"1",
		"useRoundEdges":"1",
		"legendShadow":"1"
    };
   
	
	var makeChart = function (chartType, id, customParams) {
		
		applicationConfig.trace("chartFactory.makeChart");	
		
		// initialise instance creation
		var aChart,
			baseUrl = "../scripts/vendor/chart/Charts/",
			chartSwf = '',
			chartObj,
			chartData, chartOptions, cid;
		
		
		/**
	     * @ngdoc method
	     * @name coreServices.ChartFactory#initChart
	     * @methodOf coreServices.ChartFactory
	     *
	     * @description
	     * Initialise the chart instance, this must be done before any of the other
	     * methods on this object can be used. 
	     * 
	     * This method is an internal method which is used to construct the object
	     * being returned by the factory create method
	     * 
	     * @param {string} chartType type of chart require, current options <code>line</code> or <code>stacked-area</code>
	     * @param {string} id Id for the chart instance
	     *
	     */
		var initChart = function (chartType, id) {
			
			applicationConfig.trace("chartFactory.initChart");	
			
			if (aChart != undefined)
				return false;
			cid = id;
			// Set up chart type
			switch (chartType) {
				case 'line': 
					chartSwf = 'MSLine.swf';
					chartOptions = lineChartOptions;
					break;
				
				case 'Doughnut2D':
					chartSwf = 'Doughnut2D.swf';
					chartOptions = Doughnut2DChartOptions;
					break;
				
				case 'StackedBar2D':
					chartSwf = 'StackedBar2D.swf';
					chartOptions = StackedBar2DChartOptions;
					break;
				
				default: chartSwf = 'StackedArea2D.swf';
						chartOptions = areaChartOptions;
			}
			
			// create our fusion charts object
			aChart = new FusionCharts(baseUrl + chartSwf,
		              "_chart-"+cid, "100%", "100%", "0");
			aChart.setTransparent(true);
			if(customParams) {
				for(var param in customParams) {
					chartOptions[param] = customParams[param];
				}
			}
		
			return true;
		};
		
		/**
	     * @ngdoc method
	     * @name coreServices.ChartFactory#render
	     * @methodOf coreServices.ChartFactory
	     *
	     * @description
	     * If chart instance has been initialised then if set Json data and render to the dom
	     * 
	     * @param {string} domId Id of the dom element to render the chart inside.
	     *
	     */
		var render = function (domId) {
			applicationConfig.trace("render");	
			aChart.setJSONData(chartData);
			aChart.render(domId);
		};
		
		
		/**
	     * @ngdoc method
	     * @name coreServices.ChartFactory#setData
	     * @methodOf coreServices.ChartFactory
	     *
	     * @description
	     * Set the data for the chart instance, method further process the data object
	     * into the correct format for chart library.
	     * 
	     * @param {Object} data Chart data object.
	     *
	     */
		// Create object for charting software
		var setData = function (data) {
			applicationConfig.trace("chartFactory.setData");	
			var catArr = [];
			for (var x = 0; x < data.categories.length; x++) {
				catArr[x] = {
					label: data.categories[x]
				};
			}
			chartOptions.xaxisname = data.labels.x;
	        chartOptions.yaxisname = data.labels.y;
			chartData = {
				dataset: data.dataset,
				categories: {category: catArr},
				chart: chartOptions,
			};
		};
		
		if (id != undefined) {
			initChart(chartType, id);
			return {
				setData: setData,
				render: render
			};
		} else return false;
	};
	
	return {
		makeChart: function (chartType, id, customParams) {
			return makeChart(chartType, id, customParams);
		}
	};
}]);
