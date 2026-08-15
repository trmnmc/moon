// cycle 34 VALUE_LOOP candidate scan, probe 1:
// can the CLI (argv is ALWAYS string[]) reach src/args.js's uncovered `default:`
// branch in toUsageError (lines 61-63)? If yes, the uncovered branch is a real user
// path. If no, it is only reachable programmatically.
const { parseArgs } = require('/opt/targets/moon/src/args.js')

const cases = [
  [], ['--'], ['-'], ['---'], ['--='], ['--=x'], ['--json='], ['--json=1'],
  ['-h=2'], ['-jh'], ['-hj'], ['-x'], ['--JSON'], [''], ['--json', 'extra'],
  ['--json', '--'], ['--', '-x'], ['--no-json'], ['--help', 'x'],
  ['--json', '--json'], ['--south', '--north'], ['--north', '--south'],
]

for (const c of cases) {
  let out
  try {
    out = 'OK   ' + JSON.stringify(parseArgs(c))
  } catch (e) {
    out = 'ERR  code=' + e.code + ' :: ' + e.message
  }
  console.log(JSON.stringify(c).padEnd(26), out)
}
