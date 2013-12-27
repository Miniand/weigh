'use strict';

/* Directives */

angular.module('weigh.directives', []).
	directive('plan', [function() {
		return {
			scope: {
				model: '='
			},
			templateUrl: '/partials/plan.html',
			link: function(scope, elm, attrs) {
				scope.$watch('model.WeighIns.length', function(len) {
					scope.lastWeighIn = len > 0 ? scope.model.WeighIns[len-1] :
						null;
				}, true);
				scope.$watch('lastWeighIn.Weight', function(weight) {
					scope.lastWeight = weight;
				}, true);
				scope.$watch('lastWeight', function(lastWeight) {
					if (lastWeight) {
						scope.bmi = bodyMassIndex(lastWeight, scope.model.Height);
						scope.bmiCategory = categories()[
							categoriseIndex(scope.bmi, bodyMassIndexPivot(),
								bodyMassIndexDistances())];
						scope.pi = ponderalIndex(lastWeight, scope.model.Height);
						scope.piCategory = categories()[
							categoriseIndex(scope.pi, ponderalIndexPivot(),
								ponderalIndexDistances())];
					} else {
						scope.bmi = null;
						scope.bmiCategory = null;
						scope.pi = null;
						scope.piCategory = null;
					}
				}, true);
			}
		};
	}]).
	directive('initial', [function() {
		return {
			scope: {
				model: '='
			},
			templateUrl: '/partials/initial.html',
			link: function(scope, elm, attrs) {
				scope.height = 1.7;
				scope.weight = 70;
				scope.setInitial = function(height, weight) {
					scope.model.Height = height;
					scope.model.WeighIns.push({
						At: '2013-12-27',
						Weight: weight
					});
				};
			}
		};
	}]);
