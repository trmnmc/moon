const fs = require('fs');
const dir = '/opt/targets/moon/.swarm';
const NOW = 1786906571;
const ISO = '2026-08-16T18:56:11+00:00';

// ---- state.json ----
const sp = dir + '/state.json';
const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
s.cycle = 63;
s.counters.consecutive_no_value = 0;
s.counters.wave_streak = 1;
s.qa.last_build_wave_cycle = 63;
s.decisions.push({
  cycle: 63,
  what: "T-151 was retried at SONNET, not demoted back to haiku, even though gear 1 carries demote:true and the demotion rule explicitly permits sonnet->haiku for docs/polish items.",
  why: "Two mechanisms collide on this item and the literal composition is perverse. Pick-time routing sends kind=docs/effort=S to haiku; the escalation ladder then raises it one rung to sonnet because attempts>=1; gear-1 demotion would then drop it straight back to haiku -- the exact tier that failed the gate at cycle 62, for a reasoning error (it asserted a corner-alignment observable that is false under the documented failure mode). Arbitration: the ladder is a response to MEASURED failure at a tier, while demotion is a cost-control mechanism. A cost mechanism cannot rationally undo a correctness escalation, because the cheaper run is not cheaper if it reproduces the same wrong answer -- cycle 62 spent a whole cycle to buy exactly that lesson. Demotion is therefore treated as not applicable to a rung the ladder just raised. Recorded because it is a general rule the next conductor will hit again, not a one-off."
});
fs.writeFileSync(sp + '.tmp', JSON.stringify(s, null, 1));
fs.renameSync(sp + '.tmp', sp);

// ---- backlog.json ----
const bp = dir + '/backlog.json';
const b = JSON.parse(fs.readFileSync(bp, 'utf8'));
const it = b.items.find((x) => x.id === 'T-151');
it.status = 'done';
it.model = 'sonnet';
it.notes += " | cycle 63 ATTEMPT 2 PASSED THE GATE (sonnet). The retry replaced the false corner-to-corner observable with a border-line-vs-body-row-edge one: the reader compares the right-hand bar on the phase/illuminated/hemisphere rows against the right end of the top and bottom lines. Conductor gate authored independently at verification time and run over 368 frames (every 6 h across 2026-01-01..2026-02-15, both hemispheres), measuring display width from unicodedata UCD 15.0.0 under both width policies: ambiguous=1 -> every row 34 cols, named-row bar and both corners all at col 33 (aligned, reader correctly concludes UNAFFECTED) on 368/368 frames; ambiguous=2 -> border rows 68 cols, named rows 36 cols, bar at col 34 vs corners at col 66, i.e. 32 columns short (reader correctly concludes AFFECTED) on 368/368 frames. Zero frames where either branch misleads. Diff was a pure 7-line addition (7/0 README.md), so nothing retained was deleted or weakened. Evidence: .swarm/runs/cycle-063-verify-t151.txt (plus -v1.txt, the conductor's own miscalibrated first pass).";
fs.writeFileSync(bp + '.tmp', JSON.stringify(b, null, 1));
fs.renameSync(bp + '.tmp', bp);

const counts = {};
for (const i of b.items) counts[i.status] = (counts[i.status] || 0) + 1;
console.log('backlog', JSON.stringify(counts));
console.log('state cycle', s.cycle, 'counters', JSON.stringify(s.counters));
