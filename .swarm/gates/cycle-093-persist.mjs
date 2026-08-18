#!/usr/bin/env node
// cycle 93 persist: state.json + backlog.json (atomic tmp+rename), journal append, runfile + bak.
import fs from 'node:fs'

const SW = '/opt/targets/moon/.swarm'
const RUNFILE = '/opt/swarm/runs/current.json'
const now = Math.floor(Date.now() / 1000)
const iso = new Date(now * 1000).toISOString().replace('.000Z', '+00:00').replace(/\.\d{3}Z$/, '+00:00')
const atomic = (p, obj) => { fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2)); fs.renameSync(p + '.tmp', p) }

// ---------------------------------------------------------------- backlog
const bl = JSON.parse(fs.readFileSync(`${SW}/backlog.json`, 'utf8'))
const t190 = bl.items.find((i) => i.id === 'T-190')
const t189 = bl.items.find((i) => i.id === 'T-189')
t190.status = 'done'
t190.model = 'sonnet'
t190.completed_cycle = 93
t190.resolution = 'Docs moved, value did not. bin/moon.js gains JSON_FIELD_PRECISION (single source of truth: every --json key -> rounded/places | instant | string); the five round() call sites read places from it; buildPrecisionNote() generates the help paragraph from the table and README.md embeds the generated text verbatim. Pin in test/cli.test.js (+4 tests, 171 -> 175): payload key set == table key set both directions, each rounded value survives its claimed places, instants still full-ISO, and HELP + README both contain the generated note.'
t189.status = 'dropped'
t189.model = 'haiku'
t189.dropped_cycle = 93
t189.dropped_reason = 'STALE PREMISE, not deprioritized. The item and SPEC nice-to-have #1 both say KI-5 is documented "in prose only", citing cycle 62 whose observable was disproved at the gate. Both missed cycle 63 (T-151 retry, commit def98fd), which SHIPPED a reader-runnable self-check now at README.md:231-237 and proved it discriminates over 368 frames. Re-verified independently this cycle over 976 frames spanning 2026-08-01..09-30 (a different window from cycle 63, chosen to include the round-limb U+25D6/U+25D7 regime): the check returns "unaffected" under ambiguous=1 and "affected" under ambiguous=2 on every frame, 0 wrong in both branches. Nothing to build. See .swarm/runs/cycle-093-verify-t189.txt.'
atomic(`${SW}/backlog.json`, bl)
const counts = bl.items.reduce((a, i) => { a[i.status] = (a[i.status] || 0) + 1; return a }, {})

