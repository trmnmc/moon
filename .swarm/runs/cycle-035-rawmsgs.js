// Conductor gate, step 1 of 2: measure node:util's RAW messages directly.
// Independent of anything the builder wrote. No regex is used here.
const { parseArgs } = require('node:util');

const OPTIONS = {
  json: { type: 'boolean' },
  south: { type: 'boolean' },
  north: { type: 'boolean' },
  block: { type: 'boolean' },
  compact: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

const CASES = [
  [''], ['   '], ['bogus'], ['-'], ["it's"], ["'"], ["''"], ["'x'"], ["a'b'c"],
  ['--bogus'], ['-x'], ['--json=1'], ['--jsno'], ['--sotuh'], ['--helpp'],
  ['---'], ['--='], ['-jh'], ['-h=2'],
  // cases the builder never saw
  ["--json='x'"], ["a'b", "c'd"], ['--json', "it's"], ["'''"], ['a\nb'],
  ["--json=it's"], ["  'x'  "], ['\\'], ["--it's"], ['--json=', ''],
  ['–json'], ["don't", '--json'],
];

console.log('node', process.version);
for (const argv of CASES) {
  let out;
  try {
    parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false, tokens: true });
    out = 'NO THROW';
  } catch (err) {
    const quotes = (err.message.match(/'/g) || []).length;
    out = `${err.code} | quotes=${quotes} | ${JSON.stringify(err.message)}`;
  }
  console.log(JSON.stringify(argv).padEnd(24), out);
}
