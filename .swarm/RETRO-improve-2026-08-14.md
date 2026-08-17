# moon — run retro (improvement run)

<!-- Written by /swarm WRAP_UP. Evidence rules apply exactly as in the verification gate:
     every entry cites cycle numbers from .swarm/journal.md. No cycle number, no entry. -->

Run: 2026-08-14 15:32 → 2026-08-15 09:00 UTC (improvement run on shipped v0.1.0) |
cycles run: 0 (kickoff) → 47 | stop reason: **DONE — VALUE_LOOP candidate scan came back
empty at cycle 47**, with ~6.5 h of the 15:32 stop budget deliberately unspent.

This is a housekeeping run's retro. The product was already shipped; the job was to make
its claims checkable. Read it as a report on the *verification machinery*, because that is
where nearly all of this run's real work and all of its real mistakes were.

## What worked

- **The gate caught what the builders claimed.** Three build waves were REVERTED on the
  conductor's own check, never on a builder's report: T-132 (cycle 34), T-134 (cycle 37),
  T-136 (cycle 40). Each was re-dispatched and passed on the second attempt (cycles 35, 38,
  41). Authoring the verify check at verification time — after the diff exists, never from
  the backlog's `acceptance` — is what made those three catchable.

- **Every single failed item recovered; nothing ended blocked.** Nine items carry
  `attempts: 1` (T-101, T-103b, T-108, T-109, T-124, T-132, T-134, T-136, T-140) and all
  nine are `done`. Zero items reached `attempts ≥ 2`, so zero items became `blocked` and no
  `known_issues` entry was opened by the attempt cap all run. One gate failure plus one
  re-dispatch with the failure's specifics was sufficient every time it was tried.

- **The attribution discriminator is the strongest verification shape this run produced**
  (cycle 47). Proving a new test kills a mutant is not enough — it only shows the *suite*
  fails. The gate ran a second copy, identical mutant, new test removed, and showed the
  suite go green again. That distinguishes "this test does the work" from "something in the
  suite happens to be sensitive". It also independently reproduced cycle 46's separate
  measurement instead of taking it on trust. Cheap: one extra scratch copy.

- **Filing findings at the gate instead of conductor-patching them.** Standing rule since
  cycle 7, exercised at cycles 20 (T-116), 32 (T-130), 42 (T-139), 44, 46 (T-142). A
  conductor who edits the artifact leaves nothing independent checking the conductor's own
  wording. The cost is a backlog with cosmetic residue in it; the benefit is that every
  wording claim in the repo was checked by something other than its author.

- **Conductor-inline QA beat dispatching an agent, for this product shape** (cycle 46).
  For a stdout CLI, the conductor running the real binary is both cheaper and stronger
  evidence than a subagent's report of having run it. That cycle spent zero agent tiers and
  produced 28 end-to-end checks — the only reason an M-effort item was affordable at gear 1.

- **Measuring coverage instead of counting tests.** Cycle 46 ran ten mutants against the
  shipping suite to find which documented behaviors were actually unprotected; nine were
  killed, one was not, and that one became T-142 (cycle 47). The item existed because a
  surface was measured bare, not because someone thought more tests would be good. This is
  the mechanism that let the run honor "test count is not an outcome" while still adding
  tests.

## What thrashed

- **My own instruments were narrower than the thing they measured — six times**
  (cycles 37, 42, 44, 45, 46, 47). The cycle-47 instance is the clearest: the gate staged
  its scratch copy from an enumerated file list (bin/ + src/ + test/ + package.json +
  README.md), but `contracts.test.js` resolves paths against the repo root and reads
  CONTRACTS.md, so it aborted as a whole file in *both* the mutant and control arms
  (137/135/2 and 136/135/1) and the gate printed `VERDICT: FAIL` on correct work.
  — why: an enumerated copy is a *guess at* the repo, and the guess silently omits whatever
  the enumerator didn't think of. A scratch copy has to BE the repo. Six instances of the
  same shape is not six accidents; it is the dominant failure mode of this run, and it
  always presents as the artifact being wrong when the measurement is wrong.

