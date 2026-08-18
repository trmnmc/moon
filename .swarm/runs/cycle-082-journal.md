
## cycle 82 | 2026-08-18T00:57:53+00:00 | moon | BUILD

work: build-wave k=1 — **T-176**, pinning the cross-surface visibility boundary between
  `renderLine` and `renderBlock` as deliberate. Test-only by acceptance; `src/` forbidden.
outcome: **VERIFIED**, 0 reverted. Suite 165/165 conductor-run. Four `T-176:*` tests added,
  both surfaces killed in two arms each with CONDUCTOR-CHOSEN mutations. With this the backlog
  holds ONE todo, T-175, which this run's own record forbids building.

gear: 2, held. The real probe was NOT due (`last_real_probe_ts` 590 s old at cycle open, inside
  the 1800 s window), so `bin/swarm-budget.sh` was correctly not invoked: `probe_failures` stays
  12 and this cycle adds no new KI-2 datapoint. The interesting event is on the other instrument —
  the pacer refreshed `runs/allocator.json` 6 s before cycle open and the refresh FAILED, leaving
  `ok:false, source:"none"` and the hardcoded fallback: posture `trickle`, every percentage 0, and
  `allow_premium_pct` **10 — HIGHER than the real 8.962 posture it replaced**, which is the tell
  that it is a sentinel rather than a measurement. Read literally, `weekly_used 0 pct` computes a
  cold weekly, disengages the governor and promotes the gear. That is reading an error sentinel as
  data, so it was refused. Governing evidence is the last REAL reading, 23 min old and labelled
  STALE in the runfile: cycle 81's `weekly_used 18.0 pct` at `week_elapsed 11.49 pct`, heat
  1.5666 — the third of three monotonically increasing readings, all far over the 1.3 trigger.
  Weekly usage cannot fall except at a week reset, and a failed probe is not evidence of a reset.
  Ceiling 2, promote BLOCKED, window rho still UNMEASURED, evidence rule lands cruise 3, governor
  clamps to 2.

control: `bin/swarm-notify.sh poll` ran clean from cwd=/opt/swarm; `control.json` has
  `pending: []`, `applied: []`, no `inject` array. Nothing to apply.

craft pack: `bin/swarm-craft.mjs` returned `degraded: []`. T-176 was NOT flagged `craft: "ui"` —
  the only file in scope is `test/render.test.js` and moon has no browser surface.

### VERIFICATION EVIDENCE — T-176 (gate `.swarm/runs/cycle-082-gate.mjs`, full output `.swarm/runs/cycle-082-verify-T-176.txt`)

```
PASS  G2-scope    changed = ["test/render.test.js"]
PASS  G1-suite    node --test exit=0            (165/165 in the real repo, conductor-run)
PASS  G3-band     re-measured firstBlock=0.0006895 firstLine=0.006516 (width 0.00583)
PASS  LINE: lineArt outer-cell cut 0.02 -> 0.0001  [attribution] pre-cycle suite exit=0 (survives)
PASS  LINE: lineArt outer-cell cut 0.02 -> 0.0001  [failability] exit=1; killed-by-new-test=
      ["T-176: still inside the band at k=0.006, renderLine stays dark ..."]
PASS  BLOCK-b: rescue gated to k .ge. 0.0015      [attribution] pre-cycle suite exit=0 (survives)
PASS  BLOCK-b: rescue gated to k .ge. 0.0015      [failability] exit=1; killed-by-new-test=
      ["T-176: inside the band, renderLine reports a dark \"0%\" disc while renderBlock is
        visibly lit on every row"]   <- the ONLY failing test: a clean, single-test attribution
PASS  G7-label    an added test asserts the 0% label inside the band
PASS  G8-caveat   the added lines carry a BOUNDARY-not-HOLE classification
--- GATE VERDICT: PASSED ---
```

The band figure is the conductor's OWN re-measurement, taken straight from `src/render.js` rather
than from the builder or from cycle 81: firstBlock 0.0006895, firstLine 0.006516. It confirms the
taste pass's 0.0007 / 0.00655 to within the probe's step size.

### The gate failed three of its own checks first, and the instrument was corrected, not the bar

First run: `GATE FAILED` on G1, G3, G8. All three were defects in MY gate, and the diagnosis
mattered more than the verdict — an uncorrected instrument would have sent a correct item back to
`todo` with `attempts+1`, and the next attempt would have been asked to fix work that was never
broken.

