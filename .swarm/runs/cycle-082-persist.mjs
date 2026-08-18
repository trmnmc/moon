import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const atomic = (p, obj, indent) => {
  writeFileSync(`${p}.tmp`, JSON.stringify(obj, null, indent));
  renameSync(`${p}.tmp`, p);
};

// --- backlog: T-176 -> done -----------------------------------------------
const bp = '/opt/targets/moon/.swarm/backlog.json';
const b = JSON.parse(readFileSync(bp, 'utf8'));
const it = b.items.find((i) => i.id === 'T-176');
it.status = 'done';
it.verified_cycle = 82;
it.notes += [
  '',
  '',
  'VERIFIED AT CYCLE 82. Gate: .swarm/runs/cycle-082-gate.mjs; evidence:',
  '.swarm/runs/cycle-082-verify-T-176.txt. Four tests added, all named T-176:*.',
  'Both surfaces proven pinned in two arms with CONDUCTOR-CHOSEN mutations, not the',
  "builder's: LINE = lineArt outer-cell cut 0.02 -. 0.0001; BLOCK-b = blockArt hairline",
  'rescue gated to k at or above 0.0015. Each mutation SURVIVES the pre-cycle suite',
  '(exit 0) and DIES on the delivered suite, killed by a test added this cycle -- so the',
  'kill is attributable by name. The band was re-measured independently by the conductor',
  'straight from src/render.js: firstBlock 0.0006895, firstLine 0.006516, width 0.00583,',
  'confirming the cycle-81 taste-pass figures. src/ untouched (G2). Suite 165/165.',
].join('\n');
atomic(bp, b, 1);
const counts = {};
for (const i of b.items) counts[i.status] = (counts[i.status] || 0) + 1;

// --- state.json ------------------------------------------------------------
const sp = '/opt/targets/moon/.swarm/state.json';
const s = JSON.parse(readFileSync(sp, 'utf8'));
s.cycle = 82;
s.phase = 'BUILD';
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
s.counters.wave_streak = 1; // clean k=1 wave: 0 reverts, 0 failed verifies
s.qa.last_build_wave_cycle = 82;
s.decisions.push({
  cycle: 82,
  what:
    "the verification gate's own three instrument bugs were CORRECTED and re-run, not " +
    'worked around, and every correction is on the record: (1) the scratch-tree copy ' +
    'excluded .swarm/, which test/contracts.test.js reads at module load, so G1 and both ' +
    'attribution arms had been failing for a reason unrelated to the claim; (2) the band ' +
    "probe scanned every row of the framed block, so the caption row's letters counted as " +
    'lit and it reported firstBlock=0 at every k; (3) G8 tested BOUNDARY-word novelty ' +
    'file-wide, which could never pass because the pre-cycle file already used the word at ' +
    'line 770.',
  why:
    'A gate that fails for its own defects is worse than no gate: it would have sent a ' +
    'correct item back to todo with attempts+1, and the next attempt would have been asked ' +
    'to fix work that was never broken. The distinction that matters, and the reason each ' +
    'fix is journaled with its mechanism: correcting an instrument that measures the WRONG ' +
    'THING is not the same act as weakening a gate to let work through (step 6.5). The bar ' +
    'never moved -- src/ untouched, suite green, both surfaces killed in two arms. What ' +
    'changed is that the instrument now measures those things instead of measuring whether ' +
    'CONTRACTS.md happened to be present in a temp directory. Same family as cycle 81s ' +
    "renderer-assertion find, and the same remedy: assert the measurement happened, don't " +
    'infer it from the absence of an error.',
});
s.decisions.push({
  cycle: 82,
  what:
    "the conductor's first-choice BLOCK mutation (disable the allDark rescue outright) was " +
    'REPLACED, and the replacement was derived by measuring the pre-cycle suite rather than ' +
    "by reading the builder's report. Both are kept in the gate output.",
  why:
    'The gross mutation is already killed by three pre-existing renderBlock contiguity ' +
    'tests, so it can prove failability but never ATTRIBUTION -- a mutant the old suite ' +
    'already kills says nothing about the new pin. Rather than accept a one-armed block ' +
    "case, or adopt the builder's mutation (step 6.1 forbids taking the check from the " +
    "builder's notes -- an agent that supplies the check has, in effect, coded to it), the " +
    'conductor measured which k values the pre-cycle block tests actually exercise: the ' +
    '0.00160-0.00195 sweep, k=0.014, k=0.02447. Gating the rescue at k at or above 0.0015 ' +
    'therefore moves the BLOCK low-k threshold in a region the old suite never looks at and ' +
    'the new pin does. It survives the old suite (exit 0) and dies on the new one, killed ' +
    'by exactly one named new test. Mechanistically different from the builder’s cover-cut ' +
    'at 0.008, which is what makes it independent evidence.',
});
s.decisions.push({
  cycle: 82,
  what:
    'gear held at 2 although this cycle’s runs/allocator.json came back ok:false, ' +
    'source:"none" -- the all-zero fallback was NOT read as a cool weekly.',
  why:
    'The pacer refreshed the allocator 6 s before this cycle opened and the refresh FAILED, ' +
    'so the file now carries the hardcoded fallback (posture trickle, all percentages 0, ' +
    'allow_premium_pct 10 -- higher than the real posture it replaced, which is the tell ' +
    'that it is a sentinel and not a measurement). Read literally, weekly_used 0 pct would ' +
    'compute a cold weekly_heat, disengage the governor and promote the gear. That would be ' +
    'reading an error sentinel as data. The last REAL reading is 23 min old (cycle 81: ' +
    'weekly_used 18.0 pct at week_elapsed 11.49 pct, heat 1.5666) and it is the third of ' +
    'three monotonically increasing readings, all far above the 1.3 ceiling trigger. Weekly ' +
    'usage cannot fall except at the week reset, and a failed probe is not evidence of a ' +
    'reset. Stale-but-real beats fresh-but-absent: ceiling 2 stands, promote stays blocked.',
});
atomic(sp, s, 1);

