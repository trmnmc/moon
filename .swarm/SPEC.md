# SPEC — moon (improvement run 7)

<!-- Instantiated 2026-08-24 for the allocator-driven IMPROVEMENT run (the SEVENTH on this repo).
     This REPLACES the 2026-08-20 improvement spec as the live contract but does NOT repeal it,
     nor the 2026-08-19, 2026-08-18, 2026-08-17, 2026-08-16 or 2026-08-14 ones, nor the original
     build spec: every must-have, non-goal and taste note of all seven remains binding. Preserved
     verbatim on disk at .swarm/SPEC-improve-2026-08-20.md and its five siblings; the original
     build spec is at git tag v0.1.0. This file scopes what may CHANGE tonight.
     Frozen at kickoff. Restated every cycle (cycle.md step 3); full re-read every 5th. -->

## Idea

SEVENTH housekeeping run on `moon`, a shipped zero-dependency Node CLI that prints the current
moon phase as terminal art. **Measured at this kickoff, not inherited from a document: 244/244
tests green, 0 skipped** (`node --test test/*.test.js`, run by the conductor at
2026-08-24T07:22Z), **backlog 108 items all closed** (103 done, 5 dropped, 0 todo, 0 blocked),
**phase DONE since cycle 110**. Runs #5 AND #6 both declared this repo DONE.

Allocator-driven **TRICKLE posture**: housekeeping only, no new features, haiku-priced work. It
exists because there was spare window, not because a user asked. Saying that plainly is part of
the honesty.

**The case AGAINST this run, stated first because it is strong.** L-045's converse-reading clause
— minted 2026-08-22, in this run's own playbook — says a satisfied spec sitting behind a
brief-locked backlog means the target is DONE, not that it needs another housekeeping lap, and
that the failure mode is manufactured chores. Moon meets that condition exactly: the backlog is
empty, and the three highest-value known improvements (T-177 daily invariance, T-178 `--date`
flag, T-179 frame alignment) are all locked out by the trickle brief. This spec is written to be
falsifiable against that clause: it scopes ONE measurement whose empty result is a publishable
outcome and an immediate wrap, not a prompt to backfill.

**The auditable delta**, measured at kickoff (the playbook minted after run #6 locked at
2026-08-20T12:31Z), not inherited:

- **L-043's PARAPHRASE clause** (2026-08-22) — "never let a SECOND document PARAPHRASE the
  machine-checked rule: quote it verbatim, or link to it and say nothing about its content,
  because a restatement in one's own words reintroduces exactly the drift the machine check
  exists to prevent, and is invisible precisely because no guard reads the restating document."
  Moon is a repo with three mature machine-checked doc gates (`test/citations.test.js`,
  `test/doc-counts.test.js`, `test/report-issues.test.js`) and two prose documents that describe
  what those gates enforce. **Whether any prose restatement has drifted from the rule its gate
  actually enforces is UNMEASURED.** This is the run's primary question and its one piece of
  candidate durable output.
