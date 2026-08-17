const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = '/opt/targets/moon';
const scratch = '/opt/targets/moon/.swarm/runs/c076-qa';

function run(tz, args) {
  const env = Object.assign({}, process.env);
  if (tz) env.TZ = tz; else delete env.TZ;
  return spawnSync('node', ['bin/moon.js', ...args], { cwd: repo, encoding: 'utf8', env });
}

function doRun(label, tz, args) {
  const r = run(tz, args);
  console.log(`[${label}] TZ=${tz} args=${JSON.stringify(args)} exit=${r.status}`);
  return r;
}

let a = doRun('syd', 'Australia/Sydney', ['--json']);
let b = doRun('lon', 'Europe/London', ['--json']);
let c = doRun('sydN', 'Australia/Sydney', ['--json', '--north']);

fs.writeFileSync(path.join(scratch, 'moon_syd.json'), a.stdout);
fs.writeFileSync(path.join(scratch, 'moon_lon.json'), b.stdout);
fs.writeFileSync(path.join(scratch, 'moon_sydN.json'), c.stdout);

console.log('--- raw a ---'); console.log(a.stdout, a.stderr);
console.log('--- raw b ---'); console.log(b.stdout, b.stderr);
console.log('--- raw c ---'); console.log(c.stdout, c.stderr);

function analyze(a, b, c) {
  const aj = JSON.parse(a.stdout), bj = JSON.parse(b.stdout), cj = JSON.parse(c.stdout);
  const jds = [aj.julianDay, bj.julianDay, cj.julianDay];
  const ills = [aj.illumination, bj.illumination, cj.illumination];
  return {
    hemis: [aj.hemisphere, bj.hemisphere, cj.hemisphere],
    phases: [aj.phase, bj.phase, cj.phase],
    jdSpread: +(Math.max(...jds) - Math.min(...jds)).toFixed(5),
    illSpread: +(Math.max(...ills) - Math.min(...ills)).toFixed(4),
    nextFull: [aj.nextFullMoon, bj.nextFullMoon, cj.nextFullMoon]
  };
}

let res = analyze(a, b, c);
console.log('--- analysis (attempt 1) ---');
console.log(JSON.stringify(res, null, 2));

const hemisOK = JSON.stringify(res.hemis) === JSON.stringify(['south','north','north']);
const phasesIdentical = res.phases[0] === res.phases[1] && res.phases[1] === res.phases[2];
const jdSpreadOK = res.jdSpread <= 0.02;
const illSpreadOK = res.illSpread <= 0.011;
let nextFullIdentical = res.nextFull[0] === res.nextFull[1] && res.nextFull[1] === res.nextFull[2];

console.log('hemisOK=' + hemisOK);
console.log('phasesIdentical=' + phasesIdentical);
console.log('jdSpreadOK=' + jdSpreadOK);
console.log('illSpreadOK=' + illSpreadOK);
console.log('nextFullIdentical (attempt1)=' + nextFullIdentical);

if (!nextFullIdentical) {
  console.log('--- RE-RUN steps 1-4 due to nextFullMoon mismatch ---');
  let a2 = doRun('syd2', 'Australia/Sydney', ['--json']);
  let b2 = doRun('lon2', 'Europe/London', ['--json']);
  let c2 = doRun('sydN2', 'Australia/Sydney', ['--json', '--north']);
  console.log('--- raw a2 ---'); console.log(a2.stdout, a2.stderr);
  console.log('--- raw b2 ---'); console.log(b2.stdout, b2.stderr);
  console.log('--- raw c2 ---'); console.log(c2.stdout, c2.stderr);
  let res2 = analyze(a2, b2, c2);
  console.log('--- analysis (attempt 2 / re-run) ---');
  console.log(JSON.stringify(res2, null, 2));
  let nextFullIdentical2 = res2.nextFull[0] === res2.nextFull[1] && res2.nextFull[1] === res2.nextFull[2];
  console.log('nextFullIdentical (attempt2)=' + nextFullIdentical2);
}

// Step 5: --south --north conflict
console.log('--- step 5: --south --north ---');
const r5 = spawnSync('node', ['bin/moon.js', '--south', '--north', '--json'], { cwd: repo, encoding: 'utf8' });
fs.writeFileSync(path.join(scratch, 'moon_conf.out'), r5.stdout);
fs.writeFileSync(path.join(scratch, 'moon_conf.err'), r5.stderr);
console.log('exit=' + r5.status);
console.log('stdout=' + JSON.stringify(r5.stdout));
console.log('stderr=' + JSON.stringify(r5.stderr));
const stderrLines = r5.stderr.split('\n');
console.log('firstStderrLine=' + JSON.stringify(stderrLines[0]));
const stackFrameCount = r5.stderr.split('\n').filter(l => /^\s{4}at\s/.test(l)).length;
console.log('nodeStackFrameCountStderr=' + stackFrameCount);
let stdoutIsValidJsonWithHemisphere = false;
let hemisphereVal = null;
try {
  const j5 = JSON.parse(r5.stdout);
  if (j5.hemisphere === 'north' || j5.hemisphere === 'south') { stdoutIsValidJsonWithHemisphere = true; hemisphereVal = j5.hemisphere; }
} catch (e) {}
console.log('stdoutIsValidJsonWithHemisphere=' + stdoutIsValidJsonWithHemisphere + ' hemisphere=' + hemisphereVal);
console.log('exitIs0or2=' + (r5.status === 0 || r5.status === 2));
if (r5.status === 2) {
  console.log('startsWithMoonPrefix=' + stderrLines[0].startsWith('moon: '));
}
console.log('bothErrorAndPayload=' + (r5.stderr.length > 0 && r5.stdout.length > 0 && stdoutIsValidJsonWithHemisphere));
