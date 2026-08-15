
## cycle 25 | 2026-08-15T00:05:51+00:00 | moon | VALUE_LOOP (RECYCLE)

work: RECYCLE cycle — no new work, by rule, not by choice. `cycles_since_recycle` reached 25
  at step 0 (hard rule 7), which skips steps 4-6 outright. Cycle 25 is ALSO a `cycle % 5 == 0`
  full SPEC re-read + backlog hygiene pass; both rules land on the same cycle and the recycle
  rule wins, with hygiene folded into it exactly as cycle 24 predicted. No workflow dispatched,
  no builder, no models spent on generation. Cost this cycle is the conductor's own reads.

## HANDOFF NOTE (the point of a recycle — the next session re-orients from THIS, not from chat)

STATE SNAPSHOT, all of it re-derived from disk this cycle, none carried from context:
  repo      /opt/targets/moon @ ff6003f, tree CLEAN, `## main...origin/main` with no
            ahead/behind marker — the working tree, the local branch and the GitHub remote
            are all at the same commit. Nothing is in flight; no unmerged builder branches.
  suite     114/114 pass, 0 fail, 0 skipped, 0 todo (re-run THIS cycle, not quoted from
            cycle 24 — evidence below).
  product   `node bin/moon.js` renders: 7% waxing crescent, next full moon 28 Aug.
  phase     VALUE_LOOP, cycle 25. DoD: cycle 23 verified 8/8 SPEC clauses met. The target is
            NOT declared done — see "why not done" below, it is a deliberate standing ruling.
  backlog   23 items: 21 done, 2 todo, 0 blocked, 0 in-flight. No item has attempts >= 1.
  todo      T-122 (p4, S, docs, haiku) — the ONLY item the ratchet accepts.
            T-116 (p9, S, polish, haiku) — ratchet-REJECTED at cycles 20, 21, 22, standing.
  issues    4 open known_issues: KI-2 (SWARM-side, allowlist), KI-4 (low, needs a human's
            eyes on a real terminal), KI-5 (medium, deferred with an evidence-backed reason
            as of cycle 24), KI-7 (bounded, not a live bug).
  counters  consecutive_no_value 0, consecutive_failures 0, k_current 5, wave_streak 0.
  gear      1 / k_cap 1 / guest / dial 0.30 — structural for the rest of the run (below).

