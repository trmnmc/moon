'use strict';
/*
 * Conductor verification gate — cycle 79, item T-167.
 *
 * AUTHORED AND SEALED BY HASH BEFORE THE BUILDER WAS DISPATCHED. The builder
 * never saw this file and cannot have coded to it. Every check below is
 * derived from the item's ACCEPTANCE clause alone:
 *
 *   "At illuminations low enough to trigger the hairline path, the --block
 *    disc's lit rows form a CONTIGUOUS arc down the limb — no fully dark row
 *    between two lit rows — which is the property the guard's own comment
 *    says it exists to preserve. Pinned by a test that fails against the
 *    current guard. The fix must not widen the disc, must not add a glyph to
 *    the set, and must leave the render at ordinary illuminations
 *    byte-identical."
 *
 * ARM A = the working tree.  ARM B = src/render.js and test/render.test.js as
 * they stand at HEAD (i.e. after cycle 75's PARTIAL attempt 1, which is what
 * "the current guard" means for attempt 2). Every claim is measured in both
 * arms, because a kill you cannot attribute is not evidence (L-029).
 *
 * Usage: node c079-gate-T167.cjs        (cwd anywhere)
 * Exit 0 = PASS, 1 = FAIL.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/opt/targets/moon';
const SYNODIC = 29.530588861;

let failures = 0;
const lines = [];
function say(s) { lines.push(s); console.log(s); }
function check(ok, label, detail) {
  if (!ok) failures++;
  say(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail === undefined ? '' : ` :: ${detail}`}`);
}
function report(label, detail) { say(`  [REPORT] ${label}${detail === undefined ? '' : ` : ${detail}`}`); }

// ---------------------------------------------------------------- arm setup
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'c079-t167-'));
function headFile(rel, asName) {
  const dst = path.join(scratch, asName);
  fs.writeFileSync(dst, execFileSync('git', ['-C', REPO, 'show', `HEAD:${rel}`]));
  return dst;
}
const headRenderPath = headFile('src/render.js', 'head-render.cjs');

const armA = require(path.join(REPO, 'src', 'render.js'));
const armB = require(headRenderPath);

// ------------------------------------------------------------- moon fixture
function state(cycleFraction, illumination) {
  return {
    julianDay: 2451550.09766 + cycleFraction * SYNODIC,
    age: cycleFraction * SYNODIC,
    cycleFraction,
    phaseAngle: cycleFraction * 360,
    illumination,
    phaseName: cycleFraction < 0.5 ? 'waxing crescent' : 'waning crescent',
    isInstantPhase: false,
  };
}

/** The 5 disc rows of a --block render, frame stripped. */
function discRows(mod, moon, hemi) {
  return mod
    .renderBlock(moon, hemi)
    .split('\n')
    .slice(1, 6)
    .map((r) => Array.from(r).slice(1, -1).join(''));
}

/**
 * A row is "lit" if it carries any glyph that is not blank and not the darkest
 * shade. Deliberately glyph-agnostic beyond that: the gate must not encode a
 * particular glyph vocabulary, or a fix that changed the vocabulary could pass
 * or fail for the wrong reason.
 */
const DARKISH = new Set([' ', '░']); // space, light shade
function isLit(row) {
  return Array.from(row).some((ch) => !DARKISH.has(ch));
}
/** The defect: a fully dark row sandwiched between two lit rows. */
function brokenArc(rows) {
  const lit = rows.map(isLit);
  const first = lit.indexOf(true);
  const last = lit.lastIndexOf(true);
  if (first < 0 || last <= first) return false;
  for (let i = first; i <= last; i++) if (!lit[i]) return true;
  return false;
}
/** Column span of the non-blank silhouette, or null when the row is empty. */
function span(row) {
  const cells = Array.from(row);
  let lo = -1;
  let hi = -1;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== ' ') { if (lo < 0) lo = i; hi = i; }
  }
  return lo < 0 ? null : [lo, hi];
}
function glyphs(row, into) { for (const ch of Array.from(row)) into.add(ch); }

// =========================================================== A. the residual
// The item's whole content is the THRESHOLD half left open at cycle 75: a band
// near k ~ 0.0016..0.0019 where rows 1 and 3 still go dark between lit rows.
// ARM B must still show it (the hole is real, not assumed); ARM A must not.
say('');
say('A. the residual band — is the hole real at HEAD, and is it closed in the tree?');

