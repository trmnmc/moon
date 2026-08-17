'use strict';
/*
 * Conductor verification gate — cycle 79, item T-164, VERSION 2.
 *
 * v1 (c079-gate-T164.cjs, sealed 22:26:29Z BEFORE dispatch) ran and returned
 * FAIL on one check, D2. Both of D2's hits were INSTRUMENT faults, diagnosed by
 * direct probe, not by taking the builder's word:
 *
 *   "09:16"  D2's anchor set was built from kickoff-log filename epochs and
 *            archived-runfile fields only. The document sources this figure to
 *            the wrap-up NOTIFICATION, and that record is on disk — the run's
 *            archived notify log carries `2026-08-15T09:16:19+0000 send
 *            wrap-up ok` (verified by grep; it is line 41 of that file). So the
 *            time IS artifact-anchored and v1's anchor set was simply
 *            incomplete. v2 derives notification-log timestamps too.
 *
 *   "05:00"  is in the "Outcome of run 2" prose, and it is a USAGE-WINDOW RESET
 *            time, not a run start or end. The acceptance scopes this clause to
 *            "every other run start/end time in that same block". v1 scanned
 *            every HH:MM in the whole pre-rule region instead. Confirmed
 *            untouched: `git diff HEAD -- REPORT.md` contains no line matching
 *            05:00, so it is byte-identical pre-existing text.
 *
 * Narrowing a scan is exactly how a gate gets quietly weakened, so v2 does NOT
 * simply narrow it. It scans the run-boundary lines strictly, and then asserts
 * that EVERY line of the block it did not scan is byte-identical to HEAD (check
 * D2c). Nothing can hide in the unscanned remainder: either a line is checked
 * against the artifacts, or it is proven unchanged.
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

// =============================================== A. independent re-derivation
say('');
say('A. re-derive every run boundary from the on-disk artifacts (the gate does its own work)');

const kick = fs.readdirSync(SWARM_RUNS)
  .map((f) => /^kickoff-(\d+)\.log$/.exec(f)).filter(Boolean)
  .map((m) => ({ file: m[0], epoch: Number(m[1]) })).sort((a, b) => a.epoch - b.epoch);
for (const k of kick) report(k.file, `start=${utc(k.epoch)}`);

const done = fs.readdirSync(SWARM_RUNS).filter((f) => f.startsWith('current.json.done-'))
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
  }).sort((a, b) => a.archived - b.archived);
for (const d of done) {
  report(d.file, `label=${d.label} targets=${JSON.stringify(d.targets)} stop_at=${d.stopAt} `
    + `last_heartbeat=${d.lastHb ? utc(d.lastHb) : 'n/a'}`);
}
const moonDone = done.filter((d) => d.targets.some((t) => /\/moon$/.test(t)));

// v2 addition: the notification logs are on-disk artifacts too, and the document
// legitimately cites them. Harvest every timestamp they carry.
const notifyStamps = [];
for (const f of fs.readdirSync(SWARM_RUNS).filter((f) => f.startsWith('notify.log'))) {
  let body = '';
  try { body = fs.readFileSync(path.join(SWARM_RUNS, f), 'utf8'); } catch { continue; }
  for (const m of body.matchAll(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}[+-]\d{4}\s+(.*)$/gm)) {
    notifyStamps.push({ file: f, date: m[1], hhmm: m[2], what: m[3].trim() });
  }
}
report('notification-log timestamps harvested', notifyStamps.length);
for (const s of notifyStamps.filter((s) => /wrap-up|init cursor/.test(s.what))) {
  report(`  ${s.file}`, `${s.date} ${s.hhmm} — ${s.what}`);
}

const run1Start = kick.find((k) => utc(k.epoch).startsWith('2026-08-14'));
const run1Done = moonDone.find((d) => d.label === 'improvement-2026-08-14');
const run2Start = kick.find((k) => utc(k.epoch).startsWith('2026-08-16'));
const run2Done = moonDone.find((d) => d.stopAt && d.stopAt.startsWith('2026-08-17T04:59'));
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
for (const [k, v] of Object.entries(DERIVED)) report(`DERIVED ${k}`, `${utc(v)}  -> ${hhmm(v)}`);

const buildStartEstablishable = kick.some((k) => utc(k.epoch).startsWith('2026-08-14') && hhmm(k.epoch) < '12:59');
check(buildStartEstablishable === false,
  'A1: the attended build run\'s START is genuinely NOT establishable from any on-disk artifact '
  + '(so the labelling clause has real work to do and this gate is not vacuous)');

// ================================================== the document under test
const treeBody = fs.readFileSync(path.join(REPO, 'REPORT.md'), 'utf8');
const headBody = execFileSync('git', ['-C', REPO, 'show', 'HEAD:REPORT.md'], { encoding: 'utf8' });
const summaryBlock = (b) => (b.indexOf('\n---') < 0 ? b.slice(0, 2000) : b.slice(0, b.indexOf('\n---')));
const treeBlock = summaryBlock(treeBody);
const headBlock = summaryBlock(headBody);

say('');
say('B. controls — the defect was real, and the gate is reading the right text');
check(/13:37/.test(headBlock), 'B1 control: HEAD\'s run-summary block really does state 13:37 as run 2\'s start');
check(!/13:37/.test(treeBlock), 'B2: the 13:37 figure is gone from the run-summary block');
say('        tree run-summary block:');
say(treeBlock.split('\n').map((l) => '        | ' + l).join('\n'));

say('');
say('C. the item\'s own claim: run 2\'s start now agrees with the measured kickoff epoch');
const r2 = hhmm(DERIVED.run2_start);
check(treeBlock.includes(r2), `C1: the block quotes the measured run-2 kickoff time ${r2} (from ${run2Start.file})`, r2);
const blockLines = treeBlock.split('\n');
const r2Idx = blockLines.findIndex((l) => l.includes(r2));
check(r2Idx >= 0 && /Improvement run 2/i.test(blockLines[r2Idx]),
  'C2: that time is attached to run 2, not parked somewhere unrelated',
  JSON.stringify((blockLines[r2Idx] || '').trim().slice(0, 120)));

say('');
say('D. the acceptance\'s WIDER clause: every other boundary checked, not assumed');
const r1s = hhmm(DERIVED.run1_start);
check(treeBlock.includes(r1s), `D1: run 1's start ${r1s} — already correct at HEAD — is preserved, not "corrected"`, r1s);

// -- the anchor set, now including the notification logs and runfile stop_ats.
const anchors = new Map();
const addAnchor = (t, why) => { if (!anchors.has(t)) anchors.set(t, why); };
for (const [k, v] of Object.entries(DERIVED)) addAnchor(hhmm(v), `derived ${k}`);
for (const d of done) if (d.stopAt) addAnchor(d.stopAt.slice(11, 16), `${d.file} stop_at`);
for (const s of notifyStamps) addAnchor(s.hhmm, `${s.file} "${s.what.slice(0, 40)}"`);
// the recorded moment run 2's work died on the cap (run-2 wrap-up commit, cycle 65)
addAnchor('20:02', 'run-2 wrap-up commit: cap exhausted at cycle 65');
report('artifact-anchored HH:MM values', JSON.stringify([...anchors.keys()].sort()));

// -- the RUN-BOUNDARY lines: exactly the scope the acceptance names.
const BOUNDARY_RE = /^\*\*(Build run|Improvement run \d)/;
const boundaryIdx = [];
for (let i = 0; i < blockLines.length; i++) {
  if (BOUNDARY_RE.test(blockLines[i])) {
    boundaryIdx.push(i);
    // a boundary entry continues until the next bold-prefixed line
    for (let j = i + 1; j < blockLines.length && !/^\*\*/.test(blockLines[j]) && blockLines[j].trim(); j++) {
      boundaryIdx.push(j);
    }
  }
}
const scanned = new Set(boundaryIdx);
report('run-boundary entry lines scanned', JSON.stringify([...scanned].map((i) => i + 1)));
check(boundaryIdx.length > 0, 'D2a: the run-boundary entries were actually located', boundaryIdx.length);

