'use strict'

// Regressions from the cycle-1 adversarial QA pass. Each test here corresponds to a
// defect that shipped and was caught by an agent whose job was to attack the build,
// not to confirm it. They are kept in their own file so the origin stays legible.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { renderLine, renderBlock } = require('../src/render.js')
const { computeMoon, PHASE_NAMES } = require('../src/astro.js')

const BIN = path.join(__dirname, '..', 'bin', 'moon.js')
const REPO_ROOT = path.join(__dirname, '..')
const README = path.join(REPO_ROOT, 'README.md')

// Pulls the prose + code between a "## Heading" and the next "## " heading (or EOF).
// Plain string search on purpose: a regex `$` anchor here would need the `m` flag to
// match "## " at a line start, but `m` also makes `$` match at every line end, not just
// the section end, silently truncating the capture to one line.
function readmeSection (heading) {
  const text = fs.readFileSync(README, 'utf8')
  const marker = '\n## ' + heading + '\n'
  const start = text.indexOf(marker)
  assert.ok(start !== -1, `README has no "## ${heading}" section`)
  const contentStart = start + marker.length
  const nextHeading = text.indexOf('\n## ', contentStart)
  return text.slice(contentStart, nextHeading === -1 ? text.length : nextHeading)
}

// Pulls every fenced ```sh block out of a section, in order.
function shBlocks (section) {
  const blocks = []
  const re = /```sh\n([\s\S]*?)```/g
  let m
  while ((m = re.exec(section))) blocks.push(m[1])
  return blocks
}

function run (args = [], tz = 'UTC') {
  return execFileSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  })
}

// D2 — --help described phaseAngle as plain "degrees, 0..360". Combined with the
// spec's textbook k = (1+cos i)/2, that led a scripter to the exact inverse of the
// truth: 95.9% for a 4% moon.
test('help does not mis-describe phaseAngle, and warns about the inverse', () => {
  const out = run(['--help'])
  assert.match(out, /elongation in degrees/)
  assert.match(out, /inverse/)
})

test('applying the textbook formula to phaseAngle really does invert illumination', () => {
  // Pins the reason the warning above must exist; if phaseAngle's meaning ever
  // changes, this test fails and the help text must be revisited.
  const j = JSON.parse(run(['--json']))
  const naive = (1 + Math.cos(j.phaseAngle * Math.PI / 180)) / 2
  assert.ok(Math.abs((j.illumination + naive) - 1) < 0.01,
    'phaseAngle is elongation; naive + true should sum to 1')
})

// D3 — a .trim() silently undid the padStart(2) on the day number, so single-digit
// days lost the alignment the code had just asked for.
test('single-digit full-moon days keep their leading pad', () => {
  const script = [
    "const R = Date; const f = new R('2026-01-01T00:00:00Z');",
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main([]);'
  ].join('\n')
  const out = execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
  const dateLine = out.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(dateLine, 'no next-full-moon line produced')
  assert.match(dateLine, /next full moon {2} \d /,
    'single-digit day must be right-aligned under two-digit days: ' +
    JSON.stringify(dateLine))
})

// D4 — the block form indented the next-full-moon line to column 3 while the block's
// own labels sit at column 4.
test('block next-full-moon line aligns with the block label column', () => {
  const lines = run(['--block']).replace(/\n$/, '').split('\n')
  const label = lines.find((l) => l.includes('phase '))
  const next = lines.find((l) => l.includes('next full moon'))
  assert.ok(label && next, 'expected both a label row and a next-full-moon row')
  assert.equal(next.search(/\S/), label.indexOf('phase'))
})

// O5 — two help lines ran to 84 and 82 columns and wrapped on a default terminal.
test('help stays within 80 columns', () => {
  for (const line of run(['--help']).split('\n')) {
    assert.ok(line.length <= 80, `help line is ${line.length} cols: ${line}`)
  }
})

