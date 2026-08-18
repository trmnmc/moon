#!/usr/bin/env node
'use strict'

// moon — prints the current phase of the moon.
//
// Thin entry point ONLY. Every real decision lives in src/ as a pure function so it can
// be tested without spawning a process. Conductor-owned file; builders do not edit it.

const { computeMoon, nextFullMoon } = require('../src/astro.js')
const { detectHemisphere } = require('../src/hemisphere.js')
const { parseArgs } = require('../src/args.js')
const { renderLine, renderBlock } = require('../src/render.js')

// T-190 — single source of truth for how much PRECISION each --json field carries.
// The payload's round() calls below read their place-counts from here (no duplicated
// numeric literals), and the HELP/README precision paragraph is generated from this
// same table, so the two prose copies and the actual rounding cannot drift apart.
//
// kind: 'rounded' — a float, rounded to `places` decimal places.
// kind: 'instant' — a full-precision ISO-8601 string. NOT rounded, on purpose: see
//                    T-190 — rounding nextFullMoon would still read as exact while
//                    destroying information a --json consumer may legitimately diff.
//                    Precision and accuracy are different properties; `accuracyNote`
//                    (when present) states what the ACCURACY actually is, independent
//                    of how many digits the string carries.
// kind: 'string'  — an exact value with no numeric precision to speak of.
const JSON_FIELD_PRECISION = {
  phase: { kind: 'string' },
  illumination: { kind: 'rounded', places: 4 },
  age: { kind: 'rounded', places: 3 },
  cycleFraction: { kind: 'rounded', places: 5 },
  phaseAngle: { kind: 'rounded', places: 3 },
  hemisphere: { kind: 'string' },
  nextFullMoon: {
    kind: 'instant',
    accuracyNote: "nextFullMoon's accuracy is roughly an hour regardless of how many " +
      'digits the printed instant carries, because the phase-instant algorithm itself ' +
      'is only good to about that.'
  },
  julianDay: { kind: 'rounded', places: 5 },
  timestamp: { kind: 'instant' }
}

// Joins a list the way English prose does: "a", "a and b", "a, b, and c".
function englishList (items) {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

// Greedy word-wrap to `width` columns, matching the manual wrapping used by the rest
// of this file's HELP paragraphs — so generated and hand-written prose look the same.
function wrap (text, width) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && candidate.length > width) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.join('\n')
}

// Builds the "Numeric fields are rounded..." paragraph straight from
// JSON_FIELD_PRECISION, so bin/moon.js's HELP text and README.md can never assert a
// rounding claim the table itself doesn't back up. Both documents embed this exact
// string (see test/cli.test.js), so changing the table is the only way to change it.
function buildPrecisionNote (table) {
  const entries = Object.entries(table)
  const rounded = entries.filter(([, d]) => d.kind === 'rounded')
  const instants = entries.filter(([, d]) => d.kind === 'instant')

  const roundedList = englishList(rounded.map(([name, d]) => `${name} to ${d.places}`))
  const instantList = englishList(instants.map(([name]) => name))
  const accuracyNotes = instants.map(([, d]) => d.accuracyNote).filter(Boolean).join(' ')

  const sentence = 'Numeric fields are rounded to the precision the algorithm has ' +
    `actually earned, not dumped as raw floats — decimal places: ${roundedList}. ` +
    `${instantList} are different: both are ISO-8601 instants, emitted at full ` +
    'precision, unrounded. Full precision is not the same as accuracy — ' +
    `${accuracyNotes}`

  return wrap(sentence, 78)
}

const PRECISION_NOTE = buildPrecisionNote(JSON_FIELD_PRECISION)

const HELP = `moon — the current phase of the moon

usage
  moon [options]

options
  --json      structured output for scripting (stable, documented below)
  --block     multi-line framed readout instead of the single line
  --compact   suppress the next-full-moon line (on its own, exactly one line)
  --south     force southern-hemisphere rendering
  --north     force northern-hemisphere rendering
  -h, --help  this text

The hemisphere is inferred from your system timezone. The lit limb faces the
opposite way south of the equator, so this matters; if the guess is wrong for
where you are, pass --south or --north.

--json fields
  phase         phase name, one of the eight canonical names
  illumination  illuminated fraction of the disc, 0..1
  age           days elapsed since the last new moon
  cycleFraction 0..1 through the synodic month (0 = new, 0.5 = full)
                CAUTION: this is angular (elongation / 360), not elapsed
                time. Mid-cycle it can lead/lag true elapsed time by up to
                ~23.03 hours, so multiplying it by 29.53 to get days is wrong.
                Use the age field for elapsed time. The endpoints do hold:
                at a true new/full moon this is 0 / 0.5 to within ~45 min.
  phaseAngle    elongation in degrees, 0..360: 0 = new, 180 = full
                CAUTION: this is the Moon-Sun elongation, NOT the Meeus phase
                angle i (which is 180 at new). Applying k = (1+cos i)/2 to this
                field returns 1 - illumination, i.e. the exact inverse. Use the
                illumination field; it is already computed for you.
  hemisphere    "north" or "south" — the one actually used for rendering
  nextFullMoon  ISO-8601 instant of the next full moon
  julianDay     Julian Day of the observation instant
  timestamp     ISO-8601 instant the reading was computed for

${PRECISION_NOTE}

No network access is ever performed.`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Local-time date of the next full moon. Local, not UTC: "which night is the full
// moon" is a question about the reader's calendar, not about Greenwich. The year is
// printed only when it differs from the current one — an instrument states what is
// needed and stays quiet otherwise.
function formatFullMoonDate (when, now) {
  const day = String(when.getDate()).padStart(2, ' ')
  const month = MONTHS[when.getMonth()]
  const year = when.getFullYear() === now.getFullYear() ? '' : ` ${when.getFullYear()}`
  // NOT trimmed: the leading pad from padStart is load-bearing. It right-aligns
  // single-digit days under two-digit ones, the same way the illumination column
  // is right-aligned. Trimming it here silently undid the padStart above.
  return `${day} ${month}${year}`
}

