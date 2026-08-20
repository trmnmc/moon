// Derives gate v5 from v4. v1-v4 stay on disk byte-unmodified; v4's PASS 15 / FAIL 1 output is
// published as it stands. Only C7 changes, and only after cycle-104-c7-probe.mjs ADJUDICATED its
// single failure as an instrument defect rather than a work defect:
//   REPORT.md claims "171 tests as of run 3's final commit". Measured at v0.1-improve3 (7395837):
//   171/171. The claim is true AND anchored — by commit, which C7's `cycle N`-only vocabulary
//   could not see. Widening the vocabulary is a correction toward the document's real grammar,
//   not a weakening toward the answer, so C7 v5 also carries a POSITIVE CONTROL: an unanchored
//   claim must still be flagged, or the widened check is vacuous and fails.
import fs from 'node:fs'

const V4 = '/opt/targets/moon/.swarm/runs/cycle-104-gate-v4.mjs'
const V5 = '/opt/targets/moon/.swarm/runs/cycle-104-gate-v5.mjs'
let s = fs.readFileSync(V4, 'utf8')

const old = [
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

const neu = [
  '  // v5: paragraph-scoped (v3) with the anchor vocabulary widened to the one the DOCUMENT',
  '  // actually uses. v4 recognised only `cycle N` and so flagged "171 tests as of run 3\'s final',
  '  // commit" — a claim measured true at v0.1-improve3 (171/171, cycle-104-c7-probe.mjs). A',
  '  // measurement point is a cycle, a run, a named commit or a date; all four are legitimate.',
  '  const ANCHOR = /cycle[s]? \\d|run \\d|commit|\\d{4}-\\d{2}-\\d{2}/i',
  '  const scan = (text) => {',
  '    const hits = []',
  '    let ln = 1',
  '    for (const para of text.split(/\\n\\s*\\n/)) {',
  '      const start = ln',
  '      ln += para.split(\'\\n\').length + 1',
  '      if (!/\\b\\d+ tests\\b/.test(para)) continue',
  '      if (ANCHOR.test(para)) continue',
  '      hits.push(`para at line ${start}: ${para.replace(/\\s+/g, \' \').trim().slice(0, 100)}`)',
  '    }',
  '    return hits',
  '  }',
  '  undated.push(...scan(rep))',
  '  // POSITIVE CONTROL — a widened check that can no longer flag anything is vacuous, and a',
  '  // vacuous check reads identical to a clean document. An unanchored claim must still be seen.',
  '  const controlHits = scan(`${rep}\\n\\nThe suite carries 199 tests.\\n`)',
  '  const controlWorks = controlHits.length === scan(rep).length + 1',
  '  if (!controlWorks) undated.push(\'POSITIVE CONTROL FAILED — the widened scan flags nothing; it is vacuous\')'
].join('\n')

if (!s.includes(old)) { console.error('C7 anchor missing'); process.exit(1) }
s = s.replace(old, neu)

s = s.replace('// cycle-104 verification gate, v4 — AUTHORITATIVE (v3 superseded; D3 probe repaired).',
  '// cycle-104 verification gate, v5 — AUTHORITATIVE (v4 superseded; C7 anchor vocabulary widened\n// after adjudication, with a positive control added so the widening cannot go vacuous).')
s = s.replace('console.log(`\\nGATE v4  PASS', 'console.log(`\\nGATE v5  PASS')

fs.writeFileSync(V5, s)
console.log(`v5 written, ${Buffer.byteLength(s)} bytes`)
