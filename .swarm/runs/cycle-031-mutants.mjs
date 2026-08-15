// cycle 31 VERIFICATION GATE for T-128 — conductor-authored, written AFTER the builder
// returned and never shown to it. Mutation battery: each mutant is a drift the new gate
// claims to catch (or, for the last two, a shape it must NOT false-positive on).
// Files are restored from bytes held in memory — never via git checkout, because the
// working tree carries uncommitted work.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const CWD = '/opt/targets/moon';
const F = {
  args: CWD + '/src/args.js',
  moon: CWD + '/bin/moon.js',
  readme: CWD + '/README.md',
  test: CWD + '/test/cli.test.js',
};
const ORIG = Object.fromEntries(Object.entries(F).map(([k, p]) => [k, fs.readFileSync(p, 'utf8')]));

function suite() {
  const r = spawnSync('/bin/bash', ['-c', 'node --test test/*.test.js 2>&1'], { cwd: CWD, encoding: 'utf8', maxBuffer: 40e6 });
  const out = r.stdout || '';
  const g = (re) => { const m = re.exec(out); return m ? m[1] : '?'; };
  return { code: r.status, pass: g(/^# pass (\d+)$/m) || g(/pass (\d+)/), fail: g(/^# fail (\d+)$/m) || g(/fail (\d+)/), out };
}

function sub(key, from, to) {
  const before = ORIG[key];
  if (!before.includes(from)) throw new Error(`mutant anchor not found in ${key}: ${JSON.stringify(from.slice(0, 60))}`);
  fs.writeFileSync(F[key], before.replace(from, to));
}
function restoreAll() { for (const [k, p] of Object.entries(F)) fs.writeFileSync(p, ORIG[k]); }

const MUTANTS = [
  { id: 'M1', why: 'flag ADDED to OPTIONS, both documents stale',
    apply: () => sub('args', "  block: { type: 'boolean' },", "  block: { type: 'boolean' },\n  verbose: { type: 'boolean' },"),
    expect: 'fail', wants: /disagrees with the flags src\/args\.js actually registers/ },

  { id: 'M2', why: 'flag REMOVED from OPTIONS, both documents still advertise it (the direction the old hardcoded test was blind to)',
    apply: () => sub('args', "  compact: { type: 'boolean' },\n", ''),
    expect: 'fail', wants: /disagrees with the flags src\/args\.js actually registers/ },

  { id: 'M3', why: 'README Options row deleted only — OPTIONS and HELP still agree with each other',
    apply: () => sub('readme', '| `--compact` | suppress the next-full-moon line, leaving exactly one line |\n', ''),
    expect: 'fail', wants: /README Options table disagrees/ },

  { id: 'M4', why: 'HELP options line deleted only — OPTIONS and README still agree with each other',
    apply: () => sub('moon', '  --compact   suppress the next-full-moon line (on its own, exactly one line)\n', ''),
    expect: 'fail', wants: /HELP options block disagrees/ },

  { id: 'M5', why: 'ANTI-VACUITY: HELP section header renamed, so the HELP parser can find nothing',
    apply: () => sub('moon', '\noptions\n', '\nflags\n'),
    expect: 'fail', wants: /HELP text has no options section to parse/ },

  { id: 'M6', why: 'ANTI-VACUITY: OPTIONS declaration reformatted so the source-side anchor misses (parser still runs, behaviour unchanged)',
    apply: () => sub('args', 'const OPTIONS = {\n', 'const OPTIONS =\n{\n'),
    expect: 'fail', wants: /src\/args\.js has no OPTIONS table to parse/ },

  { id: 'M7', why: "-h alias silently dropped from HELP's --help line",
    apply: () => sub('moon', '  -h, --help  this text', '  --help      this text'),
    expect: 'fail', wants: /HELP options block does not render -h as --help's alias/ },

  { id: 'M8', why: 'PARTIAL DRIFT: compact renamed to terse in BOTH OPTIONS and HELP, README left stale — a gate that only compared HELP against README would pass this',
    apply: () => {
      sub('args', "  compact: { type: 'boolean' },", "  terse: { type: 'boolean' },");
      const m = ORIG.moon.replace('  --compact   suppress the next-full-moon line (on its own, exactly one line)',
        '  --terse     suppress the next-full-moon line (on its own, exactly one line)');
      fs.writeFileSync(F.moon, m);
    },
    expect: 'fail', wants: /README Options table disagrees/ },

  { id: 'M9', why: 'SPECIFICITY (must stay GREEN): a commented-out decoy entry inside OPTIONS must not be read as a registered flag',
    apply: () => sub('args', "  help: { type: 'boolean', short: 'h' },", "  // ghost: { type: 'boolean' },\n  help: { type: 'boolean', short: 'h' },"),
    expect: 'pass', wants: null },
];

console.log('=== BASELINE (builder diff, unmutated) ===');
const base = suite();
console.log(`exit=${base.code} pass=${base.pass} fail=${base.fail}`);
if (base.code !== 0) { console.log(base.out.slice(-3000)); restoreAll(); process.exit(9); }

let bad = 0;
for (const m of MUTANTS) {
  restoreAll();
  m.apply();
  const r = suite();
  const failed = r.code !== 0;
  const matched = m.wants ? m.wants.test(r.out) : true;
  const ok = m.expect === 'fail' ? (failed && matched) : (!failed);
  if (!ok) bad++;
  console.log(`\n${m.id} ${ok ? 'BITES ' : '*** DID NOT BEHAVE AS REQUIRED ***'}  expect=${m.expect}  exit=${r.code} pass=${r.pass} fail=${r.fail}`);
  console.log(`   ${m.why}`);
  if (m.expect === 'fail') {
    const line = (/AssertionError.*|Error: .*/.exec(r.out) || ['(no error line captured)'])[0];
    console.log(`   first error: ${line.slice(0, 160)}`);
    console.log(`   expected message present: ${matched}`);
  }
}

restoreAll();
console.log('\n=== RESTORE ===');
const post = suite();
console.log(`exit=${post.code} pass=${post.pass} fail=${post.fail}`);
for (const [k, p] of Object.entries(F)) {
  console.log(`  ${k}: byte-identical to pre-battery = ${fs.readFileSync(p, 'utf8') === ORIG[k]}`);
}
console.log(`\nmutants misbehaving: ${bad}`);
