'use strict'

// cycle-046 T-141 — end-to-end QA of the ASSEMBLED CLI.
//
// Conductor-authored at verification time. Builders never saw this file.
//
// Rules this harness holds itself to:
//   * The REAL binary is executed as a child process, never imported. Exit status comes
//     from spawnSync().status directly — no shell, no pipe (playbook L-010).
//   * Expectations are HAND-DERIVED from the documented contract (README.md / --help),
//     not from the renderer's own output, and not from a remembered value.
//   * The hemisphere check derives its mirror map from README's own north|south table
//     and asserts the live output satisfies it. An implementation that ignored --south
//     (or that mirrored by plain string-reverse without swapping the limb glyphs) fails.

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

// MOON_REPO lets the failability harness (cycle-046-mutants.js) point this same file at a
// MUTATED COPY of the repo. The repo source itself is never touched.
const REPO = process.env.MOON_REPO || path.resolve(__dirname, '..', '..')
const BIN = path.join(REPO, 'bin', 'moon.js')
const README = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8')

const results = []
function check (id, claim, fn) {
  let ok = false
  let detail = ''
  try {
    const r = fn()
    ok = r.ok
    detail = r.detail
  } catch (err) {
    ok = false
    detail = 'THREW: ' + (err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : String(err))
  }
  results.push({ id, claim, ok, detail })
  console.log((ok ? 'PASS ' : 'FAIL ') + id + '  ' + claim)
  if (detail) console.log('       ' + String(detail).replace(/\n/g, '\n       '))
}

// --- runner: no shell, no pipe, status read directly -------------------------------
function run (args, opts) {
  const o = opts || {}
  const res = spawnSync(process.execPath, [BIN].concat(args), {
    encoding: 'utf8',
    cwd: o.cwd || REPO,
    env: o.env ? Object.assign({}, process.env, o.env) : process.env,
    shell: false
  })
  if (res.error) throw res.error
  return { status: res.status, signal: res.signal, stdout: res.stdout, stderr: res.stderr }
}

function lines (s) {
  if (s === '') return []
  const t = s.endsWith('\n') ? s.slice(0, -1) : s
  return t.split('\n')
}

const PHASES = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous',
  'full', 'waning gibbous', 'last quarter', 'waning crescent']

// --- derive the mirror map from README's north|south table -------------------------
// Rows look like:  ░░░░▕   3%  waxing crescent   ▏░░░░   3%  waxing crescent
// Two readouts on one line: north on the left, south on the right. The south disc must
// be the north disc reversed with each limb glyph swapped for its mirror. We LEARN that
// swap from the table and require it to be consistent across every row.
function deriveMirrorMap () {
  const rowRe = /^([^\s]{5})\s+(\d{1,3})%\s{2}(.+?)\s{3,}([^\s]{5})\s+(\d{1,3})%\s{2}(.+?)\s*$/
  const map = new Map()
  const rows = []
  for (const line of README.split('\n')) {
    const m = rowRe.exec(line)
    if (!m) continue
    const [, nDisc, nPct, nName, sDisc, sPct, sName] = m
    if (nPct !== sPct || nName.trim() !== sName.trim()) continue
    if (!PHASES.includes(nName.trim())) continue
    rows.push({ nDisc, sDisc, pct: nPct, name: nName.trim() })
    const rev = Array.from(nDisc).reverse()
    const sChars = Array.from(sDisc)
    if (rev.length !== sChars.length) throw new Error('disc width mismatch in README row: ' + line)
    for (let i = 0; i < rev.length; i++) {
      const from = rev[i]
      const to = sChars[i]
      if (map.has(from) && map.get(from) !== to) {
        throw new Error('README mirror map is INCONSISTENT for ' + from +
          ': saw ' + map.get(from) + ' and ' + to)
      }
      map.set(from, to)
    }
  }
  return { map, rows }
}

