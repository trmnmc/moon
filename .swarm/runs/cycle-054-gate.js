#!/usr/bin/env node
'use strict';

/**
 * Cycle 54 CONDUCTOR gate for T-145. Written at verification time, independently of
 * the builder's harness and of anything the builder returned. Three checks:
 *
 *   GATE A — IT3: does the pristine/mutant divergence reproduce, on the witness the
 *            builder claimed sits INSIDE the documented 1990-2060 accuracy window?
 *            (The builder's headline witness was year 1003, which is far weaker.)
 *   GATE B — AG1: is the claimed KILL of the age mean-month clamp real, and which
 *            tests actually kill it? (This is the acceptance's named behavior (c);
 *            a claimed protection that isn't there is the defect this run exists for.)
 *   GATE C — CI1: is the claimed KILL of "cycleFraction re-derived FROM illumination"
 *            real? (Acceptance's named behavior (b), same reasoning.)
 *
 * Run from the repo root:  node .swarm/runs/cycle-054-gate.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..', '..');
const SRC = path.join(REPO, 'src', 'astro.js');
const pristineSrc = fs.readFileSync(SRC, 'utf8');

function loadVariant(tag, find, replace) {
  if (find !== null) {
    const n = pristineSrc.split(find).length - 1;
    if (n !== 1) throw new Error(`${tag}: find string occurs ${n} times, expected exactly 1`);
  }
  const body = find === null ? pristineSrc : pristineSrc.split(find).join(replace);
  const file = path.join(os.tmpdir(), `moon-gate-${tag}-${process.pid}.js`);
  fs.writeFileSync(file, body, 'utf8');
  return require(file);
}

const IT3_FIND = `const isInstantPhase = Math.abs(jd - instants[nearest][0]) <= INSTANT_TOLERANCE_DAYS;`;
const IT3_REPL = `const isInstantPhase = Math.abs(jd - instants[nearest][0]) < INSTANT_TOLERANCE_DAYS;`;

// ---------------------------------------------------------------------------
// GATE A — IT3 divergence, reproduced by the conductor
// ---------------------------------------------------------------------------
console.log('=== GATE A: IT3 (<= -> <) divergence on the public computeMoon API ===');

const truth = loadVariant('truth', null, null);
const it3 = loadVariant('it3', IT3_FIND, IT3_REPL);

// The builder's two claimed in-window witnesses, plus its headline year-1003 one.
const WITNESSES = [
  '2016-08-02T08:44:38.430Z',
  '2000-06-02T00:13:59.330Z',
  '1003-12-17T04:08:08.598Z',
];

let diverged = 0;
for (const iso of WITNESSES) {
  const d = new Date(iso);
  const t = truth.computeMoon(d);
  const m = it3.computeMoon(d);
  const same = t.phaseName === m.phaseName && t.isInstantPhase === m.isInstantPhase;
  if (!same) diverged++;
  console.log(`  ${iso}`);
  console.log(`    truth : phaseName=${JSON.stringify(t.phaseName)} isInstantPhase=${t.isInstantPhase}`);
  console.log(`    IT3   : phaseName=${JSON.stringify(m.phaseName)} isInstantPhase=${m.isInstantPhase}`);
  console.log(`    -> ${same ? 'IDENTICAL' : 'DIVERGES'}`);
}
console.log(`  witnesses diverging: ${diverged}/${WITNESSES.length}`);

// Is the divergence really an EXACT-equality effect, or does it span a range?
// Walk +/- 3 ms around the strongest in-window witness.
console.log('');
console.log('  neighbourhood of 2016-08-02T08:44:38.430Z (is the divergence measure-zero?):');
const base = new Date('2016-08-02T08:44:38.430Z').getTime();
for (let off = -3; off <= 3; off++) {
  const d = new Date(base + off);
  const t = truth.computeMoon(d);
  const m = it3.computeMoon(d);
  const mark = t.isInstantPhase === m.isInstantPhase ? ' ' : '*';
  console.log(
    `   ${mark} ${off >= 0 ? '+' : ''}${off} ms  truth=${String(t.isInstantPhase).padEnd(5)} it3=${String(m.isInstantPhase).padEnd(5)} name(truth)=${t.phaseName}`,
  );
}

// ---------------------------------------------------------------------------
// GATE B / C — are the two named-behavior KILLS real?
// ---------------------------------------------------------------------------
const TEST_FILES = fs
  .readdirSync(path.join(REPO, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort();

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-gate-'));
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: REPO, maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}

function killCheck(tag, find, replace) {
  console.log('');
  console.log(`=== ${tag} ===`);
  const n = pristineSrc.split(find).length - 1;
  if (n !== 1) throw new Error(`${tag}: find occurs ${n} times`);
  const dir = freshCopy();
  try {
    fs.writeFileSync(
      path.join(dir, 'src', 'astro.js'),
      pristineSrc.split(find).join(replace),
      'utf8',
    );
    // Which individual test FILES go red, and which named tests inside them.
    const redTests = [];
    let anyRed = false;
    for (const f of TEST_FILES) {
      const r = spawnSync(process.execPath, ['--test', `test/${f}`], {
        cwd: dir,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      const out = r.stdout + r.stderr;
      const fail = /ℹ fail (\d+)/.exec(out);
      const failed = r.status !== 0 || (fail && Number(fail[1]) > 0);
      if (failed) {
        anyRed = true;
        for (const line of out.split('\n')) {
          const m = /^not ok \d+ - (.+)$/.exec(line.trim());
          if (m) redTests.push(`${f} :: ${m[1]}`);
        }
      }
    }
    console.log(`  suite verdict: ${anyRed ? 'RED (mutant KILLED)' : 'GREEN (mutant SURVIVED)'}`);
    console.log(`  killing tests (${redTests.length}):`);
    for (const t of redTests.slice(0, 10)) console.log(`    - ${t}`);
    if (redTests.length > 10) console.log(`    ... and ${redTests.length - 10} more`);
    return anyRed;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const agOk = killCheck(
  'GATE B: AG1 — age re-clamped to SYNODIC_MONTH (the historical bug)',
  `const age = jd - instants[0][0];`,
  `const age = Math.min(jd - instants[0][0], SYNODIC_MONTH);`,
);

const ciOk = killCheck(
  'GATE C: CI1 — cycleFraction re-derived FROM illumination',
  `const cycleFraction = phaseAngle / 360;`,
  `const cycleFraction = illumination;`,
);

console.log('');
console.log('=== GATE SUMMARY ===');
console.log(`  A: IT3 divergence reproduced on ${diverged}/${WITNESSES.length} claimed witnesses`);
console.log(`  B: AG1 (age clamp) killed by the suite: ${agOk}`);
console.log(`  C: CI1 (cycleFraction from illumination) killed by the suite: ${ciOk}`);
