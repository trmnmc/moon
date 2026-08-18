# REPORT archive — moon (through 2026-08-18)

This file holds the cycle-by-cycle forensic detail that used to sit at the top of `REPORT.md`: the full build-run and improvement-run provenance preamble, the defects found during the build run, each improvement run's change log, why each run stopped, the operational findings about the SWARM tooling (not the product), and the per-run stats tables. It was split out of `REPORT.md` on 2026-08-18 so a first-time reader reaches what the tool is, how to run it, what is verified, and the known issues without first scrolling through three runs of history. Every section below is carried over verbatim from the prior `REPORT.md` — nothing here was reworded, tightened, or re-summarized.

---

**Build run:** 2026-08-14, start not recorded on disk (no kickoff log exists for it) →
12:59:57 UTC (attended; the runfile's planned `stop_at`, not an observed end — last
recorded heartbeat was 12:17:00 UTC) — shipped v0.1.0, 102/102 tests green.
**Improvement run 1:** 2026-08-14 15:32:28 → 2026-08-15 09:15:42 UTC (last recorded
heartbeat, corroborated by the wrap-up notification at 09:16:19 UTC; allocator
auto-kickoff, guest pacing, dial 0.3) — cycles 0–47, 77 cycle commits, **145/145 tests
green**.
**Improvement run 2:** 2026-08-16 13:20:10 UTC (kickoff-log filename epoch, corroborated by
the control-channel init at 13:20:09 UTC) → two defensible end times that disagree, not
one: the run's work ended 2026-08-16 20:02 UTC when the weekly usage cap was exhausted at
cycle 65, but the session did not finally wrap up until 2026-08-17 06:27:39 UTC (last
recorded heartbeat) (allocator auto-kickoff, guest pacing, dial 0.3) — cycles 48–65,
**148/148 tests green**.
**Improvement run 3:** 2026-08-17 16:12:20 → 2026-08-18 01:35 UTC (allocator auto-kickoff,
thermostat pacing, dial 0.5) — cycles 66–84, **171/171 tests green**.
**Target:** `/opt/targets/moon`
**Outcome of run 3:** **DONE, and it stopped early on purpose — ~14.4 hours of clock
deliberately unspent.** Every must-have of all three specs is closed and re-verified from
evidence rather than from backlog labels; the three holes run 2 measured and could not
afford (T-153, T-155, T-156) are all closed; the one axis no sweep had covered — flag
interactions — was enumerated, mutated, and its four HOLEs hardened. Nothing was left
running. See "Why run 3 stopped", which is the section to read if you only read one.
**Outcome of run 2 (for contrast):** **STOPPED SHORT — the weekly usage cap ran out.** 14
items verified and every source file mutation-swept, but three measured holes were still
open and the run had no clock to close them in: the cap was exhausted at 20:02 UTC on
2026-08-16 and every relaunch until the 05:00 reset died at HTTP 429. This was an
interruption, not a decision. Run 3 closed all three. See "Why run 2 stopped".

---

## Defects found and fixed during the build run

The adversarial QA pass found seven real defects *after* the build was already "green."
This is the strongest argument for the pass existing at all.

1. **`age` reported the mean synodic month instead of true elapsed time** (correctness).
   Under-reported by up to **~7 hours** in the closing hours of a long lunation, while
   both `--json` and the README documented it as plain elapsed time. **Root cause was the
   conductor's own frozen contract**, which wrongly used the *mean* lunation (29.530589)
   as an upper bound; real lunations reach ~29.84 days. The builder had honored the bound
   as written and flagged the tension in a comment. Fixed by removing the clamp and
   correcting the contract. The 40-year range assertion was **kept** and retargeted to the
   true maximum — not deleted.
2. **`--help` mis-described `phaseAngle`** (correctness, for scripters). It said
   "degrees, 0..360"; combined with the spec's textbook `k = (1+cos i)/2`, a scripter got
   the **exact inverse** — 95.9% for a 4% moon. The field is elongation, not the Meeus
   phase angle. Help and README now say so and warn explicitly.
3. **`--json` emitted 17 significant digits** for a value good to ~1% — precision theatre,
   forbidden by the spec's own taste notes. Conductor-found, in a conductor-owned file.
4. **A `.trim()` silently undid `padStart(2)`** on the day number, so single-digit dates
   lost their alignment.
5. **Block form indented the next-full-moon line to column 3** while its labels sit at 4.
6. **README's prompt snippet invoked `npx --no-install moon`** — a package that does not
   exist, since npm publish is an explicit non-goal.
7. **Two help lines ran to 84 columns** and wrapped on a default terminal.

## What improvement run 3 changed (cycles 66–84)

