#!/usr/bin/env node
'use strict';

/**
 * T-145 — Witness/classification harness for the 8 SURVIVORS found by
 * c54-sweep.js (IT3, IT4, IL1, LK1, ND1, ND2, EL1, EL2).
 *
 * This does NOT touch any tracked file. It reads the pristine src/astro.js,
 * builds "debug" variants (pristine and each survivor mutant, each with a
 * few more internal functions/constants added to module.exports so this
 * script can introspect them) into the OS tmpdir, requires them, and runs a
 * battery of targeted numerical searches to settle each survivor as HOLE or
 * BOUNDARY with a concrete, computed witness rather than a hand argument.
 *
 * Run from the repo root:
 *   node .swarm/runs/c54-witness.js
 *
 * Output is deterministic given the (fixed) sample grids below.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ASTRO_PATH = path.join(REPO_ROOT, 'src', 'astro.js');
const DAY_MS = 86400000;

const pristineSrc = fs.readFileSync(ASTRO_PATH, 'utf8');

const EXPORT_LINE =
  `module.exports = { computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN };`;
const DEBUG_EXPORT_LINE =
  `module.exports = { computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN, ` +
  `normDeg, dateToJulianDay, deltaTDays, truePhaseJD, elongationDeg, lunationK, ` +
  `INSTANT_TOLERANCE_DAYS, SYNODIC_MONTH, MEAN_PHASE_EPOCH, JD_UNIX_EPOCH };`;

if ((pristineSrc.match(new RegExp(EXPORT_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
  throw new Error('export line not found exactly once in pristine src/astro.js -- witness harness is stale');
}

const MUTANTS = {
  IT3: {
    find: `const isInstantPhase = Math.abs(jd - instants[nearest][0]) <= INSTANT_TOLERANCE_DAYS;`,
    replace: `const isInstantPhase = Math.abs(jd - instants[nearest][0]) < INSTANT_TOLERANCE_DAYS;`,
  },
  IT4: {
    find: `if (Math.abs(jd - instants[n][0]) < Math.abs(jd - instants[nearest][0])) nearest = n;`,
    replace: `if (Math.abs(jd - instants[n][0]) <= Math.abs(jd - instants[nearest][0])) nearest = n;`,
  },
  IL1: {
    find: `const i = Math.abs(180 - phaseAngle);`,
    replace: `const i = 180 - phaseAngle;`,
  },
  LK1: {
    find: `let k = Math.round((jd - MEAN_PHASE_EPOCH) / SYNODIC_MONTH);`,
    replace: `let k = Math.floor((jd - MEAN_PHASE_EPOCH) / SYNODIC_MONTH);`,
  },
  ND1: {
    find: `if (x < 0) x += 360;`,
    replace: `if (x <= 0) x += 360;`,
  },
  ND2: {
    find: `return x >= 360 ? 0 : x;`,
    replace: `return x;`,
  },
  EL1: {
    find: `const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2`,
    replace: `const D = 297.8501921 + 445267.111403 * T - 0.0018819 * T2`,
  },
  EL2: {
    find: `const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2`,
    replace: `const Mp = 134.9633964 + 477198.867505 * T + 0.0087414 * T2`,
  },
};

function buildDebugModule(mutantSrcTransform) {
  let src = pristineSrc;
  if (mutantSrcTransform) {
    const { find, replace } = mutantSrcTransform;
    const first = src.indexOf(find);
    if (first === -1 || src.indexOf(find, first + 1) !== -1) {
      throw new Error(`mutant find string not unique/present: ${find}`);
    }
    src = src.split(find).join(replace);
  }
  const beforeCount = (src.match(/module\.exports = \{ computeMoon/g) || []).length;
  if (beforeCount !== 1) throw new Error('export line not found exactly once after mutation');
  src = src.replace(EXPORT_LINE, DEBUG_EXPORT_LINE);

  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'moon-witness-')),
    'astro-debug.js',
  );
  fs.writeFileSync(file, src, 'utf8');
  return require(file);
}

const pristine = buildDebugModule(null);
const debugModules = { pristine };
for (const id of Object.keys(MUTANTS)) debugModules[id] = buildDebugModule(MUTANTS[id]);

// ---------------------------------------------------------------------------
// Sample grid: k values spanning the module's declared consistency domain
// (PHASE_ILLUMINATION_CONSISTENCY_DOMAIN, years 1000-3000), stratified.
// ---------------------------------------------------------------------------
const { startMs, endMs } = pristine.PHASE_ILLUMINATION_CONSISTENCY_DOMAIN;
const jdStart = pristine.dateToJulianDay(new Date(startMs));
const jdEnd = pristine.dateToJulianDay(new Date(endMs));
const kStart = Math.ceil((jdStart - pristine.MEAN_PHASE_EPOCH) / pristine.SYNODIC_MONTH) - 2;
const kEnd = Math.floor((jdEnd - pristine.MEAN_PHASE_EPOCH) / pristine.SYNODIC_MONTH) + 2;
const K_STRIDE = 25; // ~1000 lunations sampled across the ~24700-lunation domain

const sampledKs = [];
for (let k = kStart; k <= kEnd; k += K_STRIDE) sampledKs.push(k);

console.log(`Domain: k in [${kStart}, ${kEnd}] (years 1000-3000), sampled every ${K_STRIDE} => ${sampledKs.length} lunations`);
console.log('');

// ===========================================================================
// IT3: dist <= 0.5 vs dist < 0.5 -- can any reachable integer-ms input hit
// the exact boundary dist === 0.5?
// ===========================================================================
(function investigateIT3() {
  console.log('=== IT3: instant-tolerance boundary <= vs < ===');
  let exactHits = 0;
  let minAbsDiffFromBoundary = Infinity;
  let checked = 0;
  for (const k of sampledKs) {
    for (const kk of [k, k + 0.25, k + 0.5, k + 0.75]) {
      const instant = pristine.truePhaseJD(kk);
      for (const sign of [-1, 1]) {
        const target = instant + sign * 0.5; // exact real boundary crossing
        const msFloat = (target - pristine.JD_UNIX_EPOCH) * DAY_MS;
        for (const ms of [Math.floor(msFloat), Math.ceil(msFloat)]) {
          checked++;
          const jd = pristine.dateToJulianDay(new Date(ms));
          const dist = Math.abs(jd - instant);
          const diffFromBoundary = Math.abs(dist - 0.5);
          if (dist === 0.5) exactHits++;
          if (diffFromBoundary < minAbsDiffFromBoundary) minAbsDiffFromBoundary = diffFromBoundary;
        }
      }
    }
  }
  console.log(`  checked ${checked} candidate integer-ms boundary points (nearest ms to the real crossing, both sides, all 4 phase types)`);
  console.log(`  exact dist===0.5 hits: ${exactHits}`);
  console.log(`  closest observed |dist-0.5|: ${minAbsDiffFromBoundary} days (${minAbsDiffFromBoundary * DAY_MS} ms)`);
  console.log('');
})();

// ===========================================================================
// IT4: nearest-instant tie-break -- can two consecutive instants ever be
// within 2*INSTANT_TOLERANCE_DAYS of each other (the only way a tie could
// land inside the region where isInstantPhase is true for either choice)?
// ===========================================================================
(function investigateIT4() {
  console.log('=== IT4: nearest-quarter tie-break reachability ===');
  let minGap = Infinity;
  let minGapAt = null;
  for (const k of sampledKs) {
    const vals = [k, k + 0.25, k + 0.5, k + 0.75, k + 1].map((kk) => pristine.truePhaseJD(kk));
    for (let i = 1; i < vals.length; i++) {
      const gap = vals[i] - vals[i - 1];
      if (gap < minGap) { minGap = gap; minGapAt = k; }
    }
  }
  const tol = pristine.INSTANT_TOLERANCE_DAYS;
  console.log(`  min adjacent-instant gap observed: ${minGap} days (near k=${minGapAt})`);
  console.log(`  2 * INSTANT_TOLERANCE_DAYS = ${2 * tol} days`);
  console.log(`  gap > 2*tolerance for all sampled k: ${minGap > 2 * tol}`);
  console.log(`  => a genuine tie can only occur near the MIDPOINT of two adjacent instants, at distance >= ${minGap / 2} days from each,`);
  console.log(`     which is always > INSTANT_TOLERANCE_DAYS (${tol}), so isInstantPhase is false regardless of which instant "nearest" resolves to.`);
  console.log('');
})();

// ===========================================================================
// IL1: illumination fold Math.abs(180-phaseAngle) dropped -- diff full
// computeMoon() output, pristine vs IL1, across many real Dates.
// ===========================================================================
(function investigateIL1() {
  console.log('=== IL1: illumination-fold Math.abs() drop -- full-output diff ===');
  const mutant = debugModules.IL1;
  let diffs = 0;
  let checked = 0;
  let maxIllumDiff = 0;
  for (const k of sampledKs) {
    for (const frac of [0, 0.1, 0.25, 0.37, 0.5, 0.63, 0.75, 0.9]) {
      const jd = pristine.truePhaseJD(k) + frac * pristine.SYNODIC_MONTH;
      const ms = Math.round((jd - pristine.JD_UNIX_EPOCH) * DAY_MS);
      if (ms < -8640000000000000 || ms > 8640000000000000) continue;
      checked++;
      const date = new Date(ms);
      const a = pristine.computeMoon(date);
      const b = mutant.computeMoon(date);
      const illumDiff = Math.abs(a.illumination - b.illumination);
      if (illumDiff > maxIllumDiff) maxIllumDiff = illumDiff;
      if (
        a.illumination !== b.illumination || a.phaseAngle !== b.phaseAngle ||
        a.cycleFraction !== b.cycleFraction || a.phaseName !== b.phaseName ||
        a.isInstantPhase !== b.isInstantPhase || a.age !== b.age
      ) {
        diffs++;
        if (diffs <= 3) {
          console.log(`  DIVERGENCE at ${date.toISOString()}: pristine.illumination=${a.illumination} mutant.illumination=${b.illumination}`);
        }
      }
    }
  }
  console.log(`  checked ${checked} real Dates spanning the full domain (8 phase-fractions x ${sampledKs.length} lunations)`);
  console.log(`  full-output divergences: ${diffs}`);
  console.log(`  max |illumination diff| observed: ${maxIllumDiff}`);
  // Direct bit-level check of the underlying claim (cos is even):
  let cosMismatches = 0;
  for (let deg = 0; deg < 3600; deg++) {
    const phaseAngle = deg / 10;
    const iPristine = Math.abs(180 - phaseAngle);
    const iMutant = 180 - phaseAngle;
    if (Math.cos(iPristine * Math.PI / 180) !== Math.cos(iMutant * Math.PI / 180)) cosMismatches++;
  }
  console.log(`  direct Math.cos(i*DEG) bit-equality check over phaseAngle in [0,360) step 0.1deg (3600 samples): mismatches=${cosMismatches}`);
  console.log('');
})();

// ===========================================================================
// LK1: lunationK seed Math.round -> Math.floor -- diff full computeMoon()
// output across a dense within-lunation sweep (where floor/round actually
// differ) plus a broad domain sweep.
// ===========================================================================
(function investigateLK1() {
  console.log('=== LK1: lunationK seed Math.round -> Math.floor -- full-output diff ===');
  const mutant = debugModules.LK1;
  let diffs = 0;
  let checked = 0;
  let seedDisagreements = 0;
  for (const k of sampledKs) {
    for (let step = 0; step < 100; step++) {
      const frac = step / 100; // dense within-lunation sweep, including near the
                                // 0.5-fraction region where round/floor seeds differ
      const jd = pristine.truePhaseJD(k) + frac * pristine.SYNODIC_MONTH;
      const ms = Math.round((jd - pristine.JD_UNIX_EPOCH) * DAY_MS);
      if (ms < -8640000000000000 || ms > 8640000000000000) continue;
      checked++;
      const rawSeed = (jd - pristine.MEAN_PHASE_EPOCH) / pristine.SYNODIC_MONTH;
      if (Math.round(rawSeed) !== Math.floor(rawSeed)) seedDisagreements++;
      const date = new Date(ms);
      const a = pristine.computeMoon(date);
      const b = mutant.computeMoon(date);
      const same = a.julianDay === b.julianDay && a.age === b.age && a.cycleFraction === b.cycleFraction &&
        a.phaseAngle === b.phaseAngle && a.illumination === b.illumination && a.phaseName === b.phaseName &&
        a.isInstantPhase === b.isInstantPhase;
      if (!same) {
        diffs++;
        if (diffs <= 3) console.log(`  DIVERGENCE at ${date.toISOString()}: pristine.age=${a.age} mutant.age=${b.age}`);
      }
    }
  }
  console.log(`  checked ${checked} dates (100 within-lunation fractions x ${sampledKs.length} lunations, spanning the full domain)`);
  console.log(`  seed disagreements (round!=floor at that jd): ${seedDisagreements} of ${checked}`);
  console.log(`  full-output divergences despite seed disagreement: ${diffs}`);
  console.log('');
})();

// ===========================================================================
// ND1/ND2: normDeg boundary handling. Two parts:
//  (a) contrived adversarial inputs directly against normDeg
//  (b) real reachable inputs: how close does elongationDeg's actual pre-fold
//      value ever get to the edges these mutants touch?
// ===========================================================================
(function investigateND1ND2() {
  console.log('=== ND1/ND2: normDeg boundary handling ===');

  const adversarial = [0, -0, 360, -360, 720, -720, 1e10 * 360, -(1e10 * 360) - 1e-6];
  console.log('  Adversarial direct normDeg(x) calls:');
  for (const x of adversarial) {
    const p = pristine.normDeg(x);
    const n1 = debugModules.ND1.normDeg(x);
    const n2 = debugModules.ND2.normDeg(x);
    console.log(`    x=${Object.is(x, -0) ? '-0' : x}: pristine=${Object.is(p, -0) ? '-0' : p} ND1=${Object.is(n1, -0) ? '-0' : n1} ND2=${Object.is(n2, -0) ? '-0' : n2}`);
  }

  // Does raw x%360 (JS's own modulo) ever land on exactly +-360 for a big
  // spread of large multiples-of-360-minus-epsilon doubles? This is the only
  // way ND2's dropped guard could ever matter (see report reasoning).
  let modHits360 = 0;
  let closestModTo360 = 0;
  for (let n = 1; n <= 200000; n++) {
    const x = 360 * n - Number.EPSILON * n * 360; // just under an exact multiple
    const r = x % 360;
    const distTo360 = Math.abs(Math.abs(r) - 360);
    if (Math.abs(r) === 360) modHits360++;
    if (n === 1 || distTo360 < closestModTo360) closestModTo360 = distTo360;
  }
  console.log(`  x%360 exact-360 hits over 200000 near-multiple probes: ${modHits360} (closest |r| approached 360 within ${closestModTo360})`);

  // Real reachable domain: how close does elongationDeg's output (phaseAngle,
  // i.e. normDeg's return value) ever get to exactly 0 across the sampled
  // domain? (ND1 only differs at x===0/-0 entering the branch; the RETURN
  // value close to 0 is a proxy for how close the pre-fold x got to 0/-0/-360.)
  let minAbsPhaseAngleFrom0 = Infinity;
  let minAbsPhaseAngleFrom360 = Infinity;
  let exactZeroHits = 0;
  let checked = 0;
  for (const k of sampledKs) {
    for (let step = 0; step < 20; step++) {
      const jd = pristine.truePhaseJD(k) + (step / 20) * pristine.SYNODIC_MONTH;
      checked++;
      const pa = pristine.elongationDeg(jd);
      if (pa === 0 || Object.is(pa, -0)) exactZeroHits++;
      if (pa < minAbsPhaseAngleFrom0) minAbsPhaseAngleFrom0 = pa;
      if (360 - pa < minAbsPhaseAngleFrom360) minAbsPhaseAngleFrom360 = 360 - pa;
    }
  }
  console.log(`  checked ${checked} real elongationDeg(jd) evaluations across the sampled domain`);
  console.log(`  exact 0/-0 hits: ${exactZeroHits}`);
  console.log(`  closest observed phaseAngle to 0: ${minAbsPhaseAngleFrom0} deg; to 360: ${minAbsPhaseAngleFrom360} deg`);
  console.log('');
})();

// ===========================================================================
// EL1/EL2: subtle last-digit coefficient drops in elongationDeg's D and Mp
// mean-argument rate terms. Measure the ACTUAL numeric divergence they cause
// in phaseAngle/cycleFraction/illumination across the domain, and compare to
// (a) the CLI's own rendering resolution (illumination -> whole percent,
// src/render.js:235; cycleFraction -> only its waxing/waning half via
// f<0.5, src/render.js:150) and (b) the suite's tightest relevant tolerance.
// ===========================================================================
(function investigateELx(id, label) {
  console.log(`=== ${id}: ${label} -- measured divergence ===`);
  const mutant = debugModules[id];
  let maxPhaseAngleDiff = 0, maxIllumDiff = 0, maxCycleFractionDiff = 0;
  let maxAtDate = null;
  let checked = 0;
  for (const k of sampledKs) {
    for (const frac of [0, 0.25, 0.5, 0.75]) {
      const jd = pristine.truePhaseJD(k) + frac * pristine.SYNODIC_MONTH;
      const ms = Math.round((jd - pristine.JD_UNIX_EPOCH) * DAY_MS);
      if (ms < -8640000000000000 || ms > 8640000000000000) continue;
      checked++;
      const date = new Date(ms);
      const a = pristine.computeMoon(date);
      const b = mutant.computeMoon(date);
      const dPA = Math.abs(a.phaseAngle - b.phaseAngle);
      const dIL = Math.abs(a.illumination - b.illumination);
      const dCF = Math.abs(a.cycleFraction - b.cycleFraction);
      if (dPA > maxPhaseAngleDiff) { maxPhaseAngleDiff = dPA; maxAtDate = date; }
      if (dIL > maxIllumDiff) maxIllumDiff = dIL;
      if (dCF > maxCycleFractionDiff) maxCycleFractionDiff = dCF;
      // age/phaseName/isInstantPhase must be UNTOUCHED (elongationDeg doesn't feed them):
      if (a.age !== b.age || a.phaseName !== b.phaseName || a.isInstantPhase !== b.isInstantPhase) {
        console.log(`  UNEXPECTED: age/phaseName/isInstantPhase diverged at ${date.toISOString()} -- elongationDeg leaking into truePhaseJD-derived fields?`);
      }
    }
  }
  console.log(`  checked ${checked} dates across the full sampled domain`);
  console.log(`  max |phaseAngle diff|: ${maxPhaseAngleDiff} deg, at ${maxAtDate ? maxAtDate.toISOString() : 'n/a'}`);
  console.log(`  max |illumination diff|: ${maxIllumDiff}`);
  console.log(`  max |cycleFraction diff|: ${maxCycleFractionDiff}`);
  console.log(`  rendered illumination resolution: whole percent (1/100 = 0.01) -- max diff is ${(maxIllumDiff / 0.01).toExponential(3)}x that`);
  console.log('');
})('EL1', "eq.(47.2) D rate term last digit dropped");
(function () {
  const mutant = debugModules.EL2;
  const pristineMod = pristine;
  console.log(`=== EL2: eq.(47.4) Mp rate term last digit dropped -- measured divergence ===`);
  let maxPhaseAngleDiff = 0, maxIllumDiff = 0, maxCycleFractionDiff = 0;
  let maxAtDate = null;
  let checked = 0;
  for (const k of sampledKs) {
    for (const frac of [0, 0.25, 0.5, 0.75]) {
      const jd = pristineMod.truePhaseJD(k) + frac * pristineMod.SYNODIC_MONTH;
      const ms = Math.round((jd - pristineMod.JD_UNIX_EPOCH) * DAY_MS);
      if (ms < -8640000000000000 || ms > 8640000000000000) continue;
      checked++;
      const date = new Date(ms);
      const a = pristineMod.computeMoon(date);
      const b = mutant.computeMoon(date);
      const dPA = Math.abs(a.phaseAngle - b.phaseAngle);
      const dIL = Math.abs(a.illumination - b.illumination);
      const dCF = Math.abs(a.cycleFraction - b.cycleFraction);
      if (dPA > maxPhaseAngleDiff) { maxPhaseAngleDiff = dPA; maxAtDate = date; }
      if (dIL > maxIllumDiff) maxIllumDiff = dIL;
      if (dCF > maxCycleFractionDiff) maxCycleFractionDiff = dCF;
      if (a.age !== b.age || a.phaseName !== b.phaseName || a.isInstantPhase !== b.isInstantPhase) {
        console.log(`  UNEXPECTED: age/phaseName/isInstantPhase diverged at ${date.toISOString()}`);
      }
    }
  }
  console.log(`  checked ${checked} dates across the full sampled domain`);
  console.log(`  max |phaseAngle diff|: ${maxPhaseAngleDiff} deg, at ${maxAtDate ? maxAtDate.toISOString() : 'n/a'}`);
  console.log(`  max |illumination diff|: ${maxIllumDiff}`);
  console.log(`  max |cycleFraction diff|: ${maxCycleFractionDiff}`);
  console.log(`  rendered illumination resolution: whole percent (1/100 = 0.01) -- max diff is ${(maxIllumDiff / 0.01).toExponential(3)}x that`);
  console.log('');
})();

console.log('Done.');
