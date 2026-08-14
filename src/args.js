'use strict';

const { parseArgs: nodeParseArgs } = require('node:util');

/**
 * Flag table. Kept here (rather than inline) so the help text and the parser can never
 * drift apart.
 */
const OPTIONS = {
  json: { type: 'boolean' },
  south: { type: 'boolean' },
  north: { type: 'boolean' },
  block: { type: 'boolean' },
  // Suppresses the next-full-moon line, leaving exactly one line of output.
  // Exists so the MOTD/shell-prompt use case (the primary interface, per SPEC
  // must-have 6) survives the next-full-moon line being on by default.
  compact: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

/**
 * A usage error: something the user typed wrong. Carries `code: 'EUSAGE'` so a caller
 * can distinguish "you typed it wrong, print this and exit 2" from a genuine crash.
 * The message is a complete sentence-free one-liner suitable for printing bare.
 * @param {string} message
 * @returns {Error}
 */
function usageError(message) {
  const err = new Error(message);
  err.code = 'EUSAGE';
  // Usage errors are not bugs: there is nothing useful in the stack, and printing one
  // at a user who typed `--jsno` is noise. Callers that print `err.message` get a clean
  // line; callers that let it bubble get a one-line stack instead of a wall of frames.
  err.stack = `${err.name}: ${message}`;
  return err;
}

/**
 * Translate node:util's ERR_PARSE_ARGS_* errors into a clear, actionable message.
 * @param {Error & {code?: string}} err
 * @returns {Error}
 */
function toUsageError(err) {
  const hint = "run 'moon --help' to see the available options";
  // node:util quotes the offending token in its message; recover it so we can name it.
  const quoted = /'([^']+)'/.exec(err.message);
  const token = quoted ? ` '${quoted[1]}'` : '';

  switch (err.code) {
    case 'ERR_PARSE_ARGS_UNKNOWN_OPTION':
      return usageError(`unknown option${token} - ${hint}`);
    case 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL':
      return usageError(`unexpected argument${token} - moon takes no positional arguments; ${hint}`);
    case 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE':
      return usageError(`option${token} is a flag and takes no value - ${hint}`);
    default:
      // Anything node:util can raise that we have not enumerated still reaches the user
      // as one clean line rather than a stack trace.
      return usageError(`${err.message} - ${hint}`);
  }
}

/**
 * @param {string[]} argv   process.argv.slice(2)
 * @returns {{json:boolean, hemisphere:("north"|"south"|null), block:boolean, help:boolean}}
 *
 * `hemisphere` is `null` when neither `--south` nor `--north` was given, meaning
 * "auto-detect from the system timezone".
 *
 * CONFLICT POLICY - `--south --north` given together: LAST ONE WINS, no error.
 * Rationale: the common case is a user with `alias moon='moon --south'` in their shell
 * profile who wants to override it once with `moon --south --north`. Making that an
 * error would break the only ergonomic way to override an alias, and there is no
 * ambiguity about intent when the flags are ordered. `--south --north` is "north";
 * `--north --south` is "south". Repeats of the same flag are harmless.
 *
 * Throws an Error with `code === 'EUSAGE'` and a single-line message on any malformed
 * input (unknown option, positional argument, value passed to a flag). It never emits a
 * stack trace's worth of noise.
 */
function parseArgs(argv) {
  const args = argv === undefined ? [] : argv;

  let parsed;
  try {
    parsed = nodeParseArgs({
      args,
      options: OPTIONS,
      strict: true,
      allowPositionals: false,
      // Tokens preserve command-line ORDER, which is what makes last-one-wins possible.
      tokens: true,
    });
  } catch (err) {
    throw toUsageError(err);
  }

  // Walk the tokens in order; the final north/south token decides.
  let hemisphere = null;
  for (const token of parsed.tokens) {
    if (token.kind !== 'option') continue;
    if (token.name === 'south') hemisphere = 'south';
    else if (token.name === 'north') hemisphere = 'north';
  }

  return {
    json: parsed.values.json === true,
    hemisphere,
    block: parsed.values.block === true,
    compact: parsed.values.compact === true,
    help: parsed.values.help === true,
  };
}

module.exports = { parseArgs };
