#!/usr/bin/env node
// cycle-107 verification gate — item T-210.
// Authored by the CONDUCTOR at verification time. The builder never saw it.
//
// Design note, and it is the whole point of this gate: cycles 104, 105 and 106 on this
// repo all turned on the same failure — a defect walking through a green EXISTENCE
// check. So the load-bearing cell here (B1) does not check that the row now STATES a
// number; it MEASURES the thing the number describes (the live allow list in
// /opt/swarm/.claude/settings.json) and compares. B2 is its refutation control.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TARGET = '/opt/targets/moon';
const SETTINGS = '/opt/swarm/.claude/settings.json';
const REPORT = `${TARGET}/REPORT.md`;
const OWNER_ACTION = `${TARGET}/.swarm/KI-2-OWNER-ACTION.md`;

const BYTE_CAP = 25586;
const HEAD_LINES = 222;

let pass = 0, fail = 0;
const rows = [];
function cell(id, desc, ok, detail = '') {
  if (ok) { pass++; rows.push(`PASS ${id} ${desc}${detail ? '   ' + detail : ''}`); }
  else { fail++; rows.push(`FAIL ${id} ${desc}${detail ? '   ' + detail : ''}`); }
  return ok;
}

const git = (args) => execFileSync('git', ['-C', TARGET, ...args], { encoding: 'utf8' });

const work = readFileSync(REPORT, 'utf8');
const head = git(['show', 'HEAD:REPORT.md']);

// ---------------------------------------------------------------------------
// A — shape of the edit
// ---------------------------------------------------------------------------

// A1: REPORT.md is the ONLY product file touched. .swarm/ is conductor territory
// (this gate file itself lives there), so it is excluded by path, not by trimming —
// porcelain's XY column is whitespace-significant and must never be .trim()ed.
const porcelain = git(['status', '--porcelain']).split('\n').filter((l) => l.length > 0);
const touched = porcelain.map((l) => l.slice(3)).filter((p) => !p.startsWith('.swarm/'));
cell('A1', 'REPORT.md is the only product file modified',
  touched.length === 1 && touched[0] === 'REPORT.md',
  `touched=${JSON.stringify(touched)}`);

// A2: no line inserted or deleted anywhere — other suites cite REPORT.md by line number.
const workLines = work.split('\n').length - (work.endsWith('\n') ? 1 : 0);
cell('A2', 'line count unchanged (no citation-shifting insertion)',
  workLines === HEAD_LINES, `${HEAD_LINES} -> ${workLines}`);

const numstat = git(['diff', '--numstat', '--', 'REPORT.md']).trim();
cell('A3', 'diff is exactly one line replaced, in place',
  /^1\s+1\s+REPORT\.md$/.test(numstat), `numstat="${numstat}"`);

// A4: byte cap the spec names.
const bytes = Buffer.byteLength(work, 'utf8');
cell('A4', 'REPORT.md at or under its byte cap',
  bytes <= BYTE_CAP, `bytes=${bytes} (cap ${BYTE_CAP}, HEAD ${Buffer.byteLength(head, 'utf8')})`);

// ---------------------------------------------------------------------------
// B — SUPERSEDE, not rewrite; and is the new claim TRUE?
// ---------------------------------------------------------------------------

const RUN3_SENTENCE = 'The exact patch is six allow-list lines';
cell('B1', 'the run-3 sentence survives byte-identically (record not overwritten)',
  work.includes(RUN3_SENTENCE), `present=${work.includes(RUN3_SENTENCE)}`);

// The superseding clause, located structurally rather than by remembering its wording:
// the span of the KI-2 row that did not exist at HEAD.
const kiRowWork = work.split('\n').find((l) => l.startsWith('| KI-2 |')) || '';
const kiRowHead = head.split('\n').find((l) => l.startsWith('| KI-2 |')) || '';
const addedSpan = (() => {
  let i = 0;
  while (i < kiRowWork.length && i < kiRowHead.length && kiRowWork[i] === kiRowHead[i]) i++;
  let j = 0;
  while (j < kiRowWork.length - i && j < kiRowHead.length - i &&
         kiRowWork[kiRowWork.length - 1 - j] === kiRowHead[kiRowHead.length - 1 - j]) j++;
  return kiRowWork.slice(i, kiRowWork.length - j);
})();

// B2..B5 read the ADDED SPAN only, so a cell cannot be satisfied by pre-existing text.
function clauseCells(span, prefix, record) {
  const c = {
    dated: /2026-08-20/.test(span) && /run\s*6/i.test(span) && /cycle\s*107/i.test(span),
    supersede: /supersede/i.test(span),
    four: /\bfour\b/i.test(span),
    scripts: /swarm-playbook\.sh/.test(span) && /swarm-warmup\.sh/.test(span),
  };
  if (record) {
    cell(`${prefix}a`, 'the added clause is DATED (date + run + cycle)', c.dated);
    cell(`${prefix}b`, 'the added clause says the earlier count is superseded', c.supersede);
    cell(`${prefix}c`, 'the added clause names the current ask: four', c.four);
    cell(`${prefix}d`, 'the added clause names both remaining scripts', c.scripts);
  }
  return c.dated && c.supersede && c.four && c.scripts;
}
clauseCells(addedSpan, 'B2', true);

