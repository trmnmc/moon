"""G4: the user-visible claim, exercised through bin/moon.js as a real process.

The module-level gate proves the recovery rule; this proves a user typing it at a shell
actually sees it, with the right exit code and the message on stderr.
"""
import subprocess

CASES = ['', "it's", "'x'", "a'b'c", "'", 'bogus', '--jsno', '--json=1']
for argv in CASES:
    p = subprocess.run(['node', 'bin/moon.js', argv], cwd='/opt/targets/moon',
                       capture_output=True, text=True)
    print('argv=%-10s exit=%d stdout=%r' % (repr(argv), p.returncode, p.stdout[:20]))
    print('   stderr: %s' % p.stderr.strip())
