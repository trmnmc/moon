#!/usr/bin/env python3
"""Conductor check: does T-105's anti-vacuity floor do independent work?

The builder claims `assert.ok(graph.size >= 4)` guards against the regex walk
silently matching nothing. That guard is itself untested by the package.json
mutants, because no manifest edit can break the regex. So mutate the TEST.

V1: neuter the require-scanning regex so the graph collapses to the 2 entry
    files. If the floor is real, the suite fails. If it passes, the coverage
    assertion is vacuous whenever the walk breaks -- the exact trap the
    builder said the floor prevents.
V2: neuter the regex AND drop the floor. Establishes the counterfactual: the
    coverage assertion passes vacuously, proving V1's failure came FROM the
    floor and not from some unrelated assertion.
"""
import os
import shutil
import subprocess
import sys
import tempfile

REPO = '/opt/targets/moon'
TEST = 'test/manifest.test.js'
REGEX = r"""/require\(\s*['"](\.[^'"]+)['"]\s*\)/g"""
NEVER = r"""/require\(\s*['"](\.ZZZNOMATCH[^'"]+)['"]\s*\)/g"""
FLOOR = "assert.ok(graph.size >= 4,"


def run(work):
    p = subprocess.run(['node', '--test', TEST], cwd=work,
                       capture_output=True, text=True, timeout=120)
    return p.returncode == 0, p.stdout + p.stderr


def scratch(tmp, n):
    work = os.path.join(tmp, 'v%d' % n)
    shutil.copytree(REPO, work, ignore=shutil.ignore_patterns('.git', 'node_modules'))
    return work


def main():
    tmp = tempfile.mkdtemp(prefix='t105-vac-')
    try:
        rc = 0
        for n, drop_floor in ((1, False), (2, True)):
            work = scratch(tmp, n)
            path = os.path.join(work, TEST)
            src = open(path).read()
            assert REGEX in src, 'regex literal not found -- harness out of date'
            src = src.replace(REGEX, NEVER)
            if drop_floor:
                assert FLOOR in src, 'floor assertion not found -- harness out of date'
                src = src.replace(FLOOR, "assert.ok(true || graph.size >= 4,")
            open(path, 'w').write(src)

            ok, out = run(work)
            label = 'V2 regex neutered + floor removed' if drop_floor else 'V1 regex neutered'
            want = 'PASS (vacuous, as predicted)' if drop_floor else 'FAIL (floor fires)'
            got = 'pass' if ok else 'fail'
            good = (ok == drop_floor)
            print('%-36s -> %-4s  expect %s  [%s]'
                  % (label, got, want, 'OK' if good else 'UNEXPECTED'))
            if not good:
                rc = 1
            if not ok:
                for l in out.splitlines():
                    if 'not ok' in l or 'too small to be real' in l:
                        print('      %s' % l.strip()[:100])
        return rc
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
