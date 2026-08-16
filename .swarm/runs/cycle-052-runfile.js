'use strict';
const fs = require('fs');
const RF = '/opt/swarm/runs/current.json';
const JOURNAL = '/opt/targets/moon/.swarm/journal.md';
const BLOCK = '/opt/targets/moon/.swarm/runs/cycle-052-journal.md';

const NOW = 1786891900;
const WAKE = 1786891990;

const r = JSON.parse(fs.readFileSync(RF, 'utf8'));

r.heartbeat = { ts: NOW, next_wakeup_at: WAKE, pid: 1093702, limp: false, degraded_tiers: [] };
r.budget.last_probe_ts = NOW;
// probe_failures HELD at 3 — no probe was attempted, and declining to probe is not a failure.
r.budget.gear_evidence =
  'cycle 52: NO probe attempted. Step-1 backoff in force (probe_failures 3) and ' +
  'now - last_real_probe_ts = 1505 s < 1800, so the real probe is not due; the ' +
  'PROBE_CMD=false form is unavailable for the same KI-2 reason (bin/swarm-budget.sh is ' +
  'denied by the allowlist in every form). probe_failures HELD at 3 rather than ' +
  'incremented. Gear 1 held on fresh disk evidence: runs/allocator.json stamped at the ' +
  '14:10Z pacer refresh reads weekly_used_pct 99.0, opus_used_pct 97, week_elapsed_pct ' +
  '91.34 (up from 91.17 last cycle, so the file is live), posture trickle, ' +
  'allow_overall_pct 0, allow_premium_pct 0. week_resets_at 1786942799 IS stop_at, so ' +
  'there is no later richer window to save for. Crawl WITH evidence.';
r.budget.weekly.week_elapsed_pct = 91.34;
r.cycles_since_recycle = 5;

// mirror WITHOUT artifact.url per the spec, then append the journal block
const mirror = JSON.stringify(r);
const block = fs.readFileSync(BLOCK, 'utf8').replace('RUNFILE_MIRROR_PLACEHOLDER', mirror);
fs.appendFileSync(JOURNAL, block);

fs.writeFileSync(RF + '.tmp', JSON.stringify(r, null, 2));
fs.renameSync(RF + '.tmp', RF);
fs.copyFileSync(RF, RF + '.bak');

console.log('runfile written, heartbeat', NOW, 'wake', WAKE);
console.log('journal appended:', block.length, 'bytes');
