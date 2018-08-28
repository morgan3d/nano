/* By Morgan McGuire @CasualEffects http://casual-effects.com GPL 3.0 License*/

function makeError(msg, srcLine) {
    return 'Line ' + (srcLine + 1) + ': ' + msg;
}

String.prototype.rtrim = function() {
    return this.replace(/\s+$/, '');
}

var protectionBlockStart = 0xE001;
var doubleQuoteProtection = String.fromCharCode(protectionBlockStart - 1);


/** Assumes that str[i]=='('. Returns the index of the
    matching close ')', assuming that parens are balanced
    and there are no quoted strings or incorrectly
    nested other grouping characters. */
function findClosingParen(str, i) {
    ++i;
    for (var stack = 1; stack > 0; ++i) {
        switch (str[i]) {
        case '(': ++stack; break;
        case ')': --stack; break;
        }
        if (i == str.length) {
            throw 'Missing close parenthesis';
        }
    } // for
    return i;
}

/** Returns the index of c or d within str after j, or -1 if none.
    Skips over balanced parens. */
function nextInstance(str, c, j, d) {
    if (d !== undefined) {
        var i0 = nextInstance(str, c, j);
        var i1 = nextInstance(str, d, j);
        if (i0 > -1) {
            if (i1 > -1) {
                return Math.min(i0, i1);
            } else {
                return i0;
            }
        } else {
            return i1;
        }
    }
    
    var start = j + 1;

    while (true) {
        var i = str.indexOf(c, start);

        if (i === -1) { return -1; }
        
        // See if there were unbalanced parens between j and i
        var between = str.substring(j, i);
        var open = between.split('(').length;
        var close = between.split(')').length;
        if (open === close) {
            // Balanced, this is the first less-than
            return i;
        } else if (close > open) {
            throw 'Unbalanced parentheses';
        }
        start = i + 1;
    }
}


/** Given a nano WITH preamble not surrounded in extra (), returns JavaScript for a FOR-loop preamble
    that handles the variable binding. */
function processWithHeader(test, noDeclareSet) {
    // Cannot create a function because that would break the coroutines used for preemptive
    // multitasking
    //
    // Syntax: with var0[, var1[, ...]] ∊ expr
    //
    //
    // Maps to (__ variables are gensyms):
    //
    // 
    // create a new scope
    // for (let __run = true,
    //    __obj = (expr),
    //    /* Copy fields into the current scope */     var0 = __obj.var0, ...
    //     ; __run;                     __run = false,
    //    /* Assign the properties back to __obj */    Object.assign(__obj, {var0:var0, ... }))

    var obj = gensym('obj'), save = gensym('save'), run = gensym('run');
    
    var match = test.match(withIdentifierListRegex);
    // match[0] = whole match
    // match[1] = variables
    // match[2] = object expression

    var expr = match[2];
    var idArray = match[1].split(',').map(function (s) { return s.trim(); });
    idArray.forEach(function (s) { noDeclareSet[s] = true; });
        
    return '(let ' + run + ' = true, ' +
        obj + ' = (' + expr + ')' +
        idArray.reduce(function (prev, id) { return prev + ', ' + id + ' = ' + obj +  '.' + id; }, '') +
        '; ' + run + '; ' + run + ' = false, Object.assign(' + obj + ', ' +
        idArray.reduce(function (prev, id) { return prev + id + ':' + id + ', '; }, '{ ') + ' }))';
}


/** Given a nano FOR-loop test that is not surrounded in extra (), returns the JavaScript
    equivalent test.  Mutates the noDeclareSet to include the index or element variable that
    will be bound within the loop's body. */
