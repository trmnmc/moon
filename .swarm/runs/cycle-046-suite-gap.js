'use strict'

// cycle-046 — which end-to-end surfaces does the SHIPPING suite actually pin?
//
// The T-141 harness found zero divergences, so the composition is clean TODAY. The next
// question is whether it stays clean: a surface that only my throwaway harness checks is
// unprotected the moment this run ends.
//
// Method: replay the same 10 mutants, but score them against `node --test test/*.test.js`
// instead of against the harness. A mutant the harness KILLS and the suite SURVIVES names
// a genuinely untested end-to-end surface — measured, not guessed. This is the run's
// standing rule ("every added test closes a NAMED untested surface") applied as an
// instrument rather than an argument.

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const REPO = path.resolve(__dirname, '..', '..')

const MUTANTS = [
  { id: 'M1', what: '--south becomes a no-op (hemisphere ignored)', file: 'bin/moon.js', from: 'const hemisphere = opts.hemisphere || detectHemisphere()', to: "const hemisphere = 'north'" },
  { id: 'M2', what: '--compact no longer suppresses the next-full-moon line', file: 'bin/moon.js', from: 'if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))', to: 'lines.push(nextFullLine(now, NAME_COLUMN))' },
  { id: 'M3', what: '--json renames a documented field', file: 'bin/moon.js', from: 'cycleFraction: round(moon.cycleFraction, 5),', to: 'cycle_fraction: round(moon.cycleFraction, 5),' },
  { id: 'M4', what: 'usage errors go to stdout and exit 0', file: 'bin/moon.js', from: "process.stderr.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)\n    return 2", to: "process.stdout.write(`moon: ${err && err.message ? err.message : String(err)}\\n`)\n    return 0" },
  { id: 'M5', what: 'next-full-moon date uses the wrong month', file: 'bin/moon.js', from: 'const month = MONTHS[when.getMonth()]', to: 'const month = MONTHS[(when.getMonth() + 1) % 12]' },
  { id: 'M6', what: '--help no longer wins over --json', file: 'bin/moon.js', from: '  if (opts.help) {\n    process.stdout.write(HELP + \'\\n\')\n    return 0\n  }', to: '  if (opts.help && !opts.json) {\n    process.stdout.write(HELP + \'\\n\')\n    return 0\n  }' },
  { id: 'M7', what: 'JSON rounding removed (raw float dump)', file: 'bin/moon.js', from: 'function round (value, places) {\n  const f = 10 ** places\n  return Math.round(value * f) / f\n}', to: 'function round (value, places) {\n  return value\n}' },
  { id: 'M8', what: 'block top rule one column wider than the body', file: 'src/render.js', from: 'lines.push(BOX.tl + BOX.h.repeat(BLOCK_INNER) + BOX.tr);', to: 'lines.push(BOX.tl + BOX.h.repeat(BLOCK_INNER + 1) + BOX.tr);' },
  { id: 'M9', what: 'readout drops a disc cell', file: 'src/render.js', from: 'const LINE_CELLS = 5;', to: 'const LINE_CELLS = 4;' },
  { id: 'M10', what: 'hemisphere auto-detection always answers north', file: 'src/hemisphere.js', from: 'function detectHemisphere(timeZone) {\n  let zone = timeZone;', to: "function detectHemisphere(timeZone) {\n  return 'north';\n  let zone = timeZone;" }
]

function copyRepo (dest) {
  fs.cpSync(REPO, dest, {
    recursive: true,
    filter: function (src) {
      const rel = path.relative(REPO, src)
      if (rel === '.git' || rel.startsWith('.git' + path.sep)) return false
      if (rel.startsWith('node_modules')) return false
      return true
    }
  })
}

function runSuite (dir) {
  const files = fs.readdirSync(path.join(dir, 'test'))
    .filter(function (f) { return f.endsWith('.test.js') })
    .map(function (f) { return path.join('test', f) })
  const r = spawnSync(process.execPath, ['--test'].concat(files), {
    encoding: 'utf8', cwd: dir, shell: false, timeout: 120000
  })
  const out = (r.stdout || '') + (r.stderr || '')
  const passM = /^# pass (\d+)$/m.exec(out) || /ℹ pass (\d+)/.exec(out)
  const failM = /^# fail (\d+)$/m.exec(out) || /ℹ fail (\d+)/.exec(out)
  const failing = []
  const re = /^not ok \d+ - (.+)$/gm
  let m
  while ((m = re.exec(out)) !== null) failing.push(m[1].trim())
  return {
    status: r.status,
    pass: passM ? Number(passM[1]) : null,
    fail: failM ? Number(failM[1]) : null,
    failing: failing
  }
}

console.log('=== cycle 046 — shipping-suite coverage of the end-to-end surfaces ===')
console.log('A mutant the T-141 harness KILLED but the suite SURVIVES = a named untested surface.')
console.log('')

// Baseline: the unmutated suite must be green, or every reading below is meaningless.
const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-base-'))
copyRepo(baseDir)
const base = runSuite(baseDir)
console.log('BASELINE (unmutated copy): status=' + base.status + ' pass=' + base.pass + ' fail=' + base.fail)
fs.rmSync(baseDir, { recursive: true, force: true })
if (base.status !== 0 || base.fail !== 0) {
  console.log('BASELINE IS NOT GREEN — aborting; nothing below would be interpretable.')
  process.exitCode = 2
} else {
  console.log('')
  const gaps = []
  for (const mu of MUTANTS) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-gap-' + mu.id + '-'))
    copyRepo(dir)
    const p = path.join(dir, mu.file)
    const s = fs.readFileSync(p, 'utf8')
    if (s.indexOf(mu.from) < 0 || s.split(mu.from).length - 1 !== 1) {
      console.log('SKIP ' + mu.id + ' — anchor missing or not unique')
      fs.rmSync(dir, { recursive: true, force: true })
      continue
    }
    fs.writeFileSync(p, s.replace(mu.from, mu.to))
    const r = runSuite(dir)
    const killed = r.status !== 0 && r.fail > 0
    if (!killed) gaps.push(mu)
    console.log((killed ? 'PINNED  ' : 'UNPINNED') + ' ' + mu.id + '  ' + mu.what)
    console.log('         suite: pass=' + r.pass + ' fail=' + r.fail + (killed
      ? '  killed by: ' + r.failing.slice(0, 3).join(' | ') + (r.failing.length > 3 ? ' (+' + (r.failing.length - 3) + ' more)' : '')
      : '  SUITE STAYED GREEN — this surface is not pinned by any shipping test'))
    fs.rmSync(dir, { recursive: true, force: true })
  }

  console.log('')
  console.log('=== RESULT ===')
  if (!gaps.length) {
    console.log('Every surface the T-141 harness checks is ALSO pinned by the shipping suite.')
    console.log('No new test item is warranted: adding one would raise the test count and close nothing,')
    console.log('which is exactly the churn the SPEC taste note forbids.')
  } else {
    console.log('UNPINNED surfaces (' + gaps.length + '), each named:')
    for (const g of gaps) console.log('  ' + g.id + ': ' + g.what + '   [' + g.file + ']')
  }
  process.exitCode = 0
}
