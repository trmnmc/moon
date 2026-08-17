'use strict'

// End-to-end tests for the actual binary. Every other suite tests a pure function;
// this one spawns the real process, because the wiring between modules is exactly
// where a green unit suite can still ship a broken command.
//
// TZ is pinned on every spawn: the build host is UTC, so a test that relies on the
// ambient zone would pass here and mislead on a real machine.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const { HELP } = require('../bin/moon.js')
const { parseArgs } = require('../src/args.js')

const BIN = path.join(__dirname, '..', 'bin', 'moon.js')
const README = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8')
const ARGS_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'args.js'), 'utf8')

function run (args = [], tz = 'UTC') {
  return execFileSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  })
}

function runFailing (args, tz = 'UTC') {
  try {
    execFileSync(process.execPath, [BIN, ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, TZ: tz }
    })
    throw new Error('expected a non-zero exit')
  } catch (err) {
    return { status: err.status, stderr: err.stderr, stdout: err.stdout }
  }
}

// Spawns the real binary with Date pinned to a fixed instant, so a rendered line
// can be produced for a "now" chosen to land the next full moon on a specific kind
// of day (single- vs double-digit), rather than depending on whatever day it is
// when the suite happens to run. Same in-process date-faking idiom as
// test/regressions.test.js (subclass Date so `new Date()`/`Date.now()` return a
// fixed instant), reimplemented here rather than importing it, since that file is
// off limits to edit this cycle.
function runAtFixedInstant (iso, args = []) {
  const script = [
    `const R = Date; const f = new R(${JSON.stringify(iso)});`,
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main(' + JSON.stringify(args) + ');'
  ].join('\n')
  return execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
}

test('default output is exactly two lines: the phase line and the next full moon', () => {
  const out = run()
  const lines = out.replace(/\n$/, '').split('\n')
  assert.equal(lines.length, 2)
  // The day is padStart(2, ' '): a single-digit day prints as " N" (three spaces
  // after "moon" total), a double-digit day as "NN" (two spaces). Both are the
  // correct rendering; only these two shapes are legal, so accept exactly them
  // rather than loosening to \s+ (which would also accept a broken width).
  assert.match(lines[1], /^ +next full moon(?: {3}\d| {2}\d{2}) [A-Z][a-z]{2}/)
})

// The regex above only exercises whatever day-of-month happens to be "today" when
// the suite runs, so it alone cannot prove the single-digit and double-digit
// shapes are actually the SAME column-aligned rendering rather than two
// independently-plausible-looking spellings. Pin "now" to two dates whose next
// full moon lands on a single-digit day (2026-01-03) and a double-digit day
// (2026-06-29) respectively -- picked by calling the repo's own nextFullMoon(now)
// and confirmed below by asserting the produced day actually has the expected
// digit count -- then assert the property the padding exists for: the day's last
// digit lands in the same column on both lines. That is what "right-aligned"
// means, and it is what breaks if padStart(2, ' ') is removed, independent of any
// particular whitespace count.
test('the next-full-moon day right-aligns to the same column for 1- and 2-digit days', () => {
  const singleDigitOut = runAtFixedInstant('2026-01-01T00:00:00Z')
  const doubleDigitOut = runAtFixedInstant('2026-06-01T00:00:00Z')
  const singleLine = singleDigitOut.split('\n').find((l) => l.includes('next full moon'))
  const doubleLine = doubleDigitOut.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(singleLine, 'no next-full-moon line in single-digit-day render')
  assert.ok(doubleLine, 'no next-full-moon line in double-digit-day render')

  const lineRe = /^( +next full moon +)(\d{1,2}) ([A-Z][a-z]{2})/
  const singleMatch = singleLine.match(lineRe)
  const doubleMatch = doubleLine.match(lineRe)
  assert.ok(singleMatch, `unexpected shape: ${JSON.stringify(singleLine)}`)
  assert.ok(doubleMatch, `unexpected shape: ${JSON.stringify(doubleLine)}`)
  assert.equal(singleMatch[2].length, 1,
    `test fixture expected a single-digit day, got: ${JSON.stringify(singleLine)}`)
  assert.equal(doubleMatch[2].length, 2,
    `test fixture expected a double-digit day, got: ${JSON.stringify(doubleLine)}`)

  // Column of the day field's last character = length of everything before the
  // digits (indent + "next full moon" + all the spaces, mandatory and padded)
  // plus the digit count itself. padStart(2, ' ') makes this constant regardless
  // of digit count; without it, the single-digit line would land one column short.
  const singleDayEndCol = singleMatch[1].length + singleMatch[2].length
  const doubleDayEndCol = doubleMatch[1].length + doubleMatch[2].length
  assert.equal(singleDayEndCol, doubleDayEndCol,
    'the day\'s last digit must land in the same column whether the day is 1 or 2 digits ' +
    `(single-digit render: ${JSON.stringify(singleLine)}, ` +
    `double-digit render: ${JSON.stringify(doubleLine)})`)
})

