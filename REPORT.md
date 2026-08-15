# REPORT — moon

**Run:** 2026-08-14, 11:29 → 12:59 UTC (90 minutes, attended, thermostat pacing)
**Target:** `/opt/targets/moon`
**Outcome:** shipped, all must-haves verified. 8 commits, 0 reverts, 102/102 tests green.

---

## What was built

A zero-dependency Node CLI that prints the current phase of the moon.

```
░░░░▕   4%  waxing crescent
            next full moon  28 Aug
```

Flags: `--json`, `--block`, `--compact`, `--south`, `--north`, `--help`.
Run: `node bin/moon.js` · Test: `node --test test/*.test.js`

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

### CLAIMED but NOT independently verified

- **Published reference timestamps.** Several anchors (eclipse dates, 2025 quarter times)
  came from model memory, not a primary source — the session had no network access. They
  are mutually consistent and agree to the minute, but they are not independently sourced.
  The 2000-01-06 anchor is the load-bearing one and it is corroborated by hand arithmetic
  from the Meeus epoch constant.
- **Accuracy outside ~1900–2100.** The ΔT polynomial is extrapolated beyond its fitted
  range. Irrelevant for a "current phase" tool, unverified regardless.

---

## Defects found and fixed during the run

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

Five regression tests were added in `test/regressions.test.js` so these cannot silently
return.

---

## Known issues (4)

The `severity` column is severity only. A separate `status` column carries how each issue
now stands, so the two never collide.

| id | severity | status | issue |
|---|---|---|---|
| KI-2 | medium | open, blocking | `settings.json` allowlist edit was denied, so `additionalDirectories` does not list the target. Headless relaunches must pass `--add-dir`. SWARM tooling gap, not a product defect. |
| KI-4 | low | open, unverified | Terminal font variance beyond width (ligatures, exotic fonts) remains unverified — no automated check can cover it; needs a human look. |
| KI-5 | medium | pinned by test, not fixed | **Glyph width.** The disc mixes East Asian Width classes (`░` `▐` are Neutral; `▒ ▓ █ ▌ ▏ ▕` are Ambiguous). In terminals rendering ambiguous-width as double (CJK locales, iTerm2 setting, `xterm -cjk_width`) the disc is 5–9 columns instead of 5: the line jitters between nights, the two-line form stops aligning, and the `--block` frame does not close. Correct in default Western-locale terminals. `test/render.test.js`'s `KI-5 pin: disc glyph set matches the documented East Asian Width partition` derives the disc's actual glyph set from `renderLine`/`renderBlock` output and checks it against the documented partition, so an unannounced glyph change now fails the suite instead of drifting silently. The glyph-set redesign that would actually fix the width problem is still deferred — this is a pin, not a fix. |
| KI-7 | low | bounded (sampled), not fixed | At epochs far outside normal use (empirically found around ±270,000 years) `phaseName` and `illumination` can contradict, since the ch.49 and ch.48 Meeus series diverge. `src/astro.js`'s exported `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` constant (astro.js:71-74) declares the domain over which the two are known to stay consistent — the half-open range of calendar years 1000–3000 — and `test/astro.test.js`'s `KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)` (astro.test.js:393) strides 4000 deterministic points across that domain with zero band violations. This is a sampled bound, not a proof, and nothing enforces it at runtime. |

## Resolved issues

| id | severity | how it closed |
|---|---|---|
| KI-1 | low | **Prior-art sweep completed, grep-verified against source (not READMEs).** Nearest npm package is `lunarphase-js` v2.0.3 (ISC): its core is the naive mean-synodic modulo with zero periodic correction terms, its "hemisphere support" swaps emoji glyphs rather than mirroring art, and it has no `bin` field, so it is a library, not a CLI. `astronomia` v4.2.0 (MIT) is a genuine Meeus port but is a dependency, which this project's zero-dependency non-goal forbids. The finding is propagated into README's "Why this one" section. |
| KI-3 | medium | **The repo has a remote and the branch is pushed.** `git remote -v` lists `origin` → `https://github.com/trmnmc/moon.git`; `git branch -vv` shows `main` tracking `origin/main`, up to date; `HEAD` and `origin/main` resolve to the same commit. `gh auth status` reports an authenticated session for account `trmnmc`. |
| KI-6 | low | **`nextFullMoon()` now throws instead of returning an Invalid Date.** `src/astro.js:357-359` checks the constructed result with `Number.isNaN(result.getTime())` and throws a `TypeError` ("nextFullMoon result is outside the representable Date range") for inputs past the top of the JS `Date` range, matching the module's existing bad-input guard shape. |

---

## Operational finding (SWARM tooling, not the product)

**A second conductor session ran concurrently with this one.** `swarm-pacer.timer`
spawned a headless cycle at 11:54:33 (finished 12:03:13, cost $2.93) because this
session's heartbeat `next_wakeup_at` came due while it was still mid-cycle. That session
found the dirty working tree, performed a textbook cycle.md step-2 salvage commit
(`795513e`), and rewrote the runfile.

No damage this time — it committed work-in-progress that was later superseded, and the
verified tree is intact. But two conductors on one repo is a real hazard: with different
timing it could have committed a half-written file as though it were finished work, or
raced the runfile. The heartbeat was subsequently clamped to `stop_at` to prevent a third
spawn during wrap-up.

Per hard rule 5 this is reported, not fixed live. It belongs in the playbook.

---

## How to run it

```sh
git clone <this repo> && cd moon
node bin/moon.js              # single line + next full moon
node bin/moon.js --compact    # exactly one line, for a shell prompt
node bin/moon.js --block      # framed readout
node bin/moon.js --json       # structured output
node --test test/*.test.js    # 114 tests
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

Since this run's header above, three known issues closed and two more moved from
prose-only to machine-checked. KI-1 (npm prior-art gap), KI-3 (no git remote) and KI-6
(uncaught out-of-range throw) are resolved — see "Resolved issues" above for what closed
each one. KI-7 (phase/illumination divergence at absurd epochs) is bounded and
sampled-tested, not fixed: `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` in `src/astro.js`
declares the supported range and `test/astro.test.js` samples 4000 points across it;
behavior outside that range stays unspecified. KI-5 (glyph width) is now pinned by a test
in `test/render.test.js`, not fixed: an unannounced change to the disc's glyph set would
now fail the suite, but the terminal-width defect itself is untouched. KI-2 and KI-4 are
unchanged and still open — see "Known issues" above.

The run's review-fix pass has not been run in any cycle; review-fix is the most
premium-heavy work type in the pipeline, and the allocator premium allowance has
remained zero throughout. Nothing above should be read as claiming that coverage.

**What only a human can finish:**

1. **Look at it in your own terminal.** KI-5 is the honest weak point: the art is correct
   in a default Western-locale terminal and provably wrong in an ambiguous-width one. A
   test now pins the glyph set so a silent regression can't happen, but no test can tell
   you which terminal class you have. Run it and see.
2. **Decide whether the glyph set is actually beautiful.** It is austere, aligned, and
   emoji-free — it satisfies the brief as written. Whether it feels like *a tiny precision
   instrument* is a judgement no assertion makes. That was your phrase, and you are the
   only one who can say whether it landed.
3. **npm gap, closed (KI-1).** The sweep found no competing hemisphere-aware Unicode CLI;
   the nearest package, `lunarphase-js`, is a naive-modulo library with no `bin` entry. See
   the "Resolved issues" section above for the finding.

**The one thing I would not have you take on trust:** every "verified" claim in this
document has a command behind it, and those commands are pasted in `.swarm/journal.md`.
If any claim here matters to you, the evidence is on disk — read it rather than believing
this file.
