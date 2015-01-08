var appDirectives = angular.module('appDirectives',[]);

// Credit to: Mauro Servienti, http://milestone.topics.it/2014/03/angularjs-ui-router-and-breadcrumbs.html
appDirectives.directive('breadcrumbs', function () {
	return {
		restrict: 'EA',
		replace: false,
		scope: {
			itemDisplayNameResolver: '&'
		},
		templateUrl: 'breadcrumbs/breadcrumbs.html',
		controller: function ($scope, $state, $stateParams) {

			var defaultResolver = function (state) {
				if( angular.isDefined($scope.$navigationState.params[state.data.name]) ) {
					return $scope.$navigationState.params[state.data.name];
				}
				return state.data.name;
			};

			var isCurrent = function(state){
				return $state.$current.name === state.name;
			};

			var setNavigationState = function () {
				$scope.$navigationState = {
					currentState: $state.$current,
					params: $stateParams,
					getDisplayName: function (state, stateParams) {
						if ($scope.hasCustomResolver) {
							return $scope.itemDisplayNameResolver({
								defaultResolver: defaultResolver,
								state: state,
								stateParams: stateParams,
								isCurrent: isCurrent(state)
							});
						}
						else {
							return defaultResolver(state);
						}
					},
					isCurrent: function (state) {
						return isCurrent(state);
					}
				};
			};

			$scope.$on('$stateChangeSuccess', function () {
				setNavigationState();
			});

			setNavigationState();
		},
		link: function (scope, element, attrs, controller) {
			scope.hasCustomResolver = angular.isDefined(attrs.itemDisplayNameResolver);
		}
	};
});
