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
const os = require('node:os');
const { execFileSync } = require('node:child_process');

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
// T-211: anchor-PRESENCE (above) is necessary but not sufficient. REPORT.md
// shipped "- Suite at cycle 104: 208 tests, 208 passing." from cycle 105
// through cycle 106 -- it sailed straight through every test above because it
// DID name an anchor (cycle 104); the anchor was just glued to the wrong
// number (cycle 104's commit actually reads 210/210, not 208/208). The header
// comment above used to claim "there is no non-recursive way for a test in
// this suite to learn the suite's OWN runtime test count" and treated that as
// a reason a count claim could never be machine-verified for TRUTH, only for
// shape. That premise is too strong for any claim that names a PAST cycle:
// the conductor proved at cycle 106 (by hand, ~4s/commit) that a past cycle's
// real count is recoverable by resolving "cycle N" to a commit via this
// repo's own `cycle N:` commit-message convention, checking that commit out
// into a worktree, and running the suite there. This section packages that
// exact technique as a shipped test, scoped to the one claim SHAPE that has
// actually caused the defect three times: a bullet that opens with the word
// "Suite" and states its count at a named cycle.
//
// Scope, deliberately narrow: only bullets/list items that OPEN with "Suite"
// are treated as claims about a real commit's real suite state. Other
// count-shaped mentions elsewhere in this document are NOT re-derived against
// git history, because they are not claims about a commit's real state --
// e.g. the mutation-testing row further down ("...the suite reads 147 tests /
// 146 pass..." against a *throwaway mutated scratch copy*, deliberately
// different from any real commit) would be a false positive if matched by a
// looser "any cycle number near any test count" scan. Verified empirically:
// see the "positive engagement" test below, which confirms this scope finds
// exactly the claim it is meant to find in the live document and nothing
// else.
//
// Hazards handled here (see also the report-back for this item):
//   - Recursion: a worktree's suite is run as a CHILD process with
//     MOON_DOC_COUNTS_DEPTH incremented. Once DEPTH reaches
//     MAX_RECURSION_DEPTH, this file's own live-document checks stop
//     spawning further children -- they still run (so a nested run's overall
//     tests/pass totals are unaffected -- see below), they just skip the part
//     that would spawn a grandchild, and say so loudly via console.log so the
//     skip is visible in output rather than silently indistinguishable from
//     "checked, found nothing wrong". A `return` (not `test.skip`) is used
//     deliberately: `test.skip` would move this test out of the "pass" bucket
//     and into "skipped", which would make a nested run's own `# pass` count
//     diverge from what a normal, non-recursive run of that same commit
//     would report -- corrupting the very number an OUTER run is trying to
//     verify. A plain early return keeps the test in the "pass" bucket while
//     still being loud on stdout about why no further recursion happened.
//   - Cost: MAX_COMMITS_PER_RUN bounds how many distinct commits a single
//     suite run will ever worktree+measure. The live document needs exactly
//     2 today (cycle 104, cycle 105); crossing the bound fails loudly rather
//     than silently checking only some claims.
//   - Shallow clones (CI default is fetch-depth 1): detected via
//     `git rev-parse --is-shallow-repository`. When true, historical commits
//     the live document names may simply not exist locally, so this test
//     calls `t.skip(...)` with an explicit reason -- visibly a skip, not a
//     pass -- rather than silently reporting zero violations. `ci.yml` has
//     also been given `fetch-depth: 0` (see report) so this path should not
//     normally trigger in CI; it remains as a defense-in-depth honest
//     degradation, not the primary fix.
//   - Cleanup: every worktree is created under `os.tmpdir()` (outside this
//     repo) and removed in a `finally`, including on throw.
// ---------------------------------------------------------------------------

