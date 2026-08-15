// Conductor probe, cycle 38 — pricing a candidate follow-up item before filing it.
// M1b showed the new suite misses a phase-name retype that preserves PHASE_NAMES cycle
// order (51% "first quarter" -> "waxing gibbous"). Question: is (name, displayed pct)
// reachability a real discriminator, i.e. does the product ever actually emit
// "51%  waxing gibbous"? Sweep real instants across several lunations with the SHIPPING
// computeMoon and collect the reachable set. No new constant is introduced by this idea:
// it only asks the product what it can produce.
const { computeMoon } = require('/opt/targets/moon/src/astro.js');

const reachable = new Map(); // name -> Set(pct)
const start = Date.UTC(2026, 0, 1);
const STEP = 60 * 1000; // one minute
const SPAN = 120 * 86400000; // ~4 lunations
for (let t = start; t < start + SPAN; t += STEP) {
  const m = computeMoon(new Date(t));
  const pct = Math.round(m.illumination * 100);
  if (!reachable.has(m.phaseName)) reachable.set(m.phaseName, new Set());
  reachable.get(m.phaseName).add(pct);
}

for (const [name, set] of reachable) {
  const arr = [...set].sort((a, b) => a - b);
  console.log(name.padEnd(16) + ' pct range ' + arr[0] + '..' + arr[arr.length - 1] + '  (' + arr.length + ' distinct)');
}

console.log('\nDISCRIMINATOR CHECK — is each README sweep row (name, pct) reachable?');
const rows = [[3, 'waxing crescent'], [14, 'waxing crescent'], [32, 'waxing crescent'],
  [51, 'first quarter'], [69, 'waxing gibbous'], [85, 'waxing gibbous'], [96, 'waxing gibbous'],
  [100, 'full'], [96, 'waning gibbous'], [83, 'waning gibbous'], [63, 'waning gibbous'],
  [40, 'waning crescent'], [19, 'waning crescent'], [5, 'waning crescent'], [0, 'new']];
for (const [pct, name] of rows) {
  const ok = reachable.has(name) && reachable.get(name).has(pct);
  console.log('  ' + String(pct).padStart(3) + '%  ' + name.padEnd(16) + (ok ? 'REACHABLE' : 'NOT REACHABLE  <-- would false-positive'));
}

console.log('\nM1b MUTANT — would the reachability check kill it?');
for (const [pct, name] of [[51, 'waxing gibbous'], [51, 'first quarter'], [32, 'waxing gibbous'], [63, 'waning crescent']]) {
  const ok = reachable.has(name) && reachable.get(name).has(pct);
  console.log('  ' + String(pct).padStart(3) + '%  ' + name.padEnd(16) + (ok ? 'reachable (NOT killed)' : 'UNREACHABLE (killed)'));
}
