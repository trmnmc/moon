'use strict';

// T-215: REPORT.md states, twice, where the run-by-run provenance lives: the
// first-screen sentence (REPORT.md line ~3) and the closing italic (~line 108)
// both enumerate the `.swarm/REPORT-ARCHIVE-*.md` archive files, and the
// first-screen copy adds a self-relative clause ("except the most recent run,
// whose record sits in this file below until the next run archives it").
// Run 6's T-212 defect was exactly this rot: the first-screen pointer named
// ONE archive while the record lived in TWO, and the suite stayed green
// because nothing read the sentence. This file makes both copies
// machine-checked against the archive files that actually exist on disk and
// the run records actually present in the document.
//
// The predicate is deliberately a pure function of a SUPPLIED state,
// `{ reportText, archiveFilenames }` — it never reads the tree itself — so it
// can be answered about a pending edit BEFORE that edit lands. The live tree
// is just one call site among the table's cases, passing in the real
// REPORT.md text and the real `.swarm/` directory listing (discovered by
// listing, never from a literal list, or this gate would reproduce the rot it
// exists to catch). The enumerations are extracted structurally from each
// located sentence (backticked `.swarm/REPORT-ARCHIVE-*.md` paths) and
// compared as SETS — today's two archive dates and today's sentence wordings
// are nowhere a source of truth.
//
// On the self-relative clause: its checkable content is that exactly ONE
// run's record still sits in REPORT.md un-archived. That IS enforced
// structurally here, against the supplied text, via the run-record heading
// marker the document owns (`## Run N ...`, e.g. "## Run 6 (2026-08-20)") —
// not via a fragile prose detector. The parts of the clause the supplied
// state cannot decide are classified BOUNDARY below rather than faked.
//
// Classification of what this file does and does not enforce (HOLE / BOUNDARY,
// following the convention of test/report-issues.test.js):
//
//   HOLE — the first-screen pointer's enumerated archive set vs the supplied
//          on-disk set, in both directions: an archive on disk the sentence
//          does not name, and a named path with no file behind it, each go
//          red naming the specific path and the specific out-of-step copy.
//   HOLE — the closing italic's enumerated set, identically and
//          independently. The two copies are compared against disk one by
//          one, so either copy drifting alone (T-212's shape) is attributed
//          to that copy, not reported as a vague mismatch.
//   HOLE — the self-relative clause's structural content: exactly one
//          `## Run N` run-record heading in the supplied text. Zero (the
//          "sits in this file below" claim is then false) and two or more (a
//          run record added without archiving the previous one) both go red.
//   HOLE — vacuous green: a supplied state in which either pointer sentence
//          cannot be located, or locates ambiguously (two candidate lines),
//          or in which zero archive files are supplied, FAILS rather than
//          passing over nothing — fail-closed in both directions.
//   BOUNDARY — "archived in full, not deleted": whether the archives'
//          CONTENT genuinely carries each run's full provenance is not
//          decidable from a filename list plus a report text; REPORT.md's own
//          Run-6 record says of that shape that it "remains a human read".
//          Not compared, by design.
//   BOUNDARY — "until the next run archives it": a promise about a FUTURE
//          edit; no supplied present-state can witness it. Not checked.
//   BOUNDARY — that the one un-archived record below is genuinely the MOST
//          RECENT run: ranking recency against the archived runs would
//          require reading archive contents, which the supplied state
//          deliberately excludes (it is a filename list). The count is
//          enforced; the superlative is not.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'REPORT.md');
const SWARM_DIR = path.join(ROOT, '.swarm');

