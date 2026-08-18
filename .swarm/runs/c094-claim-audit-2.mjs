// cycle 94 — claim audit, PASS 2.
//
// Pass 1 (.swarm/runs/c094-claim-audit.mjs) is kept on disk unedited. It scored
// 15 pass / 2 fail, and BOTH failures were mine, not the product's:
//
//   1. `suite is green ...` returned tests=null. My regex read TAP (`# tests N`);
//      node's default reporter prints `ℹ tests N`. The instrument could not see the
//      number it was grading, and correctly refused to pass rather than assuming green.
//   2. `CITATION src/astro.js:358` FAILED on marker `Number.isNaN(result.getTime())`,
//      which sits at 357. But the doc quotes TWO artifacts for that citation — the
//      check AND the throw with its exact message — and line 358 carries the message
//      verbatim. A reader following the citation lands on the quoted string. My check
//      picked the wrong one of the doc's two markers.
//
// Pass 2 is STRICTER than pass 1 on both, not looser:
//   - the suite check now requires a parsed integer and asserts the reporter form it
//     matched, so a silent null can never read as green again;
//   - the 358 check now requires the doc's exact quoted MESSAGE at the cited line AND
//     the companion `Number.isNaN` guard within one line of it, so a future move of
//     EITHER half of the two-line construct still fails. Pass 1 could only see one half.
//
// No product file is written by this script. Two claims pass 1 never checked are added.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const T = '/opt/targets/moon';
const read = (p) => readFileSync(`${T}/${p}`, 'utf8');
const lines = (p) => read(p).split('\n');
const flat = (s) => s.replace(/\s+/g, ' ');
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: T, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

let pass = 0, fail = 0, partial = 0;
const results = [];
function check(name, fn) {
  let verdict, detail;
  try {
    const r = fn();
    verdict = r.ok ? 'PASS' : r.partial ? 'PARTIAL' : 'FAIL';
    detail = r.detail;
  } catch (e) {
    verdict = 'FAIL';
    detail = `threw: ${e.message}`;
  }
  if (verdict === 'PASS') pass++; else if (verdict === 'PARTIAL') partial++; else fail++;
  results.push({ name, verdict, detail });
}

// --- A. the citation pass 1 got wrong, re-aimed and tightened -----------------
check('CITATION src/astro.js:358 — the doc\'s quoted message is AT 358, and its guard within 1 line', () => {
  const L = lines('src/astro.js');
  const MSG = 'nextFullMoon result is outside the representable Date range';
  const GUARD = 'Number.isNaN(result.getTime())';
  const at358 = L[357] ?? '';
  const msgHere = at358.includes(MSG);
  const guardLine = L.findIndex((l) => l.includes(GUARD)) + 1;
  const guardNear = guardLine > 0 && Math.abs(guardLine - 358) <= 1;
  // the doc must still quote both artifacts — if it stopped, the claim changed shape
  const doc = flat(read('REPORT.md'));
  const docQuotesMsg = doc.includes(MSG);
  const docQuotesGuard = doc.includes(GUARD);
  return {
    ok: msgHere && guardNear && docQuotesMsg && docQuotesGuard,
    detail: `line 358 carries the quoted message: ${msgHere} · guard at line ${guardLine} (within 1 of 358: ${guardNear}) · REPORT.md still quotes message=${docQuotesMsg} guard=${docQuotesGuard}\n` +
      `           357: ${JSON.stringify((L[356] ?? '').trim())}\n` +
      `           358: ${JSON.stringify(at358.trim())}`,
  };
});

