'use strict';

// .swarm/CONTRACTS.md documents "Recorded Divergences" between the cycle-1 frozen
// contracts and the actual code, and it does so by CITING line numbers: `path:N`,
// `path:N-M`, and prose like "Line 60 declares" / "on line 21" (some of which resolve
// back into CONTRACTS.md's own numbering, in its "Cycle 1 Freeze vs. Current Code"
// section). In cycle 44, three of those citations were found to have drifted -
// they pointed at lines that no longer held the construct the surrounding sentence
// described. A drift-detection document whose own citations rot is actively
// misleading, so this file makes the citations machine-checked instead of prose-only.
//
// Deliberate scope boundary: this only covers the citation FORMS that currently exist
// in CONTRACTS.md (single-line `path:N`, span `path:N-M`, and "line N" / "on line N"
// prose references, including self-references into CONTRACTS.md's own text). It does
// not attempt to parse arbitrary natural-language claims that don't cite a line number.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CONTRACTS_PATH = path.join(ROOT, '.swarm', 'CONTRACTS.md');
const CONTRACTS_RAW = fs.readFileSync(CONTRACTS_PATH, 'utf8');
const CONTRACTS_LINES = CONTRACTS_RAW.split('\n'); // 1-indexed via CONTRACTS_LINES[n-1]

// Small cache so repeatedly-cited files (e.g. src/args.js, cited three times) are only
// read once.
const fileLineCache = new Map();
function fileLines(relPath) {
  if (!fileLineCache.has(relPath)) {
    fileLineCache.set(relPath, fs.readFileSync(path.join(ROOT, relPath), 'utf8').split('\n'));
  }
  return fileLineCache.get(relPath);
}

// Resolve a citation's target lines: 'SELF' means "CONTRACTS.md's own numbering",
// anything else is a repo-relative path.
function linesFor(file) {
  return file === 'SELF' ? CONTRACTS_LINES : fileLines(file);
}

function lineAt(file, n) {
  return linesFor(file)[n - 1]; // undefined if out of range - callers assert on that
}

