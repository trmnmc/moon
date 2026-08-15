// cycle 31 conductor scratch: does the CLI survive a consumer that closes the pipe early,
// and are its exit codes what the docs claim? Read-only; spawns the shipped bin only.
import { spawnSync } from 'node:child_process';

const CWD = '/opt/targets/moon';

function pipeThroughHead(args) {
  // `node bin/moon.js <args> | head -c 1` — head exits after one byte and closes the read
  // end, so the CLI's write lands on a pipe with no reader.
  const r = spawnSync('/bin/sh', ['-c', `node bin/moon.js ${args} | head -c 1 >/dev/null; echo "head=$?"; exit \${PIPESTATUS[0]:-0}`], {
    cwd: CWD, encoding: 'utf8', shell: false,
  });
  return r;
}

// PIPESTATUS is bash-only; use bash explicitly and capture both statuses.
function probe(args) {
  const script = `node bin/moon.js ${args} 2>/tmp/moon-epipe-err.txt | head -c 1 >/dev/null; echo "moon=\${PIPESTATUS[0]} head=\${PIPESTATUS[1]}"; cat /tmp/moon-epipe-err.txt`;
  const r = spawnSync('/bin/bash', ['-c', script], { cwd: CWD, encoding: 'utf8' });
  return (r.stdout || '') + (r.stderr || '');
}

console.log('=== early-closed pipe (| head -c 1) ===');
for (const mode of ['', '--json', '--block', '--help', '--compact']) {
  const out = probe(mode).trim().split('\n').slice(0, 6).join('\n    ');
  console.log(`  moon ${mode || '(no flags)'}\n    ${out}`);
}

console.log('\n=== exit codes with stdout intact ===');
for (const [label, args] of [['default', []], ['--help', ['--help']], ['--json', ['--json']],
  ['--block', ['--block']], ['bad flag', ['--nope']], ['positional', ['extra']],
  ['flag w/ value', ['--json=1']], ['short -h', ['-h']]]) {
  const r = spawnSync(process.execPath, ['bin/moon.js', ...args], { cwd: CWD, encoding: 'utf8' });
  console.log(`  ${label.padEnd(14)} exit=${r.status}  stdout=${JSON.stringify((r.stdout || '').slice(0, 28))}  stderr=${JSON.stringify((r.stderr || '').slice(0, 60))}`);
}
void pipeThroughHead;
