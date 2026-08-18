import fs from "node:fs";

const P = "/opt/targets/moon/.swarm/state.json";
const s = JSON.parse(fs.readFileSync(P, "utf8"));

if (s.known_issues.some((k) => k.id === "KI-9")) {
  console.log("KI-9 already present — no change");
  process.exit(0);
}

s.known_issues.push({
  id: "KI-9",
  desc:
    "The watchdog's DONE-guard is UNCONDITIONAL on <target>/REPORT.md existing, so on any " +
    "IMPROVEMENT run over a repo that already shipped, the guard fires from the very first " +
    "firing and the watchdog never arms at all. MEASURED, not inferred: run 3 kicked off at " +
    "2026-08-17T16:12:20Z; the first watchdog firing after that, at 16:37:17Z, logged " +
    "'decision=all-done detail=reports-present', and so did all 20 subsequent firings through " +
    "wrap-up. REPORT.md has existed in this repo since run 1's wrap-up commit 9bc8a0f, so the " +
    "same is true of runs 2 and 3 in their entirety. Mechanism read directly out of " +
    "bin/swarm-watchdog.sh:275-285: after the wrap_up_complete check, it loops every " +
    "targets[].path and exits 'all-done' if REPORT.md is present in each, with no reference to " +
    "target status, cycle number, or run start time. cycle.md WRAP_UP step 6 describes this file " +
    "check as 'the safety net for a lost flag write' -- correct for a first-build run, where " +
    "REPORT.md cannot exist before wrap-up, and wrong for every improvement run, where it always " +
    "does. SEVERITY IS MEDIUM, NOT HIGH, and the reason matters: on the VPS the actual firing " +
    "mechanism is bin/swarm-pacer.sh, which spawns a cycle whenever heartbeat.next_wakeup_at is " +
    "due, so a dead conductor session still gets recovered on the next pacer tick. What was lost " +
    "for three runs is the REDUNDANT layer -- the watchdog's stale-heartbeat detection, PID " +
    "identity check, kill, and relaunch -- not all recovery. WHAT WOULD SETTLE IT: gate the " +
    "REPORT.md branch on evidence that the file belongs to THIS run rather than a prior one -- " +
    "e.g. require its mtime to be at or after the runfile's own creation, or require every " +
    "target's runfile status to be done/stalled alongside it, or drop the file check entirely " +
    "now that wrap_up_complete has proven reliable across 33 recorded 'run-complete' decisions. " +
    "A one-condition change in bin/swarm-watchdog.sh; hard rule 5 forbids making it from inside " +
    "a run, so it is a morning action for the user.",
  severity: "medium",
  cycle_found: 84,
  found_by: "conductor, at WRAP_UP, while trying to disarm the watchdog and reading its log",
  status: "open, needs a human — SWARM tooling gap, not a product defect",
});

fs.writeFileSync(P + ".tmp", JSON.stringify(s, null, 1));
fs.renameSync(P + ".tmp", P);
console.log("known_issues now:", s.known_issues.map((k) => k.id).join(", "));
