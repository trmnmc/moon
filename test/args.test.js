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
    compact: false,
    help: false,
  });
});

test('undefined argv is treated as no arguments', () => {
  assert.deepStrictEqual(parseArgs(undefined), {
    json: false,
    hemisphere: null,
    block: false,
    compact: false,
    help: false,
  });
});

test('--json', () => {
  assert.deepStrictEqual(parseArgs(['--json']), {
    json: true,
    hemisphere: null,
    block: false,
    compact: false,
    help: false,
  });
});

test('--block', () => {
  assert.deepStrictEqual(parseArgs(['--block']), {
    json: false,
    hemisphere: null,
    block: true,
    compact: false,
    help: false,
  });
});

test('--south', () => {
  assert.deepStrictEqual(parseArgs(['--south']), {
    json: false,
    hemisphere: 'south',
    block: false,
    compact: false,
    help: false,
  });
});

test('--north', () => {
  assert.deepStrictEqual(parseArgs(['--north']), {
    json: false,
    hemisphere: 'north',
    block: false,
    compact: false,
    help: false,
  });
});

test('--help', () => {
  assert.deepStrictEqual(parseArgs(['--help']), {
    json: false,
    hemisphere: null,
    block: false,
    compact: false,
    help: true,
  });
});

test('-h is an alias for --help', () => {
  assert.deepStrictEqual(parseArgs(['-h']), parseArgs(['--help']));
  assert.strictEqual(parseArgs(['-h']).help, true);
});

