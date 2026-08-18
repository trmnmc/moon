# moon — run retro (improvement run 4)

<!-- Written by /swarm WRAP_UP to <target>/.swarm/RETRO.md. Evidence rules apply here
     exactly as in the verification gate: every entry cites cycle numbers from
     .swarm/journal.md. No cycle number, no entry — vibes are not evidence.
     Run 3's retro is preserved verbatim at .swarm/RETRO-improve-2026-08-17.md. -->

Run: 2026-08-18 (improvement run 4, allocator TRICKLE auto-kickoff) | cycles run: 85–97 (13)
| stop reason: **definition of done met and the value space genuinely drained** — declared at
cycle 97 after an independent standing-claim re-derivation returned zero findings. ~18.4h of
authorized clock left unspent, by decision.

## What worked

- **Wave size 2, every build wave, zero reverts and zero failed verifies across the whole run**
  (cycles 86, 87, 88, 89, 90, 93, 95, 96). The gear-2 cap held `k` at 2 for the entire run and
  never once cost a merge. Thirteen items were built and verified; not one went back to `todo`.
  `k_current` sat at 5 the whole time and was never the binding constraint — the gear cap was.
- **Sequential dispatch when `files_hint` collided, instead of shrinking the wave** (cycles 89,
  96). Both cycles had two items naming the same file (`REPORT.md`), so they could not be a
  concurrent wave under the headless no-worktree rule; dispatching them strictly in sequence,
  with the second builder told the first's edit was already in the tree and must be left alone,
  landed both cleanly. That is worth more than dropping to k=1.
- **Sealing the verification check from builders paid off measurably at cycle 96.** The T-193
  builder introduced a *new* claim ("42") that the sealed gate did not cover; because the gate
  was authored at verification time rather than copied from the backlog, the conductor caught
  it instead of grading the builder's own framing.
- **Gates that simulate the future, not the present** (cycle 96, T-194). The obvious fix for a
  stale "generated at 01:45" trailer is to restamp it — which would have been false the moment
  that very cycle committed. Gate arm G2b re-asked the predicate with the file committed a day
  later and a tag distance of 30, and that is the arm that forced a form with no absolute
  timestamp at all. Grading the present would have passed the defect straight through.
- **The standing-claim audit was the highest-yield work type of the run** (cycle 94: 4 defects
  filed, 0 built by design; closed at cycles 95–96). Re-deriving what the docs *assert* against
  what the repo *is* found four real wrong statements after three prior runs had already swept
  the code. Cheaper than any build wave and it found things mutation sweeps structurally cannot.
- **"Checked-and-clean" as a first-class outcome** (cycles 85, 87, 97). The spec authorized it
  explicitly and it was used honestly three times rather than being converted into busywork.

## What thrashed

- **The run's SPEC was authored from a partial reading of history, and one of its two
  nice-to-haves was already satisfied before the run began** — why: nice-to-have #1 (a
  reader-runnable KI-5 check) and the T-189 item descending from it were both written from
  cycle **62**, whose observable was disproved at the gate; neither noticed that cycle **63**
  then retried with a sound observable and landed it. The stale premise was carried for four
  cycles before cycle 93 caught it and closed T-189 as `dropped` — the honest status for an item
  whose defect does not exist (cycles 91, 92, 93). Cost: ~4 cycles of misdirected priority.
- **The conductor's own instruments failed repeatedly, and always in the same place** — why:
  every failure was in a check that graded PROSE or re-encoded something the repo already
  states, rather than reading a structural marker the artifact owns. Seven of this family
  across the run (cycles 8, 9, 19, 94, 95, 96 — three carrying an explicit `INSTRUMENT DEFECT`
  block in the live journal). The worst shape appeared at cycle 96: a dashboard predicate
  anchored on free text matched inside the template's own documentation comment, honestly
  reported "1 occurrence replaced", and went **GREEN over a dead region** while the live element
  still read cycle 95. Only two of the conductor's own assertions disagreeing with each other
  surfaced it. The repo's tests honor L-043/L-045; the conductor's gate scripts did not.
- **`bin/swarm-budget.sh` and `bin/swarm-playbook.sh` were denied at every single cycle** — why:
  KI-2, a missing allowlist entry (not a path-form mismatch), now at 24 consecutive runs.
  Confirmed again this run at cycle 96 in the sharpest possible form: the *absolute* path form of
  `swarm-notify.sh` was denied while the *relative* form succeeded in the same cycle. Every
  budget probe of this run was run by hand; `probe_failures` correctly held at 2 rather than
  incrementing, because the script never launched and so returned neither `probe_ok` true nor
  false. Deliberately not routed around via node/python — that would produce a green artifact
  over a boundary the user never granted.
- **A text-based test counter failed its own control at cycle 97** — why: 7 of the suite's 175
  tests are generated by a loop over `.swarm/CONTRACTS.md` citations, so `grep -c 'test('`
  reproduced 168, not 175. The counter was not patched into agreement; it was replaced by a
  structural derivation (static count − 1 loop stub + 8 generated) that reproduces 175 exactly
  at HEAD before being applied to the older revision. Same family as the instrument defects above.

