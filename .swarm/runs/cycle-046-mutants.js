'use strict'

// cycle-046 — FAILABILITY PROOF for the T-141 end-to-end QA harness.
//
// A harness that reports 28/28 on its first run has proved nothing until it is shown it
// CAN go red. Each mutant below breaks one documented end-to-end behaviour in a throwaway
// COPY of the repo (the repo source is never touched) and names the check that must die.
// A SURVIVING mutant means the harness is decorative for that behaviour.
//
// Note the asymmetry that makes this meaningful: the mutants edit src/ and bin/, while the
// harness derives its expectations from README.md, which is copied UNMUTATED. So the
// contract and the implementation come from genuinely different places.

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const REPO = path.resolve(__dirname, '..', '..')
const HARNESS = path.join(__dirname, 'cycle-046-e2e-qa.js')

const MUTANTS = [
  {
    id: 'M1',
    what: '--south becomes a no-op (hemisphere ignored by the renderer)',
    kills: ['C11'],
    file: 'bin/moon.js',
    from: 'const hemisphere = opts.hemisphere || detectHemisphere()',
    to: "const hemisphere = 'north'"
  },
  {
    id: 'M2',
    what: '--compact no longer suppresses the next-full-moon line',
    kills: ['C4'],
    file: 'bin/moon.js',
    from: 'if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))',
    to: 'lines.push(nextFullLine(now, NAME_COLUMN))'
  },
  {
    id: 'M3',
    what: '--json renames a documented field (cycleFraction -> cycle_fraction)',
    kills: ['C6'],
    file: 'bin/moon.js',
    from: 'cycleFraction: round(moon.cycleFraction, 5),',
    to: 'cycle_fraction: round(moon.cycleFraction, 5),'
  },
  {
    id: 'M4',
    what: 'usage errors go to STDOUT and exit 0 ("safe to pipe" broken)',
    kills: ['C21', 'C22', 'C23', 'C24', 'C26'],
    file: 'bin/moon.js',
    from: "process.stderr.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)\n    return 2",
    to: "process.stdout.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)\n    return 0"
  },
  {
    id: 'M5',
    what: 'the next-full-moon date is formatted from the UTC month instead of the local one',
    kills: ['C10'],
    file: 'bin/moon.js',
    from: 'const month = MONTHS[when.getMonth()]',
    to: 'const month = MONTHS[(when.getMonth() + 1) % 12]'
  },
  {
    id: 'M6',
    what: '--help no longer wins over --json',
    kills: ['C20'],
    file: 'bin/moon.js',
    from: '  if (opts.help) {\n    process.stdout.write(HELP + \'\\n\')\n    return 0\n  }',
    to: '  if (opts.help && !opts.json) {\n    process.stdout.write(HELP + \'\\n\')\n    return 0\n  }'
  },
  {
    id: 'M7',
    what: 'JSON rounding removed — raw float dumps ("precision theatre")',
    kills: ['C8'],
    file: 'bin/moon.js',
    from: 'function round (value, places) {\n  const f = 10 ** places\n  return Math.round(value * f) / f\n}',
    to: 'function round (value, places) {\n  return value\n}'
  },
  {
    id: 'M8',
    what: 'the block top rule is one column wider than the body (box misalignment)',
    kills: ['C16'],
    file: 'src/render.js',
    from: 'lines.push(BOX.tl + BOX.h.repeat(BLOCK_INNER) + BOX.tr);',
    to: 'lines.push(BOX.tl + BOX.h.repeat(BLOCK_INNER + 1) + BOX.tr);'
  },
  {
    id: 'M9',
    what: 'the readout drops a disc cell, shifting the phase name off column 12',
    kills: ['C2'],
    file: 'src/render.js',
    from: 'const LINE_CELLS = 5;',
    to: 'const LINE_CELLS = 4;'
  },
  {
    id: 'M10',
    what: 'hemisphere auto-detection always answers north (TZ ignored)',
    kills: ['C15'],
    file: 'src/hemisphere.js',
    from: 'function detectHemisphere(timeZone) {\n  let zone = timeZone;',
    to: "function detectHemisphere(timeZone) {\n  return 'north';\n  let zone = timeZone;"
  }
]

