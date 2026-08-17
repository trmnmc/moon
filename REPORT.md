# REPORT — moon

**Build run:** 2026-08-14, 11:29 → 12:59 UTC (90 minutes, attended) — shipped v0.1.0,
102/102 tests green.
**Improvement run 1:** 2026-08-14 15:32 → 2026-08-15 09:00 UTC (allocator auto-kickoff,
guest pacing, dial 0.3) — cycles 0–47, 77 cycle commits, **145/145 tests green**.
**Improvement run 2:** 2026-08-16 13:37 → 2026-08-17 06:17 UTC (allocator auto-kickoff,
guest pacing, dial 0.3) — cycles 48–65, **148/148 tests green**.
**Target:** `/opt/targets/moon`
**Outcome of run 2:** **STOPPED SHORT — the weekly usage cap ran out.** 14 items verified
and every source file mutation-swept, but three measured holes are still open and the run
had no clock to close them in: the cap was exhausted at 20:02 UTC on 2026-08-16 and every
relaunch until the 05:00 reset died at HTTP 429. This was an interruption, not a decision —
the contrast with run 1's deliberate early stop is the point. See "Why run 2 stopped".

---

## What was built

A zero-dependency Node CLI that prints the current phase of the moon.

```
░░░▓◗  28%  waxing crescent
            next full moon  28 Aug
```

*Captured by running `node bin/moon.js` with no flags at 2026-08-17 18:22 UTC against the
host system clock; the percentage and next-full-moon date move with the calendar, so a
later run will show different figures.*

Flags: `--json`, `--block`, `--compact`, `--south`, `--north`, `--help`.
Run: `node bin/moon.js` · Test: `node --test test/*.test.js`

The improvement run added **no features** — that was its central non-goal. It closed or
precisely bounded the open known-issues, replaced prose-only claims with machine-checked
ones, and made the docs state what is verified versus deferred.

---

## VERIFIED vs CLAIMED

Everything below marked VERIFIED was checked by the conductor running a command and
reading its output — not by an agent reporting success. Every check was authored at
verification time; no builder saw the check that would judge it.

### VERIFIED

| Claim | Evidence |
|---|---|
| Phase math is real Meeus, not a synodic modulo | Lunation lengths span **29.274–29.826 days** across 864 lunations, 1990–2060 (13.3h spread; a measured lower bound over that window, not the physical range). A mean-formula implementation is flat at 29.530589 by construction. |
| Accuracy is within the ~1h target | Ch. 49 true phase-instant machinery for 2000-01-06 computed **18:13:43 UTC** (rounds to 18:14, exact match vs published 18:14). The ch. 48 elongation-wrap instant (drives illumination, not phase instant) computes separately at **18:15 UTC**, ~1.5 min later — not the same series. The mean formula lands at 14:20 — nearly 4h off. |
| Correction tables are correctly transcribed | Independent audit reproduced Meeus **worked examples 49.a and 49.b to 0.23s and 0.34s**, exercising the mean formula, E, both 25-term tables, W, and A1–A14. |
| Illumination is true elongation, not faked from age | At Meeus example 48.a the module gives **0.6801** (book: 0.6786); an age-derived fake gives 0.6475. Conclusive discriminator. |
| new→full interval tracks the theoretical half-synodic | new→full interval spans **13.906–15.613 days** across 865 intervals measured over 1990–2060 (mean **14.765** vs theoretical 14.765) — a lower bound from that window, not the physical range. |
| Hemisphere table is correct | Builder validated against **all 418 zones** in the host IANA database by reference latitude; conductor independently probed 24 zones including every one the builder flagged as unsure. |
| Hemisphere works end-to-end | `TZ=Australia/Sydney` produces a south-lit moon through the real binary, not a mock. |
| Timezone/DST handling | 30 zones × 11,688 instants: **0 mismatches**. Tightest case found: `America/St_Johns`, full moon 13 seconds after local midnight — correct. |
| Output discipline | Zero trailing whitespace, exactly one trailing newline, nothing on stderr on success, byte-identical when piped, correct exit codes (0 success / 2 usage error). |
| No emoji, no exclamation marks | Codepoint sweep across all output modes and all source files. |
| Zero runtime dependencies | `package.json` has no `dependencies` key; source requires only `node:*` and sibling modules. |
| **The assembled CLI behaves end-to-end as documented** (cycle 46) | 28 checks over the **real binary** executed as a child process, never imported, exit status read from `spawnSync().status` with no shell and no pipe. Expectations derived from the documented contract — the hemisphere check parses README's own north\|south table (15 rows) rather than trusting the renderer. Zero divergences. |
| **The suite's end-to-end coverage was measured, not assumed** (cycles 46–47, re-run cycle 58) | Ten mutants, each breaking one documented end-to-end behavior, run against the suite in throwaway copies with a green baseline. At cycles 46–47, **nine were killed**; the tenth (`--help`'s precedence over `--json`) survived, was filed as T-142, and was fixed at cycle 47 — see below. Re-run cycle 58 against the current tree with the identical, unmodified battery: **all ten are killed, zero survive** — T-142's fix now closes the escape the original battery found. |
| **`--help` wins over `--json`, and the test proving it is attributably failable** (cycle 47, re-run cycle 58) | Two scratch copies, both mutated identically: with the new test present the suite reads 147 tests / 146 pass / **1 fail** (that test); with the new test removed it reads **146/146 green**, i.e. the mutant survives. The kill is attributable to the nine lines added, and cycle 46's separate measurement is independently reproduced rather than trusted. (At cycle 47, when the suite carried 145 tests, the same script read 145/144/1 fail and 144/144.) |