test('the returned object has exactly the five contract keys', () => {
  assert.deepStrictEqual(Object.keys(parseArgs(['--json', '--south'])).sort(), [
    'block',
    'compact',
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
  const expected = { json: true, hemisphere: 'south', block: true,
    compact: false, help: true };
  assert.deepStrictEqual(parseArgs(['--json', '--south', '--block', '--help']), expected);
  assert.deepStrictEqual(parseArgs(['--help', '--block', '--south', '--json']), expected);
  assert.deepStrictEqual(parseArgs(['--block', '--json', '-h', '--south']), expected);
});

test('--json --block together (both requested, caller decides precedence)', () => {
  assert.deepStrictEqual(parseArgs(['--json', '--block']), {
    json: true,
    hemisphere: null,
    block: true,
    compact: false,
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
    compact: false,
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

// node:util wraps the offending token in ITS OWN single quotes inside its
// ERR_PARSE_ARGS_* messages, so a naive "first quoted span" regex breaks whenever the
// token itself is empty, is a lone apostrophe, or contains one. toUsageError must
// recover the TRUE token in every one of those shapes, not just the common case.
test('an empty positional argument still names a token in the error, not a dangling sentence', () => {
  assert.throws(
    () => parseArgs(['']),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.strictEqual(
        err.message,
        "unexpected argument '' - moon takes no positional arguments; run 'moon --help' to see the available options",
      );
      return true;
    },
  );
});

test('a token containing an apostrophe is named in full, not truncated at the apostrophe', () => {
  assert.throws(
    () => parseArgs(["it's"]),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.strictEqual(
        err.message,
        "unexpected argument 'it's' - moon takes no positional arguments; run 'moon --help' to see the available options",
      );
      return true;
    },
  );
});

test('a token wrapped in its own apostrophes is named with those apostrophes intact', () => {
  assert.throws(
    () => parseArgs(["'x'"]),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.strictEqual(
        err.message,
        "unexpected argument ''x'' - moon takes no positional arguments; run 'moon --help' to see the available options",
      );
      return true;
    },
  );
});

test('a token with an apostrophe in the middle is named in full', () => {
  assert.throws(
    () => parseArgs(["a'b'c"]),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.strictEqual(
        err.message,
        "unexpected argument 'a'b'c' - moon takes no positional arguments; run 'moon --help' to see the available options",
      );
      return true;
    },
  );
});

test('a token that is a single lone apostrophe is named, not dropped', () => {
  assert.throws(
    () => parseArgs(["'"]),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.strictEqual(
        err.message,
        "unexpected argument ''' - moon takes no positional arguments; run 'moon --help' to see the available options",
      );
      return true;
    },
  );
});

// These tokens contain no apostrophes, so the fix for the cases above must not perturb
// them: pinned to the exact pre-existing message so a future change to the recovery
// regex (or to node:util's own wording, across a Node upgrade) is caught immediately.
test('token recovery stays byte-identical for tokens with no apostrophes', () => {
  const expected = [
    [['bogus'], "unexpected argument 'bogus' - moon takes no positional arguments; run 'moon --help' to see the available options"],
    [['   '], "unexpected argument '   ' - moon takes no positional arguments; run 'moon --help' to see the available options"],
    [['-'], "unexpected argument '-' - moon takes no positional arguments; run 'moon --help' to see the available options"],
    [['--bogus'], "unknown option '--bogus' - run 'moon --help' to see the available options"],
    [['-x'], "unknown option '-x' - run 'moon --help' to see the available options"],
    [['--json=1'], "option '--json' is a flag and takes no value - run 'moon --help' to see the available options"],
    [['--jsno'], "unknown option '--jsno' - run 'moon --help' to see the available options"],
    [['--sotuh'], "unknown option '--sotuh' - run 'moon --help' to see the available options"],
    [['--helpp'], "unknown option '--helpp' - run 'moon --help' to see the available options"],
    [['---'], "unknown option '---' - run 'moon --help' to see the available options"],
    [['--='], "unknown option '--=' - run 'moon --help' to see the available options"],
    [['-jh'], "unknown option '-j' - run 'moon --help' to see the available options"],
    [['-h=2'], "unknown option '-=' - run 'moon --help' to see the available options"],
  ];
  for (const [argv, message] of expected) {
    assert.throws(
      () => parseArgs(argv),
      (err) => {
        assert.strictEqual(err.code, 'EUSAGE', `${JSON.stringify(argv)} -> code`);
        assert.strictEqual(err.message, message, `${JSON.stringify(argv)} -> message`);
        return true;
      },
      `${JSON.stringify(argv)} should stay byte-identical`,
    );
  }
});

// Pins the assumption toUsageError's token recovery relies on: each of the three
// ERR_PARSE_ARGS_* messages we translate contains exactly one quoted span, so a greedy
// match anchored on the first and last quote in the string is safe. If a future Node
// version adds a second quoted span to any of these messages (e.g. a "did you mean"
// suggestion), this test fails loudly instead of the recovery silently mis-parsing.
test('node:util ERR_PARSE_ARGS_* messages contain exactly one quoted span (pins the assumption toUsageError relies on)', () => {
  const { parseArgs: nodeParseArgs } = require('node:util');
  const options = {
    json: { type: 'boolean' },
    south: { type: 'boolean' },
    north: { type: 'boolean' },
    block: { type: 'boolean' },
    compact: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  };
  const probes = [
    { args: [''], code: 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL' },
    { args: ['--bogus'], code: 'ERR_PARSE_ARGS_UNKNOWN_OPTION' },
    { args: ['--json=1'], code: 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE' },
  ];
  for (const { args, code } of probes) {
    try {
      nodeParseArgs({ args, options, strict: true, allowPositionals: false, tokens: true });
      assert.fail(`expected ${JSON.stringify(args)} to throw`);
    } catch (err) {
      assert.strictEqual(err.code, code);
      const quoteCount = (err.message.match(/'/g) || []).length;
      assert.strictEqual(
        quoteCount,
        2,
        `expected exactly one quoted span (2 quote chars) in: ${JSON.stringify(err.message)}`,
      );
    }
  }
});

// A token containing a newline: the PRE-EXISTING `[^']+` rule already matched newlines
// (character classes are not newline-limited the way "." is), so this was never a
// one-line message to begin with for this input - node:util embeds the raw newline
// itself. `s` (dotAll) on the new regex exists to keep that exact pre-existing behavior
// rather than regress it, since plain `.` alone would stop at the newline. This is a
// parity test, not a new-behavior test: it is expected to pass under both the old rule
// and the new one, which is exactly what it proves.
test('a token containing a newline is still recovered in full, matching pre-fix behavior', () => {
  assert.throws(
    () => parseArgs(['a\nb']),
    (err) => {
      assert.strictEqual(err.code, 'EUSAGE');
      assert.strictEqual(
        err.message,
        "unexpected argument 'a\nb' - moon takes no positional arguments; " +
          "run 'moon --help' to see the available options",
      );
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
    compact: false,
    help: false,
  });
});
