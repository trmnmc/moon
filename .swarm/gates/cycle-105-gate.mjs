// cycle-105 verification gate — authored by the conductor AT VERIFICATION TIME.
// Builders never saw this file. It checks the two dispatched items, T-208 and T-209.
//
// Usage: node .swarm/gates/cycle-105-gate.mjs <suite-count-at-HEAD>
//   <suite-count-at-HEAD> is measured by the conductor by running test_cmd in a
//   worktree pinned at HEAD (the cycle-104 commit) and pasted into the journal.
//
// Every cell that can pass vacuously carries a positive control: the cell is re-run
// against the PRE-CHANGE text and must FAIL there. A check that cannot be shown to
// fail is not evidence.

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = '/opt/targets/moon';
const headSuiteCount = Number(process.argv[2]);
if (!Number.isInteger(headSuiteCount)) {
  console.error('usage: node cycle-105-gate.mjs <suite-count-at-HEAD>');
  process.exit(2);
}

const rows = [];
const cell = (id, desc, pass, detail) => rows.push({ id, desc, pass: !!pass, detail });

const read = (p) => readFileSync(`${ROOT}/${p}`, 'utf8');
const atHead = (p) =>
  execFileSync('git', ['-C', ROOT, 'show', `HEAD:${p}`], { encoding: 'utf8', maxBuffer: 1 << 26 });

const KI = read('.swarm/KI-2-OWNER-ACTION.md');
const KI_HEAD = atHead('.swarm/KI-2-OWNER-ACTION.md');
const REPORT = read('REPORT.md');
const REPORT_HEAD = atHead('REPORT.md');
const ARCHIVE_PATH = '.swarm/REPORT-ARCHIVE-2026-08-20.md';

// ---------------------------------------------------------------- T-208 -----

cell('A1', 'owner-action file exists and stays bounded',
  existsSync(`${ROOT}/.swarm/KI-2-OWNER-ACTION.md`) && Buffer.byteLength(KI) <= 6000,
  `bytes=${Buffer.byteLength(KI)} (cap 6000)`);

// A2 — a REPAIR, not a rewrite: exactly two lines differ from HEAD.
const kiLines = KI.split('\n');
const kiHeadLines = KI_HEAD.split('\n');
const changed = [];
if (kiLines.length === kiHeadLines.length) {
  for (let i = 0; i < kiLines.length; i++) if (kiLines[i] !== kiHeadLines[i]) changed.push(i + 1);
}
cell('A2', 'exactly two lines changed, no reflow, no new sections',
  kiLines.length === kiHeadLines.length && changed.length === 2,
  `line count ${kiHeadLines.length}->${kiLines.length}; changed lines: ${changed.join(',') || 'n/a'}`);

// A3 — the payload the file exists to carry must be untouched.
const ALLOW = [
  '"Bash(/opt/swarm/bin/swarm-playbook.sh:*)",',
  '"Bash(bash /opt/swarm/bin/swarm-playbook.sh:*)",',
  '"Bash(/opt/swarm/bin/swarm-warmup.sh:*)",',
  '"Bash(bash /opt/swarm/bin/swarm-warmup.sh:*)"',
];
cell('A3', 'all four allow-list lines byte-identical to HEAD',
  ALLOW.every((l) => KI.includes(l) && KI_HEAD.includes(l)),
  `${ALLOW.filter((l) => KI.includes(l)).length}/4 present`);

// A4/A5 — the substance. Written as predicates over TEXT so they can be run against
// the pre-change text as a positive control.
const unitDefectsGone = (t) =>
  !/across two improvement cycles/i.test(t) && !/31 denials/i.test(t);
const unitStatedRight = (t) =>
  /31 is the run-kickoff count|31\D{0,40}\brun[- ]kickoff\b|\b31\b[^.]{0,80}\bcount\b[^.]{0,80}\bkickoff\b/i.test(t) &&
  /run #6/.test(t) &&
  /two projects/i.test(t) && /aphorism-cli/.test(t) && /moon/.test(t);

