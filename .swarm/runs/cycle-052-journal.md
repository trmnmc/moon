
---

## cycle 52 — 2026-08-16T14:27:23Z — moon — BUILD

work: build-wave k=1 (T-143, S/qa, sonnet) — mutation-sweep `src/render.js` and classify
every survivor. outcome: **1 verified**, 26 mutants swept, 19 killed / 7 survived,
145/145 unchanged, 0 tracked bytes changed, 0 reverted, 0 filed.

gear 1 (crawl), guest mode, dial 0.3, k_cap 1. NO probe attempted: step-1 backoff is in
force (`probe_failures` 3) and `now − last_real_probe_ts` = 1505 s < 1800, so the real
probe is not due; the `PROBE_CMD=false` form is unavailable for the same KI-2 reason the
script is denied in every form. `probe_failures` HELD at 3, not incremented — declining
to probe is not a probe failure. Gear 1 held on fresh disk evidence: `runs/allocator.json`
stamped at the 14:10Z pacer refresh reads weekly_used_pct 99.0, opus_used_pct 97,
week_elapsed_pct 91.34, posture trickle, allow_overall_pct 0, allow_premium_pct 0.
`week_resets_at` 1786942799 IS `stop_at` — there is no later richer window to save for.
Crawl WITH evidence.

control: `bin/swarm-notify.sh poll` was DENIED by the allowlist (KI-2), non-fatal —
continued with file-sourced `pending[]` from `runs/control.json`, which is empty. No
`inject` array present. Nothing to apply.

### What the sweep found

The item's premise was that the most-scrutinised file in the repo is exactly where an
unnoticed gap hides behind the assumption of coverage. Measured, that premise holds.

26 mutants across all five behaviours the acceptance names — disc glyph selection (D1–D4),
limb selection (L1–L5), frame closure (F1–F5), percent formatting (P1–P4), hemisphere
mirroring (H1–H4) — plus four optional probes (O1–O4). 19 killed, 7 survived.

Three survivors are real **HOLEs on the physically reachable cycle**, and they are one
finding rather than three: the suite pins *which glyph family* is chosen and *which side*
it lands on — every mutation of the interior ramp, the handedness, the mirroring, the
frame and the percent field dies, usually to two test files at once — but it does not pin
**where the boundaries between glyph families sit**. That cascade lives at thin crescents,
the visually most fragile part of the render.

    L1  lineArt dark/hairline threshold  cover < 0.02 -> 0.05
        cycleFraction=0.025725 illumination=0.006517 north
          truth : "░░░░▕   1%  waxing crescent"
          mutant: "░░░░░   1%  waxing crescent"
        a lit crescent renders as new — a wrong answer, which this product's own
        pitch says is worse than no answer

    O3  blockArt hairline rescue  cover > 0.02 -> 0.05
        cycleFraction=0.013333 illumination=0.001754 north, renderBlock row 3
          truth : "│          ░░░░░░░░░░░▕          │"
          mutant: "│          ░░░░░░░░░░░░          │"
        the same defect on the framed block. The rescue's own source comment says
        "this row would otherwise read as new" — the comment is right and nothing
        enforces it

    L3  lineArt half/round-limb threshold  cover < 0.88 -> 0.95
        cycleFraction=0.13075 illumination=0.159448 north
          truth : "░░░░◗  16%  waxing crescent"
          mutant: "░░░░▐  16%  waxing crescent"
        blockier limb across a band of the crescent — ugly, not wrong

The one threshold that IS pinned, 0.3 (L2), is pinned by `regressions.test.js` alone.

### VERIFICATION EVIDENCE — T-143

