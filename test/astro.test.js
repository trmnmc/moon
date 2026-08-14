'use strict';

// TZ pin: the build host happens to be UTC, and a test that passes only
// because of that is a bug (SPEC "Domain rules").  We pin a deliberately
// non-UTC, DST-free zone (UTC+14) BEFORE any Date work, and every date below
// is constructed in explicit UTC (ISO strings with Z / Date.UTC).  Nothing in
// src/astro.js may depend on the process timezone.
process.env.TZ = 'Pacific/Kiritimati';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { computeMoon, nextFullMoon, PHASE_NAMES } = require('../src/astro.js');

const SYNODIC = 29.530588861;
const DAY_MS = 86400000;
const HOUR_MS = 3600000;

function moonAt(ms) {
  return computeMoon(new Date(ms));
}

// Bisect the new-moon instant (cycleFraction wraps 1 -> 0) inside [aMs, bMs].
// Precondition: cycleFraction(a) > 0.5 and cycleFraction(b) < 0.5.
function bisectNewMoon(aMs, bMs) {
  let a = aMs, b = bMs;
  while (b - a > 1000) {
    const m = (a + b) / 2;
    if (moonAt(m).cycleFraction > 0.5) a = m; else b = m;
  }
  return (a + b) / 2;
}

// Bisect the increasing crossing of cycleFraction through `target` in [aMs, bMs].
function bisectCrossing(aMs, bMs, target) {
  let a = aMs, b = bMs;
  while (b - a > 1000) {
    const m = (a + b) / 2;
    if (moonAt(m).cycleFraction < target) a = m; else b = m;
  }
  return (a + b) / 2;
}

// All new-moon instants (ms, ~1 s precision) in [startMs, endMs], found by
// daily sampling for the cycleFraction wrap, then bisection.  This is a
// computed search over the public API -- no memorized dates involved.
function findNewMoons(startMs, endMs) {
  const out = [];
  let prev = moonAt(startMs).cycleFraction;
  for (let t = startMs + DAY_MS; t <= endMs; t += DAY_MS) {
    const cf = moonAt(t).cycleFraction;
    if (cf < prev) out.push(bisectNewMoon(t - DAY_MS, t));
    prev = cf;
  }
  return out;
}

// Smallest circular distance between two fractions of a cycle.
function circDiff(a, b) {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}

test('PHASE_NAMES is the exact frozen contract array', () => {
  assert.deepEqual(PHASE_NAMES, [
    'new', 'waxing crescent', 'first quarter', 'waxing gibbous',
    'full', 'waning gibbous', 'last quarter', 'waning crescent',
  ]);
});

test('computeMoon rejects non-Dates and invalid Dates', () => {
  assert.throws(() => computeMoon('2000-01-06'), TypeError);
  assert.throws(() => computeMoon(new Date(NaN)), TypeError);
  assert.throws(() => computeMoon(undefined), TypeError);
});

test('julianDay: J2000.0 epoch 2000-01-01T12:00Z is JD 2451545.0', () => {
  // Standard-knowledge anchor (definition of J2000), exact in floating point.
  const m = computeMoon(new Date('2000-01-01T12:00:00Z'));
  assert.equal(m.julianDay, 2451545.0);
});

test('MoonState has the contract shape and value ranges', () => {
  const m = computeMoon(new Date(Date.UTC(2024, 5, 15, 3, 30)));
  assert.equal(typeof m.julianDay, 'number');
  assert.equal(typeof m.age, 'number');
  assert.equal(typeof m.cycleFraction, 'number');
  assert.equal(typeof m.phaseAngle, 'number');
  assert.equal(typeof m.illumination, 'number');
  assert.equal(typeof m.phaseName, 'string');
  assert.equal(typeof m.isInstantPhase, 'boolean');
  assert.ok(PHASE_NAMES.includes(m.phaseName));
});

