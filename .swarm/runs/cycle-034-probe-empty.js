// cycle 34 candidate scan, probe 2: is the empty-token usage message reachable from a
// plain shell, and what does the user actually see (stdout / stderr / exit code)?
const { spawnSync } = require('node:child_process')
const BIN = '/opt/targets/moon/bin/moon.js'

const cases = [
  { label: 'moon ""            (empty-string arg — e.g. moon "$UNSET_OPTS")', argv: [''] },
  { label: 'moon "   "         (whitespace-only arg)', argv: ['   '] },
  { label: 'moon bogus         (CONTROL: ordinary positional)', argv: ['bogus'] },
  { label: 'moon --bogus       (CONTROL: ordinary unknown option)', argv: ['--bogus'] },
  { label: 'moon --json=1      (CONTROL: value passed to a flag)', argv: ['--json=1'] },
]

for (const c of cases) {
  const r = spawnSync(process.execPath, [BIN, ...c.argv], { encoding: 'utf8' })
  console.log('--- ' + c.label)
  console.log('    exit   = ' + r.status)
  console.log('    stdout = ' + JSON.stringify(r.stdout))
  console.log('    stderr = ' + JSON.stringify(r.stderr))
  console.log()
}
