
## cycle 92 — 2026-08-18T15:37:13+00:00 → 15:57 UTC · VALUE_LOOP · qa-verify mode=full (direct Agent dispatch, 3 stages)

clock/gear: `date +%s` = 1787067433. stop_at 1787142067 is 20h44m out — no WRAP_UP, no admission pressure; qa-verify full's 1200s budget admits with room to spare. `bin/swarm-budget.sh` DENIED for the **19th consecutive run** (KI-2), and `bin/swarm-notify.sh poll` denied with it, so the control channel was read from `runs/control.json` on disk: `{"version":1,"since_cursor":"1787055667","pending":[],"applied":[]}` — `pending[]` empty, no `inject` array, nothing to triage. PROBE_CMD (`npx ccusage@latest blocks --json --token-limit max`) run BY HAND and succeeded, but returned **no `tokenLimitStatus` for the second consecutive cycle**, so the 130,591,250 limit is CARRIED FORWARD from cycles 89–90 — recorded as carried, not re-measured, twice running now. Active block 13:00–18:00Z at 15:37Z: 36,912,820 tokens, $30.15, 157.97 min in → 233.7k tokens/min (14.02M/hour), **down again** from cycle 91's 237.9k/min: the window has now cooled for four consecutive cycles. Remaining 93.68M over 142.03 min = 659.6k/min target at the guest-forced dial of 1.0, so **ρ = 0.35** — deeper into the gear-5 band than cycle 91's 0.39. Guest clamps reachable gears to 3; the weekly governor ceiling clamps to 2; **gear 2 stands** — the fifth consecutive cycle where measured ρ would license a higher gear and the posture refuses it. ccusage projection 70.96M against the 130.59M carried limit, no depletion risk. `weekly` block STILL carried forward, not re-measured. `probe_failures` **held at 2, not incremented**: the script never launched, so it returned neither `probe_ok` true nor false.

orient: tree CLEAN at 724c131, no salvage needed. Backlog on entry: 86 done / 1 todo (T-189) / 3 dropped.

re-anchor: cycle 92, not a 5th cycle, so the digest is restated rather than the spec re-read. Backlog hygiene not due; 1 live item is nowhere near the ~30 cap.

### Work: the QA full pass cycle 91 queued — and why it ran ahead of T-189

Cycle 91's three-pass decision put QA full ahead of T-189 explicitly: T-175 changed `src/hemisphere.js`, the only source change of run 4 and a user-visible wrong answer, and a spec-scenario pass exercising the live CLI end-to-end was the one signal run 4 genuinely lacked. That reasoning is unchanged, so this cycle executes it rather than re-deriving it.