const LABEL = /(approx|about|~|not (?:establish|record|logged)|unrecorded|no (?:on-disk )?artifact|unverif|estimat|attended|planned|scheduled|defensible|disagree)/i;
const unanchored = [];
for (const i of scanned) {
  for (const m of blockLines[i].matchAll(/\b(\d{2}:\d{2})\b/g)) {
    if (anchors.has(m[1])) continue;
    const ctx = (blockLines[i - 1] || '') + ' ' + blockLines[i] + ' ' + (blockLines[i + 1] || '');
    if (LABEL.test(ctx)) continue;
    unanchored.push(`${m[1]} @ line ${i + 1}: ${blockLines[i].trim()}`);
  }
}
check(unanchored.length === 0,
  'D2b: every clock time in the run-boundary entries is artifact-anchored or explicitly labelled as unestablished',
  JSON.stringify(unanchored));

// -- and nothing may hide in the part D2b did not scan.
const headBlockLines = headBlock.split('\n');
const unscannedChanged = [];
for (let i = 0; i < blockLines.length; i++) {
  if (scanned.has(i)) continue;
  if (blockLines[i] !== headBlockLines[i]) unscannedChanged.push(`line ${i + 1}: ${blockLines[i].trim().slice(0, 90)}`);
}
check(unscannedChanged.length === 0,
  'D2c: every line of the block NOT scanned above is byte-identical to HEAD — narrowing the scan cannot hide an edit',
  JSON.stringify(unscannedChanged));

