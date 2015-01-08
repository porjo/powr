
angular.module('zoneControllers', [] )

.controller('ZoneCtrl', function($scope, $state, $stateParams, appConfig, api) {

	if($state.is('p.servers.server.zones')) {
		$scope.server = $stateParams.server;
		$scope.zones = api.Zones.query({ server: $stateParams.server }, function(data) {
			// success
		}, function(data) {
			$scope.errMsg = "Error loading zones for server '" + $scope.server + "'. Msg: " + data.statusText;
		});
	} else if($state.is('p.servers.server.zones.zone')) {
		$scope.zone = api.Zones.get({ server: $stateParams.server, zone: $stateParams.zone }, function(data) {
			// success
		}, function(data) {
			$scope.errMsg = "Error loading records for zone '" + $stateParams.zone + "'. Msg: " + data.statusText;
		});
	}

	$scope.loadZone = function(zone) {
		$state.go('.zone', {zone: zone.name});
	};
});
