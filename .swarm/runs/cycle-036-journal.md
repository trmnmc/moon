
## cycle 36 — 2026-08-15T04:11:24Z — VALUE_LOOP — build-wave (k=1) — T-133 — GATE PASS

clock: now 1786766485, stop_at 1786807947 — 41,402 s (11 h 30 m) of run left. No wrap-up,
  no limp. cycles_since_recycle 9 -> 10; recycle not due.
budget: probe NOT invoked, same standing decision as cycle 35 and for the same closed
  reason — SWARM/.claude/settings.json has no allow entry of any form for
  bin/swarm-budget.sh (KI-2, root-caused at cycle 35). probe_failures stays at 34: an
  attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe):
  posture trickle, allow_premium_pct 0, dial 0.3. weekly_used 75.0 / week_elapsed 70.85
  -> weekly_heat 1.059 < 1.1, governor disengaged, ceiling 5. opus_used 96 ->
  opus_heat 1.355 > 1.2, promote still blocked. guest mode clamps 1-3; allocator trickle
  lands gear 1, k_cap 1. Thirty-six straight cycles at gear 1; week_resets_at 1786942799
  is after stop_at, so this is structural for the rest of the run.
orient: tree clean at 10d2ee4. Control channel polled via the helper from the SWARM root
  (exit 0) — pending[] empty, applied[] empty, inject[] empty. Nothing to apply, nothing
  to triage, nothing to ack.
craft pack: node bin/swarm-craft.mjs returned clean, degraded[] empty. The docs pack was
  spliced into the builder prompt; the ui pack was not (no UI surface in this item).

WORK: VALUE_LOOP candidate scan, then one build-wave of one item.

candidate scan — 2 probes, hit on probe 2.
  probe 1 REJECTED (already closed): the doc-drift surface. Hypothesis was that the
    --json field list could drift between the payload, bin/moon.js HELP, the README
    table and the README fenced example. test/cli.test.js already parses all four and
    diffs them (lines 98-168). Closed, and closed well.
  probe 2 HIT: the same documents are gated for field NAMES and have never been gated,
    or even read, for field MEANINGS. `cycleFraction` is computed at src/astro.js:303 as
    phaseAngle/360 — an ANGULAR fraction of the elongation circle — while `age`
    (src/astro.js:313) is genuine elapsed days since the true ch.49 new-moon instant.
    Both documents describe cycleFraction as "position through the synodic month", which
    reads as temporal, and nothing warned that the two fields are not interconvertible.
    Measured over 175,320 hourly samples across 2020-2040: the circular gap reaches
    0.029790 cycle = 21.11 h against the TRUE lunation length (0.032488 = 23.03 h against
    the mean synodic month). A script computing elapsed days as cycleFraction * 29.53 is
    wrong by up to most of a day.
    The gap was ALREADY KNOWN to the code and unknown to the docs: test/astro.test.js:242
    pins circDiff(cycleFraction, elapsed/SYNODIC) < 0.035 with the comment "may lead/lag
    mean time by the periodic corrections (up to ~0.9 d ~ 0.03 cycle)". The test knew.
    The README did not.
  RATCHET: ACCEPTED — the first acceptance in eleven cycles of rejections. Q1 would the
    target user notice? YES: --json is advertised in HELP as "structured output for
    scripting (stable, documented below)", so its field descriptions are a contract, and
    a consumer who interconverts the two fields lands up to 21 h out — for a tool whose
    headline question is "which night is the full moon", a wrong night. Q2 would they
    still care after 10 minutes? YES: it changes the number their script computes.
    Decisive precedent: the repo already carries this exact correction for this exact
    trap one field lower — the "Caution on phaseAngle" block. cycleFraction was the
    second such field with no such note.
  T-116 / T-126 / T-130 remain todo and remain correctly rejected. Priority 9, 8, 9 are
    stale labels from their filing cycles; T-133 was filed at priority 3 to say plainly
    that it outranks all three. An empty-ish queue is still not an argument for building
    what the ratchet rejects.

routing ruling: the value-routing table sends kind=docs effort=S to haiku, and gear 1
  would hold it there. Routed to SONNET instead, deliberately. The haiku row is scoped to
  "formatting, scaffolding, boilerplate"; this item had to state a numerical distinction
  accurately, and cheap-tiering that is how a doc gains a confident sentence that is
  subtly wrong. Gear 1 explicitly permits S-effort sonnet builds. Fable was NOT taken
  despite the correctness-core flavour: allow_premium_pct is 0 this week and a
  documentation edit is not where the last premium tokens should go.
ownership ruling: bin/moon.js line 7 reads "Conductor-owned file; builders do not edit
  it." Lifted for this item in writing, scoped to the HELP template literal only. The two
  alternatives were worse and are recorded in state.decisions: conductor-patching HELP
  breaks the standing cycle-7 rule (and bites hardest here, since the conductor authored
  the wording), and fixing README alone leaves `moon --help` telling the reader the wrong
  thing with no test able to catch the split, because cli.test.js gates names, not prose.
  The lift was gated rather than trusted — see G2b and mutant M5.

