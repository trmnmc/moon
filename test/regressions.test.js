'use strict'

// Regressions from the cycle-1 adversarial QA pass. Each test here corresponds to a
// defect that shipped and was caught by an agent whose job was to attack the build,
// not to confirm it. They are kept in their own file so the origin stays legible.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const BIN = path.join(__dirname, '..', 'bin', 'moon.js')

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
