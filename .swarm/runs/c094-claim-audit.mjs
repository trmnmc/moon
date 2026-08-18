// cycle 94 — conductor's independent re-derivation of every standing checkable claim
// in README.md / REPORT.md against the tree AS IT STANDS NOW.
//
// Instrument discipline, learned the hard way three times in this project (cycle 63 v1
// gate, cycle 91 byte-accounting, cycle 93 gate check 3 + dashboard assertion): a check
// that grades PROSE by pattern mistakes its own narrowness for the product's silence.
// So every check below either
//   (a) resolves a citation to a LINE and compares a STRUCTURAL marker the source owns
//       (a test title, an identifier) as an exact substring, or
//   (b) re-derives a number by RUNNING the authoritative source (L-045),
// and the doc side is read with newlines collapsed FIRST, so a 78-column word wrap can
// never hide a claim from its own checker.
//
// No product file is written. This script only reads and reports.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const T = '/opt/targets/moon';
const read = (p) => readFileSync(`${T}/${p}`, 'utf8');
const lines = (p) => read(p).split('\n');
// collapse ALL runs of whitespace: this is the anti-word-wrap normalisation
const flat = (s) => s.replace(/\s+/g, ' ');

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

// ---------------------------------------------------------------------------
// A. every file:line citation in the docs resolves to what the doc says is there
// ---------------------------------------------------------------------------

// Each entry: the citation as the doc writes it, the file, the line, and the
// STRUCTURAL marker the doc claims lives there. The marker is taken from the doc's
// own backticked text, quoted here so a drift in either direction is visible.
const CITATIONS = [
  {
    cite: 'test/render.test.js:829',
    file: 'test/render.test.js',
    line: 829,
    marker: 'KI-5 pin: disc glyph set matches the documented East Asian Width partition',
  },
  {
    cite: 'test/astro.test.js:491',
    file: 'test/astro.test.js',
    line: 491,
    marker: 'KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)',
  },
  {
    cite: 'test/astro.test.js:294',
    file: 'test/astro.test.js',
    line: 294,
    marker: null, // doc calls it only "Regression at" — checked below by proximity to nextFullMoon range
  },
  {
    cite: 'src/astro.js:358',
    file: 'src/astro.js',
    line: 358,
    marker: 'Number.isNaN(result.getTime())',
  },
  {
    cite: 'astro.js:71-74',
    file: 'src/astro.js',
    line: [71, 74],
    marker: 'PHASE_ILLUMINATION_CONSISTENCY_DOMAIN',
  },
  {
    cite: 'src/astro.js:281 (bad-input guard shape)',
    file: 'src/astro.js',
    line: 281,
    marker: null,
    wantAny: ['throw', 'TypeError'],
  },
  {
    cite: 'src/astro.js:346 (bad-input guard shape)',
    file: 'src/astro.js',
    line: 346,
    marker: null,
    wantAny: ['throw', 'TypeError'],
  },
];

for (const c of CITATIONS) {
  check(`CITATION ${c.cite} resolves to what the doc says is there`, () => {
    const L = lines(c.file);
    const span = Array.isArray(c.line) ? c.line : [c.line, c.line];
    if (L.length < span[1]) {
      return { ok: false, detail: `${c.file} has only ${L.length} lines; citation points past EOF` };
    }
    // exact cited span first, then a +/-3 line window, so "off by a line" is
    // distinguishable from "gone entirely" rather than collapsing to one FAIL
    const exact = L.slice(span[0] - 1, span[1]).join('\n');
    const win = L.slice(Math.max(0, span[0] - 4), span[1] + 3).join('\n');
    if (c.marker) {
      if (exact.includes(c.marker)) return { ok: true, detail: `line ${span.join('-')} carries the marker verbatim` };
      if (win.includes(c.marker)) {
        const at = L.findIndex((l) => l.includes(c.marker)) + 1;
        return { ok: false, detail: `marker NOT at cited line ${span.join('-')} — it is at line ${at} (off by ${at - span[0]})` };
      }
      const anywhere = L.findIndex((l) => l.includes(c.marker)) + 1;
      return {
        ok: false,
        detail: anywhere
          ? `marker absent from the cited span; found at line ${anywhere}`
          : `marker "${c.marker.slice(0, 60)}" NOT FOUND anywhere in ${c.file}`,
      };
    }
    if (c.wantAny) {
      const hit = c.wantAny.filter((w) => exact.includes(w));
      return hit.length
        ? { ok: true, detail: `line ${span[0]}: ${JSON.stringify(exact.trim().slice(0, 70))} (matches ${hit.join(',')})` }
        : { ok: false, detail: `line ${span[0]} carries none of ${c.wantAny.join(',')}: ${JSON.stringify(exact.trim().slice(0, 70))}` };
    }
    return { ok: true, detail: `line ${span[0]} exists: ${JSON.stringify(exact.trim().slice(0, 70))}` };
  });
}

