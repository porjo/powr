// Wrap app.js in a closure. Stops jshint complaining about 'use strict'
(function() {

	'use strict';

	/* App Module */
	var app = angular.module('app', [
		'ui.router',
		'appServices',
		'zoneControllers',
	]);

	app.constant('appConfig', {
		//apiURL:  'http://localhost',
		apiURL:  '',
	});

	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

		// Default route
		$urlRouterProvider.otherwise("/");
		
		$stateProvider

		.state('zones', {
			url: '/zones',
			templateUrl: 'zones/zones.html',
			controller: 'ZoneCtrl',
		});
	});

	app.config(function ($httpProvider) {
		//$httpProvider.interceptors.push('authInterceptor');
	});

}());
