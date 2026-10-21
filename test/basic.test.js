import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageDataToChart, chartToText, chartToSVG, SYMBOLS } from '../src/index.js';
import { genericFloss } from '../palettes/generic-floss.js';

function halfAndHalf() {
  const w = 8;
  const h = 4;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const orange = x >= 4;
      px[i] = orange ? 240 : 250;
      px[i + 1] = orange ? 138 : 249;
      px[i + 2] = orange ? 36 : 246;
      px[i + 3] = 255;
    }
  }
  return { px, w, h };
}

test('half-and-half image maps to 2 colors with unique symbols and correct counts', () => {
  const { px, w, h } = halfAndHalf();
  const c = imageDataToChart(px, w, h, { gridWidth: 8, palette: genericFloss });
  assert.equal(c.gridWidth, 8);
  assert.equal(c.gridHeight, 4);
  assert.equal(c.totalStitches, 32);
  assert.equal(c.legend.length, 2);
  assert.equal(c.legend[0].stitches, 16);
  assert.equal(c.legend[1].stitches, 16);
  // unique symbols, and every grid cell carries its legend symbol
  assert.notEqual(c.legend[0].symbol, c.legend[1].symbol);
  const byCode = new Map(c.legend.map((e) => [e.code, e.symbol]));
  for (const row of c.grid) {
    for (const cell of row) {
      assert.equal(cell.symbol, byCode.get(cell.code));
    }
  }
});

test('transparent pixels become empty cells', () => {
  const w = 2;
  const h = 2;
  const px = new Uint8ClampedArray(w * h * 4); // all alpha 0
  const c = imageDataToChart(px, w, h, { gridWidth: 2, palette: genericFloss });
  assert.equal(c.totalStitches, 0);
  assert.equal(c.legend.length, 0);
  assert.ok(c.grid.every((row) => row.every((cell) => cell === null)));
});

test('skein estimate rounds up to one decimal on a known count', () => {
  const { px, w, h } = halfAndHalf();
  // 16 stitches per color; at 10 stitches per skein that is exactly 1.6.
  const c = imageDataToChart(px, w, h, {
    gridWidth: 8,
    palette: genericFloss,
    stitchesPerSkein: 10,
  });
  for (const e of c.legend) {
    assert.equal(e.stitches, 16);
    assert.equal(e.skeins, 1.6);
  }
  // a single stitch at the default 800 stitches per skein still needs 0.1.
  const one = new Uint8ClampedArray(4);
  one[0] = 250; one[1] = 249; one[2] = 246; one[3] = 255;
  const c1 = imageDataToChart(one, 1, 1, { gridWidth: 1, palette: genericFloss });
  assert.equal(c1.legend[0].stitches, 1);
  assert.equal(c1.legend[0].skeins, 0.1);
});

test('chartToText legend symbols match the symbols used in the grid', () => {
  const { px, w, h } = halfAndHalf();
  const c = imageDataToChart(px, w, h, { gridWidth: 8, palette: genericFloss });
  const text = chartToText(c);
  const lines = text.split('\n');
  const gridLines = lines.slice(0, c.gridHeight);
  const gridSymbols = new Set();
  for (const line of gridLines) {
    for (const ch of line) {
      if (ch !== '.') gridSymbols.add(ch);
    }
  }
  assert.equal(gridSymbols.size, c.legend.length);
  const legendStart = lines.indexOf('Legend:');
  assert.ok(legendStart > 0);
  const legendLines = lines.slice(legendStart + 1, legendStart + 1 + c.legend.length);
  for (const sym of gridSymbols) {
    assert.ok(
      legendLines.some((l) => l.startsWith(sym + ' ')),
      'legend is missing a line for symbol ' + sym
    );
  }
  // every legend symbol is one of the exported SYMBOLS
  for (const e of c.legend) assert.ok(SYMBOLS.includes(e.symbol));
  assert.ok(SYMBOLS.length >= 40);
});

test('chartToSVG renders color and bw modes', () => {
  const { px, w, h } = halfAndHalf();
  const c = imageDataToChart(px, w, h, { gridWidth: 8, palette: genericFloss });
  const color = chartToSVG(c, { mode: 'color' });
  const bw = chartToSVG(c, { mode: 'bw' });
  assert.ok(color.startsWith('<svg'));
  assert.ok(bw.startsWith('<svg'));
  assert.ok(color.includes(c.legend[0].symbol));
  assert.ok(bw.includes(c.legend[0].symbol));
  assert.notEqual(color, bw); // bw drops the colored fills
});

test('maxColors caps the number of distinct colors', () => {
  const w = 16;
  const h = 2;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = (i * 37) % 256;
    px[i * 4 + 1] = (i * 91) % 256;
    px[i * 4 + 2] = (i * 53) % 256;
    px[i * 4 + 3] = 255;
  }
  const c = imageDataToChart(px, w, h, { gridWidth: 16, palette: genericFloss, maxColors: 4 });
  assert.ok(c.legend.length <= 4);
});
