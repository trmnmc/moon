
## cycle 54 — 2026-08-16T15:50:17Z — moon — BUILD

work: build-wave k=1 (T-145, S/qa, sonnet) — mutation-sweep the `src/astro.js` behaviors no
named prior battery covered, and classify every survivor. outcome: **1 verified**, 16
mutants swept, 8 killed / 8 survived, all 8 survivors classified BOUNDARY, 145/145
unchanged, 0 tracked bytes changed, 0 reverted, 0 filed. Third and last of the three
sweeps; the measurement phase of this run is now complete.

gear 1 (crawl), guest mode, dial 0.3, k_cap 1. The real probe was NOT due this cycle
(`now − last_real_probe_ts` = 1473 s < 1800), so per the ≥3-failure rule the clock-cruise
form `PROBE_CMD=false bin/swarm-budget.sh` was invoked instead — and was DENIED by the Bash
allowlist like every other invocation of that script since cycle 48 (KI-2). A denied
clock-cruise call is not a real probe attempt, so `probe_failures` HOLDS at 4 and
`last_real_probe_ts` stays 1786892631; the real probe comes due again next cycle. Gear held
on fresh disk evidence: `runs/allocator.json`, restamped by the 15:28Z pacer refresh, reads
weekly_used_pct **100.0** (up from 99.0 last cycle — the file is live and the week is now
fully consumed), opus_used_pct 97, week_elapsed_pct 91.95, posture trickle,
allow_overall_pct 0, allow_premium_pct 0. `week_resets_at` 1786942799 IS `stop_at`, so no
later richer window exists to save for. Guest clamps 1–3; the weekly governor ceiling is 1.
Crawl WITH evidence.

control: `runs/control.json` read directly — `pending[]` empty, `applied[]` empty, no
`inject` array. Nothing to apply. (`bin/swarm-notify.sh poll` remains denied by KI-2;
reading the file is the documented non-fatal fallback.)

craft pack: `bin/swarm-craft.mjs` ran clean, no degraded entries. Nothing from it was passed
to the builder and the item was NOT flagged `craft: "ui"` — every `files_hint` path is
`src/astro.js` / `test/astro.test.js`, moon has no browser surface, and the pack's `ui`
section is entirely about accent colors, border radii, and animation easing. Passing it here
would be noise.

post-merge checks (collision-scan, qa-verify look) SKIPPED with reason: nothing merged. The
wave changed 0 tracked bytes by design — this is a measurement item — so there are no
user-visible merged files to scan and no changed surface to look at.

### The sweep

16 mutants against `src/astro.js`, deliberately outside the T-129 ch.49 correction-table
battery (that ground is already characterized). The acceptance named three behaviors and all
three were hit:

- **(a) phase-instant tolerance window** — IT1 (0.5 → 0.6 d), IT2 (0.5 → 0.49 d, chosen to
  slip between the suite's 11h and 13h hand-picked probes), IT3 (`<=` → `<`), IT4
  (nearest-instant tie-break `<` → `<=`).
- **(b) cycleFraction / phaseAngle independence from illumination** — CI1 (`cycleFraction =
  illumination`), CI2 (mirrored `(360 − phaseAngle)/360`), IL1 (the `Math.abs` fold about
  180° dropped).
- **(c) age as true elapsed time, not a mean-month clamp** — AG1, which re-introduces the
  exact historical bug the `src/astro.js:305-313` comment describes.

Plus LK1 (lunationK seed), ND1/ND2 (normDeg boundaries), EL1/EL2 (single dropped digits in
the eq. 47.2 / 47.4 rate coefficients), DT1 (ΔT constant), NFM1 (`nextFullMoon` rounding),
PN1 (arc→name index off-by-two).

**8 killed, 8 survived, and every survivor classified BOUNDARY — no HOLE found.** After
three sweeps this is the first file to come back with zero holes, and the reason is visible
in the survivor list rather than assumed: five of the eight (IL1, LK1, ND1, ND2, and the
IT4 tie-break) are candidate *equivalent* mutants — changes that provably cannot alter
output — and the remaining three (IT3, EL1, EL2) alter it only below what the module
renders or only at a single exactly-representable point. The builder settled all eight with
computed witnesses rather than argument, including two follow-up full-output diff sweeps
using `Object.is` to catch signed zero. That is the right instrument.

### One correction: IT3's verdict is right, its stated reason is not

IT3 (`isInstantPhase … <= INSTANT_TOLERANCE_DAYS` → `<`) was the sweep's most interesting
survivor, and the builder classified it BOUNDARY on this ground: the divergence is real on
`computeMoon`, but *"the shipped CLI has no `--date`/`--at` flag … the shipped CLI can only
ever query 'now'"*, so no real invocation can reach it.

**That premise is wrong on a checkable fact.** `package.json` declares `"main":
"src/astro.js"` and ships `"files": ["bin/", "src/", "README.md"]`, and
`.swarm/CONTRACTS.md:17` documents `computeMoon(date)` as a public contract with
`isInstantPhase` "true when within tolerance of new/FQ/full/LQ". A module consumer —
`require('moon')` — can pass any Date it likes. The module's reachable domain is not the
CLI's reachable domain, and this run has already ruled the other way once: at cycle 53 HI1
was recorded a HOLE on the contract domain precisely because the suite pins nothing about a
path a consumer can reach, even though a stock CLI host cannot get there.

The verdict nonetheless **stands as BOUNDARY**, on the stronger ground the conductor's own
gate established rather than the one the builder gave:

1. The divergence is genuinely a single millisecond. Walking ±3 ms around the strongest
   in-window witness, exactly one point diverges and every neighbour agrees — this is an
   exact-equality effect (`dist === 0.5` representable exactly), not a window.
2. At exactly `dist === 0.5` days, **nothing documents which answer is correct.** The
   contract says "within tolerance"; both the inclusive and the exclusive reading satisfy
   that sentence. A mutant that produces an undocumented answer at an undocumented point is
   the definition of a boundary, not a hole.

The practical consequence, which is what T-146 needs: IT3 does **not** enter the HOLE
ranking. T-146's ordering is unchanged at **L1 > HI1 > O3 > L3**, and L1 (cycle 52, the
lineArt dark/hairline threshold at thin crescents) remains the only confirmed HOLE that
produces wrong output on a normal run of a stock host.

