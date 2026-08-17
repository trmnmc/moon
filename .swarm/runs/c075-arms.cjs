'use strict';
/* Conductor, cycle 75: MY OWN two-arm attribution for T-167's new test.
 * The builder's arm B reverted BOTH the new test AND the pre-existing fixture,
 * which cannot isolate the new test. These arms isolate it.
 *
 *   ARM A   render.js <- HEAD, test file <- working tree
 *           => suite RED, and the NEW test must be among the failures BY NAME
 *   ARM A'  render.js <- HEAD, test file <- HEAD + ONLY the new test appended
 *           => the new test must fail BY NAME and be the ONLY failure
 *   ARM B   render.js <- HEAD, test file <- HEAD
 *           => suite GREEN (proves HEAD was blind to the defect)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..', '..');
const RENDER = path.join(REPO, 'src', 'render.js');
const TESTF = path.join(REPO, 'test', 'render.test.js');

const NEW_TEST_NAME = 'renderBlock: a hairline crescent forms a contiguous arc, not disconnected specks';
const START = '// T-167: the limb hairline guard picked its candidate cell by scanning the';
const END = "test('renderBlock: every block is the same size, whatever the phase'";

const wtRender = fs.readFileSync(RENDER, 'utf8');
const wtTest = fs.readFileSync(TESTF, 'utf8');
const headRender = execFileSync('git', ['-C', REPO, 'show', 'HEAD:src/render.js'], { encoding: 'utf8' });
const headTest = execFileSync('git', ['-C', REPO, 'show', 'HEAD:test/render.test.js'], { encoding: 'utf8' });

// Carve the new test block out of the working-tree file.
const i0 = wtTest.indexOf(START);
const i1 = wtTest.indexOf(END);
if (i0 < 0 || i1 < 0 || i1 < i0) throw new Error('could not locate the new test block');
const newTestBlock = wtTest.slice(i0, i1);
if (!newTestBlock.includes(NEW_TEST_NAME)) throw new Error('carved block does not contain the new test');

// HEAD's test file with ONLY the new test spliced in at the same place.
const j1 = headTest.indexOf(END);
if (j1 < 0) throw new Error('could not locate the splice point in HEAD test file');
const headPlusNew = headTest.slice(0, j1) + newTestBlock + headTest.slice(j1);

function runSuite() {
  // Mirror test_cmd exactly: node --test test/*.test.js (glob expanded here).
  const files = fs.readdirSync(path.join(REPO, 'test'))
    .filter((f) => f.endsWith('.test.js')).sort().map((f) => `test/${f}`);
  const r = spawnSync(process.execPath, ['--test', ...files], { cwd: REPO, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const failing = [];
  const m = out.match(/^✖ failing tests:$/m);
  if (m) {
    for (const line of out.slice(out.indexOf(m[0])).split('\n')) {
      const t = line.match(/^✖ (.+?) \(\d/);
      if (t) failing.push(t[1]);
    }
  }
  const tests = (out.match(/^ℹ tests (\d+)$/m) || [])[1];
  const pass = (out.match(/^ℹ pass (\d+)$/m) || [])[1];
  const fail = (out.match(/^ℹ fail (\d+)$/m) || [])[1];
  return { tests, pass, fail, failing };
}

function arm(label, render, test) {
  fs.writeFileSync(RENDER, render);
  fs.writeFileSync(TESTF, test);
  const r = runSuite();
  console.log(`--- ${label} ---`);
  console.log(`    tests ${r.tests}  pass ${r.pass}  fail ${r.fail}`);
  for (const f of r.failing) console.log(`    ✖ ${f}`);
  if (!r.failing.length) console.log('    (no failures)');
  return r;
}

let failures = 0;
const check = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail === undefined ? '' : ' :: ' + detail}`);
};

try {
  console.log('=== T-167 attribution arms (conductor-authored) ===');
  console.log('');
  const a = arm('ARM A   HEAD render.js + working-tree test file', headRender, wtTest);
  check(Number(a.fail) > 0, 'ARM A: suite goes RED against the old guard');
  check(a.failing.includes(NEW_TEST_NAME), 'ARM A: the NEW test is among the failures, BY NAME');
  console.log('');

  const ap = arm("ARM A'  HEAD render.js + HEAD test file + ONLY the new test", headRender, headPlusNew);
  check(ap.failing.length === 1 && ap.failing[0] === NEW_TEST_NAME,
    "ARM A': the new test fails ALONE — the kill is attributable to it and nothing else",
    `failures: ${JSON.stringify(ap.failing)}`);
  console.log('');

  const b = arm('ARM B   HEAD render.js + HEAD test file (control)', headRender, headTest);
  check(Number(b.fail) === 0, 'ARM B: HEAD was entirely blind to the defect — suite green');
  console.log('');
} finally {
  fs.writeFileSync(RENDER, wtRender);
  fs.writeFileSync(TESTF, wtTest);
  console.log('(working tree restored)');
}

console.log('');
console.log(failures === 0 ? 'ARMS: PASS (0 failures)' : `ARMS: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
