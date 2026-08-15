
## cycle 38 — 2026-08-15T05:00:54Z — VALUE_LOOP — build-wave (k=1) — T-134 — GATE PASS

clock: now=1786770054 at entry, stop_at=1786807947 (10.5 h remaining). Not within 900s of
  stop, not limp. Prior conductor PID 236980 gone; this session is PID 248106, captured by
  walking to the live `claude -p /swarm cycle` process rather than trusting the ps/`$$`
  walk, which false-matched the bash wrapper on its `/home/swarm/.claude/shell-snapshots`
  path. Recorded because the documented PID-capture walk (cycle.md step 0) matches on the
  substring "claude" and any wrapper carrying a .claude path in its argv satisfies it.
budget probe: NOT invoked, same standing decision as cycles 35-37 and the same closed
  reason — no allow entry of any form for bin/swarm-budget.sh (KI-2). Re-grepped rather
  than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json` returns nothing.
  probe_failures stays at 34; an attempt not made is not a failure. Gear rests on
  runs/allocator.json (source=probe): posture=trickle, allow_premium_pct 0,
  allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0, week_elapsed_pct 71.44,
  dial 0.3. weekly_heat 1.064 < 1.1 → governor disengaged, ceiling 5; opus_heat 1.344 > 1.2
  keeps promote blocked. Trickle + guest 1–3 clamp → gear 1, k_cap 1, thirty-eighth
  straight cycle. week_resets_at 1786942799 is after stop_at, so gear 1 is structural for
  the rest of the run.
orient: tree clean at entry, 131/131 green, no salvage needed. control channel: poll OK
  (bare-relative form from /opt/swarm — a fifth consecutive success while the budget
  script is refused in that identical form), pending[] empty, inject[] empty.
re-anchor: 38 % 5 != 0, no full SPEC re-read due. Scope unchanged: harden tests, close
  known issues, doc truth, NO new features.
craft pack: `node bin/swarm-craft.mjs` clean, `degraded: []`. Not spliced into the builder
  brief: the pack's build-wave slice is craft.ui, and T-134 touches one test file in a
  stdout-only Node CLI with no UI surface — the item is not ui-flagged under the step-5
  rule. Journaled rather than silently dropped.

PICK: T-134 retry (priority 1, kind fix, S, attempts 1). Uncontested — the other three
todos (T-116, T-126, T-130) are all previously ratchet-rejected, and the cycle-37 block
named this retry as the intended next pick. consecutive_no_value was 1, below the ≥2 that
would force a work-type switch.

ROUTING DECISION — the gear-1 ceiling binds a ladder escalation (recorded in state.json).
  T-134 at attempts=1 earned one rung, sonnet→opus. It was dispatched at SONNET anyway.
  Cycle 2 ruled that an escalation earned by a failed gate outranks the gear-1 DEMOTION
  rule, and that still holds — the item was never pushed down to haiku. But
  escalation-vs-demotion and escalation-vs-the-gear-ceiling are different collisions.
  Demotion is a per-item rung adjustment; gear 1's work-choice rule ("S-effort sonnet
  builds only") is a CEILING on what a gear-1 cycle may dispatch at all, and under
  allocator trickle (allow_premium_pct 0, opus_used_pct 96) opus sits above it. An
  escalation may refuse a demotion without being licensed to climb past the ceiling of the
  gear it is dispatched in.
  The ladder's PURPOSE is "do not hand the same tier the same task twice", so the
  compensating measure was to make it not the same task: the retry brief carried the full
  cycle-37 diagnosis — the one failing clause named, the repair stated ("search the band,
  do not sample its centre"), and all three measurements behind it. That held. Attempt 2
  passed at the tier that failed attempt 1.

BUILD-WAVE (k=1, direct Agent dispatch — Workflow is review-gated in a headless -p
session, the documented fallback). Builder prompt carried the playbook builder line
("the conductor is the SOLE committer"). Returned one file, test/regressions.test.js,
+220 lines, no commits.

VERIFICATION GATE — PASS. Checks authored at verification time, after the return; the
builder never saw them. Full evidence: .swarm/runs/cycle-038-verify-T-134.txt.

  $ git status --porcelain
   M test/regressions.test.js          # README.md, src/, bin/ byte-identical to HEAD

  $ node --test test/*.test.js         # conductor-run, pre-merge
  ℹ tests 134 / pass 134 / fail 0      # 131 pre-existing + 3 new

  CITATION — the one borrowed constant. The test declares PCT_SCALE = 100 citing
  "src/render.js:235 — illumField's `... * 100`". Read directly, line 235 is
  `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`. Exact, not
  approximately right. BAND_STEPS = 400 is a search resolution and asserts nothing about
  the product, so it does not offend the item's no-new-numeric-constant clause; the run's
  standing docs frame rule (cycles 2 and 4) bans introducing a QUANTITY the repo does not
  compute, not a loop bound.

  IS IT ACTUALLY A SEARCH? Yes — 401 candidates across [pct/100 ± 1/100], each rendered
  through the shipping renderLine, accepted iff the RENDERED output matches both the exact
  percent and the exact north disc. It never applies a rounding rule of its own. The ±1pp
  bound widens nothing: candidates are filtered by `samplePct === pct`, so the effective
  searched set is exactly the true display band, clipped to [0,1].

  INDEPENDENT MEASUREMENT (.swarm/runs/c38-gate-band.js — my own line-state fence scanner,
  deliberately not the test's regex; sweeps the whole physical domain at 1e-5, not the band):
  ROWS PARSED: 15                      # all 15 exercised, none silently dropped
   83%  display-band=[82.5000,83.4990]pp  disc-accepting=[82.5000,83.2350]pp  accept=73.6%
    5%  display-band=[ 4.5000, 5.4990]pp  disc-accepting=[ 4.8240, 5.4990]pp  accept=67.6%
   (13 other rows: accept=100.0%)
  UNPARSED ROWS: 0
  This reproduces cycle 37's two interior margins to the digit, independently: 5% row
  5.000−4.824 = 0.176pp, 83% row 83.235−83.000 = 0.235pp. And accept-fraction 100% on the
  other 13 is NOT vacuity — it means the disc is constant across the whole display band, so
  the true disc is accepted everywhere in it and any other disc nowhere in it. Narrowest
  accepting interval anywhere is 0.499pp against a ~0.005pp step: ~100× resolution margin.

  FAILABILITY — 9-case battery on a COPY of the repo at /tmp/c38-mut, so "was README
  restored byte-for-byte" is not a question this evidence has to answer at all.
  MUTANT               EXPECT  GOT    pass/fail  caught by
  M0-CONTROL           GREEN   GREEN  13/0       -
  M1-HISTORICAL        RED     RED    12/1       T-134 sweep table
  M1b-NAME-ORDER-SAFE  ?       GREEN  13/0       -              ← residual, filed as T-135
  M2-SOUTH-GLYPH       RED     RED    12/1       T-134 sweep table
  M3-HEADLINE-PCT      RED     RED    12/1       T-134 headline fence
  M4-BLOCK-ROW         RED     RED    12/1       T-134 --block fence
  M5-COHERENT-FAKE     RED     RED    12/1       T-134 sweep table
  M6-FALSE-POSITIVE    GREEN   GREEN  13/0       -
  M0-CONTROL-2         GREEN   GREEN  13/0       -
  Every kill is by exactly its intended NEW test, one failing test each — no pre-existing
  test is doing the catching. Control green first AND last, so the harness is live.
  M5 is the decisive one for clause 3: both discs of the 63% row replaced by the 83% row's
  real, correctly-mirrored pair — mirror passes, name passes, cycle order passes, and only
  the band search sees it. Cycle 37's claim that the band clause is load-bearing is now
  CONFIRMED rather than argued.
  M6 is the cycle-37 failure itself: the 5% row honestly regenerated at true k=0.046 stays
  GREEN. The false positive that failed attempt 1 is gone, and no detection was traded for
  it — the claim was made true, not weakened.

  $ node --test test/*.test.js         # post-merge on main, hard rule 4
  ℹ tests 134 / pass 134 / fail 0

instrument note, against myself — MY BRIEF CARRIED AN ERROR AND THE BUILDER REFUSED IT.
  I wrote the honest k=0.046 row into the retry brief as north `▌░░░░` / south `░░░░▐`.
  That is wrong; cycle 37's journal had it right (`▏░░░░` / `░░░░▕`) and I mis-transcribed
  it. The builder did not take my word for it, measured against the shipping renderer, got
  `▏░░░░`, and said so explicitly in its return. Conductor-confirmed after the fact
  (.swarm/runs/c38-honest-row.js): k=0.046 → `▏░░░░`, k=0.05 → `▌░░░░`. Had it trusted the
  brief, its M6 case would have been built around a disc the renderer does not produce at
  that k and the whole false-positive check would have been testing the wrong thing.
  Distinct in kind from the seven prior self-instrument notes this run (cycles 8, 9, 19,
  23, 29, 32, 37): those were my measuring instrument being narrower than the thing it
  measured. This is the conductor injecting a false premise into a builder brief — the
  same failure mode the cycle-4 correction was written to stop, recurring in the opposite
  direction. It cost nothing only because the builder was skeptical of its own brief.

RESIDUAL, measured not suspected — filed as T-135 (todo, priority 6, S, haiku).
  M1b: retyping a sweep row's phase name to an ADJACENT name that still preserves
  PHASE_NAMES cycle order (51% "first quarter" → "waxing gibbous") survives the suite.
  This does NOT fail the gate: acceptance clause 3 asks for cycle ORDER, that is exactly
  what was built, and M1-HISTORICAL proves it works on the defect that actually occurred
  here. Per the cycle-8/T-111 and cycle-17 disposition an item whose acceptance passed in
  full is not failed over a nuance. But T-134's TITLE claims a hand-edit of any block turns
  the suite red, and this hand-edit does not, so it is written down rather than left implied.
  Priced by measurement before filing (.swarm/runs/c38-probe-namepct.js), per the standing
  cycle-29/32 practice — sweep 4 lunations of real instants at 1-minute steps through the
  shipping computeMoon and collect which (name, displayed percent) pairs the product can
  actually emit:
    waxing gibbous  56..100     first quarter   44..56      full  100..100
    waning gibbous  55..100     last quarter    45..55       new    0..0
    waxing crescent  0..45      waning crescent  0..45
  All 15 current README rows: REACHABLE — so the honest table stays green, which is the
  exact trap (false positive on a correct README) that failed T-134 attempt 1.
    51% waxing gibbous → UNREACHABLE (kills M1b);  32% waxing gibbous → UNREACHABLE;
    63% waning crescent → UNREACHABLE.
  So the discriminator is real, introduces no new constant, and has the same shape as the
  band search: ask the product what it can produce. Caveat carried into the item — the
  probe's 1-min/120-day sweep is ~173k computeMoon calls against a ~2s suite, so a builder
  must coarsen it AND show the coarser sweep still reaches all 15 rows; and the check must
  be set membership, not a range test, because first quarter 44..56 and waxing gibbous
  56..100 overlap at 56.

not run, and why (never rendered as passed):
  collision-scan — the standing check is scoped to browser targets built from classic
    non-module scripts; moon is a Node CommonJS CLI with no browser surface.
  qa-verify look pass — triggers on user-visible browser assets. The merged file is a test
    file; this repo serves nothing to a browser.
  review-fix — the run's ONE pass ran at cycle 23; not re-run.

wave autotune: the k=1 wave was CLEAN — zero reverts, zero failed verifies → second branch
  of the rule → wave_streak 0 → 1. k_current unchanged at 4 (the +1 lands at streak 2).
  Inert either way: min(k_current, gear cap 1) = 1.
counters: consecutive_no_value 1 → 0 and consecutive_failures 1 → 0 (verified value this
  cycle). Churn breaker reset before reaching the ≥2 that forces a work-type switch.
backlog: 36 items — 32 done, 4 todo (T-116, T-126, T-130 still ratchet-rejected and
  correctly left todo; T-135 newly filed). known_issues unchanged at 5.
notifications: none emitted. Phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0 — none of the three step-8 emit conditions fired.