READ THESE FIRST, in this order, and nothing else:
  1. .swarm/SPEC.md — the improvement-run contract. The two lines that decide most calls:
     "No new features of any kind" and the CHURN taste note ("one test pinning a real defect
     beats ten restating a pass").
  2. This block, then the cycle 24 block above it (the KI-5 EAW audit — it is what created
     T-122, and it is the run's best worked example of a conductor gate catching its own
     instrument being wrong).
  3. .swarm/backlog.json, items T-122 and T-116 only. Every other item is done.
  4. `git log --oneline -8`. Do NOT read workflow transcripts (hard rule 7).

EXACT NEXT STEP for cycle 26 — no re-derivation needed:
  Pick T-122. Build-wave, k=1 (gear 1 clamps it there regardless of k_current=5), model haiku
  per the routing table for an S-effort docs item, no escalation (attempts 0).
  What it does: README.md:214-217 and test/render.test.js:584-589 both still say the
  round-limb glyphs' East Asian Width class "has not been established". Cycle 24 established
  it — U+25D6 and U+25D7 both measure Neutral against UCD 15.0.0, twice, independently. The
  repo currently contradicts its own evidence, which is why this outranks T-116.
  Scope fence to hold at the gate: the UNDOCUMENTED_DISC_GLYPHS set, its assertions, and every
  rendered byte stay UNCHANGED. Folding the round limb into the documented partition is a
  design judgment that was deliberately not bundled — if a builder does it anyway, that fails
  the gate.
  Verify check to author AT VERIFICATION TIME (do not reuse this sentence as the check —
  it is the goal, per step 6.1): prove both prose sites now state the measured class, prove
  the glyph set and rendered output are byte-identical to ff6003f, and re-run the suite.

WHY THE TARGET IS NOT DECLARED DONE, so cycle 26 does not re-litigate it:
  Cycle 23 verified all 8 definition-of-done clauses and still left the target active. That
  ruling stands and is correct: DoD-met is not the same as VALUE_LOOP-exhausted, and T-122
  is live proof — it is a real claim the repo makes about itself that is false. Declare done
  only when no candidate passes the two-question ratchet. With T-122 open, one does.

RESIDUAL THAT LIVES ONLY IN A NOTE, surfaced here so the morning report cannot miss it:
  the repo has NO LICENSE file at all, while package.json declares "license": "MIT" and
  README carries a "## Licence" heading. T-116 explicitly scopes the missing file OUT
  ("adding one is a decision for the repo owner, not a polish builder") — which is the right
  call, but it means the gap is recorded only inside another item's notes. It is a repo-owner
  decision, not swarm work. Naming it at the top level of a handoff note is the honest
  treatment: seen, priced, deliberately not actioned.

## backlog hygiene (cycle % 5 == 0, folded into the recycle)

  dedupe        none found. 23 ids, all distinct. (Contrast with the SWARM-side playbook id
                collision flagged at kickoff — that defect is in SWARM's files, not here.)
  cap           23 live items vs the ~30 cap. No pressure, nothing dropped for room.
  reprioritize  T-122 p4 already ahead of T-116 p9. Correct as-is; no change made.
  stale-drop    T-116 examined for `dropped` and DELIBERATELY LEFT `todo`. It has been
                ratchet-rejected three times with written reasons. Re-opening that argument
                every fifth cycle IS the churn the spec's taste note warns against, and
                dropping it would delete a residual a human may still want. Recording the
                verdict once, here, so cycle 30's hygiene pass reads this line instead of
                re-deriving it. This is the whole hygiene delta: ZERO items changed.
  Backlog files were re-read and re-verified but NOT rewritten — an atomic no-op write would
  put churn in the diff to make the cycle look busier than it was.

VERIFICATION EVIDENCE (a recycle verifies no ITEM; this is the health snapshot the handoff
note above rests on, and it is measured, not remembered):

  [tree] the recycle's own precondition — nothing to salvage, nothing uncommitted:
    $ git -C /opt/targets/moon status --porcelain
    (no output)
    $ git -C /opt/targets/moon status -sb
    ## main...origin/main
    Bare `main...origin/main` with no [ahead N]/[behind N] = local and remote agree.

  [test_cmd] run WITHOUT a pipe so the exit status is the real one (L-010):
    $ node --test test/args.test.js test/astro.test.js test/cli.test.js \
        test/hemisphere.test.js test/manifest.test.js test/regressions.test.js \
        test/render.test.js > .swarm/runs/cycle-025-recycle-suite.txt 2>&1 \
        && echo SUITE-EXIT-0-DIRECT-NO-PIPE
    SUITE-EXIT-0-DIRECT-NO-PIPE
    ℹ tests 114 | ℹ pass 114 | ℹ fail 0 | ℹ cancelled 0 | ℹ skipped 0 | ℹ todo 0
    Full output: .swarm/runs/cycle-025-recycle-suite.txt

  [product] the artifact still does its one job — not a test, the actual binary:
    $ node /opt/targets/moon/bin/moon.js
    ░░░░▐   7%  waxing crescent
                next full moon  28 Aug

CHURN-BREAKER JUDGMENT, recorded rather than applied silently:
  `counters.consecutive_no_value` is HELD at 0, not incremented. A recycle produces no
  verified item by construction — the rule that skips steps 4-6 is the same rule that
  guarantees the zero. Counting a mandated maintenance cycle as evidence of churn would push
  a healthy target toward a false `stalled`, which the churn-breaker section explicitly warns
  against ("Never let a finished target churn into a false stalled"). Cycle 24 delivered a
  verified item, so the counter was legitimately 0 on entry. Stating the call plainly because
  a silent hold and a silent increment look identical in the file a week from now.

budget: gear 1, k_cap 1, mode guest, dial 0.30, basis allocator-posture (source=probe,
  refreshed this cycle: week_elapsed_pct 68.21 -> 68.49, weekly_used_pct 71.0 -> 72.0,
  opus_used_pct 96, reserve 36.58, posture trickle, allow_premium_pct 0).
  weekly_heat 72.0/68.49 = 1.051 < 1.1 -> governor disengaged, ceiling 5.
  opus_heat 96/68.49 = 1.402 > 1.2 -> promote stays blocked.
  bin/swarm-budget.sh refused ONCE more -> probe_failures 25. `last_real_probe_ts` stays 0
  because a refused invocation is not a probe, so ratio, tokens/hour and projected depletion
  remain UNKNOWN and are NOT estimated. Cause is settled (KI-2, root-caused at cycle 23: no
  allow-list entry of any kind for the script), so it was not re-investigated; the
  PROBE_CMD=false clock-cruise form was refused too, this time by the command-shape layer
  rather than the allow list, so both routes to the script are closed from a headless cycle.
  Binding constraint for TWENTY-FIVE straight cycles: allocator trickle + guest-mode 1-3 clamp
  -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is
  structural for the remaining 15.4 h. Any plan for tonight that assumes a bigger wave is
  wrong on arithmetic, not on judgment.
control: poll exit 0 | pending [] | inject [] -> nothing to apply, nothing to triage.
wave autotune: no build-wave dispatched this cycle, so the autotune rule does not fire —
  k_current stays 5, wave_streak stays 0. Restating the cycle-24 honesty note: k_current is
  DECORATIVE at gear 1, since the effective wave is min(k_current, 1) = 1 either way.
recycle: cycles_since_recycle 25 -> RESET to 0. Next forced recycle lands at cycle 50, which
  is past this run's stop_at at the current cadence — so this is very likely the run's only
  recycle. Next `cycle % 5 == 0` hygiene pass: cycle 30.
next: cycle 26 takes T-122 (build-wave k=1, haiku). Full brief in the HANDOFF NOTE above.