// --- B. the suite count, with an instrument that cannot return null silently ---
check('suite is green, count parsed from a NAMED reporter form, and no undated doc count disagrees', () => {
  let out;
  try {
    out = sh('node', ['--test', 'test/cli.test.js', 'test/render.test.js', 'test/args.test.js', 'test/astro.test.js', 'test/hemisphere.test.js', 'test/report-issues.test.js']);
  } catch (e) {
    out = String(e.stdout ?? '') + String(e.stderr ?? '');
  }
  // try both reporter dialects; RECORD which one matched so a null is impossible to miss
  const FORMS = [
    { name: 'spec (ℹ tests N)', tests: /ℹ tests (\d+)/, pass: /ℹ pass (\d+)/, fail: /ℹ fail (\d+)/ },
    { name: 'tap (# tests N)', tests: /# tests (\d+)/, pass: /# pass (\d+)/, fail: /# fail (\d+)/ },
  ];
  let matched = null, tests = null, passed = null, failed = null;
  for (const f of FORMS) {
    const t = out.match(f.tests), p = out.match(f.pass), x = out.match(f.fail);
    if (t && p && x) { matched = f.name; tests = +t[1]; passed = +p[1]; failed = +x[1]; break; }
  }
  if (matched === null) {
    return { ok: false, detail: `INSTRUMENT FAILURE: no reporter form matched. tail of output:\n           ${out.trim().split('\n').slice(-6).join('\n           ')}` };
  }
  const bad = [];
  for (const f of ['README.md', 'REPORT.md']) {
    lines(f).forEach((l, i) => {
      const m = l.match(/(\d{3})\s*(?:\/\s*\d{3})?\s*tests?\b/);
      if (!m) return;
      const n = Number(m[1]);
      if (n === tests) return;
      if (/as of|until this|at cycle|run \d|kickoff|baseline|when |carried/i.test(l)) return; // self-dating
      bad.push(`${f}:${i + 1} claims ${n}: ${l.trim().slice(0, 110)}`);
    });
  }
  return {
    ok: Number.isInteger(tests) && failed === 0 && passed === tests && bad.length === 0,
    detail: `reporter form matched: ${matched} · tests ${tests} pass ${passed} fail ${failed}\n` +
      `           ${bad.length ? 'UNDATED COUNT CLAIMS DISAGREEING:\n           ' + bad.join('\n           ') : `no undated doc count claim disagrees with ${tests}`}`,
  };
});

// --- C. two claims pass 1 never checked --------------------------------------
check('REPORT.md KI-3 row: the remote exists and HEAD still equals origin/main', () => {
  const doc = flat(read('REPORT.md'));
  if (!/The repo has a remote and the branch is pushed/.test(doc)) {
    return { ok: false, detail: 'the KI-3 claim is no longer stated in REPORT.md — claim shape changed' };
  }
  const remotes = sh('git', ['remote', '-v']);
  const head = sh('git', ['rev-parse', 'HEAD']).trim();
  let origin = null;
  try { origin = sh('git', ['rev-parse', 'origin/main']).trim(); } catch { origin = null; }
  const urlOk = remotes.includes('https://github.com/trmnmc/moon.git');
  return {
    ok: urlOk && origin !== null && head === origin,
    detail: `origin URL as documented: ${urlOk} · HEAD ${head.slice(0, 8)} · origin/main ${origin ? origin.slice(0, 8) : 'MISSING'} · equal: ${head === origin}`,
  };
});

check('REPORT.md: "source requires only node:* and sibling modules"', () => {
  const doc = flat(read('REPORT.md'));
  if (!/requires only `node:\*` and sibling modules/.test(doc)) {
    return { ok: false, detail: 'the claim is no longer stated in REPORT.md — claim shape changed' };
  }
  const files = [
    ...readdirSync(`${T}/src`).map((f) => `src/${f}`),
    ...readdirSync(`${T}/bin`).map((f) => `bin/${f}`),
  ].filter((f) => f.endsWith('.js'));
  const foreign = [];
  for (const f of files) {
    for (const m of read(f).matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const spec = m[1];
      if (!spec.startsWith('node:') && !spec.startsWith('./') && !spec.startsWith('../')) foreign.push(`${f} -> ${spec}`);
    }
  }
  return {
    ok: foreign.length === 0,
    detail: `${files.length} source files scanned (${files.join(' ')}) · foreign requires: ${foreign.length ? foreign.join(', ') : 'none'}`,
  };
});

// --- D. the pass-1 checks that passed, re-run so pass 2 stands alone ----------
const CITATIONS = [
  { cite: 'test/render.test.js:829', file: 'test/render.test.js', line: 829, marker: 'KI-5 pin: disc glyph set matches the documented East Asian Width partition' },
  { cite: 'test/astro.test.js:491', file: 'test/astro.test.js', line: 491, marker: 'KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)' },
  { cite: 'astro.js:71-74', file: 'src/astro.js', line: [71, 74], marker: 'PHASE_ILLUMINATION_CONSISTENCY_DOMAIN' },
  { cite: 'src/astro.js:281', file: 'src/astro.js', line: 281, marker: "throw new TypeError('computeMoon expects a valid Date')" },
  { cite: 'src/astro.js:346', file: 'src/astro.js', line: 346, marker: "throw new TypeError('nextFullMoon expects a valid Date')" },
];
for (const c of CITATIONS) {
  check(`CITATION ${c.cite} resolves`, () => {
    const L = lines(c.file);
    const span = Array.isArray(c.line) ? c.line : [c.line, c.line];
    if (L.length < span[1]) return { ok: false, detail: `${c.file} has ${L.length} lines; citation past EOF` };
    const exact = L.slice(span[0] - 1, span[1]).join('\n');
    if (exact.includes(c.marker)) return { ok: true, detail: `line ${span.join('-')} carries the marker verbatim` };
    const at = L.findIndex((l) => l.includes(c.marker)) + 1;
    return { ok: false, detail: at ? `marker at line ${at}, not ${span.join('-')} (off by ${at - span[0]})` : `marker NOT FOUND in ${c.file}` };
  });
}

check('KI-7 4000-sample-point claim matches the test', () => {
  const doc = flat(read('REPORT.md'));
  const m = doc.match(/strides \*\*(\d+)\*\* deterministic points/);
  if (!m) return { ok: false, detail: 'REPORT.md no longer states a sample-point count for KI-7' };
  const claimed = Number(m[1]);
  const src = read('test/astro.test.js');
  return { ok: src.includes(String(claimed)), detail: `doc claims ${claimed}; literal present in test/astro.test.js: ${src.includes(String(claimed))}` };
});

check('EAW glyph partition: every documented glyph is drawn by src/render.js', () => {
  const doc = flat(read('README.md')) + ' ' + flat(read('REPORT.md'));
  const all = ['░', '▐', '▒', '▓', '█', '▌', '▏', '▕'];
  const src = read('src/render.js');
  const missing = all.filter((g) => !src.includes(g));
  const undoc = all.filter((g) => !doc.includes(g));
  return { ok: !missing.length && !undoc.length, detail: `missing from src/render.js: ${missing.length || 'none'} · missing from docs: ${undoc.length || 'none'}` };
});

check('package.json: no dependencies, no devDependencies', () => {
  const pkg = JSON.parse(read('package.json'));
  return { ok: !('dependencies' in pkg) && !('devDependencies' in pkg), detail: `dependencies=${'dependencies' in pkg} devDependencies=${'devDependencies' in pkg}` };
});

check('no lockfile, no node_modules (dotfiles included in the listing this time)', () => {
  const root = readdirSync(T);
  const bad = root.filter((f) => /^(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|node_modules)$/.test(f));
  return { ok: bad.length === 0, detail: `full repo root incl. dotfiles: ${root.sort().join(' ')} · offenders: ${bad.length ? bad.join(' ') : 'none'}` };
});

check('KI-8 still open in the exact shape the owner ask describes', () => {
  const pkg = JSON.parse(read('package.json'));
  const hasLicense = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].some((f) => existsSync(`${T}/${f}`));
  const ask = read('.swarm/KI-8-OWNER-ACTION.md');
  return {
    ok: pkg.license === 'MIT' && pkg.private === false && !hasLicense && /LICENSE/.test(ask) && /Copyright \(c\)/.test(ask),
    detail: `license=${JSON.stringify(pkg.license)} private=${pkg.private} LICENSE file=${hasLicense} · ask names file=${/LICENSE/.test(ask)} names copyright line=${/Copyright \(c\)/.test(ask)}`,
  };
});

check('CITATION bin/swarm-watchdog.sh:275-285 (KI-9) still carries the all-done REPORT.md branch', () => {
  const p = '/opt/swarm/bin/swarm-watchdog.sh';
  if (!existsSync(p)) return { partial: true, detail: 'watchdog script absent — reported not-run, never passed' };
  const L = readFileSync(p, 'utf8').split('\n');
  if (L.length < 285) return { ok: false, detail: `script has ${L.length} lines; citation past EOF` };
  const span = flat(L.slice(274, 285).join(' '));
  return { ok: /all-done/.test(span) && /REPORT\.md/.test(span), detail: `all-done=${/all-done/.test(span)} REPORT.md=${/REPORT\.md/.test(span)}` };
});

for (const r of results) {
  console.log(r.verdict.padEnd(8), r.name);
  console.log('         ', String(r.detail).split('\n').join('\n          '));
}
console.log(`\nAUDIT PASS 2: ${pass} pass / ${fail} fail / ${partial} partial`);
process.exit(fail ? 1 : 0);
