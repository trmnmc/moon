'use strict';
/*
 * Conductor verification gate — cycle 79, item T-164, VERSION 3 (final).
 *
 * Lineage:
 *   v1  sealed 22:26:29Z BEFORE dispatch. FAIL x1 (D2). Output: cycle-079-verify-T164-v1.txt
 *   v2  repaired D2's two faults. FAIL x1 (D2c, newly added). Output: cycle-079-verify-T164-v2.txt
 *   v3  repairs D2c. This file.
 *
 * All three faults were in the GATE's apparatus, each diagnosed by direct probe:
 *   [v1 D2 / "09:16"] the anchor set omitted the notification logs, which are on-disk
 *        artifacts the document legitimately cites (verified: the archived notify log
 *        carries `2026-08-15T09:16:19+0000 send wrap-up ok`). Anchor set incomplete.
 *   [v1 D2 / "05:00"] a usage-window RESET time in the outcome prose is not a run
 *        start/end, which is the scope the acceptance names. Confirmed untouched:
 *        `git diff HEAD -- REPORT.md` contains no 05:00 line.
 *   [v2 D2c] compared the unscanned remainder LINE-BY-LINE BY INDEX. The edit changed
 *        the block's line count (8 lines became 15), so every later line was compared
 *        against a different HEAD line and all of them "differed". The check was
 *        measuring the reflow, not a content change. v3 compares the remainder as a
 *        content-anchored BLOB instead, and derives the boundary region by its
 *        terminator (`**Target:**`) rather than by a fragile continuation heuristic —
 *        v2's heuristic also mis-classified the wrapped line `**148/148 tests green**.`
 *        as outside the run-2 entry because it happens to begin with `**`.
 *
 * D2c's PURPOSE is retained exactly: whatever the scan does not check against the
 * artifacts must be proven byte-identical to HEAD, so narrowing the scan can never
 * hide an edit.
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
check(kick.every((k) => !(utc(k.epoch).startsWith('2026-08-14') && hhmm(k.epoch) < '12:59')),
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

/**
 * The run-boundary region: from the first `**Build run:` / `**Improvement run N:`
 * line up to (excluding) the `**Target:**` line that terminates the list.
 * Content-anchored, so it survives reflow and line-count changes.
 */
function regionOf(blk) {
  const ls = blk.split('\n');
  const start = ls.findIndex((l) => /^\*\*(Build run|Improvement run \d)/.test(l));
  const end = ls.findIndex((l) => /^\*\*Target:/.test(l));
  return { ls, start, end };
}
const T = regionOf(treeBlock);
const H = regionOf(headBlock);
check(T.start >= 0 && T.end > T.start && H.start >= 0 && H.end > H.start,
  'B3: the run-boundary region is delimited in both arms (first run entry .. **Target:**)',
  `tree ${T.start + 1}..${T.end} / head ${H.start + 1}..${H.end}`);

const treeEntries = T.ls.slice(T.start, T.end);
const treeRemainder = [...T.ls.slice(0, T.start), ...T.ls.slice(T.end)].join('\n');
const headRemainder = [...H.ls.slice(0, H.start), ...H.ls.slice(H.end)].join('\n');

say('');
say('C. the item\'s own claim: run 2\'s start now agrees with the measured kickoff epoch');
const r2 = hhmm(DERIVED.run2_start);
const entryText = treeEntries.join('\n');
check(entryText.includes(r2), `C1: the run entries quote the measured run-2 kickoff time ${r2} (from ${run2Start.file})`, r2);
const r2Line = treeEntries.find((l) => l.includes(r2));
check(!!r2Line && /Improvement run 2/i.test(r2Line),
  'C2: that time is attached to run 2, not parked somewhere unrelated', JSON.stringify((r2Line || '').trim().slice(0, 120)));

say('');
say('D. the acceptance\'s WIDER clause: every other boundary checked, not assumed');
const r1s = hhmm(DERIVED.run1_start);
check(entryText.includes(r1s), `D1: run 1's start ${r1s} — already correct at HEAD — is preserved, not "corrected"`, r1s);

const anchors = new Map();
const addAnchor = (t, why) => { if (!anchors.has(t)) anchors.set(t, why); };
for (const [k, v] of Object.entries(DERIVED)) addAnchor(hhmm(v), `derived ${k}`);
for (const d of done) if (d.stopAt) addAnchor(d.stopAt.slice(11, 16), `${d.file} stop_at`);
for (const s of notifyStamps) addAnchor(s.hhmm, `${s.file} "${s.what.slice(0, 40)}"`);
addAnchor('20:02', 'run-2 wrap-up commit: cap exhausted at cycle 65');
report('artifact-anchored HH:MM count', anchors.size);

const LABEL = /(approx|about|~|not (?:establish|record|logged)|unrecorded|no (?:on-disk )?artifact|unverif|estimat|attended|planned|scheduled|defensible|disagree)/i;
const unanchored = [];
for (let i = 0; i < treeEntries.length; i++) {
  for (const m of treeEntries[i].matchAll(/\b(\d{2}:\d{2})\b/g)) {
    if (anchors.has(m[1])) continue;
    const ctx = (treeEntries[i - 1] || '') + ' ' + treeEntries[i] + ' ' + (treeEntries[i + 1] || '');
    if (LABEL.test(ctx)) continue;
    unanchored.push(`${m[1]}: ${treeEntries[i].trim()}`);
  }
}
report('run-boundary entry lines scanned', treeEntries.length);
check(treeEntries.length > 0, 'D2a: the run-boundary entries were actually located', treeEntries.length);
check(unanchored.length === 0,
  'D2b: every clock time in the run-boundary entries is artifact-anchored or explicitly labelled as unestablished',
  JSON.stringify(unanchored));
check(treeRemainder === headRemainder,
  'D2c: everything in the block OUTSIDE the run-boundary entries is byte-identical to HEAD — '
  + 'narrowing the scan cannot hide an edit (compared as a blob, so reflow inside the entries is not mistaken for a change)');
if (treeRemainder !== headRemainder) {
  say('        tree remainder: ' + JSON.stringify(treeRemainder.slice(0, 400)));
  say('        head remainder: ' + JSON.stringify(headRemainder.slice(0, 400)));
}

const buildIdx = treeEntries.findIndex((l) => /^\*\*Build run/.test(l));
const buildCtx = treeEntries.slice(buildIdx, buildIdx + 3).join(' ');
check(LABEL.test(buildCtx),
  'D3: the attended build run — whose start no artifact establishes — carries an honest label',
  JSON.stringify(buildCtx.trim().slice(0, 140)));

for (const [name, epoch] of Object.entries(DERIVED)) {
  if (name === 'build_end') continue;
  check(entryText.includes(hhmm(epoch)),
    `D4: the entries state the artifact-derived ${name} (${hhmm(epoch)})`, hhmm(epoch));
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
say(`GATE T-164 (v3): ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed check(s))`);
fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-079-verify-T164.txt', lines.join('\n') + '\n');
process.exit(failures === 0 ? 0 : 1);
