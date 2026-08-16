# T-152 — Mutation sweep of bin/moon.js's documented behaviors

Method: each mutant is a small, semantically meaningful change applied to a throwaway
copy of the tree (never the tracked `bin/moon.js`), run against the full suite
(`node --test test/*.test.js`, 147 tests). "KILLED" = suite went red. "SURVIVED" =
suite stayed green. Harness: `.swarm/runs/c064-sweep-moonjs.js`. Raw output of the
canonical run: `.swarm/runs/c064-sweep-moonjs-out.txt`.

Canonical run result: **27 mutants, 19 KILLED, 8 SURVIVED, 0 harness errors.**
Tracked `bin/moon.js` confirmed byte-identical before/after (harness prints this
check itself; also verified independently with `git status --porcelain`). The
harness also runs a second "witness capture" pass after the sweep, replaying each
confirmed-or-flagged survivor at a FIXED, reproducible `now` and printing the exact
before/after output — that section of `c064-sweep-moonjs-out.txt` is the evidence
cited throughout the classification below, since it doesn't depend on when the
sweep happens to run (two of the 27 mutants — M7 and M25 — turned out to have
run-to-run–dependent KILLED/SURVIVED status; see their entries below for why, and
why the fixed witness rather than either individual run's verdict is the thing to
trust).

Scratch mechanics: the harness copies `bin/`, `src/`, `test/`, `README.md`,
`package.json` and `.swarm/CONTRACTS.md` (everything the suite reads) into a fresh
`fs.mkdtempSync(os.tmpdir())` directory per invocation, mutates only the scratch
copy's `bin/moon.js`, runs the suite there, restores the pristine file before the
next mutant, and removes the whole scratch directory at the end. Nothing is left in
the repo tree.

## Mutant table

