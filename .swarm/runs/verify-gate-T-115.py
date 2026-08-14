#!/usr/bin/env python3
"""Conductor verify gate for T-115 (cycle 15).

Authored at verification time. The builder never saw these checks.

T-115's acceptance: REPORT.md's hand-off must state the RUN-WIDE truth about the
review-fix pass (never run in ANY cycle), must say WHY it was deferred, and must not
be softened or removed -- only widened.
"""
import re
import subprocess
import sys

REPORT = "/opt/targets/moon/REPORT.md"

# The exact single-line text the builder produced BEFORE the re-wrap, captured by the
# conductor from `git diff` prior to sending it back. The re-wrap must be word-preserving
# with respect to THIS string -- that is the whole point of a mechanical re-wrap.
PRE_REWRAP = (
    "The run's review-fix pass has not been run in any cycle; review-fix is the most "
    "premium-heavy work type in the pipeline, and the allocator premium allowance has "
    "remained zero throughout. Nothing above should be read as claiming that coverage."
)

# The text this replaced, at HEAD.
ORIGINAL = (
    "The run's review-fix pass has not been run this cycle; nothing above should be "
    "read as claiming that coverage."
)

results = []


def check(name, passed, detail):
    results.append((name, passed, detail))


work = open(REPORT, encoding="utf-8").read()
head = subprocess.run(
    ["git", "-C", "/opt/targets/moon", "show", "HEAD:REPORT.md"],
    capture_output=True, text=True, check=True,
).stdout

# --- 1. exactly one file changed, and it is REPORT.md -----------------------------
porcelain = subprocess.run(
    ["git", "-C", "/opt/targets/moon", "status", "--porcelain"],
    capture_output=True, text=True, check=True,
).stdout.splitlines()          # NB: do NOT strip() -- col 0 is a status column
# The conductor's own verify artifact is not builder output; name it explicitly rather
# than filtering by a loose pattern.
CONDUCTOR_ARTIFACTS = {".swarm/runs/verify-gate-T-115.py"}
changed = sorted(l[3:] for l in porcelain)
builder_changed = [f for f in changed if f not in CONDUCTOR_ARTIFACTS]
check("1 scope: builder touched only REPORT.md",
      builder_changed == ["REPORT.md"],
      "all changed = %r\n       builder-attributable = %r" % (changed, builder_changed))

# --- 2. locate the paragraph in the working tree ---------------------------------
# Find the contiguous block of non-blank lines containing "review-fix pass".
lines = work.split("\n")
idx = [i for i, l in enumerate(lines) if "review-fix pass" in l]
if len(idx) != 1:
    check("2 paragraph located (exactly one 'review-fix pass' line)", False,
          "found %d lines mentioning it: %r" % (len(idx), idx))
    para = ""
else:
    start = idx[0]
    while start > 0 and lines[start - 1].strip():
        start -= 1
    end = idx[0]
    while end + 1 < len(lines) and lines[end + 1].strip():
        end += 1
    para_lines = lines[start:end + 1]
    para = " ".join(para_lines)
    check("2 paragraph located (exactly one 'review-fix pass' line)", True,
          "lines %d-%d, %d line(s)" % (start + 1, end + 1, len(para_lines)))

collapsed = re.sub(r"\s+", " ", para).strip()

# --- 3. re-wrap was WORD-PRESERVING vs the pre-rewrap text ------------------------
check("3 re-wrap byte-identical under whitespace collapse",
      collapsed == PRE_REWRAP,
      "collapsed == PRE_REWRAP -> %s\n     got: %r" % (collapsed == PRE_REWRAP, collapsed))

# --- 4. widened from 'this cycle' to run-wide ------------------------------------
check("4a run-wide claim present ('in any cycle')",
      "has not been run in any cycle" in collapsed,
      "substring present -> %s" % ("has not been run in any cycle" in collapsed))