// The text from a citation's own position up to (but not including) the next
// "## " / "### " heading, or EOF if there is none. Every divergence citation lives in
// its own subsection, so bounding context this way means a checker for citation A can
// never accidentally read the fenced block or prose that belongs to a LATER citation B
// - each citation only ever sees text that is actually "near" it.
function forwardContext(idx) {
  const rest = CONTRACTS_RAW.slice(idx);
  const nextHeading = rest.search(/\n#{2,3} /);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
}

// The first fenced (```js ... ``` or plain ``` ... ```) block in a context string -
// i.e. whatever code/text CONTRACTS.md itself quotes as "what's really there".
function firstFencedBlock(context) {
  const m = /```(?:js)?\n([\s\S]*?)```/.exec(context);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Citation discovery. Generic / pattern-based: nothing below hand-enumerates which
// citations exist. If a citation of one of these forms is added to CONTRACTS.md later,
// it is picked up automatically the next time this file runs.
// ---------------------------------------------------------------------------

const citations = new Map(); // key -> citation

// Form 1 & 2: `` `path:N` `` and `` `path:N-M` `` - backtick-quoted file:line(s).
{
  const re = /`((?:src|test)\/[\w./-]+):(\d+)(?:-(\d+))?`/g;
  let m;
  while ((m = re.exec(CONTRACTS_RAW))) {
    const file = m[1];
    const start = Number(m[2]);
    const end = m[3] ? Number(m[3]) : start;
    const key = `${file}#${start}-${end}`;
    if (!citations.has(key)) {
      citations.set(key, { key, file, start, end, idx: m.index, matchText: m[0], kind: 'path' });
    }
  }
}

// Form 3a: bare "Line N declares:" - always a self-reference into CONTRACTS.md's own
// frozen-contract text (that's the sentence template the "Freeze vs. Current" section
// uses to introduce what the frozen signature said).
{
  const re = /^Line (\d+) declares:/gm;
  let m;
  while ((m = re.exec(CONTRACTS_RAW))) {
    const n = Number(m[1]);
    const key = `SELF#${n}-${n}`;
    if (!citations.has(key)) {
      citations.set(key, { key, file: 'SELF', start: n, end: n, idx: m.index, matchText: m[0], kind: 'self-declare' });
    }
  }
}

// The start of the sentence containing position `idx`: the end of the nearest
// preceding ". " / "! " / "? " (a bare '.' is NOT enough - "src/args.js" contains a
// '.' that is not a sentence boundary, and naively splitting on it would truncate the
// sentence mid-path and lose the citation the "on line N" below needs to see), clamped
// to not cross a blank-line paragraph break either (a fenced code block's closing "```"
// sits just above some of these sentences with no sentence-ending punctuation between
// them, and its backticks would otherwise pollute the backtick-token search below).
function sentenceStartBefore(idx) {
  const re = /[.!?]\s+/g;
  let last = 0;
  let m;
  while ((m = re.exec(CONTRACTS_RAW))) {
    if (m.index >= idx) break;
    last = m.index + m[0].length;
  }
  const para = CONTRACTS_RAW.lastIndexOf('\n\n', idx);
  return Math.max(last, para === -1 ? 0 : para + 2);
}

// Form 3b: bare "on line N" prose. Resolved by SENTENCE scope: if the current sentence
// already names a `path:N` citation, "on line N" refers to THAT file; otherwise (no
// path citation in the sentence) it's a self-reference into CONTRACTS.md, exactly like
// "Line N declares". This also naturally dedupes "the frozen contract on line 60"
// against the earlier "Line 60 declares" citation of the same CONTRACTS.md line, since
// both resolve to the same key.
{
  const re = /on line (\d+)/g;
  const pathRe = /`((?:src|test)\/[\w./-]+):(\d+)(?:-(\d+))?`/g;
  let m;
  while ((m = re.exec(CONTRACTS_RAW))) {
    const n = Number(m[1]);
    const sentenceStart = sentenceStartBefore(m.index);
    const sentence = CONTRACTS_RAW.slice(sentenceStart, m.index);
    pathRe.lastIndex = 0;
    let pm;
    let lastPathFile = null;
    while ((pm = pathRe.exec(sentence))) lastPathFile = pm[1];
    const file = lastPathFile || 'SELF';
    const key = `${file}#${n}-${n}`;
    if (!citations.has(key)) {
      // The nearest backtick-quoted token immediately before "on line N" in the
      // sentence, if any (e.g. "`--compact` on line 21") - the construct name the
      // citation is actually claiming lives at that line.
      const backticks = [...sentence.matchAll(/`([^`]+)`/g)];
      const nearbyToken = backticks.length ? backticks[backticks.length - 1][1] : null;
      citations.set(key, { key, file, start: n, end: n, idx: m.index, matchText: m[0], kind: 'on-line', nearbyToken });
    }
  }
}

// The whole point of this file: a silent zero-citation (or drastically-reduced) pass is
// the worst possible outcome, since it would look green while checking nothing. 8 is
// the number of distinct citations discovered when this test was written; if a future
// edit to CONTRACTS.md's prose shape makes the parser above find fewer, that is exactly
// the kind of silent regression this test exists to prevent - fix the parser, don't
// lower this number.
test('citation discovery finds at least as many citations as when this test was written', () => {
  assert.ok(
    citations.size >= 8,
    `found only ${citations.size} citation(s) in CONTRACTS.md (expected >= 8): ${[...citations.keys()].join(', ')}`,
  );
});

// ---------------------------------------------------------------------------
// Construct-level checkers. Each asserts that the CONSTRUCT the surrounding prose
// claims lives at the cited line(s) is actually there - not merely that the line
// exists or that the file is "long enough".
// ---------------------------------------------------------------------------

// "module.exports = { a, b, c }" - compares the export NAME SET quoted in the nearest
// fenced block to what's actually on the cited line. Handles both self-citations
// (CONTRACTS.md quoting its own frozen line) and real citations (CONTRACTS.md quoting
// what it claims a source file currently exports).
function moduleExportsCheck(citation, fwd) {
  const block = firstFencedBlock(fwd);
  assert.ok(block, `[${citation.key}] expected a fenced code block quoting a module.exports line near this citation, found none`);
  const quotedLine = block.split('\n').map((l) => l.trim()).find((l) => l.startsWith('module.exports'));
  assert.ok(quotedLine, `[${citation.key}] the fenced block near this citation has no module.exports line:\n${block}`);

  const parseNames = (line) => {
    const m = /module\.exports\s*=\s*\{([^}]*)\}/.exec(line);
    return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : null;
  };
  const expectedNames = parseNames(quotedLine);
  assert.ok(expectedNames && expectedNames.length, `[${citation.key}] could not parse export names out of quoted line: ${quotedLine}`);

  const actualLine = lineAt(citation.file, citation.start);
  assert.ok(actualLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start} does not exist`);
  assert.match(
    actualLine,
    /module\.exports\s*=/,
    `[${citation.key}] expected ${citation.file}:${citation.start} to be a module.exports declaration (per "${citation.matchText}") but found: ${JSON.stringify(actualLine)}`,
  );
  const actualNames = parseNames(actualLine);
  assert.ok(actualNames, `[${citation.key}] ${citation.file}:${citation.start} looks like module.exports but its export names could not be parsed: ${actualLine}`);
  assert.deepStrictEqual(
    [...actualNames].sort(),
    [...expectedNames].sort(),
    `[${citation.key}] ${citation.file}:${citation.start} exports ${JSON.stringify(actualNames)}, but the document (near "${citation.matchText}") claims it exports ${JSON.stringify(expectedNames)}`,
  );
}

// A JSDoc "@returns {...}" signature line. CONTRACTS.md line 60's own text (inside a
// JSDoc comment, so it carries a leading " * ") must actually contain the @returns
// signature the "Line 60 declares" sentence quotes.
function returnsCheck(citation, fwd) {
  const block = firstFencedBlock(fwd);
  assert.ok(block, `[${citation.key}] expected a fenced block quoting an @returns line near this citation, found none`);
  const quotedLine = block.split('\n').map((l) => l.trim()).find((l) => l.startsWith('@returns'));
  assert.ok(quotedLine, `[${citation.key}] the fenced block near this citation has no @returns line:\n${block}`);

  const actualLine = lineAt(citation.file, citation.start);
  assert.ok(actualLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start} does not exist`);
  const normalized = actualLine.trim().replace(/^\*\s*/, ''); // strip JSDoc leading "* "
  assert.ok(
    normalized === quotedLine || normalized.includes(quotedLine),
    `[${citation.key}] expected ${citation.file}:${citation.start} to read the @returns signature "${quotedLine}" (per "${citation.matchText}") but found: ${JSON.stringify(actualLine)}`,
  );
}

// A prose "Flags: `--x`, `--y`, ..." line.
function flagsProseCheck(citation, fwd) {
  const block = firstFencedBlock(fwd);
  assert.ok(block, `[${citation.key}] expected a fenced/quoted block containing a "Flags:" line near this citation, found none`);
  const quotedLine = block.split('\n').map((l) => l.trim()).find((l) => l.startsWith('Flags:'));
  assert.ok(quotedLine, `[${citation.key}] the block near this citation has no "Flags:" line:\n${block}`);

  const actualLine = lineAt(citation.file, citation.start);
  assert.ok(actualLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start} does not exist`);
  assert.strictEqual(
    actualLine.trim(),
    quotedLine,
    `[${citation.key}] expected ${citation.file}:${citation.start} to read "${quotedLine}" (per "${citation.matchText}") but found: ${JSON.stringify(actualLine)}`,
  );
}

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const ORDINAL_WORDS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };

// Strip a trailing "//" comment before brace-counting. Best-effort (not string- or
// regex-literal-aware), but sufficient here: nothing in the spans this file scans puts
// a brace inside a string value or a line comment.
function stripLineComment(line) {
  return line.replace(/\/\/.*$/, '');
}

// The line number that STRUCTURALLY closes the `{` opened on `openLineNum` - found by
// scanning forward from that `{` and tracking brace depth, returning the line where
// depth first returns to 0. This is deliberately not a regex on the cited end line: a
// span that stops one line short (or runs one line past, e.g. into the enclosing
// function's own closing brace) has SOME line at its cited end, and that line can
// easily still look like "a closing brace line" via a shape-only regex without being
// the brace that was actually opened at the start line. Returns null if the object
// never closes before EOF (a malformed citation, not a valid object literal).
function findStructuralCloser(lines, openLineNum) {
  let depth = 0;
  for (let ln = openLineNum; ln <= lines.length; ln++) {
    const text = stripLineComment(lines[ln - 1]);
    const from = ln === openLineNum ? text.indexOf('{') : 0;
    if (ln === openLineNum && from === -1) return null;
    for (let i = from; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) return ln;
      }
    }
  }
  return null;
}

