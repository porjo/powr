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
		apiURL:  '',
	});

	app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", function($stateProvider, $urlRouterProvider, $locationProvider) {

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

	}]);

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

	appDev.run(["$httpBackend", "$timeout", function ($httpBackend, $timeout) {
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
			records: [],
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
	}]);

}());
;
angular.module('serverControllers', [] )

.controller('ServerCtrl', ["$scope", "$state", "$stateParams", "appConfig", "api", function($scope, $state, $stateParams, appConfig, api) {

	if (angular.isDefined($stateParams.server)) {
		// A single server has nothing useful to see, redirect to zones
		$state.go('.zones', {server: $stateParams.server});
	} else {
		$scope.servers = api.Servers.query();
		console.log("servers", $scope.servers);
	}

	$scope.viewZones = function(server) {
		$state.go('.server.zones', {server: server.id});
	};

}]);
;
angular.module('zoneControllers', ['ngAnimate'] )

.controller('ZoneCtrl', ["$scope", "$state", "$stateParams", "$timeout", "api", function($scope, $state, $stateParams, $timeout, api) {

	var masterZone = {};
	$scope.edit = {};
	$scope.save = {};

	/*
	// Catch unsaved changes
	$scope.$on('$stateChangeStart', function (e, toState, toParams) {
		console.log("locationchange", toState, toParams, $scope.zoneForm.$dirty);
		if ($scope.zoneForm.$dirty) {
			var answer = confirm('Are you sure you want to navigate away from this page');
			if (!answer) {
				e.preventDefault();
			}
		}
	});
   */

	if($state.is('p.servers.server.zones.zone')) {
		api.Zones.get({ server: $stateParams.server, zone: $stateParams.zone }, function(data) {
			console.log("get zone", data);
			masterZone = angular.copy(data);
			$scope.zone = data;
			// success
			console.log("zone records", $scope.zone);
			$timeout(function() {
				$scope.showHelp = true;
				$timeout(function() {
					$scope.showHelp = false;
				},5000);
			},500);
		}, function(result) {
			$scope.errMsg = "Error loading zone '" + $stateParams.zone + "': " + result.data;
		});
	}

	$scope.confirm = function() {

		$scope.rrsets = [];
		$scope.edit.msg = "";

		// Did anything actually change?
		if( angular.equals(masterZone, $scope.zone) ) {
			$scope.edit.msg = "No changes detected";
			return;
		}

		$scope.replaceId = [];
		$scope.delId = [];

		angular.forEach($scope.zoneForm, function(value, key) {
			//console.log("zoneForm", key, value);
			if(key[0] == '$') return;
			if(value.$dirty) {
				var bits = key.split('-');
				if( bits[0] == "delete" ) {
					if($scope.delId.indexOf(bits[1]) === -1 && $scope.zone.records[bits[1]].delete === true) {
						$scope.delId.push(bits[1]);
					}
				} else {
					if($scope.replaceId.indexOf(bits[1]) === -1) {
						$scope.replaceId.push(bits[1]);
					}
				}
			}
		});

		angular.forEach($scope.replaceId, function(idx) {
			$scope.rrsets.push({
				'name': $scope.zone.records[idx].name,
				'type': $scope.zone.records[idx].type,
				'changetype': 'REPLACE',
				'records': [
					{
					'content': $scope.zone.records[idx].content,
					'name': $scope.zone.records[idx].name,
					'ttl': $scope.zone.records[idx].ttl,
					'type': $scope.zone.records[idx].type,
					'disabled': $scope.zone.records[idx].disabled,
					'priority': $scope.zone.records[idx].priority
				}]
			});
		});

		angular.forEach($scope.delId, function(idx) {
			$scope.rrsets.push({
				'name': $scope.zone.records[idx].name,
				'type': $scope.zone.records[idx].type,
				'changetype': 'DELETE'
			});
		});

	};

	$scope.addRecord = function() {
		var record = {
			'content': 'change me',
			'name': $scope.zone.name,
			'ttl': 86400,
			'type': 'A',
			'disabled': false,
			'priority': 0,
		};

		$scope.zone.records.push(record);
	};

	$scope.save = function() {
		if($scope.rrsets.length > 0) {
			var zone = new api.Zones();
			zone.rrsets = $scope.rrsets;
			zone.$patch({zone: $stateParams.zone , server: $stateParams.server},function(data) {
				$scope.rrsets = [];
				$state.reload();
				console.log("save success", data);
			},function(result) {
				if(result.data !== '') {
					$scope.save.msg = result.data;
				} else {
					$scope.save.msg = 'There was an unspecified error saving the zone';
				}
			});

		}
	};
}])

