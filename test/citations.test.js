'use strict';

// README.md and REPORT.md cite the code by `file:line`. Those citations are
// hand-written and the code moves underneath them, so a citation decays silently:
// the document keeps naming a line number that now points at a blank line, a
// closing brace, or a different test entirely. Nothing detected that before this
// file. (Run 5 already shipped the mirror image of this check -- test comments that
// cite README line numbers -- but nothing walked the arrow in this direction.)
//
// What this file does, in one sentence: find EVERY `file:line` citation the two
// documents make into this repo's code, resolve it, and assert the cited line
// genuinely contains what the sentence around it says it contains.
//
// The three citation FORMS in use are not uniform, and a path-anchored regex alone
// silently reads only the first of them:
//
//   FORM 1  backticked path      `src/astro.js:358`, `test/render.test.js:829`
//   FORM 2  bare shorthand       `:281`, `:346`  -- a line number with NO path,
//                                inheriting the file from the nearest preceding
//                                path citation in the same table cell / paragraph
//   FORM 3  bare filename+range  (astro.js:71-74) -- no backticks, no directory
//                                prefix, a RANGE rather than a single line
//
// Rather than trust that list, the scanner below is fail-closed by construction:
// it sweeps EVERY `:<digits>` token in both documents, classifies each one as
// either a clock time (the colon is preceded by a digit -- `18:14`, `04:18:25`)
// or a citation, and FAILS on anything it cannot account for. A fourth form
// appearing tomorrow goes red rather than going unread. Likewise a citation the
// scanner finds but cannot attach a substantive claim to is a FAILURE, not a skip:
// a skipped citation is an unchecked citation.
//
// Scope boundary, stated rather than silently applied: REPORT.md also cites SWARM
// tooling that does not live in this repo (`bin/swarm-watchdog.sh:275-285`). Those
// are citations into another codebase; there is no line here to check them against.
// They are recognized explicitly (basename `swarm-*`, and the file is asserted to
// be genuinely ABSENT from this repo) and excluded. A citation naming a file that
// is merely missing -- a typo'd `src/astr.js:358` -- is NOT excluded; it fails.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DOC_NAMES = ['README.md', 'REPORT.md'];

const CODE_EXT = 'js|mjs|cjs|ts|sh|py|json|md|yml|yaml';

// A path citation: an optional opening backtick, a path ending in a known code
// extension, a colon, a line number, and an optional `-end` range.
const PATH_CITATION_RE = new RegExp(
  '(`?)((?:[A-Za-z0-9_.-]+\\/)*[A-Za-z0-9_.-]+\\.(?:' + CODE_EXT + '))' +
    ':(\\d+)(?:-(\\d+))?',
  'g',
);

// A bare shorthand citation: a backticked line number carrying no path at all.
const BARE_CITATION_RE = /`:(\d+)`/g;

// The fail-closed sweep: every colon-then-digits token in the document.
const ANY_COLON_NUMBER_RE = /:(\d+)/g;

// ---------------------------------------------------------------------------
// Repo file index, for resolving citations (including bare filenames with no
// directory prefix, which must be resolved against the repo).
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walkRepo(dir, rel, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walkRepo(abs, relPath, out);
    else if (entry.isFile()) out.push(relPath);
  }
  return out;
}

const REPO_FILES = walkRepo(ROOT, '', []);
const REPO_FILE_SET = new Set(REPO_FILES);
const BY_BASENAME = new Map();
for (const rel of REPO_FILES) {
  const base = path.posix.basename(rel);
  if (!BY_BASENAME.has(base)) BY_BASENAME.set(base, []);
  BY_BASENAME.get(base).push(rel);
}

const fileCache = new Map();
function linesOf(relPath) {
  if (!fileCache.has(relPath)) {
    fileCache.set(relPath, fs.readFileSync(path.join(ROOT, relPath), 'utf8').split('\n'));
  }
  return fileCache.get(relPath);
}

// ---------------------------------------------------------------------------
// Scope: the enclosing table cell (for a markdown table row) or the enclosing
// paragraph (for prose). Bare shorthand inherits its file from the nearest
// preceding path citation inside this span, per REPORT.md's own usage.
// ---------------------------------------------------------------------------

