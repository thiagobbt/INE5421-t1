(function() {
"use strict";

var ERROR_INVALID_OPERATION = "Invalid operation";
var INITIAL_STATE = Utilities.TRANSITION_SYMBOL;
var ACCEPTING_STATE = "<span class='accepting_state'>*</span>";
var TRANSITION_SYMBOL = "δ";
var MINIMIZED_PREFIX = "[MIN]";
var DETERMINIZED_PREFIX = "[DET]";
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

var automatonCloseButton = function() {
	return $(".close-button");
};

var automatonGrammarButton = function() {
	return $(".to-grammar-button");
}

var automatonDeterminizeButton = function() {
	return $(".determinize-button");
}

var automatonMinimizeButton = function() {
	return $(".minimize-button");
}

var automatonComplementButton = function() {
	return $(".complement-button");
}

var grammarAutomatonButton = function() {
	return $(".to-automaton-button");
}

var grammarCloseButton = function() {
	return $(".close-grammar-button");
}

var analyzeLanguageButton = function() {
	return $(".analyze-language-button");
}

var regexList = function() {
	return $("#regex_list");
};

var deleteButton = function() {
	return $("#delete_btn");
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

var genAutomatonID = function(id) {
	return "aut" + id;
};

var genRegexID = function(id) {
	return "regex" + id;
};

var nextID = 0;

window.Workspace = function() {
	var self = this;
	this.currentRegularGrammar = null;
	this.expressionList = {};

	// Returns an object containing a regex, its corresponding
	// automaton and an ID.
	function buildExprObject(regex) {
		var id = nextID++;
		var automaton = null;

		if (!regex) {
			regex = new Regex("");
			regex.string = "Grammar [" + id + "]";
		} else {
			automaton = regex.toFiniteAutomaton();
		}

		return {
			id: id,
			regex: regex,
			automaton: automaton
		};
	}
	this.buildExprObject = buildExprObject;

	// Updates the UI, replacing all previous content with the informations
	// about the current RegularGrammar.
	function updateGrammarUI() {
		if (grammarAutomatonButton()) {
			grammarAutomatonButton().forEach((btn) => {
				btn.onclick = function() {
					var newAutomaton = this.parentElement.parentElement.parentElement.grammar.toFiniteAutomaton();
					var obj = buildExprObject(null);
					obj.automaton = newAutomaton;
					self.addObject(obj);
				}
			});
		}

		if (grammarCloseButton()) {
			grammarCloseButton().forEach((btn) => {
				btn.onclick = function() {
					var grammar = this.parentElement.parentElement.parentElement;
					grammar.parentElement.removeChild(grammar);
				}
			});
		}
	}

	function updateRegexUI() {
		var checked = getCheckedExpressions();
		var numChecked = checked.length;
		var visible = "inline";
		deleteButton().style.display = (numChecked > 0) ? visible : "none";
		intersectionButton().style.display = (numChecked == 2) ? visible : "none";
		unionButton().style.display = (numChecked == 2) ? visible : "none";
		equivalenceButton().style.display = (numChecked == 2) ? visible : "none";
		equivalenceLabel().innerHTML = "";

		if (automatonCloseButton()) {
			automatonCloseButton().forEach((btn) => {
				btn.onclick = function() {
					var id = this.parentElement.parentElement.parentElement.id.replace("aut", "");

					var automatonNode = $("#" + genAutomatonID(id));
					if (automatonNode) {
						automatonNode.parentElement.removeChild(automatonNode);
					}

					var regexNode = $("#" + genRegexID(id));
					if (regexNode) {
						regexNode.parentElement.removeChild(regexNode);
					}

					delete self.expressionList[id];

					updateRegexUI();
				}
			});
		}

		if (automatonGrammarButton()) {
			automatonGrammarButton().forEach((btn) => {
				btn.onclick = function() {
					var id = this.parentElement.parentElement.parentElement.id.replace("aut", "");
					self.expressionList[id].automaton.toGrammar();
				}
			});
		}

		if (automatonDeterminizeButton()) {
			automatonDeterminizeButton().forEach((btn) => {
				btn.onclick = function() {
					var automatonTable = this.parentElement.parentElement.parentElement;
					var id = automatonTable.id.replace("aut", "");


					var expr = self.expressionList[id];
					var clone = buildExprObject(null);
					clone.regex.string = DETERMINIZED_PREFIX + " " + expr.regex.string;
					clone.automaton = expr.automaton.determinize();
					self.addObject(clone);
				}
			});
		}

		if (automatonMinimizeButton()) {
			automatonMinimizeButton().forEach((btn) => {
				btn.onclick = function() {
					var automatonTable = this.parentElement.parentElement.parentElement;
					var id = automatonTable.id.replace("aut", "");

					var expr = self.expressionList[id];
					var clone = buildExprObject(null);
					clone.regex.string = MINIMIZED_PREFIX + " " + expr.regex.string;
					clone.automaton = expr.automaton.minimize();
					self.addObject(clone);
				}
			});
		}

		if (automatonComplementButton()) {
			automatonComplementButton().forEach((btn) => {
				btn.onclick = function() {
					var automatonTable = this.parentElement.parentElement.parentElement;
					var id = automatonTable.id.replace("aut", "");

					var complement = buildComplementObj(self.expressionList[id]);
					self.addObject(complement);
				}
			});
		}

		if (analyzeLanguageButton()) {
			analyzeLanguageButton().forEach((btn) => {
				btn.onclick = function() {
					var response = "Language is ";
					var automatonTable = this.parentElement.parentElement.parentElement;
					var id = automatonTable.id.replace("aut", "");

					var expr = self.expressionList[id];

					var minimized = expr.automaton.minimize();
					var minimizedObj = buildExprObject(null);
					minimizedObj.regex.string = MINIMIZED_PREFIX + " " + expr.regex.string;
					minimizedObj.automaton = minimized;
					self.addObject(minimizedObj);

					if (minimized.stateList.length > 0) {
						response += "not empty, ";

						if (minimized.isCyclic()) {
							response += "is infinite.";
						} else {
							response += "is finite."
						}
					} else {
						response += "empty.";
					}

					equivalenceLabel().innerHTML = response;
				}
			});
		}
	}
	this.updateRegexUI = updateRegexUI;

	// Shows an error to the user.
	this.error = function(message) {
		alert(message);
	};

	function printGrammar(grammar) {
		var table = node("table");
		var headerRow = node("tr");
		var subHeaderRow = node("tr");
		var header = node("th");
		var subHeader = node("th");

		header.innerHTML = "Grammar &nbsp;";
		header.colSpan = 1;

		var closeGrammar = node("button");
		closeGrammar.innerText = "✕";
		closeGrammar.classList.add("close-grammar-button");
		subHeader.appendChild(closeGrammar);

		var toAutomatonButton = node("button");
		toAutomatonButton.innerText = "Automaton";
		toAutomatonButton.classList.add("to-automaton-button");
		subHeader.appendChild(toAutomatonButton);

		table.classList.add("padded");
		table.classList.add("inline");
		table.grammar = grammar;

		headerRow.appendChild(header);
		subHeaderRow.appendChild(subHeader);
		table.appendChild(headerRow);
		table.appendChild(subHeaderRow);

		var row = node("td");
		row.innerHTML = grammar.string.replace(/</g, '&lt;').replace(/([^-])>/g, '$1&gt;').replace(/\n/g, "<br>");

		table.appendChild(row);

		rgContainer().appendChild(table);
	}

	// Sets the current RegularGrammar of this workspace.
	this.addRegularGrammar = function(rg) {
		var instance;
		if (typeof(rg) == "string") {
			if (rg.trim() == "") {
				self.error("Grammar can not be empty");
				return;
			}
			try {
				instance = new RegularGrammar(rg);
			} catch (e) {
				self.error(e);
				console.log(e);
				return false;
			}
			self.currentRegularGrammar = instance;
		} else {
			self.currentRegularGrammar = rg;
		}

		printGrammar(instance);
		updateGrammarUI();
		return true;
	};

	// Returns a list item containing a given expression.
	function regexListItem(obj) {
		var row = node("tr");
		row.id = genRegexID(obj.id);

		var regexCell = node("td");
		regexCell.className = "ertd";
		if (obj.regex.string) {
			regexCell.innerHTML = obj.regex.string;
		} else {
			regexCell.innerHTML = "Grammar [" + obj.id + "]";
		}
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

	// Returns an object containing:
	// - An ID
	// - A regex instance with a properly formatted name corresponding
	//   to the intersection between the given expression objects
	// - A finite automaton that recognizes the union of two languages
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
			var subHeader = node("tr");
			var subHeader2 = node("tr");

			var cell = node("th");
			cell.colSpan = alphabet.length + 1;
			cell.innerHTML = "From: ";
			if (regex.string) {
				cell.innerHTML += regex.string;
			} else {
				cell.innerHTML += "Grammar [" + obj.id + "]";
			}
			cell.innerHTML += "&nbsp;";

			var actionCell = node("th");
			var actionCell2 = node("th");
			actionCell.colSpan = alphabet.length + 1;
			actionCell2.colSpan = alphabet.length + 1;

			var closeButton = node("button");
			closeButton.innerText = "✕";
			closeButton.classList.add("close-button");
			actionCell.appendChild(closeButton);

			var determinizeButton = node("button");
			determinizeButton.innerText = "Determinize";
			determinizeButton.classList.add("determinize-button");
			actionCell.appendChild(determinizeButton);

			var determinizeButton = node("button");
			determinizeButton.innerText = "Minimize";
			determinizeButton.classList.add("minimize-button");
			actionCell.appendChild(determinizeButton);

			var complementButton = node("button");
			complementButton.innerText = "Complement";
			complementButton.classList.add("complement-button");
			actionCell.appendChild(complementButton);

			var analyzeLanguage = node("button");
			analyzeLanguage.innerText = "Analyze Language";
			analyzeLanguage.classList.add("analyze-language-button");
			actionCell2.appendChild(analyzeLanguage);

			var toGrammarButton = node("button");
			toGrammarButton.innerText = "Regular Grammar";
			toGrammarButton.classList.add("to-grammar-button");
			actionCell2.appendChild(toGrammarButton);

			header.appendChild(cell);
			subHeader.appendChild(actionCell);
			subHeader2.appendChild(actionCell2);
			table.appendChild(header);
			table.appendChild(subHeader);
			table.appendChild(subHeader2);

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
					var content = Utilities.NO_TRANSITION;
					if (transitions[state]
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
			self.error(Utilities.ERROR_INVALID_REGEX);
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

		updateRegexUI();
	};
};

})();
