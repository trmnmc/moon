// Conductor gate for T-132, authored at verification time. The builder saw none of this.
//
// Independence: the TRUE token is derived by stripping node:util's fixed sentence
// templates (measured this cycle in c35-rawmsgs.js) - NOT by scanning for quotes, which
// is the mechanism under test. The expected moon message is then reconstructed from
// moon's own three templates. A template that no longer matches FAILS LOUDLY rather than
// silently degrading, which also pins the node:util wording dependency.
//
// Second, stronger discriminator: for positional cases the conductor KNOWS the exact
// string it passed, so the named token is compared against the argv element itself. A
// faked or degenerate recovery cannot satisfy that.
const { parseArgs: nodeParseArgs } = require('node:util');
const { parseArgs: NEW } = require('/opt/targets/moon/src/args.js');
const { parseArgs: OLD } = require('/opt/swarm/runs/c35-baseline-args.js');

const OPTIONS = {
  json: { type: 'boolean' }, south: { type: 'boolean' }, north: { type: 'boolean' },
  block: { type: 'boolean' }, compact: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};
const HINT = "run 'moon --help' to see the available options";

// --- independent ground truth ------------------------------------------------------
const P_PRE = "Unexpected argument '";
const P_SUF = "'. This command does not take positional arguments";
const U_PRE = "Unknown option '";
const V_PRE = "Option '";
const V_SUF = "' does not take an argument";

function trueToken(code, msg) {
  if (code === 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL') {
    if (!msg.startsWith(P_PRE) || !msg.endsWith(P_SUF)) return null;
    return msg.slice(P_PRE.length, msg.length - P_SUF.length);
  }
  if (code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
    if (!msg.startsWith(U_PRE) || !msg.endsWith("'")) return null;
    return msg.slice(U_PRE.length, msg.length - 1);
  }
  if (code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE') {
    if (!msg.startsWith(V_PRE) || !msg.endsWith(V_SUF)) return null;
    return msg.slice(V_PRE.length, msg.length - V_SUF.length);
  }
  return null;
}

function expectedMoonMessage(code, tok) {
  if (code === 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL') {
    return `unexpected argument '${tok}' - moon takes no positional arguments; ${HINT}`;
  }
  if (code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') return `unknown option '${tok}' - ${HINT}`;
  if (code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE') {
    return `option '${tok}' is a flag and takes no value - ${HINT}`;
  }
  return null;
}

function raw(argv) {
  try {
    nodeParseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false, tokens: true });
    return null;
  } catch (err) { return err; }
}
function moon(fn, argv) {
  try { fn(argv); return null; } catch (err) { return err; }
}

// argv -> the exact element the conductor expects to be named, or undefined when
// node:util names something it synthesised (short-option groups, `--opt=value`).
const KNOWN_POSITIONAL = 'known-positional';

const CASES = [
  // --- the 5 rows T-132 must CHANGE -----------------------------------------------
  { argv: [''], must: 'change', named: KNOWN_POSITIONAL },
  { argv: ["it's"], must: 'change', named: KNOWN_POSITIONAL },
  { argv: ["'x'"], must: 'change', named: KNOWN_POSITIONAL },
  { argv: ["a'b'c"], must: 'change', named: KNOWN_POSITIONAL },
  { argv: ["'"], must: 'change', named: KNOWN_POSITIONAL },
  // --- the 13 rows that must stay BYTE-IDENTICAL ----------------------------------
  { argv: ['bogus'], must: 'same', named: KNOWN_POSITIONAL },
  { argv: ['   '], must: 'same', named: KNOWN_POSITIONAL },
  { argv: ['-'], must: 'same', named: KNOWN_POSITIONAL },
  { argv: ['--bogus'], must: 'same' },
  { argv: ['-x'], must: 'same' },
  { argv: ['--json=1'], must: 'same' },
  { argv: ['--jsno'], must: 'same' },
  { argv: ['--sotuh'], must: 'same' },
  { argv: ['--helpp'], must: 'same' },
  { argv: ['---'], must: 'same' },
  { argv: ['--='], must: 'same' },
  { argv: ['-jh'], must: 'same' },
  { argv: ['-h=2'], must: 'same' },
  // --- hostile cases the builder never saw ----------------------------------------
  { argv: ["''"], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ["'''"], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ["  'x'  "], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ["a'b", "c'd"], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ['--json', "it's"], must: 'free', named: "it's" },
  { argv: ["don't", '--json'], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ['\\'], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ['–json'], must: 'free', named: KNOWN_POSITIONAL },
  { argv: ["--it's"], must: 'free' },
  { argv: ["--json='x'"], must: 'free' },
  { argv: ["--json=it's"], must: 'free' },
  { argv: ['a\nb'], must: 'free', named: KNOWN_POSITIONAL, multiline: true },
  { argv: ["'\n'"], must: 'free', named: KNOWN_POSITIONAL, multiline: true },
];

