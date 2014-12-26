
angular.module('zoneControllers', [] )

.controller('ZoneCtrl', function($scope, $state, $stateParams, appConfig, api) {
	console.log("zonectrl", $stateParams);

	$scope.server = '';
	$scope.zone = {};

	if (angular.isDefined($stateParams.zone)) {
		console.log("zonectrl, query records");
		$scope.zone = api.Zones.get({ server: $stateParams.server, zone: $stateParams.zone }, function(data) {
			// success
		}, function(data) {
			$scope.errMsg = "Error loading records for zone '" + $stateParams.zone + "'. Msg: " + data.statusText;
		});
	} else if(angular.isDefined($stateParams.server)) {
		$scope.server = $stateParams.server;
		$scope.zones = api.Zones.query({ server: $stateParams.server }, function(data) {
			// success
		}, function(data) {
			$scope.errMsg = "Error loading zones for server '" + $scope.server + "'. Msg: " + data.statusText;
		});
	}

	$scope.loadZone = function(zone) {
		$state.go('servers.server.zones.zone', {zone: zone.name});
	};
});
