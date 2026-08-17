'use strict';
/*
 * Conductor verification gate — cycle 79, item T-167, VERSION 2.
 *
 * v1 (c079-gate-T167.cjs, sealed 22:26:29Z before dispatch) ran and returned
 * FAIL on 3 checks. Two of the three were INSTRUMENT ERRORS in the gate, not
 * defects in the work, and this file repairs them. Both repairs make the gate
 * STRICTER or ABLE-TO-FAIL; neither opens it. v1 is kept on disk unmodified,
 * and its full output is in cycle-079-verify-T167-v1.txt, so the repair is
 * auditable rather than asserted.
 *
 * REPAIR 1 — check C ("must not widen the disc") asked the wrong question.
 *   v1 measured the non-blank column span PER ROW and flagged 864 growths.
 *   But adding a hairline to a row that previously had none IS the fix: the
 *   glyph the guard exists to place necessarily extends that row's non-blank
 *   extent by one cell. v1's C therefore fired on the item's own success
 *   condition and could never have passed for any correct fix — a broken
 *   instrument, not a finding.
 *   v2 asks what "widen the disc" actually means, three ways, all stricter
 *   than v1 in the direction that matters:
 *     C1  the WHOLE-RENDER silhouette bounding box never grows (cycle 75's
 *         measure, so this cycle is comparable to that one)
 *     C2  no glyph in ARM A ever lands on a column that ARM B leaves blank
 *         across the entire render
 *     C3  every hairline ARM A places sits on a cell with real geometric
 *         presence on the disc — computed from the circle directly, with NO
 *         reference to HEAD at all. This is the failure mode "don't widen the
 *         disc" was actually guarding against (painting light into empty
 *         space off the limb), and v1 never tested it.
 *
 * REPAIR 2 — check F was VACUOUS IN THE PASS DIRECTION.
 *   v1 parsed failing test names from TAP "not ok N - <name>" lines. This
 *   Node build defaults to the SPEC reporter even when stdout is not a TTY
 *   (measured: `node --test test/render.test.js | grep -c '^ok \|^not ok '`
 *   returns 0), so v1's parser matched nothing in EVERY arm and reported all
 *   three as clean. ARM A's "green" was therefore just as meaningless as
 *   ARM B's "no failures" — the check could not have failed.
 *   v2 forces `--test-reporter=tap` AND cross-checks the child's exit code
 *   against the parse, so a reporter surprise can never again be read as a
 *   pass. If the two disagree the gate FAILS rather than guessing.
 *
 * Everything v1 PASSED (A, B, D, E, E2, G1-G5) is re-run here unchanged.
 *
 * Exit 0 = PASS, 1 = FAIL.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

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

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'c079v2-'));
function headFile(rel, asName) {
  const dst = path.join(scratch, asName);
  fs.writeFileSync(dst, execFileSync('git', ['-C', REPO, 'show', `HEAD:${rel}`]));
  return dst;
}
const headRenderPath = headFile('src/render.js', 'head-render.cjs');
const armA = require(path.join(REPO, 'src', 'render.js'));
const armB = require(headRenderPath);

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
function discRows(mod, moon, hemi) {
  return mod.renderBlock(moon, hemi).split('\n').slice(1, 6)
    .map((r) => Array.from(r).slice(1, -1).join(''));
}
const DARKISH = new Set([' ', '░']);
const isLit = (row) => Array.from(row).some((ch) => !DARKISH.has(ch));
function brokenArc(rows) {
  const lit = rows.map(isLit);
  const first = lit.indexOf(true);
  const last = lit.lastIndexOf(true);
  if (first < 0 || last <= first) return false;
  for (let i = first; i <= last; i++) if (!lit[i]) return true;
  return false;
}
/** Non-blank column extent of a whole render (all rows together), or null. */
function boxOf(rows) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const row of rows) {
    const cells = Array.from(row);
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== ' ') { if (i < lo) lo = i; if (i > hi) hi = i; }
    }
  }
  return hi < 0 ? null : [lo, hi];
}
/** Columns that are non-blank somewhere in the render. */
function colsOf(rows) {
  const s = new Set();
  for (const row of rows) {
    const cells = Array.from(row);
    for (let i = 0; i < cells.length; i++) if (cells[i] !== ' ') s.add(i);
  }
  return s;
}

