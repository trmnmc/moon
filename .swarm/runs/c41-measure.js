'use strict'
// T-136 measurement harness: builds a reachable (name|illum) set for a given
// sweep config and reports whether specific target pairs are members, plus
// call count / wall time. Used to pick the escalation window shape+size.
const { computeMoon, PHASE_NAMES } = require('../../src/astro.js')
const { renderLine } = require('../../src/render.js')

function parseRun (str) {
  const discEnd = str.indexOf(' ')
  const pctEnd = str.indexOf('%', discEnd)
  const illum = str.slice(discEnd + 1, pctEnd + 1)
  const nameField = str.slice(pctEnd + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nameField.startsWith(n))
  return name + '|' + illum
}

function sweep (startMs, stepMs, spanMs) {
  const steps = Math.floor(spanMs / stepMs)
  const reachable = new Set()
  const t0 = Date.now()
  for (let i = 0; i <= steps; i++) {
    const instant = new Date(startMs + i * stepMs)
    const moon = computeMoon(instant)
    const run = renderLine(moon, 'north')
    reachable.add(parseRun(run))
  }
  const t1 = Date.now()
  return { reachable, steps: steps + 1, ms: t1 - t0 }
}

const START = Date.UTC(2026, 0, 1)

const configs = [
  ['15m/35d (current cheap)', 15 * 60 * 1000, 35 * 24 * 60 * 60 * 1000],
  ['15m/400d', 15 * 60 * 1000, 400 * 24 * 60 * 60 * 1000],
  ['10m/600d', 10 * 60 * 1000, 600 * 24 * 60 * 60 * 1000],
  ['5m/250d', 5 * 60 * 1000, 250 * 24 * 60 * 60 * 1000],
  ['5m/400d', 5 * 60 * 1000, 400 * 24 * 60 * 60 * 1000],
]

const targets = [
  'first quarter| 44%',   // H1
  'waxing gibbous| 55%',  // H2
  'waxing gibbous| 51%',  // M1 (mutant: 51% first quarter -> waxing gibbous)
  'waning crescent| 63%', // M2 (mutant: 63% waning gibbous -> waning crescent)
  'first quarter| 69%'    // M3 (mutant: 69% waxing gibbous -> first quarter)
]

for (const [label, stepMs, spanMs] of configs) {
  const { reachable, steps, ms } = sweep(START, stepMs, spanMs)
  console.log(`\n=== ${label} : ${steps} calls, ${ms}ms, ${reachable.size} distinct pairs ===`)
  for (const t of targets) {
    console.log(`  ${JSON.stringify(t)} reachable=${reachable.has(t)}`)
  }
}