// PROBE SET for the no-op guard below. If a mutant produces byte-identical output to the
// unmutated binary across all of these, it changed nothing observable — and reporting it
// as "SURVIVED" would blame the harness for the generator's failure to mutate.
// Each probe is [args, TZ]. The TZ column is load-bearing: a first version pinned every
// probe to UTC and therefore read M10 ("auto-detection always answers north") as a no-op,
// because under UTC the correct answer IS north. A guard blind to the timezone axis would
// have quietly excused any TZ-dependent mutation.
// STANDING RULE, learned twice in this cycle: the guard must be AT LEAST as observant as
// the harness it polices, or it excuses mutations the harness would have caught. First
// version pinned TZ=UTC and called M10 a no-op; second omitted flag COMBINATIONS and
// called M6 (--help vs --json precedence) a no-op. Both were the probe set's blindness,
// not the mutant's innocence. This set now covers every invocation shape the harness runs.
const PROBES = [
  [[], 'UTC'], [['--json'], 'UTC'], [['--block'], 'UTC'], [['--compact'], 'UTC'],
  [['--south'], 'UTC'], [['--north'], 'UTC'],
  [['--help'], 'UTC'], [['-h'], 'UTC'],
  [['--nope'], 'UTC'], [['fullmoon'], 'UTC'], [['--json=yes'], 'UTC'], [['-x'], 'UTC'],
  [['--json', '--help'], 'UTC'],
  [['--block', '--compact'], 'UTC'],
  [['--south', '--north'], 'UTC'], [['--north', '--south'], 'UTC'],
  [['--json', '--south'], 'UTC'], [['--json', '--north'], 'UTC'],
  [['--json'], 'Australia/Sydney'], [['--json'], 'Europe/London'],
  [['--json'], 'America/New_York'], [['--json'], 'America/Santiago'],
  [[], 'Australia/Sydney'], [['--block'], 'America/Santiago']
]

function observe (dir) {
  return PROBES.map(function (probe) {
    const args = probe[0]
    const tz = probe[1]
    const r = spawnSync(process.execPath, [path.join(dir, 'bin', 'moon.js')].concat(args), {
      encoding: 'utf8', cwd: dir, shell: false, env: Object.assign({}, process.env, { TZ: tz })
    })
    // Drop the volatile timestamp/julianDay so a mere clock tick is not read as a change.
    const scrub = function (s) {
      return String(s || '')
        .replace(/"timestamp":"[^"]*"/, '"timestamp":"<T>"')
        .replace(/"julianDay":[0-9.]+/, '"julianDay":<J>')
        .replace(/"age":[0-9.]+/, '"age":<A>')
    }
    return 'TZ=' + tz + ' ' + args.join(' ') + ' => ' + r.status + ' | ' + scrub(r.stdout) + ' | ' + scrub(r.stderr)
  }).join('\n')
}

function copyRepo (dest) {
  fs.cpSync(REPO, dest, {
    recursive: true,
    filter: function (src) {
      const rel = path.relative(REPO, src)
      if (rel.startsWith('.git' + path.sep) || rel === '.git') return false
      if (rel.startsWith('node_modules')) return false
      return true
    }
  })
}

// Some mutants are easier to express as a surgical edit than a literal swap.
function applyDynamic (id, dir) {
  if (id === 'M8') {
    // Widen exactly one frame row by one column.
    const p = path.join(dir, 'src', 'render.js')
    let s = fs.readFileSync(p, 'utf8')
    const m = /(\n\s*)(lines\.push\(.*?\))/.exec(s)
    if (!m) return { ok: false, why: 'no lines.push in render.js' }
    // Append a stray space to the FIRST rendered block row.
    const idx = s.indexOf('│')
    if (idx < 0) return { ok: false, why: 'no frame char in render.js' }
    // Pad the label rows: find the row-building template and add one space.
    const before = s
    s = s.replace(/(const PAD\s*=\s*)(\d+)/, function (_, a, n) { return a + (Number(n) + 1) })
    if (s === before) {
      // Fall back: widen the horizontal rule only, which desynchronises top vs body.
      s = s.replace(/'─'\.repeat\(([^)]+)\)/, "'─'.repeat($1 + 1)")
    }
    if (s === before) return { ok: false, why: 'no width knob found in render.js' }
    fs.writeFileSync(p, s)
    return { ok: true }
  }
  if (id === 'M9') {
    const p = path.join(dir, 'src', 'render.js')
    let s = fs.readFileSync(p, 'utf8')
    const before = s
    // renderLine builds a 5-cell disc; drop the last cell before it is joined.
    s = s.replace(/(function renderLine\s*\([^)]*\)\s*\{)/, '$1\n  const __mutantDrop = true')
    s = s.replace(/(\n\s*)return\s+(disc|cells)([^\n]*)\n/, function (full, ws, name, rest) {
      return ws + 'return ' + name + rest.replace(/$/, '') + '\n'
    })
    // Simplest reliable shrink: make the cell count 4 instead of 5.
    s = s.replace(/(\bCELLS\s*=\s*)5\b/, '$14')
    s = s.replace(/(\bWIDTH\s*=\s*)5\b/, '$14')
    s = s.replace(/(\bDISC_CELLS\s*=\s*)5\b/, '$14')
    if (s === before) return { ok: false, why: 'no 5-cell constant found in render.js' }
    fs.writeFileSync(p, s)
    return { ok: true }
  }
  if (id === 'M10') {
    const p = path.join(dir, 'src', 'hemisphere.js')
    let s = fs.readFileSync(p, 'utf8')
    const before = s
    s = s.replace(/(function detectHemisphere\s*\([^)]*\)\s*\{)/, "$1\n  return 'north'")
    if (s === before) return { ok: false, why: 'detectHemisphere not found' }
    fs.writeFileSync(p, s)
    return { ok: true }
  }
  return { ok: false, why: 'no dynamic rule' }
}