const MAX_RECURSION_DEPTH = 1; // a normal (depth 0) run may spawn and measure
// depth-1 children; depth-1 children do not themselves spawn depth-2 children.
const DEPTH = parseInt(process.env.MOON_DOC_COUNTS_DEPTH || '0', 10);
const MAX_COMMITS_PER_RUN = 6; // hard cap on distinct commits a single run
// will ever worktree+measure. Today's live document needs exactly 2.

// Node's OWN `--test` runner marks child test-file processes it spawns
// internally via NODE_TEST_CONTEXT / NODE_TEST_WORKER_ID. If those leak into
// a `node --test` we spawn ourselves (they inherit through `...process.env`
// like anything else), the grandchild sees them, assumes it IS one of
// node's own internal recursive workers already, prints "run() is being
// called recursively within a test file. skipping running files", and exits
// having run nothing -- silently producing no TAP summary at all. Discovered
// empirically while building this (see report-back). Strip them so our
// child is treated as a fresh, independent `node --test` invocation.
function childEnv(extra) {
  const env = { ...process.env, ...extra };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return env;
}

function isShallowClone() {
  try {
    const out = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    return out === 'true';
  } catch {
    return false; // can't tell from here; the git calls below will surface their own errors
  }
}

// Resolve a `cycle N` claim to the commit that introduced it, via this repo's
// own commit-message convention -- never a sha printed in prose (that is a
// separate thing worth cross-checking, not a source of truth). Returns an
// array of matching full shas so the caller can fail closed on 0 (unresolved)
// or >1 (ambiguous) rather than silently guessing.
function resolveCycleCommits(cycleNum) {
  const out = execFileSync(
    'git', ['log', '--grep', `^cycle ${cycleNum}:`, '--format=%H'],
    { cwd: ROOT, encoding: 'utf8' },
  ).trim();
  return out.length ? out.split('\n') : [];
}

