// What does an HONEST 5% row actually look like at a true off-centre k? Conductor-run,
// so the false-positive mutant below is built from the shipping renderer, not from
// cycle 37's prose (which said the disc was the half glyph).
const fs = require('fs');
const { renderLine } = require('/opt/targets/moon/src/render.js');
const text = fs.readFileSync('/opt/targets/moon/README.md', 'utf8');
const fences = [];
let open = null, buf = [];
for (const line of text.split('\n')) {
  if (line.startsWith('```')) {
    if (open === null) { open = line.slice(3); buf = []; } else { fences.push({ lang: open, body: buf.join('\n') }); open = null; }
  } else if (open !== null) buf.push(line);
}
const json = JSON.parse(fences.find(f => f.lang === 'json').body);
const wan = Math.max(json.cycleFraction, 1 - json.cycleFraction);
for (const k of [0.046, 0.048, 0.05, 0.052]) {
  const n = renderLine({ illumination: k, cycleFraction: wan, phaseName: 'waning crescent' }, 'north');
  const s = renderLine({ illumination: k, cycleFraction: wan, phaseName: 'waning crescent' }, 'south');
  console.log('k=' + k + '  north=' + JSON.stringify(n) + '  south=' + JSON.stringify(s));
}
