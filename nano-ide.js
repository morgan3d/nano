/* By Morgan McGuire @CasualEffects http://casual-effects.com GPL 3.0 License*/
function clamp(x, lo, hi) { return Math.min(Math.max(x, lo), hi); }

function afterImageLoad(url, callback) {
    var image = new Image();
    image.onload = function () { callback(image); };
    image.src = url;
}

var deployed = (location.href.substring(0, 8) !== 'file:///') && (location.href.indexOf('://localhost') === -1);

// The gif recording object, if in a recording
var gifRecording = null;

// Specified as HTML colors for convenience, but converted to ImageData format at the end of
// this script
var screenPalette = new Uint32Array(
    // PICO-8 ordering, with some colors replaced
    // by Dawnbringer-16 and a more pure white
    [0x000000, 0x201590, 0x7E2553, 0x008751,  // 00-03
     0x8d5432, 0x5E5B69, 0xD8D6D1, 0xFFFDFA,  // 04-07
     
     0xFF154A, 0xffaf15, 0xFFEC27, 0x7ce402,  // 08-11
     0x30AFFF, 0xA99FAD, 0xFF6889, 0xFFCCAC,  // 12-15
     // Supplemental colors
     0xbf0217, 0xd04648, 0xff6600, 0xd27d2c,  // 16-19
     0xd2aa94, 0xb5b333, 0x6daa2c, 0x346524,  // 20-23

     0x104510, 0x1becf4, 0x224edc, 0x4a2738,  // 24-27
     0x6c0daf, 0x9500fd, 0xdf0ac4, 0x303136]);// 28-31

/** The source code for the reset animation. This must compile to something where newlines can
    be replaced with semi-colons so that it can become a single JavaScript line after
    compilation. That is--do not split expressions across newlines in this nano source. */
var resetAnimationNanoSource = `#nanojam Reset,1
// flash at start
if(¬τ)clr=∅;for(i<7)cls(gray(⅗-⅙i));flip

// fade
v=(1-|¼²τ-1|)^¼

// rainbow
for(i<2⁷)x=64ξ;pset(x∩62,64ξ∩62,hsv(⅛²x,1,v*i∩1))

// logo
for(j<3)for(i<15)pset(38-i,30+j,gray(v*([8738,21845,21330]ⱼ▻i∩1)))
  
// hold black and then erase variables and end
if(τ>31)cls(clr=0);i=j=x=v=∅
τ%=40`;


var tests = {
    // Multiple single-line statements stacked up
    IF: `#nanojam IF,1
for x≤1
 if(0)1;if(2)3`,

    FOR: `#nanojam test,1
for 10<x<32
 pset(2x,32)`,

    rain: `#nanojam Rain,1
pal(j=2423221107)
K="εψNπqτ∞∅ξRw0∩∪⌉⊕αβδM5ΔθλμρσφωΩ{1"
for x<13
 h=hash(x+9)
 i=((¼³τ(7h+3)+70h)∩15)-11
 for y<11
  text(K[++j∩31],5x,62-6y,min(i+=½+½h,6))`,
    
    ping: `#nanojam PING
if(¬τ)p=32;f=2⁷
cls(12)
srand(4)
pal(c=40916071415)
J=joy.x
p=mid(3,p+¼J,59)
for x≤4⁵
 draw(91,8x,60,6655)
 k=⌊4ξ+1⌋;u=32x-τ⅒k+32;v=27+22sin(¼τ⅕)
 circ(u,v,8,21);circ(u+2,v-4,2,3)
 pal(c+202k);draw(48+p%2,p,52,5365,2(J<0))
 if(|u-p|+|v-52|<9)f--;if(¬f)wait;τ=0
text(f)`,
    
    sort: `#nanojam Sort,1
a=[1,10,3,5,2]
a.sort()
for i<a.len
 text(a[i],32,6i+2,1)`,
    
    hash: `for(i<64)line(i,64hash(⅒(i+τ)),i,64,1)`,

    variables: `a={β:6}
text(a["β"],10,4)
text(a.β,10,12)
text("hi".len,10,20)
text({x:1}.len,10,28)
text({x:1}.keys[0],10,36)`,

    runner: `#nanojam Runner
if(¬τ)clr=y=1;v=0
// background
circ(50,14,8,2)
for(i<64)line(i,20(hash(⌊⅕i+⅕²τ⌋)+1),i,64,3)

// ground height under character
h=50;//hash(⌊τ/64⌋)*32+32
rect(84-τ%96,h,64-τ%96,64,4)

// character
draw(|⅙τ∩3-2|*¬v,20,y-5,1)

// physics
y+=v+=⅒

// on ground
if(y≥h)y=h;v=-2joy.aa`,
    
    rgb: `#nanojam rgb,1
clr=∅
for x<64
 for y<64
  pset(x,y,hsv(x/63,y/63,1,x,y))`,
    
    input:`#nanojam input,1
clr=6
for i<2
 y=30i;j=padᵢ
 circ(44,22+y,4,14+j.a);circ(50,14+y,4,14+j.b)
 circ(30,16+y,2.7,14+j.s)
 line(15,16+y,15+6j.x,16+6j.y+y,1)`,
    
    spacedash: `#nanojam SPACE DASH
if(¬τ)x=32
// Game-over explosion
if(τ<0)pal(8+3ξ);circ(x,50,99+τ,19);cont

srand(5)
x=mid(9,x+2joy.x,54)
for u≤64
 // Stars
 s=3ξ;pset(u,(2⁸ξ+τs)%2⁸,5+s)
 // Enemy ships
 k=⌊2ξ+1⌋;v=τk-3⁸ξ;draw(5+14k,u,v,324,4);if(|x-u|+|v-50|<6)τ=-99

draw(3,x,50,641) // Player ship
circ(32,τ-9³,28) // End planet

// Victory screen
if(τ≥9³)text("YOU WIN");wait;τ=0`,

    text: `text("\`Hello, World!'", 32, 19, 6)
text("MICE WORLD", 32, 25, 6)
text("AB\\"CZabcz" + "foo", 32, 32, 6)
text("01 2x 39!,.-=+", 32, 38, 6)`,
    
    line: `#nanojam line,1
line(5,20,30,50,3)`,
    
    clock:`#nanojam clock,1
clr=1
c=31
circ(c,c,c,63)
line(c,c,22cos(⅒²τ)+c,22sin(⅒²τ)+c,4)
line(c,c,28cos(⅒τ)+c,28sin(⅒τ)+c,1)`,
    
    colorgrid: `#nanojam colorgrid,1
for(x<4)for(y<4)i=16x;j=16y;pal(x+4y);rect(i,j,i+15,j+15,1)`,

    sprite:`#nanojam sprite,1
for(x<8)draw(5,3.5,3.5+8x,3462,x,0)
draw(3,31.5,31.5,2345,0,τ/20)`,

    plasma: `#nanojam Plasma,1
for y<64
 for x<64
  ψ=y+τ;v=mid(noise(3,⅛²x,⅛²ψ,¼³τ)+½,0,1)
  pset(x,y,hsv(⅗v+½,(1-v)^⅗,v,x,ψ))`,

    plasma2:`#nanojam plasma2,1
clr=∅
for i<4096
 y=⌊64ξ⌋;x=⌊64ξ⌋
 ψ=y+τ;v=mid(noise(3,⅛²x,⅛²ψ,¼³τ)+½,0,1)
 pset(x,y,hsv(⅗v+½,(1-v)^⅗,v,x,ψ))`,

    nanoReset:resetAnimationNanoSource,
    
    nanoBoot:`#nanojam Boot,1
// rainbow
for a<2⁷
 y=max(0,τ-3hash(a)-2⁷)
 pset(cos(a)*y+32,sin(a)*y+32,hsv(⅛y))

// logo
for j<3
 for i<15
  pset(38-i,30+j,([8738,21845,21330]ⱼ▻i∩1)*gray(mid(1-τ/2⁸,0,1)*(τ/20-3|j-1|)))

// erase variables before main program
i=j=a=y=∅;clr=0
`
};

