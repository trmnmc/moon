'use strict'

// End-to-end tests for the actual binary. Every other suite tests a pure function;
// this one spawns the real process, because the wiring between modules is exactly
// where a green unit suite can still ship a broken command.
//
// TZ is pinned on every spawn: the build host is UTC, so a test that relies on the
// ambient zone would pass here and mislead on a real machine.

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

test('default output is exactly two lines: the phase line and the next full moon', () => {
  const out = run()
  const lines = out.replace(/\n$/, '').split('\n')
  assert.equal(lines.length, 2)
  assert.match(lines[1], /^ +next full moon {2}\d{1,2} [A-Z][a-z]{2}/)
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

test('--block draws a closed frame', () => {
  const lines = run(['--block']).replace(/\n$/, '').split('\n')
  assert.ok(lines[0].startsWith('┌') && lines[0].endsWith('┐'))
  const bottom = lines.find((l) => l.startsWith('└'))
  assert.ok(bottom && bottom.endsWith('┘'))
})

test('--help exits 0 and documents every flag it accepts', () => {
  const out = run(['--help'])
  for (const flag of ['--json', '--block', '--compact', '--south', '--north', '--help']) {
    assert.ok(out.includes(flag), `help text omits ${flag}`)
  }
})

test('an unknown flag exits 2 with a clean one-line message on stderr', () => {
  const { status, stderr, stdout } = runFailing(['--bogus'])
  assert.equal(status, 2)
  assert.equal(stdout, '')
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