Run 3's job was the work run 2 measured and could not afford, plus the one axis no sweep had
ever covered. **24 items were verified done across 19 cycles**, and the suite moved 148 →
**171**. That test count is deliberately not the headline — the SPEC forbids reporting it as
an outcome — so here is what it actually bought.

### The three holes run 2 left open are closed (cycle 68)

All three landed in a single wave, each with both arms of the failable/attributable proof in
the journal:

| item | what was unprotected | how it closed |
|---|---|---|
| **T-155** | No test compared any `--json` numeric field against an exact value, so `round()`'s **scale factor** was provably invisible to the suite — run 2's single most severe survivor, and never dispatchable there because it is M-effort and the allocator held gear 1 for all 18 cycles. | Exact values hand-derived from the SPEC's Domain rules, never read back out of the implementation. |
| **T-153** | Nothing exercised `--block` together with `--compact`; the next-full-moon suppression on that branch was unexercised. | Pinned at `bin/moon.js:130`. |
| **T-156** | The `moon: ` stderr prefix on usage errors was unpinned — `test/cli.test.js:306` used an unanchored `assert.match`. | Anchored on a structural property the stream owns, per L-043, not on prose. |

T-155's closure immediately produced a second finding the pin could not cover: **`Math.ceil`
survives the whole suite** where `round` is used, because at the sampled points the two agree
exactly. Filed as **T-163** and closed at cycle 69 — the rounding *rule* is now pinned as well
as the scale factor.

### The uncovered axis: flag interactions (cycles 69–70)

Every prior sweep mutated one behavior in one file. **T-157** (fable) enumerated the CLI's
flag matrix and mutated the interaction branches — combinations, not single behaviors. Four
survivors were classified **HOLE**, the rest **BOUNDARY**, and the classification was made
*before* any test was written (L-033), because a survivor at a point where the observable is
genuinely indiscriminable is the check being correct, and "hardening" it produces a check
that false-rejects honest output. **T-158** then hardened exactly those four HOLEs, one
two-arm-proven pin each. Every BOUNDARY call is recorded with its reasoning in the journal.

### Product defects found by the review-fix pass (cycle 73) and fixed

The run's one adversarial review pass produced three findings that were reproduced by an
independent verifier and then fixed. All three are real user-facing behavior, not hygiene:

1. **`bin/moon.js` crashed on a closed pipe** (T-165). Writing to stdout with no `error`
   handler means `node bin/moon.js | head -1` dies with `EPIPE`. Fixed with a stream guard —
   and the fix's *first* attempt was rejected by the conductor for a regression it introduced,
   setting exit 0 on a closed pipe from either stream where README documents exit 2 for usage
   errors. The exit-code contract was ruled on by the conductor **before dispatch**, precisely
   so a builder could not settle a documentation-visible contract on its own.
2. **`--block` drew a hair-thin crescent as three disconnected specks** (T-167). Reachable
   roughly 20 h per lunation. Attempt 1 failed on exactly the judgment a cheaper model got
   wrong; attempt 2 was routed to fable as correctness-core work and passed.
3. **A date-dependent test** (T-166) hard-coded two spaces before the day number, which is
   space-padded — green today, red on a single-digit date.

### Doc truth: every line-cited and output-cited claim re-verified

`README.md`, `.swarm/CONTRACTS.md` and `REPORT.md` all cite specific line numbers and paste
captured command output, and line citations drift silently. All three were re-verified against
the tree as it stands (T-159, T-160, T-161), with captures **regenerated by running the
documented command**, never hand-edited. Four claims failed re-verification and were corrected
rather than reworded: the `--help` text's mid-range description (T-168, which was wrong in the
*shipped binary* as well as the README), an 18:15 UTC figure credited to the wrong Meeus series
(T-169), a documented round-limb threshold that survived mutation (T-170), and a promise of a
"single-line message" for every usage error that some errors broke (T-172). Run 2's own start
time in this report was off by 17 minutes (T-164) and is corrected.

### Two documents made self-checking rather than merely correct

- **T-176** pinned the one place the two rendering surfaces *disagree*: the single-line form
  and `--block` did not agree about whether the moon is visible at very low illumination. It
  was pre-classified **BOUNDARY before any test existed**, so its fix is a pin plus a written
  caveat — not a re-tune of `src/render.js`, which would have been a behavior change the
  non-goals forbid.
- **T-180** made this report's two issue tables machine-checked against `.swarm/state.json`.
  The ids, the severities, the `## Known issues (N)` heading count, and the disjointness of
  the two tables are now assertions in `test/report-issues.test.js`. **If you edit those
  tables and the state file disagrees, the suite goes red.**

### Housekeeping that will matter to the next session

**T-181** archived runs 1–2 out of the live journal: 1,032,714 bytes → **294,649** (71.4%
smaller) with the full text preserved in `.swarm/journal-archive-through-2026-08-17.md`. The
cut point was located structurally, not by line number, and the reconstruction was verified
**byte-identical against git**, not against the archiving script's own strings.