cell('A4', 'both retired mis-statements are gone', unitDefectsGone(KI),
  `"across two improvement cycles": ${/across two improvement cycles/i.test(KI)} · "31 denials": ${/31 denials/i.test(KI)}`);
cell('A5', '31 is stated as a RUN/kickoff count and the span names two PROJECTS',
  unitStatedRight(KI), 'both replacement sentences parsed');

// A6 — POSITIVE CONTROL: the same two predicates must FAIL on the pre-change file.
cell('A6', 'CONTROL: A4+A5 fail against the pre-change text (not vacuous)',
  !unitDefectsGone(KI_HEAD) && !unitStatedRight(KI_HEAD),
  `pre-change A4=${unitDefectsGone(KI_HEAD)} A5=${unitStatedRight(KI_HEAD)} (both must be false)`);

// A7 — the headline figure was already correct and must not have drifted.
cell('A7', 'headline count 32 preserved',
  /\b32 runs\b/.test(KI) && (KI.match(/\b32\b/g) || []).length === (KI_HEAD.match(/\b32\b/g) || []).length,
  `occurrences of "32": HEAD ${(KI_HEAD.match(/\b32\b/g) || []).length} -> now ${(KI.match(/\b32\b/g) || []).length}`);

// ---------------------------------------------------------------- T-209 -----

const CAP = 25586;
cell('B1', 'REPORT.md at or under its kickoff byte cap',
  Buffer.byteLength(REPORT) <= CAP,
  `bytes=${Buffer.byteLength(REPORT)} (cap ${CAP}, was ${Buffer.byteLength(REPORT_HEAD)})`);

// B2 — the archive must hold the removed section VERBATIM, byte for byte.
const marker = '## Runs 4-5 (2026-08-18, 2026-08-19)';
const headIdx = REPORT_HEAD.indexOf(marker);
const removed = headIdx === -1 ? null : REPORT_HEAD.slice(headIdx);
const archive = existsSync(`${ROOT}/${ARCHIVE_PATH}`) ? read(ARCHIVE_PATH) : '';
cell('B2', 'archive contains the removed section byte-for-byte',
  removed !== null && archive.includes(removed),
  removed === null ? 'marker not found at HEAD' :
    `removed ${Buffer.byteLength(removed)}B; archive ${Buffer.byteLength(archive)}B; verbatim=${archive.includes(removed)}`);

// B2c — CONTROL: a one-character mutation of the removed text must NOT be found.
const mutated = removed ? removed.replace('spare window', 'spare windows') : 'x';
cell('B2c', 'CONTROL: a 1-char mutation of the section is NOT found in the archive',
  !archive.includes(mutated), 'substring check is exact, not fuzzy');

cell('B3', 'run-5 tail replaced by a run-6 record',
  !REPORT.includes(marker) && /^## Run 6 \(2026-08-20\)/m.test(REPORT),
  `old marker present=${REPORT.includes(marker)} · "## Run 6" present=${/^## Run 6 /m.test(REPORT)}`);

// B4 — the pointer, and the prohibition on restating the ask in REPORT.md.
// The prohibition is on THIS ITEM restating the ask. REPORT.md already quoted
// `Bash(...)` at HEAD inside the historical KI-2 row (run-3 text, byte-identical),
// so an absolute-presence test fails the INSTRUMENT rather than the WORK. Counting
// occurrences against HEAD tests the delta, which is what the clause is about.
const pointerHits = (REPORT.match(/\.swarm\/KI-2-OWNER-ACTION\.md/g) || []).length;
const leaks = ['permissions.allow', 'swarm-playbook.sh:*', 'Bash(', 'swarm-warmup.sh', 'swarm-budget.sh'];
const added = leaks.filter(
  (s) => (REPORT.split(s).length - 1) > (REPORT_HEAD.split(s).length - 1));