// T-106 — formatFullMoonDate's year ternary (bin/moon.js) compares when.getFullYear()
// against now.getFullYear() and only appends the year on a mismatch. Nothing exercised
// the branch where the next full moon actually crosses into the following calendar
// year, so a flipped comparison (or a ternary that always/never appends) would have
// shipped silently. 2025-12-30T00:00:00Z was picked by calling the repo's own
// nextFullMoon(now) from a throwaway node -e and scanning late Decembers for a "now"
// whose next full moon lands in January of the next year: it resolves to
// 2026-01-03T10:02:50Z, i.e. year 2026 while "now" is 2025 — a genuine cross-year case,
// not an assumed one.
test('next-full-moon date carries the year when it falls in a later calendar year', () => {
  const script = [
    "const R = Date; const f = new R('2025-12-30T00:00:00Z');",
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main([]);'
  ].join('\n')
  const out = execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
  const dateLine = out.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(dateLine, 'no next-full-moon line produced')
  assert.match(dateLine, /next full moon\s+3 Jan 2026$/,
    'next full moon on 2026-01-03 must print the specific year 2026 when "now" is ' +
    'still 2025: ' + JSON.stringify(dateLine))
})

// T-106 — same defect, opposite branch: when the next full moon stays within the
// current calendar year the ternary must yield '', not just "some year absent from
// this string". 2026-06-01T00:00:00Z was confirmed the same way, via nextFullMoon(now)
// in a throwaway node -e: it resolves to 2026-06-29T23:56:38Z, still 2026. A ternary
// that always appends the year would fail this test even though the cross-year test
// above would still pass it.
test('next-full-moon date omits the year when it falls in the current calendar year', () => {
  const script = [
    "const R = Date; const f = new R('2026-06-01T00:00:00Z');",
    'class D extends R { constructor(...a){ a.length ? super(...a) : super(f.getTime()) }',
    '  static now(){ return f.getTime() } }',
    'global.Date = D;',
    'require(' + JSON.stringify(BIN) + ').main([]);'
  ].join('\n')
  const out = execFileSync(process.execPath, ['-e', script],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } })
  const dateLine = out.split('\n').find((l) => l.includes('next full moon'))
  assert.ok(dateLine, 'no next-full-moon line produced')
  assert.match(dateLine, /next full moon\s+29 Jun$/,
    'next full moon on 2026-06-29 with "now" also 2026 must omit the year suffix: ' +
    JSON.stringify(dateLine))
})

// T-131 — every command in README's Install section carried an unresolved `YOUR_USER`
// placeholder (npx github:YOUR_USER/moon, and the git-clone equivalent), so the very
// first command a reader saw was not runnable as written. `gh api repos/YOUR_USER/moon`
// 404s; there is no such user.
test('README Install section leads with a command that actually runs', () => {
  const section = readmeSection('Install')
  const blocks = shBlocks(section)
  assert.ok(blocks.length > 0, 'Install section has no ```sh command block')

  // The first command block is presented as the thing to run right now. It must
  // contain no unresolved placeholder, and it must actually work from the repo root —
  // the same condition a reader who has cloned this repo is in.
  assert.doesNotMatch(blocks[0], /YOUR_USER|<[^>]+>/,
    'first Install command still carries an unresolved placeholder: ' +
    JSON.stringify(blocks[0]))

  const out = execFileSync('bash', ['-c', blocks[0]],
    { cwd: REPO_ROOT, encoding: 'utf8' })
  assert.match(out, /\d+%\s+(new|waxing|first quarter|waning|full)/,
    'first Install command did not produce a real moon readout: ' + JSON.stringify(out))
})

// T-131 — any placeholder that survives elsewhere in Install must be labelled as one,
// not left looking like a literal value a reader could paste and run.
test('README Install section labels every surviving placeholder', () => {
  const section = readmeSection('Install')
  assert.doesNotMatch(section, /YOUR_USER/,
    'Install section still contains the bare YOUR_USER placeholder')

  const placeholders = section.match(/<[^>]+>/g) || []
  for (const p of placeholders) {
    assert.match(section, new RegExp('`' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '`[^.]*\\bplaceholder\\b'),
    `placeholder ${p} appears but is never explicitly called a placeholder`)
  }
})

// T-131 — the ~/.zshrc snippet showed `npx github:YOUR_USER/moon --compact`, i.e. a
// fetch-from-git-on-every-render command, immediately followed by a paragraph telling
// the reader not to do exactly that because it's slow. The snippet must not show the
// form the surrounding prose retracts.
test('README zshrc prompt snippet does not use the npx fetch-on-render form', () => {
  const section = readmeSection('In your prompt or MOTD')
  const blocks = shBlocks(section)
  const zshrcBlock = blocks.find((b) => b.includes('.zshrc'))
  assert.ok(zshrcBlock, 'no ~/.zshrc code block found in the prompt/MOTD section')
  assert.doesNotMatch(zshrcBlock, /npx/,
    'the ~/.zshrc snippet still uses npx, the form the next paragraph says is too ' +
    'slow for prompt rendering: ' + JSON.stringify(zshrcBlock))
})

