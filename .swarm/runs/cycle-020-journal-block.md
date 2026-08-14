

## cycle 20 — 2026-08-14T21:55:14+00:00 → 21:59 UTC · moon · VALUE_LOOP · build-wave k=1 (T-111) · VERIFIED

### Step 0 — runfile, target, heartbeat

Runfile read; `model_policy` re-read (`value-routing`). Single active target, so rotation is
a formality: `rotation_schedule [0]`, cursor 0, `/opt/targets/moon`. Heartbeat claimed with
the conductor PID **156326** (`claude -p /swarm cycle --add-dir /opt/targets/moon`, found by
`pgrep -af claude`; the documented `$$`-then-walk-up capture was refused by the shell layer
as an expansion pattern, so the PID was established by direct process listing instead — same
answer, different route, and it is the pacer-spawned session, not a subshell).
`cycles_since_recycle` 19 → **20**; still under 25, so this is a normal cycle, not a RECYCLE.

### Step 1 — clock + burn probe

`date +%s` first: **1786744514** (21:55:14 UTC). `stop_at` 2026-08-15T15:32:27+00:00 leaves
**~17.6 h** — no WRAP_UP trigger, no admission-control pressure. `heartbeat.limp` false.

**The budget probe was RE-INVOKED this cycle, and refused again.** This is a deliberate
departure from cycles 12–19, which all declined to re-issue it. The step-1 rule says to stop
calling the real probe at `probe_failures >= 3` and re-invoke only when
`now - last_real_probe_ts >= 1800`; `last_real_probe_ts` has been **0** all run, so that
window has been open the whole time and the honest reading is that one call was owed. It was
spent. `bin/swarm-budget.sh` came back permission-denied (KI-2). So cycle 20 reports a
**measured** refusal rather than an inherited assumption — and the twenty-one-cycle streak is
now confirmed rather than presumed. `last_real_probe_ts` stays 0: a refused invocation is not
a probe. `probe_failures` 19 → 20. Tokens/hour and projected depletion stay **unknown**;
they are not estimated.

Gear therefore rests on `runs/allocator.json` (`source: probe`, fresh): posture **trickle**,
`allow_premium_pct` 0, `allow_overall_pct` 0, `opus_used_pct` 96, `weekly_used_pct` 70.0,
`week_elapsed_pct` 67.06 → **67.21**, dial 0.30. Weekly governor **disengaged**
(`weekly_heat` 1.044 < 1.1 → ceiling 5); `opus_heat` 1.432 > 1.2 keeps `promote` blocked.
Binding constraint, unchanged for twenty cycles: trickle posture + the guest-mode 1–3 clamp
→ **gear 1, k_cap 1, demote true**.

### Step 2 — orient

`git status --porcelain` in the target: **clean**. No crashed-cycle salvage needed, no stale
`index.lock`.

Control channel: `bin/swarm-notify.sh poll` is permission-denied (KI-2, same gate as the
budget probe), so the poll could not run — journaled, non-fatal, and the file-sourced view
was used instead. `runs/control.json` read directly: `pending []`, `applied []`, `inject []`.
Nothing to apply, no injection to triage, no ack to send.

### Step 3 — re-anchor (cycle 20 % 5 == 0 → full re-read)

`SPEC.md` re-read end to end, not digested. The contract: an improvement run on the shipped
v0.1.0 CLI — close or precisely bound the known-issues, replace prose-only claims with
machine-checked ones, make the docs tell the truth. **No new features, no new deps, no
rewrite of the astronomy core.** Definition of done: KI-1/KI-6/KI-7 resolved or bounded with
a machine-checked assertion, KI-5 pinned by a measuring test, every added test traceable to a
named untested surface, docs accurate about verified-vs-deferred, the pre-existing tests
still green, zero new runtime dependencies. The named taste risk is **CHURN** — one test
pinning a real defect beats ten restating a pass — and that is the live constraint on this
cycle's pick.

Backlog hygiene: 16 items, 15 done and 1 todo. Nothing to dedupe, nothing stale enough to
drop, well under the ~30-item cap. No reprioritization: the single todo was already the only
candidate.

