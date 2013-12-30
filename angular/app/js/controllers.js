'use strict';

/* Controllers */

angular.module('weigh.controllers', []).
	controller('StdCtrl', ['$scope', '$timeout', '$http', function($scope,
		$timeout, $http) {
		$scope.$watch('model', function() {
			if ($scope.timer && $scope.timer.cancel) {
				$scope.timer.cancel();
			}
			$scope.timer = $timeout(function() {
				$http.post('/' + $scope.id, $scope.model);
			}, 2000);
		}, true);
	}]);
