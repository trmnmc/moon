# REPORT — moon

**Build run:** 2026-08-14, 11:29 → 12:59 UTC (90 minutes, attended) — shipped v0.1.0,
102/102 tests green.
**Improvement run:** 2026-08-14 15:32 → 2026-08-15 09:00 UTC (allocator auto-kickoff,
guest pacing, dial 0.3) — cycles 0–47, 77 cycle commits, **145/145 tests green**.
**Target:** `/opt/targets/moon`
**Outcome:** **DONE at cycle 47** — every must-have verified, and the VALUE_LOOP candidate
scan came back empty with ~6.5 h of the stop budget deliberately unspent. See
"Why this stopped early" below; that is a decision, not an interruption.

---

## What was built

A zero-dependency Node CLI that prints the current phase of the moon.

```
░░░░▕   4%  waxing crescent
            next full moon  28 Aug
```

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
| Phase math is real Meeus, not a synodic modulo | Lunation lengths span **29.274–29.826 days** across 864 lunations, 1990–2060 (13.2h spread; a measured lower bound over that window, not the physical range). A mean-formula implementation is flat at 29.530589 by construction. |
| Accuracy is within the ~1h target | True new moon of 2000-01-06 computed **18:15 UTC** vs published 18:14. The mean formula lands at 14:20 — nearly 4h off. |
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
| **The suite's end-to-end coverage was measured, not assumed** (cycles 46–47) | Ten mutants, each breaking one documented end-to-end behavior, run against the suite in throwaway copies with a green baseline. **Nine killed.** The tenth (`--help`'s precedence over `--json`) survived, was filed as T-142, and is now pinned — see below. |
| **`--help` wins over `--json`, and the test proving it is attributably failable** (cycle 47) | Two scratch copies, both mutated identically: with the new test present the suite reads 145 tests / 144 pass / **1 fail** (that test); with the new test removed it reads **144/144 green**, i.e. the mutant survives. The kill is attributable to the nine lines added, and cycle 46's separate measurement is independently reproduced rather than trusted. |

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

## What the improvement run changed

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
| KI-2 | medium | open, blocking | `settings.json` allowlist edit was denied at both kickoffs, so `permissions.additionalDirectories` is `[]` and **`bin/swarm-budget.sh` and `bin/swarm-playbook.sh` are not allowlisted**. Consequences this run: the budget probe was never invoked in 47 cycles (gear was read from `runs/allocator.json` instead), and the WRAP_UP playbook append was denied and had to be done by hand. Headless relaunches must pass `--add-dir`. SWARM tooling gap, not a product defect. |
| KI-4 | low | open, unverified | Terminal font variance beyond width (ligatures, exotic fonts) remains unverified — no automated check can cover it; needs a human look. |
| KI-5 | medium | pinned by test, not fixed | **Glyph width.** The disc mixes East Asian Width classes (`░` `▐` are Neutral; `▒ ▓ █ ▌ ▏ ▕` are Ambiguous). In terminals rendering ambiguous-width as double (CJK locales, iTerm2 setting, `xterm -cjk_width`) the disc is 5–9 columns instead of 5: the line jitters between nights, the two-line form stops aligning, and the `--block` frame does not close. Correct in default Western-locale terminals. `test/render.test.js:617` (`KI-5 pin: disc glyph set matches the documented East Asian Width partition`) derives the disc's actual glyph set from `renderLine`/`renderBlock` output and checks it against the documented partition, so an unannounced glyph change now fails the suite instead of drifting silently. The glyph-set redesign that would actually fix the width problem is still deferred — this is a pin, not a fix. |
| KI-7 | low | bounded (sampled), not fixed | At epochs far outside normal use (empirically found around ±270,000 years) `phaseName` and `illumination` can contradict, since the ch.49 and ch.48 Meeus series diverge. `src/astro.js`'s exported `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` (astro.js:71-74) declares the domain over which the two are known to stay consistent — the half-open range of calendar years **1000–3000** — and `test/astro.test.js:491` (`KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)`) strides **4000** deterministic points across that domain with zero band violations. This is a sampled bound, not a proof, and nothing enforces it at runtime. |
| KI-8 | low | open, needs the repo owner | `package.json` declares `"license": "MIT"` and `"private": false`, but **there is no LICENSE file at the repo root** (re-verified at cycle 47). A repo that declares a license without shipping its text is legally ambiguous to the next person who wants to reuse it. Deliberately not fixed here: the MIT body needs a copyright line naming a legal person, which is the owner's decision and not one a build agent or the conductor may invent. **What would settle it:** the owner supplies `Copyright (c) <year> <holder>`; wrapping the standard MIT body around it is then a one-file mechanical change. Adjacent: T-116 notes README's `## Licence` heading disagrees with `package.json`'s spelling. |