### Step 4 — pick work

Phase gates: DESIGN and PLAN long closed, BUILD closed (no must-have is todo). Effective wave
size = min(`k_current` 5, gear cap 1, hard max 5) = **1**.

**T-111** picked — the last pre-existing backlog item, and at p6/S/`polish` the only one.
Gear-1 work choice explicitly permits it: haiku-priced docs/polish is the top of gear 1's
list. Routing recomputed at pick time: `attempts` 0, no ladder escalation; gear 1's
`demote: true` would send sonnet→haiku for a polish item, and the item was already routed
**haiku**, so haiku stands. No fable seat is involved — there is no judgment call in a
spelling.

**Phase moved REVIEW → VALUE_LOOP.** With T-111 landed the backlog holds no pre-existing
work at all, so "REVIEW" would be a stale label. The move is bookkeeping honesty, not
progress: nothing was reviewed to earn it.

**The run's ONE review-fix pass remains NOT RUN**, twentieth cycle running, as formally
recorded at cycle 11 and unchanged: it is the most premium-heavy work type in the pipeline
(opus reviewers, fable adversarial verifiers) and `allow_premium_pct` has been 0 under
trickle posture throughout. The fable verifier seat cannot be demoted — the fable guard
exempts judgment seats in every gear, which is right, because a cheap-tiered adversarial
verifier is exactly how a fake gate gets built. WRAP_UP must report it **NOT RUN**.

### Step 5 — execute: build-wave k=1

Dispatched as a **direct Agent call**, not the Workflow tool: this is a `-p` session spawned
by the pacer, where Workflow is review-gated. Documented failure-table fallback. At k=1 there
is one agent and no worktree, so the disjoint-scope requirement is vacuous.

