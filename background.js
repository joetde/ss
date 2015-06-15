// globals
var aliases = [];
var functions = [];
var ShortcutType = {
    FUNCTION : "FUNCTION",
    ALIAS : "ALIAS"
}

// helpers
String.prototype.format = function(args) {
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : "?";
    });
};

String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
};

/*Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}*/
// ---

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
    newAlias.nbArgs = (aliasUrl.match(/{(\d+)}/g) || [])/*.getUnique()*/.length;
    functions[aliasName] = newAlias;
}

function addFunction(func) {
    func.type = ShortcutType.FUNCTION;
    func.nbArgs = func.length;
    functions[functionName(func)] = func;
}

function generateUrl(text) {
    args = text.split(/\s+/);
    if (args[0] in functions) {
        return functions[args[0]].apply(this, args.slice(1));
    }
    return text;
}

function generateDescription(text) {
    var args = text.split(/\s+/);
    var func = functions[args[0]]
    var type = func.type;
    var descr = "";
    if (type == ShortcutType.FUNCTION) {
        descr = "["+type+":"+args[0]+"] "+func.toString().replace(/\s+/g, " ");
    } else if (type == ShortcutType.ALIAS) {
        descr = "["+type+":"+args[0]+"] <match>"+generateUrl(text)+"</match>";
    }
    return descr;
}

function generateSuggestions(text, help) {
    var args = text.split(/\s+/);
    var suggestions = [];
    for (key in functions) {
        if (key.startsWith(args[0]) || help) {
            var sim_key = args.slice(0);
            sim_key[0] = key;
            // Pluck you type!
            sim_key = sim_key.join(" ");
            // priority closeness in size and number of arguments (in a ugly way)
            var prio_length = args[0].length - key.length;
            var prio_args = Math.abs(args.length - 1 - functions[key].nbArgs);
            suggestions.push({content: generateUrl(sim_key),
                description: generateDescription(sim_key),
                prio: prio_length - 10 * prio_args});
        }
    }
    suggestions.sort(function (a, b) {return b.prio - a.prio;});
    return suggestions.map(function (s) { return {content: s.content, description: s.description}; } )
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
    if (text.startsWith("?")) {
        suggest(generateSuggestions(text, true));
        return;
    }
    suggest(generateSuggestions(text));
  });

chrome.omnibox.onInputEntered.addListener(
    function(text) {
        var toUrl = generateUrl(text);
        chrome.tabs.update({url: toUrl});
    });
