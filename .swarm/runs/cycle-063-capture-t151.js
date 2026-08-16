// cycle 63 T-151 gate: capture renderBlock frames across a full lunation, both
// hemispheres, for the width-policy discriminator test. Conductor-authored at
// verification time; the builder never saw this.
const { computeMoon } = require('/opt/targets/moon/src/astro.js');
const { renderBlock } = require('/opt/targets/moon/src/render.js');

const frames = [];
// 2026-01-01 .. 2026-02-15, every 6 h -> covers >1.5 synodic months at fine grain
const start = Date.UTC(2026, 0, 1, 0, 0, 0);
const stepMs = 6 * 3600 * 1000;
const steps = 4 * 46;
for (let i = 0; i < steps; i++) {
  const d = new Date(start + i * stepMs);
  const moon = computeMoon(d);
  for (const hemi of ['north', 'south']) {
    frames.push({ label: d.toISOString() + '/' + hemi, frame: renderBlock(moon, hemi) });
  }
}
process.stdout.write(JSON.stringify(frames));