// test/astro.test.js:294 — the doc says it is the KI-6 nextFullMoon-range regression.
check('CITATION test/astro.test.js:294 is in fact the nextFullMoon-range regression', () => {
  const L = lines('test/astro.test.js');
  const win = flat(L.slice(288, 300).join(' '));
  const wantsFullMoon = /nextFullMoon/.test(win);
  const wantsRange = /(representable|RangeError|outside|range)/i.test(win);
  return {
    ok: wantsFullMoon && wantsRange,
    detail: `lines 289-300 mention nextFullMoon=${wantsFullMoon} range-ish=${wantsRange} :: ${win.slice(0, 150)}`,
  };
});

// KI-9 cites a SWARM file. Hard rule 5 makes it READ-ONLY, not unreadable.
check('CITATION bin/swarm-watchdog.sh:275-285 still carries the all-done REPORT.md branch', () => {
  const p = '/opt/swarm/bin/swarm-watchdog.sh';
  if (!existsSync(p)) return { partial: true, detail: 'watchdog script absent — cannot resolve, reported not-run' };
  const L = readFileSync(p, 'utf8').split('\n');
  if (L.length < 285) return { ok: false, detail: `script has ${L.length} lines; citation points past EOF` };
  const span = flat(L.slice(274, 285).join(' '));
  const hasAllDone = /all-done/.test(span);
  const hasReport = /REPORT\.md/.test(span);
  return {
    ok: hasAllDone && hasReport,
    detail: `lines 275-285: all-done=${hasAllDone} REPORT.md=${hasReport} :: ${span.slice(0, 160)}`,
  };
});

// ---------------------------------------------------------------------------
// B. counts, re-derived by running / reading the authoritative source (L-045)
// ---------------------------------------------------------------------------

check('KI-7 claim of 4000 deterministic sample points matches the test', () => {
  const doc = flat(read('REPORT.md'));
  const m = doc.match(/strides \*\*(\d+)\*\* deterministic points/);
  if (!m) return { ok: false, detail: 'REPORT.md no longer states a sample-point count in the KI-7 row — claim shape changed' };
  const claimed = Number(m[1]);
  const src = read('test/astro.test.js');
  // the test's own count, read structurally: the loop bound / sample constant
  const nums = [...src.matchAll(/(?:SAMPLES?|samples|steps|POINTS)\s*=\s*(\d+)/g)].map((x) => Number(x[1]));
  const anyLiteral = src.includes(String(claimed));
  return {
    ok: nums.includes(claimed) || anyLiteral,
    detail: `doc claims ${claimed}; test constants found ${JSON.stringify(nums)}; literal ${claimed} present in test file: ${anyLiteral}`,
  };
});

check('PHASE_ILLUMINATION_CONSISTENCY_DOMAIN really is the half-open year range 1000-3000', () => {
  const src = read('src/astro.js');
  const i = src.indexOf('PHASE_ILLUMINATION_CONSISTENCY_DOMAIN');
  const span = flat(src.slice(i, i + 400));
  const has1000 = /\b1000\b/.test(span);
  const has3000 = /\b3000\b/.test(span);
  return {
    ok: has1000 && has3000,
    detail: `1000=${has1000} 3000=${has3000} :: ${span.slice(0, 180)}`,
  };
});

check('the documented EAW glyph partition matches what the code actually draws', () => {
  const doc = flat(read('README.md')) + ' ' + flat(read('REPORT.md'));
  const neutral = ['░', '▐'];                                        // ░ ▐
  const ambiguous = ['▒', '▓', '█', '▌', '▏', '▕']; // ▒ ▓ █ ▌ ▏ ▕
  const src = read('src/render.js');
  const missing = [...neutral, ...ambiguous].filter((g) => !src.includes(g));
  const docHasAll = [...neutral, ...ambiguous].every((g) => doc.includes(g));
  return {
    ok: missing.length === 0 && docHasAll,
    detail: `glyphs documented-and-present: ${missing.length === 0}; every glyph appears in the docs: ${docHasAll}` +
      (missing.length ? ` MISSING FROM src/render.js: ${missing.map((g) => 'U+' + g.codePointAt(0).toString(16).toUpperCase()).join(' ')}` : ''),
  };
});

