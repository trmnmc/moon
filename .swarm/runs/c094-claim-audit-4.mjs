// cycle 94 — claim audit, PASS 4. Scope: ONLY the coverage guard pass 3 got wrong.
//
// Pass 3's COVERAGE check asserted that every globbed test file's NAME appears in the
// runner's output. It reported 3 of 9 and FAILED. The premise was wrong, not the run:
// node's default reporter does not name a file that produces no diagnostic, so the
// check was measuring the reporter's verbosity, not the run's coverage. Grading the
// PRESENCE OF A FILENAME IN PROSE — the same failure shape as the other three
// instrument defects this cycle.
//
// Pass 4 measures coverage arithmetically instead: run each of the nine files ALONE,
// then assert the sum of their individual test counts equals the single glob run's
// total. That is a real coverage proof — if the glob had silently skipped a file, the
// sum would exceed the total. It is strictly stronger than the filename check it
// replaces, and it cannot be satisfied by a reporter that merely stays quiet.
//
// Converse control (L-044): one file is deliberately EXCLUDED from a second glob-like
// run, which must make the arithmetic DISAGREE. A coverage check that cannot detect a
// missing file is not a coverage check.

import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const T = '/opt/targets/moon';
const state = JSON.parse(readFileSync(`${T}/.swarm/state.json`, 'utf8'));
const TEST_CMD = state.test_cmd;

const files = readdirSync(`${T}/test`).filter((f) => f.endsWith('.test.js')).sort();

const run = (cmd) => {
  let out;
  try { out = execFileSync('sh', ['-c', cmd], { cwd: T, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = String(e.stdout ?? '') + String(e.stderr ?? ''); }
  const t = out.match(/ℹ tests (\d+)/), p = out.match(/ℹ pass (\d+)/), f = out.match(/ℹ fail (\d+)/);
  if (!t || !p || !f) throw new Error(`unparseable reporter output for: ${cmd}`);
  return { tests: +t[1], pass: +p[1], fail: +f[1] };
};

console.log(`test_cmd (from state.json): ${JSON.stringify(TEST_CMD)}`);
const whole = run(TEST_CMD);
console.log(`GLOB RUN: tests ${whole.tests} pass ${whole.pass} fail ${whole.fail}`);

let sum = 0, anyRed = [];
console.log(`\nper-file counts (${files.length} files):`);
for (const f of files) {
  const r = run(`node --test test/${f}`);
  sum += r.tests;
  if (r.fail !== 0) anyRed.push(f);
  console.log(`  ${f.padEnd(24)} tests ${String(r.tests).padStart(3)}  pass ${String(r.pass).padStart(3)}  fail ${r.fail}`);
}
console.log(`  ${'SUM'.padEnd(24)} tests ${String(sum).padStart(3)}`);

let fails = 0;
const say = (ok, name, detail) => { if (!ok) fails++; console.log(`\n${(ok ? 'PASS' : 'FAIL').padEnd(8)} ${name}\n          ${detail}`); };

say(sum === whole.tests,
  'COVERAGE: per-file counts sum exactly to the glob run total',
  `sum of ${files.length} files = ${sum} · glob run = ${whole.tests} · delta ${sum - whole.tests}`);

say(whole.fail === 0 && anyRed.length === 0,
  'every file is green alone AND together',
  `glob fail=${whole.fail} · files red alone: ${anyRed.length ? anyRed.join(' ') : 'none'}`);

// CONVERSE CONTROL: drop the largest file; the arithmetic MUST disagree.
const dropped = files.slice(0, -1);
const partial = run(`node --test ${dropped.map((f) => 'test/' + f).join(' ')}`);
say(partial.tests !== whole.tests && partial.tests < whole.tests,
  `CONTROL: excluding ${files.at(-1)} makes the total DISAGREE (a blind check would not notice)`,
  `${dropped.length}-file run = ${partial.tests} vs full ${whole.tests} · detected the omission: ${partial.tests < whole.tests}`);

console.log(`\nAUDIT PASS 4: ${fails === 0 ? 'all checks pass' : fails + ' FAILED'}`);
process.exit(fails ? 1 : 0);
