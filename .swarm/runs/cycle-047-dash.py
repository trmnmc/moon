#!/usr/bin/env python3
"""cycle 47 dashboard render (step 8) — FINAL mode.

Structure carried forward from cycles 34-46: every anchor regex searches livetext() (live
spans only), never live(), because the placeholder legend inside the HTML comments carries
near-identical markup; sub() asserts a live anchor matches EXACTLY once and refuses to
render blind otherwise.

Burn-up: the cycle-44 corrective rule stands -- a cycle's verified count is the MAX of the
[N verified] brackets in that cycle's own commit subjects, never the SUM. Cycle 47's
wrap-up commit is deliberately written WITHOUT a [N verified] bracket so the {32, 44}
disagreement set stays complete; that set is asserted, not assumed. Numerator 37 -> 38
(T-142 verified), denominator stays 43 (nothing filed this cycle).

FINAL: no further wakeup. next_wakeup_at is parked at stop_at and wrap_up_complete is set
by the runfile step, not here.
"""
import html
import json
import os
import re
import shutil
import subprocess
import time

P = "/opt/swarm/runs/dashboard.html"
RF = "/opt/swarm/runs/current.json"
ALLOC = "/opt/swarm/runs/allocator.json"
STOP = 1786807947

NOW = int(time.time())
rf = json.load(open(RF))
rf["heartbeat"]["ts"] = NOW
rf["heartbeat"]["next_wakeup_at"] = STOP   # final: nothing is ever due again
with open(RF + ".tmp", "w") as f:
    json.dump(rf, f, indent=2)
os.replace(RF + ".tmp", RF)
shutil.copy(RF, "/opt/swarm/runs/current.json.bak")

mins = int((STOP - NOW) // 60)
GEN = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(NOW))
EXP = "— run complete, no further wakeup"

doc = open(P, encoding="utf-8").read()
head, sep, body = doc.rpartition("</style>")
assert sep, "no </style> found -- refusing to render blind"
spans, pos = [], 0
for m in re.finditer(r"<!--.*?-->", body, re.S):
    if m.start() > pos:
        spans.append([body[pos:m.start()], True])
    spans.append([m.group(0), False])
    pos = m.end()
spans.append([body[pos:], True])
n = 0


def sub(old, new):
    global n
    hits = [i for i, (t, lv) in enumerate(spans) if lv and old in t]
    total = sum(spans[i][0].count(old) for i in hits)
    assert total == 1, "live anchor matched %d times (need 1): %r" % (total, old[:90])
    spans[hits[0]][0] = spans[hits[0]][0].replace(old, new, 1)
    n += 1


def live():
    return "".join(t for t, _ in spans)


def livetext():
    return "".join(t for t, lv in spans if lv)


def e(s):
    """HTML-escape every journal-derived string before it enters the page."""
    return html.escape(s, quote=True)


# ---- 1. staleness slots -------------------------------------------------------------
old_gen = re.search(r'data-generated="([^"]+)" data-expected="([^"]+)"', livetext()).groups()
sub('data-generated="%s" data-expected="%s"' % old_gen,
    'data-generated="%s" data-expected="%s"' % (GEN, e(EXP)))
sub("<div>gen <strong>%s</strong></div>" % old_gen[0],
    "<div>gen <strong>%s</strong></div>" % GEN)
sub("<div>next <strong>%s</strong></div>" % old_gen[1],
    "<div>next <strong>%s</strong></div>" % e(EXP))

# ---- 2. banner ------------------------------------------------------------------------
old_banner = re.search(r'<div class="banner">cycle 46.*?</div>', livetext(), re.S).group(0)
sub(old_banner,
    '<div class="banner">cycle 47 &middot; <strong>DONE</strong> &middot; T-142 &rarr; GATE PASS '
    '&middot; the last measured coverage gap is closed, and the test proving it was shown '
    'attributably failable &middot; 145/145 green &middot; VALUE_LOOP scan came back EMPTY '
    '&middot; run complete with %dm of clock deliberately unspent</div>' % mins)