// ---------------------------------------------------------------------------
// Anchor: the Meeus epoch new moon.  JDE 2451550.09766 is the k=0 MEAN new
// moon (2000-01-06 14:20 TT); with the ch. 49 periodic corrections the TRUE
// new moon falls at 2000-01-06 18:14 UTC.  MEMORY-SOURCED assertion: the
// 18:14 UTC timestamp comes from the task/spec and published almanacs, not
// from this code.  A mean-formula-only implementation would miss it by ~4 h
// and fail this test -- that is the point of it.
// ---------------------------------------------------------------------------
test('anchor: true new moon 2000-01-06 18:14 UTC within 1 hour', () => {
  const instants = findNewMoons(Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 12));
  assert.equal(instants.length, 1);
  const published = Date.UTC(2000, 0, 6, 18, 14);
  assert.ok(Math.abs(instants[0] - published) < HOUR_MS,
    `computed ${new Date(instants[0]).toISOString()} vs published 2000-01-06T18:14Z`);

  const m = computeMoon(new Date(published));
  assert.equal(m.phaseName, 'new');
  assert.equal(m.isInstantPhase, true);
  assert.ok(m.illumination < 0.01);
  assert.ok(m.age < 0.5 || m.age > SYNODIC - 0.5);
});

// ---------------------------------------------------------------------------
// Independent anchors via solar eclipses.  A solar eclipse can only happen at
// new moon, so the DATE of each is beyond doubt; the quoted minutes are
// MEMORY-SOURCED (published new-moon instants near eclipse maximum) and are
// therefore given a generous 3 h tolerance.  Conductor: these two timestamps
// (1999-08-11 ~11:08 UTC, 2017-08-21 ~18:30 UTC) are the assertions to
// scrutinize; everything else in this file is self-consistency.
// ---------------------------------------------------------------------------
test('anchor: new moon at the 1999-08-11 total solar eclipse', () => {
  const instants = findNewMoons(Date.UTC(1999, 7, 8), Date.UTC(1999, 7, 14));
  assert.equal(instants.length, 1);
  assert.ok(Math.abs(instants[0] - Date.UTC(1999, 7, 11, 11, 8)) < 3 * HOUR_MS,
    `computed ${new Date(instants[0]).toISOString()}`);
});

test('anchor: new moon at the 2017-08-21 total solar eclipse', () => {
  const instants = findNewMoons(Date.UTC(2017, 7, 18), Date.UTC(2017, 7, 24));
  assert.equal(instants.length, 1);
  assert.ok(Math.abs(instants[0] - Date.UTC(2017, 7, 21, 18, 30)) < 3 * HOUR_MS,
    `computed ${new Date(instants[0]).toISOString()}`);
});

// ---------------------------------------------------------------------------
// Self-consistency: these matter more than any memorized date.
// ---------------------------------------------------------------------------

test('successive new moons are 29.53 +/- 0.5 days apart (2019-2024)', () => {
  const instants = findNewMoons(Date.UTC(2019, 0, 1), Date.UTC(2024, 0, 1));
  // 5 years * 12.3685 lunations/year ~ 61.8 -> 61 or 62 intervals' worth.
  assert.ok(instants.length >= 60 && instants.length <= 63,
    `found ${instants.length} new moons`);
  const gaps = [];
  for (let i = 1; i < instants.length; i++) {
    const gap = (instants[i] - instants[i - 1]) / DAY_MS;
    assert.ok(Math.abs(gap - SYNODIC) < 0.5, `gap ${gap} days at index ${i}`);
    gaps.push(gap);
  }
  // The corrections average out: the MEAN gap must sit tight on the mean
  // synodic month even though individual gaps swing by many hours.
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  assert.ok(Math.abs(mean - SYNODIC) < 0.02, `mean gap ${mean}`);
  // And they must actually swing (a naive constant-period modulo would not):
  const spread = Math.max(...gaps) - Math.min(...gaps);
  assert.ok(spread > 0.15, `gap spread only ${spread} days -- corrections missing?`);
});

test('illumination ~0 at computed new moons, ~1 at computed full moons', () => {
  const news = findNewMoons(Date.UTC(2022, 0, 1), Date.UTC(2023, 0, 1));
  assert.ok(news.length >= 11);
  for (const nm of news) {
    const m = moonAt(nm);
    assert.ok(m.illumination < 0.005, `illum ${m.illumination} at ${new Date(nm).toISOString()}`);
    assert.equal(m.phaseName, 'new');
    assert.equal(m.isInstantPhase, true);
  }
  for (let i = 1; i < news.length; i++) {
    const fm = bisectCrossing(news[i - 1], news[i], 0.5);
    const m = moonAt(fm);
    assert.ok(m.illumination > 0.995, `illum ${m.illumination} at ${new Date(fm).toISOString()}`);
    assert.equal(m.phaseName, 'full');
    assert.equal(m.isInstantPhase, true);
  }
});

