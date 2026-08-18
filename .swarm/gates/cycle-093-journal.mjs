#!/usr/bin/env node
import fs from 'node:fs'
const J = '/opt/targets/moon/.swarm/journal.md'
const rf = fs.readFileSync('/opt/swarm/runs/current.json', 'utf8')
const mirror = JSON.stringify(JSON.parse(rf))
const v1 = fs.readFileSync('/opt/targets/moon/.swarm/runs/cycle-093-verify-T-190.txt', 'utf8').trim()
const v2 = fs.readFileSync('/opt/targets/moon/.swarm/runs/cycle-093-verify-T-190-v2.txt', 'utf8').trim()
const t189 = fs.readFileSync('/opt/targets/moon/.swarm/runs/cycle-093-verify-t189.txt', 'utf8').trim()

const block = `
## cycle 93 — 2026-08-18T16:04:52+00:00 → 16:24 UTC · VALUE_LOOP · build-wave k=1 (direct Agent dispatch, sonnet) + conductor re-verification

clock/gear: \`date +%s\` = 1787069092. stop_at 1787142067 is 20h16m out — no WRAP_UP, no admission pressure; build-wave's 2700s budget admits with room to spare. \`bin/swarm-budget.sh\` DENIED for the **20th consecutive run** (KI-2), and \`bin/swarm-notify.sh poll\` denied with it, so the control channel was read from \`runs/control.json\` on disk: \`{"version":1,"since_cursor":"1787055667","pending":[],"applied":[]}\` — \`pending[]\` empty, no \`inject\` array, nothing to triage. PROBE_CMD run BY HAND and succeeded, but returned **no \`tokenLimitStatus\` for the third consecutive cycle**, so the 130,591,250 limit is CARRIED FORWARD from cycles 89–90 — carried three times running now. Active block 13:00–18:00Z at 16:05Z: 44,442,732 tokens, $38.94, 185.58 min in → 239.5k tokens/min (14.37M/hour), **UP** from cycle 92's 233.7k/min: the four-cycle cooling streak is **broken**, and the 15:37→16:05 interval alone ran at 263.3k/min. Remaining 86.15M over 114.42 min = 753.0k/min target at the guest-forced dial of 1.0, so **ρ = 0.32** — deeper into the gear-5 band than cycle 92's 0.35. Worth stating plainly because the two numbers point opposite ways: burn ROSE while ρ FELL, and both readings are correct — the 18:00Z reset is closing, so the per-minute allowance is rising faster than the burn is. ρ is a pacing signal, not a burn measurement. Guest clamps reachable gears to 3; the weekly governor ceiling clamps to 2; **gear 2 stands** — the sixth consecutive cycle where measured ρ would license a higher gear and the posture refuses it. ccusage projection 72.36M against the 130.59M carried limit, no depletion risk. \`weekly\` block STILL carried forward, not re-measured. \`probe_failures\` **held at 2, not incremented**: the script never launched, so it returned neither \`probe_ok\` true nor false.

orient: tree CLEAN at 7742e2d, no salvage needed. Backlog on entry: 86 done / 2 todo (T-189, T-190) / 3 dropped.

re-anchor: cycle 93, not a 5th cycle, so the digest is restated rather than the spec re-read. Backlog hygiene not due by the cycle rule — but the T-189 finding below IS hygiene, arrived at through verification rather than through a scheduled sweep.

pick: effective wave = min(k_current 5, gear-2 cap 2, hard max 5) = **2**, and exactly two items were todo, both S-effort with disjoint \`files_hint\` (README.md vs bin/moon.js). Gear 2 puts must-haves before polish/docs, which orders T-190 (kind \`fix\`, a filed defect) ahead of T-189 (kind \`polish\`). Routing recomputed AT PICK TIME per the table, not copied from the backlog: T-190 is kind fix / effort S → **sonnet** (the backlog's stale \`haiku\` was overridden; the gear-2 demotion rung sonnet→haiku is scoped to docs/polish items and does not reach a fix item, and build/fix never drops below sonnet anyway). T-189 was routed haiku — and then never dispatched, for the reason below.

### T-189 was not built, because it was already built — at cycle 63

Before dispatching a builder to add a reader-runnable KI-5 check, the conductor read the section it was to be added to. **README.md:231–237 already carries one**, shipped by cycle 63 (commit \`def98fd\`, the T-151 retry).

T-189's own notes, and SPEC nice-to-have #1 which it descends from, are both written from cycle **62** — whose proposed observable (top-right vs bottom-right corner alignment) was disproved at the gate because all six frame glyphs are EAW Ambiguous and both borders scale together. Neither the item nor the SPEC bullet noticed that cycle **63** then retried with a different, sound observable and landed it. So this run inherited a stale premise at kickoff and carried it for four cycles.

That is a claim about a past cycle's work, so it does not get to be taken on trust either. The conductor re-derived it at run time (L-045) against **current HEAD**, deliberately NOT re-running cycle 63's proof: a fresh 976-frame sweep over 2026-08-01..09-30 — a different window, chosen because it includes the round-limb U+25D6/U+25D7 regime that cycle 63's Jan–Feb window may not have exercised. The check under test is the README sentence read as a function \`verdict(frame, ambiguous_width)\`, which is a check at all only if it answers differently under the two width policies:

\`\`\`
${t189}
\`\`\`

Scripts: \`.swarm/runs/cycle-093-capture-t189.js\` (capture) + \`cycle-093-verify-t189.py\` (verdict). The mechanism, restated because it is the part cycle 62 got wrong: the three named rows are ASCII bracketed by two \`│\`, so their width is 32 + 2·w(│) at every phase, while the border rows are 34 frame glyphs and scale wholly with w. The gap is phase-independent — the reader gets the same answer on any night.

**T-189 → \`dropped\`, not \`done\` and not deferred**: this cycle built nothing for it, and dropping is the honest status for an item whose defect does not exist. SPEC nice-to-have #1 is satisfied and has been since cycle 63; that is recorded as a decision so WRAP_UP reports it as satisfied-by-prior-work rather than silently unbuilt.

### T-190 — the gate was sealed before the builder existed

\`sha256sum .swarm/gates/cycle-093-T-190.mjs\` → \`87d0ee173387ad83cc152ec6a13192c2c245b591378813b11139ae3a930b25d3\`, taken **before dispatch** and re-checked unchanged after the builder returned. The builder was told not to read \`.swarm/gates/\`; the hash is what makes that instruction checkable rather than trusted.

**The judgment call was made by the conductor, not delegated.** T-190's acceptance offers two mutually exclusive fixes — round the emitted instant, or make the docs precise — and says to pick one. That is a correctness/honesty call, so it was decided before dispatch and the builder was given the decision, not the choice: **the docs move, the value does not.** Rounding \`nextFullMoon\` would not remove the misleading impression — \`2026-08-28T04:00:00.000Z\` still reads as exact — and it would destroy information a \`--json\` consumer may legitimately diff. The defect is a false CLAIM, not a false value: precision and accuracy are different properties, and the old sentence conflated them. The gate was written to FAIL a build that rounded the value, so the other branch was not quietly available.

Dispatch shape: headless \`-p\` session → the Workflow tool is review-gated → \`workflows/build-wave.js\` was not invoked; one **direct Agent call**, the documented failure-table fallback. One builder means no parallelism, so no worktree was provisioned and it worked directly in the tree; the conductor remained sole committer. Playbook \`prompt_lines.builder\` (all three) were appended. Craft pack: \`node bin/swarm-craft.mjs\` ran clean (\`degraded: []\`); no item was flagged \`craft: "ui"\` — moon has no browser surface — so no \`craft.ui\` splice was due, and the conductor spliced \`craft.docs\` instead as a deliberate call, since the item's whole payload is help text and README prose. \`craftRefDir\` was **not** passed: it is a SWARM path and hard rule 5 keeps SWARM paths away from agents, so the pack text was inlined instead.

### VERIFICATION EVIDENCE — gate pass 1 (sealed), and the check of mine that failed

\`\`\`
${v1}
\`\`\`

**My own check 3 was wrong, and it is kept on disk rather than edited away.** I had encoded the documented precision as \`<field> … N dp\` / \`N decimal\`; the shipped note phrases it \`decimal places: illumination to 4, age to 3, …\`. The claim was there — my pattern could not see it, and the word-wrap at 78 columns put line breaks inside the span my regex was scanning. This is the same instrument failure shape as cycle 63's v1 gate, now twice in this project: a conductor check that grades PROSE by pattern and mistakes its own narrowness for the product's silence.

Pass 2 reads the claim as written. It is **strictly stronger than pass 1, not looser** — it additionally requires the prose figure to EQUAL the code table's figure, and adds a generation proof pass 1 never had. No product file was touched to reach green.

### VERIFICATION EVIDENCE — gate pass 2

\`\`\`
${v2}
\`\`\`

The **generation proof** is the check that separates "the note is built from the table" from "the note was hand-written to match the table today". Changing the table's \`illumination\` places from 4 to 7 makes \`--help\` print \`illumination to 7\` — an observable a hand-written paragraph cannot produce. That is the discriminator the item's "so the two cannot drift apart again" clause actually needs; agreement measured once proves nothing about drift.

The two mutation kills in pass 1 carry the other half. MUTATION A (illumination precision 4→2) → suite RED, 3 failures. MUTATION B (an undocumented tenth \`--json\` field) → suite RED, 2 failures. CONTROL C (an inert appended comment) → suite **GREEN** — without it, a suite that died on every edit would have scored two false kills. \`bin/moon.js\` was confirmed restored byte-identical (11,401 bytes) after each mutation and after the generation proof.

### VERIFICATION EVIDENCE — scope and the full suite, conductor-run

\`\`\`
$ git -C /opt/targets/moon diff --numstat
8	3	README.md
91	8	bin/moon.js
53	1	test/cli.test.js

$ node --test test/*.test.js            (conductor's own run, on the restored tree)
ℹ tests 175   ℹ suites 0   ℹ pass 175   ℹ fail 0
ℹ cancelled 0  ℹ skipped 0  ℹ todo 0     ℹ duration_ms 3720.28
\`\`\`

Scope verified from the diff, not from the builder's word: exactly the three in-scope files, nothing else. 171 → **175 tests**, +4, none skipped, none weakened, never below the 171-test kickoff baseline.

What shipped: \`bin/moon.js\` gains \`JSON_FIELD_PRECISION\`, one table keyed by every \`--json\` field (\`rounded\`+places | \`instant\` | \`string\`); the five \`round()\` call sites read \`places\` from it; \`buildPrecisionNote()\` generates the help paragraph from the table and README.md embeds that generated text **verbatim** (533 chars, byte-identical, asserted). \`nextFullMoon\` still emits \`toISOString()\` unchanged — gate check 2 confirmed the value did not move.

post-merge checks: collision-scan and the qa-verify look pass are **not applicable** and are recorded as not-applicable, never as passed — moon is a zero-dependency terminal CLI with no browser-served surface, so the user-visible heuristic does not fire on \`bin/moon.js\` / \`README.md\` / \`test/cli.test.js\`.

### BOOKKEEPING REPAIR — cycle 92's burn attribution was journaled but never written

Cycle 92's block states \`window_tokens_attributed\` 20,206,353 → 23,127,741. \`state.json\` on entry to this cycle read **20,206,353**: the write did not land. A journaled number that disagrees with the file is worth more than a silent correction, so both credits are applied here and named — 20,206,353 + 2,921,388 (cycle 92's, repaired) + 7,529,912 (this cycle's delta, 44,442,732 − 36,912,820) = **30,657,653**. Still a running total across four attributed cycles, NOT a run total; cycles 0–87 left the counter at 0 and are not represented in it.

items: **1 built and verified (T-190)** · 1 closed without building (T-189, stale) · 0 filed · 0 reverted · 0 failed verifies
backlog: **87 done / 0 todo / 4 dropped, 91 total** — the queue is empty again.
\`counters.consecutive_no_value\` stays 0 — this cycle produced verified value.
wave autotune: the wave was CLEAN (zero reverts, zero failed verifies) → \`wave_streak\` 1 → 2, which triggers the raise; \`k_current\` is already at the hard max 5, so it holds at 5 and the streak resets to 0. Academic while gear 2 caps the effective wave at 2 regardless.
qa state: \`last_build_wave_cycle\` 90 → **93**. \`last_full_qa_cycle\` stays 92, \`last_taste_cycle\` 81, \`last_review_fix_cycle\` 73 — the cycle-91 decision on the latter two stands unmodified and is to be reported at WRAP_UP as not-run with its reason, never as passed.
notifications: none sendable. Phase unchanged (VALUE_LOOP), so no phase-change emit was due; \`bin/swarm-notify.sh\` remains denied by the KI-2 allowlist gap. \`publish_failures\` unchanged at 0 — a headless \`-p\` session with no Artifact tool is a silent skip by step 8, not a publish failure.

next: the backlog is EMPTY (87/91 done, 4 dropped) and the clock still holds ~20h. Per the standing rule from cycles 26/27, an empty queue is not an exhausted value space and does not mean DONE — a VALUE_LOOP candidate scan comes next. Two facts for whoever runs it. First, T-189's disposal means SPEC nice-to-have #1 is closed and nice-to-have #2 (re-archive the journal past ~400 KB) is the only one left — \`journal.md\` is at ~135 KB, so it is not due. Second, and more useful: the T-189 finding is a class, not an incident. This run's SPEC was authored from a partial reading of history, and one of its two nice-to-haves was already satisfied before the run began. A scan that re-checks the OTHER standing SPEC claims against the repo — the same two-source discipline — is likely worth more than any new item, and it is exactly the "check every [apply:] lesson against the repo" clause of the spec digest.

runfile-mirror:
\`\`\`json
${mirror}
\`\`\`
`
fs.appendFileSync(J, block)
console.log('journal appended,', block.length, 'chars; journal now', fs.statSync(J).size, 'bytes')
