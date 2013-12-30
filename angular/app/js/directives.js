'use strict';

/* Directives */

var dateFormat = 'YYYY-MM-DD';

function saveWeighIn(at, weight, weighIns) {
	at = moment(at).format(dateFormat);
	weight = parseFloat(weight);
	var matching = _.find(weighIns, function(wi) {
		return wi.At == at;
	});
	if (matching) {
		matching.Weight = weight;
	} else {
		weighIns.push({
			At: at,
			Weight: weight
		});
	}
}

function saveGoal(startingAt, dueAt, initialWeight, goalWeight, goals) {
	goals.push({
		StartingAt: moment(startingAt).format(dateFormat),
		DueAt: moment(dueAt).format(dateFormat),
		InitialWeight: parseFloat(initialWeight, 10),
		GoalWeight: parseFloat(goalWeight, 10)
	});
}

angular.module('weigh.directives', []).
	directive('plan', [function() {
		return {
			scope: {
				model: '='
			},
			templateUrl: '/partials/plan.html',
			link: function(scope, elm, attrs) {
				// Watchers
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
						if (!scope.weighInWeight) {
							scope.weighInWeight = lastWeight;
						}
						if (!scope.goalWeight) {
							scope.goalWeight = lastWeight - 6;
						}
					} else {
						scope.bmi = null;
						scope.bmiCategory = null;
						scope.pi = null;
						scope.piCategory = null;
					}
				}, true);
				scope.$watch(function() {
					return _.map(scope.model.WeighIns, function(wi) {
						return wi.At;
					});
				}, function() {
					scope.weighInsByAt = {};
					_.each(scope.model.WeighIns, function(wi, key) {
						scope.weighInsByAt[wi.At] = key;
					});
				}, true);
				// Default values
				scope.weighInDt = new Date();
				scope.goalDt = moment().add('weeks', 6).toDate();
				scope.weightLineColour = "rgba(0,200,0,0.6)";
				scope.goalLineColour = "rgba(200,200,0,0.3)";
				// Callbacks
				scope.saveWeighIn = function(dt, weight) {
					saveWeighIn(dt, weight, scope.model.WeighIns);
				};
				scope.saveGoal = function(dt, weight) {
					saveGoal(moment(), dt, scope.lastWeight, weight,
						scope.model.Goals);
				};
				scope.chartUpdate = function(el, data) {
					nv.addGraph(function() {
						// Format data
						var datum = [
							{
								values: _.map(_.sortBy(data.WeighIns, function(wi) {
									return wi.At;
								}), function(wi) {
									return {
										x: moment(wi.At).toDate(),
										y: wi.Weight
									}
								}),
								key: 'Weight',
								color: scope.weightLineColour
							}
						];
						_.each(scope.model.Goals, function(g) {
							if (moment().diff(moment(g.DueAt), 'weeks') > 2) {
								return;
							}
							datum.push({
								values: [{
									x: moment(g.StartingAt).toDate(),
									y: g.InitialWeight
								}, {
									x: moment(g.DueAt).toDate(),
									y: g.GoalWeight									
								}],
								key: g.GoalWeight + 'KG goal',
								color: scope.goalLineColour
							});
						});
						// Create chart
						var chart = nv.models.lineWithFocusChart();
						// chart.xAxis.
							// tickFormat(d3.requote);
						// chart.yAxis;
							// tickFormat(d3.requote);
							// tickFormat(d3.format(',f'));
						el.datum(datum).
							transition().duration(500).call(chart);
						nv.utils.windowResize(chart.update);
						return chart;
					});
				};
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
					scope.model.Height = parseFloat(height, 10);
					saveWeighIn(moment(), weight, scope.model.WeighIns);
				};
			}
		};
	}]);