| id | behavior | mutation (old → new) | result | caught by |
|----|----------|----------------------|--------|-----------|
| M1 | 1. parseArgs-throw stderr shape | `` `moon: ${msg}\n` `` → `` `${msg}\n` `` (drop the `moon: ` prefix) | **SURVIVED** | — |
| M2 | 1. parseArgs-throw exit code | `return 2` → `return 1` in the catch block | KILLED | `an unknown flag exits 2 with a clean one-line message on stderr` (cli.test.js:302) |
| M3 | 2. --help precedence | move the `if (opts.json)` block ahead of the `if (opts.help)` block | KILLED | `--help wins over --json regardless of flag order...` (cli.test.js:296) |
| M4 | 2. --help exit code | help branch `return 0` → `return 1` | KILLED | `OPTIONS, the HELP options block...` (cli.test.js:277), `--help wins over --json...` (cli.test.js:296), `no emoji anywhere in any output mode` (cli.test.js:310), `every successful invocation mode writes nothing to stderr` (cli.test.js:325), `help does not mis-describe phaseAngle...` (regressions.test.js:52), `help stays within 80 columns` (regressions.test.js:97) |
| M5 | 3. --json field set | drop `hemisphere,` from the payload object | KILLED | `--json is parseable, carries the documented fields...` (cli.test.js:71), `--json hemisphere follows the override flag` (cli.test.js:88), `hemisphere is inferred from the ambient timezone...` (cli.test.js:93), `--json payload keys, HELP fields, README table...agree` (cli.test.js:156) |
| M6 | 3. --json field set | add an undocumented `extra: true,` field | KILLED | `--json payload keys, HELP fields, README table...agree` (cli.test.js:156) |
| M7 | 3. --json rounding: illumination | `round(moon.illumination, 4)` → `round(..., 5)` | KILLED — **run-dependent, see note below** | `--json is parseable...not a raw float dump` (cli.test.js:71) |
| M8 | 3. --json rounding: age | `round(moon.age, 3)` → `round(..., 4)` | **SURVIVED** | — |
| M9 | 3. --json rounding: cycleFraction | `round(moon.cycleFraction, 5)` → `round(..., 6)` | **SURVIVED** | — |
| M10 | 3. --json rounding: phaseAngle | `round(moon.phaseAngle, 3)` → `round(..., 4)` | KILLED | `--json is parseable...not a raw float dump` (cli.test.js:71) |
| M11 | 3. --json rounding: julianDay | `round(moon.julianDay, 5)` → `round(..., 6)` | **SURVIVED** | — |
| M12 | 4. hemisphere resolution order | `opts.hemisphere \|\| detectHemisphere()` → `detectHemisphere() \|\| opts.hemisphere` | KILLED | `--south is the horizontal mirror of --north...` (cli.test.js:61), `--json hemisphere follows the override flag` (cli.test.js:88) |
| M13 | 5. --block indent | `nextFullLine(now, 3)` → `nextFullLine(now, 2)` under `--block` (the value the in-file comment records as WRONG) | KILLED | `block next-full-moon line aligns with the block label column` (regressions.test.js:88) |
| M14 | 5. default indent (NAME_COLUMN) | `NAME_COLUMN = 12` → `= 11` | KILLED | `the next-full-moon line is indented to the phase-name column` (cli.test.js:54) |
| M14b | 5. default indent (NAME_COLUMN) | `NAME_COLUMN = 12` → `= 13` | KILLED | same as M14 |
| M15 | 5. --block vs default renderer | swap `renderBlock`/`renderLine` calls between the two branches | KILLED | `default output is exactly two lines...` (cli.test.js:42), `--compact collapses to exactly one line...` (cli.test.js:49), `the next-full-moon line is indented...` (cli.test.js:54), `--south is the horizontal mirror of --north...` (cli.test.js:61), `--block draws a closed frame` (cli.test.js:171), `block next-full-moon line aligns...` (regressions.test.js:88), `README Install section leads with a command that actually runs` (regressions.test.js:156) |
| M16 | 6. --compact suppression (default branch) | `if (!opts.compact)` → `if (opts.compact)` before pushing the next-full-moon line in the non-block branch | KILLED | `default output is exactly two lines...` (cli.test.js:42), `--compact collapses to exactly one line...` (cli.test.js:49), `the next-full-moon line is indented...` (cli.test.js:54), `single-digit full-moon days keep their leading pad` (regressions.test.js:69), `next-full-moon date carries the year...` (regressions.test.js:112), `next-full-moon date omits the year...` (regressions.test.js:135) |
| M17 | 6. --compact suppression (block branch) | drop the `if (!opts.compact)` guard entirely on the `--block` branch (always push next-full-moon) | **SURVIVED** | — |
| M18 | 7. formatFullMoonDate padStart | `String(when.getDate()).padStart(2, ' ')` → `String(when.getDate())` (no pad) | KILLED | `single-digit full-moon days keep their leading pad` (regressions.test.js:69) |
| M19 | 7. formatFullMoonDate padStart fill | `padStart(2, ' ')` → `padStart(2, '0')` | KILLED | `single-digit full-moon days keep their leading pad` (regressions.test.js:69), `next-full-moon date carries the year...` (regressions.test.js:112) |
| M20 | 7. formatFullMoonDate LOCAL vs UTC | `getDate/getMonth/getFullYear` → `getUTCDate/getUTCMonth/getUTCFullYear` (all three, together) | **SURVIVED** | — |
| M21 | 7. formatFullMoonDate year ternary | invert: show year when it MATCHES, hide when it differs | KILLED | `next-full-moon date carries the year...` (regressions.test.js:112), `next-full-moon date omits the year...` (regressions.test.js:135) |
| M22 | 7. formatFullMoonDate year ternary | always append the year regardless of match | KILLED | `next-full-moon date omits the year when it falls in the current calendar year` (regressions.test.js:135) |
| M23 | 8. round() rounding rule | `Math.round(value * f) / f` → `Math.floor(value * f) / f` | **SURVIVED** | — |
| M24 | 8. round() rounding rule | `Math.round(value * f) / f` → `Math.trunc(value * f) / f` | **SURVIVED** | — |
| M25 | 8. round() scaling formula | `const f = 10 ** places` → `const f = places * 10` | KILLED — **run-dependent, see note below** | `--json is parseable...not a raw float dump` (cli.test.js:71) |
| M26 | 8. round() scaling off-by-one | `const f = 10 ** places` → `const f = 10 ** (places + 1)` | KILLED | `--json is parseable...not a raw float dump` (cli.test.js:71) |

