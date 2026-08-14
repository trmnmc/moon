#!/usr/bin/env python3
"""Conductor-authored mutation harness for T-105 (cycle 16).

Written at VERIFICATION time, never shown to the builder. Copies the repo to a
scratch dir, applies one mutation per run, and asserts test/manifest.test.js
reaches the expected verdict. A mutant that SURVIVES means the assertion that
should have caught it is vacuous.

Mutations touch only the scratch copy. The real repo is never modified.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

REPO = '/opt/targets/moon'
TEST = 'test/manifest.test.js'


def run_suite(work):
    """Run manifest.test.js in `work`. Returns (ok, tail)."""
    p = subprocess.run(
        ['node', '--test', TEST],
        cwd=work, capture_output=True, text=True, timeout=120,
    )
    return p.returncode == 0, (p.stdout + p.stderr)


def fresh(tmp, n):
    work = os.path.join(tmp, 'm%s' % n)
    shutil.copytree(REPO, work, ignore=shutil.ignore_patterns('.git', 'node_modules'))
    return work


def pkg_edit(work, fn):
    path = os.path.join(work, 'package.json')
    with open(path) as f:
        pkg = json.load(f)
    fn(pkg)
    with open(path, 'w') as f:
        json.dump(pkg, f, indent=2)


def m_add_dep(pkg):
    pkg['dependencies'] = {'left-pad': '^1.3.0'}


def m_add_devdep(pkg):
    pkg['devDependencies'] = {'tap': '^16.3.0'}


def m_drop_src(pkg):
    pkg['files'] = [e for e in pkg['files'] if e != 'src/']


def m_stale_entry(pkg):
    pkg['files'] = pkg['files'] + ['LICENSE']


def m_repoint_bin(pkg):
    pkg['bin']['moon'] = 'src/astro.js'


def m_repoint_main(pkg):
    pkg['main'] = 'src/render.js'


def m_drop_main(pkg):
    del pkg['main']


def m_empty_files(pkg):
    pkg['files'] = []


def m_broaden_files(pkg):
    # NEGATIVE CONTROL: a different but still CORRECT allowlist. Must PASS.
    # Proves the coverage check tests the invariant, not the literal value.
    pkg['files'] = ['.']


MUTANTS = [
    ('M1  dependency added                       ', m_add_dep, False),
    ('M2  devDependency added                    ', m_add_devdep, False),
    ('M3  files[] drops src/                     ', m_drop_src, False),
    ('M4  files[] lists a nonexistent LICENSE    ', m_stale_entry, False),
    ('M5  bin.moon repointed to src/astro.js     ', m_repoint_bin, False),
    ('M6  main repointed to src/render.js        ', m_repoint_main, False),
    ('M7  main deleted                           ', m_drop_main, False),
    ('M8  files[] emptied                        ', m_empty_files, False),
    ('M9  files[] broadened to ["."] (CONTROL)   ', m_broaden_files, True),
]


def main():
    tmp = tempfile.mkdtemp(prefix='t105-mut-')
    killed = fail_control = 0
    survived = []
    try:
        # Control: unmutated copy must PASS, else the harness itself is broken.
        work = fresh(tmp, 0)
        ok, out = run_suite(work)
        print('CONTROL unmutated copy -> %s (expect pass)' % ('pass' if ok else 'FAIL'))
        if not ok:
            print(out[-1500:])
            print('HARNESS BROKEN: unmutated copy does not pass. No verdict.')
            return 2

        for i, (name, fn, expect_pass) in enumerate(MUTANTS, start=1):
            work = fresh(tmp, i)
            pkg_edit(work, fn)
            ok, out = run_suite(work)
            if expect_pass:
                mark = 'HELD  ' if ok else 'BROKE '
                if not ok:
                    fail_control += 1
                    survived.append((name, out[-800:]))
                print('%s %s  (negative control: must pass)' % (mark, name))
            else:
                if ok:
                    survived.append((name, out[-800:]))
                    print('SURVIVED %s  <-- vacuous assertion' % name)
                else:
                    killed += 1
                    # Report which assertion fired.
                    line = ''
                    for l in out.splitlines():
                        if 'not ok' in l:
                            line = l.strip()
                            break
                    print('KILLED %s  %s' % (name, line[:90]))

        real = len([m for m in MUTANTS if not m[2]])
        print('')
        print('%d/%d mutants killed; %d/%d negative controls held'
              % (killed, real, 1 - fail_control, 1))
        for name, out in survived:
            print('--- detail: %s ---' % name.strip())
            print(out)
        return 0 if (killed == real and fail_control == 0) else 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
