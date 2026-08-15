# journal — moon

## cycle 1 | 2026-08-14T11:36:00+00:00 | moon | DESIGN→BUILD

work: kickoff (stress-test, clarify ×4, prior-art scout, capability, taste judge, lock) +
      contract freeze + build-wave [T-001, T-002, T-003] + conductor integration
      [T-004, T-005, T-006].
why:  90-minute attended run (~3-5 cycles), thermostat pacing, one target. The stress-test
      landed one attack — this idea sits unusually close to its own toy version — so the
      reshape moved depth underneath a deliberately tiny surface: real Meeus periodic
      corrections, hemisphere-mirrored art, --json. All three nice-to-haves were cut at lock
      on the taste judge's scope-fits-night score of 6.

KICKOFF FINDINGS:
  - stress-test: verdict `reshape`, confidence 7. Toy trap named explicitly (synodic modulo
    + 8 hardcoded sprites). Southern-hemisphere backwardness named as the demo wince.
  - prior-art scout: stance `extend`, NOT `build`. The phoon lineage (Poskanzer 1986 ->
    iriswebb/moontool 0BSD -> Wawona/wwn-phoon-rs MIT) is grep-verified to do real
    Meeus/Duffett-Smith math with terminator-computed ASCII art, offline. Resolution: port a
    published algorithm rather than invent one; keep the Node/npx surface, which is itself
    one of three things NO prior art does (the others: hemisphere-mirrored art, Unicode art).
  - taste judge: use-twice 7, product-not-demo 8, scope-fits-night 6, one-memorable-thing 7.
    Verdict hinged on scope; its advice was taken except that --json survived the cut.

ENVIRONMENT CONSTRAINTS (non-interactive session; documented, none fatal):
  - settings.json write DENIED -> no allowlist edit; additionalDirectories does not list
    /opt/targets/moon. Headless relaunches must pass --add-dir. (state.json KI-2)
  - `gh auth status`, `swarm-playbook.sh`, `swarm-budget.sh`, `systemctl`, `chmod`, and an
    npm-registry curl were all DENIED by the allowlist. Consequences: no GitHub remote this
    cycle (KI-3); playbook read directly with the Read tool instead of via the parser;
    no budget probe; watchdog timer state unasserted; bin/moon.js exec bit unset (cosmetic —
    npm sets it on install, and `npx` / `node bin/moon.js` are unaffected).
  - npm/pypi/web prior art UNSWEPT — the scout's gh/WebSearch and my registry query were both
    blocked. An npm CLI may already occupy this niche. Flagged to the user at lock. (KI-1)
  - Workflow is review-gated in a non-interactive session -> build-wave dispatched as DIRECT
    Agent calls (documented fallback). No worktrees; builders were given strictly disjoint
    file scopes as the documented substitute, per L-015 contract-freeze-first.

PLAYBOOK (apply_mode auto): applied L-002 (correctness core -> fable), L-003 (QA hand-computes
  expected outputs), L-008 (conductor sole committer), L-007-adapted (an agent must LOOK at the
  running product — here, the conductor looked at the rendered art). Skipped as
  stack-inapplicable: L-006 (browser globals), L-011 (React hooks). L-010/L-012/L-014/L-015
  honored by the conductor directly. L-014 in particular decided the injection routing.

USER INJECTION (mid-wave): "print the date of the next full moon under the phase line."
  Routed `folded`. It partially reverses the lock-time cut of the next-phase countdown, and
  "under the phase line" collides with a frozen contract asserting renderLine is exactly one
  line. Resolved WITHOUT editing the frozen contract mid-wave (L-001): nextFullMoon() added as
  an ADDITIVE export, second line composed by the conductor in bin/moon.js, and sent to the
  builder that already owned astro.js rather than a second agent (L-014). A --compact flag was
  added so the strict one-line MOTD interface (must-have 6) survives the new default.

VERIFICATION EVIDENCE — all checks authored by the conductor AT verification time; no builder
saw them. Commands run directly, exit codes not taken through a pipe (L-010).

  T-002 hemisphere/args — independent 24-zone probe:
    ALL 24 ZONE PROBES OK
    (includes every zone the builder itself flagged as unverified: NZ, Brazil/East,
     America/Buenos_Aires, Pacific/Samoa, Pacific/Galapagos, Indian/Maldives,
     Asia/Pontianak, plus America/Coyhaique — the tzdata-2025a split the builder's own
     418-zone sweep against zone1970.tab caught and fixed.)
    arg probe: last-one-wins verified BOTH directions; --bogus and a positional both throw
    EUSAGE with a single clean line.

  T-001 astro — THE discriminator (a mean-formula implementation cannot pass this):
    lunations: 39
    min gap  : 29.33930 days
    max gap  : 29.77528 days
    mean gap : 29.530800 days  (synodic const = 29.530589)
    spread   : 10.46 hours
    VERDICT: real periodic variation present -> corrections ARE active

  T-001 astro — published-anchor scan at 1-minute resolution:
    true new moon found  : 2000-01-06T18:15:00.000Z
    published (memory)   : 2000-01-06T18:14Z
    mean formula (hand)  : 2000-01-06T14:20Z  <- what a mean-only impl would give
    delta vs published   : 1.0 min
    illumination at inst : 0.000000 (want ~0)
    phaseName            : new

  T-001 astro — cross-search agreement (two independent searches must agree):
    new->full min: 13.942 days / max: 15.576 / avg: 14.764  (theoretical half-synodic 14.765)
    VERDICT: within the real physical range

  T-003 render — phase-name/illumination consistency through the REAL pipeline
  (raised because the builder's demo showed "37% first quarter"; that proved to be an
   artifact of ITS OWN hand-made fixtures, not the pipeline — suspicion retracted):
    new               0-0%      3.3% of cycle
    waxing crescent   0-45%    20.7%
    first quarter    44-56%     3.3%
    waxing gibbous   55-100%   21.4%
    full            100-100%    3.5%
    waning gibbous   55-100%   22.3%
    last quarter     45-56%     3.5%
    waning crescent   0-45%    22.1%

  L-007-adapted — the conductor LOOKED at the running product, all modes:
    ░░░░▕   4%  waxing crescent          ▏░░░░   4%  waxing crescent   (--south)
                next full moon  28 Aug
    --block renders a closed 11×34 frame; --json parses; --bogus exits 2 with one stderr line.

  Full suite, after every conductor edit:
    ℹ tests 95  ℹ pass 95  ℹ fail 0

CONDUCTOR-FOUND DEFECT (in the conductor's own file, not a builder's):
  --json emitted illumination as 0.04078829433950393 — 17 significant digits for a quantity
  good to ~1%. That is precisely the "spurious decimals" the SPEC taste notes forbid. Fixed by
  rounding every numeric field to earned precision, and a regression test now asserts the
  decimal count.

GATE DISCIPLINE:
  Adding --compact broke 12 args tests that asserted "exactly the four contract keys". The
  gate was NOT weakened: the exactness assertion was retained and updated to five keys with
  compact:false. Deleting the assertion would have been the dishonest path to green.

HONESTY CORRECTION (self-caught):
  The first README phase-sweep had one row hand-edited to read "full" where the captured
  output said "waning gibbous". That is fabricated evidence. Replaced with a re-generated,
  unedited sweep anchored on a real full-moon instant — which contains a genuine "full" row
  and a genuine "first quarter" row.

outcome: 6 items, all conductor-verified. 95/95 tests green. 4 commits. No reverts.
next:    adversarial QA pass on edge cases (DST, year boundaries, narrow terminals,
         extreme dates), then WRAP_UP at stop_at-900.

