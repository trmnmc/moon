#!/usr/bin/env node
// SWARM cycle 82 verification gate for T-176.
// Criteria authored BEFORE the builder was dispatched (see the cycle-82 journal block);
// materialised here at verification time so the builder could never read it.
//
// Claim under test: test/render.test.js now PINS the cross-surface visibility boundary
// between renderLine and renderBlock as deliberate, such that the pin fails if EITHER
// surface's low-k threshold moves; test-only; src/ untouched.
//
// The conductor's mutations below are chosen INDEPENDENTLY of the builder's two.

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TARGET = '/opt/targets/moon';
let hardFail = false;

function record(id, ok, detail) {
  if (!ok) hardFail = true;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}\n        ${detail}`);
}

function sh(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: false });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

function runSuite(dir) {
  const files = execFileSync('sh', ['-c', 'ls test/*.test.js'], { cwd: dir, encoding: 'utf8' })
    .trim()
    .split('\n');
  return sh(process.execPath, ['--test', ...files], dir);
}

const failedTestNames = (out) =>
  [...out.matchAll(/^(?:not ok \d+ - |✖ )(.+?)(?: \(\d[\d.]*ms\))?$/gm)].map((m) => m[1].trim());

const testNames = (src) =>
  new Set([...src.matchAll(/^\s*test\(\s*(['"`])([\s\S]*?)\1\s*,/gm)].map((m) => m[2].trim()));

const work = mkdtempSync(join(tmpdir(), 'moon-gate-082-'));
const NEW = join(work, 'new');
const OLD = join(work, 'old');

// --- G2: scope — test-only, src/ untouched --------------------------------
const changed = sh('git', ['-C', TARGET, 'diff', 'HEAD', '--name-only'], TARGET)
  .out.trim().split('\n').filter(Boolean);
const untracked = sh('git', ['-C', TARGET, 'ls-files', '--others', '--exclude-standard'], TARGET)
  .out.trim().split('\n').filter(Boolean)
  .filter((f) => !f.startsWith('.swarm/'));
const touched = [...new Set([...changed, ...untracked])].sort();
record('G2-scope', touched.length === 1 && touched[0] === 'test/render.test.js',
  `changed = ${JSON.stringify(touched)} (must be exactly ["test/render.test.js"])`);

// INSTRUMENT CORRECTION 1 (cycle 82): .swarm/ must be copied. test/contracts.test.js
// reads .swarm/CONTRACTS.md at module load, so excluding it made every scratch tree
// fail for a reason unrelated to the claim under test. `git archive HEAD` carries
// .swarm already; only the working-tree copy needed fixing.
cpSync(TARGET, NEW, { recursive: true, filter: (s) => !s.startsWith(`${TARGET}/.git/`) });
execFileSync('sh', ['-c', `mkdir -p '${OLD}' && git -C ${TARGET} archive HEAD | tar -x -C '${OLD}'`]);