// ============================================ A. residual band (v1: PASSED)
say('');
say('A. the residual band — is the hole real at HEAD, and is it closed in the tree?');
const BAND_LO = 0.0010;
const BAND_HI = 0.0030;
const BAND_STEPS = 4000;
const bandBroken = { A: 0, B: 0 };
let bandFirstB = null;
for (let i = 0; i <= BAND_STEPS; i++) {
  const k = BAND_LO + ((BAND_HI - BAND_LO) * i) / BAND_STEPS;
  for (const frac of [0.02, 0.98]) {
    for (const hemi of ['north', 'south']) {
      const moon = state(frac, k);
      if (brokenArc(discRows(armB, moon, hemi))) { bandBroken.B++; if (!bandFirstB) bandFirstB = [k, frac, hemi]; }
      if (brokenArc(discRows(armA, moon, hemi))) bandBroken.A++;
    }
  }
}
report(`band k=${BAND_LO}..${BAND_HI}, ${(BAND_STEPS + 1) * 4} renders`);
report('ARM B (HEAD) broken-arc renders', bandBroken.B);
report('ARM A (tree) broken-arc renders', bandBroken.A);
if (bandFirstB) {
  const [k, frac, hemi] = bandFirstB;
  report('ARM B first break', `k=${k.toFixed(7)} ${frac < 0.5 ? 'waxing' : 'waning'} ${hemi}`);
  say('        ARM B rows: ' + JSON.stringify(discRows(armB, state(frac, k), hemi)));
  say('        ARM A rows: ' + JSON.stringify(discRows(armA, state(frac, k), hemi)));
}
check(bandBroken.B > 0, 'A1 control: the residual band really does still break the arc at HEAD (hole reproduced, not assumed)', bandBroken.B);
check(bandBroken.A === 0, 'A2: no broken arc anywhere in the residual band', bandBroken.A);

// ======================================== B. full lunation sweep (v1: PASSED)
say('');
say('B. full-lunation sweep — contiguity everywhere, not only at the pinned point');
const SWEEP_STEPS = 20000;
const ORDINARY = 0.05;
let sweepA = 0;
let sweepB = 0;
let boxGrew = 0;
let colEscape = 0;
let identicalAbove = 0;
let comparedAbove = 0;
let lineDiff = 0;
const glyphA = new Set();
const glyphB = new Set();
const escapeSamples = [];
for (let i = 0; i < SWEEP_STEPS; i++) {
  const frac = i / SWEEP_STEPS;
  const k = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const moon = state(frac, k);
  for (const hemi of ['north', 'south']) {
    const rowsA = discRows(armA, moon, hemi);
    const rowsB = discRows(armB, moon, hemi);
    if (brokenArc(rowsA)) sweepA++;
    if (brokenArc(rowsB)) sweepB++;
    for (const row of rowsA) for (const ch of Array.from(row)) glyphA.add(ch);
    for (const row of rowsB) for (const ch of Array.from(row)) glyphB.add(ch);
    // C1 — whole-render bounding box
    const bA = boxOf(rowsA);
    const bB = boxOf(rowsB);
    if (bA && bB && (bA[0] < bB[0] || bA[1] > bB[1])) boxGrew++;
    if (bA && !bB) boxGrew++;
    // C2 — no glyph on a column HEAD leaves entirely blank
    const cB = colsOf(rowsB);
    for (const c of colsOf(rowsA)) {
      if (!cB.has(c)) { colEscape++; if (escapeSamples.length < 3) escapeSamples.push({ k, hemi, col: c }); }
    }
    if (k >= ORDINARY) {
      comparedAbove++;
      if (rowsA.join('\n') === rowsB.join('\n')) identicalAbove++;
    }
    if (armA.renderLine(moon, hemi) !== armB.renderLine(moon, hemi)) lineDiff++;
  }
}
report(`sweep: ${SWEEP_STEPS} cycle steps x 2 hemispheres = ${SWEEP_STEPS * 2} renders`);
report('ARM B (HEAD) broken-arc renders', sweepB);
report('ARM A (tree) broken-arc renders', sweepA);
check(sweepA === 0, 'B1: the block disc never breaks its arc across a whole lunation, both hemispheres', sweepA);
check(sweepA < sweepB, 'B2: ARM A strictly improves on ARM B over the same sweep', `${sweepB} -> ${sweepA}`);

