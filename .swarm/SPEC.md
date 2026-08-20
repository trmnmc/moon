# SPEC — moon (improvement run 6)

<!-- Instantiated 2026-08-20 for the allocator-driven IMPROVEMENT run (the SIXTH one on this
     repo). This REPLACES the 2026-08-19 improvement spec as the live contract but does NOT
     repeal it, nor the 2026-08-18, 2026-08-17, 2026-08-16 or 2026-08-14 ones, nor the original
     build spec: every must-have, non-goal and taste note of all six remains binding. Preserved
     verbatim on disk at .swarm/SPEC-improve-2026-08-19.md, .swarm/SPEC-improve-2026-08-18.md,
     .swarm/SPEC-improve-2026-08-17.md, .swarm/SPEC-improve-2026-08-16.md and
     .swarm/SPEC-improve-2026-08-14.md; the original build spec is at git tag v0.1.0. This file
     scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

SIXTH housekeeping run on `moon`, a shipped zero-dependency Node CLI that prints the current moon
phase as terminal art. **Measured at this kickoff, not inherited from a document: 187/187 tests
green** (`node --test test/*.test.js`, run at 2026-08-20T08:45Z), **backlog 100 items, all closed**
(95 done, 5 dropped, 0 todo, 0 blocked), **phase DONE**. Run #5 declared this repo DONE on
2026-08-19 after finding zero defects, and wrapped with ~22.3h of authorized clock unspent by
decision rather than by exhaustion.

This run is allocator-driven under a **TRICKLE posture**: idle capacity, housekeeping only, no new
features. It exists because there was spare window, not because a user asked. Saying that plainly
is part of the honesty. The allocator reports `allow_overall_pct: 0` and `allow_premium_pct: 0`
against a weekly window at 97% used and 45% elapsed — this run is genuinely cheap or it is
nothing.

**No new features. No sixth sweep.** The only thing that has changed since run #5 closed
(2026-08-19T23:55Z) is the practice playbook. That delta was MEASURED AT THIS KICKOFF and is
already largely closed:

- **L-047** (minted 2026-08-20) — gate-failure ATTRIBUTION: a failing sealed gate must be
  attributed to the INSTRUMENT or to the WORK before the verdict touches the item's `attempts`
  counter. This is a conductor-process lesson governing how this run runs its own gates; it is
  **not an auditable property of the moon repo**. Binding on conduct, not on the tree.
- **L-043 gained an unstable-SUBJECT clause** — a guard bound to a git pathspec cannot be green
  on the commit that changes that pathspec. **AUDITED AT KICKOFF AND CLEAN**: zero git-bound
  guards exist anywhere in `test/`, `src/` or `bin/` (grep evidence in the cycle-0 journal
  block). Structurally inapplicable to this repo. Closed before cycle 1.
- **L-043's FORM-and-DIRECTION clause** (minted at run #5's OWN wrap-up, 2026-08-19, therefore
  AFTER run #5's scope was locked and inside this run's delta window) — "a gate built for one
  direction (test comments → doc lines) leaves the reverse (doc → code lines) hand-audited once
  and unprotected thereafter." **`moon` is the repo that clause was written about.** Run #5
  considered building the reverse gate, rejected it as outside its own binding scope clause, and
  then distilled the lesson naming that omission. This is the one open item in the delta.
- **L-045 gained a converse-reading clause** — a satisfied spec behind a brief-locked backlog
  means DONE, not another lap. This argues AGAINST the run and is treated as binding, not as
  advice to route around.
- **L-039 gained an every-path-FORM diagnostic clause** — **APPLIED AT KICKOFF**: a grep of
  `/opt/swarm/.claude/settings.json` returns no match for "playbook" under any path form, so the
  KI-2 denial is confirmed **structural**, not an invocation-form error. Diagnosis complete; it
  is not to be re-run.
- **L-031** observed-count bump — measure, never infer a coverage gap.
- **L-021** archived 2026-08-20 (browser/SPA) — never applicable to this terminal CLI.

## Audience

The next person to change this code — including the next automated run, which inherits whatever
this one leaves. Secondarily the end user, who benefits only where a doc claim gets more honest.
This run does not pretend to serve a new end user.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only after
     conductor verification, never by claim. -->

- [ ] **The doc→code citation audit becomes a MACHINE-CHECKED GATE, not a seventh hand pass.**
      This is the run's one piece of durable output and its whole justification. Every `file:line`
      citation that README.md and REPORT.md make INTO THE CODE is checked mechanically, at
      `test_cmd` time, against the line it actually points at. It must enumerate every citation
      FORM the documents use — including the bare `:N` shorthand that a path-anchored regex
      silently misses (the exact defect L-043 records against this repo at cycle 102) — and it
      must carry a self-check proving it LOCATED citations at all, so that a zero-citation parse
      can never render as green (L-043's green-over-a-dead-region clause; L-041's fail-CLOSED
      direction clause). Ships with the two-arm proof (L-029: the mutation with the new check
      present goes red and the distinct failing test is the new one BY NAME; the same mutation
      with the check removed goes green) **and** a converse control that must leave the suite
      GREEN (L-044). Both arms' real output goes in the journal. This item NAMES ITS SURFACE:
      doc→code `file:line` citations rotting silently as the tree moves.
