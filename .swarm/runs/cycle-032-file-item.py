#!/usr/bin/env python3
"""cycle 32 -- file T-129 into the backlog (atomic write)."""
import json
import os

P = "/opt/targets/moon/.swarm/backlog.json"
d = json.load(open(P))

item = {
    "id": "T-129",
    "kind": "fix",
    "status": "todo",
    "priority": 1,
    "effort": "S",
    "model": "sonnet",
    "attempts": 0,
    "title": ("ch.49 correction tables are an unprotected surface: 5 of 7 "
              "transcription mutants survive the full suite"),
    "why": (
        "REPORT.md:35 carries the VERIFIED row 'Correction tables are correctly "
        "transcribed -- independent audit reproduced Meeus worked examples 49.a and "
        "49.b to 0.23s and 0.34s'. That audit happened once, by hand, at v0.1.0; grep "
        "over test/ for 49.a / 49.b / 0.23 / 0.34 / 'worked example' returns ZERO hits, "
        "so nothing re-runs it. src/astro.js carries ~65 hand-transcribed coefficients "
        "(25 new/full + 25 quarter + 6 W + 14 A-table). Conductor measurement "
        "(.swarm/runs/cycle-032-ch49-mutants.py) shows 5 of 7 plausible transcription "
        "errors -- dropped digits, transposed digits, sign flips -- pass all 119 tests "
        "while shifting user-visible instants by up to 72.5s for full moons and 46.7s "
        "for quarter instants (.swarm/runs/cycle-032-quarter-reach.py). The only test "
        "that catches anything is the statistical lunation-length assertion, and only "
        "for large perturbations."
    ),
    "acceptance": (
        "A single-digit or sign error in ANY ch.49 coefficient -- the new/full 25-term "
        "table, the quarter 25-term table, the W term, or A1-A14 -- turns the suite RED. "
        "The existing published anchors prove the tables are RIGHT to about an hour; what "
        "is missing is that they cannot silently CHANGE. Behavior of src/ must not change; "
        "this is test-only work."
    ),
    "files_hint": ["test/astro.test.js"],
    "packages": [],
    "deps": [],
    "notes": (
        "Conductor has authored a mutation battery that will be used at the gate and is "
        "deliberately NOT shown to the builder. Design note the builder may use: "
        "truePhaseJD is NOT exported (module.exports at src/astro.js:363 is computeMoon, "
        "nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN) -- do NOT add "
        "an export, work through the public surface. Quarter instants are reachable only "
        "via computeMoon's isInstantPhase/phaseName plateau. The standing docs frame rule "
        "(cycles 2 and 4) applies to any figure added to a comment."
    ),
}

if any(i["id"] == "T-129" for i in d["items"]):
    print("T-129 already present -- no change")
else:
    d["items"].append(item)
    with open(P + ".tmp", "w") as f:
        json.dump(d, f, indent=1)
    os.replace(P + ".tmp", P)
    print(f"backlog now {len(d['items'])} items; T-129 filed")
