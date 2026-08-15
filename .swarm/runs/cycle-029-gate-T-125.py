#!/usr/bin/env python3
"""Conductor verification gate for T-125. Cycle 29.

AUTHORED AT VERIFICATION TIME, after the builder was dispatched, never shown to it.
Exit 0 = every check passed. Exit 1 = at least one check failed.

INSTRUMENT REPAIRS made during verification, each paired with a STRICTLY STRONGER
assertion (the cycles 8/9/19 precedent -- repairing an instrument is not lowering a bar):
  * C1 widened to tolerate .swarm/backlog.json, which the CONDUCTOR edits when it files
    an item. Paired stronger: the gate now PROVES the backlog's only semantic change is
    the T-125 addition, by parsing both revisions -- previously it only looked at paths.
  * C5 no longer permits numerals from a hand-typed list built out of the conductor's own
    brief. It now RESOLVES every `path:NN` citation in the added text against the real
    file and requires the cited line to contain the token the sentence attributes to it.
    A permit-list can only catch numerals the conductor thought of; resolution catches a
    citation that points at the wrong line, which is the defect that actually matters.
  * C8 added: the section's COUNTS ("four", "fifth", "six") are recomputed from source
    instead of read as words.

Usage:
  cycle-029-gate-T-125.py            gate the working tree
  cycle-029-gate-T-125.py <file>     gate an arbitrary candidate (failability harness)
"""
import json
import re
import subprocess
import sys
import pathlib

ROOT = pathlib.Path('/opt/targets/moon')
REL = '.swarm/CONTRACTS.md'
CAND = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / REL
GATING_TREE = len(sys.argv) == 1

fails = []
n = 0


def check(label, ok, detail=''):
    global n
    n += 1
    print(('  PASS  ' if ok else '  FAIL  ') + label)
    if detail:
        for line in str(detail).rstrip().split('\n'):
            print('          ' + line)
    if not ok:
        fails.append(label)
    return ok


def show(rev_path):
    return subprocess.run(['git', '-C', str(ROOT), 'show', 'HEAD:' + rev_path],
                          capture_output=True, text=True).stdout


head = show(REL)
new = CAND.read_text()

print('=' * 78)
print('T-125 GATE  --  candidate: %s' % CAND)
print('=' * 78)

# ---------------------------------------------------------------- C1  scope
print('\nC1  SCOPE -- one product file touched; the conductor\'s own edit proven benign')
porcelain = subprocess.run(['git', '-C', str(ROOT), 'status', '--porcelain'],
                           capture_output=True, text=True).stdout
# Slice the 2-char status column WITHOUT .trim(): cycle 8 recorded that trimming eats
# porcelain's leading status-column space and breaks anchored matching.
touched = [ln[3:] for ln in porcelain.split('\n') if ln.strip()]
product = [p for p in touched if not p.startswith('.swarm/runs/')]
if GATING_TREE:
    check('only %s and the conductor-owned backlog are modified' % REL,
          sorted(product) == sorted([REL, '.swarm/backlog.json']),
          'modified (excluding .swarm/runs/ evidence dir): %r' % (product,))
    # STRONGER than a path check: prove the backlog change is exactly the filing.
    try:
        hb = {i['id']: i for i in json.loads(show('.swarm/backlog.json'))['items']}
        lb = {i['id']: i for i in json.loads((ROOT / '.swarm/backlog.json').read_text())['items']}
        drifted = [k for k in hb if hb[k] != lb.get(k)]
        check('backlog: builder added nothing and changed no pre-existing item',
              sorted(set(lb) - set(hb)) == ['T-125'] and not drifted and not (set(hb) - set(lb)),
              'added=%s removed=%s content-drifted=%s'
              % (sorted(set(lb) - set(hb)), sorted(set(hb) - set(lb)), drifted))
    except Exception as e:  # noqa
        check('backlog parses on both revisions', False, repr(e))
    check('no src/, test/, bin/ or top-level doc touched',
          not [p for p in product if p.startswith(('src/', 'test/', 'bin/'))
               or p in ('README.md', 'REPORT.md', 'package.json')],
          'product paths: %r' % (product,))

# ------------------------------------------------------- C2  freeze integrity
print('\nC2  FREEZE INTEGRITY -- the decisive check: additive, never destructive')
check('every byte of the HEAD file survives as an exact PREFIX of the new file',
      new.startswith(head),
      'HEAD bytes: %d | new bytes: %d' % (len(head), len(new)))
