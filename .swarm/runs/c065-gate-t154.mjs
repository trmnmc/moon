// Conductor-authored verification gate for T-154 (cycle 65).
// Written at VERIFICATION TIME, independently of the builder's own harness.
// The builder never saw this file.
//
// Design: the claim under test is "the new test kills mutant M20 AND the kill is
// attributable to that test". A harness that reported RED for everything would
// "confirm" the claim while proving nothing, so this gate carries CONTROLS in both
// directions:
//   C1 pristine tree, test present   -> must be GREEN (the test does not false-reject
//                                       honest output)
//   A  mutant present, test present  -> must be RED, and the FAILING TEST MUST BE THE
//                                       NEW ONE BY NAME (attribution, not just a kill)
//   B  mutant present, test absent   -> must be GREEN (removing the test lets the
//                                       mutation survive -> the kill is this test's)
// Two mutant variants are run: the full accessor swap and the minimal one-accessor
// swap, so a test that only happens to catch the broad edit is not mistaken for one
// that discriminates the behavior.
//
// Verdict is keyed on the child EXIT CODE (needs no output parsing); the parsed
// counts are cross-checked against it and disagreement is a loud failure, not a
// silent inversion. (This is the c064 lesson: a parser that mis-reads the reporter
// form can invert a gate while looking green.)

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'

const REPO = '/opt/targets/moon'
const TESTNAME = "next-full-moon date prints the reader's local day, not the UTC day"

// ---- work on a pristine COPY so the real repo is never mutated by this gate ----
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c065-gate-'))
execFileSync('cp', ['-a', REPO + '/.', WORK])
fs.rmSync(path.join(WORK, '.git'), { recursive: true, force: true })

const BIN = path.join(WORK, 'bin', 'moon.js')
const TESTFILE = path.join(WORK, 'test', 'regressions.test.js')
const BIN_PRISTINE = fs.readFileSync(BIN, 'utf8')
const TEST_PRISTINE = fs.readFileSync(TESTFILE, 'utf8')

// ---- my own mutants, written here, not copied from the builder or the sweep ----
function mutateFull (src) {
  // swap every local-calendar accessor inside formatFullMoonDate for its UTC form
  const before = src
  const out = src.replace(
    /function formatFullMoonDate \(when, now\) \{[\s\S]*?\n\}/,
    (fn) => fn
      .replace(/\.getDate\(\)/g, '.getUTCDate()')
      .replace(/\.getMonth\(\)/g, '.getUTCMonth()')
      .replace(/\.getFullYear\(\)/g, '.getUTCFullYear()'))
  if (out === before) throw new Error('mutateFull: pattern did not match — gate is broken')
  return out
}
function mutateMinimal (src) {
  const before = src
  const out = src.replace('when.getDate()', 'when.getUTCDate()')
  if (out === before) throw new Error('mutateMinimal: pattern did not match — gate is broken')
  return out
}

// ---- remove the new test by MY OWN means (locate its own test() block) ----
function removeNewTest (src) {
  const marker = "test('next-full-moon date prints the reader\\'s local day, not the UTC day'"
  const at = src.indexOf(marker)
  if (at === -1) throw new Error('removeNewTest: new test not found — gate is broken')
  // walk back over the leading comment block that documents it
  let start = at
  const lines = src.slice(0, at).split('\n')
  let i = lines.length - 1
  while (i >= 0 && (lines[i].startsWith('//') || lines[i].trim() === '')) i--
  start = lines.slice(0, i + 1).join('\n').length + 1
  // find the end of the test call: first line that is exactly "})" at column 0 after `at`
  const endIdx = src.indexOf('\n})\n', at)
  if (endIdx === -1) throw new Error('removeNewTest: could not find block end — gate is broken')
  return src.slice(0, start) + src.slice(endIdx + 4)
}