**Dispatch shape.** This is a headless `-p` session, where the Workflow tool is review-gated, so `workflows/qa-verify.js` was not invoked as a workflow. Its contract was executed as three **direct Agent calls** — the documented failure-table fallback — preserving the parts of the contract that carry the guarantees: the author is **spec-only** (never given the target path, the diff, or any code, so an answer key computed from the rulebook cannot inherit the code's bugs), the stages run **sequentially**, scenario ids are stamped **S1..S3 by position** and executor results matched positionally rather than by any echoed id, and every returned field is a CLAIM for this gate. Routing: author fable/high and live-look fable (judgment seats, fable guard — exempt from the gear-2 demotion), executor sonnet/medium (a non-judgment seat, but the sonnet→haiku demotion is scoped to docs/polish items and does not reach it). Playbook `prompt_lines.qa` — all nine lines — were appended to all three prompts.

### VERIFICATION EVIDENCE — S1, re-run by the conductor rather than accepted

The executor's S1 verdict is its claim. This is the conductor's own run, independent of it:

```
$ node -e '... execFileSync("node",["bin/moon.js"],{env:{TZ:tz}}) for 7 zones ...'
US/Samoa           "◖█░░░  36%  waxing crescent"
                    25d6 2588 2591 2591 2591
Pacific/Apia       "◖█░░░  36%  waxing crescent"
                    25d6 2588 2591 2591 2591
Australia/Sydney   "◖█░░░  36%  waxing crescent"
                    25d6 2588 2591 2591 2591
Europe/London      "░░░█◗  36%  waxing crescent"
                    2591 2591 2591 2588 25d7
UTC / Asia/Tokyo / America/New_York   "░░░█◗  36%  waxing crescent"
--- ARM A ---
samoa==apia  : true      samoa==sydney: true
samoa==london: false (must be FALSE)
--- name/illum identical across all seven zones? ---
[ '36%  waxing crescent' ]
```

**T-175 is now confirmed closed at the user-visible surface, not only at the unit level** — recorded as a decision. Its build-cycle proof was a unit-level two-arm mutation proof on `detectHemisphere`; this is the shipped CLI, end to end. The documented FAIL SIGNATURE (Samoa matching London's unmirrored disc while Apia and Sydney show the mirrored one) is verified **ABSENT**. Name and illumination are byte-identical across all seven zones, so TZ moves the limb and nothing else — which is exactly the invariant the domain rules assert.

### VERIFICATION EVIDENCE — the suite, run by the conductor

```
$ node --test test/*.test.js
ℹ tests 171   ℹ suites 0   ℹ pass 171   ℹ fail 0
ℹ cancelled 0  ℹ skipped 0  ℹ todo 0     ℹ duration_ms 3352.33
$ ls test/
args.test.js astro.test.js cli.test.js contracts.test.js hemisphere.test.js
manifest.test.js regressions.test.js render.test.js report-issues.test.js   (9 files)
```

171/171, never below the 171-test kickoff baseline. The file list is enumerated **from disk**, not from memory — the L-045 discipline cycle 88 broke and re-committed to.

### S2 — pass on what ran, and the sub-check that did NOT run

Sub-checks 1–4 pass on live output: identical phase name and identical percentage across four zones in one window; P = 36 in [0,100]; the band `Crescent → 0 < P < 50` holds for "waxing crescent" at 36%. **Sub-checks 5–6 — the re-run at least 6 hours later and the waxing/waning direction check — were NOT RUN.** No agent can wait six hours inside a cycle. They are recorded as not-run, never as passed, per WRAP_UP's rule that a signal not run is reported as not-run. If a later cycle wants that signal, the earlier reading is on the record here: 36% waxing crescent at 15:46Z on 2026-08-18, so a run past ~22:00Z must show P no lower than 36.

### S3 — FAILED as authored, adjudicated as an EXPECTATION defect, no item filed

S3 asserted that every disc code point comes from the 8-glyph set the SPEC's domain rules enumerate (`░ ▐` Neutral; `▒ ▓ █ ▌ ▏ ▕` Ambiguous). The live disc also renders `◖`/`◗` (U+25D6/U+25D7), so the assertion fails. Every other S3 sub-check passed: the two runs are byte-identical, zero ESC (0x1B) bytes, zero emoji or astral code points, exactly one `N%` with 0 ≤ N ≤ 100, empty stderr, exit 0.

The conductor's adjudication, verified against the authoritative sources rather than taken from either agent:

```
$ grep -n "25D6\|◖\|ROUND_LIMB\|MIRROR" src/render.js
11: *   - No emoji. Ever. Geometric / block glyphs only (U+2588..U+2595, U+25D6,
70: const ROUND_LIMB = { right: '◗', left: '◖' };
73: const MIRROR = new Map([ ['◖','◗'], ['◗','◖'], ... ]);
172:      else out += ROUND_LIMB[c === 0 ? 'left' : 'right'];

$ sed -n '795,806p' test/render.test.js
 * The disc is also observed (below) to draw two round-limb glyphs —
 * U+25D6/U+25D7, Geometric Shapes, not Block Elements — once the outer
 * cell's lit fraction reaches 0.88 ... They are pinned separately below,
 * so this test tells the truth about what is and is not classified.
const UNDOCUMENTED_DISC_GLYPHS = new Set([0x25d6, 0x25d7]); // ◖ ◗

$ sed -n '245,249p' README.md
The disc also draws round-limb glyphs, `◗` and `◖`, once the outer cell's lit fraction reaches
0.88 ... both are Neutral in Unicode Character Database 15.0.0, as measured by the audit
script at `.swarm/runs/cycle-024-eaw-audit.py`.
```

README documents both glyphs by name with their EAW class and the script that measured it; `test/render.test.js` pins them separately with a comment stating exactly why they sit outside the Block Element partition; `src/render.js` declares them in its header. **The authoritative sources are complete and correct.** The SPEC's domain-rules bullet is an abridgement of README's fuller treatment, and the author — spec-only BY DESIGN, which is the property that makes its answer key independent — inherited the abridgement. So the fail is real and is recorded as a fail with its evidence; it is **not** re-labelled a pass (hard rule 2). No backlog item is filed, because there is no defect to fix: this run's two-source rule admits only a filed defect or a demonstrably violated lesson, and this is neither. SPEC.md is frozen at kickoff and is not edited mid-run.

Worth stating because it is the cost of the design: spec-only authoring buys independence and pays for it in false positives whenever the spec abridges the docs. That trade is still right — an author that reads the code cannot catch the code's bugs — but this is the second run-4 cycle in a row where the instrument, not the product, was the thing that needed adjudicating.

### Live-look — ONE finding, conductor-verified, filed as T-190

The look agent swept ~12,000 renders programmatically (line and block alignment at every illumination, both hemispheres), all error paths (stderr, exit 2, clear messages), help/README/parser flag-set agreement, and README capture reproducibility, and returned exactly one finding rather than padding the list. Re-run by the conductor:

```
$ node bin/moon.js --json          (twice, ~5 min apart)
{"phase":"waxing crescent","illumination":0.3627,"age":5.93,"cycleFraction":0.20571,
 "phaseAngle":74.057,"hemisphere":"north","nextFullMoon":"2026-08-28T04:18:25.225Z",
 "julianDay":2461271.16347,"timestamp":"2026-08-18T15:55:24.041Z"}
   ... nextFullMoon IDENTICAL on both runs: 2026-08-28T04:18:25.225Z

$ node bin/moon.js --help | grep -n -A2 rounded
38:Numeric fields are rounded to the precision the algorithm has actually earned
39-(phase instants are good to roughly an hour); they are not raw float dumps.
```

Every numeric field is rounded — illumination 4dp, age 3dp, cycleFraction 5dp, phaseAngle 3dp, julianDay 5dp — and `nextFullMoon` alone carries eight sub-hour digits of stable false precision, against a help line that says in the same breath that phase instants are good to roughly an hour. Severity **low** and correctly so: nothing a user is misled about in the default output, and the help's wording ("Numeric fields") is arguably literally true of a string field, which is exactly why this is a judgment call and not a mechanical fix. Filed as **T-190** with both fixes named and the instruction to pick one, not both, plus a pin so the two sides cannot drift apart again. Low severity → backlog item only, no `known_issues` entry (cycle.md files only blocker/high look findings there).

items: 0 built (QA pass, not a build wave) · **1 filed (T-190)** · 0 reverted · 0 failed verifies
backlog: 86 done / **2 todo (T-189, T-190)** / 3 dropped, 91 total.
`counters.consecutive_no_value` reset to 0 — this cycle produced verified value: an end-to-end confirmation that the run's one source change is correct at the user-visible surface, plus a real filed defect.
wave autotune: untouched (`k_current` 5, `wave_streak` 1). No build wave ran, and the autotune rules fire only after a wave's merges and verification.
burn attribution: `window_tokens` delta since cycle 91 = 36,912,820 − 33,991,432 = **2,921,388**, credited to moon. `window_tokens_attributed` 20,206,353 → **23,127,741**, a running total across three attributed cycles, NOT a run total — cycles 0–87 left the counter at 0 and are not represented in it.

qa state: `last_full_qa_cycle` 76 → **92**. `last_taste_cycle` stays 81 and `last_review_fix_cycle` stays 73, both by the cycle-91 decision, which stands unmodified: review-fix satisfied in substance, TASTE deliberately not re-run and to be reported at WRAP_UP as not-run with its reason, never as passed.

next work: T-189 (the KI-5 reader-runnable check) is now the only unblocked item ahead of T-190. One live input for it from this cycle, recorded so the next cycle does not have to re-measure it: the default disc at 36% is `░░░█◗` — `░` Neutral, `█` Ambiguous, `◗` Neutral — so a reader's *current* disc already straddles the partition, and the round-limb glyph is Neutral like `▐`. Cycle 91's proposed `▌` (Ambiguous) vs `▐` (Neutral) pair still discriminates, but `▐`/`▌` only appear at ~96% illumination per README:59-61, so an observable built on them is not reproducible on demand tonight. The spec's standing condition binds either way: the observable must be verified to actually differ before it ships.

notifications: none sendable. Phase unchanged (VALUE_LOOP), so no phase-change emit was due in the first place; `bin/swarm-notify.sh` remains denied by the KI-2 allowlist gap. `publish_failures` unchanged at 0 — a headless `-p` session with no Artifact tool is a silent skip by step 8, not a publish failure.
