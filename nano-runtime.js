/* By Morgan McGuire @CasualEffects http://casual-effects.com GPL 3.0 License */

// Variables named with a leading underscore are illegal in nano and will therefore not be
// visible to the program.

var _SCREEN_WIDTH_BITS, _SCREEN_WIDTH, _SCREEN_HEIGHT, _BAR_HEIGHT, _BAR_SPACING, _FRAMEBUFFER_HEIGHT;
var _Math = Math;

////////////////////////////////////////////////////////////////////
// Array

Object.defineProperty(Array.prototype, 'len',
                      { configurable: true,
                        get: function () {  return this.length;  },
                        set: function (n) { this.length = n;  }});

/** Used by code emitted from the `with` statement */
Object.prototype.assignFields = function(dst, src, fields) {
    for (var i = fields.length - 1; i >= 0; ++i) {
        var f = fields[i];
        dst[f] = src[f];
    }
    return dst;
}


function _arrayKill(i) {
    if (typeof i !== 'number') { throw 'Array.kill called with a value (' + i + ') that is not a number'; }
    let L = this.length;
    this[i] = this[L - 1];
    this.length = L - 1;
}

function _arrayDel(i) {
    if (typeof i !== 'number') { throw 'Array.del called with a value (' + i + ') that is not a number'; }
    this.splice(i, 1);
}

function _arrayRem(x) {
    let L = this.length;
    for (let i = 0; i < L; ++i) {
        if (this[i] === x) {
            this.splice(i, 1);
            return;
        }
    }
    // fail silently
}

function _arrayFind(x, s) {
    s = s || 0;
    for (let i = s; i < this.length; ++i) {
        if (this[i] === x) { return i; }
    }
    return undefined;
}

function _arrayAdd(x) {
    this.push(x);
}

function _greaterThan(a, b) {
    return a > b;
}

function _arraySort(k) {
    var compare = undefined;
    if (k === undefined) {
        if (typeof this[0] === 'object') {
            // find the first property, alphabetically
            var entries = Object.entries(this[0]);
            entries.sort(function(a, b) { return a[0]-b[0]; });
            k = entries[0][0];
            compare = function (a, b) { return a[k]-b[k]; };
        } else {
            compare = function (a, b) {return a-b};
        }
    } else {
        compare = function (a, b) { return a[k]-b[k]; };
    }

    this.sort(compare);
}


Object.defineProperty(Array.prototype, 'rem',
                      { configurable: true,
                        get: function () {  return _arrayRem;  }});

Object.defineProperty(Array.prototype, 'kill',
                      { configurable: true,
                        get: function () {  return _arrayKill;  }});

Object.defineProperty(Array.prototype, 'del',
                      { configurable: true,
                        get: function () {  return _arrayDel;  }});

Object.defineProperty(Array.prototype, 'find',
                      { configurable: true,
                        get: function () {  return _arrayFind;  }});

Object.defineProperty(Array.prototype, 'add',
                      { configurable: true,
                        get: function () {  return _arrayAdd;  }});

Object.defineProperty(Array.prototype, '_sort',
                      { configurable: true,
                        get: function () {  return _arraySort;  }});

/////////////////////////////////////////////////////////////////////
//
// Table

Object.defineProperty(Object.prototype, 'len',
                      { configurable: true,
                        get: function () { return Object.keys(this).length; }});

Object.defineProperty(Object.prototype, 'keys',
                      { configurable: true,
                        get: function () { return Object.keys(this); }});

function _tableRem(key) { delete this[key]; }

Object.defineProperty(Object.prototype, 'rem',
                      { configurable: true,
                        get: function () { return _tableRem; }});


/////////////////////////////////////////////////////////////////////
//
// String

Object.defineProperty(String.prototype, 'len',
                      { configurable: true,
                        get: function () { return this.length; }});

function _stringFind(x, s) {
    var i = this.indexOf(x, s);
    return (i === -1) ? undefined : i;
}

Object.defineProperty(String.prototype, 'find',
                      { configurable: true,
                        get: function () { return _stringFind; }});

// Override the default string's deprecated "sub", which meant <sub>x</sub> (!)
String.prototype.sub = String.prototype.substring;

//////////////////////////////////////////////////////////////////////
//
// Function

function call(f) {
    return Function.call.apply(f, arguments);
}

//////////////////////////////////////////////////////////////////////

/** Set by the IDE. A view onto the imagedata */
var _updateImageDataUint32;

/** Set by reloadRuntime(). 128x32 Uint8 array */
var _spriteSheet = null;

/** Set by reloadRuntime(). 128x23 Uint8 array */
var _fontSheet = null;

/** Callback to show the screen buffer and yield to the browser. Set by
    reloadRuntime() */
var _submitFrame = null;

// Scissor (clipping) region
var _clipY1 = 0, _clipY2 = _SCREEN_HEIGHT - 1, _clipX1 = 0, _clipX2 = _SCREEN_WIDTH - 1;

// Draw call offset
var _offsetX = 0, _offsetY = 0, _scaleX = 1, _scaleY = 1;


function xform(addX, addY, scaleX, scaleY) {
    if (addX === undefined) {
        addX = 0; addY = 0;
        scaleX = 1; scaleY = 1;
    }
    
    _offsetX = addX;
    _offsetY = _BAR_HEIGHT + _BAR_SPACING + addY;

    _scaleX = (scaleX === -1) ? -1 : +1;
    _scaleY = (scaleY === -1) ? -1 : +1;
}


function clip(x1,y1,x2,y2) {
    var yShift = _BAR_SPACING + _BAR_HEIGHT;
    if (x1 === undefined) {
        if (y1 === undefined && x2 === undefined && y2 === undefined) {
            // No arguments
            x1 = 0; y1 = 0; x2 = _SCREEN_WIDTH - 1; y2 = _SCREEN_HEIGHT - 1;
        } else {
            x1 = _clipX1;
        }
    }
    
    if (y1 === undefined) { y1 = _clipY1 - yShift; }

    if (x2 === undefined) { x2 = _clipX2; }
    if (y2 === undefined) { y2 = _clipY2 - yShift; }

    x1 = Math.round(x1) | 0;
    y1 = Math.round(y1 + yShift) | 0;
    x2 = Math.round(x2) | 0;
    y2 = Math.round(y2 + yShift) | 0;

    _clipX1 = _clamp(Math.min(x1, x2), 0, _SCREEN_WIDTH - 1);
    _clipY1 = _clamp(Math.min(y1, y2), 0, _FRAMEBUFFER_HEIGHT - 1);
    
    _clipX2 = _clamp(Math.max(x1, x2), 0, _SCREEN_WIDTH - 1);
    _clipY2 = _clamp(Math.max(y1, y2), 0, _FRAMEBUFFER_HEIGHT - 1);
}


