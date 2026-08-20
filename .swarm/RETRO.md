# moon — run retro

<!-- Written by /swarm WRAP_UP. Evidence rules apply here exactly as in the verification
     gate: every entry cites cycle numbers from .swarm/journal.md. No cycle number, no
     entry — vibes are not evidence. -->

Run: 2026-08-20 (improve-6, allocator TRICKLE) | cycles run: 8 (103–110) | stop reason:
definition of done met and re-derived at cycle 110's `% 5 == 0` SPEC re-read; the one
VALUE_LOOP candidate that passed the two-part ratchet was this run's own REPORT record,
which is WRAP_UP step 3's work rather than a backlog item — early DONE, ~20.2h of
authorized clock unspent, by decision.

## What worked

- **Building the gate instead of doing the pass a seventh time.** The whole run turns on
  one call made at kickoff: L-043's FORM-and-DIRECTION clause named `moon` explicitly, and
  the choice was to spend the window on a machine check rather than a hand audit. The
  doc→code citation direction is now in `test/citations.test.js` and the count claims in
  `test/doc-counts.test.js`; run 7 inherits checks, not a chore (cycles 103, 104, 106, 107,
  109).
- **Withholding gate arms from the dispatch.** At cycle 109 arms A–C were named in the
  builder brief and arms D (path exists but is NOT git-tracked) and E (a zero-match parse
  must not render green) were authored by the conductor and never shown. Both came back RED
  for the reason they name. Arms A–C were all satisfiable by a mere existence check; D and E
  are what made it a gate rather than a formality (cycle 109).
- **Re-deriving instead of remembering.** Cycle 110 wrote "245 tests / 245 passing at cycle
  109 (commit `ed7054e`)" only after measuring that commit in a detached worktree, and then
  falsified the sentence to 999/999 and confirmed the suite went RED naming
  `REPORT.md's "Suite ..." bullet(s) state a count that is TRUE at the cycle/commit they name`.
  The number in the document is machine-checked, not asserted (cycle 110).
- **Two failed conductor verifies caught real defects, not instrument noise.** T-208 failed
  the read at cycle 104 and T-209 at cycle 105; both were genuine — a false provenance claim
  and a suite-count anchor glued to the wrong number. Each was repaired and re-verified at the
  next cycle (cycles 104–107).
- **k=2 sequential waves merged clean.** Every wave this run was `min(k_current, gear cap 2)`
  = 2, dispatched sequentially, zero reverts, zero merge conflicts across cycles 103–109.

## What thrashed

- **Nothing hit `attempts ≥ 2`.** No item was blocked, no merge was reverted, no branch was
  discarded this run (cycles 103–110). Recorded as an absence with its cycle range rather than
  omitted, so the section is not silently empty.
- **T-209 shipped a false anchor and needed a second cycle** — why: the cycle-105 write
  anchored "208 tests" to cycle 104, whose commit actually measures 210. Anchor PRESENCE was
  gated; anchor TRUTH was not. That gap became T-211 and is now closed by the worktree
  re-derivation in `test/doc-counts.test.js` (cycles 105, 106, 107).
