'use strict';
// c092 live-look scratch: run the CLI many ways, print exact results.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const bin = path.join(__dirname, '..', '..', 'bin', 'moon.js');

function run(args, env) {
  const r = spawnSync(process.execPath, [bin, ...args], {
    env: { ...process.env, ...(env || {}) },
    encoding: 'utf8',
  });
  return r;
}

const cases = [
  { args: [] },
  { args: ['--jsno'] },
  { args: ['foo'] },
  { args: ['--json=1'] },
  { args: ['-x'] },
  { args: ['--south=north'] },
  { args: ['--', '--json'] },
  { args: ['--json', '--block', '--compact'] },
  { args: ['--block', '--compact'] },
  { args: ['--compact'] },
  { args: ['--json', '--help'] },
  { args: ['--south'] },
  { args: ['--north'] },
  { args: ['--south', '--north'] },
  { args: [], env: { TZ: 'Australia/Sydney' } },
  { args: ['--json'], env: { TZ: 'Australia/Sydney' } },
  { args: ['--json'], env: { TZ: 'America/New_York' } },
];

for (const c of cases) {
  const r = run(c.args, c.env);
  console.log('=== args=' + JSON.stringify(c.args) + (c.env ? ' env=' + JSON.stringify(c.env) : ''));
  console.log('exit=' + r.status);
  console.log('stdout=' + JSON.stringify(r.stdout));
  console.log('stderr=' + JSON.stringify(r.stderr));
}