test('--compact collapses to exactly one line (the MOTD/prompt interface)', () => {
  const out = run(['--compact'])
  assert.equal(out.replace(/\n$/, '').split('\n').length, 1)
})

test('the next-full-moon line is indented to the phase-name column', () => {
  const lines = run().replace(/\n$/, '').split('\n')
  const nameStart = lines[0].search(/[a-z]/)
  const secondStart = lines[1].search(/\S/)
  assert.equal(secondStart, nameStart, 'the two lines must align as one readout')
})

test('--south is the horizontal mirror of --north on the disc', () => {
  const north = run(['--north', '--compact']).replace(/\n$/, '')
  const south = run(['--south', '--compact']).replace(/\n$/, '')
  const mirrorMap = { '◖': '◗', '◗': '◖', '▏': '▕', '▕': '▏', '▌': '▐', '▐': '▌' }
  const mirror = (s) => [...s].reverse().map((c) => mirrorMap[c] || c).join('')
  assert.equal(mirror(north.slice(0, 5)), south.slice(0, 5))
  // the text tail must NOT be mirrored — only the disc is
  assert.equal(north.slice(5), south.slice(5))
})

test('--json is parseable, carries the documented fields, and is not a raw float dump', () => {
  const payload = JSON.parse(run(['--json']))
  for (const key of ['phase', 'illumination', 'age', 'cycleFraction', 'phaseAngle',
    'hemisphere', 'nextFullMoon', 'julianDay', 'timestamp']) {
    assert.ok(key in payload, `missing documented field: ${key}`)
  }
  assert.ok(payload.illumination >= 0 && payload.illumination <= 1)
  assert.ok(['north', 'south'].includes(payload.hemisphere))
  assert.ok(!Number.isNaN(Date.parse(payload.nextFullMoon)))
  assert.ok(Date.parse(payload.nextFullMoon) > Date.parse(payload.timestamp))
  // Precision honesty: the algorithm is good to ~1h, so ~1% — no 17-digit floats.
  const decimals = (n) => (String(n).split('.')[1] || '').length
  assert.ok(decimals(payload.illumination) <= 4,
    `illumination claims more precision than earned: ${payload.illumination}`)
  assert.ok(decimals(payload.phaseAngle) <= 3)
})

test('--json hemisphere follows the override flag', () => {
  assert.equal(JSON.parse(run(['--json', '--south'])).hemisphere, 'south')
  assert.equal(JSON.parse(run(['--json', '--north'])).hemisphere, 'north')
})

test('hemisphere is inferred from the ambient timezone when not overridden', () => {
  assert.equal(JSON.parse(run(['--json'], 'Australia/Sydney')).hemisphere, 'south')
  assert.equal(JSON.parse(run(['--json'], 'America/New_York')).hemisphere, 'north')
})

// The --json field set is documented in three independent places: the HELP string's
// "--json fields" block, the README's field/meaning table, and the README's fenced
// json example. Nothing else in this suite reads any of those documents — the field
// list above (line ~68) is a hardcoded restatement that an extra field sails past.
// These parsers pull the field names out of the documents themselves, so a payload
// change that isn't mirrored in every document (or vice versa) fails here instead of
// silently falsifying prose that claims the shape is "stable, documented below".

// The fields block uses exactly two leading spaces before each field name; the
// phaseAngle CAUTION note is a continuation indented to the description column (16
// spaces), so it never matches "exactly two spaces then a non-space" and is skipped.
function fieldsFromHelpText (help) {
  const lines = help.split('\n')
  const start = lines.findIndex((l) => l.trim() === '--json fields')
  assert.ok(start >= 0, 'HELP text has no --json fields section to parse')
  const names = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') break
    const m = /^ {2}(\S+)/.exec(line)
    if (m) names.push(m[1])
  }
  return names
}

// The field table lives under the "## `--json`" heading, between that heading and the
// next "## " heading. Row cells look like "| `name` | meaning |"; the flags table
// elsewhere in the README uses the same pipe syntax but its first cell is "--json"
// etc. (leading dashes), which \w+ does not match, so scoping to the section is a
// belt-and-suspenders check rather than the only thing preventing cross-contamination.
function fieldsFromReadmeTable (readme) {
  const start = readme.indexOf('## `--json`')
  assert.ok(start >= 0, 'README has no --json section to parse')
  const end = readme.indexOf('\n## ', start + 1)
  const section = readme.slice(start, end === -1 ? undefined : end)
  const names = []
  for (const line of section.split('\n')) {
    const m = /^\| `([A-Za-z]\w*)` \|/.exec(line)
    if (m) names.push(m[1])
  }
  return names
}

