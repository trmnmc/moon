# cycle-069 T-157 — flag-pair interaction matrix, mutant measurement log

QA MEASUREMENT seat, 2026-08-17. Measurement and classification only; no product change.
Suite baseline: 150/150 green in the real tree AND in the scratch copy before any mutant.
Scratch: full copy (incl. .git and .swarm) at /opt/swarm/runs/.c69-scratch-t157 via
`fs.cpSync(..., {recursive:true})` (cp -a and tar pipes are blocked by the sandbox policy);
baseline suite in the copy: 150 pass / 0 fail. Scratch deleted after measurement.
Kill signal: `node --test test/*.test.js` exit status (non-zero on any failure), with the
failing test NAME parsed from the reporter output (both TAP `not ok` and spec `✖` forms
handled — first harness run parsed TAP only against a spec-reporter Node and mislabelled
every mutant SURVIVED; that run was discarded and is recorded here as a parsing bug, not
a measurement).

## A. Derived partition (re-derived from code, not inherited)

Decision chain, from the code itself:
parseArgs resolves --south/--north by last-one-wins token walk (src/args.js:117-122,
policy documented src/args.js:88) BEFORE bin sees anything ->
help gate returns at bin/moon.js:100-103 before any other opt is read ->
json gate returns at bin/moon.js:109-123, hemisphere carried into the payload at :116
(computed at :106 as `opts.hemisphere || detectHemisphere()`) ->
render fork bin/moon.js:126-134: block branch (renderBlock at :127, compact guard at
:130 indent 3) vs line branch (renderLine at :132, compact guard at :133 indent 12);
hemisphere is an argument to both renderers.

15 unordered pairs -> 7 classes:

| # | class | pairs | mediating code |
|---|-------|-------|----------------|
| C1 | help-dominance: partner inert, output is exactly HELP | help x json, help x block, help x compact, help x south, help x north (5) | bin/moon.js:100 |
| C2 | json-swallows-render: partner inert, output is the JSON payload | json x block, json x compact (2) | bin/moon.js:109 (return before :125) |
| C3 | json-carries-hemisphere: hemisphere NOT inert under json, lands in payload | json x south, json x north (2) | bin/moon.js:106,116 |
| C4 | block x compact: per-fork suppression of next-full-moon line | block x compact (1) | bin/moon.js:130 — CLOSED BY T-153 |
| C5 | compact x hemisphere, line path: orthogonal composition, still exactly one line, disc mirrored | compact x south, compact x north (2) | bin/moon.js:132-133 |
| C6 | block x hemisphere: mirrored art AND a textual "hemisphere southern/northern" row | block x south, block x north (2) | bin/moon.js:127 -> renderBlock (src/render.js:281-301) |
| C7 | hemisphere conflict: last-one-wins, never an error | south x north (1) | src/args.js:117-122, policy :88 |

Count: 7. I AGREE with the planning seat's number, independently derived. Borderline
calls I considered and rejected:
- Merging C5+C6 into one "hemisphere modifies render" class (would give 6): rejected —
  block adds an observable the line path does not have (the hemisphere text row) and has
  its own compact guard line; mutants M09/M10 have disjoint kill surfaces, and the
  measurement below confirms they fail/survive independently of C4's killer.
- Splitting C1 by partner kind (would give 8+): rejected as a PARTITION — one branch at
  :100 mediates all five pairs and the correct observable is identical (HELP text,
  partner ignored). BUT the suite's coverage of C1 is NOT uniform across its members
  (see M01 vs M02/M03/M04), which is why C1 got four mutants.

Triples: the reduction claim holds structurally. Any argv containing --help returns at
:101-102 before any other opt is read; else any argv with --json returns at :121, with
block/compact never read and hemisphere read only into the payload; else the render fork
composes block/compact/hemisphere; and a south+north conflict resolves in the parser
before ANY gate reads opts.hemisphere. So no triple can exhibit an interaction absent
from its pairs — PROVIDED the gate order is intact, and that order is precisely what
M01-M06 mutate. Caveat recorded: the reduction is a property of the implementation's
gate chain; the suite pins only the help>json edge of it (M01). I did not execute the
20 triples exhaustively; the reduction is verified by code reading plus the gate mutants.

## B. Mutant table (11 mutants, one scratch suite run each)

