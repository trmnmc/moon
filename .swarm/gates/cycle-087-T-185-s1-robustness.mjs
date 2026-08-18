// T-185 addendum — is S1's L-029 VIOLATION a property of the KI-5 pin, or an artifact
// of the one mutation the main audit happened to pick?
//
// The first mutation swapped a Block Element for a Geometric Shape, which changes every
// rendered frame, so the exact-output tests were always going to kill it. This arm
// re-runs the attribution arm under mutations chosen to be as favourable to the pin as
// possible: substitutions that stay INSIDE the Block Elements range (0x2580-0x259F) and
// are absent from the pin's DOCUMENTED_EAW map, i.e. exactly the drift the pin exists to
// catch. If the mutant still dies with the pin skipped, non-attributability is a
// property of the suite, not of my mutation choice.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';

const SRC = '/opt/targets/moon';
const DIR = '/tmp/moon-audit-s1';
const PIN = 'KI-5 pin: disc glyph set matches the documented East Asian Width partition';

rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
execFileSync('sh', ['-c', `git -C ${SRC} archive HEAD | tar -x -C ${DIR}`]);

const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function suite(skip) {
  let out = '';
  const s = skip ? ` --test-skip-pattern="${rx(skip)}"` : '';
  try { out = execFileSync('sh', ['-c', `cd ${DIR} && node --test --test-reporter=tap${s} test/*.test.js 2>&1`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const n = re => { const m = out.match(re); return m ? Number(m[1]) : null; };
  return { fail: n(/^# fail (\d+)$/m), failed: [...out.matchAll(/^not ok \d+ - (.+?)\s*$/gm)].map(m => m[1]) };
}

// Both replacements are Block Elements (U+2580..U+259F) and absent from DOCUMENTED_EAW,
// so each is precisely "an undocumented glyph silently joined the mix".
const MUTS = [
  { what: "SHADE[1] U+2592 '▒' -> U+259A '▚' (Block Element, undocumented)", from: "const SHADE = ['░', '▒', '▓', '█'];", to: "const SHADE = ['░', '▚', '▓', '█'];" },
  { what: "SHADE[2] U+2593 '▓' -> U+2584 '▄' (Block Element, undocumented)", from: "const SHADE = ['░', '▒', '▓', '█'];", to: "const SHADE = ['░', '▒', '▄', '█'];" },
];

const pristine = execFileSync('git', ['-C', SRC, 'show', 'HEAD:src/render.js'], { encoding: 'utf8' });
for (const m of MUTS) {
  writeFileSync(`${DIR}/src/render.js`, pristine.replace(m.from, m.to));
  const A = suite(null);
  const B = suite(PIN);
  console.log(`\n${m.what}`);
  console.log(`  A kill arm      fail=${A.fail}  pin among killers: ${A.failed.some(x => x.includes(PIN))}`);
  console.log(`  B attribution   fail=${B.fail}  (pin skipped)`);
  console.log(`     others that also kill it: ${B.failed.join(' | ') || '(none)'}`);
  console.log(`  -> ${B.fail === 0 ? 'ATTRIBUTABLE under this mutation' : 'NOT attributable: ' + B.fail + ' other test(s) subsume the kill'}`);
}
writeFileSync(`${DIR}/src/render.js`, pristine);