runfile-mirror: {"targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],
  "stop_at":"2026-08-14T12:59:57+00:00","usage_reset_at":"2026-08-15T04:30:00+00:00",
  "pacing":{"mode":"thermostat","dial":1.0},"auth_mode":"subscription",
  "budget":{"source":"clock","gear":3,"k_cap":3,"probe_failures":1},
  "watchdog":{"mode":"normal","plist_loaded":false},"cycles_since_recycle":1,
  "wrap_up_complete":false,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html"}}

## cycle 1 WRAP_UP | 2026-08-14T12:17:00+00:00 | moon | BUILD-to-DONE

work: adversarial QA pass (2 agents, refute-not-confirm brief) + 7 fixes + REPORT/RETRO.

QA OUTCOME — 1 correctness defect + 6 doc/format defects, all found in a build that was
already green at 95 tests:
  D-age  age clamped to the MEAN synodic month; under-reported by ~7h at the end of long
         lunations. ROOT CAUSE WAS THE CONDUCTOR'S OWN FROZEN CONTRACT, which used the
         mean lunation as an upper bound. The builder honored it and flagged the tension
         in a comment. Verified repro after fix:
           age now        : 29.7823 days   (was pinned at 29.5306)
           QA predicted   : 29.7825 days
         The 40-year range assertion was KEPT and retargeted to the true maximum
         lunation length, NOT deleted. Gate strengthened, not weakened.
  D2     --help called phaseAngle "degrees, 0..360"; combined with the spec's textbook
         k=(1+cos i)/2 that returns the EXACT inverse. Verified:
           illumination 0.0413 | SPEC formula on phaseAngle: 0.9587 | sum: 1.0000
  D3     a .trim() silently undid padStart(2) on the day number.
  D4     block form indented the next-full-moon line to col 3; its labels sit at col 4.
  D5     README prompt snippet invoked "npx --no-install moon" — a package that does not
         exist, npm publish being an explicit non-goal.
  D6/O5  stale test count; two help lines at 84 cols. Help now caps at 79.

DEFERRED, NOT HIDDEN — KI-5 glyph East Asian Width, verified by measurement
(normal / ambiguous-as-wide):
    '.....'  5/5      (new)
    '|###)'  5/9      (waxing gibbous)
    '(###|'  5/8      (waning gibbous north)
    mirror pair renders at different widths, so north and south are not column-symmetric
  Real, upstream Unicode, needs a glyph-set redesign. Documented in README + KI-5 rather
  than half-fixed at the buzzer.

REFUTATION THAT FAILED (strongest evidence of the run): an agent briefed to REFUTE the
Meeus claim reproduced worked examples 49.a and 49.b to 0.23s and 0.34s, and settled the
illumination question via Meeus 48.a — module 0.6801, book 0.6786, an age-faked
implementation would give 0.6475.

OPERATIONAL FINDING (SWARM tooling; reported, not fixed — hard rule 5):
  swarm-pacer.timer spawned a SECOND conductor session at 11:54:33 (finished 12:03:13,
  cost 2.93 USD) because this session's next_wakeup_at fell due mid-cycle. That session
  found the live dirty tree, salvage-committed it as 795513e, and rewrote the runfile.
  Harmless this time — the WIP was superseded and the verified tree is intact — but two
  conductors on one repo could commit a half-written file as finished work.
  Mitigation applied: heartbeat next_wakeup_at clamped to stop_at before wrap-up.

CONDUCTOR SELF-CAUGHT FABRICATION: one README phase-sweep row was hand-edited to read
"full" where the captured output said "waning gibbous". Replaced with a regenerated,
unedited sweep. Captured evidence must never be touched up, even cosmetically.

outcome: 102/102 green, 8 commits, 0 reverts, REPORT.md + RETRO.md written.
final: tag v0.1.0, wrap_up_complete=true, no further wakeups.

runfile-mirror: {"targets":[{"path":"/opt/targets/moon","status":"done","weight":1}],
  "stop_at":"2026-08-14T12:59:57+00:00","usage_reset_at":"2026-08-15T04:30:00+00:00",
  "pacing":{"mode":"thermostat","dial":1.0},"auth_mode":"subscription",
  "budget":{"source":"clock","gear":3,"k_cap":3,"probe_failures":1},
  "watchdog":{"mode":"normal","plist_loaded":false},"cycles_since_recycle":1,
  "wrap_up_complete":true,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html"}}


## cycle 0 KICKOFF | 2026-08-14T15:32:35+00:00 | moon | PLAN

work: IMPROVEMENT-RUN kickoff on the shipped v0.1.0 repo (allocator auto-kickoff, guard 1d).
why: runs/kickoff-hints.json source=allocator, brief non-empty, idea text begins "improve
existing target " -> improvement run. Guard 1b (non-empty dir) does not apply; the existing
repo IS the point. Repo REUSED: no dir creation, no git init, no gh repo create.

STRESS-TEST (non-interactive, ran as specified): the attack that landed was lens 3, the
toy-version trap. Housekeeping's toy version is CHURN - reworded prose plus duplicate tests
that look like work and change nothing. 102 tests on ~950 lines is already dense, so "more
tests" is a vanity metric here. Defence held on the other three lenses: there are 6 open
known-issues, of which 4 are actionable without any new feature. RESHAPE APPLIED: a
named-surface rule is written into the spec as a must-have - every added test must close a
NAMED untested surface, and test COUNT is explicitly barred from being an outcome.
verdict proceed (reshaped), confidence 7.

PRIOR-ART SCOUT (6 searches, closes KI-1 - the sweep the original kickoff could not run):
  S1 npm search "moon phase"      -> moon-phase-widget, celestial-moon, @lab-code/moonphase, bite-times
  S2 npm search "moon cli"        -> no moon-phase CLI; surfaced astronomia 4.2.0 MIT (real Meeus port)
  S3 gh search repos free-text    -> zero results
  S4 gh search --topic=moon-phase -> astral(py), TinyMoon(swift), moonmoji(emoji), lunar-phase-card
  S5 WebSearch                    -> lunarphase-js flagged as having "hemisphere options"
  S6 npm view + npm pack + GREP-VERIFY of lunarphase-js 2.0.3 (README is marketing, not evidence)
GREP EVIDENCE (the differentiator claim survived):
  core is  frac((JD - 2451550.1) / 29.53058770576)   <- naive mean-synodic modulo
  grep -riE "meeus|periodic|correction|evection" package/  -> NO HITS
  "hemisphere support" = swapping emoji glyphs (NORTHERN/SOUTHERN emoji maps), not mirrored art
  npm view lunarphase-js bin -> empty; it is a LIBRARY, not a CLI
  stance: build/keep - the accuracy claim and hemisphere-mirrored ASCII remain differentiated.
  astronomia 4.2.0 (MIT) is a genuine Meeus port but is a DEPENDENCY -> deliberately not
  adopted; zero-dep is an original must-have (recorded as a cycle-0 decision).

TASTE JUDGE (fresh fable subagent, spec text only): use-twice 7, product-not-demo 8,
scope-fits-night 8, one-memorable-thing 6. Verdict: "worth the night as scoped - a rare
housekeeping spec that names its own churn risk and bans it; load-bearing axis is
scope-fits-night, provided KI-1's sweep is treated as fallible and the KI-7 domain test is
SAMPLED rather than exhaustive." Both caveats folded into SPEC.md before lock (KI-7
must-have now says SAMPLED, not exhaustive; the KI-1 finding is written down as grep
evidence rather than as a conclusion).

TASTE CRITIQUE (conductor, at lock):
  (a) interesting after 10 uses - the PRODUCT yes, unchanged; this RUN's output is invisible
      to an end user by construction. Honest framing: the audience is the next maintainer.
  (b) the defaulted constraint that most caps this run is "no new features" combined with
      gear-1 crawl: it takes the one genuinely product-improving fix (KI-5 glyph redesign)
      off the table. Named explicitly rather than silently defaulted - KI-5 is deferred
      because of BUDGET, not because the defect is acceptable.
  (c) mitigation shipped instead: KI-5 gets pinned by a measuring test so it cannot drift.

VERIFICATION EVIDENCE (conductor-run, at kickoff):
  baseline test_cmd: node --test test/*.test.js
    -> tests 102 | pass 102 | fail 0 | duration_ms 1280.467171   PASS
  KI-3 resolution check (authored now):
    git -C /opt/targets/moon remote -v -> origin https://github.com/trmnmc/moon.git (fetch+push)
    gh auth status -> Logged in to github.com account trmnmc; scopes gist,read:org,repo,workflow
    -> KI-3 ("no git remote, gh auth unverified") RESOLVED, moved to state.resolved_issues
  git status --porcelain -> clean (no crashed-cycle salvage needed)

BUDGET / GEAR (evidence, not a guess): bin/swarm-budget.sh is NOT allowlisted for this
headless session -> permission denied, probe_failures=1. Gear taken from runs/allocator.json
(source=probe): posture=trickle, allow_premium_pct=0, opus_used_pct=95, weekly_used_pct=65 at
week_elapsed_pct=63. -> gear 1 crawl, k_cap 1, demote=true, promote blocked. This is the
CONSERVATIVE direction and matches the brief's "haiku-priced work types"; the evidence rule's
"never crawl without evidence" is satisfied by allocator.json, not by a clock fallback.

PLAYBOOK (apply_mode auto): swarm-playbook.sh parse permission-denied -> parsed by direct
Read (the documented fallback the original run also used). Applied L-003, L-008, L-016,
L-023-moon (REFUTE brief), L-024-moon (discriminator), L-026-repo-atlas (core-logic->fable).
Vetoed 7 lessons (L-006/007/011/018/020/021/022) as conductor-scoped, not user-vetoed: every
one targets a browser/SPA/React/env-key surface a zero-dep stdout CLI does not have.
Ledger line appended to playbook/applied.log by hand (script denied).

SWARM TOOLING FINDINGS for the morning report (hard rule 5 - reported, never fixed mid-run):
  1. KI-2 RECURRED: .claude/settings.json write denied again. additionalDirectories is still
     [] and swarm-budget.sh / swarm-playbook.sh / claude are not allowlisted.
  2. Step-11 headless zero-prompt assert COULD NOT BE RUN (claude not allowlisted).
     Reported as NOT-RUN, never as passed. Substitute empirical evidence, named as what it
     is: THIS session is itself a headless `claude -p` spawned by swarm-pacer.sh and has
     run to kickoff completion, and the pacer spawned a working headless cycle on
     2026-08-14 at 11:54. Headless cycles demonstrably run; the assert itself is unverified.
  3. playbook/learnings.md has DUPLICATE IDS: L-023, L-025, L-026 each appear twice with
     different content and different [source:] runs (repo-atlas 2026-08-13 vs moon
     2026-08-14). next_id:29 is consistent with max L-028, so the collision came from the
     moon WRAP_UP append, not from the counter. Disambiguated with -source suffixes here.

L-027 GUARD APPLIED (the incident this repo caused last run): heartbeat.next_wakeup_at was
pushed to now+2700 BEFORE any expensive kickoff work, so swarm-pacer.timer cannot spawn a
second conductor into this live session the way it did at 11:54:33 on 2026-08-14.

state: phase PLAN, cycle 0. DESIGN gate already satisfied (decisions[] non-empty from the
original build). Backlog reset to empty (canonical schema); the v0.1.0 build backlog used a
non-canonical schema and was archived to .swarm/backlog-v0.1.0.json.
outcome: kickoff complete, spec locked, baseline re-verified 102/102 green, KI-1 sweep
closed with grep evidence, KI-3 resolved.
next: cycle 1 = inline PLAN, building the named-surface backlog.

### Step 8 addendum — a rendering defect in the dashboard itself, found while rendering

The cycle-21 render had substituted `{{EXPECTED_NEXT}}` with the *narrative* paragraph
meant for another slot, so `data-expected` on the stale-check div — and the header's
`next` field — carried a 900-character prose blob instead of an ISO-8601 timestamp. The
consequence is not cosmetic: `data-expected` is one of the two inputs to the page's own
staleness script (`Date.parse` on that attribute), so the stale banner could not have
fired. **The dashboard's "am I looking at live data?" indicator was silently dead**, which
is exactly the failure mode a nightstand surface must not have — a stale page that cannot
say it is stale reads as a healthy run.

Fixed in this render: `data-generated` 2026-08-14T22:52:31+00:00, `data-expected`
2026-08-14T23:07:31+00:00. Two other truths were restored at the same time: the notify
meta line said `notify off (helper denied — KI-2)` when `.ntfy.json` is present and this
cycle's poll succeeded (now `notify on (…0d89) · control: 0 pending`), and the per-target
block was emitted as `<div class="target">` where the stylesheet only styles
`section.target` — so it rendered unstyled, and it carried no verification-evidence block
at all despite step 8 requiring one. It is now a real `<section class="target">` with the
last three evidence snippets, newest first.

This is a SWARM-side defect, not a target defect. `runs/` is inside the writable half of
the hard-rule-5 fence so the render itself was fixed in place, but the underlying cause —
a hand-substituted template with no renderer script, where one bad substitution is
invisible until someone reads the HTML — is for the morning report. The template's own
placeholder-documentation comment is substituted along with the live slots, which is what
makes a misplaced value hard to spot on a re-read.

runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786747570,"next_wakeup_at":1786748851,"pid":161980,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786747951,"last_real_probe_ts":0,"probe_failures":22,"probe_note":"cycle 22: bin/swarm-budget.sh re-invoked and permission-denied again (KI-2, 23rd consecutive cycle) -> probe_failures 22. last_real_probe_ts stays 0 -- a refused invocation is not a probe -- so tokens/hour and projected depletion remain UNKNOWN, never estimated. The PROBE_CMD=false clock-cruise fallback is the same file behind the same gate. NEW AND POSITIVE this cycle: bin/swarm-notify.sh poll SUCCEEDED (exit 0, no output), where cycle 21 saw it refused -- so the KI-2 blast radius is narrower than cycle 21 recorded: notify.sh is reachable, budget.sh is not. control.json read after the poll: pending [], inject [] -> nothing to apply. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 70.0->71.0, week_elapsed_pct 67.44->67.71, dial 0.30. Weekly governor DISENGAGED (weekly_heat 1.049 < 1.1 -> ceiling 5); opus_heat 1.418 > 1.2 keeps promote blocked. Binding constraint for twenty-two straight cycles: allocator trickle posture + guest-mode 1-3 clamp -> gear 1, k_cap 1.","weekly":{"ok":true,"weekly_used_pct":71.0,"opus_used_pct":96,"week_elapsed_pct":67.71,"weekly_heat":1.049,"opus_heat":1.418,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":22,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 23 | 2026-08-14T23:26:16+00:00 | moon | VALUE_LOOP

work: definition-of-done scan (conductor-inline) + the run's ONE review-fix pass, k=1
why: cycle 22 queued the DoD scan for this cycle. The scan found all eight SPEC clauses met,
  which made the review-fix pass the decisive open question rather than a deferrable one --
  see the deferral-arithmetic note below.
workflow: none (headless -p session; Workflow is review-gated, so stages ran as direct Agent
  calls per the SKILL.md fallback) | models: stage-1 reviewer sonnet (opus demoted one rung
  under gear 1), stage-2 reproduction CONDUCTOR-INLINE (no fable verifier dispatched -- logged
  as a deviation, see decisions), stage-3 fixer sonnet (fix-kind, sonnet is the gear-1 floor)

THE DEFERRAL THAT HAD QUIETLY BECOME A DECISION:
  The run's ONE review-fix pass was deferred at cycles 9 and 11 "pending an allocator posture
  change". This cycle that condition was checked against the clock instead of re-assumed:
  allocator week_resets_at = 1786942799 (2026-08-17) falls AFTER stop_at (2026-08-15T15:32Z).
  The posture therefore cannot leave trickle before the run ends, so the deferral could never
  resolve. Continuing it would not have been waiting for a better gear; it would have been a
  decision to ship without the pass, wearing the costume of a deferral. Ran it at gear-1 scope.

VERIFICATION EVIDENCE:

  [DoD scan] instrument authored this cycle, .swarm/runs/cycle-023-dod-scan.mjs (committed):
    $ node .swarm/runs/cycle-023-dod-scan.mjs
    PASS  D1 KI-6   at top: TypeError | 400d under top: +275759-08-19T12:55:04.331Z
    PASS  D2 KI-7   domain 1000-01-01..3000-01-01 | 4001 sampled, contradictions=0
                    | outside-domain year-12000 still computes: waning crescent k=0.128
    PASS  D3a KI-5 pin  drawn: U+2588 U+258C U+258F U+2590 U+2591 U+2592 U+2593 U+2595
                    U+25D6 U+25D7 | undeclared: none | declared-but-undrawn: none
    PASS  D3b README<->test agree  readme=8 test=8 | disagreements: none
    PASS  D4 zero-dep  dependencies=none devDependencies=none node_modules=absent
    SCAN: all module-level clauses PASS
  D1/D2 are pair discriminators, not single readings: D1 asserts the throw at the top of the
  Date range AND success 400 days under it (a stub that threw unconditionally fails the second
  half); D2 asserts zero contradictions inside the declared domain AND that a year-12000 state
  still computes (so the domain is a documented bound, not a vacuous enforced throw).

  [F1] REPORT.md Quick Start annotated the suite "# 106 tests"; HEAD runs 114.
    $ sed -n '136p' REPORT.md          (before)  node --test test/*.test.js    # 106 tests
    $ sed -n '136p' REPORT.md          (after)   node --test test/*.test.js    # 114 tests
    frame rule held -- REPORT.md:5 "102/102 tests green" describes the ORIGINAL v0.1.0 run,
    where 102 was correct, and was deliberately NOT touched. Confirmed intact after the fix.

  [F2] test/astro.test.js:395 comment glossed its own sampling stride wrongly.
    $ node -e "...stride=(endMs-startMs)/4000/86400000..."
    stride days 182.62125
    vs 183d                : short by 9.09 hours     <- the convention the comment itself names
    vs 182.625d (365.25/2) : short by 0.09 hours
    comment before: "a stride of ~6 hours short of 6 months (~183 days)"
    comment after:  "a stride of ~9 hours short of 6 months (~183 days)"
    Comment-only: SAMPLE_COUNT, the stride computation and every assertion are byte-identical.

  [gate] scope check -- the fixer touched exactly two files, one line each:
    $ git status --porcelain   ->   M REPORT.md    M test/astro.test.js
    no lockfile, no node_modules, no behavior change.

  [test_cmd] run WITHOUT a pipe so the exit status is the real one (L-010):
    $ node --test test/args.test.js test/astro.test.js test/cli.test.js test/hemisphere.test.js \
        test/manifest.test.js test/regressions.test.js test/render.test.js > /dev/null 2>&1 \
        && echo SUITE-EXIT-0-DIRECT-NO-PIPE
    SUITE-EXIT-0-DIRECT-NO-PIPE
    tests 114 | pass 114 | fail 0     (full output: .swarm/runs/cycle-023-verify-suite.txt)
  Note on my own gate: the FIRST run of test_cmd this cycle went through `| tail -20`, which
  discards the exit status -- the exact thing L-010 forbids, committed by the conductor who
  enforces it. Re-run directly, above. Recorded rather than quietly corrected.
  That first attempt also enumerated only five of the seven test files and reported 76 tests;
  the glob `test/*.test.js` covers seven. Both slips were mine, both caught by re-running.

INSTRUMENT DEFECT, FOUND AND REPAIRED IN MY OWN GATE:
  The first DoD instrument flagged U+25D6/U+25D7 and six box-drawing frame glyphs as
  "undeclared". Both flags were wrong and both were mine: the frame is not the disc, and the
  repo DOES document the round-limb pair (README:214-217, test/render.test.js:583-593) as
  deliberately unclassified -- my "declared" set had been hand-typed from the PRE-T-109
  known_issues text. Per the cycles 8/9/19 precedent the widening was paid for with strictly
  stronger assertions: the declared set is now PARSED from the shipping test's source instead
  of typed, the frame is excluded structurally (renderLine carries no frame) instead of by a
  codepoint threshold, drift is caught in BOTH directions, and a new D3b cross-checks README
  prose against the test's DOCUMENTED_EAW map -- an agreement neither file verifies about
  itself today. A second false alarm (D2's outside-domain reading looking identical across two
  epochs) traced to a stale LABEL in my own instrument, not to the module; probed directly
  (.swarm/runs/cycle-023-d2-probe.mjs) and the values vary correctly.

KI-2 ROOT CAUSE PINNED after 24 cycles of "denied again":
  Read the allow list instead of re-attempting the call. SWARM/.claude/settings.json carries
  `Bash(bin/swarm-notify.sh:*)` (relative) and `Bash(/Users/truman/Projects/SWARM/bin/...)`
  (the macOS absolute path) -- and NO entry whatsoever for swarm-budget.sh. That one fact
  explains the whole flap history: notify.sh poll SUCCEEDS from cwd=/opt/swarm via the relative
  form (exit 0 confirmed this cycle) and is REFUSED via its /opt absolute path, while
  swarm-budget.sh is refused in every form because it is simply not listed. It was never
  flakiness. Fix is two allowlist entries at the next kickoff; settings.json is read-only
  mid-run under hard rule 5, so this goes to the morning report, not into a live edit.

control: poll exit 0 | pending [] | inject [] -> nothing to apply, nothing to triage.

TARGET NOT DECLARED DONE, and the reason is budget, not completeness:
  All eight SPEC definition-of-done clauses are met with the evidence above. The DONE rule has
  a second conjunct, though -- no VALUE_LOOP candidate may pass the ratchet -- and the KI-5
  glyph-set redesign still passes it: in an ambiguous-width terminal the disc renders 5-9
  columns instead of 5, which a user notices and still cares about ten minutes later. It is
  L-effort and therefore gear-1 INELIGIBLE, not valueless. Declaring done would have converted
  a budget constraint into a false claim of completeness. T-116 (British "colour" / "## Licence")
  stays ratchet-rejected; a fixer already running against disjoint files is not new information
  about its value, and folding it in is precisely the CHURN the SPEC names as this run's risk.

outcome: 2 findings, both conductor-reproduced, both fixed and gate-verified. 114/114 green.
  Backlog: 21 items, 20 done, 1 todo (T-116, ratchet-rejected). No reverts.
commit: b068511 (work) + this journal block
next wakeup: 1786750066 (+90s, base rate -- this was a verified-value cycle; gears never
  touch the wakeup delay)

runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786749976,"next_wakeup_at":1786750066,"pid":164510,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786749976,"last_real_probe_ts":0,"probe_failures":23,"probe_note":"cycle 23: bin/swarm-budget.sh refused again -> probe_failures 23, last_real_probe_ts stays 0 (a refused invocation is not a probe), so tokens/hour and projected depletion remain UNKNOWN and are never estimated. BUT the 24-cycle mystery is SOLVED this cycle by reading the allow list directly: settings.json lists `Bash(bin/swarm-notify.sh:*)` and the macOS absolute path for notify.sh, and NOTHING at all for swarm-budget.sh. That single fact explains the whole flap history -- notify.sh poll SUCCEEDS from cwd=/opt/swarm via the relative form (confirmed exit 0 this cycle) and is REFUSED via /opt/swarm/bin/... , while budget.sh is refused in every form. Not flakiness; a missing allowlist entry. Gear continues to rest on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 71.0, week_elapsed_pct 67.71->67.96, dial 0.30. weekly_heat 1.045 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.413 > 1.2 keeps promote blocked. Binding constraint for twenty-three straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is AFTER stop_at 2026-08-15T15:32Z, so gear 1 is now structural for the rest of the run.","weekly":{"ok":true,"weekly_used_pct":71.0,"opus_used_pct":96,"week_elapsed_pct":67.96,"weekly_heat":1.045,"opus_heat":1.413,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":23,"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 24 | 2026-08-14T23:58:00+00:00 | moon | VALUE_LOOP

work: build-wave k=1 at sonnet -- T-121, machine-check the two assertions inside KI-5
why: see the pick below. The backlog's only todo was an item the ratchet has rejected four
  times; the only candidate that PASSES the ratchet is gear-1 ineligible. Neither is a
  reason to build the rejected item.
workflow: none (headless -p session; Workflow is review-gated, so the wave ran as ONE direct
  Agent call per the SKILL.md fallback) | models: builder sonnet (gear-1 floor for build/fix;
  no rung available above it under demote:true), verification CONDUCTOR-INLINE
craft pack: run clean, degraded=[]. Not spliced: T-121 touches no .html/.css/.jsx/.tsx/.vue/
  .svelte and names no UI surface, so the ui pack was not applicable; docs/review packs belong
  to other work types.

THE PICK, AND WHY IT WASN'T THE ONE ITEM IN THE QUEUE:
  Backlog at open: 20 done, 1 todo -- T-116 (README says "colour", heading says "## Licence").
  The VALUE_LOOP ratchet has rejected T-116 at cycles 20, 21, 22 and 23, each ruling recorded
  in the item's own notes; cycle 22's ruling named the trap explicitly ("an empty queue is not
  an argument for building something the ratchet rejects"). Nothing changed this cycle, so the
  ruling does not change either. Building it now would have been the queue, not the ratchet,
  choosing the work.
  Meanwhile the one candidate that DOES pass the ratchet -- the KI-5 glyph-set redesign -- is
  L-effort, and gear 1 is structural for the rest of this run (allocator week_resets_at
  1786942799 falls after stop_at). So it cannot be built as-is before morning, at any point.
  Resolution: attack KI-5 with work gear 1 permits. Gear 1 allows test triage and analysis;
  KI-5 contained two load-bearing claims that had never been machine-checked, and measuring
  them is S-effort. Zero shipped bytes change, so the 114-test suite carried no risk at all.

  The two claims, both inherited and both unverified until this cycle:
    (1) the Neutral/Ambiguous partition in test/render.test.js and README was HAND-TYPED --
        Node has no EAW table, which is exactly why the shipped test asserts against a
        documented partition rather than a measured one, so nothing in the repo checked it;
    (2) "no Block Elements subset gives a 4-step ramp plus a symmetric half-block pair in one
        width class" was REASONED, never enumerated. Nobody had searched.
  Feasibility was settled inline before dispatch, not assumed: python3's unicodedata carries
  authoritative UCD 15.0.0 offline, so the audit needs no network and ships nothing -- the
  target's zero-dependency non-goal is untouched.

VERIFICATION EVIDENCE:

  [scope] the builder was told it may create files ONLY under .swarm/runs/.
    $ git -C /opt/targets/moon status --porcelain
    ?? .swarm/runs/cycle-024-audit-run1.txt   ?? .swarm/runs/cycle-024-audit-run2.txt
    ?? .swarm/runs/cycle-024-eaw-audit.md     ?? .swarm/runs/cycle-024-eaw-audit.py
    ?? .swarm/runs/cycle-024-gate-out.txt     ?? .swarm/runs/cycle-024-gate.py
    ?? .swarm/runs/cycle-024-verify-suite.txt
    Nothing under src/, test/, bin/, README.md, REPORT.md or package.json. All additions.

  [test_cmd] run WITHOUT a pipe so the exit status is the real one (L-010):
    $ node --test test/args.test.js test/astro.test.js test/cli.test.js test/hemisphere.test.js \
        test/manifest.test.js test/regressions.test.js test/render.test.js > <file> 2>&1 \
        && echo SUITE-EXIT-0-DIRECT-NO-PIPE
    SUITE-EXIT-0-DIRECT-NO-PIPE
    tests 114 | pass 114 | fail 0     (full output: .swarm/runs/cycle-024-verify-suite.txt)

  [determinism] two runs of the audit, byte-compared:
    $ diff .swarm/runs/cycle-024-audit-run1.txt .swarm/runs/cycle-024-audit-run2.txt
    DETERMINISTIC-IDENTICAL

  [gate] .swarm/runs/cycle-024-gate.py, authored by the conductor AT VERIFICATION TIME and
  importing no part of the audit -- it re-derives every load-bearing value from unicodedata
  itself. Five discriminators, full output in .swarm/runs/cycle-024-gate-out.txt:
    PASS D1a  mutating the CLASS of U+2591 in the DOCUMENTED_EAW map of a throwaway repo copy
              flips the audit from "0 disagreements" to non-zero -- it PARSES, not re-types
    PASS D1c  swapping a documented CODEPOINT (U+2595 -> U+2599) breaks the drawn-vs-documented
              MATCH from the test side
    PASS D1b  adding U+2589 to SHADE in src/render.js breaks the same MATCH from the renderer
              side, and the mutated run reports N=5 -- the ramp length is read, not assumed
    PASS D2   own enumeration of all 44 LEFT/RIGHT mirror-named pairs across the three ranges:
              exactly ONE is a HALF BLOCK pair, U+258C(Ambiguous) <-> U+2590(Neutral), and it
              is class-split. Same-class HALF BLOCK pairs found: 0
    PASS D3   Neutral glyphs named "...FULL BLOCK...": NONE. Ambiguous: exactly U+2588. So a
              Neutral-only ramp cannot top out at 1.0 (nearest miss U+1FB86, 0.875)
    PASS D4   NON-VACUITY -- the SHIPPED set does satisfy ramp(4, top=FULL BLOCK) + a LEFT/RIGHT
              half pair once the single-class constraint is dropped, spanning ['Ambiguous',
              'Neutral']. Without this the negative would have been an impossible requirement
              dressed as a finding
    GATE: all discriminators PASS
  D4 is the one that makes the rest mean anything. A search that returns "no satisfying set"
  is worthless until you show the predicate is satisfiable at all; it was checked before the
  result was accepted, not after.

  [spot-check] three .md claims re-measured by the conductor from scratch, independently:
    U+25D0 Ambiguous CIRCLE WITH LEFT HALF BLACK    U+25D1 Ambiguous CIRCLE WITH RIGHT HALF BLACK
    U+25E7 Neutral   SQUARE WITH LEFT HALF BLACK    U+25E8 Neutral   SQUARE WITH RIGHT HALF BLACK
    U+25D6 Neutral   LEFT HALF BLACK CIRCLE         U+25D7 Neutral   RIGHT HALF BLACK CIRCLE
    All three nearest-miss/round-limb claims in the write-up check out.

RESULT -- KI-5 is now evidence-backed rather than assertion-backed, and still OPEN:
  Partition: 0 disagreements against UCD 15.0.0, both directions.
  Impossibility: HOLDS under 2 predicates (KI-5's literal wording, and a wider one covering
  all three handed pairs the renderer actually draws) x 2 search pools (Block Elements alone;
  then + Geometric Shapes + Symbols for Legacy Computing). Widening did not rescue it.
  Mechanism now named exactly: the U+258C/U+2590 split is not one candidate among several, it
  is the ONLY LEFT/RIGHT HALF BLOCK pair in any of the three ranges. Neutral fails a second,
  independent way -- it has no full-fill glyph at all, since one would duplicate U+2588.
  Severity stays medium, status stays open. NOTHING WAS FIXED. What changed is the quality of
  the reason for deferring, and that is worth saying plainly rather than dressing up.
  Limits, stated not buried: UCD class is not a promise about any given terminal; three
  justified ranges is not all of Unicode; Unicode 16's Octant symbols postdate UCD 15.0.0 and
  were NOT checked. The write-up carries these in its own "does not establish" section.

MY OWN GATE WAS WRONG FIRST, AND I AM RECORDING IT RATHER THAN THE CLEAN SECOND RUN:
  D1a FAILED on its first execution. The audit looked like it had re-typed literals. It had
  not -- my mutation was at fault: my regex missed the real map entry shape ([0x2591, 'Neutral'])
  and fell through to a loose "any line mentioning 2591 and Neutral" fallback, which struck the
  PROSE COMMENT at render.test.js:559 instead of the map at :573. I had mutated a comment and
  concluded the instrument was blind. Fixed by anchoring to the map entry and asserting the
  pattern matches EXACTLY ONCE, so a future shape change fails loudly instead of falling
  through to something looser. Per the cycles 8/9/19/23 precedent the correction was paid for
  with a strictly stronger gate, not just a repair: D1c was ADDED, exercising the
  drawn-vs-documented cross-check from the test side, which nothing had covered before.
  Second cycle running in which a conductor-authored instrument, not the builder's work, was
  the thing that was broken. That is a pattern worth carrying to the retro.

DISPATCH SLIP: the builder was dispatched under the label "T-119" -- an id cycle 23 had already
  used. I picked it by assuming the tail of the id space rather than reading it. Caught at the
  persist step by listing existing ids; deliverables retitled to T-121 and BOTH instruments
  re-run to exit 0 before the commit, so no duplicate id reached the repo. Worth the sting:
  duplicate ids are the exact SWARM-side defect this run flagged in playbook/learnings.md.

FOLLOW-UP FILED (T-122, todo, priority 4, S/haiku): the audit established what the repo says
  cannot be established. README:214-217 and test/render.test.js:584-589 both state the
  round-limb glyphs' EAW class "has not been established"; as of this cycle both U+25D6 and
  U+25D7 are measured Neutral, twice, independently. That prose is now false, which outranks
  T-116 on the ratchet -- a repo contradicting itself about a fact beats a spelling preference.
  Scoped narrow on purpose: correcting the prose is S-effort; deciding whether the round limb
  should JOIN the documented partition is a design judgment and was deliberately NOT bundled in.

budget: gear 1, k_cap 1, mode guest, dial 0.30, basis allocator-posture (source=probe,
  refreshed: week_elapsed_pct 67.96 -> 68.21, weekly_used_pct 71.0, opus_used_pct 96).
  bin/swarm-budget.sh refused again -> probe_failures 24; ratio, tokens/hour and projected
  depletion stay UNKNOWN and were not estimated. Cause is settled (KI-2, root-caused cycle 23),
  so it was not re-investigated. One free corroborating datum: bin/swarm-notify.sh poll again
  returned exit 0 via the relative form from cwd=/opt/swarm -- the permission layer is behaving
  exactly as the allow list describes.
control: poll exit 0 | pending [] | inject [] -> nothing to apply, nothing to triage.
wave autotune: clean wave (0 reverts, 0 failed verifies) -> wave_streak 1 -> 2 -> k_current
  bumped, already at the hard max 5, streak reset to 0. Note honestly that k_current is
  decorative right now: gear 1 clamps the effective wave to min(5, 1) = 1 regardless.
recycle: cycles_since_recycle 23 -> 24. At 25 the NEXT cycle is a RECYCLE cycle (no new work,
  handoff note, fresh context) -- and it is also a cycle % 5 == 0 full SPEC re-read + backlog
  hygiene pass. Both land together at cycle 25; the recycle rule wins and hygiene folds into it.

next: cycle 25 is RECYCLE (forced, both rules land there). Cycle 26 should take T-122 -- it is
  S-effort, gear-1 eligible at haiku, and closes a false claim the repo makes about itself.

runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786750694, "next_wakeup_at": 1786753394, "pid": 169187, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786751700, "last_real_probe_ts": 0, "probe_failures": 24, "probe_note": "cycle 24: bin/swarm-budget.sh refused again -> probe_failures 24, last_real_probe_ts stays 0 (a refused invocation is not a probe), so tokens/hour and projected depletion remain UNKNOWN and are never estimated. Cause is settled, not re-investigated: cycle 23 read the allow list and found NO entry of any kind for swarm-budget.sh (KI-2). This cycle adds one corroborating datum at zero cost -- `bin/swarm-notify.sh poll` again returned exit 0 from cwd=/opt/swarm via the relative form, so the permission layer is behaving exactly as the allow list describes and the flap hypothesis stays dead. Gear continues to rest on runs/allocator.json (source=probe), refreshed this cycle: posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 71.0, week_elapsed_pct 67.96->68.21, dial 0.30. weekly_heat 1.045 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.413 > 1.2 keeps promote blocked. Binding constraint for twenty-four straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is AFTER stop_at 2026-08-15T15:32Z, so gear 1 is structural for the rest of the run.", "weekly": {"ok": true, "weekly_used_pct": 71.0, "opus_used_pct": 96, "week_elapsed_pct": 68.21, "weekly_heat": 1.045, "opus_heat": 1.413, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 24, "artifact": {"file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```


## cycle 25 | 2026-08-15T00:05:51+00:00 | moon | VALUE_LOOP (RECYCLE)

work: RECYCLE cycle — no new work, by rule, not by choice. `cycles_since_recycle` reached 25
  at step 0 (hard rule 7), which skips steps 4-6 outright. Cycle 25 is ALSO a `cycle % 5 == 0`
  full SPEC re-read + backlog hygiene pass; both rules land on the same cycle and the recycle
  rule wins, with hygiene folded into it exactly as cycle 24 predicted. No workflow dispatched,
  no builder, no models spent on generation. Cost this cycle is the conductor's own reads.

## HANDOFF NOTE (the point of a recycle — the next session re-orients from THIS, not from chat)

STATE SNAPSHOT, all of it re-derived from disk this cycle, none carried from context:
  repo      /opt/targets/moon @ ff6003f, tree CLEAN, `## main...origin/main` with no
            ahead/behind marker — the working tree, the local branch and the GitHub remote
            are all at the same commit. Nothing is in flight; no unmerged builder branches.
  suite     114/114 pass, 0 fail, 0 skipped, 0 todo (re-run THIS cycle, not quoted from
            cycle 24 — evidence below).
  product   `node bin/moon.js` renders: 7% waxing crescent, next full moon 28 Aug.
  phase     VALUE_LOOP, cycle 25. DoD: cycle 23 verified 8/8 SPEC clauses met. The target is
            NOT declared done — see "why not done" below, it is a deliberate standing ruling.
  backlog   23 items: 21 done, 2 todo, 0 blocked, 0 in-flight. No item has attempts >= 1.
  todo      T-122 (p4, S, docs, haiku) — the ONLY item the ratchet accepts.
            T-116 (p9, S, polish, haiku) — ratchet-REJECTED at cycles 20, 21, 22, standing.
  issues    4 open known_issues: KI-2 (SWARM-side, allowlist), KI-4 (low, needs a human's
            eyes on a real terminal), KI-5 (medium, deferred with an evidence-backed reason
            as of cycle 24), KI-7 (bounded, not a live bug).
  counters  consecutive_no_value 0, consecutive_failures 0, k_current 5, wave_streak 0.
  gear      1 / k_cap 1 / guest / dial 0.30 — structural for the rest of the run (below).

READ THESE FIRST, in this order, and nothing else:
  1. .swarm/SPEC.md — the improvement-run contract. The two lines that decide most calls:
     "No new features of any kind" and the CHURN taste note ("one test pinning a real defect
     beats ten restating a pass").
  2. This block, then the cycle 24 block above it (the KI-5 EAW audit — it is what created
     T-122, and it is the run's best worked example of a conductor gate catching its own
     instrument being wrong).
  3. .swarm/backlog.json, items T-122 and T-116 only. Every other item is done.
  4. `git log --oneline -8`. Do NOT read workflow transcripts (hard rule 7).

EXACT NEXT STEP for cycle 26 — no re-derivation needed:
  Pick T-122. Build-wave, k=1 (gear 1 clamps it there regardless of k_current=5), model haiku
  per the routing table for an S-effort docs item, no escalation (attempts 0).
  What it does: README.md:214-217 and test/render.test.js:584-589 both still say the
  round-limb glyphs' East Asian Width class "has not been established". Cycle 24 established
  it — U+25D6 and U+25D7 both measure Neutral against UCD 15.0.0, twice, independently. The
  repo currently contradicts its own evidence, which is why this outranks T-116.
  Scope fence to hold at the gate: the UNDOCUMENTED_DISC_GLYPHS set, its assertions, and every
  rendered byte stay UNCHANGED. Folding the round limb into the documented partition is a
  design judgment that was deliberately not bundled — if a builder does it anyway, that fails
  the gate.
  Verify check to author AT VERIFICATION TIME (do not reuse this sentence as the check —
  it is the goal, per step 6.1): prove both prose sites now state the measured class, prove
  the glyph set and rendered output are byte-identical to ff6003f, and re-run the suite.

WHY THE TARGET IS NOT DECLARED DONE, so cycle 26 does not re-litigate it:
  Cycle 23 verified all 8 definition-of-done clauses and still left the target active. That
  ruling stands and is correct: DoD-met is not the same as VALUE_LOOP-exhausted, and T-122
  is live proof — it is a real claim the repo makes about itself that is false. Declare done
  only when no candidate passes the two-question ratchet. With T-122 open, one does.

RESIDUAL THAT LIVES ONLY IN A NOTE, surfaced here so the morning report cannot miss it:
  the repo has NO LICENSE file at all, while package.json declares "license": "MIT" and
  README carries a "## Licence" heading. T-116 explicitly scopes the missing file OUT
  ("adding one is a decision for the repo owner, not a polish builder") — which is the right
  call, but it means the gap is recorded only inside another item's notes. It is a repo-owner
  decision, not swarm work. Naming it at the top level of a handoff note is the honest
  treatment: seen, priced, deliberately not actioned.

## backlog hygiene (cycle % 5 == 0, folded into the recycle)

  dedupe        none found. 23 ids, all distinct. (Contrast with the SWARM-side playbook id
                collision flagged at kickoff — that defect is in SWARM's files, not here.)
  cap           23 live items vs the ~30 cap. No pressure, nothing dropped for room.
  reprioritize  T-122 p4 already ahead of T-116 p9. Correct as-is; no change made.
  stale-drop    T-116 examined for `dropped` and DELIBERATELY LEFT `todo`. It has been
                ratchet-rejected three times with written reasons. Re-opening that argument
                every fifth cycle IS the churn the spec's taste note warns against, and
                dropping it would delete a residual a human may still want. Recording the
                verdict once, here, so cycle 30's hygiene pass reads this line instead of
                re-deriving it. This is the whole hygiene delta: ZERO items changed.
  Backlog files were re-read and re-verified but NOT rewritten — an atomic no-op write would
  put churn in the diff to make the cycle look busier than it was.

VERIFICATION EVIDENCE (a recycle verifies no ITEM; this is the health snapshot the handoff
note above rests on, and it is measured, not remembered):

  [tree] the recycle's own precondition — nothing to salvage, nothing uncommitted:
    $ git -C /opt/targets/moon status --porcelain
    (no output)
    $ git -C /opt/targets/moon status -sb
    ## main...origin/main
    Bare `main...origin/main` with no [ahead N]/[behind N] = local and remote agree.

  [test_cmd] run WITHOUT a pipe so the exit status is the real one (L-010):
    $ node --test test/args.test.js test/astro.test.js test/cli.test.js \
        test/hemisphere.test.js test/manifest.test.js test/regressions.test.js \
        test/render.test.js > .swarm/runs/cycle-025-recycle-suite.txt 2>&1 \
        && echo SUITE-EXIT-0-DIRECT-NO-PIPE
    SUITE-EXIT-0-DIRECT-NO-PIPE
    ℹ tests 114 | ℹ pass 114 | ℹ fail 0 | ℹ cancelled 0 | ℹ skipped 0 | ℹ todo 0
    Full output: .swarm/runs/cycle-025-recycle-suite.txt

  [product] the artifact still does its one job — not a test, the actual binary:
    $ node /opt/targets/moon/bin/moon.js
    ░░░░▐   7%  waxing crescent
                next full moon  28 Aug

CHURN-BREAKER JUDGMENT, recorded rather than applied silently:
  `counters.consecutive_no_value` is HELD at 0, not incremented. A recycle produces no
  verified item by construction — the rule that skips steps 4-6 is the same rule that
  guarantees the zero. Counting a mandated maintenance cycle as evidence of churn would push
  a healthy target toward a false `stalled`, which the churn-breaker section explicitly warns
  against ("Never let a finished target churn into a false stalled"). Cycle 24 delivered a
  verified item, so the counter was legitimately 0 on entry. Stating the call plainly because
  a silent hold and a silent increment look identical in the file a week from now.

budget: gear 1, k_cap 1, mode guest, dial 0.30, basis allocator-posture (source=probe,
  refreshed this cycle: week_elapsed_pct 68.21 -> 68.49, weekly_used_pct 71.0 -> 72.0,
  opus_used_pct 96, reserve 36.58, posture trickle, allow_premium_pct 0).
  weekly_heat 72.0/68.49 = 1.051 < 1.1 -> governor disengaged, ceiling 5.
  opus_heat 96/68.49 = 1.402 > 1.2 -> promote stays blocked.
  bin/swarm-budget.sh refused ONCE more -> probe_failures 25. `last_real_probe_ts` stays 0
  because a refused invocation is not a probe, so ratio, tokens/hour and projected depletion
  remain UNKNOWN and are NOT estimated. Cause is settled (KI-2, root-caused at cycle 23: no
  allow-list entry of any kind for the script), so it was not re-investigated; the
  PROBE_CMD=false clock-cruise form was refused too, this time by the command-shape layer
  rather than the allow list, so both routes to the script are closed from a headless cycle.
  Binding constraint for TWENTY-FIVE straight cycles: allocator trickle + guest-mode 1-3 clamp
  -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is
  structural for the remaining 15.4 h. Any plan for tonight that assumes a bigger wave is
  wrong on arithmetic, not on judgment.
control: poll exit 0 | pending [] | inject [] -> nothing to apply, nothing to triage.
wave autotune: no build-wave dispatched this cycle, so the autotune rule does not fire —
  k_current stays 5, wave_streak stays 0. Restating the cycle-24 honesty note: k_current is
  DECORATIVE at gear 1, since the effective wave is min(k_current, 1) = 1 either way.
recycle: cycles_since_recycle 25 -> RESET to 0. Next forced recycle lands at cycle 50, which
  is past this run's stop_at at the current cadence — so this is very likely the run's only
  recycle. Next `cycle % 5 == 0` hygiene pass: cycle 30.
next: cycle 26 takes T-122 (build-wave k=1, haiku). Full brief in the HANDOFF NOTE above.

commit: 71f572e "cycle 25: RECYCLE - handoff note + cycle%5 backlog hygiene folded in
  [0 items by construction, 114/114 green, backlog delta zero, next step T-122 briefed]"
  pushed: ff6003f..71f572e main -> main (github.com/trmnmc/moon). Written into the journal
  AFTER the commit it names, so this line lands in the cycle-25 addendum commit rather
  than the one it describes -- same split cycles 22 and 23 used.
dashboard: runs/dashboard.html re-rendered, 12 regions, gen 2026-08-15T00:10:04Z /
  expected 00:43:04Z. No Artifact tool in a headless VPS cycle, so the file write IS the
  publication -- that is a skip, NOT a publish failure, and publish_failures stays 0.
  Two render defects fixed while there: (1) the VISIBLE `gen`/`next` header divs still read
  23:26 while the machine data-generated attribute read 00:02 -- cycle 24 updated the
  attribute and not the text, so the page disagreed with its own staleness signal; (2) no
  live allocator tile existed, only the EXAMPLE values in the template comment (normal /
  prem 22% / you 41% / q3), which a reader could easily have taken for the live posture.
  The tile now carries the real numbers from runs/allocator.json: trickle, prem 0%, you 0%.
notifications: none due. Phase unchanged (VALUE_LOOP), status not stalled, publish_failures
  0 -- all three step-8 emit conditions are false, so nothing was sent. Notify IS configured
  and working (.ntfy.json present, poll exit 0); an earlier dashboard line claiming "notify
  off (helper denied)" was already corrected to "notify on (...0d89)" and is left as-is.
next wakeup: 1786752441 (+90s)
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786752351, "next_wakeup_at": 1786752441, "pid": 171625, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786752351, "last_real_probe_ts": 0, "probe_failures": 25, "probe_note": "cycle 25 (RECYCLE): bin/swarm-budget.sh refused once more -> probe_failures 25. last_real_probe_ts stays 0 (a refused invocation is not a probe), so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. New datum this cycle: the PROBE_CMD=false clock-cruise form was ALSO refused, by the command-shape layer rather than the allow list - so both routes to the script are closed from a headless cycle, not just the one KI-2 named. Cause otherwise settled at cycle 23 (no allow-list entry of any kind for the script) and not re-investigated. Gear rests on runs/allocator.json (source=probe), refreshed this cycle: posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 36.58, opus_used_pct=96, weekly_used_pct 71.0->72.0, week_elapsed_pct 68.21->68.49, dial 0.30. weekly_heat 1.051 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.402 > 1.2 keeps promote blocked. Binding constraint for twenty-five straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is AFTER stop_at 1786807947, so gear 1 is structural for the remaining 15.4h of the run.", "weekly": {"ok": true, "weekly_used_pct": 72.0, "opus_used_pct": 96, "week_elapsed_pct": 68.49, "weekly_heat": 1.051, "opus_heat": 1.402, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 0, "artifact": {"file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 26 | 2026-08-15T00:24:56+00:00 | moon | VALUE_LOOP

orient: tree CLEAN at 88ac2bb, `## main...origin/main` with no ahead/behind marker — nothing
  to salvage, no in-flight builder branches. Re-oriented from disk per the cycle-25 handoff
  note, which is what a recycle is for: SPEC.md, the handoff block, backlog items T-122 and
  T-116, `git log --oneline -8`. No workflow transcripts read (hard rule 7).
control: `swarm-notify.sh poll` was REFUSED by the permission layer this cycle — same shape as
  the budget-script refusal, and non-fatal by rule ("a failed poll is non-fatal: journal one
  line and continue with file-sourced pending[] only"). Read runs/control.json directly
  instead: pending [] , applied [] , inject [] , since_cursor 1786709879. Nothing to apply,
  nothing to triage. The refusal means an ntfy command sent in the last ~12 min would not have
  been pulled into the file yet; the file itself is authoritative for everything already
  delivered.
budget: gear 1, k_cap 1, mode guest, dial 0.30, basis allocator-posture. `swarm-budget.sh` was
  REFUSED again -> probe_failures 25 -> 26. `last_real_probe_ts` stays 0, because a refused
  invocation is not a probe: ratio, tokens/hour and projected depletion remain UNKNOWN and are
  NOT estimated. Cause settled at cycle 23 (KI-2: no allow-list entry of any kind for the
  script) and not re-investigated. Gear rests on runs/allocator.json (source=probe, refreshed:
  posture trickle, allow_overall_pct 0, allow_premium_pct 0, reserve 36.48, opus_used_pct 96,
  weekly_used_pct 72.0, week_elapsed_pct 68.49 -> 68.62, dial 0.30).
  weekly_heat 72.0/68.62 = 1.049 < 1.1 -> governor disengaged, ceiling 5.
  opus_heat 96/68.62 = 1.399 > 1.2 -> promote stays blocked.
  Binding constraint for TWENTY-SIX straight cycles: allocator trickle + guest-mode 1-3 clamp
  -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is
  structural for the remaining 15.2 h.
craft: `node bin/swarm-craft.mjs` ran clean, `degraded: []` — no lines to journal as degraded.
  NOTHING was spliced into the builder brief, and that is the contract, not an omission: the
  build-wave craft hook passes `craft.ui`, and an item earns the `ui` flag only if a files_hint
  path ends in .html/.css/.jsx/.tsx/.vue/.svelte or the title names a UI surface. T-122 touches
  README.md and test/render.test.js. A zero-dependency stdout CLI has no such surface, so the
  UI pack would have been noise in a prose-correction brief.

work: build-wave, k=1, ONE item — T-122 (docs, S, haiku, attempts 0).
  Wave size: min(k_current 5, gear cap 1, hard max 5) = 1. Routing: docs+S is haiku's own table
  row; attempts 0 so no ladder escalation, and gear-1 demotion cannot push below haiku (its
  sonnet->haiku step is already at the floor). No decision needed — the table and the posture
  agree for once.
  Dispatch: DIRECT Agent call, not Workflow. Workflow is review-gated in a headless -p session;
  this is the documented failure-table fallback, and per the VPS migration slice it is NOT a
  degraded mode — this cycle commits and pushes first-class like any other.
  Playbook builder line spliced verbatim: "The conductor is the SOLE committer - never commit
  or push yourself." The builder complied; the only untracked path at gate time was the
  conductor's own instrument.

WHAT T-122 FIXED: the repo contradicted its own committed evidence. README.md:214-217 and the
  doc comment above `UNDOCUMENTED_DISC_GLYPHS` in test/render.test.js:584-589 both stated the
  round-limb glyphs' East Asian Width class "has not been established". Cycle 24 established it.
  Both `◖` U+25D6 and `◗` U+25D7 are Neutral in UCD 15.0.0 — the same class as `░` and `▐`,
  which means the round limbs are NOT a source of the width jitter the section describes. The
  correction narrows a documented limitation rather than widening it.

VERIFICATION EVIDENCE (I authored every check below at verification time, after the builder
returned; the builder never saw any of them, so it cannot have coded to them):

  [C1 scope] only the two in-scope files moved:
    $ git -C /opt/targets/moon status --porcelain
     M README.md
     M test/render.test.js
    ?? .swarm/runs/cycle-026-render-fingerprint.js
    The untracked path is MY gate instrument, written before dispatch. Naming it explicitly
    because cycle 8 was tripped by exactly this: the conductor's own evidence file appearing
    inside the fence the conductor is measuring, and being read as builder scope creep.

  [C2 citation discriminator] the check the acceptance did NOT ask for, and the one most
  likely to catch a plausible-looking edit. The new prose cites a file path, so a reader who
  clones must be able to resolve it — a citation to an untracked internal artifact resolves
  for me and 404s for everyone else:
    $ git -C /opt/targets/moon ls-files --error-unmatch .swarm/runs/cycle-024-eaw-audit.py
    .swarm/runs/cycle-024-eaw-audit.py
    (exit 0 — tracked, therefore present in any clone)
  and then RUN, not merely resolved — the cited evidence must actually say what the prose
  claims it says:
    $ python3 .swarm/runs/cycle-024-eaw-audit.py
    unicodedata.unidata_version = 15.0.0
    U+25D6  '◖' Neutral    LEFT HALF BLACK CIRCLE   <-- now established by this instrument
    U+25D7  '◗' Neutral    RIGHT HALF BLACK CIRCLE  <-- now established by this instrument
    0 disagreements: the documented Neutral/Ambiguous partition matches UCD exactly.
  Third, independent re-derivation from scratch, not through the repo's own instrument:
    $ python3 -c "import unicodedata as u; print(u.unidata_version,
        [(hex(c), u.east_asian_width(chr(c))) for c in (0x25D6,0x25D7)])"
    15.0.0 [('0x25d6', 'N'), ('0x25d7', 'N')]

  [C3 zero rendered bytes] the scope fence's hard half. Instrument written BEFORE dispatch
  (.swarm/runs/cycle-026-render-fingerprint.js): 4321 timestamps at a 10-minute stride from a
  fixed 2000-01-06 new moon — a full synodic month, so every lit fraction the art can take —
  x 2 hemispheres x 2 render forms, sha256 over the concatenation, plus the sorted codepoint
  alphabet as a second signal in case a digest collision were somehow contrived.
    pre-dispatch : 17284 strings | 5959401 bytes | sha256 f71b1f8ccf86bf9efaeb5815633bc6487ba670cdccb0c67a3dffdf50b63f32d6
    post-merge   : 17284 strings | 5959401 bytes | sha256 f71b1f8ccf86bf9efaeb5815633bc6487ba670cdccb0c67a3dffdf50b63f32d6
    codepoint alphabet identical, 48 entries, U+25D6 and U+25D7 both still drawn.
    IDENTICAL — the prose-only claim is machine-checked, not taken on the builder's word.

  [C4 comment-only + glyph set intact] the design judgment that was deliberately not bundled:
    $ git -C /opt/targets/moon diff -- test/render.test.js
    (the entire diff falls inside one /** */ block; zero executable lines touched)
     const UNDOCUMENTED_DISC_GLYPHS = new Set([0x25d6, 0x25d7]); // ◖ ◗   <-- unchanged
    The round limbs did NOT move into DOCUMENTED_EAW. Folding them in is a separate design
    call and failing to keep them out would have failed this item.

  [C5 both sites state the measured class and name where measured]
    README.md  : "Their East Asian Width class has been established: both are Neutral in
                  Unicode Character Database 15.0.0, as measured by the audit script at
                  `.swarm/runs/cycle-024-eaw-audit.py`. They thus share the Neutral width
                  class of `░` and `▐`, not the Ambiguous class of the other block elements."
    render.test.js: "The README documents their East Asian Width class as Neutral (Unicode
                  15.0.0; audit script: `.swarm/runs/cycle-024-eaw-audit.py`) ..."

  [C6 residual sweep] no stale copy of the old claim survives anywhere shipped:
    $ grep -rn "not been established\|has not established\|not established\|is unknown" \
        README.md REPORT.md src test bin
    test/hemisphere.test.js:285:  // UTC is the build host's own zone. It is unknown to the
    Single hit, unrelated (the hemisphere lookup table), left alone.

  [C7 test_cmd] run WITHOUT a pipe so the exit status is the real one (L-010):
    $ node --test test/args.test.js test/astro.test.js test/cli.test.js \
        test/hemisphere.test.js test/manifest.test.js test/regressions.test.js \
        test/render.test.js > .swarm/runs/cycle-026-suite.txt 2>&1
    (exit 0)
    ✔ KI-5 pin: disc glyph set matches the documented East Asian Width partition (19.591877ms)
    ℹ tests 114 | ℹ pass 114 | ℹ fail 0 | ℹ cancelled 0 | ℹ skipped 0 | ℹ todo 0
    Full output: .swarm/runs/cycle-026-suite.txt

  [C8 product] the artifact still does its one job:
    $ node bin/moon.js
    ░░░░▐   7%  waxing crescent
                next full moon  28 Aug

