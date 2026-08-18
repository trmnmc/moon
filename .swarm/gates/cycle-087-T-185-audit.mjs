// T-185 — CONDUCTOR-RUN audit of L-029 and L-044 conformance.
//
// The cycle-85 planning agent read the suite structurally and CLAIMED both lessons clean.
// A structural read cannot establish either property: L-029 (failable AND attributable)
// and L-044 (a converse control that must stay GREEN) are both statements about how a
// test BEHAVES under mutation, which is only observable by mutating and running.
// So this harness runs the arms itself, on a pristine `git archive HEAD` copy so the
// live tree (and a concurrent builder) cannot influence the result.
//
// Per subject test, three arms:
//   A KILL        mutate the guarded surface            -> suite must FAIL, and the
//                                                          NAMED test must be among the failures
//   B ATTRIBUTION same mutation + that test skipped     -> suite must go GREEN   (L-029)
//   C CONTROL     a same-region semantically neutral    -> suite must stay GREEN (L-044)
//                 edit, no mutation
// A subject is CLEAN only if all three arms land as specified. Arm B failing means the
// kill belongs to some other test; arm C failing means the test is a snapshot of the
// file, not an assertion about behaviour.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';

const SRC = '/opt/targets/moon';
const DIR = '/tmp/moon-audit';

rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
execFileSync('sh', ['-c', `git -C ${SRC} archive HEAD | tar -x -C ${DIR}`]);
const HEAD = execFileSync('git', ['-C', SRC, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
console.log(`audit tree = pristine copy of ${HEAD} at ${DIR}\n`);

const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Run the suite in the copy. Returns {tests, pass, fail, failed:[names]}.
function suite(skipName) {
  const skip = skipName ? ` --test-skip-pattern="${rx(skipName)}"` : '';
  let out = '';
  try { out = execFileSync('sh', ['-c', `cd ${DIR} && node --test --test-reporter=tap${skip} test/*.test.js 2>&1`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const num = re => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const failed = [...out.matchAll(/^not ok \d+ - (.+?)\s*$/gm)].map(m => m[1]);
  const r = { tests: num(/^# tests (\d+)$/m), pass: num(/^# pass (\d+)$/m), fail: num(/^# fail (\d+)$/m), failed };
  // L-041: an unparsed reporter must read as an instrument failure, never as a result.
  if (r.tests === null || r.pass === null || r.fail === null) { r.instrument = 'TAP summary did not parse'; }
  return r;
}

function patch(file, from, to) {
  const p = `${DIR}/${file}`;
  const s = readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error(`INSTRUMENT: anchor absent in ${file}: ${JSON.stringify(from.slice(0, 60))}`);
  writeFileSync(p, s.replace(from, to));
}
function restore(file) {
  writeFileSync(`${DIR}/${file}`, execFileSync('git', ['-C', SRC, 'show', `HEAD:${file}`], { encoding: 'utf8' }));
}

const SUBJECTS = [
  {
    id: 'S1', lesson: 'L-029 + L-044', test: 'KI-5 pin: disc glyph set matches the documented East Asian Width partition',
    file: 'src/render.js',
    mut: { what: "SHADE[1] '▒' -> '▨' (a glyph outside the documented EAW partition)",
           from: "const SHADE = ['░', '▒', '▓', '█'];", to: "const SHADE = ['░', '▨', '▓', '█'];" },
    ctl: { what: 'reword the trailing comment on the same SHADE line (no behaviour change)',
           from: "const SHADE = ['░', '▒', '▓', '█']; // ░ ▒ ▓ █", to: "const SHADE = ['░', '▒', '▓', '█']; // shades, lightest to solid" },
  },
  {
    id: 'S2', lesson: 'L-029 + L-044', test: 'T-129: ch.49 correction-table characterization pins (new/Q1/full/Q3, one lunation near year 2150)',
    file: 'src/astro.js',
    mut: { what: 'last new/full periodic coefficient 0.00208 -> 0.00209 (5th decimal transcription slip)',
           from: '0.00739, -0.00514, 0.00208]', to: '0.00739, -0.00514, 0.00209]' },
    ctl: { what: 'whitespace inside the same coefficient array (no value changes)',
           from: '[-0.40720, 0.17241,', to: '[ -0.40720, 0.17241,' },
  },
  {
    id: 'S3', lesson: 'L-029 + L-044', test: 'legacy top-level aliases',
    file: 'src/hemisphere.js',
    mut: { what: "delete the 'us/samoa' SOUTHERN_ZONES row added by T-175 at cycle 86",
           from: "  'us/samoa',", to: "  //'us/samoa'," },
    ctl: { what: "reword the comment on the same 'us/samoa' row (row itself untouched)",
           from: "'us/samoa', // legacy alias of Pacific/Pago_Pago", to: "'us/samoa', // legacy alias (Pago Pago)" },
  },
];

const base = suite(null);
console.log(`BASELINE (unmutated ${HEAD}): tests=${base.tests} pass=${base.pass} fail=${base.fail}`);
if (base.instrument || base.fail !== 0) { console.log('ABORT: baseline is not green; every arm below would be uninterpretable.'); process.exit(2); }
console.log('');

const verdicts = [];
for (const s of SUBJECTS) {
  console.log(`===== ${s.id}  "${s.test}"`);
  console.log(`      guards ${s.file}`);

  restore(s.file); patch(s.file, s.mut.from, s.mut.to);
  const A = suite(null);
  const namedInA = A.failed.some(n => n.includes(s.test));
  console.log(`  A KILL        mutation: ${s.mut.what}`);
  console.log(`                fail=${A.fail}  failing tests: ${A.failed.length ? A.failed.join(' | ') : '(none)'}`);
  console.log(`                -> ${A.fail > 0 && namedInA ? 'FAILABLE, and the named test is among the killers' : 'NOT as specified'}`);

  const B = suite(s.test);   // same mutation still applied
  console.log(`  B ATTRIBUTION same mutation, "${s.test}" skipped`);
  console.log(`                tests=${B.tests} pass=${B.pass} fail=${B.fail}  survivors of the kill: ${B.failed.join(' | ') || '(none)'}`);
  console.log(`                -> ${B.fail === 0 ? 'ATTRIBUTABLE: removing this test lets the mutant survive' : 'NOT attributable: ' + B.fail + ' other test(s) also kill it'}`);

  restore(s.file); patch(s.file, s.ctl.from, s.ctl.to);
  const C = suite(null);
  console.log(`  C CONTROL     neutral edit: ${s.ctl.what}`);
  console.log(`                tests=${C.tests} pass=${C.pass} fail=${C.fail}  ${C.failed.join(' | ')}`);
  console.log(`                -> ${C.fail === 0 ? 'ASSERTION: the neutral edit leaves the suite GREEN' : 'SNAPSHOT-SHAPED: a neutral edit kills the suite'}`);
  restore(s.file);

  const l029 = A.fail > 0 && namedInA && B.fail === 0 && !A.instrument && !B.instrument;
  const l044 = C.fail === 0 && !C.instrument;
  verdicts.push({ id: s.id, test: s.test, l029, l044 });
  console.log(`  VERDICT  L-029 ${l029 ? 'CLEAN' : 'VIOLATION'}   L-044 ${l044 ? 'CLEAN' : 'VIOLATION'}\n`);
}

console.log('===== SUMMARY (conductor-run, not agent-claimed)');
for (const v of verdicts) console.log(`  ${v.id}  L-029 ${v.l029 ? 'CLEAN    ' : 'VIOLATION'}  L-044 ${v.l044 ? 'CLEAN    ' : 'VIOLATION'}  ${v.test}`);
const bad = verdicts.filter(v => !v.l029 || !v.l044);
console.log(bad.length ? `\n${bad.length} subject(s) violate a lesson.` : '\nAll subjects conform on both lessons.');
console.log('\nSCOPE LIMIT, stated rather than hidden: this measures three named pins, one per');
console.log('source module, chosen as the repo\'s load-bearing characterization tests. It');
console.log('establishes the property for those three. It does NOT establish it for all 171');
console.log('shipped tests, and no run of any size would - L-029 is a proof obligation on how');
console.log('each test was built. What this DOES retire is the cycle-85 structural claim,');
console.log('which had no behavioural evidence behind it at all.');
process.exit(bad.length ? 1 : 0);
