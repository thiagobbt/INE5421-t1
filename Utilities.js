(function(){
"use strict";

var LEFT = 1;
var RIGHT = 2;
var NEXT = 3;

var _operatorInfo = {
	"?": [1, 3, [LEFT, NEXT], [NEXT]],
	"*": [1, 3, [LEFT, NEXT], [LEFT, NEXT]],
	"+": [1, 3, [LEFT], [LEFT, NEXT]],
	"|": [2, 1, [LEFT, RIGHT], [NEXT]],
	".": [2, 2, [LEFT], [RIGHT]]
}

window.Utilities = {
	// A list of valid non-terminal terms (it's filled in the loop below)
	nonTerminals: [],

	// Special symbols
	EPSILON: "&",
	TRANSITION_SYMBOL: "➞",
	NO_TRANSITION: "—",

	// De Simone traversal commands
	VISIT_LEFT: LEFT,
	VISIT_RIGHT: RIGHT,
	VISIT_NEXT: NEXT,

	// Error messages
	ERROR_INVALID_GRAMMAR: "Invalid grammar",
	INVALID_REGEX: "Error: Invalid regular expression",

	operatorInfo: _operatorInfo,

	operators: Object.keys(_operatorInfo),

	// Returns the number of operands of an operator.
	numOperands: function(operator) {
		return Utilities.operatorInfo[operator][0];
	},

	// Returns the priority of an operator.
	priority: function(operator) {
		return Utilities.operatorInfo[operator][1];
	},

	// Checks if a given symbol is a non-terminal
	isNonTerminal: function(symbol) {
		// return Utilities.nonTerminals.includes(symbol[0]) && !isNaN(symbol.slice(1));
		return Utilities.nonTerminals.includes(symbol[0]);
	},

	// Checks if a given symbol is a non-empty terminal
	isTerminal: function(symbol) {
		return !Utilities.isNonTerminal(symbol) && symbol != Utilities.EPSILON;
	},

	// Checks if a given symbol is a terminal
	isTerminalOrEmpty: function(symbol) {
		return !Utilities.isNonTerminal(symbol) || symbol == Utilities.EPSILON;
	},

	removeDuplicates: function(a) {
		var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];


		return a.filter(function(item) {
		var type = typeof item;
		if(type in prims)
			return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
		else
			return objs.indexOf(item) >= 0 ? false : objs.push(item);
		});
	},

	// Removes all duplicated elements of an indexable array.
	removeIndexableDuplicates: function(array) {
		array.sort();
		array.reverse();
		var map = {};
		while (array.length > 0) {
			map[array.pop()] = 1;
		}

		for (var key in map) {
			if (map.hasOwnProperty(key)) {
				array.push(key);
			}
		}
	},

	// Returns the cartesian product of two arrays
	cartesianProduct: function(arr1, arr2) {
		var result = [];
		for (var i = 0; i < arr1.length; i++) {
			for (var j = 0; j < arr2.length; j++) {
				result.push([arr1[i], arr2[j]]);
			}
		}
		return result;
	},

	// Returns the union of two arrays.
	union: function(arr1, arr2) {
		var result = arr1.concat(arr2);
		Utilities.removeDuplicates(result);
		return result;
	},

	// Returns the intersection of two arrays.
	intersection: function(arr1, arr2) {
		var result = [];
		for (var i = 0; i < arr1.length; i++) {
			if (arr2.includes(arr1[i])) {
				result.push(arr1[i]);
			}
		}
		return result;
	},

	// Returns the difference arr1 - arr2
	subtract: function(arr1, arr2) {
		var result = [];
		for (var i = 0; i < arr1.length; i++) {
			if (!arr2.includes(arr1[i])) {
				result.push(arr1[i]);
			}
		}
		return result;
	},

	// Returns the position of the container where element is;
	// Returns -1 if not found. Also works if element is an array.
	indexOf: function(container, element) {
		if (!(element instanceof Array)) {
			return container.indexOf(element);
		}
		for (var i = 0; i < container.length; i++) {
			if (container[i] instanceof Array && container[i].length == element.length) {
				var equal = true;
				for (var j = 0; j < container[i].length; j++) {
					if (container[i][j] != element[j]) {
						equal = false;
						break;
					}
				}
				if (equal) {
					return i;
				}
			}
		}
		return -1;
	},

	// Generates a name for the (n+1)-th state of an automaton.
	generateStateName: function(n) {
		var name = String.fromCharCode(65 + (n % 26));
		var numApostrophes = Math.floor(n / 26);
		for (var i = 0; i < numApostrophes; i++) {
			name += "'";
		}
		return name;
	},

	generateOtherStateName: function(n) {
		var name = String.fromCharCode(65 + (n % 26));
		var numApostrophes = Math.floor(n / 26);
		for (var i = 0; i < numApostrophes; i++) {
			name += "'";
		}
		return name + "_";
	},

	// Checks if two arrays are equal.
	isSameArray: function(arr1, arr2) {
		if (arr1.length != arr2.length) return false;
		for (var i = 0; i < arr1.length; i++) {
			if (arr1[i] != arr2[i]) {
				return false;
			}
		}
		return true;
	},

	// Retrieves one or more nodes of the DOM according to a CSS selector.
	$: function(selector) {
		if (selector[0] == '#') {
			return document.querySelector(selector);
		}
		return document.querySelectorAll(selector);
	}
};

// Adds all lowercase letters to the terminal list
for (var code = 65; code < 65 + 26; code++) {
	Utilities.nonTerminals.push(String.fromCharCode(code).toUpperCase());
}

})();
