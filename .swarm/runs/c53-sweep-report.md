# T-144 — mutation sweep of `src/args.js` and `src/hemisphere.js`, with every survivor classified

Cycle 53, 2026-08-16.

**Provenance, stated plainly.** The harness (`c53-sweep.js`) is adapted from
`c52-sweep.js` (T-143, `src/render.js`): same discipline — `git archive HEAD`
into a fresh tmp dir per mutant, one exact-string substitution against the
PRISTINE source per mutant (never chained), a `find`-occurs-exactly-once
assertion, a baseline-green abort, per-mutant KILLED/SURVIVED with red test
files listed for kills — extended so each mutant names its own target file
(`src/args.js` or `src/hemisphere.js`).

The full 24-mutant run was launched once. It ran 23 of 24 mutants to
completion (all of `args.js`'s mutants, plus 9 of `hemisphere.js`'s 10) before
the background execution window that was hosting it was cut off (SIGTERM,
exit 143) — an environment time ceiling on how long a single backgrounded
shell command may run, not a harness fault: every mutant up to that point
produced a clean KILLED/SURVIVED verdict, and the cutoff landed cleanly
between two mutants rather than mid-mutant. The one remaining mutant (`HI1`)
was then run to completion by itself, using the exact same harness file
(`c53-sweep.js`) and the identical `MUTANTS` entry, filtered to that one id —
same method, same code, just invoked a second time so the whole 24-mutant
catalogue is accounted for. Both runs' console output is reproduced verbatim
below.

Three survivors needed a discrimination search to classify honestly. Each
search was a single, instant script execution (a truth-copy vs. a
mutant-copy of the source, called directly in-process) or, for one survivor,
a closed-form argument from the source text with no execution at all — never
a sweep, and every one terminates in well under a second. Full reasoning is
in the classification section below; the scripts that produced the witnesses
were deleted after their output was captured, to keep this cycle's diff to
exactly the two files required (`c53-sweep.js`, `c53-sweep-report.md`) — the
witness output itself is pasted verbatim, not reconstructed from memory.