let fail = 0, checks = 0;
const line = (s) => console.log(s);
const bad = (s) => { fail++; console.log('  FAIL ' + s); };

line(`node ${process.version}`);
line('argv'.padEnd(22) + 'true token'.padEnd(16) + 'OLD names'.padEnd(16) + 'NEW names');
line('-'.repeat(88));

for (const c of CASES) {
  const r = raw(c.argv);
  const label = JSON.stringify(c.argv);
  if (!r) { bad(`${label}: node:util did not throw - case is not exercising the path`); continue; }

  const tok = trueToken(r.code, r.message);
  if (tok === null) {
    bad(`${label}: node:util wording no longer matches the pinned template: ${JSON.stringify(r.message)}`);
    continue;
  }

  // Discriminator: for positional cases the conductor knows exactly what it passed.
  if (c.named === KNOWN_POSITIONAL) {
    const firstPositional = c.argv.find((a) => !a.startsWith('-') || a === '-' || a === '');
    checks++;
    if (tok !== firstPositional) {
      bad(`${label}: node:util named ${JSON.stringify(tok)} but the argv element is ${JSON.stringify(firstPositional)}`);
    }
  } else if (typeof c.named === 'string') {
    checks++;
    if (tok !== c.named) bad(`${label}: expected node:util to name ${JSON.stringify(c.named)}, got ${JSON.stringify(tok)}`);
  }

  const eNew = moon(NEW, c.argv);
  const eOld = moon(OLD, c.argv);
  if (!eNew) { bad(`${label}: new parseArgs did not throw`); continue; }
  if (!eOld) { bad(`${label}: baseline parseArgs did not throw`); continue; }

  const want = expectedMoonMessage(r.code, tok);
  const showOld = (eOld.message.match(/'([^']*)'(?! is a flag| -)/) || [null, '?'])[1];

  line(label.padEnd(22) + JSON.stringify(tok).padEnd(16) + JSON.stringify(eOld.message.slice(0, 40)).padEnd(16).slice(0, 16) + JSON.stringify(eNew.message).slice(0, 46));

  // 1. NEW must equal the message the conductor reconstructs from the TRUE token.
  checks++;
  if (eNew.message !== want) bad(`${label}: message\n       want ${JSON.stringify(want)}\n       got  ${JSON.stringify(eNew.message)}`);

  // 2. invariants
  checks++;
  if (eNew.code !== 'EUSAGE') bad(`${label}: code is ${eNew.code}, not EUSAGE`);
  checks++;
  if (eNew.stack !== `Error: ${eNew.message}`) bad(`${label}: stack is not the single frame-free line`);
  checks++;
  const newlines = (eNew.message.match(/\n/g) || []).length;
  const oldNewlines = (eOld.message.match(/\n/g) || []).length;
  if (newlines !== oldNewlines) bad(`${label}: newline count changed ${oldNewlines} -> ${newlines}`);
  if (!c.multiline && newlines !== 0) bad(`${label}: message is not one line`);

  // 3. must/same/change discipline
  if (c.must === 'same') {
    checks++;
    if (eNew.message !== eOld.message) bad(`${label}: REGRESSION, must be byte-identical to baseline\n       old ${JSON.stringify(eOld.message)}\n       new ${JSON.stringify(eNew.message)}`);
  } else if (c.must === 'change') {
    checks++;
    if (eNew.message === eOld.message) bad(`${label}: unchanged from baseline, the defect is not fixed`);
  }
}

line('-'.repeat(88));
line(`${checks} assertions, ${fail} failed`);
process.exit(fail ? 1 : 0);
