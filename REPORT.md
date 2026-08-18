# REPORT — moon

This report leads with what the tool is, how to run it, what is verified, and the known issues. The full build-run and improvement-run provenance — exact timestamps, per-run change logs, why each run stopped, operational findings about the SWARM tooling, and per-run stats tables — is archived in full, not deleted, at `.swarm/REPORT-ARCHIVE-2026-08-18.md`.

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

## How to run it

```sh
git clone https://github.com/trmnmc/moon.git && cd moon
node bin/moon.js              # single line + next full moon
node bin/moon.js --compact    # exactly one line, for a shell prompt
node bin/moon.js --block      # framed readout
node bin/moon.js --json       # structured output
node --test test/*.test.js    # 171 tests as of run 3's final commit; run it for today's count
```

No install step, no dependencies, no network access at any point.

*On that annotation: it read `# 161 tests` until this wrap-up, correct when T-174 pinned it at
cycle 80 and stale by cycle 83, because two later cycles added tests. This is the third time a
hard-coded count in this file has decayed. It now carries the measurement point rather than a
bare number — weaker but true, which is this repo's documented preference. The durable fix is
the T-180 treatment: have a test parse the annotation. That is filed as a candidate for the
next run, not done here, because WRAP_UP finishes nothing new.*

## Known issues (6)

The `severity` column is severity only. A separate `status` column carries how each issue
now stands, so the two never collide.

