#!/usr/bin/env python3
"""cycle-30 verification gate for T-127 — conductor-authored, written AT gate time.

The claim under test: the two new tests in test/cli.test.js pin the --json field
contract by PARSING the documents, so any drift between the payload and either
document fails the gate.

Six mutants, mine, not the builder's. M6 is the discriminator that matters: it
renames a key in the payload AND in HELP while leaving README stale. A test that
merely compares the payload against itself passes M6; a test that genuinely reads
each document fails it on the README sources ONLY. Exit codes are captured from the
process object directly (L-010: never through a pipe).
"""
import subprocess, sys, os

REPO = "/opt/targets/moon"
BIN = os.path.join(REPO, "bin/moon.js")
README = os.path.join(REPO, "README.md")


def read(p):
    with open(p, "rb") as f:
        return f.read()


def write(p, b):
    with open(p, "wb") as f:
        f.write(b)


def suite():
    """Run the real suite. Returns (exit_code, combined_output)."""
    r = subprocess.run(
        ["node", "--test", "test/cli.test.js", "test/args.test.js", "test/astro.test.js",
         "test/hemisphere.test.js", "test/manifest.test.js", "test/regressions.test.js",
         "test/render.test.js"],
        cwd=REPO, capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def failing_tests(out):
    names = []
    for line in out.splitlines():
        s = line.strip()
        if s.startswith("✖ "):
            names.append(s[2:].split(" (")[0])
    return names


ORIG_BIN, ORIG_README = read(BIN), read(README)

MUTANTS = [
    # (label, file, old_substring, new_substring, expectation)
    ("M1 extra payload key not in any doc", BIN,
     b"      timestamp: now.toISOString()\n",
     b"      timestamp: now.toISOString(),\n      undocumentedField: 1\n",
     "all three doc comparisons fail"),
    ("M2 HELP fields block loses the 'age' entry", BIN,
     b"  age           days elapsed since the last new moon\n", b"",
     "HELP comparison fails"),
    ("M3 README table loses the cycleFraction row", README,
     b"| `cycleFraction` | position through the synodic month, `0` = new, `0.5` = full |\n", b"",
     "README table comparison fails"),
    ("M4 README example renames julianDay", README,
     b'  "julianDay": 2461266.99732,', b'  "julian_day": 2461266.99732,',
     "README example comparison fails"),
    ("M5 HELP section header renamed (anti-vacuity)", BIN,
     b"--json fields\n", b"--json output fields\n",
     "parser must ERROR, never silently compare empty sets"),
    ("M6 payload+HELP renamed, README left stale (discriminator)", None, None, None,
     "README sources fail, HELP comparison PASSES"),
]

results = []
print("=== BASELINE ===")
code, out = suite()
tail = [l for l in out.splitlines() if l.startswith("# ") or "tests " in l or "pass " in l or "fail " in l]
print("exit", code)
print("\n".join(l for l in out.splitlines()[-9:]))
if code != 0:
    print("BASELINE NOT GREEN — aborting gate")
    sys.exit(1)
results.append(("BASELINE", 0, "green", []))

for label, path, old, new, expect in MUTANTS:
    if label.startswith("M6"):
        # payload key `age` -> `moonAge`, and the matching HELP entry, README untouched
        b = ORIG_BIN
        assert b.count(b"      age: round(moon.age, 3),") == 1
        b = b.replace(b"      age: round(moon.age, 3),", b"      moonAge: round(moon.age, 3),")
        assert b.count(b"  age           days elapsed") == 1
        b = b.replace(b"  age           days elapsed", b"  moonAge       days elapsed")
        write(BIN, b)
    else:
        base = ORIG_BIN if path == BIN else ORIG_README
        n = base.count(old)
        if n != 1:
            print(f"!! {label}: anchor matched {n} times, expected 1 — mutant not applied")
            results.append((label, None, f"anchor x{n}", []))
            continue
        write(path, base.replace(old, new))

    code, out = suite()
    fails = failing_tests(out)
    write(BIN, ORIG_BIN)
    write(README, ORIG_README)
    print(f"\n=== {label} ===")
    print(f"expected: {expect}")
    print(f"exit {code} | failing: {fails or '(none)'}")
    for line in out.splitlines():
        if "disagrees with" in line or "no --json fields section" in line or "came back empty" in line:
            print("   ", line.strip()[:150])
    results.append((label, code, expect, fails))

# restore + prove byte-identical
write(BIN, ORIG_BIN)
write(README, ORIG_README)
d = subprocess.run(["git", "-C", REPO, "diff", "--stat"], capture_output=True, text=True)
print("\n=== RESTORE ===")
print(d.stdout.strip() or "(no diff)")

code, out = suite()
print("=== POST-GATE SUITE === exit", code)
print("\n".join(out.splitlines()[-8:]))

print("\n=== SUMMARY ===")
for label, c, expect, fails in results:
    verdict = "BITES" if (c not in (0, None) and label != "BASELINE") else ("green" if c == 0 else "??")
    print(f"{verdict:6} | exit={c} | {label} | failing={fails}")
