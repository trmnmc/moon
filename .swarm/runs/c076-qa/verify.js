'use strict';
// QA verification of README "Accuracy" claims, using only the public API of src/astro.js.
const { computeMoon, nextFullMoon } = require('/opt/targets/moon/src/astro.js');

const DAY_MS = 86400000;
const SYN = 29.530588861;

// Recover the instant of the last new moon before a date via jd - age (both public fields).
function lastNewMoonMs(date) {
  const m = computeMoon(date);
  const newJD = m.julianDay - m.age;
  return (newJD - 2440587.5) * DAY_MS;
}

// --- A: published new moon of 2000-01-06 18:14 UTC; README claims impl computes 18:15 UTC.
const nm2000 = new Date(lastNewMoonMs(new Date('2000-01-10T00:00:00Z')));
console.log('A: new moon Jan 2000 (impl):', nm2000.toISOString());

// --- B/C: lunation lengths and new->full intervals, 1990-2060.
let t = new Date('1989-12-01T00:00:00Z');
let prevNew = lastNewMoonMs(t);
// advance until first new moon >= 1990-01-01
const startMs = Date.UTC(1990, 0, 1), endMs = Date.UTC(2060, 0, 1);
const news = [];
let cur = prevNew;
while (cur < endMs + 40 * DAY_MS) {
  if (cur >= startMs - 40 * DAY_MS) news.push(cur);
  // step into next lunation: probe just after this new moon + ~1.05 synodic months? safer: +5 days then find next new via full+age math
  const probe = new Date(cur + 30.5 * DAY_MS);
  const nxt = lastNewMoonMs(probe);
  if (nxt <= cur) { console.log('B: step failed at', new Date(cur).toISOString()); break; }
  cur = nxt;
}
const lens = [];
const nfIntervals = [];
const cfFullDevMin = [];
const cfNewDevMin = [];
let midMaxHours = 0, midMaxAt = null;
for (let i = 0; i < news.length - 1; i++) {
  const a = news[i], b = news[i + 1];
  if (a < startMs || b > endMs + 40 * DAY_MS) {}
  const len = (b - a) / DAY_MS;
  if (a >= startMs && a < endMs) lens.push(len);
  const full = nextFullMoon(new Date(a + 1000)).getTime();
  if (a >= startMs && a < endMs) nfIntervals.push((full - a) / DAY_MS);
  // cycleFraction endpoint deviations, expressed as time via mean angular rate
  const mFull = computeMoon(new Date(full));
  const devFull = Math.abs(mFull.cycleFraction - 0.5) * SYN * 24 * 60; // minutes
  cfFullDevMin.push(devFull);
  const mNew = computeMoon(new Date(b)); // at a true new moon instant
  let cfN = mNew.cycleFraction; if (cfN > 0.5) cfN -= 1;
  cfNewDevMin.push(Math.abs(cfN) * SYN * 24 * 60);
  // mid-cycle lead/lag of cycleFraction*SYN vs age, sampled every 6h
  if (a >= startMs && a < endMs) {
    for (let s = a; s < b; s += 6 * 3600 * 1000) {
      const m = computeMoon(new Date(s));
      let cf = m.cycleFraction;
      const diffH = Math.abs(cf * SYN - m.age) * 24;
      if (diffH > midMaxHours) { midMaxHours = diffH; midMaxAt = new Date(s).toISOString(); }
    }
  }
}
const min = (a) => Math.min(...a), max = (a) => Math.max(...a);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log('B: lunations counted:', lens.length, 'min:', min(lens).toFixed(3), 'max:', max(lens).toFixed(3));
console.log('   README claims 864 lunations, 29.274-29.826');
console.log('C: new->full intervals:', nfIntervals.length, 'min:', min(nfIntervals).toFixed(3), 'max:', max(nfIntervals).toFixed(3), 'mean:', mean(nfIntervals).toFixed(3));
console.log('   README claims 865 intervals, 13.906-15.613, mean 14.765');
console.log('D: cycleFraction dev at true FULL, minutes: max', max(cfFullDevMin).toFixed(1), 'mean', mean(cfFullDevMin).toFixed(1));
console.log('   cycleFraction dev at true NEW,  minutes: max', max(cfNewDevMin).toFixed(1), 'mean', mean(cfNewDevMin).toFixed(1));
console.log('   README/help claim endpoints hold to within ~45 min');
console.log('E: mid-cycle |cf*29.53 - age| max hours:', midMaxHours.toFixed(2), 'at', midMaxAt);
console.log('   README/help claim lead/lag up to ~21 hours');
