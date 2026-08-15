// Cycle-36 gate G9: INDEPENDENT re-derivation of the two numbers the docs now assert
// ("up to about 21 hours" mid-cycle, "within about 45 minutes" at the endpoints).
//
// The cycle-36 PROBE found the lunation boundaries by `t - age*DAY` and sampled hourly.
// This re-derivation deliberately uses a different path on both counts:
//   - boundaries by BISECTION on the cycleFraction wrap (the method test/astro.test.js
//     uses), never by reading `age`;
//   - a finer, non-hourly grid, so an hourly grid's blind spots cannot hide a larger max;
//   - a WIDER window (1990-2060, matching the windows the README already quotes) for the
//     endpoint bound, walked lunation by lunation so no lunation is skipped.
// If the two paths disagree materially, the doc's number is not established.
const { computeMoon, nextFullMoon } = require('../../src/astro.js')

const DAY_MS = 86400000
const circ = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d) }
const cf = (ms) => computeMoon(new Date(ms)).cycleFraction

// Bisect the new-moon instant inside [a,b], given cf(a) > 0.5 and cf(b) < 0.5.
function bisectNew (a, b) {
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2
    if (cf(m) > 0.5) a = m; else b = m
  }
  return (a + b) / 2
}

// Every new-moon instant in [fromMs, toMs), located by scanning for the wrap on a
// 6-hour grid and then bisecting. Independent of `age` entirely.
function newMoons (fromMs, toMs) {
  const out = []
  const step = 6 * 3600000
  let prev = cf(fromMs)
  for (let t = fromMs + step; t < toMs; t += step) {
    const c = cf(t)
    if (c < prev - 0.5) out.push(bisectNew(t - step, t))
    prev = c
  }
  return out
}

// ---- claim 1: the mid-cycle bound ----
// Walk whole lunations on a 7-minute grid (deliberately not an hour, and not a divisor
// of it) and compare cycleFraction against elapsed/TRUE-lunation-length.
const nm = newMoons(Date.UTC(2035, 0, 1), Date.UTC(2040, 6, 1))
let worst = 0
let worstAt = null
let samples = 0
const FINE = 7 * 60000
for (let i = 0; i + 1 < nm.length; i++) {
  const a = nm[i]
  const b = nm[i + 1]
  const len = b - a
  for (let t = a; t < b; t += FINE) {
    samples++
    const d = circ(cf(t), (t - a) / len)
    if (d > worst) { worst = d; worstAt = new Date(t).toISOString() }
  }
}
console.log('claim 1 -- mid-cycle bound')
console.log('  lunations walked:', nm.length - 1, ' samples:', samples, ' grid: 7 min')
console.log('  worst |cycleFraction - elapsed/trueLunation| =', worst.toFixed(6), 'cycle =',
  (worst * 29.530588861 * 24).toFixed(2), 'h  at', worstAt)
console.log('  doc says "up to about 21 hours" ->',
  (worst * 29.530588861 * 24) <= 21.9 ? 'NOT understated' : 'UNDERSTATED - doc is wrong')

// ---- claim 2: the endpoint bound, over the wider 1990-2060 window ----
const wide = newMoons(Date.UTC(1990, 0, 1), Date.UTC(2060, 0, 1))
let worstNew = 0
let worstNewAt = null
for (const t of wide) {
  const d = circ(cf(t), 0)
  if (d > worstNew) { worstNew = d; worstNewAt = new Date(t).toISOString() }
}
let worstFull = 0
let worstFullAt = null
for (const t of wide) {
  const fm = nextFullMoon(new Date(t))
  const d = Math.abs(cf(fm.getTime()) - 0.5)
  if (d > worstFull) { worstFull = d; worstFullAt = fm.toISOString() }
}
const mins = (f) => (f * 29.530588861 * 24 * 60).toFixed(1)
console.log('\nclaim 2 -- endpoint bound, 1990-2060, every lunation (no sampling gaps)')
console.log('  new  moons checked:', wide.length)
console.log('  worst |cycleFraction - 0|   at a true new  moon =', worstNew.toFixed(6), '=', mins(worstNew), 'min  at', worstNewAt)
console.log('  worst |cycleFraction - 0.5| at a true full moon =', worstFull.toFixed(6), '=', mins(worstFull), 'min  at', worstFullAt)
const worstEnd = Math.max(worstNew, worstFull)
console.log('  doc says "within about 45 minutes" ->',
  +mins(worstEnd) <= 49 ? 'holds' : 'VIOLATED - doc is wrong (' + mins(worstEnd) + ' min)')
