import fs from 'node:fs';

const P = '/opt/swarm/runs/current.json';
const r = JSON.parse(fs.readFileSync(P, 'utf8'));
r.rotation_cursor = 0;
fs.writeFileSync(P + '.tmp', JSON.stringify(r, null, 2));
fs.renameSync(P + '.tmp', P);
fs.copyFileSync(P, '/opt/swarm/runs/current.json.bak');

const mirror = '\nrunfile-mirror:\n```json\n' + JSON.stringify(r) + '\n```\n';
fs.appendFileSync('/opt/targets/moon/.swarm/journal.md', mirror);
console.log('runfile + bak written; mirror appended');
console.log('heartbeat:', JSON.stringify(r.heartbeat));
console.log('budget gear', r.budget.gear, 'ratio', r.budget.ratio, 'probe_failures', r.budget.probe_failures);
