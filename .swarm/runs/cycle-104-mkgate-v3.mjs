// Derives gate v3 from v2. v1 and v2 stay on disk byte-unmodified as the record of what each
// instrument said (L-047: the repair goes into a SEPARATE artifact, the failing output stands).
// Both repairs below were made BEFORE dispatch, against a tree containing none of the work.
import fs from 'node:fs'

const V2 = '/opt/targets/moon/.swarm/runs/cycle-104-gate-v2.mjs'
const V3 = '/opt/targets/moon/.swarm/runs/cycle-104-gate-v3.mjs'
let s = fs.readFileSync(V2, 'utf8')
let applied = 0

// repair 1 — D2 reads a STRUCTURAL marker (the fenced patch block) the document owns, instead of
// regex-matching prose. v2 scanned the whole file, which would have charged the owner-action file
// for a correctly-worded "do NOT add <already-granted line>" warning. Prose is not the patch.
const oldEx = '  const lines = [...text.matchAll(/Bash\\(([^)]*)\\)/g)].map(m => `Bash(${m[1]})`)'
const newEx = [
  '  // v3: fenced code blocks only — the structural marker the document owns. v2 regex-matched the',
  '  // whole file, so a correctly-worded "do NOT add <already-granted line>" warning would have been',
  '  // charged as a stale ask. Prose is not the patch; the fence is.',
  '  const F = String.fromCharCode(96).repeat(3)',
  '  const fenceRe = new RegExp(F + "[a-z]*\\\\n([\\\\s\\\\S]*?)" + F, "g")',
  '  const fenced = [...text.matchAll(fenceRe)].map(m => m[1]).join("\\n")',
  '  const lines = [...fenced.matchAll(/Bash\\(([^)]*)\\)/g)].map(m => `Bash(${m[1]})`)'
].join('\n')
if (!s.includes(oldEx)) { console.error('D2 anchor missing'); process.exit(1) }
s = s.replace(oldEx, newEx); applied++

// repair 2 — C7 scans by PARAGRAPH, not by line. In REPORT.md the annotation opens on line 38 and
// the "cycle 80" that dates it lands on line 39; a line-scoped scan splits the claim from its date
// and manufactures a false positive against a document that is actually correct.
const oldScan = [
  '  for (const [i, line] of rep.split(\'\\n\').entries()) {',
  '    if (!/\\b\\d+ tests\\b/.test(line)) continue',
  '    if (/cycle[s]? \\d/i.test(line)) continue // bound to a measurement point — legitimate',
  '    undated.push(`${i + 1}: ${line.trim().slice(0, 90)}`)',
  '  }'
].join('\n')
const newScan = [
  '  // v3: paragraph-scoped. A claim and the cycle that dates it are routinely on different LINES',
  '  // of one wrapped sentence; splitting them invents a false positive.',
  '  let lineNo = 1',
  '  for (const para of rep.split(/\\n\\s*\\n/)) {',
  '    const start = lineNo',
  '    lineNo += para.split(\'\\n\').length + 1',
  '    if (!/\\b\\d+ tests\\b/.test(para)) continue',
  '    if (/cycle[s]? \\d/i.test(para)) continue // bound to a measurement point — legitimate',
  '    undated.push(`para at line ${start}: ${para.replace(/\\s+/g, \' \').trim().slice(0, 100)}`)',
  '  }'
].join('\n')
if (!s.includes(oldScan)) { console.error('C7 anchor missing'); process.exit(1) }
s = s.replace(oldScan, newScan); applied++

s = s.replace(
  '// cycle-104 verification gate, v2 (v1 preserved unmodified alongside; only C5 changed)',
  [
    '// cycle-104 verification gate, v3 — AUTHORITATIVE.',
    '// v1 and v2 are preserved unmodified alongside as the record of what each instrument said.',
    '//   v2 repaired C5: v1 inserted a line mid-README and shifted every cited line number, so ARM A',
    '//     went red for a reason unrelated to count claims and the kill could not be attributed.',
    '//   v3 repairs D2 (prose regex -> fenced-block structural marker) and C7 (line scan -> paragraph',
    '//     scan). Both were flaws visible in the instrument itself, repaired BEFORE dispatch against a',
    '//     tree containing none of the work — not fitted to any answer.'
  ].join('\n'))

s = s.replace("console.log(`\\nGATE v1  PASS", "console.log(`\\nGATE v3  PASS")
fs.writeFileSync(V3, s)
console.log(`v3 written: ${applied} repairs applied, ${Buffer.byteLength(s)} bytes`)
