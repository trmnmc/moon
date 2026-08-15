
## cycle 44 — 2026-08-15T07:54:12Z — VALUE_LOOP — build-wave (k=1) — T-126 — GATE PASS

clock: now=1786779941 at entry, stop_at=1786807947 (7.78 h remaining). Not within 900s of
  stop, not limp, usage_reset_at long past. Conductor PID 315725 from `pgrep -a -f claude`
  — fifth consecutive cycle on that workaround, and the process line settles what kind of
  session this is: `claude -p /swarm cycle --output-format json --permission-mode
  acceptEdits --add-dir /opt/targets/moon`. A pacer-spawned headless `-p` cycle: Workflow is
  review-gated (hence the documented DIRECT-Agent dispatch fallback) and no Artifact tool
  exists, which per cycle.md step 8 is not a publish failure.

budget probe: NOT invoked (44th consecutive cycle). KI-2 RE-GREPPED rather than inherited:
  `grep -nE 'swarm-budget|swarm-playbook|swarm-notify|swarm-craft'
  /opt/swarm/.claude/settings.json` returns ONLY two swarm-notify entries (a macOS absolute
  path, line 6; a bare relative one, line 7) and no entry of any form for swarm-budget.sh or
  swarm-playbook.sh. No human has applied the one-line fix nine morning reports have named.
  probe_failures stays 34 — an attempt not made is not a failure. Gear rests on
  runs/allocator.json (source=probe), freshness CHECKED not assumed: week_elapsed_pct
  advanced 72.87 -> 73.07 since cycle 43, so the pacer is still refreshing. posture=trickle,
  allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 78.0, opus_used_pct 96, dial 0.3.
  weekly_heat 78.0/73.07 = 1.0675 < 1.1 -> governor disengaged, ceiling 5; opus_heat
  96/73.07 = 1.3138 > 1.2 -> promote stays blocked. Trickle + guest 1-3 clamp -> gear 1,
  k_cap 1. week_resets_at 1786942799 is after stop_at, so gear 1 is structural for the rest
  of the run.
  MOVEMENT RE-REVERSES: cycle 43 recorded the first rise in weekly_heat since cycle 40
  (1.060 -> 1.070), narrowing the margin to the governor threshold to 0.030. This cycle
  weekly_used_pct HELD at 78.0 while elapsed advanced 0.20, so weekly_heat fell back to
  1.0675 and the margin widened to 0.0325. The cycle-43 rise was a single-cycle
  fluctuation, not a trend. No effect either way — the gear is already at its floor.

orient: tree clean at entry, no salvage needed. Control channel: poll FAILED again and the
  cycle-43 diagnosis REPRODUCED exactly. `bin/swarm-notify.sh poll` returned exit 127, "No
  such file or directory", because `pwd` shows the shell cwd this cycle is
  /opt/targets/moon, not /opt/swarm, so the bare-relative allowlist entry resolves to a path
  that does not exist. The /opt absolute form remains unallowlisted. Now CONFIRMED ACROSS
  TWO CYCLES rather than a one-off: the notify channel is unreachable in both invocation
  forms whenever the cwd is the target, and the conductor cannot change the cwd (`cd` is
  refused for shape). Fix unchanged, covering three scripts: add `Bash(/opt/swarm/bin/*.sh:*)`
  or per-script /opt absolute entries for swarm-notify.sh, swarm-budget.sh, swarm-playbook.sh.
  Per cycle.md step 2 a failed poll is non-fatal: fell back to file-sourced state.
  runs/control.json read directly — pending[], applied[], inject[] all empty. Nothing to
  apply, nothing to triage, no control-ack owed.

re-anchor: 44 % 5 != 0, no full SPEC re-read or backlog hygiene due. Scope unchanged.

craft pack: `node /opt/swarm/bin/swarm-craft.mjs` ran clean — `degraded: []`, all three packs
  returned, craftRefDir /opt/swarm/templates/craft. Worth noting it IS invocable while
  swarm-budget.sh and swarm-playbook.sh are not, because it is reached through a
  `Bash(node:*)` allowance rather than a per-script entry — which is also the shape of the
  KI-2 fix. Not spliced into the dispatch: T-126 is a markdown line-number correction with
  no UI surface, and the docs pack concerns README archetype and reader onboarding, neither
  of which bears on a citation fix.

