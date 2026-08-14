#!/usr/bin/env python3
"""Conductor's INDEPENDENT gate for T-121. Authored at verification time.

Does not import, call, or reuse any part of cycle-024-eaw-audit.py. Re-derives the
two load-bearing claims from unicodedata directly, and tests the audit instrument's
failability by mutating a throwaway copy of the repo.

D1  the audit PARSES the repo (mutate a copy -> its verdict must change)
D2  the class-split half-block pair is the real and only mechanism (own enumeration)
D3  the Neutral ramp really cannot reach a full-fill glyph (own enumeration)
D4  NON-VACUITY: the shipped glyph set satisfies the predicate once the
    single-class constraint is dropped -- otherwise the negative is meaningless
"""
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata as ud
from pathlib import Path

REPO = Path('/opt/targets/moon')
AUDIT = '.swarm/runs/cycle-024-eaw-audit.py'
# Block Elements, Geometric Shapes, Symbols for Legacy Computing
RANGES = [(0x2580, 0x259F), (0x25A0, 0x25FF), (0x1FB00, 0x1FBFF)]
CLASS = {'N': 'Neutral', 'A': 'Ambiguous', 'W': 'Wide', 'Na': 'Narrow',
         'H': 'Halfwidth', 'F': 'Fullwidth'}
fails = []


def name(cp):
    try:
        return ud.name(chr(cp))
    except ValueError:
        return None


def repertoire():
    out = []
    for lo, hi in RANGES:
        for cp in range(lo, hi + 1):
            n = name(cp)
            if n:
                out.append((cp, n, CLASS[ud.east_asian_width(chr(cp))]))
    return out


def check(label, ok, detail):
    print('  %-5s %s' % ('PASS' if ok else 'FAIL', label))
    for line in detail:
        print('        ' + line)
    if not ok:
        fails.append(label)


def run_audit(root):
    p = subprocess.run([sys.executable, AUDIT], cwd=root,
                       capture_output=True, text=True)
    return p.returncode, p.stdout


print('=' * 78)
print('D1  failability: does the audit READ the repo, or re-type literals?')
print('=' * 78)
with tempfile.TemporaryDirectory() as td:
    clone = Path(td) / 'moon'
    shutil.copytree(REPO, clone, ignore=shutil.ignore_patterns('.git'))

    rc0, base = run_audit(clone)
    base_disagree = 'MATCH: the drawn disc glyph alphabet is exactly the documented set.' in base
    base_zero = '0 disagreements' in base

    # Mutation 1: flip ONE documented EAW class in the shipping test's
    # DOCUMENTED_EAW map. Anchored to the MAP ENTRY `[0x2591, 'Neutral']`, not to
    # any line merely mentioning 2591 -- the prose comment at render.test.js:559
    # names the same codepoint and class, and mutating that proves nothing.
    t = clone / 'test' / 'render.test.js'
    src = t.read_text()
    ENTRY = re.compile(r"(\[\s*0x2591\s*,\s*')Neutral(')")
    assert len(ENTRY.findall(src)) == 1, 'expected exactly one DOCUMENTED_EAW entry for 0x2591'
    mutated = ENTRY.sub(r"\1Ambiguous\2", src, count=1)
    changed = mutated != src
    t.write_text(mutated)
    rc1, m1 = run_audit(clone)
    t.write_text(src)

    check('D1a  mutating the documented CLASS of U+2591 in the DOCUMENTED_EAW map '
          'changes the audit verdict',
          changed and base_zero and ('0 disagreements' not in m1),
          ['mutation applied to a throwaway copy: %s' % changed,
           'pristine copy  -> "0 disagreements" present: %s' % base_zero,
           'mutated copy   -> "0 disagreements" present: %s' % ('0 disagreements' in m1),
           'a re-typed literal would have reported 0 either way'])

    # Mutation 1b: change a documented CODEPOINT (not its class) so the map no
    # longer matches what the renderer draws. Exercises the other cross-check
    # direction from the test side, which D1b exercises from the renderer side.
    KEY = re.compile(r"\[\s*0x2595\s*,")
    assert len(KEY.findall(src)) == 1, 'expected exactly one DOCUMENTED_EAW entry for 0x2595'
    mut1b = KEY.sub('[0x2599,', src, count=1)
    t.write_text(mut1b)
    rc1b, m1b = run_audit(clone)
    t.write_text(src)
    check('D1c  swapping a documented CODEPOINT (U+2595 -> U+2599) breaks the '
          'drawn-vs-documented MATCH from the test side',
          mut1b != src and base_disagree and (
              'MATCH: the drawn disc glyph alphabet is exactly the documented set.'
              not in m1b),
          ['mutation applied: %s' % (mut1b != src),
           'pristine -> MATCH reported: %s' % base_disagree,
           'mutated  -> MATCH reported: %s' % (
               'MATCH: the drawn disc glyph alphabet is exactly the documented set.'
               in m1b)])

    # Mutation 2: add a glyph to the renderer's SHADE ramp.
    r = clone / 'src' / 'render.js'
    rsrc = r.read_text()
    rmut = rsrc.replace("const SHADE = ['░', '▒', '▓', '█']",
                        "const SHADE = ['░', '▒', '▓', '▉', '█']", 1)
    r.write_text(rmut)
    rc2, m2 = run_audit(clone)
    r.write_text(rsrc)
    check('D1b  adding U+2589 to SHADE in src/render.js breaks the drawn-vs-'
          'documented MATCH',
          rmut != rsrc and base_disagree and not (
              'MATCH: the drawn disc glyph alphabet is exactly the documented set.' in m2),
          ['mutation applied: %s' % (rmut != rsrc),
           'pristine -> MATCH reported: %s' % base_disagree,
           'mutated  -> MATCH reported: %s' % (
               'MATCH: the drawn disc glyph alphabet is exactly the documented set.' in m2),
           'N parsed from source, not assumed: mutated run sees N=%s' % (
               (re.search(r'\(N=(\d+)\)', m2).group(1) if re.search(r'\(N=(\d+)\)', m2) else '?'))])

