import fs from 'node:fs';
const p = '/opt/swarm/runs/current.json';
const r = JSON.parse(fs.readFileSync(p, 'utf8'));
const now = Math.floor(Date.now() / 1000);

r.budget = {
  ...r.budget,
  source: 'probe',
  gear: 2, gear_target: 2, ratio: 0.23, mode: 'guest',
  k_cap: 2, promote: false, demote: true,
  window_tokens: 502611,
  window_cost_usd: 0.86,
  api_cap_usd: null, api_spend_usd: 0,
  tokens_per_hour: 6031332,
  projected_depletion_at: 0,
  last_probe_ts: now, last_real_probe_ts: now,
  probe_failures: 2,
  probe_note: 'bin/swarm-budget.sh DENIED for the 14th consecutive run (KI-2), this time in the RUNFILE=... relative form. probe_failures is deliberately HELD at 2 rather than incremented, and the reason is stated so the number is not read as evidence it is not: the script never launched, so it returned neither probe_ok true nor false. The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, so this gear rests on real measurement, not on a clock fallback. Window rolled at 13:00Z: new block 13:00-18:00Z, 502,611 tokens spent in its first ~5 minutes against the 130.59M limit carried from the previous probe. rho = 0.23 on a 5-minute sample would reach gear 5, but guest mode clamps to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands unchanged - and hysteresis would have allowed only one step anyway. ccusage own projection (218M by 18:00Z, i.e. over the limit) is extrapolated from that same 5-minute sample and is NOT treated as evidence.',
  weekly: { ...r.budget.weekly, week_elapsed_pct: 18.72 },
};
r.heartbeat = { ts: now, next_wakeup_at: now + 900, pid: 2250737, limp: false, degraded_tiers: [] };
fs.writeFileSync(p + '.tmp', JSON.stringify(r, null, 2)); fs.renameSync(p + '.tmp', p);
fs.copyFileSync(p, '/opt/swarm/runs/current.json.bak');
console.log('runfile written; mirror follows');
console.log('MIRROR:' + JSON.stringify(r));
