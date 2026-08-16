"""Conductor's OWN verification gate for T-149 (cycle 56).

Method deliberately differs from the builder's harness: src/args.js is mutated by
string substitution and the TEST TREE is swapped via git (HEAD vs working tree),
rather than by editing or skipping tests.

  Arm A: new tree  + AA1 mutation -> exactly the new test must FAIL (mutant killed).
  Arm B: HEAD tree + AA1 mutation -> suite must be GREEN (mutant survives).

Arm B is the attribution: it proves the kill belongs to the new test specifically,
and simultaneously re-proves the item's premise (the pre-existing test cannot catch AA1).
Every mutation is wrapped in try/finally so the tree is restored even on error.
"""

import subprocess
import shutil
import os

os.chdir('/opt/targets/moon')

SRC = 'src/args.js'
TST = 'test/args.test.js'
CON = '.swarm/CONTRACTS.md'
FILES = (SRC, TST, CON)

TMP = '/tmp/t149bak'
os.makedirs(TMP, exist_ok=True)


def bak_path(p):
    return os.path.join(TMP, p.replace('/', '_') + '.bak')


for f in FILES:
    shutil.copy2(f, bak_path(f))


def restore():
    for f in FILES:
        shutil.copy2(bak_path(f), f)


def read(p):
    with open(p) as fh:
        return fh.read()


def write(p, s):
    with open(p, 'w') as fh:
        fh.write(s)


def suite():
    r = subprocess.run('node --test test/*.test.js', shell=True,
                       capture_output=True, text=True)
    out = r.stdout + r.stderr
    counts = [l for l in out.splitlines()
              if l.startswith('ℹ tests') or l.startswith('ℹ pass')
              or l.startswith('ℹ fail')]
    # Count failures from node's OWN summary line, not by counting '✖' glyphs: node
    # prints '✖ failing tests:' as a section header and then RE-LISTS each failure
    # under it, so glyph-counting triple-counts a single failure. The 'ℹ fail N' line
    # is the runner's authoritative count.
    nfail = None
    for l in out.splitlines():
        if l.startswith('ℹ fail '):
            nfail = int(l.split()[-1])
    assert nfail is not None, 'node --test printed no "ℹ fail" summary line'
    # Names of the failing tests, deduped, header line excluded.
    names = sorted(set(
        l.strip()[1:].strip() for l in out.splitlines()
        if l.strip().startswith('✖') and 'failing tests:' not in l))
    detail = [l for l in out.splitlines()
              if 'AssertionError' in l or 'hemisphere:' in l or 'json:' in l]
    return counts, nfail, names, detail


TRUTH = 'argv === undefined ? [] : argv'
MUT = 'argv === null ? [] : argv'

log = []


def P(s):
    print(s)
    log.append(s)


try:
    P('###### PRE-CHECK: pristine src/args.js contains exactly one AA1 target line')
    src = read(SRC)
    P('  target: ' + TRUTH)
    P('  occurrences: %d' % src.count(TRUTH))
    assert src.count(TRUTH) == 1, 'AA1 target line not uniquely present'

    P('')
    P('###### ARM A - FAILABLE: new tree + AA1 mutation (undefined -> null)')
    write(SRC, src.replace(TRUTH, MUT))
    P('  src/args.js now carries: ' + MUT)
    counts, arm_a_fails, names, detail = suite()
    for n in names:
        P('  FAILING TEST> ' + n[:130])
    for l in detail[:6]:
        P('  ' + l.strip()[:150])
    for l in counts:
        P('  ' + l)
    arm_a_names = names

    P('')
    P('###### ARM B - ATTRIBUTABLE: HEAD test tree + the SAME AA1 mutation still applied')
    subprocess.run('git checkout HEAD -- test/args.test.js .swarm/CONTRACTS.md',
                   shell=True)
    P('  src/args.js still mutated: %s' % (MUT in read(SRC)))
    P('  new test present in HEAD tree (expect 0): %d'
      % read(TST).count('discriminates the undefined-vs-null check'))
    counts, arm_b_fails, names, detail = suite()
    for n in names:
        P('  FAILING TEST> ' + n[:130])
    for l in counts:
        P('  ' + l)

    P('')
    P('###### RESTORE + FINAL UNMUTATED RUN')
    restore()
    P('  src/args.js truth restored: %s' % (TRUTH in read(SRC)))
    counts, final_fails, names, detail = suite()
    for l in counts:
        P('  ' + l)

    P('')
    P('###### VERDICT')
    P('  Arm A (mutant + new test)   -> failing tests: %d  (expect exactly 1)' % arm_a_fails)
    P('  Arm B (mutant + HEAD tests) -> failing tests: %d  (expect exactly 0)' % arm_b_fails)
    P('  Final (truth + new test)    -> failing tests: %d  (expect exactly 0)' % final_fails)
    killed_by_new_test = (len(arm_a_names) == 1
                          and 'discriminates the undefined-vs-null check' in arm_a_names[0])
    P('  Arm A sole failure IS the new test: %s' % killed_by_new_test)
    ok = (arm_a_fails == 1 and arm_b_fails == 0 and final_fails == 0
          and killed_by_new_test)
    P('  GATE: ' + ('PASS' if ok else 'FAIL'))
finally:
    restore()
    r = subprocess.run('git status --porcelain', shell=True,
                       capture_output=True, text=True)
    P('')
    P('###### TREE STATE AFTER RESTORE')
    for l in r.stdout.splitlines():
        P('  ' + l)
    write('.swarm/runs/cycle-056-verify-T-149.txt', '\n'.join(log) + '\n')
