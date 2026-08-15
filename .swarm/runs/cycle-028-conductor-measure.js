// Cycle-28 CONDUCTOR gate measurement for T-124.
// Authored at verification time. Deliberately NOT the test's implementation:
//   - 3-hour coarse step (test uses 6h) -> a different sampling grid, so a
//     new moon the test's grid straddles awkwardly is caught differently
//   - fixed 60-iteration bisection (test bisects to millisecond convergence)
//   - independent mean/min/max reduction
// Same DEFINITION (ch.49 age discontinuity -> public nextFullMoon), different
// implementation. If the two agree on count/min/max/mean, the figures are not
// an artifact of one scan's grid.
const { computeMoon, nextFullMoon } = require('/opt/targets/moon/src/astro.js');

const DAY_MS = 86400000;
const START_MS = Date.UTC(1990, 0, 1);
const END_MS = Date.UTC(2060, 0, 1);
const STEP_MS = 3 * 3600000;

const ageAt = (ms) => computeMoon(new Date(ms)).age;

// Locate every instant where age drops (new moon), by bisection on the drop.
const newMoonMs = [];
let prevMs = START_MS;
let prevAge = ageAt(prevMs);
for (let ms = START_MS + STEP_MS; ms <= END_MS; ms += STEP_MS) {
  const age = ageAt(ms);
  if (age < prevAge) {
    let lo = prevMs;
    let hi = ms;
    for (let i = 0; i < 60; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (mid === lo || mid === hi) break;
      if (ageAt(mid) < prevAge) hi = mid;
      else lo = mid;
    }
    newMoonMs.push(hi);
  }
  prevMs = ms;
  prevAge = age;
}

const intervals = newMoonMs.map(
  (nm) => (nextFullMoon(new Date(nm)).getTime() - nm) / DAY_MS
);

let min = Infinity;
let max = -Infinity;
let sum = 0;
for (const v of intervals) {
  if (v < min) min = v;
  if (v > max) max = v;
  sum += v;
}
const mean = sum / intervals.length;

// Also re-derive the NEIGHBOURING (cycle-27) lunation-length claim, so this
// gate confirms T-124 did not disturb the line above it.
let lmin = Infinity;
let lmax = -Infinity;
for (let i = 1; i < newMoonMs.length; i++) {
  const d = (newMoonMs[i] - newMoonMs[i - 1]) / DAY_MS;
  if (d < lmin) lmin = d;
  if (d > lmax) lmax = d;
}

console.log('window            1990-01-01 .. 2060-01-01 (3h grid, 60-iter bisection)');
console.log('new moons found  ', newMoonMs.length);
console.log('new->full count  ', intervals.length);
console.log('new->full min    ', min.toFixed(6), '-> 3dp', min.toFixed(3));
console.log('new->full max    ', max.toFixed(6), '-> 3dp', max.toFixed(3));
console.log('new->full mean   ', mean.toFixed(6), '-> 3dp', mean.toFixed(3));
console.log('half-synodic     ', (29.530588861 / 2).toFixed(6));
console.log('lunation count   ', newMoonMs.length - 1);
console.log('lunation min/max ', lmin.toFixed(3), lmax.toFixed(3));