// T-134 helpers — README's headline block, `--block` block, and the north/south sweep
// table are hand-maintained transcriptions of real renderer output. Nothing read them
// before this, which is exactly how RETRO.md's hand-edited "full" row shipped. These
// helpers parse the rendered examples back out of README.md itself so they can be
// checked against the shipping renderer, instead of typing any of README's numbers
// or names a second time.

// Pulls the first fenced block of the given language tag (empty string for a plain
// ``` fence, "json" for ```json) out of arbitrary README text, minus its trailing
// newline. Fails loudly rather than returning an empty match.
function firstFence (text, lang = '') {
  const re = new RegExp('```' + lang + '\\n([\\s\\S]*?)```')
  const m = re.exec(text)
  assert.ok(m, `no \`\`\`${lang} fence found in the given README text`)
  const body = m[1].replace(/\n$/, '')
  assert.ok(body.length > 0, `\`\`\`${lang} fence parsed to an empty body`)
  return body
}

// The headline block sits before README's first "## " heading, so readmeSection (which
// hunts for a numbered heading) can't reach it. Same plain-string-search reasoning.
function introSection () {
  const text = fs.readFileSync(README, 'utf8')
  const end = text.indexOf('\n## ')
  assert.ok(end !== -1, 'README has no "## " heading to bound the intro section')
  return text.slice(0, end)
}

// The MoonState for claims 1 and 2 comes from README's own ```json fence, not from a
// hand-typed literal, so a future regeneration of that fence is exactly what these
// tests check against.
function readmeMoon () {
  const text = fs.readFileSync(README, 'utf8')
  const parsed = JSON.parse(firstFence(text, 'json'))
  assert.ok(Number.isFinite(parsed.illumination),
    'README ```json fence has no numeric "illumination" field')
  assert.ok(Number.isFinite(parsed.cycleFraction),
    'README ```json fence has no numeric "cycleFraction" field')
  assert.ok(typeof parsed.phase === 'string' && parsed.phase.length > 0,
    'README ```json fence has no non-empty "phase" field')
  return { illumination: parsed.illumination, cycleFraction: parsed.cycleFraction, phaseName: parsed.phase }
}

// Horizontal-mirror map, matching render.js's own MIRROR table: reverse the run, swap
// any handed glyph, leave everything else (the shade ramp) as-is.
const DISC_MIRROR = new Map([
  ['◖', '◗'], ['◗', '◖'],
  ['▏', '▕'], ['▕', '▏'],
  ['▌', '▐'], ['▐', '▌']
])

function mirrorDisc (disc) {
  return [...disc].reverse().map((ch) => DISC_MIRROR.get(ch) || ch).join('')
}

// Parses one renderLine-shaped run — DISC ILLUM%  NAME<rest> — out of arbitrary text.
// Deliberately locates fields by content, not by any hardcoded column width: the disc
// is whatever precedes the first space (none of its glyphs are a space), the
// illumination field is whatever precedes the following "%", and the name is matched
// against astro.js's own PHASE_NAMES. This needs no private layout constant from
// render.js, and works unchanged on both the north half and the south half of a sweep
// row.
function parseRenderedRun (str) {
  const discEnd = str.indexOf(' ')
  assert.ok(discEnd > 0, `no space found after a disc in ${JSON.stringify(str)}`)
  const disc = str.slice(0, discEnd)
  const pctEnd = str.indexOf('%', discEnd)
  assert.ok(pctEnd > discEnd, `no illumination percent found in ${JSON.stringify(str)}`)
  const illum = str.slice(discEnd + 1, pctEnd + 1)
  const nameField = str.slice(pctEnd + 1).replace(/^ +/, '')
  const name = PHASE_NAMES.find((n) => nameField.startsWith(n))
  assert.ok(name, `no known PHASE_NAMES entry at the start of ${JSON.stringify(nameField)}`)
  return { disc, illum, name, rest: nameField.slice(name.length) }
}

