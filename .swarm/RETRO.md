# moon — run retro (improvement run 2)

<!-- Written by /swarm WRAP_UP. Evidence rules apply exactly as in the verification gate:
     every entry cites cycle numbers from .swarm/journal.md. No cycle number, no entry. -->

Run: 2026-08-16 13:37 → 2026-08-17 06:17 UTC (second improvement run on shipped v0.1.0) |
cycles run: 48 (kickoff) → 65 | stop reason: **STOPPED SHORT — the weekly usage cap was
exhausted mid-cycle-65 at 20:02 UTC and every pacer spawn after it died at HTTP 429 until
the 05:00 UTC weekly reset.** `stop_at` was 04:59:59 UTC, so the run's entire remaining
window — 20:08 → 05:00, about 8h 50m of a 15h 20m budget — was unreachable. Wrap-up ran
at 06:17 on the first spawn that got an API turn.

This is the second housekeeping retro on a product that was already shipped and already
housekept. Its subject is measurement: what the suite can and cannot discriminate. Read it
as a report on the instrument.

## What worked

- **Mutation-measurement found the work; reading the suite never did.** Four sweeps covered
  every source file in the repo: `src/render.js` (cycle 52, 26 mutants / 19 killed / 7
  survived), `src/args.js` + `src/hemisphere.js` (cycle 53, 24 / 21 / 3), the `src/astro.js`
  behaviors outside the T-129 battery (cycle 54, 16 / 8 / 8), and `bin/moon.js` (cycle 64,
  the last unswept file). Every survivor was classified HOLE or BOUNDARY before anything was
  hardened, per L-033. The classification carried real weight rather than rubber-stamping:
  all 8 astro.js survivors were judged BOUNDARY and **no test was written for any of them**
  (cycle 54), while the three render.js HOLEs (L1/L3/O3, the limb-glyph threshold cascade at
  thin crescents) became the run's highest-value items. A sweep that produces zero tests is
  the mechanism working, not failing.

- **The two-arm proof is now routine and it is what keeps this run from being churn.** Every
  test added this run was shown FAILABLE (mutation applied, test present, suite red) *and*
  ATTRIBUTABLE (same mutation, test removed, suite green): T-149 (cycle 56, Arm B mutant
  survives 146/146), T-146 (cycle 55), T-154 (cycle 65, run against two independent mutant
  variants, with the single distinct failing test asserted by name in both A-arms). Three
  tests were added all run — 145 → 148. The reportable numbers are the ~66 mutants measured
  and the survivors classified, exactly as the spec demanded, and the count stayed small
  because most survivors were correctly refused.

- **The gate refuted builders instead of confirming them, and it worked on prose.** Cycle 62
  is the cleanest case: a haiku builder proposed a README self-check based on top-right vs
  bottom-right corner alignment, and the gate disproved the observable itself — all six frame
  glyphs are EAW Ambiguous, so both borders scale together and the corners stay aligned at
  col 66 of 68; the ragged edge is on the content rows at cols 34–37. The change was
  discarded rather than patched. L-034's refutation brief earned its keep on a docs item,
  which is not where it was learned.

- **Every gate failure recovered on one retry, at one rung up.** Two items failed (T-148 at
  cycle 58 on 1 of 11 regenerated figures; T-151 at cycle 62) and both passed on their sonnet
  retry (cycles 59, 63). Zero items reached `attempts ≥ 2`, zero became `blocked`, zero
  `known_issues` were opened by the attempt cap. Two runs in a row now, one failure plus one
  re-dispatch carrying the failure's specifics has been sufficient every single time.

- **The conductor's own instrument was debugged in the open rather than around.** Cycle 65's
  gate went through four harness versions before it produced a trustworthy answer — v1 called
  a non-existent method, v2 silently ran a 134-test subset because the file list was
  hand-enumerated instead of globbed, v3 parsed only the TAP `not ok` form while this Node
  emits the spec reporter's `x name` and returned "(none parsed)" as if that were a result.
  Each fix was to the harness; no claim, test, or assertion of the item under gate was touched.
  v3's fix is the transferable one: the parser now THROWS when the failure count is positive
  but no name parsed, so an unrecognized reporter fails loudly instead of reading as
  "no attribution". Cycle 57 owns two similar conductor repairs (a true citation
  `astro.js:363` deleted as "malformed" and restored; a stale ratchet-rejection argument left
  standing by a swapped todo list).

- **k=1 waves under gear 1 merged clean 14 times out of 14 dispatches.** Zero merge
  conflicts, zero reverted merges all run. A single-item wave has no cross-item file
  contention to get wrong, and at trickle posture it was the only affordable shape anyway.