var initialSource =
    //tests.nanoBoot;
    //tests.nanoReset;
    //tests.rgb;
    //tests.text;
    //tests.spacedash;
    //tests.variables;
    //tests.runner;
    //tests.hash;
    //tests.plasma;
    //tests.sort;
    //tests.ping;
    //tests.IF;
    //tests.FOR;
    tests.input;
    //tests.colorgrid;


function getQueryString(field) {
    var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
    var string = reg.exec(location.href);
    return string ? string[1] : null;
}


function getImageData(image) {
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(image, 0, 0, image.width, image.height);
    return tempCtx.getImageData(0, 0, image.width, image.height);
}

/** Returns a 5-level grayscale Uint8Array of this data */
function getPixelData5(image) {
    var imageData = getImageData(image);

    // Extract and copy
    var N = imageData.data.length / 4;
    var pixelData = new Uint8Array(N);
    pixelData.width = image.width;
    pixelData.height = image.height;
    for (var i = 0; i < N; ++i) {
        var r = imageData.data[i * 4];
        // Convert red value to 0,1,2,3,4.
        var c = Math.round(0.12 + r / 64);

        pixelData[i] = c;
    }
    // Throw away the data used for conversion to an array
    tempCtx = tempCanvas = imageData = null;
    return pixelData;
}


var fontPixelData = null;
(function() {
    var fontSheetImage = new Image();
    fontSheetImage.onload = function () {
        fontPixelData = getPixelData5(fontSheetImage);
    };
    fontSheetImage.src = 'font.png';
})();


/** The sprite sheet. Always 128px wide. Currently 48px high. Shared with Runtime */
var spritePixelData = null;

afterImageLoad('sprites.png', function (spriteSheetImage) {
    // 8x8 sprites scaled up by 3x
    spritePixelData = getPixelData5(spriteSheetImage);
    // Draw on the display canvas
    var spritesDisplay = document.getElementById('spritesDisplay');
    spritesDisplay.width = spriteSheetImage.width * 3;
    spritesDisplay.height = spriteSheetImage.height * 3;
    spritesDisplay.style.width = spritesDisplay.width + 'px';
    spritesDisplay.style.height = spritesDisplay.height + 'px';
    spritesDisplay.onclick = onSpriteSelect;

    var sctx = spritesDisplay.getContext("2d");
    sctx.imageSmoothingEnabled = false;
    sctx.webkitImageSmoothingEnabled = false;
    sctx.drawImage(spriteSheetImage, 0, 0, spritesDisplay.width, spritesDisplay.height);
    sctx.strokeStyle = "#050";

    for (var x = 1; x < 16; ++x) {
        sctx.moveTo(x * 3 * 8, 0);
        sctx.lineTo(x * 3 * 8, spritesDisplay.height);
        sctx.stroke();
    }
    
    for (var y = 1; y < 6; ++y) {
        sctx.moveTo(0, y * 3 * 8);
        sctx.lineTo(spritesDisplay.width, y * 3 * 8);
        sctx.stroke();
    }
    
    setTimeout(redrawSelectedSprite, 500);
});

// For the sprite window
var selectedSpriteIndex = 0;

function onSpriteSelect(event) {
    // 8x8 sprites scaled up by 3x
    var x = clamp(Math.floor(event.offsetX / (3 * 8)), 0, 15);
    var y = clamp(Math.floor(event.offsetY / (3 * 8)), 0, 5);
    selectedSpriteIndex = x + y * 16;
    redrawSelectedSprite();
}


function rgb(r,g,b,x,y) {
    var dither = (y !== undefined);
    x |= 0; y |= 0;

    // Convert to 8-bit
    r = clamp((r * 256) | 0, 0, 255) | 0; g = clamp((g * 256) | 0, 0, 255) | 0; b = clamp((b * 256) | 0, 0, 255) | 0;
    var closestIndex = -1, secondClosestIndex = -1, colorDistance = 1000000, secondDistance = 100000;
    for (var i = screenPalette.length - 1; i >= 0; --i) {
        var c = screenPalette[i] | 0;
        var dist = squaredColorDistance(c & 0xff, (c >> 8) & 0xff, (c >> 16) & 0xff, r, g, b) | 0;
        
        if (dist < colorDistance) {
            secondDistance = colorDistance; secondClosestIndex = closestIndex;
            colorDistance = dist; closestIndex = i;
        } else if (dist < secondDistance) {
            secondDistance = dist; secondClosestIndex = i;
        }
    }

    // Dither closest and second closest when close.  Multiply by 3 and 2 to avoid
    // multiplying by 1.5 and becoming doubles. Use the closestIndex as a hash
    // for the dithering pattern to reduce the number of cases where two patterns
    // that have the same color in them misalign and end up with doubled pixels.
    if (dither && ((x ^ y ^ closestIndex) & 1) &&
        (((colorDistance * 3) | 0) > (secondDistance << 1))) {
        closestIndex = secondClosestIndex;
    }

    return closestIndex;
}


