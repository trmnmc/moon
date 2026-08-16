import unicodedata
p = '/opt/targets/moon/.swarm/runs/cycle-062-verify-t151-block.txt'
lines = [l.rstrip('\n') for l in open(p, encoding='utf-8')]
print("T-151 gate, cycle 62 - falsification of the proposed reader check")
print("Proposed check text: 'If your terminal is fine ... bottom-right corner `┘` aligned")
print("under the top-right corner `┐`. If your terminal is affected ... `┘` will be")
print("visibly misaligned with the top-right corner `┐`.'")
print()
print("Method: render the ACTUAL `node bin/moon.js --block` output under both width")
print("policies using Python's unicodedata.east_asian_width (UCD, authoritative offline),")
print("and report the column each line's right-hand border glyph starts at.")
print()
print("EAW class of the frame glyphs:")
for c in '┌┐└┘─│':
    print("  %s U+%04X %s" % (c, ord(c), unicodedata.east_asian_width(c)))
print("  -> ALL SIX frame glyphs are Ambiguous. Both border rows are built from the same")
print("     Ambiguous glyphs, so both scale by the same factor.")


def w(c, amb):
    e = unicodedata.east_asian_width(c)
    return 2 if e in ('W', 'F') else (amb if e == 'A' else 1)


for amb in (1, 2):
    print()
    label = "default Western terminal" if amb == 1 else "CJK / iTerm2 'ambiguous as double' / xterm -cjk_width"
    print("--- ambiguous-width = %d (%s) ---" % (amb, label))
    for i, l in enumerate(lines):
        x = 0
        border = None
        for c in l:
            if c in '│┐┘└┌':
                border = (c, x)
            x += w(c, amb)
        tag = ''
        if i == 0:
            tag = '  <- top border'
        if i == len(lines) - 2:
            tag = '  <- bottom border'
        print("  line%2d width=%3d right-border=%s%s" % (i, x, border, tag))
print()
print("VERDICT: FAIL. Under ambiguous=2 the top-right ┐ and bottom-right ┘ BOTH sit at")
print("column 66 on 68-column rows - still perfectly aligned with each other. What actually")
print("breaks is the CONTENT rows: their right │ lands at columns 34-37 and is ragged")
print("between rows. A reader in an affected terminal running the documented check would")
print("see the two corners lined up, conclude 'my terminal is fine', and be wrong.")
print("The pre-existing sentence 'the --block frame does not close' remains true; the new")
print("check picked the one part of the frame the failure mode leaves intact.")
