
## cycle 107 | 2026-08-20T11:10:27+00:00 | moon | BUILD — build-wave k=2: the KI-2 ask stops contradicting itself, and anchor-TRUTH finally ships inside the suite

**Clock/budget.** Opened 10:36:56Z, 21.5 h to stop_at. Probe ran (allowlisted, bare absolute
form, no env prefix): gear **2**, ρ **0.51**, mode guest (dial forced 1.00), k_cap 2,
promote false / demote true, probe_ok true, probe_failures 0. Burn 59,043,080 tokens /
$47.94 in the active window, 12.79M tokens/hour, projected depletion 1787246157. Weekly
governor: weekly_heat 2.16, ceiling 2, promote blocked — the raw ratio would license a
higher gear in thermostat mode; guest clamps to 1–3 and the weekly ceiling clamps to 2, so
gear 2 is a governed result, not a measured one. Control channel: `bin/swarm-notify.sh poll`
ran clean, `runs/control.json` has 0 pending, 0 applied, no `inject` array. Nothing to apply.

**Wave.** Effective size = min(k_current 2, gear cap 2, hard max 5) = **2**, and for the
first time this run two items actually fit it. Both dispatched as direct Agent calls
(Workflow is review-gated in a headless `-p` session), both at **sonnet**, and deliberately
**sequentially** rather than concurrently — see the decision entry: their write scopes are
disjoint, but T-211's subject matter IS T-210's file, and four suites in this repo parse
REPORT.md. Craft pack ran clean (`degraded: []`); the docs pack went to T-210, and neither
pack went to T-211 — it is a Node test file with no UI surface and no prose deliverable, so
flagging it `craft: "ui"` would have been noise.

### VERIFICATION EVIDENCE — cycle-107 gate A (T-210): PASS 18 / FAIL 0

Gate source `.swarm/gates/cycle-107-gate.mjs`, authored at verification time; the builder
never saw it.

```
PASS A1 REPORT.md is the only product file modified   touched=["REPORT.md"]
PASS A2 line count unchanged (no citation-shifting insertion)   222 -> 222
PASS A3 diff is exactly one line replaced, in place   numstat="1	1	REPORT.md"
PASS A4 REPORT.md at or under its byte cap   bytes=24399 (cap 25586, HEAD 24044)
PASS B1 the run-3 sentence survives byte-identically (record not overwritten)
PASS B2a/b/c/d the added clause is DATED, says superseded, names four, names both scripts
PASS B6 no new Bash( allow-list token added to REPORT.md   HEAD 2 -> work 2
PASS B8 TRUTH: four is the real ask, measured against the live allow list
       missing=["swarm-playbook.sh","swarm-warmup.sh"] granted=["swarm-budget.sh","swarm-notify.sh"]
       askLines=4 owner-action-lines=4
PASS C1 CONTROL — B8 stops reading four when a script is granted in a mutated copy   mutant askLines=2
PASS C2 CONTROL — the clause cells FAIL against the pre-change row (not vacuous)
PASS C3 CONTROL — clause cells STAY GREEN on a prose-only reword
PASS C4 CONTROL — B6/B7 catch a mutant that pastes an allow-list line
PASS C5 exactly one "six" survives in the row, the historical one   count=1
GATE cycle-107 (T-210)  PASS 18 / FAIL 0
```

### VERIFICATION EVIDENCE — cycle-107 gate B (T-211): PASS 14 / FAIL 0

Gate source `.swarm/gates/cycle-107b-gate.mjs`. Every cell either mutates something and
demands a specific reaction, or is a control on a cell that does.

```
PASS E2 RED: the exact pre-cycle-106 false line FAILS the shipped test   exit=1 fail=1
PASS E3 the failure NAMES the measured truth, not just "mismatch"   mentions 210 & 208 & cycle 104
PASS E4 ATTRIBUTION: HEAD's doc-counts.test.js does NOT catch it   exit=0 fail=0 tests=10
PASS E5 DISCRIMINATOR: a one-digit mutation of a TRUE count FAILS   exit=1 fail=1
PASS E6 TRUE-NEGATIVE: a prose-only reword STAYS GREEN   exit=0 fail=0
PASS E7 RECURSION: a depth-marked child completes green and does not re-spawn
PASS E8 CONTROL — the depth guard measurably suppresses spawning   172ms vs unguarded 8635ms
PASS E9 REPORT.md restored byte-identically   79fa69d03200 -> 79fa69d03200
PASS E11 no stray git worktree survives a full suite run   worktrees=1
PASS E13 the test-file diff is purely ADDITIVE   numstat="473	0	test/doc-counts.test.js"
GATE cycle-107b (T-211)  PASS 14 / FAIL 0
```