| id | severity | status | issue |
|---|---|---|---|
| KI-2 | medium | open, blocking — **root cause now conclusive; structurally unclosable by the swarm** | **Run 3 update (cycles 68–83, 13 further denials).** Cycle 83 killed the last standing hypothesis by re-attempting the probe at the **absolute** path `/opt/swarm/bin/swarm-budget.sh` — every prior attempt across three runs used the relative form — and it was refused identically. The cause was then read straight out of `SWARM/.claude/settings.json`: the allow list carries `Bash(bin/swarm-notify.sh:*)` plus a **stale macOS** `Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)`, and **no entry for `swarm-budget.sh` or `swarm-playbook.sh` at any path**. It is a missing entry, not a path-form mismatch, so no invocation form can ever succeed. Worse: the `Edit` that KICKOFF step 5 *explicitly authorises* to repair this was denied at all three kickoffs, so the one sanctioned repair path is itself blocked and **this issue cannot close from inside a run, in any mode**. Deliberately NOT routed around via `python3`/`node` (both allowlisted) — that would produce a green artifact over a boundary the user never granted. **The exact patch is six allow-list lines; see "Operational findings from run 3".** Original text follows. `settings.json` allowlist edit was denied at all three kickoffs, so `permissions.additionalDirectories` is `[]` and **`bin/swarm-budget.sh` and `bin/swarm-playbook.sh` are not allowlisted at any path**. `swarm-notify.sh` *is* reachable on this host — its relative allowlist entry matches whenever the conductor's cwd is the SWARM root, even though the macOS absolute entry does not match `/opt/swarm/bin/...`. Degraded across run 2: the budget probe (never invoked in 65 cycles) and the playbook append (hand-edited fallback for the second run running). The notification channel is not part of this gap — see the Run 2 stats table for what actually happened to it, which KI-2 does not explain. It is also masking the curator deadlock — see Operational findings 1, and fix the two together. Headless relaunches must pass `--add-dir`. SWARM tooling gap, not a product defect. |
| KI-4 | low | open, unverified | Terminal font variance beyond width (ligatures, exotic fonts) remains unverified — no automated check can cover it; needs a human look. |
| KI-5 | medium | pinned by test, not fixed | **Glyph width.** The disc mixes East Asian Width classes (`░` `▐` are Neutral; `▒ ▓ █ ▌ ▏ ▕` are Ambiguous). In terminals rendering ambiguous-width as double (CJK locales, iTerm2 setting, `xterm -cjk_width`) the disc is 5–9 columns instead of 5: the line jitters between nights, the two-line form stops aligning, and the `--block` frame does not close. Correct in default Western-locale terminals. `test/render.test.js:829` (`KI-5 pin: disc glyph set matches the documented East Asian Width partition`) pins that the Block Element glyph set the disc actually draws (from `renderLine`/`renderBlock` output) matches the partition documented in README.md, which straddles two East Asian Width classes (Neutral: `░ ▐`; Ambiguous: `▒ ▓ █ ▌ ▏ ▕`). Glyph-set changes crossing EAW classes fail the suite's exact-output tests (T-134 README fence, explicit renderLine/renderBlock checks); the pin uniquely establishes this width-class boundary. The glyph-set redesign that would actually fix the width problem is still deferred — this is a pin, not a fix. |
| KI-7 | low | bounded (sampled), not fixed | At epochs far outside normal use (empirically found around ±270,000 years) `phaseName` and `illumination` can contradict, since the ch.49 and ch.48 Meeus series diverge. `src/astro.js`'s exported `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` (astro.js:71-74) declares the domain over which the two are known to stay consistent — the half-open range of calendar years **1000–3000** — and `test/astro.test.js:491` (`KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)`) strides **4000** deterministic points across that domain with zero band violations. This is a sampled bound, not a proof, and nothing enforces it at runtime. |
| KI-9 | medium | open, needs a human — found at cycle 84 | **The watchdog never armed for any of the three improvement runs, and the record says so in its own log.** `bin/swarm-watchdog.sh:275-285` exits `all-done` if `REPORT.md` exists in every target — unconditionally, with no reference to target status, cycle number, or run start time. On a first-build run that file cannot exist before wrap-up, so the check is the safety net cycle.md intends. On an **improvement** run over a shipped repo it always exists, so the guard fires on the watchdog's very first firing and never stops. Measured: run 3 kicked off 16:12:20Z; the next watchdog firing at 16:37:17Z logged `decision=all-done detail=reports-present`, as did all 20 firings through wrap-up. `REPORT.md` has been in this repo since run 1's wrap-up commit `9bc8a0f`, so runs 2 and 3 were both unprotected end to end. **Severity is medium rather than high, and the reason matters:** on the VPS the actual firing mechanism is `bin/swarm-pacer.sh`, which spawns a cycle whenever `heartbeat.next_wakeup_at` is due, so a dead conductor still gets recovered on the next pacer tick. What three runs lost is the *redundant* layer — stale-heartbeat detection, PID identity check, kill, relaunch — not all recovery. **What would settle it:** gate the `REPORT.md` branch on evidence the file belongs to *this* run (mtime at or after the runfile's creation), or require every target's status to be `done`/`stalled` alongside it, or drop the file check now that `wrap_up_complete` has proven itself across 33 recorded `run-complete` decisions. One condition in one file; hard rule 5 forbids doing it from inside a run. |
| KI-8 | low | open, needs the repo owner | `package.json` declares `"license": "MIT"` and `"private": false`, but **there is no LICENSE file at the repo root** (re-verified at cycle 47). A repo that declares a license without shipping its text is legally ambiguous to the next person who wants to reuse it. Deliberately not fixed here: the MIT body needs a copyright line naming a legal person, which is the owner's decision and not one a build agent or the conductor may invent. **What would settle it:** the owner supplies `Copyright (c) <year> <holder>`; wrapping the standard MIT body around it is then a one-file mechanical change. |

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

## Resolved issues

| id | severity | how it closed |
|---|---|---|
| KI-1 | low | **Prior-art sweep completed, grep-verified against source (not READMEs).** Nearest npm package is `lunarphase-js` v2.0.3 (ISC): its core is the naive mean-synodic modulo with zero periodic correction terms, its "hemisphere support" swaps emoji glyphs rather than mirroring art, and it has no `bin` field, so it is a library, not a CLI. `astronomia` v4.2.0 (MIT) is a genuine Meeus port but is a dependency, which this project's zero-dependency non-goal forbids. The finding is propagated into README's "Why this one" section. |
| KI-3 | medium | **The repo has a remote and the branch is pushed.** `git remote -v` lists `origin` → `https://github.com/trmnmc/moon.git`; `git branch -vv` shows `main` tracking `origin/main`, up to date; `HEAD` and `origin/main` resolve to the same commit. `gh auth status` reports an authenticated session for account `trmnmc`. |
| KI-6 | low | **`nextFullMoon()` now throws instead of returning an Invalid Date.** `src/astro.js:358` checks the constructed result with `Number.isNaN(result.getTime())` and throws a `TypeError` ("nextFullMoon result is outside the representable Date range") for inputs past the top of the JS `Date` range, matching the module's existing bad-input guard shape (`:281`, `:346`). Regression at `test/astro.test.js:294`. |

---

*The cycle-by-cycle detail behind the sections above — each run's own change log, why it stopped, and the operational findings about the SWARM tooling itself — is in `.swarm/REPORT-ARCHIVE-2026-08-18.md`, in full.*

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

**Coverage, as it stands after run 3.** The staleness this section reported after run 2 is
gone: run 3 ran a **review-fix pass at cycle 73** (which found three real user-facing defects
in code that was already green — the EPIPE crash, the broken hair-thin crescent, and a
date-dependent test), a **full QA pass at cycle 76**, and the **taste pass at cycle 81**. All
three of the passes that had gone 19–42 cycles stale are now recent. **POLISH is the one
step-4 pass that never ran in any of the three runs** — weighed at cycle 84 and rejected on
the merits, not skipped for time; the reasoning is in "Why run 3 stopped".

No browser look pass or collision scan ran, in any run, and none was applicable — this is a
terminal CLI with no browser surface. That is recorded as **not-run**, never as passed. Read
the correctness coverage as: comprehensive on the astronomy, on the documented end-to-end
surfaces, and now on flag *interactions* as well as single behaviors; thorough on
mutation-measured discrimination; and one adversarial review pass on the code as a whole,
11 cycles old rather than 42.

*(An earlier revision of this report claimed review-fix had never run in any cycle. That was
wrong — `state.json` recorded `last_review_fix_cycle: 23` — and it was corrected rather than
quietly dropped.)*

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
4b. **Fix the watchdog's DONE-guard (KI-9), ideally in the same sitting as KI-2.** It is one
   condition in `bin/swarm-watchdog.sh`, and until it changes, every future improvement run on
   any already-shipped repo will run with its crash-recovery redundancy silently switched off.
   The pacer still covers the common case, which is why this is medium and not high — but the
   layer that exists specifically for "the conductor died and its heartbeat went stale" has not
   run in three consecutive runs, and nothing surfaced that until someone read the log.

4. **Fix the SWARM allowlist (KI-2) and cull the playbook in the same change.** Run 2
   established that doing the first without the second makes the playbook *inert* — see
   Operational findings 1. Neither is a product defect; both will silently degrade the next
   run if left, and the allowlist gap still blocks two separate subsystems (budget probe,
   playbook append).
5. ~~**Decide whether to give run 3 the clock to close T-155.**~~ **Done.** T-155 closed at
   cycle 68 with exact `--json` values hand-derived from the spec's Domain rules, and its
   closure immediately exposed a second gap (`Math.ceil` survives where `round` is used) that
   closed as T-163 at cycle 69. The scheduling call was the right one: a posture above
   `trickle` was all it needed.

6. **Decide what this repo is for now — and the honest answer is that it needs a feature run,
   not a fourth housekeeping run.** Three housekeeping runs have taken the correctness and
   doc-truth work about as far as measurement can take it, and run 3 ended 14.4 hours early
   because it ran out of *authorized* work, not out of clock. The taste pass at cycle 81
   returned a verdict of **wears-thin** with a concrete diagnosis: ten consecutive default
   runs printed byte-identical output, and near new and full the art and the whole-percent
   figure will be identical across consecutive *days* too, so the only reliably-moving element
   is an absolute date the reader must subtract from today by hand. The three ideas that would
   fix it are parked in `.swarm/ideas-ledger.md` with the measurements behind them: a relative
   countdown (`next full moon 28 Aug (in 10 days)` — one line, zero deps, ticks daily), a
   `--date` flag (the CLI's output is currently a pure function of the wall clock with *no*
   injection point, which is why no taste agent can exercise more than one moon through it),
   and moving `--block`'s dangling next-full-moon line inside the frame. **All three are
   features, and every housekeeping brief so far has forbidden them.** That is a scoping
   decision only you can make.

**On the three runs' endings, so the record is not flattering.** Run 1 stopped early because
it was finished. Run 2 stopped early because it ran out of weekly allowance at 20:02 and five
relaunches then died before making a single API call, with nothing in the system noticing for
nine hours — infrastructure, not the product. Run 3 stopped early because it was finished and
the remaining ideas were out of scope; it left ~14.4 hours unspent and closed everything run 2
could only name. Two of the three early stops were choices. The one that was not is fixed by
playbook lessons L-037 and L-038.

**The one thing I would not have you take on trust:** every "verified" claim in this
document has a command behind it, and those commands are pasted in `.swarm/journal.md`
(runs 1–2 in `.swarm/journal-archive-through-2026-08-17.md`). If any claim here matters to
you, the evidence is on disk — read it rather than believing this file.

And one claim in this document is now enforced rather than asserted: the two issue tables
above are machine-checked against `.swarm/state.json` by `test/report-issues.test.js`. Edit
them into disagreement and the suite goes red. That check was itself validated by a converse
control — rewording prose inside a description cell must leave the suite **green** — so it
reads structure, not sentences.

---

Repo tagged `v0.1-improve3` (run 1: `v0.1-overnight`, run 2: `v0.1-improve2`, original build:
`v0.1.0`). Generated by /swarm WRAP_UP at 2026-08-18 01:45 UTC.