function abs(x) {
    return (x.length !== undefined) ? x.length : Math.abs(x);
}

var max = Math.max;
var min = Math.min;
var flr = Math.floor;
var ceil = Math.ceil;
var round = Math.round;
var pow = Math.pow;
var sin = Math.sin;
var cos = Math.cos;
var acos = Math.acos;
var asin = Math.asin;
var atan = Math.atan2;
var log = Math.log;
var sgn = Math.sign;
var sqrt = Math.sqrt;
var exp = Math.exp;

/** Actual colors available for nano as ARGB little-endian encoded data in a Uint32Array. Set
    by reloadRuntime() */
var _screenPalette;

/** Each pixel is one value in the _screenPalette */
var _screen;

var TRANSPARENT = 32;

// The initial "default"/"previous" color is stored directly in slot [0]
var _initialPalette = [7, 7, 13, 0, 8, 10, 12, 11, 29, TRANSPARENT];

/** Current subset of the fixed _screenPalette available, by index. Set by pal().

    0 = previous
    1-8 = configurable
    9 = transparent
 */
var _drawPalette = new Uint8Array(_initialPalette);
_drawPalette[0] = _initialPalette[0];

var _fontWidth = {'!':1, '|':1, '.':1, 'i':1, 'I':1, 'l':1, 'ⁱ':1, 'ᵢ':1,
                 ' ':2, ',':2, ';':2, '[':2, ']':2, '`':2, '\'':2, '(':2, ')':2, 'f':2, '⌊':2, '⌋':2, '⌈':2, '⌉':2, '¹':2, 'ʲ':2, '⁽':2, '⁾':2, '₁':2, 'ⱼ':2, '₍':2, '₎':2};

/** Maps characters to x,y coordinates in the _fontSheet  */
var _fontMap = (function(){
 var f = `ABCDEFGHIJKLMNOPQRSTUVWXY
abcdefghijklmnopqrstuvwxy
0123456789~!@#$%^&*()_+-=
{}[]\\/|;:\`'",.?<>Zzεπτ∞∅ξ
βδΔθλμρσϕψΩ∩∪◅▻¬⌊⌋⌈⌉≟≠≤≥∊
⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ᵃᵝⁱʲˣᵏᵘⁿ⁽⁾
₀₁₂₃₄₅₆₇₈₉₊₋ₐᵦᵢⱼₓₖᵤₙ₍₎`;

    var map = {};
    for (var i = 0, x = 0, y = 0; i < f.length; ++i, ++x) {
        var c = f[i];
        if (c === '\n') { // newline resets
            x = -1; ++y;
        } else if (c !== ' ') { // skip spaces
            map[c] = {x:x*5, y:y*8};
        }
    }
    map['⊕'] = map['φ'] = map['ϕ'];
    map['α'] = map['a'];
    map['ω'] = map['w'];
    map['∈'] = map['∊'];
    map['ι'] = map['i'];
    map['χ'] = map['χ'];
    map['η'] = map['n'];
    map['ζ'] = map['C'];
    map['γ'] = map['y'];
    
    return Object.freeze(map);
})();


var clr = 0;
var joy = Object.seal({x:0, y:0, θ:0, a:0, b:0, c:0, d:0, s:0, aa:0, bb:0, cc:0, dd:0, ss:0});
var pad = [joy, Object.seal({x:0, y:0, θ:0, a:0, b:0, c:0, d:0, s:0, aa:0, bb:0, cc:0, dd:0, ss:0})];

var hashview = new DataView(new ArrayBuffer(8));

function _hash(d) {
    // 32-bit FNV-1a
    var hval = 0x811c9dc5;
    
    if (d.length) {
        // String
        for (var i = d.length - 1; i >= 0; --i) {
            hval ^= d.charCodeAt(i);
            hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
        }
    } else {
        // Number
        hashview.setFloat64(0, d);
        for (var i = 7; i >= 0; --i) {
            hval ^= hashview.getUint8(i);
            hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
        }

        // Near integers, FNV sometimes does a bad job because it doesn't
        // mix the low bits enough. XOR with some well-distributed
        // bits
        hval ^= (_fract(Math.sin(d * 10) * 1e6) * 0xffffffff) | 0;
    }
    
    // Force to unsigned 32-bit
    return (hval >>> 0);
}


function hash(x, y) {
    var h = _hash(x);
    if (y !== undefined) {
        var hy = _hash(y);
        h ^= ((hy >> 16) & 0xffff) | ((hy & 0xffff) << 16);
    }
    
    return Math.abs(h) / 0xffffffff;
}

function _lerp(a,b,t) { return a * (1 - t) + b * t; }

var lerp = _lerp;

// Fast 1D "hash" used by noise()
function _nhash1(n) { n = Math.sin(n) * 1e4; return n - Math.floor(n); }

// bicubic fbm value noise
// from https://www.shadertoy.com/view/4dS3Wd
function noise(octaves, x, y, z) {
    // Set any missing axis to zero
    x = x || 0;
    y = y || 0;
    z = z || 0;

    // Maximum value is 1/2 + 1/4 + 1/8 ... from the straight summation
    // The max is always pow(2,-octaves) less than 1.
    // So, divide by (1-pow(2,-octaves))
    octaves = Math.max(1, (octaves || 1) | 0);
    var v = 0, k = 1 / (1 - Math.pow(2, -octaves));

    var stepx = 110, stepy = 241, stepz = 171;
    
    for (; octaves > 0; --octaves) {
        
        var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        var fx = x - ix,        fy = y - iy,        fz = z - iz;
 
        // For performance, compute the base input to a 1D hash from the integer part of the argument and the 
        // incremental change to the 1D based on the 3D -> 1D wrapping
        var n = ix * stepx + iy * stepy + iz * stepz;

        var ux = fx * fx * (3 - 2 * fx),
            uy = fy * fy * (3 - 2 * fy),
            uz = fz * fz * (3 - 2 * fz);

        v += (_lerp(_lerp(_lerp(_nhash1(n), _nhash1(n + stepx), ux),
                          _lerp(_nhash1(n + stepy), _nhash1(n + stepx + stepy), ux), uy),
                    _lerp(_lerp(_nhash1(n + stepz), _nhash1(n + stepx + stepz), ux),
                          _lerp(_nhash1(n + stepy + stepz), _nhash1(n + stepx + stepy + stepz), ux), uy), uz) - 0.5) * k;

        // Grab successive octaves from very different parts of the space, and
        // double the frequency
        x = 2 * x + 109;
        y = 2 * y + 31;
        z = 2 * z + 57;
        k *= 0.5;
    }
    
    return v;
}