### Thrash, stated plainly

One reverted merge in the whole run (T-160, cycle 71 — it fixed 3 of 4 sub-goals and then
re-asserted a false claim *and invented a mechanism for it*; committing the good three would
have shipped a fabrication inside the one document whose premise is the VERIFIED-vs-CLAIMED
distinction). Three items carry `attempts: 1` and **all three ended `done`**. Zero items
blocked, zero at the attempt cap, zero merge conflicts.

The dominant thrash source was not the builders — it was **the conductor's own verification
instruments**, which failed in six separate cycles (72, 76, 80, 81, 82, 83), twice as *vacuous
passes*, the dangerous direction. Every failure was repaired rather than worked around, every
widening was paired with a strictly stronger assertion, and no repair moved a bar. The
mechanism is one thing and it is named on the record: the conductor's regex or scope narrower
or looser than the text it was measuring. See "Operational findings from run 3".

## What improvement run 2 changed (cycles 48–65)

Run 2's job was measurement, not addition: find what the 145-test suite could not actually
discriminate, close the real holes, and re-verify every doc claim. **Three tests were added
all run.** That small number is the outcome, not a shortfall — most of what a sweep finds
is the suite being correct.

**Every source file in the repo was mutation-swept**, and every survivor was classified
HOLE or BOUNDARY before anything was hardened:

| cycle | file(s) | mutants | killed | survived | outcome |
|---|---|---|---|---|---|
| 52 | `src/render.js` | 26 | 19 | 7 | 3 reachable HOLEs (the limb-glyph threshold cascade at thin crescents), 1 proven BOUNDARY, 3 contract-domain guard holes |
| 53 | `src/args.js`, `src/hemisphere.js` | 24 | 21 | 3 | HI1 = whole-moon handedness flip when `Intl` throws; AA1 = **a test that could not fail**, filed as T-149; HF3 = proven BOUNDARY |
| 54 | `src/astro.js` (outside the T-129 battery) | 16 | 8 | 8 | **all 8 BOUNDARY — zero tests written, zero items filed** |
| 64 | `bin/moon.js` | — | — | 6 measured holes | filed as T-153…T-156 |

Cycle 54 is the one worth reading twice: a sweep that found eight survivors and wrote
nothing is recorded as the *correct* outcome. A survivor at a point where the observable is
genuinely indiscriminable is the check being right, and "hardening" it produces a check
that false-rejects honest output.

The three tests that were added (145 → 148) were each proven **failable** and
**attributable** — the mutation run twice, once with the new test present (suite red) and
once with it removed (suite green), because a kill you cannot attribute may belong to some
other test entirely:

- **T-146** (cycle 55) — closed the `lineArt` dark/hairline hole: a lit hair-thin crescent
  was rendering as a dark new moon.
- **T-149** (cycle 56) — `test/args.test.js`'s undefined-`argv` test could not fail; it now
  runs in a child process with non-empty ambient argv and genuinely discriminates.
- **T-154** (cycle 65) — `formatFullMoonDate`'s local-vs-UTC accessor choice was invisible
  to the suite. Gated against two independent mutant variants, with the arithmetic
  re-derived rather than read off the test's own comment
  (`nextFullMoon` → 2026-06-29T23:56:38Z = **30 Jun** at Pacific/Kiritimati GMT+14 vs
  **29 Jun** UTC).

On doc truth: every line-number citation in README.md, `.swarm/CONTRACTS.md` and REPORT.md
was re-verified against the current tree (T-147, cycle 57 — 14 citations checked, 3 citation
and 2 prose corrections, plus two conductor self-repairs where the gate had itself been
wrong); REPORT.md's pasted command-output figures were **regenerated, never hand-edited**
(T-148, cycles 58–59, failing first on 1 of 11 figures); and the three items carried over
from run 1 were all closed with evidence — T-116 (cycle 49), T-130 (cycle 50), T-139
(cycle 51).

Two gate failures, both recovered on one retry at one rung up (T-148 cycle 58→59, T-151
cycle 62→63). Zero items reached `attempts ≥ 2`, zero blocked, zero merge conflicts, zero
reverted merges across 14 dispatches.

## What improvement run 1 changed (cycles 0–47)

Three build waves were **reverted on the conductor's own gate**, never on a builder's
report (T-132 cycle 34, T-134 cycle 37, T-136 cycle 40); each passed on re-dispatch
(cycles 35, 38, 41). Nine items carry `attempts: 1` and **all nine ended `done`** — no
item reached the attempt cap, so nothing ended blocked.

