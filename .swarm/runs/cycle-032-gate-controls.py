#!/usr/bin/env python3
"""cycle 32 gate -- C5 false-positive control + C7 ambient-environment control.

A gate shown only to FAIL has not been shown usable.  The 7-mutant battery
proves T-129's pin bites; these two controls prove it does not bite things it
should not.

C5  Behavior-preserving rewrites of the very coefficients the pin watches
    (same IEEE-754 double, different source text) must stay GREEN.  A red
    here would mean the pin is coupled to source text rather than to computed
    values, which would make it a tripwire for the next person to touch the
    file rather than a guard on the math.

C7  The pinned instants are absolute UTC milliseconds, so the suite must be
    invariant to the ambient timezone.  The repo already warns (cli.test.js:8)
    that an ambient-zone-dependent test passes locally and misleads on a real
    machine.
"""
import hashlib
import os
import pathlib
import subprocess

REPO = pathlib.Path("/opt/targets/moon")
SRC = REPO / "src" / "astro.js"

REWRITES = [
    ("R1", "- 0.00111 * sin(Mp - 2 * F)", "- 0.001110 * sin(Mp - 2 * F)",
     "trailing zero on the new/full 8th term (identical double)"),
    ("R2", "[0.000325, 299.77", "[3.25e-4, 299.77",
     "A1 coefficient in exponential notation (identical double)"),
    ("R3", "const W = 0.00306", "const W = 0.0030600",
     "trailing zeros on the W constant (identical double)"),
]

ZONES = ["UTC", "Asia/Tokyo", "Pacific/Auckland", "America/St_Johns"]


def run_suite(env=None):
    e = dict(os.environ)
    if env:
        e.update(env)
    r = subprocess.run("node --test test/*.test.js", shell=True, cwd=REPO,
                       capture_output=True, text=True, timeout=600, env=e)
    out = r.stdout + r.stderr
    counts = {}
    for line in out.splitlines():
        s = line.strip().lstrip("ℹ").strip()
        for key in ("tests", "pass", "fail"):
            if s.startswith(key + " "):
                counts[key] = s.split()[1]
    return r.returncode, counts


def main():
    orig = SRC.read_text()
    before = hashlib.sha256(SRC.read_bytes()).hexdigest()

    # Sanity: the rewrites must really be value-preserving, checked by the
    # engine rather than by my reading of them.
    print("=== value-identity precheck (node, not my eyes) ===")
    chk = subprocess.run(["node", "-e",
                          "const p=(a,b)=>console.log(a===b?'IDENTICAL':'DIFFERENT',a,b);"
                          "p(0.00111,0.001110);p(0.000325,3.25e-4);p(0.00306,0.0030600);"],
                         capture_output=True, text=True)
    print("    " + chk.stdout.strip().replace("\n", "\n    "))
    if "DIFFERENT" in chk.stdout:
        print("    a rewrite is NOT value-preserving -- control invalid, aborting")
        return 1

    rc, counts = run_suite()
    print(f"\n=== BASELINE === exit={rc} tests={counts.get('tests')} "
          f"pass={counts.get('pass')} fail={counts.get('fail')}")
    if rc != 0:
        return 1

    print("\n=== C5 false-positive control (must stay GREEN) ===")
    c5_ok = True
    for rid, find, rep, desc in REWRITES:
        assert orig.count(find) == 1, f"{rid} anchor not unique"
        SRC.write_text(orig.replace(find, rep))
        rc, counts = run_suite()
        ok = rc == 0
        c5_ok &= ok
        print(f"    {rid} {desc:52s} exit={rc} pass={counts.get('pass')} "
              f"-> {'GREEN (correct)' if ok else 'RED (FALSE POSITIVE)'}")
        SRC.write_text(orig)

    print("\n=== C7 ambient timezone control (must stay GREEN in every zone) ===")
    c7_ok = True
    for z in ZONES:
        rc, counts = run_suite({"TZ": z})
        ok = rc == 0
        c7_ok &= ok
        print(f"    TZ={z:20s} exit={rc} pass={counts.get('pass')} "
              f"-> {'GREEN' if ok else 'RED'}")

    after = hashlib.sha256(SRC.read_bytes()).hexdigest()
    print(f"\n=== RESTORE === byte-identical: {'YES' if after == before else 'NO -- DIRTY'}")
    print(f"\nC5 {'PASS' if c5_ok else 'FAIL'}   C7 {'PASS' if c7_ok else 'FAIL'}")
    return 0 if (c5_ok and c7_ok and after == before) else 1


if __name__ == "__main__":
    raise SystemExit(main())
