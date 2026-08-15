// cycle-47 verification gate for T-142 — authored by the conductor at verification time.
// The builder never saw this script. Two scratch copies, both mutated with M6 by THIS
// script (not by anything the builder left behind):
//   A = working tree + M6            -> the new test must FAIL
//   B = working tree - new test + M6 -> the suite must be GREEN again
// B is the attribution discriminator: it proves the kill in A comes from the test added
// this cycle, not from some pre-existing test that happens to be sensitive to M6.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const SRC = '/opt/targets/moon'
const ROOT = '/opt/swarm/runs/c47-gate'
const M6_FROM = '  if (opts.help) {'
const M6_TO = '  if (opts.help && !opts.json) {'
const TEST_NEEDLE = "test('--help wins over --json regardless of flag order"

fs.rmSync(ROOT, { recursive: true, force: true })

// Copy the WHOLE repo except .git. The first version of this gate staged only
// bin/src/test/package.json/README.md, and contracts.test.js — which resolves paths
// against the repo root and reads CONTRACTS.md and other files — aborted in BOTH copies,
// poisoning the comparison. A scratch copy has to be the repo, not a guess at the repo.
function stage (name) {
  const d = path.join(ROOT, name)
  fs.cpSync(SRC, d, { recursive: true, filter: (s) => path.basename(s) !== '.git' })
  return d
}

function applyM6 (d) {
  const p = path.join(d, 'bin/moon.js')
  const s = fs.readFileSync(p, 'utf8')
  if (!s.includes(M6_FROM)) throw new Error('M6 anchor not found in ' + p)
  if (s.split(M6_FROM).length !== 2) throw new Error('M6 anchor is not unique in ' + p)
  fs.writeFileSync(p, s.replace(M6_FROM, M6_TO))
  const after = fs.readFileSync(p, 'utf8')
  if (!after.includes(M6_TO)) throw new Error('M6 did not land in ' + p)
}

// Remove the test added this cycle: its leading comment block, the test itself, and the
// blank line after it. Bounded strictly by the file's own structure, never by line numbers.
function removeNewTest (d) {
  const p = path.join(d, 'test/cli.test.js')
  const lines = fs.readFileSync(p, 'utf8').split('\n')
  const start = lines.findIndex(l => l.startsWith(TEST_NEEDLE))
  if (start < 0) throw new Error('new test not found in ' + p)
  let end = start
  while (end < lines.length && lines[end] !== '})') end++
  if (end >= lines.length) throw new Error('unterminated test block')
  let head = start
  while (head > 0 && lines[head - 1].startsWith('//')) head--
  const cut = lines.slice(0, head).concat(lines.slice(end + 2))
  const out = cut.join('\n')
  if (out.includes(TEST_NEEDLE)) throw new Error('removal left the test behind')
  fs.writeFileSync(p, out)
  return end + 2 - head
}

function runSuite (d) {
  const files = fs.readdirSync(path.join(d, 'test')).filter(f => f.endsWith('.test.js'))
    .sort().map(f => 'test/' + f)
  let out
  try {
    out = execFileSync(process.execPath, ['--test', ...files],
      { cwd: d, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '')
  }
  const tally = out.split('\n').filter(l => /^. (tests|pass|fail) /.test(l)).join(' | ')
  // node prints each failure twice (inline, then in the trailing "failing tests:" block);
  // dedupe so the count read off this list is the real one.
  const failed = [...new Set(out.split('\n').filter(l => l.startsWith('✖ '))
    .map(l => l.replace(/\s*\([\d.]+ms\)\s*$/, '').trim())
    .filter(l => l !== '✖ failing tests:'))]
  const msgs = out.split('\n').filter(l => l.includes('must match --help byte-for-byte')).map(l => l.trim())
  return { tally, failed, msgs }
}

const results = {}

const A = stage('A')
applyM6(A)
results.A = runSuite(A)

const B = stage('B')
applyM6(B)
const removedLines = removeNewTest(B)
results.B = runSuite(B)

console.log('--- A: working tree + M6 (new test present) ---')
console.log('tally:  ' + results.A.tally)
console.log('failed: ' + (results.A.failed.join('\n        ') || '(none)'))
console.log('assert: ' + (results.A.msgs.join('\n        ') || '(none)'))
console.log()
console.log('--- B: M6 + new test REMOVED (' + removedLines + ' lines cut) ---')
console.log('tally:  ' + results.B.tally)
console.log('failed: ' + (results.B.failed.join('\n        ') || '(none)'))
console.log()
const aKills = /fail 1\b/.test(results.A.tally) && results.A.failed.some(l => l.includes('--help wins over --json'))
const bSurvives = /fail 0\b/.test(results.B.tally)
console.log('GATE: A kills M6 = ' + aKills + ' ; B lets M6 survive (attribution) = ' + bSurvives)
console.log('VERDICT: ' + (aKills && bSurvives ? 'PASS' : 'FAIL'))