## Resolved issues

| id | severity | how it closed |
|---|---|---|
| KI-1 | low | **Prior-art sweep completed, grep-verified against source (not READMEs).** Nearest npm package is `lunarphase-js` v2.0.3 (ISC): its core is the naive mean-synodic modulo with zero periodic correction terms, its "hemisphere support" swaps emoji glyphs rather than mirroring art, and it has no `bin` field, so it is a library, not a CLI. `astronomia` v4.2.0 (MIT) is a genuine Meeus port but is a dependency, which this project's zero-dependency non-goal forbids. The finding is propagated into README's "Why this one" section. |
| KI-3 | medium | **The repo has a remote and the branch is pushed.** `git remote -v` lists `origin` → `https://github.com/trmnmc/moon.git`; `git branch -vv` shows `main` tracking `origin/main`, up to date; `HEAD` and `origin/main` resolve to the same commit. `gh auth status` reports an authenticated session for account `trmnmc`. |
| KI-6 | low | **`nextFullMoon()` now throws instead of returning an Invalid Date.** `src/astro.js:358` checks the constructed result with `Number.isNaN(result.getTime())` and throws a `TypeError` ("nextFullMoon result is outside the representable Date range") for inputs past the top of the JS `Date` range, matching the module's existing bad-input guard shape (`:281`, `:346`). Regression at `test/astro.test.js:294`. |

---

## Why this stopped early

The run reached DONE at 09:00 UTC against a 15:32 stop — about 6.5 hours unspent. That was
a decision and it is worth stating plainly rather than burying.

The definition of done was re-verified from evidence at cycle 47, not read off backlog
labels: KI-1 (REPORT.md above + README:38-41), KI-6 (astro.js:358 + astro.test.js:294),
KI-7 (`PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` astro.js:71/:363, README:184,
astro.test.js:491), KI-5 (render.test.js:617), 145/145 green, no `dependencies` key.

Three backlog items remain `todo`, and every one fails the value ratchet:

- **T-116** — README uses British "colour" and a `## Licence` heading. Ratchet-rejected on
  record at cycles 20, 21, 22 and again at 47.
- **T-130** — a comment in a test file describes its pinned arithmetic as free of
  nondeterminism; ECMA-262 leaves `Math.sin`/`Math.cos` implementation-approximated. The
  claim is *measured true* on Node 20/22/24 in CI. A precision-of-wording nit in a file the
  end user never opens.
- **T-139** — a comment recording why three mutation survivors at the 0%/100% endpoints are
  the check being correct rather than holes.

All three are documentation of things that are already true. The SPEC named this run's
specific taste risk as **churn** — "a diff that is mostly reworded prose and duplicate
tests, which looks like work and changes nothing" — and building them is precisely that.
KI-4 and KI-8 both need a human and cannot be closed here at all. The remaining
nice-to-have (actually *fixing* KI-5 with a single-width glyph set) is L-effort, and the
SPEC excluded it for this posture on cost grounds, not because the defect is acceptable.

Budget context, since it is the other half of the honesty: the allocator held posture
`trickle` with a **zero** premium allowance for the entire observed tail, weekly usage
finished at 79.0% against 73.79% of the week elapsed, and premium sat at 96%. Stopping
with wall-clock unspent while the weekly runs slightly hot is the correct trade.

---

## Operational findings (SWARM tooling, not the product)

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
node --test test/*.test.js    # 145 tests
```

No install step, no dependencies, no network access at any point.

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

**Coverage this run did NOT provide.** One review-fix pass ran, at **cycle 23**, k=1; it
was never re-run, because review-fix is the most premium-heavy work type in the pipeline
and the allocator premium allowance stayed at zero for the rest of the run. (An earlier
revision of this report claimed review-fix had never run in any cycle. That was wrong —
`state.json` records `last_review_fix_cycle: 23` — and it is corrected here rather than
quietly dropped.) Read the correctness coverage as: comprehensive on the astronomy and on
the documented end-to-end surfaces, one adversarial review pass on the code as a whole.

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
4. **Fix the SWARM allowlist (KI-2) and run the playbook curator.** Both are noted above
   under Operational findings; neither is a product defect, and both will silently degrade
   the next run if left.

**The one thing I would not have you take on trust:** every "verified" claim in this
document has a command behind it, and those commands are pasted in `.swarm/journal.md`.
If any claim here matters to you, the evidence is on disk — read it rather than believing
this file.