- [ ] **Every count-citing claim in README.md and REPORT.md is re-derived at run time.** Test
      counts and issue counts, each re-derived from the authoritative source at the moment it is
      checked, never from a previously captured number (L-045). Cycles 98–102 plus a WRAP_UP
      addendum moved the tree since some were last derived. A stale count is a defect; prose that
      is already true is not. Where a count claim can be folded into the gate above rather than
      re-checked by hand, prefer the gate.
- [ ] **KI-2 is escalated ONCE, in one place, and NOT re-derived a seventh time.** The
      `bin/swarm-playbook.sh` allowlist gap has now been re-diagnosed by seven consecutive runs,
      which is precisely the anti-pattern L-045's converse clause names ("escalate the locked
      lever ONCE instead of re-deriving the same escalation every run"). This run records the
      denial count, states the exact `settings.json` lines a human must add, and does NOT
      re-litigate, re-diagnose, or re-measure it. Hard rule 5 forbids repairing it from inside a
      run; that fence is respected, not worked around.
- [ ] **REPORT.md does not grow.** This run's record REPLACES the previous run's tail rather than
      appending to it; a first-time reader still gets what-it-is, how-to-run, what-is-verified and
      known-issues within the first screen. Forensic detail is archived **to
      `.swarm/REPORT-ARCHIVE-2026-08-20.md`**, never deleted. The existing
      `test/report-issues.test.js` gate parses REPORT's tables and must still pass — if
      restructuring moves its anchors, **the GATE IS FIXED, never weakened and never re-labelled**
      (hard rule 2).
- [ ] **No test is added that cannot name the surface it closes.** Test COUNT is never an outcome.
      "Harden tests" is explicitly NOT a mandate to add tests: runs #3, #4 and #5 already
      mutation-swept every source file (`src/render.js`, `src/args.js`, `src/hemisphere.js`,
      `src/astro.js`, `bin/moon.js`) and measured the flag-interaction axis. The reportable numbers
      are: claims re-derived, claims found stale, violations filed.
- [ ] **Early DONE is an EXPECTED outcome, not a failure.** The auditable delta closed clean at
      kickoff except for the one gate above. Once that gate ships verified and the count claims are
      re-derived, if no candidate passes the "would the next reader actually notice?" ratchet, the
      run wraps and re-declares DONE. It does not backfill with a sixth mutation sweep, a new
      measurement axis, or a doc reflow that changes words without changing truth.

## Nice-to-haves

- Nothing is listed. Per L-045, an inherited nice-to-have must be re-verified against the repo
  before it is prioritized — run #5 found its one listed nice-to-have (a reader-runnable KI-5
  check) had already shipped at README.md:233-238 forty cycles earlier and had merely never been
  struck off. Rather than inherit another such item, this run lists none.

## Non-goals

- No new features. No new user-facing flags, output modes, or behaviors.
- No new dependencies. The zero-dep property is load-bearing and is itself gated.
- No sixth mutation sweep. No new measurement axis.
- No test added for count's sake.
- No repair of KI-2 or KI-9 (SWARM tooling — hard rule 5 fences a run from editing its own
  harness).
- No doc rewrite that changes wording without changing truth.
- No re-derivation of conclusions already recorded and unchanged (prior-art stance, KI-2 root
  cause, the mutation coverage of `src/*`).

## Taste notes

The failure mode to avoid is **manufactured diligence**: a diff that reads as work while changing
nothing a reader could detect. Run #5 named this and successfully avoided it; run #6 is at
strictly higher risk because the remaining delta is smaller. An honest "nothing needed doing,"
backed by re-derived evidence, beats a padded changelog.

The kickoff taste judge scored `use-twice` 4 and `one-memorable-thing` 3 against an earlier draft
of this spec, on the grounds that a hand re-derivation "leaves nothing behind, so run #7 repeats
it manually an eighth time." That critique is the reason must-have #1 is a gate rather than a
pass, and it is the difference between this run being worth the window and being a journal entry
that says "still true."

## Definition of done

- The doc→code citation gate ships, is green, and is proven both failable and attributable
  (two-arm proof + converse control), with real output in the journal.
- Every count-citing claim in README.md and REPORT.md re-derived at run time with real command
  output in the journal.
- KI-2 escalated once, in one place, with the exact config lines named.
- Suite still ≥ 187 green (the kickoff-measured floor); zero new dependencies.
- REPORT.md not grown against its kickoff byte count; `test/report-issues.test.js` still green.
- Zero tests added that cannot name the surface they close.

## Commands

- `run_cmd`: `node bin/moon.js`
- `test_cmd`: `node --test test/*.test.js`

## Domain rules

Unchanged from the original build spec and all five prior improvement specs. The astronomy core
(Meeus ch. 47 / Duffett-Smith), the hemisphere table, the render geometry and the flag surface are
all frozen this run — they are non-goals, not gaps.
