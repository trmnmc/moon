#!/usr/bin/env node
'use strict'

// T-152 mutation-sweep harness for bin/moon.js.
//
// Copies the tracked tree (bin/, src/, test/, README.md, package.json,
// .swarm/CONTRACTS.md — everything the suite reads) into a throwaway
// directory under the OS temp dir, applies one small semantic mutation to
// the scratch copy's bin/moon.js at a time, runs the full suite against the
// scratch copy, records KILLED/SURVIVED plus (on kill) the failing test
// name(s), restores the pristine file, and moves to the next mutant.
//
// The tracked repo at REPO_ROOT is never written to. The scratch directory
// is removed at the end of the run (successful or not — see the try/finally
// around main()).
//
// Run: node .swarm/runs/c064-sweep-moonjs.js
// (from anywhere; paths below are resolved from this file's location)

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const REPO_ROOT = path.join(__dirname, '..', '..')
const BIN_REL = path.join('bin', 'moon.js')

function copyTree (scratch) {
  for (const d of ['bin', 'src', 'test']) {
    fs.cpSync(path.join(REPO_ROOT, d), path.join(scratch, d), { recursive: true })
  }
  fs.copyFileSync(path.join(REPO_ROOT, 'README.md'), path.join(scratch, 'README.md'))
  fs.copyFileSync(path.join(REPO_ROOT, 'package.json'), path.join(scratch, 'package.json'))
  fs.mkdirSync(path.join(scratch, '.swarm'), { recursive: true })
  fs.copyFileSync(
    path.join(REPO_ROOT, '.swarm', 'CONTRACTS.md'),
    path.join(scratch, '.swarm', 'CONTRACTS.md')
  )
}

function runSuite (scratch) {
  const res = spawnSync(process.execPath, ['--test', 'test/*.test.js'], {
    cwd: scratch,
    encoding: 'utf8',
    shell: true // needed so the test/*.test.js glob expands; no untrusted input involved
  })
  const out = (res.stdout || '') + (res.stderr || '')
  const failMatch = /^ℹ fail (\d+)$/m.exec(out)
  const passMatch = /^ℹ pass (\d+)$/m.exec(out)
  const fail = failMatch ? Number(failMatch[1]) : null
  const pass = passMatch ? Number(passMatch[1]) : null
  // TAP failing-test names: node's default reporter prints "✖ <name> (...)" for each
  // failing leaf test, and a final "✖ failing tests:" summary block repeating them.
  // Collect the summary block, which is deduplicated and does not include failing
  // *files* (which also start with ✖ but name a path, not a test).
  const failingNames = []
  const summaryIdx = out.indexOf('✖ failing tests:')
  if (summaryIdx !== -1) {
    const tail = out.slice(summaryIdx)
    for (const line of tail.split('\n')) {
      const m = /^test at (.+)$/.exec(line.trim())
      if (m) failingNames.push(m[1])
    }
  }
  return { fail, pass, failingNames, raw: out }
}