// A backticked repo-relative archive path, as both pointer sentences carry them.
const ARCHIVE_PATH_RE = /`(\.swarm\/REPORT-ARCHIVE-[^`]+\.md)`/g;
// The structural run-record marker the document owns: a "## Run N ..." heading.
const RUN_HEADING_RE = /^## Run \d+\b/;

const FIRST_LABEL = 'first-screen pointer';
const CLOSING_LABEL = 'closing italic pointer';

function extractArchivePaths(line) {
  return [...line.matchAll(ARCHIVE_PATH_RE)].map((m) => m[1]);
}

// The T-215 predicate. Pure function of the supplied state:
//   state.reportText       — the full text of a REPORT.md-shaped document
//   state.archiveFilenames — repo-relative paths of the .swarm/REPORT-ARCHIVE-*.md
//                            files that exist on disk in the state being asked about
// Returns an array of human-readable violation strings; [] means the two pointer
// copies and the run-record structure are consistent with that state. Throws
// TypeError on a malformed state (caller error, not a document violation).
function reportPointerViolations(state) {
  if (state === null || typeof state !== 'object') {
    throw new TypeError('report-pointer: state must be an object { reportText, archiveFilenames }');
  }
  const { reportText, archiveFilenames } = state;
  if (typeof reportText !== 'string') {
    throw new TypeError('report-pointer: state.reportText must be a string');
  }
  if (!Array.isArray(archiveFilenames) || archiveFilenames.some((f) => typeof f !== 'string')) {
    throw new TypeError('report-pointer: state.archiveFilenames must be an array of strings');
  }

  const violations = [];

  // Fail-closed on an empty archive set: an enumeration with nothing to
  // enumerate against must never render green.
  if (archiveFilenames.length === 0) {
    violations.push(
      'report-pointer: zero archive files supplied — an archive-pointer enumeration cannot be ' +
      'checked against nothing; fail-closed rather than vacuously green'
    );
  }
  const disk = [...new Set(archiveFilenames)].sort();

  const lines = reportText.split('\n');

  // Locate the first-screen pointer: the one preamble line (before the first
  // "## " heading) naming a backticked archive path.
  const firstHeadingIdx = lines.findIndex((l) => /^## /.test(l));
  const preamble = firstHeadingIdx === -1 ? lines : lines.slice(0, firstHeadingIdx);
  const firstCandidates = preamble.filter((l) => extractArchivePaths(l).length > 0);

  // Locate the closing italic: the one fully-italic line (*...*) naming a
  // backticked archive path. Other mentions of an archive path in plain prose
  // (e.g. a run record's own "detailed record is in ..." remark) are neither
  // pointer copy and are deliberately not read as one.
  const closingCandidates = lines.filter((l) => {
    const t = l.trim();
    return /^\*(?!\*).*\*$/.test(t) && extractArchivePaths(t).length > 0;
  });

  const pointers = [
    [FIRST_LABEL, firstCandidates, 'a line before the first "## " heading'],
    [CLOSING_LABEL, closingCandidates, 'a fully italic *...* line'],
  ];
  for (const [label, candidates, where] of pointers) {
    if (candidates.length === 0) {
      violations.push(
        `report-pointer: could not locate the ${label} sentence (${where} naming a backticked ` +
        '.swarm/REPORT-ARCHIVE-*.md path) — fail-closed: an unlocatable pointer is a violation, ' +
        'never a vacuous pass'
      );
      continue;
    }
    if (candidates.length > 1) {
      violations.push(
        `report-pointer: located ${candidates.length} candidate lines for the ${label} — ` +
        'exactly one is required; fail-closed on ambiguity'
      );
      continue;
    }
    const named = [...new Set(extractArchivePaths(candidates[0]))].sort();
    for (const p of disk) {
      if (!named.includes(p)) {
        violations.push(
          `report-pointer: the ${label} is out of step — it does not name \`${p}\`, ` +
          'which exists on disk'
        );
      }
    }
    for (const p of named) {
      if (!disk.includes(p)) {
        violations.push(
          `report-pointer: the ${label} names \`${p}\`, which does not exist on disk`
        );
      }
    }
  }

  // The self-relative clause's structural content: exactly one un-archived
  // run record ("## Run N" heading) sits in the document.
  const runHeadings = lines.filter((l) => RUN_HEADING_RE.test(l));
  if (runHeadings.length === 0) {
    violations.push(
      'report-pointer: the self-relative clause claims the most recent run\'s record sits in ' +
      'this file below, but zero "## Run N" run-record headings are present'
    );
  } else if (runHeadings.length > 1) {
    violations.push(
      `report-pointer: ${runHeadings.length} "## Run N" run-record headings are present — a ` +
      'run record was added without archiving the previous one; the pointers promise exactly ' +
      'one un-archived record'
    );
  }

  return violations;
}

// ---------------------------------------------------------------------------
// The live state: real document text, real directory listing. Discovered by
// listing .swarm/, never from a baked-in list of archive names.
// ---------------------------------------------------------------------------

