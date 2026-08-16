# T-145 — src/astro.js mutation sweep (outside the T-129 ch.49 table battery)

Baseline: `tests=145 pass=145 fail=0 exit=0` (matches the required 145/145 green baseline).
Mutants: **16 total, 8 KILLED, 8 SURVIVED**.

Harness: `.swarm/runs/c54-sweep.js` (run in the foreground; full output in
`.swarm/runs/c54-sweep-out.txt`). Witness/classification harness:
`.swarm/runs/c54-witness.js` (full output in `.swarm/runs/c54-witness-out.txt`),
plus three inline diagnostic scripts run directly via `node -e` (reproduced in
each section below so they can be re-run verbatim).

Killed (not analyzed further below — the suite already pins these):
IT1, IT2 (tolerance widen/narrow), CI1, CI2 (cycleFraction independence),
AG1 (age mean-month clamp reintroduced — confirmed still caught), DT1
(deltaTDays coefficient), NFM1 (nextFullMoon rounding), PN1 (arc indexing).

---

## IT3 — instant-tolerance comparison `<=` flipped to `<`

**Behavior:** `src/astro.js`, `isInstantPhase = Math.abs(jd - instants[nearest][0]) <= INSTANT_TOLERANCE_DAYS`.

**Mutation:** `<=` → `<`.

**Verdict: BOUNDARY** (with an important caveat — see below; this is the most
interesting finding of the sweep even though it does not clear the HOLE bar
for the *shipped* product).

**Reasoning:**

This is **not** a classic "equivalent mutant" — I found a real, reproducible,
non-hypothetical Date where pristine and mutated code disagree, using nothing
but the public `computeMoon` API:

```
date: 1003-12-17T04:08:08.598Z  (ms = -30485361111402)
pristine: phaseName="full",           isInstantPhase=true
IT3:      phaseName="waxing gibbous", isInstantPhase=false
```

The mechanism: for any true-phase instant `instant` in this module's working
magnitude (JD ~2.3–3.0 million for years 1000–3000), `instant ± 0.5` is
**exactly representable** and the subtraction `jd - instant` round-trips to
**exactly** `0.5` whenever the millisecond timestamp used to build `jd`
happens to reconstruct that exact double (a Sterbenz-lemma-style exact
subtraction, not floating noise). A stratified sweep of the sweep harness's
own domain (k in [-12370, 12370] as used by `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN`,
every 25th k, both tolerance-window edges, all 4 phase types = 15,840
candidate integer-ms boundary points) found **300 exact `dist === 0.5` hits**,
spanning years 1003 through 2990, including several inside the ordinary
1990–2060 window this project documents accuracy claims for (e.g.
`2016-08-02T08:44:38.430Z`, `2000-06-02T00:13:59.330Z`).

**Why this still doesn't clear the HOLE bar:** `bin/moon.js:105` calls
`new Date()` — there is **no `--date`/`--at` flag anywhere in `src/args.js`**
(verified: `grep -n "date\|Date"` on args.js returns nothing). The shipped CLI
can only ever query "now," and a user has no way to steer which millisecond
"now" lands on. The 300 exact-hit milliseconds found above are a sparse,
effectively patternless subset of the ~6.3×10^13 milliseconds in the
1000–3000 domain (density ≈4.8×10⁻¹² per ms) — for a real invocation to hit
one by chance is astronomically unlikely, and there is no way for a user to
target it deliberately since the tool accepts no date input. So while the
divergence is real and not floating-point-argument hand-waving, it is
**unreachable through the shipped product's actual user-facing surface.**

**What would flip this to a HOLE:** if this module (which already exports
`computeMoon(date)` accepting an arbitrary caller-supplied `Date`) is ever
wired to a `--date`/`--at` CLI flag or used as a library by another program
that feeds it millisecond-precision timestamps (e.g. replaying logged
events), this becomes directly reachable — a caller could pass exactly
`2016-08-02T08:44:38.430Z` and get `isInstantPhase=false` from a build that
should say `true`, or vice versa. Recommendation for T-146: if a `--date`
flag is ever added, this is worth a dedicated regression test pinning the
`<=` behavior at one of the concrete witness instants below.