dispatch: one direct Agent call at sonnet, not the Workflow tool (headless -p session;
  Workflow is review-gated there — documented fallback). k=1, so no worktree and no
  disjointness question. Builder edited the working tree in place; the conductor remains
  the sole committer. Playbook builder line spliced in verbatim.

VERIFICATION EVIDENCE — T-133 (full output: .swarm/runs/cycle-036-verify-T-133.txt)
  All checks conductor-authored AT VERIFICATION TIME; the builder saw none of them.

  $ git diff --stat
   README.md           | 10 +++++++++-
   bin/moon.js         |  5 +++++

  $ node .swarm/runs/cycle-036-gate.js
  PASS  G2b bin/moon.js outside the HELP literal is byte-identical to HEAD
  PASS  G2c src/ and test/ are byte-identical to HEAD
  PASS  G4 HELP fields block still yields exactly the 9 payload keys
  PASS  G5 --help prints exactly HELP, exit 0, clean stderr
  PASS  G6 README json example + field table still parse to the 9 keys
  PASS  G7 both documents carry the substance of the correction
  gate: 6 pass, 0 fail

  $ node --test test/*.test.js
  ℹ tests 131   ℹ pass 131   ℹ fail 0        (baseline was also 131/131)

  $ node .swarm/runs/cycle-036-failability.js
  KILLED   M1 README caution paragraph deleted  (G7 went red, as designed)
  KILLED   M2 HELP CAUTION block deleted  (G7 went red, as designed)
  KILLED   M3 a HELP CAUTION line dedented to field-name depth  (G4 went red, as designed)
  KILLED   M4 bogus row added to the README field table  (G6 went red, as designed)
  KILLED   M5 a byte OUTSIDE the HELP literal changed in bin/moon.js  (G2b went red, as designed)
  KILLED   M6 src/ touched  (G2c went red, as designed)
  KILLED   M7 the 21-hour figure silently changed in HELP  (G7 went red, as designed)
  failability: 7 killed, 0 survived; restore drift: 0

  $ node .swarm/runs/cycle-036-independent.js
  claim 1: 67 lunations, 406,967 samples on a 7-min grid ->
    worst |cycleFraction - elapsed/trueLunation| = 0.029219 cycle = 20.71 h
    doc says "up to about 21 hours" -> NOT understated
  claim 2: 1990-2060, 865 lunations, no sampling gaps ->
    worst |cycleFraction - 0.5| at a true full moon = 0.001029 = 43.8 min
    doc says "within about 45 minutes" -> holds

gate notes, the three that matter.
  1. G4's field-name parser is REIMPLEMENTED in the gate from the block's stated
     two-leading-spaces convention rather than imported from test/cli.test.js. The
     specific risk this edit introduced is that the new CAUTION lines fool the parser
     into reading "CAUTION:" as a tenth field; a check that borrows the suite's own
     parser cannot catch the suite's own parser being fooled. Mutant M3 dedents a CAUTION
     line to field-name depth and G4 goes red, which is what makes G4 a check rather than
     a restatement.
  2. The two documented NUMBERS were re-derived by a path independent of the probe that
     produced them — boundaries by bisection on the cycleFraction wrap instead of via
     `age`, a 7-minute grid rather than hourly, a wider window. 21.11 h and 20.71 h from
     two independent paths, neither above the "about 21 hours" the docs state.
  3. ONE SUB-CLAIM IS REPORTED AS NOT ESTABLISHED, not as passed. The new-moon half of
     claim 2 reads 0.0 min in the independent script only because that script DEFINES the
     new moon as the cycleFraction wrap — circular for that one number, so its 0.0 is
     vacuous. That sub-claim rests instead on the probe, which takes the boundary from the
     independent Meeus ch.49 instant via `age` and measured 0.000990 cycle = 42.8 min over
     2020-2040. Both halves of the endpoint claim hold, each by the method that is not
     circular for it. Saying so is cheaper than a reader later discovering the tautology.

not run, and why (never rendered as passed):
  collision-scan — the standing check is scoped to browser targets built from classic
    non-module scripts; moon is a Node CommonJS CLI with no browser surface.
  qa-verify look pass — triggers on user-visible browser assets. The two changed files
    are a Markdown README and a Node entry point; nothing is served to a browser.

wave autotune: the k=1 wave was CLEAN (0 reverts, 0 failed verifies) -> wave_streak
  1 -> 2 -> trips the promote rule -> k_current 4 -> 5, streak reset to 0. Recorded
  honestly even though gear 1's k_cap of 1 keeps it inert for the rest of this run.
counters: consecutive_no_value 0 (verified value this cycle), consecutive_failures 0.
backlog: 34 items — 31 done, 3 todo (T-116, T-126, T-130, all ratchet-rejected, all
  correctly left todo). known_issues unchanged at 5.
notifications: none emitted. Phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0 — none of the three step-8 emit conditions fired.
