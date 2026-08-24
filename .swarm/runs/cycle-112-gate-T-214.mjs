// Conductor's verification gate for T-214, authored at verification time (cycle 112).
// The builder never saw this file. Each cell mutates a throwaway copy of the repo and
// asserts the FULL suite's verdict, plus that a red cell fails FOR THE REASON IT NAMES.
//
// Deliberately uses different documents, different test-file names and different
// wordings than the builder's own reported proofs, so this measures the gate rather
// than re-running the builder's rehearsal.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = '/opt/targets/moon';
const BASE = '/tmp/t214-gate';

fs.rmSync(BASE, { recursive: true, force: true });
fs.mkdirSync(BASE, { recursive: true });

function copy(name) {
  const dst = path.join(BASE, name);
  fs.cpSync(SRC, dst, { recursive: true });
  return dst;
}

function runSuite(dir) {
  try {
    const out = execFileSync('node', ['--test', 'test/args.test.js', 'test/astro.test.js',
      'test/citations.test.js', 'test/cli.test.js', 'test/contracts.test.js',
      'test/doc-counts.test.js', 'test/gate-claims.test.js', 'test/hemisphere.test.js',
      'test/manifest.test.js', 'test/regressions.test.js', 'test/render.test.js',
      'test/report-issues.test.js'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    return { green: true, out };
  } catch (e) {
    return { green: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function counts(out) {
  const g = (re) => (out.match(re) || [, '?'])[1];
  return `tests ${g(/^. tests (\d+)$/m)} / pass ${g(/^. pass (\d+)$/m)} / fail ${g(/^. fail (\d+)$/m)} / skipped ${g(/^. skipped (\d+)$/m)}`;
}

function failingTestNames(out) {
  return [...out.matchAll(/^✖ (.+?) \(/gm)].map((m) => m[1]);
}

function reasonLines(out, needle) {
  return out.split('\n').filter((l) => l.includes(needle)).slice(0, 3).map((l) => l.trim().slice(0, 300));
}

const results = [];
function cell(name, expectGreen, mutate, reasonNeedle) {
  const dir = copy(name);
  mutate(dir);
  const r = runSuite(dir);
  const ok = r.green === expectGreen;
  const reason = expectGreen ? [] : reasonLines(r.out, reasonNeedle);
  const reasonOk = expectGreen ? true : reason.length > 0;
  results.push({ name, expect: expectGreen ? 'GREEN' : 'RED', got: r.green ? 'GREEN' : 'RED',
    verdict: ok && reasonOk ? 'PASS' : 'FAIL', counts: counts(r.out),
    failing: r.green ? [] : failingTestNames(r.out), reason });
  return r;
}

const rd = (d, f) => fs.readFileSync(path.join(d, f), 'utf8');
const wr = (d, f, s) => fs.writeFileSync(path.join(d, f), s);

// --- CELL 1: RED. A ninth claim-about-a-test sentence, in README.md (the builder
// proved REPORT.md), naming test/manifest.test.js, which holds no registry row.
// No test file is edited.
cell('red-readme', false, (d) => {
  wr(d, 'README.md', rd(d, 'README.md') +
    '\n## Coverage note\n\nEvery documented flag is guaranteed to appear in the options table by `test/manifest.test.js`.\n');
}, 'names test/manifest.test.js');

// --- CELL 2: RED. Same class, but a new paragraph spliced into the MIDDLE of
// REPORT.md rather than appended, naming a different unregistered file.
cell('red-report', false, (d) => {
  const t = rd(d, 'REPORT.md');
  const anchor = '## VERIFIED vs CLAIMED';
  wr(d, 'REPORT.md', t.replace(anchor,
    'Flag parsing is exhaustively enforced by `test/args.test.js`, which rejects every unknown flag.\n\n' + anchor));
}, 'names test/args.test.js');

// --- CELL 3: GREEN control. A NEW paragraph in the same place as cell 1, of the
// same size, that names no test file. Isolates "names a test file" as the trigger
// rather than "the document changed" -- a gate that reddens on any edit is a
// tripwire, not a gate.
cell('green', true, (d) => {
  wr(d, 'README.md', rd(d, 'README.md') +
    '\n## Determinism note\n\nThe same observation instant always produces byte-identical output on the same host.\n');
}, null);

// --- CELL 4: RED. The registry table itself is removed. A parse locating zero rows
// must FAIL, never report nothing wrong.
cell('zero', false, (d) => {
  const t = rd(d, 'REPORT.md');
  const i = t.indexOf('## Claim registry');
  wr(d, 'REPORT.md', t.slice(0, i));
}, 'Claim registry');

// --- CELL 5: RED. A registry row that launders a claim against a test file that
// does not exist.
cell('ghostrow', false, (d) => {
  const t = rd(d, 'REPORT.md');
  wr(d, 'REPORT.md', t.replace(/\| test\/report-issues\.test\.js \|/, '| test/nowhere.test.js |'));
}, 'nowhere.test.js');

// --- CELL 6: RED. A quote row's quoted span is reworded into a plausible paraphrase
// that is NOT the named test file's own words. This is the drift this item exists to
// catch, exercised against the LIVE document rather than a fixture.
cell('quotemut', false, (d) => {
  const t = rd(d, 'REPORT.md');
  const m = t.match(/\("([^"]{25,})"\)/);
  if (!m) { throw new Error('no quoted span found in REPORT.md to mutate'); }
  wr(d, 'REPORT.md', t.replace(m[0], '("every issue row is compared field by field against state.json")'));
  fs.writeFileSync(path.join(d, '.mutated-span'), m[1]);
}, 'own words verbatim');

console.log('== T-214 conductor gate ==');
for (const r of results) {
  console.log(`\n[${r.verdict}] ${r.name}: expected ${r.expect}, got ${r.got}`);
  console.log(`  ${r.counts}`);
  if (r.failing.length) console.log(`  failing test(s): ${r.failing.join(' | ')}`);
  for (const l of r.reason) console.log(`  reason> ${l}`);
}
const allPass = results.every((r) => r.verdict === 'PASS');
console.log(`\nGATE: ${allPass ? 'PASS' : 'FAIL'} (${results.filter((r) => r.verdict === 'PASS').length}/${results.length} cells)`);