// Check out `sha` into a throwaway worktree OUTSIDE this repo, run this
// repo's own suite there as a depth-bounded child process, and parse its TAP
// summary. Always cleans up the worktree, even on throw.
function measureSuiteAt(sha) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-doc-counts-'));
  let added = false;
  try {
    execFileSync('git', ['worktree', 'add', '--detach', tmpDir, sha], { cwd: ROOT, encoding: 'utf8' });
    added = true;
    const testDir = path.join(tmpDir, 'test');
    const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js')).map((f) => path.join(testDir, f));
    let stdout;
    try {
      stdout = execFileSync(
        'node',
        ['--test', '--test-reporter=tap', '--test-reporter-destination=stdout', ...files],
        {
          cwd: tmpDir,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          env: childEnv({ MOON_DOC_COUNTS_DEPTH: String(DEPTH + 1) }),
        },
      );
    } catch (err) {
      // node --test exits non-zero when any test fails -- we still want its TAP summary.
      stdout = `${err.stdout || ''}`;
    }
    const testsMatch = stdout.match(/^# tests (\d+)/m);
    const passMatch = stdout.match(/^# pass (\d+)/m);
    if (!testsMatch || !passMatch) {
      throw new Error(
        `doc-counts: could not parse a TAP summary from \`node --test\` at commit ${sha} -- tail of output:\n${stdout.slice(-2000)}`,
      );
    }
    return { tests: parseInt(testsMatch[1], 10), pass: parseInt(passMatch[1], 10) };
  } finally {
    if (added) {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', tmpDir], { cwd: ROOT, encoding: 'utf8' });
      } catch {
        // best-effort; the rmSync below still clears the directory
      }
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}

// Find every "Suite ..." bullet in `text` and extract the (cycle, tests,
// passing) triples it claims. A bullet may state MORE THAN ONE claim
// separated by ';' (REPORT.md's real "... at cycle 104 ...; ... at cycle
// 105 ..." line does exactly this), so each ';'-delimited clause inside the
// bullet is scanned independently. Within a clause, the "cycle N" NEAREST
// (by character distance) to the test-count number is the one paired with
// it -- needed because REPORT.md's "On that annotation" paragraph (not a
// "Suite" bullet, so out of scope here, but the same shape could recur)
// mentions two different cycles in one sentence, only one of which dates the
// number.
function extractSuiteClaims(text) {
  const claims = [];
  const bulletRe = /(^|\n)([ \t]*[-*][ \t]+Suite\b[^\n]*(?:\n(?![ \t]*[-*][ \t]|[ \t]*\n|#)[^\n]*)*)/gm;
  let bm;
  while ((bm = bulletRe.exec(text)) !== null) {
    const region = bm[2];
    let lastIndex = 0;
    const clauses = [];
    const clauseRe = /;/g;
    let cm;
    while ((cm = clauseRe.exec(region)) !== null) {
      clauses.push(region.slice(lastIndex, cm.index));
      lastIndex = cm.index + 1;
    }
    clauses.push(region.slice(lastIndex));

    for (const clause of clauses) {
      const cycleMatches = [...clause.matchAll(/\bcycle\s+(\d+)\b/gi)];
      const testsMatch = clause.match(/\b(\d+)\s+tests?\b/i);
      if (cycleMatches.length === 0 || !testsMatch) continue;
      let nearest = cycleMatches[0];
      let nearestDist = Math.abs(cycleMatches[0].index - testsMatch.index);
      for (const cmm of cycleMatches) {
        const d = Math.abs(cmm.index - testsMatch.index);
        if (d < nearestDist) {
          nearest = cmm;
          nearestDist = d;
        }
      }
      const passMatch = clause.match(/\b(\d+)\s+pass(?:ing|ed)?\b/i);
      claims.push({
        cycle: parseInt(nearest[1], 10),
        testsClaimed: parseInt(testsMatch[1], 10),
        passClaimed: passMatch ? parseInt(passMatch[1], 10) : null,
        snippet: clause.trim(),
      });
    }
  }
  return claims;
}

// Measurements are cached by sha at MODULE scope (not per-call) -- this test
// file calls verifyClaims() from several places (the RED proof, the GREEN
// control, and the live-document checks), and cycle 104 / cycle 105 recur
// across them. Without a shared cache a single `node --test` of this file
// alone would worktree+measure the same commits repeatedly (observed: 5
// spawns, ~22s, before this cache was added); with it, each distinct commit
// is measured at most once per process (observed after: 2 spawns, ~9s) --
// this is itself part of the cost bound, not just an optimization.
const measureCache = new Map();

// Verify each claim against the real commit its cycle names. Returns a list
// of violations -- empty means every claim checked out true.
function verifyClaims(claims) {
  const violations = [];
  for (const claim of claims) {
    const shas = resolveCycleCommits(claim.cycle);
    if (shas.length !== 1) {
      violations.push({
        ...claim,
        reason:
          shas.length === 0
            ? `no commit matches \`git log --grep '^cycle ${claim.cycle}:'\` -- either a typo, or this names a ` +
              `cycle that has not been committed yet and should not assert a definite count until it has`
            : `${shas.length} commits match \`git log --grep '^cycle ${claim.cycle}:'\` (ambiguous): ${shas.join(', ')}`,
      });
      continue;
    }
    const sha = shas[0];
    let measured = measureCache.get(sha);
    if (!measured) {
      measured = measureSuiteAt(sha);
      measureCache.set(sha, measured);
    }
    const testsOk = measured.tests === claim.testsClaimed;
    const passOk = claim.passClaimed === null || measured.pass === claim.passClaimed;
    if (!testsOk || !passOk) {
      violations.push({
        ...claim,
        sha,
        measured,
        reason:
          `claims ${claim.testsClaimed} tests` +
          (claim.passClaimed !== null ? `/${claim.passClaimed} passing` : '') +
          ` at cycle ${claim.cycle} (commit ${sha}), but that commit actually measures ` +
          `${measured.tests} tests/${measured.pass} passing`,
      });
    }
  }
  return violations;
}

function formatClaimViolations(violations) {
  return violations.map((v) => `  cycle ${v.cycle}: ${v.reason}\n    from: ${JSON.stringify(v.snippet)}`).join('\n');
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

// ---------------------------------------------------------------------------
// T-211: extraction unit test -- proves extractSuiteClaims reads the actual
// claim shape correctly, independent of git, before anything below trusts it
// to hand real cycle numbers to real worktree measurements.
// ---------------------------------------------------------------------------

test('extractSuiteClaims: parses a semicolon-joined "Suite ..." bullet into independent (cycle, tests, passing) claims', () => {
  const text = [
    '- T-206 (cycle 103): unrelated bullet, not a Suite claim, must not be picked up.',
    '- Suite size, measured directly: 210 tests / 210 passing at cycle 104 (commit `ecdbcb8`); 208 tests / 208 passing at cycle 105 (this commit). Trailing prose that mentions no further numbers.',
  ].join('\n');

  const claims = extractSuiteClaims(text);
  assert.strictEqual(claims.length, 2, `expected exactly 2 claims, got ${claims.length}: ${JSON.stringify(claims)}`);
  assert.deepStrictEqual(
    claims.map((c) => [c.cycle, c.testsClaimed, c.passClaimed]),
    [[104, 210, 210], [105, 208, 208]],
  );
});

test('extractSuiteClaims: a non-"Suite" bullet or prose sentence naming a cycle and a count is ignored', () => {
  // Mirrors the real mutation-testing table row and "On that annotation" prose in
  // REPORT.md today: both name a cycle near a test count, but neither is a claim
  // about a real commit's real suite state, and neither starts with "Suite".
  const text = [
    '| id | note |',
    '|---|---|',
    '| A | with the new test present the suite reads 147 tests / 146 pass (cycle 47, re-run cycle 58) |',
  ].join('\n');
  assert.deepStrictEqual(extractSuiteClaims(text), []);
});

// ---------------------------------------------------------------------------
// T-211: RED / GREEN-control proof for the truth-checker itself, run against
// THIS repo's REAL git history (ecdbcb8 / 549af12 are real commits already in
// this repo, so this is not a mock -- it is the exact conductor technique,
// exercised for real). Skipped, loudly, past the recursion bound or under a
// shallow clone for the same reasons the live-document tests below are.
// ---------------------------------------------------------------------------

test('verifyClaims: RED -- flags the exact pre-cycle-106 false line ("- Suite at cycle 104: 208 tests, 208 passing.")', (t) => {
  if (DEPTH >= MAX_RECURSION_DEPTH) {
    console.log(`[doc-counts] MOON_DOC_COUNTS_DEPTH=${DEPTH} >= ${MAX_RECURSION_DEPTH}: RED proof skipped by design (recursion bound)`);
    return;
  }
  if (isShallowClone()) {
    t.skip('shallow git clone -- cannot resolve cycle 104 to a commit to run this proof against real history');
    return;
  }
  const falseText = '- Suite at cycle 104: 208 tests, 208 passing.';
  const claims = extractSuiteClaims(falseText);
  assert.strictEqual(claims.length, 1);
  assert.deepStrictEqual([claims[0].cycle, claims[0].testsClaimed, claims[0].passClaimed], [104, 208, 208]);

  const violations = verifyClaims(claims);
  assert.strictEqual(
    violations.length, 1,
    `expected the false claim to be flagged, got ${violations.length} violations: ${formatClaimViolations(violations)}`,
  );
  assert.match(violations[0].reason, /actually measures 210 tests\/210 passing/);
});

test('verifyClaims: GREEN control -- a prose-only reword of the corrected line is NOT flagged (not a snapshot test)', (t) => {
  if (DEPTH >= MAX_RECURSION_DEPTH) {
    console.log(`[doc-counts] MOON_DOC_COUNTS_DEPTH=${DEPTH} >= ${MAX_RECURSION_DEPTH}: GREEN-control proof skipped by design (recursion bound)`);
    return;
  }
  if (isShallowClone()) {
    t.skip('shallow git clone -- cannot resolve cycle 104/105 to commits to run this proof against real history');
    return;
  }
  // Same two real claims (cycle 104 -> 210/210, cycle 105 -> 208/208), entirely
  // reworded prose, different punctuation and ordering of the qualifier clause.
  // If this test failed on a wording change alone, it would be a snapshot test
  // masquerading as an assertion -- it must only fail when a NUMBER is wrong.
  const reworded =
    '- Suite headcount, re-measured straight off the commits themselves rather than assumed: ' +
    '210 tests, 210 passing, as of cycle 104 (commit `ecdbcb8`); 208 tests, 208 passing, as of ' +
    'cycle 105 (this very commit). Nothing about coverage regressed -- some archived prose simply ' +
    "moved to another file, which is why the two totals don't match.";
  const claims = extractSuiteClaims(reworded);
  assert.strictEqual(claims.length, 2, `expected 2 claims from the reworded text, got: ${JSON.stringify(claims)}`);

  const violations = verifyClaims(claims);
  assert.deepStrictEqual(
    violations, [],
    `a truthful reword must not be flagged, but got: ${formatClaimViolations(violations)}`,
  );
});

// ---------------------------------------------------------------------------
// T-211: recursion-bound proof -- a depth-1 child spawned on THIS repo's own
// current tree must not itself spawn a depth-2 grandchild. Run for real (a
// real child process, real env var), not asserted by reading the source.
// ---------------------------------------------------------------------------

test('MOON_DOC_COUNTS_DEPTH bounds recursion: a depth-1 run does not spawn a depth-2 child', () => {
  // This test itself spawns a child -- it must only do so from depth 0, or a
  // depth-1 run of this same file (spawned by the block below, or by a real
  // historical-claim measurement) would spawn a depth-2 grandchild here,
  // which is exactly the unbounded recursion this whole mechanism exists to
  // prevent. Depth >= MAX_RECURSION_DEPTH: skip spawning, loudly, same as
  // every other depth-gated check in this file.
  if (DEPTH >= MAX_RECURSION_DEPTH) {
    console.log(`[doc-counts] MOON_DOC_COUNTS_DEPTH=${DEPTH} >= ${MAX_RECURSION_DEPTH}: recursion-bound self-proof skipped by design (recursion bound)`);
    return;
  }
  const start = Date.now();
  const out = execFileSync(
    'node', ['--test', '--test-reporter=tap', '--test-reporter-destination=stdout', __filename],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: childEnv({ MOON_DOC_COUNTS_DEPTH: '1' }),
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const elapsedMs = Date.now() - start;
  // At depth 0 the RED/GREEN/live checks above each spawn a real worktree
  // (~4s each). At depth 1 they must all short-circuit instead -- so the
  // whole file re-run should finish in well under one worktree's worth of
  // time. This is a real timing measurement, not a mock: if the depth guard
  // were removed, this assertion would fail (this file would recurse and
  // take 4s+ per level instead).
  assert.ok(
    elapsedMs < 3000,
    `a depth-1 run of this file took ${elapsedMs}ms -- expected well under 3000ms if recursion was ` +
      `correctly bounded (no worktrees spawned); it likely spawned a depth-2 child instead`,
  );
  assert.match(out, /# fail 0/, `depth-1 run of this file should still be fully green:\n${out.slice(-1500)}`);
  const depthNotices = (out.match(/MOON_DOC_COUNTS_DEPTH=1 >= 1: .* skipped by design \(recursion bound\)/g) || []).length;
  assert.ok(
    depthNotices >= 1,
    `expected at least one loud "skipped by design (recursion bound)" notice in depth-1 output, saw none:\n${out.slice(-1500)}`,
  );
});

// ---------------------------------------------------------------------------
// T-211: the live documents, scanned and TRUTH-checked fresh on every run.
// This is the shipped, stronger guarantee: not just "this claim names an
// anchor" (above) but "this claim is TRUE at the anchor it names".
// ---------------------------------------------------------------------------

test('REPORT.md actually contains a "Suite ..." claim for the checks below to have exercised (positive-engagement control)', () => {
  const raw = readDocOrThrow(REPORT_PATH, 'REPORT.md');
  const claims = extractSuiteClaims(raw);
  assert.ok(
    claims.length > 0,
    'doc-counts: no "Suite ..." bullet found in REPORT.md at all -- either the extractor is broken, or the ' +
      'summary line this section exists to police has been removed/reworded past recognition; either way the ' +
      '"REPORT.md Suite claims are true" test below would be passing vacuously',
  );
});

test("REPORT.md's \"Suite ...\" bullet(s) state a count that is TRUE at the cycle/commit they name", (t) => {
  if (DEPTH >= MAX_RECURSION_DEPTH) {
    console.log(`[doc-counts] MOON_DOC_COUNTS_DEPTH=${DEPTH} >= ${MAX_RECURSION_DEPTH}: REPORT.md truth-check skipped by design (recursion bound)`);
    return;
  }
  const raw = readDocOrThrow(REPORT_PATH, 'REPORT.md');
  const claims = extractSuiteClaims(raw);
  if (claims.length === 0) return; // nothing of this shape to verify

  if (claims.length > MAX_COMMITS_PER_RUN) {
    assert.fail(
      `doc-counts: ${claims.length} "Suite ..." claims found, exceeding the deliberate MAX_COMMITS_PER_RUN=` +
        `${MAX_COMMITS_PER_RUN} cost bound -- raise the constant deliberately if this is legitimate growth, ` +
        `rather than letting the extra claims go unverified`,
    );
  }
  if (isShallowClone()) {
    t.skip(
      `shallow git clone detected (\`git rev-parse --is-shallow-repository\`) -- cannot resolve the ${claims.length} ` +
        `cycle-named commit(s) this document's "Suite ..." claim(s) need to verify against; this is a SKIP, not a ` +
        `pass. CI should run with full history (see .github/workflows/ci.yml fetch-depth) for this guarantee to hold`,
    );
    return;
  }

  const violations = verifyClaims(claims);
  assert.deepStrictEqual(violations, [], `REPORT.md has a false "Suite ..." claim:\n${formatClaimViolations(violations)}`);
});

test("README.md's \"Suite ...\" bullet(s), if any, state a count that is TRUE at the cycle/commit they name", (t) => {
  if (DEPTH >= MAX_RECURSION_DEPTH) {
    console.log(`[doc-counts] MOON_DOC_COUNTS_DEPTH=${DEPTH} >= ${MAX_RECURSION_DEPTH}: README.md truth-check skipped by design (recursion bound)`);
    return;
  }
  const raw = readDocOrThrow(README_PATH, 'README.md');
  const claims = extractSuiteClaims(raw);
  if (claims.length === 0) return; // README.md carries no such claim today -- scanned anyway, fail-closed for the future

  if (claims.length > MAX_COMMITS_PER_RUN) {
    assert.fail(
      `doc-counts: ${claims.length} "Suite ..." claims found in README.md, exceeding MAX_COMMITS_PER_RUN=${MAX_COMMITS_PER_RUN}`,
    );
  }
  if (isShallowClone()) {
    t.skip('shallow git clone -- cannot resolve README.md\'s cycle-named commit(s) to verify against');
    return;
  }

  const violations = verifyClaims(claims);
  assert.deepStrictEqual(violations, [], `README.md has a false "Suite ..." claim:\n${formatClaimViolations(violations)}`);
});