// B6: the four allow-list lines are NOT restated here — the pointer carries them.
const newBashTokens = (work.match(/Bash\(/g) || []).length;
const headBashTokens = (head.match(/Bash\(/g) || []).length;
cell('B6', 'no new Bash( allow-list token added to REPORT.md',
  newBashTokens === headBashTokens, `HEAD ${headBashTokens} -> work ${newBashTokens}`);
cell('B7', 'neither remaining script is restated in allow-entry form',
  !/swarm-(playbook|warmup)\.sh:\*/.test(work));

// B8 — THE TRUTH CELL. Not "does the row state four?" but "is four the real number?"
// Measured against the live allow list, the same way the conductor measured it before
// briefing the builder.
function measureAsk(settingsText) {
  const allow = JSON.parse(settingsText).permissions.allow;
  const has = (name) => allow.filter((e) => e.includes(name)).length;
  const missing = ['swarm-playbook.sh', 'swarm-warmup.sh'].filter((s) => has(s) === 0);
  const granted = ['swarm-budget.sh', 'swarm-notify.sh'].filter((s) => has(s) > 0);
  return { missing, granted, askLines: missing.length * 2 };
}
const settingsText = readFileSync(SETTINGS, 'utf8');
const measured = measureAsk(settingsText);
const ownerAction = readFileSync(OWNER_ACTION, 'utf8');
const ownerLines = (ownerAction.match(/^\s*"Bash\([^"]*\)",?\s*$/gm) || []).length;
cell('B8', 'TRUTH: four is the real ask, measured against the live allow list',
  measured.askLines === 4 &&
  measured.missing.join(',') === 'swarm-playbook.sh,swarm-warmup.sh' &&
  measured.granted.length === 2 &&
  ownerLines === 4,
  `missing=${JSON.stringify(measured.missing)} granted=${JSON.stringify(measured.granted)} ` +
  `askLines=${measured.askLines} owner-action-lines=${ownerLines}`);

// ---------------------------------------------------------------------------
// C — controls. A cell with no control is an existence check wearing a costume.
// ---------------------------------------------------------------------------

// C1 REFUTATION CONTROL for B8: grant swarm-playbook.sh in a copy and the ask must
// stop being four. If B8 were asserting rather than measuring, this would not move.
const mutantSettings = JSON.parse(settingsText);
mutantSettings.permissions.allow.push('Bash(/opt/swarm/bin/swarm-playbook.sh:*)');
const mutantMeasure = measureAsk(JSON.stringify(mutantSettings));
cell('C1', 'CONTROL — B8 stops reading four when a script is granted in a mutated copy',
  mutantMeasure.askLines === 2, `mutant askLines=${mutantMeasure.askLines}`);

// C2 NON-VACUITY: the clause cells must all FAIL against HEAD's own KI-2 row.
const headSpanCells = clauseCells(kiRowHead, 'C2', false);
cell('C2', 'CONTROL — the clause cells FAIL against the pre-change row (not vacuous)',
  headSpanCells === false, `HEAD row satisfies clause=${headSpanCells}`);

// C3 TRUE-NEGATIVE: a prose-only reword inside the added span must keep the clause
// cells GREEN. A check that dies on every edit is a snapshot test, not an assertion.
const prose = addedSpan.replace(/ran cleanly/, 'ran without error').replace(/remaining ask/, 'outstanding ask');
cell('C3', 'CONTROL — clause cells STAY GREEN on a prose-only reword',
  prose !== addedSpan && clauseCells(prose, 'C3', false) === true);

// C4 REFUTATION CONTROL for B6: a mutant that pastes an allow line must be caught.
const bashMutant = work.replace(RUN3_SENTENCE, RUN3_SENTENCE + ' `Bash(/opt/swarm/bin/swarm-playbook.sh:*)`');
cell('C4', 'CONTROL — B6/B7 catch a mutant that pastes an allow-list line',
  (bashMutant.match(/Bash\(/g) || []).length !== headBashTokens &&
  /swarm-(playbook|warmup)\.sh:\*/.test(bashMutant));

// C5: the reader is not left holding two live counts. "six" must appear only inside the
// preserved historical sentence, and the row must not assert six as current anywhere else.
const sixOccurrences = (kiRowWork.match(/\bsix\b/gi) || []).length;
cell('C5', 'exactly one "six" survives in the row, the historical one',
  sixOccurrences === 1, `count=${sixOccurrences}`);

// C6: no count-shaped token was introduced that doc-counts.test.js would have to anchor.
const COUNT_SHAPES = [/\b\d+\s+tests?\b/g, /\b\d+\/\d+\s*(?:green|pass(?:ed)?)?\b/g, /\b\d+\s+(?:known\s+)?issues?\b/g];
const shapesIn = (s) => COUNT_SHAPES.reduce((n, re) => n + ((s.match(re) || []).length), 0);
cell('C6', 'no new count-claim-shaped token introduced into the row',
  shapesIn(kiRowWork) === shapesIn(kiRowHead), `HEAD ${shapesIn(kiRowHead)} -> work ${shapesIn(kiRowWork)}`);

console.log(rows.join('\n'));
console.log(`GATE cycle-107 (T-210)  PASS ${pass} / FAIL ${fail}`);
console.log('--- added span, verbatim ---');
console.log(JSON.stringify(addedSpan));
process.exit(fail === 0 ? 0 : 1);
