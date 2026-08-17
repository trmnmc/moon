'use strict';
/*
 * Conductor verification gate — cycle 79, item T-164.
 *
 * AUTHORED AND SEALED BY HASH BEFORE THE BUILDER WAS DISPATCHED.
 *
 * Acceptance being gated, verbatim:
 *   "REPORT.md's run-summary block states a run-2 start time that agrees with
 *    the measured kickoff epoch, and EVERY other run start/end time in that
 *    same block is checked against its own kickoff-log filename epoch and
 *    completed-runfile epoch by the same method rather than assumed correct.
 *    Times that cannot be established from an on-disk artifact are labelled
 *    as such, not silently kept."
 *
 * The gate RE-DERIVES every boundary from the artifacts itself. It does not
 * read the conductor's own derivation file and does not trust the builder's
 * report. The artifacts are read-only here (hard rule 5 fences writes, not
 * reads); the builder was handed the derived FACTS as context and never these
 * paths.
 *
 * Exit 0 = PASS, 1 = FAIL.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/opt/targets/moon';
const SWARM_RUNS = '/opt/swarm/runs';

let failures = 0;
const lines = [];
function say(s) { lines.push(s); console.log(s); }
function check(ok, label, detail) {
  if (!ok) failures++;
  say(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail === undefined ? '' : ` :: ${detail}`}`);
}
function report(label, detail) { say(`  [REPORT] ${label}${detail === undefined ? '' : ` : ${detail}`}`); }

const utc = (e) => new Date(e * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
const hhmm = (e) => utc(e).slice(11, 16);

// ================================================= independent re-derivation
say('');
say('A. re-derive every run boundary from the on-disk artifacts (gate does its own work)');

// -- kickoff logs: the filename epoch is the session START.
const kick = fs.readdirSync(SWARM_RUNS)
  .map((f) => /^kickoff-(\d+)\.log$/.exec(f))
  .filter(Boolean)
  .map((m) => ({ file: m[0], epoch: Number(m[1]) }))
  .sort((a, b) => a.epoch - b.epoch);
for (const k of kick) {
  const st = fs.statSync(path.join(SWARM_RUNS, k.file));
  report(k.file, `start=${utc(k.epoch)}  mtime=${utc(Math.floor(st.mtimeMs / 1000))}`);
}

// -- completed runfiles: the last heartbeat is the best on-disk END signal.
const done = fs.readdirSync(SWARM_RUNS)
  .filter((f) => f.startsWith('current.json.done-'))
  .map((f) => {
    let r = {};
    try { r = JSON.parse(fs.readFileSync(path.join(SWARM_RUNS, f), 'utf8')); } catch { /* ignore */ }
    return {
      file: f,
      archived: Number(f.split('-').pop()),
      label: r.run_label || null,
      targets: (r.targets || []).map((t) => t.path),
      stopAt: r.stop_at || null,
      lastHb: (r.heartbeat || {}).ts || null,
    };
  })
  .sort((a, b) => a.archived - b.archived);
for (const d of done) {
  report(d.file, `label=${d.label} targets=${JSON.stringify(d.targets)} `
    + `stop_at=${d.stopAt} last_heartbeat=${d.lastHb ? utc(d.lastHb) : 'n/a'}`);
}
const moonDone = done.filter((d) => d.targets.some((t) => /\/moon$/.test(t)));

// -- run 1: kickoff 2026-08-14, moon.
const run1Start = kick.find((k) => utc(k.epoch).startsWith('2026-08-14'));
const run1Done = moonDone.find((d) => d.label === 'improvement-2026-08-14');
// -- run 2: kickoff 2026-08-16, moon.
const run2Start = kick.find((k) => utc(k.epoch).startsWith('2026-08-16'));
const run2Done = moonDone.find((d) => d.stopAt && d.stopAt.startsWith('2026-08-17T04:59'));
// -- the attended build run: the earliest moon runfile; no kickoff log exists for it.
const buildDone = moonDone[0];

check(!!run1Start && !!run2Start && !!run1Done && !!run2Done && !!buildDone,
  'A0: every artifact the derivation needs was found on disk');

const DERIVED = {
  run1_start: run1Start.epoch,
  run1_end: run1Done.lastHb,
  run2_start: run2Start.epoch,
  run2_end: run2Done.lastHb,
  build_end: buildDone.lastHb,
};
report('DERIVED run1 start', `${utc(DERIVED.run1_start)}  -> ${hhmm(DERIVED.run1_start)}`);
report('DERIVED run1 end  ', `${utc(DERIVED.run1_end)}  -> ${hhmm(DERIVED.run1_end)}`);
report('DERIVED run2 start', `${utc(DERIVED.run2_start)}  -> ${hhmm(DERIVED.run2_start)}`);
report('DERIVED run2 end  ', `${utc(DERIVED.run2_end)}  -> ${hhmm(DERIVED.run2_end)}`);
report('DERIVED build end ', `${utc(DERIVED.build_end)}  -> ${hhmm(DERIVED.build_end)}`);

// The attended build run's START has no artifact at all: no kickoff log predates
// run 1's, and the earliest runfile carries no start stamp.
const buildStartEstablishable = kick.some((k) => k.epoch < buildDone.archived
  && utc(k.epoch).startsWith('2026-08-14') && hhmm(k.epoch) < '12:59');
check(buildStartEstablishable === false,
  'A1: the attended build run\'s START is genuinely NOT establishable from any on-disk artifact '
  + '(so the acceptance\'s labelling clause has real work to do, and this gate is not vacuous)');

