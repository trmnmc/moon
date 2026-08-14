// CONDUCTOR VERIFY PROBE (cycle 19, T-113). Instruments a COPY of src/render.js.
// The repo source is never modified. Run: node .swarm/runs/cycle-019-probe-T-113.js
//
// Question it answers: does lineArt() actually emit a ROUND_LIMB glyph for an outer
// cell that is NOT fully lit? If yes, the pre-T-113 prose ("for a fully lit outer
// cell") understated the branch and T-113's premise is empirically real.
const fs = require('fs');
const path = require('path');
const ROOT = '/opt/targets/moon';
const src = fs.readFileSync(path.join(ROOT, 'src/render.js'), 'utf8');

const BRANCH = "      else out += ROUND_LIMB[c === 0 ? 'left' : 'right'];";
if (!src.includes(BRANCH)) { console.error('PROBE ABORT: branch text not found verbatim'); process.exit(9); }
let out = src.replace(BRANCH,
  "      else { globalThis.__RL.push(cover); out += ROUND_LIMB[c === 0 ? 'left' : 'right']; }");
out = out.replace("    if (c === 0 || c === LINE_CELLS - 1) {",
  "    if (c === 0 || c === LINE_CELLS - 1) {\n      globalThis.__ALL.push(cover);");
const tmp = path.join(ROOT, '.swarm/runs/.render-probe.tmp.js');
fs.writeFileSync(tmp, out);

globalThis.__RL = []; globalThis.__ALL = [];
const { renderLine } = require(tmp);

const N = 20000;
let threw = null;
for (let i = 0; i < N; i++) {
  const phase = i / N;
  const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const waxing = phase < 0.5;
  const moon = { phase, illumination: illum, waxing, phaseName: 'x', age: phase * 29.53 };
  try { renderLine(moon, 'north'); renderLine(moon, 'south'); } catch (e) { threw = e.message; break; }
}
fs.unlinkSync(tmp);
if (threw) console.log('renderLine threw:', threw);
const rl = globalThis.__RL, all = globalThis.__ALL;
if (!rl.length) { console.log('NO ROUND LIMB EVER DRAWN -- probe inconclusive'); process.exit(1); }
const min = Math.min(...rl), max = Math.max(...rl);
const belowFull = rl.filter(c => c < 0.999999).length;
const inBand = rl.filter(c => c >= 0.88 && c < 0.999999).length;
const violations = rl.filter(c => c < 0.88).length;
const geqAll = all.filter(c => c >= 0.88).length;
console.log('outer-cell samples         :', all.length);
console.log('round-limb draws           :', rl.length);
console.log('min cover at a round limb  :', min.toFixed(6));
console.log('max cover at a round limb  :', max.toFixed(6));
console.log('draws with cover < 1.0     :', belowFull, ' <-- if >0, "fully lit" UNDERSTATED');
console.log('draws in band [0.88, 1.0)  :', inBand);
console.log('draws with cover <  0.88   :', violations, ' <-- must be 0');
console.log('outer cells with cover>=.88:', geqAll, ' equals round-limb draws?', geqAll === rl.length);
