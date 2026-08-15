// Conductor's own independent measurement of lunation-length extrema.
// Uses ONLY the public surface of src/astro.js (computeMoon), bisecting on the
// `age` reset to locate true new-moon instants, then differencing successive ones.
// Written by the conductor at verification/scan time; no builder saw this.
const { computeMoon } = require('/opt/targets/moon/src/astro.js');

const DAY = 86400000;

function ageAt(ms) { return computeMoon(new Date(ms)).age; }

// Locate every new-moon instant in [t0, t1] by coarse scan + bisection on the
// age discontinuity (age falls from ~29.x to ~0 exactly at a new moon).
function newMoons(t0, t1, coarseHours = 6) {
  const step = coarseHours * 3600000;
  const out = [];
  let prevT = t0, prevA = ageAt(t0);
  for (let t = t0 + step; t <= t1; t += step) {
    const a = ageAt(t);
    if (a < prevA) {
      // discontinuity between prevT and t -> bisect
      let lo = prevT, hi = t;
      for (let i = 0; i < 60; i++) {
        const mid = Math.floor((lo + hi) / 2);
        if (mid === lo || mid === hi) break;
        if (ageAt(mid) < ageAt(lo)) hi = mid; else lo = mid;
      }
      out.push(hi);
    }
    prevT = t; prevA = a;
  }
  return out;
}

function report(label, y0, y1) {
  const t0 = Date.UTC(y0, 0, 1), t1 = Date.UTC(y1, 0, 1);
  const nm = newMoons(t0, t1);
  const lens = [];
  for (let i = 1; i < nm.length; i++) lens.push((nm[i] - nm[i - 1]) / DAY);
  const min = Math.min(...lens), max = Math.max(...lens);
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const iMin = lens.indexOf(min), iMax = lens.indexOf(max);
  console.log(`${label}: n=${lens.length} intervals`);
  console.log(`  min ${min.toFixed(4)} d  (new moon ${new Date(nm[iMin]).toISOString()})`);
  console.log(`  max ${max.toFixed(4)} d  (new moon ${new Date(nm[iMax]).toISOString()})`);
  console.log(`  mean ${mean.toFixed(6)} d   (mean synodic 29.530589)`);
  const claimLo = 29.339, claimHi = 29.775;
  console.log(`  README claim 29.339-29.775 -> below-claim-low: ${lens.filter(x => x < claimLo).length}, above-claim-high: ${lens.filter(x => x > claimHi).length}`);
  return { label, n: lens.length, min, max, mean };
}

const rows = [];
rows.push(report('2019-2024 (scanner window)', 2019, 2024));
rows.push(report('2020-2040 (the run-wide sampling window)', 2020, 2040));
rows.push(report('1990-2060', 1990, 2060));
console.log('\nSUMMARY');
for (const r of rows) console.log(`  ${r.label}: ${r.min.toFixed(3)} - ${r.max.toFixed(3)} d over ${r.n} lunations`);
