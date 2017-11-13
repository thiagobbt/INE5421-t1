(function() {
"use strict";

var regularGrammarValidTestCases = [
	"S -> a S | &",
	"S -> b A | &\nA -> c",
	"S -> a A | b B | C\nA -> a A | &\nB -> b B | d A\nC -> c C | &",
	"S123 -> b",
	"S736473843463743764734 -> &",
	"S -> i_am_a_grammar",
	"C -> if_expr_then C | cmd",
	"S -> a->b"
];

var regularGrammarInvalidTestCases = [
	"S a S b &",
	"S >- a S b | &",
	"S-> a S b | &",
	"x -> a S b | &",
	"SA -> a S b | &",
	"S' -> a S b | &",
	"Sx -> a S b | &",
	"S -> a | | b",
	"S -> SA",
	"S -> S'",
	"S -> Sx",
	"CH4 + 2O2 -> CO2 + 2H2O",
	"I am not a grammar",
	"JS is cool",
	"Writing invalid test cases is fun",
	"-> a S c",
	"S ->",
	"S -> ",
	"S - -> a"
];

window.GrammarTest = {
	exec: function() {
		var instance;
		var success = 0;

		console.log("Valid Test Cases");
		for (var i = 0; i < regularGrammarValidTestCases.length; i++) {
			var expr = regularGrammarValidTestCases[i];
			try {
				instance = new RegularGrammar(expr);
				console.log("#" + i + " - OK");
				success++;
			} catch (e) {
				console.log("#" + i + " - NOT OK");
			}
		}

		console.log("");
		console.log("Invalid Test Cases");
		for (var i = 0; i < regularGrammarInvalidTestCases.length; i++) {
			var expr = regularGrammarInvalidTestCases[i];
			try {
				instance = new RegularGrammar(expr);
				console.log("#" + i + " - NOT OK");
			} catch (e) {
				console.log("#" + i + " - OK");
				success++;
			}
		}

		var totalCases = regularGrammarValidTestCases.length + regularGrammarInvalidTestCases.length;
		console.log("#####################");
		console.log(success + " OK");
		console.log((totalCases - success) + " NOT OK");
	}
};

})();