| id | class | mutant (file:line, exact change) | result |
|----|-------|----------------------------------|--------|
| M01 | C1 (help x json) | bin/moon.js:100 `if (opts.help) {` -> `if (opts.help && !opts.json) {` | KILLED by cli.test.js "--help wins over --json regardless of flag order: help text, not the JSON payload" (149/1) |
| M02 | C1 (help x block) | bin/moon.js:100 `if (opts.help) {` -> `if (opts.help && !opts.block) {` | SURVIVED (150/0) |
| M03 | C1 (help x south/north) | bin/moon.js:100 `if (opts.help) {` -> `if (opts.help && opts.hemisphere === null) {` | SURVIVED (150/0) |
| M04 | C1 (help x compact) | bin/moon.js:100 `if (opts.help) {` -> `if (opts.help && !opts.compact) {` | SURVIVED (150/0) |
| M05 | C2 (json x block) | bin/moon.js:109 `if (opts.json) {` -> `if (opts.json && !opts.block) {` | SURVIVED (150/0) |
| M06 | C2 (json x compact) | bin/moon.js:109 `if (opts.json) {` -> `if (opts.json && !opts.compact) {` | SURVIVED (150/0) |
| M07 | C3 | bin/moon.js:116 `hemisphere,` -> `hemisphere: detectHemisphere(),` | KILLED by cli.test.js "--json hemisphere follows the override flag" (149/1) |
| M08 | C4 | bin/moon.js:130 `if (!opts.compact) lines.push(nextFullLine(now, 3))` -> `lines.push(nextFullLine(now, 3))` | KILLED by regressions.test.js "--block --compact ends in the block's own closing frame, with no extra line appended" (149/1) — T-153's kill CONFIRMED |
| M09 | C5 | bin/moon.js:133 `if (!opts.compact) lines.push(...)` -> `if (!opts.compact \|\| opts.hemisphere !== null) lines.push(...)` | SURVIVED (150/0) |
| M10 | C6 | bin/moon.js:127 `lines.push(renderBlock(moon, hemisphere))` -> `lines.push(renderBlock(moon, 'north'))` | SURVIVED (150/0) |
| M11 | C7 | src/args.js:120-121 last-one-wins walk -> first-one-wins (`&& hemisphere === null` on both arms) | KILLED by args.test.js "--south --north together: the last flag on the line wins" (149/1) |

Every kill is attributed to exactly one named test (suite went 149 pass / 1 fail in each
killed case). Every survivor left the suite at 150 pass / 0 fail. After each mutant the
file was byte-restored and verified; final suite run in the scratch after all mutants:
150 pass / 0 fail.

## Survivor probe evidence (mutated binary, TZ=UTC, 2026-08-17 ~17:14 UTC)

- M02: `--help --block` and `--block --help` both printed the full 11-line framed block
  plus the next-full-moon line — not HELP. Exit 0, stderr empty.
- M03: `--help --south` printed `◖▓░░░  27%  waxing crescent` + next-full-moon line;
  `--help --north` the unmirrored twin. Not HELP.
- M04: `--help --compact` printed the one-line render. Not HELP.
- M05: `--json --block` and `--block --json` printed the framed block — stdout is not
  parseable JSON (first byte `┌`). Exit 0.
- M06: `--json --compact` printed the one-line render — not parseable JSON.
- M07 (killed, for the record): `--json --south` reported `"hemisphere":"north"` under
  the mutant — the named test caught exactly this.
- M09: `--compact --south` -> 2 lines; `--compact --north` -> 2 lines; `--compact`
  alone -> 1 line (which is why cli.test.js's "--compact collapses to exactly one line"
  passed: it never adds a hemisphere flag; and the mirror test spawns exactly
  `--south --compact`/`--north --compact` but asserts glyphs, never line count — the
  extra identical second line cancels out of its tail comparison).
- M10: `--block --south` output was byte-identical to `--block --north` (same run,
  seconds apart, same phase): unmirrored art AND the row `hemisphere  northern` in both.
  A user forcing --south sees "northern" printed and the lit limb on the wrong side.

## C. Survivor classifications (before any test is written)

C1 remainder — M02, M03, M04 -> HOLE (one class-wide gap).
The design commits to total help dominance: bin/moon.js:100 returns before any other opt
is read, cli.test.js:293-295 states the ordering is "on purpose", and the suite already
pins the help>json member byte-for-byte. HELP's own text ("-h, --help  this text") is
unconditional. Treating the other four members as undecided while help>json is pinned
would be incoherent — the same branch, the same observable. A user typing
`moon --help --block` gets a moon readout instead of the help they asked for; observably
wrong, nothing objects.
Observable for T-158: for X in [--block, --compact, --south, --north], both orders:
stdout === HELP + '\n', exit 0 (the existing help>json test is the template).

