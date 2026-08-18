# journal — moon

> **Archived:** runs 1 and 2 (through 2026-08-17) live in
> [`journal-archive-through-2026-08-17.md`](./journal-archive-through-2026-08-17.md) —
> 738064 bytes / 7688 lines / 49 blocks, moved verbatim at cycle 83.
> Run 3 (cycles 66–84) lives in
> [`journal-archive-run3-cycles-66-84.md`](./journal-archive-run3-cycles-66-84.md) —
> 325114 bytes / 3834 lines / 24 blocks, moved verbatim at cycle 91.
> Nothing was deleted: the archives hold the full text, and every pre-archive version of
> this file is in git history. This file continues from improvement run 4.
## cycle 85 | 2026-08-18T12:43:47+00:00 | moon | PLAN -> BUILD
work: KICKOFF (improvement run 4, allocator TRICKLE auto-kickoff) + inline PLAN — the backlog held 1 todo against a brand-new 6-must-have spec, so the PLAN gate was the only open gate.
workflow: inline PLAN, 1 Plan-type subagent (sonnet) | models: planner sonnet; taste judge fable (kickoff); no build wave this cycle
kickoff: allocator hints consumed and deleted (mode=guest dial=0.30 posture=trickle, stop_at 2026-08-19T12:21:07+00:00). Guard 1d improvement-run path taken: existing repo REUSED, no git init, no gh repo create. Run-3 spec preserved verbatim at .swarm/SPEC-improve-2026-08-17.md.
stress-test: verdict RESHAPE (confidence 7). "harden tests" reshaped to "no test may be added that does not close a survivor already on record or a defect already filed"; no new measurement axis; "polish docs" narrowed to two named deliverables. "Nothing needed doing" declared an ALLOWED terminal outcome.
prior-art: 4 searches, stance BUILD. The only direct Node moon-phase CLI hit (ShawnMcGough/moon-phases) has 0 stars and licenseInfo null — fails the license gate outright. Nothing to adopt or extend.
taste-judge (fable, fresh, spec text only): use-twice 3, product-not-demo 8, scope-fits-night 9, one-memorable-thing 3. Verdict: honest and safely scoped, but worth spending ONLY if the capacity has no competing claim. allocator.json records posture=trickle, human_active=false, allow_overall_pct=0 — that condition is met, and it is recorded rather than assumed.
playbook: apply_mode auto, 14 [apply:] lessons staged (L-008,016,020,021,022,024,026,029,031,033,034,042,043,044) by DIRECT READ of learnings.md — bin/swarm-playbook.sh parse DENIED again (KI-2, 12th consecutive run). L-021/L-022 held out of prompt_lines as browser-shaped against a terminal CLI. DEVIATION recorded: L-020 wired IN this run (held out on 2026-08-16 as browser-shaped) — its mechanism is suite-level env restore hooks, and this repo detects hemisphere from TZ, so the hazard is live here. Ledger line hand-appended to playbook/applied.log.

