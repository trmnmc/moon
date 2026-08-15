// Cycle-36 gate G8: FAILABILITY. A gate that cannot fail is not a gate. Each mutant
// below breaks exactly one thing the gate claims to check; the gate must go red for
// every one, and the named check must be the one that reports FAIL. Files are restored
// from an in-memory snapshot after each mutant and re-verified byte-identical at the end.
const fs = require('node:fs')
const cp = require('node:child_process')

const ROOT = '/opt/targets/moon'
const FILES = ['/README.md', '/bin/moon.js', '/src/astro.js']
const snap = new Map(FILES.map((f) => [f, fs.readFileSync(ROOT + f, 'utf8')]))
const restore = () => { for (const [f, s] of snap) fs.writeFileSync(ROOT + f, s) }

const MUTANTS = [
  ['M1 README caution paragraph deleted', 'G7', '/README.md',
    (s) => s.slice(0, s.indexOf('**Caution on `cycleFraction`.**')) +
           s.slice(s.indexOf('**Caution on `phaseAngle`.**'))],
  ['M2 HELP CAUTION block deleted', 'G7', '/bin/moon.js',
    (s) => s.split('\n').filter((l) => !/^ {16}(CAUTION: this is angular|time\. Mid-cycle|~21 hours|Use the age field|at a true new\/full)/.test(l)).join('\n')],
  ['M3 a HELP CAUTION line dedented to field-name depth', 'G4', '/bin/moon.js',
    (s) => s.replace('                CAUTION: this is angular', '  CAUTION: this is angular')],
  ['M4 bogus row added to the README field table', 'G6', '/README.md',
    (s) => s.replace('| `hemisphere` | the hemisphere actually used for rendering |',
      '| `bogusField` | not in the payload |\n| `hemisphere` | the hemisphere actually used for rendering |')],
  ['M5 a byte OUTSIDE the HELP literal changed in bin/moon.js', 'G2b', '/bin/moon.js',
    (s) => s.replace('const NAME_COLUMN = 12', 'const NAME_COLUMN = 12 // mutant')],
  ['M6 src/ touched', 'G2c', '/src/astro.js',
    (s) => s.replace('const SYNODIC_MONTH = 29.530588861;', 'const SYNODIC_MONTH = 29.530588861; // mutant')],
  ['M7 the 21-hour figure silently changed in HELP', 'G7', '/bin/moon.js',
    (s) => s.replace('~21 hours', '~3 hours')],
]

let ok = 0
let bad = 0
for (const [name, expect, file, fn] of MUTANTS) {
  restore()
  fs.writeFileSync(ROOT + file, fn(snap.get(file)))
  const r = cp.spawnSync('node', [ROOT + '/.swarm/runs/cycle-036-gate.js'], { encoding: 'utf8' })
  const red = r.status !== 0
  const named = new RegExp('FAIL  ' + expect + '\\b').test(r.stdout)
  if (red && named) { ok++; console.log('KILLED   ' + name + '  (' + expect + ' went red, as designed)') } else {
    bad++
    console.log('SURVIVED ' + name + '  expected ' + expect + ' to fail; exit=' + r.status)
    console.log(r.stdout.split('\n').filter((l) => l.startsWith('FAIL')).join('\n') || '    (no check failed at all)')
  }
}
restore()

let drift = 0
for (const [f, s] of snap) if (fs.readFileSync(ROOT + f, 'utf8') !== s) { drift++; console.log('RESTORE FAILED: ' + f) }
console.log('\nfailability: ' + ok + ' killed, ' + bad + ' survived; restore drift: ' + drift)
process.exitCode = (bad === 0 && drift === 0) ? 0 : 1
