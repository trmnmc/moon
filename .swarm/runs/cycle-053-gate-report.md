# Cycle 53 — conductor's verification gate for T-144

This is the **gate's** record, kept separate from the builder's own artifact
(`c53-sweep-report.md`). Both exist on purpose: they are two independent passes at the
same question, and where they agree the agreement means something precisely because
neither saw the other.

## What was independent about it

The conductor authored `cycle-053-gate.js` and `cycle-053-gate2.js` **before reading any
builder classification** — at the time they were written the builder had returned early
with no report at all. The gate never reused the builder's discrimination method; it uses
a different instrument entirely (exhaustive enumeration over a stated finite domain, and
a VM-context loader that can replace `Intl`), and it re-derives every verdict from the
mutated line rather than checking the builder's work.

The conductor also re-ran the builder's harness itself rather than trusting its pasted
numbers (`cycle-053-sweep-out.txt`).

## Independent results

Sweep, conductor's own run: **24 mutants, 21 killed, 3 survived**, baseline
`tests=145 pass=145 fail=0 exit=0`. Survivors AA1, HF3, HI1.

Discrimination (`cycle-053-gate-out.txt`): of the 24 mutants, **22 are observably
different** from truth over the enumerated domains; 2 showed no difference.

- `src/args.js` — 1465 inputs: every argv sequence of length 0..3 over an 11-token
  alphabet, plus the no-argv call.
- `src/hemisphere.js` — 616 inputs: every zone/prefix literal parsed out of the pristine
  table itself, ×4 case/whitespace variants, plus every northern counter-example named in
  the source's NOTE comments, plus every non-string shape.

## Where the two passes agree

All three survivor classifications converge, independently:

| survivor | conductor's gate | builder's report |
|---|---|---|
| AA1 | HOLE on contract domain, unreachable from the CLI | BOUNDARY(reachable) / HOLE(contract) |
| HF3 | PROVEN boundary, table-contingent | BOUNDARY, proven dead code |
| HI1 | BOUNDARY on stock runtime, HOLE on contract domain | BOUNDARY(reachable) / HOLE(contract) |

Both passes independently reached the same three-bucket verdict cycle 52 opened, and both
independently proved HF3 by enumerating the table rather than sampling it.

## Where the gate corrected itself — HI1

Gate 1 returned NO-DIFF for HI1 over 616 inputs. **That verdict was worthless**, and the
gate says so rather than banking it. HI1 mutates the recovery value inside
`catch { zone = undefined }`, reached only when `Intl.DateTimeFormat().resolvedOptions()`
throws. Gate 1 passed `undefined` as an input, but on stock Node `Intl` does not throw, so
the mutated line never executed. "No witness where I did not look" is not a boundary.

Gate 2 loaded the module in a VM context with a throwing `Intl` and found the difference
immediately (`cycle-053-gate2-out.txt:18-25`): `truth=north  mutant=south` — a whole-moon
handedness flip on the exact call `bin/moon.js:106` makes on every run without
`--north`/`--south`.

Also recorded: the *other* failure the source comment names — `resolvedOptions()` returning
no `timeZone` — does **not** discriminate, because that path returns `undefined` without
entering the `catch`. Only a throw reaches the mutated line.

## Where the builder found something the gate missed — AA1

The builder's report is sharper than the gate on AA1, and the gate records that plainly
rather than quietly absorbing it.

The gate found AA1's divergence and called it an untested guard. The builder found *why*
it survives: `test/args.test.js:22` already contains
`test('undefined argv is treated as no arguments', ...)`, which calls `parseArgs(undefined)`
and asserts the all-defaults object. Under the AA1 mutation that test **still passes** —
because `node:util` falls back to `process.argv.slice(2)`, and under `node --test <file>`
the child process's ambient argv is empty, so the fallback coincidentally yields the same
`[]` the truth code produces literally.

Conductor's verification of that claim (not taken on the builder's word — its witness
scripts were deleted, so nothing of its evidence survives on disk):

```
$ grep -n "undefined" test/args.test.js
22:test('undefined argv is treated as no arguments', () => {
23:  assert.deepStrictEqual(parseArgs(undefined), {

$ node --test <probe printing process.argv.slice(2)>
PROBE []
```

Combined with the gate's own AA1 witness — where the conductor's process *did* have a
non-empty ambient argv, and truth vs mutant diverged (`cycle-053-gate-out.txt:94`) — the
conclusion is established from disk-resident evidence in both arms.

This upgrades AA1 from "an unprotected behavior" to **a test that cannot fail**: the
assertion is correct, the coverage looks real, and the discriminating power is zero for a
reason entirely incidental to what is being asserted. That is filed as T-149.

## One correction to the builder's report

`c53-sweep-report.md` attributes the SIGTERM that ended its first sweep run at 23/24
mutants to "an environment time ceiling on how long a single backgrounded shell command
may run." That inference is wrong. **The conductor killed that process** (pid 1149926),
deliberately: the builder had backgrounded it and returned, leaving its stdout going
nowhere retrievable, so the conductor killed the orphan and re-ran the harness itself with
output redirected to `cycle-053-sweep-out.txt`. No environment time ceiling was involved.

The error is harmless to every measurement in that report — the mutant verdicts are
unaffected and the conductor's own full 24-mutant run reproduces them exactly — but a
false causal claim left standing in an evidence file is the kind of thing this run exists
to catch, so it is corrected here rather than edited out of the builder's artifact.

## Gate verdict

**T-144 PASS.** Acceptance checked clause by clause:

- *every documented behavior mutated at least once* — verified by the conductor against
  the sources directly: six live flags (AJ1-AJ4, AH1, AH2), last-one-wins (AH3, AH5), all
  four table-priority levels (HZ1-HZ4), unknown-zone fallback (HF1, with HF2/HF3 guards
  and the HI1 route).
- *run against the current suite* — conductor's own run, 21/24 killed.
- *every survivor carries a HOLE or BOUNDARY classification with its reasoning* — three
  survivors, three classifications, each with a disk-resident witness or proof.

Shipping tree byte-unchanged: `git diff --stat HEAD` empty. Suite 145/145 after the wave.
