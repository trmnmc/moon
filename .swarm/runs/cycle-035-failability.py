"""G3, second pass: name the assertions that go red, over the FULL suite glob."""
import glob
import re
import shutil
import subprocess

TARGET = '/opt/targets/moon'
SRC = TARGET + '/src/args.js'
FIXED = '/opt/swarm/runs/c35-fixed-args.js'
BASELINE = '/opt/swarm/runs/c35-baseline-args.js'
FILES = sorted(glob.glob(TARGET + '/test/*.test.js'))
print('test files (%d): %s' % (len(FILES), ', '.join(f.split('/')[-1] for f in FILES)))


def suite():
    p = subprocess.run(['node', '--test', '--test-reporter=tap'] + FILES,
                       cwd=TARGET, capture_output=True, text=True)
    out = p.stdout + p.stderr
    counts = dict(re.findall(r'^# (tests|pass|fail) (\d+)$', out, re.M))
    red = re.findall(r'^not ok \d+ - (.+)$', out, re.M)
    return counts, red


shutil.copy(SRC, FIXED)
shutil.copy(BASELINE, SRC)
counts, red = suite()
print('\nOLD RULE /\'([^\']+)\'/:', counts)
for r in red:
    print('   RED  ' + r.strip()[:100])

shutil.copy(FIXED, SRC)
counts2, red2 = suite()
print("\nFIXED RULE /'(.*)'/s:", counts2, '| red:', red2)
print('restored:', [l.strip() for l in open(SRC) if 'quoted = ' in l])
