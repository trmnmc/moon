
### cycle 52 addendum — dashboard rendered, and one thing it now shows honestly

Rendered `runs/dashboard.html`: 12 live-region substitutions, every anchor assertion held.
32 timeline ticks, journal strip at 8 entries, evidence block carrying 4 c52 snippets ahead
of the 2 surviving c51 ones, counts 44/49 at cycle 52, fill 90%.

Two mechanical notes worth keeping, both about the render rather than the product:

**The anchor assertions earned their keep twice, once against me.** The render script asserts
an exact match count before every substitution — the guard that exists because a
hand-enumerated render keeps reaching the template's own legend copy instead of the live
markup. It fired three times this cycle. Once on a genuine near-miss (`<div class="fill"
style="width:88%">` and `<p class="counts">` each occur twice, live and in the legend
comment; the target-section edits were re-scoped to the region between the `<!-- TARGETS -->`
markers and spliced back). Once on a no-op I then dropped rather than risk (`<span
class="badge">BUILD</span>`, 3 occurrences, and the phase had not changed anyway). And once
on a bug in the guard itself: `String.match()` without the global flag returns capture groups
alongside the full match, so any anchor using a group counted as 2 and tripped its own
assertion. The counter now clones the regex with `g` before counting. The script writes the
file only at the very end, so all three throws left `dashboard.html` untouched — no partial
render was ever on disk.

**The burn-up strip's new bar is deliberately discontinuous with the ones left of it.** The
existing 31 bars run on a denominator that is not documented anywhere and that stopped moving
at 52% around cycle 47, while the backlog kept closing items. I could not reconstruct what
they measure. The honest options were to leave the strip frozen (implying no progress), to
append a plausible-looking 53% (a fabricated number, in a run whose entire premise is that
unsourced quantities are the defect), or to append the number I can actually compute and say
so. The new bar is 90% — 44/49 backlog items done, basis stated in its own `title` attribute,
including the sentence "this bar is not continuous with them". A visible seam that tells the
truth beats a smooth line that does not. The old bars are left untouched rather than
retroactively rewritten to a basis I would be guessing at.

This is cosmetic and touches nothing the product does. It is recorded because the same
instinct — make the chart look right — is the one this run exists to refuse.
