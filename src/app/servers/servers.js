
angular.module('serverControllers', [] )

.controller('ServerCtrl', function($scope, $state, $stateParams, appConfig, api) {
	console.log("serverctrl", $stateParams);

	if (!angular.isDefined($stateParams.server)) {
		$scope.servers = api.Servers.query();
	}

	$scope.loadServer = function(server) {
		$state.go('servers.server.zones', {server: server.id});
	};
});