// --- G1: the delivered suite passes ---------------------------------------
const base = runSuite(NEW);
const counts = (base.out.match(/^# (?:tests|pass|fail) \d+$/gm) || []).join(' ');
record('G1-suite', base.code === 0, `node --test exit=${base.code}  ${counts}`);

// --- G3: independent re-measurement of the band ---------------------------
const probe = `
const { renderLine, renderBlock } = require('${NEW}/src/render.js');
const SYNODIC = 29.530588861;
const st = (k) => ({ julianDay: 2451550.09766 + 0.05 * SYNODIC, age: 0.05 * SYNODIC,
  cycleFraction: 0.05, phaseAngle: 18, illumination: k, phaseName: 'waxing crescent',
  isInstantPhase: false });
const DARK = new Set([' ', '\\u2591']);
const lineLit = (k) => [...renderLine(st(k), 'north').slice(0, 5)].some((c) => !DARK.has(c));
// INSTRUMENT CORRECTION 2 (cycle 82): scan the FIVE DISC ROWS ONLY. The first pass
// scanned every row of the framed block, so the caption row's letters ("waxing
// crescent") counted as lit and the probe reported firstBlock = 0 for every k.
const blockLit = (k) => renderBlock(st(k), 'north').split('\\n').slice(1, 6)
  .some((r) => [...r.replace(/^\\u2502|\\u2502$/g, '')].some((c) => !DARK.has(c)));
let firstLine = null, firstBlock = null;
for (let i = 0; i <= 40000 && (firstLine === null || firstBlock === null); i++) {
  const k = i * 5e-7;
  if (firstBlock === null && blockLit(k)) firstBlock = k;
  if (firstLine === null && lineLit(k)) firstLine = k;
}
console.log(JSON.stringify({ firstBlock, firstLine }));
`;
const meas = sh(process.execPath, ['-e', probe], NEW);
let band = { firstBlock: null, firstLine: null };
try { band = JSON.parse(meas.out.trim().split('\n').pop()); } catch { /* leave nulls */ }
const bandOk = band.firstBlock !== null && band.firstLine !== null &&
  band.firstBlock < band.firstLine &&
  Math.abs(band.firstBlock - 0.0007) < 0.0005 &&
  Math.abs(band.firstLine - 0.00655) < 0.0008;
record('G3-band', bandOk,
  `re-measured firstBlock=${band.firstBlock} firstLine=${band.firstLine} ` +
  `(width ${band.firstLine !== null ? (band.firstLine - band.firstBlock).toFixed(5) : '?'}; recorded 0.0007 / 0.00655)`);

// --- G6: which tests are new this cycle -----------------------------------
const newSrc = readFileSync(join(NEW, 'test/render.test.js'), 'utf8');
const oldSrc = readFileSync(join(OLD, 'test/render.test.js'), 'utf8');
const oldNames = testNames(oldSrc);
const added = [...testNames(newSrc)].filter((n) => !oldNames.has(n));
record('G6-added', added.length > 0, `added: ${JSON.stringify(added, null, 1)}`);

// --- G4/G5: two arms per conductor mutation -------------------------------
const MUTATIONS = [
  { name: 'LINE: lineArt outer-cell cut 0.02 -> 0.0001',
    from: 'if (cover < 0.02) out += LIMB_DARK;',
    to: 'if (cover < 0.0001) out += LIMB_DARK;' },
  // Gross removal of the rescue. Kept in the record because it is honest evidence about
  // the PRE-CYCLE suite, not about the new pin: three existing renderBlock contiguity
  // tests already kill it, so it can never demonstrate attribution. Marked non-attributable
  // so the gate reports it without failing on it.
  { name: 'BLOCK-a: blockArt allDark hairline rescue disabled entirely',
    from: "const allDark = row.every((ch) => ch === ' ' || ch === SHADE[0]);",
    to: 'const allDark = false;',
    attributable: false },
  // The real block arm. Chosen by MEASURING what the pre-cycle suite covers: its lowest
  // block-rescue k is the 0.00160..0.00195 sweep, plus k=0.014 and k=0.02447. Gating the
  // rescue at k >= 0.0015 therefore leaves every pre-existing test untouched while moving
  // the BLOCK surface's low-k visibility threshold — exactly the drift the pin must catch.
  { name: 'BLOCK-b: blockArt hairline rescue gated to k >= 0.0015 (block low-k threshold moves)',
    from: '    if (allDark) {',
    to: '    if (allDark && k >= 0.0015) {',
    attributable: true },
];

for (const m of MUTATIONS) {
  for (const tree of [OLD, NEW]) {
    const arm = tree === OLD ? 'attribution: pre-cycle suite must SURVIVE' : 'failability: new suite must DIE';
    const f = join(tree, 'src/render.js');
    const orig = readFileSync(f, 'utf8');
    if (!orig.includes(m.from)) { record(`${m.name} [${arm}]`, false, 'mutation anchor not found'); continue; }
    writeFileSync(f, orig.replace(m.from, m.to));
    const r = runSuite(tree);
    writeFileSync(f, orig);
    if (tree === OLD) {
      const ok = m.attributable === false ? true : r.code === 0;
      record(`${m.name} [${arm}]`, ok,
        `pre-cycle suite exit=${r.code} (0 = mutant survives => a later kill is attributable)` +
        (m.attributable === false ? ' [reported only — this mutation is not the attribution arm]' : ''));
    } else {
      const failed = failedTestNames(r.out);
      const hits = failed.filter((n) => added.includes(n));
      record(`${m.name} [${arm}]`, r.code !== 0 && hits.length > 0,
        `exit=${r.code}; killed-by-new-test=${JSON.stringify(hits)}; all-failing=${JSON.stringify(failed)}`);
    }
  }
}

// --- G7: the 0% label is pinned alongside the art -------------------------
const labelPinned = added.some((n) => {
  const i = newSrc.indexOf(n);
  return i > 0 && /0%/.test(newSrc.slice(i, i + 2500));
});
record('G7-label', labelPinned, 'an added test asserts the 0% label inside the band');

// --- G8: the written BOUNDARY caveat ships with the pin -------------------
// INSTRUMENT CORRECTION 3 (cycle 82): check the caveat inside the ADDED lines, not by
// file-wide novelty. The pre-cycle file already used the word BOUNDARY (line 770, the
// T-16x plateau pin), so `absent-before && present-after` could never be true however
// good the new comment was. What the gate actually wants to know is whether THIS pin
// ships with THIS classification argument.
const addedLines = sh('git', ['-C', TARGET, 'diff', '-U0', 'HEAD', '--', 'test/render.test.js'], TARGET)
  .out.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
const caveat = /BOUNDARY/i.test(addedLines) && /not\s+HOLE|not a HOLE/i.test(addedLines) &&
  /resolution|BLOCK_COLS|DISC_CELLS/i.test(addedLines);
record('G8-caveat', caveat,
  'the added lines carry a BOUNDARY-not-HOLE classification naming the resolution argument');

console.log(`\n--- GATE VERDICT: ${hardFail ? 'FAILED' : 'PASSED'} ---`);
rmSync(work, { recursive: true, force: true });
process.exit(hardFail ? 1 : 0);
