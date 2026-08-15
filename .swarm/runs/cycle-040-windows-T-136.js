'use strict'
// Cost/coverage table for T-136 attempt 2. Measured, so the next brief does not guess.
const { renderLine } = require('/opt/targets/moon/src/render.js')
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')
const START = Date.UTC(2026, 0, 1)
function parseRun (str) {
  const d = str.indexOf(' ')
  const p = str.indexOf('%', d)
  const nf = str.slice(p + 1).replace(/^ +/, '')
  return PHASE_NAMES.find((n) => nf.startsWith(n)) + '|' + str.slice(d + 1, p + 1)
}
function sweep (stepMin, spanDays) {
  const step = stepMin * 60000
  const steps = Math.floor(spanDays * 86400000 / step)
  const set = new Set()
  const t = Date.now()
  for (let i = 0; i <= steps; i++) set.add(parseRun(renderLine(computeMoon(new Date(START + i * step)), 'north')))
  return { pairs: set.size, calls: steps + 1, ms: Date.now() - t, set }
}
// Ceiling: is 212 really it? Push far wider than any candidate window.
const ceil = sweep(5, 3650 * 3) // 5-min, 30 years
console.log('CEILING PROBE  5-min / 30 years : calls=' + ceil.calls + ' pairs=' + ceil.pairs + ' ' + ceil.ms + 'ms')
const ceilFine = sweep(1, 400)
console.log('CEILING PROBE  1-min / 400 days : calls=' + ceilFine.calls + ' pairs=' + ceilFine.pairs + ' ' + ceilFine.ms + 'ms')
const union = new Set([...ceil.set, ...ceilFine.set])
console.log('union of both  : ' + union.size + ' pairs')
console.log('')
console.log('step  span    calls     pairs  ms     reaches union?')
for (const [stepMin, spanDays] of [[5, 200], [5, 250], [5, 300], [5, 400], [10, 400], [15, 400], [10, 600], [5, 150]]) {
  const r = sweep(stepMin, spanDays)
  const missing = [...union].filter((k) => !r.set.has(k))
  console.log(String(stepMin).padStart(4) + 'm' + String(spanDays).padStart(6) + 'd' +
    String(r.calls).padStart(9) + String(r.pairs).padStart(7) + String(r.ms).padStart(7) + 'ms  ' +
    (missing.length === 0 ? 'YES' : 'no, misses ' + missing.length + ': ' + JSON.stringify(missing.slice(0, 4))))
}
