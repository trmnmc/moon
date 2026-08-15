'use strict'
// CONDUCTOR GATE SCRIPT — cycle 41, T-136. Written at verification time; the builder
// never saw it. Two jobs:
//   (1) re-measure, independently, every row of the table the committed comment prints,
//       using the same computeMoon+renderLine+parse path the committed test uses;
//   (2) find real instants for two honest pairs the builder was NEVER told about
//       (last quarter|56%, last quarter|44% — measured as false-rejected at cycle 40),
//       and check two adjacent-retype mutants the builder was never told about
//       (first quarter|32%, last quarter|63%).
const { computeMoon, PHASE_NAMES } = require('../../src/astro.js')
const { renderLine } = require('../../src/render.js')

// byte-for-byte the parse the committed test does (test/regressions.test.js:265)
function parseKey (str) {
  const discEnd = str.indexOf(' ')
  const pctEnd = str.indexOf('%', discEnd)
  const illum = str.slice(discEnd + 1, pctEnd + 1)
  const nameField = str.slice(pctEnd + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nameField.startsWith(n))
  return name + '|' + illum
}

function sweep (startMs, stepMs, spanMs, wanted) {
  const steps = Math.floor(spanMs / stepMs)
  const reachable = new Set()
  const firstInstant = new Map()
  const t0 = Date.now()
  for (let i = 0; i <= steps; i++) {
    const ms = startMs + i * stepMs
    const key = parseKey(renderLine(computeMoon(new Date(ms)), 'north'))
    reachable.add(key)
    if (wanted && wanted.has(key) && !firstInstant.has(key)) firstInstant.set(key, ms)
  }
  return { reachable, calls: steps + 1, ms: Date.now() - t0, firstInstant }
}

const START = Date.UTC(2026, 0, 1)
const D = 24 * 60 * 60 * 1000
const M = 60 * 1000

const WANT = new Set([
  'first quarter| 44%', // H1  — builder knew
  'waxing gibbous| 55%', // H2  — builder knew
  'last quarter| 56%', // X1  — builder NEVER told
  'last quarter| 44%', // X2  — builder NEVER told
  'waxing gibbous| 51%', // M1  — builder knew
  'waning crescent| 63%', // M2  — builder knew
  'first quarter| 69%', // M3  — builder knew
  'first quarter| 32%', // M4  — conductor's own mutant, builder NEVER told
  'last quarter| 63%' // M5  — conductor's own mutant, builder NEVER told
])

const configs = (process.argv[2] === 'long')
  ? [['5m/30y', 5 * M, 30 * 365 * D], ['1m/10y', 1 * M, 10 * 365 * D]]
  : [['15m/35d', 15 * M, 35 * D], ['15m/400d', 15 * M, 400 * D], ['10m/600d', 10 * M, 600 * D]]

for (const [label, stepMs, spanMs] of configs) {
  const r = sweep(START, stepMs, spanMs, WANT)
  console.log(`\n=== ${label}: ${r.calls} calls, ${r.reachable.size} distinct pairs, ${r.ms}ms ===`)
  for (const k of WANT) {
    const inst = r.firstInstant.get(k)
    console.log(`  ${r.reachable.has(k) ? 'REACHABLE  ' : 'unreachable'} ${JSON.stringify(k)}` +
      (inst ? `  first at ${new Date(inst).toISOString()}` : ''))
  }
}
