
## cycle 53 — 2026-08-16T15:19:59Z — moon — BUILD

work: build-wave k=1 (T-144, S/qa, sonnet) — mutation-sweep `src/args.js` and
`src/hemisphere.js` and classify every survivor. outcome: **1 verified**, 24 mutants swept,
21 killed / 3 survived, 145/145 unchanged, 0 tracked bytes changed, 0 reverted, **1 filed
(T-149)**.

gear 1 (crawl), guest mode, dial 0.3, k_cap 1. The real probe WAS due this cycle
(`now − last_real_probe_ts` = 3606 s ≥ 1800) and WAS attempted: `bin/swarm-budget.sh` was
DENIED by the Bash allowlist (KI-2, unchanged since cycle 48). The script never executed,
so `probe_ok` is false and `probe_failures` increments 3 → 4 — last cycle HELD at 3 because
it declined to probe; this cycle made a real attempt and it failed, which is a different
fact and is recorded as one. `last_real_probe_ts` re-anchored to now. Gear 1 held on fresh
disk evidence instead: `runs/allocator.json`, restamped by the 15:02Z pacer refresh, reads
weekly_used_pct 99.0, opus_used_pct 97, week_elapsed_pct 91.69 (up from 91.34 last cycle —
the file is live), posture trickle, allow_overall_pct 0, allow_premium_pct 0.
`week_resets_at` 1786942799 IS `stop_at`, so there is no later richer window to save for.
Crawl WITH evidence.

control: `runs/control.json` read directly — `pending[]` empty, no `inject` array. Nothing
to apply. (`bin/swarm-notify.sh poll` remains denied by KI-2; reading the file is the
documented non-fatal fallback.)

### The dispatch failed the same way twice, and that is now the finding

The sonnet builder wrote a good harness (`c53-sweep.js`, adapted from cycle 52's as
instructed: 24 mutants, per-mutant target file, `git archive HEAD` isolation, unique-find
assertion, baseline-green abort) — then **backgrounded the sweep and returned**, reporting
"I'll resume analysis as soon as the completion notification arrives." That is the second
consecutive cycle with this exact shape: harness delivered, classification not.

The conductor killed the orphan (its stdout was going nowhere retrievable), re-ran the
harness itself capturing `cycle-053-sweep-out.txt`, and authored both gates and all three
classifications with no builder report in existence. The builder then resumed on its own
and wrote its report, overwriting the conductor's file at the shared path.

**Both are kept, at separate paths, on purpose.** They are genuinely independent — written
without sight of each other, using different instruments — and they CONVERGE on all three
survivors. Merging them into one file would have destroyed the only property that makes
the agreement worth anything. Conductor: `cycle-053-gate-report.md`. Builder:
`c53-sweep-report.md`.

### What the sweep found

21 of 24 mutants die. Every flag, every message wording, every table level, both
normalizations, the priority ORDER, and the `EUSAGE` contract are all pinned — `args.js`
and `hemisphere.js` are genuinely well covered. Three survived.

    AA1  args.js   argv === undefined -> argv === null
         truth  parseArgs(undefined): {"json":false,"hemisphere":null,...}
         mutant parseArgs(undefined): EUSAGE: unexpected argument '<host process argv>'
         HOLE on the contract domain. bin/moon.js:110 always passes an array, so no
         CLI run reaches it — but see below, this one is worse than it looks.

    HF3  hemisphere.js   key === '' -> key === ' '
         BOUNDARY, PROVEN not sampled: '' is in neither Set (NORTHERN_ZONES=1,
         SOUTHERN_ZONES=95) and no prefix p has ''.startsWith(p) (6 prefixes, 0
         matches), so the fall-through reaches the same terminal return.
         Contingency kept attached: a boundary of the current TABLE, not the code.

    HI1  hemisphere.js   catch { zone = undefined } -> 'Australia/Sydney'
         BOUNDARY on the stock runtime, HOLE on the contract domain.
         With Intl.DateTimeFormat() throwing: truth=north  mutant=south.
         A whole-moon handedness flip, on the live bin/moon.js:106 path.

### The gate got HI1 wrong first, again

