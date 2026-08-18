'use strict';

// REPORT.md hand-maintains two markdown tables — "## Known issues (N)" and
// "## Resolved issues" — that summarize `.swarm/state.json`'s `known_issues[]` and
// `resolved_issues[]` arrays for a human reader. The two documents are edited
// separately, by hand, and nothing previously detected drift between them: a reader
// trusts REPORT.md's tables, so if state.json moves (an issue resolves, a severity is
// re-assessed) and REPORT.md is not updated to match, REPORT.md silently misleads.
// This file makes that agreement machine-checked, following the pattern in
// test/contracts.test.js (parse defensively, assert with clear messages, state scope).
//
// Classification of what this test does and does not enforce (HOLE = a real gap where
// the two documents could silently disagree, hardened below; BOUNDARY = a place the two
// schemas genuinely do not both define anything, documented rather than forced):
//
//   HOLE — id set of REPORT's "Known issues" table vs state.json's known_issues[].
//   HOLE — id set of REPORT's "Resolved issues" table vs state.json's resolved_issues[].
//   HOLE — an id appearing in both REPORT tables at once (open and resolved
//          simultaneously). Only REPORT's own two tables are checked directly; since
//          the id-set checks above already force REPORT's ids to equal state.json's
//          ids 1:1, disjointness on the REPORT side implies disjointness on the
//          state.json side too, so a second, separate check there would be redundant.
//   HOLE — severity value for every id that carries a `severity` on BOTH sides.
//   HOLE — the "(N)" row count in the "## Known issues (N)" heading vs actual row count.
//   BOUNDARY — state.json's resolved_issues[] entries carry no `severity` field at all
//          (verified: none of KI-1/KI-3/KI-6 have one), while REPORT's "Resolved
//          issues" table's `severity` column always has a value. This is not a
//          detectable drift, because state.json never asserts a resolved-issue
//          severity to drift away from. Inventing a severity on the state.json side, or
//          dropping REPORT's column to "fix" the asymmetry, would misrepresent one of
//          the two documents to force an agreement that was never claimed. So: skipped,
//          not compared, by design.
//   BOUNDARY — REPORT's `status` column (Known issues) and state.json's free-text
//          `status`/prose fields are both present but neither is a controlled
//          vocabulary; nothing here parses or compares that prose.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'REPORT.md');
const STATE_PATH = path.join(ROOT, '.swarm', 'state.json');

const REPORT_RAW = fs.readFileSync(REPORT_PATH, 'utf8');
const REPORT_LINES = REPORT_RAW.split('\n');
const STATE = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));

// Split a markdown table row on '|', dropping the leading/trailing empty cells that
// come from the row's own leading/trailing pipe. This assumes no cell's prose contains
// a literal '|' — true today (verified: every data row under both headings has exactly
// as many '|' characters as the header row, i.e. no stray pipe snuck into any cell) —
// and the per-row cell-count assert below re-checks that assumption on every run rather
// than trusting it once.
function splitRow(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((cell) => cell.trim());
}

// Locate a "## Heading" line matching headingRegex, then parse the markdown table
// (header row, '---' separator row, data rows) that follows it. Fails loudly — rather
// than silently returning zero rows — if the heading, header row, separator, or any
// data row is missing or shaped unexpectedly, per this repo's rule that a check must
// prove it saw what it claims to have measured.
function parseTableAfterHeading(headingRegex, expectedHeaderCells) {
  const headingIdx = REPORT_LINES.findIndex((line) => headingRegex.test(line));
  assert.notStrictEqual(
    headingIdx, -1,
    `report-issues: could not find a REPORT.md heading matching ${headingRegex} — has the section been renamed?`
  );
  const headingMatch = REPORT_LINES[headingIdx].match(headingRegex);

  let i = headingIdx + 1;
  while (i < REPORT_LINES.length && !REPORT_LINES[i].trim().startsWith('|')) i++;
  assert.ok(
    i < REPORT_LINES.length,
    `report-issues: found no table under "${REPORT_LINES[headingIdx]}" (REPORT.md:${headingIdx + 1})`
  );

  const headerCells = splitRow(REPORT_LINES[i]);
  assert.deepStrictEqual(
    headerCells, expectedHeaderCells,
    `report-issues: unexpected header row under "${REPORT_LINES[headingIdx]}" at REPORT.md:${i + 1} — ` +
    `got ${JSON.stringify(headerCells)}, expected ${JSON.stringify(expectedHeaderCells)}`
  );

  i++;
  assert.ok(
    i < REPORT_LINES.length && /^\|[\s:-]+\|/.test(REPORT_LINES[i].trim()),
    `report-issues: expected a markdown '---' separator row at REPORT.md:${i + 1}, under "${REPORT_LINES[headingIdx]}"`
  );
  i++;

  const rows = [];
  while (i < REPORT_LINES.length && REPORT_LINES[i].trim().startsWith('|')) {
    const cells = splitRow(REPORT_LINES[i]);
    assert.strictEqual(
      cells.length, expectedHeaderCells.length,
      `report-issues: row at REPORT.md:${i + 1} has ${cells.length} cells, expected ` +
      `${expectedHeaderCells.length} (a literal '|' inside the prose would break this parse): ${REPORT_LINES[i]}`
    );
    rows.push({ cells, lineNo: i + 1 });
    i++;
  }
  assert.ok(
    rows.length > 0,
    `report-issues: parsed zero data rows from the table under "${REPORT_LINES[headingIdx]}" — ` +
    'a consistency check that silently parsed nothing would be worse than no check at all'
  );

  return { headingMatch, rows };
}

