# SEALED VERIFICATION GATE — cycle 100 — target: moon — item: T-204

Authored by the conductor BEFORE any builder was dispatched. The builder was told a sealed
gate exists and was told not to look for it. Sealed by sha256 of this file, recorded in the
cycle-100 journal block, and copied byte-identically into the target repo at step 7 so the
seal is checkable from `git show` after the fact (the cycle-99 correction: `/opt/swarm/runs/`
is gitignored, so a seal left only there fingerprints nothing).

Baseline measured by the conductor at 2026-08-19T22:38Z, before dispatch:
  node --test test/*.test.js  ->  tests 180 / pass 180 / fail 0
  README.md 255 lines, REPORT.md 261 lines
  no package-lock.json, no node_modules, no dependencies/devDependencies key

Item premise, CONDUCTOR-RE-MEASURED this cycle (not inherited from T-204's filing note):
  README.md:75 = "| `--block` | multi-line framed readout instead of the single line |"
  README.md:76 = "| `--compact` | suppress the next-full-moon line, leaving exactly one line |"
  README.md:89 = ""                                                            <- BLANK
  README.md:90 = "`--compact` gives exactly one line with no trailing whitespace, which is the form you"
  README.md:81 = "`--south` and `--north` are last-one-wins, so you can override a shell alias:"
  test/cli.test.js:488 cites README:75/:89 for the --compact commitment  -> BOTH ONE LINE STALE
  test/cli.test.js:534 cites README:81 for last-one-wins                 -> RESOLVES CORRECTLY

The fix direction is FIXED BY THE GATE, not left to the builder: README is CORRECT and the
CITATION is stale. README.md must not change. A "fix" that edits README to match the stale
citation is a gate failure, not a pass — it would be weakening the claim to reach green.

---

## C1 — SCOPE

`git -C /opt/targets/moon status --porcelain` (parsed WITHOUT `.trim()` on the line — porcelain's
leading status column is a significant space; the cycle-8 instrument defect) shows changes to
files ONLY within:
    test/cli.test.js, test/contracts.test.js
`src/`, `bin/`, `README.md`, `REPORT.md`, `package.json`, `.swarm/CONTRACTS.md` must be
BYTE-IDENTICAL to HEAD (`git diff --stat HEAD -- <path>` empty for each).
No `node_modules`, no `package-lock.json`, no `.scratch-*` residue.
Conductor-authored evidence files under `.swarm/runs/` are EXCLUDED from this fence (the cycle-8
defect: my own evidence file appearing as untracked inside the fence I was measuring).

## C2 — SUITE GREEN

`node --test test/*.test.js` -> `fail 0`, and `tests` >= 180 (this cycle's measured baseline;
the SPEC floor is 175). Real output pasted into the journal.

## C3 — CITATION TRUTH, RE-DERIVED AT RUN TIME BY THE CONDUCTOR (L-045)

Independently of whatever the builder's own code computes. For each of the three promises
below, the conductor locates its CURRENT line by literal substring search over README.md:
  P1 (table row)  "| `--compact` | suppress the next-full-moon line, leaving exactly one line |"
  P2 (prose)      "`--compact` gives exactly one line with no trailing whitespace"
  P3 (last-wins)  "`--south` and `--north` are last-one-wins, so you can override a shell alias:"
Then: the SET of distinct `README:N` line numbers appearing in test/cli.test.js must EQUAL the
SET {line(P1), line(P2), line(P3)}. Set equality, so decay is caught in BOTH directions — a
citation left stale AND a citation pointing at a line no declared promise occupies.

## C4 — GATE FAILABILITY, ARM A (L-029: the mutation goes RED and the new test is named)

Conductor applies MUT-1: insert one blank line into README.md ABOVE line 70, shifting P1, P2 and
P3 each down by exactly one. Then `node --test test/*.test.js` must go RED, and:
  (a) at least one FAILING test must be the NEW cli.test.js citation gate, identified BY NAME
      in the runner output;
  (b) the failure message must name the file, the cited line, and the actual line.
Conductor reverts MUT-1 and re-confirms green.

## C5 — GATE FAILABILITY, ARM B (attributability: delete the test and the bug ships)

With MUT-1 re-applied AND the new gate test(s) removed (or their file's new block excised),
`node --test test/*.test.js` must go GREEN. That is the proof the new gate is the ONLY thing in
the suite that can see this class of decay. If any pre-existing test also fails under MUT-1,
that is recorded honestly as a PARTIAL arm B (cycle 99's T-201 surface-2 precedent: an
unachievable arm B is reported NOT MET, never rounded to a pass).

## C6 — CONVERSE CONTROL (L-044: a mutation that must leave the suite GREEN)

Conductor applies MUT-2: append one blank line to the END of README.md, after every cited line,
moving nothing. `node --test test/*.test.js` must stay GREEN. This proves the widened gate is an
assertion about citations and not a snapshot test that dies on any README edit whatsoever.
Reverted and re-confirmed.

## C7 — DECLARED SCOPE, NOT A BLIND SCAN (the discriminator that makes C3 honest)

test/contracts.test.js contains the token `README:171` TWICE in its own explanatory comments
(lines 429 and 463), narrating historical decay. Those are narrative, not live citations. A gate
that blindly scans all of `test/` for `README:N` would flag them and would be wrong.
Two-armed check:
  (a) Conductor inserts a fake token `README:9999` into a COMMENT in a test file that is NOT in
      the gate's declared file list -> suite must stay GREEN.
  (b) Conductor inserts the same fake token into a COMMENT in a file that IS in the declared
      list -> suite must go RED.
Both arms required. (a) alone would also pass for a gate that checks nothing.

## C8 — ZERO-CITATION GUARD (fails-CLOSED)

Conductor deletes every `README:` token from test/cli.test.js. The suite must go RED. A gate
whose discovery loop silently finds zero citations and passes is the exact fails-OPEN shape
this run exists to audit. Reverted.

## C9 — PROMISE-EXISTS GUARD (L-043's fails-OPEN clause, the clause this run audits)

Conductor rewords P1 in README.md so the pinned literal no longer occurs anywhere in the file.
The suite must go RED **with a message saying the promise sentence could not be FOUND** — not a
silent pass, and not a misleading "citation drifted to line N" message. Distinguishing "the
sentence moved" from "the sentence is gone" is the whole content of the clause. Reverted.

## C10 — NO NEW DEPENDENCIES

`package.json` has no `dependencies` and no `devDependencies` key; no `package-lock.json`; no
`node_modules/`. (SPEC: a lockfile or node_modules appearing in this repo is a failed run.)

## C11 — NO DOC GROWTH, NO PROSE REWORDING

README.md and REPORT.md are byte-identical to HEAD (subsumed by C1, restated because the SPEC
names doc growth and the rewording of already-true prose as non-goals, and because the
tempting wrong fix here is to edit README).

## C12 — REPO-WIDE CITATION RE-RESOLVE (the check that found T-204 in the first place)

After the merge, the conductor hand-resolves EVERY surviving `README:N` token across all of
`test/`, classifying each as LIVE (a real citation, must resolve) or NARRATIVE (prose about
past decay, must not be required to resolve). Any live citation that does not resolve is a new
defect filed with file and line. This is check G11 from cycle 99, re-run — it is what caught
T-204, and a wave that fixes one instance of a decay class must not introduce another.

## C13 — NAMED SURFACE (SPEC must-have: no test may be added that cannot name what it closes)

Every test added by this item must name, in its own source comment, the specific surface it
closes. Test COUNT is not an outcome. If the item lands N new tests, the journal reports what
each one closes, or the item fails this gate.

---

## Standing residual, declared in advance so it is not discovered as a surprise

Set-equality in C3 does NOT catch a SWAP: if the P1 citation and the P2 citation exchanged
places while both lines remained cited, the set would still match. For this item the residual
is benign and is being accepted with the reason stated: both P1 and P2 are cited in the SAME
comment (cli.test.js:488) for the SAME commitment, so a swap between them is not a claim a
reader could be misled by. If a future item cites two DIFFERENT promises from two DIFFERENT
comment sites in one file, this residual becomes real and the gate needs site-level resolution.
Recorded now, at seal time, rather than defended later.