The through-line of the run's later half was replacing prose-only claims with
machine-checked ones: README's rendered example blocks are now regenerated and checked
against the shipping renderer rather than hand-transcribed (T-134); CONTRACTS.md's line
citations are machine-checked against the constructs they name (T-140); a comment
documenting why a check *accepts* certain mutation survivors was added so the next editor
does not "harden" it into false-rejecting honest output (T-139 family).

---

## Why run 3 stopped

**It finished, and then it stopped rather than manufacturing work.** Cycle 84 declared the
target DONE at 01:35 UTC against a 16:02 stop — **~14.4 hours unspent**. That is a decision,
and the case for it is below so you can disagree with it on the evidence.

**What was verified before deciding, by running commands rather than reading labels:**

```
node --test test/*.test.js   ->  tests 171  pass 171  fail 0
package.json                 ->  dependencies undefined, devDependencies undefined
repo root                    ->  no node_modules, no package-lock.json, no yarn.lock
```

Against the definition of done: T-153/T-155/T-156 each closed with two-arm proofs (cycle 68);
the flag-interaction matrix enumerated with every survivor classified HOLE or BOUNDARY and its
reasoning recorded (cycles 69–70); every line-cited and output-cited doc claim re-verified with
four stale ones corrected and captures regenerated (cycles 70–78); KI-2 re-measured with the
exact refusal on record (cycles 71, 83); suite green and never below the 148-test baseline; no
dependency of any kind. **Every box is closed.**

**Every source of authorized work was searched, not just the backlog.** This is the part
worth stating, because cycle 83 caught the previous cycle getting it wrong: a drained backlog
means the *queue* is empty, never that the *spec* is satisfied.

| source | state at cycle 84 |
|---|---|
| Backlog | 1 `todo` item, **T-175**, which carries a recorded DO-NOT-BUILD verdict on traceability grounds (see below). Everything else `done` or `dropped`. |
| SPEC.md must-haves | all closed at cycle 80 |
| SPEC.md **Nice-to-haves** | exhausted at cycle 83 — #1 was found already shipped at run 2 cycle 63, #2 became T-180, #3 became T-181 |
| Run 2's spec (still binding) | must-haves closed; T-116/T-130/T-139 all `done` |
| Run 1's spec (still binding) | must-haves closed (KI-1, KI-5, KI-6, KI-7) |
| Step-4 pass list | design ✅ plan ✅ build ✅ review-fix (c73) ✅ full QA (c76) ✅ taste (c81) ✅ — only POLISH never ran |
| Known issues | KI-2 needs a human; KI-4 needs a human; KI-5's real fix is a glyph-set redesign the non-goals forbid; KI-7 is bounded and documented; KI-8 needs the owner's copyright line |
| Taste-pass findings | 4 found at cycle 81, 1 filed and built (T-176), 3 parked in `.swarm/ideas-ledger.md` as out of scope |

**POLISH was weighed and rejected on the merits, not skipped.** It is the one step-4 pass
this run never ran, and the two-question ratchet is "would the target user notice?" and
"would they still care after 10 minutes?" A docs-polish pass fails both here: this run spent
six items re-verifying every doc claim in the repo, so the prose a polish agent would rewrite
is currently *verified true*, and rewriting verified prose is how you get an unverified claim
back — exactly the failure T-160 was reverted for at cycle 71. The spec names
diminishing-return churn as this run's chief risk and forbids any item that traces to none of
its three permitted sources. POLISH traces to none.

**The pacing evidence points the same way.** The weekly governor clamped the gear to 2 for
most of the run and blocked promotion for all of it: `weekly_used_pct` 19.0 against
`week_elapsed_pct` 12.2 is a **weekly_heat of 1.56, still 20% over the 1.3 trigger**, on the
last reading taken. Spending 14 more hours on work the spec forbids, while already running
above the weekly pace, would be wrong twice over.

**The one item left `todo`, and why it was not quietly built.** **T-175** —
`detectHemisphere('US/Samoa')` returns north for a 14°S location, the one southern legacy
alias missing from the defensive alias layer. Found by the cycle-76 QA sweep across every
canonical zone and every Link in the host tzdata; conductor-reproduced at the unit level. It
is **not user-observable on this host**: with `TZ=US/Samoa`, ICU canonicalises to
`Pacific/Pago_Pago` before detection runs and the live binary prints `south`. It would surface
only on a runtime whose `Intl` reports the raw legacy name. It was first filed as a failed
doc re-verification against this report's "all 418 zones" claim — and that framing was
**measured and withdrawn** by the conductor, because `Intl.supportedValuesOf('timeZone')` is
exactly 418 on this host and contains no legacy aliases at all, so the claim is true as scoped
and the alias table simply has a gap. With the doc-falsity framing gone it traces to none of
the spec's three permitted sources, so it was left filed rather than built. It is a clean,
fully-measured pick-up for any run that is allowed to touch it.

