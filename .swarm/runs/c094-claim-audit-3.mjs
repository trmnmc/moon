// cycle 94 — claim audit, PASS 3. Scope: ONLY the suite-count claim.
//
// Pass 2's `suite is green ...` check reported `tests 141` and PASSED. The count is
// WRONG and the pass is therefore void: I hand-enumerated six test files where the
// repo has NINE (contracts, manifest and regressions were omitted), so the instrument
// measured a subset and then graded the docs against it. Pass 2's other 14 checks do
// not depend on the count and stand; this one is superseded here.
//
// That is three instrument defects of my own in this one cycle — a TAP-vs-spec reporter
// regex, a marker chosen from the wrong half of a two-line construct, and now a
// hand-written file list standing in for the authoritative glob. All three share a
// shape: I re-encoded something the repo already states instead of asking the repo.
//
// Pass 3 asks the repo. It runs `test_cmd` VERBATIM from .swarm/state.json — glob and
// all — and refuses to grade anything unless the number of test files the run reports
// equals the number the glob actually matches. A subset can no longer read as the whole.

import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const T = '/opt/targets/moon';
const read = (p) => readFileSync(`${T}/${p}`, 'utf8');
const lines = (p) => read(p).split('\n');

const state = JSON.parse(read('.swarm/state.json'));
const TEST_CMD = state.test_cmd;                       // authoritative, not retyped
console.log(`test_cmd read from state.json: ${JSON.stringify(TEST_CMD)}`);

const globFiles = readdirSync(`${T}/test`).filter((f) => f.endsWith('.test.js')).sort();
console.log(`test/ glob matches ${globFiles.length} files: ${globFiles.join(' ')}`);

let out;
try {
  out = execFileSync('sh', ['-c', TEST_CMD], { cwd: T, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  out = String(e.stdout ?? '') + String(e.stderr ?? '');
}

const FORMS = [
  { name: 'spec (ℹ tests N)', tests: /ℹ tests (\d+)/, pass: /ℹ pass (\d+)/, fail: /ℹ fail (\d+)/ },
  { name: 'tap (# tests N)', tests: /# tests (\d+)/, pass: /# pass (\d+)/, fail: /# fail (\d+)/ },
];
let matched = null, tests = null, passed = null, failed = null;
for (const f of FORMS) {
  const t = out.match(f.tests), p = out.match(f.pass), x = out.match(f.fail);
  if (t && p && x) { matched = f.name; tests = +t[1]; passed = +p[1]; failed = +x[1]; break; }
}

// COVERAGE GUARD: every globbed file must appear in the run's own output.
// This is the check whose absence let pass 2 grade a subset.
const seen = globFiles.filter((f) => out.includes(f));
const unseen = globFiles.filter((f) => !out.includes(f));

let fails = 0;
const say = (verdict, name, detail) => {
  if (verdict !== 'PASS') fails++;
  console.log(`\n${verdict.padEnd(8)} ${name}\n          ${String(detail).split('\n').join('\n          ')}`);
};

if (matched === null) {
  say('FAIL', 'the reporter output is parseable', `no reporter form matched; tail:\n${out.trim().split('\n').slice(-6).join('\n')}`);
} else {
  say(unseen.length === 0 ? 'PASS' : 'FAIL',
    'COVERAGE: the run touched every file the test_cmd glob matches',
    `glob ${globFiles.length} files · named in the run output ${seen.length} · MISSING: ${unseen.length ? unseen.join(' ') : 'none'}`);

  say(failed === 0 && passed === tests ? 'PASS' : 'FAIL',
    'suite is GREEN over the full glob',
    `reporter: ${matched} · tests ${tests} · pass ${passed} · fail ${failed}`);

  say(tests >= 171 ? 'PASS' : 'FAIL',
    'suite is never below the 171-test kickoff baseline',
    `live ${tests} vs baseline 171 · delta ${tests - 171}`);

  const bad = [];
  for (const f of ['README.md', 'REPORT.md']) {
    lines(f).forEach((l, i) => {
      const m = l.match(/(\d{3})\s*(?:\/\s*\d{3})?\s*tests?\b/);
      if (!m) return;
      const n = Number(m[1]);
      if (n === tests) return;
      if (/as of|until this|at cycle|run \d|kickoff|baseline|when |carried/i.test(l)) return;
      bad.push(`${f}:${i + 1} claims ${n}: ${l.trim().slice(0, 110)}`);
    });
  }
  say(bad.length === 0 ? 'PASS' : 'FAIL',
    'no UNDATED doc test-count claim disagrees with the live count',
    bad.length ? bad.join('\n') : `no undated doc count claim disagrees with ${tests}`);

  // and the converse control: the dated ones must still be THERE. A re-aim that
  // quietly scrubbed history would otherwise score green on the check above.
  const datedCounts = [];
  for (const f of ['README.md', 'REPORT.md']) {
    lines(f).forEach((l, i) => {
      const m = l.match(/(\d{3})\s*(?:\/\s*\d{3})?\s*tests?\b/);
      if (m && /as of|until this|at cycle|run \d|kickoff|baseline|when |carried/i.test(l)) datedCounts.push(`${f}:${i + 1} -> ${m[1]}`);
    });
  }
  say(datedCounts.length > 0 ? 'PASS' : 'FAIL',
    'CONTROL: the self-dating historical counts are still present (not scrubbed)',
    datedCounts.length ? datedCounts.join(' · ') : 'NONE FOUND — the exemption above would be vacuous');
}

console.log(`\nAUDIT PASS 3: ${fails === 0 ? 'all checks pass' : fails + ' FAILED'}`);
process.exit(fails ? 1 : 0);