check("4b narrow 'this cycle' claim gone from the paragraph",
      "this cycle" not in collapsed,
      "'this cycle' in paragraph -> %s" % ("this cycle" in collapsed))
check("4c the ORIGINAL narrow sentence is gone from the whole file",
      re.sub(r"\s+", " ", ORIGINAL) not in re.sub(r"\s+", " ", work),
      "original sentence still present -> %s"
      % (re.sub(r"\s+", " ", ORIGINAL) in re.sub(r"\s+", " ", work)))

# --- 5. says WHY it was deferred --------------------------------------------------
says_why = "premium" in collapsed.lower()
check("5a states the reason (mentions premium cost)", says_why,
      "'premium' in paragraph -> %s" % says_why)
check("5b names the zero allowance", "zero" in collapsed.lower(),
      "'zero' in paragraph -> %s" % ("zero" in collapsed.lower()))

# --- 6. NOT softened: the refusal-of-coverage clause survives ---------------------
check("6 disclosure not softened (refusal clause retained)",
      "should be read as claiming that coverage" in collapsed,
      "refusal clause present -> %s"
      % ("should be read as claiming that coverage" in collapsed))
# and it must not have acquired hedging that implies it may yet run
hedges = ["will be run", "is scheduled", "planned for", "may run", "expected to run"]
found_hedge = [h for h in hedges if h in collapsed.lower()]
check("6b no hedge implying the pass is still coming", not found_hedge,
      "hedges found = %r" % (found_hedge,))

# --- 7. line-wrap convention ------------------------------------------------------
def prose_lens(text):
    out = []
    for i, l in enumerate(text.split("\n"), 1):
        s = l.strip()
        if not s or s.startswith("|") or l.startswith("    ") or s.startswith("```"):
            continue
        out.append((len(l), i))
    return out

head_max = max(n for n, _ in prose_lens(head))
work_prose = prose_lens(work)
work_max = max(n for n, _ in work_prose)
over = [(n, i) for n, i in work_prose if n > head_max]
check("7 no prose line exceeds the pre-existing max (%d chars)" % head_max,
      not over,
      "HEAD max=%d, working max=%d, lines over HEAD max=%r" % (head_max, work_max, over))

# --- 8. no British spelling / no emoji / no exclamation introduced -----------------
brit = [w for w in ["behaviour", "colour", "recognise", "analyse", "licence", "centre"]
        if w in collapsed.lower()]
check("8a no British spellings in the new paragraph", not brit, "found = %r" % (brit,))
check("8b no exclamation mark", "!" not in para, "'!' present -> %s" % ("!" in para))
emoji = [c for c in para if ord(c) > 0x2500 and not (0x2010 <= ord(c) <= 0x2027)]
check("8c no emoji / pictographs", not emoji, "non-ascii beyond punctuation = %r" % (emoji,))

# --- 9. diff really is a single hunk in a single file ------------------------------
numstat = subprocess.run(
    ["git", "-C", "/opt/targets/moon", "diff", "--numstat"],
    capture_output=True, text=True, check=True,
).stdout.strip()
check("9 diff is small and confined", numstat.endswith("REPORT.md") and
      numstat.count("\n") == 0,
      "numstat = %r" % (numstat,))

# --- report -----------------------------------------------------------------------
print("=" * 78)
print("T-115 CONDUCTOR VERIFY GATE (cycle 15)")
print("=" * 78)
npass = 0
for name, passed, detail in results:
    tag = "PASS" if passed else "FAIL"
    if passed:
        npass += 1
    print("[%s] %s" % (tag, name))
    print("       %s" % detail)
print("-" * 78)
print("GATE: %d/%d checks passed" % (npass, len(results)))
print()
print("FINAL PARAGRAPH AS WRITTEN:")
for l in para.split("\n") if "\n" in para else [para]:
    pass
if idx and len(idx) == 1:
    for l in lines[start:end + 1]:
        print("  |%s|  (%d chars)" % (l, len(l)))
sys.exit(0 if npass == len(results) else 1)
