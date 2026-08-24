'use strict';

// T-214: README.md and REPORT.md kept restating, in their own broader words, what
// individual test files enforce -- and the restatements drifted while the suite
// stayed green, because no guard read the restating document. The live specimen
// that motivated this file: REPORT.md said of test/report-issues.test.js that the
// two issue tables are machine-checked against .swarm/state.json -- "Edit them
// into disagreement and the suite goes red" -- while that test's own header names
// the status column a BOUNDARY it never compares, and the status cells were, at
// that moment, in real disagreement with state.json. A paraphrase of a rule is a
// second copy of the rule, and second copies rot.
//
// The mechanism, owned by the documents rather than by this file: REPORT.md
// carries a "## Claim registry" table (doc | key | test file | kind). This file
// sweeps BOTH documents for every mention of a *.test.js filename -- a structural
// property a newly added claim cannot avoid if it names the file it talks about --
// and fails on any mention no registry row accounts for. A row's key is a
// substring that must occur exactly once in its document; the row covers mentions
// from the key to the end of the enclosing table cell or paragraph.
//
// Classification of what this file does and does not enforce (HOLE / BOUNDARY,
// following the convention of test/report-issues.test.js):
//
//   HOLE -- a prose mention of a *.test.js file in either document with no
//          registry row covering it. The sweep is keyed to the structural shape
//          `name.test.js`, not to an enumeration of today's known passages, so a
//          ninth claim-about-a-test sentence naming an unregistered test file
//          goes red with no test edited.
//   HOLE -- a registry row that is dead weight: key absent, key ambiguous (found
//          more than once), naming a test file that does not exist in test/, or
//          covering no mention of its named file.
//   HOLE -- a `quote` row whose covered window carries a quoted span that is NOT
//          the named test file's own words verbatim (whitespace-normalized, `//`
//          comment markers stripped), or no quoted span near the mention at all.
//   HOLE -- a `pointer` row whose mention is not a bare pointer ("See <file>.",
//          "Regression at `<file>:N`.") -- a pointer names the file and asserts
//          nothing about the rule's content.
//   HOLE -- vacuous green: a sweep that locates zero mentions, or a registry that
//          parses to zero rows, FAILS rather than reporting nothing wrong (the
//          self-check pattern of test/citations.test.js and
//          test/doc-counts.test.js, applied here).
//
//   BOUNDARY -- rule-shaped prose that names NO test file is structurally
//          invisible to a filename-keyed sweep, and is declared out of scope
//          here rather than silently missed. The known instance: README.md's
//          "Timezone is pinned explicitly in every date-sensitive test" sentence
//          (under "## Tests") characterizes the suite while naming no file, so
//          this sweep cannot see it. REPORT.md's Run-6 remark that a false prose
//          completeness claim "remains a human read" is the same class.
//   BOUNDARY -- connective prose inside a registered span ("its own words:",
//          "checked by", "Pinned by") is not semantically policed; what is
//          policed is that every quoted span in the covered window is verbatim
//          from the named test file and at least one sits adjacent to the
//          mention. A sentence smuggled INSIDE an already-registered table cell
//          or paragraph, about the same test file, rides that row; a new
//          sentence anywhere else -- including any appended paragraph -- does
//          not, and goes red.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DOCS = ['README.md', 'REPORT.md'];
const REGISTRY_DOC = 'REPORT.md';
const REGISTRY_HEADING_RE = /^## Claim registry\s*$/;
const HEADER_CELLS = ['doc', 'key', 'test file', 'kind'];
const KINDS = new Set(['quote', 'pointer']);

// The structural sweep: any filename of the shape `name.test.js`, with or
// without a `test/` prefix. The suite-glob `test/*.test.js` in fenced commands
// does not match (no word characters before `.test.js`), so running the suite
// is not "a claim about a test file".
const TOKEN_RE = /(?:test\/)?[A-Za-z0-9_-]+\.test\.js/g;

function readDoc(name) {
  const p = path.join(ROOT, name);
  let raw;
  try {
    raw = fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`gate-claims: could not read ${name} at ${p}: ${err.message}`);
  }
  assert.ok(
    raw.trim().length > 0,
    `gate-claims: ${name} is empty -- nothing was swept, treating as failure per fail-closed rule`,
  );
  return raw;
}

function splitRow(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((cell) => cell.trim());
}

