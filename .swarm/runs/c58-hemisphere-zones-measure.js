'use strict';
// T-148 (cycle 58) -- rerun of test/hemisphere.test.js's own check
// ("the static table agrees with every zone in the host tz database",
// test/hemisphere.test.js:327-346), reproduced verbatim (same
// loadIanaLatitudes parse, same comparison) so the raw zone COUNT and
// mismatch count can be printed -- the test itself only asserts, it never
// logs the numbers REPORT.md's VERIFIED table pastes:
//   "Builder validated against all 418 zones in the host IANA database..."
const { detectHemisphere } = require('../../src/hemisphere.js');
const fs = require('node:fs');

function loadIanaLatitudes() {
  const zones = new Map();
  for (const file of ['/usr/share/zoneinfo/zone1970.tab', '/usr/share/zoneinfo/zone.tab']) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      if (line === '' || line.startsWith('#')) continue;
      const [, coordinates, names] = line.split('\t');
      if (!coordinates || !names) continue;
      const m = /^([+-])(\d{2})(\d{2})(\d{2})?/.exec(coordinates);
      if (!m) continue;
      const latitude =
        (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60 + Number(m[4] || 0) / 3600);
      for (const name of names.split(',')) zones.set(name, latitude);
    }
  }
  return zones.size > 0 ? zones : null;
}

const zones = loadIanaLatitudes();
if (zones === null) {
  console.log('NO /usr/share/zoneinfo on this host -- test would SKIP');
  process.exit(1);
}

const mismatches = [];
for (const [zone, latitude] of zones) {
  const expected = latitude < 0 ? 'south' : 'north';
  const actual = detectHemisphere(zone);
  if (actual !== expected) {
    mismatches.push(`${zone} (lat ${latitude.toFixed(3)}): expected ${expected}, got ${actual}`);
  }
}

console.log('total IANA zones (zone1970.tab + zone.tab union):', zones.size);
console.log('mismatches:', mismatches.length);
for (const m of mismatches) console.log('  ' + m);
