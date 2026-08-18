'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const { detectHemisphere } = require('../src/hemisphere.js');

const HEMISPHERE_MODULE = path.join(__dirname, '..', 'src', 'hemisphere.js');

/**
 * Resolve the DEFAULT (no-argument) code path in a fresh child process with TZ pinned.
 * A child process is used deliberately: TZ must be set before the runtime resolves the
 * host zone, and mutating process.env.TZ in-process would leak into sibling tests.
 * The build host is UTC, so an unpinned test here would pass here and fail everywhere.
 * @param {string} tz
 * @returns {string}
 */
function detectWithHostTZ(tz) {
  return execFileSync(
    process.execPath,
    ['-e', `process.stdout.write(require(${JSON.stringify(HEMISPHERE_MODULE)}).detectHemisphere())`],
    { env: { ...process.env, TZ: tz }, encoding: 'utf8' },
  );
}

test('northern zones across every continent', () => {
  const north = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'America/Toronto',
    'America/Mexico_City',
    'America/Panama',
    'America/Havana',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Moscow',
    'Europe/Lisbon',
    'Atlantic/Reykjavik',
    'Atlantic/Azores',
    'Atlantic/Cape_Verde',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Jerusalem',
    'Asia/Manila',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Accra',
    'Africa/Addis_Ababa',
    'Pacific/Honolulu',
    'Pacific/Guam',
    'Pacific/Majuro',
    'Arctic/Longyearbyen',
  ];
  for (const zone of north) {
    assert.strictEqual(detectHemisphere(zone), 'north', `${zone} should be north`);
  }
});

test('southern zones across every continent', () => {
  const south = [
    // Australia + New Zealand
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Australia/Adelaide',
    'Australia/Darwin',
    'Australia/Hobart',
    'Australia/Eucla',
    'Australia/Lord_Howe',
    'Australia/Broken_Hill',
    'Pacific/Auckland',
    'Pacific/Chatham',
    // South America
    'America/Sao_Paulo',
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Ushuaia',
    'America/Argentina/Cordoba',
    'America/Santiago',
    'America/Punta_Arenas',
    'America/Lima',
    'America/La_Paz',
    'America/Asuncion',
    'America/Montevideo',
    'America/Manaus',
    'America/Recife',
    'America/Noronha',
    // Africa
    'Africa/Johannesburg',
    'Africa/Windhoek',
    'Africa/Harare',
    'Africa/Maputo',
    'Africa/Luanda',
    'Africa/Kinshasa',
    'Africa/Dar_es_Salaam',
    // Antarctica
    'Antarctica/McMurdo',
    'Antarctica/Casey',
    'Antarctica/Palmer',
    'Antarctica/Troll',
    'Antarctica/Rothera',
    'Antarctica/South_Pole',
    // Pacific
    'Pacific/Fiji',
    'Pacific/Noumea',
    'Pacific/Port_Moresby',
    'Pacific/Apia',
    'Pacific/Tahiti',
    'Pacific/Easter',
    'Pacific/Norfolk',
    // Indian Ocean
    'Indian/Antananarivo',
    'Indian/Mauritius',
    'Indian/Reunion',
    'Indian/Kerguelen',
    'Indian/Chagos',
    'Indian/Cocos',
    // Asia (Indonesia / Timor-Leste)
    'Asia/Jakarta',
    'Asia/Makassar',
    'Asia/Jayapura',
    'Asia/Dili',
    // Atlantic
    'Atlantic/Stanley',
    'Atlantic/South_Georgia',
    'Atlantic/St_Helena',
  ];
  for (const zone of south) {
    assert.strictEqual(detectHemisphere(zone), 'south', `${zone} should be south`);
  }
});

test('every Australia/* zone is southern, including the legacy aliases', () => {
  const zones = [
    'Australia/ACT',
    'Australia/Canberra',
    'Australia/LHI',
    'Australia/NSW',
    'Australia/North',
    'Australia/Queensland',
    'Australia/South',
    'Australia/Tasmania',
    'Australia/Victoria',
    'Australia/West',
    'Australia/Yancowinna',
    'Australia/Lindeman',
    'Australia/Currie',
  ];
  for (const zone of zones) {
    assert.strictEqual(detectHemisphere(zone), 'south', `${zone} should be south`);
  }
});

