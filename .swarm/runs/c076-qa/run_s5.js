const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = '/opt/targets/moon';
const scratch = '/opt/targets/moon/.swarm/runs/c076-qa';

function doRun(label, args) {
  const r = spawnSync('node', ['bin/moon.js', ...args], { cwd: repo, encoding: 'utf8' });
  fs.writeFileSync(path.join(scratch, `${label}.out`), r.stdout);
  fs.writeFileSync(path.join(scratch, `${label}.err`), r.stderr);
  console.log(`[${label}] args=${JSON.stringify(args)} exit=${r.status}`);
  console.log(`[${label}] stdout=${JSON.stringify(r.stdout)}`);
  console.log(`[${label}] stderr=${JSON.stringify(r.stderr)}`);
  return r;
}

// Step 1
const r1 = doRun('e1', ['extra-arg']);
const firstLine1 = r1.stderr.split('\n')[0];
const phaseNames = ['new moon','crescent','quarter','gibbous','full moon'];
const stdoutHasPhaseName1 = phaseNames.some(p => r1.stdout.toLowerCase().includes(p));
console.log('e1 firstStderrLine=' + JSON.stringify(firstLine1) + ' startsWithMoon=' + firstLine1.startsWith('moon: '));
console.log('e1 stdoutHasPhaseName=' + stdoutHasPhaseName1);

// Step 2
const r2 = doRun('e2', ['--definitely-not-a-flag']);
const firstLine2 = r2.stderr.split('\n')[0];
console.log('e2 firstStderrLine=' + JSON.stringify(firstLine2) + ' startsWithMoon=' + firstLine2.startsWith('moon: '));

// Step 3
const r3 = doRun('e3', ['--json', '--definitely-not-a-flag']);
const firstLine3 = r3.stderr.split('\n')[0];
console.log('e3 firstStderrLine=' + JSON.stringify(firstLine3) + ' startsWithMoon=' + firstLine3.startsWith('moon: '));
let e3IsJsonWithPhase = false;
try {
  const j3 = JSON.parse(r3.stdout);
  if ('phase' in j3) e3IsJsonWithPhase = true;
} catch (e) {}
console.log('e3 isJsonWithPhase=' + e3IsJsonWithPhase + ' stdoutEmpty=' + (r3.stdout.length === 0));

// Step 4: stack trace frame counts
function stackFrames(s) {
  return s.split('\n').filter(l => /^\s{4}at\s/.test(l)).length;
}
console.log('e1 stackFrames=' + stackFrames(r1.stderr));
console.log('e2 stackFrames=' + stackFrames(r2.stderr));
console.log('e3 stackFrames=' + stackFrames(r3.stderr));

// Step 5: --help
const r5 = doRun('h1', ['--help']);
const jsonOccurrences = (r5.stdout.match(/--json/g) || []).length;
const hasUsage = r5.stdout.toLowerCase().includes('usage');
console.log('help exit0=' + (r5.status === 0) + ' jsonOccurrences=' + jsonOccurrences + ' hasUsage=' + hasUsage + ' stderrBytes=' + Buffer.byteLength(r5.stderr,'utf8'));

// Step 6: -h
const r6 = doRun('h2', ['-h']);
const identical = r6.stdout === r5.stdout;
console.log('h2 exit0=' + (r6.status === 0) + ' identicalToHelp=' + identical);
if (!identical) {
  console.log('h1 length=' + r5.stdout.length + ' h2 length=' + r6.stdout.length);
}
