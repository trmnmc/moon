import fs from 'node:fs'

// backlog: T-133 -> done
const bp = '.swarm/backlog.json'
const b = JSON.parse(fs.readFileSync(bp, 'utf8'))
const it = b.items.find((i) => i.id === 'T-133')
it.status = 'done'
it.closed_cycle = 36
fs.writeFileSync(bp + '.tmp', JSON.stringify(b, null, 1))
fs.renameSync(bp + '.tmp', bp)

// state
const sp = '.swarm/state.json'
const s = JSON.parse(fs.readFileSync(sp, 'utf8'))
s.cycle = 36
s.phase = 'VALUE_LOOP'
s.counters.consecutive_no_value = 0
s.counters.consecutive_failures = 0
// Wave autotune: the k=1 wave was CLEAN (0 reverts, 0 failed verifies) -> streak 1 -> 2,
// which trips the promote rule: k_current 4 -> 5, streak reset. Recorded honestly even
// though gear 1's k_cap of 1 makes it inert this run.
s.counters.wave_streak = s.counters.wave_streak + 1
if (s.counters.wave_streak >= 2) { s.counters.k_current = Math.min(5, s.counters.k_current + 1); s.counters.wave_streak = 0 }
s.decisions.push({
  cycle: 36,
  what: 'VALUE_LOOP ratchet ACCEPTS T-133 (cycleFraction is angular, documented as temporal) after rejecting T-116/T-126/T-130 for eleven cycles',
  why: 'The three standing todos are cosmetic or citation-level and fail Q2 ("would they still care after 10 minutes?"). T-133 passes both questions because --json is advertised as a scripting CONTRACT and the two fields a script would naturally interconvert (age, cycleFraction) disagree by up to ~21 h with nothing in the docs saying so. The repo already carries the identical correction for the identical trap one field lower (the phaseAngle CAUTION), which is the strongest available evidence that this class of note earns its place here.',
})
s.decisions.push({
  cycle: 36,
  what: 'lifted bin/moon.js line 7 ("Conductor-owned file; builders do not edit it") for T-133, scoped to the HELP template literal only',
  why: 'Three options, all imperfect. (a) Conductor patches HELP -- violates the standing cycle-7 rule that the conductor does not edit the artifact, and bites hardest here because the conductor authored the item wording, so nothing independent would check it. (b) Fix README only -- leaves `moon --help` telling the reader the wrong thing, and cli.test.js gates only the field NAME sets, not the prose, so no test would ever catch the split. (c) Lift the comment in writing, narrowly. Chose (c) and gated it: G2b cuts the HELP literal out of both revisions and proves every byte outside it is identical to HEAD, and mutant M5 proves that check can fail.',
})
s.last_cycle = {
  cycle: 36,
  work: 'VALUE_LOOP candidate scan (hit on probe 2 -- the --json scripting contract, a surface swept for field NAMES but never for field MEANINGS) + T-133 build-wave k=1 at sonnet',
  outcome: '1 verified, 131/131 green, 0 reverted, 6/6 gate checks pass, 7/7 failability mutants killed, both documented numbers re-derived by an independent path (21.11 h / 20.71 h)',
  ts: new Date().toISOString(),
}
fs.writeFileSync(sp + '.tmp', JSON.stringify(s, null, 1))
fs.renameSync(sp + '.tmp', sp)
console.log('cycle', s.cycle, 'k_current', s.counters.k_current, 'wave_streak', s.counters.wave_streak,
  'no_value', s.counters.consecutive_no_value, 'T-133', it.status)