cell('B4', 'exactly one KI-2 pointer; this item added no restatement of the ask',
  pointerHits === 1 && added.length === 0,
  `pointer occurrences=${pointerHits} (HEAD ${(REPORT_HEAD.match(/\.swarm\/KI-2-OWNER-ACTION\.md/g) || []).length}); ` +
  `tokens whose count ROSE vs HEAD: ${added.join(',') || 'none'}`);

// B4c — CONTROL: the delta test must still catch a real restatement.
const spiked = REPORT + '\n"Bash(/opt/swarm/bin/swarm-playbook.sh:*)",\n';
const spikedAdded = leaks.filter(
  (s) => (spiked.split(s).length - 1) > (REPORT_HEAD.split(s).length - 1));
cell('B4c', 'CONTROL: B4 flags an injected allow-list line',
  spikedAdded.length > 0, `injected line raises: ${spikedAdded.join(',') || 'NOTHING — cell is vacuous'}`);

// B5 — the first screen still answers the four reader questions.
const firstScreen = ['## What was built', '## How to run it', '## Known issues (6)', '## VERIFIED vs CLAIMED'];
cell('B5', 'first-screen sections intact',
  firstScreen.every((h) => REPORT.includes(h)),
  firstScreen.filter((h) => !REPORT.includes(h)).join(',') || 'all four present');

// B6/B7 — THE TRUTH CELL. REPORT's Run 6 section attributes a suite count to a named
// cycle. doc-counts.test.js only proves an anchor is PRESENT; this proves the number
// is TRUE AT THAT ANCHOR, measured by the conductor at that commit.
const claim = REPORT.match(/Suite at cycle (\d+):\s*(\d+) tests?,\s*(\d+) passing/i);
cell('B6', 'the run-6 suite claim is parseable and names its anchor',
  !!claim, claim ? `claims cycle ${claim[1]}: ${claim[2]}/${claim[3]}` : 'no parseable suite claim found');
cell('B7', 'the suite number is TRUE at the cycle it names',
  !!claim && Number(claim[2]) === headSuiteCount && Number(claim[3]) === headSuiteCount,
  claim
    ? `document says ${claim[2]} at cycle ${claim[1]}; conductor measured ${headSuiteCount} at HEAD (the cycle-104 commit)`
    : 'no claim to check');

// B7c — CONTROL: the cell must reject a wrong anchor rather than accept any number.
cell('B7c', 'CONTROL: B7 rejects a mismatched number',
  !(claim && Number(claim[2]) === headSuiteCount + 1),
  'a number one off the measured value would fail');

// ------------------------------------------------------------------ scope ---

const porcelain = execFileSync('git', ['-C', ROOT, 'status', '--porcelain'], { encoding: 'utf8' })
  .split('\n').filter(Boolean).map((l) => l.slice(3));
// The two ITEMS' declared scopes, plus the conductor's own artifact paths
// (cycle.md step 6 puts verification evidence under .swarm/runs/, and this gate
// itself lives under .swarm/gates/). Builders were forbidden both directories.
const allowedPaths = new Set(['REPORT.md', '.swarm/KI-2-OWNER-ACTION.md', ARCHIVE_PATH]);
const conductorOnly = (p) => p.startsWith('.swarm/gates/') || p.startsWith('.swarm/runs/');
const outOfScope = porcelain.filter((p) => !allowedPaths.has(p) && !conductorOnly(p));
cell('C1', 'no file outside the two items\' declared scopes was touched',
  outOfScope.length === 0, outOfScope.join(',') || `touched: ${porcelain.join(', ')}`);

// ----------------------------------------------------------------- report ---

let pass = 0, fail = 0;
for (const r of rows) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.desc}`);
  console.log(`       ${r.detail}`);
  r.pass ? pass++ : fail++;
}
console.log(`GATE cycle-105  PASS ${pass} / FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