test('illumination is 0.5 at the quarters and names them', () => {
  const news = findNewMoons(Date.UTC(2021, 2, 1), Date.UTC(2021, 6, 1));
  assert.ok(news.length >= 2);
  for (let i = 1; i < news.length; i++) {
    const q1 = bisectCrossing(news[i - 1], news[i], 0.25);
    const q3 = bisectCrossing(news[i - 1], news[i], 0.75);
    assert.ok(Math.abs(moonAt(q1).illumination - 0.5) < 0.01);
    assert.ok(Math.abs(moonAt(q3).illumination - 0.5) < 0.01);
    assert.equal(moonAt(q1).phaseName, 'first quarter');
    assert.equal(moonAt(q3).phaseName, 'last quarter');
    assert.equal(moonAt(q1).isInstantPhase, true);
    assert.equal(moonAt(q3).isInstantPhase, true);
  }
});

test('illumination and phaseAngle agree across a full cycle', () => {
  // Meeus (48.1): k = (1 + cos i)/2 with i the phase angle, i.e. with the
  // elongation e reported as phaseAngle, k = (1 - cos e)/2.
  let prev = null;
  for (let step = 0; step <= 130; step++) {
    const m = moonAt(Date.UTC(2024, 0, 3) + step * 0.25 * DAY_MS);
    const expected = (1 - Math.cos(m.phaseAngle * Math.PI / 180)) / 2;
    assert.ok(Math.abs(m.illumination - expected) < 1e-9);
    // Monotonicity: waxing while phaseAngle < 180, waning after.
    if (prev && prev.phaseAngle < m.phaseAngle && m.phaseAngle < 180) {
      assert.ok(m.illumination >= prev.illumination);
    }
    if (prev && 180 < prev.phaseAngle && prev.phaseAngle < m.phaseAngle) {
      assert.ok(m.illumination <= prev.illumination);
    }
    prev = m;
  }
});

test('cycleFraction, age and phaseName stay consistent across a lunation', () => {
  const [nm] = findNewMoons(Date.UTC(2023, 5, 10), Date.UTC(2023, 6, 12));
  assert.ok(nm);
  const names = [];
  for (let ms = nm + HOUR_MS; ms < nm + 29 * DAY_MS; ms += 0.2 * DAY_MS) {
    const m = moonAt(ms);
    // age must track real elapsed time since the found new-moon instant.
    const elapsed = (ms - nm) / DAY_MS;
    assert.ok(Math.abs(m.age - elapsed) < 0.02, `age ${m.age} vs elapsed ${elapsed}`);
    // cycleFraction (true elongation) may lead/lag mean time by the periodic
    // corrections (up to ~0.9 d ~ 0.03 cycle) but never more.
    assert.ok(circDiff(m.cycleFraction, elapsed / SYNODIC) < 0.035,
      `cycleFraction ${m.cycleFraction} vs mean ${elapsed / SYNODIC}`);
    // Instant names are exactly the even indices; flag must match the name.
    assert.equal(m.isInstantPhase, PHASE_NAMES.indexOf(m.phaseName) % 2 === 0);
    if (names[names.length - 1] !== m.phaseName) names.push(m.phaseName);
  }
  // Names must appear in cycle order, each exactly once, starting at "new".
  assert.deepEqual(names, PHASE_NAMES);
});

test('instant-phase tolerance is +/- 12 hours around the instant', () => {
  const [nm] = findNewMoons(Date.UTC(2024, 3, 1), Date.UTC(2024, 4, 1));
  assert.ok(nm);
  for (const dh of [-11, 11]) {
    const m = moonAt(nm + dh * HOUR_MS);
    assert.equal(m.phaseName, 'new', `${dh}h from instant`);
    assert.equal(m.isInstantPhase, true);
  }
  const before = moonAt(nm - 13 * HOUR_MS);
  assert.equal(before.phaseName, 'waning crescent');
  assert.equal(before.isInstantPhase, false);
  const after = moonAt(nm + 13 * HOUR_MS);
  assert.equal(after.phaseName, 'waxing crescent');
  assert.equal(after.isInstantPhase, false);
});

