// Node re-implementation of the SEALED bash gate .swarm/gates/cycle-087-T-183.sh
// (sha256 25dc5a98...). Written ONLY because `bash <script>` is denied by this host's
// allowlist (KI-2 family); the checks are the same eight, in the same order, authored
// before dispatch. The builder never saw either file.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
process.chdir('/opt/targets/moon');
let pass = 0, fail = 0;
const chk = (name, ok) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + name); ok ? pass++ : fail++; };
const docs = ['REPORT.md', 'README.md', '.swarm/CONTRACTS.md'];
const blob = docs.map(f => readFileSync(f, 'utf8')).join('\n');

// C1 — no residual stale citation, in EITHER spelling.
const residual = blob.match(/render\.test\.js:629/g) || [];
console.log('  C1 residual :629 citations = ' + residual.length);
chk('C1 zero residual render.test.js:629 citations', residual.length === 0);

// C2 — NON-VACUITY: HEAD really carried the defect, twice.
const head = execFileSync('git', ['show', 'HEAD:REPORT.md'], { encoding: 'utf8' });
const old = (head.match(/render\.test\.js:629/g) || []).length;
console.log('  C2 occurrences at HEAD = ' + old);
chk('C2 defect present at HEAD (non-vacuous fix)', old === 2);

// C3 — TRUE LINE re-derived at VERIFY time from the authoritative source (L-045),
// never from the planning note's remembered number.
const NAME = "KI-5 pin: disc glyph set matches the documented East Asian Width partition";
const rt = readFileSync('test/render.test.js', 'utf8').split('\n');
const idx = rt.findIndex(l => l.startsWith('test(') && l.includes(NAME));
const trueLine = idx + 1;
console.log('  C3 KI-5 pin test truly declared at test/render.test.js:' + trueLine);
chk('C3 KI-5 pin test locatable by name', idx !== -1);

// C4 — every render.test.js citation left in the docs names that re-derived line.
let bad = false;
for (const m of blob.matchAll(/render\.test\.js:(\d+)/g)) {
  if (Number(m[1]) !== trueLine) { console.log('  C4 offender: render.test.js:' + m[1] + ' (expected ' + trueLine + ')'); bad = true; }
}
chk('C4 every render.test.js citation resolves to the KI-5 pin line', !bad);

// C5 — the cited line, read live, IS that test declaration.
console.log('  C5 line ' + trueLine + ' reads: ' + rt[idx]);
chk('C5 cited line is the KI-5 pin test declaration', rt[idx].includes('KI-5 pin: disc glyph set'));

// C6 — NO COLLATERAL ROT: every other file:line citation in the docs still in range.
let rot = false, checked = 0;
for (const m of blob.matchAll(/(?:test|src|bin)\/[A-Za-z0-9_.-]+\.js:(\d+)/g)) {
  const [f, L] = [m[0].split(':')[0], Number(m[1])];
  checked++;
  if (!existsSync(f)) { console.log('  C6 missing file: ' + m[0]); rot = true; continue; }
  const tot = readFileSync(f, 'utf8').split('\n').length;
  if (L > tot) { console.log('  C6 out of range: ' + m[0] + ' (file has ' + tot + ' lines)'); rot = true; }
}
console.log('  C6 citations checked = ' + checked);
chk('C6 all doc file:line citations resolve in range', !rot && checked > 0);

// C7 — SCOPE: only REPORT.md touched (conductor .swarm bookkeeping excluded).
const touched = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', '.'], { encoding: 'utf8' })
  .split('\n').filter(s => s && !s.startsWith('.swarm/'));
console.log('  C7 non-.swarm files changed: [' + touched.join(' ') + ']');
chk('C7 scope limited to REPORT.md', touched.length === 1 && touched[0] === 'REPORT.md');

// C8 — the whole suite, run by the conductor. Per L-041 the summary must PARSE;
// an unparsed reporter is an instrument failure, never a silent pass.
let out = '';
try { out = execFileSync('sh', ['-c', 'node --test test/*.test.js 2>&1'], { encoding: 'utf8' }); }
catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
const g = re => { const m = out.match(re); return m ? Number(m[1]) : null; };
const tot = g(/tests (\d+)\s*$/m), pss = g(/ pass (\d+)\s*$/m), fl = g(/ fail (\d+)\s*$/m);
console.log('  C8 parsed: tests=' + tot + ' pass=' + pss + ' fail=' + fl);
if (tot === null || pss === null || fl === null) { console.log('  C8 INSTRUMENT FAILURE: could not parse the suite summary'); chk('C8 full suite green (fail=0 and pass==tests)', false); }
else chk('C8 full suite green (fail=0 and pass==tests)', fl === 0 && pss === tot && tot > 0);

console.log('---- GATE: ' + pass + ' passed, ' + fail + ' failed ----');
process.exit(fail === 0 ? 0 : 1);
