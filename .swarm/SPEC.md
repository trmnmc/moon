# SPEC — moon (improvement run 5)

<!-- Instantiated 2026-08-19 for the allocator-driven IMPROVEMENT run (the FIFTH one on this
     repo). This REPLACES the 2026-08-18 improvement spec as the live contract but does NOT
     repeal it, nor the 2026-08-17, 2026-08-16 or 2026-08-14 ones, nor the original build spec:
     every must-have, non-goal and taste note of all five remains binding. Preserved verbatim on
     disk at .swarm/SPEC-improve-2026-08-18.md, .swarm/SPEC-improve-2026-08-17.md,
     .swarm/SPEC-improve-2026-08-16.md and .swarm/SPEC-improve-2026-08-14.md; the original build
     spec is at git tag v0.1.0. This file scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

FIFTH housekeeping run on `moon`, a shipped zero-dependency Node CLI that prints the current moon
phase as terminal art. **Measured at this kickoff, not inherited from a document: 175/175 tests
green** (`node --test test/*.test.js`, run at 2026-08-19T21:44Z), **backlog 0 open items** (91
done, 4 dropped, 0 todo/blocked), **phase DONE** — the previous run declared this repo done on
2026-08-18 after its final audit found 0 defects. Four prior housekeeping runs have already
mutation-swept every source file (`src/render.js`, `src/args.js`, `src/hemisphere.js`,
`src/astro.js`, `bin/moon.js`), measured the flag-interaction axis, and audited the repo against
every practice lesson recorded as of 2026-08-18.

This run is allocator-driven under a **TRICKLE posture**: idle capacity, housekeeping only,
haiku-priced work types, no new features. It exists because there was spare window, not because a
user asked. Saying that plainly is part of the honesty.

**No new features. No fifth sweep.** The only thing that has changed since this repo was declared
DONE is the practice playbook: lessons were minted or extended on **2026-08-19, AFTER run 4's
audit closed** (L-046 newly minted; L-043 gained its fails-OPEN clause). That delta — plus the
claims that measurably rot — is this run's entire scope. If the delta audits clean, the run wraps
early and re-declares DONE rather than manufacturing work.

## Audience

The next person to change this code — including the next automated run, which inherits whatever
this one leaves. Secondarily the end user, who benefits only where a doc claim gets more honest.
This run does not pretend to serve a new end user.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only after
     conductor verification, never by claim. -->

- [ ] **L-046 wire-through audit.** Lesson minted 2026-08-19 (`implemented != reachable`: a domain
      capability is not shipped until one check exercises it through the OUTERMOST LAYER A USER
      TOUCHES); it postdates run 4's audit and has never been checked against this repo. For each
      capability the docs claim, establish whether a check exercises it through **`bin/moon.js`**
      — the process a user actually runs — or only through `src/*` imported directly. Each
      capability is recorded reachable-and-checked or filed as a violation **with file and line**.
      Violations that are S-effort are fixed, each with the two-arm proof (L-029: the mutation
      with the new test present goes red and the distinct failing test is the new one BY NAME; the
      same mutation with the test removed goes green) **and** a converse control that must leave
      the suite GREEN (L-044). Both arms' real output goes in the journal.
- [ ] **L-043 fails-OPEN audit.** The clause added 2026-08-19, after run 4 audited this repo
      against L-043 and found it clean: an assertion of **ABSENCE** fails **OPEN**, because a
      wrap-blind reader cannot distinguish "removed" from "still present but hard-wrapped", so it
      reports the repair done while the stale claim sits untouched. Every absence assertion in
      `test/` is checked for this shape; each must prove the phrase was **LOCATABLE in an unfixed
      input** before its disappearance is trusted, or be filed. **Checked-and-clean is a valid,
      reportable outcome** — run 4's L-043 audit passed on the earlier form of the lesson, which
      is exactly why this narrower clause is worth re-running and not a re-sweep.
- [ ] **Every count-citing and line-citing claim in README.md and REPORT.md is re-derived at run
      time.** Not a fifth full doc re-verification. Scope is exactly the claims that ROT: test
      counts, issue counts, and `file:line` citations. Each is re-derived from the authoritative
      source at the moment it is checked, never from a previously captured number (L-045).
      Cycles 93–97 moved the tree after those claims were last derived, and cycle 97 appended a
      WRAP_UP record. A stale count is a defect; prose that is already true is not.
- [ ] **REPORT.md does not grow.** This run's record REPLACES the previous run's tail rather than
      appending to it; a first-time reader still gets what-it-is, how-to-run, what-is-verified and
      known-issues within the first screen. Forensic detail is archived, never deleted. The
      existing `test/report-issues.test.js` gate parses REPORT's tables and must still pass — if
      restructuring moves its anchors, **the GATE IS FIXED, never weakened and never re-labelled**
      (hard rule 2).
- [ ] **No test is added that cannot name the surface it closes.** Test COUNT is never an outcome.
      The reportable numbers are: capabilities audited, violations filed, claims found stale.
- [ ] **Early DONE is an expected outcome, not a failure.** If the three audits above come back
      clean and no candidate passes the "would the next reader actually notice?" ratchet, the run
      wraps and re-declares DONE. It does not backfill with a fifth mutation sweep or a new
      measurement axis.

## Nice-to-haves

<!-- Do not start these until every must-have is verified green. -->

- Give **KI-5** a one-line reader-runnable check so someone can tell whether THEIR terminal is
  affected by the ambiguous-width glyph issue. A previous attempt was **DISPROVED at the gate**
  (cycle 62): its proposed observable — top-right vs bottom-right corner alignment — does not
  differ under the failure mode, because all six frame glyphs are EAW Ambiguous and both borders
  scale together; the ragged edge is on the content rows at cols 34–37. Any new observable must be
  verified to actually differ before it ships (L-045: re-verify an inherited nice-to-have against
  the repo BEFORE prioritizing it).