Craft pack: `node bin/swarm-craft.mjs` returned clean, `degraded: []`. T-111 was NOT flagged
`craft: "ui"` — `files_hint` is `README.md` and the title names no UI surface — so the
`craft.docs` line that actually bites here ("pull every fact from the actual repo; never
assert what you cannot verify") was spliced, plus the playbook builder line ("the conductor
is the SOLE committer"). The builder was additionally given the L-026 tripwire in operative
form: if the word turned out to sit inside a fenced block of captured output, **stop and
report instead of editing**. It did not, and the builder said so.

Builder report: one line changed, README.md:178, `behaviour` → `behavior`, zero British
occurrences left in that file.

### Step 6 — verification gate

Check authored at verification time, by the conductor, after the builder finished. The
builder never saw it.

**VERIFICATION EVIDENCE — T-111**

```
$ git -C /opt/targets/moon diff --stat
 README.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

$ git -C /opt/targets/moon diff -U4        (trimmed to the hunk)
-outside it, behaviour is unspecified and the two fields may disagree.
+outside it, behavior is unspecified and the two fields may disagree.

$ grep -rniE "behaviou?r" src/astro.js README.md
README.md:178:outside it, behavior is unspecified and the two fields may disagree.
src/astro.js:68: * on either series. Behavior outside this domain is UNSPECIFIED -- not

$ grep -n '^```' README.md | wc -l   ->  18 fence lines precede line 178 (even = prose)

$ node --test test/*.test.js
ℹ tests 114   ℹ pass 114   ℹ fail 0   ℹ skipped 0   ℹ todo 0
```

Four independent things had to hold, and did: the diff is exactly one line (no silent
reflow), the README token now matches `src/astro.js:68` verbatim in the sense the acceptance
named, the edited line is **outside every code fence** — 18 fence lines precede line 178, an
even count, so no captured command output was hand-edited (L-026) — and the full suite is
114/114. **PASS → `done`.**

The fence-parity count is the discriminator here, and it is worth naming why: "the builder
only changed one word" is checkable from the diff, but "the builder did not edit a block of
captured output" is not, and a one-word edit inside a captured block would be exactly the
L-026 failure this repo has already committed once. Parity settles it mechanically.

### The gate disproved the item's own premise

T-111's title and note asserted that the repo's prose is US English and that the cycle-8
README addition introduced the first British spelling. The gate swept for it, and that is
**false**:

```
$ grep -rniE 'behaviour|colour|normalis|centre|analyse|licence|catalogue' README.md REPORT.md src test bin
src/render.js:45:/** Cells in the one-line moon. Odd, so the disc has a centre column. */
README.md:186:- No emoji, no colour themes, no config file.
README.md:219:## Licence
src/astro.js:38: * ~24 h centred on the instant, and a crescent/gibbous name outside it, where
src/astro.js:239: * equation of centre -- i.e. a real Moon-minus-Sun longitude difference.
```

The item's original measurement was scoped to the single token `behavior/behaviour` across
three files, and within that scope it was correct. Its *generalization* was not. This does
not fail the gate — the **acceptance** (match `src/astro.js` on this one token) is what the
builder was held to, and it passed — but the wider claim is now known to be wrong and is
recorded rather than quietly absorbed. Filed as **T-116**, priority 9.

And the conductor's own read of T-116, stated up front so the morning report does not have to
guess: **the VALUE_LOOP ratchet probably rejects it.** "Would the target user notice?" is a
weak maybe; "would they still care after 10 minutes?" is a no. It is filed because a measured
finding should be visible and priced, not because it should be built. The one thread in it
that is *not* cosmetic: `## Licence` disagrees with `package.json`'s `"license": "MIT"`, and
the repo has **no LICENSE file at all** — a real gap, deliberately left out of T-116's scope,
because adding a license file is the repo owner's decision and not a haiku polish builder's.

### Honest limits on this cycle

- **1 item verified (T-111), and it was one letter.** The backlog is now clear of
  pre-existing work, but this cycle bought a spelling, not a capability. Counting it as
  "verified value" is accurate and also small; the report should not dress it up.
- **The net item count did not go down.** T-111 closed, T-116 opened. The finding is real,
  but the ledger is flat.
- **review-fix: NOT RUN, twentieth cycle** — deliberate premium deferral under trickle
  posture, recorded as a decision at cycle 11.
- **QA and TASTE passes last ran at cycle 1**, nineteen cycles ago. Neither has been re-run;
  neither is claimed as current.
- **collision-scan: NOT APPLICABLE, reported as not-run** — it is a browser gate; moon is a
  stdout CLI. The qa-verify look pass is skipped for the same reason; `qa.last_look_cycle`
  stays 1.
- **KI-5 is UNFIXED** (pinned by a test since cycle 6; the width defect itself untouched).
  **KI-7 is UNFIXED** (bounded and documented; the two series still diverge outside the
  domain). **KI-4** still needs a human look — no machine check covers terminal font width.
- **KI-2** has now blocked the budget probe *and* the notify channel for twenty-one straight
  cycles, and as of this cycle that is a freshly measured fact rather than an inherited one.
  Hard rule 5 forbids fixing it mid-run. It remains the single highest-value thing a human
  could clear before the next run.
- **Wave autotune**: `wave_streak` 1 → 2, `k_current` unchanged at 5. No practical effect
  either way — min(5, gear cap 1) = 1 regardless.

### Step 7 — persist + commit

`state.json` and `backlog.json` written atomically (`.tmp` + `mv`). This block appended.
Runfile written + mirrored to `current.json.bak`. Target repo committed and pushed.

### Step 8 — dashboard + notifications

Local render of `runs/dashboard.html` refreshed (mandatory; on the VPS the file write IS the
publication). Notification diff vs the previous render: **phase changed REVIEW → VALUE_LOOP**,
which would normally emit a `phase-change` push — the notify helper is permission-denied
(KI-2), so the emit could not be sent and is journaled here instead. No target stalled.
`publish_failures` stays 0: Artifact publish is correctly skipped, not failed, in a headless
VPS session with no Artifact tool.

next wakeup: +900s (verified value, but the smallest kind — the backlog holds one p9 item the
ratchet is expected to reject, so there is no reason to sprint back)