function mirrorDisc (disc, map) {
  return Array.from(disc).reverse().map(function (ch) {
    if (!map.has(ch)) throw new Error('glyph ' + JSON.stringify(ch) + ' (U+' +
      ch.codePointAt(0).toString(16).toUpperCase() + ') has no README-derived mirror')
    return map.get(ch)
  }).join('')
}

// --- parse a single-line readout per the DOCUMENTED layout -------------------------
// bin/moon.js:73-76 documents it and README's examples show it: 5 disc cells, one
// space, a 4-column right-aligned percentage, two spaces, then the phase name starting
// at column 12 (0-indexed).
const NAME_COLUMN = 12
function parseReadout (line) {
  const disc = Array.from(line).slice(0, 5).join('')
  const pctField = Array.from(line).slice(5, 10).join('')
  const gap = Array.from(line).slice(10, 12).join('')
  const name = Array.from(line).slice(12).join('')
  const pm = /^\s*(\d{1,3})%$/.exec(pctField)
  return { disc, pctField, gap, name, pct: pm ? Number(pm[1]) : null }
}

const DOC_FIELDS = ['phase', 'illumination', 'age', 'cycleFraction', 'phaseAngle',
  'hemisphere', 'nextFullMoon', 'julianDay', 'timestamp']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

console.log('=== T-141 end-to-end QA — cycle 046 ===')
console.log('node ' + process.version + '  repo ' + REPO)
console.log('binary ' + BIN)
console.log('')

// ================================ C0: mirror map ===================================
let MIRROR = null
check('C0', 'README north|south table yields a CONSISTENT mirror map (derived, not assumed)', function () {
  const d = deriveMirrorMap()
  MIRROR = d.map
  if (d.rows.length < 10) return { ok: false, detail: 'only ' + d.rows.length + ' table rows parsed' }
  const pairs = Array.from(d.map.entries()).map(function (e) { return e[0] + '->' + e[1] })
  // An involution is the real claim: mirroring twice must be identity.
  const bad = []
  for (const [from, to] of d.map.entries()) {
    if (!d.map.has(to) || d.map.get(to) !== from) bad.push(from + '->' + to + ' but ' + to + '->' + (d.map.get(to) || 'MISSING'))
  }
  return {
    ok: bad.length === 0,
    detail: d.rows.length + ' rows, map: ' + pairs.join(' ') +
      (bad.length ? '\nNOT an involution: ' + bad.join('; ') : '\ninvolution: yes')
  }
})

// ================================ default ==========================================
const def = run([])
check('C1', 'default invocation: exit 0, stderr empty, stdout is exactly 2 newline-terminated lines', function () {
  const L = lines(def.stdout)
  return {
    ok: def.status === 0 && def.stderr === '' && def.stdout.endsWith('\n') && L.length === 2,
    detail: 'status=' + def.status + ' stderr=' + JSON.stringify(def.stderr) +
      ' lines=' + L.length + '\n' + JSON.stringify(def.stdout)
  }
})

check('C2', 'readout line matches the documented column layout (name begins at column ' + NAME_COLUMN + ')', function () {
  const r = parseReadout(lines(def.stdout)[0])
  const okDisc = Array.from(r.disc).length === 5
  const okPct = r.pct !== null && r.pct >= 0 && r.pct <= 100
  const okGap = r.gap === '  '
  const okName = PHASES.includes(r.name)
  return {
    ok: okDisc && okPct && okGap && okName,
    detail: 'disc=' + JSON.stringify(r.disc) + '(' + Array.from(r.disc).length + ' cells)' +
      ' pctField=' + JSON.stringify(r.pctField) + '(' + r.pct + ')' +
      ' gap=' + JSON.stringify(r.gap) + ' name=' + JSON.stringify(r.name) +
      '\ndisc5=' + okDisc + ' pct=' + okPct + ' gap=' + okGap + ' canonicalName=' + okName
  }
})

