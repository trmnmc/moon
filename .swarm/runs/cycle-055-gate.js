'use strict';
/**
 * Conductor's INDEPENDENT verification gate for T-146 (cycle 55).
 * Written at verification time, not copied from the builder's harness and not
 * shown to the builder. Re-derives the L1 witness, then runs both arms in a
 * form the builder did not use for arm B (whole-file checkout of the
 * pre-existing test suite rather than commenting out one assertion).
 *
 * Every mutation is applied under try/finally with a git checkout restore.
 */

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = '/opt/targets/moon';
const RENDER = path.join(REPO, 'src/render.js');
const RTEST = path.join(REPO, 'test/render.test.js');

const L1_TRUTH = 'if (cover < 0.02) out += LIMB_DARK;';
const L1_MUTANT = 'if (cover < 0.05) out += LIMB_DARK;';

const testFiles = fs
  .readdirSync(path.join(REPO, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join('test', f));

function git(...args) {
  return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' });
}

function runSuite() {
  const r = spawnSync('node', ['--test', '--test-reporter=tap', ...testFiles], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const notOk = out
    .split('\n')
    .filter((l) => /^not ok \d+/.test(l.trim()))
    .map((l) => l.trim());
  const grab = (key) => {
    const m = out.match(new RegExp('^# ' + key + ' (\\d+)$', 'm'));
    return m ? Number(m[1]) : null;
  };
  return { status: r.status, notOk, pass: grab('pass'), fail: grab('fail'), tests: grab('tests') };
}

function applyL1() {
  const src = fs.readFileSync(RENDER, 'utf8');
  const hits = src.split(L1_TRUTH).length - 1;
  if (hits !== 1) throw new Error(`expected exactly 1 occurrence of the L1 site, found ${hits}`);
  fs.writeFileSync(RENDER, src.replace(L1_TRUTH, L1_MUTANT));
}

function restore(...paths) {
  git('checkout', '--', ...paths);
}

const report = [];
const say = (s) => {
  report.push(s);
  console.log(s);
};

// ---------------------------------------------------------------------------
// GATE 0 — the mutation site exists exactly once, and the tree is what we think
// ---------------------------------------------------------------------------
say('=== GATE 0: tree shape ===');
say('git diff --stat (tracked):');
say(git('diff', '--stat').trimEnd() || '  (empty)');
say(`L1 site occurrences in src/render.js: ${fs.readFileSync(RENDER, 'utf8').split(L1_TRUTH).length - 1}`);
say('');

// ---------------------------------------------------------------------------
// GATE 1 — re-derive the witness on the PRISTINE tree, independent of the test
// ---------------------------------------------------------------------------
say('=== GATE 1: witness re-derivation on the pristine tree ===');
delete require.cache[require.resolve(RENDER)];
const { renderLine } = require(RENDER);
const SYNODIC = 29.530588861;
const f = 0.025725;
const k = 0.006517;
const mkState = () => ({
  julianDay: 2451550.09766 + f * SYNODIC,
  age: f * SYNODIC,
  cycleFraction: f,
  phaseAngle: f * 360,
  illumination: k,
  phaseName: 'waxing crescent',
  isInstantPhase: false,
});
const truthLine = renderLine(mkState(), 'north');
say(`truth  renderLine(f=${f}, k=${k}, north) = ${JSON.stringify(truthLine)}`);
// physical-consistency check of the fixture against the file's own stated rule
const kExact = (1 - Math.cos(2 * Math.PI * f)) / 2;
say(`fixture consistency: k=(1-cos 2pi f)/2 = ${kExact.toFixed(9)} vs fixture ${k} (delta ${Math.abs(kExact - k).toExponential(2)})`);
say('');

// ---------------------------------------------------------------------------
// GATE 2 — the same witness under the L1 mutation must diverge, visibly
// ---------------------------------------------------------------------------
say('=== GATE 2: L1 mutant diverges on the witness ===');
let mutantLine;
try {
  applyL1();
  const r2 = spawnSync(
    'node',
    [
      '-e',
      `const {renderLine}=require('${RENDER}');const S=29.530588861,f=${f},k=${k};` +
        `console.log(JSON.stringify(renderLine({julianDay:2451550.09766+f*S,age:f*S,cycleFraction:f,` +
        `phaseAngle:f*360,illumination:k,phaseName:'waxing crescent',isInstantPhase:false},'north')));`,
    ],
    { cwd: REPO, encoding: 'utf8' }
  );
  mutantLine = JSON.parse(r2.stdout.trim());
} finally {
  restore('src/render.js');
}
say(`mutant renderLine(same input)             = ${JSON.stringify(mutantLine)}`);
say(`DIVERGES: ${truthLine !== mutantLine}`);
say(`  truth  chars: ${[...truthLine.slice(0, 5)].map((c) => c.codePointAt(0).toString(16)).join(' ')}`);
say(`  mutant chars: ${[...mutantLine.slice(0, 5)].map((c) => c.codePointAt(0).toString(16)).join(' ')}`);
say('');

// ---------------------------------------------------------------------------
// GATE 3 — ARM A: mutation applied, new test present => RED, attributed by name
// ---------------------------------------------------------------------------
say('=== GATE 3 (ARM A): mutation + new test => must be RED, with names ===');
let armA;
try {
  applyL1();
  armA = runSuite();
} finally {
  restore('src/render.js');
}
say(`exit=${armA.status} tests=${armA.tests} pass=${armA.pass} fail=${armA.fail}`);
say(`failing tests (${armA.notOk.length}):`);
armA.notOk.forEach((l) => say('  ' + l));
say('');

// ---------------------------------------------------------------------------
// GATE 4 — ARM B: mutation applied, PRE-EXISTING suite only => must be GREEN.
// Done by checking test/render.test.js out at HEAD (i.e. the new test does not
// exist at all), which is a stronger and independent form of "remove the new
// assertion": it also re-proves that L1 genuinely survived the 145-test suite.
// ---------------------------------------------------------------------------
say('=== GATE 4 (ARM B): mutation + HEAD suite (new test absent) => must be GREEN ===');
const newTestSource = fs.readFileSync(RTEST, 'utf8');
let armB;
try {
  applyL1();
  fs.writeFileSync(RTEST, git('show', 'HEAD:test/render.test.js'));
  armB = runSuite();
} finally {
  restore('src/render.js');
  fs.writeFileSync(RTEST, newTestSource);
}
say(`exit=${armB.status} tests=${armB.tests} pass=${armB.pass} fail=${armB.fail}`);
say(`failing tests (${armB.notOk.length}): ${armB.notOk.length === 0 ? '(none — L1 survives without the new test)' : armB.notOk.join(' | ')}`);
say('');

// ---------------------------------------------------------------------------
// GATE 5 — clean tree, unmutated: full suite green
// ---------------------------------------------------------------------------
say('=== GATE 5: clean tree, unmutated suite ===');
const clean = runSuite();
say(`exit=${clean.status} tests=${clean.tests} pass=${clean.pass} fail=${clean.fail}`);
say(`git diff --stat after all gates:`);
say(git('diff', '--stat').trimEnd() || '  (empty)');
say('');

// ---------------------------------------------------------------------------
// VERDICT
// ---------------------------------------------------------------------------
const checks = {
  'witness diverges under L1': truthLine !== mutantLine,
  'test asserts the TRUTH string': newTestSource.includes(JSON.stringify(truthLine).slice(1, -1)) || newTestSource.includes(truthLine),
  'ARM A red': armA.status !== 0 && armA.fail === 1,
  'ARM A attributed to exactly the new test': armA.notOk.length === 1 && /hair-thin/.test(armA.notOk[0]),
  'ARM B green (mutation survives pre-existing suite)': armB.status === 0 && armB.fail === 0,
  'ARM B ran the pre-existing 145 tests': armB.tests === 145,
  'clean suite green at 146': clean.status === 0 && clean.pass === 146 && clean.fail === 0,
  'src/render.js unmodified at exit': !git('diff', '--name-only').includes('src/render.js'),
};
say('=== VERDICT ===');
let allPass = true;
for (const [name, ok] of Object.entries(checks)) {
  say(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) allPass = false;
}
say(allPass ? 'T-146 GATE: PASS' : 'T-146 GATE: FAIL');

fs.writeFileSync(path.join(REPO, '.swarm/runs/cycle-055-gate-out.txt'), report.join('\n') + '\n');
process.exit(allPass ? 0 : 1);