// T-134 — the headline fence is a hand-maintained transcription of renderLine's output
// and no test read it, which is exactly the class of defect RETRO.md lines 38-43
// describe: a rendered example hand-edited to something the renderer never produces,
// caught by nothing. The moon fed to renderLine here is parsed out of README's own
// ```json fence, not typed in, so the two blocks are checked against each other and
// against the shipping renderer rather than against a value duplicated by hand.
test('T-134 — README headline fence matches renderLine(moon, "north")', () => {
  const moon = readmeMoon()
  const headline = firstFence(introSection())
  const line = headline.split('\n')[0]
  assert.ok(line.length > 0, 'headline fence has no first line')
  assert.equal(line, renderLine(moon, 'north'),
    'README headline no longer matches renderLine(readmeMoon(), "north"): ' +
    JSON.stringify(line))
})

// T-134 — same gap, for the `--block` fence. Its last line is "next full moon ...",
// which renderBlock does not produce (bin/moon.js appends it separately), so it's
// excluded before comparing.
test('T-134 — README `--block` fence (minus its next-full-moon line) matches renderBlock(moon, "north")', () => {
  const moon = readmeMoon()
  const section = readmeSection('`--block`')
  const lines = firstFence(section).split('\n')
  assert.ok(lines.length > 1,
    '--block fence has too few lines to hold a framed block plus a trailing line')
  const framed = lines.slice(0, -1).join('\n')
  assert.equal(framed, renderBlock(moon, 'north'),
    'README --block fence (minus its next-full-moon line) no longer matches ' +
    'renderBlock(readmeMoon(), "north")')
})

// T-134 — the north/south sweep table under "Why this one" is the block RETRO.md's
// incident actually happened in: a captured "waning gibbous" row was hand-edited to
// read "full", and all 131 tests stayed green because nothing parsed the table. This
// test reconstructs every row's two halves by content (see parseRenderedRun) and
// checks, per row: the south disc is exactly the mirrored north disc; north and south
// agree on percent and phase name; the sequence of phase names down the table walks
// astro.js's PHASE_NAMES in cycle order; and — the clause that actually matters, see
// the band-search note below — SOME illumination inside the row's own displayed-percent
// rounding band reproduces the row's exact north disc through the shipping renderLine.
//
// Band search, not a single sample. An earlier version of this test sampled only the
// band's centre, illumination = pct / 100. That is a single point, not the band the
// acceptance criterion actually names, and it produced a false positive: it accepted
// this table only because every row's true source illumination happened to land near
// that centre, and it REJECTED an honestly-regenerated row whose true illumination
// (e.g. k = 0.046, which legitimately displays as "5%") was slightly off-centre. A
// correct README must not be rejected because a real time sweep doesn't land on exact
// hundredths.
//
// The fix is to search the whole band instead of assuming where in it the real sample
// sits, and to never assume *how* render.js turns a fraction into a whole percent
// (Math.round vs floor vs ceil is deliberately not assumed anywhere below — the
// shipping renderer alone decides what percent a candidate illumination displays as).
// The only numeric fact borrowed from render.js is the scale factor that defines what
// "one whole percentage point" means in illumination-fraction units: illumField's
// `Math.round(clamp(...) * 100)` (src/render.js:235) turns a 0..1 fraction into a 0..100
// percent via `* 100`, so one percentage point is 1/100 of illumination. Whichever
// single-step discretization render.js uses (nearest / floor / ceil), the interval of
// illuminations displaying as a given whole percent is contained within one full
// percentage point either side of pct/100 — floor's interval is [pct, pct+1)/100,
// ceil's is (pct-1, pct]/100, nearest's is [pct-0.5, pct+0.5)/100, all subsets of
// [pct-1, pct+1]/100. Sweeping that superset at fine resolution and asking the real
// renderer, for each candidate, "what percent do you print, and what disc do you draw"
// asserts nothing about which rounding rule is in use — only that the renderer really
// can produce this exact row. That comfortably beats the tightest measured interior
// margin (0.176 percentage points on the 5% row) and handles the 0%/100% rows honestly:
// their bands clip against the physical domain k in [0,1] rather than being carved out
// as special cases.
const PCT_SCALE = 100 // src/render.js:235 — illumField's `... * 100`
const BAND_RADIUS = 1 / PCT_SCALE // one whole percentage point, in illumination units
const BAND_STEPS = 400 // ~0.005 percentage points per step across a 2pp-wide band

