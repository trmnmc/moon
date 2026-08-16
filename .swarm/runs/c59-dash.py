#!/usr/bin/env python3
"""cycle 59 dashboard render (step 8).

In-place targeted substitution on runs/dashboard.html, carrying forward the
cycles 34-58 structure. Every anchor is asserted to match EXACTLY once; a miss
raises BEFORE anything is written, so the page is never left half-updated.

Note for future cycles: this file mixes raw U+00B7 middots and &middot; entities
within the SAME line (the c57 stat tiles use raw in tiles 1-2 and the entity in
tiles 3-4). Anchors must be taken from the bytes, not retyped.
"""
import os

P = "/opt/swarm/runs/dashboard.html"
h = open(P, encoding="utf-8").read()
n_edits = 0


def sub(old, new, label):
    global h, n_edits
    c = h.count(old)
    if c != 1:
        raise SystemExit(f"ANCHOR {label}: matched {c} times, expected 1")
    h = h.replace(old, new)
    n_edits += 1


# ── banner ────────────────────────────────────────────────────────────────
sub(
    '<div class="banner">cycle 58 · BUILD · T-148 FAILED gate on 1 of 11 figures — a correct number was '
    '&quot;corrected&quot; in the wrong time frame; reverted · 4 verified corrections kept · 147/147 · '
    'gear 1 (guest/trickle) · 708m to stop</div>',
    '<div class="banner">cycle 59 · BUILD · T-148 PASSED — Meeus 48.a reproduces 0.6801/0.6475 once TD→UT is '
    'applied, so REPORT.md was correctly left UNEDITED · backlog EMPTY 50/50, target NOT yet done · 147/147 · '
    'gear 1 (guest/trickle) · 691m to stop</div>',
    "banner",
)

# ── stat tiles (narrow anchors: this line mixes raw · and &middot;) ───────
sub('<b>57</b><span class="s">phase BUILD · 737m to stop · recycle 10/25</span>',
    '<b>59</b><span class="s">phase BUILD · 691m to stop · recycle 11/25</span>', "tile-cycle")
sub('k=1 · probe denied (6)', 'k=1 · probe denied (7)', "tile-pace")
sub('<b>147/147</b><span class="s">unchanged &middot; docs-only cycle</span>',
    '<b>147/147</b><span class="s">unchanged &middot; 0 shipped bytes changed</span>', "tile-tests")
sub('<b>49/50</b><span class="s">1 todo &middot; T-148 unblocked, closes must-have 4</span>',
    '<b>50/50</b><span class="s">0 todo &middot; empty — VALUE_LOOP scan next</span>', "tile-backlog")

# ── target header: bar + counts ───────────────────────────────────────────
sub('<div class="fill" style="width:98%"></div></div><p class="counts">49 / 50 backlog items done &middot; cycle 58</p>',
    '<div class="fill" style="width:100%"></div></div><p class="counts">50 / 50 backlog items done &middot; cycle 59</p>',
    "counts")

# ── journal one-liners: prepend c59, drop the 9th (c51) to stay at 8 ──────
sub('<ul class="journal"><li>cycle 58 —',
    '<ul class="journal"><li>cycle 59 — 2026-08-16T17:28:29Z — moon — BUILD — T-148 PASSES: 0.6801/0.6475 hold '
    'for every &Delta;T in [48,80]s; REPORT.md untouched; backlog empty</li><li>cycle 58 —',
    "journal-prepend")
sub('<li>cycle 51 — cycle 51 | 2026-08-16T14:10:16Z | moon | BUILD</li></ul>', '</ul>', "journal-trim")

# ── burn-up: append the c59 bar ───────────────────────────────────────────
sub('these seven."></span></div>',
    'these seven."></span>'
    '<span style="height:100%" title="c59 — 50/50 backlog items done; the backlog is now EMPTY. Basis: done '
    '&divide; backlog total, same as the c52..c58 bars. T-148 closed on its retry and nothing was filed, so the '
    'denominator held. NOTE: a full bar means the QUEUE is drained, not that the target is done — cycle 60 runs a '
    'VALUE_LOOP candidate scan before any DONE declaration. The bars left of c52 run on an earlier, undocumented '
    'denominator and are not continuous with these eight."></span></div>',
    "burnup")

# ── verification evidence: newest first ──────────────────────────────────
sub('<pre class="evidence">c58 <span class="pass">PASS</span>  node .swarm/runs/c58-gate-spread.js',
    '<pre class="evidence">'
    'c59 <span class="pass">PASS</span>  node .swarm/runs/c59-gate-48a.js -&gt; committed pair 0.6801/0.6475 holds '
    'for every &Delta;T in [48,80] s (a 32 s band); all three candidate &Delta;T sit 10-13 s inside it\n'
    'c59 <span class="pass">PASS</span>  node .swarm/runs/c59-gate-mutants.js -&gt; M1 elongation +0.01&deg;: illum '
    'moves, fake holds; M2 age +0.01 d: fake moves, illum holds; src/astro.js md5 restored byte-identical\n'
    'c59 <span class="pass">PASS</span>  git diff -- REPORT.md | wc -c -&gt; 0 — the figures reproduce, so the '
    'correct outcome is NO edit\n'
    'c59 <span class="pass">PASS</span>  node --test test/*.test.js -&gt; tests 147 / pass 147 / fail 0\n'
    'c59 <span class="note">NOTE</span>  builder&#x27;s NASA &Delta;T citation NOT verified (no network) — kept out '
    'of the load-bearing path by the 32 s band; reported as not-run, never as passed\n'
    'c58 <span class="pass">PASS</span>  node .swarm/runs/c58-gate-spread.js',
    "evidence")

with open(P + ".tmp", "w", encoding="utf-8") as f:
    f.write(h)
os.replace(P + ".tmp", P)
print("dashboard rendered,", n_edits, "anchors substituted,", len(h), "bytes")
