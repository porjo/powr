
angular.module('serverControllers', [] )

.controller('ServerCtrl', function($scope, $state, $stateParams, appConfig, api) {

	if (angular.isDefined($stateParams.server)) {
		// A single server has nothing useful to see, redirect to zones
		$state.go('.zones', {server: $stateParams.server});
	} else {
		$scope.servers = api.Servers.query();
	}

	$scope.viewZones = function(server) {
		$state.go('.server.zones', {server: server.id});
	};

});
