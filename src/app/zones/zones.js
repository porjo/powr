
angular.module('zoneControllers', [] )

.controller('ZoneCtrl', function($scope, $state, $stateParams, appConfig, api) {

	/*
	var rrsets = [
			{
			"name": 'blah.mapstrata.com',
			"type": 'A',
			"changetype": 'REPLACE',
			"records": [
				{
				"content": '192.168.1.5',
				"name": 'blah.mapstrata.com',
				"ttl": 300,
				"type": 'A',
				"priority": 0,
				"disabled": false
			}],
			"comments": [
			//	{
			//	"account": "ian",
			//	"content": "test comment"
			//}
			]
		}
		];

	var zone = new api.Zones();
	zone.rrsets = rrsets;
	zone.$patch({zone: 'mapstrata.com', server: 'localhost'});

   */


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
			console.log("zone records", $scope.zone);
		}, function(data) {
			$scope.errMsg = "Error loading records for zone '" + $stateParams.zone + "'. Msg: " + data.statusText;
		});
	}

	$scope.loadZone = function(zone) {
		$state.go('.zone', {zone: zone.name});
	};

	$scope.confirm = function() {
		$scope.rrsets = [];
		var idxs = [];
		angular.forEach($scope.zoneForm, function(value, key) {
			if(key[0] == '$') return;
			if(!value.$pristine) {
				var idx = key.split('-')[1];
				if(idxs.indexOf(idx) === -1) {
					idxs.push(idx);
				}
			}
		});

		angular.forEach(idxs, function(idx) {
			$scope.rrsets.push({
				"name": $scope.zone.records[idx].name,
				"type": $scope.zone.records[idx].type,
				"changetype": 'REPLACE',
				"records": [
					{
					"content": $scope.zone.records[idx].content,
					"name": $scope.zone.records[idx].name,
					"ttl": $scope.zone.records[idx].ttl,
					"type": $scope.zone.records[idx].type,
					"disabled": $scope.zone.records[idx].disabled,
					"priority": $scope.zone.records[idx].priority
				}]
			});
		});
		console.log("rrsets", $scope.rrsets);
	};
});
