#!/usr/bin/env python3
"""Conductor check: does T-105's sibling-suite extraction fail LOUDLY? (cycle 16)

The X-mutants prove manifest.test.js is genuinely coupled to the sibling suites.
They do NOT test the failure mode I explicitly required when re-dispatching:
"an extraction that silently yields undefined and then compares undefined ===
undefined is the vacuity trap in a new costume."

So break the extraction itself. In every case below the parse CANNOT succeed,
and package.json is left untouched and correct. A loud extraction fails the
suite. A silent one passes, because the manifest really is fine -- which is
exactly how this defect would hide in production.

E1 BIN const renamed away          -> no match      -> must FAIL
E2 BIN const defined twice         -> ambiguous     -> must FAIL
E3 BIN built from a variable       -> unparseable   -> must FAIL
E4 astro.test.js src require gone  -> no match      -> must FAIL
E5 astro.test.js requires 2 src/   -> ambiguous     -> must FAIL
"""
import os
import shutil
import subprocess
import sys
import tempfile

REPO = '/opt/targets/moon'
TEST = 'test/manifest.test.js'
BIN_LINE = "const BIN = path.join(__dirname, '..', 'bin', 'moon.js')"
ASTRO_REQ = "} = require('../src/astro.js');"

MUTANTS = [
    ('E1 BIN renamed away (no match)      ', 'test/cli.test.js', BIN_LINE,
     "const ENTRY = path.join(__dirname, '..', 'bin', 'moon.js')\nconst BIN = ENTRY"),
    ('E2 BIN defined twice (ambiguous)    ', 'test/cli.test.js', BIN_LINE,
     BIN_LINE + "\nconst BIN2 = path.join(__dirname, '..', 'bin', 'moon.js')\n"
     "const BIN = path.join(__dirname, '..', 'bin', 'moon.js')"),
    ('E3 BIN from a variable (unparseable)', 'test/cli.test.js', BIN_LINE,
     "const SUB = 'bin'\nconst BIN = path.join(__dirname, '..', SUB, 'moon.js')"),
    ('E4 astro src require gone (no match)', 'test/astro.test.js', ASTRO_REQ,
     "} = require(String.fromCharCode(46) + './src/astro.js');"),
    ('E5 astro requires 2 src (ambiguous) ', 'test/astro.test.js', ASTRO_REQ,
     ASTRO_REQ + "\nrequire('../src/render.js');"),
]


def run(work):
    p = subprocess.run(['node', '--test', TEST], cwd=work,
                       capture_output=True, text=True, timeout=120)
    return p.returncode == 0, p.stdout + p.stderr


def main():
    tmp = tempfile.mkdtemp(prefix='t105-extract-')
    rc = 0
    loud = 0
    try:
        for i, (label, target, old, new) in enumerate(MUTANTS, start=1):
            work = os.path.join(tmp, 'e%d' % i)
            shutil.copytree(REPO, work, ignore=shutil.ignore_patterns('.git', 'node_modules'))
            path = os.path.join(work, target)
            src = open(path).read()
            if old not in src:
                print('HARNESS STALE: %r not in %s' % (old[:40], target))
                rc = 2
                continue
            open(path, 'w').write(src.replace(old, new, 1))

            ok, out = run(work)
            if ok:
                print('SILENT %s -> pass  <-- extraction failed QUIETLY' % label)
                rc = 1
            else:
                loud += 1
                reason = ''
                for l in out.splitlines():
                    s = l.strip()
                    if 'could not find' in s or 'ambiguous' in s or 'unparseable' in s or 'has no path segments' in s:
                        reason = s
                        break
                print('LOUD   %s -> fail  %s' % (label, reason[:88]))

        print('')
        print('%d/%d extraction breakages failed loudly' % (loud, len(MUTANTS)))
        return rc
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
