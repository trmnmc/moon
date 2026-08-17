'use strict';
/*
 * Conductor verification gate — cycle 79, item T-167, VERSION 3 (final).
 *
 * Lineage, kept honest on the record:
 *   v1  sealed 22:26:29Z BEFORE dispatch. Ran -> FAIL x3. Output archived at
 *       cycle-079-verify-T167-v1.txt.
 *   v2  repaired two v1 instrument faults. Ran -> FAIL x5. Output archived at
 *       cycle-079-verify-T167-v2.txt.
 *   v3  repairs the two faults v2 introduced/retained. This file.
 *
 * Every repair so far has been to the GATE's measuring apparatus, and each was
 * diagnosed by direct probe rather than inferred from the failure. None
 * loosened an acceptance criterion. The four faults, measured:
 *
 *   [v1 C]  measured non-blank span PER ROW. Adding a hairline to a row that
 *           had none necessarily grows that row's span by one cell — that IS
 *           the fix. The check fired on the item's own success condition and
 *           could not have passed for any correct fix. Replaced in v2 by three
 *           measures of what "widen the disc" actually means.
 *   [v1 F]  parsed TAP "not ok" lines from a stream carrying SPEC-reporter
 *           output (probe: `node --test <file> | grep -c '^ok \|^not ok '`
 *           returns 0). Matched nothing in every arm and reported all clean —
 *           VACUOUS IN THE PASS DIRECTION. v2 forced --test-reporter=tap and
 *           added an instrument self-check.
 *   [v2 C3] indexed the 12-cell art grid (BLOCK_COLS) with column numbers taken
 *           from the 32-wide framed inner row, so it computed disc geometry for
 *           cells ~10 columns off and called 1464 legitimate hairlines
 *           "off-disc". v3 derives the art offset from the render itself and
 *           PROVES the offset before trusting the verdict (C3-cal below).
 *   [v2 F]  ran `node --test test/`. Probed directly: Node v24.19.0 tries to
 *           LOAD `test/` as a module and dies MODULE_NOT_FOUND, surfacing as a
 *           single failing pseudo-test named "test" in all three arms — which
 *           is exactly the identical `failing=["test"]` v2 reported. v3
 *           expands the project's own `test/*.test.js` glob explicitly.
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

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'c079v3-'));
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
function colsOf(rows) {
  const s = new Set();
  for (const row of rows) {
    const cells = Array.from(row);
    for (let i = 0; i < cells.length; i++) if (cells[i] !== ' ') s.add(i);
  }
  return s;
}

// ================================================================ A. residual
say('');
say('A. the residual band — is the hole real at HEAD, and is it closed in the tree?');
const BAND_LO = 0.0010;
const BAND_HI = 0.0030;
const BAND_STEPS = 4000;
let bandA = 0;
let bandB = 0;
let bandFirstB = null;
for (let i = 0; i <= BAND_STEPS; i++) {
  const k = BAND_LO + ((BAND_HI - BAND_LO) * i) / BAND_STEPS;
  for (const frac of [0.02, 0.98]) {
    for (const hemi of ['north', 'south']) {
      const moon = state(frac, k);
      if (brokenArc(discRows(armB, moon, hemi))) { bandB++; if (!bandFirstB) bandFirstB = [k, frac, hemi]; }
      if (brokenArc(discRows(armA, moon, hemi))) bandA++;
    }
  }
}
report(`band k=${BAND_LO}..${BAND_HI}, ${(BAND_STEPS + 1) * 4} renders`);
report('ARM B (HEAD) broken-arc renders', bandB);
report('ARM A (tree) broken-arc renders', bandA);
if (bandFirstB) {
  const [k, frac, hemi] = bandFirstB;
  report('ARM B first break', `k=${k.toFixed(7)} ${frac < 0.5 ? 'waxing' : 'waning'} ${hemi}`);
  say('        ARM B rows: ' + JSON.stringify(discRows(armB, state(frac, k), hemi)));
  say('        ARM A rows: ' + JSON.stringify(discRows(armA, state(frac, k), hemi)));
}
check(bandB > 0, 'A1 control: the residual band really does still break the arc at HEAD (hole reproduced, not assumed)', bandB);
check(bandA === 0, 'A2: no broken arc anywhere in the residual band', bandA);

// =========================================================== B. lunation sweep
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
    const bA = boxOf(rowsA);
    const bB = boxOf(rowsB);
    if (bA && bB && (bA[0] < bB[0] || bA[1] > bB[1])) boxGrew++;
    if (bA && !bB) boxGrew++;
    const cB = colsOf(rowsB);
    for (const c of colsOf(rowsA)) if (!cB.has(c)) colEscape++;
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

// ============================================= C. must not widen the disc
say('');
say('C. must not widen the disc — three independent measures');
check(boxGrew === 0, 'C1: the WHOLE-RENDER silhouette bounding box never grows vs HEAD (cycle 75\'s measure)', boxGrew);
check(colEscape === 0, 'C2: ARM A never places a glyph on a column HEAD leaves entirely blank', colEscape);

// -- C3: HEAD-free geometry. Derive the art offset from the render, then PROVE it.
const BLOCK_ROWS = 5;
const BLOCK_COLS = 12;
const SUB = 16;
const HAIRLINES = new Set(['▏', '▕']);
const innerWidth = discRows(armA, state(0.5, 1), 'north')[0].length;
const OFFSET = Math.floor((innerWidth - BLOCK_COLS) / 2);
report('framed inner width / art cells / derived art column offset', `${innerWidth} / ${BLOCK_COLS} / ${OFFSET}`);

function presenceOf(r, cArt) {
  const y0 = -1 + (2 * r) / BLOCK_ROWS;
  const y1 = -1 + (2 * (r + 1)) / BLOCK_ROWS;
  const x0 = -1 + (2 * cArt) / BLOCK_COLS;
  const x1 = -1 + (2 * (cArt + 1)) / BLOCK_COLS;
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

// C3-calibration: at full moon every non-blank cell must be an art cell with
// real presence, and every zero-presence art cell must be blank. If the offset
// were wrong this cannot hold, so a passing calibration licenses C3b's verdict.
const fullRows = discRows(armA, state(0.5, 1), 'north');
let calBad = 0;
const calDetail = [];
for (let r = 0; r < fullRows.length; r++) {
  const cells = Array.from(fullRows[r]);
  for (let c = 0; c < cells.length; c++) {
    const art = c - OFFSET;
    const onGrid = art >= 0 && art < BLOCK_COLS;
    const p = onGrid ? presenceOf(r, art) : 0;
    if (cells[c] !== ' ' && p <= 0) { calBad++; if (calDetail.length < 4) calDetail.push(`ink at col ${c} (art ${art}) presence ${p}`); }
    if (onGrid && p >= 0.9 && cells[c] === ' ') { calBad++; if (calDetail.length < 4) calDetail.push(`blank at col ${c} (art ${art}) presence ${p.toFixed(3)}`); }
  }
}
say('        full-moon calibration row: ' + JSON.stringify(fullRows[2]));
check(calBad === 0,
  'C3-cal: the derived art offset is PROVEN against a full moon (all ink on-disc, all solidly-on-disc cells inked) — without this the C3b verdict would be meaningless',
  `${calBad} ${JSON.stringify(calDetail)}`);

let offDisc = 0;
let hairlinesSeen = 0;
const offSamples = [];
for (let i = 0; i < 4000; i++) {
  const frac = i / 4000;
  const k = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const rows = discRows(armA, state(frac, k), 'north');
  for (let r = 0; r < rows.length; r++) {
    const cells = Array.from(rows[r]);
    for (let c = 0; c < cells.length; c++) {
      if (!HAIRLINES.has(cells[c])) continue;
      hairlinesSeen++;
      const art = c - OFFSET;
      const p = (art >= 0 && art < BLOCK_COLS) ? presenceOf(r, art) : 0;
      if (p <= 0) {
        offDisc++;
        if (offSamples.length < 3) offSamples.push({ k: Number(k.toFixed(7)), row: r, col: c, art });
      }
    }
  }
}
report('hairline glyphs inspected (northern, 4000 phase steps)', hairlinesSeen);
check(hairlinesSeen > 0, 'C3a non-vacuity: hairlines were actually found to inspect', hairlinesSeen);
check(offDisc === 0,
  'C3b: every hairline ARM A draws sits on a cell with real geometric presence on the disc — computed from the circle, no reference to HEAD',
  `${offDisc} ${JSON.stringify(offSamples)}`);

// ============================================ D/E. glyph set, ordinary render
say('');
say('D-E. glyph set unchanged; ordinary illuminations byte-identical');
report('ARM A glyph set', JSON.stringify([...glyphA].sort()));
report('ARM B glyph set', JSON.stringify([...glyphB].sort()));
const newGlyphs = [...glyphA].filter((g) => !glyphB.has(g));
check(newGlyphs.length === 0, 'D: no glyph was added to the set', JSON.stringify(newGlyphs));
report(`renders at k >= ${ORDINARY} compared`, comparedAbove);
check(comparedAbove > 0 && identicalAbove === comparedAbove,
  `E: every render at ordinary illumination (k >= ${ORDINARY}) is byte-identical to HEAD`, `${identicalAbove}/${comparedAbove}`);
check(lineDiff === 0, 'E2: renderLine is byte-identical to HEAD everywhere', lineDiff);

// ================================================= F. the pinning test, 2 arms
say('');
say('F: the pinning test — failable AND attributable by name, in two arms (L-029)');

function runSuite(renderSrc, testSrc, tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c079v3-arm-'));
  execFileSync('git', ['-C', REPO, 'archive', '--format=tar', 'HEAD', '-o', path.join(dir, 'h.tar')]);
  execFileSync('tar', ['-xf', path.join(dir, 'h.tar'), '-C', dir]);
  fs.copyFileSync(renderSrc, path.join(dir, 'src', 'render.js'));
  fs.copyFileSync(testSrc, path.join(dir, 'test', 'render.test.js'));
  // Expand the project's own `test/*.test.js` glob — Node 24 cannot take a bare
  // directory here (probed: it resolves `test/` as a module and dies).
  const files = fs.readdirSync(path.join(dir, 'test'))
    .filter((f) => f.endsWith('.test.js')).sort().map((f) => `test/${f}`);
  const res = spawnSync('node', ['--test', '--test-reporter=tap', ...files],
    { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${res.stdout || ''}${res.stderr || ''}`;
  fs.rmSync(dir, { recursive: true, force: true });
  const names = [];
  for (const m of out.matchAll(/^not ok \d+ - (.+)$/gm)) names.push(m[1].trim());
  const okCount = (out.match(/^ok \d+ - /gm) || []).length;
  return { tag, names, code: res.status, files: files.length, parsed: okCount + names.length };
}

const treeRender = path.join(REPO, 'src', 'render.js');
const treeTest = path.join(REPO, 'test', 'render.test.js');
const headTest = headFile('test/render.test.js', 'head-render.test.js');

const AA = runSuite(treeRender, treeTest, 'ARM A   tree render + tree tests');
const BB = runSuite(headRenderPath, treeTest, 'ARM B   HEAD render + tree tests');
const CT = runSuite(headRenderPath, headTest, 'CONTROL HEAD render + HEAD tests');
for (const a of [AA, BB, CT]) {
  report(a.tag, `exit=${a.code} test_files=${a.files} tap_assertions=${a.parsed} failing=${JSON.stringify(a.names)}`);
}
check(AA.parsed > 100 && BB.parsed > 100 && CT.parsed > 100,
  'F0 instrument self-check: the TAP parser saw a full suite\'s worth of assertions in every arm (v1 saw 0, v2 saw 1)',
  `${AA.parsed} / ${BB.parsed} / ${CT.parsed}`);
for (const a of [AA, BB, CT]) {
  check((a.code === 0) === (a.names.length === 0),
    `F0b instrument self-check: exit code agrees with the parse — ${a.tag}`, `exit=${a.code} failing=${a.names.length}`);
}
check(AA.code === 0 && AA.names.length === 0, 'F1 ARM A: the suite is green against the fixed render', `exit=${AA.code}`);
check(BB.names.length > 0, 'F2 ARM B: the new test FAILS against the current (HEAD) guard — it is failable', JSON.stringify(BB.names));
check(CT.code === 0 && CT.names.length === 0,
  'F3 CONTROL: HEAD tests pass against HEAD render, so ARM B failures are attributable to the TEST change alone', `exit=${CT.code}`);
const genuinelyNew = BB.names.filter((n) => !CT.names.includes(n));
check(genuinelyNew.length > 0,
  'F4 L-029 attribution: a named test fails in ARM B that does not already fail in the control', JSON.stringify(genuinelyNew));
check(genuinelyNew.length === BB.names.length,
  'F5: ARM B\'s failures are CONFINED to the new test — the fix did not silently rely on breaking something else',
  `${genuinelyNew.length}/${BB.names.length}`);

// ==================================================== G. nothing weakened
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
say(`GATE T-167 (v3): ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed check(s))`);
fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-079-verify-T167.txt', lines.join('\n') + '\n');
process.exit(failures === 0 ? 0 : 1);
