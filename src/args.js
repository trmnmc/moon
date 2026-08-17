'use strict';

const { parseArgs: nodeParseArgs } = require('node:util');

/**
 * Flag table. This is the single source of truth for which flags moon accepts. The
 * `options` block in bin/moon.js's HELP string and the README's `## Options` table are
 * independent restatements of it, not derived from it, so nothing here structurally
 * prevents them from drifting. test/cli.test.js parses this object's keys and both of
 * those documents at test time and asserts the three agree; that test is the only
 * thing holding them in sync.
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
  // node:util quotes the offending token in its message with ITS OWN single quotes, so
  // the token itself may contain apostrophes (or be empty, or be a lone apostrophe) and
  // still be wrapped correctly - e.g. `it's` -> "...argument 'it's'...", `'x'` ->
  // "...argument ''x''...". A non-greedy or negated-class match stops at the FIRST quote
  // it finds, which is wrong whenever the token has one of its own; instead we rely on
  // node:util's three ERR_PARSE_ARGS_* messages here each containing EXACTLY ONE quoted
  // span and no other apostrophes (measured directly - see test/args.test.js), so the
  // greedy `.*` is guaranteed to span the whole token and stop at the true closing quote
  // (the last one in the string) rather than the first. `s` (dotAll) so `.` also matches
  // "\n" - the previous `[^']+` rule already matched newlines (character classes aren't
  // newline-limited the way `.` is), so dotAll is what keeps a token containing a
  // newline behaving exactly as it did before this fix, rather than regressing it.
  // A future node:util wording change that adds a second quoted span (e.g. a "did you
  // mean" suggestion) would silently break the "exactly one span" assumption; the
  // pinning test below exists so a Node upgrade that changes the wording fails loudly.
  const quoted = /'(.*)'/s.exec(err.message);
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
 * Throws an Error with `code === 'EUSAGE'` and a single-line message on malformed input
 * (unknown option, positional argument, value passed to a flag) - unless the token itself
 * contains a newline, which is embedded raw, spanning multiple lines. Never a stack trace.
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
