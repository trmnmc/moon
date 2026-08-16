'use strict';
// CONDUCTOR GATE, part 2 -- T-148 attempt 2 (cycle 59).
//
// Part 1 (c59-gate-48a.js) proved the committed pair is insensitive to the
// DeltaT judgement call. That is a claim about the FRAME. It says nothing about
// whether the builder's probe actually derives its two numbers from the module,
// nor about the REPORT row's actual assertion, which is not "the number is
// 0.6801" but:
//
//   "Illumination is true elongation, not faked from age ... an age-derived
//    fake gives 0.6475. Conclusive discriminator."
//
// That claim is only true if the two printed figures travel INDEPENDENT paths
// through src/astro.js: illumination from the ch.48 elongation series, the fake
// from `age`, which comes from the ch.49 true-phase instant tables. A probe that
// hardcoded its output, or a module where both figures secretly shared one
// source, would print identical numbers and be indistinguishable by reading.
//
// So: perturb ONE path at a time in the real source and re-run the BUILDER'S OWN
// probe unmodified. Expected, if the row's claim holds:
//   M1 (elongation perturbed): illumination MOVES, fake HOLDS
//   M2 (age perturbed):        fake MOVES, illumination HOLDS
// A figure that does not move under its own path's mutation is not produced by
// that path. Source is restored byte-identical and checked.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src/astro.js');
const PROBE = path.join(ROOT, '.swarm/runs/c59-meeus-48a-td-probe.js');

const original = fs.readFileSync(SRC);
const crypto = require('crypto');
const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
const originalMd5 = md5(original);
console.log('src/astro.js md5 before :', originalMd5);

const text = original.toString('utf8');

// The two anchor lines, taken from the source as it stands.
const ANCHOR_ELONG = '  const phaseAngle = elongationDeg(jd);';
const ANCHOR_AGE = '  const age = jd - instants[0][0];';
for (const [name, a] of [['elongation', ANCHOR_ELONG], ['age', ANCHOR_AGE]]) {
  const n = text.split(a).length - 1;
  if (n !== 1) { console.error(`ABORT: ${name} anchor matched ${n} times, expected 1`); process.exit(2); }
}

const MUTANTS = [
  // Perturb ONLY the ch.48 elongation path.
  { id: 'M1', what: 'phaseAngle += 0.01 deg (ch.48 elongation path)',
    from: ANCHOR_ELONG, to: '  const phaseAngle = elongationDeg(jd) + 0.01;',
    expect: { illumMoves: true, fakeMoves: false } },
  // Perturb ONLY the ch.49-derived age path.
  { id: 'M2', what: 'age += 0.01 d (ch.49 true-phase instant path)',
    from: ANCHOR_AGE, to: '  const age = jd - instants[0][0] + 0.01;',
    expect: { illumMoves: false, fakeMoves: true } },
];

function runProbe() {
  const out = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
  const grab = (label) => {
    const line = out.split('\n').find((l) => l.startsWith(label));
    if (!line) throw new Error(`probe output missing line: ${label}`);
    return line.split('=').pop().trim();
  };
  return {
    illum: grab('module illumination (4dp)'),
    fake: grab('age-derived fake (4dp)'),
  };
}

let baseline, results = [];
try {
  baseline = runProbe();
  console.log(`baseline (unmutated source): illum=${baseline.illum} fake=${baseline.fake}`);
  console.log('');

  for (const mut of MUTANTS) {
    fs.writeFileSync(SRC, text.replace(mut.from, mut.to));
    const got = runProbe();
    const illumMoves = got.illum !== baseline.illum;
    const fakeMoves = got.fake !== baseline.fake;
    const pass = illumMoves === mut.expect.illumMoves && fakeMoves === mut.expect.fakeMoves;
    results.push(pass);
    console.log(`${mut.id}  ${mut.what}`);
    console.log(`     illum ${baseline.illum} -> ${got.illum}   (moved: ${illumMoves}, expected ${mut.expect.illumMoves})`);
    console.log(`     fake  ${baseline.fake} -> ${got.fake}   (moved: ${fakeMoves}, expected ${mut.expect.fakeMoves})`);
    console.log(`     ${mut.id}: ${pass ? 'PASS' : 'FAIL'}`);
    console.log('');
  }
} finally {
  fs.writeFileSync(SRC, original);
}

const afterMd5 = md5(fs.readFileSync(SRC));
console.log('src/astro.js md5 after  :', afterMd5, afterMd5 === originalMd5 ? '(RESTORED byte-identical)' : '(*** NOT RESTORED ***)');
console.log('');
console.log(`GATE part 2: ${results.every(Boolean) && afterMd5 === originalMd5 ? 'PASS -- the two figures are produced by independent paths, and the probe reads the live module' : 'FAIL'}`);
