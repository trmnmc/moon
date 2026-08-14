# T-121: KI-5 East Asian Width audit

Instrument: `.swarm/runs/cycle-024-eaw-audit.py` (stdlib-only Python 3, no network).
Run: `python3 .swarm/runs/cycle-024-eaw-audit.py` from repo root. Deterministic, exit 0.
UCD version used: `unicodedata.unidata_version` = 15.0.0 (Python 3.12.3).

## Predicate tested
Ramp: N=4 glyphs (from `SHADE.length`), strictly increasing fill-density, topping out at
density 1.0 (from `SHADE[-1]` = U+2588 FULL BLOCK). **NARROW** (KI-5's literal wording,
"a symmetric half-block pair"): ramp + one same-class LEFT/RIGHT pair at density 0.5.
**FULL** (what src/render.js actually needs): NARROW + a same-class pair at density 0.125
(matches HAIRLINE) + one more distinct same-class handed pair (matches ROUND_LIMB, a
shape pair with no fraction-of-cell density). All numbers are pulled from parsed source,
not assumed. FULL is wider than KI-5's prose; NARROW matches it exactly.

## Part 1 verdict: partition agrees with UCD
0 disagreements: all 8 documented Block-Element glyphs' Neutral/Ambiguous classes match
`unicodedata` exactly. The disc alphabet parsed out of src/render.js (SHADE, LIMB_DARK,
HAIRLINE, HALF, ROUND_LIMB) equals what test/render.test.js documents, both directions.
BOX (frame) was parsed and reported separately, excluded from disc comparisons. The two
round-limb glyphs the repo flags unclassified (U+25D6, U+25D7) are both **Neutral** — new
information this instrument establishes.

## Part 2 verdict: no viable set found, either predicate, either search
- **Search A** (Block Elements U+2580–U+259F only, KI-5's literal wording): NARROW and
  FULL both fail in both populated classes (Ambiguous, Neutral). **KI-5 is TRUE as
  literally worded.**
- **Search B** (+ Geometric Shapes + Symbols for Legacy Computing — justified: the
  renderer already draws ROUND_LIMB from Geometric Shapes, and Legacy Computing is the
  only other block with systematic sub-cell fill glyphs): NARROW and FULL both fail in
  all three populated classes (Ambiguous, Neutral, Wide). **Widening the pool does not
  rescue the claim.**
- Nearest misses, not "none found":
  - *Ambiguous*: ramp trivial (8 same-class steps 1/8..1); same-class hairline pair
    exists (U+258F/U+2595, 0.125). The 0.5 pair is the sole blocker: the only
    0.5-density LEFT/RIGHT pair anywhere searched is U+258C (Ambiguous)/U+2590
    (Neutral) — split exactly across classes. That one split pair is KI-5's mechanism.
  - *Neutral*: ramp never reaches 1.0. Block Elements tops out at 0.75; Legacy Computing
    raises it to 0.875 (U+1FB86) and no further — Unicode never assigned these families
    a distinct "fully filled" codepoint (it would duplicate FULL BLOCK, Ambiguous).
  - *Excluded by design*: U+25D0/U+25D1 (CIRCLE WITH LEFT/RIGHT HALF BLACK, Ambiguous)
    and U+25E7/U+25E8 (SQUARE WITH LEFT/RIGHT HALF BLACK, Neutral) are same-class L/R
    pairs suggesting ~half-fill, but are circle/square motifs, not literal fractional
    blocks, so the parser scores them "unknown", not 0.5 — a human relaxing "half-block"
    should look here first.

## What this does and does not establish
Establishes, against UCD 15.0.0, that the hand-typed partition is correct and the
documented disc alphabet matches src/render.js; and, by enumeration (not assertion) over
two predicates and two glyph pools, that no single-class satisfying set exists in the
ranges searched, with the exact blocking pair/density shown. Does **not** establish real
terminal behavior (UCD class is a Unicode property, not a per-terminal guarantee — some
terminals ignore EAW here). Does **not** prove impossibility over all of Unicode, only
the three justified ranges on Unicode 15.0.0 (Unicode 16's Octant symbols postdate this
`unicodedata` and were not checked). Densities come from character *names* via
conservative pattern matching, not measured ink coverage; unmatched names are left
"unknown" rather than guessed, which likely undercounts rather than overcounts candidates.
Mirror-pair discovery is name-based (LEFT↔RIGHT swap), not a pixel-level shape check.