const MUTANTS = [
  // --- 1. parseArgs-throw path: stderr shape + exit code 2 ---
  {
    id: 'M1',
    behavior: '1. parseArgs-throw stderr shape',
    desc: 'Drop the "moon: " prefix from the stderr line on a usage error',
    old: "process.stderr.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)",
    new: "process.stderr.write(`${err && err.message ? err.message : String(err)}\\n`)"
  },
  {
    id: 'M2',
    behavior: '1. parseArgs-throw exit code',
    desc: 'Change the usage-error exit code from 2 to 1',
    old: "    return 2\n  }\n\n  if (opts.help) {",
    new: "    return 1\n  }\n\n  if (opts.help) {"
  },

  // --- 2. --help precedence over --json, exit 0 ---
  {
    id: 'M3',
    behavior: '2. --help precedence',
    desc: 'Check --json before --help, so --help --json would print JSON not help',
    old: [
      "  if (opts.help) {",
      "    process.stdout.write(HELP + '\\n')",
      "    return 0",
      "  }",
      "",
      "  const now = new Date()",
      "  const hemisphere = opts.hemisphere || detectHemisphere()",
      "  const moon = computeMoon(now)",
      "",
      "  if (opts.json) {",
      "    const payload = {",
      "      phase: moon.phaseName,",
      "      illumination: round(moon.illumination, 4),",
      "      age: round(moon.age, 3),",
      "      cycleFraction: round(moon.cycleFraction, 5),",
      "      phaseAngle: round(moon.phaseAngle, 3),",
      "      hemisphere,",
      "      nextFullMoon: nextFullMoon(now).toISOString(),",
      "      julianDay: round(moon.julianDay, 5),",
      "      timestamp: now.toISOString()",
      "    }",
      "    process.stdout.write(JSON.stringify(payload) + '\\n')",
      "    return 0",
      "  }"
    ].join('\n'),
    new: [
      "  const now = new Date()",
      "  const hemisphere = opts.hemisphere || detectHemisphere()",
      "  const moon = computeMoon(now)",
      "",
      "  if (opts.json) {",
      "    const payload = {",
      "      phase: moon.phaseName,",
      "      illumination: round(moon.illumination, 4),",
      "      age: round(moon.age, 3),",
      "      cycleFraction: round(moon.cycleFraction, 5),",
      "      phaseAngle: round(moon.phaseAngle, 3),",
      "      hemisphere,",
      "      nextFullMoon: nextFullMoon(now).toISOString(),",
      "      julianDay: round(moon.julianDay, 5),",
      "      timestamp: now.toISOString()",
      "    }",
      "    process.stdout.write(JSON.stringify(payload) + '\\n')",
      "    return 0",
      "  }",
      "",
      "  if (opts.help) {",
      "    process.stdout.write(HELP + '\\n')",
      "    return 0",
      "  }"
    ].join('\n')
  },
  {
    id: 'M4',
    behavior: '2. --help exit code',
    desc: 'Change --help exit code from 0 to 1',
    old: "    process.stdout.write(HELP + '\\n')\n    return 0\n  }\n\n  const now = new Date()",
    new: "    process.stdout.write(HELP + '\\n')\n    return 1\n  }\n\n  const now = new Date()"
  },

  // --- 3. --json payload field set + rounding precisions ---
  {
    id: 'M5',
    behavior: '3. --json field set (remove a field)',
    desc: 'Drop the documented "hemisphere" field from the --json payload',
    old: "      hemisphere,\n      nextFullMoon: nextFullMoon(now).toISOString(),",
    new: "      nextFullMoon: nextFullMoon(now).toISOString(),"
  },
  {
    id: 'M6',
    behavior: '3. --json field set (add an undocumented field)',
    desc: 'Add an extra "extra: true" field not in HELP/README',
    old: "      phase: moon.phaseName,",
    new: "      phase: moon.phaseName,\n      extra: true,"
  },
  {
    id: 'M7',
    behavior: '3. --json rounding: illumination',
    desc: 'illumination precision 4 -> 5',
    old: 'illumination: round(moon.illumination, 4),',
    new: 'illumination: round(moon.illumination, 5),'
  },
  {
    id: 'M8',
    behavior: '3. --json rounding: age',
    desc: 'age precision 3 -> 4',
    old: 'age: round(moon.age, 3),',
    new: 'age: round(moon.age, 4),'
  },
  {
    id: 'M9',
    behavior: '3. --json rounding: cycleFraction',
    desc: 'cycleFraction precision 5 -> 6',
    old: 'cycleFraction: round(moon.cycleFraction, 5),',
    new: 'cycleFraction: round(moon.cycleFraction, 6),'
  },
  {
    id: 'M10',
    behavior: '3. --json rounding: phaseAngle',
    desc: 'phaseAngle precision 3 -> 4',
    old: 'phaseAngle: round(moon.phaseAngle, 3),',
    new: 'phaseAngle: round(moon.phaseAngle, 4),'
  },
  {
    id: 'M11',
    behavior: '3. --json rounding: julianDay',
    desc: 'julianDay precision 5 -> 6',
    old: 'julianDay: round(moon.julianDay, 5),',
    new: 'julianDay: round(moon.julianDay, 6),'
  },

  // --- 4. hemisphere resolution order ---
  {
    id: 'M12',
    behavior: '4. hemisphere resolution order',
    desc: 'Swap opts.hemisphere || detectHemisphere() to detectHemisphere() || opts.hemisphere',
    old: 'const hemisphere = opts.hemisphere || detectHemisphere()',
    new: 'const hemisphere = detectHemisphere() || opts.hemisphere'
  },

  // --- 5. --block vs default line; indent 3 vs NAME_COLUMN(12) ---
  {
    id: 'M13',
    behavior: '5. --block next-full-moon indent',
    desc: 'block indent 3 -> 2 (the value the in-file comment records as WRONG)',
    old: 'if (!opts.compact) lines.push(nextFullLine(now, 3))',
    new: 'if (!opts.compact) lines.push(nextFullLine(now, 2))'
  },
  {
    id: 'M14',
    behavior: '5. default next-full-moon indent (NAME_COLUMN)',
    desc: 'NAME_COLUMN 12 -> 11',
    old: 'const NAME_COLUMN = 12',
    new: 'const NAME_COLUMN = 11'
  },
  {
    id: 'M14b',
    behavior: '5. default next-full-moon indent (NAME_COLUMN)',
    desc: 'NAME_COLUMN 12 -> 13',
    old: 'const NAME_COLUMN = 12',
    new: 'const NAME_COLUMN = 13'
  },
  {
    id: 'M15',
    behavior: '5. --block vs default renderer selection',
    desc: 'Swap which renderer (renderBlock/renderLine) runs under --block vs default',
    old: [
      '  if (opts.block) {',
      '    lines.push(renderBlock(moon, hemisphere))',
      "    // 3, not 2: the block's own label column starts at column 4 (frame char +",
      '    // two spaces), so an indent of 2 put this line one column to its left.',
      '    if (!opts.compact) lines.push(nextFullLine(now, 3))',
      '  } else {',
      '    lines.push(renderLine(moon, hemisphere))',
      '    if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))',
      '  }'
    ].join('\n'),
    new: [
      '  if (opts.block) {',
      '    lines.push(renderLine(moon, hemisphere))',
      "    // 3, not 2: the block's own label column starts at column 4 (frame char +",
      '    // two spaces), so an indent of 2 put this line one column to its left.',
      '    if (!opts.compact) lines.push(nextFullLine(now, 3))',
      '  } else {',
      '    lines.push(renderBlock(moon, hemisphere))',
      '    if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))',
      '  }'
    ].join('\n')
  },

  // --- 6. --compact suppresses the next-full-moon line ---
  {
    id: 'M16',
    behavior: '6. --compact suppression (default branch)',
    desc: 'Invert the compact check on the default branch: push next-full-moon only WHEN --compact',
    old: 'lines.push(renderLine(moon, hemisphere))\n    if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))',
    new: 'lines.push(renderLine(moon, hemisphere))\n    if (opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))'
  },
  {
    id: 'M17',
    behavior: '6. --compact suppression (block branch)',
    desc: 'Drop the compact check on the --block branch entirely: always push next-full-moon',
    old: 'if (!opts.compact) lines.push(nextFullLine(now, 3))',
    new: 'lines.push(nextFullLine(now, 3))'
  },

  // --- 7. formatFullMoonDate: padStart, local vs UTC accessors, year ternary ---
  {
    id: 'M18',
    behavior: '7. formatFullMoonDate padStart',
    desc: 'Drop the padStart(2, \' \') pad on the day number',
    old: "const day = String(when.getDate()).padStart(2, ' ')",
    new: 'const day = String(when.getDate())'
  },
  {
    id: 'M19',
    behavior: '7. formatFullMoonDate padStart fill char',
    desc: "Pad char ' ' -> '0'",
    old: "const day = String(when.getDate()).padStart(2, ' ')",
    new: "const day = String(when.getDate()).padStart(2, '0')"
  },
  {
    id: 'M20',
    behavior: '7. formatFullMoonDate LOCAL vs UTC accessors',
    desc: 'Switch getDate/getMonth/getFullYear to their getUTC* equivalents',
    old: [
      "const day = String(when.getDate()).padStart(2, ' ')",
      '  const month = MONTHS[when.getMonth()]',
      "  const year = when.getFullYear() === now.getFullYear() ? '' : ` ${when.getFullYear()}`"
    ].join('\n'),
    new: [
      "const day = String(when.getUTCDate()).padStart(2, ' ')",
      '  const month = MONTHS[when.getUTCMonth()]',
      "  const year = when.getUTCFullYear() === now.getUTCFullYear() ? '' : ` ${when.getUTCFullYear()}`"
    ].join('\n')
  },
  {
    id: 'M21',
    behavior: '7. formatFullMoonDate year ternary',
    desc: 'Invert the year ternary: show year when it MATCHES, hide when it differs',
    old: "const year = when.getFullYear() === now.getFullYear() ? '' : ` ${when.getFullYear()}`",
    new: "const year = when.getFullYear() === now.getFullYear() ? ` ${when.getFullYear()}` : ''"
  },
  {
    id: 'M22',
    behavior: '7. formatFullMoonDate year ternary (always show)',
    desc: 'Always append the year regardless of match',
    old: "const year = when.getFullYear() === now.getFullYear() ? '' : ` ${when.getFullYear()}`",
    new: 'const year = ` ${when.getFullYear()}`'
  },

  // --- 8. round(): 10**places scaling + Math.round step ---
  {
    id: 'M23',
    behavior: '8. round() rounding rule',
    desc: 'Math.round -> Math.floor',
    old: 'return Math.round(value * f) / f',
    new: 'return Math.floor(value * f) / f'
  },
  {
    id: 'M24',
    behavior: '8. round() rounding rule',
    desc: 'Math.round -> Math.trunc',
    old: 'return Math.round(value * f) / f',
    new: 'return Math.trunc(value * f) / f'
  },
  {
    id: 'M25',
    behavior: '8. round() scaling formula',
    desc: '10 ** places -> places * 10 (exponential -> linear scale)',
    old: 'const f = 10 ** places',
    new: 'const f = places * 10'
  },
  {
    id: 'M26',
    behavior: '8. round() scaling off-by-one',
    desc: '10 ** places -> 10 ** (places + 1)',
    old: 'const f = 10 ** places',
    new: 'const f = 10 ** (places + 1)'
  }
]