check('C3', 'next-full-moon line is indented to column ' + NAME_COLUMN + ' and carries a "D Mon" date', function () {
  const l2 = lines(def.stdout)[1]
  const m = /^ {12}next full moon {2}([ \d]\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)( \d{4})?$/.exec(l2)
  return { ok: !!m, detail: JSON.stringify(l2) + (m ? ' -> day=' + JSON.stringify(m[1]) + ' month=' + m[2] + ' year=' + (m[3] || '(suppressed)') : ' DID NOT MATCH') }
})

// ================================ --compact ========================================
const compact = run(['--compact'])
check('C4', '--compact: exit 0, EXACTLY one line, no trailing whitespace (README:89 prompt contract)', function () {
  const L = lines(compact.stdout)
  const one = L.length === 1
  const noTrail = one && !/\s$/.test(L[0])
  return {
    ok: compact.status === 0 && compact.stderr === '' && one && noTrail && compact.stdout.endsWith('\n'),
    detail: 'status=' + compact.status + ' lines=' + L.length + ' trailingWS=' + (one ? /\s$/.test(L[0]) : 'n/a') +
      '\n' + JSON.stringify(compact.stdout)
  }
})

check('C5', '--compact line is the same readout the default prints (composition, not a second renderer)', function () {
  const a = parseReadout(lines(def.stdout)[0])
  const b = parseReadout(lines(compact.stdout)[0])
  return {
    ok: a.disc === b.disc && a.name === b.name && Math.abs(a.pct - b.pct) <= 1,
    detail: 'default: ' + JSON.stringify(lines(def.stdout)[0]) + '\ncompact: ' + JSON.stringify(lines(compact.stdout)[0])
  }
})

// ================================ --json ===========================================
const jsonRun = run(['--json'])
let J = null
check('C6', '--json: exit 0, single line of parseable JSON, field set EXACTLY the 9 documented fields', function () {
  const L = lines(jsonRun.stdout)
  if (jsonRun.status !== 0 || L.length !== 1) {
    return { ok: false, detail: 'status=' + jsonRun.status + ' lines=' + L.length + ' ' + JSON.stringify(jsonRun.stdout) }
  }
  J = JSON.parse(L[0])
  const got = Object.keys(J).sort()
  const want = DOC_FIELDS.slice().sort()
  const missing = want.filter(function (k) { return got.indexOf(k) < 0 })
  const extra = got.filter(function (k) { return want.indexOf(k) < 0 })
  return {
    ok: missing.length === 0 && extra.length === 0,
    detail: 'keys=' + JSON.stringify(got) + '\nmissing=' + JSON.stringify(missing) + ' extra=' + JSON.stringify(extra)
  }
})

check('C7', '--json field types and documented ranges hold', function () {
  if (!J) return { ok: false, detail: 'no JSON parsed' }
  const fails = []
  if (typeof J.phase !== 'string' || PHASES.indexOf(J.phase) < 0) fails.push('phase not canonical: ' + JSON.stringify(J.phase))
  if (!(typeof J.illumination === 'number' && J.illumination >= 0 && J.illumination <= 1)) fails.push('illumination out of 0..1: ' + J.illumination)
  if (!(typeof J.age === 'number' && J.age >= 0 && J.age <= 30)) fails.push('age out of 0..30: ' + J.age)
  if (!(typeof J.cycleFraction === 'number' && J.cycleFraction >= 0 && J.cycleFraction <= 1)) fails.push('cycleFraction out of 0..1: ' + J.cycleFraction)
  if (!(typeof J.phaseAngle === 'number' && J.phaseAngle >= 0 && J.phaseAngle <= 360)) fails.push('phaseAngle out of 0..360: ' + J.phaseAngle)
  if (['north', 'south'].indexOf(J.hemisphere) < 0) fails.push('hemisphere not north|south: ' + JSON.stringify(J.hemisphere))
  if (!(typeof J.julianDay === 'number' && J.julianDay > 2400000 && J.julianDay < 2600000)) fails.push('julianDay implausible: ' + J.julianDay)
  const nf = new Date(J.nextFullMoon)
  const ts = new Date(J.timestamp)
  if (isNaN(nf.getTime())) fails.push('nextFullMoon unparseable: ' + J.nextFullMoon)
  if (isNaN(ts.getTime())) fails.push('timestamp unparseable: ' + J.timestamp)
  if (!isNaN(nf) && !isNaN(ts)) {
    const dd = (nf - ts) / 86400000
    if (!(dd > 0 && dd < 30)) fails.push('nextFullMoon not within the next 30d: ' + dd.toFixed(3) + ' d')
  }
  return { ok: fails.length === 0, detail: JSON.stringify(J) + (fails.length ? '\n' + fails.join('\n') : '\nall type/range checks hold') }
})