# ---- 3. stat tiles -------------------------------------------------------------------
commits = subprocess.run(["git", "-C", "/opt/targets/moon", "rev-list", "--count", "HEAD"],
                         capture_output=True, text=True).stdout.strip()
a = json.load(open(ALLOC))
old_alloc = re.search(r'<div class="stat"><span class="k">alloc</span>.*?</div>', livetext(), re.S).group(0)
sub(old_alloc,
    '<div class="stat"><span class="k">alloc</span><b>%s</b>'
    '<span class="s">prem %d%% &middot; wk %.0f%% &middot; opus %d%%</span></div>'
    % (e(a["posture"]), a["allow_premium_pct"], a["weekly_used_pct"], a["opus_used_pct"]))
old_cyc = re.search(r'<div class="stat"><span class="k">cycle</span>.*?</div>', livetext(), re.S).group(0)
sub(old_cyc,
    '<div class="stat"><span class="k">cycle</span><b>47</b>'
    '<span class="s">phase DONE &middot; stopped %dm early, by decision</span></div>' % mins)
old_tests = re.search(r'<div class="stat"><span class="k">tests</span>.*?</div>', livetext(), re.S).group(0)
sub(old_tests,
    '<div class="stat"><span class="k">tests</span><b>145/145</b><span class="s">40/43 items '
    'conductor-verified &middot; +1 test this cycle, and the count is reported as a SCOPE check '
    '&mdash; the item allowed exactly one &mdash; never as an outcome</span></div>')
old_main = re.search(r'<div class="stat"><span class="k">main</span>.*?</div>', livetext(), re.S).group(0)
sub(old_main,
    '<div class="stat"><span class="k">main</span><b>GREEN</b>'
    '<span class="s">%s commits &middot; 9 reverts &middot; pushed &middot; tagged</span></div>' % commits)

# ---- 3b. notify / control meta line --------------------------------------------------
old_meta = re.search(r'notify (?:on|off)[^<]*artifact: local file only', livetext()).group(0)
sub(old_meta,
    'notify on (&hellip;0d89) &middot; control: 0 pending &middot; last: none &middot; '
    'artifact: local file only')

# ---- 4. timeline tick ----------------------------------------------------------------
TAIL = "T-142 filed]</span></div></div>"
TICK = ('</span></div>\n<div class="tl"><span class="t">%s</span><b>cycle 47</b><span class="d">%s</span></div></div>'
        % (time.strftime("%H:%M", time.gmtime(NOW)),
           e("One sonnet builder, nine lines, one test: --help must win over --json. Cycle 46 "
             "measured that surface bare — of ten mutants only M6 survived the shipping suite — so "
             "this was the one item in the backlog closing a hole rather than rewording a true "
             "sentence. The gate is the part worth reading. Proving the new test fails under M6 is "
             "NOT enough: that only shows the suite goes red, not that this test is what turned it "
             "red. So the gate built two scratch copies, mutated BOTH with M6 itself rather than "
             "trusting anything the builder left behind, and removed the new test from the second. "
             "A: 145 tests, 144 pass, 1 fail — that test, on that assertion. B: 144/144 GREEN, the "
             "mutant alive and well. The kill is therefore attributable to those nine lines, and "
             "cycle 46's separate measurement is reproduced rather than believed. My instrument was "
             "wrong first, for the sixth time this run: the gate's initial scratch copy was built "
             "from an enumerated file list, contracts.test.js resolves paths against the repo root "
             "and aborted in BOTH arms, and it printed VERDICT: FAIL on correct work. An enumerated "
             "copy is a guess at the repo; a scratch copy has to BE the repo. Fixed, re-run, PASS. "
             "Then the DONE question, which cycle 46 left open on purpose. I re-verified the "
             "definition of done from evidence rather than from 46 cycles of backlog labels — every "
             "must-have has a file and a line behind it — and scanned for remaining value. Nothing "
             "passes the ratchet: the three surviving items are documentation of things that are "
             "already true, and KI-4 and KI-8 need a human, not an agent. So the target is DONE with "
             "about six and a half hours unspent. That is the call I am least willing to dress up: "
             "the SPEC named churn as this run's specific risk, and spending the clock on reworded "
             "prose would have looked like work while changing nothing "
             "[1 verified, 145/145 green, 0 reverted, 0 filed, M6 killed with A/B attribution]")))
