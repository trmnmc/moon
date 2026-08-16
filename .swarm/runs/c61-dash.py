#!/usr/bin/env python3
"""cycle 61 dashboard render (step 8).

Same in-place targeted-substitution shape as c59/c60-dash.py: every anchor must match
EXACTLY once or the script raises BEFORE writing, so the page is never left half updated.
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
    '<div class="banner">cycle 60 · VALUE_LOOP · inline PLAN on an empty backlog — 2 candidates filed '
    '(T-150 stale “# 145 tests”, T-151 KI-5 self-check), CI nice-to-have closed on 5 green Actions runs · '
    '0 items verified, no_value 1 · 147/147 · gear 1 (guest/trickle) · 665m to stop</div>',
    '<div class="banner">cycle 61 · VALUE_LOOP · T-150 VERIFIED — REPORT.md’s how-to-run block now '
    'annotates the count a fresh suite run really emits (145 → 147), and the three run-scoped historical '
    '145 lines were asserted untouched · 1 verified, no_value back to 0 · 147/147 · gear 1 (guest/trickle) · '
    '643m to stop</div>',
    "banner",
)

# ── stat tiles ────────────────────────────────────────────────────────────
sub('<b>60</b><span class="s">phase VALUE_LOOP · 665m to stop · recycle 12/25',
    '<b>61</b><span class="s">phase VALUE_LOOP · 643m to stop · recycle 13/25', "tile-cycle")
sub('k=1 · probe denied (7)' if 'k=1 · probe denied (7)' in h else 'k=1 · probe not due (7)',
    'k=1 · probe denied (8)', "tile-pace")
sub('<b>147/147</b><span class="s">unchanged &middot; planning cycle, no code touched</span>',
    '<b>147/147</b><span class="s">unchanged &middot; docs-only diff, 1 line</span>', "tile-tests")
sub('<b>50/52</b><span class="s">2 todo &middot; T-150 + T-151, both docs/S</span>',
    '<b>51/52</b><span class="s">1 todo &middot; T-151 (KI-5 self-check) is next</span>', "tile-backlog")

# ── target header: bar + counts ───────────────────────────────────────────
sub('<div class="fill" style="width:96%"></div></div><p class="counts">50 / 52 backlog items done '
    '&middot; cycle 60</p>',
    '<div class="fill" style="width:98%"></div></div><p class="counts">51 / 52 backlog items done '
    '&middot; cycle 61</p>', "counts")

# ── crew stations ─────────────────────────────────────────────────────────
sub('<span class="who"><b>The Conductor</b><i>Took the planner&#x27;s three verdicts as claims and re-ran '
    'every premise. Went further than the agent on the CI one: it read the workflow file, which cannot catch '
    'a bad action pin, so the live runs were checked instead — 5 consecutive green.</i></span>'
    '<span class="chip">closed on live evidence</span>',
    '<span class="who"><b>The Conductor</b><i>Wrote the gate as a discriminator instead of a comparison: '
    'parse the number back OUT of REPORT.md and match it to a suite run made at that moment, so a builder who '
    'had typed a remembered 147 would look identical to one who measured — and the check would still be '
    'honest.</i></span><span class="chip">gate authored at gate time</span>', "station-conductor")
sub('<span class="who"><b>The Planner</b><i>Filed 2 items and refused to pad to 4. Named the trap in T-150 '
    'itself: REPORT.md:6 and :55 are run-scoped counts that are TRUE at 145 — dragging them to today&#x27;s '
    'number would be falsifying history to reach agreement.</i></span><span class="chip">2 filed, 0 padding</span>',
    '<span class="who"><b>The Builder</b><i>Ran the suite before touching the file, changed one line, and left '
    'the three historical 145 sentences alone. The whole diff is <code>1 1 REPORT.md</code> — the failure mode '
    'here was tidying history into agreement, and it didn&#x27;t.</i></span>'
    '<span class="chip">haiku · 1-line diff</span>', "station-scribe")

# ── journal one-liners: prepend c61, drop the 9th (c53) to stay at 8 ──────
sub('<ul class="journal"><li>cycle 60 —',
    '<ul class="journal"><li>cycle 61 — 2026-08-16T18:13:09Z — moon — VALUE_LOOP — build-wave k=1: T-150 '
    'verified done, REPORT.md test-count annotation 145 → 147</li><li>cycle 60 —',
    "journal-prepend")
sub('<li>cycle 53 — 2026-08-16T15:19:59Z — moon — BUILD — T-144 sweep, 21/24 killed, HI1 + AA1 holes</li></ul>',
    '</ul>', "journal-trim")

# ── burn-up: append the c61 bar ───────────────────────────────────────────
sub('no bar movement here means value delivered."></span></div>',
    'no bar movement here means value delivered."></span>'
    '<span style="height:98%" title="c61 — 51/52 backlog items done. The bar recovers most of the drop c60 '
    'caused: same basis (done &divide; backlog total), one of the two newly filed items closed. It does not '
    'reach full again because T-151 is still open."></span></div>',
    "burnup")

# ── verification evidence: newest first, keep the last three cycles ──────
sub('<pre class="evidence">c60 <span class="note">NOTE</span>  planning cycle',
    '<pre class="evidence">'
    'c61 <span class="pass">PASS</span>  git diff --numstat -&gt; &quot;1\t1\tREPORT.md&quot;; git diff -U0 -&gt; a '
    'single hunk @@ -212 +212 @@, &quot;# 145 tests&quot; -&gt; &quot;# 147 tests&quot; — the no-other-line-changes '
    'clause proven by the diff, not by the builder&#x27;s word\n'
    'c61 <span class="pass">PASS</span>  discriminator: parse the count OUT of REPORT.md, compare to a FRESH suite '
    'run -&gt; &quot;REPORT.md:212 claims 147 | fresh suite run reports 147 | MATCH true&quot;\n'
    'c61 <span class="pass">PASS</span>  anti-falsification arm -&gt; &quot;historical lines intact -&gt; :6 true | '
    ':55 true | :142 true&quot; — the three run-scoped 145 statements still read 145; agreeing with today&#x27;s '
    'number there would have been the failure, not the fix\n'
    'c61 <span class="pass">PASS</span>  node --test test/*.test.js -&gt; tests 147 / pass 147 / fail 0\n'
    'c61 <span class="note">NOTE</span>  post-merge collision-scan and qa-verify look pass NOT RUN — the merged '
    'file is markdown and moon has no browser-served surface, so the user-visible heuristic never fires. '
    'Recorded as not-run, never as passed\n'
    'c60 <span class="note">NOTE</span>  planning cycle',
    "evidence")

# ── trim the evidence block back to three cycles: drop the c58 tail ──────
sub('c58 <span class="pass">PASS</span>  node .swarm/runs/c58-gate-spread.js', 'c58-TRIM-MARK', "trim-mark")
i = h.index('c58-TRIM-MARK')
j = h.index('</pre>', i)
h = h[:i] + h[j:]
n_edits += 1

with open(P + ".tmp", "w", encoding="utf-8") as f:
    f.write(h)
os.replace(P + ".tmp", P)
print("dashboard rendered,", n_edits, "anchors substituted,", len(h), "bytes")
