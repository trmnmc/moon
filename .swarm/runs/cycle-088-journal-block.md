
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
commit: pending — stamped by an addendum commit, as at cycles 85/86/87
next wakeup: 1787061852 (2026-08-18T14:04:12+00:00, +900s). Base 90s is too short for a run with ~22h of clock and a two-item wave next; 900s keeps the pacer from spinning. Clamp checked: wakeup + 900 = 1787062752 sits far inside stop_at 1787142067, so hard rule 8 does not bind.
