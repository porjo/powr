angular.module('zoneControllers', [] )

.controller('ZoneCtrl', function($scope, appConfig, api) {

	$scope.zones = api.Zones.query({ server: 'localhost' });

});