The builder's report file is left on disk unedited with its reachability argument intact,
exactly as cycle 53 handled the false SIGTERM causal claim: a wrong reason in an evidence
file gets corrected in the record, not quietly overwritten. The correction is here.

### The two named-behavior kills are real AND attributable

A claimed KILL is a claim that a protection exists, and this run's whole premise is that
such claims get checked. The conductor's first gate pass established RED for AG1 and CI1 but
named zero killing tests — it parsed for TAP `not ok` lines while Node 24 defaults to the
spec reporter. "A kill you cannot attribute is not evidence" is this run's own standing
rule, so the gate was re-run with `--test-reporter=tap` rather than left at a bare verdict.
AG1 is caught by the test named for exactly that behavior; CI1 by nine tests including the
cross-consistency one.

### VERIFICATION EVIDENCE — T-145

Conductor's own re-run of the builder's harness (`cycle-054-sweep-out.txt`), independent of
the builder's `c54-sweep-out.txt` — same verdicts, mutant for mutant:

    Total: 16  killed: 8  survived: 8
    IT3   SURVIVED   astro: instant-tolerance comparison <= flipped to <
    IT4   SURVIVED   astro: nearest-quarter-instant tie-break < flipped to <=
    IL1   SURVIVED   astro: illumination fold Math.abs(180 - phaseAngle) dropped
    AG1   KILLED     astro: age re-clamped to SYNODIC_MONTH (the exact historical bug)
    CI1   KILLED     astro: cycleFraction re-derived FROM illumination
    PN1   KILLED     astro: intermediate-arc PHASE_NAMES index off-by-two

Conductor's gate A (`cycle-054-gate-out.txt`) — IT3 reproduced on the public API, and the
±ms walk that settles measure-zero:

    2016-08-02T08:44:38.430Z
      truth : phaseName="new"             isInstantPhase=true
      IT3   : phaseName="waning crescent" isInstantPhase=false
      -> DIVERGES                              witnesses diverging: 3/3

      -1 ms  truth=false it3=false
    * +0 ms  truth=true  it3=false      <- the only divergent point
      +1 ms  truth=true  it3=true

Conductor's gate B/C attribution (`cycle-054-gate2-out.txt`), re-run under
`--test-reporter=tap`:

    AG1 — age re-clamped to SYNODIC_MONTH        killing tests (2):
      astro.test.js :: age reports true elapsed time and is never clamped to the mean lunation
      astro.test.js :: age never exceeds the true maximum lunation length across 60 years
    CI1 — cycleFraction re-derived FROM illumination   killing tests (9):
      astro.test.js :: illumination is 0.5 at the quarters and names them
      astro.test.js :: cycleFraction, age and phaseName stay consistent across a lunation
      ... and 7 more

Tree and suite after the wave:

    $ git -C /opt/targets/moon diff --stat HEAD      # (empty — 0 tracked bytes changed)
    $ node --test test/*.test.js
    ℹ tests 145   ℹ pass 145   ℹ fail 0

### Backlog

T-145 → done. 46 done / 4 todo of 50. Nothing filed: the run's spec forbids writing a test
for anything that is not a confirmed HOLE, and all eight survivors are boundaries. A cycle
that measures a file and correctly adds nothing is a real outcome, not a thin one.

T-146's deps (T-143, T-144, T-145) are now ALL done — it is unblocked for the first time,
and its notes carry the settled ranking plus the IT3 ruling so its builder does not
re-litigate it.

Wave autotune: clean wave — 0 reverts, 0 failed verifies, and the builder ran its sweep in
the foreground as instructed (the failure that cost cycles 52 and 53 a full re-run each did
not recur). `wave_streak` 0 → 1; `k_current` stays 5, promotion needs 2. Gear 1 caps the
effective wave at 1 regardless.

next pick (cycle 55): **T-146** at priority 7 (S, test, sonnet) — close L1, the lineArt
dark/hairline threshold at thin crescents, where a lit crescent renders as new
(`cycleFraction=0.025725 illumination=0.006517 north`, truth `░░░░▕   1%` vs mutant
`░░░░░   1%`). This is the payoff item the three sweeps existed to aim: the first one that
changes shipped behavior rather than measuring it. The builder must prove the new test in
both arms per L-029 — red against the cited mutation, and shown to let that same mutation
survive once the new assertion is removed.

next wakeup: 1786895597 (+90s base, verified-value cycle, pacer-fired)
