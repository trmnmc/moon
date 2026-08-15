// Conductor gate instrument, cycle 026 (T-122).
// Sweeps the rendering surface over a full synodic month at a fine stride, both
// hemispheres, both render forms, and emits ONE sha256 over the concatenation.
// T-122 is a prose-only correction: this digest must be byte-identical before and
// after. Also emits the sorted set of codepoints the disc actually draws, so a
// builder quietly folding U+25D6/U+25D7 into the documented partition is visible
// as a set change even if the digest somehow matched.
const crypto = require('node:crypto');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const { computeMoon } = require(path.join(ROOT, 'src/astro.js'));
const { renderLine, renderBlock } = require(path.join(ROOT, 'src/render.js'));

// Fixed epoch, no clock dependence: 2000-01-06T18:14Z (a new moon) + 30 days,
// stride 10 minutes => 4321 samples covering every lit fraction the art can take.
const START = Date.UTC(2000, 0, 6, 18, 14, 0);
const STRIDE_MS = 10 * 60 * 1000;
const SAMPLES = 4321;

const chunks = [];
const glyphs = new Set();
for (let i = 0; i < SAMPLES; i += 1) {
  const d = new Date(START + i * STRIDE_MS);
  const moon = computeMoon(d);
  for (const hemi of ['north', 'south']) {
    const line = renderLine(moon, hemi);
    const block = renderBlock(moon, hemi);
    chunks.push(line, block);
    for (const ch of line + block) {
      const cp = ch.codePointAt(0);
      if (cp > 0x20) glyphs.add(cp);
    }
  }
}

const blob = chunks.join('\n');
const digest = crypto.createHash('sha256').update(blob, 'utf8').digest('hex');
const cps = [...glyphs].sort((a, b) => a - b).map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0'));

console.log('samples      ' + SAMPLES + ' x 2 hemispheres x 2 forms = ' + chunks.length + ' rendered strings');
console.log('bytes        ' + Buffer.byteLength(blob, 'utf8'));
console.log('sha256       ' + digest);
console.log('codepoints   ' + cps.join(' '));
