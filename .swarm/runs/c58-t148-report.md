# T-148 (cycle 58) — regeneration of REPORT.md's pasted command-output figures

Method: for each figure, find the underlying command (reusing an existing `.swarm/runs/`
script wherever one exists, per the item's instruction), rerun it today against the
CURRENT tree, capture raw stdout to a `c58-*-out.txt` file, and classify REPRODUCES /
DIFFERS / NOT-RERUNNABLE. Every script and capture referenced below lives in
`/opt/targets/moon/.swarm/runs/` with a `c58-` prefix (reused scripts are cited by their
original name; a couple were copied byte-for-byte from `cycle-046`/`cycle-047`, only the
`c58-*-out.txt` capture is new for those).

---

## 1. Lunation lengths: 29.274–29.826 days / 864 lunations / 1990–2060 / 13.2h spread

- **REPORT.md (before):** "Lunation lengths span **29.274–29.826 days** across 864
  lunations, 1990–2060 (13.2h spread; ...)."
- **Underlying command:** no prior `.swarm/runs/` script existed that *prints* this
  measurement — the only place it lives is `test/astro.test.js:410-477`
  ("measured lunation length and new->full interval over 1990-2060 match the documented
  figures"), which only *asserts* against `DOCUMENTED_MIN/MAX_LUNATION_DAYS` and never
  logs the numbers. `.swarm/runs/c58-lunation-newfull-measure.js` reproduces that test's
  algorithm verbatim (same 1990-01-01..2060-01-01 window, same 6h coarse scan + ms
  bisection on the `age` discontinuity, same public `computeMoon`/`nextFullMoon` API) and
  prints the raw values instead of only asserting.
- **Command run:** `node .swarm/runs/c58-lunation-newfull-measure.js`
- **Fresh capture:** `.swarm/runs/c58-lunation-newfull-out.txt`
  ```
  new-moon instants found: 865
  lunation intervals: 864
  lunation min (days): 29.274
  lunation max (days): 29.826
  lunation spread (hours): 13.3
  ```
  Full-precision check (not part of the saved capture, run inline to resolve the
  rounding boundary): min = 29.274360856481483, max = 29.826448229166665,
  spread = (max-min)*24 = 13.250096944...h — unambiguously rounds to **13.3h**, not
  13.2h. (29.826-29.274)*24, computed from the already-*rounded* 3-decimal display
  values, gives 13.248h -> 13.2h — that is a rounding-of-a-rounding artifact, not what a
  fresh full-precision measurement shows.
- **Classification: DIFFERS** (spread-hours clause only; min/max/864 all REPRODUCE
  exactly, within the test's own <0.001 tolerance).
- **Before/after REPORT.md text (L42):**
  - Before: `...across 864 lunations, 1990–2060 (13.2h spread; a measured lower bound...`
  - After: `...across 864 lunations, 1990–2060 (13.3h spread; a measured lower bound...`

## 2. 2000-01-06 new moon: computed 18:15 UTC vs published 18:14; mean formula 14:20

- **REPORT.md:** "True new moon of 2000-01-06 computed **18:15 UTC** vs published 18:14.
  The mean formula lands at 14:20 — nearly 4h off."
- **Underlying commands:**
  - True-instant part: `.swarm/runs/cycle-029-anchor-measure.js` (pre-existing, reused
    unmodified) — three independent bisections off the public API, including the exact
    method `test/astro.test.js:63-72` uses.
  - Mean-formula part: no prior script existed. `.swarm/runs/c58-mean-formula-2000-measure.js`
    evaluates `src/astro.js`'s own `MEAN_PHASE_EPOCH` constant (2451550.09766, "JDE of the
    k=0 mean new moon (49.1)") through `src/astro.js`'s own `deltaTDays` TT->UT formula,
    copied verbatim (with a self-check that the copied lines still match the live source
    text) — no new astronomy, only the source's existing mean-epoch constant evaluated
    with zero ch.49 periodic corrections, which is what "mean-formula-only" means.
- **Commands run:**
  `node .swarm/runs/cycle-029-anchor-measure.js`,
  `node .swarm/runs/c58-mean-formula-2000-measure.js`
- **Fresh captures:** `.swarm/runs/c58-anchor-2000-measure-out.txt`,
  `.swarm/runs/c58-mean-formula-2000-out.txt`
  ```
  M2 cycleFraction-wrap bisection : 2000-01-06T18:15:22.785Z (test/astro.test.js:63-72 method)
  M3 illumination-minimum search  : 2000-01-06T18:15:22.789Z (ch.48 series, independent of M1/M2)
  ...
  mean new moon, TT->UT converted:  2000-01-06T14:19:34.899Z
  rounds to UTC minute: 14:20
  ```
- **Classification: REPRODUCES.** Both the 18:15 figure (via the test suite's own
  bisection method) and the 14:20 mean-formula figure reproduce exactly. No change.

## 3. Meeus worked examples 49.a and 49.b to 0.23s and 0.34s

- **REPORT.md:** "Independent audit reproduced Meeus **worked examples 49.a and 49.b to
  0.23s and 0.34s**."
- **Underlying command: NONE FOUND.** `.swarm/backlog.json` / `.swarm/runs/cycle-032-file-item.py`
  document this explicitly (T-129's own filing note): "That audit happened once, by hand,
  at v0.1.0; grep over test/ for 49.a / 49.b / 0.23 / 0.34 / 'worked example' returns ZERO
  hits, so nothing re-runs it." Re-confirmed today: grepping the whole `.swarm/runs/` tree
  and `test/` for `0.23`/`0.34` (excluding unrelated `0.230`/`0.235`/`0.236` matches) turns
  up only that same filing note describing the absence, never a computation. T-129's later
  test (`test/astro.test.js:608`, "ch.49 correction-table characterization pins") pins
  different instants (year 2150, exact milliseconds) as a change-detector; it does not
  reproduce the 49.a/49.b worked-example comparison this figure names.
- **Classification: NOT-RERUNNABLE.** The command that produced 0.23s/0.34s was a
  one-time hand computation against the book's worked examples at v0.1.0, with no script,
  test, or captured intermediate value left behind. Reconstructing "Meeus example 49.a/
  49.b" from memory and comparing against a freshly-typed reference time would be exactly
  the fabricated-derivation failure mode this item exists to avoid — a different
  derivation could easily disagree with the original 0.23s/0.34s for reasons that have
  nothing to do with drift. REPORT.md left unedited.

## 4. Meeus 48.a: module 0.6801 (book 0.6786); age-derived fake 0.6475

- **REPORT.md:** "At Meeus example 48.a the module gives **0.6801** (book: 0.6786); an
  age-derived fake gives 0.6475."
- **Underlying command:** the "LIVE 48.a PROBE" embedded in
  `.swarm/runs/cycle-032-illum-mutants.py` (lines 134-149) — `computeMoon` at
  1992-04-12T00:00:00Z (Meeus example 48.a), plus the same age-derived-fake formula.
  `.swarm/runs/c58-meeus-48a-probe.js` extracts that read-only probe verbatim (same
  instant, same fake formula) so it can be rerun without touching/mutating/restoring
  `src/astro.js` (the parent script also runs an unrelated mutation battery).
- **Command run:** `node .swarm/runs/c58-meeus-48a-probe.js`
- **Fresh capture:** `.swarm/runs/c58-meeus-48a-out.txt`
  ```
  48.a illumination   = 0.6802
  48.a phaseAngle deg = 111.1260
  48.a age days       = 8.7906
  age-derived fake    = 0.6476
  ```
  Full precision: illumination = 0.6802102655457174, fake = 0.6475567248850106 — both
  unambiguously round to 0.6802 / 0.6476 at 4dp, not 0.6801 / 0.6475. Deterministic and
  reproducible across repeated runs (Node v24.19.0).
- **Classification: DIFFERS.** The module's live output (and the fake it is compared
  against) now differ by 0.0001 from the pasted figures. The book value (0.6786) is
  memory-sourced, not recomputed, and is left unchanged.
- **Before/after REPORT.md text (L45):**
  - Before: `...the module gives **0.6801** (book: 0.6786); an age-derived fake gives 0.6475.`
  - After: `...the module gives **0.6802** (book: 0.6786); an age-derived fake gives 0.6476.`

## 5. new→full interval: 13.906–15.613 days / 865 intervals / 1990–2060 / mean 14.765

- **REPORT.md:** "new→full interval spans **13.906–15.613 days** across 865 intervals
  measured over 1990–2060 (mean **14.765** vs theoretical 14.765)."
- **Underlying command:** same as figure 1 — `test/astro.test.js:410-477`'s new->full half,
  reproduced by `.swarm/runs/c58-lunation-newfull-measure.js` (reuses the exact 865
  new-moon instants found for figure 1, feeds each through the public `nextFullMoon` API,
  exactly as the test does).
- **Command run:** `node .swarm/runs/c58-lunation-newfull-measure.js`
- **Fresh capture:** `.swarm/runs/c58-lunation-newfull-out.txt`
  ```
  new->full intervals: 865
  new->full min (days): 13.906
  new->full max (days): 15.613
  new->full mean (days): 14.765
  theoretical half-synodic (days): 14.765
  ```
- **Classification: REPRODUCES** exactly. No change.

## 6. Hemisphere table: all 418 zones / 24 zones independently probed

- **REPORT.md:** "Builder validated against **all 418 zones** in the host IANA database by
  reference latitude; conductor independently probed 24 zones including every one the
  builder flagged as unsure."
- **418-zones part — underlying command:** `test/hemisphere.test.js:327-346` ("the static
  table agrees with every zone in the host tz database") — asserts `mismatches` is empty
  and `zones.size > 300`, but never prints the exact size. `.swarm/runs/c58-hemisphere-zones-measure.js`
  reproduces `loadIanaLatitudes()` verbatim from that test and prints the raw counts.
  - Command: `node .swarm/runs/c58-hemisphere-zones-measure.js`
  - Fresh capture (`.swarm/runs/c58-hemisphere-zones-out.txt`):
    ```
    total IANA zones (zone1970.tab + zone.tab union): 418
    mismatches: 0
    ```
  - **Classification: REPRODUCES** exactly (418 zones, 0 mismatches). No change.
- **"24 zones independently probed" part — underlying command: NONE FOUND.** This is a
  distinct sub-claim (a manual conductor cross-check, separate from the builder's
  automated 418-zone test). Searched `.swarm/journal.md`, `.swarm/backlog.json`, and every
  `.swarm/runs/*` script for "24 zone", "independently probed", "flagged as unsure" — no
  hits. The scripts that DO probe the tz database independently
  (`.swarm/runs/cycle-031-tzoracle.mjs`, `cycle-031-tzoracle2.mjs`) sweep the FULL
  zone.tab/zone1970.tab union (hundreds of zones), not a 24-zone subset, so they are not
  faithful reruns of this specific sub-claim.
  - **Classification: NOT-RERUNNABLE.** Which 24 zones, and by what method, is not
    recoverable from anything left in the repo; guessing a set of 24 "unsure-flagged"
    zones would be exactly the fabricated-derivation failure mode to avoid. REPORT.md left
    unedited for this clause.

## 7. Timezone/DST: 30 zones × 11,688 instants: 0 mismatches; America/St_Johns 13s

- **REPORT.md:** "30 zones × 11,688 instants: **0 mismatches**. Tightest case found:
  `America/St_Johns`, full moon 13 seconds after local midnight — correct."
- **Underlying command: NONE FOUND.** Searched the entire repo (`test/*.js`, all of
  `.swarm/runs/`, `.swarm/journal.md`, `.swarm/backlog.json`, README.md) for "11688",
  "11,688", "St_Johns" combined with a 30-zone sweep, and for any DST/timezone-instant
  test in `test/hemisphere.test.js`, `test/cli.test.js`, `test/regressions.test.js`,
  `test/astro.test.js`. `St_Johns` appears only in REPORT.md itself, in
  `.swarm/runs/cycle-032-gate-controls.py` (a 4-zone ambient-timezone control for a
  different item, T-129, not a 30-zone/11,688-instant DST sweep), and in `.swarm/journal.md`
  narrative text unrelated to this figure. "11688"/"11,688" appears nowhere else at all.
- **Classification: NOT-RERUNNABLE.** No script, test, or record specifies which 30
  zones, which date range, or what instant-generation scheme produced exactly 11,688
  instants. This reads as a one-time build-run-era check (predating the `.swarm/runs/`
  cycle convention) whose parameters were never captured. Authoring a new 30-zone/11,688-
  instant sweep from scratch would be a different derivation, not a rerun, and could
  disagree with the original for reasons unrelated to drift. REPORT.md left unedited.

## 8. 28 checks over the real binary; hemisphere check parses README's 15-row table

- **REPORT.md:** "28 checks over the **real binary**... the hemisphere check parses
  README's own north\|south table (15 rows)... Zero divergences."
- **Underlying command:** `.swarm/runs/cycle-046-e2e-qa.js` (T-141's conductor-authored
  end-to-end QA harness — real binary via `spawnSync`, expectations hand-derived from
  README), reused unmodified.
- **Command run:** `node .swarm/runs/cycle-046-e2e-qa.js`
- **Fresh capture:** `.swarm/runs/c58-e2e-qa-out.txt`
  ```
  PASS C0  README north|south table yields a CONSISTENT mirror map (derived, not assumed)
         15 rows, map: ...
  ...
  === SUMMARY: 28/28 checks passed ===
  ```
- **Classification: REPRODUCES** exactly (28/28, 15 rows). No change.

## 9. Ten mutants, nine killed, one survived

- **REPORT.md:** "Ten mutants, each breaking one documented end-to-end behavior, run
  against the suite in throwaway copies with a green baseline. **Nine killed.** The tenth
  (`--help`'s precedence over `--json`) survived, was filed as T-142, and is now pinned —
  see below."
- **Underlying command:** `.swarm/runs/cycle-046-mutants.js` (the failability battery for
  the T-141 harness — 10 named mutants, M1..M10), reused unmodified, run against the
  CURRENT tree (which now includes T-142's fix, landed at cycle 47).
- **Command run:** `node .swarm/runs/cycle-046-mutants.js`
- **Fresh capture:** `.swarm/runs/c58-e2e-mutants-out.txt`
  ```
  M6  KILLED  — expected C20 got C20
  ...
  === MUTATION SUMMARY ===
  applied mutants: 10/10   survivors/partials: 0   not-applied: 0
  ```
- **Classification: DIFFERS.** M6 (`--help`'s precedence over `--json`) is now KILLED,
  not surviving — because T-142's fix (bin/moon.js checks `opts.help` before `opts.json`,
  and `test/cli.test.js` now pins the precedence) landed after this battery was
  originally run at cycle 46. Rerunning the identical, unmodified battery today gives
  10/10 killed, 0 survivors. This is the expected, correct consequence of T-142 having
  been fixed — not drift — but the pasted "nine killed... survived" figure is no longer
  what today's rerun shows, so per the item's rule it must be corrected from the fresh
  capture while keeping the historical record intact.
- **Before/after REPORT.md text (L54):**
  - Before: `(cycles 46–47) | Ten mutants... Nine killed. The tenth (...) survived, was
    filed as T-142, and is now pinned — see below.`
  - After: `(cycles 46–47, re-run cycle 58) | Ten mutants... At cycles 46–47, nine were
    killed; the tenth (...) survived, was filed as T-142, and was fixed at cycle 47 — see
    below. Re-run cycle 58 against the current tree with the identical, unmodified
    battery: all ten are killed, zero survive — T-142's fix now closes the escape the
    original battery found.`

## 10. Two scratch copies: 145/144/1 fail (present) vs 144/144 (removed)

- **REPORT.md:** "Two scratch copies, both mutated identically: with the new test present
  the suite reads 145 tests / 144 pass / **1 fail** (that test); with the new test removed
  it reads **144/144 green**, i.e. the mutant survives."
- **Underlying command:** `.swarm/runs/cycle-047-gate.mjs` (the T-142 conductor
  verification gate — stages two full scratch copies under `/opt/swarm/runs/c47-gate`,
  applies the M6 mutation to both, removes the new test from copy B only), reused
  unmodified.
- **Command run:** `node .swarm/runs/cycle-047-gate.mjs`
- **Fresh capture:** `.swarm/runs/c58-t142-scratch-arms-out.txt`
  ```
  --- A: working tree + M6 (new test present) ---
  tally:  ℹ tests 147 | ℹ pass 146 | ℹ fail 1
  failed: ✖ --help wins over --json regardless of flag order: help text, not the JSON payload

  --- B: M6 + new test REMOVED (9 lines cut) ---
  tally:  ℹ tests 146 | ℹ pass 146 | ℹ fail 0

  GATE: A kills M6 = true ; B lets M6 survive (attribution) = true
  VERDICT: PASS
  ```
- **Classification: DIFFERS.** This is exactly the "different suite size" case the item
  anticipates: the suite has grown from 145 to 147 tests since cycle 47 (unrelated work
  added two tests elsewhere), so arm A now reads 147/146/1 fail and arm B reads 146/146,
  not 145/144/1 and 144/144. The PATTERN (N total / N-1 pass / 1 fail with the test
  present; (N-1)/(N-1) green with it removed) reproduces exactly — only N shifted, which
  is a faithful rerun against a suite of a different size, not a broken measurement. I
  repaste the new counts and keep the cycle-47 counts as historical context rather than
  discarding them.
- **Before/after REPORT.md text (L55):**
  - Before: `(cycle 47) | Two scratch copies... the suite reads 145 tests / 144 pass / 1
    fail (that test); with the new test removed it reads 144/144 green...`
  - After: `(cycle 47, re-run cycle 58) | Two scratch copies... the suite reads 147 tests
    / 146 pass / 1 fail (that test); with the new test removed it reads 146/146 green...
    (At cycle 47, when the suite carried 145 tests, the same script read 145/144/1 fail
    and 144/144.)`

## 11. REPORT.md:142 — "145/145 green" (outside the VERIFIED table)

- **REPORT.md:** "...KI-5 (render.test.js:629), 145/145 green, no `dependencies` key."
- **Underlying command:** `node --test test/*.test.js`.
- **Command run:** `node --test test/*.test.js`
- **Fresh capture:** `.swarm/runs/c58-suite-count-out.txt`
  ```
  ℹ tests 147
  ℹ pass 147
  ℹ fail 0
  ```
- **Classification: DIFFERS.** The suite is 147 tests, all passing, not 145.
- **Before/after REPORT.md text (L142):**
  - Before: `...KI-5 (render.test.js:629), 145/145 green, no dependencies key.`
  - After: `...KI-5 (render.test.js:629), 145/145 green at the time (147/147 re-run
    against the current tree at cycle 58, T-148), no dependencies key.`

---

## Summary

| # | Figure | Classification |
|---|---|---|
| 1 | Lunation lengths 29.274–29.826d / 864 / 13.2h spread | DIFFERS (spread only: 13.2h → 13.3h) |
| 2 | 2000-01-06 18:15 UTC vs published 18:14; mean 14:20 | REPRODUCES |
| 3 | Meeus 49.a/49.b to 0.23s/0.34s | NOT-RERUNNABLE |
| 4 | Meeus 48.a: 0.6801 (book 0.6786); fake 0.6475 | DIFFERS (0.6801→0.6802, 0.6475→0.6476) |
| 5 | new→full 13.906–15.613d / 865 / mean 14.765 | REPRODUCES |
| 6 | Hemisphere: 418 zones / 24 independently probed | REPRODUCES (418) / NOT-RERUNNABLE (24) |
| 7 | 30 zones × 11,688 instants, St_Johns 13s | NOT-RERUNNABLE |
| 8 | 28 checks, 15-row README table | REPRODUCES |
| 9 | Ten mutants, nine killed, one survived | DIFFERS (now 10/10 killed — T-142 fixed) |
| 10 | Scratch copies 145/144/1 fail vs 144/144 | DIFFERS (now 147/146/1 fail vs 146/146) |
| 11 | REPORT.md:142 "145/145 green" | DIFFERS (now 147/147) |

Final suite state after all corrections: **147/147 tests green**
(`.swarm/runs/c58-suite-count-out.txt`).
