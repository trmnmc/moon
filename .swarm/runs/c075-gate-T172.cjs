'use strict';
/* Conductor verification gate, cycle 75, item T-172.
 * The claim is a DOC-COMMENT claim, so the gate has exactly two jobs:
 *   H1  prove no executable byte changed (comment-only, as claimed)
 *   H2  prove the new sentence is TRUE of the shipped binary — both halves:
 *       newline-bearing token -> multi-line; newline-free malformed input -> one line
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..', '..');

let failures = 0;
const check = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail === undefined ? '' : ' :: ' + detail}`);
};

// ------------------------------------------------- H1: executable code untouched
console.log('=== H1 — is the change really comment-only? (strip comments, compare code) ===');
const headSrc = execFileSync('git', ['-C', REPO, 'show', 'HEAD:src/args.js'], { encoding: 'utf8' });
const wtSrc = fs.readFileSync(path.join(REPO, 'src', 'args.js'), 'utf8');

/** Remove /* *\/ and // comments without touching string/regex-literal contents. */
function stripComments(src) {
  let out = '';
  let i = 0;
  let mode = 'code';
  let quote = '';
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && d === '*') { mode = 'block'; i += 2; continue; }
      if (c === '/' && d === '/') { mode = 'line'; i += 2; continue; }
      if (c === '"' || c === "'" || c === '`') { mode = 'str'; quote = c; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (mode === 'block') { if (c === '*' && d === '/') { mode = 'code'; i += 2; } else i++; continue; }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += '\n'; } i++; continue; }
    if (mode === 'str') {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if (c === quote) mode = 'code';
      i++; continue;
    }
  }
  return out.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n');
}
const a = stripComments(headSrc);
const b = stripComments(wtSrc);
check(a === b, 'executable source is byte-identical to HEAD once comments are stripped',
  a === b ? `${a.length} bytes both sides` : 'CODE CHANGED');
check(headSrc.split('\n').length === wtSrc.split('\n').length,
  'line count unchanged (CONTRACTS.md line citations cannot drift)',
  `HEAD ${headSrc.split('\n').length} -> WT ${wtSrc.split('\n').length}`);

// ------------------------------------------------------ H2: is the sentence true?
console.log('');
console.log('=== H2 — is the new sentence TRUE of the shipped binary? ===');
function runCli(argv) {
  const r = spawnSync(process.execPath, ['bin/moon.js', ...argv], { cwd: REPO, encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

// half one: a newline-bearing token spans multiple lines
const nl = runCli(['a\nb']);
console.log(`  argv ['a\\nb'] -> exit ${nl.code}`);
console.log(`    stderr (JSON): ${JSON.stringify(nl.stderr)}`);
console.log(`    stderr physical lines: ${nl.stderr.replace(/\n$/, '').split('\n').length}`);
check(nl.code === 2, 'newline-bearing token still exits 2 (behaviour unchanged)');
check(nl.stderr.replace(/\n$/, '').split('\n').length === 2,
  'newline-bearing token really does produce a MULTI-line message — the new sentence is true');

// half two: ordinary malformed input is still one line
console.log('');
let allSingle = true;
for (const argv of [['--nope'], ['-x'], ['stray'], ['--json=1'], ['--south', 'extra']]) {
  const r = runCli(argv);
  const lines = r.stderr.replace(/\n$/, '').split('\n').length;
  console.log(`  argv ${JSON.stringify(argv)} -> exit ${r.code}, ${lines} stderr line(s)`);
  if (r.code !== 2 || lines !== 1) allSingle = false;
}
check(allSingle, 'every newline-FREE malformed input is still exit 2 + a single line — ' +
  'the "single-line message" half of the sentence still holds');

// the comment must not contradict the test that pins the behaviour
console.log('');
const comment = wtSrc.split('\n').slice(90, 98).join('\n');
console.log('  the comment as it now stands:');
for (const l of comment.split('\n')) console.log(`    ${l}`);
check(/newline/i.test(comment), 'the comment now names the newline case that args.test.js pins');
check(!/single-line message on any malformed/.test(wtSrc),
  'the false universal ("on any malformed input") is gone');

console.log('');
console.log(failures === 0 ? 'GATE T-172: PASS (0 failures)' : `GATE T-172: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
