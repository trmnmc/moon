// Cycle 113, re-aimed cell 8. The first script's `no-hardcoded-dates` went red, but for
// the wrong reason: its single hit is a COMMENT illustrating the run-heading format
// ("## Run 6 (2026-08-20)"), not an archive path and not the enumeration's source. Red for
// the wrong reason is not evidence, so that cell stands recorded FAIL in the first script
// and is re-aimed here at the property it was meant to measure: the archive enumeration
// must be DISCOVERED, never pinned to the archive names that happen to exist today.
import { readFileSync } from 'node:fs';

const SRC = readFileSync('/opt/targets/moon/test/report-pointer.test.js', 'utf8');
// Executable source only: strip block and line comments.
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

const cells = [
  ['8b-no-live-archive-name', () => {
    // The tight predicate: the literal archive FILENAME stem for any real run must appear
    // nowhere in the file at all — comment or code. Fixtures use synthetic 1111/2222/3333.
    const hits = SRC.match(/REPORT-ARCHIVE-20\d\d-\d\d-\d\d/g) || [];
    return [hits.length === 0, `real archive filenames anywhere in the file: ${hits.length} ${JSON.stringify(hits)}`];
  }],
  ['8c-no-live-dates-in-code', () => {
    const hits = ['2026-08-18', '2026-08-20', '2026-08-24'].filter((d) => CODE.includes(d));
    return [hits.length === 0, `live archive dates in EXECUTABLE source: ${hits.length} ${JSON.stringify(hits)}`];
  }],
  ['8d-only-hit-is-a-comment', () => {
    // Account for the one hit the first script found, rather than dropping it silently.
    const all = (SRC.match(/2026-08-\d\d/g) || []).length;
    const inCode = (CODE.match(/2026-08-\d\d/g) || []).length;
    return [all === 1 && inCode === 0, `dates in file: ${all}; of those in executable code: ${inCode}`];
  }],
  ['8e-discovered-not-listed', () => {
    const readdir = /readdirSync\(SWARM_DIR\)[\s\S]{0,200}REPORT-ARCHIVE-\.\+\\\.md/.test(SRC)
      || (/readdirSync\(SWARM_DIR\)/.test(SRC) && /\/\^REPORT-ARCHIVE-\.\+\\\.md\$\//.test(SRC));
    return [readdir, `archive set built by readdir + pattern filter: ${readdir}`];
  }],
];

let bad = 0;
for (const [name, fn] of cells) {
  const [ok, detail] = fn();
  if (!ok) bad += 1;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name.padEnd(24)} ${detail}`);
}
console.log(`\n${cells.length - bad}/${cells.length} re-aimed cells passed`);
process.exit(bad === 0 ? 0 : 1);