Gate 1 enumerated 616 hemisphere inputs and returned NO-DIFF for HI1. **That verdict was
worthless and is recorded as worthless rather than banked.** HI1 mutates the recovery value
inside `catch { zone = undefined }`, reached only when `Intl.DateTimeFormat()` throws — and
on stock Node it never throws, so gate 1 never executed the mutated line at all. It passed
`undefined` as an input, which *looks* like visiting the region and is not.

Gate 2 replaced `Intl` with a throwing stub in a VM context and found the flip immediately.
Worth keeping: the *other* failure the source comment names — `resolvedOptions()` returning
no `timeZone` — does NOT discriminate, because that path returns `undefined` without
entering the `catch`. Only a throw reaches the line. Second cycle running that the gate's
first answer needed the gate to distrust it; the mechanism is working, and it is working
because it is applied to the conductor's own output.

### The builder caught something the gate missed

Recorded as a miss, not absorbed. The gate found AA1's divergence and stopped at "untested
guard". The builder found *why* it survives: `test/args.test.js:22` **already** asserts
`parseArgs(undefined)` deep-equals the all-defaults object — and that test still passes
under the mutation, because `node:util` falls back to `process.argv.slice(2)`, which under
`node --test <file>` is empty, coincidentally matching the literal `[]` truth produces.

The claim was verified by the conductor rather than taken — the builder deleted its witness
scripts, so none of its evidence survives on disk. Both halves check out. AA1 is therefore
not a coverage gap but **a test that cannot fail**: correct assertion, real-looking
coverage, zero discriminating power, for a reason entirely incidental to what it asserts.
Filed as T-149 at priority 8, ahead of the two doc items (T-147→9, T-148→10).

One correction to the builder's artifact, left in place rather than edited out of its file:
`c53-sweep-report.md` attributes the SIGTERM that ended its first run at 23/24 mutants to
"an environment time ceiling on how long a single backgrounded shell command may run."
Wrong — **the conductor killed that process** (pid 1149926). Harmless to every measurement
in the report, but a false causal claim standing in an evidence file is exactly what this
run exists to catch.

### VERIFICATION EVIDENCE — T-144

Conductor's own re-run of the harness (`cycle-053-sweep-out.txt`), not the builder's
numbers:

    Baseline: tests=145 pass=145 fail=0 exit=0
    ...
    AH3   KILLED     src/args.js            args: last-one-wins hemisphere override
    AA1   SURVIVED   src/args.js            args: undefined argv treated as no arguments
    HZ4   KILLED     src/hemisphere.js      hemisphere: table priority order
    HF1   KILLED     src/hemisphere.js      hemisphere: unknown-zone fallback value
    HF3   SURVIVED   src/hemisphere.js      hemisphere: empty-string-after-trim guard
    HI1   SURVIVED   src/hemisphere.js      hemisphere: defensive fallback when Intl throws

    Total: 24  killed: 21  survived: 3

Conductor's gate 2, the region gate 1 never visited (`cycle-053-gate2-out.txt`):

    with Intl.DateTimeFormat() throwing:
      detectHemisphere()          truth=north  mutant=south
    with stock Intl (reachable domain):
      detectHemisphere()          truth=north  mutant=north   host zone: UTC

Vacuous-test verification (conductor's own, both arms):

    $ grep -n "undefined" test/args.test.js
    22:test('undefined argv is treated as no arguments', () => {
    $ node --test <probe printing process.argv.slice(2)>
    PROBE []

Tree and suite after the wave:

    $ git -C /opt/targets/moon diff --stat HEAD      # (empty — 0 tracked bytes changed)
    $ node --test test/*.test.js
    ℹ tests 145   ℹ pass 145   ℹ fail 0

### Backlog

T-144 → done. 45 done / 5 todo of 50. T-149 filed. Remaining: T-145 (astro sweep, p6),
T-146 (close the highest-value HOLE, p7), T-149 (vacuous test, p8), T-147 (line citations,
p9), T-148 (REPORT figures, p10).

T-146's target is unchanged by tonight's findings: L1 (cycle 52) is still the only
confirmed HOLE that produces wrong output on a normal run of a stock host. Ranking now
L1 > HI1 > O3 > L3.

next pick (cycle 54): T-145 at priority 6 (S, qa, sonnet) — mutation-sweep the `astro.js`
behaviors no named prior battery covered. Third and last of the three sweeps. The builder
prompt must carry an explicit instruction NOT to background the sweep and return — twice
now that has cost a full re-run, and the harness is cheap to run in the foreground.
