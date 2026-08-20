#!/usr/bin/env node
// cycle-106 verification gate — authored by the conductor AT VERIFICATION TIME.
// The builder for T-209 never saw this file.
//
// The claim under test is a TRUTH claim, not an existence claim. Cycle 104's gate
// (cell D5) and cycle 105's shipped guard (doc-counts.test.js) both proved a count
// claim was ANCHORED; neither could prove the number was TRUE at that anchor. That
// is exactly the defect T-209 shipped. So this gate measures the suite at each
// anchor the document names and compares.
//
// Every truth cell carries controls: it must fail on the pre-change text, fail on a
// numeric mutation, and STAY GREEN on a prose-only mutation (a cell that dies on
// everything is a snapshot test, not an assertion).

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TARGET = '/opt/targets/moon';
const REPORT = join(TARGET, 'REPORT.md');
const BYTE_CAP = 25586;

const rows = [];
function cell(id, desc, fn) {
  let ok = false, note = '';
  try {
    const r = fn();
    ok = r === true || (r && r.ok === true);
    note = (r && r.note) || '';
  } catch (e) {
    ok = false;
    note = 'threw: ' + String(e.message).split('\n')[0].slice(0, 200);
  }
  rows.push({ id, desc, ok, note });
}

const git = (args, cwd = TARGET) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ---------------------------------------------------------------- measurements

// Run the suite in an arbitrary checkout and return {tests, pass, fail}.
function measureSuite(dir) {
  let out;
  try {
    out = execSync('node --test test/*.test.js 2>&1', {
      cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000,
    });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const num = (k) => {
    const m = out.match(new RegExp('^.\\s*' + k + '\\s+(\\d+)\\s*$', 'm'));
    return m ? Number(m[1]) : null;
  };
  return { tests: num('tests'), pass: num('pass'), fail: num('fail'), raw: out };
}

// Which commit is "cycle N"? Read the repo's own commit messages — a structural
// marker the repo owns — rather than trusting the sha the document prints.
function commitForCycle(n) {
  const line = git(['log', '--format=%h %s', '-200']).split('\n')
    .find((l) => new RegExp('^\\w+ cycle ' + n + ':').test(l));
  return line ? line.split(' ')[0] : null;
}

const scratch = mkdtempSync(join(tmpdir(), 'moon-gate-106-'));
const measured = new Map(); // cycle -> {tests,pass,fail}
let c104sha = null, c105sha = null;

try {
  c104sha = commitForCycle(104);
  c105sha = commitForCycle(105);
  for (const [cyc, sha] of [[104, c104sha], [105, c105sha]]) {
    if (!sha) continue;
    const wt = join(scratch, 'c' + cyc);
    git(['worktree', 'add', '--detach', wt, sha]);
    measured.set(cyc, measureSuite(wt));
  }
} catch (e) {
  console.error('measurement setup failed: ' + e.message);
}
const worktree = measureSuite(TARGET);

// ---------------------------------------------------------------- the documents

const nowText = readFileSync(REPORT, 'utf8');
const headText = git(['show', 'HEAD:REPORT.md']);

// Structural read of the claim: within the bullet that carries a suite-count claim,
// split on ';' into clauses. Each clause that states "N tests / N passing" (or
// "N tests, N passing") must name a cycle, and that number must equal the number
// measured at that cycle's commit.
const COUNT_RE = /(\d+)\s+tests?\s*(?:\/|,)\s*(\d+)\s+passing/i;
const CYCLE_RE = /\bcycle\s+(\d+)\b/i;

function suiteClaims(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (!/^\s*-\s/.test(line)) continue;
    if (!COUNT_RE.test(line)) continue;
    for (const clause of line.split(';')) {
      const c = clause.match(COUNT_RE);
      if (!c) continue;
      const a = clause.match(CYCLE_RE);
      out.push({
        clause: clause.trim(),
        tests: Number(c[1]),
        pass: Number(c[2]),
        cycle: a ? Number(a[1]) : null,
      });
    }
  }
  return out;
}

// The predicate under test, isolated so the controls can re-run it verbatim.
function claimsAreTrue(text) {
  const claims = suiteClaims(text);
  if (claims.length === 0) return { ok: false, why: 'no suite-count claim found at all' };
  const bad = [];
  for (const cl of claims) {
    if (cl.cycle === null) { bad.push(`"${cl.clause}" names no cycle`); continue; }
    const m = measured.get(cl.cycle);
    if (!m) { bad.push(`"${cl.clause}" names cycle ${cl.cycle}, which has no commit to measure`); continue; }
    if (cl.tests !== m.tests || cl.pass !== m.pass) {
      bad.push(`cycle ${cl.cycle}: doc says ${cl.tests}/${cl.pass}, measured ${m.tests}/${m.pass}`);
    }
  }
  return { ok: bad.length === 0, why: bad.join(' | '), n: claims.length };
}

