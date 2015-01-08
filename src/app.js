// Wrap app.js in a closure. Stops jshint complaining about 'use strict'
(function() {

	'use strict';

	/* App Module */
	var app = angular.module('app', [
		'ui.router',
		'appDirectives',
		'appServices',
		'serverControllers',
		'zoneControllers',
	]);

	app.constant('appConfig', {
		apiURL:  '',
	});

	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

		// Default route
		$urlRouterProvider.otherwise("/pdns");
		
		$stateProvider

		.state('p.servers.server.zones.zone', {
			url: '/:zone',
			views: {
				'main@p': {
					templateUrl: 'zones/zone.html',
					controller: 'ZoneCtrl',
				}
			},
			data: {
				name: 'zone'
			}
		})

		.state('p.servers.server.zones', {
			url: '/zones',
			views: {
				'main@p': {
					templateUrl: 'zones/zones.html',
					controller: 'ZoneCtrl',
				}
			},
			data: {
				name: "zones"
			}
		})

		.state('p.servers.server', {
			url: '/:server',
			views: {
				'main@p': {
					template: '',
					controller: 'ServerCtrl',
				}
			},
			data: {
				name: 'server'
			}
		})

		.state('p.servers', {
			url: '/servers',
			views: {
				'main@p': {
					templateUrl: 'servers/servers.html',
					controller: 'ServerCtrl',
				}
			},
			data: {
				name: 'servers'
			}
		})

		.state('p', {
			url: '/pdns',
			templateUrl: 'home.html',
			data: {
				name: 'home'
			}
		});

	});

}());
