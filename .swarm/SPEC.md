# SPEC — moon (improvement run 3)

<!-- Instantiated 2026-08-17 for the allocator-driven IMPROVEMENT run (the THIRD one on this
     repo). This REPLACES the 2026-08-16 improvement spec as the live contract but does NOT
     repeal it, nor the 2026-08-14 one, nor the original build spec: every must-have,
     non-goal and taste note of all three remains binding. Preserved verbatim on disk at
     .swarm/SPEC-improve-2026-08-16.md and .swarm/SPEC-improve-2026-08-14.md; the original
     build spec is at git tag v0.1.0. This file scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

THIRD housekeeping run on `moon`, a shipped zero-dependency Node CLI that prints the current
moon phase as terminal art. 148/148 tests green at kickoff (measured, not inherited); the
astronomy core is verified against Meeus worked examples 49.a/49.b to sub-second agreement.
Two prior housekeeping runs already mutation-swept every source file in the repo
(`src/render.js`, `src/args.js`, `src/hemisphere.js`, `src/astro.js`, `bin/moon.js`).

**No new features.** And, deliberately, **no fourth broad re-sweep** of files already swept at
the same granularity — that is this run's churn trap, not its work. Run 2 ended early on the
weekly usage cap with its three most valuable findings measured but never dispatched. This run
spends a fresh window on the work run 2 could only name:

1. Close the three MEASURED holes run 2 left open — T-153, T-155, T-156.
2. Extend measurement to the one axis no sweep has covered: flag INTERACTIONS, not
   single-file single-behavior mutants.
3. Re-verify every line-cited and output-cited doc claim against the tree as it stands.
4. Close or re-measure KI-2, the SWARM-side allowlist gap that has now degraded the budget
   probe, the notify send path and the playbook append across three runs.

## Audience

The next person to change this code — including the next SWARM run, which inherits whatever
this one leaves. Secondarily the end user, who benefits only where a doc claim gets more
honest. This run does not pretend to serve a new end user, and saying so is part of the
honesty.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only after
     conductor verification, never by claim. -->

- [ ] **T-155 resolved or refused with evidence.** No test compares any `--json` numeric field
      against an exact expected value, so `round()`'s scale factor AND its rounding rule are
      both unverified. Run 2 measured this as the single most severe survivor of its whole
      sweep (the M25 family: the illumination precision guard is provably blind forever to a
      scale-factor mutation) and never got a cycle that could afford it — M-effort, and gear 1
      never admitted it. Any fix must pin exact values hand-derived from the Domain rules
      below, never values read back out of the implementation.
- [ ] **T-153 resolved or refused with evidence.** Nothing exercises `--block` together with
      `--compact`; the next-full-moon suppression on the block branch is unpinned.
- [ ] **T-156 resolved or refused with evidence.** The `moon: ` stderr prefix on usage errors
      is unpinned — the only stderr test uses an unanchored regex. The fix must anchor on a
      structural property the stream actually owns, never on prose matched loosely (L-043).
- [ ] **The flag-interaction matrix is enumerated and measured.** Every prior sweep mutated one
      behavior in one file. The uncovered axis is combinations: enumerate the CLI's flag
      matrix, mutate the interaction branches, and classify every survivor **HOLE** or
      **BOUNDARY** BEFORE hardening anything (L-033) — a survivor at a point where the
      observable is genuinely indiscriminable is the check being *correct*, and hardening it
      produces a check that false-rejects honest output. Build tests only for HOLEs; record
      every BOUNDARY call with its reasoning.
- [ ] **Every test added or changed is proven FAILABLE and ATTRIBUTABLE.** Two arms: the
      mutation applied with the new test present (suite must go red, and the distinct failing
      test must be the new one BY NAME), and the same mutation with the test removed (suite
      must go green). A kill that cannot be attributed to the new test may belong to some
      other test in the suite and is not evidence (L-029). Both arms' real output goes in the
      journal.
- [ ] **Every line-cited and output-cited doc claim is re-verified against the current tree.**
      README.md, `.swarm/CONTRACTS.md` and REPORT.md cite specific line numbers (e.g.
      `astro.js:358`, `render.test.js:617`) and paste captured command output. Line citations
      drift silently as files change. Captured output is REGENERATED with the documented
      inputs, never hand-edited, not even cosmetically — run 1 self-caught exactly this error
      and it became L-036.
- [ ] **Test count is never reported as an outcome.** The reportable numbers are: mutants
      killed, survivors classified HOLE vs BOUNDARY, doc claims re-verified, claims found
      stale. A cycle that cannot name the surface a test closes does not write that test.

## Nice-to-haves

<!-- Do not start these until every must-have is verified green. -->

- Sharpen the KI-5 note so a reader can tell **in one line** whether their own terminal is
  affected, instead of having to reason about East Asian Width classes. A previous attempt was
  DISPROVED at the gate (cycle 62): its proposed observable — top-right vs bottom-right corner
  alignment — does not differ under the failure mode, because all six frame glyphs are EAW
  Ambiguous and both borders scale together; the ragged edge is on the content rows at cols
  34–37. Any new observable must be verified to actually differ before it ships.
- Make REPORT.md's known-issues table self-consistent with `.swarm/state.json` (the two are
  maintained separately and can drift).
