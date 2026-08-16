'use strict';
/** Cycle 55 persistence: backlog, state, runfile. Atomic (.tmp + rename). */

const fs = require('node:fs');
const path = require('node:path');

const REPO = '/opt/targets/moon';
const SWARM = '/opt/swarm';
const NOW = 1786895933;

function atomic(p, obj) {
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(tmp, p);
}

// --- backlog ---------------------------------------------------------------
const bpath = path.join(REPO, '.swarm/backlog.json');
const backlog = JSON.parse(fs.readFileSync(bpath, 'utf8'));
const t146 = backlog.items.find((i) => i.id === 'T-146');
t146.status = 'done';
t146.notes +=
  ' [cycle 55 CLOSED] Built the test for L1, the top-ranked HOLE. New test in ' +
  'test/render.test.js: "renderLine: a hair-thin 0.65%-illuminated crescent still shows a ' +
  'hairline limb, not a dark disc". Proven in two arms by the conductor\'s own gate ' +
  '(.swarm/runs/cycle-055-gate.js, independent of the builder harness): ARM A — L1 applied, ' +
  'suite RED at exit 1 with exactly one `not ok` line, the new test by name, 145 pass / 1 fail; ' +
  'ARM B — L1 still applied but test/render.test.js checked out at HEAD (the new test absent ' +
  'entirely, a stronger form of assertion-removal), suite GREEN at 145/145, which also re-proves ' +
  'L1 genuinely survived the pre-existing battery. Witness re-derived on the pristine tree rather ' +
  'than taken on trust: truth U+2595 hairline vs mutant U+2591 dark in column 5. Clean tree ' +
  '146/146. src/render.js byte-identical to HEAD at gate exit. Suite baseline rises 145 -> 146.';

const t149 = backlog.items.find((i) => i.id === 'T-149');
t149.notes +=
  ' [cycle 55] Unblocked and now the top-ranked remaining test item; T-146 closed the only HOLE ' +
  'that produced wrong output on a stock host, so AA1 (a test that cannot fail) is what is left ' +
  'of this run\'s "failable AND attributable" must-have. Same two-arm proof standard applies, and ' +
  'the ambient-argv subtlety is the whole difficulty: under `node --test <file>` process.argv.slice(2) ' +
  'is [], which is why the mutant coincidentally matches the truth. The arm must be run from a ' +
  'process whose ambient argv is non-empty.';

atomic(bpath, backlog);

const counts = backlog.items.reduce((a, i) => ((a[i.status] = (a[i.status] || 0) + 1), a), {});

// --- state -----------------------------------------------------------------
const spath = path.join(REPO, '.swarm/state.json');
const state = JSON.parse(fs.readFileSync(spath, 'utf8'));
state.cycle = 55;
state.phase = 'BUILD';
state.qa.last_build_wave_cycle = 55;
state.counters = {
  consecutive_no_value: 0,
  consecutive_failures: 0,
  k_current: 5,
  wave_streak: 0,
  window_tokens_attributed: state.counters.window_tokens_attributed || 0,
};
state.last_cycle = {
  cycle: 55,
  work: 'build-wave k=1 (T-146, S/test, sonnet) — close L1, the lineArt dark/hairline HOLE, proven in two arms',
  outcome: 'verified',
  verified: ['T-146'],
  filed: [],
  reverted: [],
};
atomic(spath, state);

// --- runfile ---------------------------------------------------------------
const rpath = path.join(SWARM, 'runs/current.json');
const runfile = JSON.parse(fs.readFileSync(rpath, 'utf8'));
runfile.heartbeat.ts = NOW;
atomic(rpath, runfile);
fs.copyFileSync(rpath, rpath + '.bak');

console.log('backlog:', JSON.stringify(counts));
console.log('state: cycle', state.cycle, 'phase', state.phase, 'k_current', state.counters.k_current, 'wave_streak', state.counters.wave_streak);
console.log('runfile + .bak written');