const knownTable = parseTableAfterHeading(
  /^## Known issues \((\d+)\)\s*$/,
  ['id', 'severity', 'status', 'issue']
);
const resolvedTable = parseTableAfterHeading(
  /^## Resolved issues\s*$/,
  ['id', 'severity', 'how it closed']
);

const reportKnown = knownTable.rows.map((r) => ({ id: r.cells[0], severity: r.cells[1] }));
const reportResolved = resolvedTable.rows.map((r) => ({ id: r.cells[0], severity: r.cells[1] }));
const headingCount = Number(knownTable.headingMatch[1]);

assert.ok(
  Array.isArray(STATE.known_issues) && STATE.known_issues.length > 0,
  'report-issues: .swarm/state.json known_issues[] is missing or empty'
);
assert.ok(
  Array.isArray(STATE.resolved_issues) && STATE.resolved_issues.length > 0,
  'report-issues: .swarm/state.json resolved_issues[] is missing or empty'
);

const stateKnown = STATE.known_issues.map((k) => ({ id: k.id, severity: k.severity }));
// BOUNDARY (see header comment): state.json resolved_issues[] entries have no
// `severity` field. `k.severity` is simply `undefined` here — not invented, not
// defaulted — and every comparison below treats `undefined` as "nothing to compare".
const stateResolved = STATE.resolved_issues.map((k) => ({ id: k.id, severity: k.severity }));

test('report-issues self-check: both REPORT.md tables and both state.json arrays were actually parsed', () => {
  // The parses above already throw if any of this is false; this test exists so a
  // silently-empty parse shows up as a named failing assertion, not an absent one.
  assert.ok(knownTable.rows.length > 0, 'REPORT "Known issues" table yielded zero rows');
  assert.ok(resolvedTable.rows.length > 0, 'REPORT "Resolved issues" table yielded zero rows');
  assert.ok(stateKnown.length > 0, 'state.json known_issues[] yielded zero entries');
  assert.ok(stateResolved.length > 0, 'state.json resolved_issues[] yielded zero entries');
});

test('REPORT "Known issues" table ids match state.json known_issues[] ids', () => {
  const reportIds = [...new Set(reportKnown.map((r) => r.id))].sort();
  const stateIds = [...new Set(stateKnown.map((r) => r.id))].sort();
  assert.deepStrictEqual(
    reportIds, stateIds,
    `REPORT.md's Known issues table ids (${JSON.stringify(reportIds)}) do not match ` +
    `.swarm/state.json known_issues[] ids (${JSON.stringify(stateIds)})`
  );
});

test('REPORT "Resolved issues" table ids match state.json resolved_issues[] ids', () => {
  const reportIds = [...new Set(reportResolved.map((r) => r.id))].sort();
  const stateIds = [...new Set(stateResolved.map((r) => r.id))].sort();
  assert.deepStrictEqual(
    reportIds, stateIds,
    `REPORT.md's Resolved issues table ids (${JSON.stringify(reportIds)}) do not match ` +
    `.swarm/state.json resolved_issues[] ids (${JSON.stringify(stateIds)})`
  );
});

test('no id is listed in both of REPORT\'s Known-issues and Resolved-issues tables', () => {
  const openIds = new Set(reportKnown.map((r) => r.id));
  const resolvedIds = new Set(reportResolved.map((r) => r.id));
  const overlap = [...openIds].filter((id) => resolvedIds.has(id)).sort();
  assert.deepStrictEqual(
    overlap, [],
    `id(s) appear in both REPORT.md tables at once, i.e. both open and resolved: ${overlap.join(', ')}`
  );
});

test('severities agree between REPORT.md and state.json wherever both sides define one', () => {
  const stateKnownSeverityById = new Map(stateKnown.map((k) => [k.id, k.severity]));
  for (const row of reportKnown) {
    const stateSeverity = stateKnownSeverityById.get(row.id);
    assert.strictEqual(
      row.severity, stateSeverity,
      `${row.id} severity mismatch: REPORT.md's Known issues table says "${row.severity}", ` +
      `.swarm/state.json says "${stateSeverity}"`
    );
  }

  // BOUNDARY (see header comment): compare only where state.json actually supplies a
  // severity. Today it supplies none for resolved_issues[], so this loop makes zero
  // strictEqual calls for the resolved table — that is the documented boundary, not a
  // bug in the loop.
  const stateResolvedSeverityById = new Map(stateResolved.map((k) => [k.id, k.severity]));
  for (const row of reportResolved) {
    const stateSeverity = stateResolvedSeverityById.get(row.id);
    if (stateSeverity === undefined) continue;
    assert.strictEqual(
      row.severity, stateSeverity,
      `${row.id} severity mismatch: REPORT.md's Resolved issues table says "${row.severity}", ` +
      `.swarm/state.json says "${stateSeverity}"`
    );
  }
});

test('the "## Known issues (N)" heading count matches the number of data rows in that table', () => {
  assert.strictEqual(
    headingCount, knownTable.rows.length,
    `REPORT.md's heading claims ${headingCount} known issues, but the table under it has ` +
    `${knownTable.rows.length} data row(s)`
  );
});
