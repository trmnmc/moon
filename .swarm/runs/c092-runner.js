'use strict'
// Scratch runner for QA capture. Spawns bin/moon.js with a given TZ and args,
// writes stdout/stderr/exit code to files under .swarm/runs/, prefix c092-.
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const [, , tag, tz, ...extraArgs] = process.argv
if (!tag) {
  console.error('usage: node c092-runner.js <tag> [TZ] [-- args...]')
  process.exit(2)
}

const env = Object.assign({}, process.env)
if (tz) env.TZ = tz
else delete env.TZ

const moonPath = path.join(__dirname, '..', '..', 'bin', 'moon.js')
const result = spawnSync(process.execPath, [moonPath, ...extraArgs], { env, encoding: 'buffer' })

const outDir = __dirname
fs.writeFileSync(path.join(outDir, `c092-${tag}.out`), result.stdout)
fs.writeFileSync(path.join(outDir, `c092-${tag}.err`), result.stderr)
fs.writeFileSync(path.join(outDir, `c092-${tag}.exit`), String(result.status) + '\n')
console.log(`${tag}: exit=${result.status} stdout_bytes=${result.stdout.length} stderr_bytes=${result.stderr.length}`)
