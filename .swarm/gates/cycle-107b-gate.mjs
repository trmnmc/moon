#!/usr/bin/env node
// cycle-107 verification gate, part B — item T-211.
// Authored by the CONDUCTOR at verification time. The builder never saw it.
//
// The claim under test is "a SHIPPED repo test now fails closed when a doc states a
// suite count that is false at the cycle it names". Every cell below either MUTATES
// something and demands a specific reaction, or is a control on a cell that does.
// A cell that merely observes the new file exists would be the exact failure mode
// (a green existence check) this item was filed to remove.
//
// REPORT.md is mutated in place and restored; E0/E9 are the sha256 bookends that
// prove the restore was byte-exact, so a crash mid-gate is detectable rather than
// silent.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TARGET = '/opt/targets/moon';
const REPORT = `${TARGET}/REPORT.md`;
const BACKUP = `${TARGET}/.swarm/runs/cycle-107-REPORT.md.bak`;
const TESTFILE = 'test/doc-counts.test.js';

let pass = 0, fail = 0;
const rows = [];
function cell(id, desc, ok, detail = '') {
  if (ok) { pass++; rows.push(`PASS ${id} ${desc}${detail ? '   ' + detail : ''}`); }
  else { fail++; rows.push(`FAIL ${id} ${desc}${detail ? '   ' + detail : ''}`); }
  return ok;
}
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const git = (args, opts = {}) => execFileSync('git', ['-C', TARGET, ...args], { encoding: 'utf8', ...opts });

