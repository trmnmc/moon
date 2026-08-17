'use strict';
/*
 * Conductor verification gate, cycle 75, item T-167.
 * Authored AT VERIFICATION TIME by the conductor. The builder never saw it.
 *
 * Compares the working tree's src/render.js against HEAD's (dropped to
 * .swarm/runs/head-render.cjs by the driver) on four questions the builder's
 * own return does NOT settle:
 *   A  does the cited real instant actually go from broken arc -> contiguous?
 *   B  is contiguity restored EVERYWHERE, or only at the one pinned point?
 *   C  does the fix WIDEN the block disc's silhouette? (acceptance forbids it;
 *      note the existing "never widens the disc" test covers renderLine ONLY,
 *      so nothing in the suite gates this for renderBlock)
 *   D  above what illumination is the render byte-identical to HEAD?
 */

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

const wt = require(path.join(REPO, 'src', 'render.js'));
const head = require(path.join(__dirname, 'head-render.cjs'));
const { computeMoon } = require(path.join(REPO, 'src', 'astro.js'));

const SYNODIC = 29.530588861;

// Same MoonState shape the suite's fixtures use.
function state(phaseName, cycleFraction, illumination, isInstantPhase = false) {
  return {
    julianDay: 2451550.09766 + cycleFraction * SYNODIC,
    age: cycleFraction * SYNODIC,
    cycleFraction,
    phaseAngle: cycleFraction * 360,
    illumination,
    phaseName,
    isInstantPhase,
  };
}

// Lit weights, copied from test/render.test.js:85-88.
const LIT = new Map([
  [' ', 0], ['░', 0], ['▒', 0.33], ['▓', 0.67], ['█', 1],
  ['▏', 0.15], ['▕', 0.15], ['▌', 0.5], ['▐', 0.5], ['◖', 1], ['◗', 1],
]);

/** The 5 disc rows of a block render, frame stripped. */
function discRows(mod, moon, hemi) {
  return mod.renderBlock(moon, hemi).split('\n').slice(1, 6).map((r) => Array.from(r).slice(1, -1).join(''));
}

function litRow(row) {
  let sum = 0;
  for (const ch of Array.from(row)) {
    if (!LIT.has(ch)) throw new Error(`unknown glyph ${JSON.stringify(ch)}`);
    sum += LIT.get(ch);
  }
  return sum;
}

/** A dark row sandwiched between two lit rows = the T-167 defect. */
function brokenArc(rows) {
  const lit = rows.map((r) => litRow(r) > 0);
  for (let i = 1; i < lit.length - 1; i++) if (lit[i - 1] && !lit[i] && lit[i + 1]) return true;
  return false;
}

/** Bounding columns of everything DRAWN (non-blank), across all 5 rows. */
function silhouette(rows) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const row of rows) {
    const cells = Array.from(row);
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== ' ') {
        if (i < lo) lo = i;
        if (i > hi) hi = i;
      }
    }
  }
  return { lo, hi };
}