// The heart of the module: continents that straddle the equator, where pattern-matching
// a whole continent silently produces a wrong moon. Each case below required looking up
// the zone's reference latitude rather than guessing from the country.
test('equator-adjacent zones: Africa straddles, so per-zone reasoning is required', () => {
  // Nairobi is 1 deg 17' SOUTH - Kenya straddles the equator and the capital is south.
  assert.strictEqual(detectHemisphere('Africa/Nairobi'), 'south');
  // Kampala is 0 deg 19' NORTH - Uganda straddles and the capital is north. A naive
  // "East Africa is southern" rule gets this backwards.
  assert.strictEqual(detectHemisphere('Africa/Kampala'), 'north');
  // Lagos is 6 deg 27' NORTH - west Africa is northern despite "Africa" reading southern.
  assert.strictEqual(detectHemisphere('Africa/Lagos'), 'north');
  // Libreville 0 deg 23' N and Sao Tome 0 deg 20' N: both countries straddle, both
  // reference points are north.
  assert.strictEqual(detectHemisphere('Africa/Libreville'), 'north');
  assert.strictEqual(detectHemisphere('Africa/Sao_Tome'), 'north');
  assert.strictEqual(detectHemisphere('Africa/Mogadishu'), 'north');
  // ...while Kinshasa (4 deg 18' S) and Brazzaville (4 deg 16' S) face each other across
  // the river and are both southern.
  assert.strictEqual(detectHemisphere('Africa/Kinshasa'), 'south');
  assert.strictEqual(detectHemisphere('Africa/Brazzaville'), 'south');
});

test('equator-adjacent zones: South America and the Pacific straddle too', () => {
  // Bogota is 4 deg 36' NORTH - Colombia is a South American country in the north.
  assert.strictEqual(detectHemisphere('America/Bogota'), 'north');
  // Boa Vista is 2 deg 49' NORTH - a BRAZILIAN zone north of the equator. Any rule that
  // maps "Brazil" to southern wholesale is wrong here.
  assert.strictEqual(detectHemisphere('America/Boa_Vista'), 'north');
  // Guayaquil is 2 deg 10' SOUTH - Ecuador straddles (Quito itself is 0 deg 13' S).
  assert.strictEqual(detectHemisphere('America/Guayaquil'), 'south');
  assert.strictEqual(detectHemisphere('America/Belem'), 'south');
  // Guianas and Venezuela: northern South America.
  assert.strictEqual(detectHemisphere('America/Caracas'), 'north');
  assert.strictEqual(detectHemisphere('America/Paramaribo'), 'north');
  assert.strictEqual(detectHemisphere('America/Cayenne'), 'north');
  assert.strictEqual(detectHemisphere('America/Guyana'), 'north');
  // Pacific: Kiribati straddles. Tarawa 1 deg 26' N, Kanton 2 deg 48' S.
  assert.strictEqual(detectHemisphere('Pacific/Tarawa'), 'north');
  assert.strictEqual(detectHemisphere('Pacific/Kiritimati'), 'north');
  assert.strictEqual(detectHemisphere('Pacific/Kanton'), 'south');
  // Nauru is only 0 deg 31' south of the equator.
  assert.strictEqual(detectHemisphere('Pacific/Nauru'), 'south');
  // The Galapagos archipelago straddles; the tz reference point is 0 deg 54' S.
  assert.strictEqual(detectHemisphere('Pacific/Galapagos'), 'south');
  // Pontianak sits ON the equator; the tz reference latitude is 0 deg 02' S.
  assert.strictEqual(detectHemisphere('Asia/Pontianak'), 'south');
  // ...whereas Singapore (1 deg 17' N) and Kuching (1 deg 33' N) are north.
  assert.strictEqual(detectHemisphere('Asia/Singapore'), 'north');
  assert.strictEqual(detectHemisphere('Asia/Kuching'), 'north');
});

test('Indian/* is southern except the Maldives', () => {
  // Male is 4 deg 10' NORTH even though the Maldives chain crosses the equator.
  assert.strictEqual(detectHemisphere('Indian/Maldives'), 'north');
  assert.strictEqual(detectHemisphere('Indian/Mahe'), 'south');
  assert.strictEqual(detectHemisphere('Indian/Comoro'), 'south');
  assert.strictEqual(detectHemisphere('Indian/Mayotte'), 'south');
  assert.strictEqual(detectHemisphere('Indian/Christmas'), 'south');
});

test('legacy top-level aliases', () => {
  assert.strictEqual(detectHemisphere('NZ'), 'south');
  assert.strictEqual(detectHemisphere('NZ-CHAT'), 'south');
  assert.strictEqual(detectHemisphere('Brazil/East'), 'south');
  assert.strictEqual(detectHemisphere('Brazil/DeNoronha'), 'south');
  assert.strictEqual(detectHemisphere('Chile/EasterIsland'), 'south');
  assert.strictEqual(detectHemisphere('America/Buenos_Aires'), 'south');
  assert.strictEqual(detectHemisphere('Asia/Ujung_Pandang'), 'south');
  assert.strictEqual(detectHemisphere('Pacific/Samoa'), 'south');
  // US/Samoa is a legacy alias of Pacific/Pago_Pago (14d16' S) - the one southern
  // US/* legacy alias. The other US/* aliases below must stay north: a fix that
  // flips all of US/* south would be worse than the bug it corrects.
  assert.strictEqual(detectHemisphere('US/Samoa'), 'south');
  assert.strictEqual(detectHemisphere('US/Pacific'), 'north');
  assert.strictEqual(detectHemisphere('US/Alaska'), 'north');
  assert.strictEqual(detectHemisphere('US/Hawaii'), 'north');
  assert.strictEqual(detectHemisphere('US/Eastern'), 'north');
  assert.strictEqual(detectHemisphere('Japan'), 'north');
});