- Archive the prior runs' journal tail so the live `.swarm/journal.md` (738 KB at kickoff)
  stays readable to a fresh session: append-only copy into a dated archive file, never a
  deletion, git history retains everything either way.

## Non-goals

- **No new features of any kind**: no new flags, no `--date`, no moon age, no countdown, no
  moonrise/moonset. The allocator brief is explicit and every earlier cut stands.
- **No new dependencies — runtime OR dev.** This includes a mutation-testing framework:
  StrykerJS + `@stryker-mutator/tap-runner` would genuinely drive this suite (verified at
  kickoff: the package exists and supports node's built-in test runner via TAP), and the
  decision to keep hand-authored conductor mutants instead is recorded here so it is not
  re-litigated every run. The reason is cost-of-dependency in a repo whose selling point is
  zero deps, plus the fact that a generic operator set would not have found T-155 — an
  oracle/exactness gap, not an operator gap. A `package-lock.json` or `node_modules`
  appearing in this repo is a failed run.
- **No rewriting of the astronomy core.** It is verified against Meeus 49.a and 49.b to
  sub-second agreement; touching it risks the one thing that is proven.
- **No swarm-authored LICENSE file.** KI-8 needs a copyright line naming a legal person. That
  is the owner's decision and a build agent must not invent one.
- **No fourth broad mutation sweep** of files already swept at the same granularity. The
  survivor list from runs 1–2 already exists; re-deriving it is churn.
- **No glyph-set redesign.** Closing KI-5 for real is the one change an end user would feel,
  and it is feature-shaped; it is named here as the alternative this brief forbids, not
  quietly omitted.
- **No weakening of a test, a claim, or a gate to reach green** (hard rule 2). The only honest
  path to green is making the claim true.
- No emoji, no color, no config file, no npm publish (original non-goals, still binding).

## Taste notes

The taste is *a tiny precision instrument, not a toy* — austere, aligned, emoji-free. This run
must not dilute it.

The taste risk of a THIRD housekeeping run is sharper than run 2's: not merely churn wearing
rigor's clothes, but **diminishing-return churn** — a night spent re-measuring surfaces already
measured, producing a diff that reads as diligence and changes nothing a reader could detect.
The antidote is a hard traceability rule: **every work item this run must trace to one of
exactly three sources** — (1) a survivor ALREADY ON RECORD from a prior sweep, (2) a doc claim
that FAILED re-verification, or (3) the one genuinely uncovered axis, flag interactions. An
item that traces to none of those three does not get built, however tidy it would be.

In docs, a claim made weaker but true beats one made stronger and unverifiable. Every number in
the docs should have a command behind it.

The kickoff taste judge scored `one-memorable-thing` at 3/10 and was right to: nothing a user
can see changes tonight. That is accepted by design, not disputed.

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
- **Illumination cannot discriminate a phase NAME at the endpoints.** At k = 0% both new and
  the instants either side of it agree, and at k = 100% likewise: illumination is symmetric
  about the syzygies while the name is not. This is the T-139 surface.
- The disc glyph set partitions by East Asian Width: `░` and `▐` are **Neutral**;
  `▒ ▓ █ ▌ ▏ ▕` are **Ambiguous**. In terminals rendering ambiguous-width as double the disc
  is 5–9 columns instead of 5 (KI-5) — real, upstream, deliberately deferred, and pinned by
  `test/render.test.js` so it cannot change unannounced.
- JS `Date` range tops out at ±8.64e15 ms from epoch (year ≈ 275760); beyond it `Date`
  arithmetic yields `NaN` and `toISOString()` throws `RangeError`.

## Definition of done

T-153, T-155 and T-156 each closed with a two-arm proof or refused with cited evidence; the
flag-interaction matrix enumerated with every survivor classified HOLE or BOUNDARY and its
reasoning recorded; every line-cited and output-cited doc claim re-verified against the current
tree with stale ones corrected and captures regenerated; KI-2 either closed on a live
invocation as evidence or re-measured with the exact refusal recorded; suite green and never
below the 148-test baseline measured at kickoff; no `dependencies` key in package.json and no
lockfile or `node_modules` in the repo.

## Commands

- run: `node bin/moon.js`
- test: `node --test test/*.test.js`

## Spec digest

- third improvement run on the shipped moon CLI: close the three holes run 2 MEASURED but
  never dispatched (T-153/T-155/T-156), measure the one uncovered axis (flag interactions),
  re-verify every doc claim — NO new features, NO new deps of any kind, astronomy core not
  rewritten
- must: every new test proven failable AND attributable by name in two arms (L-029); survivors
  classified HOLE vs BOUNDARY before hardening (L-033); no fourth broad re-sweep
- must: every line-cited and output-cited doc claim re-verified, captures regenerated never
  hand-edited (L-036); KI-2 closed or re-measured with the exact refusal on record
- non-goals: no features/flags, no deps incl. devDeps (StrykerJS declined on the record), no
  swarm-authored LICENSE (KI-8 needs the owner), no glyph-set redesign, no weakening a gate
- taste: the risk is DIMINISHING-RETURN churn; every item must trace to a recorded survivor, a
  failed doc re-verification, or the flag-interaction axis — test COUNT is never an outcome
