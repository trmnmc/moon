// cycle 91 — journal re-archive (SPEC nice-to-have: "Re-archive the working journal if it
// crosses roughly 400 KB, by append-only copy into a dated archive, never a deletion").
// Boundary: run 3 = cycles 66..84 (through the cycle-84 addendum) moves out; run 4 = cycles
// 85.. stays live. Byte accounting is asserted, not assumed: every body byte must land in
// exactly one of the two files.
import fs from 'node:fs';

const DIR = '/opt/targets/moon/.swarm';
const SRC = `${DIR}/journal.md`;
const ARCHIVE = `${DIR}/journal-archive-run3-cycles-66-84.md`;

const original = fs.readFileSync(SRC, 'utf8');
const lines = original.split('\n');

// Locate the boundaries structurally — never by a hardcoded line number.
const firstBlock = lines.findIndex((l) => l.startsWith('## cycle 66-kickoff'));
const cut = lines.findIndex((l) => l.startsWith('## cycle 85 |'));
if (firstBlock < 0 || cut < 0 || cut <= firstBlock) {
  throw new Error(`boundary not found: firstBlock=${firstBlock} cut=${cut}`);
}

const headerLines = lines.slice(0, firstBlock);   // existing preamble, replaced below
const moveLines = lines.slice(firstBlock, cut);   // cycles 66..84 → archive
const keepLines = lines.slice(cut);               // cycles 85.. → stays

const moveBody = moveLines.join('\n');
const keepBody = keepLines.join('\n');

// Count what is being moved, from the text itself.
const blockCount = moveLines.filter((l) => /^#{2,3} cycle /.test(l)).length;

const archiveHeader = [
  '# journal archive — moon, improvement run 3 (cycles 66–84)',
  '',
  '> Moved verbatim out of `journal.md` at cycle 91, when the working file crossed the',
  `> ~400 KB re-archive threshold this run's SPEC sets as a nice-to-have (it stood at`,
  `> ${original.length} bytes / ${lines.length} lines).`,
  '> Nothing was deleted: this file holds the full text of run 3, and the pre-archive',
  '> `journal.md` is in git history at the cycle-90 commit. Runs 1 and 2 are in',
  '> `journal-archive-through-2026-08-17.md`.',
  '>',
  `> Contents: ${blockCount} blocks, ${moveLines.length} lines, ${Buffer.byteLength(moveBody)} bytes of body text.`,
  '',
].join('\n');

const keepHeader = [
  '# journal — moon',
  '',
  '> **Archived:** runs 1 and 2 (through 2026-08-17) live in',
  '> [`journal-archive-through-2026-08-17.md`](./journal-archive-through-2026-08-17.md) —',
  '> 738064 bytes / 7688 lines / 49 blocks, moved verbatim at cycle 83.',
  '> Run 3 (cycles 66–84) lives in',
  '> [`journal-archive-run3-cycles-66-84.md`](./journal-archive-run3-cycles-66-84.md) —',
  `> ${Buffer.byteLength(moveBody)} bytes / ${moveLines.length} lines / ${blockCount} blocks, moved verbatim at cycle 91.`,
  '> Nothing was deleted: the archives hold the full text, and every pre-archive version of',
  '> this file is in git history. This file continues from improvement run 4.',
  '',
].join('\n');

if (fs.existsSync(ARCHIVE)) throw new Error('archive already exists — refusing to overwrite');
fs.writeFileSync(`${ARCHIVE}.tmp`, archiveHeader + moveBody);
fs.renameSync(`${ARCHIVE}.tmp`, ARCHIVE);
fs.writeFileSync(`${SRC}.tmp`, keepHeader + keepBody);
fs.renameSync(`${SRC}.tmp`, SRC);

// ---- assertions, all re-read from disk ----
const a = fs.readFileSync(ARCHIVE, 'utf8');
const k = fs.readFileSync(SRC, 'utf8');
const results = [];
const check = (name, cond, detail) => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

check('archive contains the moved body verbatim', a.endsWith(moveBody));
check('working journal contains the kept body verbatim', k.endsWith(keepBody));
// original === header + "\n" + moveBody + "\n" + keepBody, so two join newlines are consumed.
check('no body byte lost', Buffer.byteLength(moveBody) + Buffer.byteLength(keepBody) ===
  Buffer.byteLength(original) - Buffer.byteLength(headerLines.join('\n')) - 2,
  `${Buffer.byteLength(moveBody)} + ${Buffer.byteLength(keepBody)} vs ${Buffer.byteLength(original)} - ${Buffer.byteLength(headerLines.join('\n'))} - 2`);
check('working journal now under 400 KB', Buffer.byteLength(k) < 400 * 1024, `${Buffer.byteLength(k)} bytes`);
check('cycle 84 is in the archive, not the live file', a.includes('## cycle 84 |') && !k.includes('## cycle 84 |'));
check('cycle 85 is in the live file, not the archive', k.includes('## cycle 85 |') && !a.includes('## cycle 85 |'));
check('cycle 90 still live', k.includes('## cycle 90 —'));
check('cycle 66 kickoff archived', a.includes('## cycle 66-kickoff'));
check('archive links back to nothing it does not have', a.includes('journal-archive-through-2026-08-17.md'));
check('live header names both archives', k.includes('journal-archive-through-2026-08-17.md') && k.includes('journal-archive-run3-cycles-66-84.md'));

console.log(results.join('\n'));
console.log(`\nbefore: ${Buffer.byteLength(original)} bytes / ${lines.length} lines`);
console.log(`after:  journal.md ${Buffer.byteLength(k)} bytes / ${k.split('\n').length} lines`);
console.log(`        archive    ${Buffer.byteLength(a)} bytes / ${a.split('\n').length} lines / ${blockCount} blocks`);
console.log(results.some((r) => r.startsWith('FAIL')) ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
