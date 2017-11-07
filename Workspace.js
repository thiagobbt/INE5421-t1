(function() {
"use strict";

var ERROR_INVALID_REGEX = "Invalid regular expression";
var ERROR_INVALID_OPERATION = "Invalid operation";
var ERROR_ALREADY_MINIMIZED = "The selected expression is already minimized";
var NO_TRANSITION = "—";
var INITIAL_STATE = "➞";
var ACCEPTING_STATE = "<span class='accepting_state'>*</span>";
var TRANSITION_SYMBOL = "δ";
var MINIMIZED_PREFIX = "[MIN]";
var INTERSECTION_PREFIX = "[∩]";
var UNION_PREFIX = "[∪]";
var COMPLEMENT_PREFIX = "[NOT]";

var $ = Utilities.$;

var rgContainer = function() {
	return $("#rg_main");
};

var erContainer = function() {
	return $("#er_main");
};

var currentRgContainer = function() {
	return $("#current_rg");
};

var pointers = function() {
	return $(".productionPointer");
};

var productionContainer = function(index) {
	return $("#prod" + index);
};

var simulatorInput = function() {
	return $("#simulator_input");
};

var simulateButton = function() {
	return $("#simulate_btn");
};

var simulationResults = function() {
	return $("#simulationResults");
};

var regexList = function() {
	return $("#regex_list");
};

var deleteButton = function() {
	return $("#delete_btn");
};

var minimizeButton = function() {
	return $("#minimize_btn");
};

var grButton = function() {
	return $("#gr_btn");
};

var intersectionButton = function() {
	return $("#intersect_btn");
};

var unionButton = function() {
	return $("#union_btn");
};

var equivalenceButton = function() {
	return $("#equivalence_btn");
};

var equivalenceLabel = function() {
	return $("#equivalence_result");
};

var node = function(tag) {
	return document.createElement(tag);
};

var genCell = function(content, isLabel) {
	var cell = node(isLabel ? "th" : "td");
	cell.innerHTML = content;
	return cell;
};

var genAutomatonID = function(id) {
	return "aut" + id;
};

var genRegexID = function(id) {
	return "regex" + id;
};

var nextID = 0;

// Returns an object containing a regex, its corresponding
// automaton and an ID.
function buildExprObject(regex) {
	return {
		id: nextID++,
		regex: (regex) ? regex : new Regex(""),
		automaton: (regex) ? regex.toFiniteAutomaton() : null
	};
}

window.Workspace = function() {
	var self = this;
	this.currentRG = null;
	this.expressionList = {};

	// Updates the UI, replacing all previous content with the informations
	// about the current RG.
	function updateGrammarUI() {
		// rgContainer().innerHTML = "";
		updateEvents();
	}

	function updateRegexUI() {
		var checked = getCheckedExpressions();
		var numChecked = checked.length;
		var visible = "inline";
		deleteButton().style.display = (numChecked > 0) ? visible : "none";
		minimizeButton().style.display = (numChecked == 1) ? visible : "none";
		grButton().style.display = (numChecked == 1) ? visible : "none";
		intersectionButton().style.display = (numChecked == 2) ? visible : "none";
		unionButton().style.display = (numChecked == 2) ? visible : "none";
		equivalenceButton().style.display = (numChecked == 2) ? visible : "none";
		equivalenceLabel().innerHTML = "";
	}

	this.updateRegexUI = updateRegexUI;

	// Updates all interface-related events.
	function updateEvents() {
		updatePointerEvents();
		if (simulateButton()) {
			simulateButton().addEventListener("click", function() {
				var rgContainer = simulationResults();
				if (rgContainer) {
					rgContainer.parentElement.removeChild(rgContainer);
				}

				var output = self.currentRG.evaluate(simulatorInput().value);
				printSimulatorOutput(output);
				updatePointerEvents();
			});
		}
	}

	// Updates all production pointer-related events.
	function updatePointerEvents() {
		var pointerList = pointers();
		for (var i = 0; i < pointerList.length; i++) {
			var element = pointerList[i];
			element.addEventListener("mouseover", function() {
				productionContainer(this.innerHTML).classList.add("highlight");
			});
			element.addEventListener("mouseout", function() {
				productionContainer(this.innerHTML).classList.remove("highlight");
			});
		}
	}

	// Shows an error to the user.
	this.error = function(message) {
		alert(message);
	};

	function printGrammar(grammarString) {
		var table = node("table");
		var headerRow = node("tr");
		var header = node("th");

		header.innerHTML = "Grammar";
		header.colSpan = 1;

		table.classList.add("padded");
		table.classList.add("inline");
		table.grammar = grammarString;

		headerRow.appendChild(header);
		table.appendChild(headerRow);

		var row = node("td");
		row.innerHTML = grammarString.replace(/</g, '&lt;').replace(/([^-])>/g, '$1&gt;').replace(/\n/g, "<br>");

		// row.appendChild(cell);
		table.appendChild(row);

		rgContainer().appendChild(table);
	}

	// Sets the current RG of this workspace.
	this.setRG = function(rg) {
		var instance;
		if (typeof(rg) == "string") {
			try {
				instance = new RG(rg);
			} catch (e) {
				self.error(e);
				console.log(e);
				return false;
			}
			self.currentRG = instance;
		} else {
			self.currentRG = rg;
		}

		// currentRgContainer().innerHTML = instance.string.replace(/</g, '&lt;').replace(/([^-])>/g, '$1&gt;').replace(/\n/g, "<br>");
		printGrammar(instance.string);
		updateGrammarUI();
		return true;
	};

	// Returns a list item containing a given expression.
	function regexListItem(obj) {
		var row = node("tr");
		row.id = genRegexID(obj.id);

		var regexCell = node("td");
		regexCell.className = "ertd";
		regexCell.innerHTML = obj.regex.string;
		row.appendChild(regexCell);

		var checkboxCell = node("td");
		checkboxCell.className = "checktd";
		var checkbox = node("input");
		checkbox.type = "checkbox";
		checkbox.addEventListener("change", updateRegexUI);

		checkboxCell.appendChild(checkbox);
		row.appendChild(checkboxCell);
		return row;
	}

	// Initializes event handlers
	this.initEvents = function() {
		updateRegexUI();
		deleteButton().onclick = function() {
			var expressions = getCheckedExpressions();
			if (expressions.length == 0) {
				self.error(ERROR_INVALID_OPERATION);
				return;
			}

			for (var i = 0; i < expressions.length; i++) {
				var expr = expressions[i];
				var automatonNode = $("#" + genAutomatonID(expr.id));
				if (automatonNode) {
					automatonNode.parentElement.removeChild(automatonNode);
				}
				var regexNode = $("#" + genRegexID(expr.id));
				if (regexNode) {
					regexNode.parentElement.removeChild(regexNode);
				}
				delete self.expressionList[expr.id];
			}
			updateRegexUI();
		};

		minimizeButton().onclick = function() {
			var expressions = getCheckedExpressions();
			if (expressions.length != 1) {
				self.error(ERROR_INVALID_OPERATION);
				return;
			}

			var expr = expressions[0];
			if (expr.regex.string.startsWith(MINIMIZED_PREFIX)) {
				self.error(ERROR_ALREADY_MINIMIZED);
				return;
			}

			var clone = buildExprObject(null);
			clone.regex.string = MINIMIZED_PREFIX + " " + expr.regex.string;
			clone.automaton = expr.automaton.minimize();
			self.addObject(clone);
		};

		grButton().onclick = function() {
			var expressions = getCheckedExpressions();
			if (expressions.length != 1) {
				self.error(ERROR_INVALID_OPERATION);
				return;
			}

			var expr = expressions[0];
			// if (expr.regex.string.startsWith(MINIMIZED_PREFIX)) {
			// 	self.error(ERROR_ALREADY_MINIMIZED);
			// 	return;
			// }

			// var clone = buildExprObject(null);
			// clone.regex.string = MINIMIZED_PREFIX + " " + expr.regex.string;
			// clone.automaton = expr.automaton.minimize();
			// self.addObject(clone);
			expr.automaton.toGrammar();
		};

		intersectionButton().onclick = function() {
			var expressions = getCheckedExpressions();
			if (expressions.length != 2) {
				self.error(ERROR_INVALID_OPERATION);
				return;
			}

			var first = expressions[0];
			var second = expressions[1];
			self.addObject(buildIntersectionObj(first, second));
		};

		unionButton().onclick = function() {
			var expressions = getCheckedExpressions();
			if (expressions.length != 2) {
				self.error(ERROR_INVALID_OPERATION);
				return;
			}

			var first = expressions[0];
			var second = expressions[1];
			self.addObject(buildUnionObj(first, second));
		};

		equivalenceButton().onclick = function() {
			var expressions = getCheckedExpressions();
			if (expressions.length != 2) {
				self.error(ERROR_INVALID_OPERATION);
				return;
			}

			var firstExpr = expressions[0];
			var secondExpr = expressions[1];

			var notM1 = buildComplementObj(firstExpr);
			self.addObject(notM1);

			var notM2 = buildComplementObj(secondExpr);
			self.addObject(notM2);

			var intM1notM2 = buildIntersectionObj(firstExpr, notM2);
			self.addObject(intM1notM2);

			var intM2notM1 = buildIntersectionObj(secondExpr, notM1);
			self.addObject(intM2notM1);

			var areEquivalent = intM1notM2.automaton.isEmpty() && intM2notM1.automaton.isEmpty();
			equivalenceLabel().innerHTML = "The selected expressions are " + (areEquivalent ? "" : "not ") + "equivalent.";
		};
	};

	// Returns an object containing:
	// - An ID
	// - A regex instance with a properly formatted name corresponding
	//   to the intersection between the given expression objects
	// - A finite automaton that recognizes the intersection of two
	//	 languages
	function buildIntersectionObj(firstObj, secondObj) {
		var result = buildExprObject(null);
		result.regex.string = INTERSECTION_PREFIX + " {" + firstObj.regex.string + ", " + secondObj.regex.string + "}";
		result.automaton = firstObj.automaton.intersection(secondObj.automaton).minimize();
		return result;
	}

	function buildUnionObj(firstObj, secondObj) {
		var result = buildExprObject(null);
		result.regex.string = UNION_PREFIX + " {" + firstObj.regex.string + ", " + secondObj.regex.string + "}";
		result.automaton = firstObj.automaton.union(secondObj.automaton).minimize();
		return result;
	}

	// Returns an object containing:
	// - An ID
	// - A regex instance with a properly formatted name corresponding
	//   to the complement of a given expression object
	// - A finite automaton that recognizes the complement of a language
	function buildComplementObj(obj) {
		var result = buildExprObject(null);
		result.regex.string = COMPLEMENT_PREFIX + " " + obj.regex.string;
		result.automaton = obj.automaton.complement();
		return result;
	}

	// Produces an HTML version of an automaton.
	function printableAutomaton(obj) {
		var regex = obj.regex;
		var automaton = obj.automaton;
		if (automaton instanceof FiniteAutomaton) {
			var table = node("table");
			table.classList.add("automaton");
			table.id = genAutomatonID(obj.id);

			var alphabet = automaton.getAlphabet();
			var header = node("tr");
			var cell = node("th");
			cell.colSpan = alphabet.length + 1;
			cell.innerHTML = regex.string;
			header.appendChild(cell);
			table.appendChild(header);

			header = node("tr");
			cell = node("th");
			// cell.classList.add("emptyCell");
			cell.innerHTML = TRANSITION_SYMBOL;
			header.appendChild(cell);

			for (var i = 0; i < alphabet.length; i++) {
				cell = node("th");
				cell.innerHTML = alphabet[i];
				header.appendChild(cell);
			}
			table.appendChild(header);

			var row;
			var transitions = automaton.transitions;
			for (var i = 0; i < automaton.stateList.length; i++) {
				var state = automaton.stateList[i];
				row = node("tr");
				cell = node("th");
				var printableState = state;
				if (automaton.acceptingStates.includes(state)) {
					printableState = ACCEPTING_STATE + printableState;
				}
				if (automaton.initialState == state) {
					printableState = INITIAL_STATE + printableState;
				}
				cell.innerHTML = printableState;
				row.appendChild(cell);
				for (var j = 0; j < alphabet.length; j++) {
					var content = NO_TRANSITION;
					if (transitions.hasOwnProperty(state)
						&& transitions[state].hasOwnProperty(alphabet[j])) {
						content = transitions[state][alphabet[j]];
					}
					cell = node("td");
					cell.innerHTML = content;
					row.appendChild(cell);
				}
				table.appendChild(row);
			}

			return table;
		}
		return null;
	}

	// Returns a list containing all checked expressions.
	function getCheckedExpressions() {
		var checkboxes = regexList().querySelectorAll("input[type='checkbox']");
		var expressions = [];
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked) {
				var id = checkboxes[i].parentElement.parentElement.id;
				id = id.replace("regex", "");
				expressions.push(self.expressionList[id]);
			}
		}
		return expressions;
	}

	// Adds a new regex to this workspace.
	this.addRegex = function(regex) {
		var instance = new Regex(regex);
		if (!instance.isValid()) {
			self.error(ERROR_INVALID_REGEX);
			return false;
		}
		var obj;
		try {
			obj = buildExprObject(instance);
		} catch (e) {
			console.log(e);
			alert("[BUG] isValid() returned true for: " + regex);
			return false;
		}
		self.addObject(obj);
		return true;
	};

	// Adds an already-constructed object to this workspace.
	this.addObject = function(obj) {
		self.expressionList[obj.id] = obj;
		self.update(obj);
	};

	// Updates the view.
	this.update = function(obj) {
		if (obj == null) {
			for (var i in self.expressionList) {
				if (self.expressionList.hasOwnProperty(i)) {
					self.update(self.expressionList[i]);
				}
			}
			return;
		}

		var automatonNode = $("#" + genAutomatonID(obj.id));
		if (!automatonNode) {
			erContainer().appendChild(printableAutomaton(obj));
		}

		var regexNode = $("#" + genRegexID(obj.id));
		if (!regexNode) {
			regexList().appendChild(regexListItem(obj));
		}
	};
};

})();
