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
				var piDistances = ponderalIndexDistances();
				var piDistLen = piDistances.length;
				// Watchers
				scope.$watch('model.WeighIns.length', function(len) {
					scope.lastWeighIn = len > 0 ? _.sortBy(scope.model.WeighIns,
						function(wi) {
							return wi.At;
						})[len-1] : null;
				}, true);
				scope.$watch('lastWeighIn.Weight', function(weight) {
					scope.lastWeight = weight;
				}, true);
				scope.$watch('model.Height', function() {
					// scope.piPivot = weightFromPonderalIndex(scope.model.Height,
					// 	ponderalIndexPivot());
					scope.piPivot = ponderalIndexPivot();
					var fullDistances = _.union(_.map(_.clone(piDistances).
						reverse(), function(d) {
							return -d;
						}), piDistances);
					scope.weightRanges = {};
					for (var i = 0, len = fullDistances.length; i < len-1; i++) {
						scope.weightRanges[i-piDistLen+1] = {
							start: weightFromPonderalIndex(scope.model.Height,
								scope.piPivot + fullDistances[i]),
							end: weightFromPonderalIndex(scope.model.Height,
								scope.piPivot + fullDistances[i+1])
						}						
					}
				}, true);
				scope.$watch('lastWeight', function(lastWeight) {
					if (lastWeight) {
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
				scope.$watch(function() {
					return [scope.xAxisRange.start, scope.xAxisRange.end,
						scope.model];
				}, function() {
					// The display period has changed
					// Scope down the display weigh ins
					scope.displayWeighIns = [];
					var prevWeighIn, nextWeighIn;
					_.each(scope.model.WeighIns, function(wi) {
						if (wi.At >= scope.xAxisRange.start &&
							wi.At <= scope.xAxisRange.end) {
							scope.displayWeighIns.push(wi);
						} else if (wi.At < scope.xAxisRange.start) {
							if (!prevWeighIn || wi.At > prevWeighIn.At) {
								prevWeighIn = wi;
							}
						} else {
							if (!nextWeighIn || wi.At < nextWeighIn.At) {
								nextWeighIn = wi;
							}
						}
					});
					if (prevWeighIn) {
						scope.displayWeighIns.push(prevWeighIn);						
					}
					if (nextWeighIn) {
						scope.displayWeighIns.push(nextWeighIn);
					}
					// Scope down the display goals
					scope.displayGoals = _.filter(scope.model.Goals,
						function(g) {
						return g.StartingAt < scope.xAxisRange.end &&
							g.DueAt > scope.xAxisRange.start;
						});
				}, true);
				scope.$watch(function() {
					return [scope.displayWeighIns, scope.displayGoals,
						scope.weightRanges[0], scope.expandToShowPiNormalRange];
				}, function() {
					// Update the y axis range and ticks
					var values = _.union(
						_.map(scope.displayWeighIns, function(wi) {
							return wi.Weight;
						}),
						_.flatten(_.map(scope.displayGoals, function(g) {
							return [g.InitialWeight, g.GoalWeight];
						})),
						(scope.expandToShowPiNormalRange ?
							[scope.weightRanges[0].start,
							scope.weightRanges[0].end] : []));
					var min = _.min(values);
					var max = _.max(values);
					var range = max - min;
					if (range < 3) {
						min -= (3 - range) / 2;
						max += (3 - range) / 2;
						range = 3;
					}
					var padding = range * 0.1;
					scope.yAxisRange = {
						start: min - padding,
						end: max + padding
					};
				}, true);
				scope.$watch(function() {
					return [scope.xAxisRange, scope.chartViewPort.width,
						scope.chartMargin.left, scope.chartMargin.right];
				}, function() {
					var days = moment(scope.xAxisRange.end).diff(
						moment(scope.xAxisRange.start), 'days');
					scope.xAxisScale = (scope.chartViewPort.width -
						scope.chartMargin.left - scope.chartMargin.right) /
						days;
				}, true);
				scope.$watch(function() {
					return [scope.yAxisRange, scope.chartViewPort.height,
						scope.chartMargin.top, scope.chartMargin.bottom];
				}, function() {
					scope.yAxisScale = (scope.chartViewPort.height -
						scope.chartMargin.top - scope.chartMargin.bottom) /
						(scope.yAxisRange.end - scope.yAxisRange.start);
				}, true);
				scope.$watch(function() {
					return [scope.model.WeighIns, scope.chartViewPort,
						scope.chartMargin, scope.xAxisRange, scope.yAxisRange];
				}, function() {
					scope.weightPath = 'M ' + _.map(_.sortBy(
						scope.displayWeighIns, function(wi) {
							return wi.At;
						}), function(wi) {
							return scope.toXPosition(wi.At) + ' ' +
								scope.toYPosition(wi.Weight);
						}).join(' L ');
				}, true);
				scope.$watch('xAxisRange', function() {
					var ctr = scope.xAxisRange.start;
					scope.xAxisTicks = [];
					while (ctr <= scope.xAxisRange.end) {
						scope.xAxisTicks.push(ctr);
						ctr = moment(ctr).add('days', 1).format(dateFormat);
					}
					var tickRatio = Math.ceil(scope.xAxisTicks.length / 15);
					if (tickRatio > 1) {
						// Too many ticks, reduce by ratio
						scope.xAxisTicks = _.filter(scope.xAxisTicks,
							function(t, i) {
								return i % tickRatio == 0;
							});
					}
				}, true);
				scope.$watch('yAxisRange', function() {
					var range = scope.yAxisRange.end - scope.yAxisRange.start;
					var ticks = 8;
					scope.yAxisTicks = [];
					for (var i = 0; i < ticks; i++) {
						scope.yAxisTicks.push(Math.round(
							(scope.yAxisRange.start + range * i / ticks)
							* 10) / 10);
					}
				}, true);
				scope.$watch('dateRangeWeeks', function() {
					scope.xAxisRange = {
						start: moment().add('weeks', -scope.dateRangeWeeks).
							format(dateFormat),
						end: moment().add('weeks', scope.dateRangeWeeks).
							format(dateFormat)
					};
				}, true);
				// Default values
				scope.weighInDt = new Date();
				scope.goalDt = moment().add('weeks', 6).toDate();
				scope.weightLineColour = "rgba(0,200,0,0.6)";
				scope.goalLineColour = "rgba(200,200,0,0.3)";
				scope.dateRangeWeeks = 3;
				scope.chartViewPort = {
					width: 1140,
					height: 570
				};
				scope.chartMargin = {
					top: 20,
					right: 20,
					bottom: 90,
					left: 70
				};
				scope.measurementSystem = 'metric';
				scope.today = moment().format(dateFormat);
				// Callbacks
				scope.saveWeighIn = function(dt, weight) {
					var existingWeighIn = scope.weighInsByAt[moment(dt).format(
						dateFormat)];
					if (existingWeighIn !== undefined) {
						_.each(scope.model.Goals, function(g) {
							if (g.StartingAt == scope.model.WeighIns[
								existingWeighIn].At) {
								g.InitialWeight = parseFloat(weight, 10);
							}
						});						
					}
					saveWeighIn(dt, weight, scope.model.WeighIns);
				};
				scope.saveGoal = function(dt, weight) {
					saveGoal(moment(), dt, scope.lastWeight, weight,
						scope.model.Goals);
				};
				scope.toXPosition = function(at) {
					var days = moment(at).diff(moment(scope.xAxisRange.start),
						'days');
					return scope.chartMargin.left + days * scope.xAxisScale;
				};
				scope.toYPosition = function(weight) {
					return scope.chartMargin.top + (scope.yAxisRange.end -
						weight) * scope.yAxisScale;
				};
				scope.setWeighInFormTo = function(weighIn) {
					scope.weighInDt = moment(weighIn.At).toDate();
					scope.weighInWeight = weighIn.Weight;
				};
				scope.disabledWeighInDates = function(date, mode) {
					return date > moment().endOf('day').toDate();
				};
				scope.disabledGoalDates = function(date, mode) {
					return date <= moment().endOf('day').toDate();
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
