# T-143 — mutation sweep of `src/render.js`, with every survivor classified

Cycle 52, 2026-08-16. Improvement run 2.

**Provenance, stated plainly.** The mutant catalogue and sweep harness
(`c52-sweep.js`) were authored by the build agent. The agent did not deliver a
classification of the survivors — its dispatch ended with a truncated,
off-topic return, and its draft discriminator (`_scratch-discriminate.js`,
kept for the record) sweeps ~400k full block renders per survivor, which does
not terminate in usable time. The conductor therefore re-ran the sweep
independently and authored the classification itself, in two gate scripts
(`cycle-052-gate.js`, `cycle-052-gate2.js`). Every number below is from a
command the conductor ran; none is taken from the agent's word.

## Baseline

    $ node --test test/*.test.js          (pristine tree, before any mutation)
    tests 145 / pass 145 / fail 0 / cancelled 0 / skipped 0 / todo 0

The harness re-established the same baseline inside its own throwaway copy
(`Baseline: tests=145 pass=145 fail=0 exit=0`) and aborts the sweep if the
pristine copy is not green, so a red baseline can never be mistaken for a
killed mutant.

Shipping tree after the whole exercise: **byte-unchanged**. `git status
--porcelain` reports only new untracked files under `.swarm/runs/`. No `src/`,
`test/`, `bin/` or doc file was touched — as required of a measurement item.

## Method

Each mutant is one exact-string substitution applied to a **pristine** copy of
`src/render.js` (never chained onto another mutant), inside a fresh
`git archive HEAD` snapshot in `/tmp`. The find string must occur exactly once
or the harness aborts, so every mutant provably lands where its label says.
The full suite then runs in that copy.

- **KILLED** — suite goes red. The behavior is protected.
- **SURVIVED** — suite stays 145/145. The behavior is unprotected *by this
  suite*, and is then classified.

## Sweep table — 26 mutants, 19 killed, 7 survived

| id | behavior | mutation | verdict | red files |
|---|---|---|---|---|
| D1 | disc glyph, `lineArt` interior ramp | `Math.round` → `Math.floor` | KILLED | regressions, render |
| D2 | disc glyph, `lineArt` interior ramp | `SHADE.length-1` → `SHADE.length` | KILLED | regressions, render |
| D3 | disc glyph, `blockArt` cell ramp | `Math.round` → `Math.floor` | KILLED | regressions, render |
| D4 | disc glyph, `blockArt` cell ramp | `SHADE.length-1` → `SHADE.length-2` | KILLED | regressions, render |
| L1 | limb, dark/hairline threshold | `cover < 0.02` → `< 0.05` | **SURVIVED** | — |
| L2 | limb, hairline/half threshold | `cover < 0.3` → `< 0.35` | KILLED | regressions |
| L3 | limb, half/round-limb threshold | `cover < 0.88` → `< 0.95` | **SURVIVED** | — |
| L4 | limb, sunward handedness | `waxing ? 'right' : 'left'` flipped | KILLED | regressions, render |
| L5 | limb, `ROUND_LIMB` positional choice | `c === 0 ? 'left' : 'right'` swapped | KILLED | regressions, render |
| F1 | frame, `BOX` glyphs | `tl: '┌'` → `'╔'` | KILLED | regressions, render |
| F2 | frame, `BLOCK_INNER` width | leading `2` → `1` | KILLED | regressions, render |
| F3 | frame, art padding | `floor`/`ceil` swapped left↔right | **SURVIVED** | — |
| F4 | frame, detail-row gutter | two spaces → one | KILLED | regressions, render |
| F5 | frame, row structure | blank separator row dropped | KILLED | regressions, render |
| P1 | percent, rounding | `Math.round` → `Math.floor` | KILLED | regressions, render |
| P2 | percent, clamp upper bound | `clamp(…, 0, 1)` → `0, 1.5` | **SURVIVED** | — |
| P3 | percent, field width | `ILLUM_WIDTH` 4 → 3 | KILLED | regressions, render |
| P4 | percent, `%` suffix | suffix dropped | KILLED | regressions, render |
| H1 | mirroring, `mirrorArt` | `reverse()` removed | KILLED | regressions, render |
| H2 | mirroring, `MIRROR` map | `▌`/`▐` pair dropped | KILLED | regressions, render |
| H3 | mirroring, `renderLine` south test | `===` → `!==` | KILLED | regressions, render |
| H4 | mirroring, `renderBlock` south test | `===` → `!==` | KILLED | regressions, render |
| O1 | `opticalState` waxing boundary | `f < 0.5` → `f <= 0.5` | **SURVIVED** | — |
| O2 | `opticalState` fraction wraparound | `f -= Math.floor(f)` removed | **SURVIVED** | — |
| O3 | `blockArt` hairline rescue | `cover > 0.02` → `> 0.05` | **SURVIVED** | — |
| O4 | `blockArt` presence masking | `presence < 0.5` → `< 0.3` | KILLED | regressions, render |

All five behaviors the acceptance names are covered: disc glyph selection
(D1–D4), limb selection (L1–L5), frame closure (F1–F5), percent formatting
(P1–P4), hemisphere mirroring (H1–H4), plus four optional probes (O1–O4).

## Classification of the 7 survivors

Two domains were searched, because they answer different questions:

- **COUPLED** — the physically reachable cycle, `f ∈ [0,1)` with
  `k = (1 − cos 2πf)/2`. This is what `astro.js` actually emits. A witness here
  is a defect a real user can see.
- **DECOUPLED** — `render.js`'s declared contract domain, illumination and
  cycleFraction as independent inputs. The module header states it is built to
  be tested against hand-constructed fixtures, so this domain is reachable by
  the suite's own idiom.

`CONTRACTS.md` declares both `cycleFraction` and `illumination` to be `0 .. 1`.
Anything found outside those ranges is off-contract: unreachable from
`astro.js`, but reachable from a fixture.

### HOLE — observably wrong on the physically reachable cycle (3)

These are real coverage gaps. Each witness is on the coupled cycle, so a user
running the CLI at that moment sees the mutant's output.

**L1** — dark/hairline threshold, `cover < 0.02` → `< 0.05`.
Witness `cycleFraction=0.025725, illumination=0.006517`, north:

    truth : "░░░░▕   1%  waxing crescent"
    mutant: "░░░░░   1%  waxing crescent"

The hairline that shows a one-percent crescent *is lit at all* vanishes; the
row becomes indistinguishable from new moon. Nothing in 145 tests notices.

**L3** — half/round-limb threshold, `cover < 0.88` → `< 0.95`.
Witness `cycleFraction=0.13075, illumination=0.159448`, north:

    truth : "░░░░◗  16%  waxing crescent"
    mutant: "░░░░▐  16%  waxing crescent"

The round limb — the glyph that makes the edge read as a moon rather than a
block — degrades to a half block across a band of the crescent.

**O3** — `blockArt` hairline rescue, `cover > 0.02` → `> 0.05`.
Witness `cycleFraction=0.013333, illumination=0.001754`, north, `renderBlock`
row 3:

    truth : "│          ░░░░░░░░░░░▕          │"
    mutant: "│          ░░░░░░░░░░░░          │"

This is the rescue whose own source comment explains why it exists — "this row
would otherwise read as new". The comment is right and the suite does not
enforce it.

**These three are one finding, not three.** Every mutation of the interior
shade ramp (D1–D4), the handedness (L4, L5), the mirroring (H1–H4), the frame
(F1, F2, F4, F5), the percent field (P1, P3, P4) and the presence mask (O4) is
killed — often by two files at once. What is *not* pinned anywhere is the
**numeric threshold cascade that selects the outer-cell limb glyph at thin
crescents**: `0.02` and `0.88` in `lineArt`, `0.02` in `blockArt`'s rescue. The
one threshold that is pinned, `0.3` (L2), is pinned by `regressions.test.js`
alone. The suite tests *which glyph family* is chosen and *which side* it lands
on, but not *where the boundaries between families sit* — and thin crescents,
where those boundaries live, are the visually most fragile part of the render.

Ranked by what a user would actually notice: **L1** (a lit crescent reads as
new — a wrong answer, which this product's whole pitch says is worse than no
answer), then **O3** (same defect in the framed block), then **L3** (the limb
looks blockier over a band of the cycle — ugly, not wrong).

### BOUNDARY — proven, not merely unwitnessed (1)

**F3** — `floor`/`ceil` swapped between the left and right art padding.
Settled by arithmetic rather than by search:

    LABEL_WIDTH=12  NAME_WIDTH=15  VALUE_WIDTH=16
    BLOCK_INNER = 2 + 12 + 16 + 2 = 32   BLOCK_COLS = 12
    pad = (32 − 12) / 2 = 10
    Math.floor(10) = Math.ceil(10) = 10   →  the swap is a no-op for ALL inputs

There is nothing to test: the two expressions are the same number. Recorded
honestly with its own caveat — this is a boundary of the *current widths*, not
of the code. Should `BLOCK_INNER − BLOCK_COLS` ever turn odd, `F3` becomes a
live defect with no test standing behind it.

### BOUNDARY on the reachable domain, HOLE on the contract domain (3)

These three cannot be reached from `astro.js`, so no user sees them. But each
is observably different for inputs the module's own contract admits, and in
each case the mutated line **is a guard whose guarding behavior is what goes
untested**. Calling them clean BOUNDARYs would overstate the result; calling
them HOLEs would overstate the impact. Both halves are on record.

**O1** — `f < 0.5` → `f <= 0.5`. Differs only at `cycleFraction` exactly `0.5`.
On the coupled cycle `f = 0.5` forces `k = 1`, a fully lit disc that is its own
mirror image, so truth and mutant are identical at the one reachable point
(verified: `truth === mutant` at `cf=0.5, k=1`). Decoupled, 10 witnesses, and
the difference is a full handedness flip:

    cf=0.5 k=0.2 north   truth : "◖▒░░░  20%  waxing crescent"
                         mutant: "░░░▒◗  20%  waxing crescent"

**O2** — wraparound `f -= Math.floor(f)` removed. Differs only for
`cycleFraction` outside `[0,1)`; 6 witnesses there, again a handedness flip:

    cf=1.25 k=0.75 north  truth : "░▓██◗  75%  waxing crescent"
                          mutant: "◖██▓░  75%  waxing crescent"

The removed line is precisely the normalization that makes an out-of-range
fraction safe. Nothing tests that it does its job.

**P2** — `clamp(…, 0, 1)` → `clamp(…, 0, 1.5)`. Differs only for
`illumination > 1`; 5 witnesses:

    k=1.01  truth="… 100% …"  mutant="… 101% …"
    k=1.2   truth="… 100% …"  mutant="… 120% …"
    k=100   truth="… 100% …"  mutant="… 150% …"

The clamp's entire purpose is to stop a nonsense illumination from printing a
nonsense percent, and that purpose is unverified. (The clamp's *lower* bound is
also unexercised by any mutant here; probed directly, truth renders `0%` at
`k=−0.5` and `k=−0.01`, so the lower guard does work — it is simply untested
too.)

## Summary

    26 mutants   19 KILLED   7 SURVIVED

    HOLE (reachable, user-visible)          3   L1, L3, O3
    BOUNDARY (proven no-op)                 1   F3
    BOUNDARY reachable / HOLE on contract   3   O1, O2, P2
    UNDECIDED                               0

The headline: `src/render.js` is the most-scrutinized file in this repo, and
the sweep still found a coherent unprotected surface — the limb-glyph threshold
cascade at thin crescents — where a lit moon can render as new and no test
objects. That is the premise of this run's spec confirmed by measurement rather
than by assertion: a well-tested file is where an unnoticed regression hides
behind the assumption of coverage.

Input to T-146: the highest-value confirmed HOLE is **L1**, with **O3** as the
same defect on the block surface. T-146's "if every survivor classified
BOUNDARY" fallback does not apply.

## Files

- `c52-sweep.js` — the sweep harness (agent-authored, conductor-re-run)
- `cycle-052-sweep-out.txt` — full sweep output, conductor's run
- `cycle-052-gate.js` / `cycle-052-verify-T-143.txt` — conductor gate part 1, two-domain witness search
- `cycle-052-gate2.js` / `cycle-052-verify-T-143-part2.txt` — conductor gate part 2, the regions part 1 could not see
- `_scratch-discriminate.js` — the agent's undelivered draft, kept for the record