Every one of the 8 in-scope behaviors was mutated at least once (behaviors 3, 5, 7
and 8 got multiple independent mutants, matching the task's explicit call-outs for
per-field rounding precisions, both indent constants, both date-accessor families,
and both halves of `round()`). No behavior was judged unmutable — all eight produced
at least one clean, meaningful mutant.

## Classification of survivors

For each survivor below, "witness" is a concrete before/after diff captured by
running the actual mutated scratch binary (the `runWitnesses()` pass at the end of
`.swarm/runs/c064-sweep-moonjs.js`, whose output is the `=== WITNESS CAPTURE ===`
section of `c064-sweep-moonjs-out.txt`), either at a fixed, reproducible `now`
(`2026-08-16T19:22:13.533Z`, via the same
`Date`-override technique `test/regressions.test.js` already uses for its T-106
tests) or, for M20, at a `now` chosen so `nextFullMoon(now)` lands late enough in
the UTC day (`2026-06-30T00:00:00Z` → next full moon `2026-07-29T14:35:37.963Z`)
that a real UTC+14 zone crosses midnight.

### M1 — dropped `moon: ` stderr prefix — **HOLE**

Witness: `moon --bogus`, `TZ=UTC`, fixed now.
- baseline stderr: `moon: unknown option '--bogus' - run 'moon --help' to see the available options`
- mutant stderr: `unknown option '--bogus' - run 'moon --help' to see the available options`

The only stderr-shape test (`cli.test.js:302`, `an unknown flag exits 2 with a clean
one-line message on stderr`) asserts `assert.match(stderr, /unknown option '--bogus'/)`
— an unanchored regex that matches equally well with or without the `moon: `
prefix. No test anywhere in the suite anchors to `^moon:` or otherwise checks the
prefix. This is a real, deterministic gap on ordinary, contract-legal input (any
invalid invocation): a script that greps CLI stderr output for a `moon: ` prefix
(the conventional Unix "program-name: message" shape this file's own code
constructs) would silently stop matching.

### M8, M9, M11 — age / cycleFraction / julianDay precision widened — **HOLE** (×3, same root cause)

Witness (fixed now `2026-08-16T19:22:13.533Z`, TZ=UTC), field-by-field:
- age: baseline `4.073` → mutant (4 places) `4.0734`
- cycleFraction: baseline `0.1453` → mutant (6 places) `0.145301`
- julianDay: baseline `2461269.3071` → mutant (6 places) `2461269.307101`

`cli.test.js`'s single `--json` precision check (lines 82-85) only bounds
`illumination` (`decimals(...) <= 4`) and `phaseAngle` (`decimals(...) <= 3`). It
never reads `payload.age`, `payload.cycleFraction`, or `payload.julianDay` for
anything beyond key-presence (`key in payload`, line 74-76). `round()` itself is
private to `bin/moon.js` (not exported; `module.exports = { main, HELP }`) and no
other test file imports or exercises it. So for these three fields, precision
widening is unconditionally invisible — not a rare coincidence, a permanent gap:
every single real invocation of `moon --json` emits these three fields at whatever
precision `round()` is given, and nothing checks it.

### M17 — `--compact` ignored under `--block` — **HOLE**

Witness: `moon --block --compact`, TZ=UTC, fixed now.
- baseline: closed frame, no trailing `next full moon` line (8 lines total).
- mutant: identical frame, **plus** a trailing `   next full moon  28 Aug` line.

