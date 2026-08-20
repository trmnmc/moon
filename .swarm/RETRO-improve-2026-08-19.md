# moon — run retro

<!-- Written by /swarm WRAP_UP. Evidence rules apply here exactly as in the verification
     gate: every entry cites cycle numbers from .swarm/journal.md. No cycle number, no
     entry — vibes are not evidence. -->

Run: 2026-08-19 (improve-5, allocator TRICKLE) | cycles run: 5 (98–102) | stop reason:
definition of done re-derived clean at cycle 102 and no VALUE_LOOP candidate passed the
two-part ratchet — early DONE, ~22.3h of authorized clock unspent, by decision.

## What worked

- **Every wave merged clean: 0 reverts, 0 failed verifies, 0 items blocked, 0 items at
  `attempts ≥ 2`** across the run's three build cycles (99, 100, 101). The gear-2 cap bound
  every wave to ≤ 2 items; `k_current` sat at 3 and never bound. Four items built, four
  verified (T-201, T-203, T-204, T-205); one adjudicated and dropped (T-202, cycle 100).
- **The two-arm proof plus a converse GREEN control (L-029 + L-044) is what actually caught
  things.** Cycle 101 is the clearest instance: C6 is a discriminator that a degenerate
  "keep the first citation only" fix would fail while passing C2 and C3, and it was run in
  two arms (retargeting the first and the last of four identical tokens) so neither end
  could be special-cased. C7 supplied the removed-arm that must go green, C8 the converse
  control that must stay green. Six of the thirteen checks that cycle existed only to make
  the other seven falsifiable.
- **Sealing the gate by hash before dispatch (L-042) held for three consecutive waves**
  (cycles 99–101) — builders never saw the check that would judge them, and no item needed
  a second attempt.
- **Filing rather than patching kept the gate honest.** At cycle 100 T-204 passed on its
  acceptance and the three duplicate test names its widening introduced were filed as T-205
  rather than quietly patched by the conductor or used to fail the item. The follow-on item
  then closed cleanly at cycle 101.

## What thrashed

Nothing in the artifact. The thrash was entirely in the conductor's own instruments.

- **Four conductor instrument defects in five cycles** — cycle 99 (the dashboard notify
  line, the 8th on this target), cycle 100 (a citation classifier that mislabelled three
  narrative tokens as live), and two at cycle 101 (below). That is 11 cumulative on this
  target — why: **every one of them sat in a check that graded PROSE or re-encoded
  something the repo already states**, rather than reading a structural marker the artifact
  owns. The repo's own tests honor L-043; the conductor's gate scripts kept not doing so.
- **The dangerous defect failed in the PASSING direction** (cycle 101). A TAP error
  extractor matched a 4-space indent against a block node indents by two, so C5 and C6
  printed `(message not parsed)` while the sealed claim asserted those messages "name both
  the cited line and the actual line" — a claim the conductor had therefore never read.
  Why it matters: the sibling defect the same cycle (calling `.trim()` on
  whitespace-significant `git status --porcelain`, eating the XY column) failed LOUDLY and
  cost one re-run. Same root cause, opposite direction, wildly different blast radius.
  Per standing precedent the extractor was **removed rather than widened**, and the raw TAP
  stanza dumped verbatim; the re-run is what produced the evidence quoted in the journal.
- **A sealed gate that was not actually sealed** (cycle 99). The seal was written under
  `runs/`, which is gitignored, so it was never committed. Caught the same cycle and
  corrected in a follow-up commit with the hash re-verified — the claim was corrected
  rather than left standing, but L-042's mechanism had a hole in this repo's ignore rules
  that nothing checked for.

## Pacing honesty

- Governor clamps: **5 of 5 cycles** (ceiling hit: 2, every cycle). `weekly_heat` ran
  2.53–2.54 against a 1.3 threshold with `weekly_used_pct` and `opus_used_pct` both at 100,
  so `promote` was blocked for the entire run. The clamp and the thermostat agreed rather
  than fought: measured ρ was 1.24–1.33, which lands gear 2 on its own.
- Mode `guest` throughout, so the runfile's `dial: 0.3` was overridden to 1.0 by the mode
  rule — worth stating because the runfile still reads 0.3 and that looks like a live
  setting.
- Full-mode overrides: 0. Promote-rung promotions: 0 (blocked all run). Demotions were in
  force every cycle; no item was demoted below sonnet because none was a build/fix item on
  a lower rung to begin with.
- No window reset below 90% utilization occurred during the run.

## Config recommendations

- [qa] A verification check that cannot parse the evidence it was written to read must fail
  CLOSED — render UNKNOWN or FAIL, never PASS — and a mis-parsing extractor should be
  deleted in favour of dumping the tool's raw output verbatim, never widened until it
  agrees; a parse failure in the passing direction ships an unearned claim, while the same
  defect in the failing direction costs one re-run [apply: prompt line all] [confidence:
  high] [source: 2026-08-19 moon] (evidence: cycle 101, two defects, one in each direction)
