
angular.module('serverControllers', [] )

.controller('ServerCtrl', function($scope, appConfig, api) {
	console.log("serverctrl");
	$scope.servers = api.Servers.query();
});
