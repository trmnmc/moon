#!/usr/bin/env python3
"""Diagnose why the X1/X2 honest rows trip T-134 rather than the T-136 guard."""
import subprocess

REPO = '/opt/targets/moon'
src = open(REPO + '/.swarm/runs/c41-gate-cases.py', encoding='utf-8').read()
ns = {}
exec(src.split('CASES = []')[0].replace("print('suite files'", "#print('suite files'"), ns)

north, south = ns['render_pair']('2026-07-07T07:30:00Z')
row = ns['join_row'](north, south)
print('generated row:', repr(row))
ns['write_row'](12, row)

t, f, g, fence = ns['read_fence']()
print('--- table as written ---')
for n, l in enumerate(fence.split('\n')):
    print(f'{n:3d} {l!r}')

out = subprocess.run(['node', '--test', 'test/regressions.test.js'],
                     capture_output=True, text=True, cwd=REPO)
txt = out.stdout + out.stderr
i = txt.find('not ok')
print('--- failure ---')
print(txt[i:i + 2500] if i >= 0 else 'NO FAILURE')
ns['restore']()
print('restored:', subprocess.run(['git', '-C', REPO, 'status', '--porcelain', '--', 'README.md'],
                                  capture_output=True, text=True).stdout or 'clean')
