'use strict';
// T-148 attempt 2 (cycle 59) -- TD-correct rerun of the Meeus 48.a probe.
//
// Meeus's worked example 48.a is stated at 1992 April 12.0 TD (Dynamical
// Time), but computeMoon() takes a UT instant (src/astro.js:92-94,
// dateToJulianDay; the truePhaseJD doc comment at src/astro.js:105-111 says
// "on the UT timescale"). Attempt 1's probe
// (.swarm/runs/c58-meeus-48a-probe.js, NOT reused or copied here) fed the
// literal UT instant Date.UTC(1992,3,12) in as if it already equalled the
// book's TD instant, evaluating the module about a minute away from the
// point Meeus specifies and getting 0.6802 instead of the committed 0.6801.
// This script converts the book's TD instant to UT before ever calling the
// module, using only the module's public require() surface.
//
// ---------------------------------------------------------------------
// DELTA-T (TT-UT) DECISION -- read before trusting the numbers below
// ---------------------------------------------------------------------
// src/astro.js ships its own deltaTDays() (src/astro.js:96-103), but its
// doc comment explicitly scopes the polynomial to 2005-2050:
//
//   "DeltaT = TT - UT, in days.  Espenak & Meeus polynomial for 2005-2050"
//
// 1992 is 13 years before that window, so reusing deltaTDays() here would
// extrapolate the very instrument whose domain-correctness this probe is
// trying to test -- and deltaTDays() is not exported anyway (internals are
// off limits per the task brief), so it cannot be called from this script
// even if that were desired.
//
// This probe instead uses the historical Espenak/Meeus Delta-T polynomial
// published specifically for the 1986-2005 era (NASA "Polynomial
// Expressions for Delta T", Espenak & Meeus,
// https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html), which covers
// 1992 April squarely inside its fitted range instead of outside it:
//
//   t = y - 2000  (y = decimal year)
//   DeltaT(s) = 63.86 + 0.3345 t - 0.060374 t^2 + 0.0017275 t^3
//               + 0.000651814 t^4 + 0.00002373599 t^5
//
// This is APPLIED below. For comparison only (NOT applied, computed solely
// to document what the other choice would have produced, per the task
// brief), this script also evaluates src/astro.js's own out-of-domain
// 2005-2050 polynomial at the same 1992 instant using the coefficients
// transcribed verbatim from its doc comment -- again without calling any
// internal of src/astro.js -- and prints both the resulting Delta T and the
// illumination that Delta T would have produced.

const { computeMoon } = require('../../src/astro.js');

const DAY_MS = 86400000;
const JD_UNIX_EPOCH = 2440587.5; // JD of 1970-01-01T00:00:00Z (public constant, same value src/astro.js uses)

function dateToJulianDay(date) {
  return date.getTime() / DAY_MS + JD_UNIX_EPOCH;
}
function julianDayToDate(jd) {
  return new Date((jd - JD_UNIX_EPOCH) * DAY_MS);
}

// APPLIED: historical Espenak/Meeus Delta T polynomial, fitted range 1986-2005.
function deltaTSecondsHistorical1986_2005(decimalYear) {
  const t = decimalYear - 2000;
  return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t
    + 0.000651814 * t * t * t * t + 0.00002373599 * t * t * t * t * t;
}

// COMPARISON ONLY, NOT APPLIED: src/astro.js's own 2005-2050 polynomial,
// transcribed verbatim from its doc comment (src/astro.js:96-103), evaluated
// out-of-domain at 1992 to show what using it anyway would have produced.
function deltaTSecondsModulePolynomialOutOfDomain(jd) {
  const t = (jd - 2451545.0) / 365.25; // years from 2000.0, same as deltaTDays()
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

function illuminationFrom(utInstant) {
  const m = computeMoon(utInstant);
  const fake = (1 - Math.cos(2 * Math.PI * (m.age / 29.530588853))) / 2;
  return { m, fake };
}

// Meeus example 48.a: 1992 April 12.0 TD.
const tdInstant = new Date(Date.UTC(1992, 3, 12, 0, 0, 0));
const jdTD = dateToJulianDay(tdInstant);

// Decimal year for the Delta-T polynomial: 1992 is a leap year (366 days);
// April 12.0 is 102.0 days into the year (31 Jan + 29 Feb + 31 Mar + 11 Apr).
const decimalYear1992 = 1992 + 102 / 366;

// --- APPLIED conversion ---
const deltaTSecondsApplied = deltaTSecondsHistorical1986_2005(decimalYear1992);
const deltaTDaysApplied = deltaTSecondsApplied / 86400;
const jdUT = jdTD - deltaTDaysApplied;
const utInstant = julianDayToDate(jdUT);
const { m, fake } = illuminationFrom(utInstant);

console.log('=== APPLIED: historical 1986-2005 Espenak/Meeus Delta T ===');
console.log('Meeus 48.a TD instant (nominal Date.UTC) =', tdInstant.toISOString());
console.log('JD (TD)                                   =', jdTD);
console.log('Delta T applied (s)                       =', deltaTSecondsApplied);
console.log('JD (UT, after TD->UT conversion)          =', jdUT);
console.log('UT instant fed to computeMoon()           =', utInstant.toISOString());
console.log('');
console.log('module illumination (full precision)      =', m.illumination);
console.log('module illumination (4dp)                 =', m.illumination.toFixed(4));
console.log('age-derived fake (full precision)         =', fake);
console.log('age-derived fake (4dp)                    =', fake.toFixed(4));

// --- COMPARISON ONLY: what the module's own out-of-domain polynomial gives ---
const deltaTSecondsAlt = deltaTSecondsModulePolynomialOutOfDomain(jdTD);
const deltaTDaysAlt = deltaTSecondsAlt / 86400;
const jdUTAlt = jdTD - deltaTDaysAlt;
const utInstantAlt = julianDayToDate(jdUTAlt);
const { m: mAlt, fake: fakeAlt } = illuminationFrom(utInstantAlt);

console.log('');
console.log('=== COMPARISON ONLY (NOT applied): src/astro.js deltaTDays() polynomial, extrapolated out-of-domain to 1992 ===');
console.log('Delta T this alternative would apply (s)  =', deltaTSecondsAlt);
console.log('resulting illumination (full precision)   =', mAlt.illumination);
console.log('resulting illumination (4dp)               =', mAlt.illumination.toFixed(4));
console.log('resulting age-derived fake (4dp)            =', fakeAlt.toFixed(4));
