# CONDUCTOR VERIFICATION GATE — cycle 58, T-148

Authored at verification time. The builder never saw these checks. Every verdict below
rests on a command **the conductor ran**, not on the builder's `c58-t148-report.md`.

## Verdict: **FAIL** (one figure of eleven)

Ten of the builder's eleven verdicts are independently confirmed. One — figure 4 — is a
**regression**: it replaced two *correct* figures with artifacts of a wrong-time-frame
probe, in the one table whose preamble claims conductor verification.

---

## Figure 4 — the failure. Meeus 48.a illumination.

The builder reclassified `0.6801`/`0.6475` as DIFFERS and edited them to `0.6802`/`0.6476`,
on the strength of `c58-meeus-48a-probe.js`, which evaluates `Date.UTC(1992, 3, 12)`.

**Meeus example 48.a is stated as 1992 April 12.0 TD (Dynamical Time); `computeMoon` takes
UT.** The naive `Date.UTC` probe therefore evaluates the module ~58.3 s away from the
instant the book specifies.

Conductor's own two-frame re-derivation:

```
$ node -e "... computeMoon at Date.UTC(1992,3,12) and at that minus 58.3 s ..."
naive UTC 1992-04-12.0       illum= 0.68021027 -> 0.6802 | age= 8.790628 | fake= 0.64755672 -> 0.6476
TD->UT, dT=58.3s (cycle 32)  illum= 0.68013701 -> 0.6801 | age= 8.789953 | fake= 0.64748814 -> 0.6475
```

The TD-corrected frame reproduces **both** published figures exactly at 4 dp — the
illumination *and* the independently-derived age-fake. Two figures landing right together
is not a coincidence: REPORT.md's numbers were produced in the TD frame, and they are
correct as committed. The book's own 0.6786 does not discriminate between the frames (both
sit ~0.0015 from it), which is exactly why the frame has to be reasoned about rather than
eyeballed.

This is a **recurrence of an error this repo already caught and recorded**, verbatim.
`.swarm/journal.md:1687-1695` (cycle 32) reads:

> (b) A CLAIMED DOC ERROR THAT WAS MY OWN FRAME SLIP. The same probe printed 0.6802 at
> Meeus 48.a where both README and REPORT say 0.6801 … Meeus 48.a is 1992 April 12.0 TD and
> computeMoon takes UT; correcting for DeltaT (~58.3 s in 1992) gives 0.68013613 -> 0.6801,
> matching both documents exactly, while my naive Date.UTC probe's 0.68021027 -> 0.6802 was
> the artifact. **Had I filed it, a builder would have been dispatched to "correct" a
> correct number in the one table whose preamble claims conductor verification.**

That prediction came true this cycle. The hazard is now structural: the wrong-frame probe
is sitting in this directory as `c58-meeus-48a-probe.js`, where the next builder will grep
it, rerun it, and reproduce the same false correction. **That file must not be reused. Any
48.a probe must subtract ΔT (~58.3 s for 1992) before calling `computeMoon`.**

## Figures independently CONFIRMED (conductor-run)

**Figure 1 — 13.2h → 13.3h spread: CORRECT.** The old figure was rounded *from the rounded
pair* (29.826 − 29.274 = 13.2480 h → 13.2). Measured at full precision under three
independent conventions (`c58-gate-spread.js`) — the builder's bisection, cycle-027's
bisection, and a 3 h coarse step — all agree:

```
$ node .swarm/runs/c58-gate-spread.js
convention B (builder, 6h coarse)  : n=864 min=29.274361 max=29.826448 spread=13.2501 h -> 1dp 13.3 | spread from the PUBLISHED 3dp pair = 13.2480 h
convention A (cycle-027, 6h coarse): n=864 min=29.274361 max=29.826448 spread=13.2501 h -> 1dp 13.3 | spread from the PUBLISHED 3dp pair = 13.2480 h
convention B, 3h coarse            : n=864 min=29.274361 max=29.826448 spread=13.2501 h -> 1dp 13.3 | spread from the PUBLISHED 3dp pair = 13.2480 h
```

13.2501 sits 0.0001 h above the 13.25 rounding boundary — tight, but robust: the ±1 ms
bisection resolution moves it by ~6e-7 h, four orders of magnitude below the margin, and
the coarse step does not move it at all.

**Figure 9 — "Nine killed" → all ten killed: CORRECT.** Conductor reran the *unmodified*
cycle-46 battery:

```
$ node .swarm/runs/cycle-046-mutants.js
  M1  KILLED … M10  KILLED
applied mutants: 10/10   survivors/partials: 0   not-applied: 0
```

Source restored byte-identical afterwards (`git status --porcelain -- src test package.json
README.md` → empty).

**Figure 10 — scratch arms 145/144/1 & 144/144 → 147/146/1 & 146/146: CORRECT.** Conductor
reran the cycle-47 attribution gate itself:

```
$ node .swarm/runs/cycle-047-gate.mjs
--- A: working tree + M6 (new test present) ---
tally:  ℹ tests 147 | ℹ pass 146 | ℹ fail 1
--- B: M6 + new test REMOVED (9 lines cut) ---
tally:  ℹ tests 146 | ℹ pass 146 | ℹ fail 0
GATE: A kills M6 = true ; B lets M6 survive (attribution) = true
VERDICT: PASS
```

**Figure 11 — `145/145 green` → `147/147`: CORRECT.**

```
$ node --test test/*.test.js
ℹ tests 147
ℹ pass 147
ℹ fail 0
```

**Figures 3, 6b, 7 — NOT-RERUNNABLE: honest, spot-checked.** Figure 3 (Meeus 49.a/49.b to
0.23s/0.34s) is corroborated by cycle 32's own finding (c): that audit ran once by hand at
v0.1.0 and appears in no test. Figure 7 ("30 zones × 11,688 instants") — conductor grepped
`*.js *.py *.mjs *.txt` repo-wide for `11688|11,688|30 zones|St_Johns`; the only hit is
`cycle-032-gate-controls.py:36`, a **four**-zone list, not the sweep. Figure 6's "24 zones
independently probed" has no script and no journal hit. All three were correctly left
untouched. An honest not-run is the right outcome; a fabricated reproduction is the defect
this run exists to remove.

**Figures 2, 5, 8 — REPRODUCES, unchanged.** Figure 5 additionally cross-checked: the
conductor's rerun of `cycle-027-conductor-measure.js` gives 1990-2060 min 29.2744 / max
29.8264 over 864 intervals, matching the row.

---

## Disposition

- **T-148 → `todo`, `attempts` 0 → 1.** Acceptance is not met: one figure's regeneration was
  invalid, so that figure is not re-verified.
- **The four independently-confirmed corrections are KEPT** (figures 1, 9, 10, 11). They do
  not rest on the builder's report — each is backed by conductor-run output pasted above.
  Reverting them would knowingly restore four figures this gate has just *proven false* to a
  document whose entire purpose is doc truth. That is the opposite of the cycle-7/cycle-10
  precedent's intent: those reverts refused conductor-authored *replacement prose*, and
  nothing here is conductor-authored.
- **The figure-4 hunk is reverted to its committed HEAD text** — a restoration of bytes
  already in the repository, not an edit the conductor wrote.
- The retry is scoped to figure 4 alone.
