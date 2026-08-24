// Conductor gate for T-214, cells 6-8 (re-targeted). Cell 6 in the first pass mutated a
// quoted span that was NOT inside a registry quote row's window -- it reddened the
// citations test instead of the quote-verbatim check, so it failed for a reason other
// than the one it names and was recorded FAIL rather than passed. These cells hit real
// registry rows, in both documents, and each asserts the SPECIFIC named failure.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = '/opt/targets/moon';
const BASE = '/tmp/t214-gate-b';
fs.rmSync(BASE, { recursive: true, force: true });
fs.mkdirSync(BASE, { recursive: true });

function run(dir) {
  try {
    return { green: true, out: execFileSync('node', ['--test', 'test/gate-claims.test.js',
      'test/citations.test.js', 'test/doc-counts.test.js', 'test/report-issues.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) { return { green: false, out: (e.stdout || '') + (e.stderr || '') }; }
}

const cells = [
  // A quote row's verbatim span in REPORT.md is reworded into a plausible paraphrase.
  // This is exactly the drift the item exists to catch, on the live document.
  { name: 'quote-report', doc: 'REPORT.md',
    from: '"severities agree between REPORT.md and state.json\nwherever both sides define one"',
    to: '"every issue field is compared against state.json, so any disagreement is caught"',
    needle: "own words verbatim" },
  // The same, in README.md -- the other document, a different registry row. Targeted
  // explicitly: an earlier "first quoted span after the row key" heuristic picked up a
  // span outside the row's covered window, so the cell went green for a reason that had
  // nothing to do with the gate. A cell that does not hit what it claims to hit is not
  // evidence, so it is aimed by hand at the row's actual verbatim span.
  { name: 'quote-readme', doc: 'README.md',
    from: '(`KI-7: phaseName/illumination band discriminator holds across the declared domain (sampled)`)',
    to: '(`KI-7: the two series are proven to agree at every instant in the declared domain`)',
    needle: "own words verbatim" },
  // A pointer row is upgraded from a bare pointer into a sentence that characterizes
  // the rule -- pointer discipline must catch it.
  { name: 'pointer-mut', doc: 'REPORT.md',
    from: 'Regression at `test/astro.test.js:294`.',
    to: 'Regression at `test/astro.test.js:294`, which proves every out-of-range input throws.',
    needle: 'pointer' },
];

const results = [];
for (const c of cells) {
  const dir = path.join(BASE, c.name);
  fs.cpSync(SRC, dir, { recursive: true });
  const p = path.join(dir, c.doc);
  let t = fs.readFileSync(p, 'utf8');
  let from = c.from;
  if (c.findQuoteNear) {
    const at = t.indexOf(c.findQuoteNear);
    if (at === -1) throw new Error(`anchor not found: ${c.findQuoteNear}`);
    const m = t.slice(at).match(/"[^"]{20,}"/);
    if (!m) throw new Error(`no quoted span after anchor in ${c.doc}`);
    from = m[0];
  }
  if (!t.includes(from)) throw new Error(`mutation target not present in ${c.doc}: ${JSON.stringify(from.slice(0, 60))}`);
  fs.writeFileSync(p, t.replace(from, c.to));
  const r = run(dir);
  const named = r.out.split('\n').filter((l) => l.includes(c.needle)).slice(0, 2).map((l) => l.trim().slice(0, 260));
  const failing = [...new Set([...r.out.matchAll(/^✖ (.+?) \(/gm)].map((m) => m[1]))];
  const verdict = (!r.green && named.length > 0) ? 'PASS' : 'FAIL';
  results.push({ name: c.name, verdict, green: r.green, failing, named,
    mutatedFrom: from.replace(/\s+/g, ' ').slice(0, 90) });
}

console.log('== T-214 conductor gate, cells 6-8 (re-targeted) ==');
for (const r of results) {
  console.log(`\n[${r.verdict}] ${r.name}: expected RED, got ${r.green ? 'GREEN' : 'RED'}`);
  console.log(`  mutated: ${r.mutatedFrom}...`);
  console.log(`  failing: ${r.failing.join(' | ') || '(none)'}`);
  for (const l of r.named) console.log(`  reason> ${l}`);
}
console.log(`\nCELLS 6-8: ${results.every((r) => r.verdict === 'PASS') ? 'PASS' : 'FAIL'}`);