.controller('ZonesCtrl', ["$scope", "$state", "$stateParams", "api", function($scope, $state, $stateParams, api) {

	$scope.save = {};
	$scope.zone = {
		kind: 'Master'
	};

	if($state.is('p.servers.server.zones')) {
		$scope.server = $stateParams.server;
		$scope.zones = api.Zones.query({ server: $stateParams.server }, function(data) {
			console.log("get zones", $scope.zones);
			// success
		}, function(data) {
		}, function(result) {
			$scope.errMsg = "Error loading zones for server '" + $scope.server + "': " + result.data;
		});
	}

	$scope.loadZone = function(zone) {
		$state.go('.zone', {zone: zone.name});
	};

	$scope.save = function() {
		console.log("zone save before", $scope.zoneForm);
		var zone = new api.Zones();
		zone.name = $scope.zone.name;
		zone.type = "Zone";
		zone.kind = $scope.zone.kind;
		zone.nameservers = [];

		zone.$save({server: $stateParams.server},function(data) {
		console.log("zone save", data);
			$scope.zones.push(zone);
		},function(result) {
			if(result.data !== '') {
				$scope.save.msg = result.data;
			} else {
				$scope.save.msg = 'There was an unspecified error saving the zone';
			}
		});
	};
}]);
;var appDirectives = angular.module('appDirectives',[]);

appDirectives.directive("contenteditable", function() {
	return {
		restrict: "A",
		require: "ngModel",
		link: function(scope, element, attrs, ngModel) {

			function read() {
				ngModel.$setViewValue(element.html());
			}

			ngModel.$render = function() {
				element.html(ngModel.$viewValue || "");
			};

			element.bind("blur keyup change", function() {
				scope.$apply(read);
			});
		}
	};
});

//var INTEGER_REGEXP = /^\-?\d+$/;
var HOSTNAME_REGEXP = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
// TODO: more complete IPv4 + IPv6 regex
var IP_REGEXP = /^[0-9A-Fa-f]+[:.]+[0-9A-Fa-f\.:]+$/;

var editableTrim = function(text) {
	if (typeof text == "string") {
		text = text.replace(/<br>/g,'');
		text = text.replace(/&nbsp;/g,'');
		text = text.trim();
	}
	return text;
};

appDirectives.directive('integer', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue){
				if( ctrl.$isEmpty(viewValue) ) {
					return 0;
				}
				return parseInt(viewValue, 10);
			});
		}
	};
});

appDirectives.directive('recordName', function() {
	return {
		require: 'ngModel',
		scope: {
			zone: '='
		},
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.recordName = function(modelValue, viewValue) {
				if (ctrl.$isEmpty(modelValue)) {
					return false;
				}

				viewValue = editableTrim(viewValue);
				if (HOSTNAME_REGEXP.test(viewValue)) {
					var re = new RegExp("^(?:.+\.)?"+scope.zone+"$",'g');
					if (re.test(viewValue)) {
						ctrl.$setViewValue(viewValue);
						return true;
					}
				}

				// it is invalid
				return false;
			};
		}
	};
});

appDirectives.directive('recordType', function() {
	var types = ["NS", "A", "SOA", "MX", "AAAA", "TXT", "CNAME"];
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.recordType = function(modelValue, viewValue) {
				if (ctrl.$isEmpty(modelValue)) {
					return false;
				}

				viewValue = editableTrim(viewValue);
				var match = false;
				angular.forEach(types,function(val,key) {
					if( viewValue === val ) {
						match = true;
					}
				});

				if(match) {
					ctrl.$setViewValue(viewValue);
					return true;
				}

				return false;

			};
		}
	};
});

appDirectives.directive('recordContent', ["$compile", function($compile) {
	return {
		require: 'ngModel',
		scope: {
			type: '='
		},
		transclude: true,
		template: '<span>{{msg}}</span><ng-transclude></ng-transclude>',
		controller: ["$scope", function($scope) { 
			    }],
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.recordName = function(modelValue, viewValue) {
				var el;
				if (ctrl.$isEmpty(modelValue)) {
					return false;
				}

				viewValue = editableTrim(viewValue);
				switch(scope.type) {
					case "MX":
					case "CNAME":
						if (HOSTNAME_REGEXP.test(viewValue)) {
							ctrl.$setViewValue(viewValue);
							return true;
						}
						break;
					case "A":
						if (IP_REGEXP.test(viewValue)) {
							ctrl.$setViewValue(viewValue);
							return true;
						}
						break;
					default:
						ctrl.$setViewValue(viewValue);
						return true;
				}

				// it is invalid
				scope.msg = "Invalid value";
				return false;
			};
		}
	};
}]);

