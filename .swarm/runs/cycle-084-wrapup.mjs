import fs from "node:fs";

const RF = "/opt/swarm/runs/current.json";
const r = JSON.parse(fs.readFileSync(RF, "utf8"));
const now = Math.floor(Date.now() / 1000);

r.wrap_up_complete = true;
for (const t of r.targets) if (t.status !== "stalled") t.status = "done";
r.cycles_since_recycle = 18;
r.heartbeat.ts = now;
r.heartbeat.next_wakeup_at = 0;
r.heartbeat.pid = 2051241;

r.budget.last_probe_ts = now;
r.budget.gear = 2;
r.budget.gear_target = 2;
r.budget.k_cap = 2;
r.budget.source = "clock+allocator";
r.budget.weekly = {
  ok: true,
  weekly_used_pct: 19.0,
  opus_used_pct: 11,
  week_elapsed_pct: 12.2,
  weekly_heat: 1.5574,
  opus_heat: 0.9016,
  ceiling: 2,
  promote_blocked: true,
  source:
    "REAL: runs/allocator.json ok=true source=probe, read at cycle 84 open. Heat + ceiling " +
    "computed by hand because bin/swarm-budget.sh is denied (KI-2).",
};
r.budget.gear_evidence =
  "cycle 84 (WRAP_UP): the real probe was NOT due (last_real_probe_ts 1318 s old at cycle open, " +
  "inside the 1800 s re-probe window) and probe_failures is 13, well past the >=3 threshold that " +
  "stops invoking it. So no probe attempt was made this cycle and probe_failures stays 13 -- a " +
  "14th refusal would have added no information now that cycle 83 established the root cause " +
  "conclusively. Gear rests on a REAL allocator reading: runs/allocator.json ok:true source:probe, " +
  "posture NORMAL, allow_premium_pct 8.516 (up from 8.329), weekly_used_pct 19.0 at " +
  "week_elapsed_pct 12.2 -> weekly_heat 1.5574. NOTE: this is the FIRST DECREASING reading of the " +
  "run (81: 1.5666, 83: 1.5886, 84: 1.5574) and the mechanism is benign -- weekly_used_pct held " +
  "flat at 19.0 while week_elapsed_pct advanced 11.96 -> 12.2, so the denominator grew. It is not " +
  "evidence of the governor relaxing; heat is still 20% over the 1.3 trigger. Ceiling 2, promote " +
  "BLOCKED. opus_heat 0.9016, below its 1.2 trigger, so opus is not the binding constraint. " +
  "Window rho remains UNMEASURED (probe denied), so the evidence rule lands cruise 3 and the " +
  "governor clamps to 2. Applied gear 2, unchanged; hysteresis did not bind.";

fs.writeFileSync(RF + ".tmp", JSON.stringify(r, null, 2));
fs.renameSync(RF + ".tmp", RF);
fs.copyFileSync(RF, "/opt/swarm/runs/current.json.bak");

const mirror = JSON.stringify(r);
fs.writeFileSync("/tmp/runfile-mirror-084.txt", mirror);
console.log("runfile written. wrap_up_complete =", r.wrap_up_complete, "| target status =", r.targets[0].status);
console.log("mirror bytes:", mirror.length);