// The fenced ```json example is the third source: parse it as JSON and take its keys.
function fieldsFromReadmeExample (readme) {
  const m = /```json\n([\s\S]*?)\n```/.exec(readme)
  assert.ok(m, 'README has no fenced json example to parse')
  return Object.keys(JSON.parse(m[1]))
}

test('the three documented --json field lists parse to something non-empty', () => {
  // A parser that silently extracts zero names and then finds two empty sets equal
  // would pin nothing. Guard against document-shape drift breaking the parsers quietly.
  assert.ok(fieldsFromHelpText(HELP).length > 0, 'HELP fields-block parse came back empty')
  assert.ok(fieldsFromReadmeTable(README).length > 0, 'README table parse came back empty')
  assert.ok(fieldsFromReadmeExample(README).length > 0, 'README example parse came back empty')
})

test('--json payload keys, HELP fields, README table, and README example all agree', () => {
  const payloadKeys = Object.keys(JSON.parse(run(['--json'])))
  const helpFields = fieldsFromHelpText(HELP)
  const tableFields = fieldsFromReadmeTable(README)
  const exampleFields = fieldsFromReadmeExample(README)

  const payloadSet = new Set(payloadKeys)
  assert.deepEqual(new Set(helpFields), payloadSet,
    'HELP --json fields block disagrees with the actual payload keys')
  assert.deepEqual(new Set(tableFields), payloadSet,
    'README field table disagrees with the actual payload keys')
  assert.deepEqual(new Set(exampleFields), payloadSet,
    'README fenced json example disagrees with the actual payload keys')
})

test('--block draws a closed frame', () => {
  const lines = run(['--block']).replace(/\n$/, '').split('\n')
  assert.ok(lines[0].startsWith('┌') && lines[0].endsWith('┐'))
  const bottom = lines.find((l) => l.startsWith('└'))
  assert.ok(bottom && bottom.endsWith('┘'))
})

// The accepted flag set is documented in three independent places: src/args.js's
// OPTIONS table (the thing the parser actually reads), the HELP string's "options"
// block, and the README's "## Options" table. Nothing links them structurally — see
// the comment above OPTIONS in src/args.js. These parsers pull the flag names out of
// each artifact itself, so adding or removing a flag in OPTIONS without mirroring it
// in both documents (or vice versa) fails here instead of the CLI shipping a flag
// nobody documented, or documentation for a flag that no longer exists.
//
// -h is --help's short alias (`short: 'h'` in OPTIONS), not a second registered flag,
// so it is not a distinct member of the compared name sets below. Both HELP and the
// README render it as part of --help's row ("-h, --help" / "`-h`, `--help`"); the
// parsers below require that exact alias shape on the --help line and record whether
// they saw it, so a doc edit that silently drops the "-h, " prefix is caught rather
// than just quietly agreeing with a set that never had "h" in it either way.

// OPTIONS is a flat object — every entry is `name: { type: 'boolean'[, short: '_'] },`
// on its own line, with the occasional whole-line comment interspersed (see `compact`).
// The comment lines have no `word:` followed by `{`, so this regex skips them for free.
function optionNamesFromArgsSource (src) {
  const start = src.indexOf('const OPTIONS = {')
  assert.ok(start >= 0, 'src/args.js has no OPTIONS table to parse')
  const end = src.indexOf('\n};', start)
  assert.ok(end >= 0, 'src/args.js OPTIONS table has no closing brace')
  const body = src.slice(start, end)
  const names = []
  for (const line of body.split('\n')) {
    const m = /^\s*(\w+):\s*\{/.exec(line)
    if (m) names.push(m[1])
  }
  return names
}

function optionNamesFromHelpText (help) {
  const lines = help.split('\n')
  const start = lines.findIndex((l) => l.trim() === 'options')
  assert.ok(start >= 0, 'HELP text has no options section to parse')
  const names = []
  let sawHelpAlias = false
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') break
    const alias = /^ {2}-h, --(\S+)/.exec(line)
    const plain = /^ {2}--(\S+)/.exec(line)
    if (alias) {
      names.push(alias[1])
      sawHelpAlias = true
    } else if (plain) {
      names.push(plain[1])
    }
  }
  assert.ok(sawHelpAlias, 'HELP options block does not render -h as --help\'s alias')
  return names
}

