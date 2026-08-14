'use strict';

/**
 * Hemisphere detection from an IANA timezone name.
 *
 * HARD NON-GOAL: no network, ever. Hemisphere is inferred from a compact STATIC table
 * compiled from the reference coordinates the IANA tz database publishes for each zone
 * (zone1970.tab). Nothing here does I/O, and nothing here reads the clock.
 *
 * Table shape, in priority order:
 *   1. NORTHERN_ZONES  — exact zones that sit inside an otherwise-southern prefix.
 *   2. SOUTHERN_ZONES  — exact zones, for regions that straddle the equator.
 *   3. SOUTHERN_PREFIXES — whole regions that are unambiguously southern.
 *   4. DEFAULT_HEMISPHERE.
 *
 * Africa, South America, Asia (Indonesia) and the Pacific all straddle the equator, so
 * those are enumerated zone by zone rather than pattern-matched by continent. The zones
 * within ~1 degree of the equator are annotated with their reference latitude, because
 * those are the ones a reader will want to check rather than trust.
 */

/**
 * The explicit default. An unknown, malformed, empty or non-string zone resolves to
 * "north" — never a throw. Rationale: the northern hemisphere holds roughly 90% of the
 * world's population, so it is the least-wrong guess; and a caller who cares can always
 * pass --north/--south. Silence beats an exception in a shell prompt.
 */
const DEFAULT_HEMISPHERE = 'north';

/** Regions that are wholly south of the equator. */
const SOUTHERN_PREFIXES = [
  'antarctica/', // every Antarctica/* zone, incl. Macquarie, Troll, South_Pole
  'australia/', // mainland + Tasmania + Lord Howe + Eucla: no Australia/* zone is northern
  'america/argentina/', // all 12 Argentina zones
  'brazil/', // legacy aliases: East, West, Acre, DeNoronha - all southern
  'chile/', // legacy aliases: Continental, EasterIsland
  'indian/', // southern except Indian/Maldives, see NORTHERN_ZONES
];

/**
 * Northern zones that fall inside a SOUTHERN_PREFIXES entry. Checked first.
 */
const NORTHERN_ZONES = new Set([
  'indian/maldives', // Male +04d10'N - the country straddles, the reference point is north
]);

/**
 * Southern zones outside the blanket prefixes above.
 */
