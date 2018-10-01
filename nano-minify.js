/** Makes automated replacements to minimize the length of the program */
function minify(nanoSource, aggressive) {
    let pack = protectQuotedStrings(nanoSource);
    s = pack[0];
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

    // More aggressive optimizations that hurt readability
    if (false && aggressive) { // TODO: currently makes illegal transformations
        // If two lines have the same indentation and the first does not contain
        // a conditional flow control, AND the following line is indented no more,
        // then they can be merged to save the indentation.
        // Don't bother unless there is indentation.
        s = s.replace(/(\n +)([^ \n]+)\1(?=[^ \n])/g, function (match, indent1, line1) {
            if (line1.match(/\b(if|while|with|for|fcn|loop|until|else|elif)\b/)) {
                // Can't merge
                return match;
            } else {
                // Mergable
                return indent1 + line1 + ';';
            }
        });

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
    } // if aggressive

    
    return unprotectQuotedStrings(s, protectionMap);
}
