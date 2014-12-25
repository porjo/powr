// Wrap app.js in a closure. Stops jshint complaining about 'use strict'
(function() {

	'use strict';

	/* App Module */
	var app = angular.module('app', [
		'ui.router',
		'appServices',
		'serverControllers',
		'zoneControllers',
	]);

	app.constant('appConfig', {
		//apiURL:  'http://localhost',
		apiURL:  '',
	});

	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

		// Default route
		$urlRouterProvider.otherwise("/servers/localhost/zones");
		
		$stateProvider

		.state('servers.server.zones.zone', {
			url: '/:zone',
			templateUrl: 'zones/zone.html',
			controller: 'ZoneCtrl',
		})

		.state('servers.server.zones', {
			url: '/zones',
			templateUrl: 'zones/zones.html',
			controller: 'ZoneCtrl',
		})

		.state('servers.server', {
			url: '/:server',
			templateUrl: 'servers/server.html',
			controller: 'ServerCtrl',
		})

		.state('servers', {
			url: '/servers',
			templateUrl: 'servers/servers.html',
			controller: 'ServerCtrl',
		});

	});

	app.config(function ($httpProvider) {
		//$httpProvider.interceptors.push('authInterceptor');
	});

}());