test('ranges hold across a 40-year daily sweep (1995-2035)', () => {
  for (let ms = Date.UTC(1995, 0, 1); ms <= Date.UTC(2035, 0, 1); ms += DAY_MS) {
    const m = moonAt(ms);
    assert.ok(Number.isFinite(m.julianDay));
    assert.ok(m.illumination >= 0 && m.illumination <= 1, `illum ${m.illumination}`);
    assert.ok(m.phaseAngle >= 0 && m.phaseAngle < 360, `angle ${m.phaseAngle}`);
    assert.ok(m.cycleFraction >= 0 && m.cycleFraction < 1, `cf ${m.cycleFraction}`);
    assert.ok(m.age >= 0 && m.age <= SYNODIC, `age ${m.age}`);
    assert.ok(PHASE_NAMES.includes(m.phaseName));
    assert.equal(typeof m.isInstantPhase, 'boolean');
  }
});

// ---------------------------------------------------------------------------
// nextFullMoon (additive export)
// ---------------------------------------------------------------------------

test('nextFullMoon rejects non-Dates and invalid Dates', () => {
  assert.throws(() => nextFullMoon('2024-01-01'), TypeError);
  assert.throws(() => nextFullMoon(new Date(NaN)), TypeError);
});

test('nextFullMoon is strictly after its input and closes round-trip', () => {
  const probes = [
    Date.UTC(2000, 0, 6, 18, 14),   // at a new moon
    Date.UTC(2024, 6, 1),
    Date.UTC(1999, 11, 31, 23, 59),
    Date.UTC(2026, 7, 14, 12, 0),
  ];
  for (const ms of probes) {
    const fm = nextFullMoon(new Date(ms));
    assert.ok(fm instanceof Date);
    assert.ok(fm.getTime() > ms, 'strictly after');
    // Strong self-consistency: feeding the instant back through computeMoon
    // must report an (instant) full moon at ~full illumination.
    const m = computeMoon(fm);
    assert.equal(m.phaseName, 'full');
    assert.equal(m.isInstantPhase, true);
    assert.ok(m.illumination > 0.995, `illum ${m.illumination}`);
    assert.ok(Math.abs(m.cycleFraction - 0.5) < 0.01);
  }
});

test('nextFullMoon at a full-moon instant returns the NEXT one', () => {
  const f1 = nextFullMoon(new Date(Date.UTC(2023, 0, 1)));
  const f2 = nextFullMoon(f1);
  const gap = (f2.getTime() - f1.getTime()) / DAY_MS;
  assert.ok(Math.abs(gap - SYNODIC) < 0.5, `gap ${gap}`);
});

test('consecutive full moons are 29.53 +/- 0.5 days apart (chained)', () => {
  let cursor = nextFullMoon(new Date(Date.UTC(2020, 0, 1)));
  const gaps = [];
  for (let i = 0; i < 30; i++) {
    const next = nextFullMoon(cursor);
    const gap = (next.getTime() - cursor.getTime()) / DAY_MS;
    assert.ok(Math.abs(gap - SYNODIC) < 0.5, `gap ${gap} at step ${i}`);
    gaps.push(gap);
    cursor = next;
  }
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  assert.ok(Math.abs(mean - SYNODIC) < 0.05, `mean ${mean}`);
});

// MEMORY-SOURCED assertion: the full moon of 2000-01-21 (the night of a total
// lunar eclipse, so the date is certain; the ~04:44 UTC eclipse maximum is
// from memory, hence the 3 h tolerance).
test('anchor: full moon of the 2000-01-21 total lunar eclipse', () => {
  const fm = nextFullMoon(new Date(Date.UTC(2000, 0, 10)));
  assert.ok(Math.abs(fm.getTime() - Date.UTC(2000, 0, 21, 4, 44)) < 3 * HOUR_MS,
    `computed ${fm.toISOString()}`);
});