// Run the pristine (or mutated) scratch binary with a FIXED, reproducible `now`,
// via the same Date-override technique test/regressions.test.js uses for its T-106
// tests, so witness output doesn't depend on when this harness happens to run.
function runFixed (scratchBin, args, tzOrNow, fixedNow) {
  const now = fixedNow || '2026-08-16T19:22:13.533Z'
  const tz = tzOrNow || 'UTC'
  const script = [
    `const R = Date; const f = new R(${JSON.stringify(now)});`,
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    `const code = require(${JSON.stringify(scratchBin)}).main(${JSON.stringify(args)});`,
    'process.stderr.write("EXITCODE:" + code + "\\n");'
  ].join('\n')
  const res = spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  })
  return { stdout: res.stdout, stderr: res.stderr }
}

// For each confirmed-survivor mutant, capture a concrete before/after witness by
// running the actual scratch binary (not just inspecting source). This is the
// evidence cited in c064-sweep-moonjs.md's "Classification of survivors" section.
// Uses the SAME scratch dir/bin the main sweep already built, and always restores
// bin/moon.js to `original` before returning.
function runWitnesses (scratch, scratchBin, original) {
  console.log('')
  console.log('=== WITNESS CAPTURE (survivors only; concrete before/after diffs) ===')

  const write = (src) => fs.writeFileSync(scratchBin, src, 'utf8')
  const restore = () => write(original)

  console.log('')
  console.log('--- M1: drop "moon: " stderr prefix --- (moon --bogus)')
  restore()
  console.log('baseline stderr:', JSON.stringify(runFixed(scratchBin, ['--bogus']).stderr))
  write(original.split(
    'process.stderr.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)'
  ).join(
    'process.stderr.write(`${err && err.message ? err.message : String(err)}\\n`)'
  ))
  console.log('mutant  stderr:', JSON.stringify(runFixed(scratchBin, ['--bogus']).stderr))
  restore()

  for (const [id, oldS, newS] of [
    ['M8 (age 3->4)', 'age: round(moon.age, 3),', 'age: round(moon.age, 4),'],
    ['M9 (cycleFraction 5->6)', 'cycleFraction: round(moon.cycleFraction, 5),', 'cycleFraction: round(moon.cycleFraction, 6),'],
    ['M11 (julianDay 5->6)', 'julianDay: round(moon.julianDay, 5),', 'julianDay: round(moon.julianDay, 6),'],
    ['M23 (Math.round->Math.floor)', 'return Math.round(value * f) / f', 'return Math.floor(value * f) / f'],
    ['M24 (Math.round->Math.trunc)', 'return Math.round(value * f) / f', 'return Math.trunc(value * f) / f'],
    ['M25 (10**places -> places*10)', 'const f = 10 ** places', 'const f = places * 10'],
    ['M7 (illumination 4->5, informational)', 'illumination: round(moon.illumination, 4),', 'illumination: round(moon.illumination, 5),']
  ]) {
    restore()
    const before = runFixed(scratchBin, ['--json']).stdout.trim()
    write(original.split(oldS).join(newS))
    const after = runFixed(scratchBin, ['--json']).stdout.trim()
    console.log('')
    console.log(`--- ${id} ---`)
    console.log('baseline:', before)
    console.log('mutant:  ', after)
  }
  restore()

  console.log('')
  console.log('--- M17: drop compact check on --block branch --- (moon --block --compact)')
  console.log('baseline:', JSON.stringify(runFixed(scratchBin, ['--block', '--compact']).stdout))
  write(original.split(
    'if (!opts.compact) lines.push(nextFullLine(now, 3))'
  ).join(
    'lines.push(nextFullLine(now, 3))'
  ))
  console.log('mutant:  ', JSON.stringify(runFixed(scratchBin, ['--block', '--compact']).stdout))
  restore()

  console.log('')
  console.log('--- M20: LOCAL vs UTC date accessors --- (TZ=Pacific/Kiritimati, UTC+14;')
  console.log('    now=2026-06-30T00:00:00Z so nextFullMoon lands at 2026-07-29T14:35:37.963Z UTC,')
  console.log('    which is 2026-07-30 local in Kiritimati: LOCAL and UTC calendar dates differ)')
  const m20now = '2026-06-30T00:00:00Z'
  console.log('baseline:', JSON.stringify(runFixed(scratchBin, [], 'Pacific/Kiritimati', m20now).stdout))
  write(original.split([
    "const day = String(when.getDate()).padStart(2, ' ')",
    '  const month = MONTHS[when.getMonth()]',
    "  const year = when.getFullYear() === now.getFullYear() ? '' : ` ${when.getFullYear()}`"
  ].join('\n')).join([
    "const day = String(when.getUTCDate()).padStart(2, ' ')",
    '  const month = MONTHS[when.getUTCMonth()]',
    "  const year = when.getUTCFullYear() === now.getUTCFullYear() ? '' : ` ${when.getUTCFullYear()}`"
  ].join('\n')))
  console.log('mutant:  ', JSON.stringify(runFixed(scratchBin, [], 'Pacific/Kiritimati', m20now).stdout))
  restore()

  console.log('')
  console.log('=== END WITNESS CAPTURE ===')
}

