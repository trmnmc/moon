import fs from 'node:fs';
const P = '/opt/swarm/runs/current.json';
const r = JSON.parse(fs.readFileSync(P, 'utf8'));
const now = Math.floor(Date.now() / 1000);

r.rotation_cursor = 0;
r.cycles_since_recycle = 7;

r.budget.source = 'probe';
r.budget.gear = 2;
r.budget.gear_target = 2;
r.budget.ratio = 0.35;
r.budget.mode = 'guest';
r.budget.k_cap = 2;
r.budget.promote = false;
r.budget.demote = true;
r.budget.window_tokens = 36912820;
r.budget.window_cost_usd = 30.15;
r.budget.tokens_per_hour = 14022000;
r.budget.projected_depletion_at = 0;
r.budget.last_probe_ts = 1787067433;
r.budget.last_real_probe_ts = 1787067433;
r.budget.probe_failures = 2;
r.budget.probe_note = 'bin/swarm-budget.sh DENIED for the 19th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array, nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, but returned NO tokenLimitStatus for the SECOND consecutive cycle, so the 130,591,250 limit is CARRIED FORWARD from cycles 89-90, not re-measured - recorded as carried twice running rather than quietly reused. Active block 13:00-18:00Z at 15:37Z: 36,912,820 tokens and $30.15, 157.97 min in, i.e. 233.7k tokens/min = 14.02M/hour - DOWN again from cycle 91 237.9k/min, the fourth consecutive cycle of cooling. Remaining 93.68M over 142.03 min = 659.6k/min target at the guest-forced dial of 1.0, so rho = 0.35, deeper into the gear-5 band than cycle 91 0.39. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands - the FIFTH consecutive cycle where measured rho would license a higher gear and the posture refuses it. ccusage projection 70.96M against the 130.59M carried limit, no depletion risk. The weekly block below is STILL carried forward, not re-measured. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false.';

r.heartbeat.ts = now;
r.heartbeat.pid = 2293768;
r.heartbeat.next_wakeup_at = now + 90;
r.heartbeat.limp = false;

fs.writeFileSync(P + '.tmp', JSON.stringify(r, null, 2));
fs.renameSync(P + '.tmp', P);
fs.copyFileSync(P, '/opt/swarm/runs/current.json.bak');

// append the runfile-mirror to the journal block just written
const J = '/opt/targets/moon/.swarm/journal.md';
fs.appendFileSync(J, '\nrunfile-mirror:\n```json\n' + JSON.stringify(r) + '\n```\n');

const back = JSON.parse(fs.readFileSync(P, 'utf8'));
console.log('runfile written. gear', back.budget.gear, 'rho', back.budget.ratio, 'hb', back.heartbeat.ts, 'next', back.heartbeat.next_wakeup_at);
console.log('bak matches:', fs.readFileSync(P, 'utf8') === fs.readFileSync('/opt/swarm/runs/current.json.bak', 'utf8'));
console.log('mirror appended, journal now', fs.statSync(J).size, 'bytes');