/*
appDirectives.directive('errorInfo', function() {
	return {
		restrict: 'A',
		scope: { msg: '@' },
		template: '<div class="error-info"><span class="glyphicon glyphicon-remove-circle"></span>{{msg}}</div>'
	};
});

*/

// Credit to: Mauro Servienti, http://milestone.topics.it/2014/03/angularjs-ui-router-and-breadcrumbs.html
appDirectives.directive('breadcrumbs', function () {
	return {
		restrict: 'EA',
		replace: false,
		scope: {
			itemDisplayNameResolver: '&'
		},
		templateUrl: 'breadcrumbs/breadcrumbs.html',
		controller: ["$scope", "$state", "$stateParams", function ($scope, $state, $stateParams) {

			var defaultResolver = function (state) {
				if( angular.isDefined($scope.$navigationState.params[state.data.name]) ) {
					return $scope.$navigationState.params[state.data.name];
				}
				return state.data.name;
			};

			var isCurrent = function(state){
				return $state.$current.name === state.name;
			};

			var setNavigationState = function () {
				$scope.$navigationState = {
					currentState: $state.$current,
					params: $stateParams,
					getDisplayName: function (state, stateParams) {
						if ($scope.hasCustomResolver) {
							return $scope.itemDisplayNameResolver({
								defaultResolver: defaultResolver,
								state: state,
								stateParams: stateParams,
								isCurrent: isCurrent(state)
							});
						}
						else {
							return defaultResolver(state);
						}
					},
					isCurrent: function (state) {
						return isCurrent(state);
					}
				};
			};

			$scope.$on('$stateChangeSuccess', function () {
				setNavigationState();
			});

			setNavigationState();
		}],
		link: function (scope, element, attrs, controller) {
			scope.hasCustomResolver = angular.isDefined(attrs.itemDisplayNameResolver);
		}
	};
});
;/* Services */

var appServices = angular.module('appServices', ['ngResource']);

