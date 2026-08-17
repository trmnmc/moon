'use strict';
/* Conductor, cycle 75: classify the 84 surviving broken-arc renders HOLE vs BOUNDARY
 * (SPEC must-have / L-033: a survivor where the observable is genuinely
 * indiscriminable is the check being CORRECT; hardening it would false-reject). */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const wt = require(path.join(REPO, 'src', 'render.js'));

const SYNODIC = 29.530588861;
const state = (n, f, k) => ({
  julianDay: 2451550.09766 + f * SYNODIC, age: f * SYNODIC, cycleFraction: f,
  phaseAngle: f * 360, illumination: k, phaseName: n, isInstantPhase: false,
});
const LIT = new Map([[' ', 0], ['░', 0], ['▒', 0.33], ['▓', 0.67], ['█', 1],
  ['▏', 0.15], ['▕', 0.15], ['▌', 0.5], ['▐', 0.5], ['◖', 1], ['◗', 1]]);
const rows5 = (moon, h) => wt.renderBlock(moon, h).split('\n').slice(1, 6)
  .map((r) => Array.from(r).slice(1, -1).join(''));
const lit = (row) => Array.from(row).reduce((s, c) => s + LIT.get(c), 0) > 0;
const broken = (rs) => {
  const L = rs.map(lit);
  for (let i = 1; i < L.length - 1; i++) if (L[i - 1] && !L[i] && L[i + 1]) return i;
  return -1;
};

const STEPS = 20000;
const hits = [];
for (let s = 0; s < STEPS; s++) {
  const f = s / STEPS;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const st = state(f < 0.5 ? 'waxing crescent' : 'waning crescent', f, k);
  for (const h of ['north', 'south']) {
    const rs = rows5(st, h);
    const g = broken(rs);
    if (g >= 0) hits.push({ f, k, h, gap: g, rs });
  }
}
console.log(`surviving broken-arc renders: ${hits.length}`);
console.log(`illumination band: k = ${Math.min(...hits.map((x) => x.k)).toFixed(6)} .. ${Math.max(...hits.map((x) => x.k)).toFixed(6)}`);
console.log(`gap rows seen: ${[...new Set(hits.map((x) => x.gap))].sort().join(', ')}`);
console.log(`hemispheres: ${[...new Set(hits.map((x) => x.h))].join(', ')}`);
console.log('');

// Re-derive the raw geometry the renderer saw, independently of the renderer,
// so the verdict does not rest on the module under test.
function coversForRow(k, waxing, r, ROWS = 5, COLS = 32, N = 400) {
  const y0 = -1 + (2 * r) / ROWS;
  const y1 = -1 + (2 * (r + 1)) / ROWS;
  const out = [];
  for (let c = 0; c < COLS; c++) {
    const x0 = -1 + (2 * c) / COLS;
    const x1 = -1 + (2 * (c + 1)) / COLS;
    let on = 0;
    let litN = 0;
    for (let i = 0; i < N; i++) {
      const x = x0 + ((i + 0.5) / N) * (x1 - x0);
      for (let j = 0; j < N / 20; j++) {
        const y = y0 + ((j + 0.5) / (N / 20)) * (y1 - y0);
        if (x * x + y * y > 1) continue;
        on++;
        // terminator: the lit fraction of the disc is k; the terminator is the
        // ellipse x = (1-2k) * sqrt(1-y^2). Sunward side is right when waxing.
        const xt = (1 - 2 * k) * Math.sqrt(Math.max(0, 1 - y * y));
        if (waxing ? x >= xt : x <= -xt) litN++;
      }
    }
    out.push({ presence: on, cover: on === 0 ? 0 : litN / on });
  }
  return out;
}

for (const sample of [hits[0], hits[Math.floor(hits.length / 2)], hits[hits.length - 1]]) {
  console.log(`--- k=${sample.k.toFixed(6)} f=${sample.f.toFixed(5)} ${sample.h} gap at row ${sample.gap} ---`);
  for (const r of sample.rs) console.log(`    |${r}|  lit=${lit(r) ? 'Y' : 'n'}`);
  const waxing = sample.f < 0.5;
  for (let r = 0; r < 5; r++) {
    const cs = coversForRow(sample.k, waxing, r);
    const onDisc = cs.filter((c) => c.presence > 0);
    const maxCover = Math.max(...onDisc.map((c) => c.cover));
    const anyOver = onDisc.filter((c) => c.cover > 0.02).length;
    console.log(`    row ${r}: independent geometry -> max cover over on-disc cells = ${maxCover.toFixed(5)}, ` +
      `cells with cover>0.02 = ${anyOver}`);
  }
  console.log('');
}
