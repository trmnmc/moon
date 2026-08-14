// Cycle 23 definition-of-done scan — conductor's OWN instrument.
// Authored at verification time; no builder has seen it. Each check is a
// discriminator where one is available: it exercises the shipped module and
// asserts something a degenerate or stubbed implementation could not produce.
import { createRequire } from 'node:module'
const require = createRequire('file:///opt/targets/moon/')
const astro = require('/opt/targets/moon/src/astro.js')

const out = []
const rec = (id, ok, detail) => { out.push([ok ? 'PASS' : 'FAIL', id, detail]) }

// --- D1: KI-6 — nextFullMoon throws TypeError, never a RangeError, at the top
// of the JS Date range; and STILL SUCCEEDS just under it. The pair is the
// discriminator: a stub that throws unconditionally would fail the second half.
{
  const atTop = new Date(8.64e15)
  let topErr = null
  try { astro.nextFullMoon(atTop) } catch (e) { topErr = e }
  const topOk = topErr instanceof TypeError && !(topErr instanceof RangeError)

  const nearTop = new Date(8.64e15 - 1000 * 60 * 60 * 24 * 400)
  let nearOk = false, nearIso = ''
  try { nearIso = astro.nextFullMoon(nearTop).toISOString(); nearOk = true } catch (e) { nearIso = 'threw ' + e.constructor.name }
  rec('D1 KI-6', topOk && nearOk,
    'at top: ' + (topErr && topErr.constructor.name) + ' | 400d under top: ' + nearIso)
}

// --- D2: KI-7 — the supported domain is a MODULE constant, not prose, and the
// consistency it claims actually holds inside it while the module still runs
// outside it. Discriminator: sample 4001 states across the declared domain and
// confirm zero phaseName/illumination contradictions, then confirm a state far
// OUTSIDE the domain still computes (so the domain is a documented bound, not
// an enforced throw that would make the claim vacuous).
{
  const dom = astro.PHASE_ILLUMINATION_CONSISTENCY_DOMAIN
  const lo = new Date(dom.startMs)
  const hi = new Date(dom.endMs)
  const N = 4001
  let bad = 0, firstBad = ''
  for (let i = 0; i < N; i++) {
    const t = new Date(lo.getTime() + ((hi.getTime() - lo.getTime()) * i) / (N - 1))
    const m = astro.computeMoon(t)
    // contradiction test: a "New Moon" that is mostly lit, or "Full Moon" mostly dark
    const k = m.illumination
    const n = m.phaseName
    const contra =
      (n === 'New Moon' && k > 0.10) ||
      (n === 'Full Moon' && k < 0.90) ||
      (n === 'First Quarter' && (k < 0.30 || k > 0.70)) ||
      (n === 'Last Quarter' && (k < 0.30 || k > 0.70))
    if (contra) { bad++; if (!firstBad) firstBad = t.toISOString() + ' ' + n + ' k=' + k.toFixed(3) }
  }
  let outsideOk = false, outsideDesc = ''
  try {
    // year 12000 — far outside the declared domain, well inside the JS Date range
    const far = astro.computeMoon(new Date(Date.UTC(12000, 5, 1)))
    outsideOk = typeof far.phaseName === 'string'
    outsideDesc = far.phaseName + ' k=' + far.illumination.toFixed(3)
  } catch (e) { outsideDesc = 'threw ' + e.constructor.name }
  rec('D2 KI-7', bad === 0 && outsideOk,
    'domain ' + lo.getUTCFullYear() + '-01-01..' + hi.getUTCFullYear() + '-01-01' +
    ' | ' + N + ' sampled, contradictions=' + bad + (firstBad ? ' first=' + firstBad : '') +
    ' | outside-domain year-12000 still computes: ' + outsideDesc)
}

