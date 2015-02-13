/* Services */

var appServices = angular.module('appServices', ['ngResource']);

appServices.service('api', function($rootScope, $resource, appConfig){

	this.Zones = $resource(appConfig.apiURL + '/servers/:server/zones/:zone',
	   {zone: '@id'}, {
		   /* Custom methods */
		   'patch': {method: "PATCH"},
		   //not yet implented: 'notify': {method: "PUT", url: appConfig.apiURL + '/servers/:server/zones/:zone/notify'}
	   });
	this.Servers = $resource(appConfig.apiURL + '/servers/:server',
	   {}, {
		   /* Custom methods */
	   });
});

appServices.factory('authInterceptor', function ($rootScope, $q, $window, $log, appConfig) {
	return {
		request: function (config) {
			config.headers = config.headers || {};

			if(angular.isDefined(appConfig.apiURL) && angular.isDefined(appConfig.apiKey)) {
				if( config.url.indexOf(appConfig.apiURL) > -1 ){
					config.headers['X-API-Key'] = appConfig.apiKey;
				}
			}
			return config;
		},
		response: function (response) {
			// do something on success
			return response || $q.when(response);
		},
		responseError: function(rejection) {
			$log.debug("authinterceptor rejection", rejection);
			return $q.reject(rejection);
		}
	};
});
