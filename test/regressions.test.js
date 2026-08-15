'use strict'

// Regressions from the cycle-1 adversarial QA pass. Each test here corresponds to a
// defect that shipped and was caught by an agent whose job was to attack the build,
// not to confirm it. They are kept in their own file so the origin stays legible.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const BIN = path.join(__dirname, '..', 'bin', 'moon.js')
const REPO_ROOT = path.join(__dirname, '..')
const README = path.join(REPO_ROOT, 'README.md')

// Pulls the prose + code between a "## Heading" and the next "## " heading (or EOF).
// Plain string search on purpose: a regex `$` anchor here would need the `m` flag to
// match "## " at a line start, but `m` also makes `$` match at every line end, not just
// the section end, silently truncating the capture to one line.
function readmeSection (heading) {
  const text = fs.readFileSync(README, 'utf8')
  const marker = '\n## ' + heading + '\n'
  const start = text.indexOf(marker)
  assert.ok(start !== -1, `README has no "## ${heading}" section`)
  const contentStart = start + marker.length
  const nextHeading = text.indexOf('\n## ', contentStart)
  return text.slice(contentStart, nextHeading === -1 ? text.length : nextHeading)
}

// Pulls every fenced ```sh block out of a section, in order.
function shBlocks (section) {
  const blocks = []
  const re = /```sh\n([\s\S]*?)```/g
  let m
  while ((m = re.exec(section))) blocks.push(m[1])
  return blocks
}

function run (args = [], tz = 'UTC') {
  return execFileSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  })
}

// D2 — --help described phaseAngle as plain "degrees, 0..360". Combined with the
// spec's textbook k = (1+cos i)/2, that led a scripter to the exact inverse of the
// truth: 95.9% for a 4% moon.
test('help does not mis-describe phaseAngle, and warns about the inverse', () => {
  const out = run(['--help'])
  assert.match(out, /elongation in degrees/)
  assert.match(out, /inverse/)
})

test('applying the textbook formula to phaseAngle really does invert illumination', () => {
  // Pins the reason the warning above must exist; if phaseAngle's meaning ever
  // changes, this test fails and the help text must be revisited.
  const j = JSON.parse(run(['--json']))
  const naive = (1 + Math.cos(j.phaseAngle * Math.PI / 180)) / 2
  assert.ok(Math.abs((j.illumination + naive) - 1) < 0.01,
    'phaseAngle is elongation; naive + true should sum to 1')
})

// D3 — a .trim() silently undid the padStart(2) on the day number, so single-digit
// days lost the alignment the code had just asked for.
test('single-digit full-moon days keep their leading pad', () => {
  const script = [
    "const R = Date; const f = new R('2026-01-01T00:00:00Z');",
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main([]);'
  ].join('\n')
  const out = execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
  const dateLine = out.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(dateLine, 'no next-full-moon line produced')
  assert.match(dateLine, /next full moon {2} \d /,
    'single-digit day must be right-aligned under two-digit days: ' +
    JSON.stringify(dateLine))
})

// D4 — the block form indented the next-full-moon line to column 3 while the block's
// own labels sit at column 4.
test('block next-full-moon line aligns with the block label column', () => {
  const lines = run(['--block']).replace(/\n$/, '').split('\n')
  const label = lines.find((l) => l.includes('phase '))
  const next = lines.find((l) => l.includes('next full moon'))
  assert.ok(label && next, 'expected both a label row and a next-full-moon row')
  assert.equal(next.search(/\S/), label.indexOf('phase'))
})

// O5 — two help lines ran to 84 and 82 columns and wrapped on a default terminal.
test('help stays within 80 columns', () => {
  for (const line of run(['--help']).split('\n')) {
    assert.ok(line.length <= 80, `help line is ${line.length} cols: ${line}`)
  }
})