## What thrashed

- **The run lost 58% of its wall-clock budget to the weekly cap, and no in-run mechanism
  noticed.** Cycle 65 hit 429 at 20:02 UTC after $4.38 and 62 turns; its journal block and
  commit `f45f2d6` landed, but the turn died before step 9. The pacer then spawned five more
  conductors (20:08, 22:10, 00:11, 02:13, 04:15) and every one died at 429 in under a second,
  `total_cost_usd: 0`, before its first Agent call — records in
  `SWARM/runs/cycle-{1786910898,1786918209,1786925497,1786932798,1786940110}.json`.
  Why the machinery was blind: limp mode is entered by the **tier probe** (SKILL.md Limp
  mode), which requires a conductor session that lives long enough to make four Agent calls.
  These sessions never got a turn, so `heartbeat.limp` stayed `false` for nine hours and the
  runfile's last word on pacing is still cycle 65's. The gap is structural — the only
  component that observed all six failures was the pacer, and the pacer does not write
  `limp`. (cycles 65 → wrap-up)

- **The budget probe has not produced a real reading since cycle 35 and the gear was never
  actually measured.** `probe_failures` sat at 8 with `last_real_probe_ts` frozen at
  1786906571; gear 1 was held for all 18 cycles on `runs/allocator.json` posture read straight
  off disk, never on burn evidence. Cycle 65's `gear_evidence` states this plainly rather than
  dressing a clock-cruise as a measurement, which is the right behavior — but it means the run
  had no idea how close it was to the wall it then hit. Why: KI-2, unchanged since cycle 35 —
  `SWARM/.claude/settings.json` allows `Bash(bin/swarm-notify.sh:*)` (relative) and
  `Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)` (the macOS path), and neither
  matches `/opt/swarm/bin/…` on this VPS; `swarm-playbook.sh` and `swarm-budget.sh` have no
  entry at any path. Hard rule 5 forbids the conductor from fixing it mid-run, so it has now
  degraded three consecutive artifacts: the budget probe, the notification channel, and this
  wrap-up's playbook append. (cycles 35 → 65)

- **A gate failure and a budget posture gave contradictory orders on docs items, and the
  collision recurred.** The routing ladder escalates haiku→sonnet after a failed attempt while
  gear-1 demotion pushes docs items sonnet→haiku; applied in sequence they return the item to
  the tier that just failed. Ruled at cycle 2 (evidence beats posture) and exercised again at
  cycle 62→63 for T-151. Why it thrashes: both rules are correct in isolation and neither
  text mentions the other, so it is re-derived from scratch each time it fires.

- **One no-value cycle, honestly counted.** Cycle 60's inline PLAN filed two candidates and
  verified nothing, so `consecutive_no_value` went 0 → 1 (reset at cycle 61). It also closed
  the CI nice-to-have on live evidence — five green Actions runs, checked by querying the
  runs rather than by reading the workflow file into a conclusion.

- **The known-issues surface is now the run's largest untouched liability, by design.** Three
  measured HOLEs are still open (T-153 `--block` + `--compact` interaction, T-155 the M25
  family where the illumination precision guard is provably blind forever to a scale-factor
  mutation, T-156 the unpinned `moon: ` stderr prefix). T-155 is the most severe finding of
  the entire sweep and is M-effort, which gear 1 never admitted. Why: not thrash but a
  posture consequence — at trickle with `allow_premium_pct: 0`, an M-effort item had no cycle
  it could be dispatched in, and the gear never rose because the window never refilled.

## Pacing honesty

- Governor clamps: **0** cycles (ceilings hit: none — `weekly.ceiling` stayed `null` all run
  because `swarm-budget.sh` never executed; the gear rested on allocator posture, not on the
  governor). Full-mode overrides: **0** (mode `guest`, dial 0.30, gears clamped 1–3).
  Promote-rung promotions: **0** (`promote: false` throughout; `promote_blocked: true`).
  Demotions were in force every cycle (`demote: true`), which is why no item this run ran on
  fable despite L-026 — the routing recommendation was affordable in exactly zero cycles.
- Underused windows: **none — the opposite failure.** The weekly window reached
  `weekly_used_pct: 100` / `opus_used_pct: 97` at the last reading (cycle 65) and then hard-
  stopped the run. Utilization was not the problem; landing the exhaustion 9 hours before
  `stop_at` was. Effective wave size was 1 in all 18 cycles (gear cap 1 vs `k_current` 5).

## Config recommendations