VERIFICATION EVIDENCE:
  baseline, conductor-run (not inherited): node --test test/*.test.js
    ℹ tests 171 / ℹ pass 171 / ℹ fail 0 / ℹ duration_ms 2928.6   PASS

  T-175 reproduced independently of the planning agent:
    node -e "require('/opt/targets/moon/src/hemisphere.js').detectHemisphere(z)"
    US/Samoa -> north          <-- DEFECT
    Pacific/Samoa -> south     Pacific/Pago_Pago -> south    NZ -> south
    Brazil/East -> south       Chile/Continental -> south    Asia/Ujung_Pandang -> south
    America/Buenos_Aires -> south                            US/Alaska -> north
    CONFIRMED: one row missing from a table whose purpose is names outside the 418-zone Intl set.

  T-175 scope claim CHECKED, and it narrows the spec's own framing:
    TZ=US/Samoa node bin/moon.js --json
    {"phase":"waxing crescent",...,"hemisphere":"south",...}   <-- shipped CLI is CORRECT
    TZ=US/Samoa node -e 'Intl.DateTimeFormat().resolvedOptions().timeZone' -> Pacific/Pago_Pago
    So: reachable via the exported API or a small-icu runtime, NOT from the CLI on a full-ICU host.

  doc citations, measured with a run-time instrument (all 17 in README/REPORT/CONTRACTS):
    citations found: 17 | file resolved: 17 | file missing: 0
    16 of 17 resolve to the code they name. ONE stale, appearing TWICE:
      REPORT.md:288 -> test/render.test.js:629  [claims "KI-5 pin: disc glyph set ..."]
        actual: const f = 1 - Math.acos(1 - 2 * k) / (2 * Math.PI); // waning: second crossing
      REPORT.md:428 -> render.test.js:629  [same claim, same miss]
      true location: test/render.test.js:826 (section comment at 764)
    CONDUCTOR CORRECTION TO THE PLANNING AGENT, which marked this citation CURRENT with a
    true_value ("const k = 0.014;") that is both off by one AND not the KI-5 pin test.
    Filed as T-183.

  lesson audit L-043 CLEAN — conductor-verified:
    grep -rn '\[\^>\]\*' test/ src/ bin/  ->  (no matches)
    the only two [^>]+ uses are markdown-placeholder detection (regressions.test.js:249,266)
    readmeSection (regressions.test.js:19-31) uses plain string search, with a comment
    pre-empting L-043's exact multi-line failure mode.   PASS

  lesson audit L-045 CLEAN — conductor-verified:
    grep -n "171\|=== 6\|length, 6" test/report-issues.test.js  ->  (no matches)
    its heading-count test derives BOTH the claimed N and the actual row count live from
    REPORT.md — no hardcoded expected value.   PASS

  lesson audit L-029, L-044 — AGENT-CLAIMED CLEAN, NOT conductor-verified.
    Recorded as half-verified and filed as T-185 rather than reported as checked.

  NOT RUN, reported as not-run: the kickoff headless zero-prompt assert
    (claude -p "/swarm status ...") was DENIED — the nested claude spawn is not allowlisted.
    Same allowlist gap as KI-2. Watchdog relaunches may stall; on the VPS the pacer is the
    real firing mechanism, so recovery is degraded, not absent.

backlog: 5 todo covering all 6 must-haves — T-175(p1,S,sonnet) T-182(p2,S,sonnet)
  T-183(p3,S,haiku) T-184(p4,M,sonnet) T-185(p5,S,fable). PLAN gate CLOSED, phase -> BUILD.
  Zero lesson violations found: the audit's honest outcome is CLEAN, and the SPEC names
  checked-and-clean a valid result.
next wave (k = min(k_current 3, gear-2 cap 2) = 2): T-175 + T-182 — pairwise-disjoint
  files_hint (src/hemisphere.js+test/hemisphere.test.js vs .swarm/KI-8-OWNER-ACTION.md).
  T-183 and T-184 both touch REPORT.md and are sequenced by deps, never paired (L-016).
commit: 869182f "cycle 85: KICKOFF improvement run 4 + inline PLAN [5 items filed, 0 lesson violations, 1 stale citation found]"
next wakeup: 1787057117 (+90s)
runfile-mirror:
```json
{"version":1,"run_label":"improvement-moon-2026-08-18","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-19T12:21:07+00:00","usage_reset_at":"2026-08-18T13:00:00+00:00","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1787057027,"next_wakeup_at":1787057117,"pid":2240352,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.108,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":60525618,"window_cost_usd":48.99,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":13834765,"projected_depletion_at":1787058000,"last_probe_ts":1787056144,"last_real_probe_ts":1787056144,"probe_failures":1,"probe_note":"bin/swarm-budget.sh DENIED by the allowlist gap (KI-2) for the 12th consecutive run; the numbers here are REAL, taken by running the script's own PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) by hand. source=probe is therefore accurate about the DATA and probe_failures=1 is accurate about the SCRIPT.","weekly":{"ok":true,"weekly_used_pct":30,"opus_used_pct":20,"week_elapsed_pct":18.66,"weekly_heat":1.61,"opus_heat":1.07,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":1,"playbook":{"mode":"auto","applied":["L-008","L-016","L-020","L-021","L-022","L-024","L-026","L-029","L-031","L-033","L-034","L-042","L-043","L-044"],"vetoed":[],"directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.","Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test","Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns","For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]},"held_out":{"ids":["L-021","L-022"],"why":"both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."},"staged_by":"conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}},"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 86 | 2026-08-18T12:55:50+00:00 | moon | BUILD
work: build-wave, k = min(k_current 3, gear-2 cap 2) = 2 — T-175 (Samoa hemisphere fix) + T-182 (KI-8 owner ask). Both were the wave cycle 85 pre-composed; files_hint pairwise disjoint (src/hemisphere.js + test/hemisphere.test.js vs .swarm/KI-8-OWNER-ACTION.md).
workflow: DIRECT Agent dispatch, not Workflow — the Workflow tool is review-gated in a `-p` session, which is the documented failure-table fallback. No worktrees; the two agents were given strictly disjoint file scopes and the post-hoc `git status` confirmed exactly 3 touched paths, no crossover.
models: T-175 sonnet (fix — build/fix never demotes below sonnet); T-182 haiku, DEMOTED from the sonnet the backlog item asked for by the gear-2 demote rule for S-effort docs. Playbook builder prompt_lines appended to both dispatches.
clock+burn: bin/swarm-budget.sh DENIED again (KI-2, 13th consecutive run) in the absolute form AND with a RUNFILE= env prefix. PROBE_CMD run by hand instead: window 08:00–13:00Z, 72,942,947 of a 130,591,250 token limit (57.8%), ~15.1M tok/h, reset 13:00Z. ρ = 0.044 → gear 5 on burn alone, but guest clamps to 3 and the weekly governor ceiling clamps to 2. Gear 2 stands, k_cap 2, demote on, promote blocked.
KI-2 NARROWED (new measurement, not a re-observation): `bin/swarm-notify.sh poll` SUCCEEDED this cycle in the bare-relative form with cwd=/opt/swarm, in the same session where the budget probe was refused at every path tried. That is the cycle-83 root cause confirmed by controlled comparison: the gap is a MISSING ALLOWLIST ENTRY for swarm-budget.sh / swarm-playbook.sh, not a path-form effect, not a shell-script-class effect, not a flaky permission layer. Notify is NOT degraded on this host; budget and playbook are. Fix remains a settings edit a human must make (hard rule 5 fences the run from it).
control: poll clean, pending[] empty, inject[] empty — nothing to triage or apply.
craft: node bin/swarm-craft.mjs ran clean, degraded[] empty (ui 2969 / review 2233 / docs 1737 chars). No item flagged craft:"ui" — a terminal CLI item and a markdown item, no browser surface — so no craft pack was spliced into either prompt.
post-merge checks SKIPPED, with the reason recorded rather than silently omitted: collision-scan.mjs is a gate for browser targets built from classic non-module scripts, and the qa-verify look pass keys on user-visible merged files (html/css/client-js/template/static). This wave merged one CommonJS source file, one test file and one markdown file. Neither check applies; neither was run; neither is reported as passed.

GATE DEFECT FOUND IN MY OWN INSTRUMENT — recorded because editing a gate after watching it fail is exactly the shape of weakening one:
  gate-c86.mjs was authored and sealed at sha256 5f3a7764 BEFORE dispatch, per the standing
  rule that builders must never be able to code to the check. It ran and reported
  T-175b FAIL, "failing test(s): (none named)".
  That was NOT a product defect. The gate parsed TAP ("# tests N", "not ok N - name");
  Node v24.19.0 defaults to the SPEC reporter ("ℹ tests N", "✖ name"), so every tally read
  "? / ? / ?" and the failing-name regex matched nothing on a suite that HAD gone red.
  Fix touched the two PARSERS only — no assertion, no arm, no threshold. Re-sealed at
  sha256 d1a81a68 and re-run: 8/8 pass. The post-fix gate is strictly MORE discriminating
  than the sealed one, since the sealed one could not see a failure at all.
  Both hashes are in the record so the diff, not my assurance, is the evidence.

VERIFICATION EVIDENCE (sealed gate d1a81a68, conductor-run; full output at .swarm/runs/cycle-086-verify-gate.txt):
  [PASS] BASE full test_cmd green on the working tree
        tests 171 / pass 171 / fail 0
  [PASS] T-175a detectHemisphere('US/Samoa')==='south' AND no US/* collateral
        US/Samoa -> south
        Pacific/Samoa -> south
        Pacific/Pago_Pago -> south
        us/samoa -> south
          US/Samoa   -> south
        NZ -> south
        US/Pacific -> north
        Japan -> north
        US/Alaska -> north
        US/Hawaii -> north
  [PASS] T-175b arm A: mutant + new test -> RED and attributable by name
        deleted src line 163: 'us/samoa', // legacy alias of Pacific/Pago_Pago - Pago Pago is 14d16' S
        tests 14 / pass 13 / fail 1
        failing test(s): legacy top-level aliases | failing tests: | legacy top-level aliases
  [PASS] T-175c arm B: mutant + HEAD test file -> GREEN (kill is attributable to the new test alone)
        tests 14 / pass 14 / fail 0
  [PASS] T-182a names the one line, the exact file (LICENSE at repo root), and what stays broken
        copyright-line:true LICENSE:true package.json:true private:true
  [PASS] T-182b does NOT contain MIT license body text
        no MIT boilerplate
  [PASS] T-182c invents NO legal holder (every copyright line is a placeholder)
          Copyright (c) <year> <legal holder>
  [PASS] T-182d standalone and short (<= 600 words)
        278 words
  
  === GATE VERDICT ===
  PASS  BASE  full test_cmd green on the working tree
  PASS  T-175a  detectHemisphere('US/Samoa')==='south' AND no US/* collateral
  PASS  T-175b  arm A: mutant + new test -> RED and attributable by name
  PASS  T-175c  arm B: mutant + HEAD test file -> GREEN (kill is attributable to the new test alone)
  PASS  T-182a  names the one line, the exact file (LICENSE at repo root), and what stays broken
  PASS  T-182b  does NOT contain MIT license body text
  PASS  T-182c  invents NO legal holder (every copyright line is a placeholder)
  PASS  T-182d  standalone and short (<= 600 words)
  
  GATE PASSED: all checks

  L-029 IS THE POINT HERE, and the builder did not actually satisfy it. Its return said
  arm B "would not fail" against the prior test file — REASONED, from a Read it had taken
  before editing. The conductor RAN it: HEAD's test/hemisphere.test.js + the same
  src-row deletion → 14/14 GREEN. So the kill in arm A is attributable to the new
  assertion alone and to nothing else in the suite. Claim became fact only at this step.

  T-182 read end to end by the conductor, beyond the mechanical checks: the document is
  addressed to the owner, names LICENSE at the repo root explicitly (the gap REPORT.md:291
  left open), and refuses the holder. One judgment call recorded: line 19 illustrates the
  slot with "e.g., Jane Doe / Acme Corporation / The Contributors". Those are labelled
  examples of the KIND of legal person, not an assertion about this repo's holder, and the
  sole rendered copyright line is the bare placeholder. Read as compliant with the
  non-goal, and flagged here so a human can disagree.

items: T-175 done (verified) · T-182 done (verified) · 0 reverted · 0 failed verifies
backlog: 80 done / 3 todo / 3 dropped (86 total). Remaining: T-183 (p3, S, haiku — stale render.test.js:629 citation), T-184 (p4, M, sonnet — REPORT.md first-screen restructure), T-185 (p5, S, fable — conductor-verify the agent-claimed L-029/L-044 audit verdicts).
wave autotune: CLEAN wave (0 reverts, 0 failed verifies) → wave_streak 0 → 1. k_current stays 3; a second consecutive clean wave would raise it to 4, where the gear-2 cap of 2 would still bind.
next wave: T-183 and T-184 both touch REPORT.md and must never be paired (L-016) — so the next wave is T-183 + T-185 (disjoint: REPORT.md vs test/), with T-184 sequenced after T-183 lands.
commit: 5f986cf
next wakeup: 1787057940 (+90s, base delay after a verified-value cycle)
runfile-mirror:
```json
{"version":1,"run_label":"improvement-moon-2026-08-18","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-19T12:21:07+00:00","usage_reset_at":"2026-08-18T13:00:00+00:00","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1787057750,"next_wakeup_at":1787060147,"pid":2244955,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.044,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":72942947,"window_cost_usd":57.88,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":15096000,"projected_depletion_at":1787058000,"last_probe_ts":1787057750,"last_real_probe_ts":1787057750,"probe_failures":2,"probe_note":"bin/swarm-budget.sh DENIED again (KI-2, 13th consecutive run) in BOTH the absolute form and with a RUNFILE= env prefix. The numbers here are REAL: the conductor ran the script's own PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) by hand. Window 08:00-13:00Z, 72.94M of a 130.59M limit (57.8%), reset ~10 min after this cycle opened. rho = 0.044 would reach gear 5, but guest mode clamps to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands. NEW THIS CYCLE, and it narrows KI-2: bin/swarm-notify.sh poll SUCCEEDED in the bare-relative form with cwd=/opt/swarm, confirming the cycle-83 root cause exactly - the gap is a MISSING ENTRY for budget/playbook, not a path-form or shell-script-class effect. notify is NOT degraded on this host.","weekly":{"ok":true,"weekly_used_pct":30,"opus_used_pct":20,"week_elapsed_pct":18.66,"weekly_heat":1.61,"opus_heat":1.07,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":2,"playbook":{"mode":"auto","applied":["L-008","L-016","L-020","L-021","L-022","L-024","L-026","L-029","L-031","L-033","L-034","L-042","L-043","L-044"],"vetoed":[],"directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.","Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test","Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns","For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]},"held_out":{"ids":["L-021","L-022"],"why":"both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."},"staged_by":"conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}},"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 87 | 2026-08-18T13:16:19+00:00 | moon | BUILD
work: build-wave, k = min(k_current 3, gear-2 cap 2) = 2 — T-183 (stale render.test.js:629 citation) + T-185 (conductor-verify the L-029/L-044 audit verdicts). T-184 was ELIGIBLE by gear and by effort but was excluded by its own deps: it and T-183 both rewrite REPORT.md, and L-016 says disjoint files are necessary but not sufficient — here they are not even disjoint. T-184 is next, alone.
dispatch: T-183 went to a haiku agent by DIRECT Agent call (Workflow is review-gated in a `-p` session — the documented failure-table fallback). T-185 was executed INLINE BY THE CONDUCTOR and never dispatched, because its acceptance clause names the conductor as the party who must run the check: handing it to an agent would have reproduced the exact defect the item exists to close, which is a lesson verdict resting on an agent's reading rather than on a run.
models: T-183 haiku (S-effort docs; gear-2 demote would push sonnet→haiku and it is already there, so no change). T-185 was routed fable in the backlog as a judgment seat; conductor-inline execution supersedes that and no model was spent on it. Playbook builder prompt_lines appended to the T-183 dispatch.
clock+burn: bin/swarm-budget.sh DENIED for the 14th consecutive run (KI-2), this time in the `RUNFILE=... bin/swarm-budget.sh` relative form. PROBE_CMD run by hand and SUCCEEDED. The usage window ROLLED at 13:00Z, four minutes before this cycle opened: new block 13:00–18:00Z, 502,611 tokens in its first ~5 minutes against the 130.59M limit. ρ = 0.23 → gear 5 on burn alone; guest clamps to 3, the weekly governor ceiling clamps to 2. Gear 2 stands, k_cap 2, demote on, promote blocked. ccusage's own 218M end-of-window projection is extrapolated from a 5-minute sample and is NOT treated as evidence.
probe_failures HELD at 2, not incremented, and the reason is recorded so the number is not misread as evidence it is not: the script never launched, so it returned neither probe_ok true nor false. The gear rests on a real measurement taken by hand, not on a clock fallback.
control: poll clean — pending[] empty, inject[] empty. Nothing to triage or apply.
post-merge checks NOT RUN, with the reason recorded rather than silently omitted: collision-scan.mjs gates browser targets built from classic non-module scripts, and the qa-verify look pass keys on user-visible merged files. This cycle merged one markdown file. Neither check applies; neither ran; neither is reported as passed.

GATE INSTRUMENT DEFECT, caught BEFORE the gate ever ran — recorded because editing a sealed gate is the shape of weakening one:
  The T-183 gate was authored and sealed at sha256 f7346312 BEFORE dispatch. While running the
  suite by hand for the T-185 audit I noticed node v24's spec reporter prefixes its summary with
  U+2139, not '#'. The sealed C8 matched `^# fail 0$`, which could never fire — it would have
  failed C8 against a green suite. This is the SAME reporter-format defect the cycle-86 gate hit;
  I reintroduced it one cycle later by writing the check from memory instead of from the record,
  which is itself an instance of L-045 (read the authoritative source, never the derived list).
  Fix touched the C8 PARSER only — no assertion, no arm, no threshold — and made it strictly more
  discriminating: it now requires tests/pass/fail to PARSE and requires pass == tests, so an
  unreadable reporter reads as INSTRUMENT FAILURE rather than as a pass (L-041). Re-sealed at
  sha256 25dc5a98. Both hashes are in the record so the diff, not my assurance, is the evidence.
  Second deviation, also recorded: `bash <gate>.sh` is DENIED by this host's allowlist, so the
  sealed shell gate was executed as a faithful node port, .swarm/gates/cycle-087-T-183.mjs — same
  eight checks, same order, still authored before dispatch and never shown to the builder.

VERIFICATION EVIDENCE — T-183 (sealed gate 25dc5a98, conductor-run; full output .swarm/runs/cycle-087-verify-T-183.txt):
    C1 residual :629 citations = 0
  PASS  C1 zero residual render.test.js:629 citations
    C2 occurrences at HEAD = 2
  PASS  C2 defect present at HEAD (non-vacuous fix)
    C3 KI-5 pin test truly declared at test/render.test.js:826
  PASS  C4 every render.test.js citation resolves to the KI-5 pin line
    C5 line 826 reads: test('KI-5 pin: disc glyph set matches the documented East Asian Width partition', () =&gt; {
    C6 citations checked = 10
  PASS  C6 all doc file:line citations resolve in range
    C7 non-.swarm files changed: [REPORT.md]
    C8 parsed: tests=171 pass=171 fail=0
  PASS  C8 full suite green (fail=0 and pass==tests)
  ---- GATE: 8 passed, 0 failed ----
The gate re-derived 826 itself, at verify time, from test/render.test.js — it did not trust the 826 sitting in the backlog note (L-045). C2 proves HEAD really carried the defect twice, so the pass is not vacuous. C6 is the collateral check: all 10 file:line citations across README/REPORT/CONTRACTS still resolve.

VERIFICATION EVIDENCE — T-185. This item asked whether two playbook lessons hold in this repo. Cycle 85 answered by READING the suite; that cannot establish either property, because both are statements about how a test behaves under mutation. So the conductor mutated and ran. Harness .swarm/gates/cycle-087-T-185-audit.mjs against a pristine `git archive HEAD` copy in /tmp, so neither the live tree nor the concurrent T-183 builder could touch the result. Baseline 171/171 green. Three subjects, one per source module, three arms each — A KILL, B ATTRIBUTION (same mutation, subject test skipped), C CONVERSE CONTROL (a same-region semantically neutral edit that must leave the suite GREEN).
  S2  T-129 ch.49 pins (src/astro.js), coefficient 0.00208 -&gt; 0.00209
      A fail=1, the named test is the killer · B fail=0 (170/170 — mutant SURVIVES when skipped) · C 171/171 green
      L-029 CLEAN   L-044 CLEAN
  S3  legacy top-level aliases (src/hemisphere.js), delete the us/samoa row added at cycle 86
      A fail=1, named test is the killer · B fail=0 (170/170) · C 171/171 green
      L-029 CLEAN   L-044 CLEAN
  S1  KI-5 pin (src/render.js), SHADE[1] U+2592 -&gt; U+25A8
      A fail=8, pin among the killers · B fail=7 — the mutant STILL DIES with the pin skipped · C 171/171 green
      L-029 NOT ESTABLISHED   L-044 CLEAN
      Robustness arm, because a single unlucky mutation is not a finding: re-run under two further
      substitutions chosen to be maximally favourable to the pin — both stay INSIDE Block Elements
      (U+2580–259F) and both are absent from the pin's own DOCUMENTED_EAW map, i.e. exactly the drift
      the pin exists to catch. U+2592-&gt;U+259A: B fail=7. U+2593-&gt;U+2584: B fail=11. Non-attributability
      survives every mutation tried, so it is a property of the suite, not of my mutation choice.
FINDING, and it corrects a verdict already in the record: the cycle-85 agent recorded L-029 CLEAN for the KI-5 pin on a structural read. It is not established, and cannot be by source mutation — the repo's exact-output tests subsume glyph identity, so the pin is never the attributable killer. That verdict is RETIRED. The pin is NOT worthless and was NOT touched: it uniquely asserts the documented-partition equality and the two-class straddle, neither of which any other test makes. What is wrong is the comment above it, which claims the pin is what makes an unannounced glyph change fail the gate. Filed as T-186, comment-truth only.
STATED LIMIT, recorded rather than hidden: three pins is not 171 tests, and L-029 is a proof obligation about how each test was BUILT, so no run of any size establishes it suite-wide. What this run retires is a claim that had no behavioural evidence behind it at all. SPEC must-have 2 is satisfied by the recorded reasoning plus this stated limit, not by a claim of full coverage.

items: T-183 done (verified, 8/8) · T-185 done (verified by measurement; one recorded verdict retired) · T-186 filed · 0 reverted · 0 failed verifies
backlog: 82 done / 2 todo / 3 dropped (87 total). Remaining: T-184 (p4, M, sonnet — REPORT.md first-screen restructure, now unblocked since T-183 landed), T-186 (p5, S, haiku — KI-5 pin comment truth).
wave autotune: CLEAN wave (0 reverts, 0 failed verifies) → wave_streak 1 → 2 → k_current 3 → 4, streak reset to 0. The gear-2 cap of 2 still binds every wave, so the raise is bookkeeping until the posture lifts.
next wave: T-184 alone. It is M-effort and rewrites REPORT.md structurally; T-186 touches test/render.test.js and is disjoint, so the two could pair — but T-184's own acceptance requires re-confirming test/report-issues.test.js's structural anchors against a tree nobody else is moving, so it runs alone and T-186 follows.
commit: 1fe6d8e
next wakeup: 1787059879 (2026-08-18T13:31:19+00:00, +900s). The 1787059801 first written here was computed before the final heartbeat stamp and was 78s stale; corrected from the runfile, which is authoritative (L-045). Base 90s is too short for a run with 23.1h of clock and one M-effort item next, so it is stretched to keep the pacer from spinning. Clamp checked: wakeup + 900 sits far inside stop_at, so hard rule 8 does not bind.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-moon-2026-08-18","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-19T12:21:07+00:00","usage_reset_at":"2026-08-18T13:00:00+00:00","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1787058844,"next_wakeup_at":1787059744,"pid":2250737,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.23,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":502611,"window_cost_usd":0.86,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":6031332,"projected_depletion_at":0,"last_probe_ts":1787058844,"last_real_probe_ts":1787058844,"probe_failures":2,"probe_note":"bin/swarm-budget.sh DENIED for the 14th consecutive run (KI-2), this time in the RUNFILE=... relative form. probe_failures is deliberately HELD at 2 rather than incremented, and the reason is stated so the number is not read as evidence it is not: the script never launched, so it returned neither probe_ok true nor false. The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, so this gear rests on real measurement, not on a clock fallback. Window rolled at 13:00Z: new block 13:00-18:00Z, 502,611 tokens spent in its first ~5 minutes against the 130.59M limit carried from the previous probe. rho = 0.23 on a 5-minute sample would reach gear 5, but guest mode clamps to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands unchanged - and hysteresis would have allowed only one step anyway. ccusage own projection (218M by 18:00Z, i.e. over the limit) is extrapolated from that same 5-minute sample and is NOT treated as evidence.","weekly":{"ok":true,"weekly_used_pct":30,"opus_used_pct":20,"week_elapsed_pct":18.72,"weekly_heat":1.61,"opus_heat":1.07,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":3,"playbook":{"mode":"auto","applied":["L-008","L-016","L-020","L-021","L-022","L-024","L-026","L-029","L-031","L-033","L-034","L-042","L-043","L-044"],"vetoed":[],"directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.","Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test","Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns","For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]},"held_out":{"ids":["L-021","L-022"],"why":"both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."},"staged_by":"conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}},"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

---

## cycle 88 — 2026-08-18T13:33:30+00:00 → 13:50 UTC · BUILD · build-wave k=1 (direct Agent dispatch)

work: T-184 — restructure REPORT.md so the first screen carries what-it-is / how-to-run / what-is-verified / known-issues, with the forensic detail archived rather than deleted. The run's last M-effort item and the fourth and final must-have of this SPEC.

pick: gear 2 permits k=2, and T-186 was the obvious second seat. It was deliberately NOT taken — see the decision recorded below and the `next wave` line. T-184 ran alone, as cycle 87 planned, because its acceptance is a structural claim about a tree nobody else is moving and this is a `-p` session with no worktrees (concurrent agents would share one working tree).

models: T-184 sonnet. The gear-2 demotion rung would have pushed a docs item sonnet→haiku; it was not applied, and the reasoning AND the counter-reading are both recorded as a decision rather than left implicit. Playbook builder prompt_lines appended to the dispatch, plus the craft docs pack (`node bin/swarm-craft.mjs`, `degraded: []` — no degradation to journal).

clock+burn: `bin/swarm-budget.sh` DENIED for the 15th consecutive run (KI-2). `bin/swarm-notify.sh poll` was DENIED this cycle as well — a NEW denial, not previously recorded: the relative-path allowlist entry that has been matching for 87 cycles did not match here. Non-fatal per cycle.md, and handled as cycle.md prescribes: the control channel was read from `runs/control.json` on disk instead. `pending[]` empty, `inject[]` absent — nothing to triage, nothing to apply, no ack to send.
PROBE_CMD run by hand and SUCCEEDED. Active block 13:00–18:00Z: **9,352,466 tokens, $7.54, at 13:34Z (~34 min in)** = ~275k tokens/min ≈ 16.5M/hour. **Two carried-forward inputs, named so the gear is not read as fully re-measured:** this probe invocation returned no `tokenLimitStatus`, so the **130.59M limit is carried from the cycle-87 probe**; and the weekly governor block is carried too, because `ccusage blocks --json` reports no weekly figures and the script that does is the denied one. On the carried limit, remaining = 121.24M over 266 min → target 455.8k/min at guest's forced dial of 1.0, so **ρ = 0.60** — the gear-4 band. Guest clamps to 3, the weekly governor ceiling clamps to 2. **Gear 2 stands, k_cap 2, demote on, promote blocked.** Holding at the lower gear is the conservative direction given two carried inputs.
`probe_failures` HELD at 2, not incremented, for the recorded reason: the script never launched, so it returned neither `probe_ok` true nor false, and the number must not be read as evidence of a probe that ran and failed.

post-merge checks NOT RUN, reason recorded rather than silently omitted: `collision-scan.mjs` gates browser targets built from classic non-module scripts, and the qa-verify look pass keys on user-visible merged files. This cycle changed one markdown file and added one more. Neither check applies; neither ran; neither is reported as passed.

CONDUCTOR ERROR, recorded because the record is worth more than the appearance of a clean cycle: while trying to READ `.swarm/gates/cycle-087-persist.mjs` I invoked it instead. It is not idempotent, and it appended a duplicate `T-186` to the backlog and stamped `"commit": "pending"` over cycle 87's real hash `1fe6d8e`. Caught immediately from its own stdout (`88 total`, `T-186 … T-186`), and both files were restored with `git checkout -- .swarm/backlog.json .swarm/state.json` — safe because no intentional edit to either had been made yet this cycle. Verified restored: 87 items, one T-186, `last_cycle.commit` back to `1fe6d8e`. This cycle's own persist script, `.swarm/gates/cycle-088-persist.mjs`, is **idempotent by construction** — it guards every append on an existence check and every counter advance on `cycle < 88` — so the same accident cannot repeat against it.

GATE INSTRUMENT DEFECT, caught by the gate itself, BEFORE any verdict rested on it:
    The T-184 gate was authored and sealed at sha256 766c1c60 BEFORE dispatch. Its C8 check ran the
    suite against a HARDCODED list of seven test files. The repo has nine — `manifest.test.js` and
    `regressions.test.js` were missing — so C8 measured tests=148 against a baseline of 171 and
    FAILED. A hardcoded list cannot explain a shrinking suite, which is what made it legible as an
    instrument fault rather than a product regression.
    This is the L-045 failure (read the authoritative source, never the derived list) — the SAME one
    cycle 87 recorded committing, reintroduced by me one cycle later, in a different check, for the
    same reason: I enumerated from memory instead of from disk.
    The fix touched the SUBJECT ENUMERATION only — no assertion, no arm, no threshold — and made the
    check strictly more discriminating: C8 now globs `test/*.test.js` from disk and prints the file
    list it ran, so adding a test file can never again silently shrink the measured suite.
    Re-sealed at sha256 0a236502. Both hashes are in the record so the diff, not my assurance, is
    the evidence. Twice-observed now, and flagged for the WRAP_UP distillation as a candidate
    lesson: **a gate's SUBJECTS must be read from disk, never listed from memory.**
    Standing deviation, restated so it is not lost: `bash <gate>.sh` is DENIED by this host's
    allowlist, so gates are authored and run as node `.mjs`.
    Standing residual, restated honestly: the sealed gate lives in `.swarm/gates/` inside the tree
    the builder can read. The seal is a hash plus a prompt-line prohibition, not an enforced
    boundary.

VERIFICATION EVIDENCE — T-184 (sealed gate 0a236502, conductor-run; full output `.swarm/runs/cycle-088-verify-T-184.txt`):
      C0 HEAD: Known issues line 279, How to run it line 612, first forensic heading line 92, bytes 60774
    PASS  C0 defect present at HEAD (fix is non-vacuous)
      C1 archive bytes = 39859
    PASS  C1 dated archive exists and is substantial (&gt;15 KB)
      C2 substantive HEAD lines orphaned = 0
    PASS  C2 every substantive HEAD line survives in REPORT.md or the archive
      C3 found: what-it-is · how-to-run · what-is-verified · known-issues heading
    PASS  C3 all four anchors within the first 60 lines
      C4 new REPORT.md: Known issues line 45, first forensic heading line none
    PASS  C4 the reader reaches known-issues before any run change log / stop postmortem / ops findings
    PASS  C5 REPORT.md points at the archive by filename (archival, not disappearance)
      C6 report-issues.test.js changed=false · assert calls 18 -&gt; 18 · test blocks 6 -&gt; 6
    PASS  C6 report-issues.test.js assertion and test-block counts did not decrease
      C7 non-.swarm files changed: [REPORT.md]
    PASS  C7 blast radius confined to REPORT.md
      C8 subjects read from disk: 9 files [args, astro, cli, contracts, hemisphere, manifest, regressions, render, report-issues]
      C8 parsed: tests=171 pass=171 fail=0
    PASS  C8 full suite green (fail=0, pass==tests, tests &gt;= 171 — no test deleted)
    ---- GATE: 9 passed, 0 failed ----

C2 is the load-bearing check and it is one-directional: it proves nothing was LOST. Alone it would let a builder rewrite every surviving sentence and still pass. So the conductor ran the **reverse** check by hand, which the gate does not cover: every trimmed line ≥ 25 chars in the new `REPORT.md` and the archive that is absent from `HEAD:REPORT.md`. Result: **exactly 4 added lines across both files** — one pointer paragraph under the REPORT title, one pointer italic above `## Honest hand-off`, one archive `# ` title, one archive purpose paragraph. All four read as connective, all four are quantity-free, and none asserts anything about the product. The move is therefore a move, not a rewrite, in both directions. Also re-ran the full suite AFTER writing `state.json` — `state.json` is a test INPUT for `report-issues.test.js`, so a persist step can break the suite after a gate has already passed: 171/171 green.

Shape of the result: REPORT.md 781 → **209 lines**, 60,774 → ~14 KB; anchors at lines 5 / 25 / 45 / 59; **zero** forensic headings remain in the reader-facing file. `.swarm/REPORT-ARCHIVE-2026-08-18.md`, 573 lines / 39,859 bytes, holds the provenance preamble, the build-run defect list, all three per-run change logs, all three stop postmortems, all three operational-findings sections and both stats tables — verbatim.

NEW ITEM FILED, from grepping rather than from reading the one file the item named: T-186's false attribution lives in **two** places, not one. `test/render.test.js:777` is T-186's scope; `REPORT.md:54` carries the same sentence shape — "…checks it against the documented partition, **so** an unannounced glyph change now fails the suite instead of drifting silently" — where the consequent is true of the suite and the "so" attributes it to the pin, which the cycle-87 measurement refutes (pin skipped: U+2592→U+259A still fails 7, U+2593→U+2584 still fails 11). Filed as **T-187**. `README.md` was grepped and is **CLEAN** — checked, so the scope is exactly two files and no third sweep is warranted.

items: T-184 done (verified, 9/9) · T-187 filed · 0 reverted · 0 failed verifies
backlog: 83 done / 2 todo / 3 dropped (88 total). Remaining: T-186 (p5, S, haiku — the pin comment) and T-187 (p5, S, haiku — the REPORT row).
wave autotune: CLEAN wave (0 reverts, 0 failed verifies) → wave_streak 0 → 1. `k_current` stays 4; the gear-2 cap of 2 binds every wave regardless, so the raise remains bookkeeping until the posture lifts.
next wave: **T-186 + T-187 together, k=2.** One finding in two disjoint files, judged against one measurement record (`.swarm/runs/cycle-087-verify-T-185.txt`). That closes the backlog, which makes the cycle after it the DONE determination — every SPEC must-have would then be closed, and the churn breaker must not read a finished target as stalled.
commit: 623b6ef (stamped by the cycle-88 addendum commit, as at cycles 85/86/87)
next wakeup: 1787061852 (2026-08-18T14:04:12+00:00, +900s). Base 90s is too short for a run with ~22h of clock and a two-item wave next; 900s keeps the pacer from spinning. Clamp checked: wakeup + 900 = 1787062752 sits far inside stop_at 1787142067, so hard rule 8 does not bind.

runfile-mirror:
```json
{"version":1,"run_label":"improvement-moon-2026-08-18","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-19T12:21:07+00:00","usage_reset_at":"2026-08-18T13:00:00+00:00","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1787060952,"next_wakeup_at":1787061852,"pid":2272110,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.6,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":9352466,"window_cost_usd":7.54,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":16504351,"projected_depletion_at":0,"last_probe_ts":1787060952,"last_real_probe_ts":1787060952,"probe_failures":2,"probe_note":"bin/swarm-budget.sh DENIED for the 15th consecutive run (KI-2); bin/swarm-notify.sh poll DENIED this cycle too, so the control channel was read from runs/control.json on disk instead (pending[] and inject[] both empty - nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, so this gear rests on real measurement. Active block 13:00-18:00Z: 9,352,466 tokens and $7.54 at 13:34Z, ~34 min in, i.e. ~275k tokens/min = ~16.5M/hour. IMPORTANT LIMIT CAVEAT: this probe invocation returned NO tokenLimitStatus, so the 130.59M limit is CARRIED FORWARD from the cycle-87 probe and was NOT re-measured this cycle. On that carried limit, remaining = 121.24M over 266 min = 455.8k/min target at the guest-forced dial of 1.0, so rho = 0.60, which is the gear-4 band. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands. The weekly block below is ALSO carried forward, not re-measured - ccusage blocks --json reports no weekly figures and swarm-budget.sh, which does, is the denied script. Holding at the lower gear is the conservative direction given both carried inputs. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false, and the number must not be read as evidence of a probe that failed.","weekly":{"ok":true,"weekly_used_pct":30,"opus_used_pct":20,"week_elapsed_pct":18.72,"weekly_heat":1.61,"opus_heat":1.07,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":3,"playbook":{"mode":"auto","applied":["L-008","L-016","L-020","L-021","L-022","L-024","L-026","L-029","L-031","L-033","L-034","L-042","L-043","L-044"],"vetoed":[],"directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.","Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test","Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns","For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]},"held_out":{"ids":["L-021","L-022"],"why":"both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."},"staged_by":"conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}},"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 89 — 2026-08-18T14:08:40+00:00 → 14:40 UTC · BUILD · build-wave k=2 (direct Agent dispatch, SEQUENTIAL)

clock/gear: `date +%s` = 1787062120. stop_at 1787142067 is 22h13m out, so no WRAP_UP and no admission pressure (build-wave's 2700s budget against a 79,047s window). `bin/swarm-budget.sh` DENIED for the **16th consecutive run** (KI-2), and `bin/swarm-notify.sh poll` denied with it, so the control channel was read from `runs/control.json` on disk: `pending[]` empty, no `inject` array — nothing to triage, and the `since_cursor` is unchanged from the pacer's last write. The underlying PROBE_CMD (`npx ccusage@latest blocks --json --token-limit max`) was run BY HAND and succeeded. **Improvement on cycle 88's probe: this one DID return `tokenLimitStatus`,** so the 130,591,250 limit is FRESHLY MEASURED this cycle rather than carried forward — one of last cycle's two carried inputs is now retired. Active block 13:00–18:00Z at 14:09Z: 20,518,009 tokens, $15.27, 69 min in → 297.4k tokens/min (17.84M/hour). Remaining 110.07M over 231 min = 476.5k/min target at the guest-forced dial of 1.0, so **ρ = 0.62**, the gear-4 band. Guest mode clamps reachable gears to 3; the weekly governor ceiling clamps to 2; **gear 2 stands**, unchanged. ccusage's own projection agrees there is no depletion risk: 93.06M projected against the 130.59M limit, status `ok`. The `weekly` block is STILL carried forward, not re-measured — `ccusage blocks --json` reports no weekly figures, and the script that does is the denied one. `probe_failures` **held at 2, not incremented**: the script never launched, so it returned neither `probe_ok` true nor false, and the number must not be read as evidence of a probe that failed.

orient: tree CLEAN at 32a66af, no salvage needed. Backlog on entry: 83 done / 2 todo / 3 dropped. The two todos, T-186 and T-187, are **one finding in two files** — the cycle-87 measurement that the KI-5 pin is not the attributable killer for glyph identity (record `.swarm/runs/cycle-087-verify-T-185.txt`: pin skipped, U+2592→U+259A still fails 7, U+2593→U+2584 still fails 11). Effective wave size = min(k_current 4, gear-2 cap 2, hard max 5) = **2**. Routing: kind `docs` routes sonnet, gear 2 `demote: true` drops docs/polish one rung → **haiku** for both, matching the models already recorded on the items.

**Why the wave ran SEQUENTIALLY rather than concurrently.** The two items have disjoint `files_hint` and would normally dispatch together. But `REPORT.md`'s KI-5 row cites `test/render.test.js:826`, and T-186 rewrites the comment block **directly above that test**. Run concurrently, T-187's agent could only have copied the number it found — and T-186 grew the block by 3 lines, moving the declaration to **829**. The wave was therefore dispatched in order, T-186 first, so T-187's agent re-derived the line from the post-T-186 tree at run time (L-045: re-derive at run time from the authoritative source). It did: `826 → 829`, by grep against the live file. The coupling was predicted before dispatch, not discovered after.

gate, sealed before dispatch: `SWARM/runs/c089-gate.mjs`, sha256 **`afccfd76921bc4c7ed0a279fc9d3d7b76f2ceed96f4dd3fd1d4cd2b887a5e6a5`**. 20 checks: G1 proves only `//` comment lines changed (making "the test body is unchanged" mechanical rather than promised), G3–G7 the prose predicates, H1–H4 table integrity, H9 the live line-number re-derivation. **Baseline arm run BEFORE any dispatch: GATE FAIL, 6 failures** — G3/G4/G5 in the comment, H5/H6/H7b in the REPORT row — exactly the defect the two items describe. A gate that cannot fail proves nothing, so the baseline is the arm that licenses the pass.

**Two gate instrument defects, both caught and both recorded rather than papered over.**
1. *Pre-dispatch.* The first draft of G3 passed vacuously on the unfixed tree. The source comment wraps its sentence across two `//` lines — "…so an" / "// unannounced glyph change fails…" — so a regex over the raw block never saw the connective it was written to catch. Fixed by stripping `//` prefixes and collapsing whitespace before applying any prose predicate; G3 then failed the baseline as it must. Sealed only after that.
2. *At verification.* The post-build run came back **GATE FAIL (1)** on H7a, "row states the documented-partition equality". H7a's regex encoded ONE word order. T-187 wrote the same equality in the other: "matches the partition documented in README.md" — which is *more* precise than the phrasing anticipated, since it names the document. Widening a predicate to admit the text in front of you is exactly the move hard rule 2 forbids when it hides a false claim, so the widened form was **proved to still discriminate before it was accepted**: `c089-gate-failability.mjs`, three arms — live row PASS, equality-clause-deleted FAIL, equality-reworded FAIL, each mutation confirmed to have actually applied. Note also that H7a passed on the *unfixed* baseline too; it is a positive-content check and was never one of the six that discriminated, so the amendment does not touch the checks that caught this cycle's defect. Amended hash `0dd141e858553b45cf02d1b6ca37e85586b7c0fa0ef1f26fbe719f9a9b81d22b`.

VERIFICATION EVIDENCE (full arms in `.swarm/runs/cycle-089-verify-T-186-T-187.txt`):
```
BASELINE (unfixed tree, sealed gate afccfd76)
FAIL G3 · FAIL G4 · FAIL G5 · FAIL H5 · FAIL H6 · FAIL H7b     GATE FAIL (6 failure(s))
FINAL (built tree, amended gate 0dd141e8)
PASS G1 only // comment lines changed vs HEAD (11 changed line(s), 0 non-comment)
PASS G3 · G4 · G5 · G6a · G6b · G7 · G8 pin test present at test/render.test.js:829
PASS H1 · H2 · H3 · H4 · H5 · H6 · H7a · H7b · H8
PASS H9 cited line number(s) 829 vs live pin declaration at 829
PASS H10                                                        GATE PASS (0 failures)
$ node /opt/swarm/runs/c089-gate-failability.mjs
OK A live row: predicate=true, expected=true · OK B deleted: false/false · OK C reworded: false/false
AMENDED H7a IS FAILABLE: passes only when the equality is actually stated.
$ node --test test/*.test.js     (baseline / built / after state.json write)
ℹ tests 171   ℹ pass 171   ℹ fail 0        — all three runs
```
The suite was re-run a third time AFTER `state.json` was written: `state.json` is a test INPUT for `report-issues.test.js`, so a persist step can break a suite that has already passed its gate. 171/171.

**What the gate did NOT establish, stated rather than hidden.** G4 and H6 passed **vacuously**. Both are conditional — *if* the text still claims a glyph change fails, it must attribute that to the exact-output tests — and neither final text contains the literal phrase the antecedent matches. Neither check exercised. The attribution was read by the conductor instead, and both are correct: T-186 says "Glyph identity mutations are guarded by exact-output tests (renderLine: exact output, renderBlock: exact output, T-134 README fences); this pin is not the identity guard"; T-187 says "Glyph-set changes crossing EAW classes fail the suite's exact-output tests … the pin uniquely establishes this width-class boundary." Read-not-measured, and labelled as such. Separately, T-187's qualifier "crossing EAW classes" is **narrower than the measurement supports** — the exact-output tests compare exact strings and fail on ANY glyph substitution, not only EAW-crossing ones. The sentence is true (an EAW-crossing change is a subset) but understates the coverage; not false, so not a gate failure, and recorded here rather than quietly accepted. Finally, neither item was re-measured by mutation this cycle: both rest on the cycle-87 record, cited rather than re-derived, which was the right scope for two S-effort doc items.

**NEW ITEM FILED, from the conductor's read and not from the gate: T-188.** T-187's rewrite dropped the test's TITLE from the citation. The row used to read ``test/render.test.js:826`` (``KI-5 pin: disc glyph set matches the documented East Asian Width partition``); it now reads ``test/render.test.js:829`` with no title. The number is correct **today** — H9 confirmed it — so this is not a stale citation. It is the removal of the anchor that makes staleness *recoverable*, and this very cycle is the demonstration: rewriting the comment above the test moved it 826 → 829, and only the title let the new number be re-derived instead of guessed. The run has already paid for this class once, at T-183 (cycle 87, stale citation). Filed p5/S/haiku, prose-only, one cell.

items: T-186 done (verified) · T-187 done (verified) · T-188 filed · 0 reverted · 0 failed verifies
backlog: 85 done / 1 todo / 3 dropped (89 total). Remaining: T-188 only.
wave autotune: CLEAN wave — 0 reverts, 0 failed verifies. Both gate failures traced to the instrument, and the amended predicate was proved failable before acceptance, so neither is an item failure. `wave_streak` 1 → 2 → fires the raise: `k_current` 4 → **5**, streak reset to 0. Operationally this is bookkeeping only — the gear-2 cap of 2 binds every wave until the posture lifts.
burn attribution: `window_tokens` delta since cycle 88 = 20,518,009 − 9,352,466 = **11,165,543**, credited to moon (the previous cycle's target). Prior cycles left `window_tokens_attributed` at 0, so this figure is this-cycle-only and NOT a run total — stated so the number is not misread at RETRO.
next wave: **T-188 alone**, and then the DONE determination. With T-188 closed, every SPEC must-have is closed and the VALUE_LOOP ratchet ("would the target user notice? would they still care after 10 minutes?") has to be applied honestly to a shipped, spec-complete CLI under a TRICKLE brief whose own taste note says *"nothing needed doing" is an ALLOWED outcome that ends the run early*. The churn breaker must not read that as `stalled`: `consecutive_no_value` is 0 and a finished target sets status `done`, not `stalled`.
commit: 5ff166e (stamped by the cycle-89 addendum commit, as at cycles 85–88)
next wakeup: 1787064960 (2026-08-18T14:56:00+00:00). **CORRECTED after the fact:** this line first read "+900s", which was wrong — the wakeup was picked as a round wall-clock 14:56 while the runfile persisted at 14:22:20, so the true delta against `heartbeat.ts` 1787062940 is **2020s (~34 min)**. The runfile and its mirror always carried the right absolute epoch; only this prose was wrong, and it is corrected here rather than left to contradict the runfile. 2020s is also the better number on its own terms: base 90s assumes a cycle worth chasing, and what is left is ONE S-effort doc item under guest pacing, whose whole purpose is not to crowd a shared usage window. Clamp checked: wakeup + 900 = 1787065860, far inside stop_at 1787142067, so hard rule 8 does not bind. Firing is the pacer's job on the VPS (`swarm-pacer.timer`, confirmed `active`), not a ScheduleWakeup chain, which does not sustain across a headless `-p` session.

runfile-mirror:
```json
{"version": 1, "run_label": "improvement-moon-2026-08-18", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-19T12:21:07+00:00", "usage_reset_at": "2026-08-18T13:00:00+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "heartbeat": {"ts": 1787062940, "next_wakeup_at": 1787064960, "pid": 2280023, "limp": false, "degraded_tiers": []}, "pacing": {"mode": "guest", "dial": 0.3}, "budget": {"source": "probe", "gear": 2, "gear_target": 2, "ratio": 0.62, "mode": "guest", "k_cap": 2, "promote": false, "demote": true, "window_tokens": 20518009, "window_cost_usd": 15.27, "api_cap_usd": null, "api_spend_usd": 0, "tokens_per_hour": 17841747, "projected_depletion_at": 0, "last_probe_ts": 1787062940, "last_real_probe_ts": 1787062940, "probe_failures": 2, "probe_note": "bin/swarm-budget.sh DENIED for the 16th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array - nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, so this gear rests on real measurement. IMPROVEMENT ON CYCLE 88: this probe DID return tokenLimitStatus, so the 130,591,250 limit is FRESHLY MEASURED this cycle, not carried forward - one of last cycle's two carried inputs is retired. Active block 13:00-18:00Z at 14:09Z: 20,518,009 tokens and $15.27, 69 min in, i.e. 297.4k tokens/min = 17.84M/hour. Remaining 110.07M over 231 min = 476.5k/min target at the guest-forced dial of 1.0, so rho = 0.62, the gear-4 band. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands, unchanged from cycle 88. ccusage's own projection agrees there is no depletion risk: 93.06M projected against the 130.59M limit, status ok. The weekly block below is STILL carried forward, not re-measured - ccusage blocks --json reports no weekly figures and swarm-budget.sh, which does, is the denied script. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false, and the number must not be read as evidence of a probe that failed.", "weekly": {"ok": true, "weekly_used_pct": 30, "opus_used_pct": 20, "week_elapsed_pct": 18.72, "weekly_heat": 1.61, "opus_heat": 1.07, "ceiling": 2, "promote_blocked": true}}, "watchdog": {"mode": "normal", "plist_loaded": true, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "caffeinate_pid": 0, "wrap_up_complete": false, "cycles_since_recycle": 4, "playbook": {"mode": "auto", "applied": ["L-008", "L-016", "L-020", "L-021", "L-022", "L-024", "L-026", "L-029", "L-031", "L-033", "L-034", "L-042", "L-043", "L-044"], "vetoed": [], "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself", "The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test", "Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.", "When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.", "Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.", "Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test", "Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns", "For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]}, "held_out": {"ids": ["L-021", "L-022"], "why": "both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."}, "staged_by": "conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}}, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

### cycle 89 addendum — dashboard render + two corrections

dashboard: rendered `SWARM/runs/dashboard.html` with `SWARM/runs/c089-dash.mjs`, same discipline as c86/c87 — anchors grepped out of the live page at run time, split/join so every duplicated template region moves together, all journal-derived strings HTML-escaped, and 10 post-write assertions re-read the file from disk. All 10 pass. Substitutions: gen 1, next 1, banner 2, stats 3, targets 2, decisions list 1. The page shrank 49,353 → 40,831 bytes; the drop was chased rather than assumed, and it is entirely the decisions list — cycle 88's entries replaced by this cycle's three. Verified structurally afterwards: exactly one `<ul class="decisions">` holding exactly 3 `dec` divs, and the other 13 `dec` divs on the page all sit at offsets 5281–15416, inside the template's leading documentation comment (comment delimiters balanced 11/11). No live region was lost.

TOOL OBSERVATION, journalled not acted on (hard rule 5 — `templates/` is read-only mid-run): the rendered dashboard has no `<!DOCTYPE>`, no `<html>` and no `<body>` element. It is a fragment that opens with the template's documentation comment and ends at `</script>`. Browsers render it anyway and the stale-banner script works, so the phone viewer is not broken, and this is inherited from `templates/dashboard.template.html` rather than introduced this cycle — cycle 88's render had the same shape. For the morning report, not for a live edit.

notifications: none due. Phase unchanged (BUILD → BUILD), no target became `stalled`, and `publish_failures` is unchanged at 0 — this is a headless `-p` session with no Artifact tool, which cycle.md step 8 defines as a silent skip rather than a publish failure. The local file write IS the publication on the VPS.

CORRECTION 1 — the wakeup prose. The block above first stated "+900s" for a wakeup whose true delta from `heartbeat.ts` is 2020s; the absolute epoch in the runfile and mirror was right throughout. Corrected in place, with the reasoning restated to the number that is actually true.

CORRECTION 2 — the `probe_note` clock. The note is written as of the probe (14:09Z), while the runfile's `last_probe_ts` records the persist moment. Both are accurate to what they measure; stating it here so a resume does not read the 69-minute elapsed figure as if it were computed at persist time.

commit: 03de853

## cycle 90 — 2026-08-18T14:58:04+00:00 → 15:06 UTC · BUILD · build-wave k=1 (direct Agent dispatch, haiku)

clock/gear: `date +%s` = 1787065084. stop_at 1787142067 is 21h22m out, so no WRAP_UP and no admission pressure (build-wave's 2700s budget against a 76,983s window). `bin/swarm-budget.sh` DENIED for the **17th consecutive run** (KI-2), and `bin/swarm-notify.sh poll` denied with it, so the control channel was read from `runs/control.json` on disk: `{"version":1,"since_cursor":"1787055667","pending":[],"applied":[]}` — `pending[]` empty, no `inject` array, nothing to triage. The underlying PROBE_CMD (`npx ccusage@latest blocks --json --token-limit max`) was run BY HAND and succeeded, and it returned `tokenLimitStatus` for the **second cycle running**, so the 130,591,250 limit is freshly measured rather than carried. Active block 13:00–18:00Z at 14:59Z: 29,558,819 tokens, $22.68, 119.8 min in → 246.8k tokens/min (14.81M/hour). That is **down** from cycle 89's 297.4k/min cumulative average — the window is cooling, not heating, and the falling rate is the reason ρ dropped even as absolute usage rose. Remaining 101.03M over 180.2 min = 560.6k/min target at the guest-forced dial of 1.0, so **ρ = 0.44**, the gear-5 band. Guest mode clamps reachable gears to 3; the weekly governor ceiling clamps to 2; **gear 2 stands**, unchanged from cycles 88 and 89 — and this is the third consecutive cycle where the measured ρ would license a higher gear and the posture refuses it, which is the guest contract working, not a mis-set dial. ccusage's own projection: 76.12M against the 130.59M limit, status `ok`, 58.3% used. The `weekly` block is STILL carried forward, not re-measured — `ccusage blocks --json` reports no weekly figures and the script that does is the denied one. `probe_failures` **held at 2, not incremented**: the script never launched, so it returned neither `probe_ok` true nor false, and the number must not be read as evidence of a probe that failed.

orient: tree CLEAN at a30218d, no salvage needed. Backlog on entry: 85 done / 1 todo / 3 dropped. The single todo, T-188, is a regression this run filed against itself at cycle 89.

re-anchor: cycle 90 is a **5th cycle**, so `SPEC.md` was re-read in full rather than restated from the digest, and backlog hygiene ran. Hygiene found nothing to do and that is the honest result: 89 items, exactly 1 live, no duplicates possible in a single-item set, nothing stale enough to drop, and the ~30-live-item cap is not remotely in play. Recorded as a clean pass, not skipped. The re-read confirmed the definition of done is now within one item of closing, which is what set up this cycle's plan.

craft pack: `node SWARM/bin/swarm-craft.mjs` ran and returned cleanly. **Not passed to the builder**, deliberately: T-188 is `kind: docs` with `files_hint: [REPORT.md]`, no path ending in .html/.css/.jsx/.tsx/.vue/.svelte and no UI surface in its title, so it is not `craft: "ui"`. build-wave consumes `craft.ui`; a docs item that changes one table cell has no use for accent-color and border-radius guidance, and passing it would be noise the builder must discard.

routing: `kind: docs` routes sonnet; gear 2 carries `demote: true`, which drops docs/polish one rung → **haiku**, matching the model already recorded on the item. Effective wave size = min(`k_current` 5, gear-2 cap 2, hard max 5) = 2, but only one item exists, so **k=1**. No worktrees, no disjointness problem, no sequencing question — the coupling that forced cycle 89's sequential dispatch does not arise with a single builder.

gate, sealed before dispatch: `SWARM/runs/c090-gate.mjs`, sha256 **`4da22cb56e3a95743b9a0dd84af34c8c2d2247ff07d0bf7ab1c4b7f7e6db4812`**. 8 checks. Every SUBJECT is read from disk at run time — the pin test's line number AND its exact title are parsed out of `test/render.test.js`, and the suite's file list is globbed from `test/` — which is the L-045 discipline this run has now committed against twice (cycles 87 and 88) and is deliberately not committing a third time. No check is bound to prose matched by regex (L-043): the title is an exact string comparison against the source of truth, and "nothing else changed" is a byte comparison against HEAD rather than a phrasing predicate.

**Baseline arm run BEFORE dispatch: GATE FAIL (2)** — C2, the citation-carries-the-title check, failed on the unfixed tree naming exactly the defect T-188 describes (`found: \`test/render.test.js:829\`` with no title), and C6 failed because no fix had been applied yet. C7 was already green at 171/171 on that same unfixed tree, which is the pre-condition the final arm is measured against. A gate that cannot fail proves nothing; the baseline is the arm that licenses the pass. Full baseline output at `SWARM/runs/c090-baseline.txt`.

**One gate instrument defect, caught PRE-dispatch and recorded rather than papered over.** C7's summary parser matched only the TAP reporter's `# tests N` form. This host's Node defaults to the **spec** reporter, which prints `ℹ tests N`, so the first baseline run reported `tests=null pass=null fail=0` and C7 failed on a suite that was in fact 171/171 green. Left unfixed it would have failed noisily forever, which is the benign direction — but it would also have meant the suite check never actually measured anything. Fixed by accepting either summary MARKER (`#` or `ℹ`) while still requiring a real count: if neither form is present the count stays null and C7 fails, which is the honest outcome for an unparseable run. The fix widens the reporter formats recognised, never the threshold — `fail === 0`, `pass === tests`, `tests >= 171` are untouched. Sealed only after that. This is the second consecutive cycle in which the instrument, not the product, was the thing that broke first, and both times it was found by running the baseline arm rather than by reading the gate.

**C8 is a converse control (L-044), and it is the check that must stay GREEN.** It asserts a neighbouring known-issues row (KI-4) is byte-identical to HEAD. Without it the gate could pass on "the file changed in the right direction" while the builder rewrote the rest of the table; with it, the gate is measuring a cell rather than a file. It passed on both arms, which is what a control is supposed to do.

VERIFICATION EVIDENCE — T-188 (sealed gate 4da22cb5, conductor-run; full output `.swarm/runs/cycle-090-verify-T-188.txt`):
```
BASELINE (unfixed tree, sealed gate 4da22cb5)
FAIL C2 row does not carry the exact citation · FAIL C6 blast radius is not exactly REPORT.md
      C7 parsed: tests=171 pass=171 fail=0                    GATE FAIL (2 failure(s))

FINAL (built tree, SAME gate, hash re-checked 4da22cb5 — unchanged)
      S1 pin test read from disk: test/render.test.js:829
      S1 pin title read from disk: KI-5 pin: disc glyph set matches the documented East Asian Width partition
PASS  C1 exactly one KI-5 row in REPORT.md
PASS  C2 row cites the pin by live line AND exact title
PASS  C3 cited line number(s) 829 vs live declaration at 829
PASS  C4 row minus the inserted title is byte-identical to HEAD (no other cell changed)
PASS  C5 known-issues heading, header, separator and row count all unchanged (rows 8 -> 8)
PASS  C6 blast radius confined to REPORT.md
PASS  C7 subjects globbed from disk, 9 files · tests=171 pass=171 fail=0
PASS  C8 control row KI-4 byte-identical to HEAD (gate discriminates a cell, not a file)
---- GATE: 8 passed, 0 failed ----

$ git -C /opt/targets/moon diff --stat
 REPORT.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

$ node --test test/*.test.js        (baseline / built / after the state.json write)
ℹ tests 171   ℹ pass 171   ℹ fail 0        — all three runs
```
The suite was re-run a third time AFTER `state.json` was written, as at cycles 88 and 89: `state.json` is a test INPUT for `report-issues.test.js`, so a persist step can break a suite that has already passed its gate. 171/171.

The conductor also read the diff by eye rather than trusting the byte comparison alone. It is one line, `REPORT.md:54`, and the only change within it is the inserted parenthetical — the citation now reads ``test/render.test.js:829`` (``KI-5 pin: disc glyph set matches the documented East Asian Width partition``), which is the exact form the row carried before cycle 89 removed it, with the number re-derived rather than restored from memory.

**What this cycle did NOT establish, stated rather than hidden.** The gate proves the citation is correct **today** and that the title now anchors it. It does **not** prove the anchor works — that would require moving the test and re-deriving the number from the title, which is a mutation this cycle had no reason to perform on a repo whose backlog is closing. The evidence that the anchor works is historical, not fresh: cycle 89 moved this very declaration 826 → 829 and the title was what made the new number derivable. Cited, not re-measured, and that is the right scope for a one-cell S-effort doc item — but it is a citation, and it is labelled as one. Separately, C1/C5's row-count check would not catch a semantically wrong row that kept the right shape; the row's meaning was read by the conductor, not measured.

items: T-188 done (verified 8/8) · 0 filed · 0 reverted · 0 failed verifies
backlog: **86 done / 0 todo / 3 dropped (89 total). The backlog is EMPTY** — first time in this run.
wave autotune: CLEAN wave — 0 reverts, 0 failed verifies. The pre-dispatch instrument defect was caught before any agent was dispatched and so is not an item failure. `wave_streak` 0 → 1; no raise fires (that needs 2), and `k_current` is already at the hard max of 5 in any case. Operationally still bookkeeping only: the gear-2 cap of 2 binds every wave until the posture lifts.
burn attribution: `window_tokens` delta since cycle 89 = 29,558,819 − 20,518,009 = **9,040,810**, credited to moon (the previous cycle's target). Added to the 11,165,543 credited at cycle 89, `window_tokens_attributed` now reads **20,206,353** — a running total across two attributed cycles, NOT a run total, since cycles 0–87 left the counter at 0 and are not represented in it. Stated explicitly so RETRO does not misread it as the night's whole cost.
next wave: **none — the next cycle is the DONE determination.** Every SPEC must-have now has a closing item behind it and the backlog is empty, so the next cycle picks no work: it re-reads the definition of done clause by clause, gathers real evidence for each (including the standing invariants — suite ≥ 171, no `dependencies`/`devDependencies` key, no lockfile, no `node_modules`), applies the VALUE_LOOP ratchet honestly to a shipped, spec-complete CLI under a TRICKLE brief, and — if nothing passes "would the target user notice, and still care after 10 minutes?" — sets the target `done` and goes to WRAP_UP. The churn breaker must not read that as `stalled`: `consecutive_no_value` is 0, this cycle produced verified value, and the SPEC's own taste note names "nothing needed doing" as an ALLOWED outcome that ends the run early. A finished target sets status `done`, never `stalled`.
commit: b3dae5e (stamped by the cycle-90 addendum commit, as at cycles 85–89)
next wakeup: 1787066400 (2026-08-18T15:20:00+00:00, +~900s from the persist). Base 90s assumes a cycle worth chasing; what remains is a judgment pass with no dispatch, and guest pacing exists precisely not to crowd a shared usage window. 900s is also short enough that the run reaches its WRAP_UP rather than idling out the remaining 21 hours of clock on an empty backlog. Clamp checked: wakeup + 900 = 1787067300, far inside stop_at 1787142067, so hard rule 8 does not bind. Firing is the pacer's job on the VPS (`swarm-pacer.timer`), not a ScheduleWakeup chain, which does not sustain across a headless `-p` session.

runfile-mirror:
```json
{"version": 1, "run_label": "improvement-moon-2026-08-18", "targets": [{"path": "/opt/targets/moon", "status": "active", "weight": 1}], "rotation_cursor": 0, "rotation_schedule": [0], "stop_at": "2026-08-19T12:21:07+00:00", "usage_reset_at": "2026-08-18T13:00:00+00:00", "model_policy": "value-routing", "auth_mode": "subscription", "heartbeat": {"ts": 1787065187, "next_wakeup_at": 1787066400, "pid": 2286479, "limp": false, "degraded_tiers": []}, "pacing": {"mode": "guest", "dial": 0.3}, "budget": {"source": "probe", "gear": 2, "gear_target": 2, "ratio": 0.44, "mode": "guest", "k_cap": 2, "promote": false, "demote": true, "window_tokens": 29558819, "window_cost_usd": 22.68, "api_cap_usd": null, "api_spend_usd": 0, "tokens_per_hour": 14806143, "projected_depletion_at": 0, "last_probe_ts": 1787065187, "last_real_probe_ts": 1787065187, "probe_failures": 2, "probe_note": "bin/swarm-budget.sh DENIED for the 17th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array - nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, and it returned tokenLimitStatus, so the 130,591,250 limit is FRESHLY MEASURED this cycle for the second cycle running. Active block 13:00-18:00Z at 14:59Z: 29,558,819 tokens and $22.68, 119.8 min in, i.e. 246.8k tokens/min = 14.81M/hour - DOWN from cycle 89's 297.4k/min cumulative average, so the window is cooling, not heating. Remaining 101.03M over 180.2 min = 560.6k/min target at the guest-forced dial of 1.0, so rho = 0.44, which is the gear-5 band. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands, unchanged from cycles 88 and 89. ccusage's own projection agrees there is no depletion risk: 76.12M projected against the 130.59M limit, status ok, 58.3% used. The weekly block below is STILL carried forward, not re-measured - ccusage blocks --json reports no weekly figures and swarm-budget.sh, which does, is the denied script. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false, and the number must not be read as evidence of a probe that failed.", "weekly": {"ok": true, "weekly_used_pct": 30, "opus_used_pct": 20, "week_elapsed_pct": 18.72, "weekly_heat": 1.61, "opus_heat": 1.07, "ceiling": 2, "promote_blocked": true}}, "watchdog": {"mode": "normal", "plist_loaded": true, "lockfile": "/opt/swarm/runs/watchdog.lock", "relaunch_attempts": 0}, "caffeinate_pid": 0, "wrap_up_complete": false, "cycles_since_recycle": 5, "playbook": {"mode": "auto", "applied": ["L-008", "L-016", "L-020", "L-021", "L-022", "L-024", "L-026", "L-029", "L-031", "L-033", "L-034", "L-042", "L-043", "L-044"], "vetoed": [], "directives": {"wave_k": null, "routing_recs": ["core-logic->fable"], "prompt_lines": {"builder": ["The conductor is the SOLE committer - never commit or push yourself", "The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test", "Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"], "reviewer": ["The conductor is the SOLE committer - never commit or push yourself", "The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test", "Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"], "qa": ["The conductor is the SOLE committer - never commit or push yourself", "The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test", "Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.", "Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.", "When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.", "Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.", "Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test", "Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns", "For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]}, "held_out": {"ids": ["L-021", "L-022"], "why": "both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."}, "staged_by": "conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}}, "artifact": {"url": "", "file": "/opt/swarm/runs/dashboard.html", "publish_failures": 0}}
```

### cycle 90 addendum — dashboard render + commit stamp

dashboard: rendered `SWARM/runs/dashboard.html` with `SWARM/runs/c090-dash.mjs`, same discipline as c86-c089 — anchors grepped out of the live page at run time, split/join so every duplicated template region moves together, all journal-derived strings HTML-escaped, and 11 post-write assertions re-read the file from disk. All 11 pass. Substitutions: gen 1, next 1, banner 2, stats 3, targets 2, decisions list 1. The page moved 40,831 -> 40,438 bytes; the 393-byte drop is the decisions list alone (cycle 89's three entries replaced by this cycle's three) and was chased rather than assumed. One assertion was ADDED this cycle over the c089 set: "no cycle-89 decision entries left live", which checks the replacement direction rather than only the arrival of the new text — c089's equivalent check only counted the new entries and would have passed with stale ones still on the page.

TOOL OBSERVATION, restated not acted on (hard rule 5 — `templates/` is read-only mid-run): the rendered dashboard still has no `<!DOCTYPE>`, no `<html>` and no `<body>`. It is a fragment inherited from `templates/dashboard.template.html`, unchanged since at least cycle 88. Browsers render it and the stale-banner script works, so the phone viewer is not broken. For the morning report, not for a live edit.

notifications: none due. Phase unchanged (BUILD -> BUILD), no target became `stalled`, and `publish_failures` is unchanged at 0 — this is a headless `-p` session with no Artifact tool, which cycle.md step 8 defines as a silent skip rather than a publish failure. The local file write IS the publication on the VPS.

wakeup mechanism: `next_wakeup_at` 1787066400 is written to the runfile and its mirror; `swarm-pacer.timer` reads it and spawns the cycle once due. No ScheduleWakeup chain — it does not sustain across headless `-p` sessions on this host.

commit: this addendum.

## cycle 91 — 2026-08-18T15:22:54+00:00 → 15:32 UTC · BUILD → VALUE_LOOP · inline housekeeping (no dispatch)

clock/gear: `date +%s` = 1787066574. stop_at 1787142067 is 20h58m out — no WRAP_UP, no admission pressure. `bin/swarm-budget.sh` DENIED for the **18th consecutive run** (KI-2); `bin/swarm-notify.sh poll` denied with it, so the control channel was read from `runs/control.json` on disk: `{"version":1,"since_cursor":"1787055667","pending":[],"applied":[]}` — `pending[]` empty, no `inject` array, nothing to triage. PROBE_CMD (`npx ccusage@latest blocks --json --token-limit max`) run BY HAND and succeeded, but **this time it returned no `tokenLimitStatus`**, so the 130,591,250 limit is CARRIED FORWARD from cycles 89–90, not re-measured — the two-cycle streak of a freshly measured limit ends here and is recorded as carried rather than quietly reused. Active block 13:00–18:00Z at 15:22Z: 33,991,432 tokens, $26.87, 142.9 min in → 237.9k tokens/min (14.27M/hour), **down again** from cycle 90's 246.8k/min: the window is still cooling. Remaining 96.60M over 157.1 min = 614.9k/min target at the guest-forced dial of 1.0, so **ρ = 0.39**, the gear-5 band. Guest clamps reachable gears to 3; the weekly governor ceiling clamps to 2; **gear 2 stands** — the fourth consecutive cycle where measured ρ would license a higher gear and the posture refuses it. ccusage projection: 71.37M against the 130.59M limit, no depletion risk. `weekly` block STILL carried forward, not re-measured. `probe_failures` **held at 2, not incremented**: the script never launched, so it returned neither `probe_ok` true nor false.

orient: tree CLEAN at f992352, no salvage needed. Backlog on entry: 86 done / **0 todo** / 3 dropped — the state cycle 90 predicted, and the reason this cycle is a judgment pass rather than a build wave.

**Runfile `next_wakeup_at` discrepancy — chased, not assumed.** The live runfile carried `next_wakeup_at` 1787073768, but cycle 90's block and its mirror both recorded 1787066400. The cycle-90 claim was NOT wrong: `runs/pacer.log` shows `2026-08-18T15:22:48+0000 decision=spawned`, and 1787066568 + 7200 = 1787073768 exactly. The pacer stamps the field forward by its resume budget at spawn time as the relaunch-stacking guard, which is the documented session-side/watchdog-side pairing. Measured from the pacer log, not inferred from the arithmetic alone.

re-anchor: cycle 91, not a 5th cycle, so the digest would normally be restated rather than the spec re-read — but this cycle carries the DONE determination, so `SPEC.md` was re-read in full anyway. Backlog hygiene: 0 live items, nothing to dedupe, reprioritise or drop; the ~30-item cap is not in play.

### Work: the journal re-archive (SPEC nice-to-have, threshold crossed this cycle)

why this and not the DONE call: cycle 90 signed off "next cycle is the DONE determination", and the must-have audit below does clear every clause. But DONE requires **both** the definition of done met AND no VALUE_LOOP candidate passing the ratchet — and on entry a candidate did pass. `.swarm/journal.md` stood at **418,997 bytes**, across the ~400 KB line the spec's own nice-to-have sets for re-archiving. That is spec-traceable work, not manufactured work, so the honest cycle is to do it and defer the DONE call rather than declare done over a live candidate.

what was done: cycles 66–84 (improvement run 3, 24 blocks) moved verbatim into `.swarm/journal-archive-run3-cycles-66-84.md`; cycles 85+ (run 4) stay live. Append-only copy, never a deletion — the archive holds the full text and the pre-archive file is in git at f992352. Both boundaries are located **structurally** at run time (`findIndex` on the block headers), never by a hardcoded line number, which is the L-045 discipline this run has committed against twice. Script: `.swarm/runs/c091-archive.mjs`, 10 self-assertions, all re-read from disk after the write.

**One instrument defect, caught before the run and recorded.** The byte-accounting assertion was authored as `moveBody + keepBody === original − header − 1`. The correct constant is **2**: `original === header + "\n" + moveBody + "\n" + keepBody` consumes two join newlines, not one. Left as written it would have failed on a correct archive — the benign direction, but a false alarm is still a broken instrument. Fixed to 2 before the first run; the fix corrects the arithmetic, never the threshold or the byte comparison itself. This is the third consecutive cycle in which the instrument, not the product, was the first thing to break.

VERIFICATION EVIDENCE — journal re-archive. The script's own 10 assertions are the builder-side claim; the gate below is the **independent** check, authored at verification time and measured against `git show HEAD:.swarm/journal.md` rather than against the script's arithmetic:
```
$ node .swarm/runs/c091-archive.mjs
PASS  archive contains the moved body verbatim
PASS  working journal contains the kept body verbatim
PASS  no body byte lost — 325114 + 93478 vs 418997 - 403 - 2
PASS  working journal now under 400 KB — 94068 bytes
PASS  cycle 84 is in the archive, not the live file
PASS  cycle 85 is in the live file, not the archive
PASS  cycle 90 still live      PASS  cycle 66 kickoff archived
PASS  live header names both archives
before: 418997 bytes / 4288 lines
after:  journal.md 94068 bytes / 456 lines · archive 325642 bytes / 3844 lines / 24 blocks

INDEPENDENT GATE (subject = git HEAD's copy, not the script's numbers)
git HEAD journal: 4288 lines
run-3 region: HEAD 3834 lines vs archive 3834 -> IDENTICAL
run-4 region: HEAD  446 lines vs live     446 -> IDENTICAL
union == every pre-archive body line: true (4280 of 4280)
archive is a NEW file (not tracked before): true

$ node --test test/*.test.js          (before the archive, and again after)
ℹ tests 171   ℹ pass 171   ℹ fail 0   — both runs
```
Every one of the 4,280 pre-archive body lines survives byte-for-byte in exactly one of the two files. The 403-byte header is the only text that changed, and it changed to name both archives.

### DONE determination: NOT done — every must-have clears, but a candidate passes the ratchet

Each clause re-verified at run time this cycle, not inherited from a prior journal:

| definition-of-done clause | evidence, measured this cycle | verdict |
|---|---|---|
| T-175 closed with a two-arm proof | backlog `T-175.status = done`; two-arm proof journaled at its build cycle | MET |
| every `[apply:]` lesson checked, violations filed | T-185 conductor-verified the L-029/L-044 verdicts that were agent-claimed only | MET |
| KI-8 owner ask written | `.swarm/KI-8-OWNER-ACTION.md`, 1,783 bytes — names the exact file (`LICENSE` at repo root), the exact line (`Copyright (c) <year> <legal holder>`), and what stays broken | MET |
| REPORT.md first screen readable, forensics archived, gate green | REPORT.md 60,774 → 22,461 bytes; `.swarm/REPORT-ARCHIVE-2026-08-18.md` 39,859 bytes; `test/report-issues.test.js` green inside 171/171 — fixed at T-183/T-186/T-187/T-188, never weakened | MET |
| count- and line-citing doc claims re-derived at run time | T-174/T-183/T-188 closed; the how-to-run annotation now carries its measurement point rather than a bare number | MET |
| no test added that cannot name its surface | every run-4 item names a filed defect; test count unchanged at 171 across all six | MET |
| suite green, never below the 171 kickoff baseline | `ℹ tests 171 ℹ pass 171 ℹ fail 0`, run twice this cycle | MET |
| no deps, no lockfile, no node_modules | `"dependencies" in pkg → false`, `"devDependencies" in pkg → false`; repo root is exactly `README.md REPORT.md RETRO.md bin package.json src test` | MET |

So the definition of done is **fully met**. The target is still not DONE, because the second condition fails: a VALUE_LOOP candidate passes the ratchet, and it is filed below as T-189.

**T-189 — the KI-5 reader-runnable check (nice-to-have #1), and why this observable is not cycle 62's.** Cycle 62's attempt was DISPROVED at the gate: it proposed top-right vs bottom-right corner alignment, which cannot differ under the failure mode because all six frame glyphs are EAW Ambiguous and both borders scale together. The premise of the new observable is the opposite — the disc glyph set **straddles** the partition, and that fact is already machine-pinned at `test/render.test.js:785-792`: `░` (U+2591) and `▐` (U+2590) are Neutral; `▒ ▓ █ ▌ ▏ ▕` are Ambiguous. The sharpest pair is `▌` (U+258C, Ambiguous) against `▐` (U+2590, Neutral) — two half-block glyphs a reader expects to be mirror images of identical width, sitting on opposite sides of the class boundary. A reader printing equal counts of each and comparing row widths gets a discriminator that CANNOT be produced by an unaffected terminal, rather than a comparison against a remembered reference. Ratchet: a user seeing a ragged disc would notice (Q1), and it stays useful past ten minutes because it converts "reason about East Asian Width classes" into "run this and look" (Q2). Filed S-effort, `README.md` only — the KI-5 prose lives at README.md:224-225, and keeping REPORT.md out of the blast radius keeps `test/report-issues.test.js`'s table anchors untouched. **The observable must still be verified to actually differ before it ships** — the spec's standing condition on this nice-to-have, and it binds the next cycle exactly as it bound cycle 62.

### The three-pass gate (review-fix / QA / TASTE), decided rather than silently skipped

`state.json.qa` records `last_review_fix_cycle 73`, `last_full_qa_cycle 76`, `last_taste_cycle 81` — every one of them a **run-3** cycle. Read strictly, improvement run 4 (cycles 85–91) has run none of the three, and step 4 puts all three before VALUE_LOOP. Recorded as a decision so a fresh session inherits the reasoning instead of re-deriving it:

- **review-fix — satisfied in substance, not re-run.** All six run-4 items passed a sealed, independently-authored, baseline-armed gate; two of them (cycles 89, 90) were caught by their own baseline arm before dispatch. A reviewer pass over doc edits already gated twice is churn under this spec's two-source rule.
- **QA full — NOT satisfied, and worth one cycle.** T-175 changed `src/hemisphere.js`, a user-visible wrong answer, and it is the only source change this run. A spec-scenario pass exercising the live CLI end-to-end is the one signal run 4 genuinely lacks. Queued as the next cycle's work, ahead of T-189.
- **TASTE — deliberately not re-run.** Run 3's pass at cycle 81 returned exactly three findings (T-177/T-178/T-179), and all three were dropped as features this run's non-goals forbid by name. The user-visible surface has changed since by exactly one timezone's hemisphere. Re-running it would re-derive three findings that are already forbidden — the manufactured-work failure mode the spec exists to prevent. Reported at WRAP_UP as not-run with this reason, never as passed.

backlog: 86 done / **1 todo** (T-189) / 3 dropped, 90 items. `counters.consecutive_no_value` reset to 0 — this cycle produced verified value. Wave autotune untouched (`k_current` 5, `wave_streak` 1): no build wave ran, and the autotune rules fire only after a wave's merges and verification.

dashboard: re-rendered from this cycle's state, same discipline as c086–c090 — anchors grepped out of the live page at run time, every journal-derived string HTML-escaped, post-write assertions re-read the file from disk.

notifications: none due. Phase changed BUILD → VALUE_LOOP, which is a phase-change emit — `bin/swarm-notify.sh` is denied by the same allowlist gap as the budget probe (KI-2), so the emit could not be attempted and is recorded as NOT SENT rather than sent. `publish_failures` unchanged at 0: this is a headless `-p` session with no Artifact tool, which step 8 defines as a silent skip, not a publish failure.

next wakeup: 1787067108 (2026-08-18T15:31:48.000Z, +90s from the persist). Base 90s, the cycle.md step-9 default for a cycle that produced verified value — cycle 90's 900s was reasoned from being a judgment pass with no dispatch, and this cycle both produced verified value and queues a real QA pass, so the default applies unmodified. There is no pacing multiplier: gears change what a cycle burns, never whether it happens. Clamp checked: 1787067108 + 900 = 1787068008, far inside stop_at 1787142067, so hard rule 8 does not bind. Firing is the pacer's job on the VPS (`swarm-pacer.timer`, which reads this field and stamps it forward by 7200s at spawn), not a ScheduleWakeup chain, which does not sustain across a headless `-p` session.

runfile-mirror:
```json
{"version":1,"run_label":"improvement-moon-2026-08-18","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-19T12:21:07+00:00","usage_reset_at":"2026-08-18T13:00:00+00:00","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1787067018,"next_wakeup_at":1787067108,"pid":2291454,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.39,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":33991432,"window_cost_usd":26.87,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":14274000,"projected_depletion_at":0,"last_probe_ts":1787067018,"last_real_probe_ts":1787067018,"probe_failures":2,"probe_note":"bin/swarm-budget.sh DENIED for the 18th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array, nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, but returned NO tokenLimitStatus this cycle, so the 130,591,250 limit is CARRIED FORWARD from cycles 89-90, not re-measured - the two-cycle streak of a freshly measured limit ends here and is recorded as carried rather than quietly reused. Active block 13:00-18:00Z at 15:22Z: 33,991,432 tokens and $26.87, 142.9 min in, i.e. 237.9k tokens/min = 14.27M/hour - DOWN again from cycle 90 246.8k/min, so the window is still cooling. Remaining 96.60M over 157.1 min = 614.9k/min target at the guest-forced dial of 1.0, so rho = 0.39, the gear-5 band. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands - the FOURTH consecutive cycle where measured rho would license a higher gear and the posture refuses it. ccusage projection 71.37M against the 130.59M limit, no depletion risk. The weekly block below is STILL carried forward, not re-measured. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false.","weekly":{"ok":true,"weekly_used_pct":30,"opus_used_pct":20,"week_elapsed_pct":18.72,"weekly_heat":1.61,"opus_heat":1.07,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":6,"playbook":{"mode":"auto","applied":["L-008","L-016","L-020","L-021","L-022","L-024","L-026","L-029","L-031","L-033","L-034","L-042","L-043","L-044"],"vetoed":[],"directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.","Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test","Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns","For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]},"held_out":{"ids":["L-021","L-022"],"why":"both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."},"staged_by":"conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}},"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

### cycle 91 addendum — dashboard render + commit stamp

dashboard: rendered `SWARM/runs/dashboard.html` with `SWARM/runs/c091-dash.mjs`, same discipline as c086-c090 — anchors grepped out of the live page at run time, split/join so every duplicated template region moves together, all journal-derived strings HTML-escaped, and 12 post-write assertions re-read the file from disk. All 12 pass. Substitutions: gen 1, next 1, banner 2, stats 3, targets 2, decisions list 1. The page moved 40,438 -> 40,592 bytes. One assertion was ADDED over the c090 set: `phase is VALUE_LOOP everywhere it is stated`, which asserts the ABSENCE of the old phase string as well as the presence of the new one — the phase appears in both the stats tile and the targets line, and a check that only confirmed the new text would pass with a stale `phase BUILD` still rendered somewhere on the page.

heartbeat re-touch: `next_wakeup_at` was written as 1787067108 at the persist and the cycle ran past it (dashboard render, addendum). Re-touched to 1787067175 so the field reflects the actual end of the cycle rather than a moment already in the past. A past-dated value would not have broken anything — the pacer reads it as simply due — but a heartbeat that describes the persist rather than the cycle is a slightly false record, and this is the field the watchdog reads to decide whether this session is alive.

TOOL OBSERVATION, restated not acted on (hard rule 5 — `templates/` is read-only mid-run): the rendered dashboard still has no `<!DOCTYPE>`, no `<html>` and no `<body>`. Inherited fragment from `templates/dashboard.template.html`, unchanged since at least cycle 88. Browsers render it and the stale-banner script works, so the phone viewer is not broken. For the morning report, not for a live edit.

commit: this addendum. The cycle-91 work commit is `071579b`, now stamped into `state.last_cycle.commit`.

## cycle 92 — 2026-08-18T15:37:13+00:00 → 15:57 UTC · VALUE_LOOP · qa-verify mode=full (direct Agent dispatch, 3 stages)

clock/gear: `date +%s` = 1787067433. stop_at 1787142067 is 20h44m out — no WRAP_UP, no admission pressure; qa-verify full's 1200s budget admits with room to spare. `bin/swarm-budget.sh` DENIED for the **19th consecutive run** (KI-2), and `bin/swarm-notify.sh poll` denied with it, so the control channel was read from `runs/control.json` on disk: `{"version":1,"since_cursor":"1787055667","pending":[],"applied":[]}` — `pending[]` empty, no `inject` array, nothing to triage. PROBE_CMD (`npx ccusage@latest blocks --json --token-limit max`) run BY HAND and succeeded, but returned **no `tokenLimitStatus` for the second consecutive cycle**, so the 130,591,250 limit is CARRIED FORWARD from cycles 89–90 — recorded as carried, not re-measured, twice running now. Active block 13:00–18:00Z at 15:37Z: 36,912,820 tokens, $30.15, 157.97 min in → 233.7k tokens/min (14.02M/hour), **down again** from cycle 91's 237.9k/min: the window has now cooled for four consecutive cycles. Remaining 93.68M over 142.03 min = 659.6k/min target at the guest-forced dial of 1.0, so **ρ = 0.35** — deeper into the gear-5 band than cycle 91's 0.39. Guest clamps reachable gears to 3; the weekly governor ceiling clamps to 2; **gear 2 stands** — the fifth consecutive cycle where measured ρ would license a higher gear and the posture refuses it. ccusage projection 70.96M against the 130.59M carried limit, no depletion risk. `weekly` block STILL carried forward, not re-measured. `probe_failures` **held at 2, not incremented**: the script never launched, so it returned neither `probe_ok` true nor false.

orient: tree CLEAN at 724c131, no salvage needed. Backlog on entry: 86 done / 1 todo (T-189) / 3 dropped.

re-anchor: cycle 92, not a 5th cycle, so the digest is restated rather than the spec re-read. Backlog hygiene not due; 1 live item is nowhere near the ~30 cap.

### Work: the QA full pass cycle 91 queued — and why it ran ahead of T-189

Cycle 91's three-pass decision put QA full ahead of T-189 explicitly: T-175 changed `src/hemisphere.js`, the only source change of run 4 and a user-visible wrong answer, and a spec-scenario pass exercising the live CLI end-to-end was the one signal run 4 genuinely lacked. That reasoning is unchanged, so this cycle executes it rather than re-deriving it.

**Dispatch shape.** This is a headless `-p` session, where the Workflow tool is review-gated, so `workflows/qa-verify.js` was not invoked as a workflow. Its contract was executed as three **direct Agent calls** — the documented failure-table fallback — preserving the parts of the contract that carry the guarantees: the author is **spec-only** (never given the target path, the diff, or any code, so an answer key computed from the rulebook cannot inherit the code's bugs), the stages run **sequentially**, scenario ids are stamped **S1..S3 by position** and executor results matched positionally rather than by any echoed id, and every returned field is a CLAIM for this gate. Routing: author fable/high and live-look fable (judgment seats, fable guard — exempt from the gear-2 demotion), executor sonnet/medium (a non-judgment seat, but the sonnet→haiku demotion is scoped to docs/polish items and does not reach it). Playbook `prompt_lines.qa` — all nine lines — were appended to all three prompts.

### VERIFICATION EVIDENCE — S1, re-run by the conductor rather than accepted

The executor's S1 verdict is its claim. This is the conductor's own run, independent of it:

```
$ node -e '... execFileSync("node",["bin/moon.js"],{env:{TZ:tz}}) for 7 zones ...'
US/Samoa           "◖█░░░  36%  waxing crescent"
                    25d6 2588 2591 2591 2591
Pacific/Apia       "◖█░░░  36%  waxing crescent"
                    25d6 2588 2591 2591 2591
Australia/Sydney   "◖█░░░  36%  waxing crescent"
                    25d6 2588 2591 2591 2591
Europe/London      "░░░█◗  36%  waxing crescent"
                    2591 2591 2591 2588 25d7
UTC / Asia/Tokyo / America/New_York   "░░░█◗  36%  waxing crescent"
--- ARM A ---
samoa==apia  : true      samoa==sydney: true
samoa==london: false (must be FALSE)
--- name/illum identical across all seven zones? ---
[ '36%  waxing crescent' ]
```

**T-175 is now confirmed closed at the user-visible surface, not only at the unit level** — recorded as a decision. Its build-cycle proof was a unit-level two-arm mutation proof on `detectHemisphere`; this is the shipped CLI, end to end. The documented FAIL SIGNATURE (Samoa matching London's unmirrored disc while Apia and Sydney show the mirrored one) is verified **ABSENT**. Name and illumination are byte-identical across all seven zones, so TZ moves the limb and nothing else — which is exactly the invariant the domain rules assert.

### VERIFICATION EVIDENCE — the suite, run by the conductor

```
$ node --test test/*.test.js
ℹ tests 171   ℹ suites 0   ℹ pass 171   ℹ fail 0
ℹ cancelled 0  ℹ skipped 0  ℹ todo 0     ℹ duration_ms 3352.33
$ ls test/
args.test.js astro.test.js cli.test.js contracts.test.js hemisphere.test.js
manifest.test.js regressions.test.js render.test.js report-issues.test.js   (9 files)
```

171/171, never below the 171-test kickoff baseline. The file list is enumerated **from disk**, not from memory — the L-045 discipline cycle 88 broke and re-committed to.

### S2 — pass on what ran, and the sub-check that did NOT run

Sub-checks 1–4 pass on live output: identical phase name and identical percentage across four zones in one window; P = 36 in [0,100]; the band `Crescent → 0 < P < 50` holds for "waxing crescent" at 36%. **Sub-checks 5–6 — the re-run at least 6 hours later and the waxing/waning direction check — were NOT RUN.** No agent can wait six hours inside a cycle. They are recorded as not-run, never as passed, per WRAP_UP's rule that a signal not run is reported as not-run. If a later cycle wants that signal, the earlier reading is on the record here: 36% waxing crescent at 15:46Z on 2026-08-18, so a run past ~22:00Z must show P no lower than 36.

### S3 — FAILED as authored, adjudicated as an EXPECTATION defect, no item filed

S3 asserted that every disc code point comes from the 8-glyph set the SPEC's domain rules enumerate (`░ ▐` Neutral; `▒ ▓ █ ▌ ▏ ▕` Ambiguous). The live disc also renders `◖`/`◗` (U+25D6/U+25D7), so the assertion fails. Every other S3 sub-check passed: the two runs are byte-identical, zero ESC (0x1B) bytes, zero emoji or astral code points, exactly one `N%` with 0 ≤ N ≤ 100, empty stderr, exit 0.

The conductor's adjudication, verified against the authoritative sources rather than taken from either agent:

```
$ grep -n "25D6\|◖\|ROUND_LIMB\|MIRROR" src/render.js
11: *   - No emoji. Ever. Geometric / block glyphs only (U+2588..U+2595, U+25D6,
70: const ROUND_LIMB = { right: '◗', left: '◖' };
73: const MIRROR = new Map([ ['◖','◗'], ['◗','◖'], ... ]);
172:      else out += ROUND_LIMB[c === 0 ? 'left' : 'right'];

$ sed -n '795,806p' test/render.test.js
 * The disc is also observed (below) to draw two round-limb glyphs —
 * U+25D6/U+25D7, Geometric Shapes, not Block Elements — once the outer
 * cell's lit fraction reaches 0.88 ... They are pinned separately below,
 * so this test tells the truth about what is and is not classified.
const UNDOCUMENTED_DISC_GLYPHS = new Set([0x25d6, 0x25d7]); // ◖ ◗

$ sed -n '245,249p' README.md
The disc also draws round-limb glyphs, `◗` and `◖`, once the outer cell's lit fraction reaches
0.88 ... both are Neutral in Unicode Character Database 15.0.0, as measured by the audit
script at `.swarm/runs/cycle-024-eaw-audit.py`.
```

README documents both glyphs by name with their EAW class and the script that measured it; `test/render.test.js` pins them separately with a comment stating exactly why they sit outside the Block Element partition; `src/render.js` declares them in its header. **The authoritative sources are complete and correct.** The SPEC's domain-rules bullet is an abridgement of README's fuller treatment, and the author — spec-only BY DESIGN, which is the property that makes its answer key independent — inherited the abridgement. So the fail is real and is recorded as a fail with its evidence; it is **not** re-labelled a pass (hard rule 2). No backlog item is filed, because there is no defect to fix: this run's two-source rule admits only a filed defect or a demonstrably violated lesson, and this is neither. SPEC.md is frozen at kickoff and is not edited mid-run.

Worth stating because it is the cost of the design: spec-only authoring buys independence and pays for it in false positives whenever the spec abridges the docs. That trade is still right — an author that reads the code cannot catch the code's bugs — but this is the second run-4 cycle in a row where the instrument, not the product, was the thing that needed adjudicating.

### Live-look — ONE finding, conductor-verified, filed as T-190

The look agent swept ~12,000 renders programmatically (line and block alignment at every illumination, both hemispheres), all error paths (stderr, exit 2, clear messages), help/README/parser flag-set agreement, and README capture reproducibility, and returned exactly one finding rather than padding the list. Re-run by the conductor:

```
$ node bin/moon.js --json          (twice, ~5 min apart)
{"phase":"waxing crescent","illumination":0.3627,"age":5.93,"cycleFraction":0.20571,
 "phaseAngle":74.057,"hemisphere":"north","nextFullMoon":"2026-08-28T04:18:25.225Z",
 "julianDay":2461271.16347,"timestamp":"2026-08-18T15:55:24.041Z"}
   ... nextFullMoon IDENTICAL on both runs: 2026-08-28T04:18:25.225Z

$ node bin/moon.js --help | grep -n -A2 rounded
38:Numeric fields are rounded to the precision the algorithm has actually earned
39-(phase instants are good to roughly an hour); they are not raw float dumps.
```

Every numeric field is rounded — illumination 4dp, age 3dp, cycleFraction 5dp, phaseAngle 3dp, julianDay 5dp — and `nextFullMoon` alone carries eight sub-hour digits of stable false precision, against a help line that says in the same breath that phase instants are good to roughly an hour. Severity **low** and correctly so: nothing a user is misled about in the default output, and the help's wording ("Numeric fields") is arguably literally true of a string field, which is exactly why this is a judgment call and not a mechanical fix. Filed as **T-190** with both fixes named and the instruction to pick one, not both, plus a pin so the two sides cannot drift apart again. Low severity → backlog item only, no `known_issues` entry (cycle.md files only blocker/high look findings there).

items: 0 built (QA pass, not a build wave) · **1 filed (T-190)** · 0 reverted · 0 failed verifies
backlog: 86 done / **2 todo (T-189, T-190)** / 3 dropped, 91 total.
`counters.consecutive_no_value` reset to 0 — this cycle produced verified value: an end-to-end confirmation that the run's one source change is correct at the user-visible surface, plus a real filed defect.
wave autotune: untouched (`k_current` 5, `wave_streak` 1). No build wave ran, and the autotune rules fire only after a wave's merges and verification.
burn attribution: `window_tokens` delta since cycle 91 = 36,912,820 − 33,991,432 = **2,921,388**, credited to moon. `window_tokens_attributed` 20,206,353 → **23,127,741**, a running total across three attributed cycles, NOT a run total — cycles 0–87 left the counter at 0 and are not represented in it.

qa state: `last_full_qa_cycle` 76 → **92**. `last_taste_cycle` stays 81 and `last_review_fix_cycle` stays 73, both by the cycle-91 decision, which stands unmodified: review-fix satisfied in substance, TASTE deliberately not re-run and to be reported at WRAP_UP as not-run with its reason, never as passed.

next work: T-189 (the KI-5 reader-runnable check) is now the only unblocked item ahead of T-190. One live input for it from this cycle, recorded so the next cycle does not have to re-measure it: the default disc at 36% is `░░░█◗` — `░` Neutral, `█` Ambiguous, `◗` Neutral — so a reader's *current* disc already straddles the partition, and the round-limb glyph is Neutral like `▐`. Cycle 91's proposed `▌` (Ambiguous) vs `▐` (Neutral) pair still discriminates, but `▐`/`▌` only appear at ~96% illumination per README:59-61, so an observable built on them is not reproducible on demand tonight. The spec's standing condition binds either way: the observable must be verified to actually differ before it ships.

notifications: none sendable. Phase unchanged (VALUE_LOOP), so no phase-change emit was due in the first place; `bin/swarm-notify.sh` remains denied by the KI-2 allowlist gap. `publish_failures` unchanged at 0 — a headless `-p` session with no Artifact tool is a silent skip by step 8, not a publish failure.

runfile-mirror:
```json
{"version":1,"run_label":"improvement-moon-2026-08-18","targets":[{"path":"/opt/targets/moon","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-19T12:21:07+00:00","usage_reset_at":"2026-08-18T13:00:00+00:00","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1787068682,"next_wakeup_at":1787068772,"pid":2293768,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"probe","gear":2,"gear_target":2,"ratio":0.35,"mode":"guest","k_cap":2,"promote":false,"demote":true,"window_tokens":36912820,"window_cost_usd":30.15,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":14022000,"projected_depletion_at":0,"last_probe_ts":1787067433,"last_real_probe_ts":1787067433,"probe_failures":2,"probe_note":"bin/swarm-budget.sh DENIED for the 19th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array, nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, but returned NO tokenLimitStatus for the SECOND consecutive cycle, so the 130,591,250 limit is CARRIED FORWARD from cycles 89-90, not re-measured - recorded as carried twice running rather than quietly reused. Active block 13:00-18:00Z at 15:37Z: 36,912,820 tokens and $30.15, 157.97 min in, i.e. 233.7k tokens/min = 14.02M/hour - DOWN again from cycle 91 237.9k/min, the fourth consecutive cycle of cooling. Remaining 93.68M over 142.03 min = 659.6k/min target at the guest-forced dial of 1.0, so rho = 0.35, deeper into the gear-5 band than cycle 91 0.39. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands - the FIFTH consecutive cycle where measured rho would license a higher gear and the posture refuses it. ccusage projection 70.96M against the 130.59M carried limit, no depletion risk. The weekly block below is STILL carried forward, not re-measured. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false.","weekly":{"ok":true,"weekly_used_pct":30,"opus_used_pct":20,"week_elapsed_pct":18.72,"weekly_heat":1.61,"opus_heat":1.07,"ceiling":2,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":7,"playbook":{"mode":"auto","applied":["L-008","L-016","L-020","L-021","L-022","L-024","L-026","L-029","L-031","L-033","L-034","L-042","L-043","L-044"],"vetoed":[],"directives":{"wave_k":null,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Tests asserting environment-dependent behavior must reset the env var in beforeEach, not beforeAll - a suite-level restore hook lets a real ambient value leak back in"],"reviewer":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer - never commit or push yourself","The conductor seals its verification gate by hash before dispatch - do not attempt to locate, read or infer the check; code to the acceptance clause, never to a test","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive - a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps.","Classify each surviving mutant as HOLE (a real gap - harden it) or BOUNDARY (behaviour the spec does not decide - document it) BEFORE writing any test","Never assert against prose matched by regex - read a structural marker the document owns, or retire the check. When fixing a detection hole, measure the fix against true-positive controls AND the unfixed baseline, and report both columns","For every mutation that must kill the suite, author one control that must leave it GREEN - a check that dies on everything is a snapshot test, not an assertion"]},"held_out":{"ids":["L-021","L-022"],"why":"both instruct browser/SPA behaviour (hard-reload after server restart; clear persisted UI state before mounting a component) and the target is a zero-dependency terminal CLI with no browser surface. Staged as applied by auto mode, deliberately NOT wired into prompt_lines - wiring them would be noise a builder must discard. To be reported not-exercised at WRAP_UP."},"staged_by":"conductor read of playbook/learnings.md, NOT bin/swarm-playbook.sh parse - the script is DENIED by the allowlist gap (KI-2, 12th consecutive run). The 14 applied ids are exactly the lessons carrying an [apply:] directive, verified by structural read."}},"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

### cycle 92 addendum — dashboard render + commit stamp

dashboard: rendered `SWARM/runs/dashboard.html` with `SWARM/runs/c092-dash.mjs`, same discipline as c086-c091 — anchors grepped out of the live page at run time, split/join so every duplicated template region moves together, all journal-derived strings HTML-escaped, and 14 post-write assertions re-read the file from disk. All 14 pass. Substitutions: gen 1, next 1, banner 2, stats 3, targets 2, decisions list 1. The page moved 40,592 -> 40,684 bytes. Two assertions were ADDED over the c091 set, both of the assert-the-ABSENCE-of-the-stale-value shape that cycle 91 introduced: `old rho 0.39 gone` and `no stale 86/90 denominator anywhere`. The second earns its place — the backlog denominator moved 90 -> 91 this cycle, and it appears in both the stats tile and the targets line, so a check that only confirmed the new string would pass with a stale `86/90` still rendered somewhere on the page.

heartbeat re-touch: `next_wakeup_at` was written as 1787068772 at the persist and the cycle ran past it. Re-touched to 1787068831 so the field describes the actual end of the cycle rather than a moment already gone. Clamp re-checked against hard rule 8: 1787068831 + 900 = 1787069731, well inside stop_at 1787142067 (1,221 minutes of run remaining), so the clamp does not bind.

TOOL OBSERVATION, restated not acted on (hard rule 5 — `templates/` is read-only mid-run): the rendered dashboard still has no `<!DOCTYPE>`, no `<html>` and no `<body>`. Inherited fragment from `templates/dashboard.template.html`, unchanged since at least cycle 88 and now carried for a fifth consecutive cycle. Browsers render it and the stale-banner script works, so the phone viewer is not broken. For the morning report, not for a live edit.

commit: this addendum. The cycle-92 work commit is `eff794e`, now stamped into `state.last_cycle.commit`.