// Parse the "## Claim registry" table out of REPORT.md. Fails loudly -- never
// returns zero rows -- because a registry that silently parsed to nothing would
// let the coverage test below pass over an unaccounted document.
function parseRegistry(raw) {
  const lines = raw.split('\n');
  const headingIdx = lines.findIndex((l) => REGISTRY_HEADING_RE.test(l));
  assert.notStrictEqual(
    headingIdx, -1,
    'gate-claims: REPORT.md has no "## Claim registry" heading -- the registry the documents ' +
      'own is missing, so every claim-about-a-test passage is unaccounted for. Zero rows is a ' +
      'FAILURE, not an empty success.',
  );

  let i = headingIdx + 1;
  while (i < lines.length && !lines[i].trim().startsWith('|')) {
    assert.ok(
      !/^## /.test(lines[i]),
      'gate-claims: the "## Claim registry" section ends before any table was found',
    );
    i += 1;
  }
  assert.ok(i < lines.length, 'gate-claims: no table found under "## Claim registry"');

  const tableLineIdxs = new Set();
  const headerCells = splitRow(lines[i]);
  assert.deepStrictEqual(
    headerCells, HEADER_CELLS,
    `gate-claims: unexpected registry header at REPORT.md:${i + 1} -- got ` +
      `${JSON.stringify(headerCells)}, expected ${JSON.stringify(HEADER_CELLS)}`,
  );
  tableLineIdxs.add(i);
  i += 1;
  assert.ok(
    i < lines.length && /^\|[\s:-]+\|/.test(lines[i].trim()),
    `gate-claims: expected a markdown '---' separator row at REPORT.md:${i + 1}`,
  );
  tableLineIdxs.add(i);
  i += 1;

  const rows = [];
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const cells = splitRow(lines[i]);
    assert.strictEqual(
      cells.length, HEADER_CELLS.length,
      `gate-claims: registry row at REPORT.md:${i + 1} has ${cells.length} cells, expected ` +
        `${HEADER_CELLS.length}: ${lines[i]}`,
    );
    rows.push({ doc: cells[0], key: cells[1], file: cells[2], kind: cells[3], lineNo: i + 1 });
    tableLineIdxs.add(i);
    i += 1;
  }
  assert.ok(
    rows.length > 0,
    'gate-claims: the "## Claim registry" table parsed to ZERO rows -- a registry that ' +
      'accounts for nothing must fail rather than render the coverage check vacuously green',
  );
  return { rows, tableLineIdxs };
}

// Blank out the registry's own table lines (which necessarily name test files)
// so the sweep reads only the documents' prose, not the registry's bookkeeping.
// Character counts are preserved so offsets and line numbers stay true.
function maskLines(raw, idxSet) {
  return raw
    .split('\n')
    .map((line, idx) => (idxSet.has(idx) ? ' '.repeat(line.length) : line))
    .join('\n');
}

function lineAt(raw, index) {
  let n = 1;
  for (let i = 0; i < index; i += 1) if (raw[i] === '\n') n += 1;
  return n;
}

function sweep(raw, docName) {
  const out = [];
  for (const m of raw.matchAll(TOKEN_RE)) {
    out.push({
      doc: docName,
      text: m[0],
      base: path.posix.basename(m[0]),
      index: m.index,
      end: m.index + m[0].length,
      line: lineAt(raw, m.index),
    });
  }
  return out;
}

function assertSwept(occs) {
  assert.ok(
    occs.length > 0,
    'gate-claims: the sweep located zero *.test.js mentions across README.md and REPORT.md ' +
      '-- either every claim-about-a-test passage vanished or the sweep is broken; a parse ' +
      'that locates nothing must FAIL rather than report nothing wrong',
  );
}

// The end of the covered span: for a mention inside a markdown table row, the
// end of the enclosing cell (next '|'); for prose, the end of the enclosing
// block (blank line, list item, heading, table, or fence).
function chunkEnd(raw, from) {
  const lineStart = raw.lastIndexOf('\n', from - 1) + 1;
  let lineEnd = raw.indexOf('\n', from);
  if (lineEnd === -1) lineEnd = raw.length;
  if (raw.slice(lineStart, lineEnd).trimStart().startsWith('|')) {
    const nextPipe = raw.indexOf('|', from);
    return nextPipe === -1 || nextPipe > lineEnd ? lineEnd : nextPipe;
  }
  const stops = ['\n\n', '\n- ', '\n* ', '\n#', '\n|', '\n```'];
  let end = raw.length;
  for (const s of stops) {
    const at = raw.indexOf(s, from);
    if (at !== -1 && at < end) end = at;
  }
  return end;
}