**What an unspent 14 hours would have been worth is a real question, and the honest answer is
"the ideas ledger".** `.swarm/ideas-ledger.md` holds three product ideas the taste pass rated
highly and this run's non-goals forbade — a relative countdown on the next-full-moon line, a
`--date` flag, and moving `--block`'s dangling next-full-moon line inside the frame. All three
are *features*. None could be built tonight. They are the argument for giving this repo a
feature run rather than a fourth housekeeping run.

## Why run 2 stopped

**It ran out of weekly usage allowance, 8h 50m before its stop time.** This is the one
thing in this report you should not read past.

Cycle 65 hit HTTP 429 at 20:02 UTC on 2026-08-16, after $4.38 and 62 turns. Its work
survived — the journal block and commit `f45f2d6` both landed — but the session died before
it could schedule the next wakeup. `swarm-pacer.timer` then spawned five more conductors
(20:08, 22:10, 00:11, 02:13, 04:15) and **every one died at 429 in under a second, at
`total_cost_usd: 0`, before making a single Agent call.** The error text each time:
`You've hit your weekly limit · resets 5am (UTC)`. Records are on disk at
`/opt/swarm/runs/cycle-{1786910898,1786918209,1786925497,1786932798,1786940110}.json`.

Two things made it worse than a plain "ran out":

1. **The run's stop time was 04:59:59 UTC — the weekly reset boundary itself.** So the run
   spent its entire tail waiting for a reset it was, by construction, not allowed to use.
   Wrap-up ran at 06:17 on the first spawn that got an API turn, which is 78 minutes past
   the stop the rules require it to honor.
2. **Limp mode never engaged, and could not have.** Limp is entered by a tier probe —
   four small Agent calls — which needs a conductor session alive enough to make them.
   These sessions never got a turn. So `heartbeat.limp` read `false` for nine hours while
   the run was, in fact, completely dead. The only component that saw all six failures was
   the pacer, and the pacer does not write that flag. Both gaps are now playbook lessons
   L-037 and L-038.

**What this cost, concretely.** Three measured holes are still open, all found by the
sweeps and none closed:

| item | effort | what is unprotected |
|---|---|---|
| **T-155** | M | **The most severe finding of the entire run.** No test compares any `--json` numeric field against an exact value, so `round()`'s scale factor is provably invisible to the suite — forever, not incidentally. |
| **T-153** | S | Nothing exercises `--block` together with `--compact`; the next-full-moon suppression on that branch is unexercised. |
| **T-156** | S | The `moon: ` stderr prefix on usage errors is unpinned — the only stderr test uses an unanchored regex. |

T-155 was never dispatchable: it is M-effort, and the allocator held gear 1 (`trickle`
posture, `allow_premium_pct: 0`) for all 18 cycles, which admits S-effort work only. It did
not lose a priority contest; there was no cycle it could legally run in. **This is the
highest-value work left on the table and it is a clean pick-up for the next run.**

The suite is green at 148/148 and nothing is broken. What is missing is coverage the run
proved it needs and then could not buy.

---

## Why run 1 stopped early (for contrast — that one was a choice)

The run reached DONE at 09:00 UTC against a 15:32 stop — about 6.5 hours unspent. That was
a decision and it is worth stating plainly rather than burying.

The definition of done was re-verified from evidence at cycle 47, not read off backlog
labels: KI-1 (REPORT.md above + README:38-41), KI-6 (astro.js:358 + astro.test.js:294),
KI-7 (`PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` declared astro.js:71-74, exported astro.js:363, README:194,
astro.test.js:491), KI-5 (render.test.js:826), 145/145 green at the time (**147/147**
re-run against the current tree at cycle 58, T-148), no `dependencies` key.

Two backlog items remain `todo`:

- **T-147** — Re-verify every line-number citation in README.md, .swarm/CONTRACTS.md and REPORT.md.
- **T-148** — Regenerate REPORT.md's pasted output figures by rerunning the commands.

Both are doc-truth work — the tail of must-have 4 (every doc claim re-verified), and both
are being executed this run rather than ratchet-rejected. The three items this paragraph
previously listed (T-116, T-130, T-139) were all closed with evidence at cycles 49, 50 and
51. The SPEC named this run's specific taste risk as **churn** — "a diff that is mostly
reworded prose and duplicate tests, which looks like work and changes nothing" — which is
why T-147 and T-148 correct claims that are *false against the current tree* rather than
rewording ones that are already true. KI-4 and KI-8 both need a human and cannot be closed
here at all. The remaining
nice-to-have (actually *fixing* KI-5 with a single-width glyph set) is L-effort, and the
SPEC excluded it for this posture on cost grounds, not because the defect is acceptable.

