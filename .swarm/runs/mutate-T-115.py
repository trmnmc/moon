#!/usr/bin/env python3
"""Falsifiability harness for the T-115 gate.

A gate that cannot fail proves nothing. Each mutant re-introduces exactly the defect
T-115 was filed to remove (or a plausible wrong fix); the gate must go RED on every one.
Original file is restored in a finally block.
"""
import shutil
import subprocess
import sys

REPORT = "/opt/targets/moon/REPORT.md"
BACKUP = "/opt/targets/moon/.swarm/runs/.REPORT.md.mutbak"
GATE = "/opt/targets/moon/.swarm/runs/verify-gate-T-115.py"

GOOD = """The run's review-fix pass has not been run in any cycle; review-fix is the most
premium-heavy work type in the pipeline, and the allocator premium allowance has
remained zero throughout. Nothing above should be read as claiming that coverage."""

MUTANTS = {
    "M1 revert to the original narrow 'this cycle' claim":
        "The run's review-fix pass has not been run this cycle; nothing above should be\n"
        "read as claiming that coverage.",

    "M2 run-wide but drops the WHY":
        "The run's review-fix pass has not been run in any cycle. Nothing above should be\n"
        "read as claiming that coverage.",

    "M3 softened: hedges that the pass is still coming":
        "The run's review-fix pass has not been run in any cycle; it is scheduled for a\n"
        "later cycle. Nothing above should be read as claiming that coverage.",

    "M4 refusal clause deleted (disclosure gutted)":
        "The run's review-fix pass has not been run in any cycle; review-fix is the most\n"
        "premium-heavy work type in the pipeline, and the allocator premium allowance has\n"
        "remained zero throughout.",

    "M5 correct words but un-wrapped (the formatting defect this cycle caught)":
        "The run's review-fix pass has not been run in any cycle; review-fix is the most "
        "premium-heavy work type in the pipeline, and the allocator premium allowance has "
        "remained zero throughout. Nothing above should be read as claiming that coverage.",

    "M6 word smuggled in during re-wrap (breaks word-preservation)":
        "The run's review-fix pass has not been run in nearly any cycle; review-fix is the\n"
        "most premium-heavy work type in the pipeline, and the allocator premium allowance\n"
        "has remained zero throughout. Nothing above should be read as claiming that\n"
        "coverage.",
}

shutil.copyfile(REPORT, BACKUP)
original = open(REPORT, encoding="utf-8").read()
assert GOOD in original, "harness is stale: current paragraph not found verbatim"

killed, survived = [], []
try:
    for name, text in MUTANTS.items():
        open(REPORT, "w", encoding="utf-8").write(original.replace(GOOD, text))
        r = subprocess.run([sys.executable, GATE], capture_output=True, text=True)
        line = [l for l in r.stdout.splitlines() if l.startswith("GATE:")]
        verdict = line[0] if line else "gate crashed"
        fails = [l for l in r.stdout.splitlines() if l.startswith("[FAIL]")]
        if r.returncode != 0:
            killed.append((name, verdict, fails))
        else:
            survived.append((name, verdict, fails))
finally:
    shutil.copyfile(BACKUP, REPORT)

print("=" * 78)
print("T-115 GATE FALSIFIABILITY (mutation test)")
print("=" * 78)
for name, verdict, fails in killed:
    print("KILLED   %s" % name)
    print("         %s  via: %s" % (verdict, "; ".join(f[7:].split("\n")[0] for f in fails)))
for name, verdict, fails in survived:
    print("SURVIVED %s  <-- GATE IS BLIND HERE" % name)
    print("         %s" % verdict)
print("-" * 78)
print("%d/%d mutants killed" % (len(killed), len(MUTANTS)))

# restore sanity: the real file must be byte-identical to what we started with
restored = open(REPORT, encoding="utf-8").read()
print("original restored byte-identical: %s" % (restored == original))
sys.exit(0 if len(killed) == len(MUTANTS) and restored == original else 1)