sub(TAIL, TAIL[:-len("</span></div></div>")] + TICK)

# ---- 5. target block: header, counts, burn-up, verification evidence -----------------
log = subprocess.run(["git", "-C", "/opt/targets/moon", "log", "--reverse", "--format=%s"],
                     capture_output=True, text=True).stdout.splitlines()
per_sum, per_max = {}, {}
for line in log:
    mm = re.match(r"cycle (\d+):", line)
    vv = re.search(r"\[(\d+) verified", line)
    if mm and vv:
        c, v = int(mm.group(1)), int(vv.group(1))
        per_sum[c] = per_sum.get(c, 0) + v
        per_max[c] = max(per_max.get(c, 0), v)
disagree = sorted(c for c in per_sum if per_sum[c] != per_max[c])
assert disagree == [32, 44], "expected exactly cycles 32 and 44 to disagree, got %r" % disagree
assert per_max.get(47) == 1, "cycle 47 subject must carry exactly [1 verified], got %r" % per_max.get(47)

TOTAL, cum, bars = 43, 0, []
for c in range(1, 48):
    cum += per_max.get(c, 0)
    bars.append('<span style="height:%d%%" title="cycle %d: %d/%d verified"></span>'
                % (max(4, round(100 * cum / TOTAL)), c, cum, TOTAL))
assert cum == 38, "expected 38 under the MAX rule, got %d" % cum

EVIDENCE = (
    '<pre class="evidence">'
    + e("T-142  SCOPE + SUITE. git diff --stat: test/cli.test.js | 9 +++++++++, 1 file changed, "
        "9 insertions. No product file touched — bin/moon.js and src/ are conductor-owned and the "
        "builder was scoped to the one test file. Full suite run by the conductor, not asked of the "
        "agent: node --test test/*.test.js -> tests 145 / pass 145 / fail 0. 144 -> 145, exactly the "
        "one test the item permitted  ")
    + '<span class="pass">145/145 &mdash; +1, AS SCOPED</span>\n'
    + e("T-142  THE KILL, AND ITS ATTRIBUTION. .swarm/runs/cycle-047-gate.mjs, authored at "
        "verification time; the builder never saw it. Two scratch copies of the repo, BOTH mutated "
        "with M6 (if (opts.help) -> if (opts.help && !opts.json)) by the gate script itself rather "
        "than by anything the builder left behind. A = working tree + M6: tests 145 / pass 144 / "
        "fail 1, the failure being '--help wins over --json regardless of flag order', assertion "
        "'--json --help must match --help byte-for-byte'. B = M6 + the new test REMOVED (9 lines "
        "cut): tests 144 / pass 144 / fail 0. B is the discriminator — A alone proves only that the "
        "suite fails under M6, never that THIS test is what caught it. B shows the mutant surviving "
        "the moment the test is gone, so the kill is attributable to the nine added lines, and "
        "cycle 46's separate finding that M6 escaped the 144-test suite is independently reproduced "
        "rather than trusted. The test also cannot pass degenerately: it compares two REAL binary "
        "executions, and that --help alone emits HELP is pinned independently at cli.test.js:281  ")
    + '<span class="pass">A KILLS &middot; B SURVIVES &mdash; ATTRIBUTED</span>\n'
    + e("T-142  MY INSTRUMENT WAS WRONG FIRST — sixth instance this run. The gate's first version "
        "staged its scratch copy from an enumerated list (bin/ + src/ + test/ + package.json + "
        "README.md). contracts.test.js resolves paths against the repo root and reads CONTRACTS.md, "
        "so it aborted as a whole FILE in both arms — A read 137/135/2, B read 136/135/1 — and the "
        "gate printed VERDICT: FAIL against correct work. Taken at face value that reading would "
        "have sent a good item back to todo with attempts+1. An enumerated copy is a guess at the "
        "repo and the guess omits whatever the enumerator did not think of. Replaced with a "
        "recursive copy filtered only on .git, and the test list is now globbed from the copy rather "
        "than hardcoded, so the instrument cannot silently run a subset again  ")
    + '<span class="pass">INSTRUMENT REPAIRED, THEN RE-RUN</span>\n'
    + e("DONE  DEFINITION RE-VERIFIED FROM EVIDENCE, not from backlog labels. KI-1 REPORT.md:104 + "
        "README:38-41; KI-6 astro.js:358 TypeError + astro.test.js:294; KI-7 "
        "PHASE_ILLUMINATION_CONSISTENCY_DOMAIN astro.js:71/:363 + README:184 + astro.test.js:491 "
        "(4000 sampled points, years 1000-3000); KI-5 render.test.js:617; 145/145 green; no "
        "dependencies key of any kind. VALUE_LOOP scan EMPTY: T-116, T-130 and T-139 are all "
        "documentation of things already true and were ratchet-rejected on record at cycles 20-22 "
        "and again here; KI-4 and KI-8 are human-blocked by construction (KI-8's MIT text needs a "
        "copyright holder naming a legal person, which no agent may invent); the KI-5 glyph redesign "
        "is L-effort and the SPEC excluded it for this posture on cost, not on taste. NOT RUN and "
        "reported as not-run rather than passed: review-fix beyond its single cycle-23 pass, and "
        "collision-scan (step 6.6 scopes it to browser targets; this is a Node CLI)  ")
    + '<span class="pass">DONE &mdash; NOT STALLED</span></pre>'
)