// ================================================== the document under test
const treeBody = fs.readFileSync(path.join(REPO, 'REPORT.md'), 'utf8');
const headBody = execFileSync('git', ['-C', REPO, 'show', 'HEAD:REPORT.md'], { encoding: 'utf8' });

/** The run-summary block: everything before the first horizontal rule. */
function summaryBlock(body) {
  const i = body.indexOf('\n---');
  return i < 0 ? body.slice(0, 2000) : body.slice(0, i);
}
const treeBlock = summaryBlock(treeBody);
const headBlock = summaryBlock(headBody);

say('');
say('B. controls — the defect was real, and the gate is looking at the right text');
check(/13:37/.test(headBlock),
  'B1: control — HEAD\'s run-summary block really does state 13:37 as run 2\'s start');
check(!/13:37/.test(treeBlock),
  'B2: the 13:37 figure is gone from the run-summary block');
report('tree run-summary block', '\n' + treeBlock.split('\n').map((l) => '        | ' + l).join('\n'));

say('');
say('C. the item\'s own claim: run 2\'s start now agrees with the measured kickoff epoch');
const r2 = hhmm(DERIVED.run2_start);
check(treeBlock.includes(r2),
  `C1: the block quotes the measured run-2 kickoff time ${r2} (from ${run2Start.file})`, r2);
const r2Line = treeBlock.split('\n').find((l) => l.includes(r2));
check(!!r2Line && /run 2|Improvement run 2/i.test(r2Line + ' ' + (treeBlock.split('\n')[treeBlock.split('\n').indexOf(r2Line) - 1] || '')),
  'C2: that time is attached to run 2, not parked somewhere unrelated',
  JSON.stringify((r2Line || '').trim()));

say('');
say('D. the acceptance\'s WIDER clause: every other boundary checked, not assumed');
// Run 1's start was already correct — a fix that "corrects" it is a regression.
const r1s = hhmm(DERIVED.run1_start);
check(treeBlock.includes(r1s),
  `D1: run 1's start ${r1s} — already correct at HEAD — is preserved, not "corrected"`, r1s);

// Every HH:MM in the block must either match a derived boundary or be labelled.
const LABEL = /(approx|about|~|not (?:establish|record|logged)|unrecorded|no (?:on-disk )?artifact|unverif|estimat|attended|planned stop|scheduled stop|nearest|to the minute)/i;
const derivedHHMM = new Set(Object.values(DERIVED).filter(Boolean).map(hhmm));
// A boundary may also honestly be quoted from a runfile's stop_at.
for (const d of done) if (d.stopAt) derivedHHMM.add(d.stopAt.slice(11, 16));
// ...or from the recorded moment run 2's work died on the cap (git log, cycle 65).
derivedHHMM.add('20:02');
report('artifact-anchored HH:MM values', JSON.stringify([...derivedHHMM].sort()));

const blockLines = treeBlock.split('\n');
const unanchored = [];
for (let i = 0; i < blockLines.length; i++) {
  for (const m of blockLines[i].matchAll(/\b(\d{2}:\d{2})\b/g)) {
    if (derivedHHMM.has(m[1])) continue;
    // allow a labelled line, or a label on the line that wraps into this one
    const ctx = (blockLines[i - 1] || '') + ' ' + blockLines[i] + ' ' + (blockLines[i + 1] || '');
    if (LABEL.test(ctx)) continue;
    unanchored.push(`${m[1]} @ line ${i + 1}: ${blockLines[i].trim()}`);
  }
}
check(unanchored.length === 0,
  'D2: every clock time in the run-summary block is either artifact-anchored or explicitly labelled as unestablished',
  JSON.stringify(unanchored));

// The specific one the acceptance calls out by name.
const buildRunCtx = blockLines.slice(0, 4).join(' ');
check(LABEL.test(buildRunCtx),
  'D3: the attended build run — whose start no artifact establishes — carries an honest label',
  JSON.stringify(buildRunCtx.trim().slice(0, 160)));

say('');
say('E. blast radius — nothing outside this item\'s scope moved');
// T-174 owns the test-count figures; this item must leave every one byte-identical.
for (const fig of ['102/102', '145/145', '148/148', '# 155 tests', '145 → **148**']) {
  const inHead = (headBody.match(new RegExp(fig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const inTree = (treeBody.match(new RegExp(fig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  check(inHead === inTree, `E1: the test-count figure ${JSON.stringify(fig)} is untouched (T-174 owns it)`,
    `HEAD ${inHead} -> tree ${inTree}`);
}
// Nothing below the run-summary block changed at all.
const belowHead = headBody.slice(headBody.indexOf('\n---'));
const belowTree = treeBody.slice(treeBody.indexOf('\n---'));
check(belowHead === belowTree,
  'E2: the rest of REPORT.md below the run-summary block is byte-identical to HEAD');

const changed = execFileSync('git', ['-C', REPO, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
  .split('\n').filter(Boolean);
report('files changed in the whole tree this cycle', JSON.stringify(changed));
check(changed.includes('REPORT.md'), 'E3: REPORT.md was actually edited');
const outOfScope = changed.filter((f) => !['src/render.js', 'test/render.test.js', 'REPORT.md'].includes(f));
check(outOfScope.length === 0, 'E4: nothing outside the wave\'s two disjoint scopes was touched',
  JSON.stringify(outOfScope));

say('');
say(`GATE T-164: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed check(s))`);
fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-079-verify-T164.txt', lines.join('\n') + '\n');
process.exit(failures === 0 ? 0 : 1);