test('T-134 — README north/south sweep table rows are self-consistent and reproducible', () => {
  const moon = readmeMoon()
  const section = readmeSection('Why this one')
  const lines = firstFence(section).split('\n')
  assert.ok(lines.length > 1,
    'sweep-table fence has too few lines to hold a header plus data rows')
  const rows = lines.slice(1).filter((l) => l.length > 0)
  assert.ok(rows.length > 0, 'sweep table has no data rows below its header')

  // Two illuminations, both taken from README's own parsed cycleFraction rather than
  // typed in: min(cf, 1-cf) always lands in the waxing (first) half of the cycle and
  // max(cf, 1-cf) always lands in the waning (second) half, whichever half the
  // README's own example moon happens to be in.
  const waxingCycleFraction = Math.min(moon.cycleFraction, 1 - moon.cycleFraction)
  const waningCycleFraction = Math.max(moon.cycleFraction, 1 - moon.cycleFraction)
  assert.ok(waxingCycleFraction < 0.5 && waningCycleFraction >= 0.5,
    'could not derive a waxing- and a waning-side cycleFraction from readmeMoon()')

  const cycleIndices = []
  for (const row of rows) {
    const north = parseRenderedRun(row)
    const southRun = north.rest.replace(/^ +/, '')
    assert.ok(southRun.length > 0,
      `row has no south half following the north name: ${JSON.stringify(row)}`)
    const south = parseRenderedRun(southRun)
    assert.equal(south.rest, '',
      `row has unparsed trailing text after its south half: ${JSON.stringify(row)}`)

    assert.equal(south.disc, mirrorDisc(north.disc),
      `south disc is not the exact mirror of the north disc: ${JSON.stringify(row)}`)
    assert.equal(south.illum, north.illum,
      `north and south disagree on illumination percent: ${JSON.stringify(row)}`)
    assert.equal(south.name, north.name,
      `north and south disagree on phase name: ${JSON.stringify(row)}`)

    const pct = Number(north.illum.replace('%', '').trim())
    assert.ok(Number.isFinite(pct), `could not parse a percent out of ${JSON.stringify(north.illum)}`)
    const waxing = !north.name.includes('waning')
    const cycleFraction = waxing ? waxingCycleFraction : waningCycleFraction

    const lo = Math.max(0, pct / PCT_SCALE - BAND_RADIUS)
    const hi = Math.min(1, pct / PCT_SCALE + BAND_RADIUS)
    let found = false
    for (let i = 0; i <= BAND_STEPS && !found; i++) {
      const candidate = lo + ((hi - lo) * i) / BAND_STEPS
      const sample = renderLine({ illumination: candidate, cycleFraction, phaseName: north.name }, 'north')
      const parsedSample = parseRenderedRun(sample)
      const samplePct = Number(parsedSample.illum.replace('%', '').trim())
      if (samplePct === pct && parsedSample.disc === north.disc) found = true
    }
    assert.ok(found,
      `no illumination in the ${pct}% row's own rounding band [${lo}, ${hi}] renders ` +
      `both that exact percent and that exact north disc through renderLine: ` +
      JSON.stringify(row))

    cycleIndices.push(PHASE_NAMES.indexOf(north.name))
  }

  // The table sweeps once around the cycle, so consecutive rows' PHASE_NAMES indices
  // must be non-decreasing except for a single wrap back to "new" at the very end.
  let wrapped = false
  for (let i = 1; i < cycleIndices.length; i++) {
    if (cycleIndices[i] >= cycleIndices[i - 1]) continue
    assert.ok(!wrapped && cycleIndices[i] === PHASE_NAMES.indexOf('new'),
      'sweep table breaks PHASE_NAMES cycle order between rows ' +
      `${JSON.stringify(rows[i - 1])} and ${JSON.stringify(rows[i])}`)
    wrapped = true
  }
})

