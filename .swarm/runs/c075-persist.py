#!/usr/bin/env python3
"""Conductor, cycle 75: apply the verification gate's verdicts to backlog.json + state.json."""
import json, os

TGT = '/opt/targets/moon/.swarm'

# ---------------------------------------------------------------- backlog
bp = f'{TGT}/backlog.json'
b = json.load(open(bp))
by = {i['id']: i for i in b['items']}

# T-172 — PASSED the gate.
t172 = by['T-172']
t172['status'] = 'done'
t172['verified_cycle'] = 75
t172['model'] = 'sonnet'

# T-167 — FAILED the gate on its own acceptance clause. attempts+1, escalate a rung.
t167 = by['T-167']
t167['status'] = 'todo'
t167['attempts'] = 1
t167['model'] = 'opus'          # escalation ladder: sonnet -> opus
t167['priority'] = 2
t167['notes'] += (
    "\n\nCYCLE 75 ATTEMPT 1 — PARTIAL, GATE FAILED, work KEPT in tree (suite green 159/159, "
    "no revert). The attempt fixed the CELL-SELECTION half of the bug: the guard now finds the "
    "limb by cover over the raw cells instead of by first/last non-blank glyph, so a true edge "
    "cell with presence<0.5 is no longer skipped. Measured effect: broken-arc renders fall "
    "1240 -> 84 of 40000 (20000 cycle steps x 2 hemispheres); silhouette bounding box never "
    "grows (0 of 40000); renderLine byte-identical everywhere; all divergence from HEAD confined "
    "to k <= 0.051111. The new test is genuinely attributable (conductor ARM A': it fails ALONE "
    "under HEAD render.js with HEAD's fixture).\n"
    "WHAT IS STILL OPEN — the THRESHOLD half. 84 renders in the band k = 0.001642..0.001906 "
    "still show a fully dark row 1 (and row 3) between lit rows. Root cause, from the module's "
    "OWN numbers at k=0.0016415 waxing (runs/cycle-075-verify-T-167-instrument.txt): the "
    "sunward-most on-disc cell measures cover 0.02500 in rows 0/4 and 0.02439 in row 2 -- just "
    "over the hard-coded `cover > 0.02` in firstLit/lastLit -- but 0.01739 in rows 1/3, just "
    "under it. So the arc breaks on a fixed cut applied to a row-dependent quantity. Deeper: "
    "cover is sampled at SUB=16 per axis, so near k~0.002 the lit sliver is thinner than one "
    "sub-sample and these numbers are quantization artifacts -- an independent 400x20 sampler "
    "ranks the rows the OTHER way (rows 1/3 = 0.128 cover, rows 0/4 = 0.095, row 2 = 0.059). "
    "Any fix that keeps a fixed absolute threshold on SUB=16 cover will break contiguity "
    "somewhere; attempt 2 should make the guard's eligibility RELATIVE (per-row, e.g. the "
    "sunward-most on-disc cell with any lit sub-sample) or raise sampling resolution where the "
    "crescent is thin. Classified HOLE, not BOUNDARY (L-033): a continuous crescent has no "
    "honest reading in which row 1 is dark while rows 0 and 2 are lit.\n"
    "Attempt 2 must ALSO extend the new test beyond its single pinned k=0.014 -- as written it "
    "cannot see this band at all. Evidence: runs/cycle-075-verify-T-167.txt (sections A-D), "
    "-residual.txt (classification), -instrument.txt (the module's own cell numbers), "
    "-arms.txt (attribution)."
)

json.dump(b, open(bp + '.tmp', 'w'), indent=2)
os.replace(bp + '.tmp', bp)

todo = [i['id'] for i in b['items'] if i['status'] == 'todo']
print('backlog: T-172 done, T-167 todo attempts=1 model=opus')
print('todo now:', ', '.join(todo))

# ---------------------------------------------------------------- state
sp = f'{TGT}/state.json'
s = json.load(open(sp))
s['cycle'] = 75
s['phase'] = 'BUILD'
s['counters']['consecutive_no_value'] = 0      # T-172 verified this cycle
s['counters']['consecutive_failures'] = 0
s['counters']['wave_streak'] = 0               # 1 failed verify, 0 reverts -> third branch
# k_current unchanged at 3 (autotune third branch); gear cap of 2 binds anyway.
s['qa']['last_build_wave_cycle'] = 75
s['last_cycle'] = {
    'cycle': 75,
    'work': 'build-wave k=2 (T-167, T-172)',
    'outcome': '1 verified, 1 gate-failed (kept, not reverted), 0 reverted',
}
s['decisions'].append({
    'cycle': 75,
    'kind': 'verification',
    'title': "T-167's residual broken-arc band is a HOLE, not a BOUNDARY",
    'detail': (
        "The cycle-75 attempt cut broken-arc renders 1240 -> 84/40000 but did not close the "
        "acceptance property. The survivors sit in k = 0.001642..0.001906, where the guard's "
        "fixed `cover > 0.02` cut lands between rows: 0.02500/0.02439 in rows 0/2/4 vs 0.01739 "
        "in rows 1/3. Classified HOLE because a continuous crescent admits no honest reading in "
        "which row 1 is dark between two lit rows -- the observable is discriminable, so this is "
        "the check being wrong, not the check being correct. Recorded per the SPEC's "
        "HOLE-vs-BOUNDARY must-have (L-033) BEFORE any further hardening. Secondary finding, "
        "recorded because it constrains attempt 2: at these illuminations sampleCell's SUB=16 "
        "grid is coarser than the lit sliver, so its cover values are quantization artifacts -- "
        "a 400x20 sampler ranks the rows in the opposite order. A fixed absolute threshold on "
        "that quantity cannot be made contiguity-safe by retuning the constant."
    ),
})
json.dump(s, open(sp + '.tmp', 'w'), indent=2)
os.replace(sp + '.tmp', sp)
print('state: cycle 75, decisions ->', len(s['decisions']))