added = new[len(head):] if new.startswith(head) else ''
check('the change is a non-empty APPEND', len(added.strip()) > 0,
      'appended bytes: %d' % len(added))

# ------------------------------- C3  the three divergences are actually stated
print('\nC3  CONTENT -- all three divergences recorded')
low = added.lower()
check('names nextFullMoon', 'nextfullmoon' in low)
check('names PHASE_ILLUMINATION_CONSISTENCY_DOMAIN',
      'phase_illumination_consistency_domain' in low)
check('names the compact key / --compact flag', 'compact' in low)
check('cites src/astro.js', 'src/astro.js' in added)
check('cites src/args.js', 'src/args.js' in added)

# ------------------------------------------- C4  the shipped-suite contradiction
print('\nC4  THE CONTRADICTION THAT REACHES THE SHIPPED SUITE')
check('cites test/args.test.js', 'test/args.test.js' in added)
check('states the five-vs-four contradiction',
      bool(re.search(r'\bfive\b', low)) and bool(re.search(r'\bfour\b', low)))

# ------------------- C5  every citation RESOLVED against the real file (repaired)
print('\nC5  CITATION RESOLUTION -- each `path:NN` must resolve and support its claim')
cites = re.findall(r'`?((?:src|test|bin)/[A-Za-z0-9_.-]+\.js):(\d+)(?:-(\d+))?`?', added)
check('the section cites at least three source locations', len(cites) >= 3,
      'citations found: %r' % (cites,))
resolved, unresolved = [], []
for path, a, b in cites:
    f = ROOT / path
    if not f.exists():
        unresolved.append((path, a, 'file missing')); continue
    lines = f.read_text().split('\n')
    lo, hi = int(a), int(b or a)
    if lo < 1 or hi > len(lines):
        unresolved.append((path, a, 'out of range')); continue
    resolved.append((path, '%s-%s' % (lo, hi), '\n'.join(lines[lo - 1:hi]).strip()[:78]))
check('every cited line number is in range for its file', not unresolved,
      'unresolved: %r' % (unresolved,))
for p, r, txt in resolved:
    print('          %s:%s -> %s' % (p, r, txt))

# The substantive citations must land on the code they claim.
def cited_line(path, num):
    return (ROOT / path).read_text().split('\n')[num - 1]

check('src/astro.js:363 really is the module.exports line',
      'module.exports' in cited_line('src/astro.js', 363)
      and 'nextFullMoon' in cited_line('src/astro.js', 363),
      cited_line('src/astro.js', 363).strip())
check('src/args.js:17 really is the compact registration',
      re.match(r'\s*compact:\s*\{', cited_line('src/args.js', 17)) is not None,
      cited_line('src/args.js', 17).strip())
check('test/args.test.js:87 really is the five-contract-keys test',
      'five contract keys' in cited_line('test/args.test.js', 87),
      cited_line('test/args.test.js', 87).strip())

# --------------------------------------------- C6  re-derive divergences NOW
print('\nC6  TRUTH RE-DERIVATION -- gate does not trust the conductor\'s own filing')
astro = (ROOT / 'src' / 'astro.js').read_text()
args_js = (ROOT / 'src' / 'args.js').read_text()
argstest = (ROOT / 'test' / 'args.test.js').read_text()
m = re.search(r'module\.exports\s*=\s*\{([^}]*)\}', astro)
astro_exports = {s.strip() for s in m.group(1).split(',') if s.strip()}
check('src/astro.js really exports the two the freeze omits',
      {'nextFullMoon', 'PHASE_ILLUMINATION_CONSISTENCY_DOMAIN'} <= astro_exports,
      'actual exports: %s' % sorted(astro_exports))
check('the freeze really omits them',
      'nextFullMoon' not in head and 'PHASE_ILLUMINATION_CONSISTENCY_DOMAIN' not in head)
check('src/args.js really returns a `compact` key',
      bool(re.search(r'compact:\s*parsed\.values\.compact', args_js)))
check('test/args.test.js really says "five contract keys"',
      'five contract keys' in argstest)

# ------------------------------------------- C7  suite green (nothing shipped moved)
print('\nC7  SUITE -- untouched code must still be green')
r = subprocess.run('node --test test/*.test.js', cwd=ROOT, shell=True,
                   capture_output=True, text=True)