const BAND_LO = 0.0010;
const BAND_HI = 0.0030;
const BAND_STEPS = 4000;
const bandBroken = { A: [], B: [] };
for (let i = 0; i <= BAND_STEPS; i++) {
  const k = BAND_LO + ((BAND_HI - BAND_LO) * i) / BAND_STEPS;
  for (const frac of [0.02, 0.98]) {            // waxing side and waning side
    for (const hemi of ['north', 'south']) {
      const moon = state(frac, k);
      if (brokenArc(discRows(armB, moon, hemi))) bandBroken.B.push([k, frac, hemi]);
      if (brokenArc(discRows(armA, moon, hemi))) bandBroken.A.push([k, frac, hemi]);
    }
  }
}
report(`band k=${BAND_LO}..${BAND_HI}, ${(BAND_STEPS + 1) * 4} renders`);
report('ARM B (HEAD) broken-arc renders', bandBroken.B.length);
report('ARM A (tree) broken-arc renders', bandBroken.A.length);
if (bandBroken.B.length) {
  const [k, frac, hemi] = bandBroken.B[0];
  report('ARM B first break', `k=${k.toFixed(7)} ${frac < 0.5 ? 'waxing' : 'waning'} ${hemi}`);
  say('        ARM B rows: ' + JSON.stringify(discRows(armB, state(frac, k), hemi)));
  say('        ARM A rows: ' + JSON.stringify(discRows(armA, state(frac, k), hemi)));
}
check(bandBroken.B.length > 0,
  'ARM B control: the residual band really does still break the arc at HEAD (the hole is reproduced, not assumed)',
  bandBroken.B.length);
check(bandBroken.A.length === 0,
  'ARM A: no broken arc anywhere in the residual band',
  bandBroken.A.length);

// =================================================== B. the whole lunation
// Contiguity is claimed as a property, not as a point fix, so it is swept.
say('');
say('B. full-lunation sweep — contiguity everywhere, not only at the pinned point');

const SWEEP_STEPS = 20000;
const sweepBroken = { A: [], B: [] };
let widened = 0;
let identicalAbove = 0;
let comparedAbove = 0;
const ORDINARY = 0.05;                 // "ordinary illuminations" — above the hairline band
const glyphA = new Set();
const glyphB = new Set();
let lineDiff = 0;

for (let i = 0; i < SWEEP_STEPS; i++) {
  const frac = i / SWEEP_STEPS;
  // Illumination as a function of phase angle — the real relationship, so the
  // sweep visits the genuinely reachable (k, waxing) pairs rather than a grid.
  const k = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const moon = state(frac, k);
  for (const hemi of ['north', 'south']) {
    const rowsA = discRows(armA, moon, hemi);
    const rowsB = discRows(armB, moon, hemi);
    if (brokenArc(rowsA)) sweepBroken.A.push([frac, k, hemi]);
    if (brokenArc(rowsB)) sweepBroken.B.push([frac, k, hemi]);
    for (let r = 0; r < rowsA.length; r++) {
      glyphs(rowsA[r], glyphA);
      glyphs(rowsB[r], glyphB);
      const sA = span(rowsA[r]);
      const sB = span(rowsB[r]);
      if (sA && sB && (sA[0] < sB[0] || sA[1] > sB[1])) widened++;
      if (sA && !sB) widened++;
    }
    if (k >= ORDINARY) {
      comparedAbove++;
      if (rowsA.join('\n') === rowsB.join('\n')) identicalAbove++;
    }
    if (armA.renderLine(moon, hemi) !== armB.renderLine(moon, hemi)) lineDiff++;
  }
}
report(`sweep: ${SWEEP_STEPS} cycle steps x 2 hemispheres = ${SWEEP_STEPS * 2} renders`);
report('ARM B (HEAD) broken-arc renders', sweepBroken.B.length);
report('ARM A (tree) broken-arc renders', sweepBroken.A.length);
check(sweepBroken.A.length === 0,
  'ARM A: the block disc never breaks its arc across a whole lunation, both hemispheres',
  sweepBroken.A.length);
check(sweepBroken.A.length < sweepBroken.B.length,
  'ARM A strictly improves on ARM B over the same sweep (the change does something)',
  `${sweepBroken.B.length} -> ${sweepBroken.A.length}`);

// ==================================== C/D/E. the three acceptance constraints
say('');
say('C-E. the acceptance constraints: no widening, no new glyph, ordinary render untouched');

check(widened === 0,
  'C: the disc silhouette NEVER grows wider than HEAD on any row of any render',
  widened);

const newGlyphs = [...glyphA].filter((g) => !glyphB.has(g));
report('ARM A glyph set', JSON.stringify([...glyphA].sort()));
report('ARM B glyph set', JSON.stringify([...glyphB].sort()));
check(newGlyphs.length === 0,
  'D: no glyph was added to the set',
  JSON.stringify(newGlyphs));

report(`E: renders at k >= ${ORDINARY} compared`, comparedAbove);
check(comparedAbove > 0 && identicalAbove === comparedAbove,
  `E: every render at ordinary illumination (k >= ${ORDINARY}) is byte-identical to HEAD`,
  `${identicalAbove}/${comparedAbove}`);