check('C8', 'ROUNDING is as documented ("rounded to the precision the algorithm earned", README:143)', function () {
  if (!J) return { ok: false, detail: 'no JSON parsed' }
  const places = { illumination: 4, age: 3, cycleFraction: 5, phaseAngle: 3, julianDay: 5 }
  const fails = []
  for (const k of Object.keys(places)) {
    const s = String(J[k])
    const dot = s.indexOf('.')
    const dp = dot < 0 ? 0 : s.length - dot - 1
    if (dp > places[k]) fails.push(k + '=' + s + ' has ' + dp + ' dp, documented max ' + places[k])
  }
  return { ok: fails.length === 0, detail: fails.length ? fails.join('\n') : 'no field exceeds its documented precision' }
})

check('C9', 'CROSS-MODE: --json agrees with the rendered line (same phase name, illumination within 1pp)', function () {
  if (!J) return { ok: false, detail: 'no JSON parsed' }
  const r = parseReadout(lines(def.stdout)[0])
  const jpct = J.illumination * 100
  const near = Math.abs(jpct - r.pct) <= 1
  return {
    ok: J.phase === r.name && near,
    detail: 'line: name=' + JSON.stringify(r.name) + ' pct=' + r.pct +
      '\njson: phase=' + JSON.stringify(J.phase) + ' illumination=' + J.illumination + ' (=' + jpct.toFixed(2) + '%)' +
      '\nNOTE: 1pp tolerance is deliberate — two invocations are separate instants, and the' +
      '\n      line/JSON rounding relation is a unit-level claim, not an end-to-end one.'
  }
})

check('C10', 'CROSS-MODE: the printed next-full-moon date is the LOCAL date of json.nextFullMoon', function () {
  if (!J) return { ok: false, detail: 'no JSON parsed' }
  const l2 = lines(def.stdout)[1]
  const when = new Date(J.nextFullMoon)
  const expDay = String(when.getDate()).padStart(2, ' ')
  const expMonth = MONTHS[when.getMonth()]
  const now = new Date(J.timestamp)
  const expYear = when.getFullYear() === now.getFullYear() ? '' : ' ' + when.getFullYear()
  const expected = ' '.repeat(NAME_COLUMN) + 'next full moon  ' + expDay + ' ' + expMonth + expYear
  return {
    ok: l2 === expected,
    detail: 'expected ' + JSON.stringify(expected) + '\nactual   ' + JSON.stringify(l2) +
      '\n(derived independently from json.nextFullMoon=' + J.nextFullMoon + ', TZ=' + (process.env.TZ || '(system)') + ')'
  }
})

// ================================ hemisphere =======================================
const north = run(['--north'])
const south = run(['--south'])
check('C11', '--north / --south: both exit 0 and the discs satisfy the README-DERIVED mirror map', function () {
  if (!MIRROR) return { ok: false, detail: 'no mirror map' }
  const n = parseReadout(lines(north.stdout)[0])
  const s = parseReadout(lines(south.stdout)[0])
  const expected = mirrorDisc(n.disc, MIRROR)
  const symmetric = expected === n.disc
  return {
    ok: north.status === 0 && south.status === 0 && s.disc === expected && n.name === s.name,
    detail: 'north disc ' + JSON.stringify(n.disc) + '  south disc ' + JSON.stringify(s.disc) +
      '\nmirror(north) = ' + JSON.stringify(expected) + '  match=' + (s.disc === expected) +
      '\nphase both sides: ' + JSON.stringify(n.name) + ' / ' + JSON.stringify(s.name) +
      '\nDISCRIMINATING? ' + (symmetric
        ? 'NO — this phase is self-symmetric, so an implementation that IGNORED --south would also pass. See C12.'
        : 'YES — north disc != south disc, so a no-op --south fails this check.')
  }
})

