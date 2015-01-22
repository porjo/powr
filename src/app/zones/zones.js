
angular.module('zoneControllers', [] )

.controller('ZoneCtrl', function($scope, $state, $stateParams, $timeout, appConfig, api) {

	var masterZone = {};
	$scope.edit = {};

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
		api.Zones.get({ server: $stateParams.server, zone: $stateParams.zone }, function(data) {
			masterZone = angular.copy(data);
			$scope.zone = data;
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
			'new': true
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
			});
		}
	};
});