// The disc occupies 5 cells, then a space, then a 4-column percentage, then two
// spaces: the phase name therefore begins at column 12. The next-full-moon line is
// indented to that same column so the two lines read as one aligned readout.
const NAME_COLUMN = 12

function nextFullLine (now, indent) {
  const when = nextFullMoon(now)
  return ' '.repeat(indent) + `next full moon  ${formatFullMoonDate(when, now)}`
}

// Round to a precision the algorithm has actually earned. The phase instants are good
// to roughly an hour, so illumination is good to about a percent; emitting 17
// significant digits would be precision theatre, which the spec's taste notes forbid.
function round (value, places) {
  const f = 10 ** places
  return Math.round(value * f) / f
}

function main (argv) {
  let opts
  try {
    opts = parseArgs(argv)
  } catch (err) {
    process.stderr.write(`moon: ${err && err.message ? err.message : String(err)}\n`)
    return 2
  }

  if (opts.help) {
    process.stdout.write(HELP + '\n')
    return 0
  }

  const now = new Date()
  const hemisphere = opts.hemisphere || detectHemisphere()
  const moon = computeMoon(now)

  if (opts.json) {
    const P = JSON_FIELD_PRECISION
    const payload = {
      phase: moon.phaseName,
      illumination: round(moon.illumination, P.illumination.places),
      age: round(moon.age, P.age.places),
      cycleFraction: round(moon.cycleFraction, P.cycleFraction.places),
      phaseAngle: round(moon.phaseAngle, P.phaseAngle.places),
      hemisphere,
      // T-190: emitted at full ISO-8601 precision, on purpose — see JSON_FIELD_PRECISION
      // above. Rounding this would still read as exact while destroying information a
      // --json consumer may legitimately diff; precision and accuracy are not the same.
      nextFullMoon: nextFullMoon(now).toISOString(),
      julianDay: round(moon.julianDay, P.julianDay.places),
      timestamp: now.toISOString()
    }
    process.stdout.write(JSON.stringify(payload) + '\n')
    return 0
  }

  const lines = []
  if (opts.block) {
    lines.push(renderBlock(moon, hemisphere))
    // 3, not 2: the block's own label column starts at column 4 (frame char +
    // two spaces), so an indent of 2 put this line one column to its left.
    if (!opts.compact) lines.push(nextFullLine(now, 3))
  } else {
    lines.push(renderLine(moon, hemisphere))
    if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))
  }
  process.stdout.write(lines.join('\n') + '\n')
  return 0
}

if (require.main === module) {
  // T-165 — a downstream reader that closes its end of the pipe before reading any
  // byte (e.g. `moon | head -1` once head has already exited) makes
  // process.stdout.write() return successfully; the broken pipe only surfaces
  // afterwards, asynchronously, as an 'error' event on the stream. With no listener,
  // Node's default is to throw that as an uncaught exception: a stack trace on stderr
  // and exit 1, for a condition that is not this program's error. README:171 documents
  // exactly two exit codes, {0, 2} — a closed downstream reader must not invent a third
  // code, nor overwrite one the run already earned.
  // This must be installed before main() runs, so it is in place before the first write.
  //
  // Swallow only — the handler deliberately does NOT touch process.exitCode. Pipes are
  // asynchronous on POSIX, so this fires from the event loop, strictly AFTER the
  // synchronous `process.exitCode = main(...)` below has already stored main's verdict:
  // 0 for a successful render, 2 for a usage error. Silencing the event therefore keeps
  // exactly that verdict. Forcing 0 here would be a no-op on the success path it was
  // written for, and would silently rewrite a documented exit 2 into 0 whenever stderr
  // shares the dead pipe (`moon --nope 2>&1 | head`) — a documented exit code must not
  // depend on whether the reader is still alive.
  const silenceClosedPipe = (stream) => {
    stream.on('error', (err) => {
      if (err && err.code === 'EPIPE') return
      // Anything else is a genuine stream fault, not a closed reader: let it surface
      // exactly as it would with no listener installed at all.
      throw err
    })
  }
  silenceClosedPipe(process.stdout)
  silenceClosedPipe(process.stderr)

  process.exitCode = main(process.argv.slice(2))
}

module.exports = { main, HELP, JSON_FIELD_PRECISION, PRECISION_NOTE, round }