check('C12', 'DISCRIMINATOR: --south is not a no-op — forcing a mid-cycle instant via a synthetic run is unavailable, so use the LIVE pair', function () {
  const n = parseReadout(lines(north.stdout)[0])
  const s = parseReadout(lines(south.stdout)[0])
  const differ = n.disc !== s.disc
  return {
    ok: true, // reporting check: records WHICH evidence the live instant could supply
    detail: 'north=' + JSON.stringify(n.disc) + ' south=' + JSON.stringify(s.disc) + ' differ=' + differ +
      (differ
        ? '\nThe live instant DOES discriminate: the two discs differ, and the difference is exactly the README-derived mirror (C11).'
        : '\nThe live instant does NOT discriminate (self-symmetric disc). C11 passes vacuously for the disc; the JSON hemisphere field (C13) still discriminates.')
  }
})

check('C13', '--json --south / --json --north report the FORCED hemisphere', function () {
  const js = JSON.parse(lines(run(['--json', '--south']).stdout)[0])
  const jn = JSON.parse(lines(run(['--json', '--north']).stdout)[0])
  return {
    ok: js.hemisphere === 'south' && jn.hemisphere === 'north',
    detail: '--json --south -> ' + js.hemisphere + '\n--json --north -> ' + jn.hemisphere
  }
})

check('C14', 'CONFLICTING FLAGS are last-one-wins, no error (src/args.js:88-93, README:80)', function () {
  const sn = run(['--south', '--north'])
  const ns = run(['--north', '--south'])
  const snJ = JSON.parse(lines(run(['--json', '--south', '--north']).stdout)[0])
  const nsJ = JSON.parse(lines(run(['--json', '--north', '--south']).stdout)[0])
  const dup = run(['--south', '--south', '--north'])
  const dupJ = JSON.parse(lines(run(['--json', '--south', '--south', '--north']).stdout)[0])
  return {
    ok: sn.status === 0 && ns.status === 0 && dup.status === 0 &&
        snJ.hemisphere === 'north' && nsJ.hemisphere === 'south' && dupJ.hemisphere === 'north' &&
        sn.stderr === '' && ns.stderr === '',
    detail: '--south --north          -> exit ' + sn.status + ', hemisphere ' + snJ.hemisphere + ' (expected north)' +
      '\n--north --south          -> exit ' + ns.status + ', hemisphere ' + nsJ.hemisphere + ' (expected south)' +
      '\n--south --south --north  -> exit ' + dup.status + ', hemisphere ' + dupJ.hemisphere + ' (expected north; repeats harmless)'
  }
})

check('C15', 'hemisphere is INFERRED from the system timezone when neither flag is given (README:66)', function () {
  const syd = JSON.parse(lines(run(['--json'], { env: { TZ: 'Australia/Sydney' } }).stdout)[0])
  const edi = JSON.parse(lines(run(['--json'], { env: { TZ: 'Europe/London' } }).stdout)[0])
  const nyc = JSON.parse(lines(run(['--json'], { env: { TZ: 'America/New_York' } }).stdout)[0])
  const scl = JSON.parse(lines(run(['--json'], { env: { TZ: 'America/Santiago' } }).stdout)[0])
  return {
    ok: syd.hemisphere === 'south' && edi.hemisphere === 'north' &&
        nyc.hemisphere === 'north' && scl.hemisphere === 'south',
    detail: 'TZ=Australia/Sydney   -> ' + syd.hemisphere + ' (expected south)' +
      '\nTZ=Europe/London      -> ' + edi.hemisphere + ' (expected north)' +
      '\nTZ=America/New_York   -> ' + nyc.hemisphere + ' (expected north)' +
      '\nTZ=America/Santiago   -> ' + scl.hemisphere + ' (expected south)' +
      '\nThis exercises hemisphere.js THROUGH the binary, which no unit test does.'
  }
})

