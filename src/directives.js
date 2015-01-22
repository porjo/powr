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

//var INTEGER_REGEXP = /^\-?\d+$/;
var HOSTNAME_REGEXP = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
// TODO: more complete IPv4 + IPv6 regex
var IP_REGEXP = /^[0-9A-Fa-f]+[:.]+[0-9A-Fa-f\.:]+$/;

var editableTrim = function(text) {
	if (typeof text == "string") {
		text = text.replace(/<br>/g,'');
		text = text.replace(/&nbsp;/g,'');
		text = text.trim();
	}
	return text;
};

appDirectives.directive('integer', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue){
				if( ctrl.$isEmpty(viewValue) ) {
					return 0;
				}
				return parseInt(viewValue, 10);
			});
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
					return false;
				}

				viewValue = editableTrim(viewValue);
				if (HOSTNAME_REGEXP.test(viewValue)) {
					var re = new RegExp("^(?:.+\.)?"+scope.zone+"$",'g');
					if (re.test(viewValue)) {
						ctrl.$setViewValue(viewValue);
						return true;
					}
				}

				// it is invalid
				return false;
			};
		}
	};
});

appDirectives.directive('recordType', function() {
	var types = ["NS", "A", "SOA", "MX", "AAAA", "TXT", "CNAME"];
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.recordType = function(modelValue, viewValue) {
				if (ctrl.$isEmpty(modelValue)) {
					return false;
				}

				viewValue = editableTrim(viewValue);
				var match = false;
				angular.forEach(types,function(val,key) {
					if( viewValue === val ) {
						match = true;
					}
				});

				if(match) {
					ctrl.$setViewValue(viewValue);
					return true;
				}

				return false;

			};
		}
	};
});

appDirectives.directive('recordContent', function($compile) {
	return {
		require: 'ngModel',
		scope: {
			type: '='
		},
		transclude: true,
		template: '<span>{{msg}}</span><ng-transclude></ng-transclude>',
		controller: function($scope) { 
			    },
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$validators.recordName = function(modelValue, viewValue) {
				var el;
				if (ctrl.$isEmpty(modelValue)) {
					return false;
				}

				viewValue = editableTrim(viewValue);
				switch(scope.type) {
					case "MX":
					case "CNAME":
						if (HOSTNAME_REGEXP.test(viewValue)) {
							ctrl.$setViewValue(viewValue);
							return true;
						}
						break;
					case "A":
						if (IP_REGEXP.test(viewValue)) {
							ctrl.$setViewValue(viewValue);
							return true;
						}
						break;
					default:
						ctrl.$setViewValue(viewValue);
						return true;
				}

				// it is invalid
				scope.msg = "Invalid value";
				return false;
			};
		}
	};
});

/*
appDirectives.directive('errorInfo', function() {
	return {
		restrict: 'A',
		scope: { msg: '@' },
		template: '<div class="error-info"><span class="glyphicon glyphicon-remove-circle"></span>{{msg}}</div>'
	};
});

*/

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
