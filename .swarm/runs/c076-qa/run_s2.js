const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = '/opt/targets/moon';
const scratch = '/opt/targets/moon/.swarm/runs/c076-qa';

const t0 = Math.floor(Date.now() / 1000);
const env = Object.assign({}, process.env, { TZ: 'Asia/Kathmandu' });
const r = spawnSync('node', ['bin/moon.js', '--json'], { cwd: repo, encoding: 'utf8', env });
const t1 = Math.floor(Date.now() / 1000);
fs.writeFileSync(path.join(scratch, 'moon_s2.json'), r.stdout);
fs.writeFileSync(path.join(scratch, 'moon_s2.err'), r.stderr);
console.log('t0=' + t0 + ' t1=' + t1);
console.log('exit=' + r.status);
console.log('--- stdout ---');
console.log(r.stdout);
console.log('--- stderr ---');
console.log(r.stderr);

const j = JSON.parse(r.stdout);
const ts = Date.parse(j.timestamp);
const jdPred = ts / 86400000 + 2440587.5;
const nf = Date.parse(j.nextFullMoon);
const dtFull = (nf - ts) / 86400000;
const de = ((180 - j.phaseAngle) % 360 + 360) % 360;
const result = {
  tsSec: Math.round(ts / 1000),
  julianDay: j.julianDay,
  jdPred: +jdPred.toFixed(5),
  jdErr: +(j.julianDay - jdPred).toFixed(5),
  dtFullDays: +dtFull.toFixed(4),
  de: +de.toFixed(2),
  rateLo: +(de / 15.0 - 0.2).toFixed(3),
  rateHi: +(de / 10.5 + 0.2).toFixed(3)
};
console.log('--- computed ---');
console.log(JSON.stringify(result, null, 2));
console.log('tsInRange=' + (result.tsSec >= t0 - 65 && result.tsSec <= t1 + 65));
console.log('timestampParses=' + !isNaN(ts));
console.log('nextFullMoonParses=' + !isNaN(nf));
console.log('dtFullBoundsOK=' + (result.dtFullDays > -0.07 && result.dtFullDays <= 29.90));
console.log('dtFullRateOK=' + (result.dtFullDays >= result.rateLo && result.dtFullDays <= result.rateHi));