// A `path:N-M` span claimed to be the OPTIONS flag table: opener at N, closer at M,
// and the prose's flag COUNT (spelled out as a word, e.g. "six") must match the number
// of flag entries actually registered in that span.
function optionsSpanCheck(citation, fwd) {
  const m = /registers (\w+) flags? in OPTIONS/.exec(fwd);
  assert.ok(m, `[${citation.key}] expected "registers <word> flags in OPTIONS" near this citation, found none`);
  const expectedCount = NUMBER_WORDS[m[1].toLowerCase()];
  assert.ok(expectedCount, `[${citation.key}] could not map number word "${m[1]}" to a count`);

  const lines = linesFor(citation.file);
  const openLine = lines[citation.start - 1];
  const closeLine = lines[citation.end - 1];
  assert.ok(openLine !== undefined && closeLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start}-${citation.end} is out of range`);
  assert.match(
    openLine,
    /OPTIONS\s*=\s*\{/,
    `[${citation.key}] expected ${citation.file}:${citation.start} to open the OPTIONS table but found: ${JSON.stringify(openLine)}`,
  );
  const realCloser = findStructuralCloser(lines, citation.start);
  assert.ok(realCloser !== null, `[${citation.key}] the OPTIONS table opened at ${citation.file}:${citation.start} never closes before EOF`);
  assert.strictEqual(
    citation.end,
    realCloser,
    `[${citation.key}] the OPTIONS table opened at ${citation.file}:${citation.start} is actually closed on line ${realCloser} ` +
      `(${JSON.stringify(lines[realCloser - 1])}), but the citation's end (${citation.end}) points at ${JSON.stringify(closeLine)}`,
  );
  const spanText = lines.slice(citation.start - 1, citation.end).join('\n');
  const flagEntries = spanText.match(/^\s+\w+:\s*\{\s*type:\s*'boolean'/gm) || [];
  assert.strictEqual(
    flagEntries.length,
    expectedCount,
    `[${citation.key}] ${citation.file}:${citation.start}-${citation.end} registers ${flagEntries.length} flag(s) (${flagEntries.map((s) => s.trim()).join(' / ')}), but the document (near "${citation.matchText}") claims "${m[1]}" (${expectedCount})`,
  );
}