// ================================ --block ==========================================
const block = run(['--block'])
check('C16', '--block: exit 0, framed box with equal-width rows, plus the next-full-moon line at indent 3', function () {
  const L = lines(block.stdout)
  if (block.status !== 0 || L.length < 3) return { ok: false, detail: 'status=' + block.status + ' lines=' + L.length + '\n' + block.stdout }
  const frame = L.slice(0, L.length - 1)
  const last = L[L.length - 1]
  const widths = Array.from(new Set(frame.map(function (x) { return Array.from(x).length })))
  const topOk = /^┌─+┐$/.test(frame[0])
  const botOk = /^└─+┘$/.test(frame[frame.length - 1])
  const lastOk = /^ {3}next full moon {2}([ \d]\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)( \d{4})?$/.test(last)
  return {
    ok: topOk && botOk && widths.length === 1 && lastOk,
    detail: 'frame rows=' + frame.length + ' distinct widths=' + JSON.stringify(widths) +
      ' top=' + topOk + ' bottom=' + botOk + ' nextFullLineIndent3=' + lastOk +
      '\n' + block.stdout
  }
})

check('C17', '--block label rows agree with --json (phase / illuminated / hemisphere)', function () {
  if (!J) return { ok: false, detail: 'no JSON parsed' }
  const body = block.stdout
  const ph = /│\s+phase\s+(.+?)\s+│/.exec(body)
  const il = /│\s+illuminated\s+(\d{1,3})%\s+│/.exec(body)
  const he = /│\s+hemisphere\s+(northern|southern)\s+│/.exec(body)
  if (!ph || !il || !he) return { ok: false, detail: 'row extraction failed: phase=' + !!ph + ' illuminated=' + !!il + ' hemisphere=' + !!he + '\n' + body }
  const expHemi = J.hemisphere === 'north' ? 'northern' : 'southern'
  return {
    ok: ph[1] === J.phase && Math.abs(Number(il[1]) - J.illumination * 100) <= 1 && he[1] === expHemi,
    detail: 'block phase=' + JSON.stringify(ph[1]) + ' vs json ' + JSON.stringify(J.phase) +
      '\nblock illuminated=' + il[1] + '% vs json ' + (J.illumination * 100).toFixed(2) + '%' +
      '\nblock hemisphere=' + he[1] + ' vs json ' + J.hemisphere + ' (expected ' + expHemi + ')'
  }
})

check('C18', '--block --compact suppresses the next-full-moon line (flag composition)', function () {
  const bc = run(['--block', '--compact'])
  const L = lines(bc.stdout)
  const last = L[L.length - 1]
  return {
    ok: bc.status === 0 && /^└─+┘$/.test(last) && !/next full moon/.test(bc.stdout),
    detail: 'status=' + bc.status + ' lastLine=' + JSON.stringify(last) +
      ' mentionsNextFull=' + /next full moon/.test(bc.stdout) +
      '\nlines: ' + L.length + ' (--block alone had ' + lines(block.stdout).length + ')'
  }
})

// ================================ --help ===========================================
const help = run(['--help'])
const helpShort = run(['-h'])
check('C19', '--help: exit 0, stderr empty, documents every flag; -h is BYTE-IDENTICAL', function () {
  const flags = ['--json', '--block', '--compact', '--south', '--north', '--help']
  const missing = flags.filter(function (f) { return help.stdout.indexOf(f) < 0 })
  return {
    ok: help.status === 0 && help.stderr === '' && missing.length === 0 &&
        helpShort.status === 0 && helpShort.stdout === help.stdout,
    detail: 'status=' + help.status + ' stderr=' + JSON.stringify(help.stderr) +
      ' undocumentedFlags=' + JSON.stringify(missing) +
      '\n-h status=' + helpShort.status + ' identical=' + (helpShort.stdout === help.stdout) +
      ' (bytes ' + Buffer.byteLength(help.stdout) + ' vs ' + Buffer.byteLength(helpShort.stdout) + ')'
  }
})

