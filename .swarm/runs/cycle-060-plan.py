import json, os

BL = '/opt/targets/moon/.swarm/backlog.json'
ST = '/opt/targets/moon/.swarm/state.json'

b = json.load(open(BL))
ids = {i['id'] for i in b['items']}
assert 'T-150' not in ids and 'T-151' not in ids

new = [
  {
    "id": "T-150",
    "title": "REPORT.md's How-to-run block annotates the test command '# 145 tests'; the suite runs 147",
    "kind": "docs",
    "priority": 7,
    "value": "M",
    "effort": "S",
    "status": "todo",
    "deps": [],
    "files_hint": ["REPORT.md"],
    "acceptance": "REPORT.md's 'How to run it' code block annotates the test command with the count a fresh run of the suite actually produces on the current tree, and no other line of that block changes. Historical, run-scoped counts elsewhere in the file (e.g. the cycles 0-47 summary at REPORT.md:6, and the two-arm figures at :55) are true as written and must NOT be rewritten to today's number.",
    "packages": [],
    "model": "haiku",
    "attempts": 0,
    "notes": "Found at cycle 60 (inline PLAN). Conductor-verified premise, not an agent claim: grep of REPORT.md shows :212 `node --test test/*.test.js    # 145 tests`, while `node --test test/*.test.js` on the current tree reports `tests 147 / pass 147 / fail 0`. This is the one output-cited number T-147 (line citations) and T-148 (pasted command output) did not reach -- it is a comment inside an instruction block rather than a citation or a capture, so both sweeps' scopes stepped over it. Directly in scope for the run's must-have 'every line-cited and output-cited doc claim is re-verified against the current tree'. Beware the trap: :6 and :55 are scoped to the run/cycle they describe and are TRUE at those counts; changing them would be falsifying history to reach agreement."
  },
  {
    "id": "T-151",
    "title": "README's KI-5 limitation makes the reader learn East Asian Width jargon to answer 'am I affected?'",
    "kind": "docs",
    "priority": 6,
    "value": "M",
    "effort": "S",
    "status": "todo",
    "deps": [],
    "files_hint": ["README.md"],
    "acceptance": "README's 'Known limitation: terminal glyph width' section lets a reader settle whether their own terminal is affected from something they can observe on screen (a check they can run and an outcome they can compare), without needing to know what 'Neutral' or 'Ambiguous' East Asian Width means or which terminal setting they have. The existing technical explanation stays -- nothing is deleted or weakened; the section gains the missing observable, and the truth of every retained sentence is preserved.",
    "packages": [],
    "model": "haiku",
    "attempts": 0,
    "notes": "Found at cycle 60 (inline PLAN); this is SPEC nice-to-have #2, unlocked now that every must-have is verified. Conductor-verified premise: README.md:205-224 explains the failure via Unicode width classes and names iTerm2's 'treat ambiguous-width as double' and `xterm -cjk_width` as configurations, but nowhere tells the reader what to LOOK AT on their own screen. The section already names an observable a reader could check unassisted (the `--block` frame not closing) -- the gap is that nothing points them at it as the test. Churn guard: rewording the existing paragraphs is NOT this item; if the diff does not add a check a reader can perform, the item is not done."
  },
]
b['items'].extend(new)
open(BL + '.tmp', 'w').write(json.dumps(b, indent=1) + '\n')
os.replace(BL + '.tmp', BL)

s = json.load(open(ST))
s['cycle'] = 60
s['phase'] = 'VALUE_LOOP'
s['last_cycle'] = {
  "cycle": 60,
  "work": "inline PLAN (sonnet Plan seat) -- VALUE_LOOP candidate scan against the SPEC nice-to-haves; backlog was empty, 50/50 done",
  "outcome": "planning: 2 items filed (T-150 stale test count in REPORT's how-to-run block, T-151 KI-5 self-check line); CI nice-to-have closed as already-satisfied on live evidence; no code verified this cycle"
}
c = s.setdefault('counters', {})
c['consecutive_no_value'] = c.get('consecutive_no_value', 0) + 1
open(ST + '.tmp', 'w').write(json.dumps(s, indent=1) + '\n')
os.replace(ST + '.tmp', ST)

from collections import Counter
print('backlog items now', len(b['items']), Counter(i['status'] for i in b['items']))
print('state cycle', s['cycle'], 'phase', s['phase'], 'no_value', c['consecutive_no_value'])
