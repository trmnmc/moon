import json, shutil
from collections import Counter

p = '.swarm/backlog.json'
d = json.load(open(p))
for i in d['items']:
    if i['id'] == 'T-134':
        i['status'] = 'done'
        i['closed_cycle'] = 38
        i['notes'] += (
            "\nCYCLE-38 GATE: PASS on attempt 2. The band clause is now a SEARCH over the row's "
            "display band (accept iff some candidate renders both the exact percent and the exact "
            "north disc), never a centre sample. Conductor-verified independently: 15/15 rows parsed "
            "and exercised; the PCT_SCALE=100 citation to src/render.js:235 is exact; the +/-1pp sweep "
            "bound widens nothing because candidates are filtered by rendered percent, so the effective "
            "searched set IS the true display band; the two cycle-37 interior margins (0.176pp / 0.235pp) "
            "reproduced to the digit by an independent full-domain sweep with a different README parser; "
            "a 9-case mutation battery on a repo COPY came out all-as-expected with per-test attribution "
            "and the control green first and last -- including M5 the coherent fake (RED, and only the "
            "band search catches it, confirming cycle 37's load-bearing claim) and M6 the cycle-37 false "
            "positive (GREEN, a correct README is no longer rejected); 134/134 green pre- and post-merge. "
            "Evidence: .swarm/runs/cycle-038-verify-T-134.txt. RESIDUAL filed as T-135.")

d['items'].append({
    "id": "T-135", "kind": "fix", "status": "todo", "priority": 6, "effort": "S",
    "model": "haiku", "attempts": 0, "opened_cycle": 38,
    "title": "A sweep-table phase-name retype that preserves PHASE_NAMES cycle order still survives the suite (51% 'first quarter' -> 'waxing gibbous')",
    "why": "MEASURED at the cycle-38 gate, not asserted (.swarm/runs/cycle-038-verify-T-134.txt, mutant M1b): T-134 closed the sweep table against wrong discs, broken mirrors and out-of-order names, but its name check is an ORDER check, so swapping a name for an adjacent one that keeps the order valid is still green. T-134's title claims a hand-edit of any rendered block turns the suite red; this hand-edit does not. Same defect family as the RETRO.md v0.1.0 incident, one notch subtler.",
    "acceptance": "test/regressions.test.js additionally asserts that every sweep-table row's (phase name, displayed percent) pair is one the SHIPPING product can actually emit, established by sweeping real instants through computeMoon and collecting the reachable pairs. Mutating any row's name to an adjacent order-preserving name must turn the suite red; the current honest table must stay green. The sweep MUST start from a fixed hardcoded instant, never Date.now(), so the test is deterministic. No new numeric constant expressing a phase boundary may be introduced -- the reachable set is asked of the product, not tabulated by hand. README.md and src/ must not change.",
    "files_hint": ["test/regressions.test.js"],
    "packages": [], "deps": [],
    "notes": "PRICED BY MEASUREMENT before filing (.swarm/runs/c38-probe-namepct.js), per the standing cycle-29/32 practice. A 4-lunation 1-minute sweep from 2026-01-01 gives reachable percent ranges: waxing gibbous 56..100, first quarter 44..56, waning gibbous 55..100, last quarter 45..55, waxing crescent 0..45, waning crescent 0..45, full 100..100, new 0..0. ALL 15 current README rows are reachable, so the honest table stays green -- no false positive, which is the exact trap that failed T-134 attempt 1. The M1b mutant (51% waxing gibbous) is UNREACHABLE, as are 32% waxing gibbous and 63% waning crescent, so the check has real teeth. IMPLEMENTATION CAVEAT: the probe's 1-minute/120-day sweep is ~173k computeMoon calls; the suite currently runs ~2s total, so the test needs a coarser step or a shorter span -- and whoever builds it MUST show the coarser sweep still reaches all 15 rows, otherwise it false-positives. NOTE the boundary overlap (first quarter 44..56 and waxing gibbous 56..100 both contain 56): the check must be set membership, not a range test; a range-based implementation would be wrong."})

json.dump(d, open(p + '.tmp', 'w'), indent=1)
shutil.move(p + '.tmp', p)
print('backlog:', Counter(i['status'] for i in d['items']), 'total', len(d['items']))

sp = '.swarm/state.json'
s = json.load(open(sp))
s['cycle'] = 38
c = s.setdefault('counters', {})
c['consecutive_no_value'] = 0
c['consecutive_failures'] = 0
c['wave_streak'] = c.get('wave_streak', 0) + 1
print('k_current', c.get('k_current'), 'wave_streak', c['wave_streak'])
s.setdefault('decisions', []).append({
    "cycle": 38,
    "what": "the gear-1 ceiling (\"S-effort sonnet builds only\") BINDS a ladder escalation: T-134 retried at sonnet, not the opus rung its attempts=1 earned",
    "why": "cycle 2 ruled that a ladder escalation earned by a failed gate outranks the gear-1 DEMOTION rule, and that still holds -- T-134 was never pushed down to haiku. But escalation-vs-demotion and escalation-vs-the-gear-ceiling are different collisions. Demotion is a per-item rung adjustment; the gear-1 work-choice rule is a CEILING on what tier a gear-1 cycle may dispatch at all, and under allocator trickle posture (allow_premium_pct 0, opus_used_pct 96) opus is above it. An escalation may refuse a demotion without being licensed to climb past the ceiling of the gear it is dispatched in. The compensating measure, since the ladder's purpose is 'do not hand the same tier the same task twice': the retry brief carried the full cycle-37 diagnosis, so attempt 2 was a materially different task -- one failing clause named, with the repair stated and the three measurements behind it. That held: attempt 2 passed at the same tier that failed attempt 1."
})
json.dump(s, open(sp + '.tmp', 'w'), indent=1)
shutil.move(sp + '.tmp', sp)
print('state cycle', s['cycle'], 'phase', s['phase'])