function processForTest(test, noDeclareSet) {
    var match = test.match(RegExp('^\\s*(' + identifierPattern + ')\\s*∊(.*)$'));
    if (match) {
        // Generate variables
        var container = gensym('cntnr'), keys = gensym('keys'), index = gensym('index'), cur = match[1], containerExpr = match[2];

        noDeclareSet[cur] = true;
        
        // Container iteration FOR loop. Clone the container if it is an object
        // or array. Iterates over elements of arrays, keys of table, chars of string.
        return '(let ' + container + ' = _clone(' + containerExpr + '), ' + keys + ' = Object.keys(' + container + '), ' + 
            index + ' = 0, ' + cur + ' = ' + container + '[' + keys + '[0]]; ' +
            index + ' < ' + keys + '.length; ' + cur + ' = ' + container + '[' + keys + '[++' + index + ']])';
    }

    // Range FOR loop
    
    // Look for ≤ or < expressions, but skip over pairs of parens
    var j = nextInstance(test, '<', -1, '≤');
    if (j === -1) { throw 'No < or ≤ found in FOR loop declaration'; }
    var op = (test[j] === '≤') ? '<=' : '<';
    
    var k = nextInstance(test, '<', j, '≤');
    var identifier, initExpr, endExpr;

    if (k === -1) {
        // has the form "variable < expr"
        identifier = test.substring(0, j).trim();
        endExpr = test.substring(j + 1).trim();
        initExpr = '0';
    } else {
        // has the form "expr < variable < expr"
        // j is the location of the first operator
        // k is the location of the second operator
        
        initExpr   = test.substring(0, j).trim();
        if (op === '<') {
            initExpr = '_Math.floor(' + initExpr + ') + 1';
        }

        op = (test[k] === '≤') ? '<=' : '<';
        identifier = test.substring(j + 1, k).trim();
        endExpr = test.substring(k + 1).trim();
    }

    if (! legalIdentifier(identifier)) { throw 'Illegal FOR-loop variable syntax'; }

    // Record the loop identifier as being captured by the loop body
    noDeclareSet[identifier] = true;

    return '(let ' + identifier + ' = ' + initExpr + '; ' + identifier + ' ' + op + ' ' + endExpr + '; ++' + identifier + ')';
}


/** Creates a new set (Object mapping keys to true) from the parent sets */
function setUnion(a, b) {
    return Object.assign(setClone(a), b);
}

/** Clone an object being used as a set */
function setClone(a) {
    return Object.assign({}, a);
}

function argStringToSet(args) {
    let set = {};
    args.split(',').forEach(function (a) { set[a.trim()] = true; });
    return set;
}


function setToVarDecl(set) {
    let declArray = Object.getOwnPropertyNames(set);
    return (declArray.length > 0) ? 'var ' + declArray.join(',') + '; ' : '';
}