tgt_old = re.search(r'<div class="target"><b>/opt/targets/moon</b><span>VALUE_LOOP &middot; cycle 46.*?</pre></div>', livetext(), re.S).group(0)
sub(tgt_old,
    '<div class="target"><b>/opt/targets/moon</b>'
    '<span>DONE &middot; cycle 47 &middot; 5 known issues</span>'
    '<p class="counts">40 / 43 backlog items done &middot; cycle 47 &middot; T-142 closed the one '
    'surface cycle 46 measured to be unprotected, and the VALUE_LOOP scan that cycle 46 could not '
    'run &mdash; because it had just produced a passing candidate &mdash; came back EMPTY this '
    'cycle. Both conjuncts of the DONE rule now hold and are evidenced, so the target is done '
    'rather than stalled: consecutive_no_value is 0 and this cycle produced verified value. The '
    'three remaining todo items are cosmetic and correctly declined, not blocked. ~6.5h of clock '
    'goes unspent, deliberately: the allocator held trickle with a zero premium allowance all run, '
    'and the SPEC named CHURN as this run&#x27;s specific taste risk. Building reworded prose to '
    'fill the clock would have looked like work and changed nothing</p>'
    '<div class="burnup" title="' + e(
        "cumulative conductor-verified items / backlog total, per cycle. A cycle's count is the "
        "MAX of the [N verified] brackets in that cycle's own commit subjects, NOT the sum — an "
        "addendum restates a cycle's result rather than adding a second one, and summing "
        "double-counted cycles 32 and 44. This render asserts those two remain the ONLY cycles "
        "where the rules disagree, so a future double-bracket fails loudly here instead of "
        "silently inflating a bar; cycle 47's wrap-up commit carries no verified bracket for "
        "exactly that reason. Series sums to 38 against 40 items marked done: the same two-item "
        "gap as previous cycles, still NOT attributed to specific items, because most done items "
        "carry no closing-cycle field to reconcile against — it is reported unreconciled rather "
        "than quietly closed. Denominator holds at 43: nothing was filed this cycle, which is "
        "itself the DONE signal. Cycles 34, 37 and 40 are flat BY DESIGN — each verified 0 and "
        "reverted 1 on an honest gate failure.") + '">'
    + "".join(bars) + "</div>" + EVIDENCE + "</div>")

open(P, "w", encoding="utf-8").write(head + sep + live())

print("dashboard rendered FINAL:", n, "live-region substitutions")
print("staleness slots: gen", GEN, "/ next", EXP)
print("burn-up bars:", len(bars), "| cumulative verified:", cum, "/", TOTAL)
print("MAX-vs-SUM disagreements:", disagree, "| per_max[47] =", per_max.get(47))