// T-135 — the check above is an ORDER check only: it walks PHASE_NAMES and accepts any
// row sequence that doesn't go backwards. Retyping a row's name to an ADJACENT name
// that still preserves cycle order slips straight through it, and through every other
// check above too — south-mirrors-north, north/south agree with each other, and the
// band search, which only asks whether SOME illumination in the row's own band
// reproduces the row's disc under the row's CLAIMED name. None of that ever asks
// whether the shipping product would actually have LABELLED that disc with that name.
// The 51% row read "first quarter"; hand-retyped to "waxing gibbous" (still later in
// PHASE_NAMES order, so the order check is happy) the whole suite above stays green.
// That is the same defect family as the shipped v0.1.0 "full" row (RETRO.md lines
// 38-43), one notch subtler: this one needs the table itself, not just a table row, to
// be self-inconsistent before anything notices.
//
// The fix asks the shipping product, not the table: which (phase name, displayed
// percent) PAIRS can `computeMoon` + `renderLine` actually produce together, for a real
// Date instant? A row's pair must be a member of that reachable set. Membership, not a
// per-name min/max range — the true ranges overlap (e.g. "first quarter" and "waxing
// gibbous" both cover 56%, per src/astro.js's INSTANT_TOLERANCE_DAYS window landing on
// either side of a true quarter instant with slightly different illumination each
// time), so a range check would wave the 51% "waxing gibbous" mutant straight through.
//
// The sweep instant is a fixed hardcoded constant, never Date.now(): the reachable set
// must be identical on every run, or a passing suite today could fail tomorrow for no
// code reason. Percent is read back through parseRenderedRun on renderLine's own
// output, exactly like every README row below — never a hand computed
// Math.round(illumination * 100), which would smuggle in the one assumption (the
// rounding rule) the T-134 comment above goes out of its way never to make.
//
// T-136 — the guard above (originally: check membership in ONE flat 35-day/15-minute
// sweep) turns RED on an honest README regeneration. It asserts membership in a SAMPLED
// set as if the set were complete, and it is not: a real computeMoon(date) instant can
// legitimately produce a (name, percent) pair the sweep never happened to visit. Cycle
// 40 hit this for real — a correct "waxing gibbous| 55%" row was rejected because no
// instant in the 35-day window renders 55% at that name.
//
// The tempting fix, widen the sweep, DOES NOT WORK: the reachable-pair set keeps growing
// with the search window and never stops. Measured against this file's own
// buildReachableSet, sweeping from the same REACHABILITY_SWEEP_START_MS (all counts
// verified against the code as committed here — see the measurement commands in
// .swarm/runs/c41-measure.js and this comment's own trailer):
//
//   step   span     computeMoon calls   distinct pairs
//   15m    35d            3,361              208
//   15m   400d           38,401              212
//   10m   600d           86,401              212
//    5m    30y        3,153,601              213
//    1m    10y        5,256,001              212   (213th pair still absent)
//
// A 5.26-million-sample, ten-year, one-minute sweep still does not contain every pair a
// correct README could show. There is no window constant that closes this by being
// bigger. So this guard makes NO completeness claim: it does not assert "this pair is
// impossible", only "this pair was not found within the stated search effort." Below
// that ceiling, a rejected row might be an honest regeneration; a future editor who hits
// that must re-run .swarm/runs/c41-measure.js (or widen ESCALATED_SPAN_MS directly) to
// confirm whether the missing pair shows up in a larger sweep before concluding the row
// is actually wrong.
//
// What DOES survive arbitrary widening is the guard's power to catch the defect it
// exists for — a phase name retyped to an adjacent, cycle-order-preserving name. Three
// such mutants (a 51% "first quarter" retyped to "waxing gibbous", a 63% "waning
// gibbous" retyped to "waning crescent", a 69% "waxing gibbous" retyped to "first
// quarter") were checked against the 1-minute/10-year, 5.26-million-sample sweep above
// and NONE of them ever appears. A retyped name lands on a percent that pairing never
// actually produces at that name, at any distance from J2000; only genuine renderer
// output does. So completeness is unreachable, but discrimination is not — this guard
// still does its one job.
//
// SHAPE: escalate on failure, not a wider flat sweep. Checking every row against the
// full 400-day sweep on every run would tax the whole suite for a case that essentially
// never happens (a hand-regenerated README landing outside the cheap window). Instead:
// run the CHEAP sweep first (same 35-day/15-minute window as before — one full synodic
// month, per the original T-135 sizing rationale, still true and unchanged) for every
// row; only for a row that MISSES the cheap sweep, lazily build a WIDER sweep (400 days
// at the same 15-minute step — chosen because it already contains both measured honest
// cases below and, per the table above, adding span or shrinking step past this point
// buys no additional coverage of the mutant family) and check that row against it
// instead of failing outright. A genuinely retyped name still fails: it isn't in the
// cheap set OR the escalated set, exactly like the mutant sweep above. An honest but
// sample-missed row now passes, because the escalated sweep does contain it — verified
// for the two cases that actually forced this fix, "first quarter| 44%" (2026-02-24T00:
// 28:00Z) and "waxing gibbous| 55%" (2026-05-23T23:11:00Z): both absent from the cheap
// 35-day set, both present in the 400-day escalated set.
//
// Cost: the escalated sweep only ever runs when at least one row misses the cheap sweep,
// and it runs at most ONCE per test (memoized), not once per missing row. Measured
// against this file's own code with `node --test --test-name-pattern="T-135/T-136"
// test/regressions.test.js` (this test in isolation, so the number is this test's own
// cost, not the whole suite's): green path (no row misses the cheap sweep — true for the
// README as shipped) pays only the cheap sweep, measured at ~70ms. A row that misses the
// cheap sweep and IS found by the escalated sweep (the H1/H2 cases above) pays the
// escalated sweep once, measured at ~505ms more. A genuinely retyped row (mutant M1, run
// the same way) pays the escalated sweep once and then fails — measured RED path runtime
// ~535ms total, not the 36.5-second or 58-second costs the wider flat-sweep table above
// would imply; the escalation window was deliberately kept at 400 days (not 30y or 10y)
// so that even the RED path stays a fraction of a second. Exact numbers for the code as
// committed are in this file's companion return; re-run .swarm/runs/c41-measure.js
// against HEAD to reproduce the reachable-set side of them.
const REACHABILITY_SWEEP_START_MS = Date.UTC(2026, 0, 1) // fixed instant, never Date.now()
const REACHABILITY_STEP_MS = 15 * 60 * 1000 // 15 minutes
const REACHABILITY_SPAN_MS = 35 * 24 * 60 * 60 * 1000 // > one synodic month — cheap, common-case sweep