Shallow-clone degrade, proved separately (`.swarm/gates/cycle-107c-shallow.mjs`):

```
shallow run:  exit=0 skipped=3 fail=0 skip-lines-naming-shallow=3
CONTROL full clone: exit=0 skipped=0 fail=0
VERDICT shallow-degrade: PASS — loud skip on shallow, zero skip on full history
```

`test_cmd` run by the conductor in the REAL tree, standalone, AFTER the state and backlog
writes:

```
$ node --test test/*.test.js
ℹ tests 216   ℹ pass 216   ℹ fail 0   ℹ cancelled 0   ℹ skipped 0   ℹ todo 0
ℹ duration_ms 10119.585089
```

### T-210 — the fix supersedes the record instead of overwriting it

REPORT.md's KI-2 row carried run-3 text reading **"The exact patch is six allow-list lines;
see 'Operational findings from run 3'."** Two things were wrong with it today: the count had
rotted (swarm-budget.sh has since been granted, leaving four lines across two scripts), and
the cross-reference pointed at a section that no longer exists in the file. Seven lines
below, a pointer to `.swarm/KI-2-OWNER-ACTION.md` says four. A reader had two live counts
for one ask on a single screen.

The run-3 sentence is still there, byte-identical, and now carries a dated superseding clause
inside the same physical row. The edit is 1 insertion / 1 deletion, line count 222 → 222,
because anything that shifts a line breaks the sibling gates that cite REPORT.md by line
number.

The cell worth naming is **B8**. It does not ask whether the row now states "four" — that is
the existence check that let three defects through in as many cycles. It PARSES
`/opt/swarm/.claude/settings.json` and measures: swarm-playbook.sh and swarm-warmup.sh have
zero allow entries under any path form, swarm-budget.sh and swarm-notify.sh have entries,
KI-2-OWNER-ACTION.md's fenced block holds exactly 4 lines — so the ask is 4. C1 is its
refutation control: push one playbook grant into an in-memory copy of settings.json and the
measured ask drops to 2. If B8 were asserting rather than measuring, C1 would not move.

**Conductor read, beyond the gate cells.** Cycle 104's lesson is that a gate can pass 16/16
while a sentence underneath it is false, so the added clause was read on its own terms. It
claims the probe "ran cleanly at cycles 103, 104, 105 and 107". That was a number I put in
the brief, sourced from T-210's own notes — exactly the provenance that has bitten twice —
so it was re-measured against the journal rather than inherited: probe-OK lines exist at
journal 2080 (cycle 103), 2272 (cycle 104), 2512 (cycle 105), and cycle 107 is this cycle's
own pasted output. All four are true. The enumeration omits cycle 106, which also probed; it
is a list of instances and not an exhaustiveness claim, so it is not false, and filing a row
to re-word a true sentence is the CHURN the SPEC names as this run's chief risk. Noted and
not filed — same disposition as T-110, T-111, T-116 and the cycle-17 readability residual.

### T-211 — the premise in doc-counts.test.js's own header comment was wrong, and now the suite knows it

The file's header states the constraint it was built under: *"there is no non-recursive way
for a test in this suite to learn the suite's OWN runtime test count."* Three consecutive
defects rode on that premise — cycle 104's cell D5 checked a denial count was *stated* while
a wrong decomposition passed underneath, cycle 105 shipped
`- Suite at cycle 104: 208 tests, 208 passing.` straight through a green anchor check (the
true figure was 210/210), and cycle 106 caught it only because the CONDUCTOR's gate measured.
The premise is refuted: `git worktree add --detach <sha>` plus `node --test` costs about four
seconds per commit. What was still open was PACKAGING that inside the shipping suite, which
is what this item did — 473 insertions, **0 deletions**, so the existing anchor-presence
checks are mechanically unweakened rather than unweakened-by-assertion.

Four cells carry the verdict, chosen so that no single cheaper implementation satisfies all
of them:

- **E2 (RED)** — the exact historical false line now fails the shipped suite, and **E3** shows
  the failure message names the measured 210 against the stated 208 rather than reporting a
  bare mismatch.
- **E4 (ATTRIBUTION)** — HEAD's version of the same file, dropped in over the same mutated
  REPORT.md, passes 10/10. Without this, E2's kill could have belonged to any of the 473 added
  lines or to something else entirely. This is the "a kill you cannot attribute is not
  evidence" rule from the standing QA prompt lines, applied at the gate.
- **E5 (DISCRIMINATOR)** — a one-digit mutation of a *true* stated count (210 → 211) fails. E2
  alone is satisfiable by a test that string-matches one known-bad line; E5 is not. The number
  has to actually be measured.
- **E6 (TRUE-NEGATIVE)** — a conductor-authored prose-only reword of the same bullet stays
  green. A check that dies on every edit is a snapshot test, not an assertion.

