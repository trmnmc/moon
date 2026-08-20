'use strict';

// T-207: this repo's docs have decayed a hard-coded test count THREE separate times
// (REPORT.md's own annotation at "On that annotation:" names cycle 80 -> stale by
// cycle 83, then 171-as-of-run-3 -> stale again by the time run 6 rolled around).
// Hard constraint learned the expensive way: there is no non-recursive way for a
// test in this suite to learn the suite's OWN runtime test count (a test can't
// re-run `node --test` on itself), so a bare present-tense "N tests" claim is not
// machine-checkable by any means available in this repo -- full stop. What IS
// checkable, and is exactly the failure mode that has bitten three times, is
// whether a count claim names a measurement point (a cycle, a run, a commit, a
// date) rather than floating free as if it describes "now". A number that names
// its measurement point is a historical record: it cannot rot, because it was
// never claiming to be current. A bare one always will. This file enforces that
// SHAPE, not any particular value -- it is the T-180 treatment REPORT.md itself
// named as the durable fix, applied here.
//
// It also directly re-derives one issue-count claim that test/report-issues.test.js
// does not reach: the "Since the build run, three known issues closed (KI-1, KI-3,
// KI-6)" sentence under "Honest hand-off". report-issues.test.js parses REPORT's two
// markdown TABLES against state.json; this sentence lives in prose outside either
// table, so it was an unguarded HOLE until now.
//
// Scope note: README.md carries no test-count or issue-count claim today (checked
// below, not assumed) -- this file still scans it, fail-closed, so a future one
// can't sneak in unanchored.
//
// This file does not modify, and does not re-implement the coverage of,
// test/report-issues.test.js (which already forces REPORT's "## Known issues (N)"
// heading and both tables to agree with .swarm/state.json, value for value).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const README_PATH = path.join(ROOT, 'README.md');
const REPORT_PATH = path.join(ROOT, 'REPORT.md');
const STATE_PATH = path.join(ROOT, '.swarm', 'state.json');

// ---------------------------------------------------------------------------
// Fail-closed loads. A missing or empty document is a hard failure, never a
// silent pass -- an absent file has nothing anchored in it, but it also proves
// nothing was scanned, so this must error loudly rather than let the "zero
// violations found" tests below pass vacuously.
// ---------------------------------------------------------------------------

function readDocOrThrow(filePath, label) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`doc-counts: could not read ${label} at ${filePath}: ${err.message}`);
  }
  assert.ok(
    raw.trim().length > 0,
    `doc-counts: ${label} at ${filePath} is empty -- nothing to scan, treating as failure per fail-closed rule`,
  );
  return raw;
}

// ---------------------------------------------------------------------------
// Chunking. A count claim and the anchor that dates it are frequently NOT on the
// same physical source line -- markdown hand-wraps prose at ~90 columns, so a
// sentence like "...pinned it at\ncycle 80..." splits the anchor onto the next
// line. Anchor search therefore runs over a CHUNK, not a single line:
//
//   - a markdown table row (a line starting with '|') is its OWN chunk: every
//     row in this repo's tables is a self-contained claim, and lumping the
//     whole table into one chunk (which blank-line splitting alone would do)
//     would let one row's cycle citation silently anchor a different row's
//     bare number.
//   - otherwise, chunks are blank-line-delimited paragraphs (the fenced ```sh
//     block under "How to run it" is one such chunk; the "On that annotation"
//     paragraph is another).
//
// Verified against every real count-claim location in REPORT.md as of this
// writing (see the report-back for the specific lines) before being trusted.
function chunkify(text) {
  const lines = text.split('\n');
  const chunks = [];
  let buf = [];
  let bufStart = 0;

  function flush() {
    if (buf.length > 0) {
      chunks.push({ text: buf.join('\n'), startLine: bufStart, endLine: bufStart + buf.length - 1 });
      buf = [];
    }
  }

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (line.trim() === '') {
      flush();
      return;
    }
    if (line.trimStart().startsWith('|')) {
      flush();
      chunks.push({ text: line, startLine: lineNo, endLine: lineNo });
      return;
    }
    if (buf.length === 0) bufStart = lineNo;
    buf.push(line);
  });
  flush();

  return chunks;
}

// ---------------------------------------------------------------------------
// Count-claim patterns. Deliberately narrow: a broad `\d+\s+\S+` sweep throws
// false positives (verified while building this -- "step-4 pass" in REPORT.md's
// own prose matches a naive `\d+\s+pass\b` scan, but "4" there is a step number,
// not a test count). Each pattern below targets a shape that unambiguously
// names a test or issue count in this repo's own writing.
const COUNT_PATTERNS = [
  { name: 'bare test count', re: /\b\d+\s+tests?\b/g },
  { name: 'pass/fail ratio', re: /\b\d+\/\d+\s*(?:green|pass(?:ed)?)?\b/g },
  { name: 'bare issue count', re: /\b\d+\s+(?:known\s+)?issues?\b/g },
];

