// Conductor verification gate for T-215 — authored at verification time, cycle 113.
// The builder never saw these cells. Every cell uses the REAL REPORT.md text, not the
// synthetic 1111/2222/3333 fixtures the test file ships, so this measures the gate
// rather than re-running its own rehearsal.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire('/opt/targets/moon/');
const { reportPointerViolations } = require('/opt/targets/moon/test/report-pointer.test.js');

const ROOT = '/opt/targets/moon';
const RAW = readFileSync(ROOT + '/REPORT.md', 'utf8');
const LIVE = readdirSync(ROOT + '/.swarm')
  .filter((f) => /^REPORT-ARCHIVE-.+\.md$/.test(f))
  .map((f) => `.swarm/${f}`);

// The archive file THIS run's WRAP_UP will create, holding run #6's record.
const PENDING = '.swarm/REPORT-ARCHIVE-2026-08-24.md';
// The real pending document edit: run #6's record is archived, run #7's takes its place.
const PENDING_DOC = RAW.replace('## Run 6 (2026-08-20)', '## Run 7 (2026-08-24)');

const cells = [];
const cell = (name, kind, fn) => {
  let got, err = null;
  try { got = fn(); } catch (e) { err = e; }
  cells.push({ name, kind, ok: err === null && got.ok, detail: err ? `THREW ${err.message}` : got.detail });
};
const has = (vs, re) => vs.filter((v) => re.test(v));

// --- Cell 1 (LOAD-BEARING, L-042): RED against this run's REAL pending edit, BEFORE it lands.
cell('pending-edit', 'RED', () => {
  const v = reportPointerViolations({ reportText: PENDING_DOC, archiveFilenames: [...LIVE, PENDING] });
  const first = has(v, /first-screen pointer is out of step .* does not name `\.swarm\/REPORT-ARCHIVE-2026-08-24\.md`/);
  const close = has(v, /closing italic pointer is out of step .* does not name `\.swarm\/REPORT-ARCHIVE-2026-08-24\.md`/);
  return {
    ok: v.length === 2 && first.length === 1 && close.length === 1,
    detail: `${v.length} violation(s); both copies flag the pending archive: ${first.length === 1 && close.length === 1}\n  ${v.join('\n  ')}`,
  };
});

// --- Cell 2: the SAME pending state with both pointers correctly updated must go GREEN.
// A gate that reddens on the fixed state too cannot tell a right answer from a wrong one.
cell('pending-edit-fixed', 'GREEN', () => {
  const fixed = PENDING_DOC
    .replaceAll('`.swarm/REPORT-ARCHIVE-2026-08-20.md`', '`.swarm/REPORT-ARCHIVE-2026-08-20.md` and `' + PENDING + '`');
  const v = reportPointerViolations({ reportText: fixed, archiveFilenames: [...LIVE, PENDING] });
  return { ok: v.length === 0, detail: `${v.length} violation(s)${v.length ? ':\n  ' + v.join('\n  ') : ' — the corrected edit is accepted'}` };
});

// --- Cell 3 (converse control, L-044): a real, unrelated edit to REPORT.md must stay GREEN.
cell('unrelated-edit', 'GREEN', () => {
  const edited = RAW
    .replace('## How to run it', '## How to run it\n\nAn unrelated paragraph inserted by the conductor, naming no archive at all.')
    .replace('## Resolved issues', '## Resolved issues and their evidence');
  const v = reportPointerViolations({ reportText: edited, archiveFilenames: LIVE });
  return { ok: v.length === 0, detail: `${v.length} violation(s)${v.length ? ':\n  ' + v.join('\n  ') : ' — prose edits away from the pointers do not redden the gate'}` };
});

// --- Cell 4: T-212's ACTUAL historical defect, replayed against the real document —
// the first-screen sentence names one archive while the record lives in two.
cell('t212-replay', 'RED', () => {
  const rotted = RAW.split('\n').map((l, i) =>
    i === 2 ? l.replace(' and `.swarm/REPORT-ARCHIVE-2026-08-20.md`', '') : l).join('\n');
  const v = reportPointerViolations({ reportText: rotted, archiveFilenames: LIVE });
  const first = has(v, /first-screen pointer is out of step .* does not name `\.swarm\/REPORT-ARCHIVE-2026-08-20\.md`/);
  const close = has(v, /closing italic/);
  return {
    ok: v.length === 1 && first.length === 1 && close.length === 0,
    detail: `${v.length} violation(s); attributed to the first-screen copy alone (closing italic hits: ${close.length})\n  ${v.join('\n  ')}`,
  };
});

// --- Cell 5: fail-closed over a DEAD REGION — the structural marker (backticks) is gone
// from the live preamble sentence. Must be RED-unlocatable, never a vacuous green.
cell('dead-region', 'RED', () => {
  const stripped = RAW.split('\n').map((l, i) => (i === 2 ? l.replaceAll('`', '') : l)).join('\n');
  const v = reportPointerViolations({ reportText: stripped, archiveFilenames: LIVE });
  const unl = has(v, /could not locate the first-screen pointer sentence .*fail-closed/);
  return { ok: unl.length === 1, detail: `${v.length} violation(s); unlocatable-first-screen: ${unl.length}\n  ${v.join('\n  ')}` };
});

// --- Cell 6: hard-wrapping the live pointer sentence across two lines must not
// silently pass a half-enumeration. Ambiguity or shortfall — either is fine, green is not.
cell('hard-wrap', 'RED', () => {
  const wrapped = RAW.replace(' and `.swarm/REPORT-ARCHIVE-2026-08-20.md`', '\nand `.swarm/REPORT-ARCHIVE-2026-08-20.md`');
  const v = reportPointerViolations({ reportText: wrapped, archiveFilenames: LIVE });
  return { ok: v.length > 0, detail: `${v.length} violation(s)\n  ${v.join('\n  ')}` };
});

// --- Cell 7: the live tree itself must be GREEN (the gate ships passing).
cell('live-tree', 'GREEN', () => {
  const v = reportPointerViolations({ reportText: RAW, archiveFilenames: LIVE });
  return { ok: v.length === 0, detail: `${v.length} violation(s); live archives discovered: ${LIVE.length} ${JSON.stringify(LIVE)}` };
});

// --- Cell 8 (anti-hardcode): today's real archive dates must appear NOWHERE in the
// test source. If they do, the enumeration is pinned to today rather than discovered.
cell('no-hardcoded-dates', 'STRUCT', () => {
  const src = readFileSync(ROOT + '/test/report-pointer.test.js', 'utf8');
  const hits = ['2026-08-18', '2026-08-20'].flatMap((d) => (src.match(new RegExp(d, 'g')) || []).map(() => d));
  const readdir = /readdirSync\(SWARM_DIR\)/.test(src);
  return { ok: hits.length === 0 && readdir, detail: `hardcoded live-archive dates in source: ${hits.length}; archives discovered by readdir: ${readdir}` };
});

let bad = 0;
for (const c of cells) {
  if (!c.ok) bad += 1;
  console.log(`[${c.ok ? 'PASS' : 'FAIL'}] ${c.name.padEnd(19)} ${c.kind.padEnd(6)} ${c.detail}`);
}
console.log(`\n${cells.length - bad}/${cells.length} conductor cells passed`);
process.exit(bad === 0 ? 0 : 1);
