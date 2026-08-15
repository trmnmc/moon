#!/usr/bin/env python3
"""Conductor measurement, cycle 29. Authored at verification time.

QUESTION: `--compact` is the only CLI flag with no positive unit assertion in
test/args.test.js (every other flag has a `parseArgs(['--flag'])` deepStrictEqual).
Is that a REAL hole, or is the surface already protected end-to-end by cli.test.js?

METHOD: mutate the `compact` wiring in src/args.js and run the FULL suite. A mutant
that stays green is an unprotected surface. A mutant that dies is a covered one.
Restores the file byte-identical afterwards and asserts it.
"""
import hashlib
import pathlib
import subprocess
import sys

ROOT = pathlib.Path('/opt/targets/moon')
ARGS = ROOT / 'src' / 'args.js'

ORIG = ARGS.read_text()
ORIG_SHA = hashlib.sha256(ORIG.encode()).hexdigest()

TARGET = "    compact: parsed.values.compact === true,"
assert TARGET in ORIG, 'anchor line not found -- refusing to run a vacuous experiment'

MUTANTS = [
    ('M1 compact <- block   ', "    compact: parsed.values.block === true,"),
    ('M2 compact <- json    ', "    compact: parsed.values.json === true,"),
    ('M3 compact pinned true', "    compact: true,"),
    ('M4 compact pinned false', "    compact: false,"),
]


def suite():
    r = subprocess.run(
        ['node', '--test', 'test/args.test.js'],
        cwd=ROOT, capture_output=True, text=True)
    args_only = r.returncode
    r2 = subprocess.run(
        'node --test test/*.test.js',
        cwd=ROOT, capture_output=True, text=True, shell=True)
    return args_only, r2.returncode


print('baseline (unmutated):')
a, f = suite()
print('  args.test.js exit=%d   full suite exit=%d' % (a, f))
if a != 0 or f != 0:
    print('BASELINE NOT GREEN -- aborting'); sys.exit(2)

print('')
print('%-24s %-18s %-18s' % ('mutant', 'args.test.js', 'FULL suite'))
rows = []
for label, repl in MUTANTS:
    ARGS.write_text(ORIG.replace(TARGET, repl))
    a, f = suite()
    rows.append((label, a, f))
    print('%-24s %-18s %-18s' % (
        label,
        'RED (killed)' if a != 0 else 'GREEN (survived)',
        'RED (killed)' if f != 0 else 'GREEN (survived)'))
    ARGS.write_text(ORIG)

restored = hashlib.sha256(ARGS.read_text().encode()).hexdigest()
print('')
print('restore byte-identical:', restored == ORIG_SHA)
a, f = suite()
print('final unmutated: args.test.js exit=%d  full suite exit=%d' % (a, f))
print('')
survived_unit = [r[0] for r in rows if r[1] == 0]
survived_full = [r[0] for r in rows if r[2] == 0]
print('survived args.test.js alone :', survived_unit or 'none')
print('survived the FULL suite     :', survived_full or 'none')
print('')
print('READING: mutants surviving args.test.js but dying in the full suite are')
print('covered END-TO-END only. Mutants surviving the FULL suite are genuinely')
print('unprotected and would be a real named untested surface.')
