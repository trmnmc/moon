// Is computeMoon actually varying outside the declared domain, or clamping?
import { createRequire } from 'node:module'
const require = createRequire('file:///opt/targets/moon/')
const astro = require('/opt/targets/moon/src/astro.js')
const dates = [
  ['1500-06-01', new Date(Date.UTC(1500, 5, 1))],
  ['12000-06-01', new Date(Date.UTC(12000, 5, 1))],
  ['12000-06-08', new Date(Date.UTC(12000, 5, 8))],
  ['2026-08-14', new Date(Date.UTC(2026, 7, 14))],
  ['50000-01-01', new Date(Date.UTC(50000, 0, 1))],
]
for (const [label, d] of dates) {
  const m = astro.computeMoon(d)
  console.log(label.padEnd(12), 'jd=' + m.julianDay.toFixed(4).padStart(14),
    m.phaseName.padEnd(16), 'k=' + m.illumination.toFixed(6))
}
