// Conductor gate, part 2 (cycle 64). The suite reruns above settle the sweep's
// VERDICTS. These two checks settle its REASONING, which is where a plausible-
// sounding report can still be wrong.
//
// Claim A (M25, the report's most severe finding): with the mutation
// `f = places * 10`, the illumination field's own guard `decimals(illumination) <= 4`
// is PERMANENTLY blind — because f = 4*10 = 40 and every multiple of 1/40 terminates
// within 3 decimal places. If true, no choice of `now` can ever make that check fire.
// Claim B (same entry): phaseAngle's f = 3*10 = 30 does NOT have that property, which
// is why the mutant's KILLED/SURVIVED status flips run to run.

const decimals = (n) => (String(n).split('.')[1] || '').length

function sweepGrid (f, label, guard) {
  let worst = -1, worstK = null, blind = true
  for (let k = 0; k <= f * 4; k++) {   // 4x the grid: covers illumination 0..1 and beyond
    const v = k / f
    const d = decimals(v)
    if (d > worst) { worst = d; worstK = k }
    if (d > guard) blind = false
  }
  console.log(`  f=${f} (${label}): max visible decimals over ${f * 4 + 1} grid points = ${worst}` +
              ` (at k=${worstK}, value ${worstK / f}); guard is <= ${guard} -> ` +
              (blind ? 'GUARD CAN NEVER FIRE (permanently blind)' : 'guard CAN fire'))
  return blind
}

console.log('CLAIM A — illumination guard vs the places*10 mutation')
console.log('  unmutated: f = 10 ** 4 = 10000')
const aUnmutated = sweepGrid(10000, '10 ** 4, correct', 4)
console.log('  mutated:   f = 4 * 10 = 40')
const aMutated = sweepGrid(40, '4 * 10, MUTANT', 4)
console.log(`  => report claims the mutant is invisible to this guard: ${aMutated === true}`)
console.log()

console.log('CLAIM B — phaseAngle guard vs the same mutation (report says it is NOT blind)')
console.log('  unmutated: f = 10 ** 3 = 1000')
sweepGrid(1000, '10 ** 3, correct', 3)
console.log('  mutated:   f = 3 * 10 = 30')
const bMutated = sweepGrid(30, '3 * 10, MUTANT', 3)
console.log(`  => report claims this guard CAN fire (hence the run-to-run flip): ${bMutated === false}`)
console.log()

// Independent confirmation of WHY: 40 = 2^3 * 5 (only primes 2 and 5 -> terminates);
// 30 = 2 * 3 * 5 (the factor 3 -> 1/30 does not terminate in decimal).
const factor = (n) => { const o = []; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { o.push(p); m /= p } if (m > 1) o.push(m); return o }
console.log('  prime factors 40 =', factor(40).join('*'), '(2 and 5 only -> 1/40 terminates)')
console.log('  prime factors 30 =', factor(30).join('*'), '(has a 3 -> 1/30 does not terminate)')
console.log()

const pass = aMutated === true && bMutated === false && aUnmutated === true
console.log('CLAIM A+B VERDICT:', pass ? 'REASONING CONFIRMED' : 'REASONING REFUTED')
process.exitCode = pass ? 0 : 1