Gate authored by the conductor at verification time, in two parts, both committed
(`cycle-052-gate.js`, `cycle-052-gate2.js`). The builder saw neither.

    baseline, real tree
      node --test test/*.test.js
      tests 145 / pass 145 / fail 0 / cancelled 0 / skipped 0 / todo 0        PASS

    scope check — a measurement item must change nothing
      git diff HEAD --stat  ->  (empty)                                       PASS
      only new untracked files under .swarm/runs/

    sweep re-run by the conductor (node .swarm/runs/c52-sweep.js)
      Baseline inside the harness's own throwaway copy: tests=145 pass=145 fail=0 exit=0
      Total: 26  killed: 19  survived: 7
      survivors: L1 L3 F3 P2 O1 O2 O3                                         PASS
      (harness aborts if its pristine copy is not green, so a red baseline can
       never be miscounted as a killed mutant)

    gate part 1 — two-domain witness search per survivor
      COUPLED   f in [0,1], k=(1-cos 2pi f)/2   step 1/40000 line, 1/1500 +block
      DECOUPLED k in [0,1], cf in {0.25,0.75}   step 1/40000 line, 1/1500 +block
      both hemispheres throughout
      HOLE     (3): L1, L3, O3   — witnesses on the COUPLED cycle, quoted above
      BOUNDARY (4): F3, P2, O1, O2

    gate part 2 — the regions part 1 could not see
      F3  pad = (BLOCK_INNER 32 - BLOCK_COLS 12)/2 = 10; floor(10)===ceil(10)
          -> a no-op for ALL inputs. BOUNDARY proven by arithmetic, not sampled.
      O1  10 witnesses at cf EXACTLY 0.5 with k decoupled:
            cf=0.5 k=0.2 north  truth "◖▒░░░  20%"  mutant "░░░▒◗  20%"
          at the one REACHABLE point (cf=0.5 -> k=1) truth === mutant is true
      O2  6 witnesses outside [0,1):
            cf=1.25 k=0.75      truth "░▓██◗  75%"  mutant "◖██▓░  75%"
      P2  5 witnesses above k=1:  k=1.2 truth "100%" mutant "120%"

    GATE: PASS — all five named behaviours mutated and run; all 7 survivors
    classified with the reasoning that decided each one.

Full output: `.swarm/runs/cycle-052-verify-T-143.txt`,
`cycle-052-verify-T-143-part2.txt`, `cycle-052-sweep-out.txt`. Report:
`.swarm/runs/c52-sweep-report.md`.

### The gate corrected its own first answer

Part 1 returned BOUNDARY for F3, P2, O1 and O2. That verdict was **not earned for three of
the four**, and part 2 exists because the conductor distrusted it: O1 can only differ at
`cycleFraction` exactly 0.5, which part 1's decoupled sweep never visits (it uses
cf ∈ {0.25, 0.75}); O2 only outside [0,1) and P2 only above k=1, and part 1 never leaves
[0,1] in either coordinate. "No witness where I did not look" is not a boundary — it is
precisely the unearned-BOUNDARY failure this run's spec names as the risk. Probed properly,
all three ARE observably different, each by a large margin (a full handedness flip for O1
and O2, a 120% illumination for P2).

They are recorded in a third bucket rather than forced into the item's binary:
**BOUNDARY on the reachable domain, HOLE on the contract domain.** None is reachable from
`astro.js` — verified for O1 at the one reachable point, where truth and mutant render
identically — so no user sees them, and calling them HOLEs would overstate impact. But
`CONTRACTS.md` declares `cycleFraction` and `illumination` to be 0..1 and each mutated line
is a **guard** whose guarding behaviour is the untested part: the handedness decision at the
fraction boundary, the wraparound that makes an out-of-range fraction safe, the clamp that
stops a nonsense illumination printing a nonsense percent. Both halves are on record so a
later reader can act on either.

F3, by contrast, is a boundary in the strong sense — proven, not sampled — with its own
caveat kept attached: it is a boundary of the *current widths*, not of the code. The day
`BLOCK_INNER − BLOCK_COLS` turns odd, F3 becomes a live defect with no test behind it.

### Provenance — the builder delivered half the item

Stated plainly rather than smoothed over, and repeated in the first paragraph of the report
so the file is self-describing.

The agent authored `c52-sweep.js`, and it is good work: 26 well-chosen mutants (plausible
careless edits, not absurd ones), a unique-find assertion so every mutant provably lands
where its label says, pristine-copy-per-mutant discipline so no mutation chains onto
another, `git archive HEAD` snapshots so the real tree is never touched even transiently,
and a baseline-green abort. The conductor re-ran it and it reproduces exactly.

It then returned truncated, off-topic text — "I'll stop manually checking and wait for the
monitor's notification" — with no classification report. Its draft discriminator
(`_scratch-discriminate.js`, kept for the record) has the right *design* — two domains,
witnesses or an explicit no-difference verdict with the step size stated — but sweeps
~400k full `renderBlock` calls per survivor, on the order of 10^10 sub-samples, and does
not terminate in usable time. That is very likely what the return was about.

The item was closed DONE anyway, and the reasoning is recorded as a decision rather than
left implicit. The measurement half — the expensive half — is verified reproduced. The
remaining half was the HOLE/BOUNDARY judgement, and under hard rule 2 the gate has to make
that judgement **independently regardless**: a classification handed over by the builder
would have had to be re-derived before it could be believed, so re-dispatching to obtain
one buys a document, not a fact. At gear 1 with weekly usage at 99 pct that is the wrong
spend. `wave_streak` is reset to 0 so the dispatch earns no k promotion it did not deserve;
`k_current` unchanged at 5 (gear 1 caps the effective wave at 1 regardless); `attempts`
left at 0 because the item closes done, not failed.

The honest cost worth naming: this cycle's central artefact was written by the conductor,
so it carries no independent second opinion. The classifications rest on one set of eyes
and one set of gate scripts, both mine. A reader wanting a second opinion has the harness
and both gates on disk to re-run.

### Backlog

T-143 → done. 5 todo remain: T-144 (args/hemisphere sweep), T-145 (astro sweep),
T-146 (close the highest-value HOLE), T-147 (line-citation re-verification),
T-148 (REPORT.md figure regeneration). Nothing new filed — the sweeps that file
findings are T-144/T-145, and this sweep's findings are input to T-146, recorded in
that item's notes rather than as new items (the run's spec scopes out new work).

T-146's acceptance offered a fallback for "if every survivor across all three sweeps
classified BOUNDARY". That fallback is now dead: L1 is a confirmed reachable HOLE and the
item has a real target, ranked L1 > O3 > L3.

next pick (cycle 53): T-144 at priority 5 (S, qa, sonnet) — mutation-sweep `src/args.js`
and `src/hemisphere.js`. Second of the three sweeps, same shape as this one, and the
harness written this cycle is directly adaptable (swap the catalogue and the mutated
path), which is most of the item's cost already paid. The builder prompt for it should
carry an explicit feasibility constraint on any discrimination sweep — the one lesson this
cycle's dispatch paid for.

next wakeup: 1786891990 (+90s base, verified-value cycle, pacer-fired)
runfile-mirror:
```json
RUNFILE_MIRROR_PLACEHOLDER
```
