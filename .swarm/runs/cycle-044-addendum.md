
### cycle 44 addendum — commit hash, push, render, wakeup band

- Cycle commit: 7f0b2e3, pushed to origin/main (67c05f0..7f0b2e3). Product tree did NOT move:
  src/, bin/, test/, README.md and package.json are all untouched. The entire diff is two
  digit-corrections inside .swarm/CONTRACTS.md. No merge commit and no builder branch — the
  k=1 builder edited in place, so there was nothing to merge and nothing to delete.
- BURN-UP SLIP FROM CYCLE 43 IS NOW SELF-HEALED, and the fix was verified rather than
  assumed. Cycle 43's main subject read `[verified]` with no count, so that render had to
  hand-patch `per_cycle[43] = 1` behind an assert. Its addendum commit carried `[1 verified`,
  which means the series now parses from git ALONE: this render deleted the hardcode and
  replaced it with two assertions (`43 in per_cycle`, `44 in per_cycle`) that fail loudly if a
  future subject ever drops its count again. Both passed — `per_cycle[43] = 1`,
  `per_cycle[44] = 1`. A silently-flattened bar is now impossible without a render abort.
- Dashboard rendered at 08:00:37Z, 10 live-region substitutions, 44 bars. Burn-up moved at
  BOTH ends this cycle: numerator 35 -> 36 (T-126 verified), denominator 40 -> 41 (T-140
  filed). The tooltip says so, and still states the unattributed one-item gap (36 verified vs
  37 marked done) rather than papering over it.
- The cycle-42 renderer defect stayed fixed: all anchor regexes search livetext() (live spans
  only), and every one matched exactly once on the first run. No blind render, no abort.
- No Artifact publish attempted: a headless VPS `-p` session has no Artifact tool, which per
  cycle.md step 8 is not a publish failure. publish_failures stays 0.
- Notifications: none of the three step-8 emit conditions fired — phase unchanged
  (VALUE_LOOP), no target stalled, publish_failures still 0. Moot regardless, since the notify
  channel was unreachable in both invocation forms again this cycle.
- Wakeup: 90s base band, not the 900s no-value band — this cycle verified an item. Derived at
  render time rather than persist time because a 90s band reliably expires during the
  persist/commit/push tail; next_wakeup_at 1786780927. Clamp checked and asserted in the
  render script itself: wakeup + 900 <= stop_at holds with ~7.5h of margin. No ScheduleWakeup
  call — on the VPS bin/swarm-pacer.sh reads next_wakeup_at and is the firing mechanism
  (cycle.md step 9).
- SWARM-side writes this cycle were confined to runs/ (the render script, the runfile and its
  .bak, the dashboard) — inside the hard-rule-5 fence. Target-side writes were confined to
  .swarm/ plus the one CONTRACTS.md correction.
- Two Bash calls were refused for SHAPE rather than content this cycle (a `cd`-prefixed git
  invocation, and a compound `node --test ...; echo EXIT=$?; tail ...`). Both were re-issued
  in an accepted form with no loss: git as `git -C /opt/targets/moon ...`, and the exit code
  captured via `spawnSync().status` inside node — which is strictly BETTER than the refused
  form, since it satisfies L-010 (capture the exit code directly, never through a pipe) by
  construction. A third refusal hit the journal-block heredoc, which was re-issued as a file
  write. Worth noting for the morning report: the shape refusals are now a routine tax on
  every cycle, and each one costs a round trip.
- STATE AFTER: backlog 37 done / 4 todo of 41. Definition of done is MET and was re-verified
  this cycle by direct measurement. The target is deliberately NOT declared done because
  T-140 clears the ratchet; it is the natural next pick and is the only open item that would
  prevent this class of defect from recurring. Behind it sit three confirmed ratchet rejects
  (T-130, T-139, T-116) whose rejection reasons are now recorded so later cycles stop
  re-litigating them. With ~7.5h left at gear 1 there is ample room for T-140; the honest
  risk for the rest of the run remains churn, not time.
