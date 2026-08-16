'use strict';
// T-148 (cycle 58) -- REPORT.md / README.md state "a mean-formula-only
// implementation lands at 14:20 UTC" for the 2000-01-06 new moon, nearly 4h
// off the true 18:14/18:15. No prior .swarm/runs/ script computes this
// mean-only value (grep found none); this one does, reusing verbatim the
// two formulas src/astro.js already carries for exactly this purpose:
//   - MEAN_PHASE_EPOCH = 2451550.09766 (JDE of the k=0 MEAN new moon, Meeus
//     eq. 49.1), the same top-level constant src/astro.js defines.
//   - deltaTDays(jd), copied verbatim from src/astro.js, the same TT->UT
//     conversion the real (corrected) computation applies.
// Nothing here adds new astronomy: it evaluates the source's own mean-epoch
// constant with zero ch.49 periodic corrections applied, which is exactly
// what "a mean-formula-only implementation" means.

// Copied verbatim from src/astro.js (not re-derived):
const MEAN_PHASE_EPOCH = 2451550.09766; // JDE of the k=0 mean new moon (49.1)
function deltaTDays(jd) {
  const t = (jd - 2451545.0) / 365.25; // years from 2000.0
  return (62.92 + 0.32217 * t + 0.005589 * t * t) / 86400;
}
const JD_UNIX_EPOCH = 2440587.5; // JD of 1970-01-01T00:00:00Z
const DAY_MS = 86400000;

// Sanity: confirm these two lines are still verbatim in the current tree,
// so this probe cannot silently drift from the source it claims to copy.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'astro.js'), 'utf8');
if (!src.includes('const MEAN_PHASE_EPOCH = 2451550.09766;')) {
  throw new Error('MEAN_PHASE_EPOCH constant text moved in src/astro.js -- update this probe');
}
if (!src.includes('return (62.92 + 0.32217 * t + 0.005589 * t * t) / 86400;')) {
  throw new Error('deltaTDays formula text moved in src/astro.js -- update this probe');
}
console.log('verbatim-copy check: PASS (both constants match current src/astro.js text)');

console.log('MEAN_PHASE_EPOCH (JDE, TT) =', MEAN_PHASE_EPOCH);
const deltaT = deltaTDays(MEAN_PHASE_EPOCH);
console.log('deltaT (s) at this epoch   =', (deltaT * 86400).toFixed(3));

const meanTT_ms = (MEAN_PHASE_EPOCH - JD_UNIX_EPOCH) * DAY_MS;
const meanUT_ms = (MEAN_PHASE_EPOCH - deltaT - JD_UNIX_EPOCH) * DAY_MS;

console.log('mean new moon, TT (uncorrected for UT): ', new Date(meanTT_ms).toISOString());
console.log('mean new moon, TT->UT converted:        ', new Date(meanUT_ms).toISOString());
console.log('rounds to UTC minute:', new Date(Math.round(meanUT_ms / 60000) * 60000).toISOString().slice(11, 16));
console.log('published true new moon: 2000-01-06T18:14Z ; module (true, corrected): see c58-anchor-2000-measure-out.txt');