function pal(p) {
    // Note that slot 0 is preserved
    if (p === undefined) {
        // Reset to the initial palette
        for (var i = 1; i < _drawPalette.length; ++i) {
            _drawPalette[i] = _initialPalette[i];
        }
    } else {
        for (var i = 1; i <= 8; ++i) {
            _drawPalette[i] = (p % 100) & 31;
            p /= 100;
        }
    }
}

function _noop() {}


function vec(x, y, z, w) {
    if (w !== undefined) {
        return Object.seal({x:x, y:y, z:z, w:w})
    } else if (z !== undefined) {
        return Object.seal({x:x, y:y, z:z})
    } else {
        return Object.seal({x:x, y:y})
    }
}


function xy(x, y) {
    return Object.seal({x:x, y:y});
}


function xyz(x, y, z) {
    return Object.seal({x:x, y:y, z:z});
}


function overlap(A, B) {
    return ((Math.abs(A.pos.x - B.pos.x) <= (A.ext.x + B.ext.x)) &&
            (Math.abs(A.pos.y - B.pos.y) <= (A.ext.y + B.ext.y)));
}


function mid(a, b, c) {
    if (a < b) {
        if (b < c) {
            // a < b < c
            return b;
        } else if (a < c) {
            // a < c <= b
            return c;
        } else {
            // c <= a < b
            return a;
        }
    } else if (a < c) {
        return a;
    } else if (b < c) {
        // b < c <= a
        return c;
    } else {
        return b;
    }
}

function _lerp(x, y, a) { return (1 - a) * x + a * y; }
function _clamp(x, lo, hi) { return Math.min(Math.max(x, lo), hi); }
function _fract(x) { return x - Math.floor(x); }
function _square(x) { return x * x; }
               
function hsv(h,s,v,x,y) {
    if (v === undefined) { v = 1; }
    if (s === undefined) { s = 1; }
    s = _clamp(s, 0, 1); v = _clamp(v, 0, 1);

    // Convert to RGB
    var r = v * (1 - s + s * _clamp(Math.abs(_fract(h + 1.0) * 6 - 3) - 1, 0, 1));
    var g = v * (1 - s + s * _clamp(Math.abs(_fract(h + 2/3) * 6 - 3) - 1, 0, 1));
    var b = v * (1 - s + s * _clamp(Math.abs(_fract(h + 1/3) * 6 - 3) - 1, 0, 1));

    return rgb(r,g,b,x,y);
}


function gray(v,x,y) {
    return rgb(v,v,v,x,y);
}

// Set by reloadRuntime
var rgb;

/** Converts the first decimal digit of a colormap to a screen color and sets
    the drawPalette 0 value based on it */
function colormapToColor(colormap) {
    return _drawPalette[0] = _drawPalette[colormap % 10];
}

function tri(Ax, Ay, Bx, By, Cx, Cy, colormap) {
    Ax = Ax * _scaleX + _offsetX; Ay = Ay * _scaleY + _offsetY;
    Bx = Bx * _scaleX + _offsetX; By = By * _scaleY + _offsetY;
    Cx = Cx * _scaleX + _offsetX; Cy = Cy * _scaleY + _offsetY;
    
    colormap |= 0;
    // Extract the fill color, which is not yet used in this implementation
    var fill = colormapToColor(colormap); colormap = (colormap / 10) | 0;
    var border = colormapToColor(colormap);

    // Culling optimization
    if ((Math.min(Ax, Bx, Cx) > _clipX2 + 0.5) || (Math.min(Ay, By, Cy) > _clipY2 + 0.5) ||
        (Math.max(Ax, Bx, Cx) < _clipX1 - 0.5) || (Math.max(Ay, By, Cy) < _clipY1 - 0.5)) {
        return;
    }

    // Fill
    if (fill !== TRANSPARENT) {
        var shift = ((border !== TRANSPARENT) && (border !== fill)) ? 0.5 : 0;
        
        // For each non-horizontal edge, store:
        //
        //    [startX, startY, dx/dy slope, vertical height].
        //
        // These are the values needed for the edge-intersection test.  Add edges so that the
        // start Y coordinate is less than the end one.
        var edgeArray = [];        
        var y0 = _clipY2 + 1, y1 = _clipY1 - 1;
        function addEdge(Sx, Sy, Ex, Ey) {
            if (Sy < Ey) {
                // Update bounding box
                if (Sy < y0) { y0 = Sy; }
                if (Ey > y1) { y1 = Ey; }
                edgeArray.push([Sx, Sy, (Ex - Sx) / (Ey - Sy), Ey - Sy]);
            } else if (Sy > Ey) {
                addEdge(Ex, Ey, Sx, Sy);
            }
        }
        
        addEdge(Ax, Ay, Bx, By);
        addEdge(Bx, By, Cx, Cy);
        addEdge(Cx, Cy, Ax, Ay);

        // Intentionally left as a float to avoid float to int conversion for the inner loop
        y0 = Math.max(_clipY1, Math.floor(y0));
        y1 = Math.min(_clipY2, Math.floor(y1));
        for (let y = y0; y <= y1; ++y) {
            // For this scanline, intersect the edge lines of the triangle.
            // As a convex polygon, we can simply intersect ALL edges and then
            // take the min and max intersections.
            let x0 = Infinity, x1 = -Infinity;
            for (let i = edgeArray.length - 1; i >= 0; --i) {
                let seg = edgeArray[i];
                
                let ry = y - seg[1];
                if ((ry >= 0) && (ry < seg[3])) {
                    let x = seg[0] + ry * seg[2];
                    if (x < x0) { x0 = x; }
                    if (x > x1) { x1 = x; }
                }
            }

            if ((x0 <= _clipX2) && (x1 >= _clipX1)) {
                _screen.fill(fill,
                             (Math.max(Math.round(x0 + shift) << 0, _clipX1) + (y << _SCREEN_WIDTH_BITS)) | 0,
                             (Math.min(Math.round(x1 - shift) << 0, _clipX2) + (y << _SCREEN_WIDTH_BITS) + 1) | 0);
            }
        }
    }
    
    if ((border !== TRANSPARENT) && (border !== fill)) {
        line(Ax, Ay, Bx, By, colormap);
        line(Bx, By, Cx, Cy, colormap);
        line(Cx, Cy, Ax, Ay, colormap);
    }

}


