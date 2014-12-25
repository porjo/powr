
angular.module('zoneControllers', [] )

.controller('ZoneCtrl', function($scope, appConfig, api) {
	console.log("zonectrl");
	$scope.zones = api.Zones.query({ server: 'localhost' });
});
