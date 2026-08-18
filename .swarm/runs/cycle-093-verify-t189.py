#!/usr/bin/env python3
"""cycle 93 / T-189 gate.

Claim under test: README.md's KI-5 section ALREADY carries a reader-runnable check, and that
check discriminates -- it must say "unaffected" when the terminal renders EAW Ambiguous as
1 column, and "affected" when it renders them as 2, on every frame a reader might see.

The check's decision rule, taken verbatim from README.md:231-237:
  run `node bin/moon.js --block`; compare the top and bottom border lines to the
  |-bracketed phase / illuminated / hemisphere rows. Right-hand | lines up directly under
  the right end of the border -> UNAFFECTED. Border noticeably wider, bar stopping short
  -> AFFECTED.

That is a function verdict(frame, ambiguous_width). It is correct iff:
  verdict(frame, 1) == "unaffected"  AND  verdict(frame, 2) == "affected"   for every frame.

A check that returns the same answer under both policies is not a check; it is decoration.
"""
import json
import sys
import unicodedata

frames = json.load(sys.stdin)


def width(ch, amb):
    k = unicodedata.east_asian_width(ch)
    if k in ('W', 'F'):
        return 2
    if k == 'A':
        return amb
    return 1


def last_char_col(line, amb):
    """0-indexed display column at which the line's LAST character starts."""
    return sum(width(c, amb) for c in line[:-1])


NAMED = ('phase', 'illuminated', 'hemisphere')


def verdict(frame, amb):
    lines = [l for l in frame.split('\n') if l]
    border = [l for l in lines if l and l[0] in '┌└']          # top / bottom rules
    named = [l for l in lines if l and l[0] == '│'                   # | -bracketed rows
             and any((' ' + n + ' ') in l for n in NAMED)]
    if len(border) != 2 or len(named) != len(NAMED):
        return 'malformed', {'border': len(border), 'named': len(named)}
    bcols = {last_char_col(l, amb) for l in border}
    ncols = {last_char_col(l, amb) for l in named}
    detail = {'border_corner_col': sorted(bcols), 'named_right_bar_col': sorted(ncols),
              'border_cols': sorted({sum(width(c, amb) for c in l) for l in border}),
              'named_cols': sorted({sum(width(c, amb) for c in l) for l in named})}
    return ('unaffected' if bcols == ncols else 'affected'), detail


bad1, bad2, agg = [], [], {1: {}, 2: {}}
for f in frames:
    for amb in (1, 2):
        v, d = verdict(f['frame'], amb)
        for k, vals in d.items():
            agg[amb].setdefault(k, set()).update(vals if isinstance(vals, list) else [vals])
        want = 'unaffected' if amb == 1 else 'affected'
        if v != want:
            (bad1 if amb == 1 else bad2).append((f['label'], v))

print('frames tested: %d  (%s .. %s)' % (len(frames), frames[0]['label'], frames[-1]['label']))
print('UCD version used for EAW classes: %s' % unicodedata.unidata_version)
for amb in (1, 2):
    print('--- ambiguous width = %d ---' % amb)
    for k in ('border_cols', 'named_cols', 'border_corner_col', 'named_right_bar_col'):
        vals = sorted(agg[amb][k])
        print('  %-20s : min %s max %s' % (k, vals[0], vals[-1]))
print("UNAFFECTED branch wrong (check says 'affected')   : %d %s" % (len(bad1), bad1[:3]))
print("AFFECTED branch wrong (check says 'unaffected')   : %d %s" % (len(bad2), bad2[:3]))
ok = not bad1 and not bad2
print('VERDICT: check %s on every frame' % ('DISCRIMINATES' if ok else 'FAILS TO DISCRIMINATE'))
sys.exit(0 if ok else 1)
