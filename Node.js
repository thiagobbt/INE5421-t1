(function(){
"use strict";

/* Manages a node of a threaded tree, providing easy insertion of:
 *  - terminal symbols;
 *  - operators;
 *  - subtrees.
 * Additionally, there are facilities for:
 *  - changing the priority of all operators in the tree;
 *  - calculating and setting the thread links of all nodes;
 *  - finding a terminal node by its in-order index;
 *  - getting the root of the tree.
 */
window.Node = function() {
	var self = this;
	this.isOperator = false;
	this.priority = 0;
	this.data = null;
	this.left = null;
	this.right = null;
	this.parent = null;
	this.threadingLink = null;
	this.index = null;

	// Changes all pointers to a tree to another tree.
	this.override = function(oldTree, newTree) {
		if (self.parent == oldTree) {
			self.parent = newTree;
		}

		if (self.left) {
			if (self.left == oldTree) {
				self.left = newTree;
			} else {
				self.left.override(oldTree, newTree);
			}
			if (self.left.parent == oldTree) self.left.parent = newTree;
		}

		if (self.right) {
			if (self.right == oldTree) {
				self.right = newTree;
			} else {
				self.right.override(oldTree, newTree);
			}
			if (self.right.parent == oldTree) self.right.parent = newTree;
		}
	}

	// Adds a subtree to this tree.
	function pushSubtree(tree) {
		// console.log("Pushing subtree...");
		if (self.data === null) {
			self.isOperator = tree.isOperator;
			self.priority = tree.priority;
			self.data = tree.data;
			self.left = tree.left;
			self.right = tree.right;
			self.index = tree.index;
			self.override(tree, self);
			return;
		}

		if (!self.isOperator) {
			console.log("Error: invalid regex");
			return;
		}

		if (!self.right) {
			if (Utilities.numOperands(self.data) != 2) {
				console.log("Error: invalid regex");
				return;
			}
			self.right = tree;
			self.right.parent = self;
		} else {
			self.right.push(tree);
		}
	}

	// Adds a terminal symbol to this tree.
	function pushTerminal(char) {
		// console.log("Terminal: " + char);
		if (self.data === null) {
			self.data = char;
			return;
		}

		if (!self.isOperator) {
			console.log("Error: invalid regex");
			console.log(self);
			return;
		}

		if (!self.right) {
			if (Utilities.numOperands(self.data) != 2) {
				console.log("Error: invalid regex");
				return;
			}
			self.right = new Node();
			self.right.parent = self;
		}
		self.right.push(char);
	}

	// Adds an operator to this tree.
	function pushOperator(char) {
		// console.log("Operator: " + char);
		if (self.data === null) {
			self.isOperator = true;
			self.priority = Utilities.priority(char);
			self.data = char;
			return;
		}

		if (self.isOperator && !self.right && Utilities.numOperands(self.data) == 2) {
			var node = new Node();
			node.push(char);
			node.parent = self;
			self.right = node;
			return;
		}

		if (!self.isOperator || self.priority > Utilities.priority(char)) {
			var node = new Node();
			node.push(char);
			node.parent = self.parent;
			node.left = self;
			if (self.parent !== null) {
				if (self.parent.left == this) {
					self.parent.left = node;
				} else {
					self.parent.right = node;
				}
			}
			self.parent = node;
			return;
		}

		if (self.priority <= Utilities.priority(char)) {
			self.right.push(char);
			return;
		}

		console.log("Error: invalid regex");
	}

	// Pushes a new symbol/subtree to this tree.
	this.push = function(char) {
		// console.log("Pushing " + char);
		if (char instanceof Node) {
			// console.log("Subtree");
			pushSubtree(char);
		} else if (Utilities.operators.includes(char)) {
			// console.log("Operator");
			pushOperator(char);
		} else if (Utilities.isTerminalOrEmpty(char)) {
			// console.log("Terminal");
			pushTerminal(char);
		} else {
			console.log("Warning: unknown character \"" + char + "\"");
		}
	};

	// Changes the priority of all the operators in this tree by a given amount.
	this.changePriority = function(delta) {
		if (self.left) {
			self.left.changePriority(delta);
		}

		if (self.isOperator) {
			self.priority += delta;
		}

		if (self.right) {
			self.right.changePriority(delta);
		}
	};

	// Checks if this tree is valid.
	this.isValid = function() {
		if (self.data === null) {
			// null trees are not valid
			return false;
		}

		if (self.left && !self.left.isValid()) return false;
		if (self.right && !self.right.isValid()) return false;
		if (self.isOperator) {
			if (!self.left) return false;
			if (!self.right && Utilities.numOperands(self.data) == 2) {
				return false;
			}
		}
		return true;
	};

	// Adds the threading links to all nodes in this subtree.
	// A null threading link represents the lambda.
	this.setThreadingLinks = function() {
		if (self.left) {
			var leftLink = self.left.setThreadingLinks();
			leftLink.threadingLink = self;
		}

		if (self.right) {
			return self.right.setThreadingLinks();
		}
		return self;
	};

	// Calculates and sets the thread link of all nodes in this tree.
	this.setTerminalIndexes = function(valueContainer) {
		if (valueContainer == null) valueContainer = { index: 1 };
		if (!self.isOperator) {
			self.index = valueContainer.index++;
		}

		if (self.left) {
			self.left.setTerminalIndexes(valueContainer);
		}

		if (self.right) {
			self.right.setTerminalIndexes(valueContainer);
		}
	};

	// Returns a node of this tree with a given index.
	this.searchByIndex = function(index) {
		index *= 1;
		if (isNaN(index)) return null;

		if (self.index == index) {
			return this;
		}

		var node = null;
		if (self.left) node = self.left.searchByIndex(index);
		if (self.right) node = node || self.right.searchByIndex(index);
		return node;
	};

	// Returns the root of this tree.
	this.root = function() {
		var node = self;
		while (node.parent !== null) {
			node = node.parent;
		}
		return node;
	};

	// Returns a list containing the leaf nodes of this tree.
	this.getLeafNodes = function() {
		var leafContainer = [];
		self.fillLeafList(leafContainer);
		return leafContainer;
	};

	// Fills a list with the leaf nodes of this tree.
	this.fillLeafList = function(leafContainer) {
		if (!self.left && !self.right) {
			leafContainer.push(self);
		}

		if (self.left) {
			self.left.fillLeafList(leafContainer);
		}

		if (self.right) {
			self.right.fillLeafList(leafContainer);
		}		
	};

	this.debug = function() {
		self.debugHelper(1);
 	};

	this.debugHelper =  function(indent) {
		var threadingLink = self.threadingLink;
		if (!threadingLink) {
			threadingLink = new Node();
			threadingLink.data = "lambda";
		}
		console.log('-' + Array(indent).join('--'), self.data + " (" + threadingLink.data + ")");
		if (self.left !== null) self.left.debugHelper(indent + 1);
		if (self.right !== null) self.right.debugHelper(indent + 1);
	};
};

Node.LAMBDA_INDEX = -1;

})();