function circ(x, y, radius, colormap) {
    x = x * _scaleX + _offsetX; y = y * _scaleY + _offsetY;
    colormap |= 0;
    radius = Math.round(radius) | 0;
    var fill = colormapToColor(colormap); colormap = (colormap / 10) | 0;
    var border = colormapToColor(colormap);

    // Culling optimization
    if ((x - radius > _clipX2 + 0.5) || (y - radius > _clipY2 + 0.5) ||
        (x + radius < _clipX1 - 0.5) || (y + radius < _clipY1 - 0.5)) {
        return;
    }

    if (fill !== TRANSPARENT) {
        // offset
        var ox = radius - 1, oy = 0;
        
        // step
        var dx = 1, dy = 1;
        var err = dx - radius * 2;

        // Midpoint circle algorithm. Iterate over 1/8 of the circle,
        // reflect to all sides
        while (ox >= oy) {
            _hline(x - ox, y + oy, x + ox, fill);
            _hline(x - ox, y - oy, x + ox, fill);
            
            _hline(x - oy, y + ox, x + oy, fill);
            _hline(x - oy, y - ox, x + oy, fill);

            // -4 gives better shape for small circles
            if (err <= -4) {
                ++oy;
                err += dy;
                dy += 2;
            }

            // intentionally no "else" to allow diagonal jumps
            
            if (err > -4) {
                --ox;
                dx += 2;
                err += dx - radius * 2;
            }
        } // while
    } // if fill

    
    if ((border !== TRANSPARENT) && (border !== fill)) {
        // offset
        var ox = radius - 1, oy = 0;
        
        // step
        var dx = 1, dy = 1;
        var err = dx - radius * 2;
        
        while (ox >= oy) {
            _pset(x - ox, y + oy, border);
            _pset(x + ox, y + oy, border);
            
            _pset(x - oy, y + ox, border);
            _pset(x + oy, y + ox, border);
            
            _pset(x - ox, y - oy, border);
            _pset(x + ox, y - oy, border);
            
            _pset(x - oy, y - ox, border);
            _pset(x + oy, y - ox, border);

            if (err <= -4) {
                ++oy;
                err += dy;
                dy += 2;
            }

            if (err > -4) {
                --ox;
                dx += 2;
                err -= radius * 2 - dx;
            }
        } // while
    } // if border
}


function rect(x1, y1, x2, y2, colormap) {
    x1 = x1 * _scaleX + _offsetX; y1 = y1 * _scaleY + _offsetY;
    x2 = x2 * _scaleX + _offsetX; y2 = y2 * _scaleY + _offsetY;
    
    colormap |= 0;
    var fill = colormapToColor(colormap); colormap = (colormap / 10) | 0;
    var border = colormapToColor(colormap);

    // Sort coordinates
    var t1 = Math.min(x1, x2), t2 = Math.max(x1, x2);
    x1 = t1; x2 = t2;
    
    t1 = Math.min(y1, y2), t2 = Math.max(y1, y2);
    y1 = t1; y2 = t2;
    
    // Culling optimization
    if ((x1 > _clipX2 + 0.5) || (x2 < _clipX1 - 0.5) ||
        (y1 > _clipY2 + 0.5) || (y2 < _clipY1 - 0.5)) {
        return;
    }

    if ((border !== fill) && (border !== TRANSPARENT)) {
        _hline(x1, y1, x2, border);
        _hline(x1, y2, x2, border);
        _vline(x1, y1 + 1, y2 - 1, border);
        _vline(x2, y1 + 1, y2 - 1, border);
        x1 += 1; y1 += 1; x2 -= 1; y2 -= 1;
    }

    if (fill !== TRANSPARENT) {
        // Snap to integer and clip to screen. We don't need to
        // round because we know that the rect is visible.
        x1 = Math.max((x1 + 0.5) | 0, _clipX1);
        x2 = Math.min((x2 + 0.5) | 0, _clipX2);
        y1 = Math.max((y1 + 0.5) | 0, _clipY1);
        y2 = Math.min((y2 + 0.5) | 0, _clipY2);
        
        // Fill spans
        for (var y = y1, i = y1 << _SCREEN_WIDTH_BITS; y <= y2; ++y, i += _SCREEN_WIDTH) {
            _screen.fill(fill, i + x1, i + x2 + 1);
        }
    }
}


/** Assumes x2 >= x1 and that color is a legal integer. Does not assume that x1 and x2 or y are
    on screen */
function _hline(x1, y, x2, color) {
    x1 = Math.round(x1) | 0;
    x2 = Math.round(x2) | 0;
    y  = Math.round(y) | 0;
    
    if ((x2 >= _clipX1) && (x1 <= _clipX2) && (y >= _clipY1) && (y <= _clipY2)) {
        _screen.fill(color, Math.max(x1, _clipX1) + (y << _SCREEN_WIDTH_BITS), Math.min(x2, _clipX2) + (y << _SCREEN_WIDTH_BITS) + 1);
    }
}

/** Assumes y2 >= y1 and that color is a legal integer. Does not assume that y1 and y2 or x are
    on screen */
function _vline(x, y1, y2, color) {
    x  = Math.round(x) | 0;
    y1 = Math.round(y1) | 0;
    y2 = Math.round(y2) | 0;
    
    if ((y2 >= _clipY1) && (y1 <= _clipY2) && (x >= _clipX1) && (x <= _clipX2)) {
        y1 = Math.max(_clipY1, y1);
        y2 = Math.min(_clipY2, y2);
        for (var y = y1, i = (y1 << _SCREEN_WIDTH_BITS) + x; y <= y2; ++y, i += _SCREEN_WIDTH) {
            _screen[i] = color;
        }
    }
}