**Recursion was the real difficulty and it is closed by observation, not by reading the code.**
Old commits are safe because they contain no spawner; the hazard begins the moment this test
ships, since a claim naming a future cycle would spawn a suite that itself contains the
spawner. The bound is an inherited `MOON_DOC_COUNTS_DEPTH` marker at depth 1, and E8 proves it
BITES: a depth-marked run finishes in **172 ms** against **8635 ms** unguarded — the spawns are
genuinely not happening, which is the observable a code reading cannot give you. Cost bound is
6 measured commits per run with a per-sha cache; today's document needs 2 spawns, and the full
suite went 208 tests / 4.2 s → 216 tests / 9.9 s.

**The CI hazard was real, and the runner is the one surface still unproven at gate time.**
`actions/checkout` defaults to `fetch-depth: 1`, so the historical commits this test needs are
simply absent on a GitHub runner and `git worktree add` would fail. The fix is `fetch-depth: 0`
(9 added lines, 8 of them comment) plus a runtime degrade for anyone who clones shallowly. That
degrade was verified with a positive control rather than taken on trust: a `--depth 1` clone
skips 3 tests, every skip line naming shallowness in its own reason text, exit 0, zero failures
— and a FULL clone of the same repo with the same file skips **zero**, which is what rules out
the skips being unconditional. A silent skip that reads as a pass is precisely the defect class
this item exists to remove, so it was not enough for it to be a skip; it had to be a loud one
that cannot be mistaken for a clean scan.

**Twelfth instrument defect, and it was mine.** The shallow-clone verdict line first read
`skipped=0` against a transcript that plainly listed three skips: my parser matched
`# skipped N` (the TAP reporter) and node --test had emitted `ℹ skipped 3` (the spec reporter).
Same class as cycles 8, 9, 19, 100 and 101 — my regex narrower than the output it measures.
Adjudicated to the instrument BEFORE any verdict touched an attempts counter, per L-047, and
the widening paid for with three strictly stronger assertions: every counted skip must name
shallowness in its OWN reason text, the skip count must equal the number of such lines, and the
full-clone positive control must show zero. The substantive conclusion never moved; only my
verdict line was wrong.

**Post-merge checks skipped, and why**: `collision-scan.mjs` gates browser targets built from
classic non-module scripts, and the qa-verify look pass keys on user-visible browser-served
files. moon is a zero-dependency terminal CLI; this wave changed one markdown line, one test
file and one CI workflow. Neither check applies — skipped by rule, not for time.

**Wave autotune**: 2 items dispatched, 0 reverts, 0 failed verifies — a CLEAN wave.
`wave_streak` 1 → 2, which triggers the increment, so `k_current` 2 → 3 and `wave_streak`
resets to 0. No practical effect next cycle: the gear-2 cap of 2 binds.

items: **2 dispatched · 2 verified · 0 failed verify · 0 reverted · 0 blocked · 0 defects
filed · 1 conductor instrument defect caught and repaired (12th)**.
backlog: 106 items — 101 done, 5 dropped, **0 todo**.

### HANDOFF — the backlog is empty and that is NOT a licence to declare done

Cycle 108 must run an explicit **VALUE_LOOP candidate scan** before any DONE declaration. This
trigger has fired twice before on this target and the rule was written both times: an empty
queue is not an exhausted value space (cycle 26), and an empty queue is equally not an argument
for building something the ratchet rejects (cycle 22). Cycle 27 ran the scan properly and it
FOUND a ratchet-passing candidate, so the scan is not a formality. Declaring done sets the
target status to done, rotation then finds no active target, and WRAP_UP fires immediately —
discarding ~21 h of remaining clock on an unexamined premise. Deferring costs one gear-2 cycle,
and scan work is planning-class and cheap.

Read first, in this order: `.swarm/SPEC.md` (definition of done, and the binding rule that
every item trace to a post-2026-08-18 lesson this repo violates or a claim that measurably
rotted), this block, then `.swarm/state.json` decisions from cycle 100 onward. Cycle 110 is the
next `cycle % 5 == 0` step-3 pass — full SPEC re-read plus backlog hygiene — so cycle 108's
scan does not carry that obligation.

runfile-mirror:
```json
{"version":1,"targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-21T08:39:53Z","usage_reset_at":"2026-08-20T09:00:00Z","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.51,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":59043080,"window_cost_usd":47.936602949999994,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":12793350,"projected_depletion_at":1787246157,"probe_failures":0,"weekly":{"ok":true,"weekly_used_pct":100,"opus_used_pct":100,"week_elapsed_pct":46.2,"weekly_heat":2.16,"opus_heat":2.16,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":5,"run_label":"improve-6 (2026-08-20)"}
```