// A `path:N-M` span claimed to be a `return { ... }` object that gained one extra key
// (the prose names it as e.g. "an additional fifth key" and quotes the exact line).
function returnObjectSpanCheck(citation, fwd) {
  const ordMatch = /additional (\w+) key/.exec(fwd);
  assert.ok(ordMatch, `[${citation.key}] expected "an additional <ordinal> key" near this citation, found none`);
  const expectedCount = ORDINAL_WORDS[ordMatch[1].toLowerCase()];
  assert.ok(expectedCount, `[${citation.key}] could not map ordinal word "${ordMatch[1]}" to a count`);

  const block = firstFencedBlock(fwd);
  assert.ok(block, `[${citation.key}] expected a fenced block quoting the extra key near this citation, found none`);
  const quotedLine = block.trim().split('\n')[0].trim();

  const lines = linesFor(citation.file);
  const openLine = lines[citation.start - 1];
  const closeLine = lines[citation.end - 1];
  assert.ok(openLine !== undefined && closeLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start}-${citation.end} is out of range`);
  assert.match(
    openLine,
    /return\s*\{/,
    `[${citation.key}] expected ${citation.file}:${citation.start} to open a "return {" object but found: ${JSON.stringify(openLine)}`,
  );
  const realCloser = findStructuralCloser(lines, citation.start);
  assert.ok(realCloser !== null, `[${citation.key}] the return object opened at ${citation.file}:${citation.start} never closes before EOF`);
  assert.strictEqual(
    citation.end,
    realCloser,
    `[${citation.key}] the return object opened at ${citation.file}:${citation.start} is actually closed on line ${realCloser} ` +
      `(${JSON.stringify(lines[realCloser - 1])}), but the citation's end (${citation.end}) points at ${JSON.stringify(closeLine)}` +
      (realCloser < citation.end ? ' (the span runs past the object into whatever follows it, e.g. an enclosing function\'s own closing brace)' : ''),
  );
  const spanText = lines.slice(citation.start - 1, citation.end).join('\n');
  assert.ok(
    spanText.includes(quotedLine),
    `[${citation.key}] expected ${citation.file}:${citation.start}-${citation.end} to contain "${quotedLine}" (per the document) but the span is:\n${spanText}`,
  );
  const innerText = lines.slice(citation.start, citation.end - 1).join('\n'); // strictly between opener and closer
  const keyCount = (innerText.match(/^\s*\w+[,:]/gm) || []).length;
  assert.strictEqual(
    keyCount,
    expectedCount,
    `[${citation.key}] ${citation.file}:${citation.start}-${citation.end} has ${keyCount} key(s) in its return object, but the document (near "${citation.matchText}") calls the new one the "${ordMatch[1]}" (i.e. claims ${expectedCount} total)`,
  );
}