// ---------------------------------------------------------------- state
const st = JSON.parse(fs.readFileSync(`${SW}/state.json`, 'utf8'))
st.cycle = 93
st.phase = 'VALUE_LOOP'
st.counters.consecutive_no_value = 0
st.counters.consecutive_failures = 0
// wave autotune: the wave was CLEAN (0 reverts, 0 failed verifies) -> streak 1 -> 2 -> k_current
// would rise, but it is already at the hard max 5, so it holds and the streak resets.
st.counters.wave_streak = 0
st.counters.k_current = 5
// burn attribution + REPAIR of cycle 92's unwritten credit (see journal).
st.counters.window_tokens_attributed = 20206353 + 2921388 + 7529912
st.qa.last_build_wave_cycle = 93
st.decisions.push({
  cycle: 93,
  what: "T-190 judgment call, made by the conductor BEFORE dispatch: the DOCS move, the emitted nextFullMoon value does NOT.",
  why: "The acceptance offered two mutually exclusive fixes. Rounding the instant would not remove the misleading impression -- 2026-08-28T04:00:00.000Z still reads as exact -- while destroying information a --json consumer may legitimately diff. The defect is a false CLAIM, not a false value: precision and accuracy are different properties and the old help sentence conflated them. The gate was written to FAIL a build that rounded the value, so 'close it the other way' was not silently available."
})
st.decisions.push({
  cycle: 93,
  what: "T-189 dropped as already-satisfied; SPEC nice-to-have #1 is closed and has been since cycle 63.",
  why: "Both the item and the SPEC bullet were written from cycle 62's disproof and neither noticed cycle 63's successful retry (commit def98fd, README.md:231-237). Conductor re-verified the shipped check over 976 frames across a window cycle 63 did not use: it discriminates on every one. Building a second check would have been rework dressed as progress. 'Nothing needed doing' is an outcome this run's SPEC explicitly allows."
})
st.decisions.push({
  cycle: 93,
  what: "Gate pass 1 (sealed sha256 87d0ee17..b25d3) FAILED on its own instrument and the failure is kept on disk rather than edited away.",
  why: "Check 3 looked for '<field> N dp|decimal'; the shipped note phrases it 'decimal places: illumination to 4, age to 3, ...'. The claim was present, my pattern could not see it. Pass 2 reads the claim as written and is STRICTLY STRONGER -- it additionally requires the prose figure to equal the code table figure, and adds a generation proof. The product was not touched to reach green. Same failure shape as cycle 63's v1 gate; second time this instrument class has misjudged prose."
})
st.last_cycle = {
  cycle: 93,
  ts: iso,
  work: 'build-wave k=1 (direct Agent dispatch, sonnet) — T-190; plus conductor-run re-verification that closed T-189 as stale',
  outcome: 'VERIFIED. T-190 done: --json precision policy now generated from a single table in bin/moon.js, help + README carry it verbatim, pinned by 4 new tests. Gate: 8/9 pass 1 (one instrument defect, corrected in pass 2: 7/7), mutation A + B both turned the suite RED, control C left it GREEN. Suite 171 -> 175, all green. T-189 dropped: the check it asked for already shipped at cycle 63 and was re-proved over 976 frames.',
  commit: ''
}
atomic(`${SW}/state.json`, st)

// ---------------------------------------------------------------- runfile
const rf = JSON.parse(fs.readFileSync(RUNFILE, 'utf8'))
rf.heartbeat = { ts: now, next_wakeup_at: now + 90, pid: 2297374, limp: false, degraded_tiers: [] }
rf.cycles_since_recycle = 8
Object.assign(rf.budget, {
  source: 'probe', gear: 2, gear_target: 2, ratio: 0.32, mode: 'guest', k_cap: 2,
  promote: false, demote: true,
  window_tokens: 44442732, window_cost_usd: 38.94,
  tokens_per_hour: 14369000, projected_depletion_at: 0,
  last_probe_ts: now, last_real_probe_ts: now, probe_failures: 2,
  probe_note: 'bin/swarm-budget.sh DENIED for the 20th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array, nothing to triage). PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) run BY HAND and SUCCEEDED, but returned NO tokenLimitStatus for the THIRD consecutive cycle, so the 130,591,250 limit is CARRIED FORWARD from cycles 89-90 - carried three times running now, still not re-measured. Active block 13:00-18:00Z at 16:05Z: 44,442,732 tokens and $38.94, 185.58 min in, i.e. 239.5k tokens/min = 14.37M/hour - UP from cycle 92 233.7k/min, which BREAKS the four-cycle cooling streak; the 15:37->16:05 interval alone ran at 263.3k/min. Remaining 86.15M over 114.42 min = 753.0k/min target at the guest-forced dial of 1.0, so rho = 0.32, deeper into the gear-5 band than cycle 92 0.35 - the window is burning faster in absolute terms while rho falls, because the reset at 18:00Z is closing and the per-minute allowance rises faster than the burn. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands - the SIXTH consecutive cycle where measured rho would license a higher gear and the posture refuses it. ccusage projection 72.36M against the 130.59M carried limit, no depletion risk. The weekly block below is STILL carried forward, not re-measured. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false.'
})
fs.writeFileSync(RUNFILE + '.tmp', JSON.stringify(rf, null, 2))
fs.renameSync(RUNFILE + '.tmp', RUNFILE)
fs.writeFileSync('/opt/swarm/runs/current.json.bak', JSON.stringify(rf, null, 2))

console.log(JSON.stringify({ now, iso, counts, attributed: st.counters.window_tokens_attributed }))