// --- D3: KI-5 — the pin must be a MEASUREMENT against a DECLARED partition,
// and the two places that declare it must agree.
//
// First instrument attempt hand-typed the declared set from the (pre-T-109)
// known_issues text and flagged U+25D6/U+25D7 plus the six box-drawing frame
// characters. Both were MY defect: the frame is not disc, and the repo does
// document the round-limb pair (README:214-217, test/render.test.js:583-593)
// as deliberately unclassified. Instrument widened — and paired with two
// strictly stronger assertions the repo does not make about itself:
//
//   D3a  the glyph set the disc ACTUALLY draws == the union the shipping test
//        declares, with the frame stripped structurally (renderLine has no
//        frame at all) rather than by codepoint guessing. Catches drift in
//        BOTH directions: a new undeclared glyph, and a declared glyph that
//        stopped being drawn.
//   D3b  README prose and the test's DOCUMENTED_EAW map agree on the
//        Neutral/Ambiguous partition. Neither file checks this; a docs edit
//        that desynced them from the test would ship silently today.
{
  const fs = require('node:fs')
  const render = require('/opt/targets/moon/src/render.js')

  // Parse the DECLARED sets out of the shipping test's own source.
  const tsrc = fs.readFileSync('/opt/targets/moon/test/render.test.js', 'utf8')
  const mapBlock = tsrc.slice(tsrc.indexOf('const DOCUMENTED_EAW'), tsrc.indexOf('];', tsrc.indexOf('const DOCUMENTED_EAW')))
  const testDeclared = new Map()
  for (const m of mapBlock.matchAll(/\[0x([0-9a-f]{4}),\s*'(Neutral|Ambiguous)'\]/gi)) {
    testDeclared.set(parseInt(m[1], 16), m[2])
  }
  const roundLimb = new Set([0x25d6, 0x25d7])
  const declared = new Set([...testDeclared.keys(), ...roundLimb])

  // D3a — observed disc glyphs. renderLine carries the disc with NO frame, so
  // the frame is excluded by construction, not by a codepoint threshold.
  const seen = new Set()
  const start = new Date('2026-01-01T00:00:00Z')
  for (let h = 0; h < 30 * 24; h++) {
    const m = astro.computeMoon(new Date(start.getTime() + h * 3600 * 1000))
    for (const hemi of ['north', 'south']) {
      const line = render.renderLine(m, hemi)
      const disc = [...line].slice(0, 5) // the disc is the leading 5 codepoints
      for (const ch of disc) if (ch !== ' ') seen.add(ch.codePointAt(0))
      if (disc.length !== 5) seen.add(-1) // width drift sentinel
    }
  }
  const undeclared = [...seen].filter((c) => !declared.has(c))
  const undrawn = [...declared].filter((c) => !seen.has(c))
  const hex = (c) => (c < 0 ? 'WIDTH-DRIFT' : 'U+' + c.toString(16).toUpperCase())
  rec('D3a KI-5 pin', undeclared.length === 0 && undrawn.length === 0,
    '720h x2 hemi, disc=leading 5 cp of renderLine | drawn: ' +
    [...seen].sort((a, b) => a - b).map(hex).join(' ') +
    ' | undeclared: ' + (undeclared.length ? undeclared.map(hex).join(' ') : 'none') +
    ' | declared-but-undrawn: ' + (undrawn.length ? undrawn.map(hex).join(' ') : 'none'))

  // D3b — README prose vs the test map. README:199-200 states the partition as
  // two inline-code runs: Neutral `░` and `▐`, Ambiguous `▒ ▓ █ ▌ ▏ ▕`.
  const rsrc = fs.readFileSync('/opt/targets/moon/README.md', 'utf8')
  const sect = rsrc.slice(rsrc.indexOf('## Known limitation: terminal glyph width'))
  const neutralM = sect.match(/`(.)` and `(.)` are Neutral/)
  const ambigM = sect.match(/while `([^`]+)` are Ambiguous/)
  const readmeDeclared = new Map()
  if (neutralM) for (const g of [neutralM[1], neutralM[2]]) readmeDeclared.set(g.codePointAt(0), 'Neutral')
  if (ambigM) for (const g of ambigM[1].split(/\s+/).filter(Boolean)) readmeDeclared.set(g.codePointAt(0), 'Ambiguous')
  const disagree = []
  for (const [cp, cls] of testDeclared) if (readmeDeclared.get(cp) !== cls) disagree.push(hex(cp) + ' test=' + cls + ' readme=' + (readmeDeclared.get(cp) || 'ABSENT'))
  for (const [cp, cls] of readmeDeclared) if (!testDeclared.has(cp)) disagree.push(hex(cp) + ' readme=' + cls + ' test=ABSENT')
  const readmeNamesLimb = /`◗` and `◖`/.test(sect) && /has not established their East Asian/.test(sect)
  rec('D3b README<->test agree', disagree.length === 0 && readmeNamesLimb,
    'partition entries: readme=' + readmeDeclared.size + ' test=' + testDeclared.size +
    ' | disagreements: ' + (disagree.length ? disagree.join('; ') : 'none') +
    ' | README names the round-limb pair as unclassified: ' + readmeNamesLimb)
}

// --- D4: zero runtime dependencies, asserted against the manifest AND the tree.
{
  const pkg = require('/opt/targets/moon/package.json')
  const hasDeps = !!(pkg.dependencies && Object.keys(pkg.dependencies).length)
  const hasDev = !!(pkg.devDependencies && Object.keys(pkg.devDependencies).length)
  let nodeModules = 'absent'
  try { const fs = require('node:fs'); nodeModules = fs.existsSync('/opt/targets/moon/node_modules') ? 'PRESENT' : 'absent' } catch {}
  rec('D4 zero-dep', !hasDeps && !hasDev && nodeModules === 'absent',
    'dependencies=' + (hasDeps ? 'yes' : 'none') + ' devDependencies=' + (hasDev ? 'yes' : 'none') +
    ' node_modules=' + nodeModules)
}

for (const [v, id, d] of out) console.log(v + '  ' + id + '  ' + d)
console.log('---')
console.log(out.every((r) => r[0] === 'PASS') ? 'SCAN: all module-level clauses PASS' : 'SCAN: at least one clause FAILED')
