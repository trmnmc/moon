// Conductor measurement, cycle 29. Hostile / edge CLI input matrix.
// Runs the REAL binary as a user would. Reports exit status, stdout/stderr shape.
// Nothing in the repo is modified.
const { spawnSync } = require('node:child_process');

const BIN = '/opt/targets/moon/bin/moon.js';

// L-010: read .status/.stderr directly off spawnSync, never through a shell pipe.
function run(argv, env) {
  const r = spawnSync(process.execPath, [BIN].concat(argv), {
    encoding: 'utf8',
    env: Object.assign({}, process.env, env || {}),
  });
  return {
    status: r.status,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
  };
}

const CASES = [
  ['baseline',                []],
  ['--json',                  ['--json']],
  ['--help',                  ['--help']],
  ['contradictory  N then S', ['--north', '--south']],
  ['contradictory  S then N', ['--south', '--north']],
  ['repeated flag',           ['--json', '--json']],
  ['empty-string arg',        ['']],
  ['bare double dash',        ['--']],
  ['unknown flag',            ['--bogus']],
  ['unknown short flag',      ['-x']],
  ['flag-like value',         ['--json=yes']],
  ['positional arg',          ['tuesday']],
  ['unicode arg',             ['–json']],
  ['very long arg',           ['--' + 'a'.repeat(500)]],
  ['TZ unset',                [], { TZ: undefined }],
  ['TZ empty',                [], { TZ: '' }],
  ['TZ bogus name',           [], { TZ: 'Not/AZone' }],
  ['TZ southern',             [], { TZ: 'Pacific/Auckland' }],
  ['TZ equator-straddling',   [], { TZ: 'America/Bogota' }],
];

let clean = 0, dirty = 0;
for (const [label, argv, env] of CASES) {
  const r = run(argv, env);
  // A "clean" outcome = exit 0 with output, or a nonzero exit with a stderr MESSAGE.
  // A "dirty" outcome = a stack trace, or a nonzero exit with nothing said.
  const trace = /\n\s+at\s/.test(r.err) || /^[A-Za-z]*Error:/.test(r.err) === false && r.err.includes('    at ');
  const bad = trace || (r.status !== 0 && r.err === '');
  if (bad) dirty++; else clean++;
  console.log(
    (bad ? 'DIRTY ' : 'ok    ') +
    label.padEnd(24) +
    ' exit=' + String(r.status).padEnd(4) +
    ' stdout=' + String(r.out.split('\n')[0] || '(empty)').slice(0, 46).padEnd(48) +
    ' stderr=' + (r.err.split('\n')[0] || '(empty)').slice(0, 60)
  );
  if (trace) console.log('        ^ STACK TRACE:\n' + r.err.split('\n').slice(0, 4).map(l => '        ' + l).join('\n'));
}
console.log('');
console.log('clean:', clean, ' dirty:', dirty, ' of', CASES.length);
