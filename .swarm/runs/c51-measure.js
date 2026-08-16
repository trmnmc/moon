'use strict'
// cycle 51 — conductor evidence for T-139.
//
// Two questions, both measured against the SHIPPING renderer, never asserted:
//
//   Q1. Are the three cycle-42 adjacent-retype survivors — 100% "full" retyped to
//       "waxing gibbous" and to "waning gibbous", 0% "new" retyped to "waning
//       crescent" — actually MEMBERS of the reachable sets the T-135/T-136 guard
//       consults? If they are, the guard passing them is correct behaviour (a
//       BOUNDARY), not an escape (a HOLE). If they are NOT members, the item's
//       premise is wrong and those mutants would have been killed.
//
//   Q2. Do the three reachability instants T-139's `why` cites actually render those
//       pairs today? The acceptance forbids copying them from the item, so they get
//       re-derived here from the renderer itself.
//
// Usage: node .swarm/runs/c51-measure.js
const { computeMoon, PHASE_NAMES } = require('../../src/astro.js')
const { renderLine } = require('../../src/render.js')

// Same field-by-content parse the test file uses (test/regressions.test.js:265) —
// disc up to the first space, illum up to the following "%", name matched against
// PHASE_NAMES. Reproduced rather than imported because the test file exports nothing.
function parseRenderedRun (str) {
  const discEnd = str.indexOf(' ')
  const disc = str.slice(0, discEnd)
  const pctEnd = str.indexOf('%', discEnd)
  const illum = str.slice(discEnd + 1, pctEnd + 1)
  const nameField = str.slice(pctEnd + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nameField.startsWith(n))
  return { disc, illum, name }
}

const key = (name, illum) => name + '|' + illum

// Exactly the guard's own constants (test/regressions.test.js, REACHABILITY_* /
// ESCALATED_*), so this measures the set the guard really consults.
const START = Date.UTC(2026, 0, 1)
const STEP = 15 * 60 * 1000
const CHEAP_SPAN = 35 * 24 * 60 * 60 * 1000
const ESC_SPAN = 400 * 24 * 60 * 60 * 1000

// Builds the reachable set AND remembers the first instant that produced each pair,
// so a membership answer comes with a citable witness instead of a bare boolean.
function buildWithWitness (startMs, stepMs, spanMs) {
  const witness = new Map()
  const steps = Math.floor(spanMs / stepMs)
  for (let i = 0; i <= steps; i++) {
    const instant = new Date(startMs + i * stepMs)
    const run = parseRenderedRun(renderLine(computeMoon(instant), 'north'))
    const k = key(run.name, run.illum)
    if (!witness.has(k)) witness.set(k, instant)
  }
  return witness
}

console.log('=== Q1: are the three survivors members of the guard\'s reachable sets? ===')
const cheap = buildWithWitness(START, STEP, CHEAP_SPAN)
const esc = buildWithWitness(START, STEP, ESC_SPAN)
console.log('cheap sweep (35d/15m): ' + cheap.size + ' distinct pairs')
console.log('escalated  (400d/15m): ' + esc.size + ' distinct pairs')

// The README rows the mutants are retypes OF, and the retyped names.
// The illum field parseRenderedRun returns is exactly what sits between the disc's
// trailing space and the "%", i.e. right-aligned in 3 columns plus the sign: "100%",
// "  0%", " 51%". Taken verbatim from the README rows rather than reconstructed.
const CASES = [
  { row: '100%', illum: '100%', truth: 'full', mutant: 'waxing gibbous' },
  { row: '100%', illum: '100%', truth: 'full', mutant: 'waning gibbous' },
  { row: '0%', illum: '  0%', truth: 'new', mutant: 'waning crescent' }
]

for (const c of CASES) {
  for (const pair of [['truth', c.truth], ['mutant', c.mutant]]) {
    const label = pair[0]
    const name = pair[1]
    const k = key(name, c.illum)
    const w = cheap.get(k) || esc.get(k)
    const where = cheap.has(k) ? 'CHEAP' : (esc.has(k) ? 'ESCALATED' : 'ABSENT from both')
    console.log(
      '  ' + c.row.padStart(4) + ' ' + label.padEnd(6) + ' ' +
      JSON.stringify(name).padEnd(18) + ' -> ' + where +
      (w ? '  first witness ' + w.toISOString() : '')
    )
  }
}

console.log()
console.log('=== control: three known interior mutants, which SHOULD be absent ===')
const CONTROLS = [
  ['waxing gibbous', ' 51%'], ['waning crescent', ' 63%'], ['first quarter', ' 69%']
]
for (const c of CONTROLS) {
  const k = key(c[0], c[1])
  console.log('  ' + JSON.stringify(c[0]).padEnd(18) + ' ' + c[1] + ' -> ' +
    (cheap.has(k) ? 'CHEAP' : (esc.has(k) ? 'ESCALATED' : 'ABSENT from both')))
}

console.log()
console.log('=== Q2: do T-139\'s cited 2020 instants render what it claims? ===')
const CITED = ['2020-01-10T04:30:00Z', '2020-01-11T07:30:00Z', '2020-01-24T05:00:00Z']
for (const iso of CITED) {
  const line = renderLine(computeMoon(new Date(iso)), 'north')
  const run = parseRenderedRun(line)
  console.log('  ' + iso + ' -> ' + JSON.stringify(line) + '   [' + run.name + ' |' + run.illum + ']')
}

console.log()
console.log('=== Q2b: earliest witness at/after the guard\'s own sweep start, per pair ===')
// A citation a reader can check with the guard's own constants beats one from 2020
// that sits outside every window the guard searches.
const WANTED = [
  ['waxing gibbous', '100%'], ['waning gibbous', '100%'],
  ['waning crescent', '  0%'], ['full', '100%'], ['new', '  0%']
]
for (const w of WANTED) {
  const k = key(w[0], w[1])
  const inst = cheap.get(k) || esc.get(k)
  if (!inst) { console.log('  ' + k + ' -> no witness in 400d'); continue }
  console.log('  ' + inst.toISOString() + '  ' +
    JSON.stringify(renderLine(computeMoon(inst), 'north')))
}
