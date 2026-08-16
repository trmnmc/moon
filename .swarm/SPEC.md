# SPEC — moon (improvement run 2)

<!-- Instantiated 2026-08-16 for the allocator-driven IMPROVEMENT run (the SECOND one on
     this repo). This REPLACES the 2026-08-14 improvement spec as the live contract but
     does NOT repeal it, nor the original build spec: every must-have, non-goal, and taste
     note of both remains binding. The 2026-08-14 spec is preserved verbatim on disk at
     .swarm/SPEC-improve-2026-08-14.md, and the original build spec at git tag v0.1.0.
     This file scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

Second housekeeping run on `moon`, a shipped zero-dependency Node CLI that prints the
current moon phase as terminal art. The product was declared DONE at cycle 47 with 145/145
tests green and its definition-of-done re-verified from evidence, not from backlog labels.

**No new features.** The work is measurement, not addition: find the surfaces the existing
suite cannot actually discriminate, close the ones that are real holes, and re-verify every
factual claim the docs make against the tree as it stands today.

The first improvement run's own report named the trap this run must avoid, and the playbook
learned it twice (L-031, L-033): reading a suite for gaps produces test-count churn;
mutation-measurement produces exactly the items that close real holes.

## Audience

The next person to change this code — including the next SWARM run, which inherits whatever
this one leaves. Secondarily the end user, who benefits only where a doc claim gets more
honest. This run does not pretend to serve a new user, and saying so is part of the honesty.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only
     after conductor verification, never by claim. -->

- [ ] **Every test added or changed is proven FAILABLE and ATTRIBUTABLE.** Run the mutation
      twice: once with the new test present (must go red) and once with it removed (must go
      green). A kill that cannot be attributed to the new test may belong to some other test
      in the suite and is not evidence (L-029). Both arms' real output goes in the journal.
- [ ] **Untested surfaces are found by MEASUREMENT, not by reading.** Mutate each documented
      behavior against the existing suite; the survivors are the candidate work. Every
      survivor is classified **HOLE** or **BOUNDARY** before anything is hardened — a
      survivor at a point where the observable is genuinely indiscriminable is the check
      being *correct*, and hardening it produces a check that false-rejects honest output
      (L-033). Build tests only for HOLEs; record the BOUNDARY calls with their reasoning.
- [ ] **The three surviving backlog items are resolved on their merits or refused with
      evidence.** T-116 (README keeps British "colour" and a `## Licence` heading while
      package.json declares `"MIT"`), T-130 (a test comment calls pinned arithmetic free of
      nondeterminism, but ECMA-262 specifies `Math.sin`/`Math.cos` as
      implementation-approximated), T-139 (nothing records that the sweep table cannot
      discriminate a phase NAME at the 0% and 100% endpoints). Each was ratchet-rejected
      while richer work competed; under a docs-only brief that competition is gone, which
      legitimately changes the score. A refusal is a complete outcome — but it must cite
      evidence, not repeat the earlier rejection.
- [ ] **Every line-cited and output-cited doc claim is re-verified against the current
      tree.** README.md, .swarm/CONTRACTS.md and REPORT.md cite specific line numbers
      (e.g. `astro.js:358`, `render.test.js:617`, `astro.test.js:491`) and paste captured
      command output. Line citations drift silently as files change. Captured output is
      REGENERATED with different inputs, never hand-edited, not even cosmetically — the
      first run self-caught exactly this error and it became L-036.
- [ ] **Test count is never reported as an outcome.** The reportable numbers are: mutants
      killed, survivors classified, doc claims re-verified, claims found stale. A cycle that
      cannot name the surface a test closes does not write that test.

## Nice-to-haves

<!-- Do not start these until every must-have is verified green. -->

- Make REPORT.md's known-issues table self-consistent with `.swarm/state.json` (the two are
  maintained separately and can drift).
- Sharpen the KI-5 note so a reader can tell **in one line** whether their own terminal is
  affected, instead of having to reason about East Asian Width classes.
- A CI workflow file so the suite runs on push (carried over unstarted from the last run).

## Non-goals

