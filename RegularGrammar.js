(function() {
"use strict";

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
		if (dividedStr[0].length != 1) return null
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

	// Returns a list of pairs corresponding to the productions of this grammar.
	this.productionList = function() {
		var result = [];
		productionIteration(function(name, production) {
			result.push([name, production]);
		});
		return result;
	};

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
				throw Utilities.ERROR_INVALID_GRAMMAR;
			}
		}

		if (lines.length == 0) {
			throw Utilities.ERROR_INVALID_GRAMMAR;
		}

		this.checkConsistency();
		this.string = lines.join("\n");
	}
};

})();