const SOUTHERN_ZONES = new Set([
  // --- Africa (the continent straddles; only these zones are southern) ---
  'africa/blantyre',
  'africa/brazzaville', //  -04d16'  Congo-Brazzaville
  'africa/bujumbura',
  'africa/dar_es_salaam',
  'africa/gaborone',
  'africa/harare',
  'africa/johannesburg',
  'africa/kigali',
  'africa/kinshasa', //      -04d18'  DR Congo straddles; Kinshasa is south
  'africa/lubumbashi',
  'africa/luanda',
  'africa/lusaka',
  'africa/maputo',
  'africa/maseru',
  'africa/mbabane',
  'africa/nairobi', //       -01d17'  EQUATOR-ADJACENT. Kenya straddles; Nairobi is south.
  'africa/windhoek',
  // NOTE, deliberately northern and easy to get wrong: Africa/Lagos (+06d27'),
  // Africa/Kampala (+00d19'), Africa/Libreville (+00d23'), Africa/Sao_Tome (+00d20'),
  // Africa/Mogadishu (+02d04'), Africa/Juba (+04d51'), Africa/Douala, Africa/Malabo,
  // Africa/Bangui, Africa/Accra, Africa/Abidjan. Uganda, Gabon and Sao Tome all
  // straddle the equator but their reference cities are all just NORTH of it.

  // --- Americas (South America straddles) ---
  'america/araguaina',
  'america/asuncion',
  'america/bahia',
  'america/belem', //        -01d27'
  'america/campo_grande',
  'america/coyhaique', //    Chile, Aysen region - a separate zone since tzdata 2025a
  'america/cuiaba',
  'america/eirunepe',
  'america/fortaleza',
  'america/guayaquil', //    -02d10'  EQUATOR-ADJACENT. Ecuador straddles (Quito -00d13').
  'america/la_paz',
  'america/lima',
  'america/maceio',
  'america/manaus',
  'america/montevideo',
  'america/noronha',
  'america/porto_velho',
  'america/punta_arenas',
  'america/recife',
  'america/rio_branco',
  'america/santarem',
  'america/santiago',
  'america/sao_paulo',
  // legacy / backward-compat Argentina + Brazil aliases (not under America/Argentina/)
  'america/buenos_aires',
  'america/catamarca',
  'america/cordoba',
  'america/jujuy',
  'america/mendoza',
  'america/rosario',
  'america/porto_acre',
  // NOTE, deliberately northern: America/Bogota (+04d36'), America/Caracas,
  // America/Boa_Vista (+02d49' - a BRAZILIAN zone that is north of the equator),
  // America/Guyana, America/Paramaribo, America/Cayenne, America/Panama.

  // --- Atlantic ---
  'atlantic/stanley',
  'atlantic/south_georgia',
  'atlantic/st_helena',

  // --- Asia (Indonesia and Timor-Leste straddle / sit south) ---
  'asia/dili',
  'asia/jakarta',
  'asia/jayapura',
  'asia/makassar',
  'asia/ujung_pandang', // legacy alias of Asia/Makassar
  'asia/pontianak', //       -00d02'  EQUATOR-ADJACENT: the city sits ON the equator,
  //                                  tz reference latitude is 2 arc-minutes south.
  // NOTE, deliberately northern: Asia/Singapore (+01d17'), Asia/Kuching (+01d33'),
  // Asia/Kuala_Lumpur, Asia/Brunei, Asia/Manila, Asia/Colombo.

  // --- Pacific (the most mixed region of all) ---
  'pacific/apia',
  'pacific/auckland',
  'pacific/bougainville',
  'pacific/chatham',
  'pacific/easter',
  'pacific/efate',
  'pacific/enderbury', // legacy alias of Pacific/Kanton
  'pacific/fakaofo',
  'pacific/fiji',
  'pacific/funafuti',
  'pacific/galapagos', //    -00d54'  EQUATOR-ADJACENT: the archipelago straddles, the
  //                                  tz reference point (San Cristobal) is south.
  'pacific/gambier',
  'pacific/guadalcanal',
  'pacific/kanton',
  'pacific/marquesas',
  'pacific/nauru', //        -00d31'  EQUATOR-ADJACENT: only ~57 km south.
  'pacific/niue',
  'pacific/norfolk',
  'pacific/noumea',
  'pacific/pago_pago',
  'pacific/pitcairn',
  'pacific/port_moresby',
  'pacific/rarotonga',
  'pacific/samoa', // legacy alias of Pacific/Pago_Pago
  'pacific/tahiti',
  'pacific/tongatapu',
  'pacific/wallis',
  // NOTE, deliberately northern: Pacific/Tarawa (+01d26' - Kiribati straddles),
  // Pacific/Kiritimati (+01d52'), Pacific/Honolulu, Pacific/Guam, Pacific/Majuro,
  // Pacific/Chuuk, Pacific/Pohnpei, Pacific/Kosrae, Pacific/Palau, Pacific/Wake.

  // --- legacy top-level aliases ---
  'nz', // Pacific/Auckland
  'nz-chat', // Pacific/Chatham
]);

/**
 * @param {string} [timeZone]  IANA name; defaults to
 *                             Intl.DateTimeFormat().resolvedOptions().timeZone
 * @returns {"north"|"south"}
 */
function detectHemisphere(timeZone) {
  let zone = timeZone;

  if (zone === undefined) {
    // Resolve the host zone lazily and defensively: on a stripped-down runtime
    // Intl may be absent or resolvedOptions() may return no timeZone at all.
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      zone = undefined;
    }
  }

  if (typeof zone !== 'string') return DEFAULT_HEMISPHERE;

  // IANA names are case-insensitive in practice (some hosts report "america/Lima");
  // the table is stored lowercased so the comparison is stable either way.
  const key = zone.trim().toLowerCase();
  if (key === '') return DEFAULT_HEMISPHERE;

  if (NORTHERN_ZONES.has(key)) return 'north';
  if (SOUTHERN_ZONES.has(key)) return 'south';
  for (const prefix of SOUTHERN_PREFIXES) {
    if (key.startsWith(prefix)) return 'south';
  }

  // Unknown / unparseable zone (including Etc/GMT*, UTC, GMT, and anything the table
  // has never heard of): fall back to the documented default rather than throwing.
  return DEFAULT_HEMISPHERE;
}

module.exports = { detectHemisphere };
