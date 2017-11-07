(function(){
"use strict";

var $ = Utilities.$;

// Internet Explorer doesn't support array.includes() and string.startsWith()
if (!Array.prototype.includes) {
	Array.prototype.includes = function(value) {
		return this.indexOf(value) != -1;
	};
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(str) {
		return this.substr(0, str.length) == str;
	};
}

if (!Array.prototype.split) {
	Array.prototype.split = function(separator) {
		var outArray = [];

		var lastIndex = 0;
		for (var i = 0; i < this.length; i++) {
			if (this[i] == separator) {
				outArray.push(this.slice(lastIndex, i));
				lastIndex = i+1;
			}
		}

		if (lastIndex != 0) {
			outArray.push(this.slice(lastIndex, i));
		} else {
			return [this];
		}

		return outArray;
	};
}

	if (!Array.prototype.splitFirst) {
		Array.prototype.splitFirst = function(separator) {
			var outArray = [];

			var separatorIndex = this.indexOf(separator);
			outArray.push(this.slice(0, separatorIndex));
			outArray.push(this.slice(separatorIndex+1));

			return outArray;
		};
	}

window.workspace = new Workspace();

addEventListener("load", function() {
	workspace.initEvents();

	$("#analyze_btn").addEventListener("click", function() {
		if (workspace.setRG($("#rg").value)) {
			$("#rg").value = "";
		}
	});

	$("#regex").addEventListener("keydown", function(ev) {
		if (ev.keyCode == 13) {
			if (workspace.addRegex(this.value)) {
				this.value = "";
			}
		}
	});

	$("#add_btn").addEventListener("click", function() {
		if (workspace.addRegex($("#regex").value)) {
			$("#regex").value = "";
		}
	});
});

})();
