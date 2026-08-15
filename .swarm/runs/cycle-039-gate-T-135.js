// Conductor verification gate, cycle 39, item T-135. Authored AT VERIFICATION TIME.
// The builder never saw any of this and could not have coded to it.
//
// The claim under test: "every sweep-table row's (phase name, displayed percent) pair is
// one the SHIPPING product can actually emit ... mutating any row's name to an adjacent
// order-preserving name must turn the suite red; the current honest table must stay
// green."
//
// A passing suite proves nothing on its own — the cycle-37 T-134 attempt showed a guard
// can be simultaneously non-vacuous and WRONG (it killed mutants and also rejected an
// honest README). So this gate measures both directions:
//   * does each mutant die, and die by the RIGHT test?
//   * does an honestly-rendered row survive?
//   * is the harness live (control green first AND last)?
// Plus determinism (the acceptance forbids Date.now()) and cost.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { computeMoon, PHASE_NAMES } = require('/opt/targets/moon/src/astro.js')
const { renderLine } = require('/opt/targets/moon/src/render.js')

const REPO = '/opt/targets/moon'
const README = path.join(REPO, 'README.md')
const ORIGINAL = fs.readFileSync(README, 'utf8')

const T134 = 'T-134 — README north/south sweep table rows are self-consistent and reproducible'
const T135 = 'T-135 — every sweep-table row is a (name, percent) pair the shipping renderer can actually produce'

// --- suite runner ------------------------------------------------------------------
// Parses node --test's TAP-ish output for the counts and for WHICH named tests failed,
// so "the suite went red" can be distinguished from "the right test went red".
function runSuite (env) {
  let out
  try {
    out = execFileSync('node', ['--test', 'test/args.test.js', 'test/astro.test.js',
      'test/cli.test.js', 'test/hemisphere.test.js', 'test/manifest.test.js',
      'test/regressions.test.js', 'test/render.test.js'],
    { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
      env: Object.assign({}, process.env, env || {}) })
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '')
  }
  const num = (re) => { const m = re.exec(out); return m ? Number(m[1]) : null }
  const failedNames = []
  for (const line of out.split('\n')) {
    const m = /^\s*✖\s+(.*?)\s+\(\d/.exec(line)
    if (m) failedNames.push(m[1])
  }
  return {
    tests: num(/^ℹ tests (\d+)/m),
    pass: num(/^ℹ pass (\d+)/m),
    fail: num(/^ℹ fail (\d+)/m),
    ms: num(/^ℹ duration_ms ([\d.]+)/m),
    failedNames,
    raw: out
  }
}

// --- README surgery ----------------------------------------------------------------
function tableBounds (text) {
  const i = text.indexOf('## Why this one')
  const j = text.indexOf('\n## ', i + 5)
  const sec = text.slice(i, j === -1 ? text.length : j)
  const m = /```\n([\s\S]*?)```/.exec(sec)
  const bodyStart = i + m.index + 4
  return { bodyStart, bodyEnd: bodyStart + m[1].length, body: m[1] }
}

function rowsOf (text) {
  return tableBounds(text).body.split('\n').slice(1).filter((l) => l.length > 0)
}

function writeRow (idx, newRow) {
  const b = tableBounds(ORIGINAL)
  const lines = b.body.split('\n')
  const dataIdx = lines.findIndex((l, k) => k > 0 && l.length > 0) + idx
  lines[dataIdx] = newRow
  fs.writeFileSync(README, ORIGINAL.slice(0, b.bodyStart) + lines.join('\n') + ORIGINAL.slice(b.bodyEnd))
}

// A hand-edit as a careless maintainer would make it: swap the phase name in BOTH halves
// of one row, absorbing the width change into the existing column padding so the table
// still looks tidy. Tidy is the point — the v0.1.0 incident shipped because the bad row
// looked exactly as plausible as the good ones.
function retypeRow (row, from, to) {
  const pad = Math.max(1, from.length + 5 - to.length)
  return row
    .replace(from + ' '.repeat(from.length + 5 - from.length), to + ' '.repeat(pad))
    .replace(new RegExp(from + '$'), to)
}

// The south column's start offset, measured from the real table rather than assumed.
function southOffset (row) {
  const firstName = PHASE_NAMES.filter((n) => row.includes(n)).sort((a, b) => b.length - a.length)[0]
  const after = row.indexOf(firstName) + firstName.length
  return after + (/^ +/.exec(row.slice(after)) || [''])[0].length
}

const results = []
function record (label, expect, got, note) {
  results.push({ label, expect, got, ok: expect === got, note })
  console.log('  ' + label.padEnd(22) + 'expect ' + expect.padEnd(6) + 'got ' + got.padEnd(6) +
    (expect === got ? 'AS EXPECTED' : '*** NOT AS EXPECTED ***') + (note ? '   ' + note : ''))
}
const verdict = (r) => (r.fail === 0 ? 'GREEN' : 'RED')