function runHarness (dir) {
  const res = spawnSync(process.execPath, [HARNESS], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { MOON_REPO: dir }),
    shell: false
  })
  const out = (res.stdout || '') + (res.stderr || '')
  const failed = []
  for (const line of out.split('\n')) {
    const m = /^FAIL (C\d+)/.exec(line)
    if (m) failed.push(m[1])
  }
  return { status: res.status, failed, out }
}

console.log('=== T-141 harness failability proof — cycle 046 ===')
console.log('Each mutant breaks ONE documented behaviour. A mutant that SURVIVES means the')
console.log('harness does not actually check that behaviour.')
console.log('')

let survivors = 0
let unbuildable = 0
const rows = []

for (const mu of MUTANTS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-mut-' + mu.id + '-'))
  copyRepo(dir)
  const baseline = observe(dir)

  let applied = { ok: false, why: 'not attempted' }
  const p = path.join(dir, mu.file)
  const s = fs.readFileSync(p, 'utf8')
  if (s.indexOf(mu.from) < 0) {
    applied = { ok: false, why: 'anchor text not found in ' + mu.file }
  } else if (s.split(mu.from).length - 1 !== 1) {
    applied = { ok: false, why: 'anchor is not unique in ' + mu.file + ' (' + (s.split(mu.from).length - 1) + ' occurrences)' }
  } else {
    fs.writeFileSync(p, s.replace(mu.from, mu.to))
    applied = { ok: true }
  }

  if (!applied.ok) {
    unbuildable++
    rows.push({ id: mu.id, verdict: 'NOT APPLIED', detail: applied.why })
    console.log('SKIP ' + mu.id + '  ' + mu.what)
    console.log('      mutation could not be applied: ' + applied.why)
    fs.rmSync(dir, { recursive: true, force: true })
    continue
  }

  // NO-OP GUARD (added after M9 falsely read as a harness gap at first run): a mutant that
  // does not change what the binary OUTPUTS cannot possibly be caught, and calling that a
  // survivor blames the harness for a defect in this generator.
  const mutated = observe(dir)
  if (mutated === baseline) {
    unbuildable++
    rows.push({ id: mu.id, verdict: 'NO-OP MUTANT', detail: 'text changed but observable output is identical — generator defect, NOT a harness gap' })
    console.log('NOOP ' + mu.id + '  ' + mu.what)
    console.log('      text was edited but the binary behaves identically — not a valid mutant')
    fs.rmSync(dir, { recursive: true, force: true })
    continue
  }

  const r = runHarness(dir)
  const expected = mu.kills
  const got = r.failed
  const killedAll = expected.every(function (c) { return got.indexOf(c) >= 0 })
  const verdict = killedAll ? 'KILLED' : (got.length ? 'PARTIAL' : 'SURVIVED')
  if (!killedAll) survivors++
  rows.push({ id: mu.id, verdict: verdict, detail: 'expected ' + expected.join(',') + ' got ' + (got.join(',') || '(none)') })
  console.log((killedAll ? 'KILL ' : (got.length ? 'PART ' : 'LIVE ')) + mu.id + '  ' + mu.what)
  console.log('      expected to fail: ' + expected.join(', '))
  console.log('      actually failed:  ' + (got.join(', ') || '(NOTHING — the harness did not notice)'))
  fs.rmSync(dir, { recursive: true, force: true })
}

console.log('')
console.log('=== MUTATION SUMMARY ===')
for (const r of rows) console.log('  ' + r.id + '  ' + r.verdict + '  — ' + r.detail)
console.log('')
console.log('applied mutants: ' + (MUTANTS.length - unbuildable) + '/' + MUTANTS.length +
  '   survivors/partials: ' + survivors + '   not-applied: ' + unbuildable)
process.exitCode = survivors > 0 ? 1 : 0