/**
 returns the line after processign and mutates the declareSet and noDeclareSet

 1. Process the line up to the first ';'
 2. Process the rest recursively
*/
function processLine(line, declareSet, noDeclareSet, inFunction) {

    if (inFunction && line.match(/\b(flip|show|wait)\b/)) {
        throw 'Cannot show or wait inside a function';
    }

    let next = '';
    let separatorIndex = line.indexOf(';')
    if (separatorIndex > 0) {
        // Separate the next statement out
        next = line.substring(separatorIndex + 1).trim();
        line = line.substring(0, separatorIndex).rtrim();
    } else {
        line = line.rtrim();
    }

    if (line.search(/\S/) < 0) {
        // Empty line!
        return line;
    }

    let match;
    if (match = line.match(/^(\s*)(for|if|while|until|loop|with|fcn)(\b.*)/)) {
        // line is a control flow-affecting expresion
        let before = match[1], type = match[2], rest = match[3].trim() + '; ' + next;

        if (type === 'fcn') {
            // Process with a fresh declareSet and fresh noDeclareSet initialized to the args
            match = rest.match(/\s*(\S+)?\s*\((.*)\)(.*)/);
            if (! match) { throw 'Ill-formed single-line fcn'; }
            let name = match[1];
            let args = match[2] || '';
            let body = match[3];

            let bodyDeclareSet = {};
            body = processLine(body, bodyDeclareSet, argStringToSet(args), true);
            line = before + 'function ' + name + '(' + args + ') { ' + setToVarDecl(bodyDeclareSet) + maybeYieldFunction + body + ' }';

        } else {

            // Read the expression
            let begin = rest.indexOf('(');
            if (begin === -1) { throw 'Missing ( after single-line "' + type + '".'; }
            let end = findClosingParen(rest, begin);
            let test = rest.substring(begin + 1, end - 1);

            // Default to not creating a new scope
            let newNoDeclareSet = noDeclareSet;
            
            switch (type) {
            case 'with':
                // With blocks become a single-iteration FOR loop
                // because that allows specifying code that runs at
                // the end of the block up front.
                type = 'for';
                newNoDeclareSet = setClone(newNoDeclareSet);
                test = processWithHeader(test, newNoDeclareSet);
                break;

            case 'until':
                type = 'while';
                test = '(! (' + test + '))';
                break;

            case 'for':
                newNoDeclareSet = setClone(newNoDeclareSet);
                test = processForTest(test, newNoDeclareSet);
                break;

            case 'while':
            case 'if':
                test = '(' + test.trim() + ')';
                break;
            }

            return before + type + ' ' + test + ' {' + ((type === 'if') ? ' ' : (inFunction ? maybeYieldFunction : maybeYieldGlobal)) +
                processLine(rest.substring(end), declareSet, newNoDeclareSet, inFunction) + '; }';
            
        } // if control flow block
    } else if (match = line.match(/^(\s*)(let|const|extern)\s+(.*)/)) {

        // match let, const, or extern
        // Update the noDeclareSet after parsing
        let before = match[1];
        let type   = match[2];
        let rest   = match[3];

        if ((type === 'let') || (type === 'const')) {
            noDeclareSet[rest.match(identifierRegex)[0]] = true;
            return before + type + rest + (next ? '; ' + processLine(next, declareSet, noDeclareSet, inFunction) : '');
        } else { // extern
            rest.split(',').forEach(function (a) { a = a.trim(); if (a !== '') { noDeclareSet[a.trim()] = true; }});
            // Recursively process the rest of the line
            return processLine(next, declareSet, noDeclareSet, inFunction);
        }
        
    } else {
        // Update the declareSet and then recursively process the next expression.
        let match = line.match(RegExp('(?=^|[^.\\] \\t])\\s*(' + identifierPattern + ')(?=\\s*=)', 'g'));
        if (match) {
            // Declare each assigned variable that was not explicitly precluded from
            // declaration
            match.forEach(function(v) { v = v.trim(); if ((v !== '') && ! noDeclareSet[v]) { declareSet[v] = true; } });
        }
        return line + '; ' + processLine(next, declareSet, noDeclareSet, inFunction);
    }
}


