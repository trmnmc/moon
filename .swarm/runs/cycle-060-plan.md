# cycle 60 — inline PLAN raw return

Seat: one Plan-type subagent, model sonnet, read-only, dispatched via Agent (cycle.md step 5,
"PLAN (inline)"). The return below is the agent's VERBATIM text and is a set of CLAIMS. Every
premise it rests on was independently re-checked by the conductor before any backlog write; the
conductor's own command output for those checks is in the cycle 60 journal block under
VERIFICATION EVIDENCE. Where the agent stopped short (it read `.github/workflows/ci.yml` but never
checked that the pinned action versions resolve), the conductor went further and checked the live
GitHub Actions runs.

---

## Verdicts

1. **REPORT.md known-issues table vs state.json** — ALREADY SATISFIED for the table itself: all 5 rows' severities match exactly (KI-2/KI-5 medium, KI-4/KI-7/KI-8 low — `.swarm/state.json` vs `REPORT.md:118,120,122,121,131`), and the KI-6/KI-7 line citations it carries (`astro.js:358`, `astro.js:71-74`, `astro.js:363`, `README:184`) all point at the exact lines claimed, verified by reading the current file. **But real drift exists elsewhere in the same file**: `REPORT.md:212`'s "How to run it" block still reads `node --test test/*.test.js    # 145 tests`, while running the suite now gives `tests 147 / pass 147`. This is not new — backlog `T-148`'s own notes (cycle 57 pin, cycle 58 log) show it was *deliberately scoped out* of the VERIFIED-table regeneration and never revisited, so it survived as the one number T-147/T-148 didn't reach.

2. **KI-5 one-line reader test** — REAL WORK EXISTS. `README.md:205-224` requires the reader to already understand East Asian Width jargon ("Neutral"/"Ambiguous") and know obscure terminal settings (iTerm2's "ambiguous-as-double", `xterm -cjk_width`) to self-diagnose. There is no single sentence telling them what to *look at on their own screen* to get a yes/no answer.

3. **CI workflow** — ALREADY SATISFIED, evidenced. `.github/workflows/ci.yml` triggers `on: push` and `on: pull_request`, runs `npm test` (= `node --test test/*.test.js`, exactly the SPEC's mandated test command per `package.json:11`) on a `[20, 22]` matrix, matching `package.json`'s `engines.node: ">=20"` exactly. Nothing to add or fix; proposing anything here would be padding.

## Proposed items (2 — see note below)

**1. Fix the stale test count in REPORT.md's "How to run it" block**
- kind: docs
- effort: S
- files_hint: `/opt/targets/moon/REPORT.md`
- acceptance: The "How to run it" code block's comment on the test command states the count that a fresh run of the suite currently produces, with no other line in that block touched.
- ratchet: The next person who copy-pastes REPORT.md's own instructions and runs the suite sees 147 where the doc says 145 — an immediate, visible mismatch in the file whose whole late-run mandate was "every doc-cited number gets re-verified." It's a one-character-class fix that, once made, stays true until the next test is added — not reworded prose that could go either way.

**2. Give README's KI-5 section one jargon-free self-check line**
- kind: docs
- effort: S
- files_hint: `/opt/targets/moon/README.md`
- acceptance: The "Known limitation: terminal glyph width" section states, in one sentence a reader can act on without knowing East Asian Width terminology or terminal-config names, what to look at on their own screen to tell whether they are affected (the section already names that the `--block` frame fails to close as a symptom — the gap is that nothing points the reader at checking that directly, in the moment, on their own machine).
- ratchet: Today the reader must learn Unicode class jargon and hunt for an obscure terminal setting to self-diagnose; a single observable-on-screen check turns an abstract classification problem into a fact they can settle themselves in seconds, and "am I affected" is exactly the thing they'll still care about 10 minutes later — it's the one open KI a CLI end user can act on unassisted.

**Why only 2:** I checked the third nice-to-have (CI) and found it already fully satisfied with cited evidence — proposing an item there would be padding against a target that isn't broken. For the known-issues-table nice-to-have, the table itself checked out clean against `state.json`; the only real drift I could evidence in that area was the stale count at `REPORT.md:212`, which is item 1. I looked for a third candidate (e.g., updating REPORT's KI-2 row, which state.json shows was re-escalated at today's kickoff) and rejected it: KI-2 is explicitly SWARM-tooling narrative ("not a product defect," REPORT.md:118) whose facts are a moving target inside a single run — updating it now would be stale again by next kickoff, and neither the CLI's end user nor "the next person to change this code" (the product, not the swarm harness) would notice or keep caring about it. That's the churn shape the SPEC names, so I'm not proposing it.

---

## Conductor disposition

- Item 1 accepted as **T-150**, with the acceptance REWRITTEN by the conductor to add the trap the agent
  did not name: REPORT.md:6 and :55 are run/cycle-scoped historical counts that are TRUE as written and
  must not be dragged to today's number.
- Item 2 accepted as **T-151**, acceptance rewritten to require an observable check (not a reworded
  paragraph) and to forbid deleting the existing technical explanation.
- Verdict 3 accepted and CLOSED — but on the conductor's live-run evidence (`gh run list`: 5 consecutive
  successful CI runs on main), not on the agent's file reading, which could not have caught a bad action pin.
- Verdict 1's "already satisfied" half accepted: the conductor re-read REPORT.md:118-122 against
  state.json's known_issues and found the severities and citations in agreement. No item filed.
