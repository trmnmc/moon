'use strict'
// Find real instants that produce the three pairs the committed sweep would reject.
const { renderLine } = require('/opt/targets/moon/src/render.js')
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')
function parseRun (str) {
  const d = str.indexOf(' ')
  const p = str.indexOf('%', d)
  const nf = str.slice(p + 1).replace(/^ +/, '')
  return { illum: str.slice(d + 1, p + 1), name: PHASE_NAMES.find((n) => nf.startsWith(n)) }
}
const want = new Set(['waxing gibbous| 55%', 'last quarter| 56%', 'last quarter| 44%'])
const found = new Map()
const START = Date.UTC(2026, 0, 1)
for (let i = 0; i <= 576000 && found.size < want.size; i++) {
  const inst = new Date(START + i * 60000)
  const r = parseRun(renderLine(computeMoon(inst), 'north'))
  const key = r.name + '|' + r.illum
  if (want.has(key) && !found.has(key)) found.set(key, inst.toISOString())
}
for (const [k, v] of found) {
  const m = computeMoon(new Date(v))
  console.log(JSON.stringify(k), v)
  console.log('   north', JSON.stringify(renderLine(m, 'north')))
  console.log('   south', JSON.stringify(renderLine(m, 'south')))
}