// Run ONLY the file under test, in the real repo. Returns {ok, tail}.
function runDocCounts(extraEnv = {}) {
  const r = spawnSync(process.execPath, ['--test', TESTFILE], {
    cwd: TARGET, encoding: 'utf8', timeout: 180000,
    env: { ...process.env, ...extraEnv },
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const tests = (out.match(/^# tests (\d+)/m) || out.match(/tests (\d+)/) || [])[1];
  const failed = (out.match(/^# fail (\d+)/m) || out.match(/fail (\d+)/) || [])[1];
  return { code: r.status, out, tests: Number(tests), failed: Number(failed) };
}

const ORIGINAL = readFileSync(REPORT, 'utf8');
const ORIG_SHA = sha(REPORT);
copyFileSync(REPORT, BACKUP);
cell('E0', 'REPORT.md backed up before any mutation', existsSync(BACKUP), `sha=${ORIG_SHA.slice(0, 12)}`);

const SUITE_LINE = ORIGINAL.split('\n').find((l) => l.startsWith('- Suite size, measured directly:'));
cell('E1', 'the corrected cycle-106 bullet is present to mutate', Boolean(SUITE_LINE));

// The exact text REPORT.md carried from cycle 105 until cycle 106 — the real defect.
const PRE_106 = '- Suite at cycle 104: 208 tests, 208 passing.';

function withReport(text, fn) {
  writeFileSync(REPORT, text);
  try { return fn(); } finally { writeFileSync(REPORT, ORIGINAL); }
}

// ---------------------------------------------------------------------------
// E2 — RED. The historical falsehood must now be caught by the SHIPPED suite.
// ---------------------------------------------------------------------------
const red = withReport(ORIGINAL.replace(SUITE_LINE, PRE_106), runDocCounts);
const redNamesTruth = /210/.test(red.out) && /208/.test(red.out) && /cycle 104/i.test(red.out);
cell('E2', 'RED: the exact pre-cycle-106 false line FAILS the shipped test',
  red.code !== 0 && red.failed >= 1, `exit=${red.code} fail=${red.failed}`);
cell('E3', 'the failure NAMES the measured truth, not just "mismatch"',
  redNamesTruth, `mentions 210 & 208 & cycle 104 = ${redNamesTruth}`);

// ---------------------------------------------------------------------------
// E4 — ATTRIBUTION. The same mutation against HEAD's version of the file must
// PASS. Without this, the kill in E2 could belong to any of the 473 added lines,
// or to something else entirely.
// ---------------------------------------------------------------------------
const headTest = git(['show', `HEAD:${TESTFILE}`]);
const workTest = readFileSync(`${TARGET}/${TESTFILE}`, 'utf8');
const scratch = mkdtempSync(join(tmpdir(), 'moon-gate-107b-'));
const attribution = withReport(ORIGINAL.replace(SUITE_LINE, PRE_106), () => {
  copyFileSync(`${TARGET}/${TESTFILE}`, join(scratch, 'work-copy.js'));
  writeFileSync(`${TARGET}/${TESTFILE}`, headTest);
  try { return runDocCounts(); } finally { writeFileSync(`${TARGET}/${TESTFILE}`, workTest); }
});
cell('E4', 'ATTRIBUTION: HEAD\'s doc-counts.test.js does NOT catch it (kill is the new code)',
  attribution.code === 0 && attribution.failed === 0,
  `exit=${attribution.code} fail=${attribution.failed} tests=${attribution.tests}`);

// ---------------------------------------------------------------------------
// E5 — DISCRIMINATOR. A one-digit mutation of a TRUE stated count must fail.
// E2 alone is satisfiable by a test that pattern-matches one known-bad string;
// this is not. The number has to actually be measured.
// ---------------------------------------------------------------------------
const digitMutant = SUITE_LINE.replace('210 tests / 210 passing at cycle 104', '211 tests / 211 passing at cycle 104');
const e5 = withReport(ORIGINAL.replace(SUITE_LINE, digitMutant), runDocCounts);
cell('E5', 'DISCRIMINATOR: a one-digit mutation of a TRUE count FAILS',
  e5.code !== 0 && e5.failed >= 1 && digitMutant !== SUITE_LINE,
  `exit=${e5.code} fail=${e5.failed}`);

// ---------------------------------------------------------------------------
// E6 — TRUE-NEGATIVE control, conductor-authored wording (not the builder's).
// A check that dies on every edit is a snapshot test, not an assertion.
// ---------------------------------------------------------------------------
const proseMutant = SUITE_LINE
  .replace('The drop is bookkeeping, not lost coverage', 'That decrease is clerical rather than lost coverage')
  .replace('Suite size, measured directly:', 'Suite size, taken by direct measurement:');
const e6 = withReport(ORIGINAL.replace(SUITE_LINE, proseMutant), runDocCounts);
cell('E6', 'TRUE-NEGATIVE: a prose-only reword STAYS GREEN',
  e6.code === 0 && e6.failed === 0 && proseMutant !== SUITE_LINE,
  `exit=${e6.code} fail=${e6.failed}`);

// ---------------------------------------------------------------------------
// E7 — recursion bound, exercised rather than read.
// ---------------------------------------------------------------------------
const depthNames = [...new Set(workTest.match(/MOON_[A-Z0-9_]+/g) || [])];
const child = runDocCounts(Object.fromEntries(depthNames.map((n) => [n, '1'])));
cell('E7', 'RECURSION: a depth-marked child completes green and does not re-spawn',
  child.code === 0 && child.failed === 0 && depthNames.length > 0,
  `env=${JSON.stringify(depthNames)} exit=${child.code} fail=${child.failed}`);
// The bound must actually bite: the marked child must be FASTER than the
// unmarked run, which is the observable of "it skipped the spawns".
const t0 = Date.now(); runDocCounts(Object.fromEntries(depthNames.map((n) => [n, '1']))); const tChild = Date.now() - t0;
const t1 = Date.now(); const base = runDocCounts(); const tBase = Date.now() - t1;
cell('E8', 'CONTROL — the depth guard measurably suppresses spawning',
  tChild * 2 < tBase && base.code === 0, `depth-marked ${tChild}ms vs unguarded ${tBase}ms`);

// ---------------------------------------------------------------------------
// E9 — cleanliness bookends.
// ---------------------------------------------------------------------------
cell('E9', 'REPORT.md restored byte-identically after every mutation',
  sha(REPORT) === ORIG_SHA, `${ORIG_SHA.slice(0, 12)} -> ${sha(REPORT).slice(0, 12)}`);
cell('E10', 'test file restored byte-identically after the attribution swap',
  createHash('sha256').update(readFileSync(`${TARGET}/${TESTFILE}`)).digest('hex') ===
  createHash('sha256').update(workTest).digest('hex'));
const wt = git(['worktree', 'list']).trim().split('\n');
cell('E11', 'no stray git worktree survives a full suite run', wt.length === 1, `worktrees=${wt.length}`);
const porcelain = git(['status', '--porcelain']).split('\n').filter((l) => l.length > 0);
const product = porcelain.map((l) => l.slice(3)).filter((p) => !p.startsWith('.swarm/'));
cell('E12', 'product scope is exactly the three intended files',
  product.sort().join(',') === '.github/workflows/ci.yml,REPORT.md,test/doc-counts.test.js',
  `product=${JSON.stringify(product)}`);
const stat = git(['diff', '--numstat', '--', TESTFILE]).trim();
cell('E13', 'the test-file diff is purely ADDITIVE (nothing existing weakened)',
  /^\d+\s+0\s+/.test(stat), `numstat="${stat}"`);

rmSync(scratch, { recursive: true, force: true });
console.log(rows.join('\n'));
console.log(`GATE cycle-107b (T-211)  PASS ${pass} / FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
