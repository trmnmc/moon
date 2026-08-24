// Cycle 113, two-arm attribution proof (L-029) for T-215, run against the LIVE tree.
// Arm 1: make the real mutation this run is about to be able to commit — create the
//        archive file WITHOUT updating either pointer — and show the full suite goes red
//        AND that the distinct failing test is the new one BY NAME.
// Arm 2: the same mutation with test/report-pointer.test.js removed must leave the suite
//        GREEN — i.e. no pre-existing test already covered this; the new file is what
//        catches it. Both arms restore the tree before exiting.
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, renameSync, existsSync } from 'node:fs';

const ROOT = '/opt/targets/moon';
const ARCHIVE = ROOT + '/.swarm/REPORT-ARCHIVE-2026-08-24.md';
const GATE = ROOT + '/test/report-pointer.test.js';
const PARKED = ROOT + '/.swarm/runs/report-pointer.test.js.parked';

const suite = () => {
  try {
    return { code: 0, out: execSync('node --test test/*.test.js', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
};
const counts = (out) => (out.match(/^ℹ (?:tests|pass|fail|skipped) \d+$/gm) || []).join(' | ');
const failedNames = (out) => (out.match(/^✖ .*$/gm) || []).map((l) => l.slice(2).replace(/ \(\d.*$/, ''));

const results = [];
try {
  // ---- Arm 1: mutation present, gate present.
  writeFileSync(ARCHIVE, '# Archive placeholder for run #6 (conductor mutation, cycle 113)\n');
  const a1 = suite();
  const names = failedNames(a1.out);
  const attributed = names.length > 0 && names.every((n) => /^report-pointer/.test(n));
  results.push([
    'arm1-mutation-with-gate', a1.code !== 0 && attributed,
    `exit ${a1.code} | ${counts(a1.out)}\n         failing tests (all report-pointer: ${attributed}):\n           - ${names.join('\n           - ')}`,
  ]);

  // ---- Arm 2: same mutation, gate removed.
  renameSync(GATE, PARKED);
  const a2 = suite();
  results.push([
    'arm2-mutation-without-gate', a2.code === 0,
    `exit ${a2.code} | ${counts(a2.out)} — with the gate removed the same mutation is invisible to every other test`,
  ]);
} finally {
  if (existsSync(PARKED)) renameSync(PARKED, GATE);
  if (existsSync(ARCHIVE)) unlinkSync(ARCHIVE);
}

// ---- Restore check: tree back to exactly where it started.
const st = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim();
results.push(['restored', st === 'A  test/report-pointer.test.js', `git status --porcelain -> ${JSON.stringify(st)}`]);

let bad = 0;
for (const [name, ok, detail] of results) {
  if (!ok) bad += 1;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name.padEnd(26)} ${detail}`);
}
console.log(`\n${results.length - bad}/${results.length} two-arm cells passed`);
process.exit(bad === 0 ? 0 : 1);
