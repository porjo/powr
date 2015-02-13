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


	// API backend location. If blank, then use same host that
	// served Powr HTML content
	app.constant('appConfig', {
		apiURL:  'http://localhost:8080',
		//apiURL:  'http://blahblah:8081',
		//apiKey: 'quickbrownfox',
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
					controller: 'ZonesCtrl',
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

	app.config(function ($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	});

	//-------------------------------------------------------------
	// Below is for running Powr without real backend. 
	// Enable with: 'grunt build-dist-mocks'
	//
	// Credit to http://opensourceconnections.com/blog/2013/09/16/prototype-angular-uis-without-a-backend/
	// ------------------------------------------------------------
	var appDev = angular.module('appDev', [
		'app',
		'ngMockE2E',
	]);

	appDev.run(function ($httpBackend, $timeout) {
		var regexpUrl = function (regexp) {
			return {
				test: function (url) {
					this.matches = url.match(regexp);
					return this.matches && this.matches.length > 0;
				}

			};
		};

		var zones = [{
			id: '0',
			name: 'example.com',
			kind: 'Master',
			masters: [],
			serial: 123456789,
			dnssec: false,
			records: [{
				'content': '192.168.1.1',
				'name': 'test.example.com',
				'ttl': 86400,
				'type': 'A',
				'disabled': false,
				'priority': 0,
			}],
		}];

		$httpBackend.when('GET', regexpUrl(/servers$/))
		.respond(function (method, url, data) {
			return [200, [{id: 'localhost'}]];
		});

		$httpBackend.when('GET', regexpUrl(/servers\/[^\/]+\/zones$/))
		.respond(function (method, url, data) {
			return [200, zones];
		});

		$httpBackend.when('GET', regexpUrl(/servers\/[^\/]+\/zones\/[^\/]+$/))
		.respond(function (method, url, data) {
			var zone = url.split('/').slice(-1)[0];
			for(var i=0; i < zones.length; i++) {
				if( zones[i].name === zone ) {
					return [200, zones[i]];
				}
			}
			return [404,'zone not found'];
		});

		$httpBackend.when('POST', regexpUrl(/servers\/[^\/]+\/zones$/))
		.respond(function (method, url, data) {
			var zone = angular.fromJson(data);
			zone.id = zones.length;
			zone.records = [];
			zones.push(zone);
			return [200, data];
		});

		$httpBackend.when('PATCH', regexpUrl(/servers\/[^\/]+\/zones\/[^\/]+$/))
		.respond(function (method, url, data) {
			var patch = angular.fromJson(data);
			for(var i=0; i < zones.length; i++) {
				if( zones[i].name === patch.rrsets[0].name ) {
					if(!angular.isDefined(patch.rrsets[0].records)) {
						patch.rrsets[0].records = [];
					}
					zones[i].records = patch.rrsets[0].records;
					return [200, ''];
				}
			}
			return [404,'zone not found'];
		});

		// A "run loop" of sorts to get httpBackend to
		// issue responses and trigger the client code's callbacks
		var flushBackend = function () {
			try {
				$httpBackend.flush();
			} catch (err) {
				// ignore that there's nothing to flush
			}
			$timeout(flushBackend, 500);
		};
		$timeout(flushBackend, 500);
	});

}());
