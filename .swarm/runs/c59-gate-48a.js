'use strict';
// CONDUCTOR GATE for T-148 attempt 2 (cycle 59). Authored BEFORE reading the
// builder's output, and it does not require, read, or execute the builder's
// script. It answers one question the item hangs on:
//
//   Is the committed pair 0.6801 / 0.6475 a consequence of a PARTICULAR chosen
//   DeltaT (in which case the figure is only as good as that choice), or is it
//   robust across every DeltaT anyone could reasonably assign to 1992?
//
// The distinction matters because cycle 58 settled the figure using dT = 58.3 s
// (the published historical value) while src/astro.js ships its own deltaTDays()
// whose polynomial is scoped to 2005-2050 and, extrapolated back to 1992, gives a
// different number. If those two disagreed at 4 dp, "0.6801" would be a frame
// choice wearing the costume of a measurement.
//
// Read-only: requires the module's public surface, mutates nothing.

const { computeMoon } = require('../../src/astro.js');

const SYNODIC = 29.530588853;              // the fake's divisor, as used since v0.1.0
const fakeFrom = (age) => (1 - Math.cos(2 * Math.PI * (age / SYNODIC))) / 2;

// Meeus example 48.a: 1992 April 12.0 TD.
const TD_MS = Date.UTC(1992, 3, 12, 0, 0, 0);
const at = (dtSeconds) => computeMoon(new Date(TD_MS - dtSeconds * 1000));

const r4 = (x) => x.toFixed(4);

console.log('=== G1  naive control: UT = TD, i.e. dT = 0 (what attempt 1 ran) ===');
const g1 = at(0);
console.log(`  illum = ${g1.illumination.toFixed(8)} -> ${r4(g1.illumination)}`);
console.log(`  age   = ${g1.age.toFixed(6)}  fake = ${fakeFrom(g1.age).toFixed(8)} -> ${r4(fakeFrom(g1.age))}`);
const g1ok = r4(g1.illumination) === '0.6802' && r4(fakeFrom(g1.age)) === '0.6476';
console.log(`  G1 reproduces attempt 1's 0.6802/0.6476 : ${g1ok}`);
console.log('  (a control: if this did NOT reproduce, my instrument is not the module attempt 1 ran)');

console.log('');
console.log('=== G2  DeltaT sweep, 40..80 s in 0.1 s steps ===');
let bandLo = null, bandHi = null, offBand = [];
for (let dt = 40.0; dt <= 80.0 + 1e-9; dt += 0.1) {
  const dtr = Math.round(dt * 10) / 10;
  const m = at(dtr);
  const pair = `${r4(m.illumination)}/${r4(fakeFrom(m.age))}`;
  if (pair === '0.6801/0.6475') {
    if (bandLo === null) bandLo = dtr;
    bandHi = dtr;
  } else {
    offBand.push(`${dtr}s -> ${pair}`);
  }
}
console.log(`  committed pair 0.6801/0.6475 holds for dT in [${bandLo}, ${bandHi}] s`);
console.log(`  first few dT values OUTSIDE that pair: ${offBand.slice(0, 3).join('  |  ') || '(none in 40..80)'}`);
console.log(`  last  few dT values OUTSIDE that pair: ${offBand.slice(-3).join('  |  ') || '(none in 40..80)'}`);

console.log('');
console.log('=== G3  the two DeltaT candidates a builder could defensibly pick ===');
// (a) published historical DeltaT for 1992 (the value cycle 58 used).
// (b) src/astro.js:96-103 deltaTDays(), re-implemented here from source rather
//     than imported (it is not exported). Its doc comment scopes it to 2005-2050,
//     so at 1992 it is an extrapolation -- which is exactly the judgement call.
const JD_1992_APR_12 = 2448724.5;
const tYears = (JD_1992_APR_12 - 2451545.0) / 365.25;
const dtModule = 62.92 + 0.32217 * tYears + 0.005589 * tYears * tYears;
const candidates = [['historical 1992 (cycle 58 used this)', 58.3], ['src/astro.js deltaTDays() extrapolated', dtModule]];
let allAgree = true;
for (const [label, dt] of candidates) {
  const m = at(dt);
  const pair = `${r4(m.illumination)}/${r4(fakeFrom(m.age))}`;
  const inBand = dt >= bandLo && dt <= bandHi;
  if (pair !== '0.6801/0.6475') allAgree = false;
  console.log(`  ${label}: dT = ${dt.toFixed(2)} s -> ${pair}   (inside robust band: ${inBand})`);
}
console.log(`  both defensible choices give the committed pair : ${allAgree}`);

console.log('');
console.log('=== VERDICT ===');
console.log(`  G1 control reproduces the attempt-1 artifact      : ${g1ok}`);
console.log(`  G2 committed pair robust across dT ${bandLo}-${bandHi} s     : ${bandLo !== null}`);
console.log(`  G3 insensitive to the DeltaT judgement call       : ${allAgree}`);
console.log(`  GATE: ${g1ok && allAgree && bandLo !== null ? 'PASS -- 0.6801/0.6475 is a property of the module, not of a chosen dT' : 'FAIL'}`);