// The Options table lives under the "## Options" heading, up to the next "## "
// heading, mirroring fieldsFromReadmeTable's scoping above.
function optionNamesFromReadmeTable (readme) {
  const start = readme.indexOf('## Options')
  assert.ok(start >= 0, 'README has no ## Options section to parse')
  const end = readme.indexOf('\n## ', start + 1)
  const section = readme.slice(start, end === -1 ? undefined : end)
  const names = []
  let sawHelpAlias = false
  for (const line of section.split('\n')) {
    const alias = /^\| `-h`, `--(\w+)` \|/.exec(line)
    const plain = /^\| `--(\w+)` \|/.exec(line)
    if (alias) {
      names.push(alias[1])
      sawHelpAlias = true
    } else if (plain) {
      names.push(plain[1])
    }
  }
  assert.ok(sawHelpAlias, 'README Options table does not render -h as --help\'s alias')
  return names
}

test('the three documented flag-set sources parse to something non-empty', () => {
  // A parser that silently extracts zero names, after which two empty sets compare
  // equal, would pin nothing. Guard against document-shape drift breaking the parsers
  // quietly rather than loudly.
  assert.ok(optionNamesFromArgsSource(ARGS_SRC).length > 0, 'OPTIONS parse came back empty')
  assert.ok(optionNamesFromHelpText(HELP).length > 0, 'HELP options-block parse came back empty')
  assert.ok(optionNamesFromReadmeTable(README).length > 0, 'README Options-table parse came back empty')
})

test('every name the source-side parse extracts is honoured by parseArgs, and a name it does not register is rejected', () => {
  // This is what stops optionNamesFromArgsSource from silently reading a stale block
  // or a comment instead of the live table: each extracted name must actually be
  // accepted by the real parser, and a name absent from OPTIONS must still be rejected.
  for (const name of optionNamesFromArgsSource(ARGS_SRC)) {
    assert.doesNotThrow(() => parseArgs([`--${name}`]),
      `parseArgs rejected --${name}, which was extracted from OPTIONS`)
  }
  assert.equal(parseArgs(['-h']).help, true, '-h must parse as --help\'s short alias')
  assert.throws(() => parseArgs(['--totally-unregistered-flag']), { code: 'EUSAGE' },
    'a flag absent from OPTIONS must be rejected, or the source-side parse could read anything and this test would not notice')
})

test('OPTIONS, the HELP options block, and the README Options table agree on the accepted flag set', () => {
  // run() throws on a non-zero exit, so a reachable --help that exits non-zero fails
  // this test before the parse even runs — the exit-0 half of the old hardcoded test.
  const helpOutput = run(['--help'])
  assert.equal(helpOutput, HELP + '\n', '--help output must be exactly the HELP string')

  const registered = new Set(optionNamesFromArgsSource(ARGS_SRC))
  const helpNames = new Set(optionNamesFromHelpText(helpOutput))
  const readmeNames = new Set(optionNamesFromReadmeTable(README))

  assert.deepEqual(helpNames, registered,
    'HELP options block disagrees with the flags src/args.js actually registers')
  assert.deepEqual(readmeNames, registered,
    'README Options table disagrees with the flags src/args.js actually registers')
})

// bin/moon.js checks opts.help before opts.json on purpose, so --help always wins over
// --json; nothing else in this suite ever passes both flags at once, so nothing holds
// that branch order in place. run() throws on a non-zero exit, covering the exit-0 half.
test('--help wins over --json regardless of flag order: help text, not the JSON payload', () => {
  const helpOnly = run(['--help'])
  assert.equal(run(['--json', '--help']), helpOnly, '--json --help must match --help byte-for-byte')
  assert.equal(run(['--help', '--json']), helpOnly, '--help --json must match --help byte-for-byte')
})

test('an unknown flag exits 2 with a clean one-line message on stderr', () => {
  const { status, stderr, stdout } = runFailing(['--bogus'])
  assert.equal(status, 2)
  assert.equal(stdout, '')
  assert.match(stderr, /^moon: /, "stderr must be anchored with the 'moon: ' prefix at position 0")
  assert.match(stderr, /unknown option '--bogus'/)
  assert.equal(stderr.trim().split('\n').length, 1, 'must not be a stack trace')
})

test('no emoji anywhere in any output mode', () => {
  for (const args of [[], ['--block'], ['--compact'], ['--south'], ['--help']]) {
    for (const ch of run(args)) {
      assert.ok(ch.codePointAt(0) < 0x1F000,
        `emoji leaked into output for ${JSON.stringify(args)}: ${ch}`)
    }
  }
})