const buildCtx = blockLines.filter((l) => /Build run/.test(l)).join(' ')
  + ' ' + (blockLines[blockLines.findIndex((l) => /Build run/.test(l)) + 1] || '');
check(LABEL.test(buildCtx),
  'D3: the attended build run — whose start no artifact establishes — carries an honest label',
  JSON.stringify(buildCtx.trim().slice(0, 140)));

// each derived boundary should actually appear somewhere in the entries
for (const [name, epoch] of Object.entries(DERIVED)) {
  if (name === 'build_end') continue; // the doc may cite stop_at instead; D2b already governs it
  check(treeBlock.includes(hhmm(epoch)),
    `D4: the block states the artifact-derived ${name} (${hhmm(epoch)})`, hhmm(epoch));
}

say('');
say('E. blast radius — nothing outside this item\'s scope moved');
for (const fig of ['102/102', '145/145', '148/148', '# 155 tests', '145 → **148**']) {
  const re = new RegExp(fig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const inHead = (headBody.match(re) || []).length;
  const inTree = (treeBody.match(re) || []).length;
  check(inHead === inTree && inHead > 0, `E1: the test-count figure ${JSON.stringify(fig)} is untouched (T-174 owns it)`,
    `HEAD ${inHead} -> tree ${inTree}`);
}
check(headBody.slice(headBody.indexOf('\n---')) === treeBody.slice(treeBody.indexOf('\n---')),
  'E2: the rest of REPORT.md below the run-summary block is byte-identical to HEAD');
const changed = execFileSync('git', ['-C', REPO, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
  .split('\n').filter(Boolean);
report('files changed in the whole tree this cycle', JSON.stringify(changed));
check(changed.includes('REPORT.md'), 'E3: REPORT.md was actually edited');
const outOfScope = changed.filter((f) => !['src/render.js', 'test/render.test.js', 'REPORT.md'].includes(f));
check(outOfScope.length === 0, 'E4: nothing outside the wave\'s two disjoint scopes was touched', JSON.stringify(outOfScope));

say('');
say(`GATE T-164 (v2): ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed check(s))`);
fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-079-verify-T164.txt', lines.join('\n') + '\n');
process.exit(failures === 0 ? 0 : 1);