const ESCALATED_STEP_MS = 15 * 60 * 1000 // same resolution as the cheap sweep
const ESCALATED_SPAN_MS = 400 * 24 * 60 * 60 * 1000 // measured to contain both known honest
// misses (H1 "first quarter| 44%", H2 "waxing gibbous| 55%") and to still exclude all
// three known adjacent-retype mutants — see the comment above for the measured table.

// Builds the (phaseName, displayed-percent) reachable set over [startMs, startMs+spanMs]
// at the given step. Keyed on the exact illum field text parseRenderedRun returns
// (already zero-padded, e.g. "  3%"), so this is compared to README rows on identical
// terms with no separate percent-parsing logic to drift out of sync with
// parseRenderedRun.
function buildReachableSet (startMs, stepMs, spanMs) {
  const reachable = new Set()
  const steps = Math.floor(spanMs / stepMs)
  for (let i = 0; i <= steps; i++) {
    const instant = new Date(startMs + i * stepMs)
    const moon = computeMoon(instant)
    const run = parseRenderedRun(renderLine(moon, 'north'))
    reachable.add(run.name + '|' + run.illum)
  }
  return reachable
}

test('T-135/T-136 — every sweep-table row is a (name, percent) pair the shipping renderer can actually produce', () => {
  const section = readmeSection('Why this one')
  const lines = firstFence(section).split('\n')
  const rows = lines.slice(1).filter((l) => l.length > 0)
  assert.ok(rows.length > 0, 'sweep table has no data rows below its header')

  const cheap = buildReachableSet(REACHABILITY_SWEEP_START_MS, REACHABILITY_STEP_MS, REACHABILITY_SPAN_MS)
  // Built at most once, and only if some row actually misses the cheap sweep — see the
  // cost paragraph above.
  let escalated = null

  for (const row of rows) {
    const north = parseRenderedRun(row)
    const key = north.name + '|' + north.illum
    if (cheap.has(key)) continue
    if (!escalated) {
      escalated = buildReachableSet(REACHABILITY_SWEEP_START_MS, ESCALATED_STEP_MS, ESCALATED_SPAN_MS)
    }
    assert.ok(escalated.has(key),
      `no instant in either the ${REACHABILITY_SPAN_MS / 86400000}-day cheap sweep or the ` +
      `${ESCALATED_SPAN_MS / 86400000}-day escalated sweep makes the shipping renderer ` +
      `pair "${north.illum.trim()}" with "${north.name}". Two honest explanations, in ` +
      'order: (1) this row IS a retyped-name defect (the T-135 guard) — check the name ' +
      'against an adjacent PHASE_NAMES entry; (2) this is a genuine renderer output the ' +
      `escalated window is simply too narrow to find — re-run ` +
      '.swarm/runs/c41-measure.js with a wider span/finer step to check before assuming ' +
      `(1): ${JSON.stringify(row)}`)
  }
})
