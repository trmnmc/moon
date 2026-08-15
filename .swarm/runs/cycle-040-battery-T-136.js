'use strict'
// Conductor gate battery for T-136, cycle 40. Each case edits README, runs the FULL
// regression file, restores, and asserts the restore is byte-exact. Green controls at
// both ends so the harness is provably live.
const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const { renderLine } = require('/opt/targets/moon/src/render.js')
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')

const README = '/opt/targets/moon/README.md'
const ORIGINAL = fs.readFileSync(README, 'utf8')
const out = []
const say = (s) => { out.push(s); console.log(s) }

function parseRun (str) {
  const d = str.indexOf(' ')
  const p = str.indexOf('%', d)
  const nf = str.slice(p + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nf.startsWith(n))
  return { disc: str.slice(0, d), illum: str.slice(d + 1, p + 1), name }
}

// Locate the sweep-table fence inside "## Why this one".
const marker = '\n## Why this one\n'
const secStart = ORIGINAL.indexOf(marker) + marker.length
const secEnd = ORIGINAL.indexOf('\n## ', secStart)
const section = ORIGINAL.slice(secStart, secEnd)
const fenceStart = section.indexOf('```\n') + 4
const fenceEnd = section.indexOf('```', fenceStart)
const fence = section.slice(fenceStart, fenceEnd)
const fenceAbs = secStart + fenceStart
const lines = fence.split('\n')
const rows = []
lines.forEach((l, i) => { if (i > 0 && l.length > 0) rows.push({ i, text: l }) })
say('sweep table: ' + rows.length + ' data rows below the header')

// Column width W: where the south half starts. Derived per row, then checked constant —
// last cycle a mutant died of an assumed fixed padding, so this is measured.
const widths = new Set()
for (const r of rows) {
  const n = parseRun(r.text)
  const northText = n.disc + ' ' + n.illum + '  ' + n.name
  const rest = r.text.slice(northText.length)
  const pad = rest.length - rest.replace(/^ +/, '').length
  widths.add(northText.length + pad)
}
say('measured south-column start offsets across all rows: ' + JSON.stringify([...widths]))
if (widths.size !== 1) throw new Error('rows do not share one column width; battery unsafe')
const W = [...widths][0]

function rowFromInstant (iso) {
  const m = computeMoon(new Date(iso))
  return renderLine(m, 'north').padEnd(W, ' ') + renderLine(m, 'south')
}

function writeRows (newLines) {
  const newFence = newLines.join('\n')
  fs.writeFileSync(README, ORIGINAL.slice(0, fenceAbs) + newFence +
    ORIGINAL.slice(fenceAbs + fence.length), 'utf8')
}

function runSuite () {
  try {
    execFileSync('node', ['--test', 'test/regressions.test.js'],
      { cwd: '/opt/targets/moon', encoding: 'utf8', stdio: 'pipe' })
    return { green: true, failed: [] }
  } catch (e) {
    const txt = (e.stdout || '') + (e.stderr || '')
    const failed = [...txt.matchAll(/✖ (T-\d+|[^\n(]+?) —/g)].map((m) => m[1].trim())
    return { green: false, failed: [...new Set(failed)] }
  }
}

function runCase (label, expect, mutate) {
  const newLines = lines.slice()
  mutate(newLines)
  writeRows(newLines)
  const r = runSuite()
  fs.writeFileSync(README, ORIGINAL, 'utf8')
  const restored = fs.readFileSync(README, 'utf8') === ORIGINAL
  const got = r.green ? 'GREEN' : 'RED (' + r.failed.join(', ') + ')'
  say(('  ' + label).padEnd(30) + (' expect ' + expect).padEnd(16) +
      ' got ' + got + (restored ? '' : '  !! RESTORE FAILED'))
  if (!restored) throw new Error('README not restored after ' + label)
  return r
}

function retype (newLines, rowIdx, from, to) {
  const li = rows[rowIdx].i
  const before = newLines[li]
  // Measure this row's own padding rather than assuming a fixed run of spaces.
  const n = parseRun(before)
  if (n.name !== from) throw new Error('row ' + rowIdx + ' is "' + n.name + '", not "' + from + '"')
  const northText = n.disc + ' ' + n.illum + '  ' + n.name
  const south = before.slice(W)
  const s = parseRun(south)
  const newNorth = (n.disc + ' ' + n.illum + '  ' + to).padEnd(W, ' ')
  const newSouth = s.disc + ' ' + s.illum + '  ' + to
  newLines[li] = newNorth + newSouth
  if (newLines[li] === before) throw new Error('retype was a no-op for row ' + rowIdx)
  return { before, after: newLines[li] }
}

function rowIndexByPair (pct, name) {
  const i = rows.findIndex((r) => {
    const p = parseRun(r.text)
    return p.illum.trim() === pct && p.name === name
  })
  if (i === -1) throw new Error('no row ' + pct + ' ' + name)
  return i
}

say('')
say('CASE                          EXPECT          GOT')
runCase('C0-CONTROL', 'GREEN', () => {})

// H1 — the item's own defect: an HONEST regeneration at a real instant that the product
// really does emit. Cycle 39 measured this as RED. It must now be GREEN.
const i32 = rowIndexByPair('32%', 'waxing crescent')
runCase('H1-HONEST-44-FQ', 'GREEN', (nl) => {
  nl[rows[i32].i] = rowFromInstant('2026-02-24T00:28:00Z')
})

// H2 — the same class of honest regeneration, at a pair the WIDENED sweep still misses.
// 55% "waxing gibbous" slots between the 51% first-quarter row and the 85% row, so
// PHASE_NAMES order and percent monotonicity both stay satisfied; only the reachability
// clause can object.
const i69 = rowIndexByPair('69%', 'waxing gibbous')
runCase('H2-HONEST-55-WXGIB', 'measure', (nl) => {
  nl[rows[i69].i] = rowFromInstant('2026-05-23T23:11:00Z')
})

// M1-M3 — cycle 39's order-preserving retypes. Widening a sweep makes more pairs
// reachable, which can silently blunt the guard; these must still die.
runCase('M1-51-FQ->WXGIB', 'RED', (nl) => retype(nl, rowIndexByPair('51%', 'first quarter'), 'first quarter', 'waxing gibbous'))
runCase('M2-63-WNGIB->WNCRE', 'RED', (nl) => retype(nl, rowIndexByPair('63%', 'waning gibbous'), 'waning gibbous', 'waning crescent'))
runCase('M3-69-WXGIB->FQ', 'RED', (nl) => retype(nl, rowIndexByPair('69%', 'waxing gibbous'), 'waxing gibbous', 'first quarter'))

runCase('C0-CONTROL-2', 'GREEN', () => {})

say('')
say('README byte-identical to entry: ' + (fs.readFileSync(README, 'utf8') === ORIGINAL))
say('rows used: H1 replaced row #' + (i32 + 1) + ' (32% waxing crescent); H2 replaced row #' + (i69 + 1) + ' (69% waxing gibbous)')
say('H1 replacement row: ' + JSON.stringify(rowFromInstant('2026-02-24T00:28:00Z')))
say('H2 replacement row: ' + JSON.stringify(rowFromInstant('2026-05-23T23:11:00Z')))
fs.appendFileSync('/opt/targets/moon/.swarm/runs/cycle-040-verify-T-136.txt', '\n\n' + out.join('\n') + '\n')
