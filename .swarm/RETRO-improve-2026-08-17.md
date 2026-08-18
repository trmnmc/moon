# moon — run retro (improvement run 3)

<!-- Written by /swarm WRAP_UP to <target>/.swarm/RETRO.md. Evidence rules apply
     here exactly as in the verification gate: every entry cites cycle numbers
     from .swarm/journal.md. No cycle number, no entry — vibes are not evidence. -->

Run: 2026-08-17 16:12:20 UTC → 2026-08-18 01:35 UTC | cycles run: 19 (66–84) |
stop reason: **DONE — definition-of-done met and re-verified from evidence, with ~14.4 h
of clock deliberately unspent.** Not a cap, not a stall. See "Why this run stopped" in
REPORT.md.

## What worked

- **Sealing the verification gate by hash before dispatch (L-042), and then smoke-running
  it against HEAD.** The seal alone proves the check predated the work; the smoke run is
  what proves the check *works*. At cycle 77 both sealed gates were smoke-run against HEAD
  before dispatch and that smoke caught **four defects in the conductor's own instruments,
  two of them FALSE PASSES** — the dangerous direction, since a false pass ships unverified
  work under a green label. (cycles 77, 80, 82, 83)

- **Authoring the mutation arms independently of the builder's own.** At cycle 82 the
  builder supplied a block-surface mutation (a cover-cut at 0.008); adopting it would have
  violated step 6.1 on the very run whose premise is that an unattributable kill is not
  evidence. The conductor instead measured which `k` values the pre-cycle suite actually
  exercises and derived a mutation in the gap (`k ≥ 0.0015`) — survives the old suite, dies
  on the new one, killed by exactly one named test. Mechanistically different from the
  builder's, which is what makes it independent evidence rather than a re-run of their
  homework. (cycle 82; same discipline at 80, 83)

- **The CONVERSE control as the decisive gate check, not the kills.** T-180's four killing
  mutations (M1–M4) all prove the new assertions are live — but every one of them would
  also die against a degenerate implementation, a snapshot test that hashes REPORT.md, and
  that implementation is worthless because it fires on every legitimate prose edit. **M5 —
  reword prose inside a description cell, suite must stay GREEN — is the arm that separates
  them.** Dying on M1–M4 *while surviving M5* is a property a snapshot test cannot have. The
  pair licenses the claim; neither half alone does. (cycle 83; same shape at cycle 22)