// ---------------------------------------------------------------- scope cells

cell('A1', 'REPORT.md is the only modified file', () => {
  const files = git(['diff', '--name-only', 'HEAD']).trim().split('\n').filter(Boolean);
  return { ok: files.length === 1 && files[0] === 'REPORT.md', note: 'changed: ' + (files.join(',') || 'none') };
});

cell('A2', 'exactly one line replaced — no reflow, no new bullets', () => {
  const [add, del] = git(['diff', '--numstat', 'HEAD', '--', 'REPORT.md']).trim().split(/\s+/);
  const sameLines = nowText.split('\n').length === headText.split('\n').length;
  return { ok: add === '1' && del === '1' && sameLines, note: `+${add}/-${del}; line count ${headText.split('\n').length}->${nowText.split('\n').length}` };
});

cell('A3', 'the removed line is the known-false sentence, and it is gone', () => {
  const gone = !nowText.includes('Suite at cycle 104: 208 tests, 208 passing.');
  const wasThere = headText.includes('Suite at cycle 104: 208 tests, 208 passing.');
  return { ok: gone && wasThere, note: `present at HEAD=${wasThere}, present now=${gone === true ? false : true}` };
});

cell('A4', 'REPORT.md at or under its kickoff byte cap', () => {
  const b = Buffer.byteLength(nowText);
  return { ok: b <= BYTE_CAP, note: `bytes=${b} (cap ${BYTE_CAP}, HEAD ${Buffer.byteLength(headText)})` };
});

cell('A5', 'no test file touched; no dependency added', () => {
  const files = git(['diff', '--name-only', 'HEAD']).trim().split('\n').filter(Boolean);
  const touchedTests = files.filter((f) => f.startsWith('test/'));
  const touchedManifest = files.filter((f) => /package(-lock)?\.json/.test(f));
  return { ok: touchedTests.length === 0 && touchedManifest.length === 0, note: `tests touched=${touchedTests.length}, manifest touched=${touchedManifest.length}` };
});

// ---------------------------------------------------------------- truth cells

cell('B1', 'every suite-count claim is TRUE at the cycle it names', () => {
  const r = claimsAreTrue(nowText);
  return { ok: r.ok, note: r.ok ? `${r.n} clause(s) checked against measured commits` : r.why };
});

cell('B2', 'the document names cycle 104 AND its real commit sha', () => {
  const claimsSha = c104sha && nowText.includes(c104sha);
  return { ok: !!claimsSha, note: `cycle-104 commit per git log = ${c104sha}; cited in doc = ${claimsSha}` };
});

cell('B3', 'CONTROL — B1 FAILS against the pre-change text (not vacuous)', () => {
  const r = claimsAreTrue(headText);
  return { ok: r.ok === false, note: 'pre-change verdict=' + r.ok + (r.why ? ' :: ' + r.why : '') };
});

cell('B4', 'CONTROL — B1 FAILS on a one-digit mutation of the cycle-104 number', () => {
  const m104 = measured.get(104);
  const mutant = nowText.replace(
    new RegExp(m104.tests + '(\\s+tests?\\s*(?:\\/|,)\\s*)' + m104.pass + '(\\s+passing)'),
    (m104.tests + 1) + '$1' + (m104.pass + 1) + '$2',
  );
  const changed = mutant !== nowText;
  const r = claimsAreTrue(mutant);
  return { ok: changed && r.ok === false, note: `mutation applied=${changed}, mutant verdict=${r.ok} :: ${r.why}` };
});

cell('B5', 'CONTROL — B1 STAYS GREEN on a prose-only mutation (reads numbers, not sentences)', () => {
  const mutant = nowText.replace('The drop is bookkeeping', 'The decrease is clerical');
  const changed = mutant !== nowText;
  const r = claimsAreTrue(mutant);
  return { ok: changed && r.ok === true, note: `mutation applied=${changed}, mutant verdict=${r.ok}` };
});

// ------------------------------------------------- the explanation's substance

cell('C1', 'the stated arithmetic holds: cycle104 - cycle105 == 2', () => {
  const a = measured.get(104), b = measured.get(105);
  return { ok: a && b && a.tests - b.tests === 2, note: `${a && a.tests} - ${b && b.tests} = ${a && b ? a.tests - b.tests : '?'}` };
});