- Re-archive the working journal if it crosses roughly 400 KB, by append-only copy into a dated
  archive, never a deletion. (Measured at kickoff: 246 KB — below the line, so this is a watch
  item, not work.)

## Non-goals

- **No new features of any kind**: no new flags, no `--date`, no moon age, no countdown, no
  relative "in 10 days" line, no moonrise/moonset, no block-frame relayout. Three of these are
  recorded in `.swarm/ideas-ledger.md` as the strongest product ideas four runs have produced;
  all remain forbidden here, and naming them is how this spec keeps them from leaking back in.
- **No new dependencies — runtime OR dev.** Including a mutation-testing framework: StrykerJS was
  evaluated and declined on the record by run 3, and that decision is not re-litigated. A
  `package-lock.json` or `node_modules` appearing in this repo is a failed run.
- **No fifth broad mutation sweep**, and no re-derivation of the survivor lists prior runs already
  produced.
- **No new measurement axis** beyond the three audits named above.
- **No rewriting of the astronomy core.** It is verified against Meeus 49.a and 49.b to
  sub-second agreement; touching it risks the one thing that is proven.
- **No agent-authored LICENSE text.** KI-8 needs a copyright line naming a legal person; that is
  the owner's decision, and the handoff asking for it already exists at
  `.swarm/KI-8-OWNER-ACTION.md`.
- **No glyph-set redesign.**
- **No growth in total doc length**, and **no rewording of prose that is already true.**
- **No weakening of a test, a claim, or a gate to reach green** (hard rule 2). The only honest
  path to green is making the claim true.
- No emoji, no color, no config file, no npm publish (original non-goals, still binding).

## Taste notes

The taste is *a tiny precision instrument, not a toy* — austere, aligned, emoji-free. This run
must not dilute it.

The risk on a FIFTH housekeeping run, over a repo that was declared DONE the previous day with 0
defects found, is the sharpest it has ever been: **the honest outcome is more likely "nothing
needed doing" than not.** That outcome is **EXPLICITLY ALLOWED** here and ends the run early. A
diff that reads as diligence while changing nothing a reader could detect is the failure mode this
spec exists to prevent, and on run 5 it is the *expected* failure mode, not a hypothetical one.

Every work item must trace to exactly **one** of two sources: a practice lesson minted or extended
**after 2026-08-18** that this repo demonstrably violates, or a doc claim that has **measurably**
rotted. An item tracing to neither does not get built, however tidy it would be.

In docs, a claim made weaker but true beats one made stronger and unverifiable. Every number in
the docs should have a command behind it.

The kickoff taste judge scored `use-twice` 4/10 and `one-memorable-thing` 5/10 and was right to.
Its verdict is recorded as the condition on this run: *"worth the spare window as scoped because
the fences are honest and early-DONE is pre-authorized, but it hinges on use-twice — this is
maintenance with no new reader, so the run is only justified if the L-046 and L-043 audits are
executed as real evidence-gathering and the report is allowed to say 'clean, nothing changed'
rather than manufacturing a diff."* That condition is binding, not decorative.

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
  resolves to the wrong hemisphere prints a mirrored — that is, wrong — disc.
- JS `Date` range tops out at ±8.64e15 ms from epoch (year ≈ 275760); beyond it `Date`
  arithmetic yields `NaN` and `toISOString()` throws `RangeError`.
- **The CLI's output is a pure function of the wall clock.** `src/` and `bin/` contain zero
  `process.env` date-injection points and no `--date` flag, so the product can show exactly one
  moon per calendar day. Measured by run 4's taste pass (cycle 81); it is why a check that wants
  many different moons must reach `src/render.js` directly — which is precisely the tension the
  L-046 wire-through audit has to reason about rather than ignore.

## Definition of done

Every capability audited against L-046 with each result recorded reachable-or-violation and every
violation filed with file and line; every absence assertion in `test/` audited against L-043's
fails-OPEN clause with each result recorded clean-or-violation; every count-citing and line-citing
claim in README.md and REPORT.md re-derived at run time with stale ones corrected; REPORT.md no
longer at wrap-up than the 26,469 bytes measured at kickoff; `test/report-issues.test.js` green
(fixed, never weakened, if its anchors moved); suite green and never below the **175-test baseline
measured at kickoff**; no `dependencies` or `devDependencies` key in package.json, and no lockfile
or `node_modules` in the repo.

## Commands

- run: `node bin/moon.js`
- test: `node --test test/*.test.js`

## Spec digest

- fifth improvement run on the shipped moon CLI, TRICKLE posture, over a repo declared DONE on
  2026-08-18 — scope is the PLAYBOOK DELTA since that date plus claims that rot: audit L-046
  (wire-through at `bin/moon.js`), audit L-043's fails-OPEN absence clause, re-derive every
  count/`file:line` claim in README + REPORT — NO new features, NO new deps, NO fifth sweep, NO
  new axis
- must: every audit result recorded clean-or-violation with file and line; violations fixed only
  if S-effort, each with a two-arm failable/attributable proof (L-029) plus a converse GREEN
  control (L-044)
- must: REPORT.md does not grow; its gate is fixed, never weakened; doc claims re-derived AT RUN
  TIME from the authoritative source (L-045), prose already true left alone
- non-goals: no features/flags (--date, countdown, block relayout all named and forbidden), no
  deps incl. devDeps, no fifth sweep, no new axis, no agent-authored LICENSE, no doc growth, no
  weakening a gate
- taste: "nothing needed doing" is the EXPECTED honest outcome and ends the run early; every item
  traces to a lesson minted after 2026-08-18 or a measurably rotted claim, or it is not built
