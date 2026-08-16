#!/usr/bin/env python3
"""cycle 63 T-151 verification gate (conductor-authored at gate time).

Does the self-check README now tells the reader to run actually DISCRIMINATE
between an unaffected and an affected terminal, for every night of the month
and both hemispheres?

The README's check, as written:
  run `node bin/moon.js --block` and compare the top and bottom border lines to
  the `|`-bracketed rows between them (`phase`, `illuminated`, `hemisphere`).
  - right-hand `|` on those rows lines up directly under the right end of the
    top and bottom lines  -> UNAFFECTED
  - top and bottom lines run noticeably wider than the rows in between, the `|`
    stopping well short of where the border lines end -> AFFECTED

So the check is a function verdict(frame, width_policy). It is CORRECT iff
verdict(frame, ambiguous=1) == unaffected AND verdict(frame, ambiguous=2) ==
affected, for every frame. Anything else means a reader gets the wrong answer.
"""
import json
import subprocess
import unicodedata

FRAMES = json.loads(subprocess.run(
    ["node", "/opt/targets/moon/.swarm/runs/cycle-063-capture-t151.js"],
    capture_output=True, text=True, check=True).stdout)

V = "│"   # box drawings light vertical
TR = "┐"  # top right corner
BR = "┘"  # bottom right corner


def cw(ch, amb):
    e = unicodedata.east_asian_width(ch)
    if e in ("F", "W"):
        return 2
    if e == "A":
        return amb
    return 1


def cols(s, amb):
    return sum(cw(c, amb) for c in s)


def last_glyph_col(row, glyph, amb):
    """Display column at which the LAST occurrence of `glyph` starts."""
    i = row.rindex(glyph)
    return cols(row[:i], amb)


print("UCD version:", unicodedata.unidata_version)
print("frames captured:", len(FRAMES))
print("frame glyph EAW:", " ".join(
    "U+%04X %s" % (ord(c), unicodedata.east_asian_width(c))
    for c in "┌┐└┘─│"))
print()

named_missing = []
bad_unaffected = []
bad_affected = []
stats = {1: [], 2: []}

for f in FRAMES:
    rows = f["frame"].split("\n")
    top, bottom = rows[0], rows[-1]
    named = [r for r in rows[1:-1]
             if any(lbl in r for lbl in ("phase", "illuminated", "hemisphere"))]
    if len(named) != 3:
        named_missing.append((f["label"], len(named)))
        continue
    body = rows[1:-1]

    for amb in (1, 2):
        top_end = last_glyph_col(top, TR, amb)
        bot_end = last_glyph_col(bottom, BR, amb)
        named_bars = [last_glyph_col(r, V, amb) for r in named]
        border_w = cols(top, amb)
        body_w = [cols(r, amb) for r in body]
        stats[amb].append((border_w, min(body_w), max(body_w),
                           min(named_bars), max(named_bars), top_end, bot_end))

        aligned = (top_end == bot_end) and all(b == top_end for b in named_bars)
        if amb == 1 and not aligned:
            bad_unaffected.append((f["label"], top_end, bot_end, named_bars))
        if amb == 2:
            # The check's DECISION RULE is alignment: the reader concludes
            # "unaffected" only when the named rows' right bars sit under the
            # corners. So the affected branch is wrong iff a reader could read
            # alignment. `short` quantifies the gap they actually see.
            short = all(top_end - b >= 10 for b in named_bars)
            # Corroborating clause, tested as literally written ("the top and
            # bottom lines run noticeably wider than the rows in between").
            # Reported under BOTH readings of "the rows in between": the three
            # rows the sentence names, and every row in the frame.
            wider_named = all(border_w > cols(r, amb) for r in named)
            wider_all = all(border_w > w for w in body_w)
            if aligned or not (short and wider_named and wider_all):
                bad_affected.append((f["label"], border_w, max(body_w),
                                     top_end, named_bars, aligned, short,
                                     wider_named, wider_all))

for amb in (1, 2):
    s = stats[amb]
    print("--- ambiguous width = %d ---" % amb)
    print("  border row cols        : min %d max %d" % (min(x[0] for x in s), max(x[0] for x in s)))
    print("  body row cols (any row): min %d max %d" % (min(x[1] for x in s), max(x[2] for x in s)))
    print("  named-row right | col  : min %d max %d" % (min(x[3] for x in s), max(x[4] for x in s)))
    print("  top-right corner col   : min %d max %d" % (min(x[5] for x in s), max(x[5] for x in s)))
    print("  bottom-right corner col: min %d max %d" % (min(x[6] for x in s), max(x[6] for x in s)))
print()
s2 = stats[2]
print("margin the reader sees, ambiguous=2:")
print("  named-row right | col %d vs corner col %d  -> %d columns short"
      % (s2[0][3], s2[0][5], s2[0][5] - s2[0][3]))
print("  border %d cols vs named rows %d cols (1.89x); vs the WIDEST disc row %d cols (%.2fx)"
      % (s2[0][0], 36, max(x[2] for x in s2), s2[0][0] / max(x[2] for x in s2)))
print()

print("RESULT")
print("  frames missing a phase/illuminated/hemisphere row : %d %s"
      % (len(named_missing), named_missing[:3]))
print("  UNAFFECTED branch wrong (check says 'affected')   : %d %s"
      % (len(bad_unaffected), bad_unaffected[:3]))
print("  AFFECTED branch wrong (check says 'unaffected')   : %d %s"
      % (len(bad_affected), bad_affected[:3]))
ok = not (named_missing or bad_unaffected or bad_affected)
print("  VERDICT: %s" % ("check DISCRIMINATES on every frame" if ok else "CHECK IS WRONG"))
raise SystemExit(0 if ok else 1)
