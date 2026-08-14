# SPEC — moon (improvement run)

<!-- Instantiated 2026-08-14 for the allocator-driven IMPROVEMENT run. This REPLACES the
     original build spec as the live contract, but does NOT repeal it: every must-have,
     non-goal, and taste note of the original build (git-preserved at tag v0.1.0) remains
     binding. This file scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

Harden, correct, and document an already-shipped zero-dependency Node CLI that prints the
current moon phase. **No new features.** The work is: close or precisely bound the open
known-issues, replace prose-only claims with machine-checked ones, and make the docs tell
the truth about what is verified versus what is deferred.

The product shipped at v0.1.0 with 102 passing tests and one deliberately deferred defect.
A housekeeping run's job is to leave the next person a repo whose claims are all checkable.

## Audience

The next person to change this code — including a future SWARM run. Secondarily the
existing end user, who benefits only where docs get more honest and error paths stop being
surprising. This run does not pretend to serve a new user; saying so is part of the honesty.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only
     after conductor verification, never by claim. -->

- [ ] **KI-1 closed with evidence.** The npm/web prior-art sweep that was
      permission-blocked at the original kickoff is complete (done at this kickoff, see
      Domain rules below) and its finding is recorded in the docs and known_issues.
- [ ] **KI-6 fixed.** `nextFullMoon()` returns an Invalid Date past the top of the JS Date
      range instead of throwing, and `--json` then throws `RangeError` on `toISOString()`.
      Make the failure mode consistent with the rest of the module (which throws
      `TypeError` on bad input), with a regression test.
- [ ] **KI-7 bounded.** `phaseName` and illumination can contradict each other at absurd
      epochs (±270,000 years) because they derive from two different polynomial series.
      Declare an explicit supported date domain in the module and README, and add a
      consistency test across that domain — **SAMPLED, not exhaustive** (taste judge,
      scope-fits-night: an exhaustive sweep is the cheap way to blow a trickle budget).
- [ ] **KI-5 pinned by test.** The East Asian Width glyph defect is real, upstream, and
      deliberately deferred. Replace the prose-only description with a test that measures
      the documented widths, so the defect cannot silently change without failing a gate.
- [ ] **Test hardening under a named-surface rule.** Every test added must close a NAMED
      untested surface — candidates: CLI exit codes, error paths, `--json` field
      stability, package-manifest integrity. **Test COUNT is explicitly not an outcome of
      this run** and must never be reported as one.
- [ ] **Playbook lessons applied to this repo.** L-010 (capture verify exit codes
      directly, never through a pipe), L-024 (prefer discriminators over remembered
      reference values), L-003 (hand-computed expected outputs).
- [ ] **Docs polished for truth.** README and REPORT accurately state what is
      machine-checked versus deferred; no captured command output is ever hand-edited
      (L-026 — the original run self-caught exactly this).

## Nice-to-haves

<!-- Do not start these until every must-have is verified green. -->

- KI-5 actually FIXED via a single-width-class glyph-set redesign. Out of must-haves
  because the trickle posture and a 95%-consumed premium budget make an L-effort visual
  redesign the wrong spend tonight — **not** because the defect is acceptable.
- A CI workflow file so the suite runs on push.

## Non-goals

- **No new features of any kind**: no new flags, no `--date`, no moon age, no countdown,
  no moonrise/moonset. The allocator brief is explicit and the original spec's cuts stand.
- **No new runtime dependencies.** Zero-dep is a must-have of the original spec and is not
  negotiable for the convenience of a cross-check oracle (`astronomia` MIT was found and
  deliberately NOT adopted).
- No npm publish (unchanged from the original spec).
- **No rewriting of the astronomy core.** It is verified against Meeus worked examples
  49.a and 49.b to sub-second agreement; touching it risks the one thing that is proven.
- No emoji, no color, no config file (original non-goals, still binding).

## Taste notes

The original taste is *a tiny precision instrument, not a toy* — austere, aligned, no
emoji, no exclamation marks. This run must not dilute it.

The specific taste risk of a housekeeping run is **CHURN**: a diff that is mostly reworded
prose and duplicate tests, which looks like work and changes nothing. Prefer one test that
pins a real defect over ten that restate a passing one. If a cycle cannot name the surface
a test closes, that test does not get written.

## Domain rules

Ground truth, hand-computable without reading any code:

- Mean synodic month = 29.530588861 days. True lunation length varies roughly 29.27–29.83
  days, so **the mean is never an upper bound** — this was the original run's one real
  correctness defect (L-025).
- Illumination `k = (1 + cos i) / 2`, where `i` is the phase angle. `k` (Meeus ch.48) and
  `phaseName` (Meeus ch.49 instant tables) derive from different series and are only
  guaranteed consistent inside the supported date domain.
- JS `Date` range tops out at ±8.64e15 ms from epoch (year ≈ 275760); beyond it, `Date`
  arithmetic yields `NaN` and `toISOString()` throws `RangeError`.
- **Prior-art finding (closes KI-1, swept at this kickoff, grep-verified not README-read):**
  the nearest npm package is `lunarphase-js` v2.0.3 (ISC). Its core is
  `frac((JD − 2451550.1) / 29.53058770576)` — the naive mean-synodic modulo, with **zero**
  periodic correction terms (grep for meeus/periodic/correction/evection: no hits). Its
  "hemisphere support" swaps *emoji glyphs*, not mirrored art, and it has no `bin` field,
  so it is a library and not a CLI. `astronomia` v4.2.0 (MIT) is a genuine Meeus port but
  is a dependency, which the zero-dep non-goal forbids. Conclusion: this project's
  accuracy claim and hemisphere-mirrored ASCII rendering remain differentiated.

## Definition of done

KI-1, KI-6, and KI-7 each resolved or precisely bounded with a machine-checked assertion;
KI-5 pinned by a measuring test; every added test traceable to a named untested surface;
README and REPORT accurate about verified-vs-deferred; the 102 pre-existing tests still
green; zero new runtime dependencies.

## Commands

- run: `node bin/moon.js`
- test: `node --test test/*.test.js`

## Spec digest

- improvement run on shipped v0.1.0 moon CLI: harden tests, close known-issues, polish
  docs for truth — NO new features, no new runtime deps, core astronomy not rewritten
- must: KI-1 closed with evidence, KI-6 fixed (consistent throw), KI-7 bounded by a
  declared+sampled supported domain, KI-5 pinned by a measuring test
- every added test closes a NAMED untested surface; test count is not an outcome
- non-goals: no new flags/features, no npm publish, no dependencies, no emoji/color
- taste: the risk is CHURN — one test pinning a real defect beats ten restating a pass
