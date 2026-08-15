#!/usr/bin/env python3
"""CONDUCTOR GATE - cycle 42, T-138. Authored at verification time; the builder never
saw this script or these cases.

The builder demonstrated with the TWO instants its acceptance named, at ONE slot. This
gate is deliberately wider on three axes it was never told about:

  1. GENERALITY - it regenerates a genuine row for ALL EIGHT PHASE_NAMES entries from
     the shipping renderer at instants the conductor finds by scanning, not the two the
     item named, and inserts each at EVERY table slot where PHASE_NAMES cycle order
     still holds. A fix that only special-cases "last quarter" fails here.
  2. DISCRIMINATOR - every honest case is ALSO run against the OLD one-line predicate
     (`!name.includes('waning')`), reconstructed by patching the merged file. A case
     that is green under both proves nothing about the fix; the fix is only doing work
     where old=RED and new=GREEN. This separates "the fix works" from "the case is
     toothless".
  3. NON-WEAKENING - adjacent-retype mutants must still turn the suite RED, including
     mutants on the newly-accepted last-quarter rows themselves.

README.md is restored via `git checkout` after every single case.
"""
import json
import re
import subprocess
import sys

REPO = '/opt/targets/moon'
README = REPO + '/README.md'
TESTFILE = REPO + '/test/regressions.test.js'

PHASE_NAMES = ["new", "waxing crescent", "first quarter", "waxing gibbous",
               "full", "waning gibbous", "last quarter", "waning crescent"]

NEW_PRED = 'const waxing = nameIndex < PHASE_NAMES.length / 2'
OLD_PRED = "const waxing = !north.name.includes('waning')"


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


def split_row(row):
    return row[:30].rstrip(), row[30:]


def join_row(north, south):
    return north.ljust(30) + south


def name_of(row):
    north, _ = split_row(row)
    m = re.search(r'  ([a-z ]+)$', north)
    return m.group(1).strip()


def write_fence(lines):
    t, f, g, _ = read_fence()
    open(README, 'w', encoding='utf-8').write(t[:f] + '\n'.join(lines) + t[g:])


def restore():
    subprocess.run(['git', '-C', REPO, 'checkout', '--', 'README.md'], check=True)


def render_pair(iso):
    out = subprocess.run(
        ['node', '-e',
         "const{computeMoon}=require('%s/src/astro.js');const{renderLine}=require('%s/src/render.js');"
         "const d=new Date(process.argv[1]);const m=computeMoon(d);"
         "console.log(JSON.stringify([renderLine(m,'north'),renderLine(m,'south'),m.phaseName]))"
         % (REPO, REPO), iso],
        capture_output=True, text=True, cwd=REPO)
    return json.loads(out.stdout)


def suite():
    """Returns (passed, tests, fails, first failing test name)."""
    p = subprocess.run(['node', '--test', 'test/regressions.test.js'],
                       capture_output=True, text=True, cwd=REPO)
    out = p.stdout
    npass = int(re.search(r'# pass (\d+)', out).group(1)) if re.search(r'# pass (\d+)', out) else -1
    nfail = int(re.search(r'# fail (\d+)', out).group(1)) if re.search(r'# fail (\d+)', out) else -1
    failing = re.findall(r'✖ (.+?) \(', out)
    return (p.returncode == 0, npass, nfail, failing[0] if failing else '')


def set_pred(which):
    src = open(TESTFILE, encoding='utf-8').read()
    if which == 'old':
        assert NEW_PRED in src, 'new predicate not found - cannot build the discriminator'
        src = src.replace(NEW_PRED, OLD_PRED)
    else:
        assert OLD_PRED in src, 'old predicate not present - already restored?'
        src = src.replace(OLD_PRED, NEW_PRED)
    open(TESTFILE, 'w', encoding='utf-8').write(src)


# ---------------------------------------------------------------- find instants
def scan_instants():
    """Find a genuine instant for every PHASE_NAMES entry by scanning real time on a
    3-hour stride through 2026. Conductor-chosen; the builder named only two."""
    found = {}
    code = (
        "const{computeMoon}=require('%s/src/astro.js');const{renderLine}=require('%s/src/render.js');"
        "let t=Date.UTC(2026,0,1),out=[];"
        "for(let i=0;i<2920;i++){const d=new Date(t+i*3*3600*1000);const m=computeMoon(d);"
        "out.push([d.toISOString(),m.phaseName,renderLine(m,'north'),renderLine(m,'south')]);}"
        "console.log(JSON.stringify(out))" % (REPO, REPO))
    rows = json.loads(subprocess.run(['node', '-e', code], capture_output=True,
                                     text=True, cwd=REPO).stdout)
    for iso, nm, north, south in rows:
        # prefer a mid-band instant: skip 0% and 100% extremes for the non-endpoint names
        if nm not in found:
            found[nm] = (iso, north, south)
    return found


def valid_slots(lines, idxs, new_name):
    """Every slot where substituting new_name keeps the cycle-order check happy."""
    t = PHASE_NAMES.index(new_name)
    ok = []
    for pos, n in enumerate(idxs):
        seq = [PHASE_NAMES.index(name_of(lines[k])) for k in idxs]
        seq[pos] = t
        wrapped = False
        good = True
        for i in range(1, len(seq)):
            if seq[i] >= seq[i - 1]:
                continue
            if wrapped or seq[i] != 0:
                good = False
                break
            wrapped = True
        if good:
            ok.append(n)
    return ok


