#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SW = '/opt/targets/moon/.swarm';
const atomic = (p, obj) => {
  fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(p + '.tmp', p);
};

// ---------------------------------------------------------------- state.json
const statePath = path.join(SW, 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

state.cycle = 53;
state.phase = 'BUILD';
state.qa = state.qa || {};
state.qa.last_build_wave_cycle = 53;

state.counters.consecutive_no_value = 0; // T-144 verified done this cycle
state.counters.consecutive_failures = 0;
// Wave autotune: clean wave (no revert, no failed verify) but the builder's mid-run
// early return cost a full re-run, so it earns no k promotion. k_current unchanged at 5
// (gear 1 caps the effective wave at 1 regardless).
state.counters.wave_streak = 0;

state.decisions.push({
  cycle: 53,
  what: 'T-144 closed done with TWO independent classification passes on record — the conductor gate (cycle-053-gate-report.md) and the builder artifact (c53-sweep-report.md) — kept as separate files rather than merged',
  why: "The builder returned early mid-cycle having backgrounded its sweep, so the conductor killed the orphaned run, re-ran the harness itself (cycle-053-sweep-out.txt: 24 mutants, 21 killed, 3 survived, baseline 145/145) and authored both discrimination gates and all three classifications WITHOUT any builder report existing. The builder then resumed on its own and produced its report, overwriting the conductor's file at the shared path. Both passes are kept because they are genuinely independent — different instruments (exhaustive enumeration + VM Intl replacement vs direct truth/mutant calls), neither derived from the other — and they CONVERGE on all three survivors. Agreement reached that way is evidence; a merged single file would have destroyed exactly the property that makes it evidence. The conductor's report lives at cycle-053-gate-report.md; the builder's keeps the path it claimed.",
});

state.decisions.push({
  cycle: 53,
  what: "HI1 recorded as BOUNDARY on the stock-runtime domain, HOLE on the contract domain, after the conductor's FIRST gate returned a no-difference result that was worthless for it",
  why: "Gate 1 enumerated 616 hemisphere inputs and found no difference for HI1. That result carried no information: HI1 mutates the recovery value inside catch { zone = undefined }, reached only when Intl.DateTimeFormat().resolvedOptions() THROWS, and on stock Node it never throws — so the mutated line never executed under gate 1 at all. Gate 2 loaded the module in a VM context with a throwing Intl and found a full hemisphere flip (truth=north, mutant=south) on the exact call bin/moon.js:106 makes on every run without --north/--south. Reported as BOUNDARY-on-reachable only because a stock host cannot get there; the try/catch exists precisely to serve hosts that can, and the suite pins nothing about its recovery value. The gate recording its own first answer as wrong — the second cycle running in which that has happened — is the mechanism working, not a defect in it.",
});

state.decisions.push({
  cycle: 53,
  what: 'HF3 recorded as a PROVEN boundary rather than a sampled one, with an explicit table contingency attached',
  why: "The empty-string guard is dead code under the mutation, but that alone does not make it equivalent — the question is whether deleting it changes the answer for key === ''. Proved over the table rather than sampled: '' is in neither Set (NORTHERN_ZONES=1, SOUTHERN_ZONES=95) and no prefix p satisfies ''.startsWith(p) (SOUTHERN_PREFIXES=6, zero matches), so the fall-through reaches the same terminal return DEFAULT_HEMISPHERE. Caveat kept attached in the shape of cycle 52's F3: this is a boundary of the current TABLE, not of the code — an empty-string prefix (which every string startsWith) would make it a live defect with no test behind it. Both passes reached this proof independently.",
});

state.decisions.push({
  cycle: 53,
  what: 'AA1 upgraded from "an unprotected behavior" to "a test that cannot fail", and filed as T-149 — a finding the conductor gate MISSED and the builder found',
  why: "The gate witnessed AA1's divergence and stopped at 'untested guard'. The builder went further and identified why it survives: test/args.test.js:22 already asserts parseArgs(undefined) deep-equals the all-defaults object, and that test still passes under the mutation because node:util falls back to process.argv.slice(2), which under `node --test <file>` is empty — coincidentally matching the literal [] the truth code produces. The conductor verified both halves itself rather than taking the claim (the builder's witness scripts were deleted, so none of its evidence survives on disk): grep confirms the test at line 22, and a probe under node --test prints `PROBE []`. Combined with the gate's own AA1 witness from a process WITH non-empty ambient argv, the vacuity is established from disk-resident evidence in both arms. Recorded as a miss on the gate's part, not absorbed silently — the point of two passes is that either one can catch the other.",
});

atomic(statePath, state);

// -------------------------------------------------------------- backlog.json
const backlogPath = path.join(SW, 'backlog.json');
const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
const item = (id) => backlog.items.find((i) => i.id === id);

const t144 = item('T-144');
t144.status = 'done';
t144.notes =
  (t144.notes ? t144.notes + ' ' : '') +
  '[cycle 53] Done. 24 mutants, 21 killed, 3 survived, verified by the conductor re-running the ' +
  'harness itself. Coverage checked clause by clause against the sources: all six live flags ' +
  '(AJ1-AJ4, AH1, AH2 — including --compact, which the frozen CONTRACTS.md does not list), ' +
  'last-one-wins (AH3 + AH5), all four table-priority levels (HZ1-HZ4), unknown-zone fallback ' +
  '(HF1, plus the HF2/HF3 guards and the HI1 route). Survivors: AA1 HOLE-on-contract/CLI-unreachable, ' +
  'HF3 PROVEN BOUNDARY (table-contingent), HI1 BOUNDARY-on-reachable/HOLE-on-contract (whole-moon ' +
  'handedness flip when Intl throws). Two independent classification passes converge on all three. ' +
  'Evidence: cycle-053-gate-report.md (conductor), c53-sweep-report.md (builder), ' +
  'cycle-053-sweep-out.txt, cycle-053-gate-out.txt, cycle-053-gate2-out.txt.';

const t146 = item('T-146');
t146.notes =
  (t146.notes || '') +
  ' [cycle 53 input from T-144] Two further confirmed HOLEs, neither displacing L1: ' +
  'HI1 (src/hemisphere.js) — the catch-branch recovery value when Intl.DateTimeFormat() throws is ' +
  'unpinned; witness truth=north vs mutant=south, a whole-moon handedness flip on the live ' +
  'bin/moon.js:106 path, but gated on a runtime where Intl is broken or absent. ' +
  'AA1 (src/args.js) — split off into T-149, since it is a vacuous-test defect rather than a ' +
  'plain coverage gap. Ranking for this item stands at L1 > HI1 > O3 > L3: L1 is the only one that ' +
  'produces wrong output on a normal run of a stock host. HF3 needs no test — it is a proven boundary.';

// Reprioritized: a test that cannot fail outranks doc re-verification.
item('T-147').priority = 9;
item('T-148').priority = 10;

backlog.items.push({
  id: 'T-149',
  title: 'Make test/args.test.js:22 discriminating — it currently passes under the AA1 mutation for an incidental reason',
  kind: 'test',
  priority: 8,
  value: 'H',
  effort: 'S',
  status: 'todo',
  deps: [],
  files_hint: ['test/args.test.js'],
  acceptance:
    "test/args.test.js's undefined-argv test is shown to FAIL against the AA1 mutation " +
    "(src/args.js `argv === undefined` -> `argv === null`) in two arms: proven failable with the " +
    'mutation applied, and proven attributable — removing the new/changed assertion lets the same ' +
    'mutation survive again. The existing assertion must not be weakened or deleted; the fix is to ' +
    'give it discriminating power (e.g. exercise the call from a process whose ambient argv is ' +
    'non-empty), not to restate it.',
  packages: [],
  model: 'sonnet',
  attempts: 0,
  notes:
    'Found at cycle 53 by the T-144 sweep. The test asserts the right thing and looks like real ' +
    'coverage, but its discriminating power is zero: under the mutation node:util falls back to ' +
    'process.argv.slice(2), which is [] under `node --test <file>` (verified: PROBE []), so the ' +
    "mutant coincidentally produces the truth's literal []. Conductor's own witness from a process " +
    'with non-empty ambient argv shows the real divergence: truth {"hemisphere":null,...} vs mutant ' +
    'parsing the embedding process\'s command line (cycle-053-gate-out.txt:94). Directly in scope ' +
    'for this run\'s must-have "every new test proven failable AND attributable in two arms" (L-029).',
});

atomic(backlogPath, backlog);

const counts = backlog.items.reduce((a, i) => ((a[i.status] = (a[i.status] || 0) + 1), a), {});
console.log('backlog:', JSON.stringify(counts), 'total', backlog.items.length);
console.log('state: cycle', state.cycle, 'decisions', state.decisions.length);