check('the "5-9 columns instead of 5" width claim is stated identically in both docs', () => {
  const a = flat(read('README.md'));
  const b = flat(read('REPORT.md'));
  const inA = /5[–-]9 columns/.test(a);
  const inB = /5[–-]9 columns/.test(b);
  return { ok: inA && inB, detail: `README=${inA} REPORT=${inB}` };
});

// ---------------------------------------------------------------------------
// C. repository shape — the definition-of-done clauses, re-measured not inherited
// ---------------------------------------------------------------------------

check('package.json declares no dependencies and no devDependencies', () => {
  const pkg = JSON.parse(read('package.json'));
  const d = 'dependencies' in pkg, dd = 'devDependencies' in pkg;
  return { ok: !d && !dd, detail: `dependencies key: ${d} · devDependencies key: ${dd}` };
});

check('no lockfile and no node_modules in the repo', () => {
  const root = readdirSync(T);
  const bad = root.filter((f) => /^(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|node_modules)$/.test(f));
  return { ok: bad.length === 0, detail: `repo root: ${root.filter((f) => f !== '.git' && f !== '.swarm').join(' ')} · offenders: ${bad.length ? bad.join(' ') : 'none'}` };
});

check('KI-8 is still open in the shape the owner ask describes: license claimed, no LICENSE file', () => {
  const pkg = JSON.parse(read('package.json'));
  const hasLicenseFile = existsSync(`${T}/LICENSE`) || existsSync(`${T}/LICENSE.md`) || existsSync(`${T}/LICENSE.txt`);
  const ask = read('.swarm/KI-8-OWNER-ACTION.md');
  const namesFile = /LICENSE/.test(ask);
  const namesLine = /Copyright \(c\)/.test(ask);
  return {
    ok: pkg.license === 'MIT' && pkg.private === false && !hasLicenseFile && namesFile && namesLine,
    detail: `pkg.license=${JSON.stringify(pkg.license)} pkg.private=${pkg.private} LICENSE file present=${hasLicenseFile} · ask names the file=${namesFile} names the copyright line=${namesLine}`,
  };
});

// ---------------------------------------------------------------------------
// D. the live test count, re-derived by RUNNING the suite (never inherited)
// ---------------------------------------------------------------------------

check('suite is green, and every live test-count claim in the docs agrees with the run', () => {
  const out = execFileSync('node', ['--test', 'test/cli.test.js', 'test/render.test.js', 'test/args.test.js', 'test/astro.test.js', 'test/hemisphere.test.js', 'test/report-issues.test.js'], { cwd: T, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const tests = g(/# tests (\d+)/), passed = g(/# pass (\d+)/), failed = g(/# fail (\d+)/);
  // Now: does any doc assert a LIVE (non-self-dating) test count that disagrees?
  const bad = [];
  for (const f of ['README.md', 'REPORT.md']) {
    lines(f).forEach((l, i) => {
      const m = l.match(/(\d{3})\s*(?:\/\s*\d{3})?\s*tests?\b/);
      if (!m) return;
      const n = Number(m[1]);
      if (n === tests) return;                                  // agrees with the live count
      if (/as of|until this|at cycle|run \d|kickoff|baseline|when /i.test(l)) return; // self-dating
      bad.push(`${f}:${i + 1} claims ${n}: ${l.trim().slice(0, 110)}`);
    });
  }
  return {
    ok: failed === 0 && bad.length === 0,
    detail: `LIVE SUITE: tests ${tests} pass ${passed} fail ${failed}` +
      (bad.length ? `\n           UNDATED COUNT CLAIMS DISAGREEING WITH THE LIVE COUNT:\n           ${bad.join('\n           ')}` : `\n           no undated doc count claim disagrees with ${tests}`),
  };
});

// ---------------------------------------------------------------------------

for (const r of results) {
  console.log(r.verdict.padEnd(8), r.name);
  console.log('         ', String(r.detail).split('\n').join('\n          '));
}
console.log(`\nAUDIT: ${pass} pass / ${fail} fail / ${partial} partial`);
process.exit(fail ? 1 : 0);