// =================================== C. "must not widen the disc", three ways
say('');
say('C. must not widen the disc — three independent measures (v2 repair)');
check(boxGrew === 0, 'C1: the WHOLE-RENDER silhouette bounding box never grows vs HEAD (cycle 75\'s measure)', boxGrew);
check(colEscape === 0, 'C2: ARM A never places a glyph on a column HEAD leaves entirely blank', `${colEscape} ${JSON.stringify(escapeSamples)}`);

// C3 — HEAD-free: every hairline must sit on a cell with real presence on the disc.
const BLOCK_ROWS = 5;
const BLOCK_COLS = 12;
const SUB = 16;
const HAIRLINES = new Set(['▏', '▕']);
function presenceOf(r, c) {
  const y0 = -1 + (2 * r) / BLOCK_ROWS;
  const y1 = -1 + (2 * (r + 1)) / BLOCK_ROWS;
  const x0 = -1 + (2 * c) / BLOCK_COLS;
  const x1 = -1 + (2 * (c + 1)) / BLOCK_COLS;
  let inside = 0;
  for (let i = 0; i < SUB; i++) {
    const y = y0 + ((i + 0.5) / SUB) * (y1 - y0);
    const yy = y * y;
    if (yy >= 1) continue;
    for (let j = 0; j < SUB; j++) {
      const x = x0 + ((j + 0.5) / SUB) * (x1 - x0);
      if (x * x + yy <= 1) inside++;
    }
  }
  return inside / (SUB * SUB);
}
let offDisc = 0;
let hairlinesSeen = 0;
const offSamples = [];
for (let i = 0; i < 4000; i++) {
  const frac = i / 4000;
  const k = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const rows = discRows(armA, state(frac, k), 'north'); // northern only: south is a mirror
  for (let r = 0; r < rows.length; r++) {
    const cells = Array.from(rows[r]);
    for (let c = 0; c < cells.length; c++) {
      if (!HAIRLINES.has(cells[c])) continue;
      hairlinesSeen++;
      if (presenceOf(r, c) <= 0) {
        offDisc++;
        if (offSamples.length < 3) offSamples.push({ k: Number(k.toFixed(7)), row: r, col: c });
      }
    }
  }
}
report('hairline glyphs inspected (northern, 4000 phase steps)', hairlinesSeen);
check(hairlinesSeen > 0, 'C3a non-vacuity: hairlines were actually found to inspect', hairlinesSeen);
check(offDisc === 0,
  'C3b: every hairline ARM A draws sits on a cell with real geometric presence on the disc — computed from the circle, with no reference to HEAD',
  `${offDisc} ${JSON.stringify(offSamples)}`);

// ================================== D/E. glyph set + ordinary render (v1: PASSED)
say('');
say('D-E. glyph set unchanged; ordinary illuminations byte-identical');
report('ARM A glyph set', JSON.stringify([...glyphA].sort()));
report('ARM B glyph set', JSON.stringify([...glyphB].sort()));
const newGlyphs = [...glyphA].filter((g) => !glyphB.has(g));
check(newGlyphs.length === 0, 'D: no glyph was added to the set', JSON.stringify(newGlyphs));
report(`renders at k >= ${ORDINARY} compared`, comparedAbove);
check(comparedAbove > 0 && identicalAbove === comparedAbove,
  `E: every render at ordinary illumination (k >= ${ORDINARY}) is byte-identical to HEAD`,
  `${identicalAbove}/${comparedAbove}`);
check(lineDiff === 0, 'E2: renderLine is byte-identical to HEAD everywhere', lineDiff);

// ============================== F. the pinning test, with a WORKING instrument
say('');
say('F: the pinning test — failable AND attributable by name, in two arms (L-029)');
say('   v2 forces --test-reporter=tap and cross-checks the child exit code, because');
say('   v1 parsed TAP lines from a SPEC-reporter stream and matched nothing in every arm.');

