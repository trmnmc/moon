# Runs 4–5 archive

Archived from REPORT.md at cycle 105, 2026-08-20, containing the full detail of runs 4 and 5 that previously occupied the end-of-file section.

## Runs 4-5 (2026-08-18, 2026-08-19) - two trickle runs, and what they settled

Both were allocator-driven **TRICKLE** runs: they existed because there was spare window, not
because a user asked. Run 4 ran 13 cycles (85-97), run 5 ran 5 (98-102). Neither added a
feature, flag, or dependency - that was the brief both times. Run 4s full change log is in
`.swarm/REPORT-ARCHIVE-2026-08-18.md`.

**Run 4** verified thirteen items, zero reverted. The load-bearing one was a real wrong answer
to a user: `detectHemisphere("US/Samoa")` returned north for a location at 14 degrees south
(cycle 86) - the runs only source change. It also cut this report from 60,774 bytes so the
first screen carries what-it-is, how-to-run, what-is-verified and known-issues; wrote the KI-8
owner ask; and closed four doc-truth defects. Its closing audit returned zero findings.

**Run 5** was scoped to the only thing that had changed since: the practice playbook. Four
items, all verified, zero reverted, zero blocked.

- **Two documented CLI capabilities were proven only against `parseArgs()`, never against the
  process a user runs** (T-201, cycle 99): `-h`, and `--south`/`--north` last-one-wins. Both
  now have a check that spawns `bin/moon.js`.
- **Test comments cite README line numbers, and four had decayed** one to three lines off
  (T-203/T-204/T-205, cycles 99-101). A gate now re-derives each cited line from README at run
  time, per declared file and per distinct promise, and tells "the promise moved" apart from
  "the promise is gone".

**Why run 5 stopped.** At cycle 102 the backlog was empty and every definition-of-done clause
was re-derived from the repo rather than read back out of a document: suite **187/187 green**
(baseline 175); this file at its 26,469-byte ceiling, not grown; no `dependencies` or
`devDependencies` key, no lockfile, no `node_modules`; and every `file:line` citation this
report makes into the code re-checked against the line it points at - all true, including the
bare `:281`/`:346` shorthand a path-anchored sweep misses. The L-046 and L-043 audits came
back clean. **No candidate passed the ratchet**, so the run wrapped rather than manufacture a
diff - the outcome its own spec named as expected.

Run 5 also settled a question open since cycle 62: **READMEs KI-5 self-check is sound.** In a
normal terminal every framed row of `--block` is 34 columns; modelling the ambiguous-as-double
failure mode splits them into three widths - 68 for the borders, 40-42 for the disc rows, 36
for the text rows. Comparing a border against a text row, which is what the README tells you
to do, differs by 32 columns; comparing top border against bottom border - the observable
cycle 62 disproved - cannot differ, since both are 68. That is a width-model computation, not
a live CJK-terminal observation: KI-4 and KI-5 still need a human with the terminal.

**Five runs in, the diagnosis in item 6 above has only hardened.** Runs 4 and 5 each found
real, traceable work and then ran out of *authorized* work with most of the night left - run 5
with ~22 hours unspent. The remaining value here is not another correctness pass; it is the
scoping decision only the owner can make.