Budget context, since it is the other half of the honesty: the allocator held posture
`trickle` with a **zero** premium allowance for the entire observed tail, weekly usage
finished at 79.0% against 73.79% of the week elapsed, and premium sat at 96%. Stopping
with wall-clock unspent while the weekly runs slightly hot is the correct trade.

---

## Operational findings from run 3 (SWARM tooling, not the product)

Per hard rule 5, none of this was fixed live. All of it is a morning action for a human.

**1. KI-2 is now root-caused conclusively, and the fix is six lines.** Add to the `allow`
list in `/opt/swarm/.claude/settings.json`:

```
Bash(/opt/swarm/bin/swarm-budget.sh:*)
Bash(/opt/swarm/bin/swarm-playbook.sh:*)
Bash(/opt/swarm/bin/swarm-notify.sh:*)
Bash(bin/swarm-budget.sh:*)
Bash(bin/swarm-playbook.sh:*)
Bash(bin/swarm-notify.sh:*)
```

and delete the stale macOS entry `Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)`,
which cannot match on this host. The full handoff patch is on disk at
`.swarm/runs/cycle-071-verify-T162.txt`. **The mechanism is settled, not inferred:** the
allowlist matches the literal leading command token, `swarm-notify.sh` works *only* in the
bare-relative form with cwd `/opt/swarm`, and the other two scripts have no entry in any form.
Cycle 33 established this by controlled comparison — same shell, same cwd, same invocation
shape, opposite outcomes — and cycle 83 closed the last alternative by testing the absolute
path. Thirteen denials this run, ~47 across three runs.

**2. The one thing that makes KI-2 worse than a config typo: the sanctioned repair is
blocked too.** SKILL.md KICKOFF step 5 explicitly authorises the conductor to edit the allow
list at kickoff — it is one of exactly two carve-outs in the self-modification fence. That
`Edit` call was **denied at all three kickoffs**. So no number of future runs can fix this;
it needs a human or an interactive session. The conductor deliberately did *not* route around
the denial using `python3` or `node`, both of which are allowlisted and could trivially have
written the file: doing so would have produced a green artifact over a permission boundary the
user never granted.

**3. What KI-2 actually cost this run, measured rather than asserted.** The budget probe never
ran, so `window_tokens`, `tokens_per_hour` and `projected_depletion_at` are structurally `0`
and **ρ was never measured** — every gear this run rests on `runs/allocator.json` posture plus
the evidence rule (no burn data lands cruise, never crawl and never overdrive). The playbook
parser never ran, so `playbook/learnings.md` was parsed by hand for the third consecutive run
and the `record-applied` ledger line could not be written for the third consecutive run. The
WRAP-UP `append` was denied for the 8th consecutive time and the distillation was hand-written
(`playbook/DROP-RATIONALE-2026-08-18.md`). **The notification channel is not part of this gap**
— `swarm-notify.sh` is reachable in the bare-relative form and 25 sends are logged this run.

**4. The conductor's verification instruments are the run's real weak point, and the fix is
already demonstrated.** Six cycles (72, 76, 80, 81, 82, 83) had a gate that failed *as an
instrument* rather than as a finding — cycle 72's v1 returned 12 failures against the builder
tree of which zero were real, and cycles 80 and 81 each produced a **vacuous pass**, which is
the direction that ships unverified work under a green label. The mechanism is a single
recurring one, named at cycle 83: the conductor's regex or scope narrower or looser than the
text it measured. **Cycle 77 shows the fix works**: it smoke-ran both sealed gates against
unmodified HEAD *before* dispatch and caught four instrument defects, two of them false
passes. Sealing a gate by hash (L-042) proves the check predated the work; it does not prove
the check runs. Both halves are now in the playbook.

**5. The watchdog never armed for this run, or for either of the other two improvement runs
— filed as KI-9.** Found at wrap-up, while trying to disarm it: the log showed
`decision=all-done detail=reports-present` on every one of its 21 firings since kickoff. The
DONE-guard's `REPORT.md`-exists branch is a correct safety net for a first-build run and a
permanent short-circuit for an improvement run. Full mechanism, measurements and three
candidate fixes are in the KI-9 row above. Related and worth fixing in the same change: this
wrap-up could not run `systemctl disable --now swarm-watchdog.timer` either — polkit refused
without interactive authentication — so the timer is **still enabled**. That is harmless here
because both the watchdog and the pacer key their DONE-guards on `wrap_up_complete`, which is
now `true`, and the pacer's guard is the one that actually stops cycles from spawning. But it
means "the watchdog was disarmed" would be a false claim, so: it was not disarmed, it was
*already inert*, and it is now additionally gated by the flag.