function main () {
  const original = fs.readFileSync(path.join(REPO_ROOT, BIN_REL), 'utf8')
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-c064-sweep-'))
  console.log(`scratch dir: ${scratch}`)
  copyTree(scratch)

  const baseline = runSuite(scratch)
  console.log(`baseline: pass=${baseline.pass} fail=${baseline.fail}`)
  if (baseline.fail !== 0) {
    console.error('ABORT: baseline (unmutated scratch copy) is not green. Raw output follows.')
    console.error(baseline.raw)
    fs.rmSync(scratch, { recursive: true, force: true })
    process.exit(1)
  }

  const results = []
  const scratchBin = path.join(scratch, BIN_REL)

  for (const m of MUTANTS) {
    if (!original.includes(m.old)) {
      results.push({ ...m, status: 'ERROR', note: 'old string not found in bin/moon.js', failingNames: [] })
      console.log(`${m.id}: ERROR - old string not found`)
      continue
    }
    const mutated = original.split(m.old).join(m.new)
    if (mutated === original) {
      results.push({ ...m, status: 'ERROR', note: 'mutation is a no-op string replace', failingNames: [] })
      console.log(`${m.id}: ERROR - no-op replace`)
      continue
    }
    fs.writeFileSync(scratchBin, mutated, 'utf8')
    const res = runSuite(scratch)
    fs.writeFileSync(scratchBin, original, 'utf8') // restore before next iteration

    const status = res.fail === null ? 'ERROR' : (res.fail > 0 ? 'KILLED' : 'SURVIVED')
    results.push({ ...m, status, pass: res.pass, fail: res.fail, failingNames: res.failingNames })
    console.log(`${m.id} [${m.behavior}]: ${status}` +
      (status === 'KILLED' ? ` (caught by: ${res.failingNames.join(', ') || 'unknown - see raw'})` : ''))
  }

  runWitnesses(scratch, scratchBin, original)

  fs.rmSync(scratch, { recursive: true, force: true })

  const killed = results.filter((r) => r.status === 'KILLED').length
  const survived = results.filter((r) => r.status === 'SURVIVED').length
  const errored = results.filter((r) => r.status === 'ERROR').length
  console.log('')
  console.log(`TOTAL mutants: ${results.length}  KILLED: ${killed}  SURVIVED: ${survived}  ERROR: ${errored}`)
  console.log('')
  console.log('SURVIVORS:')
  for (const r of results) {
    if (r.status === 'SURVIVED') console.log(`  ${r.id} — ${r.behavior} — ${r.desc}`)
  }
  if (errored) {
    console.log('ERRORS (harness problems, not mutation results):')
    for (const r of results) {
      if (r.status === 'ERROR') console.log(`  ${r.id} — ${r.note}`)
    }
  }

  // Sanity: confirm the tracked file (repo root) is untouched.
  const after = fs.readFileSync(path.join(REPO_ROOT, BIN_REL), 'utf8')
  if (after !== original) {
    console.error('FATAL: tracked bin/moon.js was modified by this harness. This should never happen.')
    process.exit(1)
  }
  console.log('')
  console.log('Confirmed: tracked bin/moon.js is byte-identical to before the sweep.')
}

main()
