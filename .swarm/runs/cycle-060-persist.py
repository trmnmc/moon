import json, os, subprocess, time

RF = '/opt/swarm/runs/current.json'
J = '/opt/targets/moon/.swarm/journal.md'
now = int(time.time())

r = json.load(open(RF))
b = r['budget']
b['source'] = 'clock'
b['gear'] = 1
b['gear_target'] = 1
b['mode'] = 'guest'
b['k_cap'] = 1
b['promote'] = False
b['demote'] = True
b['last_probe_ts'] = now
b['gear_evidence'] = (
  "cycle 60: no REAL probe attempted -- not due (now %d - last_real_probe_ts %d = %d s < 1800), "
  "so probe_failures stays 7 and last_real_probe_ts is unchanged; next real re-attempt due %d. "
  "Gear 1 held on fresh disk evidence: runs/allocator.json reads weekly_used_pct 100.0, opus_used_pct 97, "
  "week_elapsed_pct 93.24 (up from 93.06 last cycle, so the file is live), posture trickle, "
  "allow_overall_pct 0, allow_premium_pct 0, dial 0.30, source probe. week_resets_at 1786942799 == stop_at, "
  "so no later richer window exists to save for. Guest clamps 1-3. bin/swarm-notify.sh poll was DENIED by the "
  "Bash allowlist this cycle (KI-2, same gap); runs/control.json was read directly instead: pending [], applied [], "
  "no inject array -- nothing to triage."
) % (now, b['last_real_probe_ts'], now - b['last_real_probe_ts'], b['last_real_probe_ts'] + 1800)
b['weekly']['week_elapsed_pct'] = 93.24

r['heartbeat']['ts'] = now
open(RF + '.tmp', 'w').write(json.dumps(r, indent=2) + '\n')
os.replace(RF + '.tmp', RF)

mirror = json.loads(json.dumps(r))
mirror['artifact'].pop('url', None)

block = """
## cycle 60 | %s | moon | VALUE_LOOP
work: inline PLAN (one sonnet Plan seat) -- the backlog was EMPTY (50/50 done) and every SPEC must-have
already has a covering verified item, so the run is in VALUE_LOOP and needed candidates before it could
score any. Gear 1 crawl allows planning/backlog-hygiene/docs; a QA or review-fix wave does not fit the
posture (allocator trickle, allow_overall_pct 0, weekly 100%% consumed).
budget: gear 1 (guest, clamp 1-3) | source clock, no probe due (1545 s since last real attempt < 1800) |
probe_failures 7 held | allocator.json posture trickle, weekly_used_pct 100.0, week_elapsed_pct 93.24
control: swarm-notify.sh poll DENIED by the Bash allowlist (KI-2); runs/control.json read directly --
pending [], applied [], no inject array. Nothing to apply, nothing to triage.
agent: Plan seat @ sonnet (gear-1 cost discipline; PLAN is not a listed fable judgment seat) ->
.swarm/runs/cycle-060-plan.md. Its returns were treated as CLAIMS and each premise re-checked below by the
conductor before anything was written to the backlog.
VERIFICATION EVIDENCE (conductor-run, this cycle -- these verify the PLAN's premises, not any item's done-ness;
no item was claimed done this cycle):
  baseline suite: node --test test/*.test.js
    -> "tests 147 / suites 0 / pass 147 / fail 0 / cancelled 0 / skipped 0 / todo 0 / duration_ms 2198.76"  GREEN
  T-150 premise: grep -n '145|147' REPORT.md
    -> ":212  node --test test/*.test.js    # 145 tests"     CONFIRMED STALE (suite runs 147)
    -> ":6  ... cycles 0-47 ... **145/145 tests green**"     TRUE AS WRITTEN (run-scoped history; must NOT be rewritten)
    -> ":55  ... (At cycle 47, when the suite carried 145 tests ...)"  TRUE AS WRITTEN (cycle-scoped)
    -> ":142 ... 145/145 green at the time (**147/147** ...)"  already corrected by T-147/T-148
  T-151 premise: sed -n '205,224p' README.md
    -> section explains via "Neutral"/"Ambiguous" East Asian Width classes and names iTerm2's
       "treat ambiguous-width as double" and `xterm -cjk_width`; NO line tells the reader what to
       observe on their own screen.                          CONFIRMED GAP
  CI nice-to-have (the PLAN called it already-satisfied -- conductor went further than the agent did):
    cat .github/workflows/ci.yml -> on: push + pull_request; matrix node [20, 22]; run: npm test
      (= "node --test test/*.test.js" per package.json:11; engines.node ">=20")
    the agent did NOT check that the pinned action versions resolve, so the conductor checked the live runs:
    gh run list --limit 5 -> 5x "completed success" CI on main, latest 31961923816 at 2026-08-16T17:32:45Z (22s)
    => checkout@v7 / setup-node@v7 do resolve and the workflow really runs green. CLOSED as satisfied,
       on live evidence rather than on file-reading. No item filed -- filing one would be padding.
filed: T-150 (docs/S/haiku, REPORT.md) priority 7; T-151 (docs/S/haiku, README.md) priority 6. files_hint
pairwise-disjoint. Both carry an explicit churn guard in notes -- this run's taste risk is "churn wearing
rigor's clothes", and a reworded-prose diff does not close either item.
not filed: the known-issues-table nice-to-have (REPORT.md:118-122 severities and citations match
.swarm/state.json's KI-2/4/5/7/8 exactly -- no drift to fix) and a REPORT KI-2 narrative refresh (SWARM
harness bookkeeping, not a product defect; fails both ratchet questions for the product's reader).
outcome: planning cycle -- 2 candidates filed, 1 nice-to-have closed on evidence, 0 items verified.
counters.consecutive_no_value 0 -> 1 (honest: no verified value this cycle). k_current 4 unchanged
(no wave ran); gear 1 caps the next effective wave at 1 regardless.
commit: %s
next wakeup: %d (+%d s)
runfile-mirror:
```json
%s
```
""" % (time.strftime('%Y-%m-%dT%H:%M:%S+00:00', time.gmtime(now)),
       '%COMMIT%', now + 1200, 1200, json.dumps(mirror, separators=(',', ':')))

with open(J, 'a') as f:
    f.write(block)
print('journal appended, %d chars' % len(block))