function findAll(haystack, needle) {
  const out = [];
  let at = haystack.indexOf(needle);
  while (at !== -1) {
    out.push(at);
    at = haystack.indexOf(needle, at + 1);
  }
  return out;
}

// Coverage: every swept mention must sit inside some registry row's span, and
// that row must name the same test file. Returns human-readable violations.
function coverageViolations(occs, resolvedRows) {
  const violations = [];
  for (const occ of occs) {
    const covered = resolvedRows.some(
      (r) =>
        r.doc === occ.doc &&
        r.spanStart !== null &&
        occ.index >= r.spanStart &&
        occ.end <= r.spanEnd &&
        path.posix.basename(r.file) === occ.base,
    );
    if (!covered) {
      violations.push(
        `${occ.doc}:${occ.line} names ${occ.text} in prose, but no "## Claim registry" row in ` +
          `REPORT.md covers it. Every passage characterizing what a test file enforces must be ` +
          `registered there, as either a verbatim quote of that test's own words (kind: quote) ` +
          `or a bare pointer that asserts nothing (kind: pointer). Add a row whose key sits ` +
          `at or before this mention in the same paragraph or table cell.`,
      );
    }
  }
  return violations;
}

// Pointer discipline: the mention must be a bare pointer -- a "See"/"Regression
// at" lead-in opening a sentence, then the file (optionally :line), then a full
// stop. Anything else said about the file belongs in a quote row.
const POINTER_PRE_RE = /(?:^|[.!?]\s+|\|\s+|\n)\(?\s*(?:[Ss]ee|Regression at)\s+`?$/;
const POINTER_POST_RE = /^(?::\d+(?:-\d+)?)?`?\)?\.(?:\s|$)/;

function pointerProblem(raw, occ) {
  const pre = raw.slice(Math.max(0, occ.index - 60), occ.index);
  const post = raw.slice(occ.end, occ.end + 16);
  if (!POINTER_PRE_RE.test(pre)) {
    return (
      `the mention is not preceded by a bare pointer lead-in ("See ..." / "Regression at ..." ` +
      `opening a sentence); a pointer passage may not characterize the rule. Text before the ` +
      `mention: ${JSON.stringify(pre.slice(-40))}`
    );
  }
  if (!POINTER_POST_RE.test(post)) {
    return (
      `the pointer must stop at the file name (optionally :line) and a full stop, asserting ` +
      `nothing further. Text after the mention: ${JSON.stringify(post)}`
    );
  }
  return null;
}