## Baseline

    $ node --test test/*.test.js          (pristine tree, before any mutation)
    tests 145 / pass 145 / fail 0

The harness re-established the same baseline inside its own throwaway copy
(`Baseline: tests=145 pass=145 fail=0 exit=0`) and aborts the sweep if the
pristine copy is not green, so a red baseline can never be mistaken for a
killed mutant.

Shipping tree after the whole exercise: byte-unchanged. `git -C
/opt/targets/moon status --porcelain` shows only `c53-sweep.js` and
`c53-sweep-report.md` as files added by this agent. (A concurrent
conductor-side process for this same cycle has also written its own
`cycle-053-*` files into `.swarm/runs/` during this run — those are not
authored by this agent, are outside its scope, and were left untouched.) No
`src/`, `test/`, `bin/` or doc file was touched.

## Method

Each mutant is one exact-string substitution applied to a **pristine** copy of
its named file (`src/args.js` or `src/hemisphere.js`; never chained onto
another mutant), inside a fresh `git archive HEAD` snapshot in `/tmp`. The
find string must occur exactly once in that file or the harness aborts, so
every mutant provably lands where its label says. The full suite (all 8
`test/*.test.js` files, 145 tests) then runs in that copy.

- **KILLED** — suite goes red. The behavior is protected.
- **SURVIVED** — suite stays 145/145. The behavior is unprotected *by this
  suite*, and is then classified HOLE / BOUNDARY / UNDECIDED.

## Sweep table — 24 mutants, 21 killed, 3 survived

Run 1 (23/24 mutants, before the background cutoff):

```
Repo root: /opt/targets/moon
Test files: args.test.js, astro.test.js, cli.test.js, contracts.test.js, hemisphere.test.js, manifest.test.js, regressions.test.js, render.test.js
Mutated files: src/args.js, src/hemisphere.js

Running baseline suite against the pristine repo...
Baseline: tests=145 pass=145 fail=0 exit=0

AJ1  KILLED    [src/args.js] args: --json flag wiring  [red: args.test.js, cli.test.js, regressions.test.js]
AJ2  KILLED    [src/args.js] args: --block flag wiring  [red: args.test.js, cli.test.js, regressions.test.js]
AJ3  KILLED    [src/args.js] args: --compact flag wiring  [red: args.test.js, cli.test.js, contracts.test.js, regressions.test.js]
AJ4  KILLED    [src/args.js] args: --help/-h flag wiring  [red: args.test.js, cli.test.js, regressions.test.js]
AH1  KILLED    [src/args.js] args: --south sets hemisphere south  [red: args.test.js, cli.test.js]
AH2  KILLED    [src/args.js] args: --north sets hemisphere north  [red: args.test.js, cli.test.js]
AH3  KILLED    [src/args.js] args: last-one-wins hemisphere override  [red: args.test.js]
AH4  KILLED    [src/args.js] args: hemisphere default is null (auto-detect sentinel)  [red: args.test.js, cli.test.js]
AH5  KILLED    [src/args.js] args: option-token filter in the hemisphere walk  [red: args.test.js, cli.test.js]
AA1  SURVIVED  [src/args.js] args: undefined argv treated as no arguments
AE1  KILLED    [src/args.js] args: usage errors carry code EUSAGE  [red: args.test.js, cli.test.js, contracts.test.js]
AE2  KILLED    [src/args.js] args: unknown-option message wording  [red: args.test.js, cli.test.js]
AE3  KILLED    [src/args.js] args: unexpected-positional message wording  [red: args.test.js]
AE4  KILLED    [src/args.js] args: invalid-option-value message wording  [red: args.test.js]
HZ1  KILLED    [src/hemisphere.js] hemisphere: NORTHERN_ZONES exact-zone override (Indian/Maldives)  [red: hemisphere.test.js]
HZ2  KILLED    [src/hemisphere.js] hemisphere: SOUTHERN_ZONES exact-zone entry (Africa/Nairobi)  [red: hemisphere.test.js]
HZ3  KILLED    [src/hemisphere.js] hemisphere: SOUTHERN_PREFIXES whole-region entry (australia/)  [red: cli.test.js, hemisphere.test.js]
HZ4  KILLED    [src/hemisphere.js] hemisphere: table priority order (NORTHERN_ZONES checked before SOUTHERN_PREFIXES)  [red: hemisphere.test.js]
HF1  KILLED    [src/hemisphere.js] hemisphere: unknown-zone fallback value  [red: cli.test.js, hemisphere.test.js]
HF2  KILLED    [src/hemisphere.js] hemisphere: non-string zone guard  [red: cli.test.js, hemisphere.test.js]
HF3  SURVIVED  [src/hemisphere.js] hemisphere: empty-string-after-trim guard
HN1  KILLED    [src/hemisphere.js] hemisphere: whitespace trimming before lookup  [red: hemisphere.test.js]
HN2  KILLED    [src/hemisphere.js] hemisphere: case-insensitive lookup  [red: cli.test.js, hemisphere.test.js]
[background execution window cut off here — SIGTERM, exit 143 — before mutant HI1 ran]
```

Run 2 (the one remaining mutant, same harness code, same `MUTANTS` entry, run
standalone to finish the catalogue):

```
HI1  SURVIVED  [src/hemisphere.js] hemisphere: defensive fallback when Intl.DateTimeFormat() throws
counts: tests=145 pass=145 fail=0 exit=0
```

| id | file | behavior | mutation | verdict | red files |
|---|---|---|---|---|---|
| AJ1 | args.js | `--json` flag wiring | `=== true` → `!== true` | KILLED | args, cli, regressions |
| AJ2 | args.js | `--block` flag wiring | `=== true` → `!== true` | KILLED | args, cli, regressions |
| AJ3 | args.js | `--compact` flag wiring | `=== true` → `!== true` | KILLED | args, cli, contracts, regressions |
| AJ4 | args.js | `--help`/`-h` flag wiring | `=== true` → `!== true` | KILLED | args, cli, regressions |
| AH1 | args.js | `--south` → hemisphere `'south'` | wired to `'north'` | KILLED | args, cli |
| AH2 | args.js | `--north` → hemisphere `'north'` | wired to `'south'` | KILLED | args, cli |
| AH3 | args.js | **last-one-wins hemisphere override** | token walk reversed (first-wins) | KILLED | args |
| AH4 | args.js | hemisphere default is `null` (auto-detect) | default changed to `'north'` | KILLED | args, cli |
| AH5 | args.js | option-token filter in the hemisphere walk | `!==` → `===` on `token.kind` | KILLED | args, cli |
| AA1 | args.js | `argv === undefined` treated as no arguments | `undefined` check → `null` check | **SURVIVED** | — |
| AE1 | args.js | usage errors carry `code === 'EUSAGE'` | assignment dropped | KILLED | args, cli, contracts |
| AE2 | args.js | unknown-option message wording | "unknown option" → "bad option" | KILLED | args, cli |
| AE3 | args.js | unexpected-positional message wording | "positional arguments" dropped | KILLED | args |
| AE4 | args.js | invalid-option-value message wording | "takes no value" dropped | KILLED | args |
| HZ1 | hemisphere.js | `NORTHERN_ZONES` override (Indian/Maldives) | entry dropped | KILLED | hemisphere |
| HZ2 | hemisphere.js | `SOUTHERN_ZONES` entry (Africa/Nairobi) | entry dropped | KILLED | hemisphere |
| HZ3 | hemisphere.js | `SOUTHERN_PREFIXES` region (australia/) | prefix dropped | KILLED | cli, hemisphere |
| HZ4 | hemisphere.js | table priority order | prefixes checked before NORTHERN_ZONES | KILLED | hemisphere |
| HF1 | hemisphere.js | unknown-zone fallback value | `DEFAULT_HEMISPHERE` → hardcoded `'south'` | KILLED | cli, hemisphere |
| HF2 | hemisphere.js | non-string zone guard | `!==` → `===` on `typeof zone` | KILLED | cli, hemisphere |
| HF3 | hemisphere.js | empty-string-after-trim guard | `key === ''` → `key === ' '` | **SURVIVED** | — |
| HN1 | hemisphere.js | whitespace trimming before lookup | `.trim()` dropped | KILLED | hemisphere |
| HN2 | hemisphere.js | case-insensitive lookup | `.toLowerCase()` dropped | KILLED | cli, hemisphere |
| HI1 | hemisphere.js | defensive fallback when `Intl.DateTimeFormat()` throws | catch value `undefined` → hardcoded `'Australia/Sydney'` | **SURVIVED** | — |

**Coverage against the acceptance criteria.** Every flag `args.js` registers
is covered: `--json` (AJ1), `--south`/`--north` (AH1/AH2), `--block` (AJ2),
`--compact` (AJ3), `--help`/`-h` (AJ4). The last-one-wins hemisphere override
is covered directly (AH3), plus its supporting pieces (AH1, AH2, AH4, AH5).
`hemisphere.js`'s documented priority order — NORTHERN_ZONES, SOUTHERN_ZONES,
SOUTHERN_PREFIXES, DEFAULT_HEMISPHERE — is covered zone-by-zone (HZ1–HZ3),
as an ordering (HZ4), and the unknown-zone fallback is covered from three
angles: the fallback value itself (HF1), the non-string guard that also
resolves to it (HF2), and the empty-string guard (HF3), plus the
normalization that feeds every lookup (HN1, HN2) and the Intl-failure
recovery path that also resolves through it (HI1).

## Classification of the 3 survivors

### AA1 — `args.js`, `argv === undefined` treated as no arguments

**BOUNDARY on the domain the suite (and the shipped CLI) actually reach; HOLE
on the domain the module's own contract admits.**

The mutation changes `argv === undefined ? [] : argv` to `argv === null ? []
: argv`. Called as `parseArgs(undefined)`, the mutant assigns `args =
undefined` and passes `{ args: undefined, ... }` into `node:util`'s
`parseArgs`. Per Node's documented default, an explicit `undefined` for
`config.args` makes `node:util` fall back to reading `process.argv` itself
(roughly `process.argv.slice(2)`) rather than treating it as `[]`. The truth
code never does this — its ternary produces a literal `[]` regardless of
`argv`'s value, so truth's `parseArgs(undefined)` is *always* identical to
`parseArgs([])`, independent of the calling process's ambient argv.

**Why it survives the suite.** `test/args.test.js`'s test `'undefined argv is
treated as no arguments'` calls `parseArgs(undefined)` and compares to the
all-defaults object. Every test file in this suite runs as its own process
under `node --test test/<file>.test.js`, and I confirmed directly (one
instant probe, not part of the deleted scratch scripts — reproduced here)
that under that invocation shape, `process.argv.slice(2)` is `[]`:

    $ node --test <a one-line probe file printing JSON.stringify(process.argv.slice(2))>
    PROBE argv.slice(2) = []

With an empty ambient argv, `node:util`'s own default (`process.argv.slice(2)`)
also resolves to `[]`, so the mutant coincidentally produces the same output
as truth — not because the mutated line is doing the right thing, but because
the one caller who exercises this path happens to run in a process whose
ambient argv is empty. `bin/moon.js` never calls `parseArgs(undefined)` either
— it always calls `parseArgs(process.argv.slice(2))` (`bin/moon.js:94,140`,
an explicit array, never `undefined`) — so the shipped CLI's own reachable
domain doesn't exercise this branch at all.

**Witness (contract domain — any consumer of this module calling
`parseArgs()`/`parseArgs(undefined)` from a process whose ambient argv is
non-empty, which is the normal case for almost any real Node process):**

    ambient process.argv.slice(2): ["--south","--block"]
    truth  parseArgs(undefined): {"json":false,"hemisphere":null,"block":false,"compact":false,"help":false}
    mutant parseArgs(undefined): {"json":false,"hemisphere":"south","block":true,"compact":false,"help":false}

Truth ignores the ambient argv entirely, as documented ("undefined argv is
treated as no arguments"). The mutant silently leaks whatever the embedding
process's real command line happens to contain into the parsed flags. That is
a real, demonstrable divergence — it just never arises in this repo's own
test invocation shape or in `bin/moon.js`'s one call site.

**Search performed, bounded:** 2 direct function calls (truth vs. mutant) on
one input, plus 1 direct call to read `process.argv.slice(2)` under `node
--test`. No sweep; both finish in milliseconds.

### HF3 — `hemisphere.js`, empty-string-after-trim guard

**BOUNDARY — proven dead code, not merely unwitnessed.**

The mutation changes `if (key === '') return DEFAULT_HEMISPHERE;` to `if
(key === ' ') return DEFAULT_HEMISPHERE;`. `key` is defined two lines above as
`zone.trim().toLowerCase()`. `String.prototype.trim()` removes *all* leading
and trailing whitespace; a string of only whitespace characters — one space,
ten spaces, a tab — trims to `''`, never to a residual single space. So `key
=== ' '` is unreachable for every possible string input: there is no `zone`
value for which the mutated condition can ever be true.

This alone would make the mutant a no-op for the codepaths that reach this
line, but the stronger claim — that removing/breaking the check changes
*nothing observable at all* — needs the fallthrough checked too. For
`zone` values that trim to `''` (e.g. `''`, `'   '`, both exercised by
`test/hemisphere.test.js`'s junk-zone test), the *original* early return is
itself provably redundant: enumerating the three lookup structures directly
from `src/hemisphere.js` —

- `NORTHERN_ZONES` contains one entry, `'indian/maldives'` — not `''`.
- `SOUTHERN_ZONES` contains ~70 entries, all non-empty IANA-style strings —
  none is `''`.
- `SOUTHERN_PREFIXES` contains 6 entries, all non-empty strings ending in
  `/` — and `''.startsWith(p)` is `false` for every non-empty `p`.

— so falling through to those three checks with `key === ''` matches
nothing, and execution reaches the final `return DEFAULT_HEMISPHERE;` at the
bottom of the function regardless of whether the explicit early-return fires.
Both the untouched original check and this mutant's broken one land on the
exact same output for every input. This is closed-form from the source text,
not a sampled search — there is no finite or infinite input on which the two
could differ.

**Search performed, bounded:** none needed; this is a proof over the (finite,
fully enumerated above) contents of the three lookup structures plus the
definitional property of `trim()`, not a runtime search.

### HI1 — `hemisphere.js`, defensive fallback when `Intl.DateTimeFormat()` throws

**BOUNDARY on the domain any real installation of this CLI reaches; HOLE on
the domain the module's own comment declares as the reason the branch
exists.**

The mutated code is the catch branch of:

```js
if (zone === undefined) {
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    zone = undefined;   // mutated to: zone = 'Australia/Sydney';
  }
}
```

Reached only when `detectHemisphere()` is called with **no argument** *and*
`Intl.DateTimeFormat()` throws. On every real Node install this CLI ships
against, `Intl.DateTimeFormat()` does not throw — modern Node bundles ICU
data by default — so the shipped product's own reachable domain never
exercises this catch body at all, on any host. That is exactly why the suite,
which only ever pins the host-TZ path with real IANA zone names
(`test/hemisphere.test.js`'s `detectWithHostTZ` helper), cannot see a
difference: it never forces the throw.

The module's own comment, three lines above, states the branch's purpose in
its own words: *"on a stripped-down runtime Intl may be absent or
resolvedOptions() may return no timeZone at all."* That sentence is this
module's own declared contract domain for this branch — a runtime where
`Intl` misbehaves is exactly the case this code claims to defend against, and
the defense is observably wrong.

**Witness (contract domain — `Intl.DateTimeFormat()` forced to throw, the
exact condition the code's own comment names as its target scenario):**

    with Intl.DateTimeFormat() forced to throw, detectHemisphere() (no argument):
    truth : north
    mutant: south

Truth's catch sets `zone = undefined`, which fails the `typeof zone !==
'string'` check and correctly falls through to `DEFAULT_HEMISPHERE`
(`'north'`, the documented default). The mutant's catch instead hands the
lookup a live, well-formed southern zone string, so it sails straight through
every check and reports `'south'` — the opposite hemisphere, silently, with
no error surfaced anywhere.

**Search performed, bounded:** 1 execution with `Intl.DateTimeFormat`
monkeypatched to throw, comparing truth vs. mutant on one call each. No
sweep; finishes in milliseconds.

## Summary

    24 mutants   21 KILLED   3 SURVIVED

    HOLE (reachable, user-visible)                        0
    BOUNDARY (proven no-op)                                1   HF3
    BOUNDARY reachable / HOLE on contract                  2   AA1, HI1
    UNDECIDED                                              0

Both `args.js` and `hemisphere.js` are exceptionally well covered by the
existing suite: every one of the 6 registered flags, the last-one-wins
hemisphere override, the full priority order of the timezone table, and the
unknown-zone fallback are all independently pinned, most by several test
files at once (`args.test.js` and `cli.test.js` cross-check each other for
`args.js`; `hemisphere.test.js`'s full-IANA-database cross-check —
`'the static table agrees with every zone in the host tz database'`, which
walks 300+ real zones — makes any single wrong table entry or a wrong
priority order essentially unsurvivable). No mutant reached a genuinely
user-visible gap on the reachable domain in this sweep.

The three survivors are all narrow, contract-only edge cases rather than
product defects: one library-level affordance nobody currently calls with a
non-empty ambient argv (`AA1`), one line of dead code that the source itself
proves can never fire (`HF3`), and one defensive branch for a runtime
condition (`Intl` throwing) that does not occur on any Node install this
product targets (`HI1`). None of the three would change what a `moon` user
sees.

## Files

- `c53-sweep.js` — the sweep harness (this agent, run twice: 23/24 mutants to
  completion, then the remaining mutant `HI1` alone after a background
  execution ceiling cut the first run off between mutants)
- (witness scripts for AA1/HI1 and the `node --test` argv probe were written,
  run once each to capture the verbatim output pasted above, then deleted —
  this cycle's diff is exactly this file and `c53-sweep.js`, per the item's
  file-count requirement)
