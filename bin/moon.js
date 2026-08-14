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

const HELP = `moon — the current phase of the moon

usage
  moon [options]

options
  --json      structured output for scripting (stable, documented below)
  --block     multi-line framed readout instead of the single line
  --compact   suppress the next-full-moon line, leaving exactly one line
  --south     force southern-hemisphere rendering
  --north     force northern-hemisphere rendering
  -h, --help  this text

By default the hemisphere is inferred from your system timezone. The lit limb of the
moon faces the opposite way south of the equator, so this matters; if the guess is
wrong for your location, pass --south or --north.

--json fields
  phase         phase name, one of the eight canonical names
  illumination  illuminated fraction of the disc, 0..1
  age           days elapsed since the last new moon
  cycleFraction 0..1 through the synodic month (0 = new, 0.5 = full)
  phaseAngle    degrees, 0..360
  hemisphere    "north" or "south" — the one actually used for rendering
  nextFullMoon  ISO-8601 instant of the next full moon
  julianDay     Julian Day of the observation instant
  timestamp     ISO-8601 instant the reading was computed for

Numeric fields are rounded to the precision the algorithm has actually earned
(phase instants are good to roughly an hour); they are not raw float dumps.

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
  return `${day} ${month}${year}`.trim()
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
    const payload = {
      phase: moon.phaseName,
      illumination: round(moon.illumination, 4),
      age: round(moon.age, 3),
      cycleFraction: round(moon.cycleFraction, 5),
      phaseAngle: round(moon.phaseAngle, 3),
      hemisphere,
      nextFullMoon: nextFullMoon(now).toISOString(),
      julianDay: round(moon.julianDay, 5),
      timestamp: now.toISOString()
    }
    process.stdout.write(JSON.stringify(payload) + '\n')
    return 0
  }

  const lines = []
  if (opts.block) {
    lines.push(renderBlock(moon, hemisphere))
    if (!opts.compact) lines.push(nextFullLine(now, 2))
  } else {
    lines.push(renderLine(moon, hemisphere))
    if (!opts.compact) lines.push(nextFullLine(now, NAME_COLUMN))
  }
  process.stdout.write(lines.join('\n') + '\n')
  return 0
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2))
}

module.exports = { main, HELP }