function line(x1, y1, x2, y2, colormap) {
    x1 = x1 * _scaleX + _offsetX; y1 = y1 * _scaleY + _offsetY;
    x2 = x2 * _scaleX + _offsetX; y2 = y2 * _scaleY + _offsetY;
    
    var color = colormapToColor(colormap | 0);

    // Offscreen culling optimization
    if ((color === undefined) || (color === TRANSPARENT) ||
        (Math.min(x1, x2) > _clipX2 + 0.5) || (Math.max(x1, x2) < _clipX1 - 0.5) ||
        (Math.min(y1, y2) > _clipY2 + 0.5) || (Math.max(y1, y2) < _clipY1 - 0.5)) {
        return;
    }

    if (y1 === y2) {
        // Horizontal perf optimization/avoid divide by zero
        _hline(Math.min(x1, x2), y1, Math.max(x1, x2), color);
    } else if (x1 === x2) {
        // Vertical perf optimization
        _vline(x1, Math.min(y1, y2), Math.max(y1, y2), color);
    } else {
        // General case via DDA

        // Slope:
        var dx = x2 - x1, dy = y2 - y1;
        var m = dy / dx;
        var moreHorizontal = abs(dx) > abs(dy);

        if ((moreHorizontal && (x2 < x1)) ||
            (! moreHorizontal && (y2 < y1))) {
            // Swap endpoints to go in increasing direction on the dominant axis.
            // Slope is unchanged because both deltas become negated.
            var temp;
            temp = y1; y1 = y2; y2 = temp;
            temp = x1; x1 = x2; x2 = temp;
        }

        if (moreHorizontal) {
            // Crop horizontally:
            var m = dy / dx;
            var dx = Math.max(_clipX1, x1) - x1;
            x1 += dx; y1 += m * dx;
            x2 = Math.min(x2, _clipX2);
            for (var x = x1, y = y1; x <= x2; ++x, y += m) {
                _pset(x, y, color);
            } // for x
        } else { // Vertical
            // Compute the inverted slope
            var m = dx / dy;
            // Crop vertically:
            var dy = Math.max(_clipY1, y1) - y1;
            x1 += dy * m; y1 += dy;
            y2 = Math.min(y2, _clipY2);
            for (var y = y1, x = x1; y <= y2; ++y, x += m) {
                _pset(x, y, color);
            } // for y
            
        } // if more horizontal
    } // if diagonal
}


function pset(x, y, color) {
    if (y === undefined) {
        // Single-argument version
        color = x;
        x = y = -10000;
    }
    
    if (color === undefined) {
        color = _drawPalette[0];
    } else {
        _drawPalette[0] = color | 0;
    }

    if (color !== TRANSPARENT) {
        x = x * _scaleX + _offsetX; y = y * _scaleY + _offsetY;
        _pset(x, y, color & 31);
    }
}


/** Assumes color has been mapped and range corrected */
function _pset(x, y, color) {
    // nano pixels have integer centers, so we must round instead of just truncating.
    // Otherwise -0.7, which is offscreen, would become 0 and be visible.
    //
    // The << 0 casts to integer, which should allow more efficent compilation of
    // the subsequent code
    var i = Math.round(x) << 0;
    var j = Math.round(y) << 0;

    // "i >>> 0" converts from signed to unsigned int,
    // which forces negative values to be large and lets us
    // early-out sooner in the tests
    
    if (((i >>> 0) <= _clipX2) && ((j >>> 0) <= _clipY2) && (i >= _clipX1) && (y >= _clipY1)) {
        _screen[(i + (j << _SCREEN_WIDTH_BITS)) << 0] = color;
    }
}


function pget(x, y) {
    x = x * _scaleX + _offsetX; y = y * _scaleY + _offsetY;
    
    // See comment in _pset
    var i = Math.round(x) | 0;
    var j = Math.round(y) | 0;

    if (((i >>> 0) <= _clipX2) && ((j >>> 0) <= _clipY2) && (i >= _clipX1) && (j >= _clipY1)) {
        return _screen[i + (j << _SCREEN_WIDTH_BITS)];
    } else {
        return undefined;
    }
}


function text(str, x, y, colormap, align) {
    if (x === undefined) { x = _SCREEN_WIDTH >> 1; }
    if (y === undefined) { y = 3; }
    x = x * _scaleX + _offsetX; y = y * _scaleY + _offsetY;
    str = '' + str;
    
    colormap |= 0;
    var textColor = colormapToColor(colormap); colormap = (colormap / 10) | 0;

    let shadowColor = TRANSPARENT, borderColor = TRANSPARENT;
    
    // Handled specially; for text only, if the second color is
    // 0 it means transparent and not previous color
    if (colormap !== 0) {
        shadowColor = colormapToColor(colormap); colormap = (colormap / 10) | 0;
        borderColor = colormapToColor(colormap);

        if (borderColor !== TRANSPARENT && shadowColor == TRANSPARENT) {
            shadowColor = borderColor;
        }
    }

    // Spaces between letters
    var width = str.length - 1;
    // Variable-width letters
    for (var c = 0; c < str.length; ++c) {
        width += (_fontWidth[str[c]] || 3);
    }

    if (align === undefined) { align = 5; }
    
    let xalign = align & 3, yalign = Math.min(align >> 2, 2);
    let height = 4.5;
    
    x -= width * xalign * 0.5;
    if (xalign === 2) { ++x; }
    y -= height * yalign * 0.5 + 1;

    // Center and round. Have to call round() because values may
    // be negative
    x = Math.round(x - 1) | 0;
    y = Math.round(y) | 0;

    if ((x > _clipX2) || (y > _clipY2) || (y + 6 < _clipY1) || (x + width + 4 < _clipX1)) {
        // Cull when off-screen
        return;
    }
    
    const _FONT_WIDTH_BITS = 7;

    if (textColor != TRANSPARENT) {
        for (let c = 0; c < str.length; ++c) {
            let chr = str[c];
            let src = _fontMap[chr];
            if (src) {
                for (let j = 0, dstY = y; j <= 7; ++j, ++dstY) {
                    // On screen in Y?
                    if (((dstY >>> 0) <= _clipY2) && (dstY >= _clipY1)) {
                        for (let i = 0, dstX = x, dstIndex = x + (dstY << _SCREEN_WIDTH_BITS), srcIndex = src.x + ((src.y + j) << _FONT_WIDTH_BITS);
                             i <= 4;
                             ++i, ++dstX, ++dstIndex, ++srcIndex) {
                            // In character and on screen in X?
                            if (((dstX >>> 0) <= _clipX2) && (dstX >= _clipX1)) {
                                 switch (_fontSheet[srcIndex]) {
                                 case 4:
                                     _screen[dstIndex] = textColor;
                                     break;

                                 case 3:
                                     if (shadowColor !== TRANSPARENT) {
                                         _screen[dstIndex] = shadowColor;
                                     }
                                     break;

                                 case 2:
                                     if (borderColor !== TRANSPARENT) {
                                         _screen[dstIndex] = borderColor;
                                     }
                                     break;

                                 case 1: // border of shadow
                                     if ((borderColor !== TRANSPARENT) && (shadowColor !== borderColor)) {
                                         _screen[dstIndex] = borderColor;
                                     }
                                     break;
                                     
                                 } // switch on color
                            } // on screen x
                        } // for i
                    } // on screen y
                } // for j

            } // character in font
            x += (_fontWidth[chr] || 3) + 1;
            
        } // for each character
    } // not transparent
}


