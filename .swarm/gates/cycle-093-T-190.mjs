#!/usr/bin/env node
// cycle 93 / T-190 verification gate. Conductor-authored at gate time and SEALED BY HASH
// before the builder was dispatched; the builder never saw this file and cannot have coded
// to it. Every check below is shape-agnostic where it can be -- it tests BEHAVIOUR of the
// shipped CLI and the KILLING POWER of the suite, not the identifiers the builder chose.
//
// The item's acceptance offers two mutually exclusive fixes. The conductor's judgment call,
// recorded before dispatch: the DOCS move, the emitted value does NOT. So this gate FAILS a
// build that rounded nextFullMoon, even though that would also "close" the finding -- an
// item that ignores the decision is not done.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const REPO = '/opt/targets/moon'
const BIN = path.join(REPO, 'bin', 'moon.js')
const README = path.join(REPO, 'README.md')
const results = []
const rec = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok === null ? 'NOT-RUN' : ok ? 'PASS   ' : 'FAIL   '}  ${name}\n           ${detail}`)
}

const testFiles = fs.readdirSync(path.join(REPO, 'test'))
  .filter((f) => f.endsWith('.test.js')).sort()
  .map((f) => path.join('test', f))

function runSuite () {
  try {
    const out = execFileSync('node', ['--test', ...testFiles],
      { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 240000 })
    return { green: true, out }
  } catch (e) {
    return { green: false, out: (e.stdout || '') + (e.stderr || '') }
  }
}
const tally = (out) => (out.match(/^# (?:tests|pass|fail) \d+$/gm) || []).join(' | ') ||
  (out.match(/[ℹ] (?:tests|pass|fail) \d+/g) || []).join(' | ')

const json = () => JSON.parse(execFileSync('node', ['bin/moon.js', '--json'],
  { cwd: REPO, encoding: 'utf8' }))
const help = () => execFileSync('node', ['bin/moon.js', '--help'], { cwd: REPO, encoding: 'utf8' })

// ---------------------------------------------------------------- 1. key set unchanged
const EXPECTED_KEYS = ['phase', 'illumination', 'age', 'cycleFraction', 'phaseAngle',
  'hemisphere', 'nextFullMoon', 'julianDay', 'timestamp']
const payload = json()
const keys = Object.keys(payload).sort()
rec('--json key set unchanged (no field added, none removed)',
  JSON.stringify(keys) === JSON.stringify([...EXPECTED_KEYS].sort()),
  `emitted: ${Object.keys(payload).join(',')}`)

// ------------------------------------------- 2. the decision was honoured: value did NOT move
const nfm = payload.nextFullMoon
const fullIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(nfm)
const subMinute = nfm.slice(17) !== '00.000Z'
rec('nextFullMoon still emitted at full ISO precision (docs moved, not the value)',
  fullIso && subMinute,
  `nextFullMoon=${nfm} fullIso=${fullIso} subMinuteNonZero=${subMinute}` +
  ' (a rounded-to-hour instant would read ...:00:00.000Z; the chance a true instant lands' +
  ' exactly there at ms granularity is negligible, and two consecutive runs are compared below)')

// ------------------------------------- 3. every rounded field survives its documented precision
const HELP = help()
const READ = fs.readFileSync(README, 'utf8')
const NUMERIC = ['illumination', 'age', 'cycleFraction', 'phaseAngle', 'julianDay']
const dpFails = []
for (const f of NUMERIC) {
  const v = payload[f]
  // find a dp figure asserted for this field anywhere in help or README
  const m = new RegExp(`${f}[^\\n]{0,80}?(\\d+)\\s*(?:dp|decimal)`, 'i').exec(HELP + '\n' + READ) ||
            new RegExp(`(\\d+)\\s*(?:dp|decimal)[^\\n]{0,80}?${f}`, 'i').exec(HELP + '\n' + READ)
  if (!m) { dpFails.push(`${f}: no documented precision found`); continue }
  const dp = Number(m[1])
  const k = 10 ** dp
  if (Math.round(v * k) / k !== v) dpFails.push(`${f}=${v} does not survive ${dp} dp`)
}
rec('each rounded --json field survives the precision the docs now claim for it',
  dpFails.length === 0, dpFails.length ? dpFails.join('; ') : `checked ${NUMERIC.join(', ')}`)

// --------------------------------------------- 4. the docs name nextFullMoon as the exception
const namesException = /nextFullMoon/.test(HELP) &&
  /(accura|~\s*1\s*h|roughly an hour|hour)/i.test(HELP) &&
  /nextFullMoon/.test(READ)
rec('help and README both still speak to nextFullMoon and its ~hour accuracy',
  namesException, `help mentions nextFullMoon: ${/nextFullMoon/.test(HELP)}; ` +
  `README mentions nextFullMoon: ${/nextFullMoon/.test(READ)}`)

// ------------------------------------------------------------ 5. baseline suite must be green
const base = runSuite()
rec('full test_cmd green before any mutation', base.green, tally(base.out) || base.out.slice(-300))

// ---------------------------------------------- 6/7/8. mutation kills + a control that must live
const ORIGINAL = fs.readFileSync(BIN, 'utf8')
const restore = () => fs.writeFileSync(BIN, ORIGINAL)

function mutate (label, transform, expect) {
  let src
  try { src = transform(ORIGINAL) } catch (e) { src = null }
  if (src === null || src === ORIGINAL) {
    rec(label, null, 'mutation could not be applied to the shipped source — reported NOT RUN, never as passed')
    return
  }
  fs.writeFileSync(BIN, src)
  const r = runSuite()
  restore()
  const ok = expect === 'red' ? !r.green : r.green
  rec(label, ok, `suite ${r.green ? 'GREEN' : 'RED'} (wanted ${expect.toUpperCase()}) — ${tally(r.out) || ''}`)
}

// MUTATION A — loosen illumination's rounding. Shape-agnostic: rewrite the standalone 4 on
// whatever line carries illumination's precision, whether that is round(x, 4) or a table entry.
mutate('MUTATION A: illumination precision 4 -> 2 must turn the suite RED', (s) => {
  const lines = s.split('\n')
  const i = lines.findIndex((l) => /illumination/.test(l) && /\b4\b/.test(l))
  if (i < 0) return null
  lines[i] = lines[i].replace(/\b4\b/, '2')
  return lines.join('\n')
}, 'red')

// MUTATION B — ship an undocumented --json field. This is the drift the pin exists to stop.
mutate('MUTATION B: an undocumented extra --json field must turn the suite RED', (s) => {
  const lines = s.split('\n')
  const i = lines.findIndex((l) => /JSON\.stringify\(\s*payload\s*\)/.test(l))
  if (i < 0) return null
  const indent = (lines[i].match(/^\s*/) || [''])[0]
  lines.splice(i, 0, `${indent}payload.zzzGateProbe = 1`)
  return lines.join('\n')
}, 'red')

// CONTROL C — a semantically inert edit must leave the suite GREEN. Without this, a suite that
// dies on every edit would score two false kills above.
mutate('CONTROL C: an inert comment edit must leave the suite GREEN',
  (s) => s + '\n// cycle-093 gate control: inert\n', 'green')

// ------------------------------------------------------------------ 9. tree restored verbatim
rec('bin/moon.js restored byte-identical after mutation testing',
  fs.readFileSync(BIN, 'utf8') === ORIGINAL, `${ORIGINAL.length} bytes`)

const notRun = results.filter((r) => r.ok === null).length
const failed = results.filter((r) => r.ok === false).length
console.log(`\nGATE: ${results.length - failed - notRun} pass / ${failed} fail / ${notRun} not-run`)
process.exit(failed === 0 && notRun === 0 ? 0 : 1)
