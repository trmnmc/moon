// Cycle 88 persist — IDEMPOTENT by construction. Re-running it must not duplicate an
// item or double-advance a counter. (Cycle 88 learned this the hard way: the cycle-087
// persist script was invoked by accident while trying to read it, and it appended a
// duplicate T-186 and stamped a "pending" commit over a real hash. Both were restored
// from HEAD, but the script should never have been able to do it twice.)
import fs from 'node:fs';

const ROOT = '/opt/targets/moon';
const CYCLE = 88;
const TS = process.argv[2];               // ISO timestamp, passed in — scripts have no clock
const COMMIT = process.argv[3] || 'pending';

const rj = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const wj = (p, o) => { fs.writeFileSync(`${p}.tmp`, JSON.stringify(o, null, 2) + '\n'); fs.renameSync(`${p}.tmp`, p); };

// ---------------- backlog ----------------
const BP = `${ROOT}/.swarm/backlog.json`;
const b = rj(BP);

const t184 = b.items.find((i) => i.id === 'T-184');
if (t184 && t184.status !== 'done') {
  t184.status = 'done';
  t184.notes += `\n\nDONE cycle ${CYCLE}. Sealed gate .swarm/gates/cycle-088-T-184.mjs (sha256 0a236502, re-sealed from 766c1c60 — see the cycle-88 journal block), 9/9. REPORT.md 60,774 bytes/781 lines -> 209 lines; the four anchors land at lines 5 (What was built), 25 (How to run it), 45 (Known issues), 59 (VERIFIED vs CLAIMED), and the new file contains no forensic heading at all. Forensics moved verbatim to .swarm/REPORT-ARCHIVE-2026-08-18.md (39,859 bytes). Archival proven in BOTH directions: 0 of HEAD's 546 substantive lines orphaned, and exactly 4 lines of new text added across the two files, all connective, all quantity-free. test/report-issues.test.js untouched and still 18 asserts / 6 test blocks.`;
}

if (!b.items.some((i) => i.id === 'T-187')) {
  b.items.push({
    id: 'T-187',
    title: "REPORT.md's KI-5 row repeats the misattributed pin claim that T-186 corrects in test/render.test.js",
    kind: 'docs',
    priority: 5,
    value: 'M',
    effort: 'S',
    status: 'todo',
    deps: [],
    files_hint: ['REPORT.md'],
    acceptance:
      "REPORT.md's KI-5 row no longer attributes to test/render.test.js:826 the property of making an unannounced glyph change fail the suite. It states what the pin uniquely establishes — that the Block Element set the disc actually draws equals the documented partition, and that the partition straddles two East Asian Width classes — and if it says a glyph change fails the suite at all, it attributes that to the exact-output tests, not to the pin. Any quantity it cites is sourced to .swarm/runs/cycle-087-verify-T-185.txt. The Known-issues table keeps its exact heading text, header cells and column order, and its data-row count stays 6.",
    packages: [],
    model: 'haiku',
    attempts: 0,
    traces_to: 'SPEC must-have 2 — every violation of a recorded lesson filed with file and line. Found at cycle 88 while scoping T-186.',
    notes:
      "CONDUCTOR-FILED, cycle 88. Found by grepping the T-185 finding's phrasing across the whole repo instead of trusting the one file T-186 named: the claim lives in TWO places, test/render.test.js:777 (T-186) and REPORT.md:54 (this item). README.md is CLEAN — grepped, no such claim there — so the scope is exactly those two files and no third sweep is warranted.\n\nREPORT.md:54 reads \"...checks it against the documented partition, so an unannounced glyph change now fails the suite instead of drifting silently.\" The consequent is true of the SUITE and the \"so\" attributes it to the pin, which the cycle-87 measurement refutes: with the pin skipped, U+2592->U+259A still fails 7 tests and U+2593->U+2584 still fails 11.\n\nPAIR WITH T-186 as one k=2 wave: same finding, disjoint files, and one measurement record (.swarm/runs/cycle-087-verify-T-185.txt) judges both. Comment/prose truth only — do NOT touch the pin test's body or assertions (hard rule 2).",
  });
}
wj(BP, b);

// ---------------- state ----------------
const SP = `${ROOT}/.swarm/state.json`;
const s = rj(SP);

