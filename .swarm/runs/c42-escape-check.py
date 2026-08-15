#!/usr/bin/env python3
"""CONDUCTOR GATE addendum - cycle 42, T-138.

The main gate found 3 mutants that ESCAPED (suite stayed green when it should have gone
red). The decisive question is NOT whether they escape - it is whether T-138 CAUSED them
to escape. So: run the identical 3 mutants against the PRE-MERGE test file (fe113bf,
the old `!name.includes('waning')` predicate).

  escapes before AND after  -> pre-existing limitation, T-138 weakened nothing
  escapes only after        -> T-138 weakened the check; GATE FAILS

Also fixes the main gate's count parsing (node --test emits 'ℹ pass N', not '# pass N'),
so the evidence carries real numbers rather than -1 placeholders.
"""
import re
import subprocess

REPO = '/opt/targets/moon'
README = REPO + '/README.md'
TESTFILE = REPO + '/test/regressions.test.js'


def read_fence():
    t = open(README, encoding='utf-8').read()
    i = t.index('Why this one')
    f = t.index('```', i)
    g = t.index('```', f + 3)
    return t, f + 3, g, t[f + 3:g]


def data_rows():
    _, _, _, fence = read_fence()
    lines = fence.split('\n')
    return lines, [n for n, l in enumerate(lines) if n >= 2 and l.strip()]


def write_fence(lines):
    t, f, g, _ = read_fence()
    open(README, 'w', encoding='utf-8').write(t[:f] + '\n'.join(lines) + t[g:])


def restore_readme():
    subprocess.run(['git', '-C', REPO, 'checkout', '--', 'README.md'], check=True)


def suite():
    p = subprocess.run(['node', '--test', 'test/regressions.test.js'],
                       capture_output=True, text=True, cwd=REPO)
    out = p.stdout
    mp = re.search(r'pass (\d+)', out)
    mf = re.search(r'fail (\d+)', out)
    return p.returncode == 0, int(mp.group(1)) if mp else -1, int(mf.group(1)) if mf else -1


MUTANTS = [(9, 'waxing gibbous'), (9, 'waning gibbous'), (16, 'waning crescent')]


def run_battery(label):
    print('--- %s ---' % label)
    for slot, adj in MUTANTS:
        lines, _ = data_rows()
        row = lines[slot]
        north, south = row[:30].rstrip(), row[30:]
        cur = re.search(r'  ([a-z ]+)$', north).group(1).strip()
        north2 = re.sub(r'(?<=  )[a-z ]+$', adj, north)
        south2 = re.sub(r'(?<=  )[a-z ]+$', adj, south.rstrip())
        lines[slot] = north2.ljust(30) + south2
        write_fence(lines)
        ok, npass, nfail = suite()
        restore_readme()
        print('  slot %2d %-16r -> %-16r : %s (pass=%d fail=%d)'
              % (slot, cur, adj, 'ESCAPED (green)' if ok else 'killed (red)', npass, nfail))
    print()


def main():
    restore_readme()
    merged = open(TESTFILE, encoding='utf-8').read()

    # Baseline sanity: the unmodified merged tree.
    ok, npass, nfail = suite()
    print('merged tree, unmutated README: pass=%d fail=%d ok=%s\n' % (npass, nfail, ok))

    run_battery('AFTER T-138 (merged, structural predicate)')

    # Reconstruct the pre-merge test file exactly, from git.
    pre = subprocess.run(['git', '-C', REPO, 'show', 'fe113bf:test/regressions.test.js'],
                         capture_output=True, text=True).stdout
    assert "const waxing = !north.name.includes('waning')" in pre, 'pre-merge predicate not found'
    open(TESTFILE, 'w', encoding='utf-8').write(pre)
    ok, npass, nfail = suite()
    print('pre-merge tree (fe113bf), unmutated README: pass=%d fail=%d ok=%s\n' % (npass, nfail, ok))
    run_battery('BEFORE T-138 (fe113bf, substring predicate)')

    open(TESTFILE, 'w', encoding='utf-8').write(merged)
    ok, npass, nfail = suite()
    restore_readme()
    print('restored merged tree: pass=%d fail=%d ok=%s' % (npass, nfail, ok))
    p = subprocess.run(['git', '-C', REPO, 'diff', '--stat'], capture_output=True, text=True)
    print('git diff --stat after restore: %r' % p.stdout)


if __name__ == '__main__':
    main()
