# T-146 — close L1 (lineArt dark/hairline boundary)

## Ranking recap

Cycle-52 sweep ranking: **L1 > HI1 > O3 > L3**. This item closes **L1 only**.

## Witness re-derivation

Recorded witness (cycle-52 sweep): `cycleFraction = 0.025725`, `illumination =
0.006517`, northern hemisphere → truth `░░░░▕   1%`, mutant (threshold moved
`< 0.02` → `< 0.05`) `░░░░░   1%`.

Re-derived against the current tree with `.swarm/runs/cycle-055-t146-witness.js`
(`renderLine` called directly, no astro.js involvement, matching the
render.js-only contract):

- **Pristine tree**, north: `"░░░░▕   1%  waxing crescent"` — matches the
  recorded truth exactly.
- **South**: `"▏░░░░   1%  waxing crescent"` (mirror, as expected).
- **With the L1 mutation applied** (`cover < 0.02` → `cover < 0.05` in
  `lineArt`, `src/render.js`), north: `"░░░░░   1%  waxing crescent"` —
  matches the recorded mutant exactly. South collapses to the same
  `"░░░░░"` under the mutation too (the boundary cell's cover, ~0.03–0.04,
  falls inside the widened `[0.02, 0.05)` dark band on both edges).

**The witness reproduces exactly.** src/render.js was restored
(`git checkout -- src/render.js`) immediately after this check, before any
test work began.

## The test

Added to `test/render.test.js`, immediately after the existing "a thin
crescent still shows a lit limb" test (same section, same style):

```js
test('renderLine: a hair-thin 0.65%-illuminated crescent still shows a hairline limb, not a dark disc', () => {
  // Edge case narrower than the one above: at cycleFraction 0.025725 /
  // illumination 0.006517 the outer cell's cover falls between 0.02 and
  // 0.05. lineArt's dark/hairline boundary is meant to be `cover < 0.02`
  // (src/render.js), so this cell must clear the LIMB_DARK branch and draw
  // the sunward hairline. A mutant that widens the threshold to
  // `cover < 0.05` swallows this cell into LIMB_DARK, and the whole disc
  // reads '░░░░░' — a fully dark new moon — even though the moon is lit.
  const hairThin = state('waxing crescent', 0.025725, 0.006517);
  assert.equal(renderLine(hairThin, 'north'), '░░░░▕   1%  waxing crescent');
});
```

**Why this assertion discriminates.** The existing "thin crescent" test at
2.4% illumination uses only `litness(...) > 0`, which is too coarse: at that
illumination the boundary cell's cover is well above 0.05, so widening the
threshold to 0.05 never touches it and that test stays green under the L1
mutation (this is exactly how L1 survived the original 145-test suite). The
new test instead picks a cover value that sits *inside* the 0.02–0.05 gap and
asserts the **exact rendered disc string**, so the single north-hemisphere
`assert.equal` is sufficient by itself to fail whenever `LIMB_DARK` is chosen
where a hairline should be — no compound conditions needed to trip it.

## Arm A — FAILABLE (new test present, L1 mutation applied)

Ran via `.swarm/runs/cycle-055-t146-arms.js`, `node --test
--test-reporter=tap test/*.test.js`. Full raw output captured in
`.swarm/runs/cycle-055-t146-arms-out.txt`.

Result: **RED**, exit status 1, exactly one failing test:

```
not ok 125 - renderLine: a hair-thin 0.65%-illuminated crescent still shows a hairline limb, not a dark disc
  ---
  ...
  error: |-
    Expected values to be strictly equal:
    + actual - expected

    + '░░░░░   1%  waxing crescent'
    - '░░░░▕   1%  waxing crescent'
  expected: '░░░░▕   1%  waxing crescent'
  actual: '░░░░░   1%  waxing crescent'
  operator: 'strictEqual'
```

```
# tests 146
# pass 145
# fail 1
```

The killing test is unambiguous: **`renderLine: a hair-thin
0.65%-illuminated crescent still shows a hairline limb, not a dark disc`**
(test #125), and no other test in the suite failed.

## Arm B — ATTRIBUTABLE (L1 mutation still applied, new assertion commented out)

With the L1 mutation still applied, the harness comments out only the new
test's `assert.equal(...)` line (the test body becomes a no-op), and reruns
the same TAP command.

Result: **GREEN**, exit status 0:

```
1..146
# tests 146
# pass 146
# fail 0
```

The mutation survives again once the new assertion is the only thing
removed — proving the Arm A kill belongs to this assertion, not to some
other test in the suite (playbook lesson L-029).

## Restoration

The harness restores both `src/render.js` and `test/render.test.js` to their
pre-run contents in a `finally` block regardless of outcome, so re-running
the script is idempotent and leaves no stray mutation.

Final `git diff --stat` on the working tree after all arms:

```
 test/render.test.js | 12 ++++++++++++
 1 file changed, 12 insertions(+)
```

`src/render.js` is byte-for-byte unchanged (not listed in the diff). The
only tracked change left behind is the new test in `test/render.test.js`.

## Clean-tree suite totals

```
ℹ tests 146
ℹ pass 146
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Deliverables

- `test/render.test.js` — new test added, uncommitted.
- `.swarm/runs/cycle-055-t146-witness.js` — witness re-derivation script.
- `.swarm/runs/cycle-055-t146-arms.js` — two-arm attribution harness
  (re-runnable independently; restores files itself).
- `.swarm/runs/cycle-055-t146-arms-out.txt` — raw captured output of both
  arms.
- `.swarm/runs/cycle-055-t146-report.md` — this report.
