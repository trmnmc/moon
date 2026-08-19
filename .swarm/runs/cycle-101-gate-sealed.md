# cycle 101 — sealed verification gate — T-205

Authored by the conductor BEFORE dispatch. The builder never sees this file.
Sealed by sha256 (recorded in the journal and in the target repo copy).

Item: T-205 — the cycle-100 gate widening changed the pre-existing regressions
citation check from per-distinct-line to per-occurrence, emitting 4 tests that
carry the byte-identical name.

Acceptance (from backlog, verbatim): "The README:N citation gate emits one test per
DISTINCT cited line per promise, not one per citation occurrence, so no two tests in
the suite carry the same name. Detection power is unchanged in both directions: a
citation that drifts still fails, and two citations naming different lines still
produce two distinct named tests. No assertion is weakened and no coverage is
removed to achieve this."

## Fix direction, FIXED IN THIS SEAL before dispatch

The gate at test/contracts.test.js:582 iterates `citedLines(raw)` — an array of
OCCURRENCES. It must iterate the DISTINCT lines. The honest repair is to dedupe the
emitted tests, NOT to delete citations from regressions.test.js and NOT to rename
the tests apart by index. Both of those reach a green C2 while failing C3/C6, and
the gate is written so they cannot pass:

- Deleting three of the four README:174 tokens from test/regressions.test.js is
  removing coverage to reach green — C12 fails it (regressions.test.js must be
  byte-identical to HEAD).
- Disambiguating names by occurrence index (`... citation #2`) keeps 190 tests and
  changes the distinct-name SET — C3 fails it.
- Keeping only the first citation (`citedLines(raw).slice(0, 1)` or `[0]`) reaches
  C2 and C3 but destroys direction-2 detection — C6 fails it.

## Checks

C1 PREMISE (run pre-dispatch, conductor-measured, evidence already captured)
    Baseline suite = 190 reported / 187 distinct names / exactly one name emitted
    x4, that name being the regressions README:174 exit-code-promise citation.
    Distinct-name set snapshotted to runs/c101-names-before.txt.
    STATUS AT SEAL TIME: PASS (measured before the gate was sealed).

C2 NO DUPLICATE NAMES
    Post-fix: total reported tests == distinct test names. Zero names emitted more
    than once anywhere in the suite.

C3 DISTINCT-NAME SET IDENTICAL
    The sorted set of distinct test names after the fix is byte-identical to
    c101-names-before.txt. Total reported drops by exactly 3 (190 -> 187).
    This is the "no coverage removed, nothing renamed away" proof: a fix that
    renames, deletes, or adds a surface changes the SET and fails here.

C4 SUITE GREEN
    `node --test test/*.test.js` -> fail 0. Run by the conductor, not the builder.

C5 DIRECTION 1 — DRIFT STILL FAILS (arm A)
    Mutate README.md so the exit-code promise moves without moving the three
    cli-cited promises (76 / 81 / 90) — verified isolated BEFORE running the suite.
    Expect: the regressions README:174 drift test FAILS, exactly once, its message
    naming both the cited line and the actual line.

C6 DIRECTION 2 — TWO DISTINCT LINES, TWO DISTINCT TESTS (the discriminator)
    Mutate test/regressions.test.js so exactly ONE of the four README:174 tokens
    reads README:999, leaving three at 174. Expect: TWO distinct drift tests for the
    exit-code promise — one naming 174 (PASS) and one naming 999 (FAIL) — i.e.
    fail exactly 1. A degenerate "keep the first citation only" fix cannot produce
    this; it yields either 1 test or 0 failures depending on which token moved, so
    the mutation is applied to the LAST of the four tokens as well as the first, and
    both arms must behave identically.

C7 ARM B — REMOVAL PROOF (L-029)
    C5's README mutation applied AND the regressions.test.js entry excised from
    CHECKED_FILES -> suite GREEN. Delete this coverage and the decay ships silently.

C8 CONVERSE CONTROL (L-044)
    Append a blank line at README.md EOF — moves nothing — -> suite GREEN. Proves
    these checks are assertions, not a snapshot test that dies on any edit.

C9 FAILS-CLOSED CASE 2 STILL DISTINCT (L-043 fails-OPEN clause)
    Reword the exit-code promise literal in README.md so it is GONE. Expect the
    "README.md still makes the ... promise" test to FAIL with the "could not find
    ... ANYWHERE in README.md" message — textually DISTINCT from the drift message.
    "It moved" and "it is gone" must not be conflated after the dedupe.

C10 ZERO-CITATION GUARD STILL ARMED
    Strip every `README:` token from test/regressions.test.js. Expect the
    "test/regressions.test.js still has README:N citations for its declared
    promises" test to FAIL. The dedupe must not be implemented in a way that makes
    an empty citation set look like a satisfied one.

C11 NO ASSERTION WEAKENED
    `git diff` of test/contracts.test.js: net count of `assert.` call sites does not
    decrease; no `test.skip`, `test.todo`, `it.skip`, `.only`, or commented-out
    assertion is introduced; CHECKED_FILES still declares both files with all four
    promises (1 for regressions, 3 for cli).

C12 SCOPE + HYGIENE (conductor-checked)
    `git status --porcelain` lists exactly `test/contracts.test.js`. README.md,
    src/, bin/, package.json, test/regressions.test.js, test/cli.test.js all
    byte-identical to HEAD. No `.scratch-*` residue, no node_modules, no lockfile,
    zero dependencies. Every conductor mutation applied from a pristine backup and
    restored from it, with post-restore sha256 matching pre-mutation.

C13 PER-LINE ACCOUNTING
    Post-fix the suite emits exactly 1 drift test for regressions.test.js (line 174)
    and exactly 3 for cli.test.js (lines 76, 81, 90). The dedupe is per file, per
    promise, per distinct line — it must not collapse cli.test.js's three distinct
    lines into one.

## Gate outcome rule

PASS requires C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13 all clean.
Any check that cannot be run is reported NOT-RUN, never as passed. No check is
relaxed to reach green; if the repair cannot satisfy a check, the item goes back to
todo with attempts+1 and the failure is journaled with its real output.
