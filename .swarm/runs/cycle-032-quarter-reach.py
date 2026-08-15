#!/usr/bin/env python3
"""cycle 32 -- honest-magnitude follow-up to the ch.49 battery.

The battery's magnitude metric sampled `nextFullMoon` only, so it reported
0.0s for M4 and M5 -- the two mutants that corrupt the QUARTER table and the
W term.  That is a limit of the INSTRUMENT, not a property of the mutation:
nextFullMoon evaluates truePhaseJD at phase 0.5 exclusively and structurally
cannot observe the quarter coefficients.  Reporting 0.0s as though those
mutations were harmless would be the same defect this run has removed from
the docs nine times.

truePhaseJD is not exported, so the quarter instants are reached here through
the only public observable that depends on them: the moment computeMoon
starts reporting isInstantPhase for a named quarter.  Bisected to the ms.
"""
import hashlib
import json
import pathlib
import subprocess

REPO = pathlib.Path("/opt/targets/moon")
SRC = REPO / "src" / "astro.js"


# FIRST VERSION OF THIS PROBE WAS BROKEN and its failure is kept on the record:
# it bisected the predicate directly, which assumes ONE false->true transition.
# isInstantPhase is a +/-0.5 d PLATEAU that recurs once per lunation, so over a
# two-month window the predicate has several edges and plain bisection walked to
# the window end every time -- returning "0.0s shift" for the M2 CONTROL, which
# provably moves.  That control is the only reason the dead measurement was
# caught instead of being written up as "quarter mutants are harmless".
# Repaired shape: coarse-scan to BRACKET the first false->true edge, then bisect
# strictly inside that bracket, where the transition really is unique.
JS = r"""
const { computeMoon } = require('./src/astro.js');
const STEP = 10 * 60 * 1000; // 10 min: far finer than the 0.5 d plateau
function edge(start, end, want) {
  const hit = (t) => {
    const m = computeMoon(new Date(t));
    return m.isInstantPhase && m.phaseName === want;
  };
  let lo = null;
  for (let t = start; t < end; t += STEP) {
    if (hit(t)) { lo = t - STEP; break; }   // bracket: [lo, t] straddles the edge
  }
  if (lo === null) return null;             // never entered the plateau: report it
  let hi = lo + STEP;
  for (let n = 0; n < 40; n++) {
    const mid = Math.floor((lo + hi) / 2);
    if (hit(mid)) hi = mid; else lo = mid;
  }
  return hi;
}
const out = [];
for (const [y, mo, want] of [[2024, 0, 'first quarter'], [2024, 0, 'last quarter'],
                             [2031, 5, 'first quarter'], [2031, 5, 'last quarter']]) {
  out.push(edge(Date.UTC(y, mo, 1), Date.UTC(y, mo + 2, 1), want));
}
console.log(JSON.stringify(out));
"""

MUTANTS = [
    ("M4", "- 0.01183 * E * sin(Mp + M)", "- 0.01138 * E * sin(Mp + M)",
     "quarter table 3rd term transposed"),
    ("M5", "const W = 0.00306", "const W = 0.00360",
     "W constant transposed"),
    ("M2", "+ 0.00042 * E * sin(M + 2 * F)", "- 0.00042 * E * sin(M + 2 * F)",
     "new/full M+2F sign flip (control: should move BOTH)"),
]


def probe():
    r = subprocess.run(["node", "-e", JS], cwd=REPO, capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 else None


def main():
    orig = SRC.read_text()
    before = hashlib.sha256(SRC.read_bytes()).hexdigest()
    base = probe()
    if base is None:
        print("baseline probe failed -- aborting")
        return 1
    import datetime as _dt
    if any(b is None for b in base):
        print(f"baseline has un-bracketed edges {base} -- measurement broken, aborting")
        return 1
    print("baseline quarter-plateau edges:")
    for b in base:
        print("   ", _dt.datetime.fromtimestamp(b / 1000, _dt.UTC).isoformat())
    print()
    for mid, find, rep, desc in MUTANTS:
        assert orig.count(find) == 1, f"{mid} anchor not unique"
        SRC.write_text(orig.replace(find, rep))
        v = probe()
        SRC.write_text(orig)
        if v is None or any(x is None for x in v):
            print(f"{mid}  {desc:44s} MEASUREMENT FAILED -- not evidence")
            continue
        worst = max(abs(a - b) / 1000.0 for a, b in zip(v, base))
        print(f"{mid}  {desc:44s} worst QUARTER-instant shift: {worst:8.1f}s")
    after = hashlib.sha256(SRC.read_bytes()).hexdigest()
    print("\nrestore byte-identical:", "YES" if after == before else "NO -- REPO DIRTY")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
