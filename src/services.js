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
