#!/usr/bin/env python3
"""cycle 32 VALUE_LOOP scan probe 2 -- price the REPORT VERIFIED row

  | Correction tables are correctly transcribed |
  | Independent audit reproduced Meeus worked examples 49.a and 49.b to
    0.23s and 0.34s, exercising the mean formula, E, both 25-term tables,
    W, and A1-A14. |

grep over test/ for '49.a', '49.b', '0.23', '0.34', 'worked example' -> ZERO
hits.  The audit happened once, by hand, and nothing re-runs it.  src/astro.js
carries ~65 hand-transcribed coefficients (25 new/full + 25 quarter + 6 W +
14 A-table); this asks whether the SHIPPING suite would notice if any one of
them were mistyped.

Mutants are plausible TRANSCRIPTION errors -- dropped digits, transposed
digits, sign flips -- not arbitrary breakage, because transcription is the
exact failure mode the REPORT row claims to have audited.  M6 is the control:
a large-term corruption that the existing 1-hour anchor SHOULD catch.  A
battery in which nothing survives means the surface is protected and the
candidate is churn; a battery in which nothing dies means the battery is
broken, not that the code is bad.

Every mutation is applied in place and reverted; src/astro.js is asserted
sha256-identical to its pre-battery state at the end.
"""
import hashlib
import pathlib
import subprocess
import sys

REPO = pathlib.Path("/opt/targets/moon")
SRC = REPO / "src" / "astro.js"

# (id, find, replace, description)
MUTANTS = [
    ("M1", "- 0.00111 * sin(Mp - 2 * F)", "- 0.00011 * sin(Mp - 2 * F)",
     "new/full table: dropped digit in the 8th term (0.00111 -> 0.00011)"),
    ("M2", "+ 0.00042 * E * sin(M + 2 * F)", "- 0.00042 * E * sin(M + 2 * F)",
     "new/full table: sign flip on the M+2F term"),
    ("M3", "[0.000325, 299.77 + 0.107408 * k - 0.009173 * T2]",
     "[0.000352, 299.77 + 0.107408 * k - 0.009173 * T2]",
     "A-table: transposed digits in A1 (0.000325 -> 0.000352)"),
    ("M4", "- 0.01183 * E * sin(Mp + M)", "- 0.01138 * E * sin(Mp + M)",
     "quarter table: transposed digits in the 3rd term (0.01183 -> 0.01138)"),
    ("M5", "const W = 0.00306", "const W = 0.00360",
     "W term: transposed digits in the constant (0.00306 -> 0.00360)"),
    ("M6", "? [-0.40720,", "? [-0.40270,",
     "CONTROL: transposed digits in the LARGEST new-moon term (0.40720 -> 0.40270)"),
    ("M7", "[0.000023, 331.55 + 3.592518 * k]", "[0.0, 331.55 + 3.592518 * k]",
     "A-table: A14 dropped entirely (0.000023 -> 0)"),
]

MAGNITUDE_JS = r"""
const { computeMoon, nextFullMoon } = require('./src/astro.js');
// Sample the whole public surface over 2020-2035 on a fixed stride and report
// the WORST shift this mutation induces in a user-visible instant.
const start = Date.UTC(2020, 0, 1), end = Date.UTC(2035, 0, 1);
const step = 73 * 24 * 3600 * 1000; // 73 d: coprime-ish with the synodic month
const out = [];
for (let t = start; t < end; t += step) {
  const d = new Date(t);
  out.push(nextFullMoon(d).getTime());
  const m = computeMoon(d);
  out.push(m.age, m.illumination, m.phaseAngle);
}
console.log(JSON.stringify(out));
"""


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def run_suite():
    r = subprocess.run("node --test test/*.test.js", shell=True, cwd=REPO,
                       capture_output=True, text=True, timeout=600)
    out = r.stdout + r.stderr
    counts, killed = {}, []
    for line in out.splitlines():
        s = line.strip().lstrip("ℹ").strip()
        for key in ("tests", "pass", "fail"):
            if s.startswith(key + " "):
                counts[key] = s.split()[1]
        if line.strip().startswith("✖") and "failing tests" not in line:
            name = line.strip()[1:].strip()
            if name not in killed:
                killed.append(name)
    hard = [l.strip() for l in out.splitlines()
            if "ReferenceError" in l or "SyntaxError" in l]
    return r.returncode, counts, killed, hard


def magnitudes():
    r = subprocess.run(["node", "-e", MAGNITUDE_JS], cwd=REPO,
                       capture_output=True, text=True)
    if r.returncode != 0:
        return None
    import json
    return json.loads(r.stdout)


def main():
    original = SRC.read_text()
    before = sha(SRC)
    print(f"src/astro.js sha256 (pre-battery) = {before}\n")

    for mid, find, _rep, _d in MUTANTS:
        if original.count(find) != 1:
            print(f"ABORT: {mid} anchor matches {original.count(find)}x, need exactly 1")
            return 1

    rc, counts, _k, _h = run_suite()
    print(f"=== BASELINE === exit={rc}  tests={counts.get('tests')} "
          f"pass={counts.get('pass')} fail={counts.get('fail')}")
    if rc != 0:
        print("BASELINE RED -- battery meaningless, aborting")
        SRC.write_text(original)
        return 1
    base_vals = magnitudes()
    print(f"    magnitude baseline: {len(base_vals)} sampled values\n")

    survivors = []
    for mid, find, rep, desc in MUTANTS:
        SRC.write_text(original.replace(find, rep))
        rc, counts, killed, hard = run_suite()
        vals = magnitudes()

        # Worst user-visible shift, in seconds, over the sampled surface.
        worst_s = 0.0
        if vals and len(vals) == len(base_vals):
            for i in range(0, len(vals), 4):
                worst_s = max(worst_s, abs(vals[i] - base_vals[i]) / 1000.0)

        verdict = "DIES" if rc != 0 else "SURVIVES"
        if rc == 0:
            survivors.append((mid, desc, worst_s))
        print(f"=== {mid} === {desc}")
        print(f"    exit={rc}  pass={counts.get('pass')} fail={counts.get('fail')}"
              f"   worst next-full-moon shift: {worst_s:.1f}s   -> {verdict}")
        if hard:
            print(f"    !! HARD ERROR -- mutant invalid, not evidence: {hard[0][:90]}")
        for k in killed[:4]:
            print(f"       killed by: {k}")
        SRC.write_text(original)

    after = sha(SRC)
    print(f"\n=== RESTORE === sha256 = {after}   byte-identical: "
          f"{'YES' if after == before else 'NO -- REPO DIRTY'}")

    print("\n=== SCAN VERDICT ===")
    if not survivors:
        print("    Every transcription mutant died. Surface protected -> CHURN, reject.")
    else:
        print(f"    {len(survivors)} of {len(MUTANTS)} transcription mutants SURVIVE the")
        print("    full 119-test suite. The correction tables are an unprotected surface:")
        for mid, desc, w in survivors:
            print(f"      {mid}  shifts a published instant by up to {w:6.1f}s  -- {desc}")
        print("    REPORT's 'correctly transcribed' row is prose-only.")
    return 0 if after == before else 1


if __name__ == "__main__":
    sys.exit(main())
