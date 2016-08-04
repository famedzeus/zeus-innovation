//  Server service
angular.module('coreServices').factory('ServerProperties', ['$rootScope', 'applicationConfig', function($rootScope, applicationConfig) {
	var server, protocol, mock;
	switch (applicationConfig.environment.get()) {
		case 'local':
			server = 'localhost:8000';
			protocol = 'http://';
			mock = 'http://localhost:9000';
			break;
		case 'dev':
		case 'uat':
			server = '';
			protocol = '';
			mock = '';
			break;
			
		case 'live':
			server = '';
			protocol = '';
			break;
		
	}

	var properties = {
		protocol: protocol,
		domain: server,
		port: 8080,
		uri: '/api/v{apiVersion}/',
		apiVersion: 1
	};
	
	var springProperties = {
		protocol: protocol,
		domain: server,
		port: 8080,
		uri: '/legacy-dealing/api/secure/',
		apiVersion: 1
	};
		
	
	return {
		URL: function () { 
			return properties.protocol + 
				   properties.domain + 
				   properties.uri.replace("{apiVersion}", properties.apiVersion);
		},
		springUrl: function () {
			return springProperties.protocol +
				   springProperties.domain +
				   springProperties.uri;
		},
		mockURL: function () {
			return mock +  properties.uri.replace("{apiVersion}", properties.apiVersion);
		},
		setServerProperties: function (protocol,domain,port) { 
			properties.protocol = protocol;
			properties.domain = domain;
			properties.port = port;
		},
		protocol: function () {return properties.protocol},
		domain: properties.domain,
		port: properties.port
	};
}]);