**Witness (commands that produced the above):**
```
node -e '
const fs=require("fs"),os=require("os"),path=require("path");
const src=fs.readFileSync("src/astro.js","utf8");
const EXPORT=`module.exports = { computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN };`;
const DEBUG=`module.exports = { computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN, normDeg, dateToJulianDay, deltaTDays, truePhaseJD, elongationDeg, lunationK, INSTANT_TOLERANCE_DAYS, SYNODIC_MONTH, MEAN_PHASE_EPOCH, JD_UNIX_EPOCH };`;
function build(t){let s=src; if(t) s=s.split(t.find).join(t.replace); s=s.replace(EXPORT,DEBUG);
  const f=path.join(fs.mkdtempSync(path.join(os.tmpdir(),"moon-diag-")),"a.js"); fs.writeFileSync(f,s,"utf8"); return require(f);}
const pristine=build(null);
const IT3=build({find:`const isInstantPhase = Math.abs(jd - instants[nearest][0]) <= INSTANT_TOLERANCE_DAYS;`,
                  replace:`const isInstantPhase = Math.abs(jd - instants[nearest][0]) < INSTANT_TOLERANCE_DAYS;`});
const date=new Date(-30485361111402);
console.log("pristine:", JSON.stringify(pristine.computeMoon(date)));
console.log("IT3:     ", JSON.stringify(IT3.computeMoon(date)));
'
```
Full sweep for all 300 hits: see `.swarm/runs/c54-witness.js` (IT3 section) —
run output in `.swarm/runs/c54-witness-out.txt` lines 3-6 (300 hits, closest
non-hit miss is 0 ms from the boundary i.e. an exact hit). The domain-wide hit
census (all 300 dates, the 1990-2060 and 2000-2030 sub-window counts) was
produced by the inline script reproduced in this repo's session log; rerun by
adding a `hits.push(...)` collector to the `investigateIT3` loop in
`c54-witness.js` if needed again.

---

## IT4 — nearest-quarter-instant tie-break `<` flipped to `<=`

**Behavior:** the `nearest` selection loop in `computeMoon`.

**Mutation:** `<` → `<=` (changes which instant wins an exact tie in distance).

**Verdict: BOUNDARY** — proven geometrically unreachable, not just
floating-point-rare.

**Reasoning:** `nearest`'s identity only affects output when
`isInstantPhase` is `true` for the chosen instant (i.e. distance ≤
`INSTANT_TOLERANCE_DAYS` = 0.5 days). A tie between two candidate distances
can only occur near the **midpoint** of two adjacent instants. Measuring the
actual minimum gap between adjacent instants across the full 1000-3000
domain (stratified, 990 lunations, `.swarm/runs/c54-witness-out.txt` line 9):
minimum gap = **6.58 days** (quarter-to-quarter, near the shorter end of the
~7.38-day nominal spacing). Half of that is **3.29 days**, i.e. any tie point
sits ≥3.29 days from both instants involved — nearly 7× the 0.5-day
tolerance. So whenever a tie in `nearest` could occur, both candidate
distances already exceed the tolerance and `isInstantPhase` is `false`
regardless of which one is picked; the `else` branch (arc-based intermediate
naming) doesn't consult `nearest` at all. This holds for **any** possible
tie, not just the sampled ones, because it follows from the gap bound, not
from searching for hits.

**Witness:** direct `computeMoon` diff, pristine vs IT4-mutated, sampled
densely (±0.02, ±0.005, 0 days) around all 4 inter-instant midpoints for 990
lunations across the full domain — **19,800 points checked, 0 divergences**
in `phaseName`/`isInstantPhase`. Command:
```
node -e '... (same build() harness as above) ...
const IT4=build({find:`if (Math.abs(jd - instants[n][0]) < Math.abs(jd - instants[nearest][0])) nearest = n;`,
                  replace:`if (Math.abs(jd - instants[n][0]) <= Math.abs(jd - instants[nearest][0])) nearest = n;`});
// loop over midpoints of consecutive instants for k = -12370..12370 step 25, deltaDays in [-0.02,-0.005,0,0.005,0.02]
// compare a.phaseName/a.isInstantPhase vs b.phaseName/b.isInstantPhase
'
```
Result: `checked: 19800 IT4 diffs: 0`.

---

## IL1 — illumination fold `Math.abs(180 - phaseAngle)` dropped

**Mutation:** `const i = Math.abs(180 - phaseAngle);` → `const i = 180 - phaseAngle;`

**Verdict: BOUNDARY — true equivalent mutant.**

**Reasoning:** `Math.cos` is mathematically even (`cos(-x) === cos(x)`), and
this holds bit-for-bit in V8's `Math.cos` (a documented, cross-checked
property of standard math libraries, not assumed). Since `i` only ever feeds
`Math.cos(i * DEG)`, dropping the fold changes the sign of `i` for
`phaseAngle > 180` but never changes `cos(i * DEG)`, and `i` is used nowhere
else.