const out = [];
const say = (s) => { out.push(s); console.log(s); };
let failures = 0;
const check = (ok, label, detail) => {
  if (!ok) failures++;
  say(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail === undefined ? '' : ' :: ' + detail}`);
};

// ---------------------------------------------------------------- A: the repro
say('=== A — the cited real instant: 2026-08-11T18:00:00Z, from the SHIPPED astro core ===');
const m = computeMoon(new Date('2026-08-11T18:00:00Z'));
say(`  computeMoon -> illum=${m.illumination.toFixed(4)} phase=${m.phaseName} frac=${m.cycleFraction.toFixed(5)}`);
const rHead = discRows(head, m, 'north');
const rWt = discRows(wt, m, 'north');
say('  HEAD:');
for (const r of rHead) say(`    |${r}|  lit=${litRow(r) > 0 ? 'Y' : 'n'}`);
say('  WORKING TREE:');
for (const r of rWt) say(`    |${r}|  lit=${litRow(r) > 0 ? 'Y' : 'n'}`);
check(brokenArc(rHead), 'HEAD reproduces the broken arc (the defect is real)');
check(!brokenArc(rWt), 'working tree renders a contiguous arc');
check(rWt.every((r) => litRow(r) > 0), 'working tree: every row of the crescent is lit');

// ------------------------------------------------- B: contiguity, whole cycle
say('');
say('=== B — contiguity SWEEP, not just the pinned point (40000 steps x 2 hemispheres) ===');
const STEPS = 20000;
let brokeHead = 0;
let brokeWt = 0;
let firstWtBreak = null;
for (let s = 0; s < STEPS; s++) {
  const f = s / STEPS;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const st = state(f < 0.5 ? 'waxing crescent' : 'waning crescent', f, k);
  for (const hemi of ['north', 'south']) {
    if (brokenArc(discRows(head, st, hemi))) brokeHead++;
    if (brokenArc(discRows(wt, st, hemi))) {
      brokeWt++;
      if (firstWtBreak === null) firstWtBreak = { f, k, hemi };
    }
  }
}
say(`  HEAD broken-arc renders: ${brokeHead} / ${STEPS * 2}`);
say(`  WT   broken-arc renders: ${brokeWt} / ${STEPS * 2}`);
check(brokeHead > 0, 'HEAD is broken across a measurable band, not at one lucky point');
check(brokeWt === 0, 'working tree: ZERO broken arcs anywhere in the cycle',
  firstWtBreak ? `first at f=${firstWtBreak.f} k=${firstWtBreak.k}` : 'none');

// ------------------------------------------------- C: does the disc get wider?
say('');
say('=== C — silhouette: does the fix WIDEN the block disc? (acceptance forbids it) ===');
let grew = 0;
let worstGrow = null;
let sameBox = 0;
for (let s = 0; s < STEPS; s++) {
  const f = s / STEPS;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const st = state(f < 0.5 ? 'waxing crescent' : 'waning crescent', f, k);
  for (const hemi of ['north', 'south']) {
    const a = silhouette(discRows(head, st, hemi));
    const b = silhouette(discRows(wt, st, hemi));
    if (a.lo === Infinity || b.lo === Infinity) continue;
    if (b.lo < a.lo || b.hi > a.hi) {
      grew++;
      const d = Math.max(a.lo - b.lo, b.hi - a.hi);
      if (!worstGrow || d > worstGrow.d) worstGrow = { f, k, hemi, d, head: a, wt: b };
    } else sameBox++;
  }
}
say(`  renders whose overall bounding box GREW: ${grew}`);
say(`  renders whose overall bounding box was unchanged or narrower: ${sameBox}`);
if (worstGrow) {
  say(`  worst growth: +${worstGrow.d} col at k=${worstGrow.k.toFixed(5)} (${worstGrow.hemi}) ` +
      `HEAD[${worstGrow.head.lo}..${worstGrow.head.hi}] -> WT[${worstGrow.wt.lo}..${worstGrow.wt.hi}]`);
}
check(grew === 0, 'the block disc silhouette never grows beyond HEAD in any render');

// ---------------------------------------- D: byte-identity at ordinary illum
say('');
say('=== D — where does output differ from HEAD at all? (byte-identity claim) ===');
let maxDiffK = -1;
let diffCount = 0;
const FINE = 200000;
for (let s = 0; s < FINE; s++) {
  const f = s / FINE;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const st = state(f < 0.5 ? 'waxing crescent' : 'waning crescent', f, k);
  let differs = false;
  for (const hemi of ['north', 'south']) {
    if (head.renderBlock(st, hemi) !== wt.renderBlock(st, hemi)) differs = true;
    if (head.renderLine(st, hemi) !== wt.renderLine(st, hemi)) differs = true;
  }
  if (differs) {
    diffCount++;
    if (k > maxDiffK) maxDiffK = k;
  }
}
say(`  sampled ${FINE} cycle points x 2 hemispheres x {renderLine, renderBlock}`);
say(`  points differing from HEAD: ${diffCount}`);
say(`  HIGHEST illumination at which ANY difference appears: k=${maxDiffK.toFixed(6)} (${(maxDiffK * 100).toFixed(3)}%)`);
check(maxDiffK < 0.06, 'all divergence is confined to the thin-crescent band the guard owns');
check(diffCount > 0, 'the fix actually changes something (not a no-op)');

// renderLine must be untouched entirely — the fix is in blockArt only.
let lineDiffs = 0;
for (let s = 0; s < FINE; s++) {
  const f = s / FINE;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const st = state(f < 0.5 ? 'waxing crescent' : 'waning crescent', f, k);
  for (const hemi of ['north', 'south']) {
    if (head.renderLine(st, hemi) !== wt.renderLine(st, hemi)) lineDiffs++;
  }
}
say(`  renderLine differences (the fix must not reach the one-line render): ${lineDiffs}`);
check(lineDiffs === 0, 'renderLine is byte-identical to HEAD everywhere');

say('');
say(failures === 0 ? `GATE A-D: PASS (0 failures)` : `GATE A-D: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
