#!/usr/bin/env python3
"""Prove the T-125 gate is FAILABLE rather than trigger-happy. Cycle 29.

A gate that passes the builder's output tells you nothing unless it also REJECTS
plausible-but-wrong versions of that output, and ACCEPTS a cosmetic variant. This
harness builds both kinds from whatever the builder actually produced.

Kills are required. The control is required to survive.
"""
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path('/opt/targets/moon')
REL = '.swarm/CONTRACTS.md'
GATE = ROOT / '.swarm' / 'runs' / 'cycle-029-gate-T-125.py'

head = subprocess.run(['git', '-C', str(ROOT), 'show', 'HEAD:' + REL],
                      capture_output=True, text=True).stdout
live = (ROOT / REL).read_text()
if not live.startswith(head):
    print('working tree is not additive over HEAD -- run the gate first'); sys.exit(2)
added = live[len(head):]

# Each mutant is (label, mutated-FULL-file, must_die)
mutants = []

# X1 -- a frozen line deleted from the middle of the freeze.
hl = head.split('\n')
cut = next(i for i, l in enumerate(hl) if l.startswith('function computeMoon'))
mutants.append(('X1 frozen line deleted',
                '\n'.join(hl[:cut] + hl[cut + 1:]) + added, True))

# X2 -- a frozen line reworded (the prohibition softened).
mutants.append(('X2 frozen header reworded',
                head.replace('No builder may edit this file',
                             'Builders should avoid editing this file') + added, True))

# X3 -- the shipped-suite citation dropped.
mutants.append(('X3 test citation dropped',
                head + added.replace('test/args.test.js', 'the test suite'), True))

# X4 -- one of the three divergences omitted.
mutants.append(('X4 one export omitted',
                head + re.sub(r'PHASE_ILLUMINATION_CONSISTENCY_DOMAIN', 'that constant',
                              added), True))

# X5 -- an invented quantity smuggled in.
mutants.append(('X5 invented quantity',
                head + added.rstrip() +
                '\n\nThese three gaps opened over 27 cycles of drift.\n', True))

# X6 -- CONTROL: cosmetic whitespace only. Must SURVIVE.
mutants.append(('X6 control: cosmetic ws', head + added.rstrip() + '\n', False))

print('%-28s %-10s %s' % ('mutant', 'gate', 'verdict'))
print('-' * 62)
bad = 0
for label, content, must_die in mutants:
    with tempfile.NamedTemporaryFile('w', suffix='.md', delete=False) as fh:
        fh.write(content)
        tmp = fh.name
    r = subprocess.run([sys.executable, str(GATE), tmp],
                       capture_output=True, text=True)
    died = r.returncode != 0
    ok = (died == must_die)
    if not ok:
        bad += 1
    print('%-28s %-10s %s' % (
        label,
        'RED' if died else 'GREEN',
        ('correct' if ok else '*** WRONG ***') +
        (' (must die)' if must_die else ' (control, must survive)')))
    pathlib.Path(tmp).unlink()

print('-' * 62)
print('%d of %d behaved correctly' % (len(mutants) - bad, len(mutants)))
sys.exit(1 if bad else 0)