cell('C2', 'the two citations named really are in the archive, not deleted', () => {
  const arch = readFileSync(join(TARGET, '.swarm/REPORT-ARCHIVE-2026-08-20.md'), 'utf8');
  return { ok: arch.includes(':281') && arch.includes(':346'), note: `archive has :281=${arch.includes(':281')} :346=${arch.includes(':346')}` };
});

cell('C3', 'they really did live at REPORT.md:239 at the cycle-104 commit', () => {
  const old = git(['show', c104sha + ':REPORT.md']).split('\n')[238] || '';
  return { ok: old.includes(':281') && old.includes(':346'), note: `${c104sha}:REPORT.md:239 = "${old.trim().slice(0, 90)}"` };
});

cell('C4', 'the archive really is outside citations.test.js DOC_NAMES', () => {
  const t = readFileSync(join(TARGET, 'test/citations.test.js'), 'utf8');
  const m = t.match(/const DOC_NAMES = \[([^\]]*)\]/);
  return { ok: !!m && !m[1].includes('ARCHIVE'), note: 'DOC_NAMES = [' + (m ? m[1].trim() : '?') + ']' };
});

cell('C5', 'the new text added NO new live citation (working tree still 208)', () => {
  const b = measured.get(105);
  return { ok: worktree.tests === b.tests, note: `working tree ${worktree.tests}, cycle-105 commit ${b && b.tests}` };
});

// ---------------------------------------------------------------- suite cells

cell('D1', 'full test_cmd green in the real working tree', () => ({
  ok: worktree.fail === 0 && worktree.tests > 0 && worktree.pass === worktree.tests,
  note: `tests ${worktree.tests} pass ${worktree.pass} fail ${worktree.fail}`,
}));

cell('D2', 'suite still at or above the kickoff floor of 187', () => ({
  ok: worktree.tests >= 187, note: `${worktree.tests} >= 187`,
}));

cell('D3', 'CONTROL — doc-counts.test.js still FAILS on an anchorless variant', () => {
  const wt = join(scratch, 'anchorless');
  git(['worktree', 'add', '--detach', wt, 'HEAD']);
  const p = join(wt, 'REPORT.md');
  // Strip every anchor from the whole bullet block so the count floats free.
  const stripped = nowText
    .replace(/\bcycle\s+\d+/gi, 'recently')
    .replace(/\brun\s*#?\d+/gi, 'the run')
    .replace(/20\d{2}-\d{2}-\d{2}/g, 'someday')
    .replace(/\bcommit\b/gi, 'change')
    .replace(/\bkickoff\b/gi, 'the start')
    .replace(/\bwrap-?up\b/gi, 'the end')
    .replace(/\bas of\b/gi, 'at')
    .replace(/\bbaseline\b/gi, 'starting point');
  writeFileSync(p, stripped);
  let failed = false, out = '';
  try {
    out = execSync('node --test test/doc-counts.test.js 2>&1', { cwd: wt, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch (e) { failed = true; out = (e.stdout || '') + (e.stderr || ''); }
  const m = out.match(/^.\s*fail\s+(\d+)\s*$/m);
  return { ok: failed || (m && Number(m[1]) > 0), note: `anchorless variant -> fail ${m ? m[1] : '?'} (nonzero required)` };
});

// ---------------------------------------------------------------- hygiene cells

cell('E1', 'no scratch dirs or stray worktrees left inside the target', () => {
  const untracked = git(['status', '--porcelain', '--untracked-files=all']).trim().split('\n')
    .filter(Boolean).filter((l) => l.startsWith('??'))
    .filter((l) => !l.includes('.swarm/gates/') && !l.includes('.swarm/runs/'));
  const scratchDirs = existsSync(join(TARGET, '.scratch-T-209'));
  const wts = git(['worktree', 'list']).trim().split('\n')
    .filter((l) => !l.startsWith(TARGET + ' ') && !l.includes(scratch));
  return { ok: untracked.length === 0 && !scratchDirs, note: `untracked=${untracked.length}, .scratch-T-209=${scratchDirs}, foreign worktrees=${wts.length}` };
});

// ---------------------------------------------------------------- report

try { git(['worktree', 'prune']); } catch {}
try { rmSync(scratch, { recursive: true, force: true }); } catch {}
try { git(['worktree', 'prune']); } catch {}

let pass = 0, fail = 0;
for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.desc}`);
  if (r.note) console.log(`       ${r.note}`);
  r.ok ? pass++ : fail++;
}
console.log(`GATE cycle-106  PASS ${pass} / FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
