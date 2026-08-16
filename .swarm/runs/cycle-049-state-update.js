// Cycle 49 state mutation, run once by the conductor.
const fs = require("fs");
const sp = "/opt/targets/moon/.swarm/state.json";
const s = JSON.parse(fs.readFileSync(sp, "utf8"));

s.cycle = 49;
s.phase = "BUILD"; // PLAN gate satisfied at cycle 48; must-have items remain todo.

// Wave autotune: the wave was CLEAN (zero reverts, zero failed verifies) -> streak 1 -> 2,
// which fires the promote rule. k_current is already at the hard max of 5, so it stays 5
// and the streak resets. Gear 1 caps the EFFECTIVE wave at 1 regardless.
s.counters.wave_streak = 0;
s.counters.k_current = Math.min(5, s.counters.k_current + 1);
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;

s.qa.last_build_wave_cycle = 49;

s.last_cycle = {
  cycle: 49,
  work: "build-wave k=1 (gear-1 cap) at haiku -- T-116, README US spellings",
  outcome: "GATE PASS - 1 verified, 5/5 conductor checks green, 145/145 suite unchanged, 0 reverted, 0 new items filed",
  ts: "2026-08-16T13:52:00Z"
};

fs.writeFileSync(sp + ".tmp", JSON.stringify(s, null, 1));
fs.renameSync(sp + ".tmp", sp);
console.log("state: cycle", s.cycle, "phase", s.phase, "counters", JSON.stringify(s.counters));
