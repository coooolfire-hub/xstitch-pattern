// xstitch-pattern core: turn raster images into cross-stitch charts.
// Zero dependencies. Works in Node and in the browser.
//
// Input pixels are raw RGBA bytes (e.g. Canvas ImageData.data), so this
// library stays decoupled from any image loader.
//
// Unlike plain pixelation, every color in a chart gets a unique printable
// SYMBOL, so charts can be printed in black and white and still be read.
// The legend reports floss usage in stitches and estimated skeins.

/** Weighted RGB distance (redmean approximation of perceptual distance). */
export function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

/** Find the palette entry closest to an RGB color. */
export function nearestColor(r, g, b, palette) {
  let best = null;
  let bestDist = Infinity;
  for (const c of palette) {
    const d = colorDistance(r, g, b, c.rgb[0], c.rgb[1], c.rgb[2]);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * Printable chart symbols, assigned to colors in order of stitch count
 * (most-used color first). Geometric shapes come first because they stay
 * distinct in small print, then letters and digits. Ambiguous glyphs are
 * deliberately excluded: no 0/O, no 1/l/I, so a printed chart can never
 * be misread.
 */
export const SYMBOLS = [
  '■', '□', '▲', '△', '▼', '▽', '◆', '◇', '●', '○',
  '★', '☆', '♥', '♦', '♣', '♠', '✚', '✖', '✦', '✧',
  '◐', '◑', '⬟', '⬢', '⬣', '◎', '◉', '◈',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
  'X', 'Y', 'Z',
  '2', '3', '4', '5', '6', '7', '8', '9',
];

/** Count stitches per color code. Returns a Map of code -> entry. */
function countStitches(grid) {
  const map = new Map();
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      total++;
      if (!map.has(cell.code)) {
        map.set(cell.code, { code: cell.code, name: cell.name, rgb: cell.rgb, stitches: 0 });
      }
      map.get(cell.code).stitches++;
    }
  }
  return { map, total };
}

/**
 * Estimated skeins for a stitch count, rounded up to one decimal.
 * stitches * 10 is computed before dividing so exact tenths stay exact.
 * This is an estimate: real usage varies with fabric count, strand
 * count and how much tail waste a stitcher leaves.
 */
export function estimateSkeins(stitches, stitchesPerSkein) {
  return Math.ceil((stitches * 10) / stitchesPerSkein) / 10;
}

/**
 * Convert raw RGBA pixels to a cross-stitch chart.
 *
 * @param {Uint8ClampedArray|Uint8Array} pixels RGBA bytes, row-major.
 * @param {number} width  source image width in pixels
 * @param {number} height source image height in pixels
 * @param {object} options
 * @param {number} options.gridWidth  chart width in stitches (default 64)
 * @param {Array}  options.palette    [{code, name, rgb:[r,g,b]}] (required)
 * @param {number} [options.maxColors] cap distinct colors; least-used
 *                   colors are remapped to their nearest surviving color
 * @param {number} [options.stitchesPerSkein] stitches one skein covers,
 *                   used for the skein estimate (default 800)
 * @param {number} [options.alphaThreshold] pixels with alpha below this
 *                   count as empty (default 128)
 * @returns {{grid: Array, gridWidth: number, gridHeight: number,
 *            legend: Array, totalStitches: number, stitchesPerSkein: number}}
 *   grid cells are {code, name, rgb, symbol} or null. legend entries are
 *   {code, name, rgb, symbol, stitches, skeins} sorted by stitches, desc.
 */
