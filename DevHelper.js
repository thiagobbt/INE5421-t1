// workspace.addRegex("a+");
// workspace.addRegex("b+");

// Utilities.$(".checktd input").forEach((element) => {element.checked=true})
// workspace.updateRegexUI();

workspace.addRegularGrammar("S -> a S | a");
workspace.addRegex("(ab|ac)*(a|b|c)");
workspace.addRegex("a*");
workspace.addRegex("b*");
workspace.addRegex("a*|b*");
