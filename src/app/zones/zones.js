
angular.module('zoneControllers', ['ngAnimate'] )

.controller('ZoneCtrl', function($scope, $state, $stateParams, $timeout, api) {

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
})

.controller('ZonesCtrl', function($scope, $state, $stateParams, api) {

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
});
