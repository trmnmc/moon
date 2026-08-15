// Conductor measurement, cycle 29. Authored at verification time.
// QUESTION: README.md:164-165 and REPORT.md:34 both assert "this implementation
// computes 18:15 UTC" for the 2000-01-06 new moon. Does it?
// Three INDEPENDENT derivations off the public surface only. Nothing is modified.
const { computeMoon } = require('/opt/targets/moon/src/astro.js');

const at = (ms) => computeMoon(new Date(ms));
const iso = (ms) => new Date(Math.round(ms)).toISOString();
const LO = Date.UTC(2000, 0, 5), HI = Date.UTC(2000, 0, 8);

// M1 -- bisect the `age` discontinuity (age resets to 0 at new moon).
let lo = LO, hi = HI;
for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (at(mid).age > 15) lo = mid; else hi = mid; }
const m1 = hi;

// M2 -- bisect the `cycleFraction` wrap: the method test/astro.test.js:63-72 uses.
lo = LO; hi = HI;
for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (at(mid).cycleFraction > 0.5) lo = mid; else hi = mid; }
const m2 = hi;

// M3 -- independent of both: ternary-search the illumination MINIMUM. Illumination
// comes from the ch.48 elongation series, not the ch.49 instant tables that drive
// age/cycleFraction, so agreement here is not a restatement of M1/M2.
lo = LO; hi = HI;
for (let i = 0; i < 300; i++) {
  const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3;
  if (at(a).illumination < at(b).illumination) hi = b; else lo = a;
}
const m3 = (lo + hi) / 2;

const PUBLISHED = Date.UTC(2000, 0, 6, 18, 14);
const README_CLAIM = Date.UTC(2000, 0, 6, 18, 15);

console.log('M1 age-discontinuity bisection  :', iso(m1));
console.log('M2 cycleFraction-wrap bisection :', iso(m2), '(test/astro.test.js:63-72 method)');
console.log('M3 illumination-minimum search  :', iso(m3), '(ch.48 series, independent of M1/M2)');
console.log('M1-M2 spread (s):', ((m1 - m2) / 1000).toFixed(3));
console.log('M1-M3 spread (s):', ((m1 - m3) / 1000).toFixed(3));
console.log('');
console.log('published new moon              : 2000-01-06T18:14:00.000Z');
console.log('README.md:165 / REPORT.md:34    : 2000-01-06T18:15 UTC   <- the claim under test');
console.log('');
for (const [name, v] of [['M1', m1], ['M2', m2], ['M3', m3]]) {
  console.log(name
    + ': vs published ' + ((v - PUBLISHED) / 1000).toFixed(1).padStart(8) + ' s'
    + ' | vs README claim ' + ((v - README_CLAIM) / 1000).toFixed(1).padStart(8) + ' s'
    + ' | rounds to UTC minute ' + iso(Math.round(v / 60000) * 60000).slice(11, 16));
}
