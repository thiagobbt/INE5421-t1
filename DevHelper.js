workspace.addRegex("a+");
workspace.addRegex("b+");

Utilities.$(".checktd input").forEach((element) => {element.checked=true})
workspace.updateRegexUI();
