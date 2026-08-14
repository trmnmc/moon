#!/usr/bin/env node
'use strict'

// moon — prints the current phase of the moon.
//
// Thin entry point ONLY. Every real decision lives in src/ as a pure function so it can
// be tested without spawning a process. Conductor-owned file; builders do not edit it.

const { computeMoon } = require('../src/astro.js')
const { detectHemisphere } = require('../src/hemisphere.js')
const { parseArgs } = require('../src/args.js')
const { renderLine, renderBlock } = require('../src/render.js')

const HELP = `moon — the current phase of the moon

usage
  moon [options]

options
  --json      structured output for scripting (stable, documented below)
  --block     multi-line framed readout instead of the single line
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
  julianDay     Julian Day of the observation instant
  timestamp     ISO-8601 instant the reading was computed for

No network access is ever performed.`

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
      illumination: moon.illumination,
      age: moon.age,
      cycleFraction: moon.cycleFraction,
      phaseAngle: moon.phaseAngle,
      hemisphere,
      julianDay: moon.julianDay,
      timestamp: now.toISOString()
    }
    process.stdout.write(JSON.stringify(payload) + '\n')
    return 0
  }

  const out = opts.block ? renderBlock(moon, hemisphere) : renderLine(moon, hemisphere)
  process.stdout.write(out + '\n')
  return 0
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2))
}

module.exports = { main, HELP }
