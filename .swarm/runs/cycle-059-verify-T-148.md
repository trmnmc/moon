# cycle 59 — VERIFICATION EVIDENCE — T-148 attempt 2 (conductor-run)

Item: regenerate REPORT.md's Meeus 48.a figures (line 45) in the correct time
frame. Scope: figure 4 alone. Verdict: **PASS**.

Both gate parts were authored **before** the builder's return was read, and
neither requires, reads, or executes the builder's script. Part 1 was written and
run while the builder was still working.

---

## Scope check — what actually changed

```
$ git -C /opt/targets/moon status --porcelain
?? .swarm/runs/c59-gate-48a.js          <- conductor (gate part 1)
?? .swarm/runs/c59-gate-mutants.js      <- conductor (gate part 2)
?? .swarm/runs/c59-hb.py                <- conductor (heartbeat)
?? .swarm/runs/c59-meeus-48a-td-probe.js  <- builder
?? .swarm/runs/c59-t148-capture.md        <- builder

$ git -C /opt/targets/moon diff --stat
(empty)

$ git -C /opt/targets/moon diff -- REPORT.md | wc -c
0
```

Zero tracked files modified. **REPORT.md was correctly left untouched** — the
expected outcome when a figure reproduces. `src/`, `test/`, `package.json` and
`README.md` are all unmodified. The attempt-1 hazard file
`.swarm/runs/c58-meeus-48a-probe.js` is unchanged (committed at 439e7d9, absent
from `git status`) — neither run nor deleted, as required.

## Independent rerun of the builder's probe

Run by the conductor, not read from the builder's report:

```
$ node .swarm/runs/c59-meeus-48a-td-probe.js
Delta T applied (s)                       = 58.54795211315953
UT instant fed to computeMoon()           = 1992-04-11T23:59:01.452Z
module illumination (full precision)      = 0.6801366983212301
module illumination (4dp)                 = 0.6801
age-derived fake (full precision)         = 0.6474878439322895
age-derived fake (4dp)                    = 0.6475
```

Matches the builder's pasted stdout digit-for-digit, including the 16-digit
full-precision values. The paste is honest.

## GATE PART 1 — ΔT robustness band (`c59-gate-48a.js`)

The question this answers is not "does 0.6801 reproduce at the builder's ΔT"
but "is 0.6801 a property of the module, or of a chosen ΔT?" Cycle 58 settled
this figure at ΔT = 58.3 s; the retry builder independently picked 58.548 s from
a different polynomial. Re-deriving at the builder's number would have confirmed
the builder's arithmetic, not the figure.

```
$ node .swarm/runs/c59-gate-48a.js
=== G1  naive control: UT = TD, i.e. dT = 0 (what attempt 1 ran) ===
  illum = 0.68021027 -> 0.6802
  age   = 8.790628  fake = 0.64755672 -> 0.6476
  G1 reproduces attempt 1's 0.6802/0.6476 : true

=== G2  DeltaT sweep, 40..80 s in 0.1 s steps ===
  committed pair 0.6801/0.6475 holds for dT in [48, 80] s
  first few dT values OUTSIDE that pair: 40s -> 0.6802/0.6475 | 40.1s -> 0.6802/0.6475

=== G3  the two DeltaT candidates a builder could defensibly pick ===
  historical 1992 (cycle 58 used this): dT = 58.30 s -> 0.6801/0.6475   (inside band: true)
  src/astro.js deltaTDays() extrapolated: dT = 60.77 s -> 0.6801/0.6475  (inside band: true)

  GATE: PASS -- 0.6801/0.6475 is a property of the module, not of a chosen dT
```

The pair holds across a **32-second-wide** band. The builder's 58.548 s, cycle
58's 58.3 s, and the module's own extrapolated 60.765 s all sit 10-13 s inside
the lower edge. G1 is the control: it reproduces attempt 1's artifact exactly,
which is what proves the instrument is looking at the same module attempt 1 ran
and that the 0.6801/0.6802 difference is real rather than an artifact of my own
harness.

## GATE PART 2 — path independence (`c59-gate-mutants.js`)

Part 1 proves a number reproduces. It cannot prove **which machinery produced
it** — a probe printing two hardcoded constants would pass part 1 perfectly. And
the REPORT row does not claim "the number is 0.6801"; it claims *"Illumination is
true elongation, not faked from age."* That is a claim about two independent code
paths, so each was perturbed in isolation and the **other** figure required to
hold.

```
$ node .swarm/runs/c59-gate-mutants.js
src/astro.js md5 before : be873b13150f8041b82b525d94d20d27
baseline (unmutated source): illum=0.6801 fake=0.6475

M1  phaseAngle += 0.01 deg (ch.48 elongation path)
     illum 0.6801 -> 0.6802   (moved: true, expected true)
     fake  0.6475 -> 0.6475   (moved: false, expected false)     M1: PASS

M2  age += 0.01 d (ch.49 true-phase instant path)
     illum 0.6801 -> 0.6801   (moved: false, expected false)
     fake  0.6475 -> 0.6485   (moved: true, expected true)       M2: PASS

src/astro.js md5 after  : be873b13150f8041b82b525d94d20d27 (RESTORED byte-identical)
GATE part 2: PASS
```

Incidental finding worth keeping: **M1's 0.01° elongation error produces exactly
0.6802** — the same visible 4-dp value as attempt 1's ~58 s frame error. Two
unrelated defects share one signature at 4 decimal places. That is the concrete
reason the frame had to be reasoned about rather than eyeballed against the
book: Meeus's own 0.6786 sits ~0.0015 from both candidates and discriminates
between neither.

## Full suite

```
$ node --test test/*.test.js
ℹ tests 147   ℹ pass 147   ℹ fail 0
```

## What is NOT verified, and why it does not carry the verdict

The builder's capture cites NASA's "Polynomial Expressions for Delta T" for the
1986-2005 coefficients. **This run has no network and could not check that URL or
those coefficients.** It is recorded as unverified rather than waved through.

It is also not load-bearing, by construction rather than by argument: part 1's
32-second band means the verdict survives any ΔT a 1992 epoch could plausibly
take, so a misremembered coefficient could only overturn it by being wrong by
more than 10 seconds — and it is not, since the cited polynomial lands 2.2 s from
`src/astro.js`'s own independently-authored polynomial, a second source already
in the repo.

REPORT.md figures 3, 6b and 7 remain **NOT-RERUNNABLE** (no script, no journal
record). Recorded as not-run, never as passed.