**Witness:**
1. Direct bit-equality check: for `phaseAngle` stepped 0.1° across [0, 360)
   (3600 samples), `Math.cos(Math.abs(180-phaseAngle)*DEG) === Math.cos((180-phaseAngle)*DEG)`
   for all 3600 — `mismatches=0` (`c54-witness-out.txt` line 19).
2. Full `computeMoon()` output diff, pristine vs IL1-mutated, across 7,920
   real dates (8 phase-fractions × 990 lunations spanning the full domain):
   **0 divergences**, max `|illumination diff| = 0` exactly
   (`c54-witness-out.txt` lines 16-18).

---

## LK1 — `lunationK` seed `Math.round` → `Math.floor`

**Mutation:** only changes the *seed* fed into the two correcting
`while` loops immediately below it (`while (truePhaseJD(k) > jd) k -= 1;` /
`while (truePhaseJD(k + 1) <= jd) k += 1;`).

**Verdict: BOUNDARY — equivalent mutant (converges to the same fixed point).**

**Reasoning:** the while loops fully correct `k` to satisfy
`truePhaseJD(k) <= jd < truePhaseJD(k+1)` regardless of the starting seed, as
long as the seed is within a bounded number of lunations of the true `k`
(true here: `round` and `floor` never differ by more than 1). Since
`truePhaseJD` is monotonically increasing in `k` at the scale the periodic
corrections operate (a few hours out of a ~29.5-day step), an off-by-one seed
just costs one extra loop iteration, never a different converged answer.

**Witness:** full `computeMoon()` output diff (`Object.is` per field —
distinguishes -0/+0 too), pristine vs LK1-mutated, across a dense
within-lunation sweep (100 fractions × 990 lunations = 99,000 points,
spanning the full domain, deliberately including the fractional region near
0.5 where `round`/`floor` disagree): **49,500 of 99,000 points had a
disagreeing seed** (`Math.round(seed) !== Math.floor(seed)`), yet
**0 full-output divergences** resulted (`c54-witness-out.txt` lines 22-24).

---

## ND1 — `normDeg` negative-branch boundary `x < 0` → `x <= 0`

**Mutation:** changes handling of `x === 0` / `x === -0` entering the branch.

**Verdict: BOUNDARY.**

**Reasoning, two parts:**

1. **Even where it changes normDeg's raw return value, it's unobservable.**
   Adversarial direct calls (`c54-witness-out.txt` lines 27-35) show
   `normDeg(-0)`: pristine returns `-0`, ND1 returns `0` — a real difference
   at the bit level (`Object.is` distinguishes them). But everywhere this
   value is consumed (`cycleFraction = phaseAngle / 360`, then
   `src/render.js:149 f -= Math.floor(f)`), `-0` and `0` behave identically:
   `Math.floor(-0) === -0`, and `-0 - (-0) === 0` (positive) in IEEE 754, so
   `render.js`'s `waxing = f < 0.5` result is the same either way. No other
   consumer in the module uses `Object.is` or sign-of-zero-sensitive
   arithmetic (`1/x`, etc.) on these fields.

2. **Real inputs never reach the x=0/-0 edge in the first place.** Swept
   19,800 real `elongationDeg(jd)` evaluations across the full domain: **0**
   exact 0/-0 hits; closest approach was 0.00049° from 0 and 0.0004° from 360
   (`c54-witness-out.txt` lines 37-39) — five orders of magnitude away from
   the edge, with no algebraic reason (unlike IT3's exact power-of-two
   subtraction) for a sum of ~7 incommensurate sinusoidal terms to land
   exactly on zero.

**Witness (full-output confirmation, the same check applied to IT3 that
caught its real divergence):** `Object.is`-based full-field diff,
pristine vs ND1-mutated, 7,920 real dates: **0 divergences.**

---

## ND2 — `normDeg` terminal `x >= 360 ? 0 : x` guard dropped

**Mutation:** `return x >= 360 ? 0 : x;` → `return x;`

**Verdict: BOUNDARY.**

**Reasoning:** the guard can only matter if `x` reaches exactly `360.0` (or
`-360.0`) at the return statement. Tracing the function: `x %= 360` first
(JS `%` is defined so the mathematical remainder has magnitude strictly less
than the divisor — before any double-rounding of the *result itself*), then
`if (x < 0) x += 360` can only produce a value `< 360` since it only fires
for `x < 0`. So under the *unmutated* branch logic, `x` can only reach
exactly 360 via the `%` operator's own double-rounding (the mathematical
remainder rounds up to the very next representable double, which happens to
be exactly 360.0). Brute-force probed 200,000 values of the form
`360×n − ε` for `n` up to 200,000 (values engineered to be just under an
exact multiple of 360, the closest case to the rounding edge): **0 exact
`x % 360 === ±360` hits**, closest approach `5.68×10⁻¹⁴` from 360 (about half
a ULP at that magnitude) (`c54-witness-out.txt` line 36).

