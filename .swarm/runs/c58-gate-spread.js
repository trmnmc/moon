'use strict';
// CONDUCTOR GATE, cycle 58, T-148, figure 1.
// Question: is REPORT's "13.2h spread" stale (drift) or is the builder's
// fresh "13.3h" an artifact of a re-authored derivation?
// Method: measure the 1990-2060 lunation min/max at FULL precision under the
// two bisection conventions in the repo, and print the spread unrounded.
// Both bisect the `age` discontinuity to 1 ms via the public surface only.
const { computeMoon } = require('/opt/targets/moon/src/astro.js');

const DAY_MS = 86400000;
const START_MS = Date.UTC(1990, 0, 1);
const END_MS = Date.UTC(2060, 0, 1);

function ageAt(ms) { return computeMoon(new Date(ms)).age; }

// Convention B (builder, c58): predicate `age > 15`, returns b.
function bisectB(aMs, bMs) {
  let a = aMs, b = bMs;
  while (b - a > 1) {
    const m = Math.floor((a + b) / 2);
    if (ageAt(m) > 15) a = m; else b = m;
  }
  return b;
}

// Convention A (cycle-027 conductor script): predicate `age(m) > age(a)`.
function bisectA(aMs, bMs) {
  let a = aMs, b = bMs;
  while (b - a > 1) {
    const m = Math.floor((a + b) / 2);
    if (ageAt(m) >= ageAt(a)) a = m; else b = m;
  }
  return b;
}

function run(label, bisect, coarseHours) {
  const step = coarseHours * 3600000;
  const nm = [];
  let prevMs = START_MS;
  let prevAge = ageAt(START_MS);
  for (let t = START_MS + step; t <= END_MS; t += step) {
    const age = ageAt(t);
    if (age < prevAge) nm.push(bisect(prevMs, t));
    prevMs = t;
    prevAge = age;
  }
  const iv = [];
  for (let i = 1; i < nm.length; i++) iv.push((nm[i] - nm[i - 1]) / DAY_MS);
  const min = Math.min(...iv);
  const max = Math.max(...iv);
  const spreadH = (max - min) * 24;
  console.log(`${label}: n=${iv.length} min=${min.toFixed(6)} max=${max.toFixed(6)} ` +
              `spread=${spreadH.toFixed(4)} h -> 1dp ${spreadH.toFixed(1)} | ` +
              `spread from the PUBLISHED 3dp pair = ${((29.826 - 29.274) * 24).toFixed(4)} h`);
}

run('convention B (builder, 6h coarse)  ', bisectB, 6);
run('convention A (cycle-027, 6h coarse)', bisectA, 6);
run('convention B, 3h coarse            ', bisectB, 3);