// A resolved "on line N" reference naming a specific flag entry, e.g. "`--compact` on
// line 21" - line N must be that exact flag's OPTIONS entry.
function onLineFlagCheck(citation) {
  assert.ok(citation.nearbyToken, `[${citation.key}] expected a backtick-quoted name immediately before "on line ${citation.start}", found none`);
  const flagName = citation.nearbyToken.replace(/^--/, '');
  const actualLine = lineAt(citation.file, citation.start);
  assert.ok(actualLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start} does not exist`);
  assert.match(
    actualLine,
    new RegExp(`^\\s*${flagName}:\\s*\\{`),
    `[${citation.key}] expected ${citation.file}:${citation.start} to be the "${flagName}" flag entry (per "${citation.nearbyToken}" on line ${citation.start}") but found: ${JSON.stringify(actualLine)}`,
  );
}

// A named shipping test whose title is quoted in the document, e.g.
// "is a shipping test titled `'...'`".
function testTitleCheck(citation, fwd) {
  const m = /titled\s*`([^`]*)`/.exec(fwd);
  assert.ok(m, `[${citation.key}] expected a backtick-quoted test title after "titled" near this citation, found none`);
  const quotedTitle = m[1];

  const actualLine = lineAt(citation.file, citation.start);
  assert.ok(actualLine !== undefined, `[${citation.key}] ${citation.file}:${citation.start} does not exist`);
  assert.match(
    actualLine,
    /^\s*test\(/,
    `[${citation.key}] expected ${citation.file}:${citation.start} to open a test(...) declaration but found: ${JSON.stringify(actualLine)}`,
  );
  assert.ok(
    actualLine.includes(quotedTitle),
    `[${citation.key}] expected ${citation.file}:${citation.start} to contain the title ${quotedTitle} (per "${citation.matchText}") but found: ${JSON.stringify(actualLine)}`,
  );
}

// Earliest-match-wins: for each citation's own idx-scoped forward context, whichever
// recognizable pattern occurs FIRST determines which construct check applies. Scoping
// context to "up to the next heading" (see forwardContext) plus taking the nearest
// match is what keeps this correct even though several of these patterns (e.g.
// "module.exports", "Flags:") each occur more than once in the document overall.
const DISPATCH_PATTERNS = [
  { re: /module\.exports\s*=\s*\{/, check: moduleExportsCheck },
  { re: /@returns\b/, check: returnsCheck },
  { re: /^Flags:/m, check: flagsProseCheck },
  { re: /registers \w+ flags? in OPTIONS/, check: optionsSpanCheck },
  { re: /additional \w+ key/, check: returnObjectSpanCheck },
  { re: /\btitled\b/, check: testTitleCheck },
];

function checkCitation(citation) {
  if (citation.kind === 'on-line') {
    onLineFlagCheck(citation);
    return;
  }
  const fwd = forwardContext(citation.idx);
  let best = null;
  for (const p of DISPATCH_PATTERNS) {
    const m = p.re.exec(fwd);
    if (m && (best === null || m.index < best.index)) best = p;
  }
  assert.ok(
    best,
    `[${citation.key}] no recognizable construct-claim pattern found near this citation ("${citation.matchText}") - ` +
      'this citation shape is new; add a dedicated checker instead of relying on a generic fallback',
  );
  best.check(citation, fwd);
}

for (const citation of citations.values()) {
  test(`CONTRACTS.md citation ${citation.key} points at the construct it claims`, () => {
    checkCitation(citation);
  });
}
