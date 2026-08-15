'use strict'
// CONDUCTOR GATE — cycle 41. Diagnosing WHY an honestly-regenerated "last quarter" row
// is rejected by T-134's band search (test/regressions.test.js:388):
//     const waxing = !north.name.includes('waning')
// "last quarter" is a WANING phase whose NAME does not contain the substring "waning",
// so the band search feeds renderLine a waxing-side cycleFraction and gets the mirrored
// disc back. Hypothesis, tested below rather than argued.
const { computeMoon } = require('../../src/astro.js')
const { renderLine } = require('../../src/render.js')

const inst = new Date('2026-07-07T07:30:00Z')
const real = computeMoon(inst)
console.log('real moon at', inst.toISOString())
console.log('  cycleFraction', real.cycleFraction, ' phaseName', real.phaseName,
  ' illumination', real.illumination)
console.log('  shipping renderLine north:', JSON.stringify(renderLine(real, 'north')))

// T-134's own derivation, reproduced: readmeMoon()'s cycleFraction folded to each half.
const { readFileSync } = require('fs')
const readme = readFileSync(__dirname + '/../../README.md', 'utf8')
const jsonFence = readme.match(/```json\n([\s\S]*?)```/)[1]
const rm = JSON.parse(jsonFence)
const waxingCF = Math.min(rm.cycleFraction, 1 - rm.cycleFraction)
const waningCF = Math.max(rm.cycleFraction, 1 - rm.cycleFraction)
console.log('\nreadmeMoon cycleFraction', rm.cycleFraction,
  '-> waxingCF', waxingCF, ' waningCF', waningCF)

const PCT = 56
const BAND_STEPS = 400
const lo = Math.max(0, PCT / 100 - 0.01)
const hi = Math.min(1, PCT / 100 + 0.01)
const targetDisc = renderLine(real, 'north').slice(0, renderLine(real, 'north').indexOf(' '))
console.log('target north disc:', JSON.stringify(targetDisc))

for (const [label, cf] of [['waxingCF (what T-134 picks for "last quarter")', waxingCF],
  ['waningCF (what the phase actually is)', waningCF]]) {
  let found = false
  let sampleDisc = null
  for (let i = 0; i <= BAND_STEPS && !found; i++) {
    const cand = lo + ((hi - lo) * i) / BAND_STEPS
    const out = renderLine({ illumination: cand, cycleFraction: cf, phaseName: 'last quarter' }, 'north')
    const d = out.slice(0, out.indexOf(' '))
    const p = Number(out.slice(out.indexOf(' ') + 1, out.indexOf('%')).trim())
    if (sampleDisc === null) sampleDisc = d
    if (p === PCT && d === targetDisc) found = true
  }
  console.log(`  band search with ${label}: found=${found}  (first sample disc ${JSON.stringify(sampleDisc)})`)
}

// Does the SHIPPED README contain any "last quarter" row? If not, the defect is latent.
const seg = readme.slice(readme.indexOf('Why this one'))
const f = seg.indexOf('```')
const fence = seg.slice(f + 3, seg.indexOf('```', f + 3))
const names = fence.split('\n').filter((l) => l.trim()).slice(1)
  .map((l) => l.slice(0, 30).trim().replace(/^\S+\s+\d+%\s+/, ''))
console.log('\nphase names in the SHIPPED sweep table:', JSON.stringify([...new Set(names)]))
console.log('shipped table contains a "last quarter" row?',
  names.includes('last quarter'))