- **Trend claims from two data points, twice** (cycles 45, 46, 47). Cycle 45 recorded that
  two cycles of widening margin "confirm the cycle-43 rise was a fluctuation". Cycle 46
  measured the margin narrowing to tighter than cycle 43 and retracted it. Cycle 47 saw it
  widen again (1.0641 → 1.0737 → 1.0706) and deliberately did *not* reinstate the
  conclusion. — why: two readings of a noisy series is not a direction, and the pull to
  write a tidy narrative into a log is strongest exactly when the numbers are boring.

- **A naive mutation generator produced false survivors** (cycle 42 → T-139). The generator
  treated every adjacent phase-name retype as a lie, but at the 0% and 100% endpoints the
  disc and percentage are identical across adjacent names, so three "survivors" were the
  check correctly accepting reachable output. — why: the generator didn't model endpoint
  indiscriminability, so it could not tell a hole from a boundary. The hazard it leaves
  behind is concrete: the next person to mutation-test that check reads three correct
  passes as three holes and "hardens" it into false-rejecting honest output.

- **Cosmetic residue accumulated in the backlog and never cleared** (T-116 from cycle 20,
  T-130 from cycle 32, T-139 from cycle 42). Each was correctly ratchet-rejected at filing
  and re-rejected at cycles 21, 22 and 47. — why: the file-don't-patch rule has no disposal
  path for a finding that is real, true, and not worth building. Three items sat todo for
  27 cycles, and each VALUE_LOOP scan paid to re-adjudicate them. Not a defect, but the
  ratchet should be able to say "correct and declined" once, not every cycle.

## Pacing honesty

- Governor clamps: **0 cycles**. `weekly_heat` never reached the 1.1 threshold — measured
  1.065 (c41), 1.060 (c42), 1.0641 (c44), 1.0737 (c46), 1.0706 (c47) — so the governor was
  disengaged throughout and `ceiling: 5` was never the binding constraint.
- Ceilings hit: **none**. Full-mode overrides: **0** (mode was `guest` all run).
- Promote-rung promotions: **0**. `opus_heat` sat at 1.30–1.33 against a 1.2 threshold, so
  `promote_blocked` was true every cycle the gear was computed.
- **What actually bound the run was the allocator's `trickle` posture plus the guest 1–3
  clamp**, which pinned gear 1 / k_cap 1 for the entire observed tail. `week_resets_at`
  (1786942799) falls after `stop_at` (1786807947), so gear 1 was *structural* — no amount
  of cooling could have lifted it before the run ended. Every "the heat moved" note in the
  journal is therefore an observation, not a decision input.
- Underused windows: **none to report, and the honest framing is the opposite** — the run
  ended with `weekly_used_pct` 79.0 against `week_elapsed_pct` 73.79, i.e. the weekly was
  running slightly hot, not cold. What went unspent was ~6.5 h of *wall clock*, released by
  the cycle-47 DONE call rather than by any budget signal.
- The budget probe was **never invoked, all 47 cycles** (KI-2). `probe_failures` correctly
  stayed at 34 rather than incrementing, on the rule that an attempt not made is not a
  failure. Gear came from `runs/allocator.json`, whose freshness was re-checked against
  `week_elapsed_pct` movement every cycle rather than assumed.

## Config recommendations

- [qa] A new test is not protection until it is shown both FAILABLE and ATTRIBUTABLE: run
  the mutant with the test present *and* with it removed, and require the suite to go green
  in the second arm [apply: prompt qa "When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence."] [confidence: high]
  (evidence: cycle 47 gate, arms A and B)