if (s.cycle < CYCLE) {
  s.cycle = CYCLE;
  // Wave autotune: CLEAN wave (0 reverts, 0 failed verifies) -> streak +1. Cycle 87
  // already raised k_current to 4 and reset the streak, so this is streak 0 -> 1.
  s.counters.wave_streak = 1;
  s.counters.consecutive_no_value = 0;
  s.counters.consecutive_failures = 0;
  s.qa.last_build_wave_cycle = CYCLE;

  s.decisions.push({
    cycle: CYCLE,
    what: "T-184 kept at sonnet under a gear-2 posture whose demotion rung would have pushed a docs item sonnet->haiku",
    why: "The routing table defines the haiku band as `kind` docs/polish with `effort: \"S\"` — \"formatting, scaffolding, boilerplate\". T-184 is M-effort and its acceptance is gated on preserving a machine-checked structural contract in test/report-issues.test.js while moving ~570 lines. Applying the demotion rung here would land the item BELOW any tier the table would ever route it to, in a band explicitly scoped to S-effort boilerplate. Recording the counter-reading honestly so the retro can judge the call rather than inherit it: cycle 5 read the same rung as scoped to \"docs/polish items\" flatly, and under that reading T-184 demotes. I read the rung as bounded by the band it names. The outcome is one datapoint, not a settlement — the item passed 9/9 first attempt.",
  });

  s.decisions.push({
    cycle: CYCLE,
    what: "T-186 NOT built this cycle despite a gear-2 cap of 2 and 22 hours of remaining clock; it is paired with the newly-filed T-187 as next cycle's k=2 wave",
    why: "Scoping T-186 turned up the same false attribution in a second file (REPORT.md:54), filed as T-187. The two are one finding in two disjoint files, and both must be judged against the same measurement record (.swarm/runs/cycle-087-verify-T-185.txt). Splitting them across cycles would mean authoring two gates over one piece of evidence and would let a corrected comment ship next to an uncorrected report row. Clock is not the scarce resource here — 22h remain against two S-effort items — so the pairing costs nothing and buys a single coherent gate. Recorded because it is a deliberate choice to end a cycle at one verified item when two were admissible.",
  });

  s.decisions.push({
    cycle: CYCLE,
    what: "the cycle-88 gate was re-sealed mid-cycle (766c1c60 -> 0a236502) after its C8 check was found running a 7-file subset of the 9-file suite",
    why: "I enumerated the test files from memory instead of reading test/ from disk — the exact L-045 failure cycle 87 recorded committing one cycle earlier, reintroduced one cycle later. The gate caught itself: C8 parsed tests=171 at baseline and tests=148 under the gate, and a hardcoded list cannot explain a shrinking suite. The fix touched the SUBJECT ENUMERATION only — no assertion, no threshold, no arm — and made the check strictly more discriminating: it now globs test/*.test.js from disk, so adding a test file can never again silently shrink the measured suite. Both hashes are in the record so the diff, not my assurance, is the evidence. The pattern is now twice-observed and belongs in the WRAP_UP distillation: a gate's SUBJECTS must be read from disk, never listed from memory.",
  });

  s.last_cycle = {
    cycle: CYCLE,
    ts: TS,
    work: 'build-wave k=1 (direct Agent dispatch, sonnet) — T-184, the run\'s last M-effort must-have: restructure REPORT.md and archive the forensics',
    outcome: 'VERIFIED 9/9 on sealed gate 0a236502. REPORT.md 781 -> 209 lines, all four reader anchors inside the first 60, zero forensic headings remaining; 0 substantive lines lost, 4 lines of connective text added. Filed T-187 (same KI-5 misattribution, second file). Gate instrument defect caught and fixed mid-cycle.',
    commit: COMMIT,
  };
}
wj(SP, s);

const counts = {};
for (const i of b.items) counts[i.status] = (counts[i.status] || 0) + 1;
console.log(`backlog: ${JSON.stringify(counts)} total ${b.items.length}`);
console.log(`todo: ${b.items.filter((i) => i.status === 'todo').map((i) => `${i.id}(p${i.priority},${i.effort})`).join(' ')}`);
console.log(`state: cycle ${s.cycle} · k_current ${s.counters.k_current} · wave_streak ${s.counters.wave_streak} · decisions ${s.decisions.length} · commit ${s.last_cycle.commit}`);
