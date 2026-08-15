'use strict'
// Conductor gate probe for T-136, cycle 40. Authored at verification time; the builder
// never saw it. Reads the COMMITTED constants out of test/regressions.test.js rather
// than trusting the agent's reported numbers.
const fs = require('node:fs')
const path = require('node:path')
const { renderLine } = require('/opt/targets/moon/src/render.js')
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')

const TESTFILE = '/opt/targets/moon/test/regressions.test.js'
const src = fs.readFileSync(TESTFILE, 'utf8')

function constFromFile (name) {
  const re = new RegExp('const ' + name + ' = ([^\\n/]+)')
  const m = src.match(re)
  if (!m) throw new Error('constant not found in the committed file: ' + name)
  // eslint-disable-next-line no-eval
  return eval(m[1])
}
const START = constFromFile('REACHABILITY_SWEEP_START_MS')
const STEP = constFromFile('REACHABILITY_STEP_MS')
const SPAN = constFromFile('REACHABILITY_SPAN_MS')

// Same parse the committed test uses, reimplemented here so a broken helper in the test
// file cannot make the probe agree with it by construction.
function parseRun (str) {
  const discEnd = str.indexOf(' ')
  const disc = str.slice(0, discEnd)
  const pctEnd = str.indexOf('%', discEnd)
  const illum = str.slice(discEnd + 1, pctEnd + 1)
  const nameField = str.slice(pctEnd + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nameField.startsWith(n))
  if (!name) throw new Error('unparseable: ' + JSON.stringify(str))
  return { disc, illum, name }
}

function sweep (startMs, stepMs, spanMs) {
  const set = new Map() // pair -> hit count
  const steps = Math.floor(spanMs / stepMs)
  for (let i = 0; i <= steps; i++) {
    const r = parseRun(renderLine(computeMoon(new Date(startMs + i * stepMs)), 'north'))
    const key = r.name + '|' + r.illum
    set.set(key, (set.get(key) || 0) + 1)
  }
  return { set, calls: steps + 1 }
}

const out = []
const say = (s) => { out.push(s); console.log(s) }

say('COMMITTED CONSTANTS, read from ' + path.basename(TESTFILE) + ':')
say('  start = ' + new Date(START).toISOString())
say('  step  = ' + STEP / 60000 + ' min')
say('  span  = ' + SPAN / 86400000 + ' days')
say('')

// --- A. arithmetic: how many renderLine calls does the COMMITTED sweep actually make?
let t = Date.now()
const committed = sweep(START, STEP, SPAN)
const committedMs = Date.now() - t
say('A. COMMITTED SWEEP: calls=' + committed.calls + '  pairs=' + committed.set.size +
    '  wall=' + committedMs + 'ms')
say('   comment in the file claims "11,521 computeMoon calls, ~0.4s" for this window.')
say('   ARITHMETIC CHECK: 11521 == actual? ' + (committed.calls === 11521))
say('')

// --- B. SET parity (not count parity) against a 1-minute reference over the SAME span
t = Date.now()
const ref = sweep(START, 60 * 1000, SPAN)
const refMs = Date.now() - t
const onlyRef = [...ref.set.keys()].filter((k) => !committed.set.has(k))
const onlyCommitted = [...committed.set.keys()].filter((k) => !ref.set.has(k))
say('B. 1-MIN REFERENCE, SAME SPAN: calls=' + ref.calls + '  pairs=' + ref.set.size +
    '  wall=' + refMs + 'ms')
say('   pairs in reference but MISSED by committed sweep: ' + onlyRef.length +
    (onlyRef.length ? ' -> ' + JSON.stringify(onlyRef) : ''))
say('   pairs in committed but not in reference: ' + onlyCommitted.length +
    (onlyCommitted.length ? ' -> ' + JSON.stringify(onlyCommitted) : ''))
say('   SET PARITY: ' + (onlyRef.length === 0 && onlyCommitted.length === 0 ? 'IDENTICAL' : 'DIFFERENT'))
say('')

// --- C. the item's own defect pair
const key44 = 'first quarter|  44%'
const present = [...committed.set.keys()].filter((k) => k.trim().startsWith('first quarter') && k.includes('44%'))
say('C. THE T-136 PAIR: keys matching 44% first quarter in the committed set: ' +
    JSON.stringify(present) + '  hits=' + (present.length ? committed.set.get(present[0]) : 0))
say('   reference hits for the same key: ' + (present.length ? ref.set.get(present[0]) : 'n/a'))
say('   renderLine at 2026-02-24T00:28:00Z north = ' +
    JSON.stringify(renderLine(computeMoon(new Date('2026-02-24T00:28:00Z')), 'north')))
say('')

// --- D. "ANY real instant": does the product emit pairs OUTSIDE the chosen 120-day span?
// The acceptance says a row rebuilt at ANY real instant must stay green. Same-span parity
// cannot answer that. Sweep far wider, coarse enough to afford, and look for new pairs.
t = Date.now()
const wide = sweep(START, 5 * 60 * 1000, 3650 * 86400000) // 5-min step, 10 years
const wideMs = Date.now() - t
const novel = [...wide.set.keys()].filter((k) => !committed.set.has(k))
say('D. WIDE SWEEP (5-min step, 10 years): calls=' + wide.calls + '  pairs=' + wide.set.size +
    '  wall=' + wideMs + 'ms')
say('   pairs the product emits that the COMMITTED sweep would REJECT: ' + novel.length)
for (const k of novel.slice(0, 20)) say('     ' + JSON.stringify(k) + '  hits=' + wide.set.get(k))
say('')

// --- E. the same question, fine resolution, medium span (catches rare pairs a 5-min
// step could skip entirely).
t = Date.now()
const fineWide = sweep(START, 60 * 1000, 400 * 86400000) // 1-min step, 400 days
const fineMs = Date.now() - t
const novelFine = [...fineWide.set.keys()].filter((k) => !committed.set.has(k))
say('E. FINE-WIDE SWEEP (1-min step, 400 days): calls=' + fineWide.calls +
    '  pairs=' + fineWide.set.size + '  wall=' + fineMs + 'ms')
say('   pairs it emits that the COMMITTED sweep would REJECT: ' + novelFine.length)
for (const k of novelFine.slice(0, 20)) say('     ' + JSON.stringify(k) + '  hits=' + fineWide.set.get(k))

fs.writeFileSync('/opt/targets/moon/.swarm/runs/cycle-040-verify-T-136.txt', out.join('\n') + '\n')