function runSuite(renderSrc, testSrc, tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c079v2-arm-'));
  execFileSync('git', ['-C', REPO, 'archive', '--format=tar', 'HEAD', '-o', path.join(dir, 'h.tar')]);
  execFileSync('tar', ['-xf', path.join(dir, 'h.tar'), '-C', dir]);
  fs.copyFileSync(renderSrc, path.join(dir, 'src', 'render.js'));
  fs.copyFileSync(testSrc, path.join(dir, 'test', 'render.test.js'));
  const res = spawnSync('node', ['--test', '--test-reporter=tap', 'test/'],
    { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${res.stdout || ''}${res.stderr || ''}`;
  fs.rmSync(dir, { recursive: true, force: true });
  const names = [];
  for (const m of out.matchAll(/^not ok \d+ - (.+)$/gm)) names.push(m[1].trim());
  const okCount = (out.match(/^ok \d+ - /gm) || []).length;
  return { tag, names, code: res.status, okCount, parsed: okCount + names.length };
}

const treeRender = path.join(REPO, 'src', 'render.js');
const treeTest = path.join(REPO, 'test', 'render.test.js');
const headTest = headFile('test/render.test.js', 'head-render.test.js');

const AA = runSuite(treeRender, treeTest, 'ARM A  tree render + tree tests');
const BB = runSuite(headRenderPath, treeTest, 'ARM B  HEAD render + tree tests');
const CT = runSuite(headRenderPath, headTest, 'CONTROL HEAD render + HEAD tests');
for (const a of [AA, BB, CT]) {
  report(a.tag, `exit=${a.code} tap_assertions_parsed=${a.parsed} failing=${JSON.stringify(a.names)}`);
}
// The instrument must prove itself before its verdicts are trusted.
check(AA.parsed > 0 && BB.parsed > 0 && CT.parsed > 0,
  'F0 instrument self-check: the TAP parser actually saw assertions in every arm (v1 saw none and called it clean)',
  `${AA.parsed} / ${BB.parsed} / ${CT.parsed}`);
for (const a of [AA, BB, CT]) {
  check((a.code === 0) === (a.names.length === 0),
    `F0b instrument self-check: exit code agrees with the parse for ${a.tag}`,
    `exit=${a.code} failing=${a.names.length}`);
}
check(AA.code === 0 && AA.names.length === 0, 'F1 ARM A: the suite is green against the fixed render', `exit=${AA.code}`);
check(BB.names.length > 0, 'F2 ARM B: the new test FAILS against the current (HEAD) guard — it is failable', JSON.stringify(BB.names));
check(CT.code === 0 && CT.names.length === 0,
  'F3 CONTROL: HEAD tests pass against HEAD render, so ARM B failures are attributable to the TEST change alone', `exit=${CT.code}`);
const genuinelyNew = BB.names.filter((n) => !CT.names.includes(n));
check(genuinelyNew.length > 0,
  'F4 L-029 attribution: a named test fails in ARM B that does not already fail in the control',
  JSON.stringify(genuinelyNew));
check(genuinelyNew.length === BB.names.length,
  'F5: ARM B\'s failures are CONFINED to the new test — the fix did not silently rely on breaking something else',
  `${genuinelyNew.length}/${BB.names.length}`);

// ================================================= G. nothing weakened (v1: PASSED)
say('');
say('G: no gate was opened by weakening it');
const testDiff = execFileSync('git', ['-C', REPO, 'diff', 'HEAD', '--', 'test/render.test.js'], { encoding: 'utf8' });
const removedTests = (testDiff.match(/^-\s*(test|it)\(/gm) || []).length;
const addedTests = (testDiff.match(/^\+\s*(test|it)\(/gm) || []).length;
report('test/render.test.js: test declarations removed / added', `${removedTests} / ${addedTests}`);
check(!/^\+.*\.(only|skip)\s*\(/m.test(testDiff), 'G1: no test skipped or narrowed with .only/.skip');
check(!/^\+.*\b(SUB|LINE_CELLS|BLOCK_COLS|BLOCK_ROWS)\s*=/m.test(testDiff), 'G2: no geometry constant redefined in the test file');
check(addedTests >= removedTests, 'G3: the test file did not lose coverage on net', `${removedTests} removed, ${addedTests} added`);
const changed = execFileSync('git', ['-C', REPO, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' }).split('\n').filter(Boolean);
report('files changed in the whole tree this cycle', JSON.stringify(changed));
const outOfScope = changed.filter((f) => !['src/render.js', 'test/render.test.js', 'REPORT.md'].includes(f));
check(outOfScope.length === 0, 'G4: nothing outside the wave\'s two disjoint scopes was touched', JSON.stringify(outOfScope));
check(!changed.includes('package.json') && !fs.existsSync(path.join(REPO, 'package-lock.json')),
  'G5: no manifest change, no lockfile — the zero-dependency non-goal holds');

fs.rmSync(scratch, { recursive: true, force: true });
say('');
say(`GATE T-167 (v2): ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed check(s))`);
fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-079-verify-T167.txt', lines.join('\n') + '\n');
process.exit(failures === 0 ? 0 : 1);
