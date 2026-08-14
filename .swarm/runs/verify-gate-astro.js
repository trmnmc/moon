'use strict';
// CONDUCTOR VERIFICATION GATE — cycle 2, target moon.
// Compares src/astro.js against the independently-derived oracle.

const path = '/opt/targets/moon/src/astro.js';
const { computeMoon, nextFullMoon, PHASE_NAMES } = require(path);
const { oracle, nextSyzygy, jdFromDate } = require('/opt/swarm/runs/oracle-moon.js');

let fails = 0;
const note = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); };

// ---- 1. Illumination vs oracle over 400 days at 6h steps (1600 samples) ----
let worstIll = 0, worstIllAt = null, worstAng = 0;
const start = Date.UTC(2026, 0, 1);
const N = 1600;
for (let n = 0; n < N; n++) {
  const d = new Date(start + n * 6 * 3600 * 1000);
  const mine = computeMoon(d);
  const ref = oracle(jdFromDate(d));
  const dIll = Math.abs(mine.illumination - ref.illumination);
  if (dIll > worstIll) { worstIll = dIll; worstIllAt = d.toISOString(); }
  // cycle fraction -> angle, compared on the circle
  let dAng = Math.abs(mine.cycleFraction * 360 - ref.cycleAngle) % 360;
  if (dAng > 180) dAng = 360 - dAng;
  if (dAng > worstAng) worstAng = dAng;
}
console.log(`samples=${N} span=400d worst |dIllumination|=${(worstIll * 100).toFixed(3)}pp at ${worstIllAt}`);
console.log(`worst |d cycle-angle| = ${worstAng.toFixed(3)} deg  (oracle self-accuracy ~0.3 deg)`);
note(worstIll < 0.006, `illumination within 0.6pp of independent oracle (got ${(worstIll * 100).toFixed(3)}pp)`);
note(worstAng < 0.6, `phase angle within 0.6 deg of independent oracle (got ${worstAng.toFixed(3)} deg)`);

// ---- 2. Discriminator: prove the corrections are actually present ----
// A mean-formula-only implementation would show ~6 deg / ~5pp errors here.
console.log(`discriminator: a mean-only implementation would show >4pp; observed ${(worstIll * 100).toFixed(3)}pp`);

// ---- 3. Synodic month: successive computed new moons average 29.530589 d ----
let prev = null, gaps = [];
for (let n = 0; n < 400 * 4; n++) {
  const d = new Date(start + n * 6 * 3600 * 1000);
  const cf = computeMoon(d).cycleFraction;
  if (prev !== null && cf < prev) gaps.push(n * 6 / 24);
  prev = cf;
}
const deltas = gaps.slice(1).map((g, i) => g - gaps[i]);
const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
console.log(`new-moon wraps=${gaps.length} mean gap=${mean.toFixed(4)}d (true synodic 29.5306d)`);
note(Math.abs(mean - 29.530589) < 0.05, `mean synodic month = ${mean.toFixed(4)}d`);

// ---- 4. nextFullMoon vs oracle bisection on longitude-difference=180 ----
let worstFull = 0;
for (let m = 0; m < 8; m++) {
  const d = new Date(Date.UTC(2026, m + 2, 3, 7, 0, 0));
  const mineJD = jdFromDate(nextFullMoon(d));
  const refJD = nextSyzygy(jdFromDate(d), 180);
  const diffMin = Math.abs(mineJD - refJD) * 1440;
  if (diffMin > worstFull) worstFull = diffMin;
  console.log(`  nextFullMoon from ${d.toISOString().slice(0, 10)}: mine=${nextFullMoon(d).toISOString()} oracle=${new Date((refJD - 2440587.5) * 86400000).toISOString()} diff=${diffMin.toFixed(1)}min`);
}
note(worstFull < 90, `nextFullMoon within 90 min of oracle (oracle timing precision ~35 min); worst ${worstFull.toFixed(1)}min`);
// and it must always be in the future and illuminated ~100%
{
  const now = new Date();
  const nf = nextFullMoon(now);
  note(nf > now, 'nextFullMoon is in the future');
  const kAt = computeMoon(nf).illumination;
  note(kAt > 0.995, `illumination at the returned full moon = ${(kAt * 100).toFixed(2)}% (expect ~100)`);
}

// ---- 5. Phase-name / illumination coherence (spec: name must match the disc) ----
{
  let bad = 0;
  for (let n = 0; n < 1200; n++) {
    const d = new Date(start + n * 8 * 3600 * 1000);
    const m = computeMoon(d);
    if (!PHASE_NAMES.includes(m.phaseName)) bad++;
    const waxing = m.cycleFraction < 0.5;
    const expectHalf = Math.abs(m.illumination - 0.5) < 0.12;
    if (m.phaseName === 'full' && m.illumination < 0.94) bad++;
    if (m.phaseName === 'new' && m.illumination > 0.06) bad++;
    if (m.phaseName === 'first quarter' && (!waxing || !expectHalf)) bad++;
    if (m.phaseName === 'last quarter' && (waxing || !expectHalf)) bad++;
    if (m.phaseName.startsWith('waxing') && !waxing) bad++;
    if (m.phaseName.startsWith('waning') && waxing) bad++;
  }
  note(bad === 0, `phase names cohere with illumination + waxing/waning over 1200 samples (${bad} violations)`);
}

// ---- 6. Ranges ----
{
  let bad = 0;
  for (let n = 0; n < 800; n++) {
    const m = computeMoon(new Date(start + n * 11 * 3600 * 1000));
    if (!(m.illumination >= 0 && m.illumination <= 1)) bad++;
    if (!(m.cycleFraction >= 0 && m.cycleFraction < 1)) bad++;
    if (!(m.age >= 0 && m.age <= 30)) bad++;
    if (!Number.isFinite(m.julianDay)) bad++;
  }
  note(bad === 0, `illumination/cycleFraction/age/julianDay all in range over 800 samples (${bad} violations)`);
}

console.log(fails === 0 ? '\nGATE: ALL CHECKS PASSED' : `\nGATE: ${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
