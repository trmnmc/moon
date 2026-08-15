#!/usr/bin/env python3
"""CONDUCTOR GATE — cycle 41, T-136. Written at verification time; the builder never
saw this script or these cases.

Substitutes rows into README.md's "Why this one" sweep table, runs the FULL suite, and
restores README byte-for-byte via git checkout after every case.

  HONEST rows are regenerated from the SHIPPING renderer at a real instant (so a correct
  guard must accept them).  H1/H2 are the two the acceptance names; X1/X2 are two the
  builder was never told about, drawn from the cycle-40 measurement of pairs the old
  guard false-rejected.
  MUTANT rows are hand-retypes to an adjacent, cycle-order-preserving name (so a working
  guard must reject them).  M1/M2/M3 are the acceptance's; M4/M5 are the conductor's own.
"""
import json
import re
import subprocess
import sys

REPO = '/opt/targets/moon'
README = REPO + '/README.md'


def read_fence():
    t = open(README, encoding='utf-8').read()
    i = t.index('Why this one')
    f = t.index('```', i)
    g = t.index('```', f + 3)
    return t, f + 3, g, t[f + 3:g]


def rows_of(fence):
    lines = fence.split('\n')
    # lines[0] is '', lines[1] the 'north/south' header, data rows follow
    return lines, [n for n, l in enumerate(lines) if n >= 2 and l.strip()]


def split_row(row):
    return row[:30].rstrip(), row[30:]


def join_row(north, south):
    return north.ljust(30) + south


def render_pair(iso):
    out = subprocess.run(
        ['node', '-e',
         "const{computeMoon}=require('%s/src/astro.js');const{renderLine}=require('%s/src/render.js');"
         "const d=new Date(process.argv[1]);"
         "console.log(JSON.stringify([renderLine(computeMoon(d),'north'),renderLine(computeMoon(d),'south')]))"
         % (REPO, REPO), iso],
        capture_output=True, text=True, cwd=REPO)
    return json.loads(out.stdout)


def retype(row, new_name):
    north, south = split_row(row)
    n2 = re.sub(r'(?<=  )[a-z ]+$', new_name, north)
    s2 = re.sub(r'(?<=  )[a-z ]+$', new_name, south.rstrip())
    return join_row(n2, s2)


def write_row(data_idx, new_row):
    """data_idx is 1-based over the data rows."""
    t, f, g, fence = read_fence()
    lines, data = rows_of(fence)
    lines[data[data_idx - 1]] = new_row
    open(README, 'w', encoding='utf-8').write(t[:f] + '\n'.join(lines) + t[g:])


def restore():
    subprocess.run(['git', '-C', REPO, 'checkout', '--', 'README.md'], check=True)


def run_suite():
    out = subprocess.run(['node', '--test'] + [p[len(REPO) + 1:] for p in suite_files()],
                         capture_output=True, text=True, cwd=REPO)
    txt = out.stdout + out.stderr
    m = {k: int(v) for k, v in re.findall(r'^ℹ (pass|fail|tests) (\d+)$', txt, re.M)}
    failing = re.findall(r'^✖ (.+?) \(', txt, re.M)
    dur = re.search(r'duration_ms ([\d.]+)', txt)
    return m, failing, (dur.group(1) if dur else '?'), txt


def suite_files():
    import glob
    return sorted(glob.glob(REPO + '/test/*.test.js'))


CASES = []
for label, kind, idx, iso in [
    # 1-based over the DATA rows.  Slots chosen so the substituted name keeps the
    # table's PHASE_NAMES cycle order — otherwise T-134 fires and the case says nothing
    # about the T-135/T-136 guard under test.  (First run of this script got X1/X2 wrong
    # exactly that way; corrected here rather than reinterpreted.)
    ('H1  honest  (acceptance)      ', 'honest', 3, '2026-02-24T00:28:00Z'),
    ('H2  honest  (acceptance)      ', 'honest', 5, '2026-05-23T23:11:00Z'),
    ('X1  honest  (conductor-only)  ', 'honest', 12, '2026-07-07T07:30:00Z'),
    ('X2  honest  (conductor-only)  ', 'honest', 12, '2026-08-06T14:15:00Z'),
]:
    CASES.append((label, kind, idx, iso))
for label, kind, idx, name in [
    ('M1  mutant  (acceptance)      ', 'mutant', 4, 'waxing gibbous'),
    ('M2  mutant  (acceptance)      ', 'mutant', 11, 'waning crescent'),
    ('M3  mutant  (acceptance)      ', 'mutant', 5, 'first quarter'),
    ('M4  mutant  (conductor-only)  ', 'mutant', 3, 'first quarter'),
    ('M5  mutant  (conductor-only)  ', 'mutant', 11, 'last quarter'),
]:
    CASES.append((label, kind, idx, name))

print('suite files:', [p.split("/")[-1] for p in suite_files()])
restore()
m, failing, dur, _raw = run_suite()
print(f'CONTROL (unmodified README): pass {m.get("pass")} fail {m.get("fail")} duration_ms {dur}')
if m.get('fail'):
    print('control is not green — aborting'); sys.exit(1)

results = []
for label, kind, idx, arg in CASES:
    t, f, g, fence = read_fence()
    lines, data = rows_of(fence)
    orig = lines[data[idx - 1]]
    if kind == 'honest':
        north, south = render_pair(arg)
        new_row = join_row(north, south)
        detail = f'row {idx} <- shipping renderer @ {arg}'
    else:
        new_row = retype(orig, arg)
        detail = f'row {idx} name retyped -> "{arg}"'
    write_row(idx, new_row)
    m, failing, dur, raw = run_suite()
    if (kind == 'honest') != (m.get('fail') == 0):
        i = raw.find('not ok')
        print('--- UNEXPECTED RESULT, raw failure text ---')
        print(raw[i:i + 1800] if i >= 0 else raw[-1800:])
        print('--- table as written ---')
        _t, _f, _g, _fence = read_fence()
        for _n, _l in enumerate(_fence.split('\n')):
            print(f'  {_n:3d} {_l!r}')
    restore()
    want_green = (kind == 'honest')
    got_green = (m.get('fail') == 0)
    guard_fired = any('T-135/T-136' in f for f in failing)
    if want_green:
        verdict = 'PASS' if got_green else '*** GATE FAIL ***'
    else:
        # a mutant must be killed BY THE GUARD UNDER TEST, not merely by some other
        # README test happening to notice — otherwise the case proves nothing about T-136
        verdict = 'PASS' if (not got_green and guard_fired) else '*** GATE FAIL ***'
    results.append((label, verdict))
    print(f'\n{label} {detail}')
    print(f'   new row: {new_row!r}')
    print(f'   -> pass {m.get("pass")} fail {m.get("fail")} duration_ms {dur}  '
          f'expected {"GREEN" if want_green else "RED"}  {verdict}')
    for fl in failing[:3]:
        print(f'   failing test: {fl}')
    # prove restoration
    d = subprocess.run(['git', '-C', REPO, 'diff', '--stat', '--', 'README.md'],
                       capture_output=True, text=True).stdout.strip()
    print(f'   README restored: {"clean" if d == "" else "DIRTY: " + d}')

m, failing, dur, _raw = run_suite()
print(f'\nCONTROL (after all cases): pass {m.get("pass")} fail {m.get("fail")} duration_ms {dur}')
print('\n=== SUMMARY ===')
for label, verdict in results:
    print(f'  {label} {verdict}')
print('OVERALL:', 'ALL GATE CASES PASS' if all(v == 'PASS' for _, v in results) else 'GATE FAILED')
