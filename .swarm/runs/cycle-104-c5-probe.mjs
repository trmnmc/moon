#!/usr/bin/env node
// C5 instrument probe. v1 injected a LINE into the middle of README.md; README line numbers are
// cited by cli.test.js / regressions.test.js, so the mutation broke tests that have nothing to do
// with count claims (L-043's unstable-SUBJECT clause, one level up). Question: is an EOF append
// stable — i.e. does the pristine suite stay GREEN with a paragraph appended after the last line?
import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const TARGET = '/opt/targets/moon'
function scratch (label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `moon-c5probe-${label}-`))
  execFileSync('cp', ['-a', `${TARGET}/.`, dir])
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true })
  return dir
}
function runSuite (dir) {
  let out = ''; let status = 0
  try { out = execSync('node --test --test-reporter=tap test/*.test.js', { cwd: dir, encoding: 'utf8', timeout: 300000 }) }
  catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; status = e.status ?? -1 }
  const num = k => { const m = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')); return m ? Number(m[1]) : null }
  return { status, tests: num('tests'), fail: num('fail'), failing: [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1].trim()) }
}

// ARM 1 — neutral EOF append (no count claim). If this is RED, EOF appends are unstable too and
// README cannot be probed by injection at all.
{
  const d = scratch('neutral')
  const p = path.join(d, 'README.md')
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + '\nA neutral trailing paragraph with no numbers in it.\n')
  const r = runSuite(d)
  console.log(`ARM 1 neutral EOF append   exit=${r.status} tests=${r.tests} fail=${r.fail}  ${r.status === 0 ? 'GREEN — appends are stable' : 'RED'}`)
  if (r.status !== 0) console.log('      failing: ' + r.failing.slice(0, 5).join(' | '))
  fs.rmSync(d, { recursive: true, force: true })
}

// ARM 2 — the count-claim EOF append, at baseline. Expected RED only once a checker exists; today
// it should be GREEN, which is what makes it a usable failable cell.
{
  const d = scratch('claim')
  const p = path.join(d, 'README.md')
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + '\nThe suite carries 171 tests today.\n')
  const r = runSuite(d)
  console.log(`ARM 2 count-claim EOF append exit=${r.status} tests=${r.tests} fail=${r.fail}  ${r.status === 0 ? 'GREEN at baseline — cell is usable' : 'RED'}`)
  if (r.status !== 0) console.log('      failing: ' + r.failing.slice(0, 5).join(' | '))
  fs.rmSync(d, { recursive: true, force: true })
}