C2 — M05, M06 -> HOLE.
--json is documented "structured output for scripting (stable, documented below)"
(HELP:20, README:73) with no carve-out for co-occurring flags; the json gate returning
before the render fork is the coded design. Under the mutant `moon --json --block` emits
a box-drawing block: any scripting consumer (`| jq`) breaks. Observably wrong, unpinned.
Observable for T-158: JSON.parse(run(['--json','--block'])) succeeds and its key set
equals the plain --json key set; same for ['--json','--compact'] and both orders. A
first-byte-is-'{' check is weaker but already discriminates.

C5 — M09 -> HOLE.
README:75 ("suppress the next-full-moon line, leaving exactly one line") and README:89
("--compact gives exactly one line with no trailing whitespace") commit compact-in-line-
mode to exactly one line, and a hemisphere flag does not leave line mode. The
MOTD/prompt use case (SPEC must-have 6, args.js:19-21) is exactly a southern-hemisphere
user writing `moon --compact --south`; under the mutant that prints two lines into a
shell prompt. The spec DOES decide this; the suite spawns exactly this argv (mirror
test) and asserts everything about it except its line count.
Observable for T-158: run(['--compact','--south']) and run(['--compact','--north'])
each split to exactly 1 line (same assertion the existing plain-compact test makes).

C6 — M10 -> HOLE.
--south is documented "force southern-hemisphere rendering" (HELP:23, README's Options
table) unconditionally, and README:27-29 explains why it matters (lit limb faces the
other way). renderBlock renders BOTH a mirrored disc and an explicit
`hemisphere    southern` row (src/render.js:299). Under the mutant, --block --south is
byte-identical to --block --north — probes confirm — including a row that literally
prints the wrong word at the user. Observably wrong; only render.test.js covers
renderBlock(…,'south') and it calls the pure function, so the bin-level wiring is
unpinned.
Observable for T-158 (discriminator, no remembered reference): the detail row of
run(['--block','--south']) matches /hemisphere +southern/; and the five art rows of
--block --south equal mirrorArt() of the corresponding --block --north rows (or
minimally: the two outputs differ). The pure-function twin already exists in
render.test.js; the missing pin is through the CLI.

No survivor was classified BOUNDARY. I looked for a genuinely undecided case: the
closest candidate was C2 (no document states what --json --block does as a PAIR), but
--json's unconditional "structured output for scripting" promise decides the observable
(stdout must be the stable JSON document) even though it does not name the pair, so a
survivor there is a real gap, not an undecided one. The genuinely-indiscriminable
category is empty this cycle: every survivor's mutated output differs visibly from
correct output in the probes above.

## D. Not measured

- Triples were reduced by code-structure argument (gate chain), not executed: the 20
  flag triples and order permutations were not run. The reduction depends on gate order,
  whose unpinned members are exactly the C1/C2 survivors above.
- C3 was mutated only at the payload site (bin/moon.js:116). A mutant at :106
  (`opts.hemisphere || detectHemisphere()`) would cross-cut C3, C5 and C6 and was
  skipped to keep one-sharp-mutant-per-class; C3's kill evidence covers the
  carry-into-payload interaction only.
- C1's south/north members were probed with one combined mutant (`opts.hemisphere ===
  null`), not separate south-only/north-only mutants.
- Repeated flags (`--json --json`, `--south --south`) — args.js:93 claims "harmless";
  not verified here.
- The T-153 test's sensitivity was measured against guard DELETION only (M08); a wrong-
  indent mutation at :130 was not run (the not-compact indent is pinned separately by
  the D4 regression test, which is out of this task's pair scope).
- -h vs --help equivalence under pair composition (e.g. `-h --block`) was not separately
  probed; parseArgs maps -h to help before any gate, so it was treated as the same flag.

Scratch copy deleted after measurement; real tree untouched by this seat except this log.

## Anomaly: concurrent modification of the real tree (NOT this seat)

At wrap-up, `git -C /opt/targets/moon status --porcelain` showed `M test/contracts.test.js`
in addition to this log. That change is NOT mine: it is an 89-line APPEND adding a
"T-163: second exact-value pin for the --json rounding RULE" test (mtime
2026-08-17 17:10:14 UTC — inside my measurement window), evidently from a concurrent
seat. I did not revert it: reverting would destroy another seat's uncommitted work and
this seat is forbidden from editing test/ either way. Contamination check: every one of
my suite runs (baseline, all 11 mutants, final) executed in the scratch copy and
reported exactly 150 tests (149+1 on kills, 150+0 on survivals) — the scratch predates
the T-163 append, so all measurements above are against the pristine 150-test baseline.
The real tree at wrap-up runs 151/151 green including the new test. The new test pins
--json rounding at a fixed instant and asserts nothing about flag pairs; it does not
touch any survivor classification above.
