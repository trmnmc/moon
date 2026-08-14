'use strict';
// CONDUCTOR-AUTHORED VERIFICATION ORACLE — cycle 2, target moon.
// Written at verification time, never shown to any builder.
//
// Independent re-derivation of lunar illumination from the Astronomical Almanac /
// Meeus abbreviated series (table 47.A leading terms). Deliberately a DIFFERENT
// formulation from whatever src/astro.js does: this works from apparent ecliptic
// longitudes and the elongation, not from lunation-phase instants.
//
// Oracle accuracy: ~0.3 deg in lunar longitude => ~0.3% in illumination, and
// ~35 min in the timing of a syzygy. A "mean formula only" implementation errs by
// up to 6.3 deg / ~14 h, so this discriminates cleanly.

const RAD = Math.PI / 180;
const s = (d) => Math.sin(d * RAD);
const c = (d) => Math.cos(d * RAD);

function jdFromDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Sun apparent longitude, Astronomical Almanac low precision (~0.01 deg).
function sunLongitude(T) {
  const L = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T) * s(M) + (0.019993 - 0.000101 * T) * s(2 * M) + 0.000289 * s(3 * M);
  return { lon: L + C, M };
}

// Moon apparent longitude + latitude, Meeus 47.A / 47.B leading terms.
function moonPosition(T) {
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;

  const dLon =
    6.288774 * s(Mp) +
    1.274027 * s(2 * D - Mp) +
    0.658314 * s(2 * D) +
    0.213618 * s(2 * Mp) +
    -0.185116 * s(M) +
    -0.114332 * s(2 * F) +
    0.058793 * s(2 * D - 2 * Mp) +
    0.057066 * s(2 * D - M - Mp) +
    0.053322 * s(2 * D + Mp) +
    0.045758 * s(2 * D - M) +
    -0.040923 * s(M - Mp) +
    -0.034720 * s(D) +
    -0.030383 * s(M + Mp) +
    0.015327 * s(2 * D - 2 * F) +
    -0.012528 * s(Mp + 2 * F) +
    0.010980 * s(Mp - 2 * F) +
    0.010675 * s(4 * D - Mp) +
    0.010034 * s(3 * Mp) +
    0.008548 * s(4 * D - 2 * Mp) +
    -0.007888 * s(2 * D + M - Mp) +
    -0.006766 * s(2 * D + M) +
    -0.005163 * s(D - Mp) +
    0.004987 * s(D + M) +
    0.004036 * s(2 * D - M + Mp) +
    0.003994 * s(2 * D + 2 * Mp) +
    0.003861 * s(4 * D) +
    0.003665 * s(2 * D - 3 * Mp);

  const lat =
    5.128122 * s(F) +
    0.280602 * s(Mp + F) +
    0.277693 * s(Mp - F) +
    0.173237 * s(2 * D - F) +
    0.055413 * s(2 * D - Mp + F) +
    0.046271 * s(2 * D - Mp - F) +
    0.032573 * s(2 * D + F) +
    0.017198 * s(2 * Mp + F) +
    0.009266 * s(2 * D + Mp - F) +
    0.008822 * s(2 * Mp - F);

  return { lon: Lp + dLon, lat, Mp };
}

// Illuminated fraction of the disc at a JD (TT ~ UT for this purpose).
function oracle(jd) {
  const T = (jd - 2451545.0) / 36525;
  const sun = sunLongitude(T);
  const moon = moonPosition(T);
  // Geocentric elongation, Meeus 48.2.
  const cosPsi = c(moon.lat) * c(moon.lon - sun.lon);
  const psi = Math.acos(Math.max(-1, Math.min(1, cosPsi))) / RAD;
  // Phase angle, Meeus 48.4 approximation (distance ratio folded into the constant).
  const i = 180 - psi - 0.1468 * ((1 - 0.0549 * s(moon.Mp)) / (1 - 0.0167 * s(sun.M))) * s(psi);
  const k = (1 + c(i)) / 2;
  // Signed longitude difference 0..360 — 0 = new, 180 = full, <180 = waxing.
  let dlon = ((moon.lon - sun.lon) % 360 + 360) % 360;
  return { illumination: k, elongation: psi, phaseAngle: i, cycleAngle: dlon };
}

// Instant of the next longitude-difference == target (0 new, 180 full), by bisection.
function nextSyzygy(jd0, targetDeg) {
  const f = (jd) => {
    let d = oracle(jd).cycleAngle - targetDeg;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  };
  let a = jd0;
  let fa = f(a);
  // step forward in 6h increments until the difference crosses zero upward
  for (let step = 0; step < 130; step++) {
    const b = a + 0.25;
    const fb = f(b);
    if (fa < 0 && fb >= 0) {
      let lo = a, hi = b;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        if (f(mid) < 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    a = b;
    fa = fb;
  }
  return null;
}

module.exports = { oracle, nextSyzygy, jdFromDate };