- **L-042's simulate-the-future clause** — `REPORT.md:3` carries a self-relative archive-pointer
  rule ("…except the most recent run, whose record sits in this file below until the next run
  archives it"), authored by run #6 as the fix for a rotting enumeration. **This run will itself
  add a record and archive run #6's**, so the sentence's truth is a rot vector THIS RUN CREATES.
  It is to be gated, not merely avoided by care.
- **AUDITED CLEAN AT KICKOFF, closed before cycle 1 and not to be re-run:** L-045's
  unsatisfiable-in-fact clause — a grep of README.md for a CI-matrix citation-selection rule of
  the shape that clause describes returns **zero hits against a passing control grep** (control:
  `grep -i moon README.md` → 3+ hits, so the reader was live). L-037 and L-038 govern the
  spawner and this kickoff's own conduct; they are **not auditable properties of the moon tree**.
  L-047 likewise binds conduct, not the tree.

## Audience

The next person or run to change this code — including the next automated run, which inherits
whatever this one leaves. Secondarily the end user, who benefits only where a doc claim gets more
honest. This run does not pretend to serve a new end user.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only after
     conductor verification, never by claim. -->

- [ ] **Prose restatements of machine-checked rules are enumerated by a FAIL-CLOSED mechanism,
      not by a hand-picked list.** The kickoff taste judge scored `product-not-demo` 6 with this
      exact objection: "the spec never says how the check identifies restatements, so it may
      degrade into a hardcoded list of today's three sentences." That objection is accepted and
      is binding. The mechanism must be the one L-043 itself prescribes — "the remedy already
      proven for COUNTS, put them in a table the guard parses, has a direct analogue for RULES":
      a **registry the documents own structurally** (a parsed table), where every row names a
      prose claim-about-a-gate and the test file that owns the rule, and the check asserts
      (a) every row resolves to a real test file, (b) each registered passage is a **verbatim
      quote or a link**, never a restatement, and (c) a **self-check proving rows were located
      at all**, so a zero-row parse can never render green (L-043's green-over-a-dead-region
      clause; L-041's fail-CLOSED direction clause). A hardcoded enumeration of today's
      sentences does NOT satisfy this must-have and is to be rejected at the gate, not
      negotiated. Ships with the two-arm proof (L-029: the mutation with the check present goes
      red **and the distinct failing test is the new one BY NAME**; the same mutation with the
      check removed goes green) **and** a converse control that must leave the suite GREEN
      (L-044). Both arms' real output goes in the journal.
- [ ] **The archive-pointer sentence is gated against THIS RUN'S OWN edit.** The gate is authored
      and **proven RED against the post-move tree before the record is moved** — i.e. the check
      must demonstrably catch the violation this run is about to be able to commit — then green
      after. Proving it red only against an artificial mutation, and never against the real
      pending edit, does not satisfy this must-have (L-042: re-ask the gate predicate against a
      SIMULATED FUTURE state, not only the present).
- [ ] **Every count-citing claim in README.md and REPORT.md is re-derived at run time**, from the
      authoritative source at the moment it is checked, never from a previously captured number
      (L-045). A stale count is a defect; prose already true is not. Where a claim can be folded
      into a gate rather than re-checked by hand, prefer the gate.
- [ ] **REPORT.md does not grow.** Kickoff byte count: **25582** (`wc -c REPORT.md`, this
      session). This run's record REPLACES run #6's tail rather than appending; forensic detail is
      archived, never deleted. If restructuring moves `test/report-issues.test.js` anchors, **the
      GATE IS FIXED, never weakened and never re-labelled** (hard rule 2).
- [ ] **KI-2 is escalated ONCE and NOT re-diagnosed an eighth time.** Root cause conclusive since
      cycle 83. This run adds exactly one fresh datum — a kickoff grep of
      `/opt/swarm/.claude/settings.json` showing `swarm-playbook.sh` under **zero** of the 11
      allowlisted `swarm-*` forms — states the exact lines a human must add, and stops. Hard
      rule 5 forbids repairing it from inside a run; that fence is respected, not worked around.
- [ ] **No test is added that cannot name the surface it closes.** Test COUNT is never an
      outcome. Runs #3–#5 already mutation-swept every source file; a sixth sweep is a non-goal.
      The reportable numbers are: claims re-derived, claims found stale, violations filed.
- [ ] **Early DONE is an EXPECTED and PREFERRED outcome.** If cycle 1's audit returns zero
      paraphrase drift, the run **wraps in that same cycle** rather than spending one cycle
      building and a second wrapping (L-045's wrap-in-that-cycle clause). It does not backfill
      with a mutation sweep, a new axis, or a reflow that changes words without changing truth.

## Nice-to-haves

Nothing is listed. Per L-045, an inherited nice-to-have must be re-verified against the repo
before it is prioritized; rather than inherit an item that may already be shipped, this run lists
none.

## Non-goals

- No new features. No new user-facing flags, output modes, or behaviors.
- No new dependencies. The zero-dep property is load-bearing and is itself gated.
- No sixth mutation sweep. No new measurement axis. No test added for count's sake.
- No repair of KI-2 or KI-9 (SWARM tooling — hard rule 5).
- No re-diagnosis of anything already recorded and unchanged (prior-art stance, KI-2 root cause,
  the mutation coverage of `src/*`, L-043's unstable-SUBJECT audit from run #6).
- T-177, T-178 and T-179 stay dropped — locked by the brief, and this spec says so rather than
  re-deriving their value a fourth time.
- No doc rewrite that changes wording without changing truth.

## Taste notes

The failure mode to avoid is **manufactured diligence**: a diff that reads as work while changing
nothing a reader could detect. Runs #5 and #6 both named it and both avoided it; run #7 is at
strictly higher risk again, because the remaining delta is smaller still. An honest "nothing
needed doing," backed by re-derived evidence, beats a padded changelog.

Kickoff taste judge: `use-twice` 4, `product-not-demo` 6, `scope-fits-night` 9,
`one-memorable-thing` 6. Verdict: *"Worth the night as a cheap TRICKLE, but it hinges on
product-not-demo: must-have 1 should name the detection mechanism before Lock, or the run will
ship a gate that pins three known sentences and calls the class covered."* That verdict is why
must-have #1 carries an explicit fail-closed registry mechanism and an explicit rejection clause,
rather than the phrase "every prose restatement is machine-checked." The `use-twice` 4 is
accepted as fair and is not argued with: a repo with zero open items may genuinely never have a
next change for this gate to protect.

## Definition of done

- The paraphrase registry gate ships, is green, is fail-closed by a located-rows self-check, and
  is proven both failable and attributable (two-arm proof + converse control), with real output
  in the journal — **or** the audit returns zero drift and that empty result is published with
  the evidence that produced it.
- The archive-pointer gate is proven red against this run's real pending edit, then green.
- Every count-citing claim re-derived at run time with real command output in the journal.
- KI-2 escalated once, with the exact config lines named.
- Suite ≥ 244 green with **0 skipped** (the kickoff-measured floor); zero new dependencies.
- REPORT.md ≤ 25582 bytes; `test/report-issues.test.js` still green.
- Zero tests added that cannot name the surface they close.

## Commands

- `run_cmd`: `node bin/moon.js`
- `test_cmd`: `node --test test/*.test.js`

## Domain rules

Unchanged from the original build spec and all six prior improvement specs. The astronomy core
(Meeus ch. 47 / Duffett-Smith), the hemisphere table, the render geometry and the flag surface
are all frozen this run — they are non-goals, not gaps.
