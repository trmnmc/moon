const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = '/opt/targets/moon';
const scratch = '/opt/targets/moon/.swarm/runs/c076-qa';

const r = spawnSync('node', ['bin/moon.js', '--json'], { cwd: repo, encoding: 'utf8' });
fs.writeFileSync(path.join(scratch, 'moon_s1.json'), r.stdout);
fs.writeFileSync(path.join(scratch, 'moon_s1.err'), r.stderr);
console.log('exit=' + r.status);
console.log('--- stdout ---');
console.log(r.stdout);
console.log('--- stderr ---');
console.log(r.stderr);

const j = JSON.parse(r.stdout);
const e = j.phaseAngle;
const k = (1 - Math.cos(e * Math.PI / 180)) / 2;
const result = {
  phase: j.phase,
  phaseAngle: e,
  illumination: j.illumination,
  kPred: +k.toFixed(6),
  illErr: +(j.illumination - k).toFixed(6),
  cfErr: +(j.cycleFraction - e / 360).toFixed(6),
  age: j.age,
  rangesOK: (j.illumination >= 0 && j.illumination <= 1 && e >= 0 && e < 360 && j.cycleFraction >= 0 && j.cycleFraction < 1 && j.age >= 0 && j.age < 29.84),
  hasNineFields: ['phase','illumination','age','cycleFraction','phaseAngle','hemisphere','nextFullMoon','julianDay','timestamp'].every(k2 => k2 in j),
  hemisphere: j.hemisphere
};
console.log('--- computed ---');
console.log(JSON.stringify(result, null, 2));

// fractional digit inspection on raw text
const raw = r.stdout;
function fracDigits(fieldRegex) {
  const m = raw.match(fieldRegex);
  if (!m) return null;
  const numStr = m[1];
  const dot = numStr.indexOf('.');
  if (dot === -1) return 0;
  return numStr.length - dot - 1;
}
const digits = {
  illumination: fracDigits(/"illumination":([\d.eE+-]+)/),
  age: fracDigits(/"age":([\d.eE+-]+)/),
  cycleFraction: fracDigits(/"cycleFraction":([\d.eE+-]+)/),
  phaseAngle: fracDigits(/"phaseAngle":([\d.eE+-]+)/),
};
console.log('--- frac digits ---');
console.log(JSON.stringify(digits));

const canonicalPhases = ['new moon','waxing crescent','first quarter','waxing gibbous','full moon','waning gibbous','last quarter','waning crescent'];
console.log('phaseCanonical=' + canonicalPhases.includes(j.phase));
console.log('hemisphereValid=' + (j.hemisphere === 'north' || j.hemisphere === 'south'));

let angleConstraintOK = true;
let angleConstraintNote = 'n/a';
if (['waxing crescent','first quarter','waxing gibbous'].includes(j.phase)) {
  angleConstraintOK = e < 182;
  angleConstraintNote = 'phase=' + j.phase + ' expects phaseAngle<182, got ' + e;
} else if (['waning gibbous','last quarter','waning crescent'].includes(j.phase)) {
  angleConstraintOK = e > 178;
  angleConstraintNote = 'phase=' + j.phase + ' expects phaseAngle>178, got ' + e;
}
console.log('angleConstraintOK=' + angleConstraintOK + ' (' + angleConstraintNote + ')');