**6. `cd` does not persist across the conductor's shell calls, and a notify send from the
wrong cwd fails silently-ish.** `swarm-notify.sh` resolves only as a bare relative path from
`/opt/swarm`, so a cycle whose working directory has drifted to the target repo gets exit 127
instead of a push. Caught and re-issued at cycle 81. Cheap fix: the six absolute-path allow
entries in finding 1 make cwd irrelevant.

## Operational findings from run 2 (SWARM tooling, not the product)

**1. The playbook curator is deadlocked, and the allowlist gap is currently hiding it.**
This is the finding most likely to bite silently. `bin/swarm-playbook.sh` refuses to run at
all while `playbook/learnings.md` is over its 20-lesson cap: `cmd_parse` validates first and
exits 2, and — newly established this run — **`cmd_append` does the same, at line 186,
*before* it ever reaches the overflow-drop logic at line 216+**. So the documented
"drop the oldest non-high-confidence lesson on overflow" rule can never repair the file;
it only ever runs on a file that is already compliant.

The reason nobody has noticed: because the script is *also* permission-denied (KI-2), the
last two conductors read `learnings.md` directly and staged its directives by hand, which
bypasses the validator entirely. Run 2 applied 15 lessons that way. **Fixing the allowlist
on its own will therefore make things worse** — it flips the playbook from
hand-applied-and-working to script-applied-and-inert on the very next kickoff. The cull
must land in the same change as the allowlist fix, or before it. Full detail, including a
value-ranked drop list, is in `playbook/HANDOFF-cap-2026-08-15.md` (addendum dated
2026-08-17). Honest label: established by *reading* `bin/swarm-playbook.sh`; the script has
still never been executed on this host.

**2. KI-2 still blocks the budget probe and the playbook append; the notification channel
turned out not to be part of it.** `SWARM/.claude/settings.json` allows
`Bash(bin/swarm-notify.sh:*)` (a *relative* path) and
`Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)` (the macOS path). The allowlist
matches on the leading command token, so the relative entry matches whenever the
conductor's cwd is the SWARM root — `swarm-notify.sh` **is** reachable on this host; only
the macOS absolute entry fails to match `/opt/swarm/bin/...`. `swarm-playbook.sh` and
`swarm-budget.sh` have no entry at any path and remain genuinely blocked. Consequences in
run 2: the budget probe never ran (gear was read from `runs/allocator.json`, freshness
re-checked against `week_elapsed_pct` movement each cycle), and the playbook append fell
back to a hand edit again (L-037…L-041). Notifications, by contrast, did go out: run 2's
notify log (`runs/notify.log.1786947423`) records four successful pushes — auto-kickoff,
goodnight, and two phase-changes — all inside the run's first 31 minutes, and then stops
entirely, polls included, at 14:11:03Z, roughly 16 hours before the run actually ended; no
wrap-up push was sent. Why the log goes silent there is not established by anything on
record and is not asserted here. `permissions.additionalDirectories` is still `[]`;
headless relaunches must keep passing `--add-dir` explicitly. Per hard rule 5 the
conductor may not fix the still-blocked budget and playbook scripts from inside a run —
that needs one human edit.

**3. The gear was never actually measured.** `probe_failures` sat at 8 with
`last_real_probe_ts` frozen since cycle 35, and gear 1 was held for all 18 cycles on
allocator posture read off disk, never on burn evidence. That is the correct behavior under
the evidence rule — a clock-cruise is not dressed up as a measurement — but it means the
run had no visibility into how close it was to the wall it then hit at 20:02.

---

## Operational findings from run 1

**1. A second conductor session ran concurrently during the build run.**
`swarm-pacer.timer` spawned a headless cycle at 11:54:33 (finished 12:03:13, cost $2.93)
because that session's heartbeat `next_wakeup_at` came due while it was still mid-cycle.
It found the dirty working tree, performed a textbook cycle.md step-2 salvage commit
(`795513e`), and rewrote the runfile. No damage — but two conductors on one repo is a real
hazard, and it is now playbook lesson L-027.

**2. KI-2 blocked two distinct tools, all run.** The budget probe was never invoked across
47 cycles; `probe_failures` correctly stayed at 34 rather than incrementing, on the rule
that an attempt not made is not a failure. Gear was read from `runs/allocator.json`, whose
freshness was re-checked against `week_elapsed_pct` movement every cycle rather than
assumed. At WRAP_UP the same gap denied `bin/swarm-playbook.sh append`, so the five
distilled lessons were appended to `playbook/learnings.md` by hand as L-029…L-033 per the
documented fallback.

**3. `playbook/learnings.md` has pre-existing integrity defects that need a human.**
Two, both found by reading the file rather than by any check:
- **Duplicate ids.** `L-023`, `L-025` and `L-026` each appear **twice**, with different
  content and different `[source:]` runs (2026-08-13 repo-atlas and 2026-08-14 moon). The
  runfile disambiguated them with `-source` suffixes so this run's ledger stays honest,
  but the file itself is still ambiguous.
