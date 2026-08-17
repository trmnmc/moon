# cycle 069 — raw seat return, T-157 (fable, qa measurement seat)

Verbatim return value of the dispatched agent. Dispatch was a DIRECT Agent call, not the
Workflow tool (this is a headless `-p` session spawned by bin/swarm-pacer.sh, where
Workflow is review-gated — the documented SKILL.md fallback). Claims below are the seat's;
the conductor's independent measurement of them is in cycle-069-verify-wave.txt.

---

A. DERIVED PARTITION — 15 pairs, 7 classes (re-derived from bin/moon.js + src/args.js, not inherited; I AGREE with the planning seat's count of 7, on my own derivation).
Decision chain: args.js:117-122 resolves south/north last-one-wins (policy args.js:88) before bin sees anything → help gate returns at bin/moon.js:100-103 before any other opt is read → json gate returns at :109-123 with hemisphere carried into the payload at :116 (computed at :106) → render fork :126-134 with per-fork compact guards (:130 block, :133 line), hemisphere an argument to both renderers.
- C1 help-dominance (5): help×json, help×block, help×compact, help×south, help×north — bin/moon.js:100; partner inert, output exactly HELP.
- C2 json-swallows-render (2): json×block, json×compact — bin/moon.js:109.
- C3 json-carries-hemisphere (2): json×south, json×north — bin/moon.js:106,116; hemisphere is NOT inert under json.
- C4 block×compact (1): bin/moon.js:130 — the T-153 class, already closed last cycle; reported for completeness, not re-hardened.
- C5 compact×hemisphere, line path (2): compact×south, compact×north — bin/moon.js:132-133; committed joint observable is "still exactly one line, disc mirrored".
- C6 block×hemisphere (2): block×south, block×north — bin/moon.js:127 → renderBlock, which adds an observable the line path lacks (the "hemisphere southern/northern" text row); this is why C5 and C6 are distinct rather than one merged class (merging would give 6 — rejected, M09/M10 have disjoint kill surfaces).
- C7 south×north conflict (1): src/args.js:117-122, last-one-wins.
Triples: reduction to pair classes holds structurally (help returns before other opts are read; json returns before the render fork; S/N resolves in the parser before any gate) — I agree with the planning claim, with the caveat that the reduction depends on gate ORDER, and the suite pins only the help>json edge of that order; the other gate-order edges are exactly the survivors below. Triples were verified by code reading, not exhaustive execution.

B. MUTANT TABLE — 11 mutants, full scratch copy (incl. .git/.swarm) at /opt/swarm/runs/.c69-scratch-t157, baseline 150/150 there; kill = suite exit status, names from reporter output. (First harness pass parsed TAP against a spec-reporter Node and mislabelled everything SURVIVED — discarded as a parsing bug, rerun with both formats handled.)
- M01 C1 help×json | bin/moon.js:100 `if (opts.help) {` → `if (opts.help && !opts.json) {` | KILLED by "--help wins over --json regardless of flag order: help text, not the JSON payload" (149/1)
- M02 C1 help×block | :100 → `if (opts.help && !opts.block) {` | SURVIVED (150/0)
- M03 C1 help×south/north | :100 → `if (opts.help && opts.hemisphere === null) {` | SURVIVED (150/0)
- M04 C1 help×compact | :100 → `if (opts.help && !opts.compact) {` | SURVIVED (150/0)
- M05 C2 json×block | :109 `if (opts.json) {` → `if (opts.json && !opts.block) {` | SURVIVED (150/0)
- M06 C2 json×compact | :109 → `if (opts.json && !opts.compact) {` | SURVIVED (150/0)
- M07 C3 | :116 `hemisphere,` → `hemisphere: detectHemisphere(),` | KILLED by "--json hemisphere follows the override flag" (149/1)
- M08 C4 | :130 guard deleted → unconditional `lines.push(nextFullLine(now, 3))` | KILLED by "--block --compact ends in the block's own closing frame, with no extra line appended" — T-153's kill CONFIRMED (149/1)
- M09 C5 | :133 → `if (!opts.compact || opts.hemisphere !== null) lines.push(...)` | SURVIVED (150/0)
- M10 C6 | :127 `renderBlock(moon, hemisphere)` → `renderBlock(moon, 'north')` | SURVIVED (150/0)
- M11 C7 | src/args.js:120-121 last-one-wins → first-one-wins (`&& hemisphere === null` both arms) | KILLED by "--south --north together: the last flag on the line wins" (149/1)
File byte-restored and verified after each mutant; final scratch suite 150/150.

C. SURVIVOR CLASSIFICATIONS — all HOLE, none BOUNDARY.
- C1 remainder (M02/M03/M04): HOLE. The design commits to total help dominance (:100 returns before any other opt is read; cli.test.js:293 says the ordering is "on purpose") and the suite already pins the help×json member byte-for-byte; treating the other four members of the same branch as undecided would be incoherent. Probes: `--help --block` printed the full framed block, `--help --south` the mirrored line, `--help --compact` the one-liner — never HELP. Observable for T-158: for X in {--block, --compact, --south, --north}, both orders, stdout === HELP + '\n', exit 0.
- C2 (M05/M06): HOLE. --json is documented "structured output for scripting (stable, documented below)" with no carve-out; under the mutant `--json --block` emits box-drawing art (first byte `┌`) and any `| jq` consumer breaks. Considered BOUNDARY (no document names the pair) and rejected: --json's unconditional promise decides the observable even without naming the pair. Observable: JSON.parse(run(['--json','--block'])) succeeds with the plain-`--json` key set; same for --compact, both orders.
- C5 (M09): HOLE. README commits --compact (line mode) to "exactly one line", and the MOTD use case is precisely a southern user's `moon --compact --south`; the mutant makes that print two lines into a prompt. The suite spawns exactly this argv (mirror test) and asserts everything about it except line count — the identical extra line cancels out of its tail comparison. Observable: run(['--compact','--south']) and (['--compact','--north']) each split to exactly 1 line.
- C6 (M10): HOLE. --south "force southern-hemisphere rendering" is unconditional; under the mutant `--block --south` is byte-identical to `--block --north` (probe-confirmed), including a row literally printing "hemisphere northern" at a user who forced south. Only the pure renderBlock is tested with 'south'; the bin wiring is unpinned. Observable (discriminator): the detail row of run(['--block','--south']) matches /hemisphere +southern/ and its art rows are the mirror of --block --north's (minimally: the two outputs differ).

D. NOT MEASURED
- The 20 flag triples/orderings were not executed; reduction argued from gate structure only.
- C3 mutated only at the payload site (:116), not at :106 — the carry-into-payload interaction is what the kill evidences.
- C1 south/north probed with one combined mutant, not separate per-flag mutants.
- Repeated flags (`--south --south` etc.; args.js:93 claims harmless) not verified.
- T-153 sensitivity measured against guard deletion only, not indent mutations at :130.
- `-h` (vs `--help`) under pair composition not separately probed.

ANOMALY (not this seat): at wrap-up `git status --porcelain` shows `M test/contracts.test.js` besides my log — an 89-line append adding a "T-163 second exact-value pin" test, mtime 2026-08-17 17:10:14 UTC, from a concurrent seat. Not reverted (would destroy another seat's uncommitted work; this seat may not edit test/). Contamination check: all my suite runs executed in the scratch (pristine 150-test baseline; every run reported 150 total). Real tree at wrap-up: 151/151 green; the new test asserts nothing about flag pairs and does not affect any classification above.

Artifacts: log at /opt/targets/moon/.swarm/runs/cycle-069-T157-matrix.md (my only write in the repo); scratch /opt/swarm/runs/.c69-scratch-t157 deleted and confirmed gone.
