// cycle 34 gate, follow-up measurement: node:util's RAW message for every battery case.
// The `*` fix failed because it anchors on the FIRST quote pair, and node:util's message
// embeds the token inside its own quotes -- so a token that itself begins with an
// apostrophe creates a spurious empty pair. This dump is the ground truth a correct
// token-recovery rule has to be designed against (and it is what the retry brief carries).
const { parseArgs: nodeParseArgs } = require('node:util')

const OPTIONS = {
  json: { type: 'boolean' }, south: { type: 'boolean' }, north: { type: 'boolean' },
  block: { type: 'boolean' }, compact: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
}

const BATTERY = [
  [''], ['   '], ['bogus'], ['--bogus'], ['-x'], ['--json=1'], ['--json='],
  ['--jsno'], ['--sotuh'], ['--helpp'], ['---'], ['--='], ['-'], ['-jh'], ['-h=2'],
  ["it's"], ["'"], ["''"], ["'x'"], ["a'b'c"], ["--it's"], ["--'"], ["--'x'"],
]

console.log('argv'.padEnd(14) + 'code'.padEnd(38) + 'raw message')
console.log('-'.repeat(120))
for (const argv of BATTERY) {
  try {
    nodeParseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false, tokens: true })
    console.log(JSON.stringify(argv).padEnd(14) + '(parsed cleanly)')
  } catch (e) {
    const code = String(e.code).replace('ERR_PARSE_ARGS_', '')
    console.log(JSON.stringify(argv).padEnd(14) + code.padEnd(38) + JSON.stringify(e.message))
  }
}

// How do the candidate recovery rules score against that ground truth?
console.log()
console.log('=== candidate token-recovery rules vs the TRUE token ===')
const RULES = {
  'current /\'([^\']+)\'/ ': /'([^']+)'/,
  "shipped /'([^']*)'/  ": /'([^']*)'/,
  "greedy  /'(.*)'/     ": /'(.*)'/,
}
console.log('argv'.padEnd(14) + 'TRUE token'.padEnd(14) +
  Object.keys(RULES).map((k) => k.padEnd(22)).join(''))
console.log('-'.repeat(120))
for (const argv of BATTERY) {
  let e = null
  try {
    nodeParseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false, tokens: true })
  } catch (err) { e = err }
  if (!e) continue
  // The TRUE token for a positional is argv[0]; for an option error node names the option
  // form, which we do not try to reconstruct -- only positionals are scored here.
  const isPositional = e.code === 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL'
  const truth = isPositional ? JSON.stringify(argv[0]) : '(n/a option)'
  const cells = Object.values(RULES).map((re) => {
    const m = re.exec(e.message)
    const got = m ? JSON.stringify(m[1]) : '(no match)'
    const mark = isPositional ? (got === truth ? ' ok ' : ' XX ') : '    '
    return (mark + got).padEnd(22)
  })
  console.log(JSON.stringify(argv).padEnd(14) + truth.padEnd(14) + cells.join(''))
}
