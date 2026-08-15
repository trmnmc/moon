// Conductor gate, cycle 38 — independent of the test file. Re-parses README myself with
// a different parser than the test uses, and measures how DISCRIMINATING the band
// predicate really is per row: what set of illuminations DISPLAY as the row's percent,
// and what subset of those also reproduce the row's exact north disc.
const fs = require('fs');
const { renderLine } = require('/opt/targets/moon/src/render.js');
const text = fs.readFileSync('/opt/targets/moon/README.md', 'utf8');

// Line-state fence scanner — a regex pairing over ```/```sh mispairs on this file.
const fences = [];
let open = null, buf = [];
for (const line of text.split('\n')) {
  if (line.startsWith('```')) {
    if (open === null) { open = line.slice(3); buf = []; }
    else { fences.push({ lang: open, body: buf.join('\n') }); open = null; }
  } else if (open !== null) buf.push(line);
}
const sweep = (fences.find(f => f.lang === '' && /^north\s+south/.test(f.body)) || {}).body;
if (!sweep) { console.log('NO SWEEP FENCE FOUND'); process.exit(2); }
const rows = sweep.split('\n').slice(1).filter(l => l.length);
console.log('ROWS PARSED:', rows.length);

const json = JSON.parse(fences.find(f => f.lang === 'json').body);
const wax = Math.min(json.cycleFraction, 1 - json.cycleFraction);
const wan = Math.max(json.cycleFraction, 1 - json.cycleFraction);

const pp = x => (x * 100).toFixed(4);
let bad = 0;
for (const row of rows) {
  const m = /^(\S+)\s+(\d+)%\s+([a-z ]+?)\s{2,}(\S+)\s+(\d+)%\s+([a-z ]+)$/.exec(row);
  if (!m) { console.log('UNPARSED ROW:', JSON.stringify(row)); bad++; continue; }
  const ndisc = m[1], pct = Number(m[2]), nname = m[3];
  const cf = nname.includes('waning') ? wan : wax;
  let bandLo = null, bandHi = null, hitLo = null, hitHi = null, hits = 0, band = 0;
  for (let i = 0; i <= 100000; i++) {
    const k = i / 100000;
    const out = renderLine({ illumination: k, cycleFraction: cf, phaseName: nname }, 'north');
    const d = out.slice(0, out.indexOf(' '));
    const p = Number(/(\d+)%/.exec(out)[1]);
    if (p !== pct) continue;
    band++; if (bandLo === null) bandLo = k; bandHi = k;
    if (d === ndisc) { hits++; if (hitLo === null) hitLo = k; hitHi = k; }
  }
  console.log(
    String(pct).padStart(3) + '%  display-band=[' + pp(bandLo) + ',' + pp(bandHi) + ']pp w=' + pp(bandHi - bandLo) +
    'pp | disc-accepting=' + (hits ? '[' + pp(hitLo) + ',' + pp(hitHi) + ']pp w=' + pp(hitHi - hitLo) + 'pp' : 'EMPTY') +
    ' | accept-fraction=' + (hits / band * 100).toFixed(1) + '%');
}
console.log('UNPARSED ROWS:', bad);
