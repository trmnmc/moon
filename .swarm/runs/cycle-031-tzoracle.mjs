// cycle 31 conductor scratch: cross-check src/hemisphere.js's hand-typed table against
// the IANA reference coordinates in /usr/share/zoneinfo/zone1970.tab (+ zone.tab for
// zones dropped from the 1970 file). Read-only; no repo file is touched.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { detectHemisphere } = require('/opt/targets/moon/src/hemisphere.js');

function parseTab(path) {
  const out = new Map();
  if (!fs.existsSync(path)) return out;
  for (const raw of fs.readFileSync(path, 'utf8').split('\n')) {
    if (!raw || raw[0] === '#') continue;
    const f = raw.split('\t');
    if (f.length < 3) continue;
    const coord = f[1];
    const zones = f[2];
    // ISO 6709: ±DDMM±DDDMM  or  ±DDMMSS±DDDMMSS
    const m = /^([+-])(\d{2})(\d{2})(\d{2})?[+-]/.exec(coord);
    if (!m) { console.log('UNPARSED COORD', coord, zones); continue; }
    const sign = m[1] === '-' ? -1 : 1;
    const lat = sign * (Number(m[2]) + Number(m[3]) / 60 + Number(m[4] || 0) / 3600);
    for (const z of zones.split(',')) out.set(z.trim().toLowerCase(), lat);
  }
  return out;
}

const tab = new Map([...parseTab('/usr/share/zoneinfo/zone.tab'), ...parseTab('/usr/share/zoneinfo/zone1970.tab')]);
console.log('oracle zones:', tab.size);

let dis = 0, agree = 0;
const near = [];
for (const [zone, lat] of [...tab].sort()) {
  const expect = lat < 0 ? 'south' : 'north';
  const got = detectHemisphere(zone);
  if (got !== expect) {
    dis++;
    console.log(`DISAGREE  ${zone.padEnd(32)} lat=${lat.toFixed(4).padStart(9)}  oracle=${expect}  code=${got}`);
  } else {
    agree++;
    if (Math.abs(lat) < 1.5) near.push(`${zone} ${lat.toFixed(4)} -> ${got}`);
  }
}
console.log(`\nagree=${agree} disagree=${dis}`);
console.log('\n-- equator-adjacent (|lat|<1.5) that AGREE --');
for (const n of near) console.log('  ' + n);