- **Sequential dispatch inside a wave whenever semantics overlap, despite disjoint
  `files_hint`.** Three separate times the step-4 composition rule admitted a pair it should
  not have: T-165+T-166 (both builders self-run `node --test test/*.js`, so a half-written
  edit by one reads as a spurious failure for the other, c74); T-167+T-174 (T-174's entire
  content is a test count T-167's builder was certain to change — it did, 160→161, c79);
  T-173+T-174 (T-174's acceptance is a measurement OF the tree T-173 edits, c80). Catching
  all three before dispatch cost three re-compositions and zero reverts. (cycles 74, 79, 80)

- **Routing the correctness core to fable (L-026) when the cheaper tier had already failed
  on judgment.** T-167 attempt 1 failed on exactly the call a cheaper tier got wrong — a
  fixed absolute cut on a sub-sample-quantized quantity. Attempt 2 was flagged
  `route_class="core"` → fable, exempt from the gear-2 demotion by the fable guard, and
  passed. (cycles 77, 79)

- **Searching the SPEC rather than the backlog for authorization.** Cycle 82 handed cycle 83
  the framing "POLISH, or WRAP_UP if nothing clears the ratchet", having searched the
  backlog and the step-4 pass list — both genuinely drained. What it never searched was
  `SPEC.md` §78–92, a **Nice-to-haves** section of three named, pre-approved items behind a
  gate that had been open since cycle 80 and that nothing in the pipeline reports on.
  Wrapping up with three spec-authorized items untouched would have been leaving named work
  on the table. **A drained backlog means the QUEUE is empty, never that the SPEC is
  satisfied.** (cycle 83; the same error caught in the DONE direction at cycle 26)

- **Eliminating a named item on evidence instead of building it, for the price of one
  grep.** Nice-to-have #1 (sharpen the KI-5 note to a one-line self-check) looked like the
  highest-value item available — the only one an end user would ever see. `README.md:231-236`
  already carries a **Self-check** stanza; `git log -S "Self-check"` traced it to `def98fd`,
  cycle 63 of run 2, whose commit body records the verification (368 real `renderBlock`
  frames, both hemispheres, UCD 15.0.0 widths, zero misleading frames either way). The list
  that named it was simply stale. Rebuilding it would have been exactly the
  diminishing-return churn this run's spec names as its chief risk. (cycle 83)

- **Wave arithmetic, plainly:** 24 items verified done across 19 cycles, 3 at `attempts: 1`
  and all 3 ended `done`, **zero items blocked, zero at the attempt cap, zero merge
  conflicts, one reverted merge** (T-160, c71). Effective wave size was 1–2 all run (gear
  cap 2 vs `k_current` 5 — the gear bound, never the autotune).

## What thrashed

- **The conductor's own verification instruments, repeatedly — this is the run's dominant
  thrash source and it is not close.** Recorded instances: cycle 72 (gate v1 returned 12
  failures against the builder tree; **every one was a bug in the gate, none a finding about
  the work**); cycle 76 (G3's file list); cycle 80 (the sealed T-173 gate returned four
  flags, all four defects in the instrument, **two of them vacuous passes**); cycle 81 (gate
  v1 was a vacuous pass, replaced by a strictly stronger v2); cycle 82 (three instrument
  bugs — a scratch-tree copy that excluded `.swarm/`, which `test/contracts.test.js` reads
  at module load; a band probe that counted caption-row letters as lit; a novelty check that
  could never pass); cycle 83 (T-181's verifier split on `\n---\n\n`, a sequence the journal
  body itself contains, and reported `BYTE-IDENTICAL: false` with 4876 missing lines — which
  reads as catastrophic data loss and was not).
  — why: the recurring mechanism is named on the record at cycle 83 and it is one thing,
  **the conductor's regex or scope narrower or looser than the text it measured** (c8
  `.trim()`, c9 sentence-scope, c19 line-wrap, c82 `.swarm/` filter, c83 the `---`
  split). Gates are authored fast, against trees and documents the conductor has not fully
  characterized, and the failure is silent in the dangerous direction. The mitigation that
  demonstrably works is cycle 77's: smoke-run the sealed gate against HEAD *before*
  dispatch. Every widening of a repaired instrument was paired with a strictly stronger
  assertion (c80, c82), and no repair moved a bar (step 6.5). (cycles 72, 76, 80, 81, 82, 83)

- **T-160 reverted in full at cycle 71**, its only reverted merge, after 3 of its 4
  sub-goals were independently confirmed correct.
  — why: the fourth re-asserted a false claim ("run 2 sent zero pushes") **and invented a
  mechanism to explain the zero**. Committing the three good parts would have shipped a
  fabrication alongside them inside the one document whose entire premise is the
  VERIFIED-vs-CLAIMED distinction. No partial credit; the confirmed sub-results were kept as
  evidence text so attempt 2 cost minutes rather than a cycle. Passed at c72. (cycles 71, 72)

- **T-165 attempt 1 failed the gate at cycle 74 on a regression it introduced, not on its
  own acceptance** — the sealed gate PASSED it 5/5.
  — why: the EPIPE guard set `process.exitCode = 0` on a closed pipe from *either* stream,
  so `moon --nope 2>&1 | true` exited 0 where README documents 2. The failure was found by a
  conductor probe written after reading the delivered diff. The general lesson is on the
  record: **a sealed gate proves the check predated the work; it does not prove the check
  anticipated the work.** Reading the diff for what the gate could not have known to ask is
  still the conductor's job. (cycle 74)

- **T-167 attempt 1 failed and the retry was deferred two cycles.**
  — why: at cycle 77 the routing rules composed to a repeat of the configuration that had
  already failed, so re-dispatching would have bought a second identical failure. The
  deferral was a decision, recorded as one, and the fix was a routing change (→ fable) rather
  than another attempt at the same rung. (cycles 77, 79)

- **KI-2, the SWARM allowlist gap — 13 further denials this run, and the sanctioned repair
  path is itself blocked for the third consecutive run.**
  — why: the allowlist matches the literal leading command token, and
  `bin/swarm-budget.sh` / `bin/swarm-playbook.sh` have **no entry at any path**. Cycle 83
  closed the last standing hypothesis by re-attempting at the absolute path
  `/opt/swarm/bin/swarm-budget.sh` (every prior attempt across three runs used the relative
  form) — refused identically — then read the cause directly out of
  `SWARM/.claude/settings.json`. It is a missing entry, not a path-form mismatch, so no
  invocation form can ever succeed. The KICKOFF step-5 `Edit` that is *explicitly authorised*
  to repair it was itself denied at all three kickoffs. **KI-2 is structurally unclosable
  from inside a run.** Deliberately not routed around via `python3`/`node` (both allowlisted):
  that would produce a green artifact over a boundary the user never granted. (cycles 68, 79,
  83; kickoffs 2026-08-14/16/17)

- **One instance of the conductor mis-framing its own finding, self-caught.** At cycle 76 the
  `US/Samoa` hemisphere gap was filed as a failed doc re-verification against REPORT.md:55
  ("all 418 zones"). Measuring settled it the other way — `Intl.supportedValuesOf('timeZone')`
  is exactly 418 on this host and contains **no legacy aliases at all**, so REPORT.md:55 is
  true as scoped and the alias table simply has a gap. The framing was withdrawn in writing
  and the item survives as explicitly not-buildable. Recorded here because withdrawing your
  own framing is the behaviour to keep, not a defect to hide. (cycle 76)

## Pacing honesty

- Governor clamps: **9 of the 13 cycles with a recorded runfile mirror** ran at gear 2 under
  a weekly-governor clamp (ceiling 2); the other 4 ran at gear 3 cruise. Ceilings hit: **2**.
  Full-mode overrides: **0** (mode was `thermostat`, dial 0.5 all run). Promote-rung
  promotions: **0** — `promote_blocked: true` for the entire run, `weekly_heat` never once
  below its 1.3 trigger (readings 1.5666 → 1.5886 → 1.5574 at cycles 81/83/84).
- **Window utilization at reset: NOT MEASURED, and reported as not-measured rather than
  estimated.** `bin/swarm-budget.sh` was denied on every invocation (KI-2), so
  `window_tokens`, `tokens_per_hour` and `projected_depletion_at` are all structurally 0 and
  no in-run window boundary was ever observed. `usage_reset_at` in the runfile is flagged
  ESTIMATED on its own face. Every gear this run rests on `runs/allocator.json` posture plus
  the evidence rule (no burn data → cruise), never on measured ρ. ρ was `0` all run because
  it was unmeasurable, not because burn was zero.
- Voluntary idle cycles: **0**. Effective wave size was gear-bound (cap 2) rather than
  autotune-bound (`k_current` 5) on every cycle that dispatched a wave.
- Weekly state at wrap-up: `weekly_used_pct` 19.0 at `week_elapsed_pct` 12.2 —
  **weekly_heat 1.5574, still 20% over the governor's trigger.** Stopping ~14.4 h early
  relieves pressure that was already above pace; it does not waste headroom that existed.

## Config recommendations

- [qa] Smoke-run every sealed verification gate against HEAD *before* dispatch, not just
  after the builder returns — the seal proves the check predated the work, the smoke run is
  the only thing that proves the check works at all [apply: prompt qa "Before dispatch, run
  your sealed gate against unmodified HEAD and require the expected baseline result — a gate
  that has never been executed is not a check"] [confidence: high] [source: 2026-08-18 moon]
  (evidence: cycle 77 — four instrument defects caught, two of them false passes; the six
  instances at cycles 72/76/80/81/82/83 are what happens without it)

- [qa] Pair every killing mutation with a CONVERSE control that must SURVIVE — kills prove
  an assertion is live but cannot distinguish a real check from a snapshot hash, and only the
  survive-arm rules the degenerate implementation out [apply: prompt qa "For every mutation
  that must kill the suite, author one control that must leave it GREEN — a check that dies
  on everything is a snapshot test, not an assertion"] [confidence: high]
  [source: 2026-08-18 moon] (evidence: cycle 83, T-180 M5)

- [wave] Disjoint `files_hint` does not imply disjoint semantics: dispatch sequentially
  whenever one item's acceptance is a measurement OF a tree another item edits, or both
  builders self-run the same suite [apply: wave 1] [confidence: high]
  [source: 2026-08-18 moon] (evidence: cycles 74, 79, 80 — three re-compositions before
  dispatch, zero reverts)

- [process] Before building an item named on a list, verify it is actually absent — one
  `grep` plus one `git log -S` is the whole cost, and a stale list is the cheapest source of
  diminishing-return churn there is [confidence: high] [source: 2026-08-18 moon]
  (evidence: cycle 83, nice-to-have #1 already shipped at run 2 cycle 63, `def98fd`)

- [process] A drained backlog means the QUEUE is empty, never that the SPEC is satisfied —
  before declaring DONE or picking filler work, re-read the spec for authorization sources
  the queue does not mirror [confidence: high] [source: 2026-08-18 moon]
  (evidence: cycle 83 found three pre-approved Nice-to-haves behind a gate open since
  cycle 80 that no cycle had ever opened)

## House-rules proposals

- [review] A finding is not a finding until the reviewer's own instrument has been run
  against the unmodified baseline and produced the expected result.
- [docs] Never annotate a document with a live count of anything the repo can change
  (tests, files, issues) unless a test parses that annotation — pin it to a measurement
  point instead ("171 at commit `<sha>`"), or machine-check it.

## Applied lessons check

Fifteen lessons were staged as applied at kickoff; five were deliberately **not wired** into
`prompt_lines` because they instruct browser/React/SPA behaviour and `moon` is a
zero-dependency terminal CLI with no browser surface (recorded in
`runfile.playbook.not_wired`, same call run 2 made).

- **L-008** (conductor is sole committer): **re-observed.** Wired into all three role prompt
  sets; zero builder commits across 19 cycles and ~14 dispatches. (cycles 66–83)
- **L-011** (React hook mount tests): **not-exercised** — no React, no browser surface.
- **L-016** (pairwise-disjoint fixer file sets): **re-observed, and sharpened.** Held for the
  review-fix pass at cycle 73; cycles 74/79/80 then showed the rule is *necessary but not
  sufficient* — disjoint files still collided semantically three times. Proposed as a
  candidate lesson above.
- **L-018** (post-merge browser look pass): **not-exercised** — terminal CLI, correctly
  skipped and journaled as skipped rather than silently omitted (cycle 83).
- **L-020** (env-var deletion in `beforeEach`): **not-exercised** — `src/` and `bin/` contain
  zero `process.env` references (measured at cycle 81).
- **L-021** (hard-reload after server restart): **not-exercised** — no server.
- **L-022** (clear persisted UI state per test file): **not-exercised** — no UI state.
- **L-024** (verify with a discriminator, not a remembered reference): **re-observed.**
  Cycle 83's T-180 M5 converse control is the same move generalised; cycle 83's independent
  corroboration of the archive cut point (738 KB matching SPEC.md's separately-recorded
  figure) is another. (cycles 82, 83)
- **L-026** (route the correctness core to fable): **re-observed.** T-167 attempt 1 failed on
  a cheaper tier at exactly the judgment call; attempt 2 at fable passed. Also the routing
  behind T-155 and T-157, the run's two hardest items, both first-attempt clean.
  (cycles 69, 77, 79)
- **L-029** (failable AND attributable, two arms): **re-observed** — it is a SPEC must-have
  this run and every added test carries both arms in the journal. Cycle 82 is the sharpest
  confirmation: the conductor refused the builder's own mutation *because* adopting it would
  make the kill unattributable to an independent check. (cycles 69, 70, 77, 78, 82, 83)
- **L-031** (find surfaces by mutation-measurement, not by reading): **re-observed** at
  cycle 69's flag-interaction matrix — the one axis no prior sweep had covered, enumerated
  and mutated rather than read. (cycles 69, 70)
- **L-033** (classify HOLE vs BOUNDARY before hardening): **re-observed, and load-bearing.**
  Cycle 69 classified four HOLEs and hardened exactly those at cycle 70; cycle 81
  pre-classified T-176 **BOUNDARY before any test existed**, which is why its acceptance
  forbids touching `src/render.js` and requires a pin plus a written caveat instead of the
  taste agent's suggested re-tune. Without L-033 that finding becomes a behaviour change.
  (cycles 69, 70, 81, 82)
- **L-034** (brief reviewers to REFUTE): **re-observed.** The cycle-73 review-fix pass and
  the cycle-76 QA pass both ran refutation briefs; cycle 76's look agent produced a finding
  the gate then refuted, and the spec-only scenario author returned with `tool_uses = 0`,
  evidencing its independence rather than asserting it. (cycles 73, 76)
- **L-042** (seal the gate by hash before dispatch): **re-observed, and extended.** Sealing
  worked exactly as advertised — and cycles 74 and 77 together show what it does *not* buy:
  it proves the check predated the work, not that the check is correct or complete. The
  extension (smoke-run against HEAD first) is proposed above. (cycles 74, 77, 80, 82, 83)
- **L-043** (never assert against prose matched by regex): **re-observed, and the run's most
  expensive lesson to relearn.** T-180 was built to L-043's letter — it reads structural
  markers (id sets, heading counts, table row counts) the document owns, and M5 proves it
  ignores prose. Meanwhile the conductor's *own* instruments violated it six times
  (cycles 72, 76, 80, 81, 82, 83), which is the asymmetry worth carrying forward: the rule
  was enforced on builders and not on the conductor. (cycles 80, 82, 83)

## Telemetry (squeeze slice, 2026-08-14)

- **Weekly utilization achieved at reset: not applicable — no weekly reset occurred in-run**
  (`week_resets_at` 1787547599 = 2026-08-20). State at wrap-up: 19.0% overall / 11.0%
  premium at 12.2% of the week elapsed.
- **Allocator: allowance granted vs actually burned — granted is on record, burned is NOT
  MEASURED.** `allow_premium_pct` moved 0 → 8.329 → 8.516 as posture left `trickle` for
  `normal`; actual burn is unmeasurable because the budget probe is denied (KI-2). Reported
  as not-measured, not estimated.
- **Auto-kickoffs this run: 1** (allocator-driven improvement run, `brief` non-empty,
  `source: allocator`). Posture at start: `normal`. 3-strike queue drops: 0.
- **Final-hours floor release: did not fire** — the run reached DONE ~14.4 h before
  `stop_at`, so there was no final-hours window to release into.
