# xstitch-pattern

Turn any image into a **cross-stitch chart**: palette-mapped stitch grid
where every color gets a **unique printable symbol** (so charts stay
readable when printed in black and white), plus a legend with floss usage
in stitches and estimated skeins. Zero dependencies, runs in Node and in
the browser.

把任意图片转成**十字绣图纸**：每个颜色除了色号，还分配一个**唯一的印刷符号**，
黑白打印出来也能照着绣；图例里带每种线的针数和估算用量（绣线团数）。
零依赖，Node 和浏览器都能跑。

![license](https://img.shields.io/badge/license-MIT-green)

## Why

Most image-to-chart tools just pixelate and hand you a color grid. Real
counted cross-stitch needs more:

- charts are usually **printed in black and white**, so colors alone are
  not enough — every color needs a distinct, unambiguous **symbol**
- you need to know **how much floss to buy**: stitches per color, and
  roughly how many skeins that works out to
- colors must snap to a **real floss palette**, not arbitrary RGB
- transparent / empty areas must stay empty

xstitch-pattern does exactly that, as a small library you can build on.

## Install

```bash
npm install xstitch-pattern
```

Or clone this repo and import `src/index.js` directly — there are no
dependencies to install.

## Usage

```js
import { imageDataToChart, chartToSVG, chartToText } from 'xstitch-pattern';
import { genericFloss } from 'xstitch-pattern/palettes/generic-floss';

// pixels: raw RGBA bytes, e.g. Canvas ImageData.data in the browser,
// or decoded image data in Node (bring your own decoder).
const chart = imageDataToChart(pixels, width, height, {
  gridWidth: 64,          // chart width in stitches
  palette: genericFloss,  // [{ code, name, rgb: [r, g, b] }]
  maxColors: 16,          // cap distinct colors (optional)
  stitchesPerSkein: 800,  // for the skein estimate (optional)
});

console.log(chart.totalStitches); // total stitches
console.log(chart.legend);
// [{ code, name, rgb, symbol, stitches, skeins }] sorted by stitches desc
console.log(chartToText(chart));  // symbol grid + legend, ready to print
const svgColor = chartToSVG(chart);                 // colored chart
const svgPrint = chartToSVG(chart, { mode: 'bw' }); // black-and-white chart
```

## Demo

Open `examples/demo.html` through any static server, e.g.:

```bash
npx serve .
# then visit http://localhost:3000/examples/demo.html
```

Pick an image, set grid width and max colors, switch between color and
black-and-white mode, and you get the chart plus a legend table with
stitches and estimated skeins per color.

## Bring your own palette

A palette is just an array of `{ code, name, rgb }`. The bundled
`palettes/generic-floss.js` ships 24 generic colors with house codes
(F01–F24) — these are **not** DMC or Anchor numbers. To stitch with real
floss, either map the generic codes to DMC/Anchor numbers with your own
conversion table, or pass a real DMC/Anchor palette in the same shape —
mapping, symbols, stats and exports all work unchanged.
Community-contributed palettes are welcome, see CONTRIBUTING.md.

## About the skein estimate

Skeins are estimated as `ceil(stitches / stitchesPerSkein * 10) / 10`,
with `stitchesPerSkein` defaulting to 800. Treat it as a planning
estimate, not a guarantee: real usage varies with fabric count, number
of strands, and how much tail waste you leave. When in doubt, buy one
extra skein of your most-used colors.

## API

- `imageDataToChart(pixels, width, height, options)` — main entry.
  Options: `gridWidth`, `palette` (required), `maxColors`,
  `stitchesPerSkein`, `alphaThreshold`. Returns `{ grid, gridWidth,
  gridHeight, legend, totalStitches, stitchesPerSkein }`. Grid cells are
  `{ code, name, rgb, symbol }` or `null`.
- `SYMBOLS` — the symbol set (59 glyphs; shapes first, then letters and
  digits; ambiguous pairs like 0/O and 1/l are excluded on purpose).
- `nearestColor(r, g, b, palette)` — closest palette entry (redmean
  weighted RGB distance).
- `colorDistance(r1, g1, b1, r2, g2, b2)` — redmean weighted RGB distance.
- `estimateSkeins(stitches, stitchesPerSkein)` — skeins rounded up to
  one decimal.
- `chartToSVG(chart, { cellSize, mode })` — SVG chart string; `mode` is
  `'color'` or `'bw'` (white cells, black symbols, for printing).
- `chartToText(chart)` — plain-text symbol grid plus legend lines with
  stitches and estimated skeins.

## Roadmap

- [ ] DMC and Anchor palette packs
- [ ] Printable PDF chart export (with 10-stitch grid emphasis)
- [ ] Backstitch / outline detection
- [ ] Fractional stitches (quarter / three-quarter)
- [ ] CLI wrapper

## Related

xstitch-pattern is the open-source core extracted from
[格作 Gezuo](https://beads.coooolfire.tech), a free web tool that turns
images into patterns for fuse beads, bricks, crochet and cross-stitch
with production previews and material lists.

## License

MIT
