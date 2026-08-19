# SPEC — moon (improvement run 4)

<!-- Instantiated 2026-08-18 for the allocator-driven IMPROVEMENT run (the FOURTH one on
     this repo). This REPLACES the 2026-08-17 improvement spec as the live contract but does
     NOT repeal it, nor the 2026-08-16 or 2026-08-14 ones, nor the original build spec: every
     must-have, non-goal and taste note of all four remains binding. Preserved verbatim on
     disk at .swarm/SPEC-improve-2026-08-17.md, .swarm/SPEC-improve-2026-08-16.md and
     .swarm/SPEC-improve-2026-08-14.md; the original build spec is at git tag v0.1.0. This
     file scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

FOURTH housekeeping run on `moon`, a shipped zero-dependency Node CLI that prints the current
moon phase as terminal art. **171/171 tests green at kickoff** — measured at kickoff by running
`node --test test/*.test.js`, not inherited from a document. The astronomy core is verified
against Meeus worked examples 49.a/49.b to sub-second agreement. Three prior housekeeping runs
have already mutation-swept every source file (`src/render.js`, `src/args.js`,
`src/hemisphere.js`, `src/astro.js`, `bin/moon.js`), measured the flag-interaction axis, and
re-verified every line-cited doc claim.

This run is allocator-driven under a **TRICKLE posture**: idle capacity, housekeeping only,
haiku-priced work types, no new features. It exists because there was spare window, not because
a user asked. Saying that plainly is part of the honesty.

**No new features. No new measurement axis.** Run 3 spent its night on flag interactions; there
is no next axis that isn't churn. This run closes items already filed and nothing else. Four
things, all traceable:

1. Close **T-175**, the one open backlog item and a real wrong answer to a user.
2. Check every recorded `[apply:]` practice lesson against what this repo's tests actually do,
   and file every place the repo violates its own lesson.
3. Write the owner-decision handoff for **KI-8** (the package claims a license the repo does
   not contain).
4. Make **REPORT.md readable again** — at 60,774 bytes it has outgrown the product it reports on.

## Audience

The next person to change this code — including the next automated run, which inherits whatever
this one leaves. Secondarily the end user, who benefits only where a doc claim gets more honest
or a wrong answer gets fixed. This run does not pretend to serve a new end user.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only after
     conductor verification, never by claim. -->

- [ ] **T-175 closed or refused with evidence.** `detectHemisphere('US/Samoa')` returns north for
      a location at 14 degrees **SOUTH** — a wrong answer, filed and open, and the one southern
      legacy alias the table gets wrong. The fix must come with a two-arm proof (L-029): the
      mutation applied with the new test present (suite goes red, and the distinct failing test
      is the new one **BY NAME**), and the same mutation with the test removed (suite goes
      green). Both arms' real output goes in the journal. The surrounding legacy-timezone-alias
      table is swept for the same class of error — that is this filed defect's own surface, not
      a new broad sweep.
- [ ] **Every `[apply:]` practice lesson is checked against this repo and violations are filed.**
      The recorded cross-run lessons prescribe concrete testing practices — prove new tests
      failable AND attributable (L-029); pair every killing mutation with a converse control
      that must leave the suite GREEN (L-044); never bind an assertion to prose matched by
      regex (L-043); derive expected counts from the authoritative source at run time rather
      than hardcoding them (L-045). Each is checked against the tests this repo actually
      contains; every violation found is filed as a backlog item with file and line, and fixed
      if it is S-effort. **A lesson the repo already honors is recorded as checked-and-clean —
      that is a valid, reportable outcome**, not a failure to find work.
- [ ] **The KI-8 owner ask is written.** `package.json` declares `"license": "MIT"` and
      `"private": false`, and the repo contains no LICENSE file — a package that publicly claims
      a license it does not carry. An automated agent must not invent a copyright holder (that
      non-goal stands, below), but nobody has yet written the ask. Deliverable: a short handoff
      naming the exact one line the owner must supply, the exact file to create, and what stays
      broken until they do. Refusing with cited evidence is an acceptable close.
