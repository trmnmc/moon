// Probe: `cycleFraction` is documented (README --json table, bin/moon.js HELP) as
// "position through the synodic month, 0 = new, 0.5 = full" -- a TEMPORAL reading.
// It is computed as elongation/360 (src/astro.js:303), an ANGULAR quantity. `age`
// IS temporal. Measure the gap between them two ways, and check the doc's own
// anchors (0 at new, 0.5 at full).
//
// Fairness: the naive comparison divides age by the MEAN synodic month, which is
// itself wrong because true lunations run 29.27-29.83 d. Run BOTH -- against the
// mean, and against this lunation's TRUE length -- so the reported gap cannot be
// dismissed as an artifact of the denominator.
const { computeMoon, nextFullMoon } = require('../../src/astro.js')

const MEAN_SYNODIC = 29.530588861
const DAY_MS = 86400000
const start = Date.UTC(2020, 0, 1)
const end = Date.UTC(2040, 0, 1)
const stepMs = 3600000

const circ = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d) }

// True length of the lunation containing t: walk age back to its new moon, then
// find the next new moon by advancing past the boundary and reading its age.
function lunationLengthDays (tMs) {
  const m = computeMoon(new Date(tMs))
  const newMoonMs = tMs - m.age * DAY_MS
  // 40 days past this new moon is always inside the NEXT lunation
  const probeMs = newMoonMs + 40 * DAY_MS
  const p = computeMoon(new Date(probeMs))
  const nextNewMs = probeMs - p.age * DAY_MS
  return (nextNewMs - newMoonMs) / DAY_MS
}

let worstMean = 0; let worstMeanAt = null
let worstTrue = 0; let worstTrueAt = null
let n = 0
for (let t = start; t < end; t += stepMs) {
  const m = computeMoon(new Date(t))
  n++
  const dMean = circ(m.cycleFraction, m.age / MEAN_SYNODIC)
  if (dMean > worstMean) { worstMean = dMean; worstMeanAt = new Date(t).toISOString() }
  const dTrue = circ(m.cycleFraction, m.age / lunationLengthDays(t))
  if (dTrue > worstTrue) { worstTrue = dTrue; worstTrueAt = new Date(t).toISOString() }
}

const hrs = (f) => (f * MEAN_SYNODIC * 24).toFixed(2)
console.log('samples (hourly, 2020-2040):', n)
console.log('worst circular gap vs age/MEAN synodic :', worstMean.toFixed(6), 'cycle =', hrs(worstMean), 'h  at', worstMeanAt)
console.log('worst circular gap vs age/TRUE lunation:', worstTrue.toFixed(6), 'cycle =', hrs(worstTrue), 'h  at', worstTrueAt)

// Anchors the documentation names.
let worstFull = 0; let worstFullAt = null
let worstNew = 0; let worstNewAt = null
for (let t = start; t < end; t += 20 * DAY_MS) {
  const fm = nextFullMoon(new Date(t))
  const mf = computeMoon(fm)
  const df = Math.abs(mf.cycleFraction - 0.5)
  if (df > worstFull) { worstFull = df; worstFullAt = fm.toISOString() }

  const m = computeMoon(new Date(t))
  const newMoonMs = t - m.age * DAY_MS
  const mn = computeMoon(new Date(newMoonMs))
  const dn = circ(mn.cycleFraction, 0)
  if (dn > worstNew) { worstNew = dn; worstNewAt = new Date(newMoonMs).toISOString() }
}
console.log('anchor: worst |cycleFraction - 0.5| at a TRUE full moon:', worstFull.toFixed(6), 'cycle =', hrs(worstFull), 'h  at', worstFullAt)
console.log('anchor: worst |cycleFraction - 0|   at a TRUE new  moon:', worstNew.toFixed(6), 'cycle =', hrs(worstNew), 'h  at', worstNewAt)
