#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SW = '/opt/targets/moon/.swarm';
const RUNFILE = '/opt/swarm/runs/current.json';
const NOW = 1786895417;
const NEXT_WAKE = 1786895597; // +90s base, verified-value cycle

const atomic = (p, obj) => {
  fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(p + '.tmp', p);
};

// ---------------------------------------------------------------- state.json
const statePath = path.join(SW, 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

state.cycle = 54;
state.phase = 'BUILD';
state.qa = state.qa || {};
state.qa.last_build_wave_cycle = 54;

state.counters.consecutive_no_value = 0; // T-145 verified done this cycle
state.counters.consecutive_failures = 0;
// Wave autotune: CLEAN wave (0 reverts, 0 failed verifies) and the builder ran its
// sweep in the foreground as instructed, so the cycle-52/53 early-return failure did
// not recur. streak 0 -> 1; promotion needs 2, so k_current stays 5. Gear 1 caps the
// effective wave at 1 regardless.
state.counters.wave_streak = 1;

state.decisions.push({
  cycle: 54,
  what: "IT3's BOUNDARY verdict UPHELD but its stated reason overturned: the builder's ground was that the shipped CLI has no --date flag, which is not the test that matters",
  why: "package.json declares \"main\": \"src/astro.js\" and ships \"files\": [\"bin/\",\"src/\",\"README.md\"], and .swarm/CONTRACTS.md:17 documents computeMoon(date) as a public contract — a module consumer can pass any Date, so the module's reachable domain is strictly larger than the CLI's. This run already ruled that way once: at cycle 53 HI1 was recorded a HOLE on the contract domain even though a stock CLI host cannot reach it. Applying the builder's reasoning would have contradicted that precedent within two cycles. The verdict survives on different and stronger ground the conductor's own gate established: walking +/-3 ms around the strongest in-window witness (2016-08-02T08:44:38.430Z), EXACTLY one millisecond diverges and every neighbour agrees, so this is an exact-equality effect at dist === 0.5 d; and at that point nothing documents which answer is right — the contract says \"within tolerance\" and both the inclusive and exclusive readings satisfy it. An undocumented answer at an undocumented point is a boundary, not a hole. Practical consequence for T-146: IT3 does not enter the HOLE ranking, which stands unchanged at L1 > HI1 > O3 > L3.",
});

state.decisions.push({
  cycle: 54,
  what: 'the conductor gate re-ran its own AG1/CI1 kill checks under --test-reporter=tap rather than accepting its first pass',
  why: "Gate pass 1 established RED for both mutants but named zero killing tests: it parsed for TAP `not ok` lines while Node 24 defaults to the spec reporter, so the attribution silently came back empty rather than wrong. A bare RED verdict would have satisfied the acceptance's letter — the mutants were run against the suite — while leaving this run's own standing rule unmet, that a kill you cannot attribute is not evidence. Re-run named them: AG1 dies to the test named for exactly that behavior ('age reports true elapsed time and is never clamped to the mean lunation') plus the 60-year bound; CI1 dies to nine, including the cross-consistency test. The gate catching its own empty result is the third cycle running in which a gate has corrected itself — recorded as the mechanism working.",
});

state.decisions.push({
  cycle: 54,
  what: 'zero items filed from a sweep that found eight survivors, and that is recorded as the correct outcome rather than a thin one',
  why: "All eight survivors classify BOUNDARY, and this run's SPEC forbids writing a test for anything that is not a confirmed HOLE — the whole premise being that test COUNT is never an outcome. Five of the eight (IL1, LK1, ND1, ND2, IT4) are candidate equivalent mutants that provably cannot change output; the other three (IT3, EL1, EL2) change it only below what the module renders or at a single exactly-representable point. Filing hardening items for any of them would be exactly the CHURN-wearing-rigor's-clothes failure the stress-test named at kickoff. astro.js is the third and last file swept, and it is the first to come back with no holes — after T-129 already characterized the ch.49 tables, that is a plausible result rather than a suspicious one.",
});

atomic(statePath, state);

// -------------------------------------------------------------- backlog.json
const backlogPath = path.join(SW, 'backlog.json');
const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
const item = (id) => backlog.items.find((i) => i.id === id);

const t145 = item('T-145');
t145.status = 'done';
t145.notes =
  (t145.notes || '') +
  ' [cycle 54 CLOSED] 16 mutants swept against src/astro.js outside the T-129 table battery;' +
  ' 8 killed / 8 survived; all 8 survivors classified BOUNDARY with computed witnesses.' +
  ' All three acceptance-named behaviors hit: tolerance window (IT1-IT4), cycleFraction/' +
  'phaseAngle independence (CI1, CI2, IL1), age-vs-mean-month-clamp (AG1). Conductor re-ran' +
  ' the harness independently (cycle-054-sweep-out.txt) and reproduced all 16 verdicts, then' +
  ' attributed the two named-behavior kills to specific tests under --test-reporter=tap' +
  ' (cycle-054-gate2-out.txt). 0 tracked bytes changed, 145/145 unchanged, 0 filed.';

const t146 = item('T-146');
t146.notes +=
  ' [cycle 54 input from T-145] The astro.js sweep found EIGHT survivors and ZERO holes —' +
  ' nothing from it enters this ranking. The one that came closest, IT3 (isInstantPhase' +
  ' `<=` -> `<`), was ruled BOUNDARY by the conductor gate and the ruling is settled: do NOT' +
  ' re-litigate it. Its divergence is real on the public computeMoon API (3/3 witnesses' +
  ' reproduced, including 2016-08-02T08:44:38.430Z inside the documented accuracy window),' +
  ' but a +/-3 ms walk shows EXACTLY one millisecond diverges, and at exactly dist === 0.5 d' +
  ' the contract ("within tolerance") does not decide between the inclusive and exclusive' +
  ' reading. Undocumented answer at an undocumented point = boundary. NOTE the conductor' +
  ' overturned the builder\'s STATED reason for that verdict (it argued CLI-unreachability;' +
  ' package.json main IS src/astro.js and CONTRACTS.md:17 documents computeMoon(date), so' +
  ' module consumers reach it) — the verdict stands on the measure-zero ground above.' +
  ' RANKING UNCHANGED AND NOW FINAL, all three sweeps complete: L1 > HI1 > O3 > L3. Build' +
  ' the test for L1. Prove it in both arms per L-029: red against the cited mutation, and' +
  ' shown to let that same mutation survive once the new assertion is removed.';

atomic(backlogPath, backlog);

const counts = backlog.items.reduce((a, i) => ((a[i.status] = (a[i.status] || 0) + 1), a), {});
console.log('backlog:', JSON.stringify(counts));

// ------------------------------------------------------------------- journal
const journalPath = path.join(SW, 'journal.md');
const block = fs.readFileSync(path.join(SW, 'runs', 'cycle-054-journal.md'), 'utf8');

// -------------------------------------------------------------------- runfile
const rf = JSON.parse(fs.readFileSync(RUNFILE, 'utf8'));
rf.heartbeat = {
  ts: NOW,
  next_wakeup_at: NEXT_WAKE,
  pid: 1186835,
  limp: false,
  degraded_tiers: [],
};
// probe_failures HOLDS at 4: the real probe was not due (now - last_real_probe_ts = 1473 s
// < 1800), so the clock-cruise form was invoked instead and denied by the allowlist. A
// denied clock-cruise call is not a real probe attempt. last_real_probe_ts is untouched,
// so the real probe comes due again next cycle.
rf.budget.gear = 1;
rf.budget.gear_target = 1;
rf.budget.mode = 'guest';
rf.budget.source = 'clock';
rf.budget.k_cap = 1;
rf.budget.promote = false;
rf.budget.demote = true;
rf.budget.last_probe_ts = NOW;
rf.budget.gear_evidence =
  'cycle 54: real probe NOT due (now - last_real_probe_ts = 1473 s < 1800), so per the ' +
  '>=3-failure rule the clock-cruise form PROBE_CMD=false bin/swarm-budget.sh was invoked ' +
  'instead — DENIED by the Bash allowlist (KI-2, unchanged since cycle 48). A denied ' +
  'clock-cruise call is not a real probe attempt, so probe_failures HOLDS at 4 and ' +
  'last_real_probe_ts stays 1786892631; the real probe comes due again next cycle. Gear 1 ' +
  'held on fresh disk evidence: runs/allocator.json restamped by the 15:28Z pacer refresh ' +
  'reads weekly_used_pct 100.0 (up from 99.0 last cycle — the week is now fully consumed), ' +
  'opus_used_pct 97, week_elapsed_pct 91.95, posture trickle, allow_overall_pct 0, ' +
  'allow_premium_pct 0, dial 0.30. week_resets_at 1786942799 IS stop_at, so no later richer ' +
  'window exists to save for. Guest clamps 1-3; weekly governor ceiling is 1. Crawl WITH evidence.';
rf.budget.weekly = {
  ok: true,
  weekly_used_pct: 100.0,
  opus_used_pct: 97,
  week_elapsed_pct: 91.95,
  weekly_heat: 1.09,
  opus_heat: 1.06,
  ceiling: 1,
  promote_blocked: true,
};

const mirror = '\nrunfile-mirror:\n```json\n' + JSON.stringify(rf) + '\n```\n';
fs.appendFileSync(journalPath, block + mirror);
console.log('journal appended:', block.length + mirror.length, 'bytes');

atomic(RUNFILE, rf);
fs.copyFileSync(RUNFILE, RUNFILE + '.bak');
console.log('runfile written + .bak');
console.log('state cycle', state.cycle, 'wave_streak', state.counters.wave_streak);