- [ ] **REPORT.md's first screen is readable, with forensics archived not deleted.** A
      first-time reader must get what-it-is, how-to-run, what-is-verified and known-issues
      within the first screen; the run-by-run forensic detail moves to a dated archive file,
      never a deletion (git history retains everything either way — the archive is for the
      reader, not for the bytes). The existing `test/report-issues.test.js` gate parses REPORT's
      tables and must still pass — if restructuring moves its anchors, **the GATE IS FIXED,
      never weakened and never re-labelled** (hard rule 2).
- [ ] **Every count-citing and line-citing claim in README.md and REPORT.md is re-derived at run
      time.** Not a fourth full doc re-verification pass. Scope is exactly the claims that ROT:
      test counts, issue counts, and `file:line` citations. Each is re-derived from the
      authoritative source at the moment it is checked, never from a previously captured number
      (L-045). A stale count is a defect; prose that is already true is not.
- [ ] **No test is added that cannot name the surface it closes.** Test COUNT is never an
      outcome. The reportable numbers are: defects closed, lessons checked, violations filed,
      claims found stale.

## Nice-to-haves

<!-- Do not start these until every must-have is verified green. -->

- Give **KI-5** a one-line reader-runnable check so someone can tell whether THEIR terminal is
  affected by the ambiguous-width glyph issue, instead of having to reason about East Asian
  Width classes. A previous attempt was **DISPROVED at the gate** (cycle 62): its proposed
  observable — top-right vs bottom-right corner alignment — does not differ under the failure
  mode, because all six frame glyphs are EAW Ambiguous and both borders scale together; the
  ragged edge is on the content rows at cols 34–37. Any new observable must be verified to
  actually differ before it ships.
- Re-archive the working journal if it crosses roughly 400 KB, by append-only copy into a dated
  archive, never a deletion.

## Non-goals

- **No new features of any kind**: no new flags, no `--date`, no moon age, no countdown, no
  moonrise/moonset. The allocator brief is explicit and every earlier cut stands.
- **No new dependencies — runtime OR dev.** Including a mutation-testing framework: StrykerJS
  was evaluated and declined on the record by run 3, and that decision is not re-litigated. A
  `package-lock.json` or `node_modules` appearing in this repo is a failed run.
- **No fifth broad mutation sweep**, and no re-derivation of the survivor lists three prior runs
  already produced.
- **No new measurement axis.** Named explicitly as the thing this brief forbids, not quietly
  omitted.
- **No rewriting of the astronomy core.** It is verified against Meeus 49.a and 49.b to
  sub-second agreement; touching it risks the one thing that is proven.
- **No agent-authored LICENSE text.** KI-8 needs a copyright line naming a legal person; that is
  the owner's decision. The handoff asking for it is not a LICENSE and does not become one.
- **No glyph-set redesign.** Closing KI-5 for real is feature-shaped; it is named here as the
  alternative this brief forbids.
- **No rewording of prose that is already true.**
- **No weakening of a test, a claim, or a gate to reach green** (hard rule 2). The only honest
  path to green is making the claim true.
- No emoji, no color, no config file, no npm publish (original non-goals, still binding).

## Taste notes

The taste is *a tiny precision instrument, not a toy* — austere, aligned, emoji-free. This run
must not dilute it.

The risk on a FOURTH housekeeping run is the sharpest yet, and it is not merely churn: it is
that **the only honest outcome may be "nothing needed doing."** That outcome is **EXPLICITLY
ALLOWED** here. If the traceable item list drains and every remaining candidate fails the
ratchet "would the next reader actually notice?", the run declares the target DONE and wraps
early rather than manufacturing work. A short honest run beats a long diligent-looking one, and
a diff that reads as diligence while changing nothing a reader could detect is the failure mode
this spec exists to prevent.

Every work item must trace to one of exactly **two** sources: a defect already filed, or a
recorded practice lesson this repo demonstrably violates. An item tracing to neither does not
get built, however tidy it would be.