/**
 returns nextLineIndex

Mutate the lines in place
 
1. Iteratively process lines in the current block, using processLine on each
2. Recursively process sub-blocks

*/
function processBlock(lineArray, startLineIndex, declareSet, noDeclareSet, inFunction) {

    let prevIndent, originalIndent, i;
    
    for (i = startLineIndex; i < lineArray.length; ++i) {
        // trim right whitespace
        lineArray[i] = lineArray[i].rtrim();
        let indent = lineArray[i].search(/\S/);
        // Ignore empty lines
        if (indent < 0) { continue; }

        
        if (prevIndent === undefined) {
            // initialize on the first non-empty line
            prevIndent = indent;
            originalIndent = indent;
        }

        // Has the block ended?
        if (indent < originalIndent) { return i; }
        
        ///////////////////////////////////////////////////////////////////////
        // Check for some illegal situations while we're processing
        if (/[^.\d]0\d/g.test(lineArray[i])) {
            throw makeError('Numbers may not begin with a leading zero', i);
        }

        let illegal = lineArray[i].match(/_|this|null|arguments|undefined|continue|function/g);
        if (illegal) {
            throw makeError('Illegal identifier "' + illegal[0] + '"', i);
        }

        if ((i === 0) && (indent > 0)) {
            throw makeError('First line must not be indented', i);
        } else if (indent > prevIndent + 1) {
            throw makeError('Indentation must not increase by more than one space per line', i);
        }

        ///////////////////////////////////////////////////////////////////////

        // See if the next non-empty line is not indented more than this one
        let singleLine = true;
        for (let j = i + 1; j < lineArray.length; ++j) {
            let nextIndent = lineArray[j].search(/\S/);
            if (nextIndent >= 0) {
                singleLine = (nextIndent <= indent);
                break;
            }
        }

        // Note the assignment to match in the IF statement tests below
        let match;
        if (singleLine) {
            try {
                lineArray[i] = processLine(lineArray[i], declareSet, noDeclareSet, inFunction);
            } catch (e) {
                throw makeError(e, i);
            }
            
        } else if (match = lineArray[i].match(RegExp('^(\\s*)fcn\\s+(' + identifierPattern + ')\\s*\\(([^\\)]*)\\)'))) {
            // FCN
            
            let prefix = match[1], name = match[2], args = match[3] || '';
            // Process the body with a declareSet and noDeclareSet from the arguments
            let bodyDeclareSet = {};
            let end = processBlock(lineArray, i + 1, bodyDeclareSet, argStringToSet(args), true) - 1;
            lineArray[i] = prefix + 'function ' + name + '(' + args + ') { ' + setToVarDecl(bodyDeclareSet) + maybeYieldFunction;
            i = end;
            lineArray[i] += '}';
            
        } else if (match = lineArray[i].match(/^(\s*)with\s+\(?(.+∊.+)\)?\s*$/)) {
            // WITH
            
            let prefix = match[1], bodyNoDeclareSet = setClone(noDeclareSet);
            lineArray[i] = prefix + 'for ' + processWithHeader(match[2], bodyNoDeclareSet) + ' {';
            i = processBlock(lineArray, i + 1, declareSet, bodyNoDeclareSet, inFunction) - 1;
            lineArray[i] += '}';
            
        } else if (match = lineArray[i].match(/^(\s*)for\s*\(?(\b.*)\)?\s*$/)) {
            // FOR
            
            let prefix = match[1];
            let test = match[2];
            let bodyNoDeclareSet = setClone(noDeclareSet);
            lineArray[i] = prefix + 'for ' + processForTest(test, bodyNoDeclareSet) + ' { ' + (inFunction ? maybeYieldFunction : maybeYieldGlobal);
            i = processBlock(lineArray, i + 1, declareSet, bodyNoDeclareSet, inFunction) - 1;
            lineArray[i] += '}';
            
        } else if (match = lineArray[i].match(/^(\s*)(if|elif)(\b.*)$/)) {
            // IF, ELIF

            let old = i;
            lineArray[i] = match[1] + (match[2] === 'elif' ? 'else ' : '') + 'if (' + match[3].trim() + ') {';
            i = processBlock(lineArray, i + 1, declareSet, noDeclareSet, inFunction) - 1;
            lineArray[i] += '}';
            
        } else if (match = lineArray[i].match(/^(\s*else)\s*$/)) {
            // ELSE
            
            lineArray[i] = match[1] + ' {';
            i = processBlock(lineArray, i + 1, declareSet, noDeclareSet, inFunction) - 1;
            lineArray[i] += '}';
            
        } else if (match = lineArray[i].match(/^(\s*)(while|until)(\b.*)?$/)) {
            // WHILE/UNTIL
            
            let test = match[3];
            if (match[2] === 'until') {
                test = '! (' + test + ')';
            }

            lineArray[i] = match[1] + 'while (' + test + ') { ' + (inFunction ? maybeYieldFunction : maybeYieldGlobal);
            i = processBlock(lineArray, i + 1, declareSet, noDeclareSet, inFunction) - 1;
            lineArray[i] += '}';

        } else {
            throw makeError('Illegal block statement', i);
        }

        prevIndent = indent;
    } // for each line
    
    return i;
}


var identifierPattern = '[Δ]?(?:[A-Za-z]+|[αβγδζηθιλμρσϕφχψωΩ])[0-9]*';
var identifierRegex = RegExp(identifierPattern);
var withIdentifierListRegex = RegExp('^[ \\t]*(' + identifierPattern + '[ \\t]*(?:,[ \\t]*' + identifierPattern + '[ \\t]*)*)∊(.*)$');

function legalIdentifier(id) {
    return id.match(identifierRegex);
}


function processAbsoluteValue(src) {
    // Absolute value
    var i = src.indexOf('|');
    while (i >= 0) {
        var j = nextInstance(src, '|', i);
        if (j === -1) { throw makeError("Unbalanced absolute value |...|", 0); }
        src = src.substring(0, i) + ' abs(' + src.substring(i + 1, j) + ') ' + src.substring(j + 1);

        // See if there are more instances
        i = src.indexOf('|');
    }
    return src;
}


