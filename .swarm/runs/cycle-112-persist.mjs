import fs from 'node:fs';

const BP = '/opt/targets/moon/.swarm/backlog.json';
const b = JSON.parse(fs.readFileSync(BP, 'utf8'));
for (const it of b.items) {
  if (it.id === 'T-214' || it.id === 'T-216') { it.status = 'done'; it.completed_cycle = 112; }
}
fs.writeFileSync(BP + '.tmp', JSON.stringify(b, null, 2));
fs.renameSync(BP + '.tmp', BP);
const c = {};
for (const i of b.items) c[i.status] = (c[i.status] || 0) + 1;
console.log('backlog:', JSON.stringify(c));

const SP = '/opt/targets/moon/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(SP, 'utf8'));
s.cycle = 112;
s.phase = 'BUILD';
s.counters = s.counters || {};
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
s.counters.k_current = 4;
s.counters.wave_streak = 0;
s.decisions = s.decisions || [];
s.decisions.push({
  cycle: 112,
  what: 'Closed the gate-avoidance the builder left in REPORT.md:231 rather than accepting it',
  why: "The builder left the registry intro's own mention of test/gate-claims.test.js unbackticked, by its own account so that citations.test.js's backticked-bare-path rule (path must exist AND be git-tracked) would not fire on a file not yet committed. No test was weakened, but prose shaped to sit outside a live gate is the same failure mode this item exists to remove. Backticked it, staged the file, funded the two bytes by dropping the word 'enforcing'. Suite 255 -> 256, and the one added test is exactly that coverage.",
});
s.decisions.push({
  cycle: 112,
  what: 'Recorded my own first gate cell as FAIL rather than re-labelling it a pass',
  why: 'Gate cell 6 (quotemut) mutated a quoted span that sat outside any registry row window, so it reddened the citations test rather than the quote-verbatim check it names. Red for the wrong reason is not evidence. Recorded FAIL and re-aimed it as cells 6-8 in a second script; both scripts stay on disk, including the mis-aimed one, so the record shows the miss.',
});
s.decisions.push({
  cycle: 112,
  what: 'T-216 was recovered from a crashed cycle rather than rebuilt, and re-derived before being trusted',
  why: 'Cycle 112 (pid 3482352) died at 08:40 after writing .swarm/KI-2-OWNER-ACTION.md and before journalling anything. The file is coherent partial work, so cycle.md step 2 salvage applies — but its content is a factual claim, so it was re-measured against the live settings.json (11 swarm-* allow forms, breakdown 4/3/2/2, zero for swarm-playbook.sh and swarm-warmup.sh) rather than accepted because it looked finished.',
});
fs.writeFileSync(SP + '.tmp', JSON.stringify(s, null, 2));
fs.renameSync(SP + '.tmp', SP);
console.log('state: cycle', s.cycle, 'phase', s.phase, 'k_current', s.counters.k_current,
  'wave_streak', s.counters.wave_streak, 'no_value', s.counters.consecutive_no_value);