test('lookup is case-insensitive', () => {
  assert.strictEqual(detectHemisphere('australia/sydney'), 'south');
  assert.strictEqual(detectHemisphere('AMERICA/SAO_PAULO'), 'south');
  assert.strictEqual(detectHemisphere('africa/NAIROBI'), 'south');
  assert.strictEqual(detectHemisphere('  Pacific/Auckland  '), 'south');
});

test('unknown, malformed and absent zones default to north and never throw', () => {
  const junk = [
    'UTC',
    'GMT',
    'Etc/GMT+10',
    'Etc/UTC',
    'Mars/Olympus_Mons',
    'not a timezone',
    '',
    '   ',
    '/',
    'Australia', // no trailing slash: not a zone, must NOT match the Australia/ prefix
    null,
    123,
    {},
    [],
    NaN,
    true,
  ];
  for (const zone of junk) {
    assert.strictEqual(detectHemisphere(zone), 'north', `${String(zone)} should default north`);
  }
});

test('always returns exactly "north" or "south", never undefined', () => {
  for (const zone of ['Europe/Paris', 'Australia/Perth', 'nonsense', undefined]) {
    const got = detectHemisphere(zone);
    assert.ok(got === 'north' || got === 'south', `got ${JSON.stringify(got)}`);
  }
});

// --- default-argument path, with the host TZ pinned in a child process ---

test('default argument reads the host timezone: southern host', () => {
  assert.strictEqual(detectWithHostTZ('Australia/Sydney'), 'south');
  assert.strictEqual(detectWithHostTZ('Pacific/Auckland'), 'south');
  assert.strictEqual(detectWithHostTZ('America/Sao_Paulo'), 'south');
});

test('default argument reads the host timezone: northern host', () => {
  assert.strictEqual(detectWithHostTZ('Europe/London'), 'north');
  assert.strictEqual(detectWithHostTZ('America/New_York'), 'north');
  // UTC is the build host's own zone. It is unknown to the table and must land on the
  // documented default rather than accidentally deciding correctness for everyone.
  assert.strictEqual(detectWithHostTZ('UTC'), 'north');
});

// --- cross-check the whole table against the IANA database, when one is available ---

/**
 * Parse the tz database's zone.tab / zone1970.tab into zone -> signed latitude.
 * Coordinates are ISO 6709: +DDMM+DDDMM or +DDMMSS+DDDMMSS. Returns null when the host
 * ships no tz database (Windows, some containers), in which case the test skips.
 * @returns {Map<string, number> | null}
 */
function loadIanaLatitudes() {
  const fs = require('node:fs');
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
      // zone1970.tab may list several zone names per row, comma separated.
      for (const name of names.split(',')) zones.set(name, latitude);
    }
  }
  return zones.size > 0 ? zones : null;
}

// This is the test that turns "I remembered the geography" into "I checked it". It walks
// EVERY zone the host's tz database knows and compares our answer against the sign of
// the zone's published reference latitude. It is how America/Coyhaique (a Chilean zone
// added in tzdata 2025a, and therefore easy to miss) was caught.
test('the static table agrees with every zone in the host tz database', (t) => {
  const zones = loadIanaLatitudes();
  if (zones === null) {
    t.skip('no /usr/share/zoneinfo on this host');
    return;
  }

  const mismatches = [];
  for (const [zone, latitude] of zones) {
    const expected = latitude < 0 ? 'south' : 'north';
    const actual = detectHemisphere(zone);
    if (actual !== expected) {
      mismatches.push(`${zone} (lat ${latitude.toFixed(3)}): expected ${expected}, got ${actual}`);
    }
  }

  assert.deepStrictEqual(mismatches, [], `\n  ${mismatches.join('\n  ')}\n`);
  // Guard against the check silently degrading into a no-op if the parse ever breaks.
  assert.ok(zones.size > 300, `expected a full tz database, saw ${zones.size} zones`);
});

test('explicit argument always beats the host timezone', () => {
  // Host is southern, argument is northern: the argument wins.
  const out = execFileSync(
    process.execPath,
    [
      '-e',
      `const {detectHemisphere}=require(${JSON.stringify(HEMISPHERE_MODULE)});` +
        `process.stdout.write(detectHemisphere('Europe/Berlin')+','+detectHemisphere('Africa/Nairobi'))`,
    ],
    { env: { ...process.env, TZ: 'Australia/Perth' }, encoding: 'utf8' },
  );
  assert.strictEqual(out, 'north,south');
});