- **Over the cap.** The file held 26 lessons against a documented 20-lesson cap *before*
  this run appended anything.

The manual append deliberately did **not** attempt the 26→20 prune the script would
normally perform. Hand-deleting eleven lessons from a file whose id integrity is already
broken is irreversible and is a policy decision belonging to the tool that owns it, not to
a fallback path. Appending is additive; pruning is not. **This needs a human to run the
curator once the allowlist is fixed.**

Per hard rule 5, none of the above was fixed live.

---

## Run 3 stats

| Stat | Value |
|---|---|
| Cycles run | **19** (66 → 84), against a stop that allowed roughly twice that — the surplus was **deliberately unspent**, see "Why run 3 stopped" |
| Items verified done | **24** |
| Items still `todo` | 1 (**T-175**, carrying a recorded DO-NOT-BUILD verdict, not an oversight) |
| Items blocked / at attempt cap | **0 / 0** |
| Items at `attempts: 1` | 3 (T-160, T-165, T-167) — **all three ended `done`** |
| Tests | 148 → **171**, every added test proven failable AND attributable by name in two arms |
| Merge conflicts / reverted merges | **0 / 1** (T-160, cycle 71 — reverted in full for a fabricated claim, passed at cycle 72) |
| Conductor gate failures that were the *instrument's* fault | **6** (cycles 72, 76, 80, 81, 82, 83), two of them vacuous passes — the run's dominant thrash source |
| No-value cycles | 0 (`consecutive_no_value` ended at 0) |
| Models used | fable (T-155, T-157, T-167 — the judgment and correctness-core seats), opus (T-165), sonnet (most build/fix items), haiku (T-168, T-169, T-173, T-174), conductor-executed (T-181) |
| Pace | mode `thermostat`, dial 0.50; **gear 2–3**, never 1, never above 3; `promote_blocked: true` for the entire run; effective wave size 1–2 (gear cap, never the `k_current` of 5) |
| Weekly window at wrap-up | **19.0% overall / 11.0% premium at 12.2% of the week elapsed** — `weekly_heat` 1.56, still above the governor's 1.3 trigger. No weekly reset occurred in-run. |
| Window utilization / ρ | **NOT MEASURED** — the budget probe was denied on every invocation (KI-2), so ρ was `0` all run because it was unmeasurable, not because burn was zero. Reported as not-measured, never estimated. |
| Notifications sent | **25 logged** (`runs/notify.log`), including one cwd-drift failure at cycle 81 that was caught and re-issued |
| Commands received | none (`runs/control.json` `pending` and `applied` both empty all run) |
| Screenshots | none — terminal CLI, no browser surface. The QA look pass and collision scan are recorded as **not-run**, not as passed. |

## Run 2 stats

| Stat | Value |
|---|---|
| Cycles run | **18** (48 → 65), against a stop that allowed room for roughly twice that |
| Items verified done | 14 |
| Items still `todo` | 3 (T-153, T-155, T-156 — all measured holes, see "Why run 2 stopped") |
| Items blocked / at attempt cap | 0 |
| Tests | 145 → **148**, all three proven failable and attributable |
| Mutants measured | 66+ across 4 sweeps, covering every source file |
| Merge conflicts / reverted merges | 0 / 0 |
| Gate failures | 2 (T-148 c58, T-151 c62) — both passed on one retry one rung up |
| No-value cycles | 1 (c60, an inline PLAN pass) |
| Models used | haiku and sonnet for build items; **fable never affordable** (`demote: true` every cycle, `allow_premium_pct: 0`), so playbook L-026 went unexercised |
| Pace | mode `guest`, dial 0.30, **gear pinned at 1 for all 18 cycles**; effective wave size 1 every cycle (gear cap 1 vs `k_current` 5) |
| Weekly window at reset | **100% overall / 97% premium** — fully consumed, and 8h 50m early |
| Cost | ≈**$103** (17 of the 18 cycles have a `cycle-done cost=` line in `runs/pacer.log`; range $2.32–$12.12) |
| Notifications sent | **4, then stopped.** auto-kickoff, goodnight, and two phase-change pushes, all `ok`, all inside the run's first 31 minutes (13:20–13:50 UTC on 08-16); the log (`runs/notify.log.1786947423`) then goes silent, polls included, at 14:11:03Z — roughly 16 hours before the run ended — and no wrap-up push was sent. `.ntfy.json` **is** configured on this host (144 bytes). Why the log stops there is not established by the record. |
| Commands received | none (`runs/control.json` `pending` and `applied` both empty all run) |
| Screenshots | none — this is a terminal CLI with no browser surface; the QA look pass and collision scan are recorded as **not-run**, not as passed |