## Pacing honesty

- Governor clamps: **every cycle of the run** (85–97). `weekly_heat` ran 1.65 against a 1.3
  threshold (weekly_used 36–37% at week_elapsed 22%), pinning the ceiling to **gear 2** and
  blocking the promote rung throughout. Ceilings hit: guest-mode clamp 3, weekly-governor clamp
  2 — the governor was the binding one every time.
- Full-mode overrides: 0. Promote-rung promotions: 0 (blocked by the governor all run).
- **Measured ρ would have licensed gear 5 on at least the last nine cycles** (ρ 0.103 at cycle
  96, 0.156 at cycle 95, and deeper into the band as each window's reset approached). The gap
  between measured burn and permitted gear was the defining pacing fact of this run: the
  thermostat wanted to sprint and the weekly governor correctly refused, because the *week* was
  hot even though the *window* was cold.
- Under-used windows: the 13:00–18:00Z window closed at ~80.3M of a 130.6M limit (61.5%) with
  the conductor pinned at gear 2. That under-use is a deliberate governor outcome, not a
  thermostat failure, and it is the correct behaviour for a TRICKLE-posture run whose backlog
  drained — but it is the number to look at if a future run feels too slow.

## Config recommendations

- [process] A gate predicate must anchor on a structural marker the artifact owns (an element, a
  heading, a table cell, a parsed field), never on free text matched by regex — a template that
  documents its own placeholders inside comments will satisfy a text predicate from a region that
  never renders [apply: prompt-line for all roles + conductor self-check] [confidence: high]
  [source: 2026-08-18 moon]
- [process] Any counter or derivation used at a gate must first reproduce a known-true value as a
  control before it is applied to the unknown case; a counting method that disagrees with the
  runtime figure is replaced, never patched into agreement [apply: conductor verification rule]
  [confidence: high] [source: 2026-08-18 moon]
- [qa] A gate for a claim that will decay must be re-asked against a simulated future state (the
  file committed later, the count advanced), not only against the present — the present-tense
  arm passes the exact restamp that recreates the defect one rotation later [apply: verification
  gate authoring] [confidence: high] [source: 2026-08-18 moon]
- [process] When a run's SPEC names a nice-to-have or defect inherited from an earlier run, verify
  it still exists against the repo BEFORE the first wave — this run carried a nice-to-have that
  had been satisfied 22 cycles before kickoff and spent four cycles prioritizing it [apply:
  kickoff spec-drafting step] [confidence: high] [source: 2026-08-18 moon]
- [wave] Two items naming the same file should be dispatched sequentially within one wave rather
  than dropping the wave to k=1 — the second builder is told the first's edit is already in the
  tree and must be left alone; landed clean twice this run [apply: wave assembly] [confidence:
  med] [source: 2026-08-18 moon]

## Applied-lessons check

One line per lesson in `runfile.playbook.applied` (14 staged in `auto` mode, 0 vetoed):

- **L-008, L-016, L-020** — re-observed. General build/verify discipline; exercised by every wave.
- **L-021, L-022** — **not-exercised, deliberately held out.** Both instruct browser/SPA behaviour
  (hard-reload after server restart; clear persisted UI state before mounting). This target is a
  zero-dependency terminal CLI with no browser surface. Staged as applied by `auto` mode and
  deliberately NOT wired into `prompt_lines` — wiring them would be noise a builder must discard.
- **L-024, L-026** — re-observed.
- **L-029** (prove new tests failable AND attributable by name) — **re-observed, and load-bearing.**
  The T-175 Samoa fix carried the required two-arm proof (cycle 86); the repo was audited against
  this lesson at cycles 85/87 with zero violations found.
- **L-031, L-033, L-034** — re-observed.
- **L-042** — re-observed.
- **L-043** (never bind an assertion to prose matched by regex) — **contradicted by the conductor,
  honored by the repo.** Verified clean in the suite at cycle 97: `test/report-issues.test.js`
  locates a `## Heading`, deep-equals the table header cells, and asserts the `---` separator
  shape — structure, not sentences. The conductor's own dashboard checks violated it three times
  (cycles 94, 95, 96). The asymmetry is this run's strongest lesson.
- **L-044** (pair every killing mutation with a converse control that must leave the suite GREEN)
  — re-observed. Audited clean at cycles 85/87; the suite carries an explicit self-check test
  proving both REPORT tables and both state.json arrays were actually parsed.
- **L-045** (derive expected counts from the authoritative source at run time) — **re-observed and
  independently re-verified at cycle 97.** Zero hardcoded count expectations in the suite; the
  numeric literals that remain are pinned astronomical epochs, which cannot rot.

## House-rules proposals

- [correctness] A check that cannot fail is not a check: before trusting a new gate, confirm it
  goes red against the specific defect it exists to catch.
- [honesty] A signal you could not run is reported as not-run, never as passed — and the reason it
  could not run is named, not elided.
