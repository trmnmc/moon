// Derives gate v4 from v3. v1/v2/v3 stay on disk byte-unmodified.
// One repair: D3's stale-ask probe injected its line as bare prose, which v3's fenced-block
// extractor correctly ignores — so D3 reported "no problems" and went red. The probe was wrong,
// not the extractor. It now injects inside a fence, the same structure a real patch block has.
// Found by RUNNING the instrument, not by reading it. Still pre-dispatch: no work exists yet.
import fs from 'node:fs'

const V3 = '/opt/targets/moon/.swarm/runs/cycle-104-gate-v3.mjs'
const V4 = '/opt/targets/moon/.swarm/runs/cycle-104-gate-v4.mjs'
let s = fs.readFileSync(V3, 'utf8')

const F = String.fromCharCode(96).repeat(3)
const old = '  const staleProbe = auditOwnerAction(`${text}\\n"Bash(/opt/swarm/bin/swarm-budget.sh:*)"\\n`)'
const neu = [
  '  // v4: the probe must inject INSIDE a fence, because that is where the extractor now reads.',
  '  const FENCE = String.fromCharCode(96).repeat(3)',
  '  const staleProbe = auditOwnerAction(',
  '    `${text}\\n${FENCE}json\\n"Bash(/opt/swarm/bin/swarm-budget.sh:*)"\\n${FENCE}\\n`)'
].join('\n')
if (!s.includes(old)) { console.error('D3 anchor missing'); process.exit(1) }
s = s.replace(old, neu)

// D4's fails-closed probe is prose-only by design and stays that way: a file with no fenced patch
// block at all is exactly the "names zero allow lines" case it is asserting.

s = s.replace('// cycle-104 verification gate, v3 — AUTHORITATIVE.',
  '// cycle-104 verification gate, v4 — AUTHORITATIVE (v3 superseded; D3 probe repaired).')
s = s.replace('console.log(`\\nGATE v3  PASS', 'console.log(`\\nGATE v4  PASS')

fs.writeFileSync(V4, s)
console.log(`v4 written, ${Buffer.byteLength(s)} bytes; fence chars used: ${F.length}`)