function buildLineIndex(raw) {
  const lines = raw.split('\n');
  const starts = [];
  let at = 0;
  for (const line of lines) {
    starts.push(at);
    at += line.length + 1;
  }
  return { lines, starts };
}

function lineIndexAt(index, offset) {
  let lo = 0;
  let hi = index.starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (index.starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function isTableRow(line) {
  return line.trimStart().startsWith('|');
}

function isBlockBreak(line) {
  return line.trim() === '' || line.trimStart().startsWith('#') || line.trimStart().startsWith('```');
}

// Returns { start, end, text, rowId } -- rowId is the table row's first cell when
// the citation sits in a table, which is where REPORT.md carries the issue id.
function scopeAt(index, offset) {
  const li = lineIndexAt(index, offset);
  const line = index.lines[li];
  const lineStart = index.starts[li];

  if (isTableRow(line)) {
    const pipes = [];
    for (let i = 0; i < line.length; i += 1) if (line[i] === '|') pipes.push(i);
    const col = offset - lineStart;
    let cellStart = 0;
    let cellEnd = line.length;
    for (const p of pipes) {
      if (p < col) cellStart = p + 1;
      else {
        cellEnd = p;
        break;
      }
    }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    return {
      start: lineStart + cellStart,
      end: lineStart + cellEnd,
      text: line.slice(cellStart, cellEnd),
      rowId: cells.length ? cells[0] : '',
      lineNo: li + 1,
    };
  }

  let first = li;
  while (first > 0 && !isBlockBreak(index.lines[first - 1]) && !isTableRow(index.lines[first - 1])) {
    first -= 1;
  }
  let last = li;
  while (
    last + 1 < index.lines.length &&
    !isBlockBreak(index.lines[last + 1]) &&
    !isTableRow(index.lines[last + 1])
  ) {
    last += 1;
  }
  const start = index.starts[first];
  const end = index.starts[last] + index.lines[last].length;
  return { start, end, text: '', rowId: '', lineNo: li + 1 };
}

// ---------------------------------------------------------------------------
// Scan a document into citations.
// ---------------------------------------------------------------------------

function scanDocument(docName) {
  const raw = fs.readFileSync(path.join(ROOT, docName), 'utf8');
  const index = buildLineIndex(raw);
  const problems = [];
  const citations = [];

  // FORM 1 + FORM 3 -- anything with a path in it.
  for (const m of raw.matchAll(PATH_CITATION_RE)) {
    const backtickedPath = m[1] === '`';
    const start = m.index + m[1].length;
    const end = m.index + m[0].length;
    // Swallow the citation's own closing backtick so the "what does the sentence
    // say next" window starts at real prose rather than at a stray delimiter.
    const spanEnd = backtickedPath && raw[end] === '`' ? end + 1 : end;
    citations.push({
      doc: docName,
      raw: raw.slice(m.index, spanEnd),
      start,
      end,
      spanStart: m.index,
      spanEnd,
      citedPath: m[2],
      startLine: Number(m[3]),
      endLine: m[4] ? Number(m[4]) : Number(m[3]),
      isRange: Boolean(m[4]),
      form:
        backtickedPath && m[2].includes('/')
          ? 'backticked-path'
          : backtickedPath
            ? 'backticked-bare-filename'
            : m[4]
              ? 'bare-filename-range'
              : 'bare-filename',
      docLine: lineIndexAt(index, start) + 1,
      scope: scopeAt(index, start),
    });
  }

  // FORM 2 -- bare shorthand, no path.
  for (const m of raw.matchAll(BARE_CITATION_RE)) {
    const start = m.index + 1; // skip the opening backtick
    const end = m.index + m[0].length - 1;
    citations.push({
      doc: docName,
      raw: m[0],
      start,
      end,
      spanStart: m.index,
      spanEnd: m.index + m[0].length,
      citedPath: null,
      startLine: Number(m[1]),
      endLine: Number(m[1]),
      isRange: false,
      form: 'bare-shorthand',
      docLine: lineIndexAt(index, start) + 1,
      scope: scopeAt(index, start),
    });
  }

  citations.sort((a, b) => a.start - b.start);

  // ---- fail-closed sweep: nothing colon-shaped may go unaccounted for -------
  let colonTokens = 0;
  let clockTokens = 0;
  for (const m of raw.matchAll(ANY_COLON_NUMBER_RE)) {
    colonTokens += 1;
    const prev = m.index > 0 ? raw[m.index - 1] : '';
    if (/[0-9]/.test(prev)) {
      clockTokens += 1; // 18:14, 2026-08-28T04:18:25.225Z -- a time, not a citation
      continue;
    }
    const covered = citations.some((c) => m.index >= c.spanStart && m.index < c.spanEnd);
    if (!covered) {
      const li = lineIndexAt(index, m.index);
      problems.push(
        `${docName}:${li + 1}: an unrecognized "${m[0]}" token was found that is neither a ` +
          `clock time nor a citation the scanner knows how to parse. A citation form the ` +
          `scanner does not read is a citation nothing checks. Context: ${JSON.stringify(
            raw.slice(Math.max(0, m.index - 60), m.index + 20),
          )}`,
      );
    }
  }

  return { docName, raw, index, citations, problems, colonTokens, clockTokens };
}

// ---------------------------------------------------------------------------
// Resolution.
// ---------------------------------------------------------------------------

function resolvePath(citedPath) {
  if (REPO_FILE_SET.has(citedPath)) return { kind: 'repo', relPath: citedPath };
  if (!citedPath.includes('/')) {
    const hits = BY_BASENAME.get(citedPath) || [];
    if (hits.length === 1) return { kind: 'repo', relPath: hits[0] };
    if (hits.length > 1) return { kind: 'ambiguous', candidates: hits };
  }
  // Not in this repo. Only SWARM's own tooling is a legitimate out-of-repo target.
  if (/^swarm-/.test(path.posix.basename(citedPath))) return { kind: 'external' };
  return { kind: 'missing' };
}

function resolveAll(scan) {
  const { citations, problems } = scan;
  const pathCitations = citations.filter((c) => c.citedPath !== null);
  const resolvedShorthand = [];

  for (const c of citations) {
    if (c.citedPath !== null) {
      c.resolution = resolvePath(c.citedPath);
    } else {
      // Bare shorthand: nearest preceding path citation inside the same
      // table cell / paragraph.
      const inScope = pathCitations.filter(
        (p) => p.start < c.start && p.start >= c.scope.start && p.start < c.scope.end,
      );
      if (inScope.length) {
        const anchor = inScope[inScope.length - 1];
        c.anchor = anchor;
        c.citedPathResolvedFrom = `${anchor.citedPath} (same ${anchor.scope.rowId ? 'table cell' : 'paragraph'}, ${scan.docName}:${anchor.docLine})`;
        c.resolution = anchor.resolution;
      } else {
        // No path in this scope. The remaining honest reading is a BACK-REFERENCE:
        // the document is re-naming a shorthand it already bound earlier (REPORT.md
        // does exactly this when it recaps "the bare `:281`/`:346` shorthand").
        const prior = resolvedShorthand.filter(
          (p) => p.startLine === c.startLine && p.start < c.start && p.resolution.kind === 'repo',
        );
        if (prior.length) {
          const anchor = prior[prior.length - 1];
          c.anchor = anchor;
          c.backReference = anchor;
          c.citedPathResolvedFrom = `back-reference to the same \`:${c.startLine}\` shorthand at ${scan.docName}:${anchor.docLine}`;
          c.resolution = anchor.resolution;
        } else {
          c.resolution = { kind: 'unresolvable' };
          problems.push(
            `${scan.docName}:${c.docLine}: bare shorthand \`:${c.startLine}\` could not be ` +
              `resolved to a file. There is no path citation earlier in its table cell / ` +
              `paragraph, and no earlier \`:${c.startLine}\` shorthand for it to refer back ` +
              `to. Refusing to skip it: a skipped citation is an unchecked citation.`,
          );
        }
      }
      if (c.resolution && c.resolution.kind === 'repo') resolvedShorthand.push(c);
    }

    if (c.resolution.kind === 'ambiguous') {
      problems.push(
        `${scan.docName}:${c.docLine}: citation "${c.raw}" names a bare filename that matches ` +
          `more than one file in the repo (${c.resolution.candidates.join(', ')}), so it cannot ` +
          `be resolved unambiguously.`,
      );
    } else if (c.resolution.kind === 'missing') {
      problems.push(
        `${scan.docName}:${c.docLine}: citation "${c.raw}" names "${c.citedPath}", which does ` +
          `not exist anywhere in this repo and is not recognizable SWARM tooling.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Claim extraction: what does the document actually SAY about the cited line?
// Each extractor reads the document text adjacent to the citation. A citation
// that yields no claim is a failure, not a pass.
// ---------------------------------------------------------------------------

function windows(scan, c) {
  const all = scan.citations;
  const prevAny = all.filter((o) => o.spanEnd <= c.spanStart).pop();
  const prevPath = all.filter((o) => o.citedPath !== null && o.spanEnd <= c.spanStart).pop();
  const next = all.find((o) => o.spanStart >= c.spanEnd);

  const scope = c.scope;
  const afterEnd = Math.min(scope.end, next ? next.spanStart : scope.end);
  const beforeStartAny = Math.max(scope.start, prevAny ? prevAny.spanEnd : scope.start);
  const beforeStartPath = Math.max(scope.start, prevPath ? prevPath.spanEnd : scope.start);

  return {
    after: scan.raw.slice(c.spanEnd, Math.max(c.spanEnd, afterEnd)),
    beforeAny: scan.raw.slice(beforeStartAny, c.spanStart),
    // Bare shorthands are written as a LIST after one shared verb phrase
    // ("...bad-input guard shape (`:281`, `:346`)"), so the keyword window for
    // them reaches back to the last PATH citation, not the last citation.
    beforePath: scan.raw.slice(beforeStartPath, c.spanStart),
    scopeText: scan.raw.slice(scope.start, scope.end),
  };
}

function extractClaims(scan, c) {
  const claims = [];
  const w = windows(scan, c);

  // CLAIM: named test declaration -- `test/render.test.js:829` (`the test name`)
  const named = /^\s*\(`([^`]+)`\)/.exec(w.after);
  if (named) claims.push({ kind: 'test-name', name: named[1] });

  // CLAIM: exported const declaration -- `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` (astro.js:71-74)
  const constName = /`([A-Z][A-Z0-9_]{2,})`(?:'s)?\s*\(?\s*$/.exec(w.beforeAny);
  if (constName) {
    claims.push({
      kind: 'const-decl',
      name: constName[1],
      exported: /\bexported\b/.test(w.beforeAny),
    });
  }

  // CLAIM: a throw carrying a specific message -- ...throws a `TypeError` ("...")
  const throwMsg = /throws?\s+(?:an?\s+)?`?([A-Za-z]*Error)`?\s*\(\s*"([^"]{4,})"\s*\)/.exec(w.after);
  if (throwMsg) claims.push({ kind: 'throw-message', errorType: throwMsg[1], message: throwMsg[2] });

  // CLAIM: the cited line is a throw / a bad-input guard. The keyword window for a
  // bare shorthand reaches back to the last PATH citation (shorthands are written
  // as a list sharing one verb phrase); for a path citation it stops at the
  // previous citation, so a verb belonging to an earlier citation cannot leak onto
  // a later, unrelated one.
  const throwWindow = c.form === 'bare-shorthand' ? w.beforePath : w.beforeAny;
  if (/\bthrows?\b|\bguard\b/i.test(throwWindow) || /^`?\s*(?:checks?|throws?)\b/.test(w.after)) {
    claims.push({ kind: 'throw' });
  }

  // CLAIM: "Regression at `test/astro.test.js:294`." -- the cited line heads the
  // regression: either the test declaration itself, or the top of the comment
  // block that immediately introduces it.
  if (/\bregression\s+(?:at|in)\s*`?\s*$/i.test(w.beforeAny)) {
    const idMatch = /\b((?:KI|T)-\d+)\b/.exec(c.scope.rowId || '') || /\b((?:KI|T)-\d+)\b/.exec(w.scopeText);
    claims.push({ kind: 'regression', issueId: idMatch ? idMatch[1] : null });
  }

  return claims;
}

// ---------------------------------------------------------------------------
// Claim verification against the cited line(s).
// ---------------------------------------------------------------------------

const TEST_DECL_RE = /^\s*(?:it|test)\s*\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*,/;

function readLine(relPath, n) {
  const lines = linesOf(relPath);
  if (n < 1 || n > lines.length) return null;
  return lines[n - 1];
}

// Net bracket depth of a source line, ignoring string/template literals and
// line comments -- enough to find where a `const X = {...};` declaration ends.
function bracketDelta(line) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '/' && line[i + 1] === '/') break;
    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    else if (ch === '}' || ch === ']' || ch === ')') depth -= 1;
  }
  return depth;
}

function verifyClaim(c, claim, fail) {
  const rel = c.resolution.relPath;
  const where = `${c.doc}:${c.docLine} cites ${rel}:${c.isRange ? `${c.startLine}-${c.endLine}` : c.startLine}` +
    (c.citedPathResolvedFrom ? ` [as "${c.raw}", resolved via ${c.citedPathResolvedFrom}]` : ` [as "${c.raw}"]`);
  const line = readLine(rel, c.startLine);
  if (line === null) {
    fail(`${where}: ${rel} has only ${linesOf(rel).length} lines; the cited line does not exist.`);
    return;
  }

  if (claim.kind === 'test-name') {
    const m = TEST_DECL_RE.exec(line);
    if (!m) {
      fail(
        `${where}: the document prints the test name ${JSON.stringify(claim.name)} beside this ` +
          `citation, but the cited line is not a test declaration at all. Line reads: ${JSON.stringify(line)}`,
      );
      return;
    }
    if (m[2] !== claim.name) {
      fail(
        `${where}: the document says this line declares the test ${JSON.stringify(claim.name)}, ` +
          `but the line declares ${JSON.stringify(m[2])}.`,
      );
    }
    return;
  }

  if (claim.kind === 'const-decl') {
    const declRe = new RegExp(`^\\s*(?:export\\s+)?(?:const|let|var)\\s+${claim.name}\\b\\s*=`);
    if (!declRe.test(line)) {
      fail(
        `${where}: the document says this line declares \`${claim.name}\`, but the line reads ` +
          `${JSON.stringify(line)}.`,
      );
      return;
    }
    if (c.isRange) {
      let depth = 0;
      for (let n = c.startLine; n <= c.endLine; n += 1) {
        const l = readLine(rel, n);
        if (l === null) {
          fail(`${where}: the cited range runs past the end of ${rel}.`);
          return;
        }
        depth += bracketDelta(l);
        if (depth <= 0 && n < c.endLine) {
          fail(
            `${where}: the \`${claim.name}\` declaration already closes at ${rel}:${n}, before the ` +
              `end of the cited range -- the range is wider than the thing it claims to cover.`,
          );
          return;
        }
      }
      if (depth !== 0) {
        fail(
          `${where}: the \`${claim.name}\` declaration is still open at the end of the cited range ` +
            `-- the range stops short of the declaration it claims to cover.`,
        );
        return;
      }
      const lastLine = readLine(rel, c.endLine);
      if (!/;\s*$/.test(lastLine)) {
        fail(
          `${where}: the last line of the cited range does not terminate the declaration; it reads ` +
            `${JSON.stringify(lastLine)}.`,
        );
        return;
      }
    }
    if (claim.exported) {
      const src = linesOf(rel).join('\n');
      const exportedRe = new RegExp(`module\\.exports\\s*=[^;]*\\b${claim.name}\\b`);
      if (!exportedRe.test(src) && !new RegExp(`exports\\.${claim.name}\\b`).test(src)) {
        fail(`${where}: the document calls \`${claim.name}\` exported, but ${rel} does not export it.`);
      }
    }
    return;
  }

  if (claim.kind === 'throw-message') {
    if (!/\bthrow\b/.test(line)) {
      fail(
        `${where}: the document says this line throws a ${claim.errorType}, but the line contains ` +
          `no \`throw\`. Line reads: ${JSON.stringify(line)}`,
      );
      return;
    }
    if (!line.includes(claim.errorType)) {
      fail(
        `${where}: the document says this line throws a ${claim.errorType}, but the line does not ` +
          `name that error type. Line reads: ${JSON.stringify(line)}`,
      );
    }
    if (!line.includes(claim.message)) {
      fail(
        `${where}: the document quotes the thrown message as ${JSON.stringify(claim.message)}, but ` +
          `the cited line does not carry that text. Line reads: ${JSON.stringify(line)}`,
      );
    }
    return;
  }

  if (claim.kind === 'throw') {
    if (!/\bthrow\b/.test(line)) {
      fail(
        `${where}: the document describes this line as a throw / bad-input guard, but the line ` +
          `contains no \`throw\`. Line reads: ${JSON.stringify(line)}`,
      );
    }
    return;
  }

  if (claim.kind === 'regression') {
    const lines = linesOf(rel);
    let blockText = line;
    let declLine = line;
    let declNo = c.startLine;

    if (!TEST_DECL_RE.test(line)) {
      if (!/^\s*\/\//.test(line)) {
        fail(
          `${where}: the document points here for a regression test, but the cited line is neither ` +
            `a test declaration nor the head of the comment block introducing one. Line reads: ` +
            `${JSON.stringify(line)}`,
        );
        return;
      }
      const prev = c.startLine > 1 ? lines[c.startLine - 2] : '';
      if (/^\s*\/\//.test(prev)) {
        fail(
          `${where}: the cited line sits in the MIDDLE of a comment block (${rel}:${c.startLine - 1} ` +
            `is also a comment). A regression citation must land on the first line of the block ` +
            `that introduces the test, not partway down it.`,
        );
        return;
      }
      let n = c.startLine;
      const collected = [];
      while (n <= lines.length && /^\s*\/\//.test(lines[n - 1])) {
        collected.push(lines[n - 1]);
        n += 1;
      }
      blockText = collected.join('\n');
      declLine = n <= lines.length ? lines[n - 1] : '';
      declNo = n;
      if (!TEST_DECL_RE.test(declLine)) {
        fail(
          `${where}: the comment block starting at the cited line is not immediately followed by a ` +
            `test declaration (${rel}:${declNo} reads ${JSON.stringify(declLine)}), so this citation ` +
            `does not point at a regression test.`,
        );
        return;
      }
    }

    if (claim.issueId) {
      const haystack = `${blockText}\n${declLine}`;
      if (!haystack.includes(claim.issueId)) {
        fail(
          `${where}: the document files this under ${claim.issueId}, but neither the cited comment ` +
            `block nor the test it introduces (${rel}:${declNo}) mentions ${claim.issueId}.`,
        );
      }
    }
    return;
  }

  fail(`${where}: internal error -- unhandled claim kind ${claim.kind}.`);
}

// ---------------------------------------------------------------------------
// Run the scan once, at load, so each citation can get its own named test.
// ---------------------------------------------------------------------------

const SCANS = DOC_NAMES.map(scanDocument);
for (const scan of SCANS) resolveAll(scan);

const ALL = [];
for (const scan of SCANS) {
  for (const c of scan.citations) {
    c.claims = extractClaims(scan, c);
    // A back-reference restates a binding the document made earlier; when the
    // recap carries no verb of its own it inherits the claim it is recapping,
    // rather than being waved through unchecked.
    if (c.claims.length === 0 && c.backReference) c.claims = c.backReference.claims;
    ALL.push(c);
  }
}

const PROBLEMS = SCANS.flatMap((s) => s.problems);
const IN_REPO = ALL.filter((c) => c.resolution && c.resolution.kind === 'repo');
const EXTERNAL = ALL.filter((c) => c.resolution && c.resolution.kind === 'external');

function countByForm(list) {
  const out = {};
  for (const c of list) out[c.form] = (out[c.form] || 0) + 1;
  return out;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Self-check first, and it is the point of the file: a checker that renders green
// over a region it failed to read is the exact failure this guards against.
test('citations self-check: the scanner actually located citations, in every form, in both documents', () => {
  for (const scan of SCANS) {
    assert.ok(
      scan.raw.length > 0,
      `citations: ${scan.docName} read back empty -- the checker cannot be green over a document it did not read.`,
    );
    assert.ok(
      scan.colonTokens > 0,
      `citations: the ":<digits>" sweep found nothing at all in ${scan.docName}. Either the ` +
        `document changed beyond recognition or the sweep is broken; either way this must not pass.`,
    );
  }

  assert.ok(
    ALL.length > 0,
    'citations: ZERO citations were located across README.md and REPORT.md. A parser that ' +
      'silently stops matching must go red, never green.',
  );
  assert.ok(
    IN_REPO.length > 0,
    `citations: ${ALL.length} citation(s) were located but none resolved into this repo's code.`,
  );

  const byForm = countByForm(ALL);
  for (const form of ['backticked-path', 'bare-shorthand', 'bare-filename-range']) {
    assert.ok(
      (byForm[form] || 0) > 0,
      `citations: the matcher for the "${form}" citation form found ZERO sites. REPORT.md is ` +
        `known to use all three forms; a form matching nothing means that form is now unchecked. ` +
        `Counts: ${JSON.stringify(byForm)}`,
    );
  }

  const perDoc = Object.fromEntries(SCANS.map((s) => [s.docName, s.citations.length]));
  assert.ok(
    perDoc['REPORT.md'] > 0,
    `citations: REPORT.md yielded zero citations. Counts: ${JSON.stringify(perDoc)}`,
  );
});

test('citations: every ":<digits>" token in README.md and REPORT.md is either a clock time or a parsed citation', () => {
  assert.deepStrictEqual(
    PROBLEMS,
    [],
    `citations: the fail-closed sweep could not account for every citation-shaped token:\n  - ${PROBLEMS.join('\n  - ')}`,
  );
});

test('citations: every located citation resolves to a file, and out-of-repo ones are genuinely out of repo', () => {
  const unresolved = ALL.filter((c) => !c.resolution || (c.resolution.kind !== 'repo' && c.resolution.kind !== 'external'));
  assert.deepStrictEqual(
    unresolved.map((c) => `${c.doc}:${c.docLine} "${c.raw}" -> ${c.resolution && c.resolution.kind}`),
    [],
    'citations: some citations could not be resolved to a file.',
  );
  for (const c of EXTERNAL) {
    assert.ok(
      !REPO_FILE_SET.has(c.citedPath) && !BY_BASENAME.has(path.posix.basename(c.citedPath)),
      `citations: ${c.doc}:${c.docLine} "${c.raw}" was excluded as SWARM tooling living outside ` +
        `this repo, but a file by that name IS in this repo -- it must be checked, not excluded.`,
    );
  }
});

test('citations: every in-repo citation carries at least one substantive claim to check', () => {
  const unclaimed = IN_REPO.filter((c) => c.claims.length === 0).map(
    (c) => `${c.doc}:${c.docLine} "${c.raw}" -> ${c.resolution.relPath}:${c.startLine}`,
  );
  assert.deepStrictEqual(
    unclaimed,
    [],
    'citations: these citations were located but nothing about them could be checked. A citation ' +
      'nothing asserts about is an unchecked citation, and this file refuses to skip one silently. ' +
      'Either the surrounding prose was reworded past the claim extractors, or a new kind of claim ' +
      'needs an extractor here.',
  );
});

for (const c of IN_REPO) {
  const target = `${c.resolution.relPath}:${c.isRange ? `${c.startLine}-${c.endLine}` : c.startLine}`;
  test(`citations: ${c.doc}:${c.docLine} "${c.raw}" -> ${target} says what the document claims`, () => {
    const failures = [];
    const fail = (msg) => failures.push(msg);
    assert.ok(c.claims.length > 0, `citations: no claim extracted for ${c.raw} at ${c.doc}:${c.docLine}.`);
    for (const claim of c.claims) verifyClaim(c, claim, fail);
    assert.deepStrictEqual(
      failures,
      [],
      `citations: the document's claim about ${target} does not hold:\n  - ${failures.join('\n  - ')}`,
    );
  });
}