function redrawSelectedSprite() {
    var localPalette = [Runtime.TRANSPARENT, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    var swizzle = document.getElementById('spriteColormap').value;

    // Remove leading 0s so it doesn't parse as octal, and
    // convert NaNs back to zero
    colormap = parseInt(swizzle.replace(/^0+/, '')) || 0;
                        
    for (var slot = 0; slot < 4; ++slot) {
        var c = paletteToolCurrentPalette[0] = paletteToolCurrentPalette[colormap % 10];
        localPalette[4 - slot] = c;
        colormap = (colormap / 10) | 0;
    }

    // Choose a background color that isn't in the current palette so that
    // all colors will be mostly visible.
    var fill = 0;
    for (var i = 0; i < 6; ++i) {
        var ok = true;
        for (var j = 0; j < 7; ++j) {
            ok = ok &&  (paletteToolCurrentPalette[j] !== i);
        }
        if (ok) { fill = i; break; }
    }

    var pi = Math.PI;
    var special = [0, '0',
                   pi/2, '½π',
                   pi/3, '⅓π',
                   2*pi/3, '⅔π',
                   pi/4, '¼π',
                   3*pi/4, '¾π',
                   pi/5,'⅕π',
                   2*pi/5,'⅖π',
                   3*pi/5,'⅗π',
                   4*pi/5, '⅘π',
                   pi/6, '⅙π',
                   pi/7, '⅐π',
                   pi/8, '⅛π',
                   pi/9, '⅑π',
                   pi/10, '⅒π',
                   pi, 'π'];

    var xform = (document.getElementById('selectedSpriteDiagonalButton').checked ? 1 : 0) |
        (document.getElementById('selectedSpriteHorizontalButton').checked ? 2 : 0) |
        (document.getElementById('selectedSpriteVerticalButton').checked ? 4 : 0);
    var rot = document.getElementById('selectedSpriteAngle').value * pi / 180;

    // Snap to any nearby representable values for printing purposes,
    // and also snap the slider (only needed on Firefox)
    
    // Reduce the precision of rot to three decimal places for printing
    var rotStr = '' + (Math.round(rot * 1000) / 1000);
    // Remove optional leading zero
    if (rotStr.substring(0,2) === '0.') { rotStr = rotStr.substring(1); }
    
    for (var i = 0; i < special.length; i += 2) {
        if (Math.abs(special[i] - Math.abs(rot)) < 0.15) {
            rot = Math.sign(rot) * special[i];
            document.getElementById('selectedSpriteAngle').value = rot * 180 / pi;
            rotStr = ((rot < 0) ? '-' : '') + special[i + 1];
            break;
        }
    }
    
    if (Runtime && Runtime._draw && Runtime._spriteSheet) {
        var screen = new Uint8Array(64 * 64);
        screen.fill(fill, 0, screen.length);
        
        Runtime._draw(selectedSpriteIndex, 6, 6, localPalette, xform, rot, screen);
        
        // Expand the paletted image to RGB values
        // Overwrite the entire image for simplicity, even though we only need the upper 12x12
        var N = 64 * 64;
        for (var i = 0; i < N; ++i) {
            Runtime.updateImageDataUint32[i] = screenPalette[screen[i]];
        }

        // Copy screen to context (reusing the updateImage context from the main engine)
        updateImage.getContext('2d').putImageData(updateImageData, 0, 0);

        // Blit to the selectedSprite canvas, enlarging it as we go
        var selectedSprite = document.getElementById('selectedSprite');
        var sctx = selectedSprite.getContext('2d');
        sctx.imageSmoothingEnabled = false;
        sctx.webkitImageSmoothingEnabled = false;
        sctx.drawImage(updateImage, 0, 0, 14, 14, 4, 4, 14*4, 14*4);
    }

    var cmd = 'draw(' + selectedSpriteIndex + ',32,32';

    cmd += ',' + swizzle.replace(/^0+([^0])/, '$1');

    if (rotStr !== '0' || xform !== 0) {
        cmd += ',' + xform;
    }

    if (rotStr !== '0') {
        cmd += ',' + rotStr;
    }
    
    cmd += ')';
    
    document.getElementById('spriteCmd').value = cmd;
}


document.getElementById('selectedSpriteDiagonalButton').onclick = document.getElementById('selectedSpriteHorizontalButton').onclick = document.getElementById('selectedSpriteVerticalButton').onclick = redrawSelectedSprite;


function makeSymbolsWindow() {
    var chars =
`½⅓⅔¼¾⅕⅖⅗⅘⅙⅐⅛⅑⅒ %^*/-+ ;
επτ∞∅ξ αβδΔθλμρσφψωΩ {}
∩∪⊕~◅▻ ¬&X ⌊⌋|⌈⌉ ≟≠=≤≥<>
⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾
₀₁₂₃₄₅₆₇₈₉₊₋ₐᵦᵢⱼₓₖᵤₙ₍₎`;

    var tooltipTable = {
        '%': 'modulo',
        '^': 'exponent',
        '*': 'multiplication',
        '/': 'real division',
        '-': 'subtraction',
        '+': 'addition/string concatenation',
        ';': 'statement separator',
        'ε': 'small value',
        'π': 'constant 3.14...',
        'τ': 'integer time in frames',
        '∞': 'infinity',
        '∅': 'nil',
        'ξ': 'random',
        'α': 'variable',
        '{': 'begin table',
        '}': 'end table',
        '∩': 'bitwise and',
        '∪': 'bitwise or',
        '⊕': 'bitwise xor',
        '~': 'bitwise not',
        '◅': 'bit shift left',
        '▻': 'bit shift right',
        '¬': 'logical not',
        '&': 'logical and',
        'X': 'logical or',
        '⌊': 'floor',
        '|': 'absolute value',
        '⌈': 'ceiling',
        '≟': 'equals',
        '≠': 'not equal/logical xor',
        '=': 'assignment',
        '≤': 'compare',
        '⁰': 'exponent',
        '₀': 'array index'
    };
    var tooltip = 'fraction'
    var s = '';
    var line = 0;
    for (var i = 0; i < chars.length; ++i) {
        var c = chars[i];

        tooltip = tooltipTable[c] || tooltip;
        
        switch (c) {
        case '\n': s += '<br>'; ++line; break;
        case ' ': s += '<span style="display:inline-block;width:' + (line === 2 ? 8 : 12) + 'px"> </span>'; break;
        default:
            if (c === 'X') c = 'or';
            s += '<div onmousedown="event.stopPropagation()" class="button" title="' + tooltip + '" onclick="insertSymbol(\'' + c + '\')"><label><span class="label">' + c + '</span></label></div>';
        }
    }
    document.getElementById('keys').innerHTML = s ;
}

makeSymbolsWindow();

/** SymbolsWindow callback */
function insertSymbol(s) {
    editor.session.replace(editor.selection.getRange(), s);
    // Restore focus to the editor
    editor.focus();
}


var paletteToolCurrentPalette = [7, 7, 13, 0, 8, 10, 12, 255, 255, 32];

afterImageLoad('rainbow-selector.png', function (rainbowImage) {
    var rainbowImageData = getImageData(rainbowImage);
    
    // VERY approximate brightness on [0, 255]. c is in imageData format.
    function brightness(c) {
        return 0.3 * (c & 0xff) + 0.6 * ((c >> 8) & 0xff) + 0.1 * ((c >> 16) & 0xff);
    }
    
    var s = '';
    for (var i = 0; i < 32; ++i) {
        var c = imageDataToHTMLColorString(screenPalette[i]);
        s += '<div class="colorswatch draggable" draggable="true" onmousedown="event.stopPropagation()" ' +
            ' ondragstart="colorDragStart(event)" style="' +
            (i === 0 ? 'border-radius: 6px 0 0 0;' : '') +
            (i === 15 ? 'border-radius: 0 6px 0 0;' : '') +
            (brightness(screenPalette[i]) < 128 ? 'color:#fff;' : '') +
            'background:' + c + '">' + i + '</div>';
        if (i === 15) { s += '<br>'; }
    }

    s += '<div style="line-height:5px; margin-top:8px; overflow:hidden; height:90px">';
    for (var y = 0; y < rainbowImageData.height; ++y) {
        for (var x = 0; x < rainbowImageData.width; ++x) {
            var idx = (x + y * rainbowImageData.width) * 4;
            var r = rainbowImageData.data[idx], g = rainbowImageData.data[idx + 1], b = rainbowImageData.data[idx + 2];
            // Snap to nano colors
            var colorIndex = rgb(r / 255, g / 255, b / 255);
            var htmlColor = imageDataToHTMLColorString(screenPalette[colorIndex]);
            s += '<div class="tinycolorswatch draggable" draggable="true" onmousedown="event.stopPropagation()" ' +
            ' ondragstart="colorDragStart(event)" style="background:' + htmlColor + '"></div>';
        }
        if (y < rainbowImageData.height - 1) { s += '<br>'; }
    }
    s+= '</div>';

    s += '<div style="position: absolute; top: 166px; left: 40px"><span style="position:relative; top:4px">Palette</span> ';
    for (var i = 9; i >= 0; --i) {
        var style = '';
        if ((i >= 1) && (i < 7)) {
            var c = imageDataToHTMLColorString(screenPalette[paletteToolCurrentPalette[i]]);
            style = ' style = "background:' + c + '" '; 
        } else if (i === 9) {
            style = ' title="Transparent" ';
        } else if (i === 0) {
            style = ' title="Previous" ';
        } else {
            style = ' title="Reserved" ';
        }
        s += '<div class="paletteSlot" ondragover="event.preventDefault()" ' + ((i > 0 && i < 7) ? 'ondrop="colorDragDrop(event)"' : '') + ' id="paletteSlot' + i + '"' + style + '>' + i + '</div>';
    }
    s += '</div>';

    s += '<input type="text" class="cmd" id="palCmd" onmousedown="event.stopPropagation()" readonly="true">';
    document.getElementById('paletteTray').innerHTML = s;
    updatePaletteToolCmd();
});


function colorDragStart(event) {
    var swatch = event.target;

    // Pull the color off the RGB of the background.
    var color = parseColor(window.getComputedStyle(swatch, null).getPropertyValue("background-color"));

    // Needed for Firefox to render the component
    event.dataTransfer.setData('color', JSON.stringify(color));
}


function colorDragDrop(event) {
    var color = event.dataTransfer.getData('color');
    if (! color) { return; }
    color = JSON.parse(color);

    // Find closest nano color
    var colorIndex = rgb(color.r, color.g, color.b);

    event.target.style.background = 'rgb(' + (color.r * 255) + ', ' + (color.g * 255) + ', ' + (color.b * 255) + ')';

    var paletteSlotIndex = parseInt(event.target.innerText);
    paletteToolCurrentPalette[paletteSlotIndex] = colorIndex;
    updatePaletteToolCmd();
    redrawSelectedSprite();
}


function updatePaletteToolCmd() {
    var s = ')';
    for (var i = 1; i < 7; ++i) {
        var c = paletteToolCurrentPalette[i];
        s = c + s;
        if (c < 10) {
            s = '0' + s;
        }
    }
    s = s.replace(/^0+([^0])/, '$1');
    s = 'pal(' + s;
    document.getElementById('palCmd').value = s;
}


(function() {
    // Switch base palette HTML RGB format to ImageData little-endian ABGR format after the
    // palette GUI is constructed.
    for (var i = 0; i < screenPalette.length; ++i) {
        screenPalette[i] = htmlColorIntegerToImageData(screenPalette[i]);
    }
})();

//////////////////////////////////////////////////////////////////////////////////

function cartridgeDragStart(event) {
    // Needed for Firefox to render the component
    event.dataTransfer.setData('text/plain', null);
}


function cartridgeDragEnd(event) {
}

//////////////////////////////////////////////////////////////////////////////////

var DragLib = function() {
    return {
        move : function(element, xpos, ypos){
            element.style.left = xpos + 'px';
            element.style.top  = ypos + 'px';
        },
        
        startMoving : function(element, evt) {
            evt = evt || window.event;

            var container = element.parentNode;
            
            var x0 = element.offsetLeft,
                y0 = element.offsetTop,
                
                maxX = container.getBoundingClientRect().width - element.getBoundingClientRect().width,
                maxY = container.getBoundingClientRect().height - element.getBoundingClientRect().height;

            // Workaround for the container height returning low numbers for the body
            maxY = 1080;
            
	    container.style.cursor = 'move';

            // Initial click offset
            var diffX = evt.clientX - x0, diffY = evt.clientY - y0;
            
            document.onmousemove = function(evt) {
                evt = evt || window.event;
                DragLib.move(element,
                             Math.min(Math.max(evt.clientX - diffX, 0), maxX),
                             Math.min(Math.max(evt.clientY - diffY, 0), maxY));
            }
        },
        
        stopMoving : function(element) {
            element.parentNode.style.cursor = 'default';
            document.onmousemove = null;
        },
    }
}();

var screen = document.getElementById("screen");
var ctx = screen.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;

function onHelp(event) { window.open('doc/specification.md.html', '_blank'); }

function download(url, name) {
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        window.URL.revokeObjectURL(url);  
        document.body.removeChild(a);
    }, 0);
}


