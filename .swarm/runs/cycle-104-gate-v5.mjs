#!/usr/bin/env node
// cycle-104 verification gate, v5 — AUTHORITATIVE (v4 superseded; C7 anchor vocabulary widened
// after adjudication, with a positive control added so the widening cannot go vacuous).
// v1 and v2 are preserved unmodified alongside as the record of what each instrument said.
//   v2 repaired C5: v1 inserted a line mid-README and shifted every cited line number, so ARM A
//     went red for a reason unrelated to count claims and the kill could not be attributed.
//   v3 repairs D2 (prose regex -> fenced-block structural marker) and C7 (line scan -> paragraph
//     scan). Both were flaws visible in the instrument itself, repaired BEFORE dispatch against a
//     tree containing none of the work — not fitted to any answer. — authored by the conductor BEFORE dispatch and sealed by
// hash. Builders never see it. It observes DOCUMENTS and SUITE EXIT STATUS only; it asserts
// nothing about how the work is implemented.
//
// T-207 cells: C1 converse control · C2/C3/C5 failable+attributable · C4 true-input control
//              C6 fails-closed · C7 independent re-derivation · C8 protected file · C9 zero-dep
// T-208 cells: D1 exists+bounded · D2 every proposed line is real AND not already granted
//              D3 failable · D4 fails-closed · D5 states a count · D6 not restated in REPORT
//
// Every "must go RED" arm is paired with an ARM B (the check removed) that must go GREEN, so a
// kill is attributable to the work rather than to the suite at large (L-029), and with at least
// one control that must stay GREEN so this is an assertion and not a snapshot (L-044).

import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const TARGET = '/opt/targets/moon'
const SETTINGS = '/opt/swarm/.claude/settings.json'
const SWARM_BIN = '/opt/swarm/bin'
const OWNER_ACTION = path.join(TARGET, '.swarm/KI-2-OWNER-ACTION.md')
const TEST_FLOOR = 200 // measured on the pristine tree at cycle 104 open: tests 200 / pass 200