### CLAIMED but NOT independently verified

- **Published reference timestamps.** Several anchors (eclipse dates, 2025 quarter times)
  came from model memory, not a primary source — the session had no network access. They
  are mutually consistent and agree to the minute, but they are not independently sourced.
  The 2000-01-06 anchor is the load-bearing one and it is corroborated by hand arithmetic
  from the Meeus epoch constant.
- **Accuracy outside ~1900–2100.** The ΔT polynomial is extrapolated beyond its fitted
  range. Irrelevant for a "current phase" tool, unverified regardless.

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

## Known issues (5)

The `severity` column is severity only. A separate `status` column carries how each issue
now stands, so the two never collide.

| id | severity | status | issue |
|---|---|---|---|
| KI-2 | medium | open, blocking — **worsening** | `settings.json` allowlist edit was denied at all three kickoffs, so `permissions.additionalDirectories` is `[]` and **`bin/swarm-budget.sh` and `bin/swarm-playbook.sh` are not allowlisted at any path**. `swarm-notify.sh` *is* reachable on this host — its relative allowlist entry matches whenever the conductor's cwd is the SWARM root, even though the macOS absolute entry does not match `/opt/swarm/bin/...`. Degraded across run 2: the budget probe (never invoked in 65 cycles) and the playbook append (hand-edited fallback for the second run running). The notification channel is not part of this gap — see the Run 2 stats table for what actually happened to it, which KI-2 does not explain. It is also masking the curator deadlock — see Operational findings 1, and fix the two together. Headless relaunches must pass `--add-dir`. SWARM tooling gap, not a product defect. |
| KI-4 | low | open, unverified | Terminal font variance beyond width (ligatures, exotic fonts) remains unverified — no automated check can cover it; needs a human look. |
| KI-5 | medium | pinned by test, not fixed | **Glyph width.** The disc mixes East Asian Width classes (`░` `▐` are Neutral; `▒ ▓ █ ▌ ▏ ▕` are Ambiguous). In terminals rendering ambiguous-width as double (CJK locales, iTerm2 setting, `xterm -cjk_width`) the disc is 5–9 columns instead of 5: the line jitters between nights, the two-line form stops aligning, and the `--block` frame does not close. Correct in default Western-locale terminals. `test/render.test.js:629` (`KI-5 pin: disc glyph set matches the documented East Asian Width partition`) derives the disc's actual glyph set from `renderLine`/`renderBlock` output and checks it against the documented partition, so an unannounced glyph change now fails the suite instead of drifting silently. The glyph-set redesign that would actually fix the width problem is still deferred — this is a pin, not a fix. |
| KI-7 | low | bounded (sampled), not fixed | At epochs far outside normal use (empirically found around ±270,000 years) `phaseName` and `illumination` can contradict, since the ch.49 and ch.48 Meeus series diverge. `src/astro.js`'s exported `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` (astro.js:71-74) declares the domain over which the two are known to stay consistent — the half-open range of calendar years **1000–3000** — and `test/astro.test.js:491` (`KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)`) strides **4000** deterministic points across that domain with zero band violations. This is a sampled bound, not a proof, and nothing enforces it at runtime. |
| KI-8 | low | open, needs the repo owner | `package.json` declares `"license": "MIT"` and `"private": false`, but **there is no LICENSE file at the repo root** (re-verified at cycle 47). A repo that declares a license without shipping its text is legally ambiguous to the next person who wants to reuse it. Deliberately not fixed here: the MIT body needs a copyright line naming a legal person, which is the owner's decision and not one a build agent or the conductor may invent. **What would settle it:** the owner supplies `Copyright (c) <year> <holder>`; wrapping the standard MIT body around it is then a one-file mechanical change. |

## Resolved issues

| id | severity | how it closed |
|---|---|---|
| KI-1 | low | **Prior-art sweep completed, grep-verified against source (not READMEs).** Nearest npm package is `lunarphase-js` v2.0.3 (ISC): its core is the naive mean-synodic modulo with zero periodic correction terms, its "hemisphere support" swaps emoji glyphs rather than mirroring art, and it has no `bin` field, so it is a library, not a CLI. `astronomia` v4.2.0 (MIT) is a genuine Meeus port but is a dependency, which this project's zero-dependency non-goal forbids. The finding is propagated into README's "Why this one" section. |
| KI-3 | medium | **The repo has a remote and the branch is pushed.** `git remote -v` lists `origin` → `https://github.com/trmnmc/moon.git`; `git branch -vv` shows `main` tracking `origin/main`, up to date; `HEAD` and `origin/main` resolve to the same commit. `gh auth status` reports an authenticated session for account `trmnmc`. |
| KI-6 | low | **`nextFullMoon()` now throws instead of returning an Invalid Date.** `src/astro.js:358` checks the constructed result with `Number.isNaN(result.getTime())` and throws a `TypeError` ("nextFullMoon result is outside the representable Date range") for inputs past the top of the JS `Date` range, matching the module's existing bad-input guard shape (`:281`, `:346`). Regression at `test/astro.test.js:294`. |