export function imageDataToChart(pixels, width, height, options) {
  const opts = options || {};
  const palette = opts.palette;
  if (!palette || palette.length === 0) throw new Error('options.palette is required');
  const gridWidth = opts.gridWidth || 64;
  const stitchesPerSkein = opts.stitchesPerSkein || 800;
  const alphaThreshold = opts.alphaThreshold === undefined ? 128 : opts.alphaThreshold;
  const gridHeight = Math.max(1, Math.round((gridWidth * height) / width));

  let grid = [];
  for (let gy = 0; gy < gridHeight; gy++) {
    const row = [];
    const y0 = Math.floor((gy * height) / gridHeight);
    const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * height) / gridHeight));
    for (let gx = 0; gx < gridWidth; gx++) {
      const x0 = Math.floor((gx * width) / gridWidth);
      const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * width) / gridWidth));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          if (pixels[i + 3] < alphaThreshold) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          n++;
        }
      }
      row.push(n === 0 ? null : nearestColor(r / n, g / n, b / n, palette));
    }
    grid.push(row);
  }

  if (opts.maxColors && opts.maxColors > 0) {
    const { map } = countStitches(grid);
    const ranked = [...map.values()].sort((a, b) => b.stitches - a.stitches);
    if (ranked.length > opts.maxColors) {
      const keep = new Set(ranked.slice(0, opts.maxColors).map((s) => s.code));
      const keepPalette = palette.filter((c) => keep.has(c.code));
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const cell = grid[y][x];
          if (cell && !keep.has(cell.code)) {
            grid[y][x] = nearestColor(cell.rgb[0], cell.rgb[1], cell.rgb[2], keepPalette);
          }
        }
      }
    }
  }

  const { map, total } = countStitches(grid);
  const ranked = [...map.values()].sort((a, b) => b.stitches - a.stitches);
  if (ranked.length > SYMBOLS.length) {
    throw new Error(
      'chart uses ' + ranked.length + ' colors but only ' + SYMBOLS.length +
      ' symbols are available; pass maxColors to cap the palette'
    );
  }

  const symbolByCode = new Map();
  const legend = ranked.map((entry, i) => {
    const symbol = SYMBOLS[i];
    symbolByCode.set(entry.code, symbol);
    return {
      code: entry.code,
      name: entry.name,
      rgb: entry.rgb,
      symbol,
      stitches: entry.stitches,
      skeins: estimateSkeins(entry.stitches, stitchesPerSkein),
    };
  });

  grid = grid.map((row) =>
    row.map((cell) =>
      cell
        ? { code: cell.code, name: cell.name, rgb: cell.rgb, symbol: symbolByCode.get(cell.code) }
        : null
    )
  );

  return { grid, gridWidth, gridHeight, legend, totalStitches: total, stitchesPerSkein };
}

/**
 * Render the chart as an SVG string.
 *
 * @param {object} chart result of imageDataToChart
 * @param {object} [svgOptions]
 * @param {number} [svgOptions.cellSize] cell size in px (default 20)
 * @param {string} [svgOptions.mode] 'color' (default): colored cells with
 *   the symbol on top. 'bw': white cells with black symbols only, ready
 *   for cheap black-and-white printing.
 */
export function chartToSVG(chart, svgOptions) {
  const o = svgOptions || {};
  const cell = o.cellSize || 20;
  const mode = o.mode || 'color';
  if (mode !== 'color' && mode !== 'bw') throw new Error("mode must be 'color' or 'bw'");
  const w = chart.gridWidth * cell;
  const h = chart.gridHeight * cell;
  const parts = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">');
  parts.push('<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#fff"/>');
  for (let y = 0; y < chart.gridHeight; y++) {
    for (let x = 0; x < chart.gridWidth; x++) {
      const c = chart.grid[y][x];
      const px = x * cell;
      const py = y * cell;
      const fill = c && mode === 'color'
        ? 'rgb(' + c.rgb[0] + ',' + c.rgb[1] + ',' + c.rgb[2] + ')'
        : '#fff';
      parts.push('<rect x="' + px + '" y="' + py + '" width="' + cell + '" height="' + cell + '" fill="' + fill + '" stroke="rgba(0,0,0,0.35)" stroke-width="0.5"/>');
      if (c) {
        let tc = '#000';
        if (mode === 'color') {
          const lum = 0.299 * c.rgb[0] + 0.587 * c.rgb[1] + 0.114 * c.rgb[2];
          tc = lum > 150 ? '#222' : '#fff';
        }
        parts.push('<text x="' + (px + cell / 2) + '" y="' + (py + cell * 0.62) + '" font-size="' + (cell * 0.55) + '" text-anchor="middle" fill="' + tc + '" font-family="sans-serif">' + c.symbol + '</text>');
      }
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

/**
 * Render the chart as plain text: a symbol grid (. = empty), then a
 * legend with per-color stitches and estimated skeins.
 */
export function chartToText(chart) {
  const lines = chart.grid.map((row) => row.map((c) => (c ? c.symbol : '.')).join(''));
  lines.push('');
  lines.push('Legend:');
  for (const e of chart.legend) {
    lines.push(e.symbol + ' ' + e.code + ' ' + e.name + ' — ' + e.stitches + ' stitches (~' + e.skeins.toFixed(1) + ' skeins)');
  }
  lines.push('');
  lines.push('Total: ' + chart.totalStitches + ' stitches, ' + chart.legend.length + ' colors');
  lines.push('Skein counts are estimates based on ' + (chart.stitchesPerSkein || 800) + ' stitches per skein.');
  return lines.join('\n');
}