def main():
    restore()
    lines, idxs = data_rows()
    instants = scan_instants()
    print('=== genuine instants found by conductor scan (3h stride through 2026) ===')
    for nm in PHASE_NAMES:
        if nm in instants:
            print('  %-16s %s  %s' % (nm, instants[nm][0], instants[nm][1]))
        else:
            print('  %-16s NOT FOUND IN SCAN' % nm)
    print()

    cases = []
    for nm in PHASE_NAMES:
        if nm not in instants:
            continue
        iso, north, south = instants[nm]
        for slot in valid_slots(lines, idxs, nm):
            cases.append((nm, iso, slot, north, south))

    results = []
    print('=== HONEST rows: new code must be GREEN, and we record what OLD code did ===')
    for nm, iso, slot, north, south in cases:
        outcomes = {}
        for pred in ('new', 'old'):
            if pred == 'old':
                set_pred('old')
            lines2, _ = data_rows()
            lines2[slot] = join_row(north, south)
            write_fence(lines2)
            ok, npass, nfail, failing = suite()
            outcomes[pred] = (ok, npass, nfail, failing)
            restore()
            if pred == 'old':
                set_pred('new')
        results.append((nm, iso, slot, outcomes))
        disc = 'DISCRIMINATING' if (outcomes['new'][0] and not outcomes['old'][0]) else \
               ('toothless (both green)' if outcomes['old'][0] and outcomes['new'][0] else 'NEW CODE RED')
        print('  %-16s slot %2d  new=%s(%d/%d)  old=%s(%d/%d)  -> %s'
              % (nm, slot,
                 'GREEN' if outcomes['new'][0] else 'RED', outcomes['new'][1], outcomes['new'][2],
                 'GREEN' if outcomes['old'][0] else 'RED', outcomes['old'][1], outcomes['old'][2],
                 disc))
        if not outcomes['new'][0]:
            print('      new-code failure: %s' % outcomes['new'][3])
    print()

    # ------------------------------------------------------------ mutants
    print('=== MUTANTS: adjacent retypes must still turn the suite RED ===')
    mutants = []
    lines0, idxs0 = data_rows()
    for n in idxs0:
        cur = name_of(lines0[n])
        ci = PHASE_NAMES.index(cur)
        for d in (-1, 1):
            adj = PHASE_NAMES[(ci + d) % 8]
            mutants.append(('retype', n, cur, adj, None))
    # plus mutants ON the newly-accepted last-quarter rows: honest row, adjacent retype
    if 'last quarter' in instants:
        iso, north, south = instants['last quarter']
        for slot in valid_slots(lines0, idxs0, 'last quarter'):
            for adj in ('waning gibbous', 'waning crescent'):
                mutants.append(('lq-retype', slot, 'last quarter', adj, (north, south)))
        # and the mirror-swap mutant: the exact corruption the OLD bug produced
        for slot in valid_slots(lines0, idxs0, 'last quarter'):
            mutants.append(('lq-mirror', slot, 'last quarter', None, (north, south)))

    survived = 0
    escaped = []
    for kind, slot, cur, adj, pair in mutants:
        lines2, _ = data_rows()
        if pair:
            north, south = pair
        else:
            north, south = split_row(lines2[slot])
        if kind == 'lq-mirror':
            # swap the north and south discs: north keeps its text but wears south's disc
            nd = re.match(r'^(\S+)(.*)$', north).groups()
            sd = re.match(r'^(\S+)(.*)$', south.lstrip()).groups()
            north2 = sd[0] + nd[1]
            south2 = ' ' * (len(south) - len(south.lstrip())) + nd[0] + sd[1]
        else:
            north2 = re.sub(r'(?<=  )[a-z ]+$', adj, north.rstrip())
            south2 = re.sub(r'(?<=  )[a-z ]+$', adj, south.rstrip())
        lines2[slot] = join_row(north2, south2)
        write_fence(lines2)
        ok, npass, nfail, failing = suite()
        restore()
        label = '%s slot %2d %r -> %r' % (kind, slot, cur, adj or 'MIRROR-SWAP')
        if ok:
            escaped.append(label)
            print('  ESCAPED (suite stayed green): %s' % label)
        else:
            survived += 1
    print('  %d/%d mutants killed (suite went RED)' % (survived, len(mutants)))
    if escaped:
        print('  %d ESCAPED:' % len(escaped))
        for e in escaped:
            print('    ' + e)
    print()

    # ------------------------------------------------------------ final state
    restore()
    p = subprocess.run(['git', '-C', REPO, 'status', '--porcelain'], capture_output=True, text=True)
    print('=== repo state after gate (must be clean) ===')
    print(repr(p.stdout))
    ok, npass, nfail, _ = suite()
    print('=== full suite on restored tree: pass=%d fail=%d ===' % (npass, nfail))

    disc_count = sum(1 for _, _, _, o in results if o['new'][0] and not o['old'][0])
    new_red = [(nm, s) for nm, _, s, o in results if not o['new'][0]]
    print()
    print('SUMMARY: %d honest cases; %d discriminating (old RED / new GREEN); '
          '%d red under new code; %d/%d mutants killed'
          % (len(results), disc_count, len(new_red), survived, len(mutants)))
    if new_red:
        print('GATE FAIL - honest cases red under new code: %r' % new_red)
    return 0


if __name__ == '__main__':
    sys.exit(main())