const results = []
function cell (id, what, ok, detail) {
  results.push({ id, what, ok: !!ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${what}`)
  for (const line of String(detail).split('\n')) if (line.trim()) console.log(`        ${line}`)
}

// ---------------------------------------------------------------- scratch copies
const scratches = []
function scratch (label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `moon-gate104-${label}-`))
  execFileSync('cp', ['-a', `${TARGET}/.`, dir])
  try { fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true }) } catch {}
  scratches.push(dir)
  return dir
}
function cleanup () { for (const d of scratches) { try { fs.rmSync(d, { recursive: true, force: true }) } catch {} } }

function runSuite (dir) {
  let out = ''
  let status = 0
  try {
    out = execSync('node --test --test-reporter=tap test/*.test.js', {
      cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000
    })
  } catch (e) {
    out = `${e.stdout || ''}${e.stderr || ''}`
    status = e.status == null ? -1 : e.status
  }
  const num = (k) => { const m = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')); return m ? Number(m[1]) : null }
  const failing = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1].trim())
  return { status, tests: num('tests'), pass: num('pass'), fail: num('fail'), failing, out }
}

// ARM B: what would have to be removed for the mutation to survive? Prefer test files this
// cycle ADDED (diff against HEAD); fall back to the files owning the failing test names.
const headTestFiles = new Set(
  execSync('git ls-files test/', { cwd: TARGET, encoding: 'utf8' }).split('\n').filter(Boolean).map(p => path.basename(p))
)
const liveTestFiles = fs.readdirSync(path.join(TARGET, 'test')).filter(f => f.endsWith('.test.js'))
const addedTestFiles = liveTestFiles.filter(f => !headTestFiles.has(f))

function armB (dir, failingNames) {
  let victims = addedTestFiles.slice()
  if (!victims.length) {
    victims = liveTestFiles.filter(f => {
      const body = fs.readFileSync(path.join(dir, 'test', f), 'utf8')
      return failingNames.some(n => body.includes(n.slice(0, 60)))
    })
  }
  for (const v of victims) fs.rmSync(path.join(dir, 'test', v), { force: true })
  return { victims, ...runSuite(dir) }
}

function failableCell (id, what, mutate) {
  const dir = scratch(id.toLowerCase())
  const note = mutate(dir)
  if (note === false) { cell(id, what, false, 'mutation could not be applied — target text absent'); return }
  const a = runSuite(dir)
  const armAred = a.status !== 0 && a.fail > 0
  if (!armAred) {
    cell(id, what, false, `${note}\nARM A exit=${a.status} tests=${a.tests} fail=${a.fail}  -> NOT RED; no check guards this`)
    return
  }
  const b = armB(dir, a.failing)
  const ok = armAred && b.status === 0 && b.fail === 0
  cell(id, what, ok,
    `${note}\nARM A exit=${a.status} fail=${a.fail}  failing: ${a.failing.slice(0, 3).join(' | ') || '(none named)'}` +
    `\nARM B removed [${b.victims.join(', ') || 'nothing'}] -> exit=${b.status} tests=${b.tests} fail=${b.fail}` +
    `  attributable=${b.status === 0 && b.fail === 0}`)
}

// ================================================================= T-207
// C1 — converse control. The tree as shipped must be GREEN and no smaller than the baseline.
{
  const dir = scratch('c1')
  const r = runSuite(dir)
  cell('C1', 'converse control: shipped tree GREEN, suite not shrunk',
    r.status === 0 && r.fail === 0 && r.tests >= TEST_FLOOR,
    `exit=${r.status} tests=${r.tests} pass=${r.pass} fail=${r.fail}  (floor ${TEST_FLOOR})`)
}

// C2 — the resolved-issue-count claim is guarded, and the kill is attributable.
failableCell('C2', 'issue-count claim in REPORT.md is machine-checked against state.json', (dir) => {
  const p = path.join(dir, 'REPORT.md')
  const src = fs.readFileSync(p, 'utf8')
  const m = src.match(/\b(three|two|four|five|six|seven|3|4|2)\b(?=[^.\n]{0,40}known issues closed)/i)
  if (!m) return false
  fs.writeFileSync(p, src.slice(0, m.index) + 'seven' + src.slice(m.index + m[0].length))
  return `REPORT.md  "${m[0]} known issues closed" -> "seven known issues closed"  (state.json resolved_issues = 3)`
})

// C3 — an UNDATED bare test-count claim reintroduced into REPORT.md must be caught.
failableCell('C3', 'undated test-count claim reintroduced in REPORT.md is caught', (dir) => {
  const p = path.join(dir, 'REPORT.md')
  const src = fs.readFileSync(p, 'utf8')
  const anchor = src.indexOf('## Known issues')
  if (anchor < 0) return false
  const inject = 'The suite carries 171 tests.\n\n'
  fs.writeFileSync(p, src.slice(0, anchor) + inject + src.slice(anchor))
  return `REPORT.md  injected undated claim "The suite carries 171 tests." above "## Known issues"`
})

// C4 — true-input control. A count that NAMES its measurement point is legitimate and must not
// be flagged; this is what stops C3's guard from being a blanket ban on digits.
{
  const dir = scratch('c4')
  const src = fs.readFileSync(path.join(dir, 'REPORT.md'), 'utf8')
  const datedRow = /cycle 47[^\n]*147 tests|147 tests[^\n]*cycle 47/.test(src) ||
                   /\(cycle 4[67][^)]*\)[^\n]*\d+ tests/.test(src)
  const r = runSuite(dir)
  cell('C4', 'true-input control: a count bound to its measurement point stays GREEN',
    datedRow && r.status === 0 && r.fail === 0,
    `dated historical count present in REPORT.md: ${datedRow}\nunmutated tree exit=${r.status} fail=${r.fail}`)
}

// C5 — README.md is in scope too. It carries no count claim today, so this is an INJECTION
// (the technique cycle 103 used when mutation had nothing to bite on), paired with ARM B.
failableCell('C5', 'README.md is inside the scanner scope (injection, not mutation)', (dir) => {
  const p = path.join(dir, 'README.md')
  const src = fs.readFileSync(p, 'utf8')
  // v2: appended at EOF, NOT inserted mid-file. v1 inserted a line above '## Known
  // issues' and shifted every README line number below it; cli.test.js and regressions.test.js
  // cite README by line, so ARM A went red for a reason unrelated to count claims and ARM B could
  // not attribute the kill. Probed before adopting (cycle-104-c5-probe.mjs): a neutral EOF append
  // leaves the pristine suite GREEN 200/200, so an EOF append isolates the claim as the variable.
  fs.writeFileSync(p, src + '\nThe suite carries 171 tests today.\n')
  return `README.md  appended undated claim at EOF: "The suite carries 171 tests today." (line numbers unshifted)`
})

// C6 — fails CLOSED over a dead region: a document that vanished must RED the suite, never be
// silently skipped. Two arms, one per document.
{
  for (const [id, doc] of [['C6a', 'REPORT.md'], ['C6b', 'README.md']]) {
    const dir = scratch(id.toLowerCase())
    fs.rmSync(path.join(dir, doc), { force: true })
    const r = runSuite(dir)
    cell(id, `fails CLOSED when ${doc} is absent`, r.status !== 0 && r.fail > 0,
      `${doc} deleted -> exit=${r.status} fail=${r.fail}  failing: ${r.failing.slice(0, 2).join(' | ') || '(none)'}`)
  }
}

// C7 — independent re-derivation. The conductor computes the authoritative numbers itself and
// requires the shipped document to agree; this does not go through the repo's own checker.
{
  const st = JSON.parse(fs.readFileSync(path.join(TARGET, '.swarm/state.json'), 'utf8'))
  const known = (st.known_issues || []).length
  const resolved = (st.resolved_issues || []).length
  const rep = fs.readFileSync(path.join(TARGET, 'REPORT.md'), 'utf8')
  const heading = rep.match(/^## Known issues \((\d+)\)/m)
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 }
  const closedM = rep.match(/\b(one|two|three|four|five|six|seven|\d+)\b(?=[^.\n]{0,40}known issues closed)/i)
  const closedN = closedM ? (words[closedM[1].toLowerCase()] ?? Number(closedM[1])) : null
  const undated = []
  // v5: paragraph-scoped (v3) with the anchor vocabulary widened to the one the DOCUMENT
  // actually uses. v4 recognised only `cycle N` and so flagged "171 tests as of run 3's final
  // commit" — a claim measured true at v0.1-improve3 (171/171, cycle-104-c7-probe.mjs). A
  // measurement point is a cycle, a run, a named commit or a date; all four are legitimate.
  const ANCHOR = /cycle[s]? \d|run \d|commit|\d{4}-\d{2}-\d{2}/i
  const scan = (text) => {
    const hits = []
    let ln = 1
    for (const para of text.split(/\n\s*\n/)) {
      const start = ln
      ln += para.split('\n').length + 1
      if (!/\b\d+ tests\b/.test(para)) continue
      if (ANCHOR.test(para)) continue
      hits.push(`para at line ${start}: ${para.replace(/\s+/g, ' ').trim().slice(0, 100)}`)
    }
    return hits
  }
  undated.push(...scan(rep))
  // POSITIVE CONTROL — a widened check that can no longer flag anything is vacuous, and a
  // vacuous check reads identical to a clean document. An unanchored claim must still be seen.
  const controlHits = scan(`${rep}\n\nThe suite carries 199 tests.\n`)
  const controlWorks = controlHits.length === scan(rep).length + 1
  if (!controlWorks) undated.push('POSITIVE CONTROL FAILED — the widened scan flags nothing; it is vacuous')
  const ok = heading && Number(heading[1]) === known && closedN === resolved && undated.length === 0
  cell('C7', 'conductor re-derives the counts independently and the document agrees', ok,
    `state.json known_issues=${known} resolved_issues=${resolved}\n` +
    `REPORT "## Known issues (N)" = ${heading ? heading[1] : 'absent'}\n` +
    `REPORT closed-count word = ${closedM ? `"${closedM[1]}" (${closedN})` : 'absent'}\n` +
    `undated bare test-count claims remaining: ${undated.length}${undated.length ? '\n  ' + undated.join('\n  ') : ''}`)
}

// C8 — test/report-issues.test.js is protected (T-209 depends on it passing unmodified).
{
  const changed = execSync('git diff --name-only HEAD -- test/report-issues.test.js', { cwd: TARGET, encoding: 'utf8' }).trim()
  cell('C8', 'test/report-issues.test.js not modified by this wave', changed === '',
    `git diff --name-only HEAD -- test/report-issues.test.js -> "${changed || '(empty)'}"`)
}

// C9 — the zero-dependency non-goal survives.
{
  const pkg = JSON.parse(fs.readFileSync(path.join(TARGET, 'package.json'), 'utf8'))
  const nm = fs.existsSync(path.join(TARGET, 'node_modules'))
  cell('C9', 'zero runtime and dev dependencies', !pkg.dependencies && !pkg.devDependencies && !nm,
    `dependencies=${JSON.stringify(pkg.dependencies)} devDependencies=${JSON.stringify(pkg.devDependencies)} node_modules=${nm}`)
}

// ================================================================= T-208
const allow = new Set(((JSON.parse(fs.readFileSync(SETTINGS, 'utf8')).permissions || {}).allow) || [])
const binScripts = new Set(fs.existsSync(SWARM_BIN) ? fs.readdirSync(SWARM_BIN) : [])

function auditOwnerAction (text) {
  // v3: fenced code blocks only — the structural marker the document owns. v2 regex-matched the
  // whole file, so a correctly-worded "do NOT add <already-granted line>" warning would have been
  // charged as a stale ask. Prose is not the patch; the fence is.
  const F = String.fromCharCode(96).repeat(3)
  const fenceRe = new RegExp(F + "[a-z]*\\n([\\s\\S]*?)" + F, "g")
  const fenced = [...text.matchAll(fenceRe)].map(m => m[1]).join("\n")
  const lines = [...fenced.matchAll(/Bash\(([^)]*)\)/g)].map(m => `Bash(${m[1]})`)
  const uniq = [...new Set(lines)]
  const problems = []
  for (const l of uniq) {
    const script = (l.match(/([A-Za-z0-9._-]+\.(?:sh|mjs|js))/) || [])[1]
    if (!script || !binScripts.has(script)) problems.push(`${l} -> names no script present in ${SWARM_BIN}`)
    else if (allow.has(l)) problems.push(`${l} -> ALREADY GRANTED in settings.json (stale ask)`)
  }
  return { count: uniq.length, uniq, problems, closed: uniq.length > 0 }
}

{
  const exists = fs.existsSync(OWNER_ACTION)
  const text = exists ? fs.readFileSync(OWNER_ACTION, 'utf8') : ''
  const bytes = Buffer.byteLength(text)
  cell('D1', 'owner-action file exists and is bounded (<= 6000 bytes, no re-litigation)',
    exists && bytes > 0 && bytes <= 6000, `${OWNER_ACTION}  exists=${exists} bytes=${bytes}`)

  const audit = auditOwnerAction(text)
  cell('D2', 'every proposed allow line names a real script AND is not already granted',
    audit.closed && audit.problems.length === 0,
    `proposed lines (${audit.count}):\n  ${audit.uniq.join('\n  ') || '(none)'}` +
    (audit.problems.length ? `\nproblems:\n  ${audit.problems.join('\n  ')}` : '\nproblems: none'))

  // D3 — failable: a stale ask (a line the allowlist already carries) must be REJECTED by D2's
  // logic. This is the discriminator that catches exactly the rot found at cycle 103.
  // v4: the probe must inject INSIDE a fence, because that is where the extractor now reads.
  const FENCE = String.fromCharCode(96).repeat(3)
  const staleProbe = auditOwnerAction(
    `${text}\n${FENCE}json\n"Bash(/opt/swarm/bin/swarm-budget.sh:*)"\n${FENCE}\n`)
  cell('D3', 'failable: injecting an already-granted line turns D2 RED',
    staleProbe.problems.some(p => /ALREADY GRANTED/.test(p)),
    `injected "Bash(/opt/swarm/bin/swarm-budget.sh:*)" -> problems: ${staleProbe.problems.join(' | ') || '(none)'}`)

  // D4 — fails closed: no extractable ask is a FAILURE, never a silent pass.
  const emptyProbe = auditOwnerAction('this file names no allow-list lines at all')
  cell('D4', 'fails CLOSED: a file naming zero allow lines does not pass',
    emptyProbe.closed === false, `extracted=${emptyProbe.count} closed=${emptyProbe.closed}`)

  // D5 — it states a denial count.
  const n = text.match(/\b(\d{1,3})\b(?=[^.\n]{0,60}(?:run|denial|consecutive))|(?:denial|denied)[^.\n]{0,60}?\b(\d{1,3})\b/i)
  cell('D5', 'the file states a denial count', !!n, `matched: ${n ? n[0].trim().slice(0, 80) : '(none)'}`)

  // D6 — the diagnosis is referenced, not restated: REPORT.md must not carry the verbatim lines.
  const rep = fs.readFileSync(path.join(TARGET, 'REPORT.md'), 'utf8')
  const restated = /Bash\(\/opt\/swarm\/bin\/swarm-(playbook|warmup)\.sh/.test(rep)
  cell('D6', 'REPORT.md does not restate the verbatim allow-list lines', !restated,
    `REPORT.md carries verbatim allow lines: ${restated}`)
}

cleanup()
const failed = results.filter(r => !r.ok)
console.log(`\nGATE v5  PASS ${results.length - failed.length} / FAIL ${failed.length}`)
if (failed.length) console.log(`failed cells: ${failed.map(r => r.id).join(', ')}`)
process.exit(failed.length ? 1 : 0)