print()
print('=' * 78)
print('D2  own enumeration: every LEFT/RIGHT mirror-named pair, with both classes')
print('=' * 78)
rep = repertoire()
by_name = {n: (cp, c) for cp, n, c in rep}
pairs = []
for cp, n, c in rep:
    if 'LEFT' not in n:
        continue
    partner = n.replace('LEFT', 'RIGHT')
    if partner in by_name:
        pcp, pc = by_name[partner]
        pairs.append((cp, n, c, pcp, partner, pc))
pairs.sort()
half = [p for p in pairs if 'HALF BLOCK' in p[1]]
same_class_half = [p for p in half if p[2] == p[5]]
print('  total LEFT/RIGHT mirror-named pairs in the three ranges: %d' % len(pairs))
print('  of those, pairs whose names contain "HALF BLOCK":')
for cp, n, c, pcp, pn, pc in half:
    print('    U+%04X %-24s %-9s  <->  U+%04X %-24s %-9s  %s'
          % (cp, n, c, pcp, pn, pc, 'SAME CLASS' if c == pc else 'CLASS-SPLIT'))
check('D2   no same-class LEFT/RIGHT HALF BLOCK pair exists; the U+258C/U+2590 '
      'pair is class-split',
      len(same_class_half) == 0 and any(p[0] == 0x258C and p[3] == 0x2590 and p[2] != p[5]
                                        for p in half),
      ['same-class HALF BLOCK pairs found: %d' % len(same_class_half),
       'U+258C class = %s, U+2590 class = %s'
       % (CLASS[ud.east_asian_width('▌')], CLASS[ud.east_asian_width('▐')])])

print()
print('=' * 78)
print('D3  own enumeration: can any Neutral glyph in these ranges be a full-fill top?')
print('=' * 78)
neutral_full = [(cp, n) for cp, n, c in rep if c == 'Neutral' and 'FULL BLOCK' in n]
amb_full = [(cp, n) for cp, n, c in rep if c == 'Ambiguous' and 'FULL BLOCK' in n]
neutral_78 = [(cp, n) for cp, n, c in rep
              if c == 'Neutral' and 'SEVEN EIGHTHS BLOCK' in n]
print('  Neutral   glyphs named "...FULL BLOCK...": %s' % (neutral_full or 'NONE'))
print('  Ambiguous glyphs named "...FULL BLOCK...": %s'
      % ([('U+%04X' % cp, n) for cp, n in amb_full] or 'NONE'))
print('  Neutral   nearest miss "SEVEN EIGHTHS": %s'
      % ([('U+%04X' % cp, n) for cp, n in neutral_78] or 'NONE'))
check('D3   the only full-fill glyph in these ranges is Ambiguous, so a '
      'Neutral-only ramp cannot top out at 1.0',
      len(neutral_full) == 0 and len(amb_full) >= 1,
      ['Neutral full-fill candidates: %d' % len(neutral_full),
       'Ambiguous full-fill candidates: %d' % len(amb_full)])

print()
print('=' * 78)
print('D4  NON-VACUITY: does the SHIPPED set satisfy the predicate when the')
print('    single-class constraint is dropped? (if not, the negative is empty)')
print('=' * 78)
shade = ['░', '▒', '▓', '█']
shade_classes = [CLASS[ud.east_asian_width(g)] for g in shade]
ramp_ok = len(shade) == 4 and 'FULL BLOCK' == ud.name(shade[-1])
ship_half = ('▌', '▐')
half_ok = (ud.name(ship_half[0]) == 'LEFT HALF BLOCK'
           and ud.name(ship_half[1]) == 'RIGHT HALF BLOCK')
spans = len(set(shade_classes)) > 1
print('  shipped SHADE ramp: %s' % ' '.join(
    'U+%04X(%s)' % (ord(g), CLASS[ud.east_asian_width(g)][0]) for g in shade))
print('  shipped HALF pair : U+258C(%s) / U+2590(%s)'
      % (CLASS[ud.east_asian_width('▌')][0], CLASS[ud.east_asian_width('▐')][0]))
check('D4   the shipped set DOES satisfy ramp(4, top=FULL BLOCK) + a LEFT/RIGHT '
      'half pair -- but only by spanning two EAW classes',
      ramp_ok and half_ok and spans,
      ['4-step ramp topping at FULL BLOCK: %s' % ramp_ok,
       'LEFT/RIGHT half-block pair present: %s' % half_ok,
       'ramp spans >1 EAW class: %s  (%s)' % (spans, sorted(set(shade_classes))),
       'therefore the predicate is SATISFIABLE and the single-class negative',
       'is a real constraint result, not a vacuously impossible requirement'])

print()
print('=' * 78)
print('GATE: %s' % ('all discriminators PASS' if not fails else 'FAILED: %s' % fails))
print('=' * 78)
sys.exit(1 if fails else 0)
