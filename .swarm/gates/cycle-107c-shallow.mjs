#!/usr/bin/env node
// cycle-107 gate, part C — does the T-211 test degrade LOUDLY on a shallow clone?
// CI now uses fetch-depth: 0, so this path is the fallback protecting anyone who
// clones shallowly. A SILENT pass here would be the exact defect the item removes:
// zero violations reported would be indistinguishable from "scanned and found none".
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scratch = mkdtempSync(join(tmpdir(), 'moon-shallow-'));
const clone = join(scratch, 'moon');
execFileSync('git', ['clone', '--quiet', '--depth', '1', 'file:///opt/targets/moon', clone]);
copyFileSync('/opt/targets/moon/test/doc-counts.test.js', join(clone, 'test', 'doc-counts.test.js'));

const shallow = execFileSync('git', ['-C', clone, 'rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim();
const r = spawnSync(process.execPath, ['--test', 'test/doc-counts.test.js'], { cwd: clone, encoding: 'utf8', timeout: 180000 });
const out = (r.stdout || '') + (r.stderr || '');

console.log(`is-shallow-repository: ${shallow}`);
console.log(`exit=${r.status}`);
console.log(out.split('\n').filter((l) => /^# (tests|pass|fail|skipped)/.test(l)).join('\n'));
console.log('--- skip/degrade lines (each must name a reason) ---');
console.log(out.split('\n').filter((l) => /skip|shallow/i.test(l)).slice(0, 12).join('\n'));
rmSync(scratch, { recursive: true, force: true });

// INSTRUMENT REPAIR (conductor, cycle 107): the first version of this parser read
// only `# skipped N` (the TAP reporter). node --test emitted `ℹ skipped 3` here (the
// spec reporter), so the verdict read 0 skips while the transcript above plainly
// showed three. Same class as the .trim()/line-wrap/sentence-scope instrument bugs
// this repo has caught before: my regex narrower than the output it measures.
// The widening is paid for with three STRICTLY STRONGER assertions, so it cannot be
// a self-serving loosening:
//   (1) every skip line must itself name "shallow" — not merely the output somewhere;
//   (2) the skip count must equal the number of skip lines that name it;
//   (3) POSITIVE CONTROL — the same file on a FULL clone must skip ZERO, proving the
//       skips are caused by shallowness and are not unconditional.
const num = (label) => {
  const m = out.match(new RegExp(`^(?:#|\\u2139)\\s*${label}\\s+(\\d+)`, 'm'));
  return Number(m ? m[1] : 0);
};
const skipped = num('skipped');
const failed = num('fail');
// A skip line is one carrying node --test's trailing `# <reason>` where the reason
// names shallowness. Counted mechanically rather than by recognising a marker glyph.
const skipLines = out.split('\n').filter((l) => /#\s*shallow/i.test(l));
const everySkipNamesShallow = skipLines.length === skipped && skipped > 0;

// Positive control: full clone, same file, must not skip.
const scratch2 = mkdtempSync(join(tmpdir(), 'moon-full-'));
const fullClone = join(scratch2, 'moon');
execFileSync('git', ['clone', '--quiet', 'file:///opt/targets/moon', fullClone]);
copyFileSync('/opt/targets/moon/test/doc-counts.test.js', join(fullClone, 'test', 'doc-counts.test.js'));
const rf = spawnSync(process.execPath, ['--test', 'test/doc-counts.test.js'], { cwd: fullClone, encoding: 'utf8', timeout: 300000 });
const outFull = (rf.stdout || '') + (rf.stderr || '');
const fullSkipped = Number((outFull.match(/^(?:#|ℹ)\s*skipped\s+(\d+)/m) || [])[1] || 0);
const fullFailed = Number((outFull.match(/^(?:#|ℹ)\s*fail\s+(\d+)/m) || [])[1] || 0);
rmSync(scratch2, { recursive: true, force: true });

console.log(`\nshallow run:  exit=${r.status} skipped=${skipped} fail=${failed} skip-lines-naming-shallow=${skipLines.length}`);
console.log(`CONTROL full clone: exit=${rf.status} skipped=${fullSkipped} fail=${fullFailed}`);
const verdict = r.status === 0 && failed === 0 && everySkipNamesShallow &&
  rf.status === 0 && fullSkipped === 0 && fullFailed === 0;
console.log(`VERDICT shallow-degrade: ${verdict ? 'PASS' : 'FAIL'} — loud skip on shallow, zero skip on full history`);
process.exit(verdict ? 0 : 1);
