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
| Phase math is real Meeus, not a synodic modulo | Lunation lengths span **29.339–29.775 days** (10.5h spread). A mean-formula implementation is flat at 29.530589 by construction. |
| Accuracy is within the ~1h target | True new moon of 2000-01-06 computed **18:15 UTC** vs published 18:14. The mean formula lands at 14:20 — nearly 4h off. |
| Correction tables are correctly transcribed | Independent audit reproduced Meeus **worked examples 49.a and 49.b to 0.23s and 0.34s**, exercising the mean formula, E, both 25-term tables, W, and A1–A14. |
| Illumination is true elongation, not faked from age | At Meeus example 48.a the module gives **0.6801** (book: 0.6786); an age-derived fake gives 0.6475. Conclusive discriminator. |
| Two independent searches agree | new→full interval over 36 lunations: 13.942–15.576 days, mean **14.764** vs theoretical 14.765. |
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

## Known issues (7)

| id | severity | issue |
|---|---|---|
| KI-5 | medium | **Glyph width.** The disc mixes East Asian Width classes (`░` `▐` are Neutral; `▒ ▓ █ ▌ ▏ ▕` are Ambiguous). In terminals rendering ambiguous-width as double (CJK locales, iTerm2 setting, `xterm -cjk_width`) the disc is 5–9 columns instead of 5: the line jitters between nights, the two-line form stops aligning, and the `--block` frame does not close. **Verified real by measurement.** Correct in default Western-locale terminals. Not fixed — it needs a glyph-set redesign, and there was not enough clock to do that safely. Deferred deliberately rather than half-fixed at the buzzer. |
| KI-1 | medium | **npm/pypi/web prior art was never swept.** The scout's `gh`/WebSearch and a direct npm registry query were all permission-blocked. An npm CLI may already occupy this niche. Flagged to the user at lock; the build proceeded with this unknown. |
| KI-3 | medium | **No git remote.** `gh auth` could not be verified; all 8 commits are local only. Nothing is pushed. |
| KI-2 | medium | `settings.json` allowlist edit was denied, so `additionalDirectories` does not list the target. Headless relaunches must pass `--add-dir`. |
| KI-4 | low | Terminal font variance beyond width (ligatures, exotic fonts) remains unverified — no automated check can cover it. |
| KI-6 | low | `nextFullMoon()` returns an Invalid Date past the top of the JS Date range instead of throwing (needs year 275760; unreachable from a real clock). |
| KI-7 | low | At ±270,000 years `phaseName` and `illumination` can contradict, as the ch.49 and ch.48 series diverge. Zero contradictions across 350,592 states over 2020–2040. |

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
node --test test/*.test.js    # 102 tests
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

**What only a human can finish:**

1. **Look at it in your own terminal.** KI-5 is the honest weak point: the art is correct
   in a default Western-locale terminal and provably wrong in an ambiguous-width one. No
   test can tell you which one you have. Run it and see.
2. **Decide whether the glyph set is actually beautiful.** It is austere, aligned, and
   emoji-free — it satisfies the brief as written. Whether it feels like *a tiny precision
   instrument* is a judgement no assertion makes. That was your phrase, and you are the
   only one who can say whether it landed.
3. **Check the npm gap (KI-1).** Nobody swept npm. If a well-loved moon-phase CLI already
   exists there, that changes what this project is for. One search answers it.
4. **Push it somewhere.** Eight commits sit on a local branch with no remote.

**The one thing I would not have you take on trust:** every "verified" claim in this
document has a command behind it, and those commands are pasted in `.swarm/journal.md`.
If any claim here matters to you, the evidence is on disk — read it rather than believing
this file.
