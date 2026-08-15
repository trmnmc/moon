// Conductor probe, cycle 39 — facts I need BEFORE authoring the T-135 gate.
// The builder never saw any of this. Three questions:
//   Q1  Is (51%, "waxing gibbous") genuinely unreachable by the shipping product, or
//       does the committed test only kill M1b because its 15-min sweep is too coarse to
//       have seen it? A kill that is a sampling artifact is not a kill.
//   Q2  How much MARGIN does each honest README row have in that 15-min sweep? A row hit
//       by exactly one sample out of ~3400 is a false positive waiting to happen.
//   Q3  Is there an honestly-renderable "first quarter" row at a percent the committed
//       sweep window never emits? That is the cycle-37 trap (rejecting a truthfully
//       regenerated README) in its sharpest form.
// Percent is read through the SHIPPING renderLine, never Math.round — same reason the
// T-134 comment gives. The cycle-38 probe cheated with Math.round; this one does not.
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')
const { renderLine } = require('/opt/targets/moon/src/render.js')

function pairOf (date) {
  const s = renderLine(computeMoon(date), 'north')
  const discEnd = s.indexOf(' ')
  const pctEnd = s.indexOf('%', discEnd)
  const illum = s.slice(discEnd + 1, pctEnd + 1)
  const nameField = s.slice(pctEnd + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nameField.startsWith(n))
  return { disc: s.slice(0, discEnd), illum, pct: Number(illum.replace('%', '').trim()), name }
}

function sweep (startMs, stepMs, spanMs) {
  const counts = new Map()
  const steps = Math.floor(spanMs / stepMs)
  for (let i = 0; i <= steps; i++) {
    const p = pairOf(new Date(startMs + i * stepMs))
    const k = p.name + '|' + p.pct
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  return { counts, calls: steps + 1 }
}

const ROWS = [[3, 'waxing crescent'], [14, 'waxing crescent'], [32, 'waxing crescent'],
  [51, 'first quarter'], [69, 'waxing gibbous'], [85, 'waxing gibbous'], [96, 'waxing gibbous'],
  [100, 'full'], [96, 'waning gibbous'], [83, 'waning gibbous'], [63, 'waning gibbous'],
  [40, 'waning crescent'], [19, 'waning crescent'], [5, 'waning crescent'], [0, 'new']]

const COMMITTED_START = Date.UTC(2026, 0, 1)
const COMMITTED_STEP = 15 * 60 * 1000
const COMMITTED_SPAN = 35 * 24 * 60 * 60 * 1000

// --- Q2: margin of every honest row under the COMMITTED sweep -----------------------
const t0 = Date.now()
const committed = sweep(COMMITTED_START, COMMITTED_STEP, COMMITTED_SPAN)
console.log('COMMITTED SWEEP  start=2026-01-01Z step=15min span=35d calls=' + committed.calls +
  '  distinct pairs=' + committed.counts.size + '  (' + (Date.now() - t0) + 'ms)')
console.log('\nQ2 — per-row margin (how many of the ' + committed.calls + ' samples produce this row):')
let minHits = Infinity; let minRow = null
for (const [pct, name] of ROWS) {
  const hits = committed.counts.get(name + '|' + pct) || 0
  if (hits < minHits) { minHits = hits; minRow = pct + '% ' + name }
  console.log('  ' + String(pct).padStart(3) + '%  ' + name.padEnd(16) +
    (hits > 0 ? String(hits).padStart(4) + ' hits' : '   0 hits  <-- FALSE POSITIVE'))
}
console.log('  thinnest margin: ' + minRow + ' at ' + minHits + ' hits')

// --- Q1: is the kill a product property, or a sampling artifact? ---------------------
// A 1-minute sweep over 4 lunations is 15x finer and 3.4x longer than the committed one.
// If a mutant pair is absent HERE too, the committed test kills it for a real reason.
const t1 = Date.now()
const fine = sweep(COMMITTED_START, 60 * 1000, 120 * 24 * 60 * 60 * 1000)
console.log('\nFINE SWEEP       start=2026-01-01Z step=1min  span=120d calls=' + fine.calls +
  '  distinct pairs=' + fine.counts.size + '  (' + (Date.now() - t1) + 'ms)')
console.log('\nQ1 — mutant pairs, checked against the FINE sweep (not the committed one):')
for (const [pct, name] of [[51, 'waxing gibbous'], [69, 'first quarter'], [63, 'waning crescent'],
  [32, 'waxing gibbous'], [51, 'first quarter']]) {
  const f = fine.counts.get(name + '|' + pct) || 0
  const c = committed.counts.get(name + '|' + pct) || 0
  console.log('  ' + String(pct).padStart(3) + '%  ' + name.padEnd(16) +
    'fine=' + String(f).padStart(5) + '  committed=' + String(c).padStart(4) + '  ' +
    (f === 0 ? 'GENUINELY UNREACHABLE -> kill is a product property'
      : (c === 0 ? 'reachable in fine sweep but NOT committed -> kill is a SAMPLING ARTIFACT'
        : 'reachable -> not a mutant at all')))
}
console.log('\nQ1b — all 15 honest rows against the FINE sweep (sanity: they must all be there):')
const fineMissing = ROWS.filter(([pct, name]) => !fine.counts.has(name + '|' + pct))
console.log('  missing from fine sweep: ' + (fineMissing.length ? JSON.stringify(fineMissing) : 'none'))

// --- Q3: honest rows the COMMITTED window cannot emit -------------------------------
// Pairs the fine sweep proves the product really does produce, that the committed
// 35-day window never sees. Each is a row an honest README regeneration could contain
// and the committed test would reject.
console.log('\nQ3 — pairs the product genuinely emits that the COMMITTED sweep never sees:')
const blind = []
for (const [k, n] of fine.counts) {
  if (!committed.counts.has(k)) blind.push([k, n])
}
blind.sort((a, b) => b[1] - a[1])
console.log('  count=' + blind.length + ' of ' + fine.counts.size + ' fine-sweep pairs')
for (const [k, n] of blind.slice(0, 12)) {
  const [name, pct] = k.split('|')
  console.log('    ' + String(pct).padStart(3) + '%  ' + name.padEnd(16) + n + ' fine-sweep hits')
}
const fq = blind.filter(([k]) => k.startsWith('first quarter|'))
console.log('  first-quarter blind spots (the M4 honest-regen candidates): ' +
  (fq.length ? fq.map(([k, n]) => k.split('|')[1] + '% x' + n).join(', ') : 'none'))