check(lineDiff === 0,
  'E2: renderLine (the primary one-line interface) is byte-identical to HEAD everywhere',
  lineDiff);

// ============================================ F. the test is real and failable
// "Pinned by a test that fails against the current guard." Two arms, by name.
say('');
say('F: the pinning test — failable AND attributable by name, in two arms (L-029)');

function runSuite(renderSrc, testSrc) {
  // Build a throwaway copy of the repo with the chosen render.js / render.test.js
  // so a single test file can be swapped without disturbing the real tree.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c079-arm-'));
  execFileSync('git', ['-C', REPO, 'archive', '--format=tar', 'HEAD', '-o', path.join(dir, 'h.tar')]);
  execFileSync('tar', ['-xf', path.join(dir, 'h.tar'), '-C', dir]);
  fs.copyFileSync(renderSrc, path.join(dir, 'src', 'render.js'));
  fs.copyFileSync(testSrc, path.join(dir, 'test', 'render.test.js'));
  let out;
  try {
    out = execFileSync('node', ['--test', 'test/'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = `${e.stdout || ''}${e.stderr || ''}`;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}
/** Names of failing tests, from the TAP "not ok N - <name>" lines. */
function failedNames(out) {
  const names = [];
  for (const m of out.matchAll(/^not ok \d+ - (.+)$/gm)) names.push(m[1].trim());
  return names;
}

const treeRender = path.join(REPO, 'src', 'render.js');
const treeTest = path.join(REPO, 'test', 'render.test.js');
const headTest = headFile('test/render.test.js', 'head-render.test.js');

const armAA = runSuite(treeRender, treeTest);   // tree render + tree tests  -> must be green
const armBB = runSuite(headRenderPath, treeTest); // HEAD render + tree tests -> must FAIL, by name
const ctrl = runSuite(headRenderPath, headTest);  // HEAD render + HEAD tests -> green (control)

const failAA = failedNames(armAA);
const failBB = failedNames(armBB);
const failCtrl = failedNames(ctrl);
report('ARM A (tree render + tree tests) failing', JSON.stringify(failAA));
report('ARM B (HEAD render + tree tests) failing', JSON.stringify(failBB));
report('CONTROL (HEAD render + HEAD tests) failing', JSON.stringify(failCtrl));

check(failAA.length === 0, 'ARM A: the render suite is green against the fixed render', failAA.length);
check(failBB.length > 0,
  'ARM B: the new/extended test FAILS against the current (HEAD) guard — it is failable',
  JSON.stringify(failBB));
check(failCtrl.length === 0,
  'CONTROL: HEAD tests pass against HEAD render, so ARM B failures are attributable to the TEST change alone, not to a pre-broken suite',
  failCtrl.length);
const genuinelyNew = failBB.filter((n) => !failCtrl.includes(n));
check(genuinelyNew.length > 0,
  'L-029 attribution: at least one named test fails in ARM B that does not already fail in the control',
  JSON.stringify(genuinelyNew));

// ============================================= G. nothing was weakened
say('');
say('G: no gate was opened by weakening it');

const testDiff = execFileSync('git', ['-C', REPO, 'diff', 'HEAD', '--', 'test/render.test.js'], { encoding: 'utf8' });
const removedTests = (testDiff.match(/^-\s*(test|it)\(/gm) || []).length;
const addedTests = (testDiff.match(/^\+\s*(test|it)\(/gm) || []).length;
report('test/render.test.js: test declarations removed / added', `${removedTests} / ${addedTests}`);
check(!/^\+.*\.(only|skip)\s*\(/m.test(testDiff),
  'G1: no test was skipped or narrowed with .only/.skip');
check(!/^\+.*\b(SUB|LINE_CELLS|BLOCK_COLS|BLOCK_ROWS)\s*=/m.test(testDiff),
  'G2: no geometry constant was redefined inside the test file to manufacture a pass');
check(addedTests >= removedTests,
  'G3: the test file did not lose coverage on net',
  `${removedTests} removed, ${addedTests} added`);

const changed = execFileSync('git', ['-C', REPO, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
  .split('\n').filter(Boolean);
report('files changed in the whole tree this cycle', JSON.stringify(changed));
const outOfScope = changed.filter((f) => !['src/render.js', 'test/render.test.js', 'REPORT.md'].includes(f));
check(outOfScope.length === 0,
  'G4: nothing outside the wave\'s two disjoint scopes was touched',
  JSON.stringify(outOfScope));
check(!changed.includes('package.json') && !fs.existsSync(path.join(REPO, 'package-lock.json')),
  'G5: no manifest change, no lockfile — the zero-dependency non-goal holds');

fs.rmSync(scratch, { recursive: true, force: true });

say('');
say(`GATE T-167: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed check(s))`);
fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-079-verify-T167.txt', lines.join('\n') + '\n');
process.exit(failures === 0 ? 0 : 1);
