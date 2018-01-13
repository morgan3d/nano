/* By Morgan McGuire @CasualEffects http://casual-effects.com GPL 3.0 License*/

function makeError(msg, srcLine) {
    return 'Line ' + (srcLine + 1) + ': ' + msg;
}

String.prototype.rtrim = function() {
    return this.replace(/\s+$/, '');
}

var protectionBlockStart = 0xE001;
var doubleQuoteProtection = String.fromCharCode(protectionBlockStart - 1);
var numProtected, protectionMap;

/** Given a string, returns a unique reserved unicode character that can be 
    used to replace it temporarily to hide it from the rest of the renaming. */
function protect(str) {
    protectionMap.push(str);
    return '' +  String.fromCharCode(numProtected++ + protectionBlockStart);
}


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

/** Returns the index of the next character c in str after j, or -1 if none.
    Skips over balanced parens. */
function nextInstance(str, c, j) {
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

/** Expression for selective yields to avoid slowing down tight loops */
var maybeYield = ' {if (!(__yieldCounter = (__yieldCounter + 1) & 511)) { yield; }} ';

/** Converts a single-line IF, FOR, WHILE, or UNTIL to JavaScript, preserving indenting.
    Returns the entire string if none of those appear. */
function processSingleLineControl(str) {
    var match = str.match(/(^|.*?\b)(for|if|while|until)(\b.*)/);
    if (! match) { return str; }
    var before = match[1];
    var type   = match[2];
    var rest   = match[3];

    // Read the expression
    var begin = rest.indexOf('(');
    if (begin === -1) { throw 'Missing ( after single-line "' + type + '".'; }
    var end = findClosingParen(rest, begin);

    var test = rest.substring(begin + 1, end - 1);
    switch (type) {
    case 'until':
        type = 'while';
        test = '(! (' + test + '))';
        break;

    case 'for':
        test = processForTest(test);
        break;

    case 'while':
    case 'if':
        test = '(' + test + ')';
        break;
    }

    var s = before + type + ' ' + test + ' {' + ((type === 'if') ? ' ' : maybeYield) + processSingleLineControl(rest.substring(end)).trim() + '; }';
    return s;
}


/** Given a nano FOR-loop tet not surrounded in extra (), returns the JavaScript equivalent */
function processForTest(test) {
    // Look for <=, < expressions, but skip over pairs of parens
    var j = nextInstance(test, '<', -1);
    if (j === -1) { throw 'No < found in FOR loop declaration'; }
    var op = (test[j + 1] === '=') ? '<=' : '<';
    
    var k = nextInstance(test, '<', j);
    var identifier, initExpr = '0';
    var endExpr = test.substring(j + op.length);
    if (k === -1) {
        // has the form "variable <= expr"
        identifier = test.substring(0, j);
    } else {
        // has the form "expr <= variable <= expr"
        initExpr   = test.substring(0, k);
        if (test[k + 1] === '=') {
            // <=
            identifier = test.substring(k + 2, j);
        } else {
            // <
            initExpr += ' + 1';
            identifier = test.substring(k + 1, j);
        }
    }
    
    initExpr = initExpr.trim();
    identifier = identifier.trim();
    endExpr = endExpr.trim();

    if (! legalIdentifier(identifier)) { throw 'Illegal FOR-loop variable syntax'; }
                
    return '(var ' + identifier + ' = ' + initExpr + '; ' + identifier + ' ' + op + ' ' + endExpr + '; ++' + identifier + ')';
}


/** Create braces as dictated by indenting */
function processBlocks(src) {
    // Break apart into lines
    var lineArray = src.split('\n');
    var prevIndent = 0;
    for (var i = 0; i < lineArray.length; ++i) {
        // trim right whitespace
        lineArray[i] = lineArray[i].rtrim();
        var indent = lineArray[i].search(/\S/);

        if (/\d\.[^\d]/g.test(lineArray[i])) {
            throw makeError('Numbers with a trailing decimal point are not permitted', i);
        }

        if (/[^.\d]0\d/g.test(lineArray[i])) {
            throw makeError('Numbers may not begin with a leading zero', i);
        }

        var illegal = lineArray[i].match(/print|location|window|_|undefined|continue/g);
        if (illegal) {
            throw makeError('Illegal identifier "' + illegal[0] + '"', i);
        }
        
        if (indent >= 0) {
            // Non-negligible line
            if ((i === 0) && (indent > 0)) {
                console.log(lineArray[i]);
                throw makeError('First line must not be indented', i);
            } else if (indent > prevIndent + 1) {
                throw makeError('Indenting must not increase by more than one space per line', i);
            }

            // See if the next non-empty line is not indented more than this one
            var singleLine = true;
            for (var j = i + 1; j < lineArray.length; ++j) {
                var nextIndent = lineArray[j].search(/\S/);
                if (nextIndent >= 0) {
                    singleLine = (nextIndent <= indent);
                    break;
                }
            }

            try {
                // Note the assignment to match in the IF statement tests below
                var match;
                if (singleLine) {
                    if (match = lineArray[i].match(/^\s*(for|while|if|until)\b.*/)) {
                        lineArray[i] = processSingleLineControl(lineArray[i]);
                    }
                } else if (match = lineArray[i].match(/^(\s*for)(\b.*)/)) {
                    // multi-line FOR loop 
                    lineArray[i] = match[1].rtrim() + ' ' + processForTest(match[2].trim());
                } else if (match = lineArray[i].match(/^(\s*if)(\b.*)/)) {
                    // Multi-line IF
                    lineArray[i] = match[1].rtrim() + ' (' + match[2].trim() + ')'
                } else if (match = lineArray[i].match(/^(\s*)elif(\b.*)/)) {
                    // ELIF, Same as multi-line if
                    lineArray[i] = match[1] + 'else if' + ' (' + match[2].trim() + ')';
                } else if (match = lineArray[i].match(/^(\s*)else\s*$/)) {
                    lineArray[i] = match[1] + 'else ';
                } else if (match = lineArray[i].match(/^(\s*while)(\b.*)/)) {
                    lineArray[i] = match[1] + ' (' + match[2].trim() + ')';
                } else if (match = lineArray[i].match(/^(\s*until)(\b.*)/)) {
                    lineArray[i] = match[1] + ' (! (' + match[2].trim() + '))';
                }
            } catch (e) {
                throw makeError(e, i);
            }

            // Add curlies
            if (indent > prevIndent) {
                // Add { to previous line. Yield at the FRONT of blocks so that a 'continue'
                // can't skip the yield.
                lineArray[i - 1] += ' { ' + maybeYield;
            } else if (indent < prevIndent) {
                // Add multiple } to previous line
                lineArray[i - 1] += ' ' + '}'.repeat(prevIndent - indent);
            }
            prevIndent = indent;

            
            // Indent everything one space to account for the outer FOR loop we'll insert
            // later
            lineArray[i] = ' ' + lineArray[i];
        } // there is code on this line
    } // for each line

    // Add multiple } to the last line
    if (prevIndent > 0) {
        lineArray[lineArray.length - 1] += '}'.repeat(prevIndent);
    }

    return lineArray.join("\n");
}


function legalIdentifier(id) {
    return id.match(/[δΔ]?([A-Za-z]{1,3}|[αβδθλμξρσφψωΔΩ])/) ? true : false;
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
function makeTitleAnimation(title) {
    title = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var src = `#nanojam title,1
text("` + title + `",31,31,1)
if(⅛τ%8<4)cont
for j<3
 b=[3903080538885870,5990782578476654,6131554409934498]ⱼ
 for(x<52)b*=½;if(b∩1)pset(x+6,j+50,5);if(⅛τ%8<4)cont
x=j=b=∅
for(j<2)if(padⱼ.aa∪padⱼ.bb∪padⱼ.cc∪padⱼ.dd∪padⱼ.ss)j=∅;τ=0`;

    return nanoToJS(src, true).replace(/\n/g, ';');
}


/** Compiles nano -> JavaScript. If noWrapper is true then no outer exception handler and
    infinite loop are injected. */
function nanoToJS(src, noWrapper) {
    numProtected = 0;
    protectionMap = [];

    // Title line
    var title = undefined, flags = 0;
    src = src.replace(/^#nanojam[ \t]+(..+?)((?:,)([ \t]*\d+[ \t]*))?(?:$|\n)/, function (match, specTitle, ignore, specFlags) {
        // remove comments
        specTitle = specTitle.replace(/\/\/.*$|\/\*.*\*\//g, '').trim();
        title = specTitle;
        flags = parseInt(specFlags || 0);
        return '\n';
    });

    if (! title) {
        throw makeError('The first line must be "#nanojam &lt;gametitle&gt;"', 0);
    }
    
    // Hide escaped quotes
    src = src.replace('\\"', doubleQuoteProtection);
                      
    // Protect strings
    src = src.replace(/"(.+?)"/g, function (match, str) {
        return '"' + protect(str) + '"';
    });

    // Remove comments, which cause problems with the indentation and end-of-line metrics
    src = src.replace(/\/\*([\s\S]*)\*\//g, function(match, contents) {
        // Extract and return just the newlines to keep line numbers unmodified
        return contents.replace(/[^\n]/g, '');
    });

    src = src.replace(/\breset\b/g, '{throw new Error("RESET");}');
    
    src = src.replace(/\/\/.*$/gm, '');
    
    src = src.replace(/≟/g, ' === ');
    src = src.replace(/≠/g, ' !== ');
    src = src.replace(/≤/g, ' <= ');
    src = src.replace(/≥/g, ' >= ');
    src = src.replace(/¬/g, ' ! ');

    // Temporary rename to hide from absolute value
    src = src.replace(/\|\|/g, ' or ');
    src = src.replace(/&&/g, ' & ');

    // Floor and ceiling
    src = src.replace(/[⌉⌋]/g, ')');
    src = src.replace(/[⌈]/g, ' ceil(');
    src = src.replace(/[⌊]/g, ' flr(');

    src = src.replace(/loop/g, 'while(1)');

    // Process before blocks and implicit multiplication so that
    // they handle the parentheses correctly
    src = processAbsoluteValue(src);

    // Process implicit multiplication twice, so that it can happen within exponents and subscripts
    for (var i = 0; i < 2; ++i) {
        // Implicit multiplication. Must be before operations that may put parentheses after
        // numbers, making the product unclear.
        src = src.replace(/([επτξ∞½⅓⅔¼¾⅕⅖⅗⅘⅙⅐⅛⅑⅒\d⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁾])[ \t]*([\(A-Za-zαβδθλμρσφψωΔΩτ])/g, '$1 * $2');
        
        // Fix any instances of "or" that got accentially turned
        // into implicit multiplication. If there are other text
        // operators in the future, they can be added to this pattern.
        src = src.replace(/\*[\t ]*(or)(\b|\d|$)/g, ' $1$2');
        
        // These are a weird case; we can write 2π or πr, so the π acts as both a number and a
        // variable for the purpose of implicit products.
        src = src.replace(/([½⅓⅔¼¾⅕⅖⅗⅘⅙⅐⅛⅑⅒\d⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁾])[ \t]*([επτξ∞])/g, '$1 * $2');
        
        // Replace fractions
        src = src.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅐⅛⅑⅒]/g, function (match) { return fraction[match]; });
        
        // Replace exponents
        src = src.replace(/([⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾][⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾ ]*)/g, '^($1)');
        src = src.replace(/[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾]/g, function (match) { return superscriptToNormal[match]; });
        
        // Replace subscripts
        src = src.replace(/([₊₋₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₍₎][₊₋₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₍₎ ]*)/g, '[($1)]');
        src = src.replace(/[₊₋₀₁₂₃₄₅₆₇₈₉ₐᵦᵢⱼₓₖᵤₙ₍₎]/g, function (match) { return subscriptToNormal[match]; });
    }
    
    src = processBlocks(src);

    src = src.replace(/cont/g, 'continue');

    // Array sort (avoid conflicting with the built-in Array.sort for JavaScript)
    src = src.replace(/\bsort\b/g, '_sort');

    // rnd shorthand
    src = src.replace(/ξ/g, ' rnd() ');

    // Expand shifts after blocks so that they aren't misparsed inside
    // FOR loops
    src = src.replace(/◅/g, ' << ');
    src = src.replace(/▻/g, ' >> ');

    src = src.replace(/(\b)or([\b\d])/g, '$1 || $2');
    src = src.replace(/∩\b/g, ' & ');
    src = src.replace(/∪\b/g, ' | ');

    // exponentiation
    src = src.replace(/\^/g, '**');

    src = src.replace(/∞/g, ' (Infinity) ');
    src = src.replace(/∅/g, ' (undefined) ');
    src = src.replace(/π/g, ' (Math.PI+0) ');
    src = src.replace(/ε/g, ' (1e-4+0) ');

    // Must come after exponentiation
    src = src.replace(/⊕/g, ' ^ ');

    src = src.replace(/(flip)/g, '$1(); yield; ');

    // Must come after loop processing; not considered a loop
    src = src.replace(/wait/g, 'do { flip(); yield; } while (!(pad[0].aa || pad[0].bb || pad[0].cc || pad[0].dd || pad[0].ss || pad[1].aa || pad[1].bb || pad[1].cc || pad[1].dd || pad[1].ss));');

    var titleScreen = '';
    if ((flags & 1) === 0) {
        // Generate a title screen
        titleScreen = makeTitleAnimation(title);
    }

    // Add the outer loop, restoring tau if destroyed by assignment to a non-number and
    // catching RESET to allow jumping back to an interation of the outer loop.
    src = 'var __yieldCounter = 0; ' + (noWrapper ? '' : 'while(true) { try { ') + (
        '_drawPalette[0] = _initialPalette[0]; pal(); clr = 0; srand(); ' +
            titleScreen +
            'for (var τ = 0, __count = 0; (τ !== 1) || (__count === 1); ++τ, ++__count) { if (isNaN(τ)) { τ=0; } flip(); yield; cls(clr); ' +
            src +
            ' } '
    ) + (noWrapper ? '' : ('} catch (exception) { ' + (
        'if (exception.message !== "RESET") { throw exception; } '
    ) + '} }'));

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
    