// --- runfile ---------------------------------------------------------------
const rp = '/opt/swarm/runs/current.json';
const r = JSON.parse(readFileSync(rp, 'utf8'));
const now = Math.floor(Date.now() / 1000);
r.heartbeat = { ...r.heartbeat, ts: now, pid: 2020831 };
r.budget.last_probe_ts = now;
r.budget.gear_evidence =
  'cycle 82: the REAL probe was NOT due (last_real_probe_ts 590 s old at cycle open, inside ' +
  'the 1800 s window), so bin/swarm-budget.sh was correctly not invoked and probe_failures ' +
  'stays 12 -- this cycle adds no new KI-2 datapoint and does not restamp last_real_probe_ts. ' +
  'Gear HELD at 2. runs/allocator.json was refreshed by the pacer 6 s before cycle open and ' +
  'came back ok:false source:"none" -- the hardcoded fallback (posture trickle, every ' +
  'percentage 0, allow_premium_pct 10, which is HIGHER than the real posture it replaced: the ' +
  'tell that it is a sentinel, not a measurement). Read literally it would compute a cold ' +
  'weekly and promote the gear; that is reading an error sentinel as data. Governing evidence ' +
  'is therefore the last REAL reading, 23 min old and explicitly labelled stale: cycle 81 ' +
  'weekly_used 18.0 pct at week_elapsed 11.49 pct, weekly_heat 1.5666, the third of three ' +
  'monotonically increasing readings and far over the 1.3 trigger. Weekly usage cannot fall ' +
  'except at a week reset and a failed probe is not evidence of one. Ceiling 2, promote ' +
  'BLOCKED, window rho still UNMEASURED so the evidence rule lands cruise 3 and the governor ' +
  'clamps to 2. Applied gear 2, unchanged; hysteresis did not bind.';
r.budget.weekly.source =
  'STALE-BUT-REAL: carried forward from cycle 81 (runs/allocator.json ok=true source=probe, ' +
  'mtime 00:17:47Z). This cycle’s allocator refresh returned ok=false source=none and its ' +
  'all-zero fallback was deliberately NOT merged. Heat + ceiling computed by hand because ' +
  'bin/swarm-budget.sh is denied (KI-2).';
atomic(rp, r, 2);
writeFileSync('/opt/swarm/runs/current.json.bak', JSON.stringify(r, null, 2));

console.log('backlog:', JSON.stringify(counts));
console.log('state: cycle', s.cycle, 'phase', s.phase, 'decisions', s.decisions.length,
  'wave_streak', s.counters.wave_streak);
console.log('runfile heartbeat:', JSON.stringify(r.heartbeat));
console.log('MIRROR:' + JSON.stringify(r));