const REPORT_RAW = fs.readFileSync(REPORT_PATH, 'utf8');
const LIVE_ARCHIVES = fs
  .readdirSync(SWARM_DIR)
  .filter((f) => /^REPORT-ARCHIVE-.+\.md$/.test(f))
  .map((f) => `.swarm/${f}`);

// ---------------------------------------------------------------------------
// Fixture builder for supplied states. The archive names are deliberately
// synthetic (1111/2222/3333) — nothing below leans on today's real dates.
// first/closing: arrays of archive paths to enumerate, or null to omit that
// pointer sentence entirely. runHeadings: how many "## Run N" records sit in
// the document body.
// ---------------------------------------------------------------------------

const A = '.swarm/REPORT-ARCHIVE-1111-11-11.md';
const B = '.swarm/REPORT-ARCHIVE-2222-22-22.md';
const C = '.swarm/REPORT-ARCHIVE-3333-33-33.md';

function fixtureDoc({ first = null, closing = null, runHeadings = 1 }) {
  const tick = (paths) => paths.map((p) => `\`${p}\``).join(' and ');
  const parts = ['# REPORT — fixture', ''];
  if (first !== null) {
    parts.push(
      `The full provenance is archived at ${tick(first)} — except the most recent run, ` +
      'whose record sits in this file below until the next run archives it.',
      ''
    );
  }
  parts.push('## What was built', '', 'Prose about the tool.', '');
  for (let i = 0; i < runHeadings; i += 1) {
    parts.push(`## Run ${7 + i} (2099-01-0${i + 1})`, '', 'The run record.', '');
  }
  parts.push('---', '');
  if (closing !== null) {
    parts.push(`*The cycle-by-cycle detail behind the sections above is in ${tick(closing)}, in full.*`, '');
  }
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Table-driven cases over SUPPLIED states. Each case pins the exact violation
// count and, for every expected violation, a pattern that must match exactly
// one of them — a case that merely counted violations could not tell a right
// answer from a coincidence.
// ---------------------------------------------------------------------------

const CASES = [
  {
    name: '(a) the live tree: real REPORT.md text against the real .swarm/ listing passes',
    state: () => ({ reportText: REPORT_RAW, archiveFilenames: LIVE_ARCHIVES }),
    expect: [],
  },
  {
    name: '(b) a third archive on disk named in NEITHER pointer is flagged by both copies, naming the path',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B], closing: [A, B] }),
      archiveFilenames: [A, B, C],
    }),
    expect: [
      /first-screen pointer is out of step — it does not name `\.swarm\/REPORT-ARCHIVE-3333-33-33\.md`, which exists on disk/,
      /closing italic pointer is out of step — it does not name `\.swarm\/REPORT-ARCHIVE-3333-33-33\.md`, which exists on disk/,
    ],
  },
  {
    name: '(c) third archive named in the first-screen sentence ONLY: the closing italic is the out-of-step copy',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B, C], closing: [A, B] }),
      archiveFilenames: [A, B, C],
    }),
    expect: [
      /closing italic pointer is out of step — it does not name `\.swarm\/REPORT-ARCHIVE-3333-33-33\.md`, which exists on disk/,
    ],
  },
  {
    name: '(d) mirror of (c): third archive named in the closing italic ONLY: the first-screen sentence is the out-of-step copy',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B], closing: [A, B, C] }),
      archiveFilenames: [A, B, C],
    }),
    expect: [
      /first-screen pointer is out of step — it does not name `\.swarm\/REPORT-ARCHIVE-3333-33-33\.md`, which exists on disk/,
    ],
  },
  {
    name: '(e) both pointers name an archive path that does NOT exist on disk: each copy is flagged',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B, C], closing: [A, B, C] }),
      archiveFilenames: [A, B],
    }),
    expect: [
      /first-screen pointer names `\.swarm\/REPORT-ARCHIVE-3333-33-33\.md`, which does not exist on disk/,
      /closing italic pointer names `\.swarm\/REPORT-ARCHIVE-3333-33-33\.md`, which does not exist on disk/,
    ],
  },
  {
    name: '(f1) first-screen pointer sentence absent entirely: fail-closed violation, not a pass',
    state: () => ({
      reportText: fixtureDoc({ first: null, closing: [A, B] }),
      archiveFilenames: [A, B],
    }),
    expect: [
      /could not locate the first-screen pointer sentence .*fail-closed/,
    ],
  },
  {
    name: '(f2) closing italic pointer sentence absent entirely: fail-closed violation, not a pass',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B], closing: null }),
      archiveFilenames: [A, B],
    }),
    expect: [
      /could not locate the closing italic pointer sentence .*fail-closed/,
    ],
  },
  {
    name: '(g) a second run record added without archiving the previous one is a violation',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B], closing: [A, B], runHeadings: 2 }),
      archiveFilenames: [A, B],
    }),
    expect: [
      /2 "## Run N" run-record headings are present — a run record was added without archiving the previous one/,
    ],
  },
  {
    name: '(h) zero run records: the "sits in this file below" claim is false, and flagged',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B], closing: [A, B], runHeadings: 0 }),
      archiveFilenames: [A, B],
    }),
    expect: [
      /zero "## Run N" run-record headings are present/,
    ],
  },
  {
    name: '(i) zero archives supplied: fail-closed, plus every named path is flagged as nonexistent',
    state: () => ({
      reportText: fixtureDoc({ first: [A, B], closing: [A, B] }),
      archiveFilenames: [],
    }),
    expect: [
      /zero archive files supplied .*fail-closed/,
      /first-screen pointer names `\.swarm\/REPORT-ARCHIVE-1111-11-11\.md`, which does not exist on disk/,
      /first-screen pointer names `\.swarm\/REPORT-ARCHIVE-2222-22-22\.md`, which does not exist on disk/,
      /closing italic pointer names `\.swarm\/REPORT-ARCHIVE-1111-11-11\.md`, which does not exist on disk/,
      /closing italic pointer names `\.swarm\/REPORT-ARCHIVE-2222-22-22\.md`, which does not exist on disk/,
    ],
  },
  {
    name: '(j) an empty document is every fail-closed violation at once, never green',
    state: () => ({ reportText: '', archiveFilenames: [A, B] }),
    expect: [
      /could not locate the first-screen pointer sentence .*fail-closed/,
      /could not locate the closing italic pointer sentence .*fail-closed/,
      /zero "## Run N" run-record headings are present/,
    ],
  },
];

