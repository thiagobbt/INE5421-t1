(function() {
"use strict";

var DOLLAR = Utilities.DOLLAR;
var EPSILON = Utilities.EPSILON;

window.RegularGrammar = function(rgStr) {
	var self = this;
	this.productions = {};
	this.initialSymbol = null;
	this.firstData = null;

	/*
	Receives a string representation of a group of productions
	involving one non-terminal and returns an object representing
	them or null if they're not valid.
	Example:
		Input: "S -> a S b | id | &"
		Output: {
			S: [["a", "S", "b"], ["id"], ["&"]]
		}
	*/
	function stringToProduction(str) {
		var map = {};
		var explodedStr = str.split(' ');

		// Check if string has at least one arrow
		if (!explodedStr.includes("->")) return null;

		// Check if string can only be divided in two parts by the arrow
		var dividedStr = explodedStr.splitFirst('->');
		if (dividedStr.length != 2) return null;

		// // Check if left part of production is only one symbol
		// if (dividedStr[0].length != 1) return null
		var initialSymbol = dividedStr[0][0];

		// Check if left of production is non terminal
		if (!Utilities.isNonTerminal(initialSymbol)) return null;

		// Separate all productions
		var productions = dividedStr[1].split('|');

		for (var i = 0; i < productions.length; i++) {
			if (productions[i].length < 1 || productions[i] == "") {
				return null;
			} else {
				// There's at least one production
				if (productions[i].length > 2) {
					return null;
				}

				if (!Utilities.isTerminalOrEmpty(productions[i][0])
					&& !Utilities.isNonTerminal(productions[i][0])) {
					return null;
				}

				if (productions[i].length > 1 && !Utilities.isNonTerminal(productions[i][1])) {
					return null;
				}
			}
		}

		map[initialSymbol] = productions;
		return map;
	};

	function productionToString(production) {
		for (var key in production) {
			var str = key + " -> ";
			for (var i = 0; i < production[key].length; i++) {
				str += production[key][i].join(" ");
				if (i < production[key].length - 1) {
					str += " | ";
				}
			}

			return str;
		}
	};

	// An utility function used to iterate over all productions of this RegularGrammar,
	// executing a callback function on each one providing their name and list
	// of produced symbols.
	function productionIteration(callback) {
		for (var name in self.productions) {
			if (self.productions.hasOwnProperty(name)) {
				for (var i = 0; i < self.productions[name].length; i++) {
					callback(name, self.productions[name][i]);
				}
			}
		}
	};

	// Checks if this grammar is consistent, i.e, if all used non-terminals are
	// defined.
	this.checkConsistency = function() {
		var nonTerminals = self.getNonTerminals();
		var undefinedNonTerminals = [];
		productionIteration(function(name, production) {
			for (var i = 0; i < production.length; i++) {
				var symbol = production[i];
				if (Utilities.isNonTerminal(symbol) && !nonTerminals.includes(symbol)) {
					undefinedNonTerminals.push(symbol);
				}
			}
		});

		if (self.initialSymbol == null) {
			throw Utilities.ERROR_INVALID_GRAMMAR +
				  ". The initial symbol is undefined";
		}

		if (undefinedNonTerminals.length > 0) {
			throw Utilities.ERROR_INVALID_GRAMMAR +
				  ". The following symbols are undefined: " + undefinedNonTerminals.join(", ");
		}
	}

	// Receives a string representation of a group of productions
	// involving one non-terminal and adds all of them to this RegularGrammar.
	this.addProductions = function(str) {
		var productions = stringToProduction(str);
		if (!productions) {
			return false;
		}
		for (var name in productions) {
			if (productions.hasOwnProperty(name)) {
				for (var i = 0; i < productions[name].length; i++) {
					self.addProduction(name, productions[name][i]);
				}
			}
		}
		return true;
	};

	// Receives the informations about a production and adds it
	// to this RegularGrammar.
	this.addProduction = function(name, symbolSequence) {
		if (!self.productions.hasOwnProperty(name)) {
			self.productions[name] = [];
		}
		self.productions[name].push(symbolSequence);
		if (!self.initialSymbol) {
			self.initialSymbol = name;
		}
	};

	// Receives the informations about a production and removes it
	// from this RegularGrammar.
	this.removeProduction = function(name, symbolSequence) {
		if (!self.productions.hasOwnProperty(name)) {
			return;
		}
		var index = Utilities.indexOf(self.productions[name], symbolSequence);
		if (index >= 0) {
			self.productions[name].splice(index, 1);
		}
	};

	// Returns a list containing all non-terminals of this RegularGrammar.
	this.getNonTerminals = function() {
		return Object.keys(self.productions);
	};

	// Returns a list containing all terminals of this RegularGrammar.
	this.getTerminals = function() {
		var result = [];
		productionIteration(function(name, production) {
			for (var i = 0; i < production.length; i++) {
				var symbol = production[i];
				if (Utilities.isTerminal(symbol)) {
					result.push(symbol);
				}
			}
		});
		Utilities.removeDuplicates(result);
		return result;
	};

	// Returns a map associating each non-terminal of this grammar with a list
	// of all non-terminals that it reaches as the first symbol of its productions.
	function getLeftRangeTable() {
		var rangeTable = {};
		productionIteration(function(name, production) {
			if (!rangeTable.hasOwnProperty(name)) {
				rangeTable[name] = [];
			}

			if (Utilities.isNonTerminal(production[0])) {
				rangeTable[name].push(production[0]);
			}
		});

		var stable = false;
		while (!stable) {
			stable = true;
			for (var name in rangeTable) {
				if (!rangeTable.hasOwnProperty(name)) continue;
				var length = rangeTable[name].length;
				for (var i = 0; i < length; i++) {
					var nonTerminal = rangeTable[name][i];
					rangeTable[name] = rangeTable[name].concat(rangeTable[nonTerminal]);
				}
				Utilities.removeDuplicates(rangeTable[name]);
				if (rangeTable[name].length != length) {
					stable = false;
				}
			}
		}
		return rangeTable;
	}

	/*
	Returns an object containing:
	- hasLeftRecursion: true if this grammar has a left recursion, false otherwise;
	- recursiveNonTerminals: a map associating each recursive non-terminal of
	  this grammar with the type of recursion it has (true for direct, false
	  for indirect)
	*/
	// this.getRecursionInformation = function() {
	// 	var DIRECT = true;
	// 	var INDIRECT = false;
	// 	var result = {
	// 		hasLeftRecursion: false,
	// 		recursiveNonTerminals: {}
	// 	};
	// 	productionIteration(function(name, production) {
	// 		if (production[0] == name) {
	// 			result.hasLeftRecursion = true;
	// 			result.recursiveNonTerminals[name] = DIRECT;
	// 		}
	// 	});

	// 	var rangeTable = getLeftRangeTable();
	// 	for (var name in rangeTable) {
	// 		if (rangeTable.hasOwnProperty(name)
	// 			&& rangeTable[name].includes(name)
	// 			&& !result.recursiveNonTerminals.hasOwnProperty(name)) {
	// 			result.hasLeftRecursion = true;
	// 			result.recursiveNonTerminals[name] = INDIRECT;
	// 		}
	// 	}
	// 	return result;
	// };

	/*
	Returns an object containing:
	- isFactored: true if this grammar is factored, false otherwise;
	- nonFactoredNonTerminals: a map associating each non-factored non-terminal
	  of this grammar with the type of non-factorization it has (true for direct,
	  false for indirect)
	*/
	// this.getFactorizationInformation = function() {
	// 	var DIRECT = true;
	// 	var INDIRECT = false;
	// 	var result = {
	// 		isFactored: true,
	// 		nonFactoredNonTerminals: {}
	// 	};
	// 	var firstTable = {};
	// 	var directFirstTable = {};
	// 	self.firstData = self.first();
	// 	productionIteration(function(name, production) {
	// 		if (!firstTable.hasOwnProperty(name)) {
	// 			firstTable[name] = {};
	// 		}

	// 		if (!directFirstTable.hasOwnProperty(name)) {
	// 			directFirstTable[name] = {};
	// 		}

	// 		if (directFirstTable[name].hasOwnProperty(production[0])) {
	// 			result.isFactored = false;
	// 			result.nonFactoredNonTerminals[name] = DIRECT;
	// 		} else {
	// 			directFirstTable[name][production[0]] = 1;
	// 		}

	// 		var first = compositeFirst(production);
	// 		for (var i = 0; i < first.length; i++) {
	// 			if (!result.nonFactoredNonTerminals.hasOwnProperty(name)
	// 				&& firstTable[name].hasOwnProperty(first[i])) {
	// 				result.isFactored = false;
	// 				result.nonFactoredNonTerminals[name] = INDIRECT;
	// 				break;
	// 			}
	// 			firstTable[name][first[i]] = 1;
	// 		}
	// 	});
	// 	return result;
	// };

	// Pushes all non-epsilon symbols of a list to another list and returns
	// true if an epsilon has been found, false otherwise.
	function pushNonEpsilons(origin, destination) {
		var hasEpsilon = false;
		var length = origin.length;
		for (var i = 0; i < length; i++) {
			if (origin[i] == EPSILON) {
				hasEpsilon = true;
			} else {
				destination.push(origin[i]);
			}
		}
		return hasEpsilon;
	}

	// Populates a map with the first set of a given non-terminal and all
	// other non-terminals it depends on.
	// function populateFirst(container, nonTerminal, visited, uncertain) {
	// 	if (!visited.includes(nonTerminal)) {
	// 		if (!container.hasOwnProperty(nonTerminal)) {
	// 			container[nonTerminal] = [];
	// 		}
	// 		visited.push(nonTerminal);
	// 	} else {
	// 		return;
	// 	}

	// 	var productions = self.productions[nonTerminal];
	// 	for (var i = 0; i < productions.length; i++) {
	// 		var production = productions[i];
	// 		if (Utilities.isTerminal(production[0]) || production[0] == EPSILON) {
	// 			container[nonTerminal].push(production[0]);
	// 			if (production[0] == EPSILON) {
	// 				uncertain.push(nonTerminal);
	// 			}
	// 			continue;
	// 		}

	// 		var j = 0;
	// 		while (j < production.length) {
	// 			if (Utilities.isTerminal(production[j])) {
	// 				container[nonTerminal].push(production[j]);
	// 				break;
	// 			}

	// 			populateFirst(container, production[j], visited, uncertain);
	// 			var first = container[production[j]];
	// 			var hasEpsilon = pushNonEpsilons(first, container[nonTerminal]);
	// 			if (!hasEpsilon) {
	// 				break;
	// 			}
	// 			j++;
	// 		}

	// 		if (j == production.length) {
	// 			container[nonTerminal].push(EPSILON);
	// 			uncertain.push(nonTerminal);
	// 		}
	// 	}
	// }

	// Returns the first set of a sequence of symbols, given that the first
	// set of all non-terminals are available in self.firstData.
	// function compositeFirst(symbolSequence) {
	// 	var result = [];
	// 	if (symbolSequence.length == 0
	// 		|| (symbolSequence.length == 1 && symbolSequence[0] == EPSILON)) {
	// 		result.push(EPSILON);
	// 		return result;
	// 	}

	// 	var shouldPushEpsilon = true;
	// 	for (var i = 0; i < symbolSequence.length; i++) {
	// 		var symbol = symbolSequence[i];
	// 		if (Utilities.isTerminal(symbol)) {
	// 			result.push(symbol);
	// 			shouldPushEpsilon = false;
	// 			break;
	// 		}

	// 		var first = self.firstData[symbol];
	// 		var hasEpsilon = pushNonEpsilons(first, result);
	// 		if (!hasEpsilon) {
	// 			shouldPushEpsilon = false;
	// 			break;
	// 		}
	// 	}

	// 	Utilities.removeDuplicates(result);
	// 	if (shouldPushEpsilon) {
	// 		result.push(EPSILON);
	// 	}
	// 	return result;
	// }

	// Populates a map with the preliminary follow set of non-terminals
	// used in a given production.
	// function populateFollow(container, nonTerminal, production) {
	// 	for (var i = 0; i < production.length; i++) {
	// 		var symbol = production[i];
	// 		if (Utilities.isNonTerminal(symbol)) {
	// 			var remaining = production.slice(i + 1);
	// 			var first = compositeFirst(remaining);
	// 			var hasEpsilon = pushNonEpsilons(first, container[symbol]);
	// 			if (hasEpsilon) {
	// 				container[symbol] = container[symbol].concat(container[nonTerminal]);
	// 			}
	// 		}
	// 	}
	// }

	// Returns a map associating each non-terminal of this grammar
	// with its corresponding first array.
	// this.first = function() {
	// 	if (self.firstData != null) {
	// 		return self.firstData;
	// 	}
	// 	var result = {};
	// 	var nonTerminals = self.getNonTerminals();
	// 	var uncertain = [];
	// 	var visited = [];
	// 	for (var i = 0; i < nonTerminals.length; i++) {
	// 		visited = [];
	// 		populateFirst(result, nonTerminals[i], visited, uncertain);
	// 	}

	// 	Utilities.removeDuplicates(uncertain);

	// 	visited = [];
	// 	while (uncertain.length > 0) {
	// 		// Prevents a bug where &-transitions could make the
	// 		// first set become incomplete
	// 		populateFirst(result, uncertain.pop(), visited, uncertain);
	// 	}

	// 	for (var i = 0; i < nonTerminals.length; i++) {
	// 		Utilities.removeIndexableDuplicates(result[nonTerminals[i]]);
	// 	}

	// 	self.firstData = result;
	// 	return result;
	// };

	// Returns a map associating each non-terminal of this grammar
	// with its corresponding follow array.
	// this.follow = function() {
	// 	var result = {};
	// 	var nonTerminals = self.getNonTerminals();
	// 	for (var i = 0; i < nonTerminals.length; i++) {
	// 		result[nonTerminals[i]] = [];
	// 		if (self.initialSymbol == nonTerminals[i]) {
	// 			result[nonTerminals[i]].push(DOLLAR);
	// 		}
	// 	}

	// 	self.firstData = self.first();
	// 	var prevFollow = "", currFollow = "{}";
	// 	while (prevFollow != currFollow) {
	// 		prevFollow = currFollow;
	// 		productionIteration(function(name, production) {
	// 			populateFollow(result, name, production);
	// 		});

	// 		// for (var i = 0; i < nonTerminals.length; i++) {
	// 		// 	Utilities.removeDuplicates(result[nonTerminals[i]]);
	// 		// }

	// 		for (var i = 0; i < nonTerminals.length; i++) {
	// 			// console.log(result[nonTerminals[i]]);
	// 			result[nonTerminals[i]] = Utilities.removeDuplicates(result[nonTerminals[i]]);
	// 		}

	// 		currFollow = JSON.stringify(result);
	// 	}
	// 	return result;
	// };

	// Returns the parsing table of this grammar.
	// this.parsingTable = function() {
	// 	var table = {};
	// 	var nonTerminals = self.getNonTerminals();
	// 	var terminals = self.getTerminals().concat([DOLLAR]);
	// 	for (var i = 0; i < nonTerminals.length; i++) {
	// 		table[nonTerminals[i]] = {};
	// 		for (var j = 0; j < terminals.length; j++) {
	// 			table[nonTerminals[i]][terminals[j]] = null;
	// 		}
	// 	}

	// 	self.firstData = self.first();
	// 	var follow = self.follow();
	// 	var productionList = self.productionList();
	// 	productionIteration(function(name, production) {
	// 		var first = compositeFirst(production);
	// 		for (var i = 0; i < first.length; i++) {
	// 			if (first[i] == EPSILON) {
	// 				first = first.concat(follow[name]);
	// 			} else {
	// 				if (table[name][first[i]]) {
	// 					throw Utilities.ERROR_NOT_LL1;
	// 				}
	// 				var pair = [name, production];
	// 				table[name][first[i]] = Utilities.indexOf(productionList, pair);
	// 			}
	// 		}
	// 	});
	// 	return table;
	// };

	// Returns a list of pairs corresponding to the productions of this grammar.
	this.productionList = function() {
		var result = [];
		productionIteration(function(name, production) {
			result.push([name, production]);
		});
		return result;
	};

	// Unwinds the stack until there's a terminal symbol on the top.
	// function unwind(stack, input, parsingTable, productionList, history) {
	// 	if (stack.length == 0) {
	// 		return;
	// 	}
	// 	var top = stack[stack.length - 1];
	// 	while (Utilities.isNonTerminal(top)) {
	// 		stack.pop();
	// 		var productionIndex = parsingTable[top][input];
	// 		if (productionIndex == null) {
	// 			if (input == DOLLAR) {
	// 				throw "Unexpected end of sentence";
	// 			} else {
	// 				throw "Unexpected symbol '" + input + "'";
	// 			}
	// 		}
	// 		var pair = productionList[productionIndex];
	// 		var production = pair[1];
	// 		history.push(productionIndex);
	// 		for (var i = production.length - 1; i >= 0; i--) {
	// 			if (production[i] != EPSILON) {
	// 				stack.push(production[i]);
	// 			}
	// 		}
	// 		top = stack[stack.length - 1];
	// 	}
	// }

	// Evaluates a given sentence using this grammar, returning informations
	// about its evaluation like derivation sequence, error message, etc.
	// this.evaluate = function(input) {
	// 	var history = [];
	// 	var parsingTable = self.parsingTable();
	// 	var productionList = self.productionList();
	// 	var stack = [DOLLAR, self.initialSymbol];

	// 	input = input.replace(/\s+/g, ' ').trim() + ' ' + DOLLAR;
	// 	var symbols = input.split(' ');
	// 	for (var i = 0; i < symbols.length; i++) {
	// 		var symbol = symbols[i];
	// 		try {
	// 			unwind(stack, symbol, parsingTable, productionList, history);
	// 		} catch (e) {
	// 			return [false, history, i, e];
	// 		}
	// 		var top = stack[stack.length - 1];
	// 		if (symbol != top || stack.length == 0) {
	// 			var message;
	// 			if (stack.length == 1) {
	// 				message = "Expected end of sentence, found '" + symbol + "'";
	// 			} else if (stack.length > 1) {
	// 				message = "Expected '" + top + "', found '" + symbol + "'";
	// 			} else {
	// 				message = "Unexpected '" + symbol + "'";
	// 			}
	// 			return [false, history, i, message];
	// 		}
	// 		stack.pop();
	// 	}
	// 	return [stack.length == 0, history];
	// };

	this.toFiniteAutomaton = function() {
		var automaton = new FiniteAutomaton();

		Object.keys(this.productions).forEach((state) => {
			automaton.addState(state);
		});

		automaton.initialState = this.initialSymbol;

		for (var currentSymbol in this.productions) {
			for (var i = 0; i < this.productions[currentSymbol].length; i++) {
				var production = this.productions[currentSymbol][i];
				var input = production[0];
				var nextSymbol = production[1];

				if (input == '&') {
					automaton.acceptState(currentSymbol);
				} else if (!nextSymbol) {
					var newState = currentSymbol + "'";
					automaton.addState(newState);
					automaton.addTransition(currentSymbol, input, newState);
					automaton.acceptState(newState);
				} else {
					automaton.addTransition(currentSymbol, input, nextSymbol);
				}
			}
		}
		return automaton;
	};

	if (rgStr) {
		var lines = rgStr.split("\n");
		for (var i = 0; i < lines.length; i++) {
			lines[i] = lines[i].trim();
			if (lines[i] == "") {
				lines.splice(i, 1);
				i--;
				continue;
			}

			if (!self.addProductions(lines[i])) {
				console.log(lines[i]);
				throw Utilities.ERROR_INVALID_GRAMMAR;
			}
		}
		// console.log(lines);

		if (lines.length == 0) {
			throw Utilities.ERROR_INVALID_GRAMMAR;
		}

		this.checkConsistency();
		this.string = lines.join("\n");
	}
};

})();
