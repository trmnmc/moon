'use strict';
const fs = require('fs');
const D = '/opt/targets/moon/.swarm/';

function atomic(file, obj) {
  fs.writeFileSync(D + file + '.tmp', JSON.stringify(obj, null, 2));
  fs.renameSync(D + file + '.tmp', D + file);
}

// ---- backlog ----
const b = JSON.parse(fs.readFileSync(D + 'backlog.json', 'utf8'));
const t143 = b.items.find((i) => i.id === 'T-143');
t143.status = 'done';
t143.notes = (t143.notes || '') +
  ' [cycle 52] 26 mutants, 19 killed, 7 survived; all 5 named behaviors covered. ' +
  'Classification: HOLE (reachable) L1, L3, O3 - the limb-glyph threshold cascade at thin ' +
  'crescents is unpinned, and L1 renders a lit crescent as new. BOUNDARY (proven no-op) F3 - ' +
  'pad=(32-12)/2=10, floor===ceil. BOUNDARY-on-reachable / HOLE-on-contract O1, O2, P2 - each ' +
  'is a guard (handedness at f=0.5, fraction wraparound, illumination clamp) that is ' +
  'indiscriminable from astro.js output but observably different for contract-legal fixture ' +
  'input. Report: .swarm/runs/c52-sweep-report.md. Sweep harness agent-authored; the agent ' +
  'delivered no classification (truncated return, infeasible draft discriminator), so the ' +
  'conductor re-ran the sweep and authored the classification in cycle-052-gate.js / -gate2.js.';

const t146 = b.items.find((i) => i.id === 'T-146');
t146.notes = (t146.notes || '') +
  ' [cycle 52 input from T-143] Confirmed HOLEs ranked by user-visible impact: (1) L1 - ' +
  'lineArt dark/hairline threshold cover<0.02, witness cycleFraction=0.025725 ' +
  'illumination=0.006517 north, truth "░░░░▕   1%" vs mutant ' +
  '"░░░░░   1%": a lit crescent renders as new. (2) O3 - blockArt ' +
  'hairline rescue cover>0.02, same defect on the framed block, witness ' +
  'cycleFraction=0.013333 illumination=0.001754 row 3. (3) L3 - half/round-limb threshold ' +
  'cover<0.88, witness cycleFraction=0.13075 illumination=0.159448, limb degrades to a half ' +
  'block (ugly, not wrong). The all-BOUNDARY fallback in this item acceptance does NOT apply. ' +
  'T-144/T-145 may add further candidates before this item is picked.';

atomic('backlog.json', b);

// ---- state ----
const s = JSON.parse(fs.readFileSync(D + 'state.json', 'utf8'));
s.cycle = 52;
s.counters.consecutive_no_value = 0;   // verified value this cycle
s.counters.wave_streak = 0;            // not a CLEAN wave: deliverable incomplete on return
s.qa.last_build_wave_cycle = 52;
s.last_cycle = {
  cycle: 52,
  work: 'build-wave k=1 (T-143) - mutation sweep of src/render.js + conductor-authored survivor classification',
  outcome: 'verified',
  verified: ['T-143'],
  filed: [],
  reverted: [],
};
s.decisions.push({
  cycle: 52,
  what: 'T-143 closed DONE with the classification authored by the conductor gate rather than by the builder, and the split of labour recorded in the report itself',
  why: 'The agent delivered a correct, well-formed sweep harness (26 mutants, all five named behaviours, unique-find assertion, pristine-copy discipline) and then returned truncated off-topic text without the classification report; its draft discriminator sweeps ~400k full block renders per survivor and does not terminate in usable time. The measurement half - the expensive half - was independently re-run by the conductor and reproduces exactly (19 killed / 7 survived, baseline 145/145 inside the harness own copy). The remaining work was to decide HOLE vs BOUNDARY, which is a judgement the gate has to make independently ANYWAY under hard rule 2: a classification supplied by the builder would have had to be re-derived to be believed. Re-dispatching to reproduce a judgement the gate must own regardless is the wrong spend at gear 1 with weekly usage at 99 pct. The item acceptance is met in substance and the provenance is stated in the first paragraph of c52-sweep-report.md rather than smoothed over. wave_streak reset to 0 so the dispatch earns no k promotion; attempts left at 0 because the item closes done, not failed.',
});
s.decisions.push({
  cycle: 52,
  what: 'a third classification bucket recorded for O1/O2/P2 - BOUNDARY on the reachable domain, HOLE on the contract domain - instead of forcing them into the item HOLE/BOUNDARY binary',
  why: 'All three mutants are indiscriminable from anything astro.js can emit (verified: at the one reachable point cf=0.5, k=1, truth and O1-mutant render identically), so labelling them HOLE would overstate user impact. But all three ARE observably different for input CONTRACTS.md declares legal - 10 witnesses for O1 at cf=0.5 decoupled, 6 for O2 outside [0,1), 5 for P2 above k=1 - and in each case the mutated line is a GUARD whose guarding behaviour is the untested part. A clean BOUNDARY label would have been the exact failure this run spec warns about: a boundary asserted where the search simply never looked. Gate part 1 returned BOUNDARY for all four of F3/P2/O1/O2 precisely because its sweep domain excluded the region where three of them can differ; gate part 2 exists to catch that in the conductor own measurement.',
});
atomic('state.json', s);

const todo = b.items.filter((i) => i.status === 'todo').length;
const done = b.items.filter((i) => i.status === 'done').length;
console.log('backlog: todo', todo, 'done', done, 'total', b.items.length);
console.log('state: cycle', s.cycle, 'decisions', s.decisions.length);
