'use strict';

/* Filters */

angular.module('weigh.filters', []).
	filter('weight', [function() {
		return function(text, measurementSystem) {
			var raw = parseFloat(text, 10);
			var suffix = ' kg';
			switch (measurementSystem) {
				case 'imperial':
				raw = kgToLb(raw);
				suffix = ' lb';
				break;
			}
			return raw.toFixed(1) + suffix;
		}
	}]);
