#!/usr/bin/env python3
"""Conductor discriminator for T-105's cross-file coupling claim (cycle 16).

The package.json mutants in mutate-T-105.py cannot test the claim that
manifest.test.js is COUPLED to the sibling suites -- every one of them edits
the manifest, and the coupling is about the other direction. These mutants
leave package.json untouched and repoint the SIBLING SUITES instead.

An honest coupling fails here. A pair of matching hardcoded literals passes.
That is the whole discriminator: a faked coupling cannot produce this failure.

X1: test/cli.test.js's BIN -> src/astro.js       (manifest untouched)
X2: test/astro.test.js's require -> ../src/render.js  (manifest untouched)

Both must FAIL manifest.test.js. X3 is the negative control: a cosmetic edit
to cli.test.js that does NOT change which file it spawns must still PASS, so
a test that merely checksums the sibling file can't score here either.
"""
import os
import shutil
import subprocess
import sys
import tempfile

REPO = '/opt/targets/moon'
TEST = 'test/manifest.test.js'

# (label, target file, old substring, new substring, expect_pass)
MUTANTS = [
    ('X1 cli.test.js BIN -> src/astro.js      ',
     'test/cli.test.js',
     "const BIN = path.join(__dirname, '..', 'bin', 'moon.js')",
     "const BIN = path.join(__dirname, '..', 'src', 'astro.js')",
     False),
    ('X2 astro.test.js require -> src/render  ',
     'test/astro.test.js',
     "} = require('../src/astro.js');",
     "} = require('../src/render.js');",
     False),
    ('X3 cli.test.js cosmetic edit (CONTROL)  ',
     'test/cli.test.js',
     "const BIN = path.join(__dirname, '..', 'bin', 'moon.js')",
     "const BIN = path.join(__dirname, '..', 'bin', 'moon.js') // cosmetic",
     True),
]


def run(work):
    p = subprocess.run(['node', '--test', TEST], cwd=work,
                       capture_output=True, text=True, timeout=120)
    return p.returncode == 0, p.stdout + p.stderr


def scratch(tmp, n):
    work = os.path.join(tmp, 'x%d' % n)
    shutil.copytree(REPO, work, ignore=shutil.ignore_patterns('.git', 'node_modules'))
    return work


def main():
    tmp = tempfile.mkdtemp(prefix='t105-xfile-')
    rc = 0
    try:
        work = scratch(tmp, 0)
        ok, out = run(work)
        print('CONTROL unmutated -> %s (expect pass)' % ('pass' if ok else 'FAIL'))
        if not ok:
            print(out[-1200:])
            return 2

        for i, (label, target, old, new, expect_pass) in enumerate(MUTANTS, start=1):
            work = scratch(tmp, i)
            path = os.path.join(work, target)
            src = open(path).read()
            if old not in src:
                print('HARNESS STALE: %r not found in %s' % (old[:40], target))
                rc = 2
                continue
            open(path, 'w').write(src.replace(old, new, 1))

            # X2 repoints what astro.test.js requires; that suite will now fail on
            # its own. Only manifest.test.js's verdict is under test here.
            ok, out = run(work)
            good = (ok == expect_pass)
            print('%s -> %-4s expect %-4s [%s]'
                  % (label, 'pass' if ok else 'fail',
                     'pass' if expect_pass else 'fail',
                     'OK' if good else 'MISSED'))
            if not good:
                rc = 1
            if not ok:
                for l in out.splitlines():
                    if 'not ok' in l:
                        print('      %s' % l.strip()[:100])
                        break
        return rc
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
