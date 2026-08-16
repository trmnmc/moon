
## cycle 55 — 2026-08-16T16:06:35Z — moon — BUILD

work: build-wave k=1 (T-146, S/test, sonnet) — close **L1**, the `lineArt` dark/hairline
threshold, the only confirmed HOLE across all three sweeps that produces wrong output on a
normal run of a stock host. outcome: **1 verified**, 1 test added, suite baseline 145 → 146,
0 reverted, 0 filed. This is the payoff cycle the three measurement sweeps existed to aim:
the first item this run that changes shipped behavior rather than measuring it.

gear 1 (crawl), guest mode, dial 0.3, k_cap 1. The real probe **was** due this cycle
(`now − last_real_probe_ts` = 3302 s ≥ 1800) and `RUNFILE=… bin/swarm-budget.sh` was
re-invoked — **DENIED by the Bash allowlist again** (KI-2, 8th consecutive cycle since 48).
`bin/swarm-notify.sh poll` was re-measured in the same cycle and denied likewise, so the
scope of the gap is unchanged and re-confirmed, not inherited. This WAS a real probe attempt,
so `probe_failures` 4 → **5** and `last_real_probe_ts` advances to 1786895933; next real
re-attempt due 1786897733. Gear held on fresh disk evidence: `runs/allocator.json`, restamped
by the 15:58:46Z pacer refresh, reads weekly_used_pct **100.0**, opus_used_pct 97,
week_elapsed_pct 92.25 (up from 91.95), posture trickle, allow_overall_pct 0,
allow_premium_pct 0, dial 0.30. `week_resets_at` 1786942800 **is** `stop_at`, so no later
richer window exists to save for. Guest clamps 1–3; the weekly governor ceiling is 1. Crawl
WITH evidence.

control: `runs/control.json` read directly (poll denied, documented non-fatal fallback) —
`pending[]` empty, `applied[]` empty, no `inject` array. Nothing to apply.

craft pack: `bin/swarm-craft.mjs` ran clean, `degraded: []`. Nothing from it was passed to
the builder and the item was NOT flagged `craft: "ui"`: `files_hint` is `test/`, moon is a
zero-dependency terminal CLI with no browser surface, and the pack's `ui` section is entirely
accent colors, border radii and animation easing. Passing it here would be noise.

post-merge checks (collision-scan, qa-verify look) SKIPPED with reason: the only merged file
is `test/render.test.js`. Nothing user-visible changed, and moon has no classic-script browser
surface for collision-scan to scan.

step-3 backlog hygiene ran (cycle 55 % 5 == 0, full SPEC.md re-read): 50 items, no duplicates,
no stale entries, 3 live todo — far under the ~30 cap, nothing to drop or reprioritize. The
full re-read also confirmed T-116, T-130 and T-139 are all `done`, so must-have 3 (the three
surviving items resolved or refused with evidence) is closed; must-have 4 (doc claims
re-verified) is what T-147/T-148 still owe.

### What L1 was, and what closes it

`src/render.js` limb selection, one line: `if (cover < 0.02) out += LIMB_DARK;`. Widen that
boundary to `0.05` and a genuinely lit hair-thin crescent is swallowed into the dark branch —
the disc reads as a fully dark new moon while the percent field still says `1%`. It survived
all 145 pre-existing tests.

The new test pins that one cell:

    test('renderLine: a hair-thin 0.65%-illuminated crescent still shows a hairline limb, not a dark disc', …)
    const hairThin = state('waxing crescent', 0.025725, 0.006517);
    assert.equal(renderLine(hairThin, 'north'), '░░░░▕   1%  waxing crescent');

### VERIFICATION EVIDENCE — T-146

The conductor authored and ran its own gate (`.swarm/runs/cycle-055-gate.js`, full output
`.swarm/runs/cycle-055-gate-out.txt`), independent of the builder's harness. Arm B was
deliberately run in a DIFFERENT form than the builder used — `test/render.test.js` checked
out at HEAD so the new test does not exist at all, rather than one assertion commented out.
That is the stronger reading of "removing the new assertion lets the mutation survive", and
it re-proves in the same pass that L1 genuinely survived the pre-existing battery.

Witness re-derived on the pristine tree, not taken on trust — and the divergence is a single
codepoint in column 5:

    truth  renderLine(f=0.025725, k=0.006517, north) = "░░░░▕   1%  waxing crescent"
    mutant renderLine(same input)                    = "░░░░░   1%  waxing crescent"
    DIVERGES: true
      truth  chars: 2591 2591 2591 2591 2595
      mutant chars: 2591 2591 2591 2591 2591
    fixture consistency: k=(1-cos 2pi f)/2 = 0.006517256 vs fixture 0.006517 (delta 2.56e-07)

Both arms, run under `--test-reporter=tap` so kills are attributable by name rather than by
a bare exit code:

    ARM A  mutation + new test present
    exit=1 tests=146 pass=145 fail=1
    failing tests (1):
      not ok 125 - renderLine: a hair-thin 0.65%-illuminated crescent still shows a hairline limb, not a dark disc

    ARM B  mutation + HEAD suite (new test absent entirely)
    exit=0 tests=145 pass=145 fail=0
    failing tests (0): (none — L1 survives without the new test)

Clean tree, and the mutation left nothing behind:

    exit=0 tests=146 pass=146 fail=0
    git diff --stat:  test/render.test.js | 12 ++++++++++++

    PASS  witness diverges under L1
    PASS  test asserts the TRUTH string
    PASS  ARM A red
    PASS  ARM A attributed to exactly the new test
    PASS  ARM B green (mutation survives pre-existing suite)
    PASS  ARM B ran the pre-existing 145 tests
    PASS  clean suite green at 146
    PASS  src/render.js unmodified at exit
    T-146 GATE: PASS

### One honest observation, deliberately not filed

The new assertion pins the WHOLE rendered line — disc, percent field and phase name — where
its neighbour two tests up decomposes with `litness(disc(...))`. The broad pin is what makes
it read cleanly, but it means an honest future change to the percent format would false-reject
here for a reason that has nothing to do with L1. It is recorded rather than filed: narrowing
a pin is not a HOLE, and this run's stated taste risk is churn wearing rigor's clothes.

### Backlog

T-146 → done. **47 done / 3 todo of 50.** Nothing filed — the spec forbids writing a test for
anything that is not a confirmed HOLE, and the HOLE ranking is now exhausted of items that
affect a stock host.

Also corrected in passing: `state.json.last_cycle` had been stale at cycle 52 through both
cycle 53 and 54 (each wrote its journal block but not that field). It now reads cycle 55.

Wave autotune: clean wave — 0 reverts, 0 failed verifies, builder ran its harness in the
foreground as instructed and restored `src/render.js` under try/finally without being caught
out. `wave_streak` 1 → 2 → promotion fires → `k_current` stays 5 (already at the hard max),
`wave_streak` resets to 0. Gear 1 caps the effective wave at 1 regardless.

next pick (cycle 56): **T-149** at priority 8 (S, test, sonnet) — make `test/args.test.js:22`
discriminating. It is the last test item and the last live piece of this run's "failable AND
attributable" must-have: the test asserts the right thing but its discriminating power is
zero, because under `node --test <file>` the ambient `process.argv.slice(2)` is `[]` and the
AA1 mutant coincidentally reproduces the truth's literal `[]`. The arm must therefore be run
from a process whose ambient argv is NON-empty, or it will prove nothing twice. After that,
T-147 (docs, haiku) then T-148, which it unblocks.

next wakeup: 1786896485 (+90s base, verified-value cycle, pacer-fired)