/* Returns a shallow copy */
function _clone(a) {
    if (a instanceof Array) {
        return a.slice();
    } else if (typeof a === 'Object') {
        return Object.assign({}, a);
    } else {
        return a;
    }
}


function _clamp(x, L, H) {
    return Math.max(Math.min(x, H), L);
}


/** Helper function to share code between the IDE and the runtime. Clipping region has to be
 passed because it is different for those cases. */
function _draw(spr, x, y, localPalette, xform, rot, screen, clipX1, clipY1, clipX2, clipY2) {
    let c = Math.cos(rot), s = Math.sin(rot);

    // Compute the net 2x2 transformation matrix
    let A = c, B = s, C = -s, D = c;
    xform |= 0;

    if (xform & 1) {
        // Transpose: swap axes
        let temp = A; A = C; C = temp;
        temp = B; B = D; D = temp;
    }

    if (xform & 2) {
        // Flip H: negate X
        A = -A; B = -B;
    }

    if (xform & 4) {
        // Flip V: negate Y
        C = -C; D = -D;
    }

    const isCaptured = (spr instanceof Uint8Array);
    
    let srcWidth = 8, srcHeight = 8;

    if (isCaptured) { srcWidth = spr.width; srcHeight = spr.height; }
    
    const centerOffsetX = (srcWidth - 1) * 0.5, centerOffsetY = (srcHeight - 1) * 0.5;
    
    // Center of the destination (integers)
    const dstX0 = Math.round(x - centerOffsetX) | 0;
    const dstY0 = Math.round(y - centerOffsetY) | 0;

    if (isCaptured) {
        const t = spr.transparentColor;
        if ((rot === 0) && (xform === 0)) {
            // Common case for captured sprites of no transformation. Optimize this in case the
            // sprite is big.
            for (let j = 0; j < srcHeight; ++j) {
                for (let i = 0; i < srcWidth; ++i) {
                    let color = spr[i + j * srcWidth];
                    let u = i + dstX0, v = j + dstY0;
                    if ((color !== t) && (u >= clipX1) && (u <= clipX2) && (v >= clipY1) && (v <= clipY2)) {
                        screen[u + (v << _SCREEN_WIDTH_BITS)] = color;
                    }
                }
            }
        } else {
            // Transformed captured sprite
            const maxBounds = Math.max(srcWidth, srcHeight);

            // What is the farthest a rotated corner sticks out from the original bounds?
            // = diameter * (sqrt(2)/2 - 1/2)
            const p = Math.ceil(maxBounds * 0.20711);
            
            // Iterate over *output* pixels
            for (let j = -p; j < maxBounds + p; ++j) {
                const dstY = dstY0 + j;
                const v = j - centerOffsetY;
                
                for (let i = -p; i < maxBounds + p; ++i) {
                    const dstX = dstX0 + i;
                    const u = i - centerOffsetX;
                    
                    const srcX = Math.round(u * A + v * B + centerOffsetX) | 0;
                    const srcY = Math.round(u * C + v * D + centerOffsetY) | 0;
                    
                    if (((srcX >>> 0) < srcWidth) && ((srcY >>> 0) < srcHeight)) {
                        // Inside the source sprite
                        let color = spr[srcX + srcY * srcWidth];
                        if ((color !== t) && ((dstX >>> 0) <= clipX2) && ((dstY >>> 0) <= clipY2) && (dstX >= clipX1) && (dstY >= clipY1)) {
                            screen[dstX + (dstY << _SCREEN_WIDTH_BITS)] = color;
                        } // if not transparent
                    } // Clamp to bounds
                } // i
            } // j
        } // if transformed

        return;
    }
    
    // Transformed built-in sprite
    
    // Top left of the source (integer)
    let srcX0 = ((spr & 15) << 3);
    let srcY0 = (((spr >> 4) & 15) << 3);

    // What is the farthest a corner sticks out?
    let p = 2;

    // Iterate over *output* pixels
    for (let j = -p; j < 8 + p; ++j) {
        let dstY = dstY0 + j;
        let v = j - 3.5;
        
        for (let i = -p; i < 8 + p; ++i) {
            let dstX = dstX0 + i;
            let u = i - 3.5;

            let srcX = Math.round(u * A + v * B + centerOffsetX) | 0;
            let srcY = Math.round(u * C + v * D + centerOffsetY) | 0;

            if (((srcX >>> 0) < 8) && ((srcY >>> 0) < 8)) {
                // Inside the source sprite
                srcX += srcX0; srcY += srcY0;

                let slot = _spriteSheet[srcX + (srcY << 7)];
                let color = localPalette[slot];
                if (color !== TRANSPARENT) {
                    if (((dstX >>> 0) <= clipX2) && ((dstY >>> 0) <= clipY2) && (dstX >= clipX1) && (dstY >= clipY1)) {
                        screen[dstX + (dstY << _SCREEN_WIDTH_BITS)] = color;
                    }
                } // if not transparent
            } // Clamp to bounds
        } // i
    } // j
}