// Quote discipline: every quoted span -- (`...`) or "..." -- in the covered
// window after the mention must be the named test file's own words, verbatim
// after whitespace normalization and comment-marker stripping, and at least one
// such span must sit adjacent to the mention.
const QUOTE_SPAN_RE = /\(`([^`]+)`\)|"([^"]+)"/g;

function norm(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function normalizedTestSource(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return norm(src.replace(/^\s*\/\/ ?/gm, ''));
}

function quoteProblems(raw, occ, testSrcNorm, rowFile) {
  const window = raw.slice(occ.end, chunkEnd(raw, occ.end));
  const spans = [];
  for (const m of window.matchAll(QUOTE_SPAN_RE)) {
    spans.push({ text: m[1] !== undefined ? m[1] : m[2], at: m.index });
  }
  const problems = [];
  if (!spans.some((s) => s.at <= 200)) {
    problems.push(
      `no quoted span -- (\`...\`) or "..." -- within 200 characters after the mention of ` +
        `${rowFile}; a quote row must carry the test's own words, not a paraphrase`,
    );
  }
  for (const s of spans) {
    if (!testSrcNorm.includes(norm(s.text))) {
      problems.push(
        `quoted span is not ${rowFile}'s own words verbatim (checked against its source with ` +
          `whitespace collapsed and // markers stripped): ${JSON.stringify(s.text)}`,
      );
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Live documents, scanned fresh on every run.
// ---------------------------------------------------------------------------

const README_RAW = readDoc('README.md');
const REPORT_RAW = readDoc(REGISTRY_DOC);
const REGISTRY = parseRegistry(REPORT_RAW);
const DOC_TEXT = {
  'README.md': README_RAW,
  'REPORT.md': maskLines(REPORT_RAW, REGISTRY.tableLineIdxs),
};
const OCCS = DOCS.flatMap((d) => sweep(DOC_TEXT[d], d));

// Resolve each row's key to a span in its document.
const RESOLVED_ROWS = REGISTRY.rows.map((row) => {
  const text = DOC_TEXT[row.doc];
  const hits = text === undefined ? [] : findAll(text, row.key);
  const spanStart = hits.length === 1 ? hits[0] : null;
  return {
    ...row,
    keyHits: hits.length,
    spanStart,
    spanEnd: spanStart === null ? null : chunkEnd(text, spanStart),
  };
});

function coveredBy(row) {
  if (row.spanStart === null) return [];
  return OCCS.filter(
    (occ) =>
      occ.doc === row.doc &&
      occ.index >= row.spanStart &&
      occ.end <= row.spanEnd &&
      occ.base === path.posix.basename(row.file),
  );
}

test('gate-claims self-check: the sweep located claim passages and the registry parsed rows', () => {
  // parseRegistry above already threw if the table was missing or empty; this
  // test exists so a silently-empty parse shows up as a named failing
  // assertion, not an absent one -- same shape as report-issues' self-check.
  assert.ok(REGISTRY.rows.length > 0, 'registry parsed to zero rows');
  assertSwept(OCCS);
  assert.ok(
    OCCS.some((o) => o.doc === 'REPORT.md'),
    'gate-claims: zero *.test.js mentions located in REPORT.md prose -- REPORT.md is known to ' +
      'characterize several tests; a sweep that sees none of them is broken, not clean',
  );
});

test('gate-claims: registry rows are well-formed and name real test files', () => {
  const problems = [];
  for (const row of REGISTRY.rows) {
    if (!DOCS.includes(row.doc)) {
      problems.push(`REPORT.md:${row.lineNo}: doc "${row.doc}" is not one of ${DOCS.join(', ')}`);
    }
    if (!KINDS.has(row.kind)) {
      problems.push(`REPORT.md:${row.lineNo}: kind "${row.kind}" is not "quote" or "pointer"`);
    }
    if (!/^test\/[A-Za-z0-9_-]+\.test\.js$/.test(row.file)) {
      problems.push(`REPORT.md:${row.lineNo}: test file "${row.file}" is not a test/*.test.js path`);
    } else if (!fs.existsSync(path.join(ROOT, row.file))) {
      problems.push(
        `REPORT.md:${row.lineNo}: test file "${row.file}" does not exist -- a registry row must ` +
          `name a real test, or it launders a claim against nothing`,
      );
    }
    if (row.key.length < 6) {
      problems.push(
        `REPORT.md:${row.lineNo}: key ${JSON.stringify(row.key)} is too short to be a reliable ` +
          `unique locator`,
      );
    }
  }
  assert.deepStrictEqual(problems, [], `gate-claims: malformed registry rows:\n  - ${problems.join('\n  - ')}`);
});

test('gate-claims: every registry key locates exactly one passage and covers a mention of its test file', () => {
  const problems = [];
  for (const row of RESOLVED_ROWS) {
    if (row.keyHits !== 1) {
      problems.push(
        `REPORT.md:${row.lineNo}: key ${JSON.stringify(row.key)} occurs ${row.keyHits} times in ` +
          `${row.doc} (registry table excluded) -- it must occur exactly once to name one passage`,
      );
      continue;
    }
    if (coveredBy(row).length === 0) {
      problems.push(
        `REPORT.md:${row.lineNo}: key ${JSON.stringify(row.key)} covers no mention of ` +
          `${row.file} in ${row.doc} -- a registry row with no passage is stale and must be ` +
          `removed or fixed, not left to imply coverage`,
      );
    }
  }
  assert.deepStrictEqual(problems, [], `gate-claims: dead registry rows:\n  - ${problems.join('\n  - ')}`);
});

test('gate-claims: every prose mention of a test file in README.md and REPORT.md is registered', () => {
  const violations = coverageViolations(OCCS, RESOLVED_ROWS);
  assert.deepStrictEqual(
    violations, [],
    `gate-claims: unregistered claim-about-a-test passage(s):\n  - ${violations.join('\n  - ')}`,
  );
});

test('gate-claims: quote rows carry the named test file\'s own words, verbatim', () => {
  const problems = [];
  for (const row of RESOLVED_ROWS) {
    if (row.kind !== 'quote' || row.spanStart === null) continue;
    if (!fs.existsSync(path.join(ROOT, row.file))) continue; // reported by the well-formed test
    const srcNorm = normalizedTestSource(row.file);
    for (const occ of coveredBy(row)) {
      for (const p of quoteProblems(DOC_TEXT[row.doc], occ, srcNorm, row.file)) {
        problems.push(`${row.doc}:${occ.line} (registry row REPORT.md:${row.lineNo}): ${p}`);
      }
    }
  }
  assert.deepStrictEqual(problems, [], `gate-claims: quote-row violations:\n  - ${problems.join('\n  - ')}`);
});

test('gate-claims: pointer rows name the file and assert nothing about the rule', () => {
  const problems = [];
  for (const row of RESOLVED_ROWS) {
    if (row.kind !== 'pointer' || row.spanStart === null) continue;
    for (const occ of coveredBy(row)) {
      const p = pointerProblem(DOC_TEXT[row.doc], occ);
      if (p) problems.push(`${row.doc}:${occ.line} (registry row REPORT.md:${row.lineNo}): ${p}`);
    }
  }
  assert.deepStrictEqual(problems, [], `gate-claims: pointer-row violations:\n  - ${problems.join('\n  - ')}`);
});

// ---------------------------------------------------------------------------
// Unit-level fixtures: prove the detector itself is sound, independent of what
// today's documents happen to say -- the pattern of doc-counts' RED/GREEN
// fixture tests.
// ---------------------------------------------------------------------------

test('sweep fixture: RED -- a new sentence naming an unregistered test file is located', () => {
  const doc = 'Benign paragraph.\n\nAnd `test/imaginary.test.js` guarantees the moon is cheese.\n';
  const occs = sweep(doc, 'fixture.md');
  assert.strictEqual(occs.length, 1, `expected exactly one located mention, got ${occs.length}`);
  assert.strictEqual(occs[0].base, 'imaginary.test.js');
  const violations = coverageViolations(occs, []);
  assert.strictEqual(violations.length, 1, 'an unregistered mention must be a violation');
  assert.match(violations[0], /no "## Claim registry" row/);
});

test('sweep fixture: GREEN control -- a registered mention is not a violation', () => {
  const doc = 'See `test/imaginary.test.js`.\n';
  const occs = sweep(doc, 'fixture.md');
  assert.strictEqual(occs.length, 1);
  const row = {
    doc: 'fixture.md',
    key: 'See',
    file: 'test/imaginary.test.js',
    kind: 'pointer',
    spanStart: 0,
    spanEnd: chunkEnd(doc, 0),
  };
  assert.deepStrictEqual(coverageViolations(occs, [row]), []);
  assert.strictEqual(pointerProblem(doc, occs[0]), null, 'a bare pointer must pass the pointer check');
});

test('sweep fixture: the suite glob in a fenced command is not a claim about a test file', () => {
  assert.deepStrictEqual(sweep('```sh\nnode --test test/*.test.js\n```\n', 'fixture.md'), []);
});

test('pointer fixture: a characterizing sentence fails the pointer check', () => {
  const doc = 'The moon is always full according to `test/imaginary.test.js`.\n';
  const occs = sweep(doc, 'fixture.md');
  assert.strictEqual(occs.length, 1);
  const p = pointerProblem(doc, occs[0]);
  assert.ok(p !== null, 'a sentence that characterizes must not pass as a bare pointer');
  assert.match(p, /not preceded by a bare pointer lead-in/);
});

test('quote fixture: a fabricated quote fails, the test\'s own words pass', () => {
  // Use THIS file as the quoted source -- no mock needed.
  const srcNorm = normalizedTestSource('test/gate-claims.test.js');
  const good = 'Checked by `test/gate-claims.test.js` ("second copies rot").\n';
  // Built by concatenation so this fabricated quote is not itself a contiguous
  // string in this file's own source (which is the quoted-source under test).
  const bad =
    'Checked by `test/gate-claims.test.js` ("the moon is made of ' + 'green cheese, per this file").\n';
  const goodOcc = sweep(good, 'fixture.md')[0];
  const badOcc = sweep(bad, 'fixture.md')[0];
  assert.deepStrictEqual(quoteProblems(good, goodOcc, srcNorm, 'test/gate-claims.test.js'), []);
  const problems = quoteProblems(bad, badOcc, srcNorm, 'test/gate-claims.test.js');
  assert.strictEqual(problems.length, 1);
  assert.match(problems[0], /not test\/gate-claims\.test\.js's own words verbatim/);
});

test('fail-closed fixture: a sweep that locates nothing must fail, never report a clean scan', () => {
  assert.throws(() => assertSwept([]), /located zero .*mentions/);
  assert.throws(
    () => parseRegistry('# a document\n\nwith no registry heading at all\n'),
    /no "## Claim registry" heading/,
  );
  assert.throws(
    () =>
      parseRegistry(
        '## Claim registry\n\n| doc | key | test file | kind |\n|---|---|---|---|\n\nno rows.\n',
      ),
    /ZERO rows/,
  );
});