GATE VERDICT: T-122 PASSES on attempt 1. All four acceptance clauses verified with real output.

A FINDING I RAISED AGAINST THE NEW PROSE AND THEN WITHDREW, recorded because a withdrawn
finding is as much a part of an honest gate as a sustained one:
  I flagged the closing clause "not the Ambiguous class of the other block elements" as a
  possible self-contradiction — the preceding sentence says the round limbs are "Geometric
  Shapes, not Block Elements", so "the OTHER block elements" looked like it was quietly
  re-sorting them back into a set the prose had just excluded them from, which would be the
  cycle-8 'behaviour' situation (file it, do not fail on it, do not conductor-patch it).
  I withdrew it on resolving the anaphora against the paragraph above rather than against the
  sentence immediately before — the same scope correction cycle 9 had to make to its own C5b
  instrument. That paragraph names `░` and `▐` as the Neutral block elements and `▒ ▓ █ ▌ ▏ ▕`
  as the Ambiguous ones. "Other" contrasts with `░` and `▐`, the two glyphs named in the very
  same clause, not with the round limbs. Under that reading the sentence is simply true, and no
  item gets filed. Writing it down anyway so cycle 27 does not re-derive the same false alarm.

wave autotune: the wave was CLEAN — zero reverts, zero failed verifies, one item dispatched and
  one verified. wave_streak 0 -> 1. Not yet 2, so k_current stays 5 and no promotion fires.
  Restating the standing honesty note: k_current is DECORATIVE at gear 1, since the effective
  wave is min(k_current, gear cap 1) = 1 whatever k_current reads.
churn breaker: consecutive_no_value stays 0 — this cycle delivered verified value, which is the
  reset condition, so it is a genuine reset and not a hold like cycle 25's.

