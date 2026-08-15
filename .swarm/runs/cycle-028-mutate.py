"""Cycle-28 gate: mutation proof for T-124's new assertions.

Each mutation is applied to a saved copy, the suite is run, and the file is
restored and checked byte-identical. A mutation that does NOT turn the suite
red means the assertion it targets is vacuous.
"""
import hashlib
import subprocess
import sys

TARGET = "/opt/targets/moon"
TEST = TARGET + "/test/astro.test.js"
SRC = TARGET + "/src/astro.js"

MUTATIONS = [
    ("M1 test-const: new->full MIN 13.906 -> 13.916", TEST,
     "const DOCUMENTED_MIN_NEWFULL_DAYS = 13.906;",
     "const DOCUMENTED_MIN_NEWFULL_DAYS = 13.916;"),
    ("M2 test-const: new->full MAX 15.613 -> 15.603", TEST,
     "const DOCUMENTED_MAX_NEWFULL_DAYS = 15.613;",
     "const DOCUMENTED_MAX_NEWFULL_DAYS = 15.603;"),
    ("M3 test-const: new->full MEAN 14.765 -> 14.760", TEST,
     "const DOCUMENTED_MEAN_NEWFULL_DAYS = 14.765;",
     "const DOCUMENTED_MEAN_NEWFULL_DAYS = 14.760;"),
    ("M4 test-const: interval COUNT 865 -> 864", TEST,
     "assert.equal(newFullIntervals.length, 865,",
     "assert.equal(newFullIntervals.length, 864,"),
    ("M5 SOURCE drift: nextFullMoon targets k+0.5 -> k+0.5001", SRC,
     "let fullMs = toMs(truePhaseJD(k + 0.5));",
     "let fullMs = toMs(truePhaseJD(k + 0.5001));"),
]

NEWFULL_ASSERTS = ("new->full min", "new->full max", "new->full mean",
                   "new-moon instants")


def digest(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def run_suite():
    proc = subprocess.run(
        ["node", "--test", TARGET + "/test/astro.test.js"],
        capture_output=True, text=True, cwd=TARGET,
    )
    return proc.returncode, proc.stdout + proc.stderr


ok = True
for label, path, old, new in MUTATIONS:
    with open(path, "rb") as fh:
        original = fh.read()
    before = digest(path)
    text = original.decode()
    if text.count(old) != 1:
        print("SKIP  %s -- anchor not found exactly once (%d)" % (label, text.count(old)))
        ok = False
        continue
    with open(path, "w") as fh:
        fh.write(text.replace(old, new))
    try:
        code, out = run_suite()
    finally:
        with open(path, "wb") as fh:
            fh.write(original)
    restored = digest(path)
    hit = [m for m in NEWFULL_ASSERTS if m in out]
    verdict = "RED (assertion is live)" if code != 0 else "GREEN -- VACUOUS, GATE FAILS"
    if code == 0:
        ok = False
    print("%-52s -> exit %d  %s" % (label, code, verdict))
    print("      new->full assertion text in failure output: %s"
          % (", ".join(hit) if hit else "NONE"))
    print("      restore byte-identical: %s" % (before == restored))

code, out = run_suite()
print("\nfinal unmutated suite: exit %d" % code)
for line in out.splitlines():
    if line.startswith(("# tests", "# pass", "# fail")) or line.strip().startswith("ℹ"):
        print("  " + line.strip())
sys.exit(0 if ok and code == 0 else 1)
