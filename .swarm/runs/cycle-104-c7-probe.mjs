// C7 adjudication. The gate flagged one "undated" claim in REPORT.md:
//     node --test test/*.test.js    # 171 tests as of run 3's final commit; run it for today's count
// Two mutually exclusive explanations, and reasoning cannot separate them:
//   (a) WORK defect  — the claim is stale or unanchored, and the item failed to fix it.
//   (b) INSTRUMENT defect — the claim IS anchored ("as of run 3's final commit") and IS true, and
//       my C7 exemption vocabulary only recognises `cycle N`, so it cannot see a commit anchor.
// The discriminator is whether the number is TRUE at the commit it names. Checked out and counted
// here, independently of anything the builder reported.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const TARGET = '/opt/targets/moon'
const RUN3_TAG = 'v0.1-improve3'

// 1. Resolve run 3's final commit from the tag, not from a remembered sha.
const sha = execSync(`git rev-parse ${RUN3_TAG}^{commit}`, { cwd: TARGET, encoding: 'utf8' }).trim()
const subject = execSync(`git log -1 --format=%s ${sha}`, { cwd: TARGET, encoding: 'utf8' }).trim()
console.log(`run 3 final commit  ${RUN3_TAG} -> ${sha.slice(0, 7)}`)
console.log(`                    "${subject.slice(0, 100)}"`)

// 2. Count the suite AT that commit.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-c7-run3-'))
execSync(`git archive ${sha} | tar -x -C ${dir}`, { cwd: TARGET, stdio: 'inherit' })
let out = ''
let status = 0
try { out = execSync('node --test --test-reporter=tap test/*.test.js', { cwd: dir, encoding: 'utf8', timeout: 300000 }) }
catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; status = e.status ?? -1 }
const num = k => { const m = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')); return m ? Number(m[1]) : null }
const atRun3 = num('tests')
console.log(`suite AT that commit exit=${status} tests=${atRun3} pass=${num('pass')} fail=${num('fail')}`)
fs.rmSync(dir, { recursive: true, force: true })

// 3. What does the document claim?
const rep = fs.readFileSync(path.join(TARGET, 'REPORT.md'), 'utf8')
const m = rep.match(/#\s*(\d+)\s*tests as of run 3's final commit/)
const claimed = m ? Number(m[1]) : null
console.log(`REPORT.md claims     ${claimed} tests as of run 3's final commit`)

// 4. Does the claim carry an anchor at all, under a vocabulary wider than C7's `cycle N`?
const para = rep.split(/\n\s*\n/).find(p => /\d+ tests as of run 3/.test(p)) || ''
const anchors = {
  'cycle N (C7 vocabulary)': /cycle[s]? \d/i.test(para),
  'run N': /run \d/i.test(para),
  'commit': /commit/i.test(para),
  'date': /\d{4}-\d{2}-\d{2}/.test(para)
}
console.log('anchor vocabulary present in the enclosing paragraph:')
for (const [k, v] of Object.entries(anchors)) console.log(`  ${v ? 'YES' : 'no '}  ${k}`)

// 5. Verdict.
const claimTrue = claimed !== null && claimed === atRun3
const isAnchored = Object.values(anchors).some(Boolean)
console.log('')
console.log(`claim true at the commit it names:  ${claimTrue}  (${claimed} vs measured ${atRun3})`)
console.log(`claim carries a measurement anchor: ${isAnchored}`)
console.log(`C7 flag attributable to the WORK:   ${!(claimTrue && isAnchored)}`)
console.log(claimTrue && isAnchored
  ? 'VERDICT: INSTRUMENT DEFECT. The claim is anchored and true; C7 recognises only `cycle N`.'
  : 'VERDICT: WORK DEFECT. The item left a claim that is stale or genuinely unanchored.')
