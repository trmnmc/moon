#!/usr/bin/env node
// cycle 93 / T-190 gate, PASS 2. Pass 1 (cycle-093-T-190.mjs, sha256 87d0ee17…b25d3, sealed
// before dispatch) is kept on disk with its output; its check 3 FAILED, and the failure was in
// MY INSTRUMENT, not in the product: I had encoded the documented precision as "<field> … N dp"
// / "N decimal", and the shipped note phrases it "decimal places: illumination to 4, age to 3,
// …". The claim was there; my pattern could not see it.
//
// The correction below reads the claim as actually written. It does NOT loosen the gate — pass 2
// is STRICTLY STRONGER than pass 1: it now also requires the prose figure to equal the code
// table's figure, and adds a generation proof (check G) that pass 1 did not have. Nothing in the
// product was changed to reach green.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const REPO = '/opt/targets/moon'
const BIN = path.join(REPO, 'bin', 'moon.js')
const results = []
const rec = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok === null ? 'NOT-RUN' : ok ? 'PASS   ' : 'FAIL   '}  ${name}\n           ${detail}`)
}
const help = () => execFileSync('node', ['bin/moon.js', '--help'], { cwd: REPO, encoding: 'utf8' })
const json = () => JSON.parse(execFileSync('node', ['bin/moon.js', '--json'],
  { cwd: REPO, encoding: 'utf8' }))

const HELP = help()
const READ = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8')
const payload = json()
const NOTE = HELP.slice(HELP.indexOf('Numeric fields'), HELP.indexOf('No network access')).trim()

// -------- 3a. read the precision the SHIPPED PROSE claims, as written, newline-tolerant
const flat = NOTE.replace(/\s+/g, ' ')
const claimed = {}
for (const m of flat.matchAll(/([a-zA-Z]+) to (\d+)\b/g)) claimed[m[1]] = Number(m[2])
const NUMERIC = ['illumination', 'age', 'cycleFraction', 'phaseAngle', 'julianDay']
const missing = NUMERIC.filter((f) => !(f in claimed))
rec('the shipped precision note states a decimal place count for every rounded field',
  missing.length === 0,
  missing.length ? `missing: ${missing.join(', ')}` : JSON.stringify(claimed))

// -------- 3b. the prose figure must EQUAL the code table's figure (prose cannot lie about code)
const table = (await import(BIN)).default ?? require1()
function require1 () { return null }
const mod = await import(`file://${BIN}`).then((m) => m).catch(() => null)
const P = (mod && (mod.JSON_FIELD_PRECISION || (mod.default && mod.default.JSON_FIELD_PRECISION))) ||
  JSON.parse(execFileSync('node',
    ['-e', 'process.stdout.write(JSON.stringify(require("/opt/targets/moon/bin/moon.js").JSON_FIELD_PRECISION))'],
    { encoding: 'utf8' }))
const mismatch = NUMERIC.filter((f) => !P[f] || P[f].places !== claimed[f])
rec('prose figure equals the code table figure for every rounded field',
  mismatch.length === 0,
  mismatch.length ? mismatch.map((f) => `${f}: prose ${claimed[f]} vs table ${P[f] && P[f].places}`).join('; ')
    : NUMERIC.map((f) => `${f}=${P[f].places}`).join(' '))

// -------- 3c. and the emitted value must actually survive that precision
const dpFails = NUMERIC.filter((f) => {
  const k = 10 ** claimed[f]
  return Math.round(payload[f] * k) / k !== payload[f]
})
rec('each rounded --json value survives re-rounding at the claimed precision',
  dpFails.length === 0,
  dpFails.length ? dpFails.join('; ') : NUMERIC.map((f) => `${f}=${payload[f]}`).join(' '))

// -------- 3d. instants are declared unrounded, and are
const instants = ['nextFullMoon', 'timestamp'].filter((f) => P[f] && P[f].kind === 'instant' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(payload[f]))
rec('nextFullMoon and timestamp are declared instants AND emitted at full ISO precision',
  instants.length === 2, `${payload.nextFullMoon} / ${payload.timestamp}`)

// -------- 4b. README carries the note verbatim, so the two documents cannot drift
rec('README.md embeds the generated note verbatim (byte-identical to --help)',
  READ.includes(NOTE), `note is ${NOTE.length} chars; README contains it: ${READ.includes(NOTE)}`)

// -------- G. GENERATION PROOF: is the note really built from the table, or hand-written to match?
// Change ONE number in the table and the help text must follow it. A hand-written paragraph
// would not move. This is the discriminator a faked implementation cannot produce.
const ORIGINAL = fs.readFileSync(BIN, 'utf8')
let src = null
{
  const lines = ORIGINAL.split('\n')
  const i = lines.findIndex((l) => /illumination/.test(l) && /\b4\b/.test(l))
  if (i >= 0) { lines[i] = lines[i].replace(/\b4\b/, '7'); src = lines.join('\n') }
}
if (src === null || src === ORIGINAL) {
  rec('GENERATION PROOF: help note tracks the table', null, 'table edit could not be applied — NOT RUN')
} else {
  fs.writeFileSync(BIN, src)
  let after = ''
  try { after = help() } catch (e) { after = `(--help failed: ${e.message})` }
  fs.writeFileSync(BIN, ORIGINAL)
  const moved = /illumination to 7\b/.test(after.replace(/\s+/g, ' '))
  rec('GENERATION PROOF: table illumination 4 -> 7 makes --help say "illumination to 7"',
    moved, moved ? 'help text followed the table — the note is generated, not hand-written'
      : `help text did NOT follow the table: ${after.replace(/\s+/g, ' ').slice(0, 200)}`)
}
rec('bin/moon.js restored byte-identical after the generation proof',
  fs.readFileSync(BIN, 'utf8') === ORIGINAL, `${ORIGINAL.length} bytes`)

const notRun = results.filter((r) => r.ok === null).length
const failed = results.filter((r) => r.ok === false).length
console.log(`\nGATE PASS 2: ${results.length - failed - notRun} pass / ${failed} fail / ${notRun} not-run`)
process.exit(failed === 0 && notRun === 0 ? 0 : 1)
