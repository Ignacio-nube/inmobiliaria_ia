export function hexToHSL(hex: string) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find min/max
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Calculate lightness
    let l = (max + min) / 2;

    // Calculate saturation
    let s = 0;
    if (diff !== 0) {
        s = l > 0.5
            ? diff / (2 - max - min)
            : diff / (max + min);
    }

    // Calculate hue
    let h = 0;
    if (diff !== 0) {
        if (max === r) {
            h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
            h = ((b - r) / diff + 2) / 6;
        } else {
            h = ((r - g) / diff + 4) / 6;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

export function generateColorShades(brandHex: string, prefix: string) {
    const { h, s, l } = hexToHSL(brandHex);

    const shades = {
        50: { l: 97, sMultiplier: 0.8 },
        100: { l: 94, sMultiplier: 0.8 },
        200: { l: 87, sMultiplier: 0.85 },
        300: { l: 75, sMultiplier: 0.9 },
        400: { l: 62, sMultiplier: 0.95 },
        500: { l: 48, sMultiplier: 1.0 },
        600: { l: Math.max(0, l - 10), sMultiplier: 1.0 }, // Keep original as center, roughly
        700: { l: 33, sMultiplier: 1.0 },
        800: { l: 27, sMultiplier: 1.0 },
        900: { l: 20, sMultiplier: 1.0 },
        950: { l: 10, sMultiplier: 1.0 }
    };

    // We actually set shade 600 or 500 to the EXACT hsl of the provided hex.
    // Tailwind v4 uses simple values, but we can pass `hsl(h s% l%)`.
    const result: Record<string, string> = {};

    for (const [shade, { l: lightness, sMultiplier }] of Object.entries(shades)) {
        let finalL = lightness;
        let finalS = Math.round(s * sMultiplier);

        // For 600, lock to exact brand color to ensure accuracy
        if (shade === "600") {
            finalL = l;
            finalS = s;
        }

        result[`--color-${prefix}-${shade}`] = `hsl(${h} ${finalS}% ${finalL}%)`;
    }

    return result;
}
