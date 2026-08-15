#!/usr/bin/env python3
"""Conductor gate, cycle 38 — failability battery for T-134 attempt 2.

Runs on a COPY of the repo (/tmp/c38-mut) so the real README is never touched, which
removes the whole class of "did the builder restore it byte-for-byte" doubt.
Each mutant is applied to the pristine copy, the FULL suite is run, and the per-test
attribution is recorded from node --test's own output.
"""
import re, shutil, subprocess, sys, pathlib

SRC = pathlib.Path('/opt/targets/moon')
DST = pathlib.Path('/tmp/c38-mut')

HONEST_5 = '▏░░░░   5%  waning crescent   ░░░░▕   5%  waning crescent'


def fresh():
    if DST.exists():
        shutil.rmtree(DST)
    shutil.copytree(SRC, DST, ignore=shutil.ignore_patterns('.git'))


def readme():
    return (DST / 'README.md').read_text(encoding='utf8')


def write(t):
    (DST / 'README.md').write_text(t, encoding='utf8')


def run():
    p = subprocess.run(['node', '--test', 'test/regressions.test.js'], cwd=DST,
                       capture_output=True, text=True)
    out = p.stdout + p.stderr
    npass = int(re.search(r'^. pass (\d+)', out, re.M).group(1))
    nfail = int(re.search(r'^. fail (\d+)', out, re.M).group(1))
    failed = re.findall(r'^\s*(?:not ok \d+ - |✖ )(.+?)(?: \([\d.]+ms\))?$', out, re.M)
    failed = [f for f in failed if not f.startswith('tests ') and 'subtests' not in f]
    return npass, nfail, failed


MUTANTS = []


def mut(name, expect, fn, note=''):
    MUTANTS.append((name, expect, fn, note))


mut('M0-CONTROL', 'GREEN', lambda t: t, 'harness liveness, run first and last')

mut('M1-HISTORICAL', 'RED',
    lambda t: t.replace('  63%  waning gibbous', '  63%  full'),
    "RETRO.md's real v0.1.0 defect replayed: a sweep row retyped to the wrong name")

mut('M1b-NAME-ORDER-SAFE', '?',
    lambda t: t.replace('  51%  first quarter', '  51%  waxing gibbous'),
    'name retype that PRESERVES PHASE_NAMES order - probing for a hole, not a required kill')

mut('M2-SOUTH-GLYPH', 'RED',
    lambda t: t.replace('◖▓░░░  32%', '◗▓░░░  32%'),
    'one glyph of one south disc hand-touched; mirror symmetry must break')

mut('M3-HEADLINE-PCT', 'RED',
    lambda t: t.replace('░░░░▕   4%  waxing crescent',
                        '░░░░▕   9%  waxing crescent', 1),
    'headline retyped to contradict the --json fence directly below it')

mut('M4-BLOCK-ROW', 'RED',
    lambda t: t.replace('│  illuminated               4%  │',
                        '│  illuminated               7%  │'),
    '--block fence row hand-touched')

def coherent_fake(t):
    out = []
    for line in t.split('\n'):
        if '63%' in line and 'waning gibbous' in line:
            line = line.replace('◖██░░', '◖██▓▏').replace('░░██◗', '▕▓██◗')
        out.append(line)
    return '\n'.join(out)


mut('M5-COHERENT-FAKE', 'RED', coherent_fake,
    'BOTH discs swapped to the 83% row\'s real, correctly-mirrored pair: mirror OK, '
    'name OK, order OK - only the band search can see this')

mut('M6-FALSE-POSITIVE', 'GREEN',
    lambda t: re.sub(r'▌░░░░   5%  waning crescent   ░░░░▐   5%  waning crescent',
                     HONEST_5, t),
    'the cycle-37 failure: 5% row honestly regenerated at true k=0.046. A CORRECT '
    'README must stay green.')

mut('M0-CONTROL-2', 'GREEN', lambda t: t, 'harness not stuck red at the end')

rows = []
verdict_ok = True
for name, expect, fn, note in MUTANTS:
    fresh()
    before = readme()
    after = fn(before)
    changed = after != before
    if name.startswith('M0') and changed:
        print('BUG: control mutated the file'); sys.exit(2)
    if not name.startswith('M0') and not changed:
        print('MUTANT DID NOT APPLY (pattern missed): ' + name); sys.exit(2)
    write(after)
    npass, nfail, failed = run()
    got = 'GREEN' if nfail == 0 else 'RED'
    ok = (expect == '?') or (got == expect)
    verdict_ok = verdict_ok and ok
    rows.append((name, expect, got, npass, nfail, failed, ok, note))

w = max(len(r[0]) for r in rows)
print('%-*s  %-6s  %-6s  %-9s  %s' % (w, 'MUTANT', 'EXPECT', 'GOT', 'pass/fail', 'caught by'))
for name, expect, got, npass, nfail, failed, ok, note in rows:
    mark = '' if ok else '   <-- UNEXPECTED'
    caught = '; '.join(f.strip()[:72] for f in failed) or '-'
    print('%-*s  %-6s  %-6s  %d/%-7d  %s%s' % (w, name, expect, got, npass, nfail, caught, mark))
print()
for name, expect, got, npass, nfail, failed, ok, note in rows:
    print('  ' + name + ': ' + note)
print()
print('BATTERY VERDICT: ' + ('ALL AS EXPECTED' if verdict_ok else 'MISMATCH - see above'))
shutil.rmtree(DST, ignore_errors=True)
