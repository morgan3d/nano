// Morgan's HTML color utilities

/** Converts a little-endian ImageData value (e.g., dark red = 0xFF0000CC) to a HTML color string
    (e.g., dark red = "#CC0000")  */
function imageDataToHTMLColorString(c) {
    r = c & 0xff;
    g = (c >> 8) & 0xff;
    b = (c >> 16) & 0xff;
    return '#' + hexByte(r) + hexByte(g) + hexByte(b);
}


/** Converts an HTML parsed color integer (e.g., dark red = 0xcc0000) to an ImageData integer
    (e.g., dark red = 0xff0000cc). */
function htmlColorIntegerToImageData(c) {
    return 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >> 16) & 0xff)
}


/** Returns a two-digit hex string for 0 <= i <= 255 */
function hexByte(i) {
    i |= 0;
    var h = i.toString(16);
    return (i < 16) ? '0' + h : h;
}


/** Convert an HTML computed color string to an RGBA object with channels on [0, 1]. Handles
    the formats returned by various browsers. */
function parseColor(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) {
        rgb = parseInt(rgb.substring(1), 16);
        return {r: ((rgb >> 16) & 0xff) / 255,
                g: ((rgb >> 8) & 0xff) / 255,
                b: (rgb & 0xff) / 255,
                a: 1};
    } else if (/^#[0-9A-F]{3}$/i.test(rgb)) {
        rgb = parseInt(rgb.substring(1), 16);
        return {r: ((rgb >> 8) & 0xf) / 15,
                g: ((rgb >> 4) & 0xf) / 15,
                b: (rgb & 0xf) / 15,
                a: 1};
    } else if (rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)) {
        return {r: rgb[1]/255,
                g: rgb[2]/255,
                b: rgb[3]/255,
                a: 1};
    } else if (rgb = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/)) {
        return {r: rgb[1]/255,
                g: rgb[2]/255,
                b: rgb[3]/255,
                a: rgb[4]};
    } else {
        return {r:0, g:0, b:0, a:1};
    }
}


/** Returns a perceptual squared color distance between rgb1 and rgb2, each channel of which is
    an 8-bit integer. Optimized for performance. The result range is 32-bit but not normalized.  */
function squaredColorDistance(r1, g1, b1, r2, g2, b2) {
    var r = r2 - r1, g = g2 - g1, b = b2 - b1;

    // Super simple approximation, tends to do poorly
    // on saturated colors
    //return (r*r) + (g*g<<1) + (b*b);
    
    // Derived from https://www.compuphase.com/cmetric.htm and optimized for JavaScript.
    // Tweaked to avoid gray appearing in skin tones
    return (((1600 + r1 + r2) * r * r) >> 9) +
        (g * g << 2) +
        (((1200 - r1 - r2) * b * b) >> 9);
    
    
}