function draw(spr, x, y, colormap, xform, rot) {
    x = x * _scaleX + _offsetX; y = y * _scaleY + _offsetY;
    rot = rot || 0;

    // Maps sprite slots directly to screen color indices
    var localPalette = [TRANSPARENT, 0, 0, 0, 0,
                        0, 0, 0, 0, 0]; // Reserved
        

    // Out of bounds sprite indices, off screen (including worst-case rotation)
    if (spr instanceof Uint8Array) {
        // sprite image
        _draw(spr, x, y, localPalette, xform, rot, _screen,_clipX1, _clipY1, _clipX2, _clipY2);
    } else {
        // sprite index
        spr |= 0;
        if ((spr < 0) || (spr > 127) || (x < _clipX1 - 8) || (y < _clipY1 - 8) || (x > _clipX2 + 8) || (y > _clipY2 + 8)) {
            return;
        }
        
        colormap |= 0;
        
        // Build the four-slot local palette mapping sprite values to colors
        for (var slot = 0; slot < 4; ++slot) {
            localPalette[4 - slot] = colormapToColor(colormap); colormap = (colormap / 10) | 0;
        }
        
        _draw(spr, x, y, localPalette, xform, rot, _screen, _clipX1, _clipY1, _clipX2, _clipY2);
    }
}


function wrap(x, hi) {
    hi = Math.abs(hi || 1);
    return x - Math.floor(x / hi) * hi;
}


function show() {
    // Expand the paletted image to RGB values
    var N = _SCREEN_WIDTH * _FRAMEBUFFER_HEIGHT;
    for (var i = 0; i < N; ++i) {
        _updateImageDataUint32[i] = _screenPalette[_screen[i]];
    }

    _submitFrame();
}


function cls(c) {
    if (c !== undefined) {
        if ((_clipX1 === 0) && (_clipX2 === _SCREEN_WIDTH - 1) ) {
            // Fill a consecutive region
            _screen.fill(c & 63, _clipY1 << _SCREEN_WIDTH_BITS, (_clipY2 + 1) << _SCREEN_WIDTH_BITS);
        } else {
            // Fill spans
            for (var y = _clipY1, i = _clipY1 << _SCREEN_WIDTH_BITS; y <= _clipY2; ++y, i += _SCREEN_WIDTH) {
                _screen.fill(c & 63, i + _clipX1, i + _clipX2 + 1);
            }
        }
    }
}


function sprget(_x0, _y0, _x1, _y1, t) {
    if (t === undefined) { t = 255; }
    let x0 = Math.round(Math.min(_x0, _x1)) | 0;
    let x1 = Math.round(Math.max(_x0, _x1)) | 0;
    let y0 = (Math.round(Math.min(_y0, _y1)) | 0) + _BAR_HEIGHT + _BAR_SPACING;
    let y1 = (Math.round(Math.max(_y0, _y1)) | 0) + _BAR_HEIGHT + _BAR_SPACING;

    let w = x1 - x0 + 1;
    let h = y1 - y0 + 1;
    let dst = new Uint8Array(w * h);
    dst.width = w;
    dst.height = h;
    dst.transparentColor = t;

    for (let y = 0, i = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x, ++i) {
            let u = x + x0, v = y + y0;
            if ((u >= 0) && (v >= 0) && (u < _SCREEN_WIDTH) && (v < _FRAMEBUFFER_HEIGHT)) {
                // in bounds
                dst[i] = _screen[u + (v << _SCREEN_WIDTH_BITS)];
            } else {
                // out of bounds, force to transparent
                dst[i] = t;
            }
        }
    }
    
    return dst;    
}


function sprscale(src, scale, quality) {
    quality |= 0;
    if ((scale !== 1/2) && (scale !== 1/4) && (scale !== 1) && (scale !== 2) && (scale !== 4)) {
        throw 'sprscale requires a scale factor of 1/4, 1/2, 1, 2, or 4';
    }

    if ((! src instanceof Uint8Array) || (src.width === undefined)) {
        throw 'sprscale must be called on a sprite from sprget';
    }
    
    if (scale < 1) {
        let dst = new Uint8Array(Math.floor(src.width * scale) * Math.floor(src.height * scale));
        dst.width = Math.floor(src.width * scale);
        dst.height = Math.floor(src.height * scale);
        dst.transparentColor = src.transparentColor;
        let M = Math.round(1 / scale);

        if (quality === 0 || true) {
            // Shift so as to not always take the upper-left corner
            let shift = (scale === 1/4) ? 1 : 0;
            
            for (let y = 0, i = 0; y < dst.height; ++y) {
                for (let x = 0; x < dst.width; ++x, ++i) {
                    dst[i] = src[(x * M + shift) + (shift + y * M) * src.width];
                }
            }
        } else {
            /*
            // Average
            for (let y = 0, i = 0; y < dst.height; ++y) {
                for (let x = 0, j = y * M * src.width; x < dst.width; ++x, ++i, j += 2) {
                    let A = src[j], B = src[j + 1], C = src[j + src.width], D = src[j + src.width + 1];
                    _screenPalette[A]
                    dst[i] = ;
                }
            }
            */
        }

        return dst;
    } else if (scale === 1) {
        // Clone
        let dst = src.slice();
        dst.width = src.width;
        dst.height = src.height;
        dst.transparentColor = src.transparentColor;
        return dst;        
    } else if (scale === 2) {
        return _scale2x(src, quality);
    } else { // 4
        return _scale2x(_scale2x(src, quality), quality);
    }
}
    