/** Returns one line of Javascript (not nano) code. */
function makeTitleAnimation(title, screenScale) {
    title = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // Have to use 'b*=½' instead of 'b>>=1' below because
    // b must be retained as a double to have enough bits

    var flags = 1;
    if (screenScale === 2) { flags |= 2; }
    var center = ((64 * screenScale) >> 1) - 1;
    let src = `#nanojam title,` + flags + `
text("` + title + `",` + center + `,`+ center +`,1)
if(⅛τ%8≥4)
 for j<3
  b=[3903080538885870,5990782578476654,6131554409934498]ⱼ
  for(x<52)b*=½;if(b∩1)pset(x+` + (center - 25) + `,j+` + (center + 19) + `,5)
b=∅
for(j<2)if(padⱼ.aa∪padⱼ.bb∪padⱼ.cc∪padⱼ.dd∪padⱼ.ss)τ=0`;

    return nanoToJS(src, true).replace(/\n/g, '; ').replace(/{[ \t]*;/g, '{');
}

var gensymNum = 0;
/** Returns a new identifier */
function gensym(base) {
    return '__' + (base || '') + (++gensymNum) + '__';
}

/** Expression for selective yields to avoid slowing down tight loops */
var maybeYieldGlobal = ' {if (!(__yieldCounter = (__yieldCounter + 1) & 1023)) { yield; }} ';

/** Expression for 'yield' inside a function, where regular yield is not allowed */
var maybeYieldFunction = ''; // TODO

/** Compiles nano -> JavaScript. If noWrapper is true then no outer exception handler and
    infinite loop are injected. */
function nanoToJS(src, noWrapper) {
    /** Given a string, returns a unique reserved unicode character that can be 
        used to replace it temporarily to hide it from the rest of the renaming. */
    function protect(str) {
        protectionMap.push(str);
        return '' +  String.fromCharCode(numProtected++ + protectionBlockStart);
    }
    
    var numProtected = 0, protectionMap = [];

    // Switch to small element-of everywhere before blocks or strings can be processed
    src = src.replace(/∈/g, '∊');
    
    // Title line
    var title = undefined, flags = 0;
    src = src.replace(/^#nanojam[ \t]+(..+?)((?:,)([ \t]*\d+[ \t]*))?(?:$|\n)/, function (match, specTitle, ignore, specFlags) {
        // remove comments
        specTitle = specTitle.replace(/\/\/.*$|\/\*.*\*\//g, '').trim();
        title = specTitle;
        flags = parseInt(specFlags || 0);
        return '\n';
    });

    var screenScale = ((flags >> 1) & 1) === 1 ? 2 : 1;

    if (! title) {
        throw makeError('The first line must be "#nanojam &lt;gametitle&gt;"', 0);
    }
    
    // Hide escaped quotes
    src = src.replace('\\"', doubleQuoteProtection);
                      
    // Protect strings
    src = src.replace(/"(.+?)"/g, function (match, str) {
        return '"' + protect(str) + '"';
    });

    // Remove multi-line comments, which cause problems with the indentation and end-of-line metrics
    src = src.replace(/\/\*([\s\S]*)\*\//g, function(match, contents) {
        // Extract and return just the newlines to keep line numbers unmodified
        return contents.replace(/[^\n]/g, '');
    });

    // Remove single-line comments
    src = src.replace(/\/\/.*$/gm, '');

    src = src.replace(/\bloop\b/g, 'while(1)');

    // Handle scopes and block statement translations
    {
        let lineArray = src.split('\n');
        processBlock(lineArray, 0, {}, {}, false);
        src = lineArray.join('\n');
    }

    src = src.replace(/\breset\b/g, '{ throw new Error("RESET"); }');
   
    src = src.replace(/≟/g, ' === ');
    src = src.replace(/≠/g, ' !== ');
    src = src.replace(/¬/g, ' ! ');

    // Temporary rename to hide from absolute value
    src = src.replace(/\|\|/g, ' or ');
    src = src.replace(/&&/g, ' & ');

    // Floor and ceiling
    src = src.replace(/[⌉⌋]/g, ')');
    src = src.replace(/[⌈]/g, ' ceil(');
    src = src.replace(/[⌊]/g, ' flr(');

    src = src.replace(/\bret\b/g, 'return');

    // Process before blocks and implicit multiplication so that
    // they handle the parentheses correctly
    src = processAbsoluteValue(src);

    // Process implicit multiplication twice, so that it can happen within exponents and subscripts
    for (var i = 0; i < 2; ++i) {
        // Implicit multiplication. Must be before operations that may put parentheses after
        // numbers, making the product unclear. 
        src = src.replace(/([επτξ∞½⅓⅔¼¾⅕⅖⅗⅘⅙⅐⅛⅑⅒\d⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁾₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₎])[ \t]*([\(\[A-Za-zαβγδζηιθλμρσϕχψωΔΩτεπξ∞])/g, '$1 * $2');
        
        // Fix any instances of "or" that got accentially turned
        // into implicit multiplication. If there are other text
        // operators in the future, they can be added to this pattern.
        src = src.replace(/\*[\t ]*(or)(\b|\d|$)/g, ' $1$2');

        // Replace fractions
        src = src.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅐⅛⅑⅒]/g, function (match) { return fraction[match]; });
        
        // Replace exponents
        src = src.replace(/([⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾][⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾ ]*)/g, '^($1)');
        src = src.replace(/[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾]/g, function (match) { return superscriptToNormal[match]; });
        
        // Replace subscripts
        src = src.replace(/([₊₋₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₍₎][₊₋₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₍₎ ]*)/g, '[($1)]');
        src = src.replace(/[₊₋₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₍₎]/g, function (match) { return subscriptToNormal[match]; });

        // Back-to-back parens. Note that floor, ceiling, and abs have already been mapped to
        // ().
        src = src.replace(/\)[ \t]*\(/, ') * (');
    }

    // sin, cos, tan with a single argument and no parentheses. Must come after implicit
    // multiplication so that, e.g., 2cosθ parses correctly with regard to the \\b
    src = src.replace(RegExp('\\b(cos|sin|tan)[ \\t]*([επτξ]|' + identifierPattern + ')(?=\\s|\\b|[^επτξΔA-Za-z0-9]|$)', 'g'), '$1($2)');
    
    // Process after FOR-loops so that they are easier to parse
    src = src.replace(/≤/g, ' <= ');
    src = src.replace(/≥/g, ' >= ');
    
    src = src.replace(/cont/g, 'continue');

    // Array sort (avoid conflicting with the built-in Array.sort for JavaScript)
    src = src.replace(/\bsort\b/g, '_sort');

    // Expand shifts after blocks so that they aren't misparsed inside
    // FOR loops
    src = src.replace(/◅(=?)/g, ' <<$1 ');
    src = src.replace(/▻(=?)/g, ' >>$1 ');

    // exponentiation
    src = src.replace(/\^/g, '**');

    src = src.replace(/(\b|\d)or(\b|\d)/g, '$1 || $2');
    src = src.replace(/∩(=?)\b/g, ' &$1 ');
    src = src.replace(/∪(=?)\b/g, ' |$1 ');

    // Optimize var**(int), which is much less efficient than var*var.
    // Note that we don't allow rnd in here!
    src = src.replace(RegExp('(.|..)[ \t]*(' + identifierPattern + ')\\*\\*\\((-?\\d)\\)', 'g'), function (match, br, identifier, exponent) {

        if (br.match(/\+\+|--|\.|\*\*/)) {
            // Order of operations may be a problem; don't substitute
            return match;
        } else {
            exponent = parseInt(exponent);
            console.log("replacing " + match + " exponent = " + exponent);
            if (exponent === 0) {
                return br + ' identifier**(0)';
            } else if (exponent < 0) {
                return br + ' (1 / (' + identifier + (' * ' + identifier).repeat(-exponent - 1) + '))';
            } else {
                return br + ' (' + identifier + (' * ' + identifier).repeat(exponent - 1) + ')';
            }
        }
    });
    
    src = src.replace(/∞/g, ' (Infinity) ');
    src = src.replace(/∅/g, ' (undefined) ');
    src = src.replace(/π/g, ' (_Math.PI+0) ');
    src = src.replace(/ε/g, ' (1e-4+0) ');
    src = src.replace(/ξ/g, ' rnd() ');

    // Must come after exponentiation
    src = src.replace(/⊕(=?)/g, ' ^$1 ');

    // Alternatives for readable code
    src = src.replace(/(\b|\d)and(\b|\d)/g, '$1 && $2');
    src = src.replace(/\bnot\b/g, '!');

    src = src.replace(/\b(flip|show)\b/g, 'show(); yield; ');

    // 'wait' must come after loop processing; not considered a loop
    src = src.replace(/\bwait\b/g, 'do { show(); yield; } while (!(pad[0].aa || pad[0].bb || pad[0].cc || pad[0].dd || pad[0].ss || pad[1].aa || pad[1].bb || pad[1].cc || pad[1].dd || pad[1].ss));');

    var titleScreen = '';
    if ((flags & 1) === 0) {
        // Generate a title screen
        titleScreen = makeTitleAnimation(title, screenScale);
    }

    var screenWidth = 64 * screenScale, screenHeight = 64 * screenScale, barHeight = 8 * screenScale, barSeparator = 4 * screenScale;
    var framebufferHeight = barHeight + (barHeight >> 1) + screenHeight;
    
    // Add the outer loop, restoring tau if destroyed by assignment to a non-number and
    // catching RESET to allow jumping back to an interation of the outer loop.
    src = 'var __yieldCounter = 0; _setFramebufferSize(' + screenWidth + '); ' + (noWrapper ? '' : 'while(true) { try { ') + (
        titleScreen +
            '_drawPalette[0]=_initialPalette[0]; pal(); xform(0,0,1,1); clip(0,' + (-barHeight - barSeparator) + ',' + (screenWidth - 1) + ',' + (screenHeight - 1) + '); cls(0); text("' + (noWrapper ? '' : title) + '",' + (screenWidth >> 1) + ',' + (-barHeight) + ',1); clip(0,0,' + (screenWidth - 1) + ',' + (screenHeight - 1) + '); clr=0; srand(); ' +
            'for (var τ = 0, __count = 0; (τ !== 1) || (__count === 1); ++τ, ++__count) { if (isNaN(τ)) { τ=0; } show(); yield; cls(clr); ' +
            src +
            ' } '
    ) + (noWrapper ? '' : ('} catch (exception) { ' + (
        'if (exception.message !== "RESET") { throw exception; } '
    ) + '} }'));


    // Cleanup formatting
    src = src.replace(/;[ \t]*;/g, ';');
    src = src.replace(/(\S)[ \t]{2,}/g, '$1 ');

    // Unprotect strings
    for (var i = 0; i < protectionMap.length; ++i) {
        src = src.replace(String.fromCharCode(protectionBlockStart + i), protectionMap[i]);
    }

    // Unprotect escaped quotes
    src = src.replace(doubleQuoteProtection, '\\"');
    
    return src;
}