- [process] A pacer spawn that dies at HTTP 429 before its first turn is invisible to limp mode — the tier probe needs a session that lives, so the SPAWNER must write `heartbeat.limp` on a usage-shaped launch failure instead of retrying on the same schedule [confidence: high] [source: 2026-08-16 moon] (evidence: cycles 65→wrap-up; five zero-cost 429 spawns, `SWARM/runs/cycle-1786918209.json` and four siblings, `heartbeat.limp` still false at wrap-up)
- [process] Set a run's `stop_at` strictly INSIDE the weekly reset boundary, never equal to it — a `stop_at` on the boundary spends the whole tail of the run in the emptiest part of the window and cannot benefit from the reset it is waiting for [confidence: med] [source: 2026-08-16 moon] (evidence: `stop_at` 04:59:59 == `week_resets_at` 1786942800; cap hit 20:02, reset 05:00, wrap-up 06:17)
- [process] Allowlist helper scripts by ABSOLUTE path for the host they run on — a relative `Bash(bin/x.sh:*)` entry silently fails a headless session whose cwd is not the repo root, and the denial reads as a tool failure rather than as a config gap [confidence: high] [source: 2026-08-16 moon] (evidence: KI-2 open since cycle 35, degraded probe + notify + playbook append across two runs)
- [routing] When a ladder escalation from a FAILED gate meets a gear demotion on the same item, escalation wins — evidence about this item outranks a budget posture, and applying both returns the item to the tier that just failed [confidence: high] [source: 2026-08-16 moon] (evidence: ruled cycle 2, exercised cycle 62→63 for T-151, which then passed)
- [qa] A conductor verification harness must THROW when it detects failures but parses no failure names — a reporter-format mismatch otherwise returns "no attribution" that reads exactly like a real negative result [confidence: high] [source: 2026-08-16 moon] (evidence: cycle 65 harness v3, spec-reporter `x name` vs TAP `not ok`)

## House-rules proposals

- [docs] A limitation note must give the reader a self-check they can run in their own terminal, and the check's observable must be verified to actually differ under the failure mode — not merely to sound observable (cycle 62).
- [review] Regenerate captured command output; never hand-edit it, not even to fix an inconsistency you are certain about — file the inconsistency as an item instead (cycle 57, REPORT.md:142 left stale on purpose and pinned into T-148).

## Applied lessons check

- L-003 (qa, hand-computed expectations): re-observed (cycles 50, 61 — the T-150 gate parsed the count out of REPORT.md and matched it against a fresh suite run rather than eyeballing).
- L-006, L-007, L-011, L-018, L-020, L-021, L-022: **not-exercised** — staged as applied under `apply_mode: auto` but deliberately kept out of `prompt_lines`. All seven instruct browser/React behavior; moon is a zero-dependency terminal CLI with no browser surface.
- L-008 (conductor is sole committer): re-observed (all 18 cycles — no builder or fixer branch carried a commit the conductor did not make).
- L-016 (disjoint fixer file scopes): not-exercised — no review-fix pass ran this run; the last was cycle 23, now 42 cycles back.
- L-024 (verify with a discriminator): re-observed (cycles 56, 61, 65).
- L-026 (route the correctness core to fable): not-exercised — `demote: true` held every cycle and `allow_premium_pct` was 0; nothing ran on fable. The recommendation is neither confirmed nor contradicted by this run, only unaffordable in it.
- L-029 (failable AND attributable, two arms): re-observed, three times, and it is the load-bearing rule of the run (cycles 55, 56, 65).
- L-031 (find surfaces by mutation-measurement): re-observed (cycles 52, 53, 54, 64).
- L-034 (brief reviewers to REFUTE): re-observed (cycle 62 — the gate disproved the builder's proposed observable instead of checking it).

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization achieved at reset: **100% overall / 97% premium** (last real reading,
  cycle 65 `weekly` block). The window was fully consumed; it emptied 8h 50m early.
- Allocator: allowance granted vs burned — posture `trickle` all run, `allow_overall_pct: 0`
  and `allow_premium_pct: 0` at cycle 65, `reserve_overall_pct: 16.24`, dial 0.30. Burn
  actually attributed: **unavailable** — no probe produced burn evidence after cycle 35
  (KI-2). Per-cycle cost is recoverable from `SWARM/runs/pacer.log` `cycle-done cost=` lines:
  cycles 48–65 ranged $2.32 (cycle 61) to $12.12 (cycle 64), with cycle 65 cut off at $4.38.
- Auto-kickoffs this run/week: **1** — this run was itself an allocator auto-kickoff under
  `trickle`. No 3-strike queue drops recorded.
- Final-hours floor release: **did not fire.** There were no final hours to release into;
  the cap ended the run at the 20:02 mark.