/** nearest neighbor interpolation + @casualeffects variant of exp/scale2x algorithm
    https://en.wikipedia.org/wiki/pixel-art_scaling_algorithms#epx/scale2%c3%97/advmame2%c3%97 
    
    - src is a Uint8Array with width and height fields
    - T is the transparent color index
    - quality = 0, 1, 2
*/
function _scale2x(src, quality) {
    let T = src.transparentColor;
    quality = quality | 0;
    
    function get(x, y) {
        return (x >= 0 && y >= 0 && x < src.width && y < src.height) ? src[x + y * src.width] : T;
    }
    
    let dst = new Uint8Array(src.width * src.height * 4);
    dst.transparentColor = src.transparentColor;
    dst.width = src.width * 2;
    dst.height = src.height * 2;

    if (quality <= 0) {
        for (let y = 0, offset = 0; y < src.height; ++y) {
            let i0 = y * 2 * dst.width;
            for (let x = 0; x < src.width; ++x, ++offset) {
                let P = src[offset];
                
                // write four pixels
                let i = x * 2 + i0;
                dst[i] = dst[i + 1] = P;
                i += dst.width;
                dst[i] = dst[i + 1] = P;
            }
        }
    } else { // quality > 0
        for (let y = 0; y < src.height; ++y) {
            for (let x = 0; x < src.width; ++x) {
                
                let A = get(x, y - 1);
                let C = get(x - 1, y);
                let P = get(x, y);
                let B = get(x + 1, y);
                let D = get(x, y + 1);
                
                let E = P, F = P, G = P, H = P;
                if (C === A && C !== D && A !== B) { E = A; }
                if (A === B && A !== C && B !== D) { F = B; }
                if (D === C && D !== B && C !== A) { G = C; }
                if (B === D && B !== A && D !== C) { H = D; }
                
                // write four pixels
                let i = x * 2 + y * 2 * dst.width;
                dst[i] = E;
                dst[i + 1] = F;
                i += dst.width;
                dst[i] = G;
                dst[i + 1] = H;
            } // for x
        } // for y
        
        if (quality > 1) {
            // @casualeffects improvements
            for (let y = 0; y < src.height; ++y) {
                for (let x = 0; x < src.width; ++x) {
                    let A = get(x - 1, y - 1);
                    let B = get(x, y - 1);
                    let C = get(x + 1, y - 1);
                    
                    let D = get(x - 1, y);
                    let E = get(x, y);
                    let F = get(x + 1, y);
                    
                    let G = get(x - 1, y + 1);
                    let H = get(x, y + 1);
                    let I = get(x + 1, y + 1);
                    
    
                    // 1st row of each test: maintain square corners
                    // 
                    // 2nd row: smooth diagonals into transparent (also rounds curves while
                    // maintaining 2:1 slopes)
                    
                    let j = x * 2 + y * 2 * dst.width;
                    if ((G !== E && D !== E && A !== E && B !== E && C !== E) ||
                        (C !== T && A === T && B === T && D === T && G !== T)) { dst[j] = E; }
                    
                    if ((A !== E && B !== E && C !== E && F !== E && I !== E) ||
                        (A !== T && B === T && C === 0 && F === T && I !== T)) { dst[j + 1] = E; }
                    
                    if ((A !== E && D !== E && G !== E && H !== E && I !== E) ||
                        (A !== T && D === T && G === T && H === T && I !== T)) { dst[j + dst.width] = E; }
                    
                    if ((G !== E && H !== E && I !== E && F !== E && C !== E) ||
                        (G !== T && H === T && I === T && F === T && C !== T)) { dst[j + 1 + dst.width] = E; }
                } // x
            } // y
        } // quality > 1
    } // quality > 0
    
    return dst;
}


var [rnd, srand] = (function() {
    /* Based on https://github.com/AndreasMadsen/xorshift/blob/master/xorshift.js

       Copyright (c) 2014 Andreas Madsen & Emil Bay

       Permission is hereby granted, free of charge, to any person obtaining a copy of this
       software and associated documentation files (the "Software"), to deal in the Software
       without restriction, including without limitation the rights to use, copy, modify,
       merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
       permit persons to whom the Software is furnished to do so, subject to the following
       conditions:

       The above copyright notice and this permission notice shall be included in all copies or
       substantial portions of the Software.

       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
       INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
       PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
       LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
       OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
       OTHER DEALINGS IN THE SOFTWARE.
    */
    
    var state0U = 5662365, state0L = 20000, state1U = 30000, state1L = 4095;

    function srand(seed) {
        if (seed === undefined || seed === 0) { seed = 4.7499362e+13; }
        if (seed < 2**16) { seed += seed * 1.3529423483002e15; }
        state0U = Math.abs(seed / 2**24) >>> 0;

        // Avoid all zeros
        if (state0U === 0) { state0U = 5662365; }
        
        state0L = Math.abs(seed) >>> 0;
        state1U = Math.abs(seed / 2**16) >>> 0;
        state1L = Math.abs(seed / 2**32) >>> 0;
        //console.log(seed, state0U, state0L, state1U, state1L)
    }

    function rnd() {
        // uint64_t s1 = s[0]
        var s1U = state0U, s1L = state0L;
        // uint64_t s0 = s[1]
        var s0U = state1U, s0L = state1L;

        // result = s0 + s1
        var sumL = (s0L >>> 0) + (s1L >>> 0);
        var resU = (s0U + s1U + (sumL / 2 >>> 31)) >>> 0;
        var resL = sumL >>> 0;
        
        // s[0] = s0
        state0U = s0U;
        state0L = s0L;
        
        // - t1 = [0, 0]
        var t1U = 0, t1L = 0;
        // - t2 = [0, 0]
        var t2U = 0, t2L = 0;
        
        // s1 ^= s1 << 23;
        // :: t1 = s1 << 23
        var a1 = 23;
        var m1 = 0xFFFFFFFF << (32 - a1);
        t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
        t1L = s1L << a1;
        // :: s1 = s1 ^ t1
        s1U = s1U ^ t1U;
        s1L = s1L ^ t1L;
        
        // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
        // :: t1 = s1 ^ s0
        t1U = s1U ^ s0U;
        t1L = s1L ^ s0L;
        // :: t2 = s1 >> 18
        var a2 = 18;
        var m2 = 0xFFFFFFFF >>> (32 - a2);
        t2U = s1U >>> a2;
        t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
        // :: t1 = t1 ^ t2
        t1U = t1U ^ t2U;
        t1L = t1L ^ t2L;
        // :: t2 = s0 >> 5
        var a3 = 5;
        var m3 = 0xFFFFFFFF >>> (32 - a3);
        t2U = s0U >>> a3;
        t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
        // :: t1 = t1 ^ t2
        t1U = t1U ^ t2U;
        t1L = t1L ^ t2L;
        
        // s[1] = t1
        state1U = t1U;
        state1L = t1L;
        
        return resU * 2.3283064365386963e-10 + (resL >>> 12) * 2.220446049250313e-16;
    }

    return [rnd, srand];
})();


var _GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

/** Creates a new coroutine from code in this environment.  Invoke next() repeatedly on the
    returned object to execute it. */
function _makeCoroutine(code) {
    // Protect certain variables location and window by shadowing them, since
    // programs that overwrite (or read!) them could cause problems.
    return (new _GeneratorFunction('var location, document, window, Math; ' + code))();
}