---

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
astro.test.js:491), KI-5 (render.test.js:629), 145/145 green at the time (**147/147**
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

## How to run it

```sh
git clone https://github.com/trmnmc/moon.git && cd moon
node bin/moon.js              # single line + next full moon
node bin/moon.js --compact    # exactly one line, for a shell prompt
node bin/moon.js --block      # framed readout
node bin/moon.js --json       # structured output
node --test test/*.test.js    # 155 tests
```

No install step, no dependencies, no network access at any point.

---

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

---

## Honest hand-off

**What is machine-checked:** the astronomy, comprehensively. The phase math is verified
against Meeus's own worked examples to sub-second agreement, against a published new-moon
instant to one minute, and by a discriminator that a mean-formula implementation cannot
pass. Hemisphere logic is verified against every timezone the host knows about. Output
discipline, exit codes, flag parsing, and the absence of emoji are all covered by tests.
If this tool tells you the moon is 41% waxing crescent, that number is trustworthy.

Since the build run, three known issues closed (KI-1 npm prior-art gap, KI-3 no git remote,
KI-6 uncaught out-of-range throw) and two moved from prose-only to machine-checked. KI-7 is
bounded and sampled-tested, not fixed. KI-5 is pinned by a test, not fixed: an unannounced
change to the disc's glyph set now fails the suite, but the terminal-width defect itself is
untouched. KI-2 and KI-4 are unchanged and still open, and KI-8 (declared MIT, no LICENSE
file) is newly recorded and needs the repo owner.

**Coverage neither run provided, stated as not-run rather than as passed.** One review-fix
pass ran, at **cycle 23**, k=1; it was never re-run across the 42 cycles since, because
review-fix is the most premium-heavy work type in the pipeline and the allocator premium
allowance stayed at zero. (An earlier revision of this report claimed review-fix had never
run in any cycle. That was wrong — `state.json` records `last_review_fix_cycle: 23` — and it
is corrected here rather than quietly dropped.) The last full QA pass was **cycle 46**, 19
cycles back; the last taste pass was cycle 1. No browser look pass or collision scan ran in
run 2 and none was applicable — this is a terminal CLI. Read the correctness coverage as:
comprehensive on the astronomy and on the documented end-to-end surfaces, thorough on
mutation-measured discrimination, and **one adversarial review pass on the code as a whole,
now 42 cycles stale**.

**What only a human can finish:**

1. **Look at it in your own terminal.** KI-5 is the honest weak point: the art is correct
   in a default Western-locale terminal and provably wrong in an ambiguous-width one. A
   test now pins the glyph set so a silent regression can't happen, but no test can tell
   you which terminal class you have. Run it and see.
2. **Decide whether the glyph set is actually beautiful.** It is austere, aligned, and
   emoji-free — it satisfies the brief as written. Whether it feels like *a tiny precision
   instrument* is a judgement no assertion makes. That was your phrase, and you are the
   only one who can say whether it landed.
3. **Settle KI-8.** Supply the copyright holder line and the LICENSE file follows
   mechanically. Until then the repo declares a license it does not ship.
4. **Fix the SWARM allowlist (KI-2) and cull the playbook in the same change.** Run 2
   established that doing the first without the second makes the playbook *inert* — see
   Operational findings 1. Neither is a product defect; both will silently degrade the next
   run if left, and the allowlist gap still blocks two separate subsystems (budget probe,
   playbook append).
5. **Decide whether to give run 3 the clock to close T-155.** The sweeps proved the
   `--json` numeric surface is permanently invisible to the suite, and gear 1 never admitted
   the M-effort item that would fix it. This is a scheduling decision, not a technical one:
   an M-effort item needs a posture above `trickle`, or a deliberate split into S-effort
   pieces. It is the single highest-value piece of work left in this repo.

**On the two runs' endings, so the record is not flattering.** Run 1 stopped early because
it was finished. Run 2 stopped early because it ran out of weekly allowance at 20:02 and
five relaunches then died before making a single API call, with nothing in the system
noticing for nine hours. The work run 2 did complete is verified to the same standard as
everything else here. But it covered roughly half the clock it was given, and the reason
was infrastructure, not the product.

**The one thing I would not have you take on trust:** every "verified" claim in this
document has a command behind it, and those commands are pasted in `.swarm/journal.md`.
If any claim here matters to you, the evidence is on disk — read it rather than believing
this file.
