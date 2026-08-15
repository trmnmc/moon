// Cycle-36 gate for T-133. Conductor-authored AT VERIFICATION TIME; the builder
// never saw any of this.
const fs = require('node:fs')
const cp = require('node:child_process')
const assert = require('node:assert/strict')

const ROOT = '/opt/targets/moon'
const src = fs.readFileSync(ROOT + '/bin/moon.js', 'utf8')
const readme = fs.readFileSync(ROOT + '/README.md', 'utf8')
const { HELP } = require(ROOT + '/bin/moon.js')
let pass = 0
let fail = 0
const chk = (name, fn) => {
  try { fn(); pass++; console.log('PASS  ' + name) } catch (e) { fail++; console.log('FAIL  ' + name + ' :: ' + e.message) }
}

// G2b. Everything OUTSIDE the HELP template literal is byte-identical to HEAD.
// Independent of reading the diff: cut the literal out of both revisions and compare
// the remainders.
chk('G2b bin/moon.js outside the HELP literal is byte-identical to HEAD', () => {
  const head = cp.execSync('git -C ' + ROOT + ' show HEAD:bin/moon.js', { encoding: 'utf8' })
  const cut = (s) => {
    const a = s.indexOf('const HELP = `')
    assert.ok(a >= 0, 'HELP literal not found')
    const b = s.indexOf('`', a + 'const HELP = `'.length)
    assert.ok(b > a, 'HELP literal not terminated')
    return s.slice(0, a) + '<HELP>' + s.slice(b + 1)
  }
  assert.equal(cut(src), cut(head), 'a byte outside the HELP literal changed')
})

// G2c. src/ and test/ untouched.
chk('G2c src/ and test/ are byte-identical to HEAD', () => {
  const out = cp.execSync('git -C ' + ROOT + ' diff --name-only HEAD -- src test', { encoding: 'utf8' }).trim()
  assert.equal(out, '', 'changed: ' + out)
})

// G4. The HELP --json fields block still parses to exactly the 9 payload keys, and the
// new CAUTION lines are NOT mistaken for field names. Parser reimplemented here from
// the block's stated convention (field names at exactly two leading spaces), NOT copied
// from test/cli.test.js -- a check that reuses the suite's own parser cannot catch the
// suite's own parser being fooled.
chk('G4 HELP fields block still yields exactly the 9 payload keys', () => {
  const lines = HELP.split('\n')
  const start = lines.findIndex((l) => l.trim() === '--json fields')
  assert.ok(start >= 0)
  const names = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (l.trim() === '') break
    const m = /^ {2}(\S+)/.exec(l)
    if (m) names.push(m[1])
  }
  const payload = Object.keys(JSON.parse(
    cp.execSync('node ' + ROOT + '/bin/moon.js --json', { encoding: 'utf8' })))
  assert.deepEqual(names.slice().sort(), payload.slice().sort(),
    'HELP block names ' + JSON.stringify(names) + ' vs payload ' + JSON.stringify(payload))
  assert.ok(!names.includes('CAUTION:'), 'CAUTION line leaked in as a field name')
  assert.equal(names.length, 9)
})

// G5. --help output is still exactly HELP, exit 0, nothing on stderr.
chk('G5 --help prints exactly HELP, exit 0, clean stderr', () => {
  const r = cp.spawnSync('node', [ROOT + '/bin/moon.js', '--help'], { encoding: 'utf8' })
  assert.equal(r.status, 0)
  assert.equal(r.stderr, '')
  assert.equal(r.stdout, HELP + '\n')
})

// G6. The README fenced json example is still valid JSON with the same 9 keys, and the
// field table still parses (the caution paragraph did not break the table scope).
chk('G6 README json example + field table still parse to the 9 keys', () => {
  const m = /```json\n([\s\S]*?)\n```/.exec(readme)
  assert.ok(m, 'no fenced json example')
  const exampleKeys = Object.keys(JSON.parse(m[1])).sort()
  const start = readme.indexOf('## `--json`')
  const rest = readme.slice(start)
  const end = rest.indexOf('\n## ', 1)
  const section = end > 0 ? rest.slice(0, end) : rest
  const rows = [...section.matchAll(/^\| `([^`]+)` \|/gm)].map((x) => x[1]).sort()
  assert.deepEqual(rows, exampleKeys, 'table ' + JSON.stringify(rows) + ' vs example ' + JSON.stringify(exampleKeys))
  assert.equal(rows.length, 9)
})

// G7. The DOCUMENTED claims are true of the CODE. Both documents must say cycleFraction
// is angular, name age as the elapsed-time field, and state the endpoints hold.
chk('G7 both documents carry the substance of the correction', () => {
  const helpBlock = HELP.slice(HELP.indexOf('cycleFraction'), HELP.indexOf('phaseAngle    elongation'))
  for (const [label, text] of [['HELP', helpBlock], ['README', readme.slice(readme.indexOf('Caution on `cycleFraction`'), readme.indexOf('Caution on `phaseAngle`'))]]) {
    assert.ok(text.length > 0, label + ': caution block not found')
    assert.match(text, /angular/i, label + ': does not say angular')
    assert.match(text, /\bage\b/, label + ': does not point at the age field')
    assert.match(text, /21/, label + ': does not carry the ~21 hour bound')
    assert.match(text, /45/, label + ': does not carry the ~45 minute endpoint bound')
    assert.match(text, /endpoint/i, label + ': does not state the endpoints hold')
  }
})

console.log('\ngate: ' + pass + ' pass, ' + fail + ' fail')
process.exitCode = fail === 0 ? 0 : 1