// Anchor vocabulary: a phrase that names WHEN the number was true. Any one
// occurrence anywhere in the chunk is enough -- the chunk is already scoped
// tightly (table row, or a single blank-line-delimited paragraph) so this
// does not need to be adjacent to the specific digits.
const ANCHOR_RE = /\b(?:cycle\s+\d+|run\s*#?\d+|as of|baseline|commit\b|kickoff|wrap-?up|20\d{2}-\d{2}-\d{2})/i;

// Scan `text` and return violations: count-shaped claims whose enclosing chunk
// carries no anchor. Each violation names the file, the line, the matched
// text, and the chunk it was judged against, so a failure is diagnosable
// without re-deriving the scan by hand.
function findUnanchoredCounts(text, label) {
  const chunks = chunkify(text);
  const violations = [];

  for (const chunk of chunks) {
    const anchored = ANCHOR_RE.test(chunk.text);
    for (const { name, re } of COUNT_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(chunk.text)) !== null) {
        if (!anchored) {
          violations.push({
            label,
            kind: name,
            match: m[0],
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            chunk: chunk.text,
          });
        }
      }
    }
  }
  return violations;
}

function formatViolations(violations) {
  return violations
    .map(
      (v) =>
        `  ${v.label}:${v.startLine}-${v.endLine} [${v.kind}] "${v.match}" has no cycle/run/commit/date ` +
        `anchor anywhere in its chunk:\n    ${JSON.stringify(v.chunk)}`,
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// Unit-level red/green fixtures. These do NOT depend on README.md or REPORT.md
// containing any particular number right now -- they prove the detector itself
// is sound, independent of what today's documents happen to say.
// ---------------------------------------------------------------------------

test('findUnanchoredCounts: RED -- a bare, undated count claim is flagged', () => {
  const bad = [
    '## How to run it',
    '',
    'Run the suite yourself:',
    '',
    'node --test test/*.test.js    # 200 tests, all green',
    '',
    'Nothing else on this page mentions when that was true.',
  ].join('\n');

  const violations = findUnanchoredCounts(bad, 'fixture');
  assert.strictEqual(
    violations.length, 1,
    `expected exactly one unanchored violation, got ${violations.length}: ${formatViolations(violations)}`,
  );
  assert.strictEqual(violations[0].kind, 'bare test count');
  assert.strictEqual(violations[0].match, '200 tests');
});

test('findUnanchoredCounts: GREEN control -- a dated historical count is NOT flagged', () => {
  const good = [
    '## Coverage',
    '',
    'At cycle 105 the suite read 200 tests / 200 pass, measured against that commit -- a',
    'historical record, not a claim about today.',
  ].join('\n');

  const violations = findUnanchoredCounts(good, 'fixture');
  assert.deepStrictEqual(
    violations, [],
    `a dated historical count must not be flagged, but got: ${formatViolations(violations)}`,
  );
});

test('findUnanchoredCounts: anchor and number split across a hand-wrapped line still resolve (paragraph chunking)', () => {
  // Mirrors REPORT.md's own "On that annotation" paragraph, where the anchor
  // ("cycle 80") lands on the physical line AFTER the number ("161 tests")
  // because of hand-wrapping. If this file chunked per physical line instead
  // of per paragraph, this fixture would wrongly flag.
  const wrapped = [
    'It read `# 161 tests` until this wrap-up, correct when T-174 pinned it at',
    'cycle 80 and stale by cycle 83, because two later cycles added tests.',
  ].join('\n');

  const violations = findUnanchoredCounts(wrapped, 'fixture');
  assert.deepStrictEqual(
    violations, [],
    `an anchor on the next wrapped line must still count, but got: ${formatViolations(violations)}`,
  );
});

test('findUnanchoredCounts: a table row anchors only itself, not a neighboring row', () => {
  // Two adjacent table rows, no blank line between them (as real markdown
  // tables are written). Row 1 is anchored; row 2 is not. If chunking treated
  // the whole table as one blank-line-delimited paragraph, row 1's cycle
  // citation would wrongly anchor row 2's bare number too.
  const table = [
    '| id | note |',
    '|---|---|',
    '| A | measured at cycle 47, the suite read 147 tests |',
    '| B | the suite now reads 200 tests |',
  ].join('\n');

  const violations = findUnanchoredCounts(table, 'fixture');
  assert.strictEqual(
    violations.length, 1,
    `expected exactly the second row to be flagged, got ${violations.length}: ${formatViolations(violations)}`,
  );
  assert.strictEqual(violations[0].match, '200 tests');
  assert.strictEqual(violations[0].startLine, 4);
});

// ---------------------------------------------------------------------------
// Fail-closed: a missing document must error, never silently report zero
// violations (which would look identical to "scanned and found nothing").
// ---------------------------------------------------------------------------

test('readDocOrThrow: fails closed on a missing document rather than reporting a clean scan', () => {
  assert.throws(
    () => readDocOrThrow(path.join(ROOT, 'DOES-NOT-EXIST.md'), 'DOES-NOT-EXIST.md'),
    /could not read/,
  );
});

test('readDocOrThrow: fails closed on an empty document', () => {
  const emptyPath = path.join(ROOT, 'test', '.doc-counts-empty-fixture.tmp');
  fs.writeFileSync(emptyPath, '');
  try {
    assert.throws(
      () => readDocOrThrow(emptyPath, 'empty fixture'),
      /is empty/,
    );
  } finally {
    fs.unlinkSync(emptyPath);
  }
});

// ---------------------------------------------------------------------------
// The live documents, scanned fresh on every run.
// ---------------------------------------------------------------------------

test('README.md carries no unanchored test/issue count claim', () => {
  const raw = readDocOrThrow(README_PATH, 'README.md');
  const violations = findUnanchoredCounts(raw, 'README.md');
  assert.deepStrictEqual(
    violations, [],
    `README.md has an unanchored count claim -- re-derive it or add a measurement-point anchor:\n${formatViolations(violations)}`,
  );
});

test('REPORT.md carries no unanchored test/issue count claim', () => {
  const raw = readDocOrThrow(REPORT_PATH, 'REPORT.md');
  const violations = findUnanchoredCounts(raw, 'REPORT.md');
  assert.deepStrictEqual(
    violations, [],
    `REPORT.md has an unanchored count claim -- re-derive it or add a measurement-point anchor:\n${formatViolations(violations)}`,
  );
});

test('REPORT.md actually contains count claims for the scan above to have exercised (positive-engagement control)', () => {
  // The two tests above pass vacuously if the count patterns never match
  // anything in the live document. This proves that is not what happened:
  // REPORT.md is known (as of this writing) to carry several dated count
  // claims (run 3's "171 tests", the cycle-47/58 mutation-testing figures,
  // cycle 102's "187/187 green"), and this asserts the scanner's own
  // patterns actually see at least one of them.
  const raw = readDocOrThrow(REPORT_PATH, 'REPORT.md');
  const chunks = chunkify(raw);
  let matchCount = 0;
  for (const chunk of chunks) {
    for (const { re } of COUNT_PATTERNS) {
      re.lastIndex = 0;
      while (re.exec(chunk.text) !== null) matchCount++;
    }
  }
  assert.ok(
    matchCount > 0,
    'doc-counts: the count-claim patterns matched nothing at all in REPORT.md -- either the ' +
      'patterns are broken or every historical count claim has been removed; either way the ' +
      '"no unanchored claims" test above would be passing vacuously',
  );
});

// ---------------------------------------------------------------------------
// The one issue-count claim that lives in prose, not in either table
// test/report-issues.test.js already governs -- re-derived directly against
// .swarm/state.json here.
// ---------------------------------------------------------------------------

test('REPORT.md "known issues closed" sentence matches state.json resolved_issues[] exactly', () => {
  const raw = readDocOrThrow(REPORT_PATH, 'REPORT.md');
  const state = JSON.parse(readDocOrThrow(STATE_PATH, '.swarm/state.json'));

  assert.ok(
    Array.isArray(state.resolved_issues) && state.resolved_issues.length > 0,
    'doc-counts: .swarm/state.json resolved_issues[] is missing or empty',
  );

  const sentenceMatch = raw.match(/Since the build run,\s+(\w+)\s+known issues closed\s*\(([^)]*)\)/);
  assert.ok(
    sentenceMatch,
    'doc-counts: could not find the "Since the build run, N known issues closed (...)" sentence in ' +
      'REPORT.md -- has it been reworded or removed? This claim must still be re-derivable against ' +
      'state.json, so a rename should update this regex, not silently drop the check.',
  );

  const WORD_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const wordCount = sentenceMatch[1].toLowerCase();
  assert.ok(
    Object.prototype.hasOwnProperty.call(WORD_NUMBERS, wordCount),
    `doc-counts: "Since the build run, ${sentenceMatch[1]} known issues closed" -- "${sentenceMatch[1]}" ` +
      `is not a recognized number word (extend WORD_NUMBERS if a legitimate new one is needed)`,
  );

  const namedIds = [...new Set((sentenceMatch[2].match(/KI-\d+/g) || []))].sort();
  const stateIds = [...new Set(state.resolved_issues.map((r) => r.id))].sort();

  assert.deepStrictEqual(
    namedIds, stateIds,
    `REPORT.md's "known issues closed" sentence names ${JSON.stringify(namedIds)}, but ` +
      `.swarm/state.json resolved_issues[] has ${JSON.stringify(stateIds)}`,
  );
  assert.strictEqual(
    WORD_NUMBERS[wordCount], stateIds.length,
    `REPORT.md's sentence says "${sentenceMatch[1]}" (${WORD_NUMBERS[wordCount]}) known issues closed, ` +
      `but .swarm/state.json resolved_issues[] has ${stateIds.length}`,
  );
});
