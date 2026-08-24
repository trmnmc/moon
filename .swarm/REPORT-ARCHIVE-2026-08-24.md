# Run 6 archive

Archived from REPORT.md at cycle 114 — the WRAP_UP of run 7 — on 2026-08-24, containing in full
the run-6 record that previously occupied REPORT.md's end-of-file run-record section. Nothing was
deleted: the text below is that section verbatim, moved. Runs 4–5 are in
`.swarm/REPORT-ARCHIVE-2026-08-20.md`; runs 1–3 in `.swarm/REPORT-ARCHIVE-2026-08-18.md`.

## Run 6 (2026-08-20)

Run 6 was an allocator-driven **TRICKLE** run: spare window, not a user ask. The brief: no new feature, flag, or dependency.

**Verified, cycles 103–109**, each item gated against a check written at verification time and never shown to the builder:

- **T-206 / T-213 — the doc→code citation gate**, `test/citations.test.js`, its own words: "find EVERY `file:line` citation the two documents make into this repo's code, resolve it, and assert the cited line genuinely contains what the sentence around it says it contains".
- **T-207 / T-211 — count claims**, `test/doc-counts.test.js`, in its own words: it checks "whether a count claim names a measurement point (a cycle, a run, a commit, a date) rather than floating free", and "for any claim that names a PAST cycle" it re-derives the number by "checking that commit out into a worktree, and running the suite there".
- **T-208 / T-210 — KI-2 escalated once**, not re-diagnosed an eighth time. The ask was re-measured: four allowlist lines covering two scripts, spelled out in `.swarm/KI-2-OWNER-ACTION.md`.
- **T-212 — this document's own first-screen pointer had rotted**, naming one archive where the record lives in two. A false prose *completeness* claim whose named paths all resolve is a shape no gate catches; it remains a human read.
- Suite size, measured directly: 210 tests / 210 passing at cycle 104 (commit `ecdbcb8`); 245 tests / 245 passing at cycle 109 (commit `ed7054e`).

**Why it stopped early.** The backlog reached zero with ~20 hours of clock unspent; the delta this run opened to close was closed.

The detailed record for runs 4–5 is in `.swarm/REPORT-ARCHIVE-2026-08-20.md`.
