// cycle 93 / T-189 gate: capture renderBlock frames from CURRENT HEAD and re-derive the
// KI-5 reader self-check's discriminating power at run time (L-045). Conductor-authored at
// verification time. Deliberately spans a window that INCLUDES today, so the round-limb
// regime (U+25D6/U+25D7, reached at lit fraction >= 0.88) is exercised — cycle 63's proof
// used a 2026-01-01..02-15 window and this one must not simply re-run that.
const { computeMoon } = require('/opt/targets/moon/src/astro.js');
const { renderBlock } = require('/opt/targets/moon/src/render.js');

const frames = [];
// 2026-08-01 .. 2026-09-30, every 3 h -> ~2 synodic months at finer grain than cycle 63.
const start = Date.UTC(2026, 7, 1, 0, 0, 0);
const stepMs = 3 * 3600 * 1000;
const steps = 8 * 61;
for (let i = 0; i < steps; i++) {
  const d = new Date(start + i * stepMs);
  const moon = computeMoon(d);
  for (const hemi of ['north', 'south']) {
    frames.push({ label: d.toISOString() + '/' + hemi, frame: renderBlock(moon, hemi) });
  }
}
process.stdout.write(JSON.stringify(frames));