- [process] Build a verification scratch copy by copying the whole repo minus .git, never
  by enumerating the files the test "needs" — path-resolving tests abort in every arm at
  once and the gate reports a false FAIL on correct work [confidence: high]
  (evidence: cycle 47 first gate run, 137/135/2 vs 136/135/1; same shape at cycles 37, 42,
  44, 45, 46)

- [process] Do not record a trend from two readings. Write the reading; write the
  structural fact that does not depend on the trend; leave the direction unstated until a
  third point agrees [confidence: med] (evidence: cycles 45 → 46 retraction → 47 non-reinstatement)

- [qa] Before adding tests to a suite believed thin, MEASURE which documented behaviors are
  unprotected by mutating each one against the existing suite; build only the unkilled ones
  [apply: prompt qa "Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."] [confidence: high]
  (evidence: cycle 46 measured 10 mutants, 9 killed → exactly one item filed, T-142, closed cycle 47)

- [process] When a mutation generator's survivors are reviewed, classify each as hole or
  BOUNDARY before hardening anything — a survivor at a point where the observable is
  genuinely indiscriminable is the check being correct [confidence: med]
  (evidence: cycle 42, three endpoint survivors → T-139)

## House-rules proposals

- [review] A finding that is real, true, and correctly declined should be dispositioned
  once ("correct and declined") rather than re-adjudicated by every subsequent VALUE_LOOP
  scan.
- [docs] A comment that documents why a check ACCEPTS something is worth as much as one
  documenting why it rejects — it is the only thing standing between the next editor and a
  false-rejecting "hardening".

## Applied lessons check

- **L-003** (qa: hand-computed expected outputs): **re-observed** — cycle 46's end-to-end
  harness derived its hemisphere expectations by parsing README's own north|south table
  rather than from the renderer, which is the same principle one level up.
- **L-008** (prompt: conductor is sole committer): **re-observed** — spliced into the
  cycle-47 builder prompt; verified by `git status` showing an uncommitted ` M
  test/cli.test.js` and no agent-authored commit, on every wave this run.
- **L-016** (prompt: pairwise-disjoint fixer file scopes): **not-exercised** — gear 1
  capped every wave at k=1 from cycle ~34 onward, and no multi-fixer review-fix wave ran
  after cycle 23. The lesson was staged into reviewer prompts but never had two fixers to
  separate.
- **L-023-moon** (qa: brief reviewers to REFUTE): **re-observed** — the cycle-47 builder was
  explicitly told that reporting "the surface was already pinned" would be doing the job
  correctly. It confirmed the premise instead, which is a meaningful signal precisely
  because the opposite was made safe to say.
- **L-024-moon** (qa: verify with a discriminator, not a remembered reference):
  **re-observed, and strengthened** — cycle 47's B arm is exactly a discriminator: an
  observable (mutant survives without the new test) that a degenerate or self-agreeing test
  could not produce. This run's recommendation above is the next rung of the same idea.
- **L-026-repo-atlas** (routing: core-logic → fable): **not-exercised** — `promote_blocked`
  was true every cycle (opus_heat 1.30–1.33 > 1.2), and rewriting the astronomy core was an
  explicit non-goal, so no core-logic item was ever routed. The directive was staged and
  never had a candidate.

## Telemetry

- Weekly utilization at wrap-up: **79.0% overall / 96% premium**, against 73.79% of the
  week elapsed. Premium is the constraint heading into the next run, not overall.
- Allocator: posture `trickle`, `allow_overall_pct` 0 and `allow_premium_pct` 0 for the
  entire observed tail — the allowance granted was zero and the run correctly spent only
  what gear 1 permits (one sonnet S-effort builder per cycle, several cycles at zero agent
  tiers).
- Auto-kickoffs: this run was itself an allocator auto-kickoff (`runs/kickoff-hints.json`,
  `source: allocator`, improvement brief). No 3-strike queue drops observed.
- Final-hours floor release: **did not fire** — the run reached DONE at 09:00 UTC, ~6.5 h
  before `stop_at`, so the release window was never entered.