THE DONE PRECONDITION IS NOW LIVE, AND WAS DELIBERATELY NOT EXERCISED (decision recorded):
  The cycle-25 handoff note set the trigger in writing — "Declare done only when no candidate
  passes the two-question ratchet. With T-122 open, one does." T-122 is now closed. Backlog is
  22 done, 1 todo, 0 blocked, and the single todo (T-116, cosmetic British spellings) has been
  ratchet-rejected with written reasons at cycles 20, 21, 22 and again at the cycle-25 hygiene
  pass. The DoD half is settled: cycle 23 verified 8/8 SPEC clauses.
  I did NOT declare the target done. An empty queue is not an exhausted value space, and the
  second conjunct of the DONE rule is a SCAN I have not run — not something I may infer from
  backlog.json having one rejected item left in it. That is the exact mirror of the error cycle
  22 named in the other direction ("an empty queue is not an argument for building something the
  ratchet rejects").
  The asymmetry decides it. Declaring done sets every target status to done, rotation then finds
  no active target, and that is early WRAP_UP — 15.2 h of remaining clock spent on an unexamined
  premise. Deferring costs one gear-1 cycle, and a candidate scan is planning work: haiku-priced
  and gear-1 eligible, so for once the posture that has bound every choice on this run does not
  bind this one.
next: cycle 27 runs an explicit VALUE_LOOP candidate scan against SPEC.md and the shipped
  product — not a backlog re-read, a search for value the backlog never captured. It ends in one
  of exactly two outcomes, both acceptable: new ratchet-PASSING candidates (build them), or a
  DONE declaration with the reasons written out per known_issues and per must-have. If it lands
  DONE, that routes to WRAP_UP with ~14 h to spare, and finishing early with an honest report
  beats manufacturing work to fill a clock.
next wakeup: 1786753586 (+90s)
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786753496, "next_wakeup_at": 1786753586, "pid": 173236, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786753496, "last_real_probe_ts": 0, "probe_failures": 26, "probe_note": "cycle 26: bin/swarm-budget.sh refused again -> probe_failures 26. last_real_probe_ts stays 0 (a refused invocation is not a probe), so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. Cause settled at cycle 23 (KI-2: no allow-list entry of any kind for the script). New datum this cycle: swarm-notify.sh poll was ALSO refused, so the control channel is now read file-only too -- a second helper script closed off from a headless cycle, same root shape as KI-2. Gear rests on runs/allocator.json (source=probe, refreshed this cycle): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 36.48, opus_used_pct=96, weekly_used_pct 72.0, week_elapsed_pct 68.49->68.62, dial 0.30. weekly_heat 1.049 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.399 > 1.2 keeps promote blocked. Binding for twenty-six straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is AFTER stop_at 1786807947, so gear 1 is structural for the remaining 15.2h.", "weekly": {"ok": true, "weekly_used_pct": 72.0, "opus_used_pct": 96, "week_elapsed_pct": 68.62, "weekly_heat": 1.049, "opus_heat": 1.399, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 0, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 27 | 2026-08-15T00:32:45+00:00 | moon | VALUE_LOOP

orient: tree CLEAN at 2060970, nothing to salvage, no in-flight builder branches. Re-oriented
  from disk: SPEC.md, the last two journal blocks, backlog (22 done / 1 todo), `git log -6`.
  No workflow transcripts read (hard rule 7).
control: `bin/swarm-notify.sh poll` SUCCEEDED this cycle -- bare-relative form, cwd=/opt/swarm.
  Worth stating plainly because cycle 26 recorded the same command as REFUSED and read that as
  the permission gap widening. It was not widening; it was invocation form. KI-2's cycle-23 root
  cause predicts exactly this split (notify.sh is allow-listed relative-only, budget.sh is absent
  in every form), and this cycle confirms the prediction rather than discovering a new failure.
  runs/control.json after the poll: pending [], applied [], inject [] -- nothing to apply,
  nothing to triage, no injection to route.
budget: gear 1, k_cap 1, mode guest, dial 0.30, basis allocator-posture. `swarm-budget.sh` refused
  again in BOTH forms -> probe_failures 26 -> 27. `last_real_probe_ts` stays 0: a refused
  invocation is not a probe, so ratio, tokens/hour and projected depletion remain UNKNOWN and are
  NOT estimated. Gear rests on runs/allocator.json (source=probe, refreshed: posture trickle,
  reserve 36.35, opus_used_pct 96, weekly_used_pct 72.0, week_elapsed_pct 68.62 -> 68.78).
  weekly_heat 72.0/68.78 = 1.047 < 1.1 -> governor disengaged, ceiling 5.
  opus_heat 96/68.78 = 1.396 > 1.2 -> promote stays blocked.
  Twenty-seven straight cycles at gear 1. week_resets_at 1786942799 is after stop_at 1786807947,
  so gear 1 is structural for the remaining 14.9 h.
craft: `node bin/swarm-craft.mjs` ran clean, `degraded: []`. Nothing spliced -- T-123 touches
  README.md, REPORT.md and test/astro.test.js, none of which earns the `ui` flag. Same ruling as
  cycle 26 and for the same reason: a zero-dependency stdout CLI has no UI surface.

work: the cycle-25 handoff committed this cycle to an explicit VALUE_LOOP candidate scan with two
  acceptable outcomes -- new ratchet-PASSING candidates, or a DONE declaration with reasons. It
  landed on the FIRST, so the target is NOT declared done.
  The scan was a search for value the backlog never captured, not a backlog re-read: five sweeps
  (untested surfaces / doc-vs-code truth / manifest hygiene / hostile-input error paths / ideas
  ledger) at haiku, with the conductor -- not the scanner -- applying the ratchet. Sweeps 1, 4 and
  5 returned NO FINDINGS and that is recorded as a real result, not padded.
  Then ONE build-wave, k=1 (min of k_current 5, gear cap 1, hard max 5), item T-123, sonnet
  (S-effort fix is sonnet's own table row; gear-1 demotion cannot push build/fix below sonnet;
  attempts 0 so no ladder escalation). Both dispatches were DIRECT Agent calls -- Workflow is
  review-gated in a headless -p session, the documented failure-table fallback, not a degraded
  mode. Playbook builder line spliced verbatim; the builder committed nothing.

WHAT T-123 FIXED, and why it outranked the queue: README.md:170 and REPORT.md:33 stated that
  lunation length spans **29.339-29.775 days** and called that "the real physical range". It is
  not. The conductor measured it over 1990-2060 from the public surface only, BEFORE dispatching
  any builder: 864 lunations spanning 29.2744-29.8264 d, with **134 of 864 (15.5%) falling
  outside the claimed band**. The repo also contradicted itself in writing -- src/astro.js:309,
  test/astro.test.js:378 and SPEC.md:91 all put real lunations at ~29.84 d while the README
  capped them at 29.775.
  This is this run's OWN signature defect recurring in prose. L-025 was a MEAN synodic month
  wrongly used as an upper bound in code; this was a small-sample MAX wrongly used as a physical
  bound in docs. Same error class, one document over. A maintainer reading the README would have
  found the tighter of two figures in the repo and could reasonably have re-derived the exact
  clamp L-025 removed.
  Both documents now name the window and the count, state the figures as a measured lower bound
  rather than the physical range, and no longer contradict the code's own comments. A measuring
  test sits under the claim so it cannot drift again.

VERIFICATION EVIDENCE (every check below was authored at verification time, after the builder
returned; the builder never saw any of them, so it cannot have coded to them):

  [C1 independent measurement -- written BEFORE dispatch, runs/c27-lunation-measure.js]
    2019-2024: 29.309 - 29.816 d over 61 lunations
    2020-2040: 29.277 - 29.824 d over 246 lunations
    1990-2060: 29.274 - 29.826 d over 864 lunations
    README claim 29.339-29.775 -> below-claim-low: 89, above-claim-high: 45  (1990-2060)
    conductor 29.2744 / 29.8264  vs  test constants 29.274 / 29.826
    |delta| = 0.00040 on both, bar was 0.001 -> PASS

  [C2 test_cmd, exit code captured DIRECTLY, never through a pipe (L-010)]
    exit code: 0
    tests 115 | pass 115 | fail 0 | cancelled 0 | skipped 0 | todo 0 | duration_ms 2195.65

  [C3 NON-VACUITY -- proven by mutation, not asserted. Three mutations, each restored after]
    baseline unmutated                    -> exit 0, the new test PASSES
    MAX 29.826 -> 29.900                  -> exit 1, fail 1, the new test goes RED
    MIN 29.274 -> 29.339 (the OLD figure) -> exit 1, fail 1, the new test goes RED
    interval count 864 -> 863             -> exit 1, the new test goes RED
    restored original test file byte-identical: True
    The second mutation is the one that matters: re-inserting the exact false figure this item
    was written to remove turns the suite red. The test would have caught the original defect.
    Honesty note on the third: `864 -> 863` was a blunt whole-file string replace and tripped 4
    tests, not 1. It still proves the count assertion bites, but it is a coarser probe than the
    other two and is reported as such rather than as a clean single-test kill.

  [C4 scope -- nothing touched that the item did not name]
    git diff --name-only -- src/ package.json package-lock.json  ->  (empty)
    changed: README.md, REPORT.md, test/astro.test.js  (+ .swarm/backlog.json, conductor's own)
    dependencies key present: False | devDependencies: False   -> zero-dep non-goal intact

  [C5 the false figures are gone repo-wide, not just at the two known sites]
    grep -rn '29\.339\|29\.775' README.md REPORT.md test/ src/ bin/  ->  exit 1, no hits

  [C6 the replacement prose is self-consistent -- I re-did its arithmetic]
    REPORT.md now claims a "13.2h spread": (29.826448 - 29.274361) * 24 = 13.25 h  -> correct.
    The old row's "10.5h" was also self-consistent with the old (false) figures -- so the builder
    recomputed the derived number rather than leaving a stale one behind, which is the failure
    mode this check existed to catch.
    Both files name window 1990-2060: True. Both name count 864: True.
    Either file still says "the real physical range": False.

  GATE VERDICT: T-123 PASS -> done. 0 failed, 0 reverted, 0 blocked.

wave autotune: wave was CLEAN (zero reverts, zero failed verifies) -> wave_streak 1 -> 2 -> the
  bump fires but `k_current` is already at the hard max 5, so it is a no-op; streak resets to 0.
  Recorded rather than skipped: the mechanism ran, it simply had nowhere to go. k_current has been
  irrelevant for twenty-seven cycles anyway -- the gear cap of 1 is what actually sizes every wave.

candidate scan residuals -- what the scan found that was NOT built, priced rather than dropped:
  - T-124 FILED (priority 4, todo). README.md:172's neighbouring bullet, "new->full interval over
    36 lunations spans 13.942-15.576 days", has the same unwindowed shape. Conductor-measured
    before filing, not assumed by analogy (runs/c27-next-candidate.js): over 1990-2060, 865
    intervals span 13.906-15.613 d and 55 of 865 (6.4%) fall outside the stated band; even the
    first 36 lunations from 1990 give 13.929-15.604. Priced BELOW T-123 on purpose because this
    claim at least names a sample size, so it is not sold as a physical constant. Not folded into
    T-123 mid-flight -- widening a verified brief is how scope creep enters.
  - KI-8 OPENED (low). package.json declares "license": "MIT", "private": false, and there is no
    LICENSE file at the repo root. Deliberately NOT fixed: the MIT text needs a copyright line
    naming a legal person, which is the repo owner's call and not one a build agent or the
    conductor may invent. Inventing a holder would be precisely the doc-honesty failure this run
    exists to remove. What would settle it is written into the KI entry.
  - Method ambiguity, noted and NOT actioned. The builder cross-checked its measurement with a
    second method (bisecting the ch. 48 elongation zero rather than the ch. 49 age discontinuity)
    and got 29.2867/29.8145 -- a different pair, expected, because those are the two different
    series KI-7 is about. The new test comment names ch. 49; the README bullet does not name a
    series. Judged a marginal residual and left: the Accuracy section already establishes which
    series does what, and re-opening a just-verified sentence to add a clause fails the ratchet's
    second question. Recorded so it is a decision, not an oversight.
  - Sweeps 1 (untested surfaces), 4 (hostile-input error paths: unknown flags, attached values,
    positional args, `--`, conflicting --north/--south, all exit codes) and 5 (ideas ledger)
    returned NO FINDINGS. Reported as a result. An empty sweep is evidence about the repo.
  - T-116 (British spellings) unchanged and still not built: ratchet-rejected for the fifth
    consecutive cycle, on the same reasoning recorded at cycles 20-22 and 25.

WRAP_UP CARRY -- do not lose this: REPORT.md is REGENERATED from templates/REPORT.template.md at
  wrap-up (cycle.md WRAP_UP step 3). The corrected figures 29.274-29.826 / 864 lunations /
  1990-2060 / "13.2h spread" MUST survive that regeneration. A wrap-up that re-emits the old
  29.339-29.775 row would silently reinstate the exact defect this cycle removed, and the test
  would NOT catch it -- the test pins README.md and the test constants, and REPORT.md only by the
  comment tying the three together. This is the one place the new gate does not reach.

DONE-DECLARATION STATUS: still open, and now on better footing than it was. The scan the handoff
  asked for has been RUN, so the second conjunct of the DONE rule is no longer an unexamined
  premise -- it produced two candidates in one pass. Two todo items remain (T-124 passing the
  ratchet, T-116 failing it), so the target is plainly not done tonight.

next: cycle 28 builds T-124 -- the brief is already written into its backlog notes, the window is
  fixed at 1990-2060 for reproducibility, and the gate will be the same shape as T-123's
  (conductor-measured figures compared against the test's documented constants, plus a mutation
  pass to prove the new assertion can fail). The one design decision left for the builder is
  whether to fold the new->full pin into the existing lunation test or add a second -- prefer
  folding if it keeps the runtime near 1 s, since the scan work is shared.
next wakeup: 1786754055 (+90s)
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786753965, "next_wakeup_at": 1786756665, "pid": 175323, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786753965, "last_real_probe_ts": 0, "probe_failures": 27, "probe_note": "cycle 27: bin/swarm-budget.sh refused again -> probe_failures 27, in BOTH the /opt absolute and the bare-relative form. last_real_probe_ts stays 0 (a refused invocation is not a probe), so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. NEW DATUM, and it revises cycle 26's reading: bin/swarm-notify.sh poll SUCCEEDED this cycle when invoked bare-relative with cwd=/opt/swarm. That is exactly what KI-2's cycle-23 root cause predicts (notify.sh is allow-listed in relative form only; budget.sh is absent from the list in every form), so cycle 26's refusal was an invocation-form artifact and not a widening of the gap. KI-2 stands unchanged as a two-line settings fix for the next kickoff. Gear rests on runs/allocator.json (source=probe, refreshed this cycle): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 36.35, opus_used_pct=96, weekly_used_pct 72.0, week_elapsed_pct 68.62->68.78, dial 0.30. weekly_heat 1.047 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.396 > 1.2 keeps promote blocked. Binding for twenty-seven straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is AFTER stop_at 1786807947, so gear 1 is structural for the remaining 14.9h.", "weekly": {"ok": true, "weekly_used_pct": 72.0, "opus_used_pct": 96, "week_elapsed_pct": 68.78, "weekly_heat": 1.047, "opus_heat": 1.396, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 1, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 28 | 2026-08-15T01:05:30+00:00 | moon | VALUE_LOOP
work: build-wave [T-124] k=1 at sonnet -- the second and last unwindowed-figure claim in the
  shipped docs, filed and conductor-measured at cycle 27 with the brief already written into its
  backlog notes. Chosen over T-116 (British spellings, priority 9) which fails the value ratchet
  for the sixth consecutive cycle on the reasoning recorded at cycles 20-22, 25 and 27.
workflow: DIRECT Agent call, no branch -> .swarm/runs/cycle-028-build-wave.json | models: T-124
  sonnet (attempt 1; gear 1 sets demote=true but build/fix never drops below sonnet)
gear: 1 | allocator trickle (allow_premium_pct 0, allow_overall_pct 0, dial 0.30), guest mode
  clamps 1-3 | k_cap 1 | probe: bin/swarm-budget.sh REFUSED a 28th time, so rho / tokens-per-hour /
  projected depletion are UNKNOWN and are not estimated; bin/swarm-notify.sh poll succeeded in the
  same bare-relative form, which keeps KI-2's root cause (allowlist carries notify.sh, not
  budget.sh) as the standing explanation. governor disengaged (weekly_heat 1.043 < 1.1);
  promote blocked (opus_heat 1.391 > 1.2).
control: poll OK, pending[] empty, inject[] empty -- no commands, no injections this cycle.

VERIFICATION EVIDENCE:

  T-124 check 1 of 4 (authored at verification time) -- INDEPENDENT conductor re-measurement on a
  DIFFERENT scan grid from the test's (3h coarse step + fixed 60-iteration bisection, vs the test's
  6h step + millisecond-convergence bisection). Same definition, different implementation, so
  agreement rules out a grid artifact.
    $ node .swarm/runs/cycle-028-conductor-measure.js
      window            1990-01-01 .. 2060-01-01 (3h grid, 60-iter bisection)
      new moons found   865
      new->full count   865
      new->full min     13.906013 -> 3dp 13.906
      new->full max     15.612781 -> 3dp 15.613
      new->full mean    14.764652 -> 3dp 14.765
      half-synodic      14.765294
      lunation count    864
      lunation min/max  29.274 29.826
    Three-way agreement (README:173-175 / REPORT.md:37 / test constants 13.906, 15.613, 14.765,
    count 865): TRUE on every figure. The last two lines also re-derive the NEIGHBOURING cycle-27
    lunation claim: 864 lunations, 29.274-29.826 -- unchanged, so T-124 did not disturb the line
    above it.  PASS

  T-124 check 2 of 4 -- MUTATION LIVENESS. Each mutation applied to a saved copy, suite run, file
  restored and re-hashed. A mutation that stayed green would mean a vacuous assertion.
    $ python3 .swarm/runs/cycle-028-mutate.py   (full output: .swarm/runs/cycle-028-mutation-out.txt)
      M1 test-const: new->full MIN 13.906 -> 13.916          -> exit 1  RED (assertion is live)
      M2 test-const: new->full MAX 15.613 -> 15.603          -> exit 1  RED (assertion is live)
      M3 test-const: new->full MEAN 14.765 -> 14.760         -> exit 1  RED (assertion is live)
      M4 test-const: interval COUNT 865 -> 864               -> exit 1  RED (assertion is live)
      M5 SOURCE drift: nextFullMoon k+0.5 -> k+0.5001        -> exit 1  RED (assertion is live)
      restore byte-identical: True (all five)
      final unmutated suite: exit 0
    M5 is the decisive one -- see the cycle-28 decision entry. Constant mutations prove the
    comparison is live; only the source mutation proves the pinned figures are actually produced by
    the ch.49 machinery under test rather than by some degenerate path.  PASS

  T-124 check 3 of 4 -- STALE-FIGURE SWEEP. A partial fix that leaves the old numbers somewhere
  else in the repo is the failure mode this check exists to catch.
    $ grep -rn "13.942\|15.576\|36 lunations\|14.764" --include=*.md --include=*.js --include=*.json .
      (zero hits outside .swarm/)  PASS

  T-124 check 4 of 4 -- HEDGE PARITY (the cycle-7 mechanised check, reapplied). Extract the hedge
  vocabulary present in the test comment and check it survived into the prose:
    test/astro.test.js:403-406  "This SAMPLES that window -- not exhaustively, and not a physical
                                 bound"
    README.md:174-175           "a lower bound from that window, not the physical range"
    REPORT.md:37                "a lower bound from that window, not the physical range"
    Prose denies a physical bound in both documents, matching both the test and the neighbouring
    already-fixed bullet. No "confirmed"/"guaranteed"/"the real range" anywhere in the added text.
    PASS

  test_cmd (conductor-run, full suite, not the mutation harness's single file):
    $ node --test test/*.test.js
      tests 115 | pass 115 | fail 0 | duration_ms 2038.0   PASS

  Scope check: $ git diff --stat -> README.md 5 +++--, REPORT.md 2 +-, test/astro.test.js 49
    +++---. src/ untouched, package.json untouched, no scratch files left in the repo.  PASS

  GATE VERDICT: T-124 PASS -> done. 0 failed, 0 reverted, 0 blocked.

wave autotune: wave CLEAN (zero reverts, zero failed verifies) -> wave_streak 0 -> 1. No bump
  fires this cycle (bump needs 2), and k_current is at the hard max 5 in any case. The gear cap of
  1 is what has sized every wave for twenty-eight cycles.

what this cycle actually bought, stated plainly: the run's two shipped documents no longer contain
  a factual claim that this implementation contradicts. Both defects had the same shape -- a
  measured figure whose SCOPE was lost in the write-up while the number was kept, leaving an
  unreproducible range under a heading that endorses it. Both are now pinned by assertions that go
  red if the docs drift OR if the math drifts. That is a real, if small, change in what the repo
  promises: the "Independently checked properties" list and the VERIFIED table are, for the first
  time, machine-checked line by line rather than checked once and remembered.

DONE-DECLARATION STATUS: closer, and deliberately NOT declared this cycle. After T-124 the backlog
  has exactly one todo item (T-116) and it fails the ratchet. But cycle.md's DONE rule has two
  conjuncts, and the second -- no VALUE_LOOP candidate passes the ratchet -- may only be settled by
  a scan run in the cycle that declares it. The scan I have is cycle 27's, and it found two
  candidates, one of which I have just built. Declaring DONE on a stale scan would be exactly the
  "rendered pass that wasn't run" WRAP_UP forbids. 14.5h remain, which is ample.

next: cycle 29 runs a fresh VALUE_LOOP candidate scan (haiku, gear-1-priced) across the surfaces
  cycle 27 swept plus the two it did not reach -- the CONTRACTS.md/README agreement, and the
  ideas-ledger. If it returns nothing that passes the two-question ratchet, cycle 29 or 30 declares
  the target DONE with the scan as evidence. If it returns a candidate, build it at k=1.

WRAP_UP CARRY -- do not lose this, and it is now WIDER than cycle 27 left it: REPORT.md is
  REGENERATED from templates/REPORT.template.md at wrap-up (cycle.md WRAP_UP step 3). TWO rows in
  its VERIFIED table now carry conductor-measured figures that a regeneration would silently
  revert -- the lunation row (29.274-29.826 / 864 lunations / 1990-2060 / 13.2h spread, cycle 27)
  and the new->full row (13.906-15.613 / 865 intervals / 1990-2060 / mean 14.765, cycle 28, claim
  column renamed from "Two independent searches agree"). The test pins README.md and the test
  constants; it does NOT pin REPORT.md. This is the one place the new gates do not reach, and it is
  now two rows rather than one.

KI-8 (no LICENSE file, package.json declares MIT) remains open and deliberately unfixed: the MIT
  text needs a copyright line naming a legal person, which is the repo owner's call. Unchanged
  from cycle 27; restated so a wrap-up reading only the last block still sees it.
commit: 62b80ab (pushed to origin/main: e4a8dbc..62b80ab). This line is stamped by the
  addendum commit that follows it -- the hash cannot be known before the commit exists.
next wakeup: 1786756117 (+90s -- verified-value cycle takes the base delay; the VPS pacer, not ScheduleWakeup, is what fires it)
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786756027, "next_wakeup_at": 1786756117, "pid": 181559, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786755882, "last_real_probe_ts": 0, "probe_failures": 28, "probe_note": "cycle 28: bin/swarm-budget.sh refused a 28th time (bare-relative form, cwd=/opt/swarm) -> probe_failures 28. last_real_probe_ts stays 0: a refused invocation is not a probe, so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. Consistent with KI-2's cycle-23 root cause and cycle 27's finding -- bin/swarm-notify.sh poll SUCCEEDED again this cycle in the same bare-relative form, so the settings allowlist carries notify.sh and not budget.sh; the gap is unchanged, not widening. KI-2 remains a two-line settings fix for the next kickoff (hard rule 5 forbids the edit mid-run). Gear rests on runs/allocator.json (source=probe, refreshed 00:56Z): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 36.17, opus_used_pct=96, weekly_used_pct 72.0, week_elapsed_pct 68.78->69.01, dial 0.30. weekly_heat 1.043 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.391 > 1.2 keeps promote blocked. Binding for twenty-eight straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the remaining 14.5h.", "weekly": {"ok": true, "weekly_used_pct": 72.0, "opus_used_pct": 96, "week_elapsed_pct": 69.01, "weekly_heat": 1.043, "opus_heat": 1.391, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 2, "artifact": {"file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 29 | 2026-08-15T01:28:27+00:00 | moon | VALUE_LOOP
work: VALUE_LOOP candidate scan (the fresh scan cycle 28's handoff required before any DONE
  declaration) over six surfaces, then build-wave [T-125] k=1 at haiku. The scan returned a
  ratchet-passing candidate, so this is the handoff's second branch, not its first: .swarm/
  CONTRACTS.md declared export lists and a parseArgs signature the code no longer matches, and
  the contradiction had reached the title of a SHIPPING test.
workflow: DIRECT Agent calls, no branch -> scan + build. Workflow is review-gated in a headless
  -p session (documented failure-table fallback). models: scan haiku (read-only), T-125 haiku
  (docs/S, attempts 0, so the ladder offered no escalation; gear 1 demotes docs anyway).
  craft pack: ran clean, degraded []. T-125 is NOT craft:"ui" -- no .html/.css/.jsx/.tsx/.vue/
  .svelte in files_hint and no UI surface in the title -- so the craft.ui slice was deliberately
  not spliced into the builder brief.
gear: 1 | allocator trickle (allow_premium_pct 0, allow_overall_pct 0, dial 0.30), guest mode
  clamps 1-3 | k_cap 1 | probe: bin/swarm-budget.sh REFUSED a 29th time, so rho / tokens-per-hour
  / projected depletion are UNKNOWN and are not estimated; bin/swarm-notify.sh poll SUCCEEDED in
  the identical bare-relative form, which keeps KI-2's cycle-23 root cause standing unchanged
  (the allowlist carries notify.sh in relative form and carries no entry of any kind for
  budget.sh). governor disengaged (weekly_heat 1.055 < 1.1); promote blocked (opus_heat 1.388).
control: poll OK, pending[] empty, inject[] empty -- no commands, no injections this cycle.

VERIFICATION EVIDENCE:

  T-125 gate -- 30 conductor-authored checks, 0 failed. Full output:
  .swarm/runs/cycle-029-verify-T-125.txt. The gate was written AFTER the builder was
  dispatched and was never shown to it.

    $ python3 .swarm/runs/cycle-029-gate-T-125.py
      C2  every byte of the HEAD file survives as an exact PREFIX of the new file
            HEAD bytes: 3293 | new bytes: 4753   (1460 appended)          PASS
      C5  src/astro.js:363 really is the module.exports line
            module.exports = { computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILL... };
          src/args.js:17 really is the compact registration
            compact: { type: 'boolean' },
          test/args.test.js:87 really is the five-contract-keys test
            test('the returned object has exactly the five contract keys', ...    PASS
      C8  frozen @returns really declares FOUR keys  ['json','hemisphere','block','help']
          parseArgs really returns FIVE              ['json','hemisphere','block','compact','help']
          my parse EQUALS the list the shipping test asserts                      PASS
          the frozen four are a strict SUBSET of the live five
            the difference is exactly: ['compact']                                PASS
      C9  every bare `line NN` self-reference resolves inside the frozen file:
            frozen line 33 -> module.exports = { computeMoon, PHASE_NAMES }
            frozen line 60 -> * @returns {{json:boolean, hemisphere:(...), block:boolean...
            frozen line 67 -> Flags: `--json`, `--south`, `--north`, `--block`, `--help`/`-h`.
          no numeral on added lines lacks a source: []                            PASS
      30 checks, 0 failed
    C2 is the decisive one. The item's whole risk was a builder "tidying" a frozen historical
    record; a byte-prefix assertion settles that mechanically instead of trusting care.

  GATE FAILABILITY -- a gate that only ever passes proves nothing.
    $ python3 .swarm/runs/cycle-029-gate-mutants-T-125.py
      X1 frozen line deleted        RED   correct (must die)
      X2 frozen header reworded     RED   correct (must die)
      X3 test citation dropped      RED   correct (must die)
      X4 one export omitted         RED   correct (must die)
      X5 invented quantity          RED   correct (must die)
      X6 control: cosmetic ws       GREEN correct (control, must survive)
      6 of 6 behaved correctly

  test_cmd (conductor-run, full suite):
    $ node --test test/*.test.js
      tests 115 | pass 115 | fail 0        PASS   (zero shipped bytes changed this cycle)

  SCAN SURFACE 4 -- hostile/edge input, 19 cases run against the REAL binary:
    $ node .swarm/runs/cycle-029-hostile-input.js
      clean: 19  dirty: 0  of 19
    Zero stack traces, zero silent nonzero exits. Contradictory --north/--south is
    last-one-wins, which README.md:77 already documents. Bogus/empty/unset TZ all fall back
    to northern without complaint, which is the documented hemisphere design.

  CANDIDATE REJECTED ON EVIDENCE #1 -- --compact's missing unit test:
    $ python3 .swarm/runs/cycle-029-compact-mutants.py
      M1 compact <- block      args.test.js RED    FULL suite RED
      M2 compact <- json       args.test.js RED    FULL suite RED
      M3 compact pinned true   args.test.js RED    FULL suite RED
      M4 compact pinned false  args.test.js GREEN  FULL suite RED
      survived the FULL suite: none
    The gap in args.test.js is real; the HOLE is not. Adding the test would close no named
    untested surface, which is the churn the spec_digest names as this run's chief risk.

  CANDIDATE REJECTED ON EVIDENCE #2 -- my OWN finding against README, refuted before filing:
    $ node .swarm/runs/cycle-029-anchor-measure.js
      M1 age-discontinuity bisection  : 2000-01-06T18:13:43.349Z   -> rounds to 18:14
      M2 cycleFraction-wrap bisection : 2000-01-06T18:15:22.785Z   -> rounds to 18:15
      M3 illumination-minimum search  : 2000-01-06T18:15:22.789Z   -> rounds to 18:15
      M1-M3 spread (s): -99.440    M2-M3 spread: 0.004 s
    README.md:165 and REPORT.md:34 claim 18:15 UTC. M1 alone would have made that a
    fabrication and I had begun writing it up as one. M2 (the method test/astro.test.js:63-72
    itself uses) and M3 (the ch.48 illumination minimum, a DIFFERENT Meeus series) agree with
    each other to 4 ms and confirm the README. The claim stands; my measurement was wrong.
    Root cause is real and now recorded: `age` (src/astro.js:313, ch.49 instant tables) and
    `cycleFraction` (src/astro.js:303, ch.48 elongation) zero 99.4 s apart -- the KI-7
    two-series split showing up at an ordinary epoch instead of an absurd one.

  GATE VERDICT: T-125 PASS -> done. 0 failed, 0 reverted, 0 blocked.

wave autotune: wave CLEAN (zero reverts, zero failed verifies) -> wave_streak 1 -> 2, so the
  bump fires; but k_current is already at the hard max 5, so it stays 5 and the streak resets
  to 0. No practical effect: min(5, gear cap 1) = 1, as it has been for twenty-nine cycles.

instrument honesty note: TWO defects in my own gate were found and repaired during
  verification, and neither changed the standard. C8 first reported the frozen @returns as
  declaring ZERO keys and parseArgs as returning four -- my regex took the FIRST '@returns' in
  CONTRACTS.md (computeMoon's, not parseArgs'), and required a colon so it dropped the ES6
  shorthand `hemisphere,`. Fourth instance this run of my instrument being narrower than what
  it measures (cycles 8, 9, 19). Every widening was paid for with a stronger assertion: the
  frozen block is now located by anchoring on the '## src/args.js' section, and the live key
  count must EQUAL the list extracted from the shipping test rather than from a regex I chose.
  Separately, my C5 repair (permit-list -> citation resolution) silently removed the
  invented-quantity guard while strengthening the wrong-citation guard; caught while designing
  the failability harness and restored as C9, which the X5 mutant then proved does real work.
  One residual imprecision I am NOT claiming away: C9's `line NN` resolver cannot tell a
  self-reference to CONTRACTS.md from a reference to another file, so it resolved "line 17"
  (which means src/args.js:17) against the frozen file. It passed the in-range check only;
  the real check on line 17 is C5's, which resolved it against src/args.js correctly.

what this cycle actually bought, stated plainly: the repo no longer contains a document that
  claims authority over code it describes incorrectly -- and it bought that WITHOUT falsifying
  the historical record, which was the whole difficulty. Equally, and worth as much: two
  candidate defects were killed by measurement before they became work. One was a test nobody
  needed; the other was a false accusation against a true claim, which I had already started
  writing up. On a run whose thesis is that prose must track code, filing a fabricated defect
  against an honest README would have been the worst available outcome.

DONE-DECLARATION STATUS: not declared, and this time the scan is the reason rather than the
  obstacle. Cycle 28's handoff allowed exactly two outcomes; the scan found a ratchet-passing
  candidate, so branch two fired and it was built. Five of six surfaces came back clean under
  conductor re-verification. What remains on the backlog is T-116 and T-126, both
  ratchet-rejected cosmetics with their rulings recorded.

next: cycle 30 is a `cycle % 5 == 0` cycle, so it owes a full SPEC.md re-read plus backlog
  hygiene (cycle.md step 3) before picking work. That re-read is the right moment to settle
  DONE: the definition-of-done was verified clause-by-clause at cycle 23 and nothing since has
  touched it, so if a candidate scan at cycle 30 also comes back with nothing that passes the
  ratchet, the second conjunct is met on a FRESH scan and the target can be declared done with
  both halves evidenced. If it finds a candidate, build it at k=1.

WRAP_UP CARRY -- unchanged from cycle 28 and still the one gap the new gates do not reach:
  REPORT.md is REGENERATED from templates/REPORT.template.md at wrap-up (cycle.md WRAP_UP step
  3). TWO rows of its VERIFIED table carry conductor-measured figures a regeneration would
  silently revert -- the lunation row (29.274-29.826 / 864 lunations / 1990-2060, cycle 27) and
  the new->full row (13.906-15.613 / 865 intervals / mean 14.765, cycle 28, claim column
  renamed). The tests pin README.md and the test constants; they do NOT pin REPORT.md.

KI-8 (no LICENSE file, package.json declares MIT with private:false) remains open and
  deliberately unfixed: the MIT text needs a copyright line naming a legal person, which is the
  repo owner's call and not one a build agent or the conductor may invent. Restated so a
  wrap-up reading only the last block still sees it.
commit: 024bb5b (pushed to origin/main: 7e9c964..024bb5b) (stamped by the addendum commit that follows -- the hash cannot be known
  before the commit exists).
next wakeup: 1786757397 (+90s, verified-value cycle takes the base delay; the VPS pacer, not
  ScheduleWakeup, is what fires it)
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786757307, "next_wakeup_at": 1786757397, "pid": 184311, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786756438, "last_real_probe_ts": 0, "probe_failures": 29, "probe_note": "cycle 29: bin/swarm-budget.sh refused a 29th time (bare-relative form, cwd=/opt/swarm) -> probe_failures 29. last_real_probe_ts stays 0: a refused invocation is not a probe, so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. bin/swarm-notify.sh poll SUCCEEDED again this cycle in the identical bare-relative form, which keeps KI-2's cycle-23 root cause standing unchanged: the settings allowlist carries notify.sh (relative form) and carries no entry of any kind for budget.sh. Two-line settings fix for the next kickoff; hard rule 5 forbids the edit mid-run. Gear rests on runs/allocator.json (source=probe, refreshed 01:0xZ): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 36.05, opus_used_pct=96, weekly_used_pct 72.0->73.0, week_elapsed_pct 69.01->69.17, dial 0.30. weekly_heat 1.055 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.388 > 1.2 keeps promote blocked. Binding for twenty-nine straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the remaining 14.3h.", "weekly": {"ok": true, "weekly_used_pct": 73.0, "opus_used_pct": 96, "week_elapsed_pct": 69.17, "weekly_heat": 1.055, "opus_heat": 1.388, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 3, "artifact": {"file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 30 | 2026-08-15T01:44:14+00:00 | moon | VALUE_LOOP
work: VALUE_LOOP candidate scan (cycle 27's and 29's standing requirement: a fresh scan before any
  DONE declaration), then build-wave [T-127] k=1 at sonnet. The scan asked one question -- is any
  surface NAMED in the spec's must-have list still uncovered -- and `--json field stability`, named
  verbatim in the test-hardening must-have, was the one that was. bin/moon.js advertises the payload
  as "structured output for scripting (stable, documented below)"; that stability claim was
  prose-only across a 115-test suite. The field set is written down in THREE places (the HELP
  string's `--json fields` block, README's field table, README's fenced json example) and nothing
  read any of them. The pre-existing cli.test.js check asserted a HARDCODED list of nine names was
  PRESENT in the payload: one-directional, so an extra field sails past, and blind to both documents.
  Cycle 30 is a %5 cycle: full SPEC.md re-read done at step 3, backlog hygiene folded in below.
workflow: DIRECT Agent call, working tree, no branch. Workflow is review-gated in a headless -p
  session (documented failure-table fallback). model: T-127 sonnet -- kind fix / effort S routes to
  sonnet by the table, attempts 0 so the ladder offered no escalation, and gear 1's demotion rung
  explicitly never drops build/fix below sonnet. craft pack: ran clean, degraded []. T-127 is NOT
  craft:"ui" (files_hint is test/cli.test.js; no UI surface in the title), so the craft.ui slice was
  deliberately not spliced into the builder brief.
gear: 1 | allocator trickle (allow_premium_pct 0, allow_overall_pct 0, dial 0.30), guest mode clamps
  1-3 | k_cap 1 | effective wave = min(k_current 5, gear cap 1, hard max 5) = 1 | probe: REFUSED a
  30th time, and this cycle in THREE forms -- bare-relative, absolute-path, and the documented
  `PROBE_CMD=false` clock-cruise fallback. The third is new KI-2 evidence and is the sharper half:
  cycle.md routes >=3 probe failures to that fallback as the zero-cost substitute, and the substitute
  is itself unreachable under this allowlist (the env-var prefix reads as a distinct, unmatched
  command pattern), so the documented degradation path has no exit. rho / tokens-per-hour / projected
  depletion remain UNKNOWN and are NOT estimated. bin/swarm-notify.sh poll SUCCEEDED again in the
  bare-relative form, which keeps the cycle-23 root cause standing: the allowlist carries notify.sh
  and carries no entry of any kind for budget.sh. governor disengaged (weekly_heat 1.052 < 1.1);
  promote blocked (opus_heat 1.383 > 1.2). gear 1 is structural for the remaining 13.8h --
  week_resets_at 1786942799 falls after stop_at 1786807947.
control: poll OK, pending[] empty, inject[] empty -- no commands, no injections this cycle.
orient: tree clean at entry, no salvage needed. HEAD 1c0aeb0.

VERIFICATION EVIDENCE:

  T-127 gate -- a conductor-authored 6-mutant battery, written AFTER the builder was dispatched
  and never shown to it. Every mutant was applied to a file the builder was forbidden to touch,
  the full suite run, then the file restored byte-exact. Full output:
  .swarm/runs/cycle-030-verify-T-127.txt; harness: .swarm/runs/cycle-030-gate-T-127.py.
  Exit codes captured from the process object, never through a pipe (L-010).

    $ python3 .swarm/runs/cycle-030-gate-T-127.py
      === BASELINE ===            exit 0    tests 117  pass 117  fail 0
      M1 extra payload key not in any doc                 exit 1  BITES
          AssertionError: HELP --json fields block disagrees with the actual payload keys
      M2 HELP fields block loses the 'age' entry          exit 1  BITES
          AssertionError: HELP --json fields block disagrees with the actual payload keys
      M3 README table loses the cycleFraction row         exit 1  BITES
          AssertionError: README field table disagrees with the actual payload keys
      M4 README example renames julianDay                 exit 1  BITES
          AssertionError: README fenced json example disagrees with the actual payload keys
      M5 HELP section header renamed (anti-vacuity)       exit 1  BITES
          AssertionError: HELP text has no --json fields section to parse
      M6 payload+HELP renamed, README left stale          exit 1  BITES
          AssertionError: README field table disagrees with the actual payload keys
      === RESTORE ===   test/cli.test.js | 76 +++++  (1 file changed, 76 insertions)
      === POST-GATE SUITE === exit 0   tests 117  pass 117  fail 0

  M6 is the mutant that decides the item, and it was designed to be the one the builder could
  not have anticipated: it renames `age` -> `moonAge` in BOTH the payload and the HELP entry
  while leaving README stale. A test that merely compares the payload against a restatement of
  itself passes M6 clean. This one failed on the README table -- and, decisively, the HELP
  assertion (which the test evaluates FIRST, so it would have surfaced first had it fired)
  PASSED. That is the discriminator: the test provably reads each document, rather than
  comparing the payload to a fourth hardcoded copy of its own key list.
  M5 is the anti-vacuity check: renaming the HELP section header makes the parser find nothing,
  and a parser that quietly returns [] and then finds two empty sets equal would be worse than
  no test. It errored instead, on the non-empty guard AND on the comparison.
  RESTORE is proven, not asserted: after the battery, `git diff --stat` in the target shows
  test/cli.test.js as the ONLY changed file at +76/-0, so bin/moon.js and README.md are
  byte-identical to HEAD despite four mutants having been written into them.

  Independent of the mutants, the diff was read: the two new tests parse the names out of
  bin/moon.js's exported HELP and out of README.md at test time. No literal field array was
  introduced. The HELP parser anchors on exactly-two-leading-spaces, which is what keeps the
  phaseAngle CAUTION continuation (indented to the 16-column description gutter) from being
  read as a field name.

  collision-scan: NOT RUN, and not applicable -- the standing browser-target gate check keys on
  classic non-module scripts served to a browser. moon is a stdout Node CLI with no html/css/
  client-js/template/static asset anywhere in the repo. Reported as not-run, never as passed.
  qa-verify look pass: same reason, not dispatched -- no merged file is user-visible in the
  browser sense the heuristic names.

gate: T-127 PASS -> done. Zero merges (working tree, no branch), zero reverts, zero failed verifies.
wave autotune: clean k=1 wave -> wave_streak 0 -> 1. k_current unchanged at 5; it would bump at
  streak 2, and would change nothing while gear 1 caps the effective wave at 1 anyway.
hygiene (cycle %5): backlog now 28 items, 26 done / 2 todo / 0 blocked -- far under the ~30 live cap,
  no dedupe or drop warranted. The two survivors were re-examined against the ratchet rather than
  re-listed: T-116 (British 'colour' / '## Licence' heading, priority 9) and T-126 (a drift note
  citing src/args.js:15, a comment line, where the same sentence already names the correct line 17)
  both stay REJECTED and both stay todo rather than `dropped`, on the cycle-21 reasoning: a human may
  still want them, and an empty queue is not an argument for building what the ratchet refuses.
  T-127 outranked both on the only axis that matters here -- it converts an explicit stability claim
  into a machine check, which is the run's stated purpose, whereas both survivors are cosmetic.
DONE-declaration check: NOT yet. The definition of done is met and the suite is green, but this
  cycle's scan found a ratchet-PASSING candidate on its first look, which is direct evidence the
  candidate space is not yet exhausted. A DONE declaration needs a scan that comes back empty; this
  one did not. The standing handoff requirement carries to cycle 31 unchanged.
known-issues: unchanged (KI-2 medium, KI-4 low, KI-5 medium, KI-7 low, KI-8 low). KI-2 gained the
  new evidence recorded under `gear` above. KI-8 (no LICENSE file while package.json declares MIT
  with private:false) remains open and deliberately unfixed: the MIT text needs a copyright line
  naming a legal person, which is the repo owner's call and not one a build agent or the conductor
  may invent.
CI: green on GitHub Actions for every cycle-25..29 push (gh run list, 8/8 success, node 20 and 22
  matrix). Checked this cycle because the SPEC lists CI as a nice-to-have and the conductor wanted
  the claim to rest on the actual run history rather than on the workflow file's existence.
commit: e05768e (pushed to origin/main: 1c0aeb0..e05768e)
next wakeup: 1786758676 = 2026-08-15T01:51:16Z (+90s; a verified-value cycle takes the base
  delay, and the VPS pacer -- not ScheduleWakeup -- is what fires it). RESYNCED by this
  addendum: the block first carried 1786758444, pre-computed before the dashboard render, and
  that instant had already elapsed by the time the render ran. The runfile and both dashboard
  staleness slots now carry the resynced value. Clamp checked: 1786758676 + 900 <= stop_at
  1786807947, with 13.7h of run left.
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786758586, "next_wakeup_at": 1786758676, "pid": 192344, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786758254, "last_real_probe_ts": 0, "probe_failures": 30, "probe_note": "cycle 30: bin/swarm-budget.sh refused a 30th time -- and this cycle refused in BOTH the bare-relative form and the absolute-path form, and additionally refused the documented PROBE_CMD=false clock-cruise fallback (the env-var prefix makes it a distinct, unmatched command pattern). That last point is new evidence for KI-2: cycle.md's >=3-failures rule routes to `PROBE_CMD=false bin/swarm-budget.sh` as the zero-cost substitute, and that substitute is ITSELF unreachable under this allowlist, so the documented degradation path has no exit. last_real_probe_ts stays 0: a refused invocation is not a probe, so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. Gear rests on runs/allocator.json (source=probe, refreshed 01:35:47Z by the pacer): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 35.87, opus_used_pct=96, weekly_used_pct 73.0, week_elapsed_pct 69.17->69.40, dial 0.30. weekly_heat 1.052 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.383 > 1.2 keeps promote blocked. Binding for thirty straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the remaining 13.8h.", "weekly": {"ok": true, "weekly_used_pct": 73.0, "opus_used_pct": 96, "week_elapsed_pct": 69.4, "weekly_heat": 1.052, "opus_heat": 1.383, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 4, "artifact": {"file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

### cycle 30 addendum | step 8 dashboard

Two live defects fixed in runs/dashboard.html (SWARM-side, and inside the hard-rule-5 fence:
runs/ is writable during a run, SKILL.md / reference/ / workflows/ / templates/ / bin/ are not).

DEFECT A -- data-expected, and the visible "next" div, carried a PARAGRAPH OF PROSE instead of an
  instant. The inline staleness script does Date.parse() on both data attributes and returns early
  on NaN, so the STALE banner could not fire under any circumstance. The dashboard was structurally
  incapable of admitting it had stopped tracking the run -- it failed silent while looking healthy,
  which for an observability surface is the worst available failure mode. Both slots now hold
  parseable instants.

  THIS IS A RECURRENCE, and that is the more interesting half. Cycle 22 already found and fixed
  this exact defect -- its commit subject reads "dashboard data-expected carried prose, not a
  timestamp, so the stale banner was dead". It came back by cycle 29. The cause is structural: each
  cycle hand-writes its own substitution script, so no invariant survives from one render to the
  next, and any cycle that substitutes the wrong slot silently re-breaks it.

DEFECT B -- the root cause of A, and newly diagnosed. The template's placeholder LEGEND at the top
  of the file (an HTML comment documenting what each slot should look like) has been overwritten
  with live values, because earlier renders substituted GLOBALLY. That is how prose reached the
  next-wakeup slot: one cycle's narrative was written into every copy of the placeholder, the
  legend included, after which the legend no longer taught the correct shape and the next render
  had nothing to check itself against. Fixed structurally, not cosmetically: every substitution in
  runs/cycle-030-dash.py is confined to the LIVE region (after </style>, outside every HTML
  comment), so the legend and the CSS examples are now unreachable from a render. The
  already-corrupted legend TEXT is deliberately left as-is -- restoring it is a change to the
  template's content, and templates/ is fenced during a run. Flagged for the morning report.

STANDING GATE -- runs/dashboard-check.py, new this cycle, is the carrier the per-cycle scripts
  never had: it asserts both staleness slots parse as instants, that expected is AFTER generated,
  that the visible meta divs agree with the attributes a reader cannot see, that the banner's cycle
  number matches state.json, and that step 8's required evidence + burn-up blocks are actually
  emitted. Future cycles should run it after rendering. It earned its keep on its first run by
  FAILING this cycle's own render (C3: the +90s wakeup I pre-computed for the journal had already
  elapsed by the time the render finished, leaving expected BEFORE generated). Resynced, re-run,
  PASS. A gate that passes the first thing it is pointed at has not been tested; this one was.

TEMPLATE GAP CLOSED -- cycle.md step 8 requires every target section to carry the
  verification-evidence block and the burn-up strip. The stylesheet has defined .evidence and
  .burnup since cycle 0; no render had ever emitted either. Both are now rendered, with the burn-up
  series derived from the target's own commit subjects rather than hand-typed.

  Its number is stated rather than reconciled: the series sums to 24 while backlog.json shows 26
  done. The gap is fully explained -- T-117 (cycle 21) and T-118 (cycle 22) committed as "live CI
  evidence pending" rather than with a verified count, because their evidence was a GitHub Actions
  run that had not finished at commit time, and both were verified in the following cycle. The
  strip's title says exactly this. Quietly adding 2 to make the two numbers agree would have been
  the same class of move this run has spent thirty cycles removing from the docs.

notifications: none emitted. Phase unchanged (VALUE_LOOP -> VALUE_LOOP), no target became stalled,
  publish_failures still 0. Artifact publish: not attempted -- the Artifact tool does not exist in a
  headless -p session, which step 8 says is a silent skip and not a publish failure. On the VPS the
  local file write IS the publication.

## cycle 31 | 2026-08-15T02:12:11+00:00 | moon | VALUE_LOOP
work: VALUE_LOOP candidate scan (cycle 30's standing requirement: a DONE declaration needs a scan
  that comes back EMPTY), then build-wave [T-128] k=1 at sonnet. The scan probed FOUR surfaces and
  three came back already-closed by earlier cycles -- that hit rate is the number worth recording,
  not the one item found. Each rejection was MEASURED, not recalled:
  (a) HEMISPHERE TABLE vs the IANA reference latitudes. src/hemisphere.js is the largest hand-typed
      data structure in the repo (6 prefixes, 85 southern zones, 1 northern carve-out) and its
      header claims it was "compiled from the reference coordinates the IANA tz database publishes".
      Already closed: test/hemisphere.test.js:327 cross-checks it against /usr/share/zoneinfo.
      Re-verified independently anyway (.swarm/runs/cycle-031-tzoracle.mjs, -tzoracle2.mjs):
      418/418 canonical zones agree; reverse direction 0 mismatches and 0 dead table entries; the
      only real zone sitting north under a southern prefix (Indian/Maldives, +4.167) is correctly
      carved out; 5 of the hardcoded legacy aliases resolve through Intl to a tab zone and match,
      7 (the Argentina backward links and Pacific/Enderbury) are unreachable from zone.tab and
      remain hand-verified only.
  (b) PROCESS-LEVEL SURFACES: an early-closed stdout pipe and the exit-code matrix
      (.swarm/runs/cycle-031-epipe.mjs). No EPIPE crash in any of five piped modes -- the payload
      fits the pipe buffer, so the write lands before the reader closes -- and eight probed
      invocations exit 0/0/0/0/2/2/2/0 exactly as documented. Nothing to fix.
  (c) The next-full-moon line's YEAR-SUPPRESSION branch in bin/moon.js, which is only reachable in
      late December and whose leading pad has a recorded past regression. Already pinned in BOTH
      directions by T-106 in test/regressions.test.js, under a faked clock. Nothing to add.
  (d) THE HIT -- the FLAG table. Direct sibling of cycle 30's T-127, which pinned the --json FIELD
      names across three documents and left the flag set itself unpinned. src/args.js registers the
      accepted options in `const OPTIONS`; the same set is restated in bin/moon.js's HELP `options`
      block and in README's `## Options` table, and nothing checked any edge. The only existing
      check, cli.test.js:178, asserted a HARDCODED six-name literal was PRESENT in --help output:
      one-directional and blind to src/args.js entirely, so removing --compact from OPTIONS kept the
      suite green while both documents went stale. README's Options table had never been read by any
      test at all. Second half: src/args.js:5-8 asserted the table is kept there "so the help text
      and the parser can never drift apart" -- a guarantee the code does not provide, since HELP is
      an unrelated string literal in another file. A false claim about verification, in a run whose
      whole premise is replacing prose-only claims with machine-checked ones.
  RATCHET: passes both questions where the two backlog survivors still fail. Q1 the audience is "the
  next person to change this code" and today drift there ships a flag documented in two places and
  accepted in neither. Q2 it is a standing gate, not a one-time cleanup.
workflow: DIRECT Agent call, working tree, no branch (Workflow is review-gated in a headless -p
  session -- the documented failure-table fallback). model: sonnet. kind fix / effort S routes to
  sonnet by the table; attempts 0 so the ladder offered no escalation; gear 1's demotion rung never
  drops build/fix below sonnet. craft pack ran clean, degraded []. NOT craft:"ui" -- files_hint is
  test/cli.test.js + src/args.js, no UI surface -- so craft.ui was deliberately not spliced in.
gear: 1 | allocator trickle (allow_premium_pct 0, allow_overall_pct 0, dial 0.30), guest mode clamps
  1-3 | k_cap 1 | effective wave = min(k_current 5, gear cap 1, hard max 5) = 1 | probe: bin/swarm-budget.sh
  REFUSED a 31st time. rho, tokens/hour and projected depletion stay UNKNOWN and are never estimated;
  last_real_probe_ts stays 0 because a refused invocation is not a probe. Gear rests on
  runs/allocator.json (source=probe): posture trickle, week_elapsed_pct 69.61, weekly_used_pct 73.0
  -> weekly_heat 1.049 < 1.1, governor disengaged, ceiling 5; opus_used_pct 96 -> opus_heat 1.379
  > 1.2, promote stays blocked. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is
  structural for the rest of the run.
  NEW KI-2 EVIDENCE, and it CONTRADICTS part of cycle 21's entry: `bin/swarm-notify.sh poll` SUCCEEDED
  this cycle, invoked bare-relative with cwd=/opt/swarm. Cycle 23 pinned the root cause as an
  allowlist that carries the relative and macOS-absolute forms of notify.sh but no /opt form and no
  swarm-budget.sh entry of any kind; this cycle is a clean positive confirmation of the notify.sh
  half of that diagnosis. The control channel was therefore read through its real path, not off disk.
control: poll ok; runs/control.json pending [] and inject [] -- nothing to apply, nothing to triage,
  no control-ack push warranted.
re-anchor: cycle 31, 31 % 5 != 0, so no full SPEC re-read or backlog hygiene pass this cycle
  (cycle 30 did both; backlog is 29 items, well under the ~30 live cap).

VERIFICATION EVIDENCE (T-128) -- full output .swarm/runs/cycle-031-verify-T-128.txt

      === BASELINE (unmutated builder diff) === exit=0
      M1 add flag to OPTIONS, docs stale ............. exit 1  BITES
      M2 remove flag from OPTIONS, docs advertise it .. exit 1  BITES
      M3 README row deleted only ..................... exit 1  BITES
      M4 HELP line deleted only ...................... exit 1  BITES
      M5 anti-vacuity: HELP header renamed ........... exit 1  BITES
      M6 anti-vacuity: OPTIONS anchor reformatted .... exit 1  BITES
      M7 -h alias dropped from HELP .................. exit 1  BITES
      M8 partial drift: OPTIONS+HELP renamed, README stale  exit 1  BITES
      M9 commented-out decoy entry (must stay GREEN) . exit 0  BITES
      === RESTORE === all 4 mutated files byte-identical to pre-battery; mutants misbehaving: 0
      === POST-GATE SUITE === exit 0   tests 119  pass 119  fail 0

  M8 is the mutant that decides the item, and it is the one the builder could not have anticipated:
  it renames `compact` to `terse` CONSISTENTLY in the two places a lazier gate would compare against
  each other -- OPTIONS and HELP -- leaving only README stale. A gate wired HELP<->README, or one
  that trusted HELP as the source of truth, passes M8 clean. This one failed on the README edge
  specifically. M2 is the direction the replaced hardcoded test was structurally blind to.
  M9 is the false-positive control: a source-text parser that is too eager reads
  `// ghost: { type: 'boolean' },` as a seventh registered flag and goes red on a file whose
  behaviour did not change. It stayed green. A gate shown only to fail has not been shown usable.
  READ HONESTLY: for M2 and M8 the FIRST error line in the run is a pre-existing --compact test
  dying, not the new gate -- both mutants change what the CLI accepts. What settles them is the
  separate check that greps the whole run for a string existing ONLY in the new test's assertion
  messages; both returned true. "exit=1" alone would not have proven the new gate fired, and is
  not claimed to.
  BEHAVIOUR FROZEN, machine-checked rather than eyeballed: src/args.js with comments and whitespace
  stripped is IDENTICAL to HEAD (and the raw files DO differ, so the comment genuinely changed);
  bin/moon.js, README.md and package.json are byte-identical to HEAD. Zero dependencies: the test
  requires only node: builtins plus two in-repo relative paths.
  THE OLD CHECK IS GONE, NOT STACKED: the hardcoded six-name array and its test name are both absent
  (grep -rn 'documents every flag' test/ -> no hits), and its exit-0 half was folded in and
  strengthened -- --help output must now equal the HELP constant byte-for-byte. One loose conductor
  probe ("any literal flag-name array") did fire; followed up rather than waved off, all four hits
  are pre-existing argv invocations like run(['--north', '--compact']), not restatements of the set.
  THREE PARSERS, LIVE OUTPUT: OPTIONS -> json south north block compact help; HELP -> json block
  compact south north help; README -> json block compact south north help. 6/6/6, set-equal.
  The -h alias was handled by DECISION rather than by omission: it is an alternate spelling of
  --help, not a seventh flag, so it is not a set member -- but both document parsers now REQUIRE
  the alias shape on the --help row and assert they saw it (M7 confirms that bites).

  collision-scan: NOT RUN, and not applicable -- the standing browser-target gate keys on classic
  non-module scripts served to a browser; moon is a stdout Node CLI with no html/css/client-js/
  template/static asset anywhere in the repo. Reported as not-run, never as passed.
  qa-verify look pass: same reason, not dispatched.

gate: T-128 PASS -> done. Zero merges (working tree, no branch), zero reverts, zero failed verifies.
wave autotune: clean k=1 wave -> wave_streak 1 -> 2 -> bump fires, but k_current is already at the
  hard max of 5, so it stays 5 and the streak resets to 0. Gear 1 caps the effective wave at 1
  regardless, so this changes nothing operationally.
DONE-declaration check: NOT yet, and the reason is narrower than last cycle's. The definition of
  done is met and the suite is green; the scan again returned a ratchet-passing candidate, so by
  cycle 30's own rule the space is not exhausted. But the cost moved: cycle 30 found its candidate
  on the first look, cycle 31 needed four probes for one hit. If the next scan comes back empty, or
  needs more probes than a cycle can honestly afford, DONE is the correct call rather than a
  concession. The standing handoff requirement carries to cycle 32.
known-issues: unchanged (KI-2 medium, KI-4 low, KI-5 medium, KI-7 low, KI-8 low). KI-2 gained the
  notify.sh positive-confirmation evidence recorded under `gear` above. KI-8 (no LICENSE file while
  package.json declares MIT with private:false) stays open and deliberately unfixed: the MIT text
  needs a copyright line naming a legal person, which is the repo owner's call and not one a build
  agent or the conductor may invent.
backlog: 29 items -- 27 done, 2 todo, 0 blocked. The two survivors (T-116 British 'colour' / '##
  Licence' heading; T-126 a drift note citing a comment line) both stay REJECTED by the ratchet and
  stay `todo` rather than `dropped`, on the cycle-21 reasoning: a human may still want them, and an
  empty queue is not an argument for building what the ratchet refuses.
next wakeup: 1786760184 = 2026-08-15T02:16:24.000Z (+90s base; a verified-value cycle takes
  the base delay, and the VPS pacer -- not ScheduleWakeup -- is what fires it). NO RESYNC WAS NEEDED
  THIS CYCLE, which is the point. runs/cycle-031-dash.py now stamps GEN at render time and DERIVES the
  wakeup from it, then writes that single value into the runfile, the .bak and both dashboard staleness
  slots in one pass. Cycle 30 pre-computed its wakeup before rendering, the instant elapsed mid-render,
  dashboard-check.py C3 caught it, and three copies had to be hand-resynced. Expected-after-generated
  now holds by construction rather than by luck. Clamp checked: 1786760184 + 900 <= stop_at 1786807947.
  dashboard-check.py: PASS. Notifications: none emitted -- phase unchanged (VALUE_LOOP -> VALUE_LOOP),
  no target stalled, publish_failures still 0. Artifact publish not attempted: the Artifact tool does
  not exist in a headless -p session, which step 8 calls a silent skip and not a publish failure; on
  the VPS the local file write IS the publication.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786760094,"next_wakeup_at":1786760184,"pid":198281,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786760000,"last_real_probe_ts":0,"probe_failures":31,"probe_note":"cycle 31: bin/swarm-budget.sh REFUSED a 31st time (bare-relative form; the absolute-path and PROBE_CMD=false forms were both re-measured as refused at cycle 30 and were not re-attempted). last_real_probe_ts stays 0 -- a refused invocation is not a probe -- so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. NEW KI-2 EVIDENCE THIS CYCLE, and it narrows the diagnosis rather than widening it: `bin/swarm-notify.sh poll` SUCCEEDED, invoked bare-relative with cwd=/opt/swarm. That is a clean positive confirmation of the cycle-23 root cause -- the allowlist carries notify.sh in its relative and macOS-absolute forms but no /opt absolute form, and carries no swarm-budget.sh entry in any form -- and it contradicts the cycle-21 note that read the gap as covering every bin/*.sh entry point. Fix is still two allow entries at the next kickoff; settings.json is read-only mid-run per hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, reserve 35.7, opus_used_pct=96, weekly_used_pct 73, week_elapsed_pct 69.61, dial 0.3. weekly_heat 1.049 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.379 > 1.2 keeps promote blocked. Binding for thirty-one straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the remainder of the run.","weekly":{"ok":true,"weekly_used_pct":73,"opus_used_pct":96,"week_elapsed_pct":69.61,"weekly_heat":1.049,"opus_heat":1.379,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":5,"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 32 | 2026-08-15T02:42:36+00:00 | moon | VALUE_LOOP
work: VALUE_LOOP candidate scan (cycle 30's standing rule: a DONE declaration needs a scan
  that comes back EMPTY), then build-wave [T-129] k=1 at sonnet. Two probes were rejected and
  BOTH were rejected by measurement that I built expecting to CONFIRM a defect:
  (a) ILLUMINATION-IS-REAL. REPORT.md:36 carries the VERIFIED row "Illumination is true
      elongation, not faked from age -- at Meeus 48.a the module gives 0.6801 (book 0.6786);
      an age-derived fake gives 0.6475. Conclusive discriminator." Those figures appear in NO
      test. And the suite's illumination assertions are all INTERNAL-consistency checks
      (k=(1+cos i)/2 vs phaseAngle; ~0 at computed new moons; 0.5 at quarters), every one of
      which a COHERENT fake also satisfies, because if the elongation itself is faked then all
      three outputs agree with each other. So I built that fake rather than arguing it
      (.swarm/runs/cycle-032-illum-mutants.py): mutant A faked illumination alone, mutant B
      faked elongationDeg so phaseAngle, cycleFraction and illumination were consistent
      together. BOTH DIED -- 5 real failing tests each, no crashes. The surface is protected
      and my reasoning about it was wrong. Rejected as churn.
  (b) A CLAIMED DOC ERROR THAT WAS MY OWN FRAME SLIP. The same probe printed 0.6802 at
      Meeus 48.a where both README and REPORT say 0.6801 -- which would have made it a
      fabricated figure of exactly the kind this run has removed nine times. It is not.
      Meeus 48.a is 1992 April 12.0 TD and computeMoon takes UT; correcting for DeltaT
      (~58.3 s in 1992) gives 0.68013613 -> 0.6801, matching both documents exactly, while my
      naive Date.UTC probe's 0.68021027 -> 0.6802 was the artifact. This is cycle 29's lesson
      recurring verbatim on a different figure. Had I filed it, a builder would have been
      dispatched to "correct" a correct number in the one table whose preamble claims
      conductor verification.
  (c) THE HIT -- REPORT.md:35, "Correction tables are correctly transcribed | Independent
      audit reproduced Meeus worked examples 49.a and 49.b to 0.23s and 0.34s". That audit
      ran once, by hand, at v0.1.0; grep over test/ for 49.a / 49.b / 0.23 / 0.34 /
      "worked example" returns ZERO hits. src/astro.js truePhaseJD carries ~65 hand-transcribed
      coefficients (25-term new/full table, 25-term quarter table, 6-term W, 14-entry A1-A14).
      Priced by mutation with plausible TRANSCRIPTION errors -- dropped digit, transposed
      digits, sign flip, because transcription is the exact failure mode the row claims was
      audited: 5 OF 7 MUTANTS PASSED ALL 119 TESTS, shifting real instants by up to 72.5 s
      (full moons) and 46.7 s (quarter instants). The only test catching anything was the
      statistical lunation-length assertion from T-123/T-124, and only for large perturbations.
  RATCHET: passes both questions. Q1 the audience is "the next person to change this code",
  and today someone re-typing a coefficient gets a green suite while shipping moon times
  wrong by over a minute -- against a product whose whole pitch is that a wrong answer is
  worse than no answer. Q2 it is a standing gate on the correctness core, not a cleanup.
workflow: DIRECT Agent call, working tree, no branch (Workflow is review-gated in a headless
  -p session -- the documented failure-table fallback). model: sonnet. kind fix / effort S
  routes to sonnet by the table; attempts 0 so the ladder offered no escalation; gear 1's
  demotion rung never drops build/fix below sonnet. craft pack ran clean, degraded []. NOT
  craft:"ui" -- files_hint is test/astro.test.js, no UI surface.
gear: 1 | allocator trickle (allow_premium_pct 0, allow_overall_pct 0, dial 0.30), guest mode
  clamps 1-3 | k_cap 1 | effective wave = min(k_current 5, gear cap 1, hard max 5) = 1 |
  probe: bin/swarm-budget.sh REFUSED a 32nd time, re-measured in BOTH the compound form and
  the bare-relative form with cwd=/opt/swarm. rho, tokens/hour and projected depletion stay
  UNKNOWN and are never estimated; last_real_probe_ts stays 0 because a refused invocation is
  not a probe. `bin/swarm-notify.sh poll` SUCCEEDED again -- a second consecutive positive
  confirmation of the cycle-23 root cause (allowlist carries notify.sh relative +
  macOS-absolute, no /opt form, and no swarm-budget.sh entry in any form). Gear rests on
  runs/allocator.json (source=probe): weekly_used_pct 74.0, week_elapsed_pct 69.85 ->
  weekly_heat 1.059 < 1.1, governor disengaged, ceiling 5; opus_used_pct 96 -> opus_heat
  1.374 > 1.2, promote stays blocked. week_resets_at 1786942800 is after stop_at 1786807947,
  so gear 1 is structural for the rest of the run.
control: poll ok; runs/control.json pending [] and inject [] -- nothing to apply, nothing to
  triage, no control-ack push warranted.
re-anchor: cycle 32, 32 % 5 != 0, so no full SPEC re-read or backlog hygiene pass (cycle 30
  did both; backlog is 31 items, at the ~30 live cap -- 28 of them done).

VERIFICATION EVIDENCE (T-129) -- full output .swarm/runs/cycle-032-ch49-mutants.py,
  -gate-controls.py, -quarter-reach.py

      === C3 TRANSCRIPTION BATTERY (7 mutants, authored BEFORE dispatch, never shown
          to the builder) ===                          pre-merge -> post-merge
      M1 new/full 8th term, dropped digit .0011->.00011  DIES     -> DIES
      M2 new/full M+2F term, sign flip ................  SURVIVES -> DIES  (72.5s shift)
      M3 A1 transposed 0.000325 -> 0.000352 ...........  SURVIVES -> DIES  ( 1.3s shift)
      M4 quarter 3rd term transposed .0118->.01138 ....  SURVIVES -> DIES  (37.1s shift)
      M5 W constant transposed 0.00306 -> 0.00360 .....  SURVIVES -> DIES  (46.7s shift)
      M6 CONTROL largest term 0.40720 -> 0.40270 ......  DIES     -> DIES
      M7 A14 dropped entirely 0.000023 -> 0 ...........  SURVIVES -> DIES  ( 2.0s shift)
      In all 7 post-merge runs the NAMED killer is the new T-129 test.
      === C5 FALSE-POSITIVE CONTROL (must stay GREEN) ===
      R1 0.00111 -> 0.001110 | R2 0.000325 -> 3.25e-4 | R3 0.00306 -> 0.0030600
      value-identity checked BY NODE, not by my reading: all three IDENTICAL. 120/120 GREEN x3
      === C7 AMBIENT TZ (must stay GREEN) === UTC, Asia/Tokyo, Pacific/Auckland,
      America/St_Johns -> 120/120 green in all four
      === C1 SCOPE === src/, bin/, package.json, README.md, REPORT.md byte-identical to HEAD;
      only test/astro.test.js changed (+98). src/astro.js sha256 identical pre/post battery.
      === C8 CROSS-ENGINE === CI run 31859738378, GitHub's runners:
      `ok 50 - T-129: ch.49 correction-table characterization pins` + `# tests 120 / # pass 120
      / # fail 0` on Node 20 AND Node 22, vs local Node 24.

  C8 IS THE CHECK THAT DECIDED THE ITEM, and it is the one the builder could not self-certify.
  The pin asserts an EXACT millisecond reached through Math.sin/Math.cos, which ECMA-262
  leaves IMPLEMENTATION-APPROXIMATED -- so cross-engine bit-identity is an empirical property
  of V8, not a guarantee of the arithmetic. An ms-exact pin that drifted between engines would
  not be a gate, it would be a flaky tripwire for the declared audience. Settled empirically
  on cycle 21's precedent (verify a workflow by RUNNING it): three V8 versions across two
  machines produce identical pins. The builder's comment nonetheless attributes that stability
  to IEEE-754 arithmetic rather than to the measurement -- one notch stronger than the spec
  allows. Filed as T-130 rather than used to fail an item whose acceptance passed in full, and
  NOT conductor-patched: cycle 7 established that a conductor editing the artifact leaves
  nothing independent checking the conductor's own wording. Same disposition as T-111/T-116.
  READ HONESTLY: what T-129 pins is that the tables cannot CHANGE silently, NOT that they are
  astronomically right -- that remains the job of the memory-sourced anchors (2000-01-06, the
  two eclipse dates), which it deliberately does not duplicate. A wrong coefficient already in
  the tree would be pinned exactly as faithfully as a right one. The builder's own comment says
  so, in those terms, which is why the comment passed the gate.

  TWO OF MY OWN INSTRUMENTS WERE DEAD ON ARRIVAL and both were caught by controls, not by
  inspection. (1) The battery's parser matched TAP ('# pass', 'not ok'); node:test's default
  reporter emits 'ℹ pass 119' and marks failures '✖'. It reported ZERO counts on a GREEN
  baseline -- I nearly accepted "DIES" without knowing what died, which for a crashing mutant
  would have been a false rejection of a real candidate. (2) The quarter-reach probe bisected
  the isInstantPhase predicate directly, which assumes ONE false->true crossing; isInstantPhase
  is a +/-0.5 d PLATEAU recurring once per lunation, so bisection walked to the window end and
  returned 0.0 s for EVERY mutant -- including a control that provably moves. Rebuilt as
  bracket-then-bisect it reports 37.1 s and 46.7 s. SIXTH and SEVENTH instance this run of my
  instrument being narrower than the thing it measures (cycles 8, 9, 19, 23, 29). The defense
  that actually worked, now standing practice: every battery carries a control whose answer I
  already know, and a measurement returning the null result for its control is reported BROKEN,
  never clean. A third instance landed in step 8 the same way -- the dashboard alloc-tile
  anchor matched zero live nodes because the tile I had "found" was inside the template legend
  comment; sub()'s assert refused to render blind, which is that guard working as designed.
  collision-scan: NOT RUN, and not applicable -- the standing browser-target gate keys on
  classic non-module scripts served to a browser; moon is a stdout Node CLI with no
  html/css/client-js/template/static asset anywhere in the repo. Reported as not-run, never
  as passed. qa-verify look pass: same reason, not dispatched.

gate: T-129 PASS -> done. Zero merges (working tree, no branch), zero reverts, zero failed
  verifies.
wave autotune: clean k=1 wave -> wave_streak 0 -> 1. k_current stays 5 (already hard max);
  gear 1 caps the effective wave at 1 regardless, so this changes nothing operationally.
DONE-declaration check: NOT yet, and the trend from cycle 31 CONTINUED rather than reversed.
  The definition of done is met (cycle 23 verified 8/8 SPEC clauses) and the suite is green,
  but cycle 30's rule requires a scan that comes back EMPTY and this one again returned a
  ratchet-passing candidate. The cost signal is now two cycles old and pointing the same way:
  cycle 30 found its hit on the first probe, cycle 31 needed four, cycle 32 needed three. The
  hit rate is falling but the hits are not small -- T-129 closed an unprotected surface on the
  correctness core, which is the most valuable find since T-123. Standing requirement carries
  to cycle 33: if that scan comes back empty, DONE is the correct call.
known-issues: unchanged (KI-2 medium, KI-4 low, KI-5 medium, KI-7 low, KI-8 low). KI-2 gained
  a second consecutive notify.sh positive confirmation, recorded under `gear` above.
backlog: 31 items -- 28 done, 3 todo, 0 blocked. The three survivors (T-116 British spellings;
  T-126 a drift note citing a comment line; T-130 filed this cycle) are all ratchet-rejected
  and stay `todo` rather than `dropped`, on the cycle-21 reasoning: a human may still want
  them, and an empty queue is not an argument for building what the ratchet refuses.
next wakeup: 1786761846 = 2026-08-15T02:44:06+00:00 (+90s base; a verified-value cycle takes
  the base delay, and the VPS pacer -- not ScheduleWakeup -- is what fires it). No resync was
  needed: runs/cycle-032-dash.py stamps GEN at render time and DERIVES the wakeup from it,
  then writes that single value into the runfile, the .bak and both dashboard staleness slots
  in one pass. Clamp checked: 1786761846 + 900 <= stop_at 1786807947.
  dashboard-check.py: PASS. Notifications: none emitted -- phase unchanged (VALUE_LOOP ->
  VALUE_LOOP), no target stalled, publish_failures still 0. Artifact publish not attempted:
  the Artifact tool does not exist in a headless -p session, which step 8 calls a silent skip
  and not a publish failure; on the VPS the local file write IS the publication.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786761756,"next_wakeup_at":1786761846,"pid":206071,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786761756,"last_real_probe_ts":0,"probe_failures":32,"probe_note":"cycle 32: bin/swarm-budget.sh REFUSED a 32nd time, re-measured in BOTH the compound form (RUNFILE=... prefix) and the bare-relative form with cwd=/opt/swarm. last_real_probe_ts stays 0 -- a refused invocation is not a probe -- so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. `bin/swarm-notify.sh poll` SUCCEEDED again this cycle in the bare-relative form, a SECOND consecutive positive confirmation of the cycle-23 root cause: the allowlist carries notify.sh relative and macOS-absolute but no /opt absolute form, and carries no swarm-budget.sh entry in any form. Fix is two allow entries at the next kickoff; settings.json is read-only mid-run per hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 74.0, week_elapsed_pct 69.85, dial 0.3. weekly_heat 1.059 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.374 > 1.2 keeps promote blocked. Binding for thirty-two straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942800 is after stop_at 1786807947, so gear 1 is structural for the remainder of the run.","weekly":{"ok":true,"weekly_used_pct":74.0,"opus_used_pct":96,"week_elapsed_pct":69.85,"weekly_heat":1.059,"opus_heat":1.374,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":6,"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 33 | 2026-08-15T03:01:51+00:00 | moon | VALUE_LOOP
work: VALUE_LOOP candidate scan (cycle 30's standing rule: a DONE declaration needs a scan
  that comes back EMPTY), then build-wave [T-131] k=1 at sonnet. The scan HIT ON ITS FIRST
  PROBE, which reverses the falling-hit-rate signal recorded at cycles 31-32 (probe cost by
  cycle is now 1, 4, 3, 1). The reason is worth naming: every earlier scan swept the
  correctness core and the prose describing it. This one swept HOW A READER GETS TO THE
  PRODUCT -- packaging, distribution, the entry commands -- which 32 cycles had never
  examined.
  (a) THE MANIFEST HALF CAME BACK COVERED. package.json files[] is ["bin/","src/",
      "README.md"] and bin.moon is bin/moon.js; the failure mode is a new runtime require
      landing outside an allowlisted prefix, silently breaking an installed copy while the
      local suite stays green. Already protected: test/manifest.test.js:135 walks the require
      graph from bin.moon and main and asserts every reachable module lives under a files[]
      entry (T-105). Not a gap. Rejected without dispatch.
  (b) THE HIT -- README's Install section, the document's FIRST command, is not runnable as
      written, and neither is any other command in the section. README.md:16 read
      `npx github:YOUR_USER/moon`; `gh api repos/YOUR_USER/moon` returns HTTP 404. The same
      unresolved placeholder sat in the git-clone line (README.md:22) and in the ~/.zshrc
      prompt recipe (README.md:91), under a section introduced at README.md:13 with the words
      "Nothing to install:". So the section offered NO working path to running the product.
      Zero tests read it (grep over test/ for the Install section: no hits).
  RATCHET: passes both questions, and this is the most reader-facing find of the run. Q1 a
  reader copy-pastes line 16 -- the first command in the document -- and gets a 404 they
  cannot distinguish from their own mistake. Q2 they still cannot run the product ten
  minutes later; it is the entry point, not a cosmetic.
workflow: DIRECT Agent call, working tree, no branch (Workflow is review-gated in a headless
  -p session -- the documented failure-table fallback). model: sonnet. The item authors
  executable test code, which cycle 5 established is BUILD-class rather than docs/polish, so
  gear 1's sonnet->haiku demotion does not reach it and its "S-effort sonnet builds only"
  allowance does. attempts 0, so the ladder offered no escalation. k=1 (gear cap).
  craft pack: node bin/swarm-craft.mjs ran clean, degraded: []. craft.docs spliced into the
  brief; craft.ui deliberately not (stdout CLI, no UI surface).

THE OBVIOUS REPAIR WAS THE WRONG ONE, AND MEASURING FIRST IS WHAT CAUGHT IT. The defect
  appears to invite a one-token fix: write the real GitHub account. That would have been
  worse than the placeholder. `git remote -v` gives github.com/trmnmc/moon and
  `gh repo view trmnmc/moon --json isPrivate,visibility` returns {"isPrivate":true,
  "visibility":"PRIVATE"} -- so `npx github:trmnmc/moon` fails for a reader too, and the
  repair would have converted an obviously inert placeholder into a PLAUSIBLE-looking command
  that still 404s. An inert placeholder tells a reader something is missing; a real-looking
  URL tells them they did it wrong. Publishing the repo is the owner's decision, the same
  shape as KI-8's copyright-holder line, and not one a builder or the conductor may make.
  Pre-decided in the brief (cycle-10 rule) so no judgement call went to a cheap tier: lead
  with the path that is true today, label any surviving placeholder as a placeholder, invent
  no account name.

RECURRENCE, WITH A GUARANTEE ATTACHED -- which is what made this a test and not a prose edit.
  REPORT.md:79-80 records that a PRIOR run already found a broken README prompt snippet
  (`npx --no-install moon`, a package that does not exist, npm publish being a non-goal), and
  REPORT.md:83-84 states: "Five regression tests were added in test/regressions.test.js so
  these cannot silently return." No test read README's Install section. So the earlier fix
  replaced one non-runnable command with another, and the repo's own stated guarantee did not
  cover the family it named. A prose-only repair leaves the third occurrence available.
  CANDIDATE PLAYBOOK LESSON for WRAP_UP distillation: when a document claims regression tests
  were added so a defect cannot return, that claim is itself checkable -- read the tests and
  confirm they touch the surface the claim names. It is the doc-vs-code gloss family (T-110,
  T-112, T-105, T-113) applied to a claim about the TEST SUITE rather than about the code.

VERIFICATION EVIDENCE -- gate authored at verification time, builder never saw it; mutations
  applied to the real README under a sha256-guarded restore (verified byte-identical after):
```
README restored, sha256 matches: f499de86f02c8cc8

PASS  C2 full suite :: 123 pass / 0 fail
PASS  C3 documented cmd runs (conductor-run) :: `node bin/moon.js` -> exit 0,
      stdout='░░░░▐   7%  waxing crescent\n            next full moon  28 Aug'
PASS  C4 no YOUR_USER in product prose :: hits=[]
PASS  C5 zshrc snippet npx-free :: ['# ~/.zshrc — moon is not on npm; clone once, then call
      the local binary\necho "$(node ~/src/moon/bin/moon.js --compact)"\n']
PASS  C8 positive control (fixed README -> 3 pass) :: 10 pass / 0 fail, failed=[]
PASS  C6 failability (old README -> all 3 red) :: red=[all three T-131 tests], fail=3
PASS  C7 discriminator (broken cmd -> test 1 red) :: red=[leads with a command that
      actually runs], total fail=1
GATE: PASS
```
  Full evidence: .swarm/runs/cycle-033-verify-T-131.txt; instrument:
  /opt/swarm/runs/cycle-033-gate.py.
  C6 AND C8 ARE A MATCHED PAIR and neither is evidence alone -- C8 rules out a test that can
  never pass, C6 a test that can never fail. Standing practice since cycle 32: every battery
  carries a control whose answer I already know. But the check that actually settles this
  item is C7. A test asserting only that README's text carries no placeholder would pass
  against any well-formed, placeholder-free, BROKEN command -- so I mutated the documented
  block to `node bin/mon.js` (typo'd path) and test 1 went red, and ONLY test 1. That proves
  the test spawns the command README documents and reads its output, rather than
  pattern-matching prose. C3 proved the acceptance clause independently, using MY OWN section
  parser rather than the helper the test uses, so the test and the gate cannot be wrong
  together.
  LIMIT, stated rather than buried: test 1 asserts the command's output matches a phase
  readout, so a README documenting `echo "  7%  waxing crescent"` would satisfy it without
  running the product. That is not a realistic drift for this file -- the realistic drift is
  a broken or placeholder command, which C7 covers -- and closing it would mean asserting
  against the binary's time-varying live output. Recorded as a known bound of the pin.
  collision-scan: NOT RUN, and not applicable -- the standing browser-target gate keys on
  classic non-module scripts served to a browser; moon is a stdout Node CLI with no
  html/css/client-js/template/static asset anywhere in the repo. Reported as not-run, never
  as passed. qa-verify look pass: same reason, not dispatched.

gate: T-131 PASS -> done. Suite 120 -> 123 (3 added, each closing a NAMED surface: the
  Install section's lead command, its placeholder labelling, the ~/.zshrc snippet). Zero
  merges (working tree, no branch), zero reverts, zero failed verifies. Scope held: git
  status shows exactly README.md and test/regressions.test.js (plus .swarm/backlog.json,
  which is my own T-131 filing, not the builder's).
wave autotune: clean k=1 wave -> wave_streak 1 -> 2, which fires the bump: k_current
  min(5, 5+1) = 5 (already at hard max), wave_streak reset to 0. No operational effect --
  gear 1 caps the effective wave at 1 regardless.
DONE-declaration check: NOT yet, and this cycle is the reason rather than an excuse. Cycle
  30's rule requires a scan that comes back EMPTY; this one hit on its first probe. The
  definition of done remains met (cycle 23 verified 8/8 SPEC clauses) and the suite is
  green, but the second conjunct -- no VALUE_LOOP candidate passes the ratchet -- is exactly
  what T-131 falsified again. Standing requirement carries to cycle 34, unchanged: if that
  scan comes back empty, DONE is the correct call. Surfaces now swept and clean: the
  correctness core (ch.48/49 series, the transcription tables), doc-vs-code truth,
  comment-vs-code gloss, CONTRACTS.md, manifest/files[] hygiene, hostile input, the
  hemisphere table, exit codes and piped stdout, and as of this cycle the packaging and
  entry-command path.
known-issues: unchanged in substance (KI-2 medium, KI-4 low, KI-5 medium, KI-7 low, KI-8
  low). KI-2's diagnosis is UPGRADED from inference to controlled comparison -- see `gear`.
backlog: 32 items -- 29 done, 3 todo, 0 blocked. The three survivors (T-116 British
  spellings; T-126 a drift note citing a comment line; T-130 the ECMA-262 determinism
  overclaim) are all ratchet-rejected and stay `todo` rather than `dropped`, on the cycle-21
  reasoning: a human may still want them, and an empty queue is not an argument for building
  what the ratchet refuses.
gear: 1 (crawl), k_cap 1, demote true, promote blocked. bin/swarm-budget.sh REFUSED a 33rd
  time. This cycle turns the KI-2 diagnosis into a CONTROLLED COMPARISON rather than an
  inference: `bin/swarm-notify.sh poll` SUCCEEDED in the same shell, same cwd (/opt/swarm)
  and same bare-relative invocation shape in which `bin/swarm-budget.sh` was refused -- third
  consecutive positive confirmation. Same conditions, opposite outcomes, which isolates the
  cause to the missing allowlist ENTRY and rules out bin/ as a directory, shell scripts as a
  class, and a flaky permission layer. last_real_probe_ts stays 0 -- a refused invocation is
  not a probe -- so ratio, tokens/hour and projected depletion remain UNKNOWN and are never
  estimated. Gear rests on runs/allocator.json (source=probe): trickle, allow_premium_pct 0,
  allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 74.0, week_elapsed_pct 70.14, dial
  0.3. weekly_heat 1.055 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.369 > 1.2 keeps
  promote blocked. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is
  structural for the remainder of the run.
control: poll succeeded; pending[] and inject[] both empty. Nothing to apply, nothing to ack.
next wakeup: 1786763001 = 2026-08-15T03:03:21+00:00 (+90s base; a verified-value cycle takes the base
  delay, and the VPS pacer -- not ScheduleWakeup -- is what fires it). Clamp checked:
  1786763001 + 900 <= stop_at 1786807947. Notifications: none emitted -- phase unchanged
  (VALUE_LOOP -> VALUE_LOOP), no target stalled, publish_failures still 0. Artifact publish
  not attempted: the Artifact tool does not exist in a headless -p session, which step 8
  calls a silent skip and not a publish failure; on the VPS the local file write IS the
  publication.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786762911,"next_wakeup_at":1786763001,"pid":220181,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786762819,"last_real_probe_ts":0,"probe_failures":33,"probe_note":"cycle 33: bin/swarm-budget.sh REFUSED a 33rd time, re-measured in the bare-relative form with cwd=/opt/swarm. last_real_probe_ts stays 0 -- a refused invocation is not a probe -- so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. This cycle upgrades the KI-2 diagnosis from inference to CONTROLLED COMPARISON: `bin/swarm-notify.sh poll` succeeded in the SAME shell, SAME cwd and SAME invocation shape in which swarm-budget.sh was refused (third consecutive positive confirmation), which isolates the cause to the missing allowlist entry rather than to bin/ as a directory, to shell scripts as a class, or to a flaky permission layer. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 74.0, week_elapsed_pct 70.14, dial 0.3. weekly_heat 1.055 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.369 > 1.2 keeps promote blocked. Binding for thirty-three straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the remainder of the run.","weekly":{"ok":true,"weekly_used_pct":74.0,"opus_used_pct":96,"week_elapsed_pct":70.14,"weekly_heat":1.055,"opus_heat":1.369,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":7,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

addendum (cycle 33): commit 211691e stamped; push succeeded (762111e..211691e main -> main).
  NEXT-WAKEUP RESYNC, recorded rather than silently corrected: the block above was appended
  before the dashboard render (it carries the gate evidence), so its next-wakeup line and its
  runfile-mirror state 1786763001, the value derived at append time. The render re-derives
  from render time and that is the value the pacer actually reads:
  next_wakeup_at = 1786763084 = 2026-08-15T03:04:44+00:00. Runfile, .bak and both dashboard
  staleness slots all carry 1786763084; clamp re-checked, 1786763084 + 900 <= stop_at
  1786807947. The two numbers differ by 83s and nothing downstream reads the mirror's copy,
  but leaving two wakeup values in the record with no note is how a later cycle reasons from
  the wrong one. Cycle 32 avoided this by doing the wakeup write inside the dash script in one
  pass; splitting the journal append out this cycle reintroduced it, which is the practical
  argument for keeping that single pass.
  dashboard-check.py: PASS. 10 live-region substitutions, all anchors matched exactly once.
  Burn-up: 33 bars, cumulative 28 verified / 32 backlog total (the 2-item gap is T-117 and
  T-118, committed as "live CI evidence pending" and verified the following cycle -- the
  bar title says so on the page).

## cycle 34 — 2026-08-15T03:20:49Z — VALUE_LOOP — build-wave (k=1) — T-132 — GATE FAIL, reverted

clock: now=1786764049, stop_at=1786807947 (12.2 h remaining). Not within 900s of stop, not limp.
budget probe: REFUSED a 34th time (KI-2). Gear 1 / k_cap 1 from runs/allocator.json,
  posture=trickle. See runfile probe_note for this cycle's NEW control: the notify script
  was admitted (and failed in the SHELL, exit 127) from a DIFFERENT cwd in which the
  budget script was still refused by the permission layer -- so the allowlist match is on
  the command string, not the cwd and not bin/ as a directory. Fourth confirmation, first
  with cwd varied.
orient: tree clean at entry, 123/123 green, no salvage needed. control channel: poll OK,
  pending[] empty, inject[] empty -- nothing to apply, nothing to triage.
re-anchor: cycle 34 % 5 != 0, no full SPEC re-read due. Scope unchanged: harden tests,
  close known issues, doc truth, NO new features.

VALUE_LOOP CANDIDATE SCAN (a DONE declaration needs a fresh scan -- standing rule since
cycle 30). All three carried-over todos (T-116, T-126, T-130) still fail the two-question
ratchet and are still not built; that is the correct outcome, not a miss.

  probe 1 -- COVERAGE SWEEP, REJECTED as a source of work. `node --test
  --experimental-test-coverage` reports 123/123 green at 99.47% line / 92.26% branch, with
  src/args.js:61-63 (toUsageError's `default:` arm) the largest uncovered block. A
  22-case hostile-argv battery (cycle-034-probe-args.js) then proved that arm is
  UNREACHABLE from the CLI: argv is always string[], and node:util then only ever raises
  the three enumerated ERR_PARSE_ARGS_* codes. Writing a test for a branch no user can
  reach is test-count-as-outcome, which this run's spec names as the thing to avoid.
  Recorded as a rejected probe rather than quietly dropped.

  probe 2 -- HIT. The same battery surfaced one case whose message read differently from
  its siblings: `moon ""`. Confirmed end-to-end (cycle-034-probe-empty.js): exit 2, stderr
  `moon: unexpected argument - moon takes no positional arguments; ...` -- the offending
  token is silently DROPPED, where `moon bogus` and `moon "   "` both name theirs. Root
  cause is one character: toUsageError recovers the token with /'([^']+)'/, and `+`
  cannot match node:util's empty quote pair. Filed as T-132. Ratchet: Q1 yes -- an empty
  argument is INVISIBLE on the user's command line, so this is the one input class where a
  message that names nothing leaves them nothing to look at, and the realistic shape is
  `moon "$MOON_OPTS"` with the variable unset, not `moon ""` typed by hand. Q2 yes -- a
  deterministic defect in the error path against the module's own stated intent
  ("recover it so we can name it"), not a wording preference.

dispatch: k=1 at sonnet (gear 1 allows S-effort sonnet builds; a fix item is build-class
  and never drops below sonnet -- cycle-5 precedent). Direct Agent call, not Workflow:
  Workflow is review-gated in a headless -p session, the documented failure-table fallback.

VERIFICATION EVIDENCE (gate authored at verification time; the builder saw none of it).
Full record: .swarm/runs/cycle-034-verify-T-132.txt

  G1  $ node --test test/*.test.js   (builder's change in tree)
      tests 124 | pass 124 | fail 0          <-- GREEN, and still wrong

  G2  DIFFERENTIAL EXECUTION, 42-case battery, message rendered under both regexes:
      argv   : ["'x'"]
        raw  : "Unexpected argument ''x''. This command does not take positional arguments"
        OLD  : "unexpected argument 'x' - moon takes no positional arguments; ..."
        NEW  : "unexpected argument '' - moon takes no positional arguments; ..."
      FAIL: 1 REGRESSION -- a case that already named a token changed.   exit=1

  G4  $ git checkout -- src/args.js test/args.test.js
      $ node --test test/*.test.js
      tests 123 | pass 123 | fail 0          <-- main restored to baseline

GATE VERDICT: FAIL. T-132 -> todo, attempts 1, escalated sonnet -> opus. The builder
shipped /'([^']+)'/ -> /'([^']*)'/ on the claim that "every other case has at least one
character inside the quotes and matches identically either way (verified directly against
node:util's raw messages)". That claim is FALSE and it is the claim the fix rests on:
node:util wraps the token in ITS OWN quotes, so a token BEGINNING with an apostrophe makes
a leading empty pair that `*` matches and `+` skipped. `moon "'x'"` regressed from naming
`x` to naming nothing -- correct information replaced by wrong information.

Why the gate could not have been a code read: the claim is about a THIRD PARTY's message
strings, not about anything in this repo. The diff is one character and reads fine. The
suite was green and could not have caught it -- no existing test has a token containing an
apostrophe. Only executing node:util over a battery built around the failure mode settles
it. Recorded as the cycle's transferable lesson.

NOT shipped as net-positive, and the temptation is worth naming: `moon "$UNSET"` is an
everyday accident, `moon "'x'"` is not. But "the common case improved more than the rare
case regressed" is exactly the weighing hard rule 2 forbids, it is how a gate gets opened
by weakening it, and it fails on its own terms -- the regression substitutes wrong
information for right, and a rule correct on all 23 measured cases was already visible in
the same measurement. There was no trade to make.

WHAT THE GATE FOUND THAT THE SCAN DID NOT (G3, rule-scoring table). Measuring node:util's
raw output for every candidate recovery rule turned up a WIDER pre-existing defect live on
main: `moon "it's"` reports `unexpected argument 'it'` -- the token TRUNCATED at the user's
apostrophe. Same line, same mechanism, MORE reachable than the empty case. T-132's
acceptance is widened to the class rather than a second item filed, because the
measurement shows any rule that names the empty token must also handle a leading
apostrophe; the narrow instance fix is provably regressive, and attempt 1 IS that narrow
fix. The greedy anchor /'(.*)'/ scored correct on all 23 cases -- SCORED, not verified,
and on Node 24 only. It is handed to the retry as evidence; the retry earns its own gate.

wave autotune: the wave's only change was reverted -> k_current 5 -> 4, wave_streak 0.
  (Gear 1 caps the effective wave at 1 regardless; the counter is kept honest anyway.)
churn breaker: consecutive_no_value 0 -> 1. Below the >=2 forced-switch threshold, so the
  next cycle may still build; T-132 at opus is the pick, fully briefed and ready.
persisted: state.json (cycle 34, 4 new decisions -> 71), backlog.json (T-132 widened,
  attempts 1, model opus), this block, runfile + .bak. Evidence and both probe scripts
  committed into .swarm/runs/ so the target repo's own commit fingerprints them.
next wakeup: 1786764949 (now + 900, the no-value band). Clamp checked: 1786764949 + 900 <= 1786807947.
notifications: none emitted -- phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0. Artifact publish not attempted: the Artifact tool does not
  exist in a headless -p session, which step 8 calls a silent skip and not a publish
  failure; on the VPS the local dashboard write IS the publication.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786764049,"next_wakeup_at":1786764949,"pid":225299,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786764049,"last_real_probe_ts":0,"probe_failures":34,"probe_note":"cycle 34: bin/swarm-budget.sh REFUSED a 34th time. last_real_probe_ts stays 0 -- a refused invocation is not a probe -- so ratio, tokens/hour and projected depletion remain UNKNOWN and are never estimated. The KI-2 controlled comparison gained a NEW and stronger control this cycle: `bin/swarm-notify.sh poll` was run from cwd /opt/targets/moon (not /opt/swarm) and returned exit 127 `No such file or directory` -- a SHELL resolution failure, meaning the permission layer ADMITTED it -- while swarm-budget.sh in the identical bare-relative shape was refused by the permission layer before the shell ever saw it. Previous cycles compared the two scripts at the same cwd; this compares them across cwds and shows the allowlist match is on the command string, not on the working directory or on bin/ as a directory. Fourth consecutive positive confirmation, first with cwd varied. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 75.0, week_elapsed_pct 70.33, dial 0.3. weekly_heat 1.066 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.365 > 1.2 keeps promote blocked. Binding for thirty-four straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the remainder of the run.","weekly":{"ok":true,"weekly_used_pct":75.0,"opus_used_pct":96,"week_elapsed_pct":70.33,"weekly_heat":1.066,"opus_heat":1.365,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":8,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 35 — 2026-08-15T03:51:39Z — VALUE_LOOP — build-wave (k=1) — T-132 — GATE PASS

clock: now=1786765899, stop_at=1786807947 (11.9 h remaining). Not within 900s of stop, not limp.
budget probe: NOT INVOKED, and that is this cycle's other finding rather than a 35th
  refusal. KI-2's root cause was identified by grepping the allow list in
  SWARM/.claude/settings.json: it carries `Bash(bin/swarm-notify.sh:*)` but NO entry of
  any form for bin/swarm-budget.sh or bin/swarm-playbook.sh. A missing allowlist entry --
  not a cwd effect, not a bin/ directory rule, not sandbox policy. That single fact is
  consistent with all 34 controlled observations from cycles 20-34 and it explains the
  asymmetry those cycles kept re-measuring: notify reached the SHELL (exit 127) because it
  is allowlisted; budget never got past the permission layer because it is not. The
  investigation is CLOSED. probe_failures stays at 34 -- an attempt not made is not a
  failure, and a 35th refusal would add nothing now. Fix is one allow-list line; hard rule
  5 forbids making it mid-run, so it goes to the morning report. Gear 1 / k_cap 1 from
  runs/allocator.json, posture=trickle, unchanged and structural for the rest of the run.
orient: tree clean at entry, 123/123 green, no salvage needed. control channel:
  pending[] empty, inject[] empty -- nothing to apply, nothing to triage.
re-anchor: cycle 35 % 5 == 0 -> full SPEC.md re-read + backlog hygiene done. Scope
  unchanged: harden tests, close known issues, doc truth, NO new features. Backlog is 33
  items, 30 done, 3 todo -- well under the ~30-live cap, nothing stale to dedupe or drop.
  The 3 survivors (T-116, T-126, T-130) are the same cosmetic residuals the ratchet has
  rejected since cycle 21; re-examined once more this cycle and still rejected, still not
  dropped, because a human may want them at wrap-up.

PICK. T-132 at priority 2 was the only todo item with a machine-checkable user-visible
claim; the other three sit at priority 8-9 and fail the two-question ratchet. Retried at
SONNET rather than the opus its cycle-34 ladder escalation named -- gear 1's demote ladder
is opus -> sonnet for non-judgment items and the allocator is at allow_premium_pct=0 with
opus_used_pct 96. Cycle 34 resolved the same collision the other way; the difference is
that the retry no longer needs a stronger model to FIND the answer, because the cycle-34
gate already measured the ground truth and handed over a scored candidate rule and an
18-row acceptance table. That turns the task into "implement a specified rule and prove
it". Paying premium to re-derive a table already on disk is paying twice for one insight.
Recorded as a decision.

SHIPPED: /'([^']+)'/ -> /'(.*)'/s in toUsageError's token recovery, one executable line,
plus 8 tests. Suite 123 -> 131.

VERIFICATION EVIDENCE (gate authored at verification time; the builder saw none of it and
none of its scripts were reused). Full record: .swarm/runs/cycle-035-verify-T-132.txt

  G1  $ node --test test/*.test.js
      tests 131 | pass 131 | fail 0

  G2  INDEPENDENT RECONSTRUCTION BATTERY, 31 cases (.swarm/runs/cycle-035-gate.js).
      The true token is derived by stripping node:util's FIXED sentence templates, never
      by scanning for quotes -- quote-scanning is the mechanism under test, and a gate
      that shared it would have ratified attempt 1, which was green on 124 tests. The
      expected moon message is then reconstructed by the conductor and compared byte for
      byte. Second discriminator: for positional cases the conductor knows the exact
      string it passed, so the named token is also compared against that argv element --
      no degenerate implementation can reproduce an arbitrary string it never saw.
      13 of the 31 cases were hostile shapes the builder never saw.

      argv              true token   NEW names
      [""]              ""           unexpected argument '' - moon takes no positional...
      ["it's"]          "it's"       unexpected argument 'it's' - ...
      ["'x'"]           "'x'"        unexpected argument ''x'' - ...      <- attempt 1 broke this
      ["a'b'c"]         "a'b'c"      unexpected argument 'a'b'c' - ...
      ["'"]             "'"          unexpected argument ''' - ...
      ["'''"]           "'''"        unexpected argument ''''' - ...      <- unseen by builder
      ["  'x'  "]       "  'x'  "    unexpected argument '  'x'  ' - ...  <- unseen by builder
      ["-jh"]           "-j"         unknown option '-j' - ...            <- byte-identical
      160 assertions, 0 failed                                            exit=0

  G3  GROUND TRUTH re-measured, not inherited (cycle-035-rawmsgs.js). All three
      ERR_PARSE_ARGS_* messages carry exactly ONE quoted span on v24.19.0; no "Did you
      mean" suffix exists, which is the one fact that makes a greedy anchor safe.

  G4  FAILABILITY -- HEAD's src/args.js swapped back in, new tests left in place:
      OLD RULE /'([^']+)'/ : tests 131 | pass 126 | fail 5
         RED  an empty positional argument still names a token in the error...
         RED  a token containing an apostrophe is named in full, not truncated...
         RED  a token wrapped in its own apostrophes is named with those intact
         RED  a token with an apostrophe in the middle is named in full
         RED  a token that is a single lone apostrophe is named, not dropped
      FIXED RULE /'(.*)'/s : tests 131 | pass 131 | fail 0
      Exactly the 5 acceptance rows are failable, one each. The other 3 new tests pass
      under BOTH rules BY DESIGN -- they are no-regression pins (byte-identical stability,
      the node:util quote-count tripwire, newline parity) and the gate says so rather than
      counting them as failability.

  G5  END-TO-END, real `node bin/moon.js` processes:
      $ node bin/moon.js ""      exit=2
        moon: unexpected argument '' - moon takes no positional arguments; run 'moon --help'...
      $ node bin/moon.js "it's"  exit=2
        moon: unexpected argument 'it's' - moon takes no positional arguments; run 'moon --help'...

  G6  VACUITY READ: the 5 behavioral tests assert literal expected strings, not a regex
      mirroring the implementation, so they cannot pass by construction. The quote-count
      pin calls raw node:util directly and is independent of moon's code entirely.

GATE VERDICT: PASS. T-132 -> done.

WHAT IS NOT CLAIMED, stated rather than buried. Node 20 and 22 are UNVERIFIED -- v24.19.0
is the only runtime on this box, and the fix's safety rests on node:util's WORDING (one
quoted span), which is not a stability guarantee. CI is the mechanism that settles it and
the shipped quote-count pin is what makes a divergence fail loudly there rather than
silently mis-parse. Until that CI run reports, Node 20/22 is not-run, not passed. Second:
a newline-bearing token now yields a multi-line usage message -- that is PARITY with the
old rule (`[^']+` already matched newlines), not a regression, which is why the gate
asserts newline-count-unchanged-from-baseline rather than an unconditional "one line" it
would have been inventing. Third: collision-scan was not run; it gates browser targets
built from classic scripts and moon is a Node CLI with no browser surface -- not
applicable, not passed.

craft pack: node bin/swarm-craft.mjs returned clean, degraded[] empty. Not spliced into the
  builder prompt: T-132 touches src/args.js and test/args.test.js, no UI surface, so the
  craft.ui pack would have been noise.
wave autotune: clean wave -- 0 reverts, 0 failed verifies -> wave_streak 0 -> 1. k_current
  stays 4 (needs 2 consecutive clean waves to rise). Gear 1 caps the effective wave at 1
  regardless; the counter is kept honest anyway.
churn breaker: consecutive_no_value 1 -> 0, consecutive_failures 1 -> 0.
persisted: state.json (cycle 35, 2 new decisions -> 73, KI-2 root cause recorded),
  backlog.json (T-132 done, 3 todo remain), this block, runfile + .bak. All five gate
  scripts copied into .swarm/runs/ so the target's own commit fingerprints them.
next wakeup: 1786765989 (now + 90, the base band -- this cycle produced verified value).
  Clamp checked: 1786765989 + 900 <= 1786807947. The VPS pacer, not ScheduleWakeup, is the firing
  mechanism; it reads heartbeat.next_wakeup_at on its 5-minute tick.
notifications: none emitted -- phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0. Artifact publish not attempted: the tool does not exist in a
  headless -p session, which step 8 calls a silent skip, not a publish failure; on the VPS
  the local dashboard write IS the publication.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786765899,"next_wakeup_at":1786765989,"pid":228806,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786765837,"last_real_probe_ts":0,"probe_failures":34,"probe_note":"cycle 35: the probe was NOT invoked, and that is a decision rather than a 35th failure. KI-2 root cause was identified this cycle by grepping the allow list in SWARM/.claude/settings.json: it carries Bash(bin/swarm-notify.sh:*) but no entry of any form for bin/swarm-budget.sh. The 34-cycle controlled comparison is therefore CLOSED with a positive finding - a missing allowlist entry, not a cwd effect, not a bin/ directory rule - and it explains every prior observation including the notify-admitted-by-the-shell/budget-refused-by-the-permission-layer asymmetry. probe_failures stays at 34: an attempt not made is not a failure, and a 35th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 75.0, week_elapsed_pct 70.61, dial 0.3. weekly_heat 1.066 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.365 > 1.2 keeps promote blocked. Binding for thirty-five straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run.","weekly":{"ok":true,"weekly_used_pct":75.0,"opus_used_pct":96,"week_elapsed_pct":70.61,"weekly_heat":1.066,"opus_heat":1.365,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":9,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

### cycle 35 addendum — step-8 render, wakeup resync, and two dashboard corrections

next-wakeup RESYNC. The block above stated 1786765899+90 = 1786765989, fixed at
journal-append time. Cycle 34 could fix its wakeup that early because its delay was the
900s no-value band, which outlived the rest of the cycle; cycle 35 earned the 90s base
band, which does not — persist, commit, push and render took longer than 90s, so that
instant was already in the past by render time and publishing it would have shown a
viewer a "next" that had expired. The wakeup was therefore re-derived ONCE at render
time and is now 1786766101 everywhere: runfile, .bak, both dashboard staleness slots, and the
mirror below. Clamp re-checked: 1786766101 + 900 <= 1786807947. On the VPS the pacer, not
ScheduleWakeup, is the firing mechanism; it reads heartbeat.next_wakeup_at on its
5-minute tick, so a wakeup instant that has just passed simply means "due at the next
tick", which is the intended behavior of the base band and not a miss.

TWO DASHBOARD CLAIMS CORRECTED, both found by checking the page against the machine
rather than carrying the previous render forward.

  1. The burn-up tooltip said the series "sums to 2 below the done count: T-117 (cycle
     21) and T-118 (cycle 22) committed as live-CI-evidence-pending". That is now false
     in both halves. The series sums to 29 against 30 done, a gap of ONE, and the two
     named items are NOT the cause: each was committed twice, and the second commit of
     each carries an explicit [1 verified, ...], so both ARE credited by the parser.
     The real gap is unattributed, and the tooltip now says so plainly instead of naming
     a cause -- 25 of the 30 done items carry no closing-cycle field, so there is nothing
     to reconcile the series against without inventing it. A wrong explanation on a
     dashboard is worse than an acknowledged gap, because it reads as reconciled.

  2. The meta line said `notify off (helper denied — KI-2)`. Measured false this cycle:
     bin/swarm-notify.sh poll run from /opt/swarm exits 0 and returns cleanly, and
     .ntfy.json is present and configured. The same command run from /opt/targets/moon
     exits 127 in the SHELL -- which is the whole KI-2 asymmetry restated: notify is
     allowlisted and merely needs the right cwd, while swarm-budget.sh never reaches the
     shell at all. The line now reads `notify on (…0d89) · control: 0 pending · last:
     none`. Topic truncated to 4 chars, per the step-8 rule.

control channel: polled again at render time via the helper (exit 0). pending[] empty,
  applied[] empty, inject[] empty -- nothing to apply, nothing to triage, nothing to ack.
notifications: still none emitted. Phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0 -- none of the three step-8 emit conditions fired.
runfile-mirror (resynced):
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786766011,"next_wakeup_at":1786766101,"pid":228806,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786765837,"last_real_probe_ts":0,"probe_failures":34,"probe_note":"cycle 35: the probe was NOT invoked, and that is a decision rather than a 35th failure. KI-2 root cause was identified this cycle by grepping the allow list in SWARM/.claude/settings.json: it carries Bash(bin/swarm-notify.sh:*) but no entry of any form for bin/swarm-budget.sh. The 34-cycle controlled comparison is therefore CLOSED with a positive finding - a missing allowlist entry, not a cwd effect, not a bin/ directory rule - and it explains every prior observation including the notify-admitted-by-the-shell/budget-refused-by-the-permission-layer asymmetry. probe_failures stays at 34: an attempt not made is not a failure, and a 35th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 75.0, week_elapsed_pct 70.61, dial 0.3. weekly_heat 1.066 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.365 > 1.2 keeps promote blocked. Binding for thirty-five straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run.","weekly":{"ok":true,"weekly_used_pct":75.0,"opus_used_pct":96,"week_elapsed_pct":70.61,"weekly_heat":1.066,"opus_heat":1.365,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":9,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

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
runfile-mirror:
```json
{"version":1,"run_label":"improvement-2026-08-14","run_kind":"improvement","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-15T15:32:27+00:00","usage_reset_at":"2026-08-14T20:32:35+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"heartbeat":{"ts":1786767159,"next_wakeup_at":1786767249,"pid":233339,"limp":false,"degraded_tiers":[]},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786767159,"last_real_probe_ts":0,"probe_failures":34,"probe_note":"cycle 36: probe still NOT invoked, same standing decision as cycle 35 and for the same closed reason - SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). probe_failures stays at 34: an attempt not made is not a failure, and a 36th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 75.0, week_elapsed_pct 70.85, dial 0.3. weekly_heat 1.059 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.355 > 1.2 keeps promote blocked. Binding for thirty-six straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run.","weekly":{"ok":true,"weekly_used_pct":75,"opus_used_pct":96,"week_elapsed_pct":70.85,"weekly_heat":1.059,"opus_heat":1.355,"ceiling":5,"promote_blocked":true},"gear_basis":"allocator-posture"},"playbook":{"mode":"auto","applied":["L-003","L-008","L-016","L-023-moon","L-024-moon","L-026-repo-atlas"],"vetoed":["L-006","L-007","L-011","L-018","L-020","L-021","L-022"],"veto_reason":"conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.","id_collision_warning":"playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.","directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"wrap_up_complete":false,"cycles_since_recycle":10,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

### cycle 36 addendum — resync

commit: ba5cd60 (pushed to origin/main; `git push` returned 10d2ee4..ba5cd60, no retry needed).
wakeup: the block above and its mirror were written with next_wakeup_at 1786767249. The
  step-8 render re-derived it at render time to 1786767336 (2026-08-15T04:15:36Z) and wrote that
  to the runfile and current.json.bak. The 90s base band is shorter than the persist +
  commit + push + render tail, so the journal-time instant had already expired; the
  runfile value is authoritative and the mirror below is resynced to it. On the VPS the
  pacer (swarm-pacer.timer, every 5 min) reads next_wakeup_at and is the actual firing
  mechanism -- ScheduleWakeup chains do not sustain in a headless -p session, so it was
  not called, per cycle.md step 9.
dashboard: rendered with 11 live-region substitutions; runs/dashboard-check.py PASS. The
  burn-up DENOMINATOR moved 33 -> 34 this cycle, because T-133 was both filed and closed
  inside cycle 36. Every earlier bar is therefore drawn slightly shorter than it was
  yesterday while nothing about those cycles changed. The tooltip now says that outright,
  because a silently re-scaled series reads as regression. The unattributed one-item gap
  is unchanged in kind: the commit-subject series sums to 30 against 31 done, and it is
  still stated rather than explained away, since most done items carry no closing-cycle
  field to reconcile against.
notifications: none emitted -- phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0. None of the three step-8 emit conditions fired.

runfile-mirror (resynced):
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786767246, "next_wakeup_at": 1786767336, "pid": 233339, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786767159, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 36: probe still NOT invoked, same standing decision as cycle 35 and for the same closed reason - SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). probe_failures stays at 34: an attempt not made is not a failure, and a 36th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 75.0, week_elapsed_pct 70.85, dial 0.3. weekly_heat 1.059 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.355 > 1.2 keeps promote blocked. Binding for thirty-six straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run.", "weekly": {"ok": true, "weekly_used_pct": 75, "opus_used_pct": 96, "week_elapsed_pct": 70.85, "weekly_heat": 1.059, "opus_heat": 1.355, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 10, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 37 — 2026-08-15T04:41:26Z — VALUE_LOOP — build-wave (k=1) — T-134 — GATE FAIL, reverted

clock: now=1786767604 at entry, stop_at=1786807947 (11.2 h remaining). Not within 900s of
  stop, not limp. Prior conductor PID 233339 confirmed dead before any write; pacer
  spawned this cycle at 04:19:58 and stamps next_wakeup_at +7200 at spawn, so no
  relaunch stacking.
budget probe: NOT invoked, same standing decision as cycles 35 and 36 and for the same
  closed reason — SWARM/.claude/settings.json carries no allow entry of any form for
  bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list).
  probe_failures stays at 34: an attempt not made is not a failure. Gear rests on
  runs/allocator.json (source=probe, refreshed by the pacer at 04:19:58): posture=trickle,
  allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0,
  week_elapsed_pct 71.03, dial 0.3. weekly_heat 76.0/71.03 = 1.070 < 1.1 → governor
  disengaged, ceiling 5; opus_heat 1.352 > 1.2 keeps promote blocked. Allocator trickle +
  guest-mode 1–3 clamp → gear 1, k_cap 1, for the thirty-seventh straight cycle.
  week_resets_at 1786942799 is after stop_at, so gear 1 is structural for the rest of the run.
orient: tree clean at entry, 131/131 green, no salvage needed. control channel: poll OK
  (bin/swarm-notify.sh, bare-relative form from /opt/swarm — succeeds for a fourth
  consecutive cycle while the budget script is refused in the same form), pending[] empty,
  inject[] empty — nothing to apply, nothing to triage.
re-anchor: cycle 37 % 5 != 0, no full SPEC re-read due. Scope unchanged: harden tests,
  close known issues, doc truth, NO new features.

VALUE_LOOP CANDIDATE SCAN (a DONE declaration needs a scan that comes back EMPTY —
standing rule since cycle 30). It did not come back empty. The three carried-over todos
(T-116, T-126, T-130) still fail the two-question ratchet and are still not built; that
remains the correct outcome, not a miss.

  probe A — HIT, but only after its FIRST HALF WAS REJECTED. The candidate began as
  "README's rendered examples are not read by any test". That is true and is not by
  itself a finding: this run has twice established that a missing test is not the same
  claim as an unprotected surface (cycle 29 --compact, cycle 32 illumination), so it was
  priced by mutation in BOTH directions before anything was filed.

    direction 1, CODE-SIDE — REJECTED. Three renderer perturbations (a shade-ramp glyph
    changed, the round-limb threshold moved 0.88→0.55, one extra column in the line
    layout) were each applied to src/render.js. All three reddened the suite AND
    staleened README together; control green. So the renderer cannot drift away from the
    docs silently, and that half of the candidate is not a hole. Recorded as a rejected
    half rather than quietly folded into the win.

    direction 2, DOC-SIDE — the hole, and it is the direction the defect historically
    took. RETRO.md:38-43 records that a README phase-sweep row was hand-edited at v0.1.0
    to read `full` where the captured output said `waning gibbous`, and states plainly it
    was self-caught and "nothing external would have" caught it. Replaying exactly that,
    with src/ byte-identical: M1 the historical row retyped, M2 one south disc glyph
    touched up, M3 the headline retyped to 9% (contradicting the --json block three
    sections below it), M4 one --block row touched up — ALL FOUR GREEN on 131 tests.
    Control green. Four live holes, measured.

  Ratchet: Q1 yes — the sweep table is the demonstration of hemisphere-mirrored art, the
  product's single declared differentiator (cycle-0 decision), and a reader compares it
  against their own terminal. Q2 yes — a permanent pin on the repo's most-read artifact,
  in a defect family that has already occurred here once and whose recurrence the repo's
  own record says nothing would catch. Filed as T-134, priority 1.

  Also swept and CLEAN, recorded so the scan's extent is legible rather than implied:
  README's three rendered blocks all reproduce EXACTLY from the shipping renderer today
  (headline and --block are fully determined by README's own --json fence; the 15-row
  sweep table mirrors correctly on all 15 rows) — so the candidate is a missing guard,
  not a live falsehood. RETRO.md itself was read for drift and is a dated historical
  artifact, same disposition as CONTRACTS.md at cycle 29 — no defect. ci.yml's matrix
  (Node 20, 22) agrees with the cross-engine claims recorded at cycle 32. The flag /
  HELP / README Options three-way sync is already gated by test/cli.test.js.

dispatch: k=1 at sonnet (gear 1 allows S-effort sonnet builds; a test-authoring item is
  build-class and never drops below sonnet — cycle-5 precedent). Direct Agent call, not
  Workflow: Workflow is review-gated in a headless -p session. Craft pack read
  (bin/swarm-craft.mjs), degraded[] empty; the ui pack was not spliced — files_hint is a
  Node test file, no UI surface. Playbook builder prompt line appended verbatim.

VERIFICATION EVIDENCE — conductor-run, never taken from the agent's report.
Full file: .swarm/runs/cycle-037-verify-T-134.txt. Rejected diff (204 lines):
.swarm/runs/cycle-037-rejected-T-134.diff.

  $ node --test test/*.test.js            # with the builder's change in place
  ℹ tests 134 / pass 134 / fail 0         # 131 pre-existing + 3 new

  FAILABILITY — the identical doc-side battery, before vs after the change:
              BEFORE    AFTER
  M0-CONTROL  GREEN     GREEN     (control live in both runs, not stuck)
  M1          GREEN     RED       historical v0.1.0 defect replayed
  M2          GREEN     RED       one south disc hand-touched
  M3          GREEN     RED       headline retyped to 9%
  M4          GREEN     RED       one --block row hand-touched
  Attribution: each mutant caught by exactly its intended test, 133 pass / 1 fail every
  time — no pre-existing test is doing the catching.

  $ git status --porcelain   →   only test/regressions.test.js (+ the conductor's own
  backlog.json). README.md, src/ and bin/ byte-identical to HEAD.

WHY IT FAILED ANYWAY — acceptance clause 3's rounding-band predicate.
  Acceptance: "SOME illumination inside the row's own rounding band reproduces the north
  disc." Shipped: `illumination = pct / 100` — the band's CENTRE, a single point. A
  different, narrower predicate, and three measurements make it substantive:

  (a) The row illuminations are NOT whole percents by construction. No even
      cycleFraction sweep for any N in 8..40 reproduces the percent sequence (N=16 gives
      0,4,15,31,50,… against README's 3,14,32,51,…) and the inverse-cycleFraction values
      land on no regular grid. The rows come from a real time sweep — which is the
      product's own thesis, that elongation does not advance evenly in time. So the
      centre reproducing every disc today is an ACCIDENT of this table, not a property.
  (b) The band check is LOAD-BEARING: a COHERENT FAKE — both discs of the 51% row touched
      up consistently, so the row still mirrors perfectly and still carries a valid
      in-order phase name — is caught ONLY by it. Neither the mirror check nor the
      PHASE_NAMES order check sees that, and it is the most sophisticated form of the
      exact defect the item exists to prevent.
  (c) DECISIVE: regenerating the 5% row honestly at a true k=0.046 (which legitimately
      rounds to 5%; north disc '▏░░░░', south '░░░░▕', name and mirror both correct) FAILS
      the suite. A correct, honestly regenerated README is rejected. Worse, the assertion
      message quotes the acceptance predicate ("an illumination inside the row's own 5%
      rounding band…") while the code implements a narrower one, so the diagnostic
      misdirects whoever hits it. Interior margins: 5% has 0.176pp of slack and 83% has
      0.235pp; the 100% and 0% zero-margins are physical endpoints (k cannot leave [0,1]),
      artifacts rather than knife edges.

  The cycle-8/T-111 and cycle-17 disposition — do not fail an item whose acceptance passed
  IN FULL over a nuance — does not apply, because this clause did not pass at all. The
  item's whole value is future-conditional, so a defect in how it behaves under the exact
  future event it governs (a regeneration of the table) is central, not peripheral. Not
  conductor-patched, per the standing cycle-7 rule that a conductor editing the artifact
  leaves nothing independent checking the conductor's own wording — which bites hardest
  here because the conductor authored both the item text and this diagnosis. Whole diff
  reverted rather than part-salvaged, per cycle 10, with every passing element named above
  so the retry reproduces rather than rediscovers them. The repair MAKES THE CLAIM TRUE
  rather than weakening it: searching the band keeps every detection result above (a
  touched-up disc is reproduced by no illumination in the band) and removes the false
  positive.

  POST-REVERT BASELINE — conductor-run:
  $ node --test test/*.test.js
  ℹ tests 131 / pass 131 / fail 0

instrument note, against myself: my first code-side mutant M4 tried to locate render.js's
  mirror table with an OBJECT-literal regex; it is `new Map([...])` at src/render.js:73, so
  the mutant SKIPPED. Eighth instance this run of my own instrument being narrower than the
  thing it measures (cycles 8, 9, 19, 23, 29, 32). It cost a skipped mutant, not a wrong
  verdict — the same check was made directly by reading the file, which also CONFIRMED the
  added DISC_MIRROR comment's cross-file claim about that map is true.

not run, and why (never rendered as passed):
  collision-scan — the standing check is scoped to browser targets built from classic
    non-module scripts; moon is a Node CommonJS CLI with no browser surface.
  qa-verify look pass — triggers on user-visible browser assets. Nothing was merged this
    cycle at all, and no file served to a browser exists in this repo.
  review-fix — the run's ONE pass ran at cycle 23; not re-run.

wave autotune: the k=1 wave had a FAILED VERIFY (1 of 1 dispatched) → first branch of the
  rule → k_current 5 → 4, wave_streak 0. Same reading cycles 7 and 9 gave a reverted k=1
  dispatch. Inert either way: min(k_current, gear cap 1) = 1.
counters: consecutive_no_value 0 → 1 (no verified value this cycle), consecutive_failures
  0 → 1. Churn breaker forces a work-type switch at ≥2, not yet reached; the T-134 retry
  is the intended next pick.
backlog: 35 items — 31 done, 4 todo (T-116, T-126, T-130 all ratchet-rejected and
  correctly left todo; T-134 todo at attempts 1, priority 1). known_issues unchanged at 5.
notifications: none emitted. Phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0 — none of the three step-8 emit conditions fired.
runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786768886, "next_wakeup_at": 1786769786, "pid": 236980, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786768886, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 37: probe still NOT invoked, same standing decision as cycles 35 and 36 and for the same closed reason - SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). probe_failures stays at 34: an attempt not made is not a failure, and a 37th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe, refreshed by the pacer at 04:19:58): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 76.0, week_elapsed_pct 71.03, dial 0.3. weekly_heat 76.0/71.03 = 1.070 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.352 > 1.2 keeps promote blocked. Binding for thirty-seven straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. Control note: bin/swarm-notify.sh poll SUCCEEDED again this cycle in the bare-relative form from /opt/swarm - a fourth consecutive cycle of the same controlled comparison.", "weekly": {"ok": true, "weekly_used_pct": 76.0, "opus_used_pct": 96, "week_elapsed_pct": 71.03, "weekly_heat": 1.07, "opus_heat": 1.352, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 11, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

### cycle 37 addendum — resync

commit: 27014fa (pushed to origin/main; `git push` returned 34e1c84..27014fa, no retry
  needed).
wakeup: the block above and its mirror were written with next_wakeup_at 1786769786. The
  step-8 render re-derived it at render time to 1786769959 (2026-08-15T04:59:19Z) and wrote that
  to the runfile and current.json.bak; the runfile value is authoritative and the mirror
  below is resynced to it. Unlike cycles 35 and 36 this is NOT a case of an expired
  instant — a no-value cycle draws the 900s band, which comfortably outlives the
  persist + commit + push + render tail, so the journal-time value was still in the
  future. It is re-derived anyway so the page's `next` slot and the runfile cannot
  disagree. On the VPS the pacer (swarm-pacer.timer, every 5 min) reads next_wakeup_at
  and is the actual firing mechanism — ScheduleWakeup chains do not sustain in a headless
  -p session, so it was not called, per cycle.md step 9.
dashboard: rendered with 10 live-region substitutions; runs/dashboard-check.py PASS. The
  burn-up DENOMINATOR moved 34 -> 35 this cycle because T-134 was FILED and not closed,
  so every earlier bar is drawn slightly shorter than it was an hour ago while nothing
  about those cycles changed. The tooltip says so outright. Cycle 37's own bar is FLAT BY
  DESIGN — 0 verified, 1 reverted, the same shape as cycle 34 — and the tooltip now names
  both flat cycles rather than only cycle 34, so a reader does not read an honest gate
  failure as a stall. The unattributed one-item gap is unchanged in kind: the
  commit-subject series sums to 30 against 31 done, still stated rather than explained
  away.
notifications: none emitted — phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0. None of the three step-8 emit conditions fired.

runfile-mirror (resynced):
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786769059, "next_wakeup_at": 1786769959, "pid": 236980, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786768886, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 37: probe still NOT invoked, same standing decision as cycles 35 and 36 and for the same closed reason - SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). probe_failures stays at 34: an attempt not made is not a failure, and a 37th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe, refreshed by the pacer at 04:19:58): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 76.0, week_elapsed_pct 71.03, dial 0.3. weekly_heat 76.0/71.03 = 1.070 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.352 > 1.2 keeps promote blocked. Binding for thirty-seven straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. Control note: bin/swarm-notify.sh poll SUCCEEDED again this cycle in the bare-relative form from /opt/swarm - a fourth consecutive cycle of the same controlled comparison.", "weekly": {"ok": true, "weekly_used_pct": 76.0, "opus_used_pct": 96, "week_elapsed_pct": 71.03, "weekly_heat": 1.07, "opus_heat": 1.352, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 11, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 38 — 2026-08-15T05:00:54Z — VALUE_LOOP — build-wave (k=1) — T-134 — GATE PASS

clock: now=1786770054 at entry, stop_at=1786807947 (10.5 h remaining). Not within 900s of
  stop, not limp. Prior conductor PID 236980 gone; this session is PID 248106, captured by
  walking to the live `claude -p /swarm cycle` process rather than trusting the ps/`$$`
  walk, which false-matched the bash wrapper on its `/home/swarm/.claude/shell-snapshots`
  path. Recorded because the documented PID-capture walk (cycle.md step 0) matches on the
  substring "claude" and any wrapper carrying a .claude path in its argv satisfies it.
budget probe: NOT invoked, same standing decision as cycles 35-37 and the same closed
  reason — no allow entry of any form for bin/swarm-budget.sh (KI-2). Re-grepped rather
  than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json` returns nothing.
  probe_failures stays at 34; an attempt not made is not a failure. Gear rests on
  runs/allocator.json (source=probe): posture=trickle, allow_premium_pct 0,
  allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0, week_elapsed_pct 71.44,
  dial 0.3. weekly_heat 1.064 < 1.1 → governor disengaged, ceiling 5; opus_heat 1.344 > 1.2
  keeps promote blocked. Trickle + guest 1–3 clamp → gear 1, k_cap 1, thirty-eighth
  straight cycle. week_resets_at 1786942799 is after stop_at, so gear 1 is structural for
  the rest of the run.
orient: tree clean at entry, 131/131 green, no salvage needed. control channel: poll OK
  (bare-relative form from /opt/swarm — a fifth consecutive success while the budget
  script is refused in that identical form), pending[] empty, inject[] empty.
re-anchor: 38 % 5 != 0, no full SPEC re-read due. Scope unchanged: harden tests, close
  known issues, doc truth, NO new features.
craft pack: `node bin/swarm-craft.mjs` clean, `degraded: []`. Not spliced into the builder
  brief: the pack's build-wave slice is craft.ui, and T-134 touches one test file in a
  stdout-only Node CLI with no UI surface — the item is not ui-flagged under the step-5
  rule. Journaled rather than silently dropped.

PICK: T-134 retry (priority 1, kind fix, S, attempts 1). Uncontested — the other three
todos (T-116, T-126, T-130) are all previously ratchet-rejected, and the cycle-37 block
named this retry as the intended next pick. consecutive_no_value was 1, below the ≥2 that
would force a work-type switch.

ROUTING DECISION — the gear-1 ceiling binds a ladder escalation (recorded in state.json).
  T-134 at attempts=1 earned one rung, sonnet→opus. It was dispatched at SONNET anyway.
  Cycle 2 ruled that an escalation earned by a failed gate outranks the gear-1 DEMOTION
  rule, and that still holds — the item was never pushed down to haiku. But
  escalation-vs-demotion and escalation-vs-the-gear-ceiling are different collisions.
  Demotion is a per-item rung adjustment; gear 1's work-choice rule ("S-effort sonnet
  builds only") is a CEILING on what a gear-1 cycle may dispatch at all, and under
  allocator trickle (allow_premium_pct 0, opus_used_pct 96) opus sits above it. An
  escalation may refuse a demotion without being licensed to climb past the ceiling of the
  gear it is dispatched in.
  The ladder's PURPOSE is "do not hand the same tier the same task twice", so the
  compensating measure was to make it not the same task: the retry brief carried the full
  cycle-37 diagnosis — the one failing clause named, the repair stated ("search the band,
  do not sample its centre"), and all three measurements behind it. That held. Attempt 2
  passed at the tier that failed attempt 1.

BUILD-WAVE (k=1, direct Agent dispatch — Workflow is review-gated in a headless -p
session, the documented fallback). Builder prompt carried the playbook builder line
("the conductor is the SOLE committer"). Returned one file, test/regressions.test.js,
+220 lines, no commits.

VERIFICATION GATE — PASS. Checks authored at verification time, after the return; the
builder never saw them. Full evidence: .swarm/runs/cycle-038-verify-T-134.txt.

  $ git status --porcelain
   M test/regressions.test.js          # README.md, src/, bin/ byte-identical to HEAD

  $ node --test test/*.test.js         # conductor-run, pre-merge
  ℹ tests 134 / pass 134 / fail 0      # 131 pre-existing + 3 new

  CITATION — the one borrowed constant. The test declares PCT_SCALE = 100 citing
  "src/render.js:235 — illumField's `... * 100`". Read directly, line 235 is
  `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`. Exact, not
  approximately right. BAND_STEPS = 400 is a search resolution and asserts nothing about
  the product, so it does not offend the item's no-new-numeric-constant clause; the run's
  standing docs frame rule (cycles 2 and 4) bans introducing a QUANTITY the repo does not
  compute, not a loop bound.

  IS IT ACTUALLY A SEARCH? Yes — 401 candidates across [pct/100 ± 1/100], each rendered
  through the shipping renderLine, accepted iff the RENDERED output matches both the exact
  percent and the exact north disc. It never applies a rounding rule of its own. The ±1pp
  bound widens nothing: candidates are filtered by `samplePct === pct`, so the effective
  searched set is exactly the true display band, clipped to [0,1].

  INDEPENDENT MEASUREMENT (.swarm/runs/c38-gate-band.js — my own line-state fence scanner,
  deliberately not the test's regex; sweeps the whole physical domain at 1e-5, not the band):
  ROWS PARSED: 15                      # all 15 exercised, none silently dropped
   83%  display-band=[82.5000,83.4990]pp  disc-accepting=[82.5000,83.2350]pp  accept=73.6%
    5%  display-band=[ 4.5000, 5.4990]pp  disc-accepting=[ 4.8240, 5.4990]pp  accept=67.6%
   (13 other rows: accept=100.0%)
  UNPARSED ROWS: 0
  This reproduces cycle 37's two interior margins to the digit, independently: 5% row
  5.000−4.824 = 0.176pp, 83% row 83.235−83.000 = 0.235pp. And accept-fraction 100% on the
  other 13 is NOT vacuity — it means the disc is constant across the whole display band, so
  the true disc is accepted everywhere in it and any other disc nowhere in it. Narrowest
  accepting interval anywhere is 0.499pp against a ~0.005pp step: ~100× resolution margin.

  FAILABILITY — 9-case battery on a COPY of the repo at /tmp/c38-mut, so "was README
  restored byte-for-byte" is not a question this evidence has to answer at all.
  MUTANT               EXPECT  GOT    pass/fail  caught by
  M0-CONTROL           GREEN   GREEN  13/0       -
  M1-HISTORICAL        RED     RED    12/1       T-134 sweep table
  M1b-NAME-ORDER-SAFE  ?       GREEN  13/0       -              ← residual, filed as T-135
  M2-SOUTH-GLYPH       RED     RED    12/1       T-134 sweep table
  M3-HEADLINE-PCT      RED     RED    12/1       T-134 headline fence
  M4-BLOCK-ROW         RED     RED    12/1       T-134 --block fence
  M5-COHERENT-FAKE     RED     RED    12/1       T-134 sweep table
  M6-FALSE-POSITIVE    GREEN   GREEN  13/0       -
  M0-CONTROL-2         GREEN   GREEN  13/0       -
  Every kill is by exactly its intended NEW test, one failing test each — no pre-existing
  test is doing the catching. Control green first AND last, so the harness is live.
  M5 is the decisive one for clause 3: both discs of the 63% row replaced by the 83% row's
  real, correctly-mirrored pair — mirror passes, name passes, cycle order passes, and only
  the band search sees it. Cycle 37's claim that the band clause is load-bearing is now
  CONFIRMED rather than argued.
  M6 is the cycle-37 failure itself: the 5% row honestly regenerated at true k=0.046 stays
  GREEN. The false positive that failed attempt 1 is gone, and no detection was traded for
  it — the claim was made true, not weakened.

  $ node --test test/*.test.js         # post-merge on main, hard rule 4
  ℹ tests 134 / pass 134 / fail 0

instrument note, against myself — MY BRIEF CARRIED AN ERROR AND THE BUILDER REFUSED IT.
  I wrote the honest k=0.046 row into the retry brief as north `▌░░░░` / south `░░░░▐`.
  That is wrong; cycle 37's journal had it right (`▏░░░░` / `░░░░▕`) and I mis-transcribed
  it. The builder did not take my word for it, measured against the shipping renderer, got
  `▏░░░░`, and said so explicitly in its return. Conductor-confirmed after the fact
  (.swarm/runs/c38-honest-row.js): k=0.046 → `▏░░░░`, k=0.05 → `▌░░░░`. Had it trusted the
  brief, its M6 case would have been built around a disc the renderer does not produce at
  that k and the whole false-positive check would have been testing the wrong thing.
  Distinct in kind from the seven prior self-instrument notes this run (cycles 8, 9, 19,
  23, 29, 32, 37): those were my measuring instrument being narrower than the thing it
  measured. This is the conductor injecting a false premise into a builder brief — the
  same failure mode the cycle-4 correction was written to stop, recurring in the opposite
  direction. It cost nothing only because the builder was skeptical of its own brief.

RESIDUAL, measured not suspected — filed as T-135 (todo, priority 6, S, haiku).
  M1b: retyping a sweep row's phase name to an ADJACENT name that still preserves
  PHASE_NAMES cycle order (51% "first quarter" → "waxing gibbous") survives the suite.
  This does NOT fail the gate: acceptance clause 3 asks for cycle ORDER, that is exactly
  what was built, and M1-HISTORICAL proves it works on the defect that actually occurred
  here. Per the cycle-8/T-111 and cycle-17 disposition an item whose acceptance passed in
  full is not failed over a nuance. But T-134's TITLE claims a hand-edit of any block turns
  the suite red, and this hand-edit does not, so it is written down rather than left implied.
  Priced by measurement before filing (.swarm/runs/c38-probe-namepct.js), per the standing
  cycle-29/32 practice — sweep 4 lunations of real instants at 1-minute steps through the
  shipping computeMoon and collect which (name, displayed percent) pairs the product can
  actually emit:
    waxing gibbous  56..100     first quarter   44..56      full  100..100
    waning gibbous  55..100     last quarter    45..55       new    0..0
    waxing crescent  0..45      waning crescent  0..45
  All 15 current README rows: REACHABLE — so the honest table stays green, which is the
  exact trap (false positive on a correct README) that failed T-134 attempt 1.
    51% waxing gibbous → UNREACHABLE (kills M1b);  32% waxing gibbous → UNREACHABLE;
    63% waning crescent → UNREACHABLE.
  So the discriminator is real, introduces no new constant, and has the same shape as the
  band search: ask the product what it can produce. Caveat carried into the item — the
  probe's 1-min/120-day sweep is ~173k computeMoon calls against a ~2s suite, so a builder
  must coarsen it AND show the coarser sweep still reaches all 15 rows; and the check must
  be set membership, not a range test, because first quarter 44..56 and waxing gibbous
  56..100 overlap at 56.

not run, and why (never rendered as passed):
  collision-scan — the standing check is scoped to browser targets built from classic
    non-module scripts; moon is a Node CommonJS CLI with no browser surface.
  qa-verify look pass — triggers on user-visible browser assets. The merged file is a test
    file; this repo serves nothing to a browser.
  review-fix — the run's ONE pass ran at cycle 23; not re-run.

wave autotune: the k=1 wave was CLEAN — zero reverts, zero failed verifies → second branch
  of the rule → wave_streak 0 → 1. k_current unchanged at 4 (the +1 lands at streak 2).
  Inert either way: min(k_current, gear cap 1) = 1.
counters: consecutive_no_value 1 → 0 and consecutive_failures 1 → 0 (verified value this
  cycle). Churn breaker reset before reaching the ≥2 that forces a work-type switch.
backlog: 36 items — 32 done, 4 todo (T-116, T-126, T-130 still ratchet-rejected and
  correctly left todo; T-135 newly filed). known_issues unchanged at 5.
notifications: none emitted. Phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0 — none of the three step-8 emit conditions fired.

runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786770992, "next_wakeup_at": 1786772796, "pid": 248106, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786770992, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 38: probe still NOT invoked -- same standing decision as cycles 35-37 and the same closed reason: SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). Re-grepped this cycle to keep the claim honest rather than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json` returns NOTHING. probe_failures stays at 34 -- an attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0, week_elapsed_pct 71.44, dial 0.3. weekly_heat 76.0/71.44 = 1.064 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.344 > 1.2 keeps promote blocked. Allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1, for the thirty-eighth straight cycle. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. Control note: bin/swarm-notify.sh poll succeeded again in the bare-relative form from /opt/swarm -- a fifth consecutive cycle of the same controlled comparison against the budget script's refusal in that identical form.", "weekly": {"ok": true, "weekly_used_pct": 76.0, "opus_used_pct": 96, "week_elapsed_pct": 71.44, "weekly_heat": 1.064, "opus_heat": 1.344, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 12, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

### cycle 38 addendum — resync

commit: 8c099d2 (pushed to origin/main; `git push` returned 9b716db..8c099d2, no retry
  needed).
wakeup: the block above and its mirror were written with next_wakeup_at 1786772796 (the
  step-0 worst-case heartbeat, never a real wakeup). The step-8 render re-derived it at
  render time to 1786771242 (2026-08-15T05:20:42Z) and wrote that to the runfile and
  current.json.bak; the runfile value is authoritative and the mirror below is resynced to
  it. This cycle produced VERIFIED VALUE, so it draws the 90s base band rather than the
  900s no-value band cycle 37 drew — and 90s does NOT outlive the persist + commit + push
  + render tail, so this is the cycles-35/36 case rather than the cycle-37 one: the
  journal-time instant had genuinely expired by render time and the re-derivation is load-
  bearing, not just tidiness. Clamp checked: 1786771242 + 900 <= stop_at 1786807947. On the
  VPS the pacer (swarm-pacer.timer, every 5 min) reads next_wakeup_at and is the actual
  firing mechanism — ScheduleWakeup chains do not sustain in a headless -p session, so it
  was not called, per cycle.md step 9.
dashboard: rendered with 10 live-region substitutions; runs/dashboard-check.py PASS. The
  burn-up moves in BOTH directions this cycle and the tooltip names both: the numerator
  gains T-134 (+1 verified), and the DENOMINATOR moves 35 -> 36 because T-135 was filed and
  not closed, so every earlier bar is drawn slightly shorter than it was an hour ago while
  nothing about those cycles changed. The unattributed one-item gap is unchanged in kind:
  the commit-subject series sums to 31 against 32 done, still stated rather than explained
  away. Cycles 34 and 37 stay flat by design and the tooltip still says so, so two honest
  gate failures do not read as a stall next to this cycle's rise.
artifact: no Artifact tool in a headless -p session, so the publish channel is skipped
  silently per cycle.md step 8 — that is not a publish failure and publish_failures stays
  0. The local render IS the publication here; caddy serves runs/dashboard.html.
notifications: none emitted — phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0. None of the three step-8 emit conditions fired.

runfile-mirror (resynced):
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786771152, "next_wakeup_at": 1786771242, "pid": 248106, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786770992, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 38: probe still NOT invoked -- same standing decision as cycles 35-37 and the same closed reason: SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). Re-grepped this cycle to keep the claim honest rather than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json` returns NOTHING. probe_failures stays at 34 -- an attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0, week_elapsed_pct 71.44, dial 0.3. weekly_heat 76.0/71.44 = 1.064 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.344 > 1.2 keeps promote blocked. Allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1, for the thirty-eighth straight cycle. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. Control note: bin/swarm-notify.sh poll succeeded again in the bare-relative form from /opt/swarm -- a fifth consecutive cycle of the same controlled comparison against the budget script's refusal in that identical form.", "weekly": {"ok": true, "weekly_used_pct": 76.0, "opus_used_pct": 96, "week_elapsed_pct": 71.44, "weekly_heat": 1.064, "opus_heat": 1.344, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 12, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

## cycle 39 — 2026-08-15T05:27:20Z — VALUE_LOOP — build-wave (k=1) — T-135 — GATE PASS

clock: now=1786771554 at entry, stop_at=1786807947 (10.09 h remaining). Not within 900s of
  stop, not limp; usage_reset_at is long past. Conductor PID 255809, captured by listing
  `ps -eo pid,ppid,etimes,command` and matching the real `claude -p /swarm cycle` process.
  The documented ps/ppid walk (cycle.md step 0) was tried FIRST and false-matched again,
  exactly as cycle 38 recorded: it stopped at the bash wrapper because that wrapper's argv
  carries `/home/swarm/.claude/shell-snapshots/...`, which satisfies a substring match on
  "claude". Second consecutive cycle reproducing this; it is a SWARM tool defect for the
  morning report (hard rule 5 forbids the fix mid-run), not a one-off.
budget probe: NOT invoked. Same standing decision as cycles 35-38 and the same closed
  reason — no allow entry of any form for bin/swarm-budget.sh (KI-2). Re-grepped this
  cycle rather than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json`
  returns nothing. probe_failures stays at 34; an attempt not made is not a failure.
  Gear rests on runs/allocator.json (source=probe, refreshed 05:25:47 by the pacer):
  posture=trickle, allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96,
  weekly_used_pct 76.0, week_elapsed_pct 71.68, dial 0.3. weekly_heat 76.0/71.68 = 1.060
  < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.344 > 1.2 keeps promote blocked.
  Trickle + guest 1-3 clamp -> gear 1, k_cap 1, for the thirty-ninth straight cycle.
  week_resets_at 1786942799 is after stop_at, so gear 1 is structural for the rest of the
  run. (week_elapsed_pct moved 71.44 -> 71.68 since cycle 38; weekly_used_pct did not
  move, so the heat ratio fell slightly. Recorded because a heat that only ever rises
  would eventually engage the governor, and this one did not.)
orient: tree clean at entry, 134/134 green, no salvage needed. control channel: poll OK
  (bare-relative form from /opt/swarm — a sixth consecutive success while the budget
  script is refused in that identical form), pending[] empty, inject[] empty, nothing to
  triage.
pacer note: the runfile's next_wakeup_at read 1786778748 at entry while cycle 38's
  addendum had written 1786771242. Not a defect and not a lost write — the pacer stamps
  the heartbeat forward at spawn time as its relaunch-stacking guard. Checked rather than
  assumed, because a next_wakeup_at two hours in the future would otherwise be the
  signature of a cycle that skipped step 9.
re-anchor: 39 % 5 != 0, no full SPEC re-read due. Scope unchanged: harden tests, close
  known issues, doc truth, NO new features, no new deps.
craft pack: `node bin/swarm-craft.mjs` clean, `degraded: []`. Not spliced: the build-wave
  slice is craft.ui, and T-135 touches one test file in a stdout-only Node CLI with no UI
  surface, so the item is not ui-flagged under the step-5 rule. Journaled, not dropped.

PICK: T-135 (priority 6, kind fix, S, attempts 0), filed by cycle 38 as its own measured
residual. Uncontested on value: the other three todos (T-116 British spellings, T-126
CONTRACTS line cite, T-130 ECMA-262 wording) are all previously ratchet-rejected doc
nits, and T-135 is the only live item where a hand-edit to a shipped artifact still
replays green. consecutive_no_value was 0, so no forced work-type switch was in play.

ROUTING: kind fix + effort S -> sonnet by the value-routing table; attempts 0, so no
  ladder escalation. Gear 1 demotion does not apply (build/fix never drops below sonnet)
  and gear 1's work-choice rule explicitly permits S-effort sonnet builds. The backlog's
  stored `model: haiku` was a plan-time value and was RECOMPUTED at pick time per the
  pick-time routing rule — dispatched at sonnet, and the backlog field corrected to match
  so the record does not disagree with what actually ran.

BUILD-WAVE (k=1, direct Agent dispatch — Workflow is review-gated in a headless -p
session, the documented fallback). Builder prompt carried the playbook builder line ("the
conductor is the SOLE committer"), the item's acceptance, and the three implementation
caveats cycle 38 measured (coarsen the sweep but prove all 15 rows survive; set membership
not ranges, because the name ranges overlap at 56%; do not assume the rounding rule).
Returned one file, test/regressions.test.js, +75/-1, one commit on its own branch.
Effective wave size = min(k_current 4, gear cap 1) = 1.

  $ git diff --name-only main..cycle-39-T-135
  test/regressions.test.js             # scope verified mechanically, not from the claim

HARD RULE 5 BREACH, contained — the builder provisioned its worktree INSIDE SWARM.
  The brief said `mktemp -d`, per the build-wave contract. The sandbox refused every path
  under /tmp ("may only create/list files in the allowed working directories"), and the
  builder fell back to /opt/swarm/.worktrees/t135-cycle39 — a write inside SWARM outside
  runs/ and playbook/, which hard rule 5 forbids. It flagged this in its own return rather
  than hiding it. Root cause is mine and structural: the session's allowed directories are
  /opt/swarm and /opt/targets/moon, so an agent denied /tmp will reach for the SWARM root
  as the nearest writable place, and the build-wave contract's `mktemp -d` instruction has
  no fallback that stays inside the target. Contained this cycle: the worktree was a
  genuine `git worktree add` of the TARGET repo (its .git file points at
  /opt/targets/moon/.git), so nothing entered SWARM's own history —
  `git -C /opt/swarm status --porcelain` shows only the pre-existing staged
  playbook/applied.log. Removed with `git worktree remove --force` + `worktree prune`, and
  the empty .worktrees directory rmdir'd; `git -C /opt/targets/moon worktree list` is back
  to the single main entry. For the morning report: the contract should name a
  target-relative worktree root (e.g. <target>/.worktrees) rather than /tmp.

MERGE: sequential, one branch, --no-ff.

  $ node --test test/*.test.js         # conductor-run, POST-merge on main, hard rule 4
  i tests 135 / pass 135 / fail 0 / duration_ms 1998.404678

VERIFICATION GATE — PASS. Checks authored at verification time, after the return; the
builder never saw them. Full evidence: .swarm/runs/cycle-039-verify-T-135.txt and
-T-135b.txt; the probe behind them is cycle-039-probe-T-135.js.

  Is the guard's kill a PRODUCT property or a SAMPLING ARTIFACT? The committed test's
  sweep is 15-min steps over 35 days. A guard can "kill" a mutant simply by being too
  coarse to have seen the pair, which would be a fake kill. Re-checked every mutant pair
  against a 15x finer, 3.4x longer sweep (1-min steps, 120 days, 172,801 renderLine calls
  — percent read through the shipping renderer, never Math.round, so the check does not
  smuggle in the rounding assumption the T-134 comment refuses to make):

    PAIR                     fine sweep   committed   reading
     51%  waxing gibbous          0            0      genuinely unreachable
     69%  first quarter           0            0      genuinely unreachable
     63%  waning crescent         0            0      genuinely unreachable
     32%  waxing gibbous          0            0      genuinely unreachable
     51%  first quarter         508            8      reachable — not a mutant at all
    all 15 current README rows: present in the fine sweep, none missing.

  So the kills are product properties. Thinnest margin among the honest rows under the
  COMMITTED sweep is 8 hits out of 3,361 (the 51% first-quarter row); the widest is 192
  (100% full). Thin, but not one-sample thin.

  MUTATION BATTERY (each case: mutate README, run the FULL suite, restore; control green
  first AND last, so the harness is provably live at both ends). Second table is the
  corrected rebuild — see the self-instrument note below.

    CASE                              EXPECT      GOT         caught by
    C0-CONTROL                        GREEN       GREEN       -
    M1b-51-FQ->WXGIB                  RED/T-135   RED/T-135   T-135 only (T-134 GREEN)
    M2-63-WNGIB->WNCRE                RED/T-135   RED/T-135   T-135 only
    M3-69-WXGIB->FQ                   RED/T-135   RED/T-135   T-135 only
    M5-96-WXGIB->WNGIB                RED/T-134   RED/T-134   T-134 cycle order
    C0-CONTROL-2                      GREEN       GREEN       -

  M1b is the item's own defect and the decisive case: 51% "first quarter" -> "waxing
  gibbous" is adjacent, keeps PHASE_NAMES order non-decreasing, keeps the mirror, keeps
  the band search satisfied — and T-134 stays GREEN on it while T-135 goes RED. Cycle 38's
  claim that the hole was real is now CONFIRMED by measurement rather than argued, and
  confirmed closed by the same measurement.
  M3 is the sharper version: "waxing gibbous" -> "first quarter" walks BACKWARDS in
  PHASE_NAMES, yet the row above is already "first quarter" so the order clause is still
  satisfied. Only reachability sees it.
  M5 is recorded to bound the guard's authority rather than to praise it. 96% "waxing
  gibbous" -> "waning gibbous" is a REACHABLE pair, so T-135 cannot see it at all; it is
  caught upstream by T-134's cycle-order clause. Reachability is a name-PLAUSIBILITY
  check, not a name-CORRECTNESS check. The two clauses cover each other, and neither
  alone covers the table — worth saying plainly so a later reader does not over-trust it.

  DETERMINISM (the acceptance forbids Date.now()):
    executable added lines use Date.UTC(2026, 0, 1) and new Date(<expr>) only; the two
    `Date.now()` strings in the added block are both inside comments saying "never
    Date.now()" — my first automated check flagged them as PRESENT and was wrong, so this
    was read by hand.
    TZ=UTC / Asia/Tokyo / America/New_York / Pacific/Kiritimati -> 135/135 GREEN in all
    four. A test that swept real Date instants without pinning the zone would have moved.

  COST: 2058ms vs a 1998ms pre-item baseline — +60ms for 3,361 renderLine calls, against
  a caveat that explicitly warned the naive 173k-call version would sink the suite.

  SCOPE: README.md, src/, bin/ byte-identical to HEAD; README restored byte-for-byte after
  every mutation case (asserted in a finally block and printed, both batteries).

MEASURED RESIDUAL, filed as T-136 (todo, priority 7, S, sonnet) — and it is the one case
that did NOT go as I expected.
  M4-HONEST-REGEN: expect GREEN, got RED. The probe found that the committed 35-day sweep
  yields 208 distinct (name, percent) pairs while the 1-min/120-day sweep of the same
  shipping code yields 209. Exactly one pair is missing: 44% "first quarter", with 60 hits
  in the fine sweep — a pair the product really does emit. I rebuilt README row 3 from the
  shipping renderer at a real instant that produces it (2026-02-24T00:28:00Z), north half,
  south half, real discs, real mirror:
    "░░▒█◗  44%  first quarter     ◖█▒░░  44%  first quarter"
  and the suite went RED on T-135. That is an HONEST README regeneration being rejected —
  the same trap class that failed T-134 attempt 1 at cycle 37, now one pair wide instead
  of table-wide.
  WHY THIS IS NOT A GATE FAIL, stated so the reasoning can be attacked later: T-135's
  acceptance named two must-clauses — order-preserving retypes turn the suite red (3/3
  confirmed) and the current honest table stays green (135/135 confirmed). Both hold in
  full. Cycle 37's T-134 failure was different in kind: there the implementation failed a
  clause the acceptance named explicitly (it sampled the band's centre when the clause
  said band), and it rejected the README as it actually stood. Per the cycle-8/T-111 and
  cycle-17 disposition, an item whose acceptance passed in full is not failed over a
  nuance found outside it.
  WHOSE FAULT: mine, not the builder's. My brief told it to coarsen the sweep and prove
  the 15 CURRENT rows survive. It did exactly that, and said so with numbers. Coverage of
  the reachable SET was never asked for. This is the eighth self-instrument note of the
  run in the cycle-8/9/19/23/29/32/37 family — my measuring instrument narrower than the
  thing it measured — and distinct from cycle 38's, which was a false premise injected
  into a brief.

self-instrument note, against myself — MY FIRST MUTATION BATTERY MISBUILT TWO OF ITS OWN
MUTANTS. In the first run M2 and M3 went RED, but by T-134, not T-135. That looked like a
product finding and was not: my retypeRow() assumed the north name field carried five
trailing spaces, true of row 3's 13-char "first quarter" and false of the 14-char names,
which carry four. The five-space pattern never matched, so only the SOUTH half was
retyped and T-134's "north and south disagree on phase name" clause fired first. A mutant
that dies of a construction defect proves nothing about the guard being tested. Rebuilt in
cycle-039-gate-T-135b.js with the padding MEASURED from each row; all four then landed as
expected. Both batteries are kept on disk — the wrong one too, since a gate that only
preserves its successful runs is not evidence. What saved this was attributing each RED to
a named test rather than reading "the suite went red" as a pass; a bare red/green battery
would have recorded two fake kills as real ones.

not run, and why (never rendered as passed):
  collision-scan — the standing gate check is scoped to browser targets built from classic
    non-module scripts; moon is a Node CommonJS CLI with no browser surface.
  qa-verify look pass — triggers on user-visible browser assets. The merged file is a test
    file; this repo serves nothing to a browser.
  review-fix — the run's ONE pass ran at cycle 23; not re-run.

wave autotune: the k=1 wave was CLEAN — zero reverts, zero failed verifies -> second
  branch of the rule -> wave_streak 1 -> 2, which trips the bump: k_current 4 -> 5,
  wave_streak reset to 0. Inert in practice: min(k_current 5, gear cap 1) = 1, and gear 1
  is structural for the rest of the run, so k_current is now pinned at the hard max while
  every wave stays k=1.
counters: consecutive_no_value stays 0, consecutive_failures stays 0 (verified value this
  cycle).
backlog: 37 items — 33 done, 4 todo. T-135 closed; T-136 newly filed at priority 7, above
  the three ratchet-rejected doc nits, because it is a live false-positive risk on the
  exact artifact the guard exists to protect. known_issues unchanged at 5.
notifications: none emitted. Phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0 — none of the three step-8 emit conditions fired.

runfile-mirror:
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786771640, "next_wakeup_at": 1786774340, "pid": 255809, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786772524, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 39: probe still NOT invoked -- same standing decision as cycles 35-38 and the same closed reason: SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). Re-grepped this cycle to keep the claim honest rather than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json` returns NOTHING. probe_failures stays at 34 -- an attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe, refreshed 05:25:47 by the pacer): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0, week_elapsed_pct 71.68, dial 0.3. weekly_heat 76.0/71.68 = 1.060 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.344 > 1.2 keeps promote blocked. Allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1, for the thirty-ninth straight cycle. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. Movement since cycle 38: week_elapsed_pct 71.44 -> 71.68 while weekly_used_pct held at 76.0, so weekly_heat FELL 1.064 -> 1.060 -- recorded because a heat that only ever rose would eventually engage the governor, and this one did not. Control note: bin/swarm-notify.sh poll succeeded again in the bare-relative form from /opt/swarm -- a sixth consecutive cycle of the same controlled comparison against the budget script's refusal in that identical form.", "weekly": {"ok": true, "weekly_used_pct": 76.0, "opus_used_pct": 96, "week_elapsed_pct": 71.68, "weekly_heat": 1.06, "opus_heat": 1.344, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 13, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

### cycle 39 addendum — resync

commit: 3f7ac63 (pushed to origin/main; `git push` returned 5ae4224..3f7ac63, no retry
  needed).
wakeup: the block above and its mirror were written with next_wakeup_at 1786774340 (the
  step-0 worst-case build-wave heartbeat, never a real wakeup). The step-8 render
  re-derived it at render time to 1786772705 (2026-08-15T05:45:05Z) and wrote that to the
  runfile and current.json.bak; the runfile value is authoritative and the mirror below is
  resynced to it. This cycle produced VERIFIED VALUE, so it draws the 90s base band rather
  than the 900s no-value band; 90s does NOT outlive the persist + commit + push + render
  tail, so this is the cycles-35/36/38 case: the journal-time instant had genuinely
  expired by render time and the re-derivation is load-bearing, not tidiness. Clamp
  checked: 1786772705 + 900 <= stop_at 1786807947. On the VPS the pacer
  (swarm-pacer.timer, every 5 min) reads next_wakeup_at and IS the firing mechanism —
  ScheduleWakeup chains do not sustain in a headless -p session, so it was not called, per
  cycle.md step 9.
dashboard: rendered with 10 live-region substitutions; runs/dashboard-check.py PASS. The
  burn-up moves in BOTH directions again and the tooltip names both: the numerator gains
  T-135 (+1 verified), and the DENOMINATOR moves 36 -> 37 because T-136 was filed and not
  closed, so every earlier bar is drawn slightly shorter than it was an hour ago while
  nothing about those cycles changed. The unattributed one-item gap is unchanged in kind:
  the commit-subject series sums to 32 against 33 done, still stated rather than explained
  away. Cycles 34 and 37 stay flat by design and the tooltip still says so.
artifact: no Artifact tool in a headless -p session, so the publish channel is skipped
  silently per cycle.md step 8 — that is not a publish failure and publish_failures stays
  0. The local render IS the publication here; caddy serves runs/dashboard.html.
notifications: none emitted — phase unchanged (VALUE_LOOP), no target stalled,
  publish_failures still 0. None of the three step-8 emit conditions fired.
next pick, stated so the next session does not have to re-derive it: T-136 is the only
  open item that clears the VALUE_LOOP ratchet (the other three are ratchet-rejected
  cosmetics). It is priced but NOT solved — the notes give the measured cost of three
  sweep shapes and explicitly say to MEASURE which one closes the 44% first-quarter blind
  spot rather than reason about it, because at 15-min steps over 120 days that pair's
  expected hit count is only ~4.

runfile-mirror (resynced):
```json
{"version": 1, "run_label": "improvement-2026-08-14", "run_kind": "improvement", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-15T15:32:27+00:00", "usage_reset_at": "2026-08-14T20:32:35+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "pacing": {"mode": "guest", "dial": 0.3}, "heartbeat": {"ts": 1786772615, "next_wakeup_at": 1786772705, "pid": 255809, "limp": false, "degraded_tiers": []}, "budget": {"source": "allocator", "gear": 1, "gear_target": 1, "ratio": null, "mode": "guest", "k_cap": 1, "promote": false, "demote": true, "window_tokens": 0, "window_cost_usd": 0, "tokens_per_hour": 0, "projected_depletion_at": 0, "last_probe_ts": 1786772524, "last_real_probe_ts": 0, "probe_failures": 34, "probe_note": "cycle 39: probe still NOT invoked -- same standing decision as cycles 35-38 and the same closed reason: SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). Re-grepped this cycle to keep the claim honest rather than inherited: `grep -n swarm-budget /opt/swarm/.claude/settings.json` returns NOTHING. probe_failures stays at 34 -- an attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe, refreshed 05:25:47 by the pacer): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 76.0, week_elapsed_pct 71.68, dial 0.3. weekly_heat 76.0/71.68 = 1.060 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.344 > 1.2 keeps promote blocked. Allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1, for the thirty-ninth straight cycle. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. Movement since cycle 38: week_elapsed_pct 71.44 -> 71.68 while weekly_used_pct held at 76.0, so weekly_heat FELL 1.064 -> 1.060 -- recorded because a heat that only ever rose would eventually engage the governor, and this one did not. Control note: bin/swarm-notify.sh poll succeeded again in the bare-relative form from /opt/swarm -- a sixth consecutive cycle of the same controlled comparison against the budget script's refusal in that identical form.", "weekly": {"ok": true, "weekly_used_pct": 76.0, "opus_used_pct": 96, "week_elapsed_pct": 71.68, "weekly_heat": 1.06, "opus_heat": 1.344, "ceiling": 5, "promote_blocked": true}, "gear_basis": "allocator-posture"}, "playbook": {"mode": "auto", "applied": ["L-003", "L-008", "L-016", "L-023-moon", "L-024-moon", "L-026-repo-atlas"], "vetoed": ["L-006", "L-007", "L-011", "L-018", "L-020", "L-021", "L-022"], "veto_reason": "conductor-scoped, not user-vetoed: all seven target a browser/SPA/React/env-key surface that a zero-dependency Node CLI does not have. Splicing 'open the running product in a browser' into a QA brief for a stdout CLI is noise that degrades the brief. Recorded as vetoed rather than applied so the ledger stays honest.", "id_collision_warning": "playbook/learnings.md contains DUPLICATE ids: L-023, L-025 and L-026 each appear twice with different content and different [source:] runs (repo-atlas 2026-08-13 and moon 2026-08-14). Ids are disambiguated here with a -source suffix. This is a SWARM-side playbook integrity defect for the morning report; hard rule 5 forbids fixing it mid-run.", "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value."]}}}, "watchdog": {"mode": "normal", "plist_loaded": false, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "wrap_up_complete": false, "cycles_since_recycle": 13, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```
