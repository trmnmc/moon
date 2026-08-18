import fs from 'node:fs';
const now = Math.floor(Date.now() / 1000);

// 1. stamp the work commit into state.last_cycle
const S = '/opt/targets/moon/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(S, 'utf8'));
s.last_cycle.commit = 'eff794e';
fs.writeFileSync(S + '.tmp', JSON.stringify(s, null, 2));
fs.renameSync(S + '.tmp', S);

// 2. heartbeat re-touch: next_wakeup_at was written at the persist and the cycle ran
//    past it (dashboard render, addendum). Point it at the ACTUAL end of the cycle.
const P = '/opt/swarm/runs/current.json';
const r = JSON.parse(fs.readFileSync(P, 'utf8'));
const next = now + 90;
r.heartbeat.ts = now;
r.heartbeat.next_wakeup_at = next;
fs.writeFileSync(P + '.tmp', JSON.stringify(r, null, 2));
fs.renameSync(P + '.tmp', P);
fs.copyFileSync(P, '/opt/swarm/runs/current.json.bak');

// clamp check (hard rule 8)
const STOP = 1787142067;
console.log('commit stamped:', s.last_cycle.commit);
console.log('heartbeat ts', now, 'next_wakeup_at', next, '=', new Date(next * 1000).toISOString());
console.log('clamp next+900 <= stop_at:', next + 900 <= STOP, `(${next + 900} vs ${STOP}, ${Math.round((STOP - next) / 60)}m of run left)`);
console.log('bak matches:', fs.readFileSync(P, 'utf8') === fs.readFileSync('/opt/swarm/runs/current.json.bak', 'utf8'));
