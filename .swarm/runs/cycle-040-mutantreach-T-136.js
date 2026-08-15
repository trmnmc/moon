'use strict'
// Does a much wider search keep KILLING the three retype mutants? If widening far enough
// makes the mutant pairs reachable too, then "widen until complete" destroys the guard
// and attempt 2 needs a different shape, not a bigger number.
const { renderLine } = require('/opt/targets/moon/src/render.js')
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')
const START = Date.UTC(2026, 0, 1)
function parseRun (str) {
  const d = str.indexOf(' ')
  const p = str.indexOf('%', d)
  const nf = str.slice(p + 1).replace(/^ +/, '')
  return PHASE_NAMES.find((n) => nf.startsWith(n)) + '|' + str.slice(d + 1, p + 1)
}
const step = 60000 // 1 minute
const spanDays = 3650 // 10 years, fine step: 5.26M calls
const steps = Math.floor(spanDays * 86400000 / step)
const set = new Set()
const t = Date.now()
for (let i = 0; i <= steps; i++) set.add(parseRun(renderLine(computeMoon(new Date(START + i * step)), 'north')))
console.log('WIDE+FINE 1-min / 10 years: calls=' + (steps + 1) + ' pairs=' + set.size + ' ' + (Date.now() - t) + 'ms')
console.log('')
const probes = [
  ['MUTANT M1', 'waxing gibbous| 51%'],
  ['MUTANT M2', 'waning crescent| 63%'],
  ['MUTANT M3', 'first quarter| 69%'],
  ['HONEST H1', 'first quarter| 44%'],
  ['HONEST H2', 'waxing gibbous| 55%'],
  ['pair D1  ', 'last quarter| 56%'],
  ['pair D2  ', 'last quarter| 44%'],
  ['pair D3  ', 'waning crescent| 46%']
]
for (const [label, key] of probes) {
  console.log(label + '  ' + JSON.stringify(key).padEnd(28) + (set.has(key) ? 'REACHABLE — a widened guard would ACCEPT it' : 'still unreachable — guard survives'))
}
