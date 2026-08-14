# Failability proof for the cycle-21 T-117 gate. A gate that cannot go red proves
# nothing, so each mutant below is a plausible WRONG ci.yml the gate must kill.
# The last mutant is a CONTROL: a harmless cosmetic edit that MUST stay green, so the
# gate is shown to be discriminating rather than merely trigger-happy.
import subprocess
import sys

WF = "/opt/targets/moon/.github/workflows/ci.yml"
GATE = "/opt/targets/moon/.swarm/runs/cycle-021-verify-T-117.py"
ORIG = open(WF).read()

BASE = """name: CI
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
"""
assert BASE == ORIG, "base text drifted from the merged file; refusing to run"

MUTANTS = [
    # (name, expected gate colour, old, new)
    ("npm ci install step", "red",
     "      - run: npm test", "      - run: npm ci\n      - run: npm test"),
    ("matrix below engines floor", "red",
     "node-version: [20, 22]", "node-version: [18, 20]"),
    ("matrix skips the >=20 floor", "red",
     "node-version: [20, 22]", "node-version: [22, 24]"),
    ("pull_request trigger removed", "red",
     "  push:\n  pull_request:\n", "  push:\n"),
    ("unpinned action", "red",
     "actions/checkout@v4", "actions/checkout"),
    ("runs a script the repo lacks", "red",
     "      - run: npm test", "      - run: npm run lint"),
    ("setup-node cache without a lockfile", "red",
     "          node-version: ${{ matrix.node-version }}",
     "          node-version: ${{ matrix.node-version }}\n          cache: npm"),
    ("CONTROL: workflow renamed", "green",
     "name: CI", "name: Tests"),
]

killed = survived = 0
try:
    for name, expect, old, new in MUTANTS:
        assert old in BASE, "mutant %r does not apply" % name
        open(WF, "w").write(BASE.replace(old, new, 1))
        rc = subprocess.run([sys.executable, GATE], capture_output=True).returncode
        got = "green" if rc == 0 else "red"
        if got == expect:
            print("OK   mutant %-36s gate went %s as required" % (name, got))
            killed += 1
        else:
            print("MISS mutant %-36s gate went %s, expected %s" % (name, got, expect))
            survived += 1
finally:
    open(WF, "w").write(ORIG)

print("\nkilled=%d survived=%d" % (killed, survived))
sys.exit(1 if survived else 0)