1. **G1 / both attribution arms** — the gate copied the working tree with a filter that excluded
   `.swarm/`, and `test/contracts.test.js` reads `.swarm/CONTRACTS.md` at module load. Every
   scratch tree therefore failed for a reason unrelated to the claim. Caught because the real
   `test_cmd`, run by hand in the actual repo, printed `165/165 pass` while the gate printed
   `exit=1` — two instruments disagreeing, which is the only reason to look.
2. **G3** — the band probe scanned every row of the framed block, so the caption row's letters
   (`waxing crescent`) counted as lit and it reported `firstBlock = 0` at every k. Corrected to
   scan the five disc rows only.
3. **G8** — tested BOUNDARY-word novelty file-wide (`absent before && present after`), which could
   never pass: the pre-cycle file already used the word at line 770. Corrected to check the ADDED
   lines for the classification AND its resolution argument.

Named for what it is, because the distinction is the whole point: correcting an instrument that
measures the WRONG THING is not the same act as weakening a gate to let work through (step 6.5).
The bar did not move — `src/` untouched, suite green, both surfaces killed in two arms. What
changed is that the gate now measures those things instead of measuring whether `CONTRACTS.md`
happened to exist in a temp directory. Same family as cycle 81's renderer-assertion find, and the
same remedy: assert that the measurement actually happened; never infer it from the absence of an
error.

### The block arm needed a mutation the conductor had to derive, not borrow

The conductor's first-choice block mutation — disable the `allDark` hairline rescue outright — is
already killed by three pre-existing `renderBlock` contiguity tests. It can prove failability but
never ATTRIBUTION: a mutant the old suite already kills says nothing about the new pin. Two cheap
exits were available and both were refused. Accepting a one-armed block case would have quietly
downgraded L-029 on the run whose entire premise is that a kill you cannot attribute is not
evidence. Adopting the builder's mutation (a cover-cut at 0.008) would have violated step 6.1 —
an agent that supplies the check has, in effect, coded to it.

So the conductor measured which k values the pre-cycle block tests actually exercise: the
0.00160–0.00195 sweep, plus k=0.014 and k=0.02447. Gating the rescue at `k .ge. 0.0015` moves the
BLOCK surface's low-k threshold in a region the old suite never looks at and the new pin does. It
survives the old suite (exit 0) and dies on the new one, killed by exactly one named new test.
Mechanistically different from the builder's cover-cut, which is what makes it independent
evidence rather than a re-run of their homework. Both mutations are kept in the gate output, the
gross one explicitly marked "reported only — not the attribution arm", so the record shows what
the pre-cycle suite already covered.

Worth stating plainly, since it slightly qualifies the win: that the only survivable block
mutations are confined to k below ~0.0015 means the pre-cycle suite already covered the block's
low-k behaviour well. T-176's new value on the block side is therefore mostly the CROSS-SURFACE
pairing — the line-vs-block disagreement, and the `0%` label pinned alongside the art — not fresh
block coverage. That is exactly what the item claimed to be, so the claim holds; it is simply
smaller than "four new tests" would suggest to a reader counting tests.

wave autotune: clean k=1 wave (0 reverts, 0 failed verifies) -> `wave_streak` 0 -> 1. `k_current`
  unchanged at 5 (already the hard max; the gear cap of 2 is what binds anyway).
counters: `consecutive_no_value` stays 0 — an item moved to done with two-arm evidence.

next: **the backlog is now one item, and that item is on record as unbuildable this run.** T-175
  (the `US/Samoa` alias gap) carries a recorded DO-NOT-BUILD verdict on traceability grounds and
  must not be quietly resurrected by a cycle that mistakes an empty queue for permission. Cycle 83
  therefore owes a real VALUE_LOOP decision with ~15.1 h still on the clock, and the honest
  options are narrow by construction: every SPEC must-have is closed (cycle 80), review-fix (73),
  full QA (76) and taste (81) have all been exercised, and the run's named risk is
  diminishing-return churn. The candidate that should be weighed first is POLISH — the one step-4
  pass this run has never run — judged against the two-question ratchet, with WRAP_UP the correct
  answer if nothing clears it. A fourth broad re-sweep is forbidden by the spec digest.

runfile-mirror: see `/opt/swarm/runs/current.json` (unchanged this cycle except `heartbeat`,
  `budget.last_probe_ts`, `budget.gear_evidence` and `budget.weekly.source`; full mirror written
  to `current.json.bak`).