- **No new features of any kind**: no new flags, no `--date`, no moon age, no countdown, no
  moonrise/moonset. The allocator brief is explicit and every earlier cut stands.
- **No new runtime dependencies.** Zero-dep is a must-have of the original spec.
- **No rewriting of the astronomy core.** It is verified against Meeus worked examples 49.a
  and 49.b to sub-second agreement; touching it risks the one thing that is proven.
- **No swarm-authored LICENSE file.** KI-8 needs a copyright line naming a legal person.
  That is the owner's decision and a build agent must not invent one.
- **No weakening of a test, a claim, or a gate to reach green** (hard rule 2). The only
  honest path to green is making the claim true.
- No emoji, no color, no config file, no npm publish (original non-goals, still binding).

## Taste notes

The taste is *a tiny precision instrument, not a toy* — austere, aligned, emoji-free. This
run must not dilute it.

The taste risk of a second housekeeping run is **CHURN wearing rigor's clothes**: a diff of
reworded prose and near-duplicate tests that looks like diligence and changes nothing a
reader could detect. The antidote is the failable/attributable arms — a test that cannot be
shown to fail against a real mutation is churn no matter how it reads.

In docs, a claim made weaker but true beats one made stronger and unverifiable. Every number
in the docs should have a command behind it.

## Domain rules

Ground truth, hand-computable without reading any code:

- Mean synodic month = 29.530588861 days. True lunation length varies roughly 29.27–29.83
  days, so **the mean is never an upper bound** (L-035).
- Illumination `k = (1 + cos i) / 2`, where `i` is the phase angle. `k` (Meeus ch.48) and
  `phaseName` (Meeus ch.49 instant tables) derive from different series and are guaranteed
  consistent only inside the declared domain.
- `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` (`src/astro.js`): the half-open range of calendar
  years **1000–3000**. Sampled at 4000 deterministic points with zero band violations — a
  sampled bound, **not a proof**, and nothing enforces it at runtime.
- **Illumination cannot discriminate a phase NAME at the endpoints.** At k = 0% both new
  and the instants either side of it agree, and at k = 100% likewise: illumination is
  symmetric about the syzygies while the name is not. This is the T-139 surface.
- The disc glyph set partitions by East Asian Width: `░` and `▐` are **Neutral**;
  `▒ ▓ █ ▌ ▏ ▕` are **Ambiguous**. In terminals rendering ambiguous-width as double the
  disc is 5–9 columns instead of 5 (KI-5) — real, upstream, deliberately deferred, and
  pinned by `test/render.test.js` so it cannot change unannounced.
- JS `Date` range tops out at ±8.64e15 ms from epoch (year ≈ 275760); beyond it `Date`
  arithmetic yields `NaN` and `toISOString()` throws `RangeError`.

## Definition of done

A mutation sweep run over the documented behaviors, with every survivor classified HOLE or
BOUNDARY and its reasoning recorded; every HOLE closed by a test proven failable AND
attributable in two arms; T-116, T-130 and T-139 each resolved or refused with cited
evidence; every line-cited and output-cited doc claim re-verified against the current tree
with stale ones corrected; suite green and never below the 145-test baseline; no
`dependencies` key in package.json.

## Commands

- run: `node bin/moon.js`
- test: `node --test test/*.test.js`

## Spec digest

- second improvement run on the shipped moon CLI: measure what the suite cannot
  discriminate, close real holes, re-verify every doc claim — NO new features, no deps,
  astronomy core not rewritten
- must: every new test proven failable AND attributable in two arms (L-029); surfaces found
  by mutation-measurement, survivors classified HOLE vs BOUNDARY before hardening (L-031,
  L-033)
- must: T-116/T-130/T-139 resolved or refused WITH EVIDENCE; every line-cited and
  output-cited doc claim re-verified, captures regenerated never hand-edited (L-036)
- non-goals: no features/flags, no deps, no swarm-authored LICENSE (KI-8 needs the owner),
  no weakening a gate to reach green
- taste: the risk is CHURN wearing rigor's clothes; test COUNT is never an outcome —
  mutants killed and claims re-verified are
