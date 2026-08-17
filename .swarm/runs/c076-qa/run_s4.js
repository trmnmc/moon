const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = '/opt/targets/moon';
const scratch = '/opt/targets/moon/.swarm/runs/c076-qa';

function lineCount(s) {
  if (s.length === 0) return 0;
  // count lines including a final line even without trailing newline
  const parts = s.split('\n');
  if (parts[parts.length - 1] === '') parts.pop(); // trailing newline produces empty last element
  return parts.length;
}

function doRun(label, args) {
  const r = spawnSync('node', ['bin/moon.js', ...args], { cwd: repo, encoding: 'utf8' });
  fs.writeFileSync(path.join(scratch, `moon_${label}.txt`), r.stdout);
  fs.writeFileSync(path.join(scratch, `moon_${label}.err`), r.stderr);
  const lc = lineCount(r.stdout);
  const errBytes = Buffer.byteLength(r.stderr, 'utf8');
  console.log(`[${label}] args=${JSON.stringify(args)} exit=${r.status} stdoutLines=${lc} stderrBytes=${errBytes}`);
  console.log(`[${label}] stdout=${JSON.stringify(r.stdout)}`);
  if (errBytes > 0) console.log(`[${label}] stderr=${JSON.stringify(r.stderr)}`);
  return { r, lc, errBytes };
}

const def = doRun('def', []);
const c = doRun('c', ['--compact']);
const b = doRun('b', ['--block']);
const bc = doRun('bc', ['--block', '--compact']);

console.log('--- checks ---');
console.log('def exit0=' + (def.r.status === 0) + ' stderr0=' + (def.errBytes === 0) + ' lines==2:' + (def.lc === 2) + ' actualLines=' + def.lc);
console.log('compact exit0=' + (c.r.status === 0) + ' stderr0=' + (c.errBytes === 0) + ' lines==1:' + (c.lc === 1) + ' actualLines=' + c.lc);
console.log('block exit0=' + (b.r.status === 0) + ' stderr0=' + (b.errBytes === 0) + ' lines>=3:' + (b.lc >= 3) + ' actualLines=' + b.lc);
console.log('blockCompact exit0=' + (bc.r.status === 0) + ' stderr0=' + (bc.errBytes === 0) + ' actualLines=' + bc.lc);
console.log('blockCompact == block-1: ' + (bc.lc === b.lc - 1) + ' (block=' + b.lc + ', blockCompact=' + bc.lc + ')');
console.log('blockCompact >= 2: ' + (bc.lc >= 2));
console.log('blockCompact stdout != compact stdout single line: ' + (bc.r.stdout.trim() !== c.r.stdout.trim()));
