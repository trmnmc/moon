#!/usr/bin/env python3
"""Conductor gate for T-152 (cycle 64). Independent of the builder's harness:
different language, conductor-authored mutation strings, and — the part that makes
it a gate rather than a rerun — two mutants the report claims were KILLED are
included as ATTRIBUTION CONTROLS. A harness that reports SURVIVED for everything
would "confirm" the report while proving nothing; these two must come back RED or
the whole run is uninterpretable.

Verdict logic: for each mutant we assert the suite result matches what the report
claims. Any mismatch fails the gate.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

REPO = '/opt/targets/moon'
BIN = 'bin/moon.js'

# (id, claimed_result, description, old_substring, new_substring)
# CONTROLs are the two claimed KILLs. Everything else is a claimed SURVIVOR.
MUTANTS = [
    ('M1', 'SURVIVED', 'drop the "moon: " stderr prefix',
     "process.stderr.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)",
     "process.stderr.write(`${err && err.message ? err.message : String(err)}\\n`)"),

    ('M8', 'SURVIVED', '--json age precision 3 -> 4',
     "age: round(moon.age, 3),",
     "age: round(moon.age, 4),"),

    ('M17', 'SURVIVED', 'drop the --compact guard on the --block branch',
     "if (!opts.compact) lines.push(nextFullLine(now, 3))",
     "lines.push(nextFullLine(now, 3))"),

    ('M20', 'SURVIVED', 'formatFullMoonDate LOCAL -> UTC date accessors',
     "  const day = String(when.getDate()).padStart(2, ' ')\n"
     "  const month = MONTHS[when.getMonth()]\n"
     "  const year = when.getFullYear() === now.getFullYear() ? '' : ` ${when.getFullYear()}`",
     "  const day = String(when.getUTCDate()).padStart(2, ' ')\n"
     "  const month = MONTHS[when.getUTCMonth()]\n"
     "  const year = when.getUTCFullYear() === now.getUTCFullYear() ? '' : ` ${when.getUTCFullYear()}`"),

    ('M2', 'KILLED', 'CONTROL: parseArgs-throw exit code 2 -> 1',
     "    return 2\n  }",
     "    return 1\n  }"),

    ('M13', 'KILLED', 'CONTROL: --block next-full indent 3 -> 2',
     "if (!opts.compact) lines.push(nextFullLine(now, 3))",
     "if (!opts.compact) lines.push(nextFullLine(now, 2))"),
]

TEST_CMD = ['node', '--test', 'test/args.test.js', 'test/astro.test.js',
            'test/cli.test.js', 'test/contracts.test.js', 'test/hemisphere.test.js',
            'test/manifest.test.js', 'test/regressions.test.js', 'test/render.test.js']


def run_suite(cwd):
    env = dict(os.environ)
    env.pop('TZ', None)
    p = subprocess.run(TEST_CMD, cwd=cwd, capture_output=True, text=True,
                       env=env, timeout=600)
    out = p.stdout + p.stderr
    # node --test emits the TAP form (`# pass N`) when piped in some versions and the
    # spec-reporter form (`ℹ pass N`) in others. v1 of this harness only matched
    # the TAP form, got -1 everywhere, and its `fail == 0` test then mislabelled every
    # green suite as KILLED. Match both, and key the verdict on the EXIT CODE, which
    # needs no parsing at all.
    def grab(label):
        m = re.search(r'^(?:#|ℹ)\s+%s (\d+)' % label, out, re.M)
        return int(m.group(1)) if m else -1
    return {
        'exit': p.returncode,
        'tests': grab('tests'),
        'pass': grab('pass'),
        'fail': grab('fail'),
        'tail': ' '.join('%s=%d' % (k, grab(k)) for k in ('tests', 'pass', 'fail')),
        'failed_names': re.findall(r'^(?:not ok \d+ - |✖ )(.+?)(?: \(\d|$)', out, re.M),
    }


def fresh_tree(dst):
    shutil.copytree(REPO, dst,
                    ignore=shutil.ignore_patterns('.git', 'runs', 'node_modules'))
    return dst


def main():
    results = []
    base = tempfile.mkdtemp(prefix='c064gate-')
    try:
        # 0. baseline on a pristine COPY (proves the copy mechanism itself is sound;
        #    a broken copy would make every mutant "KILLED" and silently invert the gate)
        b = fresh_tree(os.path.join(base, 'baseline'))
        r0 = run_suite(b)
        print('BASELINE (pristine copy):', r0['tail'])
        print('  exit=%d tests=%d pass=%d fail=%d' % (r0['exit'], r0['tests'], r0['pass'], r0['fail']))
        baseline_ok = (r0['exit'] == 0 and r0['fail'] == 0 and r0['tests'] == 147)
        print('  baseline green + 147 tests:', baseline_ok)
        print()

        for mid, claimed, desc, old, new in MUTANTS:
            d = fresh_tree(os.path.join(base, mid))
            path = os.path.join(d, BIN)
            src = open(path).read()
            n = src.count(old)
            if n != 1:
                results.append((mid, claimed, 'ANCHOR-MISS(%d)' % n, desc, None))
                print('%-4s %-9s ANCHOR MISS: pattern occurs %d times -- mutation NOT applied'
                      % (mid, claimed, n))
                continue
            open(path, 'w').write(src.replace(old, new))
            # prove the mutation actually landed
            assert open(path).read() != src
            r = run_suite(d)
            observed = 'SURVIVED' if r['exit'] == 0 else 'KILLED'
            # cross-check the exit code against the parsed counters; if they ever
            # disagree the harness is lying and the gate must not be trusted.
            if r['fail'] >= 0:
                assert (r['fail'] == 0) == (r['exit'] == 0), \
                    '%s: exit code and fail count disagree (%s)' % (mid, r)
            match = observed == claimed
            results.append((mid, claimed, observed, desc, r))
            print('%-4s claimed=%-8s observed=%-8s %s  | %s'
                  % (mid, claimed, observed, 'MATCH' if match else '*** MISMATCH ***', desc))
            print('     exit=%d tests=%d pass=%d fail=%d' % (r['exit'], r['tests'], r['pass'], r['fail']))
            if r['failed_names']:
                for nm in r['failed_names'][:4]:
                    print('       red:', nm)
            print()

        print('=' * 72)
        surv = [x for x in results if x[1] == 'SURVIVED']
        ctrl = [x for x in results if x[1] == 'KILLED']
        surv_ok = all(x[2] == 'SURVIVED' for x in surv)
        ctrl_ok = all(x[2] == 'KILLED' for x in ctrl)
        print('claimed survivors reproduced as SURVIVED : %s  (%d/%d)'
              % (surv_ok, sum(1 for x in surv if x[2] == 'SURVIVED'), len(surv)))
        print('ATTRIBUTION CONTROLS reproduced as KILLED: %s  (%d/%d)'
              % (ctrl_ok, sum(1 for x in ctrl if x[2] == 'KILLED'), len(ctrl)))
        print()
        print('VERDICT:', 'GATE PASS' if (baseline_ok and surv_ok and ctrl_ok) else 'GATE FAIL')
        print('  (controls going red is what proves the SURVIVED verdicts mean something:')
        print('   this harness demonstrably can detect a broken bin/moon.js.)')
        return 0 if (baseline_ok and surv_ok and ctrl_ok) else 1
    finally:
        shutil.rmtree(base, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