**Witness (full-output confirmation):** `Object.is`-based full-field diff,
pristine vs ND2-mutated, 7,920 real dates spanning the full domain:
**0 divergences.**

---

## EL1 — `elongationDeg` eq.(47.2) D rate-term last digit dropped

**Mutation:** `445267.1114034` → `445267.111403` (drops the trailing `4`,
a plausible single-digit transcription slip).

**Verdict: BOUNDARY — real but sub-observable divergence.**

**Reasoning:** this coefficient only feeds `phaseAngle`, `cycleFraction`,
and `illumination` (confirmed: `age`/`phaseName`/`isInstantPhase` never
diverged in the sweep below, consistent with `elongationDeg` being entirely
separate from `truePhaseJD`). Measured across 3,960 real dates spanning the
full 1000-3000 domain: **max `|phaseAngle diff| = 4.26×10⁻⁶`°**, **max
`|illumination diff| = 3.54×10⁻⁸`**, **max `|cycleFraction diff| =
1.18×10⁻⁸`** (`c54-witness-out.txt` lines 42-46). The CLI's own rendering
(`src/render.js:235`, `Math.round(illumination * 100)`) only ever shows a
whole percent — the measured illumination divergence is **~3.5×10⁻⁶ of one
percentage point**, roughly 280,000× too small to move the displayed digit
anywhere in the domain sampled. `cycleFraction`'s only consumer
(`render.js:150`, `waxing: f < 0.5`) needs the divergence to straddle the
0.5 threshold to matter at all; the measured `1.18×10⁻⁸` diff is far below
any realistic proximity-to-0.5 a real invocation would land at (would need
`cycleFraction` to already be within 1.18×10⁻⁸ of exactly 0.5, itself a
~10⁻⁸-probability coincidence, compounded with the diff being large enough
to cross it, which it isn't in the domain measured).

**Witness:** `.swarm/runs/c54-witness.js`, `EL1` section (measured, not
estimated by hand) — full output `c54-witness-out.txt` lines 41-46.

---

## EL2 — `elongationDeg` eq.(47.4) Moon's mean-anomaly rate-term last digit dropped

**Mutation:** `477198.8675055` → `477198.867505`.

**Verdict: BOUNDARY** — same class and same reasoning as EL1, smaller
magnitude. Measured across the same 3,960-date sweep: max `|phaseAngle diff|
= 6.89×10⁻⁷`°, max `|illumination diff| = 5.99×10⁻⁹` (~6×10⁻⁷ of a rendered
percentage point), max `|cycleFraction diff| = 1.91×10⁻⁹`
(`c54-witness-out.txt` lines 48-53). `age`/`phaseName`/`isInstantPhase`
confirmed untouched (elongationDeg-only effect), same as EL1.

---

## Summary

| id | verdict | behavior | reasoning (one line) |
|----|---------|----------|------------------------|
| IT3 | BOUNDARY | instant-tolerance `<=`→`<` | real divergence exists (300 witness dates found) but unreachable via the shipped CLI, which has no date-input flag — the single most interesting finding of this sweep |
| IT4 | BOUNDARY | nearest-instant tie-break `<`→`<=` | geometrically unreachable: adjacent-instant gap (min 6.58d) always exceeds 2×tolerance |
| IL1 | BOUNDARY | illumination fold `Math.abs()` dropped | true equivalent mutant — `cos` is even, verified bit-exact |
| LK1 | BOUNDARY | `lunationK` seed round→floor | while-loop always converges to the same k regardless of seed, verified across 49,500 seed-disagreement points |
| ND1 | BOUNDARY | `normDeg` `x<0`→`x<=0` | only differs at ±0, unobservable downstream and never reached by real inputs (closest miss 0.0005°) |
| ND2 | BOUNDARY | `normDeg` terminal guard dropped | guard is dead code given upstream invariants; `%` operator never observed to hit exactly 360 |
| EL1 | BOUNDARY | eq.(47.2) D-rate digit drop | measured max effect ~3.5×10⁻⁶ of a rendered percentage point |
| EL2 | BOUNDARY | eq.(47.4) Mp-rate digit drop | measured max effect ~6×10⁻⁷ of a rendered percentage point |

No survivor is classified HOLE. IT3 is flagged prominently as a real,
witnessed divergence that is nonetheless unreachable through the shipped
product today — see its section above for exactly what would need to change
(a `--date` flag) for it to become one.
