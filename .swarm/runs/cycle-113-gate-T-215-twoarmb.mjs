// Cycle 113, re-aimed two-arm proof. The first two-arm script's arm1 and restored cells
// went red for reasons of my own making, not the gate's:
//   arm1     — my `failedNames` regex also swallowed node:test's own "✖ failing tests:"
//              summary header, so "every failing test is report-pointer's" was measured
//              against a list containing a header line. One real test failed, and it was
//              report-pointer's.
//   restored — my predicate demanded an exactly-clean tree, but this cycle's own gate
//              scripts are new untracked files in .swarm/runs/. The mutation itself WAS
//              restored.
// Both stand recorded FAIL in that script; this one measures the properties they meant to.
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, renameSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = '/opt/targets/moon';
const ARCHIVE = ROOT + '/.swarm/REPORT-ARCHIVE-2026-08-24.md';
const GATE = ROOT + '/test/report-pointer.test.js';
const PARKED = ROOT + '/.swarm/runs/report-pointer.test.js.parked';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16);
const GATE_SHA_BEFORE = sha(GATE);
const REPORT_SHA_BEFORE = sha(ROOT + '/REPORT.md');

const suite = () => {
  try {
    return { code: 0, out: execSync('node --test test/*.test.js', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) { return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }; }
};
const counts = (out) => (out.match(/^ℹ (?:tests|pass|fail|skipped) \d+$/gm) || []).join(' | ');
// Only real test lines: "✖ <name> (1.23ms)". node:test's summary header "✖ failing tests:"
// carries no duration and is excluded by requiring the timing suffix.
const failedNames = (out) => (out.match(/^✖ .+ \(\d[\d.]*ms\)$/gm) || []).map((l) => l.slice(2).replace(/ \(\d[\d.]*ms\)$/, ''));

const results = [];
try {
  writeFileSync(ARCHIVE, '# Archive placeholder for run #6 (conductor mutation, cycle 113)\n');
  const a1 = suite();
  const names = [...new Set(failedNames(a1.out))];
  results.push([
    'arm1-red-and-attributed', a1.code !== 0 && names.length === 1 && /^report-pointer /.test(names[0]),
    `exit ${a1.code} | ${counts(a1.out)}\n         the one distinct failing test, BY NAME: "${names.join('", "')}"`,
  ]);

  renameSync(GATE, PARKED);
  const a2 = suite();
  results.push([
    'arm2-green-without-gate', a2.code === 0 && /ℹ fail 0/.test(a2.out),
    `exit ${a2.code} | ${counts(a2.out)} — the same mutation is invisible to all 256 pre-existing tests`,
  ]);
} finally {
  if (existsSync(PARKED)) renameSync(PARKED, GATE);
  if (existsSync(ARCHIVE)) unlinkSync(ARCHIVE);
}

results.push(['mutation-removed', !existsSync(ARCHIVE), `the injected archive file is gone: ${!existsSync(ARCHIVE)}`]);
results.push(['gate-byte-identical', existsSync(GATE) && sha(GATE) === GATE_SHA_BEFORE, `gate sha ${GATE_SHA_BEFORE} -> ${existsSync(GATE) ? sha(GATE) : 'MISSING'}`]);
results.push(['report-untouched', sha(ROOT + '/REPORT.md') === REPORT_SHA_BEFORE, `REPORT.md sha ${REPORT_SHA_BEFORE} -> ${sha(ROOT + '/REPORT.md')}`]);
const tracked = execSync('git status --porcelain --untracked-files=no', { cwd: ROOT, encoding: 'utf8' }).trim();
results.push(['no-tracked-drift', tracked === 'A  test/report-pointer.test.js', `tracked changes -> ${JSON.stringify(tracked)}`]);

let bad = 0;
for (const [name, ok, detail] of results) {
  if (!ok) bad += 1;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name.padEnd(23)} ${detail}`);
}
console.log(`\n${results.length - bad}/${results.length} re-aimed two-arm cells passed`);
process.exit(bad === 0 ? 0 : 1);