`test('--compact collapses to exactly one line...')` (cli.test.js:49) only ever
calls `run(['--compact'])` — never combined with `--block`. `test('--block draws a
closed frame')` (cli.test.js:171) only ever calls `run(['--block'])` — never
combined with `--compact`. `args.test.js` covers `parseArgs(['--block',
'--compact'])`'s *parsed shape* but never spawns the binary to check the resulting
*output*. No test in the suite ever invokes both flags together end-to-end. This is
a real, always-reachable combination (a user who wants a compact framed block) that
silently drops the "exactly one line" contract `--compact`'s own doc-comment in
`src/args.js` promises ("Suppresses the next-full-moon line, leaving exactly one
line of output").

### M20 — LOCAL vs UTC date accessors in `formatFullMoonDate` — **HOLE**

Witness: `now = 2026-06-30T00:00:00Z`, `TZ=Pacific/Kiritimati` (UTC+14; a real IANA
zone, the earliest civil time on Earth). `nextFullMoon(now)` = `2026-07-29T14:35:37.963Z`,
which in Kiritimati local time is `2026-07-30T04:35:37.963` — a different calendar day
than the UTC date.
- baseline (`getDate`/`getMonth`/`getFullYear`, i.e. LOCAL): `next full moon  30 Jul`
- mutant (`getUTCDate`/`getUTCMonth`/`getUTCFullYear`): `next full moon  29 Jul`

Every test in `cli.test.js` and `regressions.test.js` that reaches
`formatFullMoonDate` pins `TZ: 'UTC'` explicitly (`run()`'s default `tz` parameter,
never overridden for any date-formatting test — the only non-UTC `TZ` overrides in
the whole suite, `Australia/Sydney` and `America/New_York`, are used solely for
`detectHemisphere` tests, which don't touch date rendering). Under `TZ=UTC`, LOCAL
and UTC accessors are definitionally identical, so this mutant is invisible to the
entire suite by construction, regardless of how many times it's run. A real user in
any UTC+13/+14 zone (Kiritimati, Tonga, Chatham) near a full moon that falls late in
the UTC day will see the wrong calendar day.

### M23, M24 — `Math.round` → `Math.floor` / `Math.trunc` in `round()` — **HOLE** (low severity)

Witness (fixed now, TZ=UTC): baseline `illumination: 0.1943`; both mutants produce
`illumination: 0.1942` — a genuine, reproducible one-unit-in-the-last-place
difference, not a coincidence of this particular instant (see reasoning below).

`Math.trunc` and `Math.floor` are identical for the always-nonnegative reachable
domain (`illumination` ∈ [0,1], `age` ≥ 0, `phaseAngle` ∈ [0,360), `julianDay` > 0,
`cycleFraction` ∈ [0,1)), so these two mutants are the same finding measured twice.
No test in the suite compares any `--json` numeric field against an exact expected
value (see M8/M9/M11's analysis — the only checks are range and decimal-count).
Critically, unlike M7 below, this divergence is undetectable **whenever it exists**:
there is no decimal-count proxy that could accidentally catch a "round half up" vs
"round down" difference, because both produce the same number of decimal digits.
Concretely: this mutant is a true no-op only when the discarded fraction at the
target place is < 0.5 (round and floor agree); whenever it is ≥ 0.5 — which happens
for a genuine, algorithm-driven fraction of all real invocations, not a contrived
edge case — the output silently differs and nothing anywhere notices. Severity is
low (the difference is confined to the single least-significant printed digit,
arguably within the "precision the algorithm has actually earned" spirit the code
comment invokes), but it is a real, provable, non-indiscriminable divergence, so by
the task's own HOLE test ("observably different output for input the program can
actually receive, and no test notices") it qualifies. Flagged as low-priority.

### M25 — `10 ** places` → `places * 10` in `round()` — **HOLE** (highest severity of the sweep, despite being KILLED in the canonical run)

Fixed-now witness (`2026-08-16T19:22:13.533Z`, TZ=UTC), full payload comparison:
```
baseline: illumination 0.1943   age 4.073              cycleFraction 0.1453  phaseAngle 52.308  julianDay 2461269.3071
mutant:   illumination 0.2      age 4.066666666666666  cycleFraction 0.14    phaseAngle 52.3    julianDay 2461269.3
```
This is not a rounding nuance — it is a wrong scale factor. `round(x, 4)` now
quantizes to multiples of `1/40` instead of `1/10000` (and every other field's
`round(x, N)` is similarly broken per-field), so every numeric field in `--json` is
grossly wrong.

**Why the mutant table above says KILLED, not SURVIVED, for this run**: the sweep
was re-run to capture witnesses, and in that particular run's real wall-clock
`illumination`/`phaseAngle`, `phaseAngle`'s corrupted value (`round(x, 3)` now
divides by `f = 3 * 10 = 30`) happened to produce a JS `Number` whose shortest
decimal representation needed more than 3 digits, tripping `decimals(phaseAngle)
<= 3` — pure floating-point coincidence, not the check doing its job on purpose.
`1/30 = 0.0333...` does not terminate in decimal, so `Math.round(x * 30) / 30`
generally prints as a long, "ugly" decimal *unless* the rounded numerator happens
to be divisible by 3, in which case the 3 cancels and it prints short. Which case
occurs depends on the real angle at the instant the suite runs — this is exactly
the same underlying failure mode as M7 (a decimal-*count* check standing in for a
decimal-*value* check), just triggered from the opposite direction.

But **the `illumination` field's own check is unconditionally defeated by this
mutation, forever, independent of any coincidence**: `10 ** 4 = 10000` factors as
`2^4 * 5^4`, so `1/10000` always terminates in decimal — but so does `1/40` (`f = 4
* 10 = 40 = 2^3 * 5`), since 40's only prime factors are 2 and 5, the same as 10's.
Every multiple of `1/40` terminates within 3 decimal places, no exceptions. That
means `decimals(illumination) <= 4` — the check that exists specifically to bound
`illumination`'s precision — can *never* observe this mutation on the
`illumination` field by itself, for any real input, ever. The only reason the
canonical run shows KILLED is that the *same* mutant also corrupts `phaseAngle`
(a completely different field, checked by a completely different assertion), and
that corruption happened to be "noisy" this particular run. Rerunning the sweep at
a different real instant (an earlier run during this same investigation) found
M25 SURVIVED outright, with the fixed-now witness above showing why: at that
instant, `phaseAngle`'s corrupted value also happened to terminate short (`52.3`),
so nothing tripped.

Net effect: the `illumination` precision check is not testing what it appears to
test (it silently accepts a completely different, undocumented rounding grid), and
whether the overall mutant is caught at all is decided by an unrelated field's
floating-point noise, not by any check meaningfully validating either field. This
is the sweep's most convincing case that "the `--json` numbers are correct" is
currently an assumption, not a tested property — real value-level assertions
(`assert.equal` against a hand- or independently-computed expected number, not just
a decimal-count bound) would close this permanently.

### M7 (not a canonical-run survivor, but flagged) — illumination precision 4→5 — **BOUNDARY (with a documented tie condition), not counted as a confirmed HOLE**

M7 was **KILLED** in the canonical run recorded in `c064-sweep-moonjs-out.txt`
(caught by `cli.test.js:71`, same test that bounds `illumination` to ≤4 visible
decimals). It is included here because an earlier, non-canonical run of the same
harness recorded it as SURVIVED, and the difference is worth explaining rather than
silently discarding.

Proof: `decimals(n) = (String(n).split('.')[1] || '').length` measures the *visible*
decimal digits of a `Number`, and JavaScript's default `Number`→`String` conversion
drops trailing zeros. Whenever the true value, rounded to 5 places, has a 0 in the
5th place, `round(x, 5)` and `round(x, 4)` are the exact same `Number` (same
terminating decimal, same double bit pattern), so the mutant's JSON output is
byte-identical to the unmutated program's — a genuine no-op for that specific `now`,
not merely an untested one. That happens for roughly 1 in 10 real "now" instants (the
digit is close to uniformly distributed). Two independent live checks during this
sweep (`19:22:13Z` → `illum5 = 0.19429`, decimals = 5, correctly caught; a later
instant during interactive testing → `illum5` with a nonzero 5th digit, also
correctly caught) plus the canonical run's own KILLED result show the check does its
job the overwhelming majority of the time. This is the textbook shape of a BOUNDARY:
the test is silent exactly where the mutation is a true tie, not where it's a real,
unnoticed difference — it just happens to be a probabilistic tie condition rather
than a permanent structural one. Contrast this directly with M8/M9/M11, which have
*no* precision check for their fields at all and are therefore always silent,
regardless of the digit.

## Bottom line

Six distinct root causes across nine mutants (M8/M9/M11 share one cause, M23/M24
share another) are confirmed **HOLEs**, all with reproducible witnesses. Eight of
these nine were SURVIVED outcomes in the canonical run; the ninth, M25, was KILLED
in the canonical run by an unrelated field's floating-point coincidence, but its
own fixed-now witness proves the gap it targets (the `illumination` field's
precision check) is permanently, unconditionally blind to it — see M25's entry
above for the full argument:

1. **M1** — the `moon: ` stderr prefix on usage errors is never pinned (only the
   message body is checked with an unanchored regex).
2. **M8, M9, M11** — three of the five `--json` numeric fields (`age`,
   `cycleFraction`, `julianDay`) have no precision/rounding check at all; only
   `illumination` and `phaseAngle` are checked, and only for decimal *count*, never
   exact value.
3. **M17** — `--compact` is never verified in combination with `--block`; the guard
   that suppresses the next-full-moon line is silently absent from the `--block`
   branch in a mutant and nothing notices.
4. **M20** — `formatFullMoonDate`'s use of LOCAL vs UTC date accessors is untested
   under any non-UTC timezone; every date-formatting test in the suite pins
   `TZ=UTC`, so LOCAL/UTC accessor swaps are invisible by construction.
5. **M23/M24** — no test compares any `--json` numeric field against an exact
   expected value, so `round()`'s `Math.round` vs `Math.floor`/`Math.trunc` choice
   is unverified (low severity: confined to the last printed digit).
6. **M25** — the same missing-exact-value-check gap lets a badly wrong scale factor
   in `round()` (`places * 10` instead of `10 ** places`) corrupt every numeric
   `--json` field, including reintroducing raw floats, without detection. This is
   the most severe finding in the sweep.

M7 (illumination precision, 4→5 places) was KILLED in the canonical run and is
**not** counted as a HOLE; it is documented above because it is a genuine, provable
boundary case (a roughly 1-in-10 real-time tie window where the mutant's output is
byte-identical to the correct output) rather than a stable gap, and the honest thing
to do with a result that flips between runs is explain the flip, not silently keep
only the more dramatic one. The remaining 17 mutants (M2, M3, M4, M5, M6, M10, M12,
M13, M14, M14b, M15, M16, M18, M19, M21, M22, M26) were cleanly killed with no
run-to-run ambiguity, most by more than one independent test — a healthy sign for
the behaviors that already have dedicated regression coverage (help/json precedence,
hemisphere override order, both indent constants, the padStart/year-ternary pair,
the renderer-selection branch). The pattern across the confirmed holes is
consistent: everywhere the suite checks *shape* (keys present, decimal *count*, line
count) but not *exact value* or *flag combination*, a mutant that stays within the
checked shape survives — or, in M25's case, is caught only by accident, through a
different field's shape check.
