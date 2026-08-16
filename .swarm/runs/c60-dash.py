#!/usr/bin/env python3
"""cycle 60 dashboard render (step 8).

Same in-place targeted-substitution shape as c59-dash.py: every anchor must match
EXACTLY once or the script raises BEFORE writing, so the page is never left half
updated. Anchors are taken from the file's bytes (the tile line mixes raw U+00B7
middots with &middot; entities on the SAME line).
"""
import os

P = "/opt/swarm/runs/dashboard.html"
h = open(P, encoding="utf-8").read()
n_edits = 0


def sub(old, new, label):
    global h, n_edits
    c = h.count(old)
    if c != 1:
        raise SystemExit("ANCHOR %s: matched %d times, expected 1" % (label, c))
    h = h.replace(old, new)
    n_edits += 1


# ── banner ────────────────────────────────────────────────────────────────
sub(
    '<div class="banner">cycle 59 · BUILD · T-148 PASSED — Meeus 48.a reproduces 0.6801/0.6475 once TD→UT is '
    'applied, so REPORT.md was correctly left UNEDITED · backlog EMPTY 50/50, target NOT yet done · 147/147 · '
    'gear 1 (guest/trickle) · 691m to stop</div>',
    '<div class="banner">cycle 60 · VALUE_LOOP · inline PLAN on an empty backlog — 2 candidates filed '
    '(T-150 stale “# 145 tests”, T-151 KI-5 self-check), CI nice-to-have closed on 5 green Actions runs · '
    '0 items verified, no_value 1 · 147/147 · gear 1 (guest/trickle) · 665m to stop</div>',
    "banner",
)

# ── stat tiles (narrow anchors: this line mixes raw · and &middot;) ───────
sub('<b>59</b><span class="s">phase BUILD · 691m to stop · recycle 11/25</span>',
    '<b>60</b><span class="s">phase VALUE_LOOP · 665m to stop · recycle 12/25</span>', "tile-cycle")
sub('k=1 · probe denied (7)', 'k=1 · probe not due (7)', "tile-pace")
sub('<b>147/147</b><span class="s">unchanged &middot; 0 shipped bytes changed</span>',
    '<b>147/147</b><span class="s">unchanged &middot; planning cycle, no code touched</span>', "tile-tests")
sub('<b>50/50</b><span class="s">0 todo &middot; empty — VALUE_LOOP scan next</span>',
    '<b>50/52</b><span class="s">2 todo &middot; T-150 + T-151, both docs/S</span>', "tile-backlog")

# ── crew stations (last refreshed at c57 — two cycles stale) ─────────────
sub('<span class="who"><b>The Conductor</b><i>Re-read all 14 cited lines itself instead of trusting the '
    'builder&#x27;s VERIFIED-FRESH list, and caught two things a green suite could not: a true citation '
    'deleted as &quot;malformed&quot;, and a corrected count left sitting under an argument that '
    'contradicted it.</i></span><span class="chip">2 repairs at the gate</span>',
    '<span class="who"><b>The Conductor</b><i>Took the planner&#x27;s three verdicts as claims and re-ran '
    'every premise. Went further than the agent on the CI one: it read the workflow file, which cannot catch '
    'a bad action pin, so the live runs were checked instead — 5 consecutive green.</i></span>'
    '<span class="chip">closed on live evidence</span>', "station-conductor")
sub('<span class="who"><b>The Scribe</b><i>Left REPORT.md&#x27;s stale <code>145/145</code> untouched rather '
    'than hand-editing it to 147 — a captured figure edited by hand stops being evidence. Pinned it into T-148 '
    'to be fixed by rerunning the suite.</i></span><span class="chip">refused a tidy lie</span>',
    '<span class="who"><b>The Planner</b><i>Filed 2 items and refused to pad to 4. Named the trap in T-150 '
    'itself: REPORT.md:6 and :55 are run-scoped counts that are TRUE at 145 — dragging them to today&#x27;s '
    'number would be falsifying history to reach agreement.</i></span><span class="chip">2 filed, 0 padding</span>',
    "station-scribe")

# ── target header: bar + counts ───────────────────────────────────────────
sub('<div class="fill" style="width:100%"></div></div><p class="counts">50 / 50 backlog items done '
    '&middot; cycle 59</p>',
    '<div class="fill" style="width:96%"></div></div><p class="counts">50 / 52 backlog items done '
    '&middot; cycle 60</p>', "counts")

# ── journal one-liners: prepend c60, drop the 9th (c52) to stay at 8 ──────
sub('<ul class="journal"><li>cycle 59 —',
    '<ul class="journal"><li>cycle 60 — 2026-08-16T17:46:49Z — moon — VALUE_LOOP — inline PLAN: T-150 + T-151 '
    'filed, CI + known-issues-table nice-to-haves closed on evidence, 0 verified</li><li>cycle 59 —',
    "journal-prepend")
sub('<li>cycle 52 — cycle 52 | 2026-08-16T14:27:23Z | moon | BUILD — T-143 sweep, 3 reachable HOLEs</li></ul>',
    '</ul>', "journal-trim")

# ── burn-up: append the c60 bar ───────────────────────────────────────────
sub('these eight."></span></div>',
    'these eight."></span>'
    '<span style="height:96%" title="c60 — 50/52 backlog items done. The bar DROPS from full because the '
    'VALUE_LOOP scan filed 2 new items (T-150, T-151); the denominator grew while the numerator held. Same '
    'basis as the c52..c59 bars: done &divide; backlog total. A planning cycle verifies nothing by '
    'construction, so no bar movement here means value delivered."></span></div>',
    "burnup")

# ── verification evidence: newest first, keep the last three cycles ──────
sub('<pre class="evidence">c59 <span class="pass">PASS</span>  node .swarm/runs/c59-gate-48a.js',
    '<pre class="evidence">'
    'c60 <span class="note">NOTE</span>  planning cycle — NOTHING was claimed done, so none of the checks below '
    'is a done-gate; they verify the PLAN&#x27;s premises before anything reached the backlog\n'
    'c60 <span class="pass">PASS</span>  node --test test/*.test.js -&gt; tests 147 / pass 147 / fail 0 (baseline)\n'
    'c60 <span class="pass">PASS</span>  grep -n REPORT.md -&gt; :212 &quot;node --test test/*.test.js    # 145 '
    'tests&quot; vs a suite that runs 147 — T-150 premise CONFIRMED; :6 and :55 are run-scoped and TRUE at 145\n'
    'c60 <span class="pass">PASS</span>  sed -n 205,224p README.md -&gt; KI-5 explains via Neutral/Ambiguous EAW '
    'classes and names iTerm2/xterm settings; no line says what to LOOK AT on your own screen — T-151 premise CONFIRMED\n'
    'c60 <span class="pass">PASS</span>  gh run list --limit 5 -&gt; 5&times; completed success on main (latest '
    '31961923816, 22s) — checkout@v7/setup-node@v7 really resolve; CI nice-to-have closed on runs, not on file-reading\n'
    'c59 <span class="pass">PASS</span>  node .swarm/runs/c59-gate-48a.js',
    "evidence")

with open(P + ".tmp", "w", encoding="utf-8") as f:
    f.write(h)
os.replace(P + ".tmp", P)
print("dashboard rendered,", n_edits, "anchors substituted,", len(h), "bytes")
