import fs from "node:fs";

const P = "/opt/targets/moon/.swarm/state.json";
const s = JSON.parse(fs.readFileSync(P, "utf8"));

s.phase = "DONE";
s.cycle = 84;
s.counters.consecutive_no_value = 0;
s.qa.last_wrap_up_cycle = 84;

s.decisions.push({
  cycle: 84,
  what:
    "Target declared DONE and the run wrapped up ~14.4 h early. Definition-of-done re-verified " +
    "by running commands (171/171 green, no dependencies key, no lockfile, no node_modules), not " +
    "read off backlog labels. Every authorization source was searched, not just the backlog: " +
    "SPEC.md must-haves (closed c80), SPEC.md Nice-to-haves (exhausted c83), the run-2 and run-1 " +
    "specs (still binding, all must-haves closed, T-116/T-130/T-139 all done), the step-4 pass list " +
    "(only POLISH never ran), known_issues (each needs a human or is forbidden by a non-goal), and " +
    "the cycle-81 taste findings (1 built as T-176, 3 parked in ideas-ledger.md as out of scope).",
  why:
    "POLISH was weighed against the two-question ratchet and REJECTED on the merits, not skipped " +
    "for time: six items this run re-verified every doc claim in the repo, so the prose a polish " +
    "agent would rewrite is currently verified-true, and rewriting verified prose is how an " +
    "unverified claim comes back -- the exact failure T-160 was reverted for at c71. It also traces " +
    "to none of the SPEC taste note's three permitted sources, and the run names diminishing-return " +
    "churn as its chief risk. The pacing evidence agrees: weekly_heat 1.5574 is still 20% over the " +
    "governor's 1.3 trigger, so spending 14 more hours on spec-forbidden work would be wrong twice.",
});

s.decisions.push({
  cycle: 84,
  what:
    "The playbook distillation deviated from the mechanical cap rule, and the deviation is stated " +
    "rather than silent. The rule (every lesson high-confidence -> drop the oldest pre-existing " +
    "overall) selected L-008, which this run wired into all three role prompt sets and re-observed " +
    "across 19 cycles with zero builder commits. Dropped L-011 and L-018 instead -- the oldest " +
    "pre-existing lessons NOT re-observed this run, both browser/React lessons a zero-dependency " +
    "terminal CLI could not exercise in either direction. Both archived losslessly to " +
    "playbook/learnings-archive-2026-08-18.md.",
  why:
    "Dropping a load-bearing lesson that this very run confirmed, in order to make room for a new " +
    "one, is a regression dressed as bookkeeping. Recorded in playbook/DROP-RATIONALE-2026-08-18.md " +
    "and surfaced in the morning report so a human can overrule it.",
});

s.decisions.push({
  cycle: 84,
  what:
    "REPORT.md's how-to-run annotation read '# 161 tests' -- correct when T-174 pinned it at c80, " +
    "stale by c83 because cycles 82 and 83 added tests (161 -> 165 -> 171). Third decay of a " +
    "hard-coded count in this file. Rewritten to carry its measurement point rather than a bare " +
    "number, and corrected as part of writing the report rather than filed as new work.",
  why:
    "A claim made weaker but true beats one made stronger and unverifiable (SPEC taste note). The " +
    "durable fix is the T-180 treatment -- have a test parse the annotation -- which is deliberately " +
    "NOT done here because WRAP_UP finishes nothing new; it is handed off in the report instead.",
});

fs.writeFileSync(P + ".tmp", JSON.stringify(s, null, 1));
fs.renameSync(P + ".tmp", P);
console.log("state.json: phase", s.phase, "cycle", s.cycle, "decisions", s.decisions.length);