// T-106 — formatFullMoonDate's year ternary (bin/moon.js) compares when.getFullYear()
// against now.getFullYear() and only appends the year on a mismatch. Nothing exercised
// the branch where the next full moon actually crosses into the following calendar
// year, so a flipped comparison (or a ternary that always/never appends) would have
// shipped silently. 2025-12-30T00:00:00Z was picked by calling the repo's own
// nextFullMoon(now) from a throwaway node -e and scanning late Decembers for a "now"
// whose next full moon lands in January of the next year: it resolves to
// 2026-01-03T10:02:50Z, i.e. year 2026 while "now" is 2025 — a genuine cross-year case,
// not an assumed one.
test('next-full-moon date carries the year when it falls in a later calendar year', () => {
  const script = [
    "const R = Date; const f = new R('2025-12-30T00:00:00Z');",
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main([]);'
  ].join('\n')
  const out = execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
  const dateLine = out.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(dateLine, 'no next-full-moon line produced')
  assert.match(dateLine, /next full moon\s+3 Jan 2026$/,
    'next full moon on 2026-01-03 must print the specific year 2026 when "now" is ' +
    'still 2025: ' + JSON.stringify(dateLine))
})

// T-106 — same defect, opposite branch: when the next full moon stays within the
// current calendar year the ternary must yield '', not just "some year absent from
// this string". 2026-06-01T00:00:00Z was confirmed the same way, via nextFullMoon(now)
// in a throwaway node -e: it resolves to 2026-06-29T23:56:38Z, still 2026. A ternary
// that always appends the year would fail this test even though the cross-year test
// above would still pass it.
test('next-full-moon date omits the year when it falls in the current calendar year', () => {
  const script = [
    "const R = Date; const f = new R('2026-06-01T00:00:00Z');",
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main([]);'
  ].join('\n')
  const out = execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
  const dateLine = out.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(dateLine, 'no next-full-moon line produced')
  assert.match(dateLine, /next full moon\s+29 Jun$/,
    'next full moon on 2026-06-29 with "now" also 2026 must omit the year suffix: ' +
    JSON.stringify(dateLine))
})

// T-131 — every command in README's Install section carried an unresolved `YOUR_USER`
// placeholder (npx github:YOUR_USER/moon, and the git-clone equivalent), so the very
// first command a reader saw was not runnable as written. `gh api repos/YOUR_USER/moon`
// 404s; there is no such user.
test('README Install section leads with a command that actually runs', () => {
  const section = readmeSection('Install')
  const blocks = shBlocks(section)
  assert.ok(blocks.length > 0, 'Install section has no ```sh command block')

  // The first command block is presented as the thing to run right now. It must
  // contain no unresolved placeholder, and it must actually work from the repo root —
  // the same condition a reader who has cloned this repo is in.
  assert.doesNotMatch(blocks[0], /YOUR_USER|<[^>]+>/,
    'first Install command still carries an unresolved placeholder: ' +
    JSON.stringify(blocks[0]))

  const out = execFileSync('bash', ['-c', blocks[0]],
    { cwd: REPO_ROOT, encoding: 'utf8' })
  assert.match(out, /\d+%\s+(new|waxing|first quarter|waning|full)/,
    'first Install command did not produce a real moon readout: ' + JSON.stringify(out))
})

// T-131 — any placeholder that survives elsewhere in Install must be labelled as one,
// not left looking like a literal value a reader could paste and run.
test('README Install section labels every surviving placeholder', () => {
  const section = readmeSection('Install')
  assert.doesNotMatch(section, /YOUR_USER/,
    'Install section still contains the bare YOUR_USER placeholder')

  const placeholders = section.match(/<[^>]+>/g) || []
  for (const p of placeholders) {
    assert.match(section, new RegExp('`' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '`[^.]*\\bplaceholder\\b'),
    `placeholder ${p} appears but is never explicitly called a placeholder`)
  }
})

// T-131 — the ~/.zshrc snippet showed `npx github:YOUR_USER/moon --compact`, i.e. a
// fetch-from-git-on-every-render command, immediately followed by a paragraph telling
// the reader not to do exactly that because it's slow. The snippet must not show the
// form the surrounding prose retracts.
test('README zshrc prompt snippet does not use the npx fetch-on-render form', () => {
  const section = readmeSection('In your prompt or MOTD')
  const blocks = shBlocks(section)
  const zshrcBlock = blocks.find((b) => b.includes('.zshrc'))
  assert.ok(zshrcBlock, 'no ~/.zshrc code block found in the prompt/MOTD section')
  assert.doesNotMatch(zshrcBlock, /npx/,
    'the ~/.zshrc snippet still uses npx, the form the next paragraph says is too ' +
    'slow for prompt rendering: ' + JSON.stringify(zshrcBlock))
})
