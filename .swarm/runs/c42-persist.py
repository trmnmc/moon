#!/usr/bin/env python3
"""Cycle 42 persist: backlog + state.json updates."""
import json, os

CYCLE = 42
os.chdir('/opt/targets/moon')

VERIFIED = (
    'CONDUCTOR-GATED cycle 42. 135/135 green post-merge (conductor-run, not the builder claim). '
    'Product tree byte-identical to pre-merge HEAD fe113bf across src/, bin/, README.md, package.json. '
    'GENERALITY: honest rows regenerated from the shipping renderer for ALL EIGHT PHASE_NAMES entries at '
    'conductor-scanned instants (NOT the two the acceptance named), inserted at every cycle-order-valid slot '
    '- 30 cases, 0 red under the new predicate. DISCRIMINATOR: the same 30 cases re-run against the pre-merge '
    'substring predicate; exactly 2 flip (last quarter at slots 12 and 13, old=RED new=GREEN, at '
    '2026-01-10T06:00:00Z / 54%), which is the reported defect independently reproduced at a conductor-chosen '
    'instant and closed. NON-WEAKENING: 36 adjacent-retype mutants, 33 killed; the 3 survivors were re-run '
    'against the PRE-MERGE file and escaped there identically, then proven genuinely REACHABLE by a 28.5-year '
    '15-min renderer scan (100% waxing gibbous, 100% waning gibbous and 0% waning crescent all really print), '
    'so accepting them is correct behavior rather than a hole T-138 opened. '
    'Evidence: .swarm/runs/cycle-042-verify-T-138.txt, .swarm/runs/cycle-042-escape-T-138.txt.')

T139_WHY = (
    "The cycle-42 gate ran 36 adjacent-retype mutants against the T-134 sweep-table check and three stayed "
    "green: 100% 'full' retyped to 'waxing gibbous' or to 'waning gibbous', and 0% 'new' retyped to 'waning "
    "crescent'. Those are NOT escapes. A 28.5-year 15-minute renderer scan finds all three rows genuinely "
    "printed by the shipping renderer (2020-01-10T04:30Z prints the 100% waxing gibbous row; 2020-01-11T07:30Z "
    "prints its waning twin; 2020-01-24T05:00Z prints the 0% waning crescent row), so a correct check MUST "
    "accept them - at the symmetric endpoints the disc and the percent are identical across adjacent names and "
    "the name is simply not recoverable from the rendered row. The hazard is concrete and is the SAME FAMILY as "
    "T-136 and T-138: an editor who mutation-tests this check, sees three survivors, and 'hardens' it into "
    "rejecting them will have built a third check that false-rejects honest renderer output.")

T139_ACC = (
    "A comment at the T-134 check names the endpoint indiscriminability, states that adjacent-retype mutants at "
    "0% and 100% are EXPECTED to survive because those rows are reachable, and cites one reachability instant per "
    "case so the claim is checkable rather than asserted. No test behavior changes; no product file changes; the "
    "three cited instants must be re-verified against the renderer, not copied from this item.")

T139_NOTES = (
    "Found by the conductor's own cycle-42 gate, not by the builder and not by the item. The mutant generator was "
    "naive by construction - it treated every adjacent retype as a lie - and the three survivors are what that "
    "naivety looks like from the inside. Filed at LOW priority deliberately: the check is CORRECT as it stands, so "
    "this documents a boundary rather than fixing a defect, and the run's taste note warns the risk here is churn. "
    "Worth one comment, not a test.")

p = '.swarm/backlog.json'
d = json.load(open(p))
for it in d['items']:
    if it['id'] == 'T-138':
        it['status'] = 'done'
        it['closed_cycle'] = CYCLE
        it['model_used'] = 'sonnet'
        it['verified'] = VERIFIED

d['items'].append({
    "id": "T-139", "kind": "docs", "status": "todo", "priority": 12, "effort": "S",
    "model": "haiku", "attempts": 0, "opened_cycle": CYCLE,
    "title": ("Nothing records that the sweep table cannot discriminate a phase NAME at the 0% and 100% endpoints, "
              "so the next person to mutation-test it will read three correct passes as three holes"),
    "why": T139_WHY, "acceptance": T139_ACC,
    "files_hint": ["test/regressions.test.js"], "packages": [], "deps": [], "notes": T139_NOTES,
})
json.dump(d, open(p + '.tmp', 'w'), indent=1)
os.replace(p + '.tmp', p)

p = '.swarm/state.json'
s = json.load(open(p))
s['cycle'] = CYCLE
c = s['counters']
c['consecutive_no_value'] = 0
c['consecutive_failures'] = 0
c['wave_streak'] = 0
c['k_current'] = min(5, c['k_current'] + 1)
s['qa']['last_build_wave_cycle'] = CYCLE
json.dump(s, open(p + '.tmp', 'w'), indent=1)
os.replace(p + '.tmp', p)

todo = sum(1 for i in d['items'] if i['status'] == 'todo')
done = sum(1 for i in d['items'] if i['status'] == 'done')
print('backlog todo=%d done=%d total=%d | k_current=%d wave_streak=%d'
      % (todo, done, len(d['items']), c['k_current'], c['wave_streak']))
