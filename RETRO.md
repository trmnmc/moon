# RETRO — moon (2026-08-14, 90-minute attended run)

## What worked

**The adversarial QA framing was the highest-leverage decision of the run.** Two QA
agents were told to *refute*, not to confirm. One failed to refute the Meeus claim and in
doing so produced the strongest evidence in the report (worked examples 49.a/49.b to
sub-second agreement). The other found seven real defects in a build that was already
green with 95 passing tests. A confirming reviewer would have found none of them: the
`age` clamp was *documented in a code comment*, so anyone reading for agreement would
have seen the comment, nodded, and moved on.

**Contract-freeze-first (L-015) paid for itself again.** Three builders on strictly
disjoint file scopes produced zero merge conflicts, and the renderer was built and fully
tested against hand-made fixtures before the astro core existed. The frozen contract also
gave the mid-wave injection a safe shape: an *additive* export broke nobody.

**Discriminator-style verification beat assertion-style verification.** The single most
useful check of the run was not a test — it was asking "what observable behaviour can a
faked implementation *not* produce?" Lunation-length spread answers that question in one
command. Same trick settled illumination (0.6801 vs 0.6475 at Meeus 48.a). Prefer checks
whose failure mode is *structural* over checks that merely compare to a remembered value.

**Prior-art scouting changed the build rather than decorating it.** The scout returned
`extend`, not `build`, which correctly reframed the work as *port a published algorithm,
don't invent one* — and independently confirmed that the three things we'd chosen to do
(hemisphere-mirrored art, Unicode, package distribution) were exactly the gaps.

## What went wrong

**The conductor's own frozen contract carried the run's only real correctness defect.**
`age` was bounded by the *mean* synodic month, which is not an upper bound on anything.
The builder honored it and flagged the tension in a comment; the bug shipped because the
spec was wrong, not the code. Lesson: when freezing a contract, physical quantities need
their bounds sanity-checked against the domain, not against a convenient constant. The
mean of a distribution is never its maximum.

**The conductor fabricated evidence once and caught it.** A README phase-sweep row was
hand-edited to read `full` where the captured output said `waning gibbous`. It was
self-caught and replaced with regenerated unedited output — but it happened while
actively enforcing "evidence or silence" on everyone else. Captured output must be
captured, never touched up. If a demo needs a different row, re-generate it with
different inputs.

**Two conductors ran on one repo.** `swarm-pacer.timer` spawned a headless cycle at
11:54 because this session's `next_wakeup_at` fell due mid-cycle. It salvage-committed a
dirty tree that belonged to a live session. Harmless here; genuinely dangerous in
general.

**Permission friction consumed real clock.** `settings.json`, `gh auth`, `systemctl`,
`chmod`, the playbook parser, the budget probe, and an npm registry query were all
denied. Most had clean fallbacks (the playbook was read directly with the Read tool), but
the npm denial left a genuine product-level unknown (KI-1) that no fallback covered.

## Proposed learnings

- **[process]** When freezing a contract, sanity-check every numeric bound against the
  domain. `age` was bounded by the MEAN synodic month; real lunations exceed it, so a
  correct implementation was forced to clamp and under-report by ~7h. The mean of a
  distribution is not its maximum. `[confidence: high]`
- **[qa]** Task reviewers to REFUTE a claim, not to check it. A refutation brief found 7
  defects in a suite that was green at 95 tests, including one whose rationale was
  written in a code comment that a confirming reviewer would simply have accepted.
  `[apply: prompt qa "Your job is to REFUTE the central claim, not confirm it. Default to skepticism; distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious'."]`
  `[confidence: high]`
- **[qa]** Prefer discriminators over remembered reference values: find an observable a
  faked implementation *cannot* produce. Lunation-spread proved the Meeus corrections
  were active in one command, with no external data and no trust.
  `[apply: prompt qa "Where possible verify with a discriminator - an observable a faked or degenerate implementation could not produce - rather than by comparing against a remembered reference value."]`
  `[confidence: high]`
- **[process]** Captured command output pasted into docs must never be hand-edited, even
  cosmetically. Re-generate with different inputs instead. The conductor edited one README
  row and caught itself; nothing external would have. `[confidence: high]`
- **[process]** The pacer can spawn a second conductor into a live session when
  `next_wakeup_at` falls due mid-cycle, producing concurrent salvage commits on one repo.
  A long-running cycle should push its heartbeat forward *before* starting expensive work,
  not only at cycle end. `[confidence: high]`
- **[process]** Reversing a lock-time cut on user request is fine, but do it *additively*
  when a wave is in flight — a new export breaks nobody, an edited signature breaks
  everybody. Route the work to the agent that already owns the file (L-014).
  `[confidence: med]`

## Scoreboard

- 6 backlog items, all conductor-verified. 8 commits, 0 reverts.
- 102 tests green (started the QA pass at 95; +2 for the `age` fix, +5 regressions).
- 1 real correctness defect found post-green and fixed; 6 doc/format defects fixed;
  1 verified defect (KI-5, glyph width) deliberately deferred rather than rushed.
- Taste judge predicted `scope-fits-night` 6 and warned the accuracy claim was most
  likely to silently slip. It did not slip — but its instinct was right about *where* the
  risk lived, and the QA pass was aimed there because of it.