pick — AND THE PRIOR QUESTION OF WHETHER THIS TARGET IS DONE:

  All four open items entering this cycle were wording items, and THREE (T-116, T-126,
  T-130) carry filing notes written at their own gates saying the VALUE_LOOP ratchet REJECTS
  them — T-130's is explicit: "recorded so a human may still want it, not queued as work".
  Cycle 43's block asserted the opposite reading. That contradiction had to be settled
  before picking anything, because cycle.md's churn breaker makes it the DONE test: a target
  is DONE when its definition-of-done is met AND no candidate passes the ratchet.

  Definition of done RE-VERIFIED BY DIRECT MEASUREMENT this cycle, not inherited:
    - 135/135 tests green, exit status 0 (conductor-run, before and after the wave).
    - Zero runtime dependencies: package.json has no `dependencies` key at all.
    - KI-6 fixed — verified by calling the API directly rather than trusting the record:
      nextFullMoon(new Date(8.64e15)) throws TypeError "result is outside the representable
      Date range"; new Date(8.64e15+1) and new Date(NaN) both throw TypeError "expects a
      valid Date". Consistent throw, no silent Invalid Date. test/astro.test.js:301-306
      additionally asserts the error is NOT a RangeError.
    - KI-7 bounded: PHASE_ILLUMINATION_CONSISTENCY_DOMAIN = {startMs:-30610224000000,
      endMs:32503680000000} (years 1000-3000), confirmed on the live export.
    - KI-5 pinned: suite runs "KI-5 pin: disc glyph set matches the documented East Asian
      Width partition".
    - KI-1 closed in SPEC Domain rules with a grep-verified prior-art finding.
  Definition of done: MET. No high-severity known_issues remain — the five open are KI-2
  (SWARM-side tooling, not a target defect), KI-4 (low, needs a human look, no machine can
  close it), KI-5 (medium, deliberately deferred, machine-pinned), KI-7 (low, bounded), KI-8
  (low, blocked on the repo owner supplying a copyright line).

  Then the nice-to-haves, since done-ness turns on whether any candidate clears the ratchet.
  SPEC lists two. KI-5-actually-fixed is an L-effort glyph redesign, forbidden at gear 1 and
  explicitly the wrong spend under trickle. The other is "a CI workflow file so the suite
  runs on push" — which read as a strong ratchet-passing candidate and was NEARLY dispatched.
  CHECKED BEFORE BUILDING, and it is ALREADY BUILT: .github/workflows/ci.yml exists (matrix
  node 20/22, `npm test`), and `gh run list` shows 8/8 recent pushes completed SUCCESS in
  17-24s each, most recently cycle 43's own commit 6c02de9. Dispatching a builder for it
  would have been pure churn — precisely the failure this SPEC's taste note names. Recorded
  because "verify the nice-to-have is not already built" is not a step anywhere in cycle.md.
  One gap noted, not filed as work: the CI matrix covers Node 20 and 22, while T-130's
  comment attributes stability to "Node 20/22/24" — the 24 leg is this host, not CI.

  Ratchet run explicitly on the four wording items:
    T-126 (p8)  CONTRACTS.md drift note cites src/args.js:15 as where the flags register.
                Notice? YES — a FACTUAL ERROR in a drift-DETECTION document, read by exactly
                the audience the SPEC names, "the next person to change this code". Care
                after 10 min? YES — a wrong citation costs that reader the same wasted
                lookup every time. Not reworded prose: a one-token correction that makes the
                document usable. PASSES. PICKED.
    T-130 (p9)  test comment claims cross-engine determinism ECMA-262 does not grant. A
                false claim, contributor-facing, but it overstates a guarantee rather than
                misdirecting a reader. Weaker. Next.
    T-139 (p12) documents a mutation-testing blind spot. Correct as it stands; documents a
                boundary rather than fixing a defect.
    T-116 (p9)  README 'colour'/'## Licence'. Genuine cosmetic churn — both spellings are
                valid English and no user is misled. Its one substantive thread (the heading
                disagrees with package.json "license": "MIT" and there is no LICENSE file) is
                ALREADY tracked as KI-8 and is BLOCKED on the repo owner supplying a
                copyright holder line, which no agent may invent. REJECTED, with the reason
                recorded so a later cycle does not re-litigate it.
  Verdict: the target is NOT done — T-126 passes, and T-140 (filed below) passes more
  strongly. Gear-1 fit is exact: cycle.md's gear-1 profile names docs work explicitly.

