// Cycle 49 runfile mutation, run once by the conductor.
const fs = require("fs");
const p = "/opt/swarm/runs/current.json";
const r = JSON.parse(fs.readFileSync(p, "utf8"));
const now = 1786888091;

r.budget.source = "clock";
r.budget.gear = 1;
r.budget.gear_target = 1;
r.budget.k_cap = 1;
r.budget.promote = false;
r.budget.demote = true;
r.budget.last_probe_ts = now;
r.budget.probe_failures = 2;
r.budget.gear_evidence = "bin/swarm-budget.sh DENIED again at cycle 49 (KI-2 allowlist gap, unchanged since kickoff), so probe_failures 1 -> 2 and no probe ratio exists. The failure table's default for a probe failure is clock-fallback cruise (gear 3); gear 1 is held instead because cruise is the EVIDENCE-FREE fallback and better evidence exists on disk. runs/allocator.json + runs/allocator-state.json, both stamped 1786887824 (8s before this cycle's clock): weekly_used_pct 98.0, opus_used_pct 97, week_elapsed_pct 90.91, posture trickle, allow_overall_pct 0, allow_premium_pct 0. Binding constraint is absolute headroom, not heat: ~2% of the weekly envelope remains and week_resets_at 1786942800 IS stop_at, so there is no later richer window to save for. Crawl WITH evidence, per the step-1 evidence rule.";
r.budget.weekly = {
  ok: true,
  weekly_used_pct: 98.0,
  opus_used_pct: 97.0,
  week_elapsed_pct: 90.91,
  weekly_heat: 1.08,
  opus_heat: 1.07,
  ceiling: 1,
  promote_blocked: true
};

r.heartbeat = { ts: now, next_wakeup_at: now + 900, pid: 1087148, limp: false, degraded_tiers: [] };

fs.writeFileSync(p + ".tmp", JSON.stringify(r, null, 2));
fs.renameSync(p + ".tmp", p);
fs.copyFileSync(p, "/opt/swarm/runs/current.json.bak");
console.log("runfile: gear", r.budget.gear, "probe_failures", r.budget.probe_failures, "hb", r.heartbeat.ts, "next", r.heartbeat.next_wakeup_at);