appServices.service('api', ["$rootScope", "$resource", "appConfig", function($rootScope, $resource, appConfig){

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
}]);
;angular.module('app').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('breadcrumbs/breadcrumbs.html',
    "<ul class=\"breadcrumbs\"><li ng-repeat=\"state in $navigationState.currentState.path\"><span><a ui-sref=\"{{ state.name }}\">{{$navigationState.getDisplayName(state, $navigationState.params)}}</a></span></li></ul>"
  );


  $templateCache.put('home.html',
    "<breadcrumbs></breadcrumbs><div ui-view=\"main\"><a ui-sref=\"p.servers\">Servers</a></div>"
  );


  $templateCache.put('servers/servers.html',
    "<h2>Servers</h2><table class=\"table table-striped\"><tr><thead><th>Name</th><th>Server Type</th><th>Version</th></thead></tr><tbody><tr ng-repeat=\"server in servers\" ng-click=\"viewZones(server)\" class=\"clickable\"><td>{{server.id}}</td><td>{{server.daemon_type}}</td><td>{{server.version}}</td></tr></tbody></table>"
  );


  $templateCache.put('zones/zone.html',
    "<h3>{{ zone.name }}</h3><div ng-show=\"errMsg\" class=\"alert alert-danger\" role=\"alert\">{{errMsg}}</div><div ng-hide=\"rrsets.length\"><div class=\"edit-head\"><p><label>Filter Keyword:</label><input type=\"text\" ng-model=\"query\"></p><p class=\"alert alert-info help-box slidedown\" ng-show=\"showHelp\"><span class=\"glyphicon glyphicon-info-sign\"></span>&nbsp;<em>Click on a cell to edit the contents</em></p></div><form name=\"zoneForm\"><table class=\"table table-striped\"><tr><thead class=\"clickable\"><th ng-click=\"orderByField='name'; reverseSort = !reverseSort\">Name</th><th ng-click=\"orderByField='type'; reverseSort = !reverseSort\">Type</th><th ng-click=\"orderByField='ttl'; reverseSort = !reverseSort\">ttl</th><th ng-click=\"orderByField='priority'; reverseSort = !reverseSort\">priority</th><th ng-click=\"orderByField='disabled'; reverseSort = !reverseSort\">disabled</th><th ng-click=\"orderByField='content'; reverseSort = !reverseSort\">content</th><th ng-click=\"orderByField='content'; reverseSort = !reverseSort\">Delete</th></thead></tr><tbody><tr ng-repeat=\"record in zone.records | filter:query | orderBy:orderByField:reverseSort\" class=\"editable\"><td contenteditable record-name data-zone=\"zone.name\" name=\"name-{{$index}}\" ng-model=\"record.name\">{{record.name}}</td><td contenteditable record-type ng-model=\"record.type\" name=\"type-{{$index}}\">{{record.type}}</td><td contenteditable integer ng-model=\"record.ttl\" name=\"ttl-{{$index}}\">{{record.ttl}}</td><td contenteditable integer ng-model=\"record.priority\" name=\"priority-{{$index}}\">{{record.priority}}</td><td ng-class=\"{'ng-dirty': record.disabled}\"><input type=\"checkbox\" ng-model=\"record.disabled\" name=\"disabled-{{$index}}\"></td><td contenteditable record-content data-type=\"record.type\" ng-model=\"record.content\" name=\"content-{{$index}}\">{{record.content}}</td><td ng-class=\"{'ng-dirty': record.delete}\"><input type=\"checkbox\" ng-model=\"record.delete\" name=\"delete-{{$index}}\"></td></tr></tbody></table><p><button class=\"btn btn-success\" ng-click=\"addRecord()\"><span class=\"glyphicon glyphicon-plus\"></span>&nbsp;Add</button> <button class=\"btn btn-primary\" ng-click=\"confirm()\" ng-disabled=\"zoneForm.$invalid || zoneForm.$pristine\">Next&nbsp;<span class=\"glyphicon glyphicon-chevron-right\"></span></button></p><p ng-show=\"edit.msg\" class=\"alert alert-warning\">{{edit.msg}}</p></form></div><div ng-show=\"rrsets.length\"><p>The following changes will be made:</p><table class=\"table table-striped\"><tr><thead><th>Name</th><th>Type</th><th>ttl</th><th>priority</th><th>disabled</th><th>content</th></thead></tr><tbody><tr ng-show=\"replaceId.length\" class=\"subtitle\"><th class=\"info\" colspan=\"6\">Update</th></tr><tr ng-repeat=\"idx in replaceId\"><td>{{zone.records[idx].name}}</td><td>{{zone.records[idx].type}}</td><td>{{zone.records[idx].ttl}}</td><td>{{zone.records[idx].priority}}</td><td><span class=\"glyphicon\" ng-class=\"{'glyphicon-ok-sign': zone.records[idx].disabled, 'glyphicon-remove-sign': !zone.records[idx].disabled}\"></span></td><td>{{zone.records[idx].content}}</td></tr><tr ng-show=\"delId.length\" class=\"subtitle\"><th class=\"danger\" colspan=\"6\">Delete</th></tr><tr ng-repeat=\"idx in delId\"><td>{{zone.records[idx].name}}</td><td>{{zone.records[idx].type}}</td><td>{{zone.records[idx].ttl}}</td><td>{{zone.records[idx].priority}}</td><td><span class=\"glyphicon\" ng-class=\"{'glyphicon-ok-sign': zone.records[idx].disabled, 'glyphicon-remove-sign': !zone.records[idx].disabled}\"></span></td><td>{{zone.records[idx].content}}</td></tr></tbody></table><p><button class=\"btn btn-success\" ng-click=\"rrsets=[]\"><span class=\"glyphicon glyphicon-chevron-left\"></span>Back</button> <button class=\"btn btn-primary\" ng-click=\"save()\">OK</button></p><p ng-show=\"save.msg\" class=\"alert alert-warning\">{{save.msg}}</p></div>"
  );


  $templateCache.put('zones/zones.html',
    "<h2>Zones</h2><div ng-show=\"errMsg\" class=\"alert alert-danger\" role=\"alert\">{{errMsg}}</div><table class=\"table table-striped\"><tr><thead><th>Name</th><th>Kind</th><th>Serial</th><th>Dnssec</th><th>Masters</th></thead></tr><tbody><tr ng-repeat=\"zone in zones\" ng-click=\"loadZone(zone)\" class=\"clickable\"><td>{{zone.name}}</td><td>{{zone.kind}}</td><td>{{zone.serial}}</td><td>{{zone.dnssec}}</td><td>{{zone.masters}}</td></tr></tbody></table><div ng-show=\"showAddZone\"><form name=\"zoneForm\" class=\"form-inline\" ng-submit=\"save()\" novalidate><div class=\"form-group\"><label>Domain name</label><input type=\"text\" ng-model=\"zone.name\" name=\"name\"></div><div class=\"form-group\"><label>Kind</label><select name=\"kind\" ng-model=\"zone.kind\" class=\"form-control\"><option value=\"Master\">Master</option><option value=\"Native\">Native</option><option value=\"Slave\">Slave</option></select></div><button type=\"submit\" class=\"btn btn-primary\">Save</button></form><p ng-show=\"save.msg\" class=\"alert alert-danger\">{{save.msg}}</p></div><button class=\"btn btn-success\" ng-hide=\"showAddZone\" ng-click=\"showAddZone = true\"><span class=\"glyphicon glyphicon-plus\"></span>&nbsp;Add</button>"
  );

}]);
