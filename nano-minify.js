/** Assumes blank lines and comments have already been removed */
function minify_indentation(src) {
    let lineArray = src.split('\n');

    let spacesStack = [], spaces = '';
    let oldIndentStack = [], prevIndent = 0;
    
    for (let L = 0; L < lineArray.length; ++L) {
        let indent = lineArray[L].search(/\S/);
        if (indent > prevIndent) {
            spacesStack.push(spaces);
            oldIndentStack.push(prevIndent);
            prevIndent = indent;
            spaces = ' ' + spaces;
        } else if (indent < prevIndent) {
            do {
                if (oldIndentStack.length === 0) {
                    // Inconsistent indentation, failure
                    return src;
                }
                prevIndent = oldIndentStack.pop();
                spaces = spacesStack.pop();
            } while (indent !== prevIndent);
        }
        
        lineArray[L] = spaces + lineArray[L].substr(indent);
    }

    src = lineArray.join('\n');

    return src;
}

/** Makes automated replacements to minimize the length of the program */
function minify(nanoSource, aggressive) {
    let pack = protectQuotedStrings(nanoSource);
    let s = pack[0];
    let protectionMap = pack[1];

    // Simple optimizations that don't affect readability tremendously

    //  Comments
    s = s.replace(/\/\/.*$|\/\*[\s\S]*\*\//gm, ''). 

        // Blank lines
        replace(/\n[ \t]*$/gm, '').

        // Trailing spaces
        replace(/[ \t]+$/gm, '').
         
        // Extra spaces around operators and separators. This may drive them
        // into 'for', 'while', etc, but that actually parses correctly.
        replace(/[ \t]*([▻◅!¬~⊕∪∩{}⌈⌉⌊⌋^%-/|*∊∈≤≥<>+≠≟=:,;.\[\]()])[ \t]*/g, '$1');

    // Use single-space indentation
    s = minify_indentation(s);

    // More aggressive optimizations that hurt readability
    if (aggressive) {

        let flowControl = /\b(if|while|with|for|fcn|loop|until|else|elif)\b/;
        
        // If two lines have the same indentation, the first does not contain a flow control
        // statement, and the second does not begin with a flow control statement, then they
        // can be merged to save the indentation. Allow repeated, overlapping collapses.
        let found = false;
        do {
            found = false;
            s = s.replace(/(\n +)(\S[^\n]*)\1(\S+)/g, function (match, indent1, line1, line2prefix) {
                if (line1.match(flowControl) || line2prefix.match(flowControl)) {
                    // Can't merge
                    return match;
                } else {
                    found = true;
                    // Mergable
                    return indent1 + line1 + ';' + line2prefix;
                }
            });
        } while (found);
        
        /*
        if (false) { // buggy!
            // For some reason this is pulling up cases where the third line is not in fact at
            // the level of indent 1
            
            // Pull up single-line loops
            s = s.replace(/(\n *)(for|while|until)[ \t]+([^(][^\n]*)\1 (\S.*)(\n *?|$)/g, function(match, indent1, loop, test, line2, indent3) {
                if (indent3.length <= indent1.length) {
                    return indent1 + loop + '(' + test + ')' + line2 + indent3;
                } else {
                    return match;
                }
            });
        }
        */
    } // if aggressive

    
    return unprotectQuotedStrings(s, protectionMap);
}