// `test_cmd` is `node --test test/*.test.js` — the glob is a SHELL feature, so
// enumerate it from disk rather than hand-listing files. Hand-listing is exactly how
// this gate silently ran a 134-test subset on its first attempt; reading the directory
// cannot drift from what the shell would expand.
const TESTGLOB = fs.readdirSync(path.join(WORK, 'test'))
  .filter((f) => f.endsWith('.test.js')).sort()
if (TESTGLOB.length < 8) throw new Error('gate: expected >=8 test files, found ' + TESTGLOB.length)

function runSuite (label) {
  const r = spawnSync('node', ['--test', ...TESTGLOB.map((f) => 'test/' + f)],
    { cwd: WORK, encoding: 'utf8', timeout: 300000, shell: false })
  const out = (r.stdout || '') + (r.stderr || '')
  const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : null }
  const tests = num(/(?:^|\n)(?:ℹ |# )tests (\d+)/)
  const pass = num(/(?:^|\n)(?:ℹ |# )pass (\d+)/)
  const fail = num(/(?:^|\n)(?:ℹ |# )fail (\d+)/)
  const exit = r.status
  // exit code and parsed fail count MUST agree, or the parse is wrong and the gate
  // must fail loudly rather than report a number it cannot trust.
  if (fail === null || pass === null || tests === null) {
    throw new Error(`${label}: could not parse counts (exit ${exit}). Head:\n` + out.slice(0, 600))
  }
  if ((exit === 0) !== (fail === 0)) {
    throw new Error(`${label}: exit code ${exit} disagrees with fail count ${fail} — parse broken`)
  }
  // Failing-test names: accept BOTH reporter forms (TAP `not ok N - name` and the
  // spec reporter's `✖ name (Nms)`), and cross-check the harvested count against the
  // parsed `fail` count so a reporter change can never quietly yield "(none parsed)"
  // and be read as "no attribution".
  const tap = [...out.matchAll(/\nnot ok \d+ - (.+)/g)].map((m) => m[1].trim())
  const spec = [...out.matchAll(/\n\s*✖ (.+?) \(\d/g)].map((m) => m[1].trim())
  // The spec reporter names a failure twice (inline, then again in the trailing
  // failure summary), so dedupe to DISTINCT names. The strictness that matters is
  // "exactly one distinct test failed and it is the new one", not the print count.
  const failedNames = [...new Set((tap.length ? tap : spec)
    .filter((n) => !/^test\/.+\.test\.js$/.test(n)))]
  if (fail > 0 && failedNames.length === 0) {
    throw new Error(`${label}: ${fail} failure(s) but no test name parsed — reporter form ` +
      'unrecognized, attribution cannot be judged. Tail:\n' + out.slice(-1500))
  }
  return { label, exit, tests, pass, fail, failedNames, out }
}

const results = []
function scenario (label, binSrc, testSrc) {
  fs.writeFileSync(BIN, binSrc)
  fs.writeFileSync(TESTFILE, testSrc)
  const r = runSuite(label)
  results.push(r)
  return r
}

// ---------------- independent re-derivation of the test's arithmetic ----------------
const { createRequire } = await import('node:module')
const requireWork = createRequire(path.join(WORK, 'gate.cjs'))
const astro = requireWork(path.join(WORK, 'src', 'astro.js'))
const now = new Date('2026-06-01T00:00:00Z')
const nfm = new Date(astro.nextFullMoon(now).getTime())
const utcDay = nfm.toISOString().slice(0, 10)
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Pacific/Kiritimati', year: 'numeric', month: '2-digit', day: '2-digit'
})
const kiriDay = fmt.format(nfm)
const offsetMin = (() => {
  const d = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Kiritimati', timeZoneName: 'longOffset'
  }).formatToParts(nfm).find((p) => p.type === 'timeZoneName').value
  return d
})()

console.log('=== ARITHMETIC (re-derived by the conductor, not read from the test) ===')
console.log('now                       :', now.toISOString())
console.log('astro.nextFullMoon(now)   :', nfm.toISOString())
console.log('UTC calendar day          :', utcDay, '->', Number(utcDay.slice(8, 10)), 'Jun')
console.log('Pacific/Kiritimati offset :', offsetMin)
console.log('Kiritimati calendar day   :', kiriDay, '->', Number(kiriDay.slice(8, 10)), 'Jun')
console.log('days differ               :', utcDay !== kiriDay)
console.log('tz actually resolved (not silently UTC):', offsetMin !== 'GMT' && offsetMin !== 'GMT+00:00')
console.log()

// ---------------- the four scenarios ----------------
console.log('=== SCENARIOS ===')
const c1 = scenario('C1 CONTROL pristine bin + test present', BIN_PRISTINE, TEST_PRISTINE)
const a1 = scenario('A1 mutant FULL  + test present', mutateFull(BIN_PRISTINE), TEST_PRISTINE)
const b1 = scenario('B1 mutant FULL  + test REMOVED', mutateFull(BIN_PRISTINE), removeNewTest(TEST_PRISTINE))
const a2 = scenario('A2 mutant MIN   + test present', mutateMinimal(BIN_PRISTINE), TEST_PRISTINE)
const b2 = scenario('B2 mutant MIN   + test REMOVED', mutateMinimal(BIN_PRISTINE), removeNewTest(TEST_PRISTINE))

for (const r of results) {
  console.log(`${r.label.padEnd(40)} exit=${r.exit} tests=${r.tests} pass=${r.pass} fail=${r.fail}` +
    (r.failedNames.length ? '  failed: ' + r.failedNames.join(' | ') : ''))
}
console.log()

// ---------------- verdict ----------------
const checks = []
const ck = (name, ok, detail) => { checks.push({ name, ok, detail }); }

ck('arithmetic: UTC and Kiritimati calendar days genuinely differ', utcDay !== kiriDay,
  `${utcDay} vs ${kiriDay}`)
ck('arithmetic: Kiritimati resolved to a real non-UTC offset (tzdata present)',
  offsetMin !== 'GMT' && offsetMin !== 'GMT+00:00', offsetMin)
ck('C1 pristine tree is GREEN with the new test (no false-reject)', c1.exit === 0 && c1.fail === 0,
  `exit=${c1.exit} fail=${c1.fail}`)
ck('C1 suite grew to 148 and never dropped below the 145 baseline', c1.tests === 148,
  `tests=${c1.tests}`)
ck('A1 FULL mutant is KILLED with the test present', a1.exit !== 0 && a1.fail >= 1,
  `exit=${a1.exit} fail=${a1.fail}`)
ck('A1 kill is ATTRIBUTABLE: the new test is the failing one',
  a1.failedNames.length === 1 && a1.failedNames[0].includes('local day, not the UTC day'),
  a1.failedNames.join(' | ') || '(none parsed)')
ck('B1 FULL mutant SURVIVES with the test removed', b1.exit === 0 && b1.fail === 0,
  `exit=${b1.exit} fail=${b1.fail} tests=${b1.tests}`)
ck('A2 MINIMAL mutant is KILLED with the test present', a2.exit !== 0 && a2.fail >= 1,
  `exit=${a2.exit} fail=${a2.fail}`)
ck('A2 kill is ATTRIBUTABLE: the new test is the failing one',
  a2.failedNames.length === 1 && a2.failedNames[0].includes('local day, not the UTC day'),
  a2.failedNames.join(' | ') || '(none parsed)')
ck('B2 MINIMAL mutant SURVIVES with the test removed', b2.exit === 0 && b2.fail === 0,
  `exit=${b2.exit} fail=${b2.fail} tests=${b2.tests}`)

console.log('=== CHECKS ===')
for (const c of checks) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + '   [' + c.detail + ']')
const verdict = checks.every((c) => c.ok)
console.log()
console.log('VERDICT: GATE ' + (verdict ? 'PASS' : 'FAIL'))
console.log('workdir (copy, real repo untouched): ' + WORK)
process.exit(verdict ? 0 : 1)
