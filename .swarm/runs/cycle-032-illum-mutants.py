#!/usr/bin/env python3
"""cycle 32 VALUE_LOOP scan probe -- price the REPORT VERIFIED row

  | Illumination is true elongation, not faked from age |
  | At Meeus example 48.a the module gives 0.6801 (book: 0.6786); an
    age-derived fake gives 0.6475. Conclusive discriminator. |

That row's figures appear in NO shipping test (grep for 0.6801/0.6786/0.6475
over test/ -> zero hits).  The question this script answers is not "is a test
missing" -- that is churn framing -- but "is the SURFACE unprotected": can the
shipping suite tell the real ch.48 elongation series from an age-derived fake?

Two mutants, because the REPORT claim admits two readings:

  A  NARROW  -- only `illumination` faked from age; phaseAngle stays real.
                Expected to DIE at astro.test.js's k=(1+cos i)/2 identity.
  B  COHERENT -- elongationDeg() itself replaced by a mean-synodic ramp off the
                true new-moon instant, so phaseAngle, cycleFraction AND
                illumination are all fake TOGETHER and mutually consistent.
                This is the fake the REPORT row actually claims to exclude.

Every mutation is applied to src/astro.js in place and reverted; the file is
asserted byte-identical (sha256) to its pre-battery state at the end.
"""
import hashlib
import pathlib
import subprocess
import sys

REPO = pathlib.Path("/opt/targets/moon")
SRC = REPO / "src" / "astro.js"

REAL = """  const phaseAngle = elongationDeg(jd);
  const i = Math.abs(180 - phaseAngle);
  const illumination = (1 + cos(i * DEG)) / 2;

  const cycleFraction = phaseAngle / 360;
"""

# A: keep the real phase angle, fake ONLY the illuminated fraction off age.
MUT_A = """  const phaseAngle = elongationDeg(jd);
  const i = Math.abs(180 - phaseAngle);
  const __ageA = jd - truePhaseJD(k);
  const illumination = (1 - cos(2 * Math.PI * (__ageA / 29.530588853))) / 2;

  const cycleFraction = phaseAngle / 360;
"""

# B: fake the ELONGATION itself off age, so all three outputs agree with
#    each other and the internal-consistency assertions cannot see it.
MUT_B = """  const __ageB = jd - truePhaseJD(k);
  const phaseAngle = ((__ageB / 29.530588853) * 360) % 360;
  const i = Math.abs(180 - phaseAngle);
  const illumination = (1 + cos(i * DEG)) / 2;

  const cycleFraction = phaseAngle / 360;
"""


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def run_suite():
    r = subprocess.run(
        "node --test test/*.test.js",
        shell=True, cwd=REPO, capture_output=True, text=True, timeout=600,
    )
    out = r.stdout + r.stderr
    # node:test's default reporter emits "ℹ pass 119" / "ℹ fail 0" and marks
    # failing tests with "✖", NOT TAP's "# pass" / "not ok".  The first
    # version of this parser looked for TAP and silently reported zero counts
    # on a GREEN baseline -- an instrument narrower than the thing it measures.
    counts = []
    for line in out.splitlines():
        s = line.strip().lstrip("ℹ").strip()
        for key in ("tests ", "pass ", "fail ", "cancelled ", "skipped "):
            if s.startswith(key):
                counts.append(s)
                break
    # Guard against the parse silently degrading again: a run that produced no
    # count lines at all is a BROKEN MEASUREMENT, not a clean one.
    if not counts:
        counts = ["<NO COUNT LINES PARSED -- measurement broken>"]
    return r.returncode, "  ".join(counts), out


def main():
    original = SRC.read_text()
    before = sha(SRC)
    assert REAL in original, "anchor block not found -- source moved, ABORT"
    print(f"src/astro.js sha256 (pre-battery) = {before}")

    rc, counts, out = run_suite()
    print(f"\n=== BASELINE (unmutated HEAD tree) === exit={rc}\n    {counts}")
    if rc != 0:
        print("BASELINE IS RED -- battery is meaningless, aborting")
        print(out[-3000:])
        SRC.write_text(original)
        return 1

    results = {}
    for name, body, note in (
        ("A", MUT_A, "illumination faked from age; phaseAngle left real"),
        ("B", MUT_B, "elongation itself faked from age; all three consistent"),
    ):
        SRC.write_text(original.replace(REAL, body))
        rc, counts, out = run_suite()
        verdict = "DIES (surface protected)" if rc != 0 else "SURVIVES (surface UNPROTECTED)"
        results[name] = rc
        print(f"\n=== MUTANT {name} === {note}\n    exit={rc}  {counts}\n    -> {verdict}")
        if rc != 0:
            killers = [l.strip() for l in out.splitlines()
                       if l.strip().startswith("✖")]
            crashes = [l.strip() for l in out.splitlines()
                       if "ReferenceError" in l or "SyntaxError" in l or "TypeError:" in l]
            for kk in killers[:12]:
                print(f"       killed by: {kk}")
            print(f"       ({len(killers)} failing tests total)")
            # A mutant that CRASHES rather than failing assertions has not shown
            # the surface to be protected -- it has shown the mutant is invalid.
            if crashes and not killers:
                print("       !! NO failing tests but a hard error was raised:")
                for c in crashes[:4]:
                    print(f"          {c}")
                print("       !! MUTANT INVALID -- this is not evidence of protection")
        SRC.write_text(original)

    after = sha(SRC)
    print(f"\n=== RESTORE === sha256 (post-battery) = {after}")
    print("    byte-identical:", "YES" if after == before else "NO -- REPO DIRTY, FIX BY HAND")

    # The discriminator figure the REPORT row names, measured live.
    probe = subprocess.run(
        ["node", "-e", """
const { computeMoon } = require('./src/astro.js');
// Meeus example 48.a: 1992 April 12.0 TD.
const d = new Date(Date.UTC(1992, 3, 12, 0, 0, 0));
const m = computeMoon(d);
console.log('48.a illumination   =', m.illumination.toFixed(4));
console.log('48.a phaseAngle deg =', m.phaseAngle.toFixed(4));
console.log('48.a age days       =', m.age.toFixed(4));
const fake = (1 - Math.cos(2*Math.PI*(m.age/29.530588853)))/2;
console.log('age-derived fake    =', fake.toFixed(4));
"""],
        cwd=REPO, capture_output=True, text=True,
    )
    print("\n=== LIVE 48.a PROBE ===")
    print("    " + (probe.stdout or probe.stderr).replace("\n", "\n    ").rstrip())

    print("\n=== SCAN VERDICT ===")
    if results["B"] == 0:
        print("    Mutant B SURVIVED: the shipping suite CANNOT distinguish real ch.48")
        print("    elongation from a mean-synodic ramp. REPORT's 'conclusive discriminator'")
        print("    row is prose-only. -> ratchet-PASSING candidate.")
    else:
        print("    Mutant B died: the surface is already protected at some level.")
        print("    -> CHURN, reject the candidate.")
    return 0 if after == before else 1


if __name__ == "__main__":
    sys.exit(main())