- [qa] Before declaring a cross-reference audit clean, enumerate every citation FORM and
  every DIRECTION, not just every file — this repo cites code from docs as both
  `path/file.js:N` and a bare `:N` shorthand, and the gate built this run covered only the
  test→doc direction, leaving doc→code hand-audited [confidence: med] [source: 2026-08-19
  moon] (evidence: cycle 102, seven doc→code citations re-derived, two of them shorthand a
  path-anchored sweep missed)
- [process] On an improvement run over an already-shipped repo, a drained backlog is the
  START of the value scan and never its conclusion, and the scan runs in BOTH directions —
  an item the spec still lists as open may already be shipped [confidence: high] [source:
  2026-08-19 moon] (evidence: cycle 102 — the KI-5 reader self-check, open since cycle 62
  and listed as a nice-to-have at this run's kickoff, was found already present in README
  and independently confirmed correct)
- [process] Verify that a gate seal is committed where the repo actually tracks it — a seal
  written under an ignored path satisfies every step of the sealing ritual and protects
  nothing [confidence: med] [source: 2026-08-19 moon] (evidence: cycle 99, seal written to
  gitignored `runs/`, corrected same cycle)

## House-rules proposals

- [review] A check that grades prose owes its own converse control; if you cannot state the
  input that must leave it green, read a structural marker the document owns instead.

## Applied lessons check

- L-008: re-observed (cycle 101 C12 — exactly one modified file, zero scratch, lockfile or
  `node_modules` residue; and cycle 102, where the conductor's own `/tmp` write was blocked
  by the working-directory fence, which is the clause's own point)
- L-016: not-exercised (no review-fix wave ran; last was cycle 73, run 3)
- L-024: re-observed (cycle 101 C6, a discriminator a degenerate fix cannot pass; cycle 102,
  where the border-vs-border comparison is non-discriminating at 68 = 68 and the
  border-vs-text one differs by 32 columns)
- L-026: not-exercised (no core-logic item; every item this run was doc- or test-shaped)
- L-029: re-observed (cycles 99, 101 — C5/C6 present-arm, C7 removed-arm green)
- L-031: not-exercised (a fifth mutation sweep was an explicit non-goal of this run's spec)
- L-033: re-observed (cycle 100 adjudicated T-202 BOUNDARY and dropped it rather than
  hardening; cycle 102 independently re-confirmed that call — `:281`, `:346` and `:358` all
  name the throw line, so the convention is consistent and there was nothing to fix)
- L-034: re-observed (cycle 98 refuted one planner claim before it became an item; cycle 102
  applied the same stance to its own DONE conclusion). No reviewer or QA wave ran this run.
- L-039: re-observed, both halves (kickoff — `swarm-playbook.sh parse` denied under its
  exact absolute-path form for the 5th consecutive kickoff, KI-2; cycle 102 — the identical
  script path SUCCEEDED bare as `/opt/swarm/bin/swarm-budget.sh` but was DENIED as a
  compound `cd … && RUNFILE=… ./bin/…` invocation, which is the lesson's diagnosis half
  exactly)
- L-041: re-observed, and this run is its sharpest instance (cycle 101 — the TAP extractor
  counted failures while parsing no failure names and printed "(message not parsed)")
- L-042: re-observed with a hole (cycles 99–101 sealed three waves clean; the cycle-99 seal
  itself landed on a gitignored path — see What thrashed)
- L-043: re-observed (cycle 98 audit B clean by structural read; cycle 101 C9 exercised the
  fails-OPEN clause and kept "the promise moved" distinct from "the promise is gone")
- L-044: re-observed (cycle 101 C8 — a blank line at README EOF that moves nothing must
  leave the suite green, and did)
- L-045: re-observed and load-bearing (cycle 102 — a drained backlog was explicitly not
  treated as done, and the reverse direction fired too: a nice-to-have named as open turned
  out already shipped)
- L-046: re-observed (it is why T-201 exists — the audit found two documented capabilities,
  `-h` and `--south`/`--north` last-one-wins, proven only against `parseArgs()` and never
  against the spawned `bin/moon.js`)

## Telemetry

- Weekly utilization at this run's close: overall 100%, premium (opus) 100% — both already
  at cap, which is why the governor clamped every cycle of this run.
- Allocator: this run was granted a TRICKLE slice (housekeeping only, no new features). It
  burned 5 cycles of an authorized ~27h window and returned ~22.3h unspent.
- Auto-kickoffs: 1 (this run, allocator-sourced hints). No 3-strike queue drops observed.
- Final-hours floor release: did not fire — the run wrapped ~22h before `stop_at`.
</content>
</invoke>
