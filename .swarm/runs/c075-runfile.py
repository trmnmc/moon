#!/usr/bin/env python3
"""Conductor, cycle 75: merge the hand-computed gear into the runfile + .bak."""
import json, os, shutil

RF = '/opt/swarm/runs/current.json'
NOW = 1786998490
r = json.load(open(RF))

b = r['budget']
b['source'] = 'clock+allocator'
b['gear'] = 2
b['gear_target'] = 2
b['ratio'] = 0.0
b['mode'] = 'thermostat'
b['k_cap'] = 2
b['promote'] = False
b['demote'] = True
b['last_probe_ts'] = NOW
b['last_real_probe_ts'] = NOW      # a REAL attempt was made this cycle and was refused
b['probe_failures'] = 7
b['gear_evidence'] = (
    "cycle 75: the real probe was DUE (last_real_probe_ts 2380s old, past the 1800s window) so "
    "an attempt WAS made -- bin/swarm-budget.sh is denied by the KI-2 allowlist gap, and so is "
    "its PROBE_CMD=false clock-only mode (same script). Attempt made and refused, so "
    "probe_failures 6 -> 7 AND last_real_probe_ts is stamped. Gear computed by hand from "
    "runs/allocator.json (ok=true, source=probe, pacer-refreshed) applying bin/swarm-budget.sh "
    "lines 125-140 literally: weekly_used 13.0 pct at week_elapsed 8.973 pct -> weekly_heat "
    "1.449; opus_used 6 pct -> opus_heat 0.669. weekly_heat > 1.3 -> ceiling 2, promote BLOCKED. "
    "Window rho remains UNMEASURED (needs the denied ccusage probe), so the evidence rule lands "
    "the target at cruise 3 and the governor ceiling clamps to 2; applied gear 2, unchanged from "
    "cycle 74, so hysteresis did not bind. Heat still climbing: 1.224 (c73) -> 1.39 (c74) -> "
    "1.449 (c75) against a week 9 pct elapsed. The gear cap of 2 -- not k_current (3) -- is what "
    "sized this wave."
)
b['weekly'] = {
    'ok': True,
    'weekly_used_pct': 13.0,
    'opus_used_pct': 6,
    'week_elapsed_pct': 8.973,
    'weekly_heat': 1.449,
    'opus_heat': 0.669,
    'ceiling': 2,
    'promote_blocked': True,
    'source': ('runs/allocator.json ok=true source=probe (pacer-refreshed); heat + ceiling '
               'computed by hand from its fields because bin/swarm-budget.sh is denied (KI-2)'),
}

json.dump(r, open(RF + '.tmp', 'w'), indent=2)
os.replace(RF + '.tmp', RF)
shutil.copyfile(RF, RF + '.bak')
print('runfile: gear', b['gear'], 'weekly_heat', b['weekly']['weekly_heat'],
      'probe_failures', b['probe_failures'], 'cycles_since_recycle', r['cycles_since_recycle'])