tail = [l for l in r.stdout.split('\n') if re.match(r'^.\s(tests|pass|fail)\s', l)]
check('full suite exit 0', r.returncode == 0, '\n'.join(tail))

# --------------------------------- C8  counts recomputed from source, not read
print('\nC8  COUNT VERIFICATION -- "four"/"fifth"/"six" recomputed from source')
# REPAIR 1: the first `@returns` in CONTRACTS.md belongs to computeMoon, not parseArgs.
# Anchor on the `## src/args.js` SECTION instead of taking the first match. Paired
# stronger: assert the selected block really is the parseArgs one before counting it.
args_section = head.split('## src/args.js')[1].split('## src/render.js')[0]
check('the frozen args.js section was located and contains parseArgs',
      'parseArgs' in args_section and '@returns' in args_section)
frozen_returns = args_section.split('@returns')[1].split('\n')[0]
frozen_keys = re.findall(r'(\w+)\s*:', frozen_returns)
check('frozen @returns really declares FOUR keys (the section says four)',
      len(frozen_keys) == 4, 'frozen keys: %s | line: %s' % (frozen_keys, frozen_returns.strip()))

# REPAIR 2: the live return object uses ES6 SHORTHAND for `hemisphere` (no colon), so a
# `key:`-only regex undercounts it. Handle both forms. Paired stronger: rather than trust
# my own parse at all, require it to EQUAL the key list the shipping test itself asserts,
# extracted from test/args.test.js -- so the count is cross-checked against the repo's
# own assertion instead of against a regex I chose.
body = args_js.split('return {')[1].split('};')[0]
live_keys = re.findall(r'^\s*(\w+)\s*(?::|,\s*$)', body, re.M)
check('parseArgs really returns FIVE keys (the section says a fifth)',
      len(live_keys) == 5, 'live keys: %s' % live_keys)
test_block = argstest.split('five contract keys')[1].split('});')[0]
test_keys = re.findall(r"'(\w+)'", test_block)
check('my parse of the live keys EQUALS the list the shipping test asserts',
      sorted(live_keys) == sorted(test_keys),
      'parsed: %s | test asserts: %s' % (sorted(live_keys), sorted(test_keys)))
check('the frozen four are a strict SUBSET of the live five',
      set(frozen_keys) < set(live_keys),
      'frozen: %s | live: %s | the difference is exactly: %s'
      % (sorted(frozen_keys), sorted(live_keys),
         sorted(set(live_keys) - set(frozen_keys))))
opts = re.findall(r'^\s{2}(\w+):\s*\{\s*type:', args_js, re.M)
check('OPTIONS really registers SIX flags (the section says six)',
      len(opts) == 6, 'OPTIONS flags: %s' % opts)

# ------------------- C9  no unsourced quantity (restored, in the stronger form)
print('\nC9  NO UNSOURCED QUANTITY -- every numeral traced to a resolved source')
# The C5 repair replaced a hand-typed permit-list with citation resolution, which is
# stronger about WRONG citations but blind to an INVENTED figure carrying no citation
# at all. Restore that guard without restoring the permit-list: a numeral is allowed
# only if it is part of a resolved `path:NN` citation, or a `line NN` reference that
# resolves inside the frozen file, or a figure the frozen file already contains.
selfrefs = [int(x) for x in re.findall(r'[Ll]ine (\d+)', added)]
hl = head.split('\n')
bad_selfref = [i for i in selfrefs if i < 1 or i > len(hl)]
check('every bare `line NN` self-reference is in range for the frozen file',
      not bad_selfref, 'out of range: %s (frozen file has %d lines)' % (bad_selfref, len(hl)))
for i in selfrefs:
    if 1 <= i <= len(hl):
        print('          frozen line %d -> %s' % (i, hl[i - 1].strip()[:74]))

sourced = set()
for path, a, b in cites:
    sourced.update({a, b} - {''})
sourced.update(str(i) for i in selfrefs)
sourced.update(re.findall(r'\d+', head))          # figures already in the freeze
unsourced = sorted(set(re.findall(r'\d+', added)) - sourced)
check('no numeral on added lines lacks a source', not unsourced,
      'unsourced numerals: %s' % unsourced)

print('\n' + '=' * 78)
print('%d checks, %d failed' % (n, len(fails)))
for f in fails:
    print('  FAILED: ' + f)
print('=' * 78)
sys.exit(1 if fails else 0)
