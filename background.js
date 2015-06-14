// globals
var aliases = [];
var functions = [];
var ShortcutType = {
    FUNCTION : "FUNCTION",
    ALIAS : "ALIAS"
}

String.prototype.format = function(args) {
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : "";
    });
};

function functionName(func) {
    var ret = func.toString();
    ret = ret.substr('function '.length);
    ret = ret.substr(0, ret.indexOf('('));
    return ret;
}

function addAlias(aliasName, aliasUrl) {
    function newAlias() { return aliasUrl.format(Array.prototype.slice.call(arguments)); };
    newAlias.type = ShortcutType.ALIAS;
    newAlias.target = aliasUrl;
    functions[aliasName] = newAlias;
}

function addFunction(func) {
    func.type = ShortcutType.FUNCTION;
    functions[functionName(func)] = func;
}

function generateUrlFromEntry(text) {
    args = text.split(/\s+/);
    if (args[0] in functions) {
        return functions[args[0]].apply(this, args.slice(1));
    }
}

chrome.storage.sync.get("code", function (items) {
    eval(items["code"]);
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if ("code" in changes) {
        eval(changes["code"].newValue);
    }
});

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    args = text.split(/\s+/);
    if (args[0] in functions) {
        func = functions[args[0]]
        type = func.type;
        descr = "";
        if (type == ShortcutType.FUNCTION) {
            descr = func.toString().replace(/\s+/g, " ");
        } else if (type == ShortcutType.ALIAS) {
            descr = type+" "+args[0]+":"+func.target;
        }
        suggest([
          {content: args[0], description: descr}
        ]);
    }
  });

chrome.omnibox.onInputEntered.addListener(
    function(text) {
        var toUrl = generateUrlFromEntry(text);
        chrome.tabs.update({url: toUrl});
    });
