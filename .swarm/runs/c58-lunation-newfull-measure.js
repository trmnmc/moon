'use strict';
// T-148 (cycle 58) — rerun, unmodified in method, of the exact measurement
// test/astro.test.js:410-477 performs ("measured lunation length and
// new->full interval over 1990-2060 match the documented figures"). That
// test only ASSERTS against DOCUMENTED_MIN/MAX_LUNATION_DAYS and
// DOCUMENTED_MIN/MAX/MEAN_NEWFULL_DAYS; it never prints the measured
// values. This script reproduces the identical algorithm (same window,
// same coarse step, same bisection, same public API) against the CURRENT
// tree and prints the raw numbers, for REPORT.md's VERIFIED table rows:
//   - "Lunation lengths span 29.274-29.826 days across 864 lunations, 1990-2060"
//   - "new->full interval spans 13.906-15.613 days across 865 intervals,
//      1990-2060, mean 14.765 vs theoretical 14.765"
const { computeMoon, nextFullMoon } = require('../../src/astro.js');

const DAY_MS = 86400000;
const HOUR_MS = 3600000;

function moonAt(ms) { return computeMoon(new Date(ms)); }

const START_MS = Date.UTC(1990, 0, 1);
const END_MS = Date.UTC(2060, 0, 1);
const COARSE_STEP_MS = 6 * HOUR_MS;

function bisectDrop(aMs, bMs) {
  let a = aMs, b = bMs;
  while (b - a > 1) {
    const m = Math.floor((a + b) / 2);
    if (moonAt(m).age > 15) a = m; else b = m;
  }
  return b;
}

const newMoonMs = [];
let prevMs = START_MS;
let prevAge = moonAt(START_MS).age;
for (let t = START_MS + COARSE_STEP_MS; t <= END_MS; t += COARSE_STEP_MS) {
  const age = moonAt(t).age;
  if (age < prevAge) newMoonMs.push(bisectDrop(prevMs, t));
  prevMs = t;
  prevAge = age;
}

const intervals = [];
for (let i = 1; i < newMoonMs.length; i++) {
  intervals.push((newMoonMs[i] - newMoonMs[i - 1]) / DAY_MS);
}

const min = Math.min(...intervals);
const max = Math.max(...intervals);
const spreadHours = (max - min) * 24;

console.log('window: 1990-01-01T00:00Z .. 2060-01-01T00:00Z, 6h coarse scan + ms bisection');
console.log('new-moon instants found:', newMoonMs.length);
console.log('lunation intervals:', intervals.length);
console.log('lunation min (days):', min.toFixed(3));
console.log('lunation max (days):', max.toFixed(3));
console.log('lunation spread (hours):', spreadHours.toFixed(1));

const newFullIntervals = newMoonMs.map(
  (nm) => (nextFullMoon(new Date(nm)).getTime() - nm) / DAY_MS
);
const nfMin = Math.min(...newFullIntervals);
const nfMax = Math.max(...newFullIntervals);
const nfMean = newFullIntervals.reduce((a, b) => a + b, 0) / newFullIntervals.length;

console.log('');
console.log('new->full intervals:', newFullIntervals.length);
console.log('new->full min (days):', nfMin.toFixed(3));
console.log('new->full max (days):', nfMax.toFixed(3));
console.log('new->full mean (days):', nfMean.toFixed(3));
console.log('theoretical half-synodic (days):', (29.530588861 / 2).toFixed(3));