for (const c of CASES) {
  test(`report-pointer ${c.name}`, () => {
    const violations = reportPointerViolations(c.state());
    assert.strictEqual(
      violations.length, c.expect.length,
      `expected ${c.expect.length} violation(s), got ${violations.length}:\n  - ${violations.join('\n  - ') || '(none)'}`
    );
    for (const pattern of c.expect) {
      const hits = violations.filter((v) => pattern.test(v));
      assert.strictEqual(
        hits.length, 1,
        `expected exactly one violation matching ${pattern}, got ${hits.length} in:\n  - ${violations.join('\n  - ') || '(none)'}`
      );
    }
  });
}

test('report-pointer self-check: the live .swarm/ listing and both live pointer locators found something real', () => {
  // Case (a) already fails if any of this drifts; this test exists so a
  // silently-empty discovery shows up as a named failing assertion, not an
  // absent one — the self-check shape of report-issues and gate-claims.
  assert.ok(
    LIVE_ARCHIVES.length > 0,
    '.swarm/ listing found zero REPORT-ARCHIVE-*.md files — the discovery is broken or the archives moved'
  );
  const firstHeadingIdx = REPORT_RAW.split('\n').findIndex((l) => /^## /.test(l));
  assert.ok(firstHeadingIdx > 0, 'REPORT.md has no "## " heading — the first-screen locator has nothing to bound');
});

test('report-pointer: a malformed supplied state is a caller TypeError, not a document violation', () => {
  assert.throws(() => reportPointerViolations(null), TypeError);
  assert.throws(() => reportPointerViolations({ reportText: 42, archiveFilenames: [] }), TypeError);
  assert.throws(() => reportPointerViolations({ reportText: '', archiveFilenames: 'not-a-list' }), TypeError);
  assert.throws(() => reportPointerViolations({ reportText: '', archiveFilenames: [null] }), TypeError);
});

// Exported so the conductor (or any caller) can answer the predicate about an
// ARBITRARY supplied state — e.g. this run's pending REPORT.md edit plus the
// archive file it is about to create — before that state exists on disk.
module.exports = { reportPointerViolations };
