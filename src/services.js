/* Services */

var appServices = angular.module('appServices', ['ngResource']);

appServices.service('api', function($rootScope, $resource, appConfig){

	this.Zones = $resource(appConfig.apiURL + '/servers/:server/zones/:zone',
	   {}, {
		   /* Custom methods */
	   });
	this.Servers = $resource(appConfig.apiURL + '/servers/:server',
	   {}, {
		   /* Custom methods */
	   });
});

appServices.factory('authInterceptor', function ($rootScope, $q, $window, appConfig) {
	return {
		request: function (config) {
			config.headers = config.headers || {};

			var re = new RegExp(appConfig.apiURL);
			if( re.test(config.url) ){
				config.headers['X-API-Key'] = appConfig.apiKey;
			}
			console.log("authInt config", config);
			return config;
		},
		response: function (response) {
			// do something on success
			return response || $q.when(response);
		},
		responseError: function(rejection) {
			//console.log("authinterceptor rejection", rejection);
			return $q.reject(rejection);
		}
	};
});
