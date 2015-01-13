var appDirectives = angular.module('appDirectives',[]);

appDirectives.directive("contenteditable", function() {
	return {
		restrict: "A",
		require: "ngModel",
		link: function(scope, element, attrs, ngModel) {

			function read() {
				ngModel.$setViewValue(element.html());
			}

			ngModel.$render = function() {
				element.html(ngModel.$viewValue || "");
			};

			element.bind("blur keyup change", function() {
				scope.$apply(read);
			});
		}
	};
});

var INTEGER_REGEXP = /^\-?\d+$/;
appDirectives.directive('integer', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.integer = function(modelValue, viewValue) {
				if (ctrl.$isEmpty(modelValue)) {
					// consider empty models to be valid
					return true;
				}

				console.log("integer", viewValue, modelValue);
				if (typeof viewValue == "string") {
					viewValue = viewValue.replace('<br>','');
				}
				if (INTEGER_REGEXP.test(viewValue)) {
					ctrl.$setViewValue(parseInt(viewValue));
					// it is valid
					return true;
				}

				// it is invalid
				return false;
			};
		}
	};
});

appDirectives.directive('recordName', function() {
	return {
		require: 'ngModel',
		scope: {
			zone: '='
		},
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.recordName = function(modelValue, viewValue) {
				if (ctrl.$isEmpty(modelValue)) {
					// consider empty models to be valid
					return false;
				}

				if (typeof viewValue == "string") {
					viewValue = viewValue.replace('<br>','');
				}
				var re = new RegExp("^(?:.+\.)?"+scope.zone+"$",'g');
				if (re.test(viewValue)) {
					// it is valid
					return true;
				}

				// it is invalid
				return false;
			};
		}
	};
});

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
