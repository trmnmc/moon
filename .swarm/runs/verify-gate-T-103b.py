import re
import subprocess

T = '/opt/targets/moon'
out = []


def say(s=''):
    out.append(s)
    print(s)


# --- Check 1: scope fence ---------------------------------------------------
names = subprocess.run(['git', '-C', T, 'diff', '--name-only'],
                       capture_output=True, text=True).stdout.split()
say('CHECK 1 scope fence')
say('  files changed: %r' % names)
say('  PASS' if names == ['README.md'] else '  FAIL')
say()

# --- Check 2: domain figures match the module constant ----------------------
astro = open(T + '/src/astro.js').read()
m = re.search(r'PHASE_ILLUMINATION_CONSISTENCY_DOMAIN\s*=\s*\{(.*?)\}', astro, re.S)
body = m.group(1)
start_year = re.search(r'startMs:\s*Date\.UTC\((\d+)', body).group(1)
end_year = re.search(r'endMs:\s*Date\.UTC\((\d+)', body).group(1)

readme = open(T + '/README.md').read()
added = [l for l in subprocess.run(['git', '-C', T, 'diff', '-U0', '--', 'README.md'],
                                   capture_output=True, text=True).stdout.splitlines()
         if l.startswith('+') and not l.startswith('+++')]
added_text = '\n'.join(l[1:] for l in added)

say('CHECK 2 domain figures vs module constant')
say('  module startMs year = %s   endMs year = %s' % (start_year, end_year))
nums = re.findall(r'\d+(?:\.\d+)?', added_text)
say('  numerals in added README text: %r' % nums)
figs_ok = start_year in nums and end_year in nums
say('  both module years present: %s' % figs_ok)
say()

# --- Check 3: NO NEW MAGNITUDES ---------------------------------------------
# every numeral in the added text must already exist in the repo (README at HEAD,
# or src/astro.js) in some form.
head_readme = subprocess.run(['git', '-C', T, 'show', 'HEAD:README.md'],
                             capture_output=True, text=True).stdout
say('CHECK 3 no new magnitudes')
unsourced = []
for n in set(nums):
    if n in head_readme or n in astro:
        continue
    unsourced.append(n)
say('  numerals absent from HEAD README and src/astro.js: %r' % unsourced)
say('  PASS' if not unsourced else '  FAIL')
say()

# --- Check 4: THE FRAME RULE ------------------------------------------------
# The module hedges the bound as SAMPLED. Does the README carry that hedge, or
# does it state consistency as established?
say('CHECK 4 frame rule -- does the README hedge match the module hedge?')
doc = astro[astro.index('KI-7: the declared domain'):astro.index(
    'const PHASE_ILLUMINATION_CONSISTENCY_DOMAIN')]
hedge_terms = ['sampl', 'not proven', 'no contradiction', 'spot', 'stride',
               'tested at', 'checked at', 'every point tested']
mod_hedges = [t for t in hedge_terms if t in doc.lower()]
rm_hedges = [t for t in hedge_terms if t in added_text.lower()]
say('  module doc-comment hedge terms present : %r' % mod_hedges)
say('  added README text hedge terms present  : %r' % rm_hedges)

strength = [w for w in ['confirmed', 'proven', 'proves', 'guaranteed', 'verified',
                        'validated', 'ensures'] if w in added_text.lower()]
say('  strength words in added README text    : %r' % strength)
say()
say('  ADDED TEXT VERBATIM:')
for l in added_text.splitlines():
    say('    | ' + l)
say()

# --- Check 5: does the test actually sample? --------------------------------
test = open(T + '/test/astro.test.js').read()
i = test.lower().find('ki-7')
seg = test[i - 200:i + 2600] if i >= 0 else ''
say('CHECK 5 what the KI-7 test actually does')
for kw in ['SAMPLES', 'sample', 'STEPS', 'steps', 'for (let']:
    for mm in re.finditer(re.escape(kw), seg):
        line = seg[:mm.start()].count('\n')
        break
counts = re.findall(r'(?:const|let)\s+(\w*(?:SAMPLE|STEP|COUNT|N)\w*)\s*=\s*([0-9_]+)', seg)
say('  sampling constants found in the KI-7 test: %r' % counts)
say('  literal "exhaust" appears in test: %s' % ('exhaust' in seg.lower()))
say()

open('/opt/swarm/runs/cycle7-gate-out.txt', 'w').write('\n'.join(out))
