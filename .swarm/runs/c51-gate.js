'use strict'
// cycle 51 verification gate for T-139. Authored by the conductor AFTER the builder
// returned; the builder never saw any of it.
//
// Check A (discriminator): the file's EXECUTABLE text is byte-identical to HEAD's.
//   "Every added line starts with //" only proves the ADDED lines are comments — it
//   would not catch a deleted or edited code line elsewhere in the file, which is
//   exactly what a comment-only claim has to exclude. Stripping every full-line
//   comment from both versions and comparing the remainder proves the invariance
//   directly, and is an observable a behaviour-changing edit could not produce.
//
// Check B: every rendered row and witness instant QUOTED in the new comment is
//   re-derived from the shipping renderer here and compared byte-for-byte against
//   what the comment claims. The comment is only worth its ink if its citations are
//   checkable, so the gate checks them the way a future reader would.
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..', '..')
const REL = 'test/regressions.test.js'
const { computeMoon } = require(path.join(ROOT, 'src/astro.js'))
const { renderLine } = require(path.join(ROOT, 'src/render.js'))

let failures = 0
const ok = (label, pass, detail) => {
  if (!pass) failures++
  console.log((pass ? '  PASS  ' : '  FAIL  ') + label + (detail ? '\n          ' + detail : ''))
}

// ---- Check A -------------------------------------------------------------
const stripComments = (text) =>
  text.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')

const head = execFileSync('git', ['-C', ROOT, 'show', 'HEAD:' + REL], { encoding: 'utf8' })
const now = fs.readFileSync(path.join(ROOT, REL), 'utf8')
const headCode = stripComments(head)
const nowCode = stripComments(now)

console.log('=== A. executable text unchanged (comment-only edit) ===')
console.log('  HEAD: ' + head.split('\n').length + ' lines, ' +
  headCode.split('\n').length + ' after stripping full-line comments')
console.log('  WORK: ' + now.split('\n').length + ' lines, ' +
  nowCode.split('\n').length + ' after stripping full-line comments')
ok('executable text byte-identical to HEAD', headCode === nowCode,
  headCode === nowCode ? '' : 'executable text DIFFERS — this is not a comment-only edit')
ok('file did grow (the comment was actually added)', now.length > head.length,
  'HEAD ' + head.length + ' bytes -> worktree ' + now.length + ' bytes')

// ---- Check B -------------------------------------------------------------
console.log()
console.log('=== B. every citation in the new comment re-derived from the renderer ===')

// Pulled out of the working file itself, not retyped: whatever the comment claims is
// what gets checked.
const added = now.split('\n').filter((l) => !head.split('\n').includes(l))
const commentText = added.join('\n')

const CITED = [
  { iso: '2026-01-02T20:15:00Z', row: '◖███◗ 100%  waxing gibbous' },
  { iso: '2026-01-03T22:15:00Z', row: '◖███◗ 100%  waning gibbous' },
  { iso: '2026-01-18T03:00:00Z', row: '░░░░░   0%  waning crescent' }
]

for (const c of CITED) {
  const actual = renderLine(computeMoon(new Date(c.iso)), 'north')
  ok('renderer at ' + c.iso + ' produces ' + JSON.stringify(c.row),
    actual === c.row, actual === c.row ? '' : 'actual: ' + JSON.stringify(actual))
  ok('comment cites ' + c.iso, commentText.includes(c.iso))
  // The row text is line-wrapped inside the comment, so match on the disc+percent
  // prefix and the name separately rather than on the wrapped whole.
  const prefix = c.row.slice(0, c.row.indexOf('%') + 1)
  ok('comment quotes the rendered prefix ' + JSON.stringify(prefix),
    commentText.includes(prefix))
}

// Nothing may be cited that the renderer does not produce: any ISO instant appearing
// in the added comment must be one of the three checked above.
const isoInComment = commentText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g) || []
const stray = isoInComment.filter((i) => !CITED.some((c) => c.iso === i))
ok('no uncited instant smuggled into the comment', stray.length === 0,
  stray.length ? 'stray: ' + stray.join(', ') : String(isoInComment.length) + ' instants, all checked')

// ---- Check C: the mechanism sentence ------------------------------------
console.log()
console.log('=== C. mechanism claims in the comment, checked against src ===')
// Every "file:line" the new comment cites is resolved against the tree as it stands
// and the line it lands on is printed, so a miscitation is visible rather than
// assumed away. This is the T-147 discipline applied to the text being added.
const CITE_RE = /(src\/[a-z]+\.js):(\d+)/g
const cites = [...commentText.matchAll(CITE_RE)]
ok('the mechanism sentence cites at least one source line', cites.length > 0,
  cites.length + ' citation(s) found')

const EXPECT = {
  'src/astro.js': /illumination\s*=\s*\(1 \+ cos/,
  'src/render.js': /clamp\(/
}
for (const c of cites) {
  const file = c[1]
  const lineNo = Number(c[2])
  const line = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n')[lineNo - 1]
  console.log('  ' + file + ':' + lineNo + '  ' + JSON.stringify(String(line).trim()))
  ok(file + ':' + lineNo + ' is the construct the comment names',
    EXPECT[file] ? EXPECT[file].test(String(line)) : false)
}

// The claim the whole comment rests on: at the endpoints the rendered row really is
// byte-identical across adjacent names. Asserted in the comment — proved here.
const endpointRows = [
  { a: '2026-01-02T20:15:00Z', b: '2026-01-02T22:15:00Z' }, // 100% waxing gibbous vs full
  { a: '2026-01-18T03:00:00Z', b: '2026-01-18T08:00:00Z' } // 0% waning crescent vs new
]
for (const e of endpointRows) {
  const ra = renderLine(computeMoon(new Date(e.a)), 'north')
  const rb = renderLine(computeMoon(new Date(e.b)), 'north')
  const discA = ra.slice(0, ra.indexOf(' '))
  const discB = rb.slice(0, rb.indexOf(' '))
  const pctA = ra.slice(ra.indexOf(' ') + 1, ra.indexOf('%') + 1)
  const pctB = rb.slice(rb.indexOf(' ') + 1, rb.indexOf('%') + 1)
  ok('disc+percent identical across adjacent names at this endpoint',
    discA === discB && pctA === pctB,
    JSON.stringify(discA + ' ' + pctA) + ' vs ' + JSON.stringify(discB + ' ' + pctB) +
    '  (names differ: ' + JSON.stringify(ra.slice(ra.indexOf('%') + 1).trim()) + ' / ' +
    JSON.stringify(rb.slice(rb.indexOf('%') + 1).trim()) + ')')
  // The mirror half of the indiscriminability claim: these discs are their own mirror.
  const MIRROR = new Map([['◖', '◗'], ['◗', '◖'], ['▏', '▕'], ['▕', '▏'], ['▌', '▐'], ['▐', '▌']])
  const mirrored = [...discA].reverse().map((ch) => MIRROR.get(ch) || ch).join('')
  ok('the endpoint disc is its own mirror image', mirrored === discA,
    JSON.stringify(discA) + ' -> ' + JSON.stringify(mirrored))
}

ok('comment claims byte-identical rendering at the endpoints',
  /byte-identical/.test(commentText))
ok('the corrected wording says the mutants SURVIVED, not that the sweep caught them',
  /mutants survived/.test(commentText) && !/caught exactly three/.test(commentText))
ok('no unsupported projection mechanism remains',
  !/half-sphere/.test(commentText))

console.log()
console.log(failures === 0 ? 'GATE: all checks passed' : 'GATE: ' + failures + ' check(s) FAILED')
process.exit(failures === 0 ? 0 : 1)
