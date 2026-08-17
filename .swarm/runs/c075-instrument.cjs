'use strict';
/* Conductor, cycle 75: instrument the WORKING TREE's own blockArt internals at a
 * surviving broken-arc point, to locate why the fix still leaves row 1 dark. */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

// Take the working tree's render.js verbatim and re-export its internals.
const src = fs.readFileSync(path.join(REPO, 'src', 'render.js'), 'utf8');
const scratch = path.join(__dirname, 'c075-render-open.cjs');
fs.writeFileSync(scratch, src.replace(
  'module.exports = { renderLine, renderBlock };',
  'module.exports = { renderLine, renderBlock, sampleCell, SHADE, HAIRLINE, BLOCK_ROWS, BLOCK_COLS, SUB };',
));
const M = require(scratch);
console.log(`SUB (sub-samples per axis) = ${M.SUB}`);
console.log(`BLOCK_ROWS=${M.BLOCK_ROWS} BLOCK_COLS=${M.BLOCK_COLS}`);
console.log('');

// The surviving point measured by c075-residual.cjs.
const k = 0.001641501905062237;
const waxing = true; // f = 0.0129
console.log(`k=${k} waxing=${waxing}  (a surviving broken-arc render, north)`);
console.log('');
for (let r = 0; r < M.BLOCK_ROWS; r++) {
  const y0 = -1 + (2 * r) / M.BLOCK_ROWS;
  const y1 = -1 + (2 * (r + 1)) / M.BLOCK_ROWS;
  const cells = [];
  for (let c = 0; c < M.BLOCK_COLS; c++) {
    const x0 = -1 + (2 * c) / M.BLOCK_COLS;
    const x1 = -1 + (2 * (c + 1)) / M.BLOCK_COLS;
    cells.push(M.sampleCell(x0, x1, y0, y1, k, waxing));
  }
  const onDisc = cells.map((c, i) => ({ i, ...c })).filter((c) => c.presence > 0);
  const overThr = onDisc.filter((c) => c.cover > 0.02);
  const best = onDisc.reduce((a, b) => (b.cover > a.cover ? b : a), onDisc[0]);
  console.log(`row ${r}: on-disc cells ${onDisc[0].i}..${onDisc[onDisc.length - 1].i}`);
  console.log(`   MODULE's own numbers -> cells with cover>0.02: ${overThr.length}` +
    (overThr.length ? ` at cols [${overThr.map((c) => c.i).join(',')}]` : '') +
    `; best cover = ${best.cover.toFixed(5)} at col ${best.i} (presence ${best.presence.toFixed(3)})`);
  // the three sunward-most on-disc cells, which is where the limb lives
  const tail = onDisc.slice(-3);
  console.log('   sunward-most on-disc cells: ' +
    tail.map((c) => `col${c.i}{cover=${c.cover.toFixed(5)},presence=${c.presence.toFixed(3)}}`).join(' '));
}
fs.unlinkSync(scratch);