var fraction = {
    '½':'(1/2)',
    '⅓':'(1/3)',
    '⅔':'(2/3)',
    '¼':'(1/4)',
    '¾':'(3/4)',
    '⅕':'(1/5)',
    '⅖':'(2/5)',
    '⅗':'(3/5)',
    '⅘':'(4/5)',
    '⅙':'(1/6)',
    '⅐':'(1/7)',
    '⅛':'(1/8)',
    '⅑':'(1/9)',
    '⅒':'(1/10)'
}


var subscriptToNormal = {
    '₊':'+',
    '₋':'-',
    '₀':'0',
    '₁':'1',
    '₂':'2',
    '₃':'3',
    '₄':'4',
    '₅':'5',
    '₆':'6',
    '₇':'7',
    '₈':'8',
    '₉':'9',
    'ₐ':' a ',
    'ᵦ':' β ',
    'ᵢ':' i ',
    'ⱼ':' j ',
    'ₓ':' x ',
    'ᵤ':' u ',
    'ₖ':' k ',
    'ₙ':' n ',
    '₍':'(',
    '₎':')'    
};

var superscriptToNormal = {
    '⁺':'+',
    '⁻':'-',
    '⁰':'0',
    '¹':'1',
    '²':'2',
    '³':'3',
    '⁴':'4',
    '⁵':'5',
    '⁶':'6',
    '⁷':'7',
    '⁸':'8',
    '⁹':'9',
    'ᵃ':' a ',
    'ᵝ':' β ',
    'ⁱ':' i ',
    'ʲ':' j ',
    'ˣ':' x ',
    'ᵘ':' u ',
    'ᵏ':' k ',
    'ⁿ':' n ',
    '⁽':'(',
    '⁾':')'};
    
