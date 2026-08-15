// cycle 31 conductor scratch, part 2 (v2 — strips comments before parsing; v1's naive
// quote regex matched the apostrophes inside `-04d16'` latitude annotations).
// REVERSE direction: is every zone the hand-typed table names a real IANA zone, and does
// it resolve to a reference latitude matching its classification? Read-only.
import fs from 'node:fs';

const raw = fs.readFileSync('/opt/targets/moon/src/hemisphere.js', 'utf8');
// strip // line comments and /* */ block comments so annotation apostrophes cannot leak in
// line comments FIRST: `'antarctica/', // every Antarctica/* zone` contains a literal
// `/*` inside the comment text, which a block-comment strip would latch onto and eat
// the whole array. (Scratch-only fragility — the real test must probe behaviour, not text.)
const src = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

function listIn(re) {
  const m = re.exec(src);
  if (!m) throw new Error('no match for ' + re);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}
const prefixes = listIn(/const SOUTHERN_PREFIXES = \[([\s\S]*?)\];/);
const southern = listIn(/const SOUTHERN_ZONES = new Set\(\[([\s\S]*?)\]\);/);
const northern = listIn(/const NORTHERN_ZONES = new Set\(\[([\s\S]*?)\]\);/);
console.log(`table: ${prefixes.length} prefixes, ${southern.length} southern zones, ${northern.length} northern zones`);

function parseTab(path) {
  const out = new Map();
  if (!fs.existsSync(path)) return out;
  for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
    if (!line || line[0] === '#') continue;
    const f = line.split('\t');
    if (f.length < 3) continue;
    const m = /^([+-])(\d{2})(\d{2})(\d{2})?[+-]/.exec(f[1]);
    if (!m) continue;
    const lat = (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60 + Number(m[4] || 0) / 3600);
    for (const z of f[2].split(',')) out.set(z.trim().toLowerCase(), lat);
  }
  return out;
}
const tab = new Map([...parseTab('/usr/share/zoneinfo/zone.tab'), ...parseTab('/usr/share/zoneinfo/zone1970.tab')]);
const supported = Intl.supportedValuesOf('timeZone');
const canonLc = new Set(supported.map((s) => s.toLowerCase()));
function canon(z) {
  try { return new Intl.DateTimeFormat('en-US', { timeZone: z }).resolvedOptions().timeZone.toLowerCase(); }
  catch { return null; }
}

console.log('\n-- reverse check: every zone the table names --');
let bad = 0, viaAlias = 0, unresolved = 0;
for (const [label, list, want] of [['SOUTH', southern, 'south'], ['NORTH', northern, 'north']]) {
  for (const z of list) {
    let lat = tab.get(z), how = 'tab';
    if (lat === undefined) { const c = canon(z); if (c) { lat = tab.get(c); how = 'alias->' + c; } }
    if (lat === undefined) { unresolved++; console.log(`  UNRESOLVED ${label} ${z.padEnd(24)} realZone=${canonLc.has(z) || canon(z) ? 'yes' : 'NO'} canon=${canon(z)}`); continue; }
    if (how !== 'tab') viaAlias++;
    const oracle = lat < 0 ? 'south' : 'north';
    if (oracle !== want) { bad++; console.log(`  MISMATCH ${label} ${z.padEnd(24)} lat=${lat.toFixed(3)} oracle=${oracle} via ${how}`); }
  }
}
console.log(`reverse: mismatches=${bad} resolved-via-alias=${viaAlias} unresolved=${unresolved}`);

console.log('\n-- prefixes: does any REAL zone under a southern prefix sit north? --');
let leak = 0;
for (const z of supported) {
  const k = z.toLowerCase();
  const lat = tab.get(k) ?? tab.get(canon(k) ?? '');
  if (lat === undefined) continue;
  for (const p of prefixes) if (k.startsWith(p) && lat >= 0) { leak++; console.log(`  north-under-${p} ${z} ${lat.toFixed(3)} -> carved out? ${northern.includes(k)}`); }
}
console.log(`prefix leaks: ${leak}`);

console.log('\n-- dead entries: table zones that are not resolvable IANA ids at all --');
for (const z of [...southern, ...northern]) if (!canon(z)) console.log('  DEAD ' + z);
console.log('done');