try {
  console.log('=== T-135 GATE — mutation battery ===')
  console.log('(each case: mutate README, run the FULL suite, restore)\n')

  // C0 — control first. If this is not green the harness is lying before we start.
  fs.writeFileSync(README, ORIGINAL)
  const c0 = runSuite()
  record('C0-CONTROL', 'GREEN', verdict(c0), c0.pass + '/' + c0.tests + ' pass, ' + Math.round(c0.ms) + 'ms')

  const rows = rowsOf(ORIGINAL)

  // M1b — THE item's own defect: 51% "first quarter" -> "waxing gibbous". Adjacent name,
  // PHASE_NAMES order still non-decreasing, so every T-134 clause stays satisfied.
  writeRow(3, retypeRow(rows[3], 'first quarter', 'waxing gibbous'))
  const m1 = runSuite()
  record('M1b-ADJACENT-RETYPE', 'RED', verdict(m1),
    'failed: ' + JSON.stringify(m1.failedNames))
  const m1KilledByT135 = m1.failedNames.includes(T135)
  const m1T134Green = !m1.failedNames.includes(T134)

  // M2 — 63% "waning gibbous" -> "waning crescent". Also adjacent, also order-preserving
  // (the next row is already waning crescent), on the waning half rather than the waxing.
  writeRow(10, retypeRow(rows[10], 'waning gibbous', 'waning crescent'))
  const m2 = runSuite()
  record('M2-WANING-RETYPE', 'RED', verdict(m2), 'failed: ' + JSON.stringify(m2.failedNames))

  // M3 — 69% "waxing gibbous" -> "first quarter". BACKWARDS in PHASE_NAMES, but the row
  // above is already "first quarter", so indices stay non-decreasing and T-134's order
  // clause is still happy. Only reachability sees it.
  writeRow(4, retypeRow(rows[4], 'waxing gibbous', 'first quarter'))
  const m3 = runSuite()
  record('M3-BACKWARD-SAFE', 'RED', verdict(m3), 'failed: ' + JSON.stringify(m3.failedNames))

  // M4 — THE CYCLE-37 TRAP, in its sharpest available form. The probe proved exactly one
  // pair exists that the product genuinely emits and the committed 35-day sweep never
  // sees: 44% "first quarter" (60 hits in a 1-min/120-day sweep). Rebuild row 3 from the
  // real renderer at such an instant — north half, south half, real discs, real percent —
  // i.e. an HONEST README regeneration. It must stay green.
  let m4Row = null; let m4Instant = null
  const FINE_START = Date.UTC(2026, 0, 1)
  for (let t = FINE_START; t < FINE_START + 120 * 86400000 && !m4Row; t += 60000) {
    const d = new Date(t)
    const north = renderLine(computeMoon(d), 'north')
    if (!/ 44%\s+first quarter/.test(north)) continue
    m4Instant = d.toISOString()
    const south = renderLine(computeMoon(d), 'south')
    m4Row = north.replace(/\s+$/, '').padEnd(southOffset(rows[3])) + south.replace(/\s+$/, '')
  }
  if (!m4Row) {
    record('M4-HONEST-REGEN', 'GREEN', 'SKIPPED', 'no 44% first-quarter instant found')
  } else {
    writeRow(3, m4Row)
    const m4 = runSuite()
    record('M4-HONEST-REGEN', 'GREEN', verdict(m4),
      'instant ' + m4Instant + ' failed: ' + JSON.stringify(m4.failedNames))
    console.log('      row: ' + JSON.stringify(m4Row))
  }

  // C0-2 — control last. Green at both ends proves the harness stayed live throughout
  // and that every RED above came from the mutation, not from a leftover dirty README.
  fs.writeFileSync(README, ORIGINAL)
  const c0b = runSuite()
  record('C0-CONTROL-2', 'GREEN', verdict(c0b), c0b.pass + '/' + c0b.tests + ' pass')

  // --- determinism: the acceptance forbids Date.now(). Prove it two ways ------------
  console.log('\n=== determinism ===')
  const srcAdded = execFileSync('git', ['-C', REPO, 'diff', 'HEAD~1', 'HEAD', '--', 'test/regressions.test.js'],
    { encoding: 'utf8' }).split('\n').filter((l) => l.startsWith('+')).join('\n')
  console.log('  Date.now / new Date() with no args in the added lines: ' +
    (/Date\.now\(\)|new Date\(\s*\)/.test(srcAdded) ? '*** PRESENT ***' : 'none'))
  for (const tz of ['UTC', 'Asia/Tokyo', 'America/New_York', 'Pacific/Kiritimati']) {
    const r = runSuite({ TZ: tz })
    console.log('  TZ=' + tz.padEnd(20) + verdict(r) + '  ' + r.pass + '/' + r.tests)
  }

  console.log('\n=== cost ===')
  console.log('  suite duration: ' + Math.round(c0.ms) + 'ms (baseline before this item was 1998ms)')

  console.log('\n=== discrimination detail ===')
  console.log('  M1b killed by T-135 test specifically: ' + m1KilledByT135)
  console.log('  M1b left T-134 order/band test GREEN:  ' + m1T134Green +
    '  <- confirms the hole T-135 was filed for was real')

  const bad = results.filter((r) => !r.ok)
  console.log('\n=== VERDICT: ' + (bad.length === 0 ? 'GATE PASS' : 'GATE FAIL (' +
    bad.map((r) => r.label).join(', ') + ')') + ' ===')
} finally {
  fs.writeFileSync(README, ORIGINAL)
  const restored = fs.readFileSync(README, 'utf8') === ORIGINAL
  console.log('\nREADME restored byte-for-byte: ' + restored)
}
