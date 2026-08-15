import fs from 'node:fs'
const p = '/opt/swarm/runs/current.json'
const r = JSON.parse(fs.readFileSync(p, 'utf8'))
const now = Math.floor(Date.now() / 1000)
const wake = now + 90 // base band; this cycle produced verified value
const stop = Math.floor(new Date(r.stop_at).getTime() / 1000)
if (wake + 900 > stop) throw new Error('wakeup would land inside the wrap-up guard band')
r.heartbeat = { ts: now, next_wakeup_at: wake, pid: 233339, limp: false, degraded_tiers: [] }
r.budget.last_probe_ts = now
r.budget.probe_note = 'cycle 36: probe still NOT invoked, same standing decision as cycle 35 and for the same closed reason - SWARM/.claude/settings.json carries no allow entry of any form for bin/swarm-budget.sh (KI-2, root-caused at cycle 35 by grepping the allow list). probe_failures stays at 34: an attempt not made is not a failure, and a 36th refusal would add no information now that the cause is known. Fix is one allow-list line, reserved for the morning report under hard rule 5. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct=0, allow_overall_pct=0, opus_used_pct=96, weekly_used_pct 75.0, week_elapsed_pct 70.85, dial 0.3. weekly_heat 1.059 < 1.1 -> governor disengaged, ceiling 5; opus_heat 1.355 > 1.2 keeps promote blocked. Binding for thirty-six straight cycles: allocator trickle + guest-mode 1-3 clamp -> gear 1, k_cap 1. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run.'
fs.writeFileSync(p + '.tmp', JSON.stringify(r, null, 2))
fs.renameSync(p + '.tmp', p)
fs.copyFileSync(p, '/opt/swarm/runs/current.json.bak')
fs.appendFileSync('/opt/targets/moon/.swarm/journal.md',
  'runfile-mirror:\n```json\n' + JSON.stringify(r) + '\n```\n')
console.log('now', now, 'next_wakeup_at', wake, '(' + new Date(wake * 1000).toISOString() + ')',
  'margin to stop', stop - wake, 's')
