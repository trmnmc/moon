// T-168 — reproduces the worst-case divergence between `cycleFraction * 29.530588861`
// (angular position converted to days at the MEAN synodic rate — exactly the
// computation the README warns against: `cycleFraction * 29.53`) and the `age`
// field (true elapsed days since the ch.49 new-moon instant), across a wide date
// range. Zero dependencies: only `src/astro.js`.
//
// This independently re-derives the figure already measured three times this run
// (cycle 73: hourly 2026-2040, n=122712, worst -23.03 h; cycle 76: 6h grid
// 1990-2060 refined to 5 min, 23.03 h; cycle 77: 30-min grid 1990-2060,
// n=1,227,216, worst -23.026 h). Run with: node .swarm/runs/T-168-cyclefraction-bound.js
'use strict';
const { computeMoon } = require('../../src/astro.js');

const SYNODIC_MONTH = 29.530588861; // same constant src/astro.js uses; README rounds it to 29.53
const START = Date.UTC(1990, 0, 1);
const END = Date.UTC(2060, 0, 1);
const STEP_MS = 30 * 60 * 1000; // 30-minute grid, matching cycle 77's finest reported sweep

let worstHours = 0;
let worstAt = null;
let n = 0;

for (let t = START; t <= END; t += STEP_MS) {
  const m = computeMoon(new Date(t));
  // Both fields are positions within a periodic cycle (age wraps at the true
  // lunation boundary, cycleFraction wraps at the angular boundary), so the
  // comparison must be circular: raw subtraction spuriously reports ~1 whole
  // cycle at the instant one field has wrapped and the other has not yet.
  let diffDays = m.cycleFraction * SYNODIC_MONTH - m.age;
  diffDays -= SYNODIC_MONTH * Math.round(diffDays / SYNODIC_MONTH);
  const diffHours = diffDays * 24;
  n++;
  if (Math.abs(diffHours) > Math.abs(worstHours)) {
    worstHours = diffHours;
    worstAt = new Date(t).toISOString();
  }
}

console.log(`samples: ${n}`);
console.log(`worst divergence: ${worstHours.toFixed(3)} h at ${worstAt}`);
console.log(`|worst|: ${Math.abs(worstHours).toFixed(3)} h`);
