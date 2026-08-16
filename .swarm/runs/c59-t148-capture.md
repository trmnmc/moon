# T-148 attempt 2 (cycle 59) — capture

Scope: REPORT.md line 45 only (the illumination-is-real VERIFIED row). No
other REPORT.md figure was re-examined.

## Why attempt 1 was wrong (context, not re-litigated here)

Meeus's worked example 48.a is stated as **1992 April 12.0 TD** (Dynamical
Time). `computeMoon(date)` takes a **UT** instant (src/astro.js:92-94,
`dateToJulianDay`; the `truePhaseJD` doc comment at src/astro.js:105-111
says "on the UT timescale"). Attempt 1 fed the literal UT instant
`Date.UTC(1992, 3, 12)` in as if it already equalled the book's TD instant —
about a minute off the point Meeus actually specifies — and got 0.6802 /
0.6476 instead of the committed 0.6801 / 0.6475. That conclusion was wrong
and was reverted. `.swarm/journal.md` lines 1687-1695 (cycle 32) predicted
this exact failure mode in writing before attempt 1 ran into it.

This attempt converts the book's TD instant to UT before ever calling
`computeMoon`, per `.swarm/runs/c59-meeus-48a-td-probe.js`.

## Delta-T (TT − UT) decision

`src/astro.js`'s own `deltaTDays()` (src/astro.js:96-103) is doc-scoped to
**2005-2050**. 1992 is 13 years outside that window, so calling it here would
extrapolate the very instrument under test — and it isn't exported anyway,
so the probe cannot reach it regardless (public-surface-only constraint).

**Applied**: the historical Espenak/Meeus Delta-T polynomial published
specifically for **1986-2005** (NASA "Polynomial Expressions for Delta T",
https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html), which covers 1992
April squarely inside its fitted domain:

```
t = y - 2000
DeltaT(s) = 63.86 + 0.3345 t - 0.060374 t^2 + 0.0017275 t^3
            + 0.000651814 t^4 + 0.00002373599 t^5
```

For 1992 April 12.0 (decimal year 1992 + 102/366) this gives
**ΔT = 58.548 s**.

**Alternative considered, not applied**: `src/astro.js`'s own 2005-2050
polynomial, evaluated out-of-domain at the same instant, gives
**ΔT = 60.765 s** — about 2.2 s more than the historical value. This was
computed by the probe script too (clearly labeled "comparison only, not
applied") specifically to check sensitivity. Result: it changes the
full-precision illumination in the 6th decimal place (0.68013670 vs
0.68013391) and does **not** change either 4-decimal figure — both ΔT
choices round to 0.6801 / 0.6475. So the decision between the two candidate
ΔT values does not matter for this figure, but the historical polynomial was
still the correct one to apply on domain grounds (in-domain vs. a 13-year
extrapolation of the module's own instrument).

## Command and verbatim stdout

Command:
```
cd /opt/targets/moon && node .swarm/runs/c59-meeus-48a-td-probe.js
```

Verbatim stdout:
```
=== APPLIED: historical 1986-2005 Espenak/Meeus Delta T ===
Meeus 48.a TD instant (nominal Date.UTC) = 1992-04-12T00:00:00.000Z
JD (TD)                                   = 2448724.5
Delta T applied (s)                       = 58.54795211315953
JD (UT, after TD->UT conversion)          = 2448724.499322362
UT instant fed to computeMoon()           = 1992-04-11T23:59:01.452Z

module illumination (full precision)      = 0.6801366983212301
module illumination (4dp)                 = 0.6801
age-derived fake (full precision)         = 0.6474878439322895
age-derived fake (4dp)                    = 0.6475

=== COMPARISON ONLY (NOT applied): src/astro.js deltaTDays() polynomial, extrapolated out-of-domain to 1992 ===
Delta T this alternative would apply (s)  = 60.76544582194132
resulting illumination (full precision)   = 0.6801339112425012
resulting illumination (4dp)               = 0.6801
resulting age-derived fake (4dp)            = 0.6475
```

## Verdict

**REPRODUCES.** The committed REPORT.md figures **0.6801** (module
illumination) and **0.6475** (age-derived fake) both reproduce exactly at
4 decimal places once the TD→UT conversion is applied correctly, and the
result is insensitive to which of the two defensible Delta-T values is used.

Per the decision rule for this item: figures reproduce → **no edit made to
REPORT.md**.

Suite status after this run: `node --test test/*.test.js` → 147/147 pass,
0 fail. `git status --porcelain` shows only the two new files this item was
scoped to add (this probe script and this capture file) plus unrelated
concurrent artifacts already present in `.swarm/runs/` at the time of this
run (`c59-gate-48a.js`, `c59-hb.py`) that this item did not create and did
not touch.

## NOT-RERUNNABLE figures (recorded, not re-derived)

REPORT.md figures 3, 6b and 7 are **NOT-RERUNNABLE**: no script and no
journal record exists that would let a later attempt reproduce them. This
classification was already checked (per the task brief for this item) and is
correct; it is recorded here for the record, not re-derived by this attempt.
This capture makes no claim about those figures beyond noting their status.