- **A rot vector was created by cycle 109's own repair** — why: the repaired sentence read
  "archived in full, not deleted, at `A` and `B`" while run 6's record sat in REPORT.md itself,
  true on the day and false the moment that section is archived. Cycle 109 filed it as a
  WRAP_UP obligation; cycle 110 killed it instead by rewording to a self-relative pointer
  ("except the most recent run, whose record sits in this file below until the next run
  archives it"), which does not decay when the next run archives (cycles 109, 110).
- **KI-2 denied for the 33rd time** — why: structural, not an invocation-form error. The
  `bin/swarm-playbook.sh` allowlist gap has no entry under any path form; hard rule 5 forbids
  repairing it from inside a run. Escalated once at cycle 105/107, not re-diagnosed (cycles
  105, 107, 110).

## Pacing honesty

- Governor clamps: 8 of 8 cycles (ceiling hit: 2, every cycle — `weekly_used_pct` 100,
  `weekly_heat` 2.12–2.13, `promote_blocked: true`); full-mode overrides: 0; promote-rung
  promotions: 0. Gear was **2 in every cycle of the run** and was a *governed* result, not a
  measured one: ρ ranged 0.39–0.89 (cycles 103–110), which would reach gear 4–5 in thermostat
  mode, but guest mode clamps to 1–3 and the weekly ceiling clamps to 2. No window reset below
  90% utilization during this run. `probe_failures` stayed 0 — `bin/swarm-budget.sh` is
  allowlisted and ran for real every cycle.

## Config recommendations

- [qa] A citation gate that proves a path RESOLVES has not proved the sentence AROUND it is
  true — "archived in full, not deleted, at `A` and `B`" stayed false while both paths
  resolved and stayed git-tracked, which is the defect the gate was built after and cannot
  catch; so when a doc claim couples a locator to a COMPLETENESS word, gate the locator and
  say plainly in the report that the completeness half remains a human read, rather than
  letting a green suite imply the whole sentence was checked [confidence: high]
  [source: 2026-08-20 moon run6] (evidence: cycles 109, 110 — T-212's actual defect, and the
  "What the citation gate does not catch" paragraph now in REPORT.md)
- [qa] Kill a decaying pointer by making it SELF-RELATIVE rather than filing it as a future
  obligation — a sentence enumerating "archived at `A` and `B`" rots the next time an archive
  is added, and handing that to the next run as a wrap-up note relies on a human reading a
  journal; rewording it to name its own position ("except the most recent run, whose record
  sits in this file below") is stable under the very edit that would have broken it, costs one
  sentence, and needs no obligation carried anywhere [confidence: high]
  [source: 2026-08-20 moon run6] (evidence: cycle 109 filed the rot vector, cycle 110 removed
  the class)
- [qa] A count claim that names a PAST cycle is machine-verifiable, not merely shape-checkable
  — resolve "cycle N" to a commit through the repo's own `cycle N:` commit-message convention,
  check that commit out into a throwaway worktree outside the repo, run the suite there, and
  compare; bound the cost with a max-commits constant and a recursion-depth env var, and use a
  plain early return rather than `test.skip` at the depth bound so a nested run's own pass
  count stays identical to a normal run's — otherwise the skip corrupts the very number the
  outer run is measuring [confidence: high] [source: 2026-08-20 moon run6] (evidence: cycles
  106, 107 built it; cycle 110 falsified a live claim through it and got the named RED)
- [process] When the only VALUE_LOOP candidate left is itself a WRAP_UP deliverable, wrap up
  in that cycle instead of spending one cycle building it and a second cycle wrapping — the
  extra lap produces a commit that reads as work and changes nothing a reader could detect,
  which is the manufactured-diligence failure the same spec warns about [confidence: med]
  [source: 2026-08-20 moon run6] (evidence: cycle 110 — stale run-6 REPORT record was the only
  candidate passing the ratchet, and REPORT.md is WRAP_UP step 3)
- [process] An environment-variable PREFIX defeats an exact-path allowlist entry: `RUNFILE=…
  bin/swarm-budget.sh` was denied in the same cycle the bare `bin/swarm-budget.sh` ran clean,
  so a helper script that needs configuration must take a `--flag`, not an env var, or it is
  unreachable from an allowlisted session no matter how its path is spelled [confidence: high]
  [source: 2026-08-20 moon run6] (evidence: cycle 110, both invocations in the same cycle)

## House-rules proposals

- [docs] A pointer sentence names its own position, never an enumeration that grows each run.

## Applied lessons check

- L-008 (sole committer + scratch dir): re-observed — the directive rode every builder prompt;
  zero builder commits and a clean tree at every orient (cycles 103–109).
- L-016 (pairwise-disjoint fixer scopes): not-exercised — no review-fix wave ran this run (last
  was cycle 73).
- L-024 (verify with a discriminator): re-observed — cycle 109 arm D (a path that exists but is
  untracked) and cycle 110 arm 1 (a falsified suite count) are observables a degenerate
  existence-check could not produce (cycles 109, 110).
- L-026 (correctness core → fable): not-exercised — no core-logic item this run; the astronomy
  core was a frozen non-goal.
- L-029 (failable AND attributable): re-observed — cycles 109 and 110 each ran the mutation
  twice and named the distinct failing test (cycles 109, 110).
- L-031 (measure untested surfaces, never infer): re-observed — zero tests were added for
  count's sake; the spec's "no test added that cannot name its surface" non-goal held through
  cycle 110.
- L-033 (HOLE vs BOUNDARY before hardening): not-exercised — no mutation sweep this run, by
  explicit non-goal.
- L-034 (brief reviewers to REFUTE): re-observed — cycle 108's VALUE_LOOP scan refuted its own
  candidates and recorded them so run 7 would not re-derive them; cycle 110 tried to falsify
  its own new prose rather than confirm it (cycles 108, 110).
- L-039 (allowlist by absolute path for the host): re-observed, and sharpened — the
  every-path-FORM diagnostic confirmed KI-2 is structural, and cycle 110 added a NEW datum in
  the same mechanism: an env-var prefix defeats an exact-path entry that otherwise matches
  (cycles 105, 107, 110).
- L-041 (an instrument must fail CLOSED): re-observed — the citation gate's self-check exists
  precisely so a zero-match parse cannot render green, and cycle 109 arm E proved it does
  (cycle 109).
- L-042 (seal the gate before dispatch): re-observed — cycle 109 withheld arms D and E from the
  builder dispatch entirely (cycle 109).
- L-043 (enumerate every citation FORM and DIRECTION): re-observed and CLOSED for this repo —
  the doc→code direction the clause named is now `test/citations.test.js`, and the bare-PATH
  form was exactly the FORM a path-anchored sweep had been missing (cycles 103, 109).
- L-044 (pair every kill with a converse control): re-observed — every gate this run shipped a
  green arm: cycle 109 arm C and cycle 110 arm 3 both rewrote prose and stayed green (cycles
  109, 110).
- L-045 (read the authoritative source, both directions; go DONE early): re-observed — the DONE
  call was made by cycle 110's full SPEC re-read, deliberately NOT by cycle 109's empty backlog,
  and every count claim was re-derived at run time (cycles 108, 109, 110).
- L-046 (wire-through at the outermost layer): not-exercised — no domain-capability item this
  run; every item was docs or test.
- L-047 (attribute a gate FAIL to the INSTRUMENT or the WORK): re-observed with the opposite
  polarity to its source datum — attribution was performed on both failing verifies and both
  landed on the WORK, not the instrument (a false provenance claim at cycle 104, a false
  suite-count anchor at cycle 105); each was charged to the item and repaired next cycle
  (cycles 104–107).

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization at this run: 100% overall / 100% premium, `week_elapsed_pct` 47.16,
  `weekly_heat` 2.12 — the governor held the ceiling at gear 2 for all 8 cycles.
- Allocator: TRICKLE posture, `allow_overall_pct: 0` / `allow_premium_pct: 0`. The run was
  authorized as idle-capacity housekeeping and is reported as such.
- Auto-kickoffs this run: 1 (allocator-driven, `runs/kickoff-hints.json`, `source: allocator`),
  posture TRICKLE at start. No 3-strike queue drops.
- Final-hours floor release: did not fire — the run wrapped ~20.2h before `stop_at`.
