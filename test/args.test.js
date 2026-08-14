'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { parseArgs } = require('../src/args.js');

// These tests are timezone-independent by construction: parseArgs never reads the clock
// or the host zone. `hemisphere: null` is the contract's "auto-detect later" sentinel,
// and resolving it is src/hemisphere.js's job, tested there with TZ pinned.

test('no arguments: every flag off, hemisphere null', () => {
  assert.deepStrictEqual(parseArgs([]), {
    json: false,
    hemisphere: null,
    block: false,
    help: false,
  });
});

test('undefined argv is treated as no arguments', () => {
  assert.deepStrictEqual(parseArgs(undefined), {
    json: false,
    hemisphere: null,
    block: false,
    help: false,
  });
});

test('--json', () => {
  assert.deepStrictEqual(parseArgs(['--json']), {
    json: true,
    hemisphere: null,
    block: false,
    help: false,
  });
});

test('--block', () => {
  assert.deepStrictEqual(parseArgs(['--block']), {
    json: false,
    hemisphere: null,
    block: true,
    help: false,
  });
});

test('--south', () => {
  assert.deepStrictEqual(parseArgs(['--south']), {
    json: false,
    hemisphere: 'south',
    block: false,
    help: false,
  });
});

test('--north', () => {
  assert.deepStrictEqual(parseArgs(['--north']), {
    json: false,
    hemisphere: 'north',
    block: false,
    help: false,
  });
});

test('--help', () => {
  assert.deepStrictEqual(parseArgs(['--help']), {
    json: false,
    hemisphere: null,
    block: false,
    help: true,
  });
});

test('-h is an alias for --help', () => {
  assert.deepStrictEqual(parseArgs(['-h']), parseArgs(['--help']));
  assert.strictEqual(parseArgs(['-h']).help, true);
});

test('the returned object has exactly the four contract keys', () => {
  assert.deepStrictEqual(Object.keys(parseArgs(['--json', '--south'])).sort(), [
    'block',
    'help',
    'hemisphere',
    'json',
  ]);
});

test('flag values are always real booleans, never undefined', () => {
  const result = parseArgs([]);
  for (const key of ['json', 'block', 'help']) {
    assert.strictEqual(typeof result[key], 'boolean', `${key} should be a boolean`);
  }
  assert.strictEqual(result.hemisphere, null);
});

test('flags combine in any order', () => {
  const expected = { json: true, hemisphere: 'south', block: true, help: true };
  assert.deepStrictEqual(parseArgs(['--json', '--south', '--block', '--help']), expected);
  assert.deepStrictEqual(parseArgs(['--help', '--block', '--south', '--json']), expected);
  assert.deepStrictEqual(parseArgs(['--block', '--json', '-h', '--south']), expected);
});

test('--json --block together (both requested, caller decides precedence)', () => {
  assert.deepStrictEqual(parseArgs(['--json', '--block']), {
    json: true,
    hemisphere: null,
    block: true,
    help: false,
  });
});

// Documented conflict policy: LAST ONE WINS, so a shell alias can be overridden.
test('--south --north together: the last flag on the line wins', () => {
  assert.strictEqual(parseArgs(['--south', '--north']).hemisphere, 'north');
  assert.strictEqual(parseArgs(['--north', '--south']).hemisphere, 'south');
  assert.strictEqual(parseArgs(['--json', '--south', '--block', '--north']).hemisphere, 'north');
  assert.strictEqual(parseArgs(['--north', '--south', '--north', '--south']).hemisphere, 'south');
});

test('conflicting hemisphere flags never throw', () => {
  assert.doesNotThrow(() => parseArgs(['--south', '--north']));
});

test('repeating the same flag is harmless', () => {
  assert.deepStrictEqual(parseArgs(['--json', '--json']), {
    json: true,
    hemisphere: null,
    block: false,
    help: false,
  });
  assert.strictEqual(parseArgs(['--south', '--south']).hemisphere, 'south');
});

test('an unknown long option is a clear usage error, not a stack trace', () => {
  assert.throws(
    () => parseArgs(['--nope']),
    (err) => {
      assert.ok(err instanceof Error);
      assert.strictEqual(err.code, 'EUSAGE');
      assert.match(err.message, /unknown option/i);
      assert.match(err.message, /--nope/);
      assert.match(err.message, /--help/);
      // A usage error is not a bug: the message must be printable on its own, and the
      // stack must not be a wall of internal frames.
      assert.strictEqual(err.message.includes('\n'), false, 'message should be one line');
      assert.strictEqual(err.stack.split('\n').length, 1, 'stack should not name internals');
      assert.ok(!/node:internal/.test(err.stack));
      return true;
    },
  );
});

test('an unknown short option is a clear usage error', () => {
  assert.throws(
    () => parseArgs(['-x']),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.match(err.message, /unknown option/i);
      assert.match(err.message, /-x/);
      return true;
    },
  );
});

test('a near-miss typo of a real flag still errors rather than silently doing nothing', () => {
  for (const typo of ['--jsno', '--sotuh', '--Json', '--helpp', '--blocks']) {
    assert.throws(
      () => parseArgs([typo]),
      (err) => err.code === 'EUSAGE' && err.message.includes(typo),
      `${typo} should be rejected`,
    );
  }
});

test('an unknown flag mixed in with valid flags still errors', () => {
  assert.throws(() => parseArgs(['--json', '--bogus', '--south']), { code: 'EUSAGE' });
});

test('positional arguments are rejected with a clear message', () => {
  assert.throws(
    () => parseArgs(['tomorrow']),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.match(err.message, /tomorrow/);
      assert.match(err.message, /positional/i);
      return true;
    },
  );
});

test('passing a value to a boolean flag is rejected with a clear message', () => {
  assert.throws(
    () => parseArgs(['--json=yes']),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.match(err.message, /--json/);
      assert.match(err.message, /takes no value/i);
      return true;
    },
  );
});

test('every usage error carries code EUSAGE and a one-line message', () => {
  for (const argv of [['--nope'], ['-x'], ['stray'], ['--json=1'], ['--south', 'extra']]) {
    assert.throws(
      () => parseArgs(argv),
      (err) => {
        assert.strictEqual(err.code, 'EUSAGE', `${argv.join(' ')} -> code`);
        assert.ok(err.message.length > 0);
        assert.strictEqual(err.message.includes('\n'), false, `${argv.join(' ')} -> one line`);
        return true;
      },
      `${argv.join(' ')} should be a usage error`,
    );
  }
});

test('argv is not mutated', () => {
  const argv = ['--json', '--south'];
  const copy = [...argv];
  parseArgs(argv);
  assert.deepStrictEqual(argv, copy);
});

test('-- terminator with nothing after it parses cleanly', () => {
  assert.deepStrictEqual(parseArgs(['--json', '--']), {
    json: true,
    hemisphere: null,
    block: false,
    help: false,
  });
});