// REPORT.md claims "nothing on stderr on success" as VERIFIED, but every helper above
// spawns with execFileSync and no stdio override, so stderr is inherited by this test
// process rather than captured — a stray console.error or deprecation warning on a
// passing run would print to the terminal and go completely unasserted. Use spawnSync
// (never a shell pipe, per L-010) to capture stderr directly and hold every successful
// invocation mode to the same bar: exit 0 and a silent stderr channel.
test('every successful invocation mode writes nothing to stderr', () => {
  const modes = [[], ['--compact'], ['--block'], ['--json'], ['--help']]
  for (const args of modes) {
    const result = spawnSync(process.execPath, [BIN, ...args], {
      encoding: 'utf8',
      env: { ...process.env, TZ: 'UTC' }
    })
    assert.equal(result.status, 0, `${JSON.stringify(args)} must exit 0, got ${result.status}`)
    assert.equal(result.stderr, '', `${JSON.stringify(args)} wrote to stderr: ${result.stderr}`)
  }
})

// T-158 C1: bin/moon.js:100 returns on opts.help before any other opt is read, so --help
// dominates every partner, not just --json (already pinned above). --block, --compact,
// --south, and --north are the four remaining partners named HOLE by the cycle-069
// T-157 matrix (M02/M03/M04 all survived): nothing in the suite spawned --help alongside
// any of them, so a mutant that carves an exception into the :100 gate for one of them
// went undetected. Pin all four, both orders, byte-for-byte against plain --help.
test('--help wins over --block, --compact, --south, and --north regardless of flag order', () => {
  const helpOnly = run(['--help'])
  for (const flag of ['--block', '--compact', '--south', '--north']) {
    assert.equal(run(['--help', flag]), helpOnly, `--help ${flag} must match --help byte-for-byte`)
    assert.equal(run([flag, '--help']), helpOnly, `${flag} --help must match --help byte-for-byte`)
  }
})

// T-158 C2: bin/moon.js:109 returns the JSON payload before the render fork at :125 is
// ever reached, so --json is documented as "stable, structured output for scripting"
// unconditionally — --block and --compact must not leak into it. The T-157 matrix found
// this HOLE (M05/M06 survived): a mutant that let --block or --compact suppress the json
// gate emitted box-drawing art instead of parseable JSON. Assert JSON.parse succeeds and
// the key set matches plain --json, both orders, both partners.
test('--json ignores --block and --compact and still emits the plain --json payload', () => {
  const plainKeys = new Set(Object.keys(JSON.parse(run(['--json']))))
  const pairs = [
    ['--json', '--block'], ['--block', '--json'],
    ['--json', '--compact'], ['--compact', '--json']
  ]
  for (const pair of pairs) {
    const payload = JSON.parse(run(pair))
    assert.deepEqual(new Set(Object.keys(payload)), plainKeys,
      `${pair.join(' ')} must yield the plain --json key set`)
  }
})

// T-158 C5: the line-mode compact guard (bin/moon.js:133) must suppress the next-full-
// moon line regardless of a hemisphere override — README:75/:89 commit --compact to
// exactly one line unconditionally, and the MOTD/prompt use case is exactly a
// southern-hemisphere user writing `moon --compact --south`. The T-157 matrix found this
// HOLE (M09 survived): a mutant that re-enabled the second line whenever a hemisphere
// flag was present passed the existing mirror test, because that test asserts glyphs,
// never line count.
test('--compact --south and --compact --north each collapse to exactly one line', () => {
  for (const flag of ['--south', '--north']) {
    const out = run(['--compact', flag])
    assert.equal(out.replace(/\n$/, '').split('\n').length, 1,
      `--compact ${flag} must be exactly one line`)
  }
})

// T-158 C6: renderBlock (src/render.js:281-301) mirrors the art AND prints an explicit
// "hemisphere southern/northern" row, but the only existing coverage of that mirroring
// calls renderBlock directly (render.test.js) — the bin-level wiring of the hemisphere
// argument at bin/moon.js:127 was unpinned. The T-157 matrix found this HOLE (M10
// survived): a mutant that hardcoded 'north' into that call site made --block --south
// byte-identical to --block --north, including a row that prints the wrong hemisphere
// word at a user who explicitly asked for the other one.
test('--block --south differs from --block --north, and its detail row reports the southern hemisphere', () => {
  const south = run(['--block', '--south'])
  const north = run(['--block', '--north'])
  assert.notEqual(south, north, '--block --south output must differ from --block --north output')
  assert.match(south, /hemisphere +southern/, '--block --south detail row must read "hemisphere southern"')
})