In docs, a claim made weaker but true beats one made stronger and unverifiable. Every number in
the docs should have a command behind it.

The kickoff taste judge scored `use-twice` 3/10 and `one-memorable-thing` 3/10 and was right to:
nothing a user can see changes tonight except the Samoa fix, and its verdict is that this night
is worth spending *only if the capacity has no competing claim*. The allocator says it does not
(posture trickle, human inactive, 0% overall allowance). That condition is the justification and
it is recorded, not assumed.

## Domain rules

Ground truth, hand-computable without reading any code:

- Mean synodic month = 29.530588861 days. True lunation length varies roughly 29.27–29.83 days,
  so **the mean is never an upper bound** (L-035).
- Illumination `k = (1 + cos i) / 2`, where `i` is the phase angle. `k` (Meeus ch.48) and
  `phaseName` (Meeus ch.49 instant tables) derive from different series and are guaranteed
  consistent only inside the declared domain.
- `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` (`src/astro.js`): the half-open range of calendar
  years **1000–3000**. Sampled at 4000 deterministic points with zero band violations — a
  sampled bound, **not a proof**, and nothing enforces it at runtime.
- **Illumination cannot discriminate a phase NAME at the endpoints.** At k = 0% both new and the
  instants either side of it agree, and at k = 100% likewise: illumination is symmetric about
  the syzygies while the name is not. This is the T-139 surface.
- The disc glyph set partitions by East Asian Width: `░` and `▐` are **Neutral**; `▒ ▓ █ ▌ ▏ ▕`
  are **Ambiguous**. In terminals rendering ambiguous-width as double the disc is 5–9 columns
  instead of 5 (KI-5) — real, upstream, deliberately deferred, and pinned by
  `test/render.test.js` so it cannot change unannounced.
- **Hemisphere matters**: the lit limb is mirrored in the southern hemisphere. A timezone that
  resolves to the wrong hemisphere prints a mirrored — that is, wrong — disc. This is the T-175
  surface.
- JS `Date` range tops out at ±8.64e15 ms from epoch (year ≈ 275760); beyond it `Date`
  arithmetic yields `NaN` and `toISOString()` throws `RangeError`.

## Definition of done

T-175 closed with a two-arm proof or refused with cited evidence; every `[apply:]` practice
lesson checked against the repo with each result recorded as clean-or-violation and every
violation filed; the KI-8 owner ask written with the exact line and file named; REPORT.md's
first screen readable with forensics archived and `test/report-issues.test.js` still green
(fixed, never weakened, if its anchors moved); every count-citing and line-citing claim in
README.md and REPORT.md re-derived at run time with stale ones corrected; suite green and never
below the **171-test baseline measured at kickoff**; no `dependencies` or `devDependencies` key
in package.json, and no lockfile or `node_modules` in the repo.

## Commands

- run: `node bin/moon.js`
- test: `node --test test/*.test.js`

## Spec digest

- fourth improvement run on the shipped moon CLI, TRICKLE posture: close T-175 (Samoa returns
  the wrong hemisphere), check every `[apply:]` lesson against the repo, write the KI-8 owner
  ask, make the 60 KB REPORT.md readable — NO new features, NO new deps, NO new measurement axis
- must: T-175 proven failable AND attributable BY NAME in two arms (L-029); every violation of a
  recorded lesson filed with file and line; checked-and-clean is a valid outcome
- must: only ROTTING doc claims re-derived (counts, `file:line`) and re-derived AT RUN TIME from
  the authoritative source (L-045) — prose already true is left alone
- non-goals: no features/flags, no deps incl. devDeps, no fifth sweep, no new axis, no
  agent-authored LICENSE (KI-8 needs the owner), no glyph redesign, no weakening a gate
- taste: "nothing needed doing" is an ALLOWED outcome that ends the run early; every item traces
  to a filed defect or a demonstrably violated lesson, or it is not built