check('C20', '--help WINS over rendering flags (no readout leaks into usage output)', function () {
  const hj = run(['--json', '--help'])
  return {
    ok: hj.status === 0 && hj.stdout === help.stdout,
    detail: '--json --help status=' + hj.status + ' identicalToHelp=' + (hj.stdout === help.stdout) +
      '\nfirst line: ' + JSON.stringify(lines(hj.stdout)[0])
  }
})

// ================================ error paths ======================================
function errCase (id, args, wantStderr) {
  check(id, 'error path ' + JSON.stringify(args) + ': exit 2, stdout EMPTY, one clean stderr line', function () {
    const r = run(args)
    const oneLine = lines(r.stderr).length === 1
    const noStack = !/\n\s+at /.test(r.stderr)
    const matches = wantStderr.test(r.stderr)
    return {
      ok: r.status === 2 && r.stdout === '' && oneLine && noStack && matches,
      detail: 'status=' + r.status + ' stdout=' + JSON.stringify(r.stdout) +
        '\nstderr=' + JSON.stringify(r.stderr) +
        '\noneLine=' + oneLine + ' noStackTrace=' + noStack + ' matchesContract=' + matches
    }
  })
}
errCase('C21', ['--nope'], /^moon: unknown option '--nope' - run 'moon --help' to see the available options\n$/)
errCase('C22', ['fullmoon'], /^moon: unexpected argument 'fullmoon' - moon takes no positional arguments; run 'moon --help' to see the available options\n$/)
errCase('C23', ['--json=yes'], /^moon: option '--json' is a flag and takes no value - run 'moon --help' to see the available options\n$/)
errCase('C24', ['-x'], /^moon: unknown option '-x' - run 'moon --help' to see the available options\n$/)

// ================================ robustness =======================================
check('C25', 'runs from an ARBITRARY cwd (README:95 calls the binary by absolute path from a shell prompt)', function () {
  const r = run(['--compact'], { cwd: '/tmp' })
  const L = lines(r.stdout)
  return {
    ok: r.status === 0 && r.stderr === '' && L.length === 1,
    detail: 'cwd=/tmp status=' + r.status + ' stderr=' + JSON.stringify(r.stderr) + '\n' + JSON.stringify(r.stdout)
  }
})

check('C26', 'stdout/stderr separation holds: success writes nothing to stderr, failure writes nothing to stdout (README:160)', function () {
  const good = [def, compact, jsonRun, block, help, north, south]
  const badOut = good.filter(function (r) { return r.stderr !== '' })
  const e = run(['--nope'])
  return {
    ok: badOut.length === 0 && e.stdout === '',
    detail: 'success runs with non-empty stderr: ' + badOut.length +
      '\nerror run stdout: ' + JSON.stringify(e.stdout) + ' (README:160 "Safe to pipe")'
  }
})

check('C27', 'no crash signal on any invocation exercised (no segfault / uncaught throw path)', function () {
  const all = [def, compact, jsonRun, block, help, helpShort, north, south]
  const sig = all.filter(function (r) { return r.signal !== null })
  const weird = all.filter(function (r) { return r.status !== 0 })
  return {
    ok: sig.length === 0 && weird.length === 0,
    detail: 'signals=' + sig.length + ' non-zero-exits-among-valid-invocations=' + weird.length
  }
})

// ================================ summary ==========================================
console.log('')
const failed = results.filter(function (r) { return !r.ok })
console.log('=== SUMMARY: ' + (results.length - failed.length) + '/' + results.length + ' checks passed ===')
if (failed.length) {
  console.log('FAILED: ' + failed.map(function (r) { return r.id }).join(', '))
}
console.log('NOT RUN (declared, not claimed): offline/no-network behaviour is not exercised here;')
console.log('  it rests on the zero-dependency tree, which this harness does not prove.')
process.exitCode = failed.length ? 1 : 0