dispatch: build-wave k=1 (effective size = min(k_current 5, gear cap 1, hard max 5) = 1),
  ONE haiku agent via a DIRECT Agent call, the documented headless fallback for the
  review-gated Workflow tool. At k=1 there is no concurrency, so no worktree and no
  disjointness problem. Playbook builder prompt line spliced verbatim ("The conductor is the
  SOLE committer — never commit or push yourself"); the builder committed nothing.
  BRIEF DESIGN, the load-bearing part: the builder was given NOT ONE line number and was
  ordered to derive every one from the working tree, told explicitly that numbers in the
  document are known-stale and that nothing in the brief may be copied. That sidesteps the
  cycle-9/cycle-12 trap of a builder faithfully reproducing an item's own wrong words —
  which mattered enormously here, because the item's words WERE wrong. Verify commands were
  never shown to it; the conductor derived ground truth independently before dispatch.

gate — conductor-authored at verification time, conductor-run:

  Scope: `git status --porcelain` shows exactly ` M .swarm/CONTRACTS.md`; `git diff --stat`
  = 1 file, 2 insertions, 2 deletions. Digits-only, no reflow, no product file touched:
    -`src/args.js:106-112` currently returns an object with an additional fifth key:
    +`src/args.js:124-130` currently returns an object with an additional fifth key:
    -`src/args.js:15` ... including `--compact` on line 17.
    +`src/args.js:13-23` ... including `--compact` on line 21.

  VERIFICATION EVIDENCE — 16 machine checks resolving each citation against the real tree,
  every claim checked including those expected to be fine (full output:
  .swarm/runs/cycle-044-verify-T-126.txt):

    PASS  args.js:13 opens OPTIONS | "const OPTIONS = {"
    PASS  args.js:23 closes OPTIONS | "};"
    PASS  OPTIONS 13-23 registers SIX flags | json,south,north,block,compact,help
    PASS  args.js:21 is the compact entry | "  compact: { type: 'boolean' },"
    PASS  args.js:124 opens return obj | "  return {"
    PASS  args.js:130 closes return obj | "  };"
    PASS  return obj has the FIVE contract keys | json,hemisphere,block,compact,help
    PASS  args.test.js:87 is the cited test title | "the returned object has exactly the five contract keys"
    PASS  astro.js:363 is the current exports line
    PASS  CONTRACTS:33 / :60 / :67 frozen self-references
    --- discriminator: the OLD numbers must NOT resolve ---
    PASS  OLD args.js:15 was NOT the OPTIONS opener | "  south: { type: 'boolean' },"
    PASS  OLD line 17 was NOT compact | "  block: { type: 'boolean' },"
    PASS  OLD 106-112 was NOT the return obj | "options: OPTIONS,"
    PASS=16 FAIL=0

  The last three are the L-024 discriminator and are why this counts as a real correction
  rather than a relabel: they prove the old citations genuinely pointed at the wrong
  constructs. A no-op edit could not produce them.

  test_cmd, exit status captured DIRECTLY via spawnSync().status, never through a pipe
  (L-010 — a pipe would have reported the exit code of `tail`):
    tests 135 | pass 135 | fail 0 | cancelled 0 | skipped 0 | todo 0 | EXIT_STATUS=0

  T-126 -> done. Also re-derived rather than accepted: the builder's return claimed
  astro.js:363 was CORRECT-ALREADY, a citation the conductor had not examined before
  dispatch. It holds.

FINDING — THE ITEM'S OWN ACCEPTANCE WAS FALSE, IN BOTH HALVES:
  T-126's acceptance asserted "src/args.js:9 opens the OPTIONS table and src/args.js:17 is
  the `compact` entry" and instructed that "the sentence already names line 17 correctly and
  that half must not change". Measured ground truth: OPTIONS opens at 13 and closes at 23;
  line 9 sits inside the JSDoc comment above it; line 17 is `block:`; `compact:` is at 21.
  Obeying the acceptance literally would have produced a SECOND false citation and called it
  a fix. The gate's authority is ground truth, not the filed acceptance — an item's text is a
  goal, and a goal can be wrong. The builder, ordered to trust no supplied number,
  independently derived 13-23 and 21, matching the conductor's pre-dispatch derivation. The
  item is closed with this recorded in its notes rather than quietly. Scope was also WIDER
  than filed: three source-file citations were stale, not one.

filed: T-140 (p6, M, sonnet, test) — pin the CONTRACTS.md citations with a test that
  resolves each against the tree and is demonstrated failable under a one-line perturbation.
  Named untested surface: "drift-note citations versus the actual tree". Three rotted
  simultaneously and unnoticed, so this pins a PROVEN defect rather than restating a pass —
  the distinction the SPEC taste note draws. Now the strongest ratchet-passing candidate
  open, and the natural next pick.

wave autotune: clean wave (zero reverts, zero failed verifies) -> wave_streak 1 -> 2, which
  trips the bump: k_current = min(5, 5+1) = 5 (already at the ceiling, so unchanged),
  wave_streak reset to 0. Moot in practice while the gear cap pins the effective wave at 1.

counters: consecutive_no_value reset to 0 (this cycle verified value). Backlog 37 done /
  4 todo of 41.
