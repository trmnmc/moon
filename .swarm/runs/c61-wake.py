#!/usr/bin/env python3
"""cycle 61 step 9: write the ACTUAL scheduled wakeup into the heartbeat.

On the VPS bin/swarm-pacer.sh, not ScheduleWakeup, is the firing mechanism: it reads
heartbeat.next_wakeup_at every 5 min and spawns a cycle once due. The conductor writes
the field identically either way.

Delay: base 90 s (this was a verified-value cycle, so neither the no-value stretch nor
limp's 3600 s applies). Clamp check: wakeup + 900 <= stop_at.
"""
import json, os

NOW = 1786904122
WAKE = NOW + 90
STOP = 1786942799
assert WAKE + 900 <= STOP, "hard rule 8: wakeup would fall inside the stop guard"

P = "/opt/swarm/runs/current.json"
r = json.load(open(P))
r["heartbeat"]["ts"] = NOW
r["heartbeat"]["next_wakeup_at"] = WAKE
tmp = P + ".tmp"
with open(tmp, "w") as f:
    json.dump(r, f, indent=1)
    f.write("\n")
os.replace(tmp, P)
with open("/opt/swarm/runs/current.json.bak", "w") as f:
    json.dump(r, f, indent=1)
    f.write("\n")
print("next_wakeup_at", WAKE, "(+%d s)" % (WAKE - NOW), "| stop_at", STOP,
      "| margin", STOP - WAKE, "s")
