// Conductor gate ADDENDUM, cycle 39, item T-135 — correcting two of my own cases.
//
// In the first battery M2 and M3 both went RED, but by the T-134 test, not T-135. That
// was MY bug, not a product finding: retypeRow() assumed the north name field carried
// five trailing spaces (true of row 3, "first quarter", false of the 14-char names,
// which carry four). So only the SOUTH half was retyped and T-134's "north and south
// disagree on phase name" clause fired first. A mutant that dies of a construction
// defect proves nothing about the guard. Rebuilt here, padding measured from the row.
//
// Also re-runs M1b with the corrected constructor as a cross-check, and adds M5: a
// retype that is order-preserving AND leaves a reachable pair, which the guard SHOULD
// NOT catch — the boundary of the guard's authority, so its teeth are not mistaken for
// omniscience.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const REPO = '/opt/targets/moon'
const README = path.join(REPO, 'README.md')
const ORIGINAL = fs.readFileSync(README, 'utf8')
const T134 = 'T-134 — README north/south sweep table rows are self-consistent and reproducible'
const T135 = 'T-135 — every sweep-table row is a (name, percent) pair the shipping renderer can actually produce'

function runSuite () {
  let out
  try {
    out = execFileSync('node', ['--test', 'test/args.test.js', 'test/astro.test.js',
      'test/cli.test.js', 'test/hemisphere.test.js', 'test/manifest.test.js',
      'test/regressions.test.js', 'test/render.test.js'],
    { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 })
  } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  const fail = /^ℹ fail (\d+)/m.exec(out)
  const names = new Set()
  for (const line of out.split('\n')) {
    const m = /^\s*✖\s+(.*?)\s+\(\d/.exec(line)
    if (m) names.add(m[1])
  }
  return { fail: fail ? Number(fail[1]) : -1, names: [...names] }
}

function tableBounds (text) {
  const i = text.indexOf('## Why this one')
  const j = text.indexOf('\n## ', i + 5)
  const m = /```\n([\s\S]*?)```/.exec(text.slice(i, j === -1 ? text.length : j))
  const bodyStart = i + m.index + 4
  return { bodyStart, bodyEnd: bodyStart + m[1].length, body: m[1] }
}

const B = tableBounds(ORIGINAL)
const ALL = B.body.split('\n')
const DATA_START = ALL.findIndex((l, k) => k > 0 && l.length > 0)
const ROWS = ALL.slice(DATA_START).filter((l) => l.length > 0)

function writeRow (idx, newRow) {
  const lines = ALL.slice()
  lines[DATA_START + idx] = newRow
  fs.writeFileSync(README, ORIGINAL.slice(0, B.bodyStart) + lines.join('\n') + ORIGINAL.slice(B.bodyEnd))
}

// Retype BOTH halves, absorbing the width delta into whatever padding the row actually
// has (measured, not assumed), so the row stays column-aligned and self-consistent —
// the tidy hand-edit a careless maintainer really makes.
function retypeRow (row, from, to) {
  const first = row.indexOf(from)
  const afterFirst = first + from.length
  const padLen = (/^ +/.exec(row.slice(afterFirst)) || [''])[0].length
  const newPad = Math.max(1, padLen - (to.length - from.length))
  const head = row.slice(0, first) + to + ' '.repeat(newPad)
  const tail = row.slice(afterFirst + padLen).replace(new RegExp(from + '\\s*$'), to)
  return head + tail
}

const out = []
function record (label, expect, got, note) {
  const ok = expect === got
  out.push({ label, ok })
  console.log('  ' + label.padEnd(24) + 'expect ' + expect.padEnd(6) + 'got ' + got.padEnd(6) +
    (ok ? 'AS EXPECTED' : '*** NOT AS EXPECTED ***') + (note ? '   ' + note : ''))
}
const attrib = (r) => (r.fail === 0 ? 'GREEN'
  : (r.names.includes(T135) && !r.names.includes(T134) ? 'RED/T-135'
    : (r.names.includes(T134) && !r.names.includes(T135) ? 'RED/T-134' : 'RED/both')))

try {
  console.log('=== T-135 GATE ADDENDUM — mutants rebuilt with measured padding ===\n')
  fs.writeFileSync(README, ORIGINAL)
  record('C0-CONTROL', 'GREEN', attrib(runSuite()))

  const cases = [
    ['M1b-51-FQ->WXGIB', 3, 'first quarter', 'waxing gibbous', 'RED/T-135'],
    ['M2-63-WNGIB->WNCRE', 10, 'waning gibbous', 'waning crescent', 'RED/T-135'],
    ['M3-69-WXGIB->FQ', 4, 'waxing gibbous', 'first quarter', 'RED/T-135'],
    ['M5-96-WXGIB->WNGIB', 6, 'waxing gibbous', 'waning gibbous', 'RED/T-134']
  ]
  for (const [label, idx, from, to, expect] of cases) {
    const mutated = retypeRow(ROWS[idx], from, to)
    writeRow(idx, mutated)
    const r = runSuite()
    record(label, expect, attrib(r), JSON.stringify(mutated))
    fs.writeFileSync(README, ORIGINAL)
  }

  record('C0-CONTROL-2', 'GREEN', attrib(runSuite()))
  const bad = out.filter((r) => !r.ok)
  console.log('\n=== ADDENDUM VERDICT: ' + (bad.length === 0 ? 'ALL AS EXPECTED'
    : 'NOT AS EXPECTED (' + bad.map((r) => r.label).join(', ') + ')') + ' ===')
  console.log('M5 note: 96% "waxing gibbous" -> "waning gibbous" IS a reachable pair, so T-135')
  console.log('  cannot see it; it is caught upstream by T-134 cycle order. Recorded so the')
  console.log('  guard\'s authority is not overstated: reachability is a name-PLAUSIBILITY')
  console.log('  check, not a name-CORRECTNESS check. The two clauses cover each other.')
} finally {
  fs.writeFileSync(README, ORIGINAL)
  console.log('\nREADME restored byte-for-byte: ' + (fs.readFileSync(README, 'utf8') === ORIGINAL))
}
