#!/usr/bin/env python3
"""CONDUCTOR GATE — cycle 41, T-136, remaining clauses (d)(e)(g)."""
import glob
import re
import subprocess

REPO = '/opt/targets/moon'


def sh(args):
    return subprocess.run(args, capture_output=True, text=True, cwd=REPO).stdout


print('=== (e) every Date.now occurrence in the changed file ===')
src = open(REPO + '/test/regressions.test.js', encoding='utf-8').read().split('\n')
hits = [(n + 1, l) for n, l in enumerate(src) if 'Date.now' in l]
if not hits:
    print('  (none)')
for n, l in hits:
    kind = 'COMMENT   ' if l.lstrip().startswith('//') else 'EXECUTABLE'
    print(f'  {kind} {n}: {l.strip()}')
print(f'  -> executable Date.now lines: '
      f'{sum(1 for _, l in hits if not l.lstrip().startswith("//"))}')

print('\n=== (d)(e) TZ matrix, conductor-run, full suite ===')
files = [p[len(REPO) + 1:] for p in sorted(glob.glob(REPO + '/test/*.test.js'))]
import os
for tz in ['UTC', 'Asia/Tokyo', 'Pacific/Kiritimati', 'America/Sao_Paulo']:
    env = dict(os.environ, TZ=tz)
    out = subprocess.run(['node', '--test'] + files, capture_output=True, text=True,
                         cwd=REPO, env=env)
    txt = out.stdout + out.stderr
    m = dict(re.findall(r'^ℹ (pass|fail|tests) (\d+)$', txt, re.M))
    d = re.search(r'duration_ms ([\d.]+)', txt)
    print(f'  TZ={tz:<20} tests {m.get("tests")}  pass {m.get("pass")}  '
          f'fail {m.get("fail")}  duration_ms {d.group(1) if d else "?"}')

print('\n=== (g) working tree state ===')
print(sh(['git', 'status', '--porcelain']) or '  (clean)')
print('--- product files changed by the merge vs pre-merge main (84e3e18) ---')
print(sh(['git', 'diff', '--stat', '84e3e18', 'HEAD', '--',
          'README.md', 'src', 'bin', 'package.json']) or
      '  (blank = README/src/bin/package.json byte-identical)')
print('--- all files changed by the merge ---')
print(sh(['git', 'diff', '--name-only', '84e3e18', 'HEAD']))
