# moon — run retro

Run: 2026-08-24 (improvement run #7, allocator-driven TRICKLE) | cycles run: 5 (0, 111–114) |
stop reason: definition-of-done re-derived clause by clause and met at cycle 113, backlog at
0 todo / 0 blocked, every remaining VALUE_LOOP candidate locked out by the brief — DONE, not
stalled, with ~20.4 h of authorized clock deliberately unspent.

## What worked

- **Direct-Agent build waves on fable in a review-gated headless session** merged clean twice
  running: k=2 at cycle 112 (T-214 + the salvaged T-216), k=1 at cycle 113 (T-215). Zero
  reverts, zero failed verifies, zero merge conflicts across the whole run; `wave_streak`
  reached 1 and `k_current` held at 4 without ever being exercised past 2 (cycles 112, 113).
- **Shaping the gate's predicate as a pure function of a supplied state** is what made the
  run's central claim provable. T-215's `reportPointerViolations({reportText,
  archiveFilenames})` never reads the tree, so cycle 113 could show it RED against the edit
  WRAP_UP had not yet made — 2 violations, one per pointer copy — and green against the same
  pending state corrected. Cycle 114 then made that exact edit and the live gate went green,
  suite 269 → 271 (cycles 113, 114).
- **Two-arm attribution against the live tree, not a fixture**: the mutation (create the
  archive, touch neither pointer) failed exactly one named test with the gate present and was
  invisible to all 256 pre-existing tests with it removed, with gate and document sha-checked
  byte-identical either side (cycle 113).
- **An adversarial inline PLAN** refuted a documented claim instead of filing work around it:
  REPORT.md's "edit them into disagreement and the suite goes red" was falsified against the
  live tree at cycle 111, which is what produced T-214 rather than a vague hardening item.
- **Crashed-cycle salvage** recovered T-216 from a dead cycle rather than re-running it
  (cycle 112 salvage commit `15cd6b1`).

## What thrashed

- **The dashboard renderer, twice** (cycles 112, 113) — why: both renderers rebuilt state by
  scraping their OWN previous render. Cycle 112's burn-up regex stopped matching when the
  series gained a `title` attribute and silently picked up unrelated height spans — a wrong
  series that still looked like a series; cycle 113 measured 403 timeline spans for 17 real
  cycles because the template's `{{TIMELINE_HTML}}` placeholder occurs three times and a
  whole-string substitution refills all three, compounding every render. Cycle 112 patched the
  output; only cycle 113 fixed the mechanism (derive both series from the committed journal,
  then measure the rendered file rather than assume the strings landed). SWARM tooling defect,
  not a moon defect; the durable template fix is a human edit under hard rule 5.
- **Three of twelve conductor gate cells at cycle 113 were mis-aimed** — why: each was authored
  against an idealized tree rather than the one on disk. A `no-hardcoded-dates` cell went red on
  a comment illustrating a heading format; a `failedNames` regex swallowed node:test's
  `✖ failing tests:` summary header; a restore check demanded an exactly-clean tree while the
  cycle's own gate scripts sat untracked. None was a defect in the shipped work. All three were
  re-aimed and BOTH versions kept on disk (cycle 113).
- **Permission denials in every cycle that counted them**: 5 at cycle 0, 4 at cycle 113, 3 at
  cycle 114; cycles 111–112 did not tally theirs, so the run total is at least twelve and is
  reported as a floor, not a count. Why: KI-2's allowlist gap, unchanged and structurally
  re-confirmed for the eleventh consecutive run (settings.json read at cycle 114 — no denial
  burned). Each had a working alternate form. The recurring shapes are worth naming because
  they are mechanism, not luck: an env-var prefix (`RUNFILE=… script`) makes an otherwise
  allowlisted script unanalyzable to the matcher (hit at cycle 0 and again at cycle 114),
  `cd <target> && git …` is refused where `git -C <target>` is allowed, and a `jq` program
  containing quoted strings parses as unanalyzable shell.

## Pacing honesty

- Governor clamps: 0 cycles (ceiling 5, `weekly.ok` false both probes — disengaged, reported,
  never acted on); full-mode overrides: 0; promote-rung promotions: 0. Both real probes landed
  gear 3 cruise (ρ 0.62 at cycle 113, ρ 0.52 at cycle 114), guest mode with the dial forced to
  1.00, `probe_failures` 0 throughout. The window reset between cycles 112 and 113 (20.8 M →
  5.6 M tokens), so per-target burn attribution was skipped that cycle by rule rather than
  estimated. This window will reset far under full utilization — the run ended 20.4 h early
  with the gear at cruise the whole time. That is the trickle brief's scoping outcome, not a
  thermostat failure: there was no authorized work left to spend it on.

## Config recommendations

- [qa] Extend the sealed-gate lesson with the predicate's SHAPE: a check that can only read the
  live tree can only be shown red after the edit lands, so make it a pure function of a supplied
  state and prove it red against the pending edit first (evidence: cycles 113–114, T-215).
- [qa] Extend the never-assert-against-a-regexed-prose lesson to renderers that carry state
  forward out of their own previous output — derive from the committed source every time
  (evidence: cycles 112, 113, both dashboard addenda).
- [process] Extend the allowlist lesson with the env-prefix form: an allowlisted script invoked
  with a leading environment assignment is denied; pass the environment through a child-process
  spawn instead (evidence: cycles 0 and 114, the same shape twice).
- [qa] Re-observed: attribute a failing gate cell to the instrument or to the work before the
  verdict touches attempts (evidence: cycle 113, 3 of 12 cells).
- [process] Re-observed: read the authoritative source rather than triggering the lock — the
  playbook script's absence from the allowlist was confirmed by reading settings.json at cycle
  114, burning no denial (evidence: cycle 114).

## House-rules proposals

- [docs] A document that points at its own archives must enumerate them from the directory
  listing at check time, never from memory — and both copies of the pointer must be checked
  independently, so a single drifting copy is attributed to that copy.

## Applied lessons check

- L-008: re-observed — sole-committer + in-repo scratch line carried in both waves; no builder
  commit, no stray scratch tree (cycles 112, 113).
- L-016: re-observed — the headless direct-Agent dispatch clause is now the norm here; two more
  clean waves, zero cross-scope contamination (cycles 112, 113).
- L-022: not-exercised — browser/SPA persisted-UI-state lesson, held out of prompt_lines at
  kickoff; this target is a zero-dependency terminal CLI with no browser surface (fifth
  consecutive run with this disposition).
- L-024: not-exercised — no new domain computation shipped this run; the run's work was
  document-truth gating, where the discriminator idea has no purchase.
- L-026: re-observed — both waves routed core work to fable and both arrived verified on the
  first attempt (cycles 112, 113).
- L-029: re-observed — every added test was shown failable AND attributable by running the
  mutation with and without it (cycle 113, arm1/arm2).
- L-031: re-observed — T-214's surface was found by mutation-measuring documented claims, not by
  reading the suite for gaps (cycle 112).
- L-033: re-observed — T-215 classified three BOUNDARY items in its own header (archive content,
  the future-tense promise, and recency ranking) rather than faking checks for them (cycle 113).
- L-034: not-exercised — no review-fix pass ran; the run had no code surface to refute.
- L-037: not-exercised — no spawn died on a usage limit this run. Five spawns after the 07:19
  auto-kickoff, each followed by its own `cycle-done`; the last `cycle-failed` entries in the
  pacer log are 04:35–04:56, before this run existed (cycles 0, 111–114).
- L-038: re-observed — stop_at sits strictly inside the reset boundary and the run never reached
  the emptiest part of the window; it ended for scope reasons first.
- L-042: re-observed, and extended — sealed gates held, and cycle 113 added the supplied-state
  shape that let the seal be proven red against an edit that did not exist yet.
- L-043: re-observed, and contradicted in one direction — the lesson's own failure mode
  reappeared in SWARM's renderer rather than in the target's tests: a carry-forward regex bound
  to the shape of its own output (cycles 112, 113).
- L-044: re-observed — every killing mutation was paired with a converse control that had to
  stay green (cycle 113, `unrelated-edit` and `pending-edit-fixed`).
- L-046: not-exercised — no new user-facing capability shipped; nothing to drive through an
  outermost layer.
- L-047: re-observed — 3 of 12 gate cells failed for instrument reasons and were attributed to
  the instrument, not to the item's attempts counter (cycle 113).

## Telemetry

- Weekly utilization at the last probe (cycle 114): overall 42.9 %, premium (opus) 66.7 %,
  against 3.4 % of the week elapsed. Governor disengaged (`weekly.ok` false) throughout.
- Allocator: posture `trickle` at every pacer decision this run; allowance granted was never the
  binding constraint — the brief was.
- Auto-kickoffs: 1 (this run, allocator-driven, hints consumed and deleted at cycle 0). No
  3-strike queue drops.
- Final-hours floor release: did not fire — the run wrapped 20.4 h before stop_at.
