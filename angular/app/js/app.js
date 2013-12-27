'use strict';

angular.module('weigh', [
	'weigh.filters',
	'weigh.services',
	'weigh.directives',
	'weigh.controllers'
]);

function baseIndex(weight, height, pow) {
	return weight / Math.pow(height, pow);
}

function weightFromBaseIndex(height, index, pow) {
	return Math.pow(height, pow) * index;
}

function heightFromBaseIndex(weight, index, pow) {
	return Math.pow(weight / index, 1 / pow);
}

function ponderalIndexPow() {
	return 3;
}

function bodyMassIndexPow() {
	return 2;
}

/**
 * Gets the Body Mass Index for a given weight in KG and height in M
 * @see http://en.wikipedia.org/wiki/Body_mass_index
 * @param  {float} weight Weight in kilograms
 * @param  {float} height Height in metres
 * @return {float}
 */
function bodyMassIndex(weight, height) {
	return baseIndex(weight, height, bodyMassIndexPow());
}

/**
 * Calculates the weight given a height and a BMI score
 * @param  {float} height Height in metres
 * @param  {float} bmi
 * @return {float}        Weight in kilograms
 */
function weightFromBodyMassIndex(height, bmi) {
	return weightFromBaseIndex(height, bmi, bodyMassIndexPow());
}

/**
 * Calculates the height given a weight and a BMI score
 * @param  {float} weight Weight in kilograms
 * @param  {float} bmi
 * @return {float}        Height in metres
 */
function heightFromBodyMassIndex(weight, bmi) {
	return heightFromBaseIndex(weight, bmi, bodyMassIndexPow());
}

/**
 * The median value in the normal BMI range
 * @return {float}
 */
function bodyMassIndexPivot() {
	return 21.75;
}

/**
 * Distances from the pivot defining the BMI ranges
 * @return {float}
 */
function bodyMassIndexDistances() {
	return [3.25, 8.25];
}

/**
 * The average height assumed as the point to link BMI and PI
 * @return {[type]} [description]
 */
function averageHeight() {
	return 1.7;
}

function averageWeight() {
	return 70;
}

/**
 * Gets the Ponderal Index for a given weight in KG and height in M
 * @see http://en.wikipedia.org/wiki/Ponderal_index
 * @param  {float} weight Weight in kilograms
 * @param  {float} height Height in metres
 * @return {float}
 */
function ponderalIndex(weight, height) {
	return baseIndex(weight, height, ponderalIndexPow());
}

/**
 * Calculates the weight given a height and a PI score
 * @param  {float} height Height in metres
 * @param  {float} pi
 * @return {float}        Weight in kilograms
 */
function weightFromPonderalIndex(height, pi) {
	return weightFromBaseIndex(height, pi, ponderalIndexPow());
}

/**
 * Calculates the height given a weight and a PI score
 * @param  {float} weight Weight in kilograms
 * @param  {float} pi
 * @return {float}        Height in metres
 */
function heightFromPonderalIndex(weight, pi) {
	return heightFromBaseIndex(weight, pi, ponderalIndexPow());
}

/**
 * The median value in the normal PI range
 * @return {float}
 */
function ponderalIndexPivot() {
	var weight = weightFromBodyMassIndex(averageHeight(), bodyMassIndexPivot());
	return ponderalIndex(weight, averageHeight());
}

/**
 * Distances from the pivot defining the PI ranges
 * @return {float}
 */
function ponderalIndexDistances() {
	var pd = [];
	var bd = bodyMassIndexDistances();
	var piPivot = ponderalIndexPivot();
	for (var i = 0, len = bd.length; i < len; i++) {
		var index = bodyMassIndexPivot() + bd[i];
		var weight = weightFromBodyMassIndex(averageHeight(), index);
		pd[i] = ponderalIndex(weight, averageHeight()) - piPivot;
	}
	return pd;
}

/**
 * Names of the categories based on distances from normal
 * @return {object}
 */
function categories() {
	return {
		"-2": "Severely underweight",
		"-1": "Underweight",
		"0": "Healthy weight",
		"1": "Overweight",
		"2": "Obese"
	};
}

/**
 * Takes an index, a pivot, and a set of distances, and categorises the index
 * @param  {float} index
 * @param  {float} pivot
 * @param  {[float]} distances
 * @return {integer}
 */
function categoriseIndex(index, pivot, distances) {
	var polarity = index < pivot ? -1 : 1;
	var distance = Math.abs(index - pivot);
	var category = 0;
	for (var i = 0, len = distances.length; i < len; i++) {
		if (distance <= distances[i]) {
			break;
		}
		category = i+1;		
	}
	return category * polarity;
}