function getFilename(src) {
    var match = src.match(/^#nanojam[ \t]+(..+?)((?:,)([ \t]*\d+[ \t]*))?\n/);
    if (match) {
        // Clean up the title to be a reasonable filename
        return match[1].trim().replace(/ /g, '_').replace(/[:?"'&<>*|]/g, '') + '.nano';
    } else {
        return null;
    }
}


function onExportFile(event) {
    var src = editor.getValue();
    var filename = getFilename(src);
    if (filename) {
        // Convert unicode to a downloadable binary data URL
        download(window.URL.createObjectURL(new Blob(['\ufeff', src])), filename);
    } else {
        alert('The program must begin with #nanojam and a title before it can be exported');
    }
}

/** Callback for loading from local disk */
function onImportFile(event) {
    var file = event.target.files[0];

    var reader = new FileReader();
    reader.onload = function () {
	editor.setValue(reader.result);
        editor.gotoLine(1);
    };
    reader.readAsText(file);	
}


function onRestartButton() {
    onStopButton();
    onPlayButton();
}


var lastAnimationRequest = 0;
function onStopButton() {
    document.getElementById('stopButton').checked = 1;
    setControlEnable('pause', false);
    coroutine = null;
    mode = 'stop';
    cancelAnimationFrame(lastAnimationRequest);
    ctx.clearRect(0, 0, screen.width, screen.height);
}


function onPlayButton() {
    document.getElementById('playButton').checked = 1;
    setControlEnable('pause', true);
    
    setErrorStatus('');
    mode = 'play';
        
    if (! coroutine) {
        // Compile as needed
        var jsoutput = compile(editor.getValue());
        if (! deployed) { console.log(jsoutput); }
        if (jsoutput === null) {
            programNumLines = 0;
            onStopButton();
        } else {
            
            // Ready to execute. Reload the runtime and compile and launch
            // this code within it.
            programNumLines = jsoutput.split('\n').length;
            
            reloadRuntime(function () {
                // Create the function in the Runtime environment
                // so that it sees those variables.
                try {
                    coroutine = Runtime._makeCoroutine(jsoutput);
                    lastAnimationRequest = requestAnimationFrame(mainLoopStep);
                    emulatorKeyboardInput.focus();
                } catch (e) {
                    onStopButton();
                    setErrorStatus('line ' + (e.lineNumber ? clamp(1, e.lineNumber, programNumLines) : '?') + ': ' + e.message);
                    console.log(e);
                }
            });
        }
        
    } else {
        lastAnimationRequest = requestAnimationFrame(mainLoopStep);
        emulatorKeyboardInput.focus();
    }
}


function onPauseButton() {
    if (mode === 'play') {
        document.getElementById('pauseButton').checked = 1;
        mode = 'pause';
    }
}


function onDocumentKeyDown(event) {
    if ((event.which || event.keyCode) === 116) {
        // F5
        event.preventDefault();
        if (event.ctrlKey) {
            onPlayButton();
        } else if (! event.shiftKey) {
            onRestartButton();
        } else {
            onStopButton();
        }
    } else if ((event.which || event.keyCode) === 19) {
        // Ctrl+Break
        onPauseButton();
    }
}


document.addEventListener('keydown', onDocumentKeyDown);


var jsCode = document.getElementById('jsCode') && ace.edit(document.getElementById('jsCode'));
var editorStatusBar = document.getElementById('editorStatusBar');
var editor = ace.edit('editor');
editor.setTheme('ace/theme/tomorrow_night_bright');

var aceSession = editor.getSession();
aceSession.setTabSize(1);
aceSession.setUseSoftTabs(true);

// Hide the syntax parsing "errors" from misinterpreting the source as JavaScript
editor.session.setUseWorker(false);
aceSession.setMode('ace/mode/nano');
aceSession.setUseWrapMode(true);

function setSaved(s) {
    // TODO;
}

/** Makes automated replacements to minimize the length of the program */
function minify(nanoSource, aggressive) {
    // TODO: protect strings
    
    // Simple optimizations that don't affect readability tremendously
    var s = nanoSource.
        replace(/\/\/.*$|\/\*[\s\S]*\*\//gm, ''). // Comments
        replace(/\n[ \t]*$/gm, '').               // Blank lines
        replace(/[ \t]+$/gm, '').                 // Trailing spaces
        replace(/([,;.\[\]()])[ \t]*/g, '$1');    // Extra spaces after separators

    // More aggressive optimizations that hurt readability
    if (aggressive) {
        // If two lines have the same indentation and the first does not contain
        // a conditional flow control, then they can be merged to save the indentation.
        // Don't bother unless there is indentation.
        s = s.replace(/(\n +)([^ \n]+)\1(?=[^ \n])/g, function (match, indent1, line1) {
            if (line1.match(/\b(if|while|for|fcn|loop|until|else|elif)\b/)) {
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

    return s;
}


var minifyCheckbox = document.getElementById('minify');
var aggressiveCheckbox = document.getElementById('aggressive');

function countCharacters() {
    var str = editor.getValue();

    // Count characters
    var minStr = minifyCheckbox.checked ? minify(str, aggressiveCheckbox.checked) : str;

    // https://developer.twitter.com/en/docs/developer-utilities/twitter-text.html
    // Twitter double-counts certain unicode charactesr
    var twitter = minStr.replace(/([^\u0000-\u10FF\u2000-\u200D\u2010-\u201F\u2032-\u2037])/g, '$1X');

    var url = 'https://morgan3d.github.io/nano/index.html?code=' + LZString.compressToEncodedURIComponent(minStr);

    editorStatusBar.innerHTML = '<a target="_blank" href="' + window.URL.createObjectURL(new Blob(['\ufeff', minStr])) + '">' +
        minStr.length + ' chars</a> | ' +
        (twitter.length > 280 ? '<span style="color:#c00">' : '<span>') +
        twitter.length +
        '</span> / 280 Twitter | ' +
        '<a target="_blank" href="' + url + '">' + (url.length > 2048 ? '<span style="color:#c00">' : '<span>') + url.length + '</span> / 2048 url</a>';
}


editor.session.on('change', function () {
    // Strip any \r inserted by pasting on windows, replace any \t that
    // likewise snuck in. This is rare, so don't invoke setValue on every
    // keystroke.
    var src = editor.getValue();
    if (src.match(/\r|\t/)) {
        src = src.replace(/\r\n|\n\r/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '    ');
        editor.setValue(src);
    }
    src = null;
    
    countCharacters();
    setSaved(false);
});


if (jsCode) {
    jsCode.getSession().setUseWorker(false);
    jsCode.getSession().setMode('ace/mode/javascript');
    jsCode.setReadOnly(true);
    jsCode.getSession().setUseWrapMode(true);
}

var screenWidth = 64, screenHeight = 64;
var updateImage = document.createElement('canvas');
updateImage.width = screenWidth;
updateImage.height = screenHeight;

var updateImageData = ctx.createImageData(screenWidth, screenHeight);
var error = document.getElementById('error');

/** Returns javascript source or throws an exception */
function compile(src) {
    try {
        // Insert the nano reset sequence as a single line, so that line numbers are preserved
        var resetAnimation = nanoToJS(resetAnimationNanoSource, true).replace(/\n/g, ';');
        var code = resetAnimation + nanoToJS(src);
        if (jsCode) {
            jsCode.setValue(code);
            jsCode.gotoLine(1);
        }
        setErrorStatus('');
        return code;
    } catch (e) {
        setErrorStatus(e);
        console.log(e);
        if (jsCode) {
            jsCode.setValue(e);
            jsCode.gotoLine(1);
        }
        return null;
    }
}

// Set by compilation
var programNumLines = 0;

var mode = 'stop';

/** Returns non-false if the button whose name starts with ctrl is currently down. */
function pressed(ctrl) {
    return document.getElementById(ctrl + 'Button').checked;
}

/** Sets the visible enabled state of the button whose name starts with ctrl to e */
function setControlEnable(ctrl, e) {
    document.getElementById(ctrl + 'Button').disabled = ! e;

    var container = document.getElementById(ctrl + 'ButtonContainer');
    if (e) {
        container.classList.remove('disabled');
    } else {
        container.classList.add('disabled');
    }
}

/** Called by the IDE toggle buttons */
function onToggle(button) {
    var win = document.getElementById(button.id.replace('Button', 'Window'));
    if (win) {
        if (button.checked) { win.classList.remove('hidden'); }
        else                { win.classList.add('hidden'); }
    }
}


/** Called by the IDE radio buttons */
function onRadio() {
    if (pressed('play') && (mode !== 'play')) {
        onPlayButton();
    } else if (pressed('pause') && (mode === 'play')) {
        onPauseButton();
    } else if (pressed('stop') && (mode !== 'stop')) {
        onStopButton();
    }
}


function setErrorStatus(e) {
    error.innerHTML = e;
}


setControlEnable('pause', false);
var coroutine = null;

function mainLoopStep(time) {
    refreshPending = false;

    var endTime = time + 15;
    
    // Run the "infinite" loop for a while, maxing out at just under 1/60 of a second or when
    // the program explicitly requests a refresh via flip().
    try {
        while (! refreshPending && (performance.now() < endTime) && (mode === 'play') && coroutine) {
            coroutine.next();
        }
    } catch (e) {
        // Runtime error
        onStopButton();
        setErrorStatus('line ' + clamp(1, e.lineNumber, programNumLines) + ': ' + e.message);
        console.log(e);
    }

    // Keep the callback chain going
    if (mode === 'play') {
        lastAnimationRequest = requestAnimationFrame(mainLoopStep);
    }
}

/** When true, the system is waiting for a refresh to occur and mainLoopStep should yield
    as soon as possible. */
var refreshPending = false;

function reloadRuntime(oncomplete) {   
    Runtime.document.open();
    Runtime.document.write("<script src='nano-runtime.js' charset='utf-8'> </script>");
    Runtime.onload = function () {
        Runtime._screenPalette = screenPalette;
        Runtime._spriteSheet   = spritePixelData;
        Runtime._fontSheet     = fontPixelData;
        Runtime.rgb            = rgb;
        Runtime.updateImageDataUint32 = new Uint32Array(updateImageData.data.buffer);
        Runtime.submitFrame    = submitFrame;

        if (oncomplete) { oncomplete(); }
    };
    
    Runtime.document.close();

}


/************** Emulator event handling ******************************/
var emulatorKeyState = {};
var emulatorKeyJustPressed = {};

var screenshotKey = 117; // F6
var gifCaptureKey = 119; // F8

function onEmulatorKeyDown(event) {
    var key = event.which || event.keyCode;
    emulatorKeyState[key] = true;
    emulatorKeyJustPressed[key] = true;
    event.stopPropagation();
    event.preventDefault();

    if ((key === 116) || (key === 19)) {
        // Pass F5 and Ctrl-break to the IDE
        onDocumentKeyDown(event);  
    } if (key === screenshotKey) {
        // Screenshot
        download(screen.toDataURL(), 'screenshot.png');
    } else if (key == gifCaptureKey) {
        if (gifRecording) {
            // Save
            document.getElementById('recording').classList.add('hidden');
            gifRecording.render();
            gifRecording = null;
        } else {
            document.getElementById('recording').classList.remove('hidden');
            gifRecording = new GIF({workers:3, quality:30, width:screen.width, height:screen.height});
            gifRecording.frameNum = 0;
            gifRecording.on('finished', function (blob) {
                window.open(URL.createObjectURL(blob));
            });
        }
    }
}


function onEmulatorKeyUp(event) {
    emulatorKeyState[event.keyCode] = false;
    event.stopPropagation();
    event.preventDefault();
}

var emulatorKeyboardInput = document.getElementById('emulatorKeyboardInput');
emulatorKeyboardInput.addEventListener('keydown', onEmulatorKeyDown, true);
emulatorKeyboardInput.addEventListener('keyup', onEmulatorKeyUp, true);

/** Returns the ascii code of this character */
function ascii(x) { return x.charCodeAt(0); }

/** Used by submitFrame() to map axes and buttons to event key codes when sampling the keyboard controller */
var keyMap = [{'-x':[ascii('A'), 37],         '+x':[ascii('D'), 39],          '-y':[ascii('W'), 38], '+y':[ascii('S'), 40],          a:[ascii('Z'), 32],   b:[ascii('X'), 13], s:[ascii('1'), ascii('1')]},
              {'-x':[ascii('J'), ascii('J')], '+x':[ascii('L'), ascii('L')],  '-y':[ascii('I')],     '+y':[ascii('K'), ascii('K')],  a:[ascii('G'), 186],  b:[ascii('H'), ascii('.')], s:[ascii('7'), ascii('7')]}];

var prevRealGamepadState = [];

function getIdealGamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    var gamepadArray = [];
    // Center of gamepad
    var deadZone = 0.2;
    
    // Compact gamepads array and perform thresholding
    for (var i = 0; i < gamepads.length; ++i) {
        var pad = gamepads[i];
        if (pad) {
            var mypad = {axes:[0, 0], buttons:[false, false]};
            for (var a = 0; a < 2; ++a) {
                mypad.axes[a] = (Math.abs(pad.axes[a]) > deadZone) ? Math.sign(pad.axes[a]) : 0;
            }

            // A and B
            for (var b = 0; b < 2; ++b) {
                var but = pad.buttons[b];
                mypad.buttons[b] = (typeof(but) === "object") ? but.pressed : (but > 0.5);
            }

            // Start
            var but = pad.buttons[9];
            mypad.buttons[9] = (typeof(but) === "object") ? but.pressed : (but > 0.5);

            gamepadArray.push(mypad);
            
            if (gamepadArray.length > prevRealGamepadState.length) {
                prevRealGamepadState.push({axes:[0, 0], buttons:[false, false, //0-2
                                                                 undefined, undefined, undefined, undefined, undefined, undefined, // 3-8
                                                                 false // 9
                                                                ]});
            }
        }
    }
    
    return gamepadArray;
}


function submitFrame() {
    // Update the image
    updateImage.getContext('2d').putImageData(updateImageData, 0, 0);
    ctx.drawImage(updateImage, 0, 0, screen.width, screen.height);

    if (gifRecording) {
        // Only record alternating frames to reduce file size
        if (gifRecording.frameNum & 1) {
            gifRecording.addFrame(ctx, {delay: 1000/30, copy: true});
        }
        ++gifRecording.frameNum;
        if (gifRecording.frameNum > 60*8) {
            // Stop after 8 seconds
            document.getElementById('recording').classList.add('hidden');
            gifRecording.render();
            gifRecording = null;
        }
    }
    
    refreshPending = true;

    var axes = 'xy', buttons = 'abs';

    // HTML gamepad indices of corresponding elements of the buttons array
    var buttonIndex = [0, 1, 9];
    
    var gamepadArray = getIdealGamepads();
    
    // Sample the keys
    for (var player = 0; player < 2; ++player) {
        var map = keyMap[player], pad = Runtime.pad[player],
            realGamepad = gamepadArray[player], prevRealGamepad = prevRealGamepadState[player];

        for (var a = 0; a < axes.length; ++a) {
            var axis = axes[a];
            var pos = '+' + axis, neg = '-' + axis;
            var n0 = map[neg][0], n1 = map[neg][1], p0 = map[pos][0], p1 = map[pos][1];

            // Current state
            pad[axis] = (((emulatorKeyState[n0] || emulatorKeyState[n1]) ? -1 : 0) +
                         ((emulatorKeyState[p0] || emulatorKeyState[p1]) ? +1 : 0));

            // Just pressed
            pad[axis + axis] = (((emulatorKeyJustPressed[n0] || emulatorKeyJustPressed[n1]) ? -1 : 0) +
                                ((emulatorKeyJustPressed[p0] || emulatorKeyJustPressed[p1]) ? +1 : 0));
            
            if (realGamepad && (realGamepad.axes[a] !== 0)) { pad[axis] = realGamepad.axes[a]; }
            if (realGamepad && (prevRealGamepad.axes[a] !== realGamepad.axes[a])) { pad[axis + axis] = realGamepad.axes[a]; }
        }

        for (var b = 0; b < buttons.length; ++b) {
            var button = buttons[b];
            var b0 = map[button][0], b1 = map[button][1];
            pad[button] = (emulatorKeyState[b0] || emulatorKeyState[b1]) ? 1 : 0;
            pad[button + button] = (emulatorKeyJustPressed[b0] || emulatorKeyJustPressed[b1]) ? 1 : 0;

            var i = buttonIndex[b];
            if (realGamepad && realGamepad.buttons[i]) { pad[button] = true; }
            if (realGamepad && realGamepad.buttons[i] && ! prevRealGamepad.buttons[i]) { pad[button + button] = true; }
        }

        // Update old state
        if (realGamepad) {
            prevRealGamepadState[player] = realGamepad;
        }
    }

    // Reset the just-pressed state
    emulatorKeyJustPressed = {};
}


setTimeout(function () {
    reloadRuntime();
}, 0);

var emulatorButtonState = {};
    
(function() {
    if (deployed) { initialSource = tests.spacedash; }

    // Code has been specified to the emulator; start with it and push the start button
    var code = getQueryString('code');
    if (code) {
        initialSource = LZString.decompressFromEncodedURIComponent(code);
        setTimeout(onPlayButton, 750);
    }
    
    editor.setValue(initialSource);
    editor.gotoLine(1);

    var buttons = 'WASD1ZX';
    for (var i = 0; i < buttons.length; ++i) {
        var b = buttons[i];
        var buttonElement = document.getElementById(b + 'button');
        buttonElement.onmousedown = buttonElement.ontouchstart = (function(b) {
            return function (event) {
                if (! emulatorButtonState[b]) {
                    // fake an event
                    onEmulatorKeyDown({keyCode:ascii(b), stopPropagation:Math.abs, preventDefault:Math.abs});
                }
                emulatorButtonState[b] = 1;
                event.preventDefault();
                event.stopPropagation();
            };
        })(b);

        buttonElement.onmouseenter = buttonElement.onmousemove = (function(b) {
            return function (event) {
                if (event.buttons !== 0) {
                    if (! emulatorButtonState[b]) {
                        // fake an event
                        onEmulatorKeyDown({keyCode:ascii(b), stopPropagation:Math.abs, preventDefault:Math.abs});
                    }
                    emulatorButtonState[b] = 1;
                }
            };
        })(b);

        buttonElement.onmouseup = buttonElement.onmouseleave = buttonElement.ontouchend = (function(b) {
            return function (event) {
                if (emulatorButtonState[b]) {
                    // fake an event
                    onEmulatorKeyUp({keyCode:ascii(b), stopPropagation:Math.abs, preventDefault:Math.abs});
                }
                emulatorButtonState[b] = 0;
                event.preventDefault();
                event.stopPropagation();
            };
        })(b);
}
    
})();

///////////////////////////////////////////////////////////////////////////////////////
//
// Google Drive / OAuth 2.0 API Wrapper
//
// This implementation uses the Drive client API v2 because I couldn't get v3 to work.  It is
// intentionally restricted to the hidden appDataFolder for nano JAMMER so that it requires
// reduced permissions AND because that was the only way I could find to efficiently find only
// nano carts.
//

function onSaveToGoogleDrive() {
    var src = editor.getValue();
    var filename = getFilename(src);
    if (filename) {
        googleDriveSaveTextFile(filename, src);
    } else {
        alert('The program must begin with #nanojam and a title before it can be saved to Google Drive');
    }
}


function onListGoogleDrive() {
    googleDriveRetrieveAllFiles(function(files) {
        console.log(files);
        
        googleDriveGetTextFile(files[0].id, function(contents) {
            console.log(contents);
        });
    });
}

/**
  Retrieve a list of File resources.

 Based on https://developers.google.com/drive/v2/reference/files/list
 */
function googleDriveRetrieveAllFiles(callback) {
   gapi.client.drive.files.list({
       spaces: 'appDataFolder', // set this to 'drive' if you don't want to be restricted to the appDataFolder
       fields: 'nextPageToken, items(id, title)',
       pageSize: 100
   }).then(function(data) {
       callback(data.result.items);
   });
}

/**
   Invokes the callback with the text file's contents, or null if
   there was an error.

   You can get the ID from googleDriveRetrieveAllFiles.
   https://developers.google.com/drive/v2/reference/files/get
 */
function googleDriveGetTextFile(fileId, callback) {
    var request = gapi.client.drive.files.get({
        'fileId': fileId,
    });
    
    request.execute(function (file) {
        if (file.downloadUrl) {
            var accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.downloadUrl);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function() {
                callback(xhr.responseText);
            };
            
            xhr.onerror = function() {
                callback(null);
            };
            
            xhr.send();
        } else {
            callback(null);
        }
    });
}


/** https://developers.google.com/drive/v2/reference/files/trash */
function googleDriveDeleteFile(fileId) {
    var request = gapi.client.drive.files.trash({
        'fileId': fileId
    });
    request.execute(function(resp) { });
}


/** Save to Google Drive.
    Based on https://developers.google.com/drive/v2/reference/files/insert  */
function googleDriveSaveTextFile(fileName, fileContents, callback) {
    const boundary = '-------X314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    if (fileContents.indexOf(boundary) !== -1) {
        // The source is trying to hack the transfer protocol
        throw "File contains boundary!";
    }
    
    var contentType = 'text/plain';
    var metadata = {
        'title': fileName,
        'mimeType': contentType,
        'parents': [{id:'appDataFolder'}]
    };

    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        '\r\n' +
        fileContents +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});

    if (! callback) {
        // Create a dummy callback
        callback = function(file) { console.log(file)  };
    }
    
    request.execute(callback);
}



// The following are based on:
// https://github.com/google/google-api-javascript-client/blob/master/samples/authSample.html

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}


function handleClientLoad() {
    // Load the API client and auth2 library
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.load('client', function() {
        // Initialize the JavaScript client library.
        gapi.client.init({
            'apiKey': 'AIzaSyAlRiTht5T9CLtYAQhFnZGdgtqmSvD_Js0',
            'clientId': '442588265355-cv3vd67iv8c79ckfsm3m8vbgfl6pr104.apps.googleusercontent.com',
            'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/drive/v2/rest'],
            //'scope': 'https://www.googleapis.com/auth/drive.file',
            'scope': 'https://www.googleapis.com/auth/drive.appfolder'
        }).then(function () {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        });
    });
}
